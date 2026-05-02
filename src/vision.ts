import { DrawingUtils, FilesetResolver, HandLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";

type VisionContext = {
  handLandmarker: HandLandmarker;
  video: HTMLVideoElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  drawingUtils: DrawingUtils;
};

let visionContextPromise: Promise<VisionContext> | null = null;

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
      });

      await handLandmarker.setOptions({ runningMode: "VIDEO" });

      return {
        handLandmarker,
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
  const { handLandmarker, video, canvas, ctx, drawingUtils } = await getVisionContext();

  canvas.width = video.videoWidth || video.width;
  canvas.height = video.videoHeight || video.height;

  const detections = handLandmarker.detectForVideo(video, performance.now());

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const shouldBlur = detections.landmarks?.some((landmarks) => isPeaceSign(landmarks)) ?? false;

  ctx.save();

  ctx.filter = shouldBlur ? 'blur(5px)' : 'none';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.restore();

  if (detections.landmarks) {
    for (const landmarks of detections.landmarks) {
      drawLandmarks(drawingUtils, landmarks);
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