import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const master = path.resolve("icon-master.png");
if (!fs.existsSync(master)) {
    console.error("❌ No encuentro icon-master.png en la raíz del proyecto.");
    process.exit(1);
}

fs.mkdirSync("public/icons", { recursive: true });

// NORMAL
await sharp(master).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(master).resize(192, 192).png().toFile("public/icons/icon-192.png");

// iPhone
await sharp(master).resize(180, 180).png().toFile("public/apple-touch-icon.png");

// MASKABLE (más padding: logo dentro ~70%)
// Nota: tu icono ya tiene fondo completo (perfecto). Aquí solo le damos margen extra.
const inner = Math.round(512 * 0.7); // ~358
await sharp(master)
    .resize(inner, inner)
    .extend({
        top: Math.floor((512 - inner) / 2),
        bottom: Math.ceil((512 - inner) / 2),
        left: Math.floor((512 - inner) / 2),
        right: Math.ceil((512 - inner) / 2),
        background: { r: 11, g: 18, b: 32, alpha: 1 }, // #0B1220
    })
    .png()
    .toFile("public/icons/maskable-512.png");

console.log("✅ Iconos generados.");