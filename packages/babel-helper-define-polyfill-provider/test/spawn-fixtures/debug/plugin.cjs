const defineProvider = require("../../../lib/index.node.mjs").default;

module.exports = defineProvider(({ debug }) => {
  return {
    name: "test",
    polyfills: { a: { firefox: "55.0.0" } },
    entryGlobal() {
      debug("a");
    },
  };
});
