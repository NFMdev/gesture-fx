import type { HandDetectionResult } from "./hand-types";

export interface HandDetector {
    detect(video: HTMLVideoElement, timestamp: number): HandDetectionResult;
}