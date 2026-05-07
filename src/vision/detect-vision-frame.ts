import type { VisionContext } from "./vision-context";
import type { VisionFrame } from "./vision-frame";

export function detectVisionFrame(
    context: VisionContext,
    timestamp: number
): VisionFrame {
    return {
        timestamp,
        bodyResult: context.bodyDetector.detect(context.video, timestamp),
        handsResult: context.handDetector.detect(context.video, timestamp)
    };
}