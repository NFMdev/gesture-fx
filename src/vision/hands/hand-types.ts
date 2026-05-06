import type { DrawingUtils, NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Gesture } from "../../types/gesture";
import type { HandDetector } from "./hands-detector";

export type HandSide = 'Left' | 'Right' | 'Unknown';

export type Point2D = {
    x: number,
    y: number
};

export type GestureAnalysis = {
    gesture: Gesture;
    intensity: number; // 0~1 range
};

export type DetectedHand = {
    landmarks: NormalizedLandmark[];
    side: HandSide;
    score: number | null;
    gesture: Gesture;
    gestureIntensity: number;
    indexTip: Point2D;
    middleTip: Point2D;
};

export type HandDetectionResult = {
    hands: DetectedHand[];
    activeGesture: Gesture;
    gestureIntensity: number;
    primaryHand: DetectedHand | null;
    hasHands: boolean;
}