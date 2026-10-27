const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
function engine() {
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
    "core",
    "economy",
    "drivers",
    "market",
    "companies",
    "world",
    "ai",
    "race",
    "calendar",
    "storage",
  ])
    vm.runInContext(
      fs.readFileSync(path.join(__dirname, "../js/" + f + ".js"), "utf8"),
      context,
      { filename: f + ".js" },
    );
  return { G: context.RCS, store };
}
module.exports = { engine };
