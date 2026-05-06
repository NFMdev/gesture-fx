import type { Landmark, NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import type { BodyDetector } from "./body-detector";
import type { BodyDetectionResult, DetectedBody } from "./body-types";
import { computeBodyBounds, computeBodyConfidence, getBoundsArea } from "./body-calc";

export class MediaPipeBodyDetector implements BodyDetector {
    private readonly bodyLandmarker: PoseLandmarker; 

    constructor(bodyLandmarker: PoseLandmarker) {
        this.bodyLandmarker = bodyLandmarker;
    }

    detect(video: HTMLVideoElement, timestamp: number): BodyDetectionResult {
        if (!isVideoReady(video)) return emptyBodyDetectionResult();

        const result = this.bodyLandmarker.detectForVideo(video, timestamp);

        const bodyLandmarks = result.landmarks ?? [];
        const worldLandmarks = result.worldLandmarks ?? [];

        if (bodyLandmarks.length === 0) {
            closeSegmentationMask(result);
            return emptyBodyDetectionResult();
        }

        const bodies: DetectedBody[] = bodyLandmarks.map((landmarks, index) => {
            const world = worldLandmarks[index] ?? null;
            
            return createBody(landmarks, world);
        });
        const primaryBody = selectPrimaryBody(bodies);
        
        const segmentationMasks = readSegmentationMasks(result);

        return {
            bodies,
            primaryBody,
            segmentationMasks,
            hasBody: bodies.length > 0,
        };
    }
}

function createBody(
    landmarks: NormalizedLandmark[],
    worldLandmarks: Landmark[] | null
): DetectedBody {
    const bounds = computeBodyBounds(landmarks);
    const confidence = computeBodyConfidence(landmarks);

    return {
        landmarks,
        worldLandmarks,
        bounds,
        confidence,
    };
}

function selectPrimaryBody(bodies: DetectedBody[]): DetectedBody | null {
    if (bodies.length === 0) return null;

    return bodies.reduce((best, current) => {
        const bestScore = scoreBody(best);
        const currentScore = scoreBody(current);

        return currentScore > bestScore ? current : best;
    });
}

function scoreBody(body: DetectedBody) {
    const boundsArea = getBoundsArea(body.bounds);

    return body.confidence * 0.7 + boundsArea * 0.3;
}

function emptyBodyDetectionResult(): BodyDetectionResult {
    return {
        bodies: [],
        primaryBody: null,
        segmentationMasks: [],
        hasBody: false,
    };
}

function isVideoReady(video: HTMLVideoElement): boolean {
    return (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
    );
}

function readSegmentationMasks(result: unknown): unknown[] {
    if (!isObject(result)) return [];

    const masks = result['segmentationMasks'];
    return Array.isArray(masks) ? masks : [];
}

function closeSegmentationMask(result: unknown): void {
    const masks = readSegmentationMasks(result);

    for (const mask of masks) {
        if (isObject(mask) && typeof mask['close'] === 'function') {
            mask['close']();
        }
    }
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}