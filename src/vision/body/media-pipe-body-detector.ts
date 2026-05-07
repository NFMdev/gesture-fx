import type { Landmark, MPMask, NormalizedLandmark, PoseLandmarker } from "@mediapipe/tasks-vision";
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

        const bodies: DetectedBody[] = bodyLandmarks.map((landmarks, index) => {
            const world = worldLandmarks[index] ?? null;
            return createBody(landmarks, world);
        });
        const primaryBody = selectPrimaryBody(bodies);
        const segmentationMask = readPrimarySegmentationMask(result);

        return {
            bodies,
            primaryBody,
            segmentationMask,
            hasBody: bodies.length > 0,
            hasSegmenntationMask: segmentationMask !== null,
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
        segmentationMask: null,
        hasBody: false,
        hasSegmenntationMask: false,
    };
}

function isVideoReady(video: HTMLVideoElement): boolean {
    return (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
    );
}

function readPrimarySegmentationMask(result: { segmentationMasks?: MPMask[]  }): MPMask | null {
    return result.segmentationMasks?.[0] ?? null;
}