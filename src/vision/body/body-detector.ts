import type { BodyDetectionResult } from "./body-types";

export interface BodyDetector {
    detect(video: HTMLVideoElement, timestamp: number): BodyDetectionResult;
}