import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const candidates = [
  [".next/types/routes.d.ts", ".next/types/routes.js"],
  [".next/dev/types/routes.d.ts", ".next/dev/types/routes.js"],
];

for (const [declarationPath, modulePath] of candidates) {
  const absoluteDeclarationPath = resolve(process.cwd(), declarationPath);
  const absoluteModulePath = resolve(process.cwd(), modulePath);

  if (!existsSync(absoluteDeclarationPath) || existsSync(absoluteModulePath)) {
    continue;
  }

  mkdirSync(dirname(absoluteModulePath), { recursive: true });
  writeFileSync(absoluteModulePath, "export {};\n", "utf8");
}
