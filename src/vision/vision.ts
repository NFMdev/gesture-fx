import { DrawingUtils, FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { VisionContext } from "./hands/hand-types";
import { MediaPipeHandDetector } from "./hands/media-pipe-hand-detector";


let visionContextPromise: Promise<VisionContext> | null = null;
let currentBlur = 0;

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
    },
    numHands: 2,
    runningMode: 'VIDEO'
  });

  const handDetector = new MediaPipeHandDetector(handLandmarker);

  return {
    video,
    canvas,
    ctx,
    drawingUtils: new DrawingUtils(ctx),
    handDetector
  };
}

export async function render() {
  const { video, canvas, ctx, drawingUtils, handDetector } = await getVisionContext();

  canvas.width = video.videoWidth || video.width;
  canvas.height = video.videoHeight || video.height;

  const handDetection = handDetector.detect(video, performance.now());

  const targetBlur = handDetection.gestureIntensity * 5;
  currentBlur += (targetBlur - currentBlur) * 0.15;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = `blur(${currentBlur}px)`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.restore();

  for (const hand of handDetection.hands) {
    drawLandmarks(drawingUtils, hand.landmarks);
  }

  requestAnimationFrame(() => {
    void render();
  });
}

function drawLandmarks(drawingUtils: DrawingUtils, landmarks: NormalizedLandmark[]) {
  drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 5,
  });
  drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 2 });
}