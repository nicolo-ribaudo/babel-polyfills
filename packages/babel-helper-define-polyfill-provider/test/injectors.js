import * as babel from "@babel/core";
import definePolyfillProvider from "../lib/index.node.js";
import astToCode from "./helpers/ast-to-code-serializer.js";
import pluginCJS from "@babel/plugin-transform-modules-commonjs";

function withUtils(code, fn, opts) {
  let result;

  const provider = definePolyfillProvider(() => ({
    usageGlobal(_, utils) {
      result = fn(utils);
    },
  }));

  const { ast } = babel.transformSync(code, {
    configFile: false,
    plugins: [[provider, { method: "usage-global" }]],
    ast: true,
    code: false,
    sourceType: "module",
    ...opts,
  });

  return { ast, result };
}

expect.addSnapshotSerializer(astToCode);

describe("injectors", () => {
  describe("injectGlobalImport", () => {
    it("in module", () => {
      const { ast, result } = withUtils("foo", utils =>
        utils.injectGlobalImport("./polyfill/foo"),
      );

      expect(ast).toMatchInlineSnapshot(`
        import "./polyfill/foo";
        foo;
      `);

      expect(result).toBeUndefined();
    });

    it("in script", () => {
      const { ast, result } = withUtils(
        "foo",
        utils => utils.injectGlobalImport("./polyfill/foo"),
        { sourceType: "script" },
      );

      expect(ast).toMatchInlineSnapshot(`
        require("./polyfill/foo");
        foo;
      `);

      expect(result).toBeUndefined();
    });

    it("multiple imports, different path", () => {
      const { ast } = withUtils("foo", utils => {
        utils.injectGlobalImport("./polyfill/foo");
        utils.injectGlobalImport("./polyfill/bar");
      });

      expect(ast).toMatchInlineSnapshot(`
        import "./polyfill/foo";
        import "./polyfill/bar";
        foo;
      `);
    });

    it("multiple imports, same path", () => {
      const { ast } = withUtils("foo", utils => {
        utils.injectGlobalImport("./polyfill/foo");
        utils.injectGlobalImport("./polyfill/foo");
      });

      expect(ast).toMatchInlineSnapshot(`
        import "./polyfill/foo";
        foo;
      `);
    });
  });

  describe("injectNamedImport", () => {
    it("returns an identifier", () => {
      const { result } = withUtils("foo", utils =>
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
      );

      expect(result).toEqual(
        expect.objectContaining({
          type: "Identifier",
        }),
      );
    });

    it("in module", () => {
      const { ast } = withUtils("foo", utils => {
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill");
      });

      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _fooPolyfill } from "./polyfill/foo";
        foo;
      `);
    });

    it("in script", () => {
      const { ast } = withUtils(
        "foo",
        utils =>
          utils.injectNamedImport("./polyfill/foo", "foo", "fooPolyfill"),
        { sourceType: "script" },
      );

      expect(ast).toMatchInlineSnapshot(`
        var _fooPolyfill = require("./polyfill/foo").foo;
        foo;
      `);
    });

    it("respects name hint", () => {
      const { ast, result } = withUtils("foo", utils =>
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill", "dog"),
      );

      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _dog } from "./polyfill/foo";
        foo;
      `);

      expect(result.name).toEqual(expect.stringContaining("dog"));
    });

    it("multiple imports, different path, different name", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
        utils.injectNamedImport("./polyfill/bar", "barPolyfill"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _fooPolyfill } from "./polyfill/foo";
        import { barPolyfill as _barPolyfill } from "./polyfill/bar";
        foo;
      `);

      expect(result[0].name).not.toBe(result[1].name);
    });

    it("multiple imports, same path, different name", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
        utils.injectNamedImport("./polyfill/foo", "barPolyfill"),
      ]);

      // This is sub-optimal, but it is ok.
      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _fooPolyfill } from "./polyfill/foo";
        import { barPolyfill as _barPolyfill } from "./polyfill/foo";
        foo;
      `);

      expect(result[0].name).not.toBe(result[1].name);
    });

    it("multiple imports, different path, same name", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
        utils.injectNamedImport("./polyfill/bar", "fooPolyfill"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _fooPolyfill } from "./polyfill/foo";
        import { fooPolyfill as _fooPolyfill2 } from "./polyfill/bar";
        foo;
      `);

      expect(result[0].name).not.toBe(result[1].name);
    });

    it("multiple imports, same path, same name", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
        utils.injectNamedImport("./polyfill/foo", "fooPolyfill"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import { fooPolyfill as _fooPolyfill } from "./polyfill/foo";
        foo;
      `);

      expect(result[0].name).toBe(result[1].name);
    });
  });

  describe("injectDefaultImport", () => {
    it("returns an identifier", () => {
      const { result } = withUtils("foo", utils =>
        utils.injectDefaultImport("./polyfill/foo"),
      );

      expect(result).toEqual(
        expect.objectContaining({
          type: "Identifier",
        }),
      );
    });

    it("in module", () => {
      const { ast } = withUtils("foo", utils => {
        utils.injectDefaultImport("./polyfill/foo");
      });

      expect(ast).toMatchInlineSnapshot(`
        import _polyfillFoo from "./polyfill/foo";
        foo;
      `);
    });

    it("in script", () => {
      const { ast } = withUtils(
        "foo",
        utils => utils.injectDefaultImport("./polyfill/foo", "foo"),
        { sourceType: "script" },
      );

      expect(ast).toMatchInlineSnapshot(`
        var _foo = require("./polyfill/foo");
        foo;
      `);
    });

    it("respects name hint", () => {
      const { ast, result } = withUtils("foo", utils =>
        utils.injectDefaultImport("./polyfill/foo", "dog"),
      );

      expect(ast).toMatchInlineSnapshot(`
        import _dog from "./polyfill/foo";
        foo;
      `);

      expect(result.name).toEqual(expect.stringContaining("dog"));
    });

    it("multiple imports, different path", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectDefaultImport("./polyfill/foo"),
        utils.injectDefaultImport("./polyfill/bar"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import _polyfillFoo from "./polyfill/foo";
        import _polyfillBar from "./polyfill/bar";
        foo;
      `);

      expect(result[0].name).not.toBe(result[1].name);
    });

    it("multiple imports, same path", () => {
      const { ast, result } = withUtils("foo", utils => [
        utils.injectDefaultImport("./polyfill/foo"),
        utils.injectDefaultImport("./polyfill/foo"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import _polyfillFoo from "./polyfill/foo";
        foo;
      `);

      expect(result[0].name).toBe(result[1].name);
    });
  });

  describe("integration", () => {
    it("all together, same path", () => {
      const { ast } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "foo"),
        utils.injectNamedImport("./polyfill/foo", "bar"),
        utils.injectDefaultImport("./polyfill/foo"),
        utils.injectGlobalImport("./polyfill/foo"),
      ]);

      // This is sub-optimal, but it is ok
      expect(ast).toMatchInlineSnapshot(`
        import { foo as _foo } from "./polyfill/foo";
        import { bar as _bar } from "./polyfill/foo";
        import _polyfillFoo from "./polyfill/foo";
        import "./polyfill/foo";
        foo;
      `);
    });

    it("all together, different path", () => {
      const { ast } = withUtils("foo", utils => [
        utils.injectNamedImport("./polyfill/foo", "foo"),
        utils.injectNamedImport("./polyfill/bar", "bar"),
        utils.injectDefaultImport("./polyfill/dog"),
        utils.injectGlobalImport("./polyfill/cat"),
      ]);

      expect(ast).toMatchInlineSnapshot(`
        import { foo as _foo } from "./polyfill/foo";
        import { bar as _bar } from "./polyfill/bar";
        import _polyfillDog from "./polyfill/dog";
        import "./polyfill/cat";
        foo;
      `);
    });

    describe("with the commonjs transform", () => {
      function testImportsCacheWithModulesTransform(method, provider) {
        const source = "foo;";

        return babel.transformSync(source, {
          configFile: false,
          plugins: [
            [definePolyfillProvider(() => provider), { method }],
            pluginCJS,

            // After converting ESM to CJS, we inject a new
            // reference that needs to be polyfilled.
            ({ template }) => ({
              visitor: {
                Program: {
                  exit(path) {
                    path.pushContainer("body", template.ast(source));
                  },
                },
              },
            }),
          ],
          ast: true,
          code: false,
          sourceType: "module",
        });
      }

      it("injectGlobalImport", () => {
        const { ast } = testImportsCacheWithModulesTransform("usage-global", {
          usageGlobal(meta, utils) {
            if (meta.kind === "global" && meta.name === "foo") {
              utils.injectGlobalImport("./polyfill/foo");
            }
          },
        });

        expect(ast).toMatchInlineSnapshot(`
          "use strict";

          require("./polyfill/foo");
          foo;
          foo;
        `);
      });

      it("injectNamedImport", () => {
        const { ast } = testImportsCacheWithModulesTransform("usage-global", {
          usageGlobal(meta, utils, path) {
            if (meta.kind === "global" && meta.name === "foo") {
              path.replaceWith(
                utils.injectNamedImport("./polyfill/foo", "foo"),
              );
            }
          },
        });

        expect(ast).toMatchInlineSnapshot(`
          "use strict";

          var _foo3 = require("./polyfill/foo").foo;
          var _foo2 = require("./polyfill/foo");
          _foo2.foo;
          _foo3;
        `);
      });

      it("injectDefaultImport", () => {
        const { ast } = testImportsCacheWithModulesTransform("usage-global", {
          usageGlobal(meta, utils, path) {
            if (meta.kind === "global" && meta.name === "foo") {
              path.replaceWith(
                utils.injectDefaultImport("./polyfill/foo", "foo"),
              );
            }
          },
        });

        expect(ast).toMatchInlineSnapshot(`
          "use strict";

          var _foo3 = require("./polyfill/foo");
          var _foo2 = _interopRequireDefault(require("./polyfill/foo"));
          function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
          _foo2.default;
          _foo3;
        `);
      });
    });
  });
});
