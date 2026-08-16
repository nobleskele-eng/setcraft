const cloudflareWorkersModule = "data:text/javascript,export const env = {};";

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: cloudflareWorkersModule, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
