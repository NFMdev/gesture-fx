import type { MPMask } from "@mediapipe/tasks-vision";

type BodyMaskCompositorOptions = {
    threshold?: number;
    alpha?: number;
};

export class BodyMaskCompositor {
    private readonly rawMaskCanvas: HTMLCanvasElement;
    private readonly rawMaskCtx: CanvasRenderingContext2D;

    private readonly scaledMaskCanvas: HTMLCanvasElement;
    private readonly scaledMaskCtx: CanvasRenderingContext2D;

    private readonly layerCanvas: HTMLCanvasElement;
    private readonly layerCtx: CanvasRenderingContext2D;

    private rawImageData: ImageData | null = null;

    private readonly threshold: number;
    private readonly alpha: number;

    constructor(options: BodyMaskCompositorOptions = {}) {
        this.threshold = options.threshold ?? 0.45;
        this.alpha = options.alpha ?? 1;

        this.rawMaskCanvas = document.createElement('canvas');
        this.scaledMaskCanvas = document.createElement('canvas');
        this.layerCanvas = document.createElement('canvas');

        const maskCtx = this.rawMaskCanvas.getContext('2d');
        const scaledMaskCtx = this.scaledMaskCanvas.getContext('2d');
        const layerCtx = this.layerCanvas.getContext('2d');
        if (!maskCtx || !scaledMaskCtx || !layerCtx) throw new Error('Failed to create body mask compositor contexts');
        this.rawMaskCtx = maskCtx;
        this.scaledMaskCtx = scaledMaskCtx;
        this.layerCtx = layerCtx;
    }

    updateMask(
        mask: MPMask,
        targetWidth: number,
        targetHeight: number
    ): void {
        const maskWidth = mask.width;
        const maskHeight = mask.height;

        this.ensureRawMaskResources(maskWidth, maskHeight);
        this.ensureTargetResources(targetWidth, targetHeight);

        if (!this.rawImageData) return;

        // TODO: REPLACE WITH WEBGL
        const maskData = mask.getAsFloat32Array();
        const pixels = this.rawImageData.data;

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

        this.rawMaskCtx.putImageData(this.rawImageData, 0, 0);

        this.scaledMaskCtx.clearRect(
            0,
            0,
            this.scaledMaskCanvas.width,
            this.scaledMaskCanvas.height
        );
        this.scaledMaskCtx.drawImage(
            this.rawMaskCanvas,
            0,
            0,
            maskWidth,
            maskHeight,
            0,
            0,
            targetWidth,
            targetHeight
        );
    }

    cutOutBody(
        targetCtx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number
    ): void {
        targetCtx.save();
        targetCtx.globalCompositeOperation = 'destination-out';
        targetCtx.drawImage(this.scaledMaskCanvas, 0, 0, targetWidth, targetHeight);
        targetCtx.restore();
    }

    drawMaskedLayer(
        targetCtx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number,
        drawLayer: (
            layerCtx: CanvasRenderingContext2D,
            width: number,
            height: number
        ) => void
    ): void {
        this.ensureTargetResources(targetWidth, targetHeight);
        this.layerCtx.clearRect(0, 0, targetWidth, targetHeight);

        drawLayer(this.layerCtx, targetWidth, targetHeight);

        this.layerCtx.save();
        this.layerCtx.globalCompositeOperation = 'destination-in';
        this.layerCtx.drawImage(this.scaledMaskCanvas, 0, 0, targetWidth, targetHeight);
        this.layerCtx.restore();

        targetCtx.drawImage(this.layerCanvas, 0, 0, targetWidth, targetHeight);
    }

    drawMaskDebug(
        targetCtx: CanvasRenderingContext2D,
        targetWidth: number,
        targetHeight: number
    ): void {
        targetCtx.save();
        targetCtx.globalAlpha = 0.7;
        targetCtx.drawImage(this.scaledMaskCanvas, 0, 0, targetWidth, targetHeight);
        targetCtx.restore();
    }

    private ensureRawMaskResources(width: number, height: number): void {
        if (this.rawMaskCanvas.width !== width) this.rawMaskCanvas.width = width;
        if (this.rawMaskCanvas.height !== height) this.rawMaskCanvas.height = height;

        if (!this.rawImageData || this.rawImageData.width !== width || this.rawImageData.height !== height) {
            this.rawImageData = this.rawMaskCtx.createImageData(width, height);
        }
    }

    private ensureTargetResources(width: number, height: number): void {
        if (this.scaledMaskCanvas.width !== width) this.scaledMaskCanvas.width = width;
        if (this.scaledMaskCanvas.height !== height) this.scaledMaskCanvas.height = height;

        if (this.layerCanvas.width !== width) this.layerCanvas.width = width;
        if (this.layerCanvas.height !== height) this.layerCanvas.height = height;
    }
}