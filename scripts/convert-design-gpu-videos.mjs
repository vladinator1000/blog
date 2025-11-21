import { promises as fs } from "fs";
import path from "path";
import { spawn } from "child_process";

const { dirname, join } = path;

function runFfmpeg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libvpx-vp9",
      // Higher CRF = more compression, smaller files
      "-crf",
      "38",
      "-b:v",
      "0",
      // Keep audio but at a low bitrate
      "-c:a",
      "libopus",
      "-b:a",
      "64k",
      outputPath,
    ];

    const ffmpeg = spawn("ffmpeg", args, { stdio: "inherit" });

    ffmpeg.on("error", (error) => {
      reject(error);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function findMp4Files(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".mp4")) {
      files.push(join(directory, entry.name));
    }
  }

  return files;
}

async function convertVideosToWebm(directory) {
  const mp4Files = await findMp4Files(directory);
  const concurrency = 3;
  const results = [];

  for (let i = 0; i < mp4Files.length; i += concurrency) {
    const batch = mp4Files.slice(i, i + concurrency).map(async (inputPath) => {
      const outputPath = `${inputPath.slice(0, -4)}.webm`;
      const success = await runFfmpeg(inputPath, outputPath).catch(() => false);
      return { inputPath, outputPath, success };
    });

    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  return results;
}

async function updateMarkdownReferences(markdownPath, results, publicRoot) {
  let content = await fs.readFile(markdownPath, "utf8");

  for (const result of results) {
    if (!result.success) {
      continue;
    }

    const relativeFromPublic = result.inputPath.startsWith(publicRoot)
      ? result.inputPath.slice(publicRoot.length).replace(/\\/g, "/")
      : undefined;

    if (!relativeFromPublic) {
      continue;
    }

    if (!relativeFromPublic.toLowerCase().endsWith(".mp4")) {
      continue;
    }

    const from = relativeFromPublic;
    const to = `${relativeFromPublic.slice(0, -4)}.webm`;

    const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escapedFrom, "g");

    content = content.replace(pattern, to);
  }

  await fs.writeFile(markdownPath, content, "utf8");
}

async function main() {
  const projectRoot = dirname(new URL(import.meta.url).pathname);
  const root = dirname(projectRoot);
  const publicRoot = join(root, "public");
  const videoDirectory = join(publicRoot, "images", "design-gpu");
  const markdownPath = join(root, "content", "blog", "shader-editor-part-1.md");

  const results = await convertVideosToWebm(videoDirectory);

  await updateMarkdownReferences(markdownPath, results, publicRoot + "/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
