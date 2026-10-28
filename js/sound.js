"use strict";
/* Sonido sintetizado localmente: nunca participa en la simulación ni en su RNG. */
(() => {
  const G = RCS;
  G.Sound = {
    enabled: false,
    context: null,
    master: null,
    heard: new Set(),
    async toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) {
        try {
          await this.unlock();
        } catch {
          this.enabled = false;
        }
      }
      if (!this.enabled) this.silence();
      return this.enabled;
    },
    async unlock() {
      const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Audio)
        throw new Error("Este navegador no admite sonido de carrera.");
      if (!this.context) {
        const c = (this.context = new Audio());
        this.master = c.createGain();
        this.master.gain.value = 0;
        this.master.connect(c.destination);
        const filter = c.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        filter.connect(this.master);
        this.filter = filter;
        this.engine = c.createOscillator();
        this.engine.type = "sawtooth";
        this.engine.frequency.value = 90;
        this.engineGain = c.createGain();
        this.engineGain.gain.value = 0.018;
        this.engine.connect(this.engineGain).connect(filter);
        this.engine.start();
        this.harmonic = c.createOscillator();
        this.harmonic.type = "triangle";
        this.harmonic.frequency.value = 180;
        const g = c.createGain();
        g.gain.value = 0.012;
        this.harmonic.connect(g).connect(filter);
        this.harmonic.start();
        const buffer = c.createBuffer(1, c.sampleRate, c.sampleRate),
          data = buffer.getChannelData(0);
        let seed = 27341;
        for (let i = 0; i < data.length; i++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          data[i] = seed / 2147483648 - 1;
        }
        this.noiseBuffer = buffer;
        const source = c.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const high = c.createBiquadFilter();
        high.type = "bandpass";
        high.frequency.value = 1800;
        high.Q.value = 0.8;
        this.skid = c.createGain();
        this.skid.gain.value = 0;
        source.connect(high).connect(this.skid).connect(this.master);
        source.start();
      }
      if (this.context.state === "suspended") await this.context.resume();
    },
    reset() {
      this.heard.clear();
      this.silence();
    },
    silence() {
      if (this.master && this.context)
        this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.06);
    },
    impact() {
      const c = this.context;
      if (!c || !this.noiseBuffer) return;
      const src = c.createBufferSource(),
        low = c.createBiquadFilter(),
        gain = c.createGain();
      src.buffer = this.noiseBuffer;
      low.type = "lowpass";
      low.frequency.value = 420;
      gain.gain.setValueAtTime(0.24, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2);
      src.connect(low).connect(gain).connect(this.master);
      src.start();
      src.stop(c.currentTime + 0.22);
    },
    update(r, paused, focusId) {
      if (!this.enabled || !this.context || !r || paused || document.hidden) {
        this.silence();
        return;
      }
      const a =
        r.entrants.find(
          (a) => a.carId === focusId || a.companyId === focusId,
        ) ||
        r.entrants.find((a) => a.companyId === "player") ||
        r.entrants[0];
      if (!a) {
        this.silence();
        return;
      }
      const c = this.context,
        t = c.currentTime,
        gear = Math.max(1, Math.min(5, Math.floor(a.speed / 12) + 1));
      const rpm = 1300 + (a.speed % 12) * 430 + (a.mode === "attack" ? 400 : 0);
      this.engine.frequency.setTargetAtTime(40 + rpm / 32, t, 0.08);
      this.harmonic.frequency.setTargetAtTime(80 + rpm / 16, t, 0.08);
      this.filter.frequency.setTargetAtTime(
        450 + Math.min(1500, a.speed * 25),
        t,
        0.15,
      );
      this.master.gain.setTargetAtTime(a.dnf ? 0.15 : 0.65, t, 0.12);
      this.engineGain.gain.setTargetAtTime(
        a.dnf ? 0.003 : 0.012 + gear * 0.0015,
        t,
        0.12,
      );
      this.skid.gain.setTargetAtTime(
        !a.dnf &&
          (!a.pit || ["none", "queued"].includes(a.pit.phase)) &&
          a.speed > 2 &&
          Math.abs(a.headingSlip || 0) > 0.13
          ? 0.025
          : 0,
        t,
        0.07,
      );
      for (const e of r.events || []) {
        if (this.heard.has(e.id)) continue;
        this.heard.add(e.id);
        if (
          r.time - e.time < 1.5 &&
          ["contact", "collision", "crash"].includes(e.type)
        )
          this.impact();
      }
      if (this.heard.size > 120)
        this.heard = new Set((r.events || []).map((e) => e.id));
    },
  };
})();
