import { PoseLandmarker, type DrawingUtils } from "@mediapipe/tasks-vision";
import type { BodyDetectionResult } from "../vision/body/body-types";

export function drawBodyDebug(
    drawingUtils: DrawingUtils,
    result: BodyDetectionResult
): void {
    for (const body of result.bodies) {
        drawingUtils.drawConnectors(
            body.landmarks,
            PoseLandmarker.POSE_CONNECTIONS,
            {
                color: '#00FFFF',
                lineWidth: 4,
            }
        );

        drawingUtils.drawLandmarks(body.landmarks, {
            color: '#FFAA00',
            lineWidth: 2,
            radius: 3,
        });
    }
}