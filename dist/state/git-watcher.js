import { exec } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import { promisify } from "node:util";
const execAsync = promisify(exec);
export class GitWatcher {
    status = {
        isGitRepo: false,
        projectDir: "-",
        branch: "-",
        staged: 0,
        modified: 0,
        untracked: 0,
        lastCommitHash: "-",
        lastCommitMessage: "-",
        lastCommitTime: "-",
        changedFiles: [],
    };
    pollInterval;
    fsWatcher;
    debounceTimer;
    cwd;
    listeners = [];
    constructor(cwd = process.cwd()) {
        this.cwd = cwd;
    }
    async init() {
        await this.refresh();
        // Instant file change monitoring for live development
        try {
            this.fsWatcher = fs.watch(this.cwd, { recursive: true }, (_event, filename) => {
                if (filename &&
                    (filename.startsWith(".git") ||
                        filename.startsWith("node_modules") ||
                        filename.startsWith("dist"))) {
                    return;
                }
                if (this.debounceTimer)
                    clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(async () => {
                    try {
                        await this.refresh();
                    }
                    catch {
                        // ignore
                    }
                }, 250);
            });
        }
        catch {
            // Fallback to polling if fs.watch recursive is not supported
        }
        // Poll every 4 seconds as fallback for git commits / branch switches
        this.pollInterval = setInterval(async () => {
            try {
                await this.refresh();
            }
            catch {
                // ignore
            }
        }, 4000);
    }
    getStatus() {
        return {
            ...this.status,
            changedFiles: [...this.status.changedFiles],
        };
    }
    onChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    async refresh() {
        try {
            // Check if git repo
            await execAsync("git rev-parse --is-inside-work-tree", { cwd: this.cwd });
            this.status.isGitRepo = true;
            const home = os.homedir();
            this.status.projectDir = this.cwd.startsWith(home)
                ? this.cwd.replace(home, "~")
                : this.cwd;
            // Get branch
            try {
                const { stdout: branchOut } = await execAsync("git branch --show-current", {
                    cwd: this.cwd,
                });
                const branch = branchOut.trim();
                this.status.branch = branch || "(detached)";
            }
            catch {
                this.status.branch = "(none)";
            }
            // Collect diff stats for additions and deletions
            const diffMap = {};
            try {
                const [{ stdout: numstatOut }, { stdout: stagedOut }] = await Promise.all([
                    execAsync("git diff --numstat", { cwd: this.cwd }),
                    execAsync("git diff --cached --numstat", { cwd: this.cwd }),
                ]);
                const combinedNumstat = `${numstatOut}\n${stagedOut}`;
                for (const line of combinedNumstat.split("\n")) {
                    const parts = line.trim().split(/\s+/);
                    if (parts.length >= 3) {
                        const adds = parseInt(parts[0], 10) || 0;
                        const dels = parseInt(parts[1], 10) || 0;
                        const file = parts.slice(2).join(" ");
                        const existing = diffMap[file] || { additions: 0, deletions: 0 };
                        diffMap[file] = {
                            additions: existing.additions + adds,
                            deletions: existing.deletions + dels,
                        };
                    }
                }
            }
            catch {
                // ignore numstat failure
            }
            // Get status porcelain
            try {
                const { stdout: statusOut } = await execAsync("git status --porcelain", {
                    cwd: this.cwd,
                });
                const lines = statusOut.split("\n").filter((l) => l.trim().length > 0);
                let staged = 0;
                let modified = 0;
                let untracked = 0;
                const changedFiles = [];
                for (const line of lines) {
                    const x = line[0];
                    const y = line[1];
                    const file = line.slice(3).trim();
                    const diff = diffMap[file] || { additions: 0, deletions: 0 };
                    let changeStatus = "modified";
                    if (x === "?" || y === "?") {
                        untracked++;
                        changeStatus = "untracked";
                    }
                    else {
                        if (x && x !== " " && x !== "?")
                            staged++;
                        if (y && y !== " ")
                            modified++;
                        if (x === "A" || y === "A")
                            changeStatus = "added";
                        else if (x === "D" || y === "D")
                            changeStatus = "deleted";
                        else if (x === "R" || y === "R")
                            changeStatus = "renamed";
                    }
                    changedFiles.push({
                        file,
                        statusCode: (x + y).trim(),
                        status: changeStatus,
                        additions: diff.additions,
                        deletions: diff.deletions,
                    });
                }
                this.status.staged = staged;
                this.status.modified = modified;
                this.status.untracked = untracked;
                this.status.changedFiles = changedFiles;
            }
            catch {
                this.status.changedFiles = [];
            }
            // Get last commit
            try {
                const { stdout: commitOut } = await execAsync('git log -1 --format="%h|%s|%cr"', {
                    cwd: this.cwd,
                });
                const [hash, msg, time] = commitOut.trim().split("|");
                this.status.lastCommitHash = hash || "-";
                this.status.lastCommitMessage = msg || "-";
                this.status.lastCommitTime = time || "-";
            }
            catch {
                this.status.lastCommitHash = "-";
                this.status.lastCommitMessage = "No previous commits";
                this.status.lastCommitTime = "-";
            }
            this.notify();
        }
        catch {
            this.status.isGitRepo = false;
            this.status.projectDir = this.cwd;
            this.status.branch = "Not a git repo";
            this.status.changedFiles = [];
            this.notify();
        }
    }
    notify() {
        for (const l of this.listeners) {
            l(this.getStatus());
        }
    }
    dispose() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
        if (this.fsWatcher) {
            this.fsWatcher.close();
            this.fsWatcher = undefined;
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = undefined;
        }
        this.listeners = [];
    }
}
//# sourceMappingURL=git-watcher.js.map