import { fileURLToPath } from "url";
import path from "path";
import genericProvider from "../../helpers/generic-provider.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default {
  mode: "development",

  entry: path.join(__dirname, "src/main.js"),
  output: {
    hashFunction: "sha256",
    path: __dirname,
    filename: "output.js",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        options: {
          plugins: [
            [
              genericProvider,
              {
                method: "usage-global",
                globals: {
                  a: "___a___not_a_real_pkg___",
                  b: "___b___not_a_real_pkg___",
                  c: "___c___not_a_real_pkg___",
                },
                missingDependencies: { all: true },
              },
            ],
          ],
        },
      },
    ],
  },

  devtool: false,
};
