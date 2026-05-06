import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { BodyBounds } from "./body-types";

export function computeBodyBounds(
    landmarks: NormalizedLandmark[],
    minVisibility = 0.35
): BodyBounds | null {
    const visibleLandmarks = landmarks.filter((landmark) => {
        const visibility = landmark.visibility ?? 1;
        return visibility >= minVisibility;
    });

    const points = visibleLandmarks.length > 0 ? visibleLandmarks : landmarks;

    if (points.length === 0) return null;

    let xMin = Number.POSITIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;

    for (const point of points) {
        xMin = Math.min(xMin, point.x);
        yMin = Math.min(yMin, point.y);
        xMax = Math.max(xMax, point.x);
        yMax = Math.max(yMax, point.y);
    }
    
    return {
        xMin,
        yMin,
        xMax,
        yMax,
        width: xMax - xMin,
        height: yMax - yMin,
        centerX: xMin + (xMax - xMin) / 2,
        centerY: yMin + (yMax - yMin) / 2,
    };
}

export function computeBodyConfidence(
    landmarks: NormalizedLandmark[]
): number {
    if (landmarks.length === 0) return 0;

    const totalVisibility = landmarks.reduce((sum, landmark) => {
        return sum + (landmark.visibility ?? 1);
    }, 0);

    return totalVisibility / landmarks.length;
}

export function getBoundsArea(bounds: BodyBounds | null): number {
    if (!bounds) return 0;

    return bounds.width * bounds.height;
}