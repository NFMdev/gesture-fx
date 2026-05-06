import { HandLandmarker, type DrawingUtils } from "@mediapipe/tasks-vision";
import type { HandDetectionResult } from "../hands/hand-types";

export function drawHandsDebug(
    drawingUtils: DrawingUtils,
    result: HandDetectionResult
): void {
    for (const hand of result.hands) {
        drawingUtils.drawConnectors(hand.landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5,
        });
        drawingUtils.drawLandmarks(hand.landmarks, { color: "#FF0000", lineWidth: 2 });
    }
}