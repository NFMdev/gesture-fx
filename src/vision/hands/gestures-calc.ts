import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Point2D } from "./hand-types";

export function toPoint2D(landmark: NormalizedLandmark): Point2D {
    return {
        x: landmark.x,
        y: landmark.y
    };
}

export function distance(a: Point2D, b: Point2D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function inverseLerp(min: number, max: number, value: number): number {
    if (min === max) return 0;
    return clamp((value - min) / (max - min), 0, 1);
}