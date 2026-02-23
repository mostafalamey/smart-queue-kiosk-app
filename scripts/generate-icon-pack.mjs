import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourcePngPath = path.join(projectRoot, "public", "Logo.png");
const buildResourcesDir = path.join(projectRoot, "build-resources");
const outputIconPath = path.join(buildResourcesDir, "icon.ico");

const iconSizes = [16, 24, 32, 48, 64, 128, 256];

const run = async () => {
  await mkdir(buildResourcesDir, { recursive: true });

  const pngBuffers = await Promise.all(
    iconSizes.map((size) =>
      sharp(sourcePngPath)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    )
  );

  const icoBuffer = await toIco(pngBuffers);
  await writeFile(outputIconPath, icoBuffer);

  console.log(`Icon pack generated at: ${outputIconPath}`);
};

run().catch((error) => {
  console.error("Failed to generate icon pack", error);
  process.exitCode = 1;
});
