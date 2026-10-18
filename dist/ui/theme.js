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
export function style(text, ...ansiCodes) {
    return `${ansiCodes.join("")}${text}${colors.reset}`;
}
export function pad(text, targetWidth, align = "left") {
    // Strip ANSI to measure visual length
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
    const diff = targetWidth - stripped.length;
    if (diff <= 0)
        return text;
    if (align === "left") {
        return text + " ".repeat(diff);
    }
    else if (align === "right") {
        return " ".repeat(diff) + text;
    }
    else {
        const left = Math.floor(diff / 2);
        const right = diff - left;
        return " ".repeat(left) + text + " ".repeat(right);
    }
}
export function truncate(text, maxWidth) {
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");
    if (stripped.length <= maxWidth)
        return text;
    return stripped.slice(0, Math.max(0, maxWidth - 1)) + "…";
}
export function progressBar(percent, width) {
    const clamped = Math.max(0, Math.min(100, percent));
    const fillWidth = Math.round((clamped / 100) * width);
    const emptyWidth = width - fillWidth;
    let color = colors.success;
    if (clamped > 80)
        color = colors.error;
    else if (clamped > 60)
        color = colors.warning;
    return `${color}${"█".repeat(fillWidth)}${colors.muted}${"░".repeat(emptyWidth)}${colors.reset}`;
}
function hslToRgb(h, s, l) {
    if (s === 0) {
        const val = Math.round(l * 255);
        return [val, val, val];
    }
    const hue2rgb = (p, q, t) => {
        let adjustedT = t;
        if (adjustedT < 0)
            adjustedT += 1;
        if (adjustedT > 1)
            adjustedT -= 1;
        if (adjustedT < 1 / 6)
            return p + (q - p) * 6 * adjustedT;
        if (adjustedT < 1 / 2)
            return q;
        if (adjustedT < 2 / 3)
            return p + (q - p) * (2 / 3 - adjustedT) * 6;
        return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/**
 * Animated Multi-Color Wave Pulse work indicator
 * Oscillates heights smoothly and shifts through a vibrant TrueColor spectrum
 */
export function renderWavePulse(numBars = 5) {
    const tick = Math.floor(Date.now() / 90);
    const bars = ["▂", "▃", "▄", "▅", "▆", "▇", "█"];
    let out = "";
    for (let i = 0; i < numBars; i++) {
        const wavePhase = tick * 0.45 + i * 0.85;
        const norm = (Math.sin(wavePhase) + 1) / 2;
        const barIdx = Math.min(bars.length - 1, Math.floor(norm * bars.length));
        const char = bars[barIdx];
        const hue = (Date.now() / 2500 + i / numBars) % 1;
        const [r, g, b] = hslToRgb(hue, 0.85, 0.65);
        out += `\x1b[38;2;${r};${g};${b}m${char}\x1b[0m`;
    }
    return out;
}
//# sourceMappingURL=theme.js.map