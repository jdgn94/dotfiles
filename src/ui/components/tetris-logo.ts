import { colors } from "../theme.js";

interface ClusteredPiece {
  cells: Array<[number, number]>;
  color: [number, number, number];
  bottomRow: number;
}

// Extracted Tetris pieces from Image 1 ("PI" negative space cutout)
const PIECES_IMAGE_PI: ClusteredPiece[] = [
  {"cells":[[8,0],[9,0],[9,1]],"color":[87,189,207],"bottomRow":9},
  {"cells":[[8,1],[8,2],[8,3]],"color":[65,66,69],"bottomRow":8},
  {"cells":[[8,4],[9,2],[9,3],[9,4]],"color":[227,148,82],"bottomRow":9},
  {"cells":[[8,5],[8,6],[9,5]],"color":[144,205,111],"bottomRow":9},
  {"cells":[[8,7],[8,8],[8,9],[8,10]],"color":[234,204,83],"bottomRow":8},
  {"cells":[[9,6],[9,7],[9,8],[9,9]],"color":[90,191,209],"bottomRow":9},
  {"cells":[[8,11],[9,10],[9,11]],"color":[181,94,185],"bottomRow":9},
  {"cells":[[6,0],[4,0],[5,0],[5,1]],"color":[190,56,161],"bottomRow":6},
  {"cells":[[6,1],[6,9]],"color":[37,196,215],"bottomRow":6},
  {"cells":[[6,3],[6,4],[6,5]],"color":[227,169,34],"bottomRow":6},
  {"cells":[[6,6]],"color":[109,192,68],"bottomRow":6},
  {"cells":[[6,7]],"color":[230,139,36],"bottomRow":6},
  {"cells":[[6,10],[5,10]],"color":[235,203,32],"bottomRow":6},
  {"cells":[[6,11]],"color":[212,35,39],"bottomRow":6},
  {"cells":[[3,6],[4,6],[5,6]],"color":[235,118,41],"bottomRow":5},
  {"cells":[[4,7],[5,7]],"color":[241,207,42],"bottomRow":5},
  {"cells":[[2,9],[3,9],[4,9],[4,10],[4,11],[5,9]],"color":[44,205,223],"bottomRow":5},
  {"cells":[[5,11]],"color":[226,119,29],"bottomRow":5},
  {"cells":[[3,3],[3,4],[4,3]],"color":[242,214,47],"bottomRow":4},
  {"cells":[[4,4]],"color":[165,78,182],"bottomRow":4},
  {"cells":[[2,1],[3,1],[4,1]],"color":[37,202,219],"bottomRow":4},
  {"cells":[[2,0],[3,0]],"color":[139,202,59],"bottomRow":3},
  {"cells":[[2,6],[2,7],[3,7]],"color":[132,205,75],"bottomRow":3},
  {"cells":[[2,10],[2,11],[3,10]],"color":[63,135,220],"bottomRow":3},
  {"cells":[[3,11]],"color":[132,191,47],"bottomRow":3},
  {"cells":[[0,5],[1,4],[1,5],[1,6]],"color":[201,86,203],"bottomRow":1},
  {"cells":[[1,7]],"color":[104,192,85],"bottomRow":1},
  {"cells":[[1,10],[1,11],[0,11]],"color":[225,62,63],"bottomRow":1},
  {"cells":[[0,0],[0,1],[1,0],[1,1]],"color":[239,213,40],"bottomRow":1},
  {"cells":[[0,2],[0,3],[1,2],[1,3]],"color":[240,149,43],"bottomRow":1},
  {"cells":[[0,4]],"color":[232,154,56],"bottomRow":0},
  {"cells":[[0,6]],"color":[241,217,55],"bottomRow":0},
  {"cells":[[0,7],[0,8]],"color":[132,205,75],"bottomRow":0},
  {"cells":[[0,9],[0,10]],"color":[238,151,47],"bottomRow":0}
];

