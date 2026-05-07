import type { MPMask } from "@mediapipe/tasks-vision";

type BodyMaskRenderOptions = {
    threshold?: number;
    alpha?: number;
};

export class BodyMaskRender {
    private readonly maskCanvas: HTMLCanvasElement;
    private readonly maskCtx: CanvasRenderingContext2D;

    private imageData: ImageData | null = null;

    private readonly threshold: number;
    private readonly alpha: number;
    
    constructor(options: BodyMaskRenderOptions = {}) {
        this.threshold = options.threshold ?? 0.45;
        this.alpha = options.alpha ?? 0.75;

        this.maskCanvas = document.createElement('canvas');

        const maskCtx = this.maskCanvas.getContext('2d');
        if (!maskCtx) throw new Error('Failed to create body mask canvas context');
        this.maskCtx = maskCtx;
    }

    drawMaskOverlay(
        ctx: CanvasRenderingContext2D,
        mask: MPMask,
        targetWidth: number,
        targetHeight: number
    ): void {
        const maskWidth = mask.width;
        const maskHeight = mask.height;

        this.ensureImageData(maskWidth, maskHeight);

        if (!this.imageData) return;

        // TODO: REPLACE WITH WEBGL
        const maskData = mask.getAsFloat32Array();
        const pixels = this.imageData.data;

        for (let i = 0; i < maskData.length; i++) {
            const probability = maskData[i];
            const pixelIndex = i * 4;

            if (probability < this.threshold) {
                pixels[pixelIndex] = 0;
                pixels[pixelIndex + 1] = 0;
                pixels[pixelIndex + 2] = 0;
                pixels[pixelIndex + 3] = 0;
                continue;
            }

            const normalizedAlpha = Math.min(
                1,
                ((probability - this.threshold) / (1 - this.threshold)) * this.alpha
            );

            pixels[pixelIndex] = 0;
            pixels[pixelIndex + 1] = 255;
            pixels[pixelIndex + 2] = 255;
            pixels[pixelIndex + 3] = Math.round(normalizedAlpha * 255);
        }

        this.maskCtx.putImageData(this.imageData, 0, 0);

        ctx.save;
        ctx.drawImage(
            this.maskCanvas,
            0,
            0,
            maskWidth,
            maskHeight,
            0,
            0,
            targetWidth,
            targetHeight
        );
        ctx.restore();
    }
    
    private ensureImageData(width: number, height: number): void {
        if (this.maskCanvas.width !== width) this.maskCanvas.width = width;
        if (this.maskCanvas.height !== height) this.maskCanvas.height = height;

        if (!this.imageData || this.imageData.width !== width || this.imageData.height !== height) {
            this.imageData = this.maskCtx.createImageData(width, height);
        }
    }
}