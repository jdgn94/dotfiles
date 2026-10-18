// Exact pixel matrix for Image 1 ("PI" in negative space cutout)
const GRID_PI: Array<Array<[number, number, number] | null>> = [
  [[239,213,40],[245,220,52],[243,155,44],[237,166,49],[232,154,56],[201,86,203],[241,217,55],[132,205,75],[118,202,73],[238,151,47],[230,135,41],[225,62,63]],
  [[242,206,33],[244,213,41],[240,149,43],[233,147,45],[194,75,191],[197,78,196],[200,79,198],[104,192,85],null,null,[225,49,52],[223,51,49]],
  [[139,202,59],[37,202,219],null,null,null,null,[92,189,77],[95,189,83],null,[44,205,223],[63,135,220],[53,118,208]],
  [[100,182,55],[35,193,213],null,[242,214,47],[242,214,52],null,[235,118,41],[89,184,78],null,[37,203,217],[49,112,205],[132,191,47]],
  [[190,56,161],[39,180,207],null,[236,193,40],[165,78,182],null,[228,143,38],[241,207,42],null,[32,198,214],[34,191,211],[38,183,204]],
  [[195,51,114],[166,56,169],null,null,null,null,[222,108,41],[235,188,32],null,[34,192,213],[235,203,32],[226,119,29]],
  [[147,56,170],[37,196,215],null,[227,169,34],[224,119,41],[228,140,40],[109,192,68],[230,139,36],null,[33,168,198],[228,184,23],[212,35,39]],
  [null,null,null,null,null,null,null,null,null,null,null,null],
  [[87,189,207],[65,66,69],[65,66,69],[65,67,74],[227,148,82],[144,205,111],[125,193,106],[234,204,83],[238,210,85],[237,206,83],[235,200,81],[181,94,185]],
  [[87,134,200],[85,192,208],[233,149,77],[232,158,83],[225,142,78],[126,188,101],[90,191,209],[90,194,210],[90,184,205],[90,185,203],[175,95,181],[165,93,177]]
];

// Exact pixel matrix for Image 2 ("π" in negative space cutout)
const GRID_SYMBOL: Array<Array<[number, number, number] | null>> = [
  [[243,219,52],[243,155,47],[241,166,50],[235,154,58],[203,87,204],[243,217,55],[137,204,73],[118,201,68],[237,150,44],[233,135,38]],
  [[241,210,39],null,null,null,null,null,null,null,null,[226,49,55]],
  [[33,204,221],[236,132,43],[238,203,47],null,[116,193,89],[106,190,82],null,[228,104,41],[229,140,46],[61,134,216]],
  [[35,196,216],[53,113,195],[230,78,70],null,[37,195,215],[93,181,82],null,[88,181,76],[37,203,217],[53,116,206]],
  [[35,177,205],[53,152,209],[214,42,40],null,[51,191,211],[68,167,77],null,[239,200,45],[31,198,215],[31,189,211]],
  [[167,59,171],[212,52,44],[205,57,51],null,[42,174,207],[29,180,197],null,[233,186,38],[31,193,212],[237,206,30]],
  [[37,198,214],[126,180,59],[224,57,33],null,[43,149,199],[110,190,67],null,[36,176,205],[37,138,184],[228,181,23]],
  [[89,209,223],[216,103,97],[65,68,77],[242,212,81],[149,206,111],[129,197,113],[65,71,81],[65,69,78],[145,200,107],[234,191,96]],
  [[83,204,218],[215,99,98],[65,68,74],[231,147,81],[140,200,108],[125,191,104],[234,203,82],[239,209,81],[236,207,82],[235,199,78]],
  [[80,194,210],[233,146,77],[233,156,78],[229,139,77],[125,188,101],[87,192,211],[84,192,209],[84,181,204],[87,184,206],[172,94,179]]
];

export class TetrisLogo {
  private mode: "PI" | "SYMBOL";
  private grid: Array<Array<[number, number, number] | null>>;
  private rows: number;
  private cols: number;
  private activeLayer = 0;
  private maxLayer = 4; // 5 parallel waves (layer 0 = base, up to layer 4 = punta)
  private dropOffset = -10;
  private isCompleted = false;

  constructor() {
    // 50% random choice at startup
    this.mode = Math.random() < 0.5 ? "PI" : "SYMBOL";
    this.grid = this.mode === "PI" ? GRID_PI : GRID_SYMBOL;
    this.rows = this.grid.length;
    this.cols = this.grid[0]?.length ?? 12;
  }

  public getMode(): "PI" | "SYMBOL" {
    return this.mode;
  }

  public isComplete(): boolean {
    return this.isCompleted;
  }

  /**
   * Advances the parallel falling animation from the BASE (layer 0) to the PUNTA (layer 4).
   * Multiple pieces in each layer fall concurrently and stack layer-by-layer.
   */
  public update(): boolean {
    if (this.isCompleted) return false;

    this.dropOffset += 1;

    // When the falling layer hits its resting position
    if (this.dropOffset >= 0) {
      this.dropOffset = 0;
      this.activeLayer += 1;

      if (this.activeLayer > this.maxLayer) {
        this.isCompleted = true;
      } else {
        // Next layer starts dropping from above
        this.dropOffset = -8;
      }
    }

    return true;
  }

  public render(viewportWidth: number): string[] {
    const out: string[][] = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill("  ")
    );

    // 1. Draw already landed & locked layers (from base layer 0 up to activeLayer - 1)
    // Layers build from base (layer 0 = rows 8-9) up to top crest (layer 4 = rows 0-1)
    for (let l = 0; l < this.activeLayer || this.isCompleted; l++) {
      if (l > this.maxLayer) break;
      const rStart = this.rows - 2 - l * 2;
      const rEnd = rStart + 1;
      for (let r = Math.max(0, rStart); r <= Math.min(this.rows - 1, rEnd); r++) {
        const rowArr = this.grid[r];
        if (!rowArr) continue;
        for (let c = 0; c < this.cols; c++) {
          const rgb = rowArr[c];
          if (rgb) {
            const outRow = out[r];
            if (outRow) {
              outRow[c] = `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m██\x1b[0m`;
            }
          }
        }
      }
    }

    // 2. Draw currently falling layer in parallel (falling from above)
    if (!this.isCompleted && this.activeLayer <= this.maxLayer) {
      const rStart = this.rows - 2 - this.activeLayer * 2;
      const rEnd = rStart + 1;
      for (let r = Math.max(0, rStart); r <= Math.min(this.rows - 1, rEnd); r++) {
        const rowArr = this.grid[r];
        if (!rowArr) continue;
        for (let c = 0; c < this.cols; c++) {
          const rgb = rowArr[c];
          if (rgb) {
            const currentR = r + this.dropOffset;
            if (currentR >= 0 && currentR < this.rows) {
              const outRow = out[currentR];
              if (outRow) {
                outRow[c] = `\x1b[38;2;${rgb[0]};${rgb[1]};${rgb[2]}m██\x1b[0m`;
              }
            }
          }
        }
      }
    }

    // 3. Center horizontally in the available viewport
    const totalCharsWidth = this.cols * 2;
    const leftPadCount = Math.max(0, Math.floor((viewportWidth - totalCharsWidth) / 2));
    const padStr = " ".repeat(leftPadCount);

    return out.map((row) => `${padStr}${row.join("")}`);
  }
}
