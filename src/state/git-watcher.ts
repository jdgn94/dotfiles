import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface GitStatus {
  isGitRepo: boolean;
  branch: string;
  staged: number;
  modified: number;
  untracked: number;
  lastCommitHash: string;
  lastCommitMessage: string;
  lastCommitTime: string;
}

export class GitWatcher {
  private status: GitStatus = {
    isGitRepo: false,
    branch: "-",
    staged: 0,
    modified: 0,
    untracked: 0,
    lastCommitHash: "-",
    lastCommitMessage: "-",
    lastCommitTime: "-",
  };

  private pollInterval?: NodeJS.Timeout;
  private cwd: string;
  private listeners: Array<(status: GitStatus) => void> = [];

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  public async init(): Promise<void> {
    await this.refresh();
    // Poll every 4 seconds for external git changes
    this.pollInterval = setInterval(() => {
      this.refresh().catch(() => {});
    }, 4000);
  }

  public getStatus(): GitStatus {
    return { ...this.status };
  }

  public onChange(listener: (status: GitStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async refresh(): Promise<void> {
    try {
      // Check if git repo
      await execAsync("git rev-parse --is-inside-work-tree", { cwd: this.cwd });
      this.status.isGitRepo = true;

      // Get branch
      try {
        const { stdout: branchOut } = await execAsync("git branch --show-current", { cwd: this.cwd });
        const branch = branchOut.trim();
        this.status.branch = branch || "(detached)";
      } catch {
        this.status.branch = "(none)";
      }

      // Get status porcelain
      try {
        const { stdout: statusOut } = await execAsync("git status --porcelain", { cwd: this.cwd });
        const lines = statusOut.split("\n").filter((l) => l.trim().length > 0);
        let staged = 0;
        let modified = 0;
        let untracked = 0;

        for (const line of lines) {
          const x = line[0];
          const y = line[1];
          if (x === "?" && y === "?") {
            untracked++;
          } else {
            if (x && x !== " " && x !== "?") staged++;
            if (y && y !== " ") modified++;
          }
        }

        this.status.staged = staged;
        this.status.modified = modified;
        this.status.untracked = untracked;
      } catch {
        // ignore
      }

      // Get last commit
      try {
        const { stdout: commitOut } = await execAsync('git log -1 --format="%h|%s|%cr"', { cwd: this.cwd });
        const [hash, msg, time] = commitOut.trim().split("|");
        this.status.lastCommitHash = hash || "-";
        this.status.lastCommitMessage = msg || "-";
        this.status.lastCommitTime = time || "-";
      } catch {
        this.status.lastCommitHash = "-";
        this.status.lastCommitMessage = "Sin commits previos";
        this.status.lastCommitTime = "-";
      }

      this.notify();
    } catch {
      this.status.isGitRepo = false;
      this.status.branch = "No es un repo git";
      this.notify();
    }
  }

  private notify(): void {
    for (const l of this.listeners) {
      l(this.getStatus());
    }
  }

  public dispose(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.listeners = [];
  }
}
