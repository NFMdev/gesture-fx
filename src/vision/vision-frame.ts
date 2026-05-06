import type { BodyDetectionResult } from "./body/body-types"
import type { HandDetectionResult } from "./hands/hand-types"

export type VisionFrame = {
    timestamp: number,
    body: BodyDetectionResult,
    hands: HandDetectionResult,
};