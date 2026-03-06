import * as babel from "@babel/core";
import definePolyfillProvider from "../lib/index.node.js";

function transform(code, objs) {
  return babel.transformSync(code, {
    configFile: false,
    plugins: objs.map(obj => [
      definePolyfillProvider(() => ({ usagePure() {}, ...obj })),
      { method: "usage-pure" },
    ]),
  });
}

describe("misc", () => {
  it("warns if two different providers provide a @babel/runtime alternative", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      transform("code", [
        { name: "provider-1", runtimeName: "@provider-1/babel-runtime" },
        { name: "provider-2", runtimeName: "@provider-2/babel-runtime" },
      ]);

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.lastCall[0]).toMatchInlineSnapshot(
        `"Two different polyfill providers (provider-1 and provider-2) are trying to define two conflicting @babel/runtime alternatives: @provider-1/babel-runtime and @provider-2/babel-runtime. The second one will be ignored."`,
      );
    } finally {
      warn.mockRestore();
    }
  });
});
