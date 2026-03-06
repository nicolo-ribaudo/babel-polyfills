import type {
  MetaDescriptor,
  ResolverPolyfills,
  ResolvedPolyfill,
} from "./types.ts";

import { has } from "./utils.ts";

type ResolverFn<T> = (meta: MetaDescriptor) => void | ResolvedPolyfill<T>;

const PossibleGlobalObjects = new Set<string>([
  "global",
  "globalThis",
  "self",
  "window",
]);

export default function createMetaResolver<T>(
  polyfills: ResolverPolyfills<T>,
): ResolverFn<T> {
  const { static: staticP, instance: instanceP, global: globalP } = polyfills;

  return meta => {
    if (meta.kind === "global" && globalP && has(globalP, meta.name)) {
      return { kind: "global", desc: globalP[meta.name], name: meta.name };
    }

    if (meta.kind === "property" || meta.kind === "in") {
      const { placement, object, key } = meta;

      if (object && placement === "static") {
        if (globalP && PossibleGlobalObjects.has(object) && has(globalP, key)) {
          return { kind: "global", desc: globalP[key], name: key };
        }

        if (staticP && has(staticP, object) && has(staticP[object], key)) {
          return {
            kind: "static",
            desc: staticP[object][key],
            name: `${object}$${key}`,
          };
        }
      }

      if (instanceP && has(instanceP, key)) {
        return { kind: "instance", desc: instanceP[key], name: `${key}` };
      }
    }
  };
}
