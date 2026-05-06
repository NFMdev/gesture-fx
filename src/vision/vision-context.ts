import { DrawingUtils, FilesetResolver, HandLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import { MediaPipeHandDetector } from "./hands/media-pipe-hand-detector";
import type { HandDetector } from "./hands/hands-detector";
import type { BodyDetector } from "./body/body-detector";
import { MediaPipeBodyDetector } from "./body/media-pipe-body-detector";

export type VisionContext = {
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawingUtils: DrawingUtils;
  handDetector: HandDetector;
  bodyDetector: BodyDetector;
};

let visionContextPromise: Promise<VisionContext> | null = null;

export function getVisionContext(): Promise<VisionContext> {
  if (!visionContextPromise) visionContextPromise = createVisionContext();
  return visionContextPromise;
}

async function createVisionContext(): Promise<VisionContext> {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");

  if (!(video instanceof HTMLVideoElement)) {
    throw new Error('Missing <video id="video"> element');
  }

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('Missing <canvas id="canvas"> element');
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create a 2D canvas context");
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
  );

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    numHands: 2,
    runningMode: 'VIDEO'
  });

  const bodyLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
      delegate: "GPU"
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: true,
  });


  return {
    video,
    canvas,
    ctx,
    drawingUtils: new DrawingUtils(ctx),
    handDetector: new MediaPipeHandDetector(handLandmarker),
    bodyDetector: new MediaPipeBodyDetector(bodyLandmarker),
  };
}