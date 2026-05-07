import type { BodyDetectionResult } from "./body/body-types"
import type { HandDetectionResult } from "./hands/hand-types"

export type VisionFrame = {
    timestamp: number,
    bodyResult: BodyDetectionResult,
    handsResult: HandDetectionResult,
};