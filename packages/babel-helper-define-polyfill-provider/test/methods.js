import * as babel from "@babel/core";
import _definePolyfillProvider from "../lib/index.js";
const definePolyfillProvider = _definePolyfillProvider.default;

function transform(code, method, obj) {
  return babel.transformSync(code, {
    configFile: false,
    plugins: [[definePolyfillProvider(() => obj), { method }]],
  });
}

describe("entry-global", () => {
  it("is a valid method", () => {
    expect(() =>
      transform("", "entry-global", { entryGlobal() {} }),
    ).not.toThrow();
  });

  it("calls the entryGlobal function", () => {
    const entryGlobal = jest.fn();
    const usageGlobal = jest.fn();
    const usagePure = jest.fn();

    transform(`import "polyfill";`, "entry-global", {
      entryGlobal,
      usageGlobal,
      usagePure,
    });

    expect(entryGlobal).toHaveBeenCalled();
    expect(usageGlobal).not.toHaveBeenCalled();
    expect(usagePure).not.toHaveBeenCalled();
  });

  it("not supported", () => {
    expect(() => {
      transform("", "entry-global", { usageGlobal() {}, usagePure() {} });
    }).toThrow(/support/);
  });

  it("import declaration", () => {
    const entryGlobal = jest.fn();

    transform(`import "my-polyfill";`, "entry-global", { entryGlobal });

    expect(entryGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "import" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("require call", () => {
    const entryGlobal = jest.fn();

    transform(`require("my-polyfill");`, "entry-global", { entryGlobal });

    expect(entryGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "import" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("ignores global", () => {
    const entryGlobal = jest.fn();

    transform(`Promise;`, "entry-global", { entryGlobal });

    expect(entryGlobal).not.toHaveBeenCalled();
  });

  it("ignores property", () => {
    const entryGlobal = jest.fn();

    transform(`arr.includes();`, "entry-global", { entryGlobal });

    expect(entryGlobal).not.toHaveBeenCalled();
  });
});

describe("usage-global", () => {
  it("is a valid method", () => {
    expect(() =>
      transform("", "usage-global", { usageGlobal() {} }),
    ).not.toThrow();
  });

  it("calls the usageGlobal function", () => {
    const entryGlobal = jest.fn();
    const usageGlobal = jest.fn();
    const usagePure = jest.fn();

    transform(`foo;`, "usage-global", { entryGlobal, usageGlobal, usagePure });

    expect(entryGlobal).not.toHaveBeenCalled();
    expect(usageGlobal).toHaveBeenCalled();
    expect(usagePure).not.toHaveBeenCalled();
  });

  it("not supported", () => {
    expect(() => {
      transform("", "usage-global", { entryGlobal() {}, usagePure() {} });
    }).toThrow(/support/);
  });

  it("global", () => {
    const usageGlobal = jest.fn();

    transform(`Promise;`, "usage-global", { usageGlobal });

    expect(usageGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "global" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("member expression", () => {
    const usageGlobal = jest.fn();

    transform(`arr.includes();`, "usage-global", { usageGlobal });

    expect(usageGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "property" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("ignores namespaces", () => {
    const usageGlobal = jest.fn();

    const source = `
      import * as bar from "bar";
      bar.map();`;

    transform(source, "usage-global", { usageGlobal });

    expect(usageGlobal).not.toHaveBeenCalled();
  });

  it("destructuring", () => {
    const usageGlobal = jest.fn();

    transform(`var { includes } = arr;`, "usage-global", { usageGlobal });

    expect(usageGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "property" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("ignores import declaration", () => {
    const usageGlobal = jest.fn();

    transform(`import "my-polyfill";`, "usage-global", { usageGlobal });

    expect(usageGlobal).not.toHaveBeenCalled();
  });

  it("called on the require id for require calls", () => {
    const usageGlobal = jest.fn();

    transform(`require("my-polyfill");`, "usage-global", { usageGlobal });

    expect(usageGlobal).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "global" }),
      expect.anything(), // utils
      expect.objectContaining({ type: "Identifier" }), // path
    );
  });
});

describe("usage-pure", () => {
  it("is a valid method", () => {
    expect(() => transform("", "usage-pure", { usagePure() {} })).not.toThrow();
  });

  it("calls the usagePure function", () => {
    const entryGlobal = jest.fn();
    const usageGlobal = jest.fn();
    const usagePure = jest.fn();

    transform(`foo;`, "usage-pure", { entryGlobal, usageGlobal, usagePure });

    expect(entryGlobal).not.toHaveBeenCalled();
    expect(usageGlobal).not.toHaveBeenCalled();
    expect(usagePure).toHaveBeenCalled();
  });

  it("not supported", () => {
    expect(() => {
      transform("", "usage-pure", { entryGlobal() {}, usageGlobal() {} });
    }).toThrow(/support/);
  });

  it("global", () => {
    const usagePure = jest.fn();

    transform(`Promise;`, "usage-pure", { usagePure });

    expect(usagePure).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "global" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("member expression", () => {
    const usagePure = jest.fn();

    transform(`arr.includes();`, "usage-pure", { usagePure });

    expect(usagePure).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "property" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("ignores namespaces", () => {
    const usagePure = jest.fn();

    const source = `
      import * as bar from "bar";
      bar.map();`;

    transform(source, "usage-pure", { usagePure });

    expect(usagePure).not.toHaveBeenCalled();
  });

  it("destructuring", () => {
    const usagePure = jest.fn();

    transform(`var { includes } = arr;`, "usage-pure", { usagePure });

    expect(usagePure).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "property" }),
      expect.anything(), // utils
      expect.anything(), // path
    );
  });

  it("ignores import declaration", () => {
    const usagePure = jest.fn();

    transform(`import "my-polyfill";`, "usage-pure", { usagePure });

    expect(usagePure).not.toHaveBeenCalled();
  });

  it("called on the require id for require calls", () => {
    const usagePure = jest.fn();

    transform(`require("my-polyfill");`, "usage-pure", { usagePure });

    expect(usagePure).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "global" }),
      expect.anything(), // utils
      expect.objectContaining({ type: "Identifier" }), // path
    );
  });
});
