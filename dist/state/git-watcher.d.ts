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
export declare class GitWatcher {
    private status;
    private pollInterval?;
    private cwd;
    private listeners;
    constructor(cwd?: string);
    init(): Promise<void>;
    getStatus(): GitStatus;
    onChange(listener: (status: GitStatus) => void): () => void;
    refresh(): Promise<void>;
    private notify;
    dispose(): void;
}
