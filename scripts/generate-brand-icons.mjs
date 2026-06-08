import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svgPath = join(root, "lib", "brand", "mountain-icon.svg");
const svg = readFileSync(svgPath);

async function renderIcon(size) {
  return sharp(svg, { density: 512 })
    .resize(size, size, { fit: "fill" })
    .png()
    .toBuffer();
}

async function renderMaskableIcon(size) {
  const iconSize = Math.round(size * 0.72);
  const icon = await sharp(svg, { density: 512 })
    .resize(iconSize, iconSize, { fit: "fill" })
    .png()
    .toBuffer();

  const offset = Math.round((size - iconSize) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 30, g: 41, b: 59, alpha: 1 },
    },
  })
    .composite([{ input: icon, left: offset, top: offset }])
    .png()
    .toBuffer();
}

const outputs = [
  { file: join(root, "public", "icon-192x192.png"), size: 192, maskable: false },
  { file: join(root, "public", "icon-512x512.png"), size: 512, maskable: false },
  { file: join(root, "public", "icon-maskable-512x512.png"), size: 512, maskable: true },
  { file: join(root, "public", "logo-identidad.png"), size: 256, maskable: false },
  { file: join(root, "app", "icon.png"), size: 32, maskable: false },
  { file: join(root, "app", "apple-icon.png"), size: 180, maskable: false },
];

for (const output of outputs) {
  const buffer = output.maskable
    ? await renderMaskableIcon(output.size)
    : await renderIcon(output.size);

  await sharp(buffer).toFile(output.file);
  console.log(`Generated ${output.file}`);
}

console.log("Brand icons ready.");
