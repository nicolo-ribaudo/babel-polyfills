import * as babel from "@babel/core";
import _definePolyfillProvider from "../lib/index.js";
const definePolyfillProvider = _definePolyfillProvider.default;

function transform(code, method, obj) {
  return babel.transformSync(code, {
    configFile: false,
    plugins: [[definePolyfillProvider(() => obj), { method }]],
  });
}

function getDescriptor(code, filter, useEntry) {
  const fn = jest.fn();

  transform(code, useEntry ? "entry-global" : "usage-global", {
    entryGlobal: fn,
    usageGlobal: fn,
  });

  let args;
  if (filter) {
    const test =
      typeof filter === "string"
        ? ([d]) => d.kind === filter
        : ([d]) => filter(d);
    args = fn.mock.calls.find(test);
  } else {
    expect(fn).toHaveBeenCalledTimes(1);
    args = fn.mock.calls[0];
  }

  return [args[0], args[2], fn];
}

describe("descriptors", () => {
  it("import", () => {
    const [desc, path] = getDescriptor(`import "foo";`, null, true);

    expect(desc).toEqual({ kind: "import", source: "foo" });
    expect(path.type).toBe("ImportDeclaration");
    expect(path.toString()).toBe(`import "foo";`);
  });

  it("require", () => {
    const [desc, path] = getDescriptor(`require("foo");`, null, true);

    expect(desc).toEqual({ kind: "import", source: "foo" });
    expect(path.type).toBe("ExpressionStatement");
    expect(path.toString()).toBe(`require("foo");`);
  });

  it("global", () => {
    const [desc, path] = getDescriptor("Promise;");

    expect(desc).toEqual({ kind: "global", name: "Promise" });
    expect(path.type).toBe("Identifier");
    expect(path.toString()).toBe("Promise");
  });

  it("static property", () => {
    const [desc, path] = getDescriptor("Promise.try;", "property");

    expect(desc).toEqual({
      kind: "property",
      object: "Promise",
      key: "try",
      placement: "static",
    });
    expect(path.type).toBe("MemberExpression");
    expect(path.toString()).toBe("Promise.try");
  });

  it("prototype property", () => {
    const [desc, path] = getDescriptor(
      "Element.prototype.appendChild;",
      "property",
    );

    expect(desc).toEqual({
      kind: "property",
      object: "Element",
      key: "appendChild",
      placement: "prototype",
    });
    expect(path.type).toBe("MemberExpression");
    expect(path.toString()).toBe("Element.prototype.appendChild");
  });

  it("instance property - known type", () => {
    const [desc, path] = getDescriptor("[].includes;");

    expect(desc).toEqual({
      kind: "property",
      object: "Array",
      key: "includes",
      placement: "prototype",
    });
    expect(path.type).toBe("MemberExpression");
    expect(path.toString()).toBe("[].includes");
  });

  it("instance property - unknown type", () => {
    const [desc, path] = getDescriptor("foo().includes;", "property");

    expect(desc).toEqual({
      kind: "property",
      object: null,
      key: "includes",
      placement: null,
    });
    expect(path.type).toBe("MemberExpression");
    expect(path.toString()).toBe("foo().includes");
  });

  it("symbol property", () => {
    const [desc, path] = getDescriptor(
      "NodeList.prototype[Symbol.iterator];",
      d => d.object === "NodeList",
    );

    expect(desc).toEqual({
      kind: "property",
      object: "NodeList",
      key: "Symbol.iterator",
      placement: "prototype",
    });
    expect(path.type).toBe("MemberExpression");
    expect(path.toString()).toBe("NodeList.prototype[Symbol.iterator]");
  });

  it("destruturing", () => {
    const [desc, path] = getDescriptor("var { all } = Promise;", "property");

    expect(desc).toEqual({
      kind: "property",
      object: "Promise",
      key: "all",
      placement: "static",
    });
    expect(path.type).toBe("ObjectProperty");
    expect(path.toString()).toBe("all");
  });

  it("in expression", () => {
    const [desc, path] = getDescriptor("'values' in Object;", "in");

    expect(desc).toEqual({
      kind: "in",
      object: "Object",
      key: "values",
      placement: "static",
    });
    expect(path.type).toBe("BinaryExpression");
    expect(path.toString()).toBe("'values' in Object");
  });

  it("optional chains", () => {
    const [desc, path] = getDescriptor("a?.includes();", "property");

    expect(desc).toEqual({
      kind: "property",
      object: "a",
      key: "includes",
      placement: "static",
    });
    expect(path.type).toBe("OptionalMemberExpression");
    expect(path.toString()).toBe("a?.includes");
  });
});
