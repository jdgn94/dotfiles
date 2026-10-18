/**
 * Theme and styling helpers for pi-tui-plus
 */
export declare const colors: {
    reset: string;
    bold: string;
    dim: string;
    italic: string;
    underline: string;
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    peach: string;
    text: string;
    subtext: string;
    muted: string;
    border: string;
    activeBorder: string;
    bgDark: string;
    bgSurface: string;
    bgHeader: string;
    bgHighlight: string;
};
export declare function style(text: string, ...ansiCodes: string[]): string;
export declare function pad(text: string, targetWidth: number, align?: "left" | "right" | "center"): string;
export declare function truncate(text: string, maxWidth: number): string;
export declare function progressBar(percent: number, width: number): string;
