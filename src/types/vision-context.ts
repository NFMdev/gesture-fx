import type { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";

export type VisionContext = {
  recognizer: HandLandmarker;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawingUtils: DrawingUtils;
};