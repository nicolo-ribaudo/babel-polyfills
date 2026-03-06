import * as babel from "@babel/core";
import polyfillRegenerator from "../lib/index.js";

function transform(code, babelOpts, pluginOpts) {
  return babel.transformSync(code, {
    configFile: false,
    ...babelOpts,
    plugins: [[polyfillRegenerator, pluginOpts]],
  });
}

describe("targets", () => {
  it("is not supported", () => {
    expect(() =>
      transform(
        "code",
        {},
        {
          method: "usage-pure",
          targets: { chrome: 50 },
        },
      ),
    ).toThrow(/targets/);
  });
});

describe("top-level targets", () => {
  it("is supported", () => {
    expect(() =>
      transform(
        "code",
        { targets: { chrome: 50 } },
        {
          method: "usage-pure",
        },
      ),
    ).not.toThrow(/targets/);
  });
});
