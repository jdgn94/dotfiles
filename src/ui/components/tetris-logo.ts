import { colors } from "../theme.js";

interface TetrisPiece {
  id: string;
  color: string;
  cells: Array<[number, number]>;
}

const PIECES_PI: TetrisPiece[] = [
  // P - bottom stem
  {
    id: "J",
    color: "\x1b[38;2;137;180;250m", // Blue
    cells: [[4, 2], [4, 3], [5, 2], [5, 3], [6, 2], [6, 3]],
  },
  // P - top stem
  {
    id: "L",
    color: "\x1b[38;2;250;179;135m", // Orange
    cells: [
      [0, 2], [0, 3],
      [1, 2], [1, 3],
      [2, 2], [2, 3],
      [3, 2], [3, 3],
    ],
  },
  // P - top horizontal bar
  {
    id: "I",
    color: "\x1b[38;2;116;199;236m", // Cyan
    cells: [
      [0, 4], [0, 5], [0, 6], [0, 7],
      [0, 8], [0, 9], [0, 10], [0, 11],
    ],
  },
  // P - right curve of loop
  {
    id: "O",
    color: "\x1b[38;2;249;226;175m", // Yellow
    cells: [[1, 10], [1, 11], [2, 10], [2, 11]],
  },
  // P - bottom horizontal bar of loop
  {
    id: "S",
    color: "\x1b[38;2;166;227;161m", // Green
    cells: [
      [3, 4], [3, 5], [3, 6], [3, 7],
      [3, 8], [3, 9], [3, 10], [3, 11],
    ],
  },
  // I - top serif
  {
    id: "T",
    color: "\x1b[38;2;203;166;247m", // Purple
    cells: [
      [0, 19], [0, 20], [0, 21], [0, 22], [0, 23],
      [0, 24], [0, 25], [0, 26], [0, 27], [0, 28],
    ],
  },
  // I - vertical stem
  {
    id: "I",
    color: "\x1b[38;2;116;199;236m", // Cyan
    cells: [
      [1, 23], [1, 24],
      [2, 23], [2, 24],
      [3, 23], [3, 24],
      [4, 23], [4, 24],
      [5, 23], [5, 24],
    ],
  },
  // I - bottom serif
  {
    id: "Z",
    color: "\x1b[38;2;243;139;168m", // Red
    cells: [
      [6, 19], [6, 20], [6, 21], [6, 22], [6, 23],
      [6, 24], [6, 25], [6, 26], [6, 27], [6, 28],
    ],
  },
];

const PIECES_SYMBOL: TetrisPiece[] = [
  // Top horizontal arch left half
  {
    id: "I",
    color: "\x1b[38;2;116;199;236m", // Cyan
    cells: [
      [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7],
      [0, 8], [0, 9], [0, 10], [0, 11], [0, 12], [0, 13], [0, 14],
    ],
  },
  // Top horizontal arch right half
  {
    id: "L",
    color: "\x1b[38;2;250;179;135m", // Orange
    cells: [
      [0, 15], [0, 16], [0, 17], [0, 18], [0, 19], [0, 20], [0, 21],
      [0, 22], [0, 23], [0, 24], [0, 25], [0, 26], [0, 27], [0, 28], [0, 29], [0, 30],
    ],
  },
  // Top left flourish hook
  {
    id: "S",
    color: "\x1b[38;2;166;227;161m", // Green
    cells: [[1, 2], [1, 3], [1, 4], [1, 5]],
  },
  // Left leg top
  {
    id: "O",
    color: "\x1b[38;2;249;226;175m", // Yellow
    cells: [[1, 9], [1, 10], [2, 9], [2, 10], [3, 9], [3, 10]],
  },
  // Left leg bottom & curved foot
  {
    id: "J",
    color: "\x1b[38;2;137;180;250m", // Blue
    cells: [[4, 9], [4, 10], [5, 9], [5, 10], [6, 7], [6, 8], [6, 9], [6, 10]],
  },
  // Right leg top
  {
    id: "T",
    color: "\x1b[38;2;203;166;247m", // Purple
    cells: [[1, 21], [1, 22], [2, 21], [2, 22], [3, 21], [3, 22]],
  },
  // Right leg bottom & foot
  {
    id: "Z",
    color: "\x1b[38;2;243;139;168m", // Red
    cells: [[4, 21], [4, 22], [5, 21], [5, 22], [6, 21], [6, 22], [6, 23], [6, 24]],
  },
];

export class TetrisLogo {
  private mode: "PI" | "SYMBOL";
  private pieces: TetrisPiece[];
  private currentPieceIndex = 0;
  private currentDropOffset = -5;
  private isCompleted = false;

  public readonly gridHeight = 7;
  public readonly gridWidth = 34;

  constructor() {
    // Random choice at startup between the word "PI" and the Greek symbol "π"
    this.mode = Math.random() < 0.5 ? "PI" : "SYMBOL";
    this.pieces = this.mode === "PI" ? PIECES_PI : PIECES_SYMBOL;
    this.resetPieceDrop();
  }

  public getMode(): "PI" | "SYMBOL" {
    return this.mode;
  }

  public isComplete(): boolean {
    return this.isCompleted;
  }

  private resetPieceDrop(): void {
    if (this.currentPieceIndex < this.pieces.length) {
      const piece = this.pieces[this.currentPieceIndex];
      if (piece) {
        // Start above the grid based on the piece's maximum row
        const maxRow = Math.max(...piece.cells.map(([r]) => r));
        this.currentDropOffset = -(maxRow + 2);
      }
    }
  }

  public update(): boolean {
    if (this.isCompleted) return false;

    this.currentDropOffset += 1;

    // When the falling piece lands on its target row (offset reaches 0)
    if (this.currentDropOffset >= 0) {
      this.currentDropOffset = 0;
      this.currentPieceIndex += 1;

      if (this.currentPieceIndex >= this.pieces.length) {
        this.isCompleted = true;
      } else {
        this.resetPieceDrop();
      }
    }

    return true;
  }

  public render(viewportWidth: number): string[] {
    const grid: string[][] = Array.from({ length: this.gridHeight }, () =>
      Array(this.gridWidth).fill(" ")
    );

    // 1. Draw all pieces that have already landed and locked into place
    for (let i = 0; i < this.currentPieceIndex; i++) {
      const piece = this.pieces[i];
      if (!piece) continue;
      for (const [r, c] of piece.cells) {
        if (r >= 0 && r < this.gridHeight && c >= 0 && c < this.gridWidth) {
          const rowArr = grid[r];
          if (rowArr) rowArr[c] = `${piece.color}█${colors.reset}`;
        }
      }
    }

    // 2. Draw the currently falling piece at its current drop position
    if (!this.isCompleted && this.currentPieceIndex < this.pieces.length) {
      const piece = this.pieces[this.currentPieceIndex];
      if (piece) {
        for (const [r, c] of piece.cells) {
          const dropR = r + this.currentDropOffset;
          if (dropR >= 0 && dropR < this.gridHeight && c >= 0 && c < this.gridWidth) {
            const rowArr = grid[dropR];
            if (rowArr) rowArr[c] = `${piece.color}█${colors.reset}`;
          }
        }
      }
    }

    // 3. Center the rendered lines in the available viewport width
    const leftPaddingCount = Math.max(0, Math.floor((viewportWidth - this.gridWidth) / 2));
    const padStr = " ".repeat(leftPaddingCount);

    return grid.map((row) => `${padStr}${row.join("")}`);
  }
}
