import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return {
      shortCircuit: true,
      url: pathToFileURL(
        new URL("./server-only-stub.mjs", import.meta.url),
      ).href,
    };
  }

  return nextResolve(specifier, context);
}
