import cp from "child_process";
import fs from "fs";
import path from "path";
import stripAnsi from "strip-ansi";
import { fileURLToPath } from "url";

function execP(cmd, opts) {
  const normalize = buff => stripAnsi(buff + "").trim();

  return new Promise(resolve => {
    cp.exec(cmd, opts, (error, stdout, stderr) => {
      resolve({
        stdout: normalize(stdout),
        stderr: normalize(stderr || error),
        exitCode: error ? error.code : 0,
      });
    });
  });
}

describe("missingDependencies", () => {
  it("logs with @babel/cli", async () => {
    const { stdout, stderr, exitCode } = await execP("yarn babel in -d out", {
      cwd: new URL("./spawn-fixtures/cli", import.meta.url),
    });

    expect(exitCode).not.toBe(0);

    expect(stdout.replace(/\(\d+ms\)/, "XXXms")).toMatchInlineSnapshot(
      `"Successfully compiled 2 files with Babel XXXms."`,
    );
    expect(stderr).toMatchInlineSnapshot(`
      "Some polyfills have been added but are not present in your dependencies.
      Please run one of the following commands:
      	npm install --save ___a___not_a_real_pkg___ ___b___not_a_real_pkg___ ___c___not_a_real_pkg___
      	yarn add ___a___not_a_real_pkg___ ___b___not_a_real_pkg___ ___c___not_a_real_pkg___"
    `);
  });

  it("logs with webpack", async () => {
    const cwd = new URL("./spawn-fixtures/webpack/", import.meta.url);
    const { stdout, stderr, exitCode } = await execP("yarn webpack", { cwd });

    expect(exitCode).not.toBe(0);

    const out = stdout
      // Remove ANSI codes
      // eslint-disable-next-line no-control-regex
      .replace(/\x1b\[.*?m/g, "")
      // Remove "introduction" (it contines unstable info like file size or
      // compilation time)
      .replace(/^.*\[built]\s*/s, "")
      // Replace env-specific directory path
      .replace(
        new RegExp(fileURLToPath(cwd).replace(/\\/g, "\\\\"), "g"),
        "<CWD>/",
      );

    expect(out).toMatchInlineSnapshot(`
      "ERROR in ./src/dep.js
      Module not found: Error: Can't resolve '___a___not_a_real_pkg___' in '<CWD>/src'
       @ ./src/dep.js 1:0-34
       @ ./src/main.js

      ERROR in ./src/main.js
      Module not found: Error: Can't resolve '___b___not_a_real_pkg___' in '<CWD>/src'
       @ ./src/main.js 1:0-34"
    `);

    expect(stderr).toMatchInlineSnapshot(`
      "Some polyfills have been added but are not present in your dependencies.
      Please run one of the following commands:
      	npm install --save ___a___not_a_real_pkg___ ___b___not_a_real_pkg___
      	yarn add ___a___not_a_real_pkg___ ___b___not_a_real_pkg___"
    `);

    const output = await fs.promises.readFile(
      new URL("./output.js", cwd),
      "utf8",
    );

    expect(output).toMatch(/Cannot find module '___b___not_a_real_pkg___/);
    expect(output).toMatch(/Cannot find module '___a___not_a_real_pkg___/);
  });

  it("logs with rollup", async () => {
    const { stdout, stderr, exitCode } = await execP("yarn rollup -c", {
      cwd: new URL("./spawn-fixtures/rollup", import.meta.url),
    });

    expect(exitCode).not.toBe(0);

    expect(stdout).toBe("");

    // Remove compilation time
    const err = stderr
      .replace(/(?<=created output.js in )\d+/, "XXX")
      .replace(/\\/g, "/");

    expect(err).toMatchInlineSnapshot(`
      "src/main.js → output.js...
      (!) Unresolved dependencies
      https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
      ___b___not_a_real_pkg___ (imported by src/main.js)
      ___a___not_a_real_pkg___ (imported by src/dep.js)
      created output.js in XXXms

      Some polyfills have been added but are not present in your dependencies.
      Please run one of the following commands:
      	npm install --save ___a___not_a_real_pkg___ ___b___not_a_real_pkg___
      	yarn add ___a___not_a_real_pkg___ ___b___not_a_real_pkg___"
    `);
  });
});

describe("debug", () => {
  it("logs correct reasons for including a polyfill", async () => {
    const { stdout, exitCode } = await execP("yarn babel input.mjs", {
      cwd: new URL("./spawn-fixtures/debug", import.meta.url),
    });

    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const out = stdout
      .replace(new RegExp(dirname.replace(/\\/g, "\\\\"), "g"), "<CWD>")
      .replace(/\\/g, "/");

    expect(out).toMatchInlineSnapshot(`
      "test: \`DEBUG\` option

      Using targets: {
        "firefox": "67",
        "ie": "11"
      }

      Using polyfills with \`entry-global\` method:

      [<CWD>/spawn-fixtures/debug/input.mjs]
      The test polyfill entry has been replaced with the following polyfills:
        a { "ie":"11" }
      import "core-js";"
    `);

    expect(exitCode).toBe(0);
  });
});
