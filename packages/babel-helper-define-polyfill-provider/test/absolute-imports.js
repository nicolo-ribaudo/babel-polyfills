import * as babel from "@babel/core";
import * as path from "path";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";

function transformTest(name, cwdURL, file, options = {}) {
  it(name, () => {
    const inputURL = new URL(file, cwdURL);
    const outputURL = new URL(file.replace(".js", ".out.js"), cwdURL);

    const input = readFileSync(inputURL, "utf8");
    let expected;
    try {
      expected = readFileSync(outputURL, "utf8");
    } catch {
      // file not yet created
    }

    let { code } = babel.transformSync(input, {
      cwd: fileURLToPath(cwdURL),
      filename: fileURLToPath(inputURL),
      ...options,
    });

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    code = code.replace(new RegExp(dirname.replace(/\\/g, "/"), "g"), "<CWD>");

    if (expected === undefined) {
      writeFileSync(outputURL, code);
    } else {
      expect(code).toBe(expected);
    }
  });
}

describe("true", () => {
  const cwd = new URL("./fixtures/absoluteImports/true/", import.meta.url);

  transformTest("basic behavior", cwd, "main.js");
  transformTest("relative to config file", cwd, "nested/main.js");
  transformTest("resolved in a parent directory", cwd, "nested-2/main.js");
});

describe("string", () => {
  const cwd = new URL("./fixtures/absoluteImports/string/", import.meta.url);

  transformTest("basic behavior", cwd, "main.js");
});

describe("subpath", () => {
  const cwd = new URL("./fixtures/absoluteImports/subpath/", import.meta.url);

  transformTest("works", cwd, "main.js");
});
