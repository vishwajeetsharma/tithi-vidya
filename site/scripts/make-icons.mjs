// Makes every icon file from src/app/icon.svg. Run after changing the logo:
//
//   npm run icons
//
// Writes, and the files are committed:
//   src/app/favicon.ico   16, 32 and 48 px. Google and many tools ask for /favicon.ico
//   src/app/icon1.png     96 px, a multiple of 48 as Google's favicon rules ask
//   public/icon-192.png   for the app manifest (Android, "Add to home screen")
//   public/icon-512.png
//   public/icon-maskable-512.png   with room around it, for icons cut to a circle or squircle
//   public/badge-96.png   the white, one-colour mark for notifications on Android
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(join(SITE, "src/app/icon.svg"));
const PAPER = "#f8f7ff";

const png = (size) => sharp(svg, { density: 72 * (size / 64) * 4 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** An .ico file holding PNG images, which every current browser and Google read. */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const sizes = [16, 32, 48];
await writeFile(join(SITE, "src/app/favicon.ico"), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(size) })))));
await writeFile(join(SITE, "src/app/icon1.png"), await png(96));
await writeFile(join(SITE, "public/icon-192.png"), await png(192));
await writeFile(join(SITE, "public/icon-512.png"), await png(512));

// Maskable: the moon at 70% on the page colour, inside the safe circle.
const moon = await png(358);
await sharp({ create: { width: 512, height: 512, channels: 4, background: PAPER } })
  .composite([{ input: moon, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toFile(join(SITE, "public/icon-maskable-512.png"));

// The notification badge: the small mark Android shows in the status bar and
// beside a notification. Android draws only its shape, in one colour, so it is
// the logo as a white outline and moon on nothing (public/sw.js uses it).
const badge = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="27.5" fill="none" stroke="#fff" stroke-width="4"/><path fill="#fff" d="M32 8a24 24 0 0 1 0 48 34 34 0 0 0 0-48Z"/></svg>`,
);
await sharp(badge, { density: 72 * (96 / 64) * 4 }).resize(96, 96).png({ compressionLevel: 9 }).toFile(join(SITE, "public/badge-96.png"));

console.log("icons: favicon.ico (16, 32, 48), icon1.png (96), icon-192.png, icon-512.png, icon-maskable-512.png, badge-96.png");
