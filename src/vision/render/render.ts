import { detectVisionFrame } from "../detect-vision-frame";
import { getVisionContext } from "../vision-context";
import { drawBodyDebug } from "./draw-body-debug";
import { drawHandsDebug } from "./draw-hands-debug";

let currentBlur = 0;

export async function render() {
  const context = await getVisionContext();
  const { video, canvas, ctx, drawingUtils } = context;

  resizeCanvasToVideo(canvas, video);

  const timestamp = performance.now();
  const frame = detectVisionFrame(context, timestamp);

  const targetBlur = frame.hands.gestureIntensity * 5;
  currentBlur += (targetBlur - currentBlur) * 0.15;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.filter = `blur(${currentBlur}px)`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  drawBodyDebug(drawingUtils, frame.body);
  drawHandsDebug(drawingUtils, frame.hands);

  requestAnimationFrame(() => {
    void render();
  });
}

function resizeCanvasToVideo(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
): void {
    const width = video.videoWidth || video.width;
    const height = video.videoHeight || video.height;

    if (width === 0 || height === 0) return;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
}