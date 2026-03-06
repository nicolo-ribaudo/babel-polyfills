import { types as t } from "@babel/core";
import _generator from "@babel/generator";
const generator = _generator.default;

export default {
  test: v => t.isNode(v),
  print(ast) {
    return generator(ast).code;
  },
};
