import _createMetaResolver from "../lib/meta-resolver.js";
const createMetaResolver = _createMetaResolver.default;

describe("createMetaResolver", () => {
  const resolver = createMetaResolver({
    global: {
      GlobalVar: 1,
    },
    static: {
      Obj: {
        staticProperty: 2,
      },
    },
    instance: {
      instanceProperty: 3,
    },
  });

  describe("globals", () => {
    it("used as global", () => {
      expect(
        resolver({
          kind: "global",
          name: "GlobalVar",
        }),
      ).toStrictEqual({ kind: "global", name: "GlobalVar", desc: 1 });
    });

    it("used as global object property", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "globalThis",
          key: "GlobalVar",
        }),
      ).toStrictEqual({ kind: "global", name: "GlobalVar", desc: 1 });
    });

    it("fallbacks to instance when used as global object property", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "globalThis",
          key: "instanceProperty",
        }),
      ).toStrictEqual({ kind: "instance", name: "instanceProperty", desc: 3 });
    });

    it("does not resolve to object with static property polyfill", () => {
      expect(
        resolver({
          kind: "global",
          name: "Obj",
        }),
      ).toBeUndefined();
    });

    it("does not resolve to a static property polyfill", () => {
      expect(
        resolver({
          kind: "global",
          name: "staticProperty",
        }),
      ).toBeUndefined();
    });
  });

  describe("static properties", () => {
    it("used as static property", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "Obj",
          key: "staticProperty",
        }),
      ).toStrictEqual({ kind: "static", name: "Obj$staticProperty", desc: 2 });
    });

    it("the base object must match", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "AbotherObj",
          key: "staticProperty",
        }),
      ).toBeUndefined();
    });

    it("fallbacks to instance properties for known objects", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "Obj",
          key: "instanceProperty",
        }),
      ).toStrictEqual({ kind: "instance", name: "instanceProperty", desc: 3 });
    });

    it("fallbacks to instance properties for unknown objects", () => {
      expect(
        resolver({
          kind: "property",
          placement: "static",
          object: "AnotherObj",
          key: "instanceProperty",
        }),
      ).toStrictEqual({ kind: "instance", name: "instanceProperty", desc: 3 });
    });
  });

  describe("instance properties", () => {
    it("used as instance property", () => {
      expect(
        resolver({
          kind: "property",
          placement: "protoyype",
          key: "instanceProperty",
        }),
      ).toStrictEqual({ kind: "instance", name: "instanceProperty", desc: 3 });
    });

    it("does not resolve to static properties", () => {
      expect(
        resolver({
          kind: "property",
          placement: "protoyype",
          object: "Obj",
          key: "staticProperty",
        }),
      ).toBeUndefined();
    });

    it("does not resolve to globals", () => {
      expect(
        resolver({
          kind: "property",
          placement: "protoyype",
          key: "GlobalVar",
        }),
      ).toBeUndefined();
    });
  });
});
