export interface GitFileChange {
    file: string;
    statusCode: string;
    status: "modified" | "added" | "deleted" | "untracked" | "renamed";
    additions: number;
    deletions: number;
}
export interface GitStatus {
    isGitRepo: boolean;
    projectDir: string;
    branch: string;
    staged: number;
    modified: number;
    untracked: number;
    lastCommitHash: string;
    lastCommitMessage: string;
    lastCommitTime: string;
    changedFiles: GitFileChange[];
}
export declare class GitWatcher {
    private status;
    private pollInterval?;
    private fsWatcher?;
    private debounceTimer?;
    private cwd;
    private listeners;
    constructor(cwd?: string);
    init(): Promise<void>;
    getStatus(): GitStatus;
    getWorkspaceFiles(): string[];
    onChange(listener: (status: GitStatus) => void): () => void;
    refresh(): Promise<void>;
    private notify;
    dispose(): void;
}
