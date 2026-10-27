export declare class ImagePreview {
    private static cache;
    static render(imagePath: string, targetWidth?: number, targetHeight?: number): string[];
    /** Real-pixel preview: the first line carries the Kitty sequence, the rest reserve its rows. */
    private static renderKitty;
    private static sixelCache;
    /** Sixel preview for terminals like Windows Terminal; null when the image cannot be encoded. */
    static renderSixel(imagePath: string, targetWidth: number, targetHeight: number): {
        data: string;
        columns: number;
        rows: number;
    } | null;
    /** Downscale to the box size in pixels so the escape payload stays small. */
    private static fitPng;
}
