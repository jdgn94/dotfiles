import { type Terminal, type TUI } from "@earendil-works/pi-tui";
/** Screen position (1-based) and payload of a Sixel image drawn over the rendered frame. */
export interface SixelPlacement {
    row: number;
    col: number;
    rows: number;
    data: string;
}
/**
 * pi-tui only knows Kitty and iTerm2 images, so Sixel (Windows Terminal, conhost, foot, ...)
 * is painted after each frame. Text writes erase Sixel cells, so it is repainted whenever a
 * frame rewrites one of its rows.
 */
export declare class SixelOverlay {
    private static supported;
    private static tui?;
    private static placement?;
    private static drawn?;
    /** Ask the terminal for its cell size and Device Attributes; "4" in DA1 means Sixel. */
    static probe(tui: TUI, terminal: Terminal): void;
    static isSupported(): boolean;
    /** Called once per layout render with the preview position, or undefined when hidden. */
    static place(placement: SixelPlacement | undefined): void;
    /** Append the Sixel image to a frame written by the TUI. */
    static inject(frame: string): string;
    private static touchesRows;
    private static samePlacement;
}
