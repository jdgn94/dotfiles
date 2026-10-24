import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export interface ChatImage {
  /** Local path used by the sidebar image preview. */
  path: string;
  mimeType: string;
  /** Base64 payload sent to the model. */
  data: string;
}

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/bmp": "bmp",
  "image/svg+xml": "svg",
};

export function normalizeImagePath(candidate: string): string | null {
  let value = candidate.trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
      value = value.slice(1, -1);
    }
  }
  value = value.replace(/\\ /g, " ").replace(/\\'/g, "'");

  if (value.startsWith("file://")) {
    try {
      value = fileURLToPath(value);
    } catch {
      return null;
    }
  }
  if (value.startsWith("~")) {
    value = path.join(os.homedir(), value.slice(1));
  }
  if (!MIME_BY_EXT[path.extname(value).toLowerCase()]) return null;

  const resolved = path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
  try {
    return fs.existsSync(resolved) && fs.statSync(resolved).isFile() ? resolved : null;
  } catch {
    return null;
  }
}

export function imageMimeFromPath(imagePath: string): string | null {
  return MIME_BY_EXT[path.extname(imagePath).toLowerCase()] ?? null;
}

export function imageMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function loadImageAttachment(candidate: string): ChatImage | null {
  const resolved = normalizeImagePath(candidate);
  if (!resolved) return null;
  try {
    if (fs.statSync(resolved).size > MAX_IMAGE_BYTES) return null;
    const mimeType = imageMimeFromPath(resolved);
    if (!mimeType) return null;
    return {
      path: resolved,
      mimeType,
      data: fs.readFileSync(resolved).toString("base64"),
    };
  } catch {
    return null;
  }
}

export function saveImageBuffer(buffer: Buffer, mimeType: string, prefix = "image"): ChatImage | null {
  const ext = EXT_BY_MIME[mimeType];
  if (!ext) return null;
  const dir = path.join(os.tmpdir(), "pi-tui-plus-images");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(
    dir,
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  );
  fs.writeFileSync(file, buffer);
  return { path: file, mimeType, data: buffer.toString("base64") };
}

export function readClipboardText(): string {
  const commands: Array<[string, string[]]> = [
    ["wl-paste", ["--no-newline"]],
    ["xclip", ["-selection", "clipboard", "-o"]],
    ["pbpaste", []],
  ];
  for (const [command, args] of commands) {
    try {
      const output = execFileSync(command, args, {
        encoding: "utf8",
        timeout: 1200,
        maxBuffer: 2 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
      });
      if (output) return output;
    } catch {
      // Try the next clipboard backend.
    }
  }
  return "";
}

export function readClipboardImage(): ChatImage | null {
  const commands: Array<[string, string[]]> = [
    ["wl-paste", ["--type", "image/png", "--no-newline"]],
    ["wl-paste", ["--type", "image/jpeg", "--no-newline"]],
    ["xclip", ["-selection", "clipboard", "-t", "image/png", "-o"]],
    ["xclip", ["-selection", "clipboard", "-t", "image/jpeg", "-o"]],
    ["pngpaste", ["-"]],
  ];
  for (const [command, args] of commands) {
    try {
      const buffer = execFileSync(command, args, {
        timeout: 1500,
        maxBuffer: MAX_IMAGE_BYTES * 2,
        stdio: ["ignore", "pipe", "ignore"],
      }) as Buffer;
      const mimeType = imageMimeFromBuffer(buffer);
      if (mimeType) {
        const saved = saveImageBuffer(buffer, mimeType, "clipboard");
        if (saved) return saved;
      }
    } catch {
      // Try the next backend/type.
    }
  }
  return null;
}
