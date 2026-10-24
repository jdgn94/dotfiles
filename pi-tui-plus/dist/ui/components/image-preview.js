import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
export class ImagePreview {
    static cache = new Map();
    static render(imagePath, targetWidth = 34, targetHeight = 10) {
        try {
            if (!fs.existsSync(imagePath)) {
                return ["[Image not found]"];
            }
            const stat = fs.statSync(imagePath);
            // targetHeight is measured in terminal rows; half-block cells use 2 pixels each.
            const pixelHeight = targetHeight % 2 === 0 ? targetHeight : targetHeight + 1;
            const cacheKey = `${imagePath}:${targetWidth}x${pixelHeight}`;
            const cached = this.cache.get(cacheKey);
            if (cached &&
                cached.mtime === stat.mtimeMs &&
                cached.width === targetWidth &&
                cached.height === pixelHeight) {
                return [...cached.lines];
            }
            // Fit inside the target box without distortion, then pad with black bars.
            const buf = execFileSync("magick", [
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
            ], {
                timeout: 1500,
                maxBuffer: 4 * 1024 * 1024,
                stdio: ["ignore", "pipe", "ignore"],
            });
            const rows = [];
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
        }
        catch {
            // Graceful fallback if magick fails or isn't installed
            try {
                const stat = fs.statSync(imagePath);
                const kb = (stat.size / 1024).toFixed(1);
                return [`[Attached image: ${kb} KB]`];
            }
            catch {
                return ["[Attached image]"];
            }
        }
    }
}
//# sourceMappingURL=image-preview.js.map