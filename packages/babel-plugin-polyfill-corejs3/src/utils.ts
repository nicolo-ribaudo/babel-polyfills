import { types as t, type NodePath } from "@babel/core";
import corejsEntries from "core-js-compat/entries.json" with { type: "json" };

export const BABEL_RUNTIME = "@babel/runtime-corejs3";

export function callMethod(
  path: any,
  id: t.Identifier,
  optionalCall?: boolean,
  wrapCallee?: (callee: t.Expression) => t.Expression,
) {
  const [context1, context2] = maybeMemoizeContext(path.node, path.scope);

  let callee: t.Expression = t.callExpression(id, [context1]);
  if (wrapCallee) callee = wrapCallee(callee);

  const call = t.identifier("call");

  path.replaceWith(
    optionalCall
      ? t.optionalMemberExpression(callee, call, false, true)
      : t.memberExpression(callee, call),
  );

  path.parentPath.unshiftContainer("arguments", context2);
}

export function maybeMemoizeContext(
  node: t.MemberExpression | t.OptionalMemberExpression,
  scope: NodePath["scope"],
) {
  const { object } = node;

  let context1, context2;
  if (t.isIdentifier(object)) {
    context2 = object;
    context1 = t.cloneNode(object);
  } else {
    context2 = scope.generateDeclaredUidIdentifier("context");
    context1 = t.assignmentExpression("=", t.cloneNode(context2), object);
  }

  return [context1, context2];
}

export function extractOptionalCheck(
  scope: NodePath["scope"],
  node: t.OptionalMemberExpression,
) {
  let optionalNode = node;
  while (
    !optionalNode.optional &&
    t.isOptionalMemberExpression(optionalNode.object)
  ) {
    optionalNode = optionalNode.object;
  }
  optionalNode.optional = false;

  const ctx = scope.generateDeclaredUidIdentifier("context");
  const assign = t.assignmentExpression("=", ctx, optionalNode.object);
  optionalNode.object = t.cloneNode(ctx);

  return ifNotNullish =>
    t.conditionalExpression(
      t.binaryExpression("==", assign, t.nullLiteral()),
      t.unaryExpression("void", t.numericLiteral(0)),
      ifNotNullish,
    );
}

export function isCoreJSSource(source: string) {
  if (typeof source === "string") {
    source = source
      .replace(/\\/g, "/")
      .replace(/(\/(index)?)?(\.js)?$/i, "")
      .toLowerCase();
  }

  return (
    Object.prototype.hasOwnProperty.call(corejsEntries, source) &&
    corejsEntries[source]
  );
}

export function coreJSModule(name: string) {
  return `core-js/modules/${name}.js`;
}

export function coreJSPureHelper(
  name: string,
  useBabelRuntime: boolean,
  ext: string,
) {
  return useBabelRuntime
    ? `${BABEL_RUNTIME}/core-js/${name}${ext}`
    : `core-js-pure/features/${name}.js`;
}
