import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import {
  allocateImageId,
  getCapabilities,
  getCellDimensions,
  getPngDimensions,
  renderImage,
} from "@earendil-works/pi-tui";

export class ImagePreview {
  private static cache = new Map<
    string,
    { mtime: number; width: number; height: number; lines: string[] }
  >();

  public static render(imagePath: string, targetWidth = 34, targetHeight = 10): string[] {
    try {
      if (!fs.existsSync(imagePath)) {
        return ["[Image not found]"];
      }

      const stat = fs.statSync(imagePath);
      if (getCapabilities().images === "kitty") {
        return this.renderKitty(imagePath, stat.mtimeMs, targetWidth, targetHeight);
      }

      // targetHeight is measured in terminal rows; half-block cells use 2 pixels each.
      const pixelHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;
      const cacheKey = `${imagePath}:${targetWidth}x${pixelHeight}`;
      const cached = this.cache.get(cacheKey);
      if (
        cached &&
        cached.mtime === stat.mtimeMs &&
        cached.width === targetWidth &&
        cached.height === pixelHeight
      ) {
        return [...cached.lines];
      }

      // Fit inside the target box without distortion, then pad with black bars.
      const buf = execFileSync(
        "magick",
        [
          imagePath,
          "-auto-orient",
          "-filter",
          "Lanczos",
          "-resize",
          `${targetWidth}x${pixelHeight}`,
          "-background",
          "black",
          "-gravity",
          "center",
          "-extent",
          `${targetWidth}x${pixelHeight}`,
          "rgb:-",
        ],
        {
          timeout: 1500,
          maxBuffer: 4 * 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        }
      ) as Buffer;

      const rows: string[] = [];
      for (let y = 0; y < pixelHeight; y += 2) {
        let row = "";
        for (let x = 0; x < targetWidth; x++) {
          const topIdx = (y * targetWidth + x) * 3;
          const botIdx = ((y + 1) * targetWidth + x) * 3;
          const tr = buf[topIdx] ?? 0;
          const tg = buf[topIdx + 1] ?? 0;
          const tb = buf[topIdx + 2] ?? 0;
          const br = buf[botIdx] ?? 0;
          const bg = buf[botIdx + 1] ?? 0;
          const bb = buf[botIdx + 2] ?? 0;
          row += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀\x1b[0m`;
        }
        rows.push(row);
      }

      this.cache.set(cacheKey, {
        mtime: stat.mtimeMs,
        width: targetWidth,
        height: pixelHeight,
        lines: rows,
      });

      return rows;
    } catch {
      // Graceful fallback if magick fails or isn't installed
      try {
        const stat = fs.statSync(imagePath);
        const kb = (stat.size / 1024).toFixed(1);
        return [`[Attached image: ${kb} KB]`];
      } catch {
        return ["[Attached image]"];
      }
    }
  }

  /** Real-pixel preview: the first line carries the Kitty sequence, the rest reserve its rows. */
  private static renderKitty(
    imagePath: string,
    mtime: number,
    targetWidth: number,
    targetHeight: number
  ): string[] {
    const cell = getCellDimensions();
    const cacheKey = `${imagePath}:kitty:${targetWidth}x${targetHeight}:${cell.widthPx}x${cell.heightPx}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.mtime === mtime) {
      return [...cached.lines];
    }

    // Kitty only accepts PNG.
    const png = this.fitPng(imagePath, targetWidth, targetHeight).toString("base64");
    const dimensions = getPngDimensions(png);
    const result =
      dimensions &&
      renderImage(png, dimensions, {
        maxWidthCells: targetWidth,
        maxHeightCells: targetHeight,
        imageId: allocateImageId(),
        moveCursor: false,
      });
    if (!result) throw new Error("Kitty image render failed");

    const leftPad = " ".repeat(Math.floor((targetWidth - result.columns) / 2));
    const lines = [`${leftPad}${result.sequence}`];
    for (let i = 1; i < result.rows; i++) lines.push("");

    this.cache.set(cacheKey, { mtime, width: targetWidth, height: targetHeight, lines });
    return [...lines];
  }

  private static sixelCache = new Map<
    string,
    { mtime: number; image: { data: string; columns: number; rows: number } }
  >();

  /** Sixel preview for terminals like Windows Terminal; null when the image cannot be encoded. */
  public static renderSixel(
    imagePath: string,
    targetWidth: number,
    targetHeight: number
  ): { data: string; columns: number; rows: number } | null {
    try {
      const mtime = fs.statSync(imagePath).mtimeMs;
      const cell = getCellDimensions();
      const cacheKey = `${imagePath}:${targetWidth}x${targetHeight}:${cell.widthPx}x${cell.heightPx}`;
      const cached = this.sixelCache.get(cacheKey);
      if (cached && cached.mtime === mtime) {
        return cached.image;
      }

      const png = this.fitPng(imagePath, targetWidth, targetHeight);
      const dimensions = getPngDimensions(png.toString("base64"));
      if (!dimensions) return null;
      const data = execFileSync("magick", ["png:-", "sixel:-"], {
        input: png,
        timeout: 1500,
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["pipe", "pipe", "ignore"],
      }).toString("latin1");

      const image = {
        data,
        columns: Math.ceil(dimensions.widthPx / cell.widthPx),
        rows: Math.ceil(dimensions.heightPx / cell.heightPx),
      };
      this.sixelCache.set(cacheKey, { mtime, image });
      return image;
    } catch {
      return null;
    }
  }

  /** Downscale to the box size in pixels so the escape payload stays small. */
  private static fitPng(imagePath: string, targetWidth: number, targetHeight: number): Buffer {
    const cell = getCellDimensions();
    return execFileSync(
      "magick",
      [
        imagePath,
        "-auto-orient",
        "-resize",
        `${targetWidth * cell.widthPx}x${targetHeight * cell.heightPx}>`,
        "png:-",
      ],
      {
        timeout: 1500,
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      }
    ) as Buffer;
  }
}
