import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(scriptDir, "../public");
const logoPath = path.join(publicDir, "logo.svg");
const iconsDir = path.join(publicDir, "icons");

const THEME_COLOR = { r: 202, g: 184, b: 222, alpha: 1 };

async function writeSquareIcon(size, outputName, { maskable = false } = {}) {
  const outputPath = path.join(iconsDir, outputName);

  if (!maskable) {
    await sharp(logoPath).resize(size, size, { fit: "contain" }).png().toFile(outputPath);
    return;
  }

  const iconSize = Math.round(size * 0.8);
  const logo = await sharp(logoPath).resize(iconSize, iconSize, { fit: "contain" }).png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: THEME_COLOR,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outputPath);
}

await mkdir(iconsDir, { recursive: true });

await Promise.all([
  writeSquareIcon(32, "favicon-32.png"),
  writeSquareIcon(180, "icon-180.png"),
  writeSquareIcon(192, "icon-192.png"),
  writeSquareIcon(512, "icon-512.png"),
  writeSquareIcon(512, "icon-512-maskable.png", { maskable: true }),
]);

console.log("Generated PWA icons in public/icons/");
