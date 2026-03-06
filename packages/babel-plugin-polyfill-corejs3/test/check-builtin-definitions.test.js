import corejs3Entries from "core-js-compat/entries.json" with { type: "json" };

import {
  BuiltIns,
  StaticProperties,
  InstanceProperties,
} from "../src/built-in-definitions.ts";

const supportedCorejs3Modules = new Set();

const corejs3Modules = new Set(corejs3Entries["core-js"]);

function addsupportedCorejs3Modules(descriptors) {
  for (const { global } of Object.values(descriptors)) {
    for (const dep of global) {
      supportedCorejs3Modules.add(dep);
    }
  }
}
addsupportedCorejs3Modules(BuiltIns);

for (const properties of Object.values(StaticProperties)) {
  addsupportedCorejs3Modules(properties);
}

addsupportedCorejs3Modules(InstanceProperties);

const allowList = [];
describe("corejs3 builtin definitions", () => {
  it("should support most corejs3 features", () => {
    let todoListItem = 0;
    for (const name of corejs3Modules) {
      if (supportedCorejs3Modules.has(name)) continue;
      if (name.startsWith("es.")) {
        const esNextName = "esnext." + name.slice(3);
        if (supportedCorejs3Modules.has(esNextName)) {
          todoListItem++;
          console.error(
            `Please replace "${esNextName}" by "${name}" in
packages/babel-plugin-polyfill-corejs3/src/built-in-definitions.js.`,
          );
          continue;
        }
      }
      if (name.startsWith("esnext.")) {
        const esName = "es." + name.slice(7);
        if (supportedCorejs3Modules.has(esName)) continue;
      }
      allowList.push(name);
    }
    for (const name of supportedCorejs3Modules.values()) {
      if (!corejs3Modules.has(name)) {
        todoListItem++;
        console.error(
          `"${name}" in
packages/babel-plugin-polyfill-corejs3/src/built-in-definitions.js
is not in "core-js-compat/entries": This is very likely a typo`,
        );
      }
    }
    expect(todoListItem).toBe(0);
    // The allowlist should only be added when we decide we don't support
    // the feature in `src/builtin-definitions.js`
    expect(allowList).toMatchInlineSnapshot(`
      [
        "esnext.array.filter-out",
        "esnext.map.update-or-insert",
        "esnext.map.upsert",
        "esnext.object.iterate-entries",
        "esnext.object.iterate-keys",
        "esnext.object.iterate-values",
        "esnext.symbol.replace-all",
        "esnext.typed-array.filter-out",
        "esnext.weak-map.upsert",
      ]
    `);
  });
});
