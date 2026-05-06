import type { VisionContext } from "./vision-context";
import type { VisionFrame } from "./vision-frame";

export function detectVisionFrame(
    context: VisionContext,
    timestamp: number
): VisionFrame {
    return {
        timestamp,
        body: context.bodyDetector.detect(context.video, timestamp),
        hands: context.handDetector.detect(context.video, timestamp)
    };
}