import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "lib", "brand", "mountain-icon.svg");
const svg = readFileSync(svgPath);

const outputs = [
  { file: join(root, "public", "icon-192x192.png"), size: 192 },
  { file: join(root, "public", "icon-512x512.png"), size: 512 },
  { file: join(root, "public", "logo-identidad.png"), size: 256 },
  { file: join(root, "app", "icon.png"), size: 32 },
  { file: join(root, "app", "apple-icon.png"), size: 180 },
];

for (const output of outputs) {
  await sharp(svg, { density: 300 })
    .resize(output.size, output.size, {
      fit: "contain",
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(output.file);

  console.log(`Generated ${output.file}`);
}

console.log("Brand icons ready.");
