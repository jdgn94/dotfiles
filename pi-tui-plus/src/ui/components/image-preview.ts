import { execSync } from "node:child_process";
import * as fs from "node:fs";

export class ImagePreview {
  private static cache = new Map<string, { mtime: number; width: number; lines: string[] }>();

  public static render(imagePath: string, targetWidth = 34, targetHeight = 10): string[] {
    try {
      if (!fs.existsSync(imagePath)) {
        return ["[Image not found]"];
      }

      const stat = fs.statSync(imagePath);
      const cacheKey = `${imagePath}:${targetWidth}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.mtime === stat.mtimeMs && cached.width === targetWidth) {
        return [...cached.lines];
      }

      // Ensure even height for half-block cells (2 pixels per terminal row)
      const adjustedHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;

      const buf = execSync(
        `magick "${imagePath}" -resize ${targetWidth}x${adjustedHeight}! rgb:-`,
        {
          timeout: 800,
          maxBuffer: 1024 * 1024,
          stdio: ["ignore", "pipe", "ignore"],
        }
      );

      const rows: string[] = [];
      for (let y = 0; y < adjustedHeight; y += 2) {
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
}