// Extracted Tetris pieces from Image 2 ("π" negative space cutout)
const PIECES_IMAGE_SYMBOL: ClusteredPiece[] = [
  {"cells":[[9,0],[8,0],[7,0],[6,0]],"color":[37,198,214],"bottomRow":9},
  {"cells":[[9,1],[9,2],[9,3],[8,1],[8,3],[7,1]],"color":[216,103,97],"bottomRow":9},
  {"cells":[[9,4],[8,4],[8,5],[7,4],[6,4]],"color":[110,190,67],"bottomRow":9},
  {"cells":[[9,5],[9,6],[9,7],[9,8]],"color":[87,192,211],"bottomRow":9},
  {"cells":[[9,9]],"color":[172,94,179],"bottomRow":9},
  {"cells":[[8,2],[7,2]],"color":[65,68,77],"bottomRow":8},
  {"cells":[[8,6],[8,7],[8,8],[8,9],[7,9]],"color":[234,191,96],"bottomRow":8},
  {"cells":[[7,3]],"color":[242,212,81],"bottomRow":7},
  {"cells":[[7,5]],"color":[149,206,111],"bottomRow":7},
  {"cells":[[7,6],[7,7]],"color":[65,71,81],"bottomRow":7},
  {"cells":[[7,8]],"color":[145,200,107],"bottomRow":7},
  {"cells":[[6,1]],"color":[126,180,59],"bottomRow":6},
  {"cells":[[6,2],[5,1],[5,2],[4,2],[3,2]],"color":[230,78,70],"bottomRow":6},
  {"cells":[[6,6],[6,7]],"color":[36,176,205],"bottomRow":6},
  {"cells":[[6,9],[5,9]],"color":[237,206,30],"bottomRow":6},
  {"cells":[[5,0]],"color":[167,59,171],"bottomRow":5},
  {"cells":[[5,4],[5,5],[4,4],[3,4]],"color":[37,195,215],"bottomRow":5},
  {"cells":[[5,7],[4,7],[3,7],[4,8],[5,8]],"color":[37,203,217],"bottomRow":5},
  {"cells":[[4,0],[3,0],[2,0]],"color":[33,204,221],"bottomRow":4},
  {"cells":[[4,1]],"color":[53,113,195],"bottomRow":4},
  {"cells":[[4,6],[5,6]],"color":[239,200,45],"bottomRow":5},
  {"cells":[[3,1]],"color":[53,113,195],"bottomRow":3},
  {"cells":[[2,1]],"color":[236,132,43],"bottomRow":2},
  {"cells":[[2,2]],"color":[238,203,47],"bottomRow":2},
  {"cells":[[2,4],[2,5],[3,5],[4,5]],"color":[116,193,89],"bottomRow":4},
  {"cells":[[3,6]],"color":[88,181,76],"bottomRow":3},
  {"cells":[[2,7],[2,8]],"color":[228,104,41],"bottomRow":2},
  {"cells":[[2,9],[3,9]],"color":[61,134,216],"bottomRow":3},
  {"cells":[[1,0],[0,0]],"color":[243,219,52],"bottomRow":1},
  {"cells":[[1,9]],"color":[226,49,55],"bottomRow":1},
  {"cells":[[0,1],[0,2],[0,3]],"color":[243,155,47],"bottomRow":0},
  {"cells":[[0,4]],"color":[203,87,204],"bottomRow":0},
  {"cells":[[0,5]],"color":[243,217,55],"bottomRow":0},
  {"cells":[[0,6],[0,7]],"color":[137,204,73],"bottomRow":0},
  {"cells":[[0,8],[0,9]],"color":[237,150,44],"bottomRow":0}
];

export class TetrisLogo {
  private mode: "PI" | "SYMBOL";
  private pieces: ClusteredPiece[];
  private currentPieceIndex = 0;
  private dropOffset = -3;
  private isCompleted = false;

  public readonly rows = 10;
  public readonly cols: number;

  constructor() {
    // 50% random choice at startup
    this.mode = Math.random() < 0.5 ? "PI" : "SYMBOL";
    this.pieces = this.mode === "PI" ? PIECES_IMAGE_PI : PIECES_IMAGE_SYMBOL;
    this.cols = this.mode === "PI" ? 12 : 10;
  }

  public getMode(): "PI" | "SYMBOL" {
    return this.mode;
  }

  public isComplete(): boolean {
    return this.isCompleted;
  }

  /**
   * Advances the animation frame.
   * Each piece falls down individually from the top into its spot on the floor,
   * stacking upward from the base to the top ("desde la base hasta la punta").
   */
  public update(): boolean {
    if (this.isCompleted) return false;

    this.dropOffset += 1;

    // Piece lands and locks into place
    if (this.dropOffset >= 0) {
      this.dropOffset = -3;
      this.currentPieceIndex += 1;

      if (this.currentPieceIndex >= this.pieces.length) {
        this.isCompleted = true;
      }
    }

    return true;
  }

  public render(viewportWidth: number): string[] {
    const out: string[][] = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill("  ")
    );

    // 1. Draw all pieces that have already landed and locked into place
    for (let i = 0; i < this.currentPieceIndex && i < this.pieces.length; i++) {
      const p = this.pieces[i];
      if (!p) continue;
      for (const [r, c] of p.cells) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const rowArr = out[r];
          if (rowArr) {
            rowArr[c] = `\x1b[38;2;${p.color[0]};${p.color[1]};${p.color[2]}m██${colors.reset}`;
          }
        }
      }
    }

    // 2. Draw the currently falling piece dropping into place
    if (!this.isCompleted && this.currentPieceIndex < this.pieces.length) {
      const p = this.pieces[this.currentPieceIndex];
      if (p) {
        for (const [r, c] of p.cells) {
          const dropR = r + this.dropOffset;
          if (dropR >= 0 && dropR < this.rows && c >= 0 && c < this.cols) {
            const rowArr = out[dropR];
            if (rowArr) {
              rowArr[c] = `\x1b[38;2;${p.color[0]};${p.color[1]};${p.color[2]}m██${colors.reset}`;
            }
          }
        }
      }
    }

    // 3. Center horizontally in the available viewport width
    const totalCharsWidth = this.cols * 2;
    const leftPadCount = Math.max(0, Math.floor((viewportWidth - totalCharsWidth) / 2));
    const padStr = " ".repeat(leftPadCount);

    return out.map((row) => `${padStr}${row.join("")}`);
  }
}
