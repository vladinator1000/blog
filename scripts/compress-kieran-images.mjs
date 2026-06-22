import sharp from "sharp"
import { readdir, mkdir } from "fs/promises"
import { join, extname, basename } from "path"

const SRC_DIR = join(process.cwd(), "src", "assets", "kieran")
const OUT_DIR = join(process.cwd(), "src", "assets", "kieran")

const MAX_WIDTH = 1600
const MAX_HEIGHT = 1200
const QUALITY = 78

async function main() {
  const files = await readdir(SRC_DIR)
  const jpgs = files.filter((f) => extname(f).toLowerCase() === ".jpg")

  // Backup dir
  const backupDir = join(SRC_DIR, "originals")
  await mkdir(backupDir, { recursive: true })

  for (const file of jpgs) {
    const srcPath = join(SRC_DIR, file)
    const backupPath = join(backupDir, file)
    const outName = basename(file, extname(file)) + ".webp"
    const outPath = join(OUT_DIR, outName)

    // Skip if already compressed (webp exists and no original backup needed)
    const { default: fs } = await import("fs")
    if (fs.existsSync(outPath) && fs.existsSync(backupPath)) {
      console.log(`Skipping ${file} (already compressed)`)
      continue
    }

    // Backup original
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcPath, backupPath)
    }

    await sharp(srcPath)
      .rotate()
      .resize(MAX_WIDTH, MAX_HEIGHT, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outPath)

    const origSize = fs.statSync(srcPath).size
    const newSize = fs.statSync(outPath).size
    const ratio = ((1 - newSize / origSize) * 100).toFixed(1)

    console.log(`${file} -> ${outName}: ${(origSize / 1e6).toFixed(2)} MB -> ${(newSize / 1e6).toFixed(2)} MB (${ratio}% smaller)`)
  }

  console.log("\nDone! Originals backed up to src/assets/kieran/originals/")
}

main().catch(console.error)
