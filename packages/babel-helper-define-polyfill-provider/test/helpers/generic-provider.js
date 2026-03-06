import defineProvider from "../../lib/index.node.mjs";

export default defineProvider(function ({ assertDependency }, options) {
  return {
    name: "es-shims",
    polyfills: Object.keys(options.globals),

    usageGlobal(meta, utils) {
      if (meta.kind === "global" && meta.name in options.globals) {
        assertDependency(options.globals[meta.name]);
        utils.injectGlobalImport(options.globals[meta.name]);
      }
    },
  };
});
