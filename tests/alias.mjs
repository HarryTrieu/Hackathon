// Lets plain Node load the app's lib files: resolves the "@/..." import
// alias (jsconfig.json) and adds the ".js" that Next lets imports leave out.
import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const base = root + specifier.slice(2);
      const file = [base, `${base}.js`, `${base}/index.js`].find((f) => existsSync(f) && statSync(f).isFile());
      return next(pathToFileURL(file ?? base).href, context);
    }
    return next(specifier, context);
  },
});
