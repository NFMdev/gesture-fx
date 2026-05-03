import { DrawingUtils, FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Gestures, type Gesture } from "./types/gesture";
import type { VisionContext } from "./types/vision-context";
import type { RuntimeState } from "./types/runtime-state";
import { clamp, distance, inverseLerp } from "./gestures-calc";


let visionContextPromise: Promise<VisionContext> | null = null;
const runtimeState: RuntimeState = {
  activeGesture: Gestures.None,
  previousGesture: Gestures.None
}
let currentBlur = 0;

async function getVisionContext(): Promise<VisionContext> {
  if (!visionContextPromise) {
    visionContextPromise = (async () => {
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

      return {
        recognizer: handLandmarker,
        video,
        canvas,
        ctx,
        drawingUtils: new DrawingUtils(ctx),
      };
    })();
  }

  return visionContextPromise;
}

export async function render() {
  const { recognizer: handLandmarker, video, canvas, ctx, drawingUtils } = await getVisionContext();

  canvas.width = video.videoWidth || video.width;
  canvas.height = video.videoHeight || video.height;

  const detections = handLandmarker.detectForVideo(video, performance.now());

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.filter = `blur(${currentBlur}px)`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.restore();

  if (detections.landmarks) {
    for (const landmarks of detections.landmarks) {
      drawLandmarks(drawingUtils, landmarks);
      const detectedGesture = detectActiveGesture(landmarks);
      if (runtimeState.activeGesture !== detectedGesture) {
        runtimeState.previousGesture = runtimeState.activeGesture;
        runtimeState.activeGesture = detectedGesture;
      }

      switch (runtimeState.activeGesture) {
        case Gestures.PeaceSign:
          updateBlurFromPeaceSign(landmarks);
          break;

        default:
          break;
      }
    }
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

function isPeaceSign(landmarks: NormalizedLandmark[]): boolean {
  const pinkyUp = landmarks[8].y < landmarks[6].y;
  const indexUp = landmarks[12].y < landmarks[10].y;
  const otherFingersDown = (landmarks[14].y < landmarks[16].y) &&
    (landmarks[18].y < landmarks[20].y) && (landmarks[2].x > landmarks[4].x);
  return pinkyUp && indexUp && otherFingersDown;
}

function detectActiveGesture(landmarks: NormalizedLandmark[]): Gesture {
  if (isPeaceSign(landmarks)) {
    return Gestures.PeaceSign;
  }
  return Gestures.None;
}

function updateBlurFromPeaceSign(landmarks: NormalizedLandmark[]) {
  const targetBlur = getBlurIntensity(landmarks) * 10;
  currentBlur += (targetBlur - currentBlur) * 0.15;
}

function getBlurIntensity(landmarks: NormalizedLandmark[]): number {

  const indexTip = landmarks[8];
  const middleTip = landmarks[12];

  const wrist = landmarks[0];
  const palmCenter = landmarks[9];

  const fingerDistance = distance(indexTip, middleTip);
  const handScale = distance(wrist, palmCenter);

  if (handScale === 0) return 0;

  const normalizedSeparation = fingerDistance / handScale;

  const minSeparation = 0.10; // fingers practically together
  const maxSeparation = 0.40; // fingers practically separated
  const separationProgress = inverseLerp(minSeparation, maxSeparation, normalizedSeparation);
  const blurIntensity = 1 - separationProgress;

  return clamp(blurIntensity, 0, 1);
}