import type { HandLandmarker } from "@mediapipe/tasks-vision";
import type { HandDetector } from "./hands-detector";
import type { DetectedHand, HandDetectionResult, HandSide } from "./hand-types";
import { analyzeGesture, selectActiveGesture } from "./gesture-detector";
import { toPoint2D } from "./gestures-calc";
import { HandConstants } from "../../../public/constants/hand-constants";
import { Gestures } from "../../types/gesture";

type MediaPipeHandDetectorOptions = {
    minGestureIntensity?: number;
}

export class MediaPipeHandDetector implements HandDetector {
    private readonly handLandmarker: HandLandmarker;
    private readonly minGestureIntensity: number;

    constructor(
        handLandmarker: HandLandmarker,
        options: MediaPipeHandDetectorOptions = {}
    ) {
        this.handLandmarker = handLandmarker;
        this.minGestureIntensity = options.minGestureIntensity ?? 0.05;
    }

    detect(video: HTMLVideoElement, timestamp: number): HandDetectionResult {
        if (!isVideoReady(video)) return emptyHandDetectionResult();

        const result = this.handLandmarker.detectForVideo(video, timestamp);

        const rawHands = result.landmarks ?? [];

        if (rawHands.length === 0) return emptyHandDetectionResult();

        const hands: DetectedHand[] = rawHands.map((landmarks, index) => {
            const gestureAnalysis = analyzeGesture(landmarks);

            return {
                landmarks,
                side: readHandSide(result, index),
                score: readHandScore(result, index),
                gesture: gestureAnalysis.gesture,
                gestureIntensity: gestureAnalysis.intensity >= this.minGestureIntensity ? gestureAnalysis.intensity : 0,
                indexTip: toPoint2D(landmarks[HandConstants.INDEX_TIP]),
                middleTip: toPoint2D(landmarks[HandConstants.MIDDLE_TIP])
            };
        });

        const activeGestureAnalysis = selectActiveGesture(
            hands.map((hand) => ({
                gesture: hand.gesture,
                intensity: hand.gestureIntensity
            }))
        );

        const primaryHand = hands.find(
            (hand) => hand.gesture === activeGestureAnalysis.gesture &&
                hand.gestureIntensity === activeGestureAnalysis.intensity
        ) ?? hands[0] ?? null;

        return {
            hands,
            activeGesture: activeGestureAnalysis.gesture,
            gestureIntensity: activeGestureAnalysis.intensity,
            primaryHand,
            hasHands: hands.length > 0,
        };
    }
}

function emptyHandDetectionResult(): HandDetectionResult {
    return {
        hands: [],
        activeGesture: Gestures.None,
        gestureIntensity: 0,
        primaryHand: null,
        hasHands: false,
    };
}

function isVideoReady(video: HTMLVideoElement): boolean {
    return (
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
    );
}

function readHandSide(result: unknown, index: number): HandSide {
    const handedness = readCategory(result, index);

    if (handedness?.categoryName === 'left') return 'Left';
    if (handedness?.categoryName === 'right') return 'Right';
    return 'Unknown';
}

function readHandScore(result: unknown, index: number): number | null {
    const handedness = readCategory(result, index);

    return typeof handedness?.score === 'number' ? handedness.score : null;
}

function readCategory(result: unknown, index: number): {
    categoryName?: string,
    score?: number
} | null {
    if (!isObject(result)) return null;

    const handedness = result['handedness'];
    if (!Array.isArray(handedness)) return null;

    const categories = handedness[index];
    if (!Array.isArray(categories)) return null;

    const firstCategory = categories[0];
    if (!isObject(firstCategory)) return null;

    return firstCategory as { categoryName?: string; score?: number };
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}