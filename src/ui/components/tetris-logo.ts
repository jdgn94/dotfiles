import { colors } from "../theme.js";

export interface TetrisTetromino {
  id: string;
  type: "I" | "O" | "T" | "S" | "Z" | "J" | "L";
  name: string;
  color: string;
  // Each block coordinate [row, blockCol] (each block is 2 characters wide '██')
  blocks: Array<[number, number]>;
  layer: number; // 0 = Base, 1 = Mid, 2 = Top
}

// Canonical 4-block Tetris colors
const PIECE_COLORS = {
  I: "\x1b[38;2;116;199;236m", // Cyan
  O: "\x1b[38;2;249;226;175m", // Yellow
  T: "\x1b[38;2;203;166;247m", // Mauve/Purple
  S: "\x1b[38;2;166;227;161m", // Green
  Z: "\x1b[38;2;243;139;168m", // Red
  J: "\x1b[38;2;137;180;250m", // Blue
  L: "\x1b[38;2;250;179;135m", // Orange
};

// Shape 1: Word "PI" constructed strictly from 4-block tetrominoes
const TETROMINOES_PI: TetrisTetromino[] = [
  // Layer 0: BASE (Bottom ground pieces, falling in parallel)
  {
    id: "I_base_P",
    type: "I",
    name: "I-Piece (Cyan)",
    color: PIECE_COLORS.I,
    blocks: [[4, 1], [5, 1], [6, 1], [7, 1]],
    layer: 0,
  },
  {
    id: "T_base_I",
    type: "T",
    name: "T-Piece (Purple)",
    color: PIECE_COLORS.T,
    blocks: [[7, 11], [7, 12], [7, 13], [6, 12]],
    layer: 0,
  },
  {
    id: "L_base_I",
    type: "L",
    name: "L-Piece (Orange)",
    color: PIECE_COLORS.L,
    blocks: [[7, 14], [7, 15], [6, 14], [5, 14]],
    layer: 0,
  },

  // Layer 1: MID (Middle stems & loops, falling in parallel onto base)
  {
    id: "I_mid_P",
    type: "I",
    name: "I-Piece (Blue)",
    color: PIECE_COLORS.J,
    blocks: [[0, 1], [1, 1], [2, 1], [3, 1]],
    layer: 1,
  },
  {
    id: "I_loop_P",
    type: "I",
    name: "I-Piece (Green)",
    color: PIECE_COLORS.S,
    blocks: [[3, 2], [3, 3], [3, 4], [3, 5]],
    layer: 1,
  },
  {
    id: "O_loop_P",
    type: "O",
    name: "O-Piece (Yellow)",
    color: PIECE_COLORS.O,
    blocks: [[1, 4], [1, 5], [2, 4], [2, 5]],
    layer: 1,
  },
  {
    id: "I_stem_I1",
    type: "I",
    name: "I-Piece (Cyan)",
    color: PIECE_COLORS.I,
    blocks: [[1, 12], [2, 12], [3, 12], [4, 12]],
    layer: 1,
  },
  {
    id: "I_stem_I2",
    type: "I",
    name: "I-Piece (Blue)",
    color: PIECE_COLORS.J,
    blocks: [[1, 13], [2, 13], [3, 13], [4, 13]],
    layer: 1,
  },

  // Layer 2: TOP / PUNTA (Top crest, horizontal bar & serifs, falling in parallel)
  {
    id: "I_top_P",
    type: "I",
    name: "I-Piece (Red)",
    color: PIECE_COLORS.Z,
    blocks: [[0, 2], [0, 3], [0, 4], [0, 5]],
    layer: 2,
  },
  {
    id: "T_top_I",
    type: "T",
    name: "T-Piece (Purple)",
    color: PIECE_COLORS.T,
    blocks: [[0, 11], [0, 12], [0, 13], [1, 12]],
    layer: 2,
  },
  {
    id: "L_top_I",
    type: "L",
    name: "L-Piece (Orange)",
    color: PIECE_COLORS.L,
    blocks: [[0, 14], [0, 15], [1, 14], [2, 14]],
    layer: 2,
  },
];

// Shape 2: Symbol "π" constructed strictly from 4-block tetrominoes
const TETROMINOES_SYMBOL: TetrisTetromino[] = [
  // Layer 0: BASE (Bottom curved feet and lower pillars, falling in parallel)
  {
    id: "J_foot_L",
    type: "J",
    name: "J-Piece (Blue)",
    color: PIECE_COLORS.J,
    blocks: [[6, 2], [6, 3], [5, 3], [4, 3]],
    layer: 0,
  },
  {
    id: "L_foot_R",
    type: "L",
    name: "L-Piece (Orange)",
    color: PIECE_COLORS.L,
    blocks: [[6, 11], [6, 12], [5, 11], [4, 11]],
    layer: 0,
  },
  {
    id: "I_pillar_L_low",
    type: "I",
    name: "I-Piece (Cyan)",
    color: PIECE_COLORS.I,
    blocks: [[3, 4], [4, 4], [5, 4], [6, 4]],
    layer: 0,
  },
  {
    id: "I_pillar_R_low",
    type: "I",
    name: "I-Piece (Cyan)",
    color: PIECE_COLORS.I,
    blocks: [[3, 10], [4, 10], [5, 10], [6, 10]],
    layer: 0,
  },

  // Layer 1: MID (Upper pillars and joints, falling in parallel onto base)
  {
    id: "I_pillar_L_hi",
    type: "I",
    name: "I-Piece (Green)",
    color: PIECE_COLORS.S,
    blocks: [[0, 3], [1, 3], [2, 3], [3, 3]],
    layer: 1,
  },
  {
    id: "I_pillar_R_hi",
    type: "I",
    name: "I-Piece (Green)",
    color: PIECE_COLORS.S,
    blocks: [[0, 11], [1, 11], [2, 11], [3, 11]],
    layer: 1,
  },
  {
    id: "O_joint_L",
    type: "O",
    name: "O-Piece (Yellow)",
    color: PIECE_COLORS.O,
    blocks: [[1, 4], [2, 4], [1, 5], [2, 5]],
    layer: 1,
  },
  {
    id: "O_joint_R",
    type: "O",
    name: "O-Piece (Yellow)",
    color: PIECE_COLORS.O,
    blocks: [[1, 9], [2, 9], [1, 10], [2, 10]],
    layer: 1,
  },

  // Layer 2: TOP / PUNTA (Horizontal crest & crown arch, falling in parallel)
  {
    id: "S_arch_L",
    type: "S",
    name: "S-Piece (Red)",
    color: PIECE_COLORS.Z,
    blocks: [[0, 1], [0, 2], [1, 0], [1, 1]],
    layer: 2,
  },
  {
    id: "I_arch_midL",
    type: "I",
    name: "I-Piece (Cyan)",
    color: PIECE_COLORS.I,
    blocks: [[0, 4], [0, 5], [0, 6], [0, 7]],
    layer: 2,
  },
  {
    id: "T_arch_center",
    type: "T",
    name: "T-Piece (Purple)",
    color: PIECE_COLORS.T,
    blocks: [[0, 8], [0, 9], [0, 10], [1, 9]],
    layer: 2,
  },
  {
    id: "Z_arch_R",
    type: "Z",
    name: "Z-Piece (Red)",
    color: PIECE_COLORS.Z,
    blocks: [[0, 12], [0, 13], [1, 13], [1, 14]],
    layer: 2,
  },
];

export class TetrisLogo {
  private mode: "PI" | "SYMBOL";
  private pieces: TetrisTetromino[];
  private activeLayer = 0;
  private maxLayer = 2;
  private layerDropOffset = -8;
  private isCompleted = false;

  public readonly gridRows = 8;
  public readonly gridCols = 17; // 17 blocks * 2 chars = 34 columns wide

  constructor() {
    // 50% random chance between word "PI" and Greek symbol "π"
    this.mode = Math.random() < 0.5 ? "PI" : "SYMBOL";
    this.pieces = this.mode === "PI" ? TETROMINOES_PI : TETROMINOES_SYMBOL;
  }

  public getMode(): "PI" | "SYMBOL" {
    return this.mode;
  }

  public isComplete(): boolean {
    return this.isCompleted;
  }

  /**
   * Advances the parallel falling animation by 1 frame.
   * Pieces drop simultaneously layer by layer, building from the BASE (0) to the TOP (2).
   */
  public update(): boolean {
    if (this.isCompleted) return false;

    this.layerDropOffset += 1;

    // When the falling pieces in the current layer reach their destination (offset reaches 0)
    if (this.layerDropOffset >= 0) {
      this.layerDropOffset = 0;
      this.activeLayer += 1;

      if (this.activeLayer > this.maxLayer) {
        this.isCompleted = true;
      } else {
        // Next layer starts falling from above the grid
        this.layerDropOffset = -8;
      }
    }

    return true;
  }

  public render(viewportWidth: number): string[] {
    const grid: string[][] = Array.from({ length: this.gridRows }, () =>
      Array(this.gridCols).fill("  ")
    );

    // 1. Draw all pieces that have already landed and locked (layers < activeLayer)
    for (const p of this.pieces) {
      if (p.layer < this.activeLayer || this.isCompleted) {
        for (const [r, c] of p.blocks) {
          if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
            const rowArr = grid[r];
            if (rowArr) rowArr[c] = `${p.color}██${colors.reset}`;
          }
        }
      }
    }

    // 2. Draw all pieces in the CURRENT active layer dropping in parallel
    if (!this.isCompleted) {
      for (const p of this.pieces) {
        if (p.layer === this.activeLayer) {
          for (const [r, c] of p.blocks) {
            const dropRow = r + this.layerDropOffset;
            if (dropRow >= 0 && dropRow < this.gridRows && c >= 0 && c < this.gridCols) {
              const rowArr = grid[dropRow];
              if (rowArr) rowArr[c] = `${p.color}██${colors.reset}`;
            }
          }
        }
      }
    }

    // 3. Center the rendered lines in the available viewport width
    const totalCharsWidth = this.gridCols * 2; // 34 characters
    const leftPadCount = Math.max(0, Math.floor((viewportWidth - totalCharsWidth) / 2));
    const padStr = " ".repeat(leftPadCount);

    return grid.map((row) => `${padStr}${row.join("")}`);
  }
}
