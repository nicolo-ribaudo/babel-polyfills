import assert from "assert";
import { transformSync } from "@babel/core";

import corejs3 from "babel-plugin-polyfill-corejs3";
import esShims from "babel-plugin-polyfill-es-shims";
import regenerator from "babel-plugin-polyfill-regenerator";

assert.strictEqual(typeof corejs3, "function");
assert.strictEqual(typeof esShims, "function");
assert.strictEqual(typeof regenerator, "function");

function transform(plugin, code = "Array.from(it)") {
  return transformSync(code, {
    configFile: false,
    browserslistConfigFile: false,
    plugins: [[plugin, { method: "usage-global", missingDependencies: false }]],
  }).code;
}

assert.strictEqual(
  transform(corejs3),
  `
import "core-js/modules/es.array.from.js";
import "core-js/modules/es.string.iterator.js";
Array.from(it);
  `.trim()
);

assert.strictEqual(
  transform(esShims),
  `
import "array.from/auto";
Array.from(it);
	`.trim()
);

assert.strictEqual(
  transform(regenerator, "regeneratorRuntime.mark(fn)"),
  `
import "regenerator-runtime/runtime.js";
regeneratorRuntime.mark(fn);
	`.trim()
);

console.log("OK!");
