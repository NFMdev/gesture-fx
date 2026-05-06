import type { Landmark, NormalizedLandmark } from "@mediapipe/tasks-vision";

export type BodyBounds = {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
};

export type DetectedBody = {
    landmarks: NormalizedLandmark[];
    worldLandmarks: Landmark[] | null;
    bounds: BodyBounds | null;
    confidence: number;
};

export type BodyDetectionResult = {
    bodies: DetectedBody[];
    primaryBody: DetectedBody | null;
    segmentationMasks: unknown[]; // unkown for initial phase, will be updated
    hasBody: boolean;
};