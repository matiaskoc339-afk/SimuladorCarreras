const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function engine({ current = false, competitions = false } = {}) {
  const store = new Map();
  const context = vm.createContext({
    console,
    Date,
    Math,
    JSON,
    Object,
    Map,
    Set,
    Number,
    String,
    Array,
    Error,
    localStorage: {
      getItem: (k) => store.get(k) || null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
  });
  for (const f of [
    "data",
    "content",
    "core",
    "parts",
    "workshop",
    "economy",
    "drivers",
    "market",
    "companies",
    "world",
    "ai",
    "contracts",
    "race",
    "race-weekend",
    "facilities",
    "staff",
    "professionals",
    "practice",
    "pit-crew",
    "operations",
    "challenge",
    "rubber",
    "racecraft",
    "art",
    "vehicle-designs",
    "circuits",
    "competition",
    "performance",
    "driving",
    "calendar",
    "storage",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "../js/" + f + ".js"), "utf8"),
      context,
      { filename: f + ".js" },
    );
  if (!competitions) {
    context.RCS.Data.models.length = 24;
    context.RCS.createGame = current
      ? context.RCS.createV64Game
      : context.RCS.createLegacyGame;
  }
  return { G: context.RCS, store };
}
module.exports = { engine };
