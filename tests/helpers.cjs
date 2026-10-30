const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function engine({
  current = false,
  competitions = false,
  development = false,
  workbench = false,
  auctions = false,
  commerce = false,
  tour = false,
  life = false,
  director = false,
} = {}) {
  if (director) life = true;
  if (life) tour = true;
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
    "feedback",
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
    "content-expansion",
    "research",
    "camps",
    "coachwork",
    "auction-content",
    "auctions",
    "weekly-content",
    "trophies",
    "commerce",
    "world-circuits",
    "season-tour",
    "team-life",
    "race-life",
    "driver-agency",
    "race-director",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "../js/" + f + ".js"), "utf8"),
      context,
      { filename: f + ".js" },
    );
  if (!director) context.RCS.createGame = context.RCS.createV131Game;
  if (!life) context.RCS.createGame = context.RCS.createV121Game;
  if (!tour) {
    context.RCS.Data.tracks.length = 38;
    context.RCS.Competition.makeSeason =
      context.RCS.SeasonTour.legacyMakeSeason;
    if (commerce) context.RCS.createGame = context.RCS.createV110Game;
  }
  if (!commerce && !tour) {
    context.RCS.Data.models.length = 76;
    if (auctions) context.RCS.createGame = context.RCS.createV100Game;
  }
  if (!auctions && !commerce && !tour) {
    context.RCS.Data.models.length = 64;
    if (workbench) context.RCS.createGame = context.RCS.createV90Game;
  }
  if (!workbench && !auctions && !commerce && !tour) {
    context.RCS.Parts.catalogue.length = 14;
    for (const slot of context.RCS.Coachwork.extraSlots)
      delete context.RCS.Parts.slots[slot];
    if (development) context.RCS.createGame = context.RCS.createV80Game;
  }
  if (!development && !workbench && !auctions && !commerce && !tour) {
    context.RCS.Data.models.length = 40;
    context.RCS.Data.tracks.length = 22;
    if (competitions) context.RCS.createGame = context.RCS.createV70Game;
  }
  if (
    !competitions &&
    !development &&
    !workbench &&
    !auctions &&
    !commerce &&
    !tour
  ) {
    context.RCS.Data.models.length = 24;
    context.RCS.createGame = current
      ? context.RCS.createV64Game
      : context.RCS.createLegacyGame;
  }
  return { G: context.RCS, store };
}
module.exports = { engine };
