export interface ChatImage {
    /** Local path used by the sidebar image preview. */
    path: string;
    mimeType: string;
    /** Base64 payload sent to the model. */
    data: string;
}
export declare function normalizeImagePath(candidate: string): string | null;
export declare function imageMimeFromPath(imagePath: string): string | null;
export declare function imageMimeFromBuffer(buffer: Buffer): string | null;
export declare function loadImageAttachment(candidate: string): ChatImage | null;
export declare function saveImageBuffer(buffer: Buffer, mimeType: string, prefix?: string): ChatImage | null;
export declare function readClipboardText(): string;
export declare function readClipboardImage(): ChatImage | null;
