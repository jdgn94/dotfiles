/**
 * Theme and styling helpers for pi-tui-plus
 */

export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // 24-bit TrueColor palettes (Catppuccin / Tokyo Night inspired)
  primary: "\x1b[38;2;137;180;250m", // Soft Blue / Lavender (#89b4fa)
  secondary: "\x1b[38;2;203;166;247m", // Mauve / Violet (#cba6f7)
  accent: "\x1b[38;2;116;199;236m", // Sapphire / Cyan (#74c7ec)
  success: "\x1b[38;2;166;227;161m", // Green (#a6e3a1)
  warning: "\x1b[38;2;249;226;175m", // Yellow (#f9e2af)
  error: "\x1b[38;2;243;139;168m", // Red (#f38ba8)
  peach: "\x1b[38;2;250;179;135m", // Peach / Orange (#fab387)
  text: "\x1b[38;2;205;214;244m", // Foreground Text (#cdd6f4)
  subtext: "\x1b[38;2;166;173;200m", // Subtext (#a6adc8)
  muted: "\x1b[38;2;108;112;134m", // Gray / Surface (#6c7086)
  border: "\x1b[38;2;88;91;112m", // Border Gray (#585b70)
  activeBorder: "\x1b[38;2;137;180;250m", // Active Border (#89b4fa)

  // Backgrounds
  bgDark: "\x1b[48;2;24;24;37m", // #181825
  bgSurface: "\x1b[48;2;30;30;46m", // #1e1e2e
  bgHeader: "\x1b[48;2;49;50;68m", // #313244
  bgHighlight: "\x1b[48;2;69;71;90m", // #45475a
};

export function style(text: string, ...ansiCodes: string[]): string {
  return `${ansiCodes.join("")}${text}${colors.reset}`;
}

export function pad(text: string, targetWidth: number, align: "left" | "right" | "center" = "left"): string {
  // Strip ANSI to measure visual length
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
  const diff = targetWidth - stripped.length;
  if (diff <= 0) return text;

  if (align === "left") {
    return text + " ".repeat(diff);
  } else if (align === "right") {
    return " ".repeat(diff) + text;
  } else {
    const left = Math.floor(diff / 2);
    const right = diff - left;
    return " ".repeat(left) + text + " ".repeat(right);
  }
}

export function truncate(text: string, maxWidth: number): string {
  const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
  if (stripped.length <= maxWidth) return text;
  return stripped.slice(0, Math.max(0, maxWidth - 1)) + "…";
}

export function progressBar(percent: number, width: number): string {
  const clamped = Math.max(0, Math.min(100, percent));
  const fillWidth = Math.round((clamped / 100) * width);
  const emptyWidth = width - fillWidth;

  let color = colors.success;
  if (clamped > 80) color = colors.error;
  else if (clamped > 60) color = colors.warning;

  return `${color}${"█".repeat(fillWidth)}${colors.muted}${"░".repeat(emptyWidth)}${colors.reset}`;
}
