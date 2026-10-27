import { getCapabilities, type Terminal, type TUI } from "@earendil-works/pi-tui";

/** Screen position (1-based) and payload of a Sixel image drawn over the rendered frame. */
export interface SixelPlacement {
  row: number;
  col: number;
  rows: number;
  data: string;
}

const DA1_RESPONSE = /^\x1b\[\?([\d;]*)c$/;
const END_SYNCHRONIZED_OUTPUT = "\x1b[?2026l";
const ROW_WRITE = /\x1b\[(\d+);1H/g;

/**
 * pi-tui only knows Kitty and iTerm2 images, so Sixel (Windows Terminal, conhost, foot, ...)
 * is painted after each frame. Text writes erase Sixel cells, so it is repainted whenever a
 * frame rewrites one of its rows.
 */
export class SixelOverlay {
  private static supported = false;
  private static tui?: TUI;
  private static placement?: SixelPlacement;
  private static drawn?: SixelPlacement;

  /** Ask the terminal for its cell size and Device Attributes; "4" in DA1 means Sixel. */
  public static probe(tui: TUI, terminal: Terminal): void {
    if (getCapabilities().images) return;
    this.tui = tui;
    tui.addInputListener((data) => {
      const match = DA1_RESPONSE.exec(data);
      if (!match) return undefined;
      if (!this.supported && match[1]!.split(";").slice(1).includes("4")) {
        this.supported = true;
        tui.requestRender(true);
      }
      return { consume: true };
    });
    terminal.write("\x1b[16t\x1b[c");
  }

  public static isSupported(): boolean {
    return this.supported;
  }

  /** Called once per layout render with the preview position, or undefined when hidden. */
  public static place(placement: SixelPlacement | undefined): void {
    const previous = this.drawn;
    this.placement = placement;
    // Only a full redraw clears Sixel pixels from rows that stop being rewritten.
    if (previous && !this.samePlacement(previous, placement)) {
      this.drawn = undefined;
      setImmediate(() => this.tui?.requestRender(true));
    }
  }

  /** Append the Sixel image to a frame written by the TUI. */
  public static inject(frame: string): string {
    const p = this.placement;
    if (!p) return frame;
    const end = frame.lastIndexOf(END_SYNCHRONIZED_OUTPUT);
    if (end === -1) return frame;
    if (this.samePlacement(this.drawn, p) && !this.touchesRows(frame, p)) return frame;

    this.drawn = p;
    // Save/restore the cursor so the TUI's hardware cursor position survives.
    return `${frame.slice(0, end)}\x1b7\x1b[${p.row};${p.col}H${p.data}\x1b8${frame.slice(end)}`;
  }

  private static touchesRows(frame: string, p: SixelPlacement): boolean {
    if (frame.includes("\x1b[2J")) return true;
    for (const match of frame.matchAll(ROW_WRITE)) {
      const row = Number(match[1]);
      if (row >= p.row && row < p.row + p.rows) return true;
    }
    return false;
  }

  private static samePlacement(a?: SixelPlacement, b?: SixelPlacement): boolean {
    return !!a && !!b && a.row === b.row && a.col === b.col && a.data === b.data;
  }
}
