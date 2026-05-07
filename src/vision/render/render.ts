import { BodyMaskRender } from "../body/body-mask-render";
import { detectVisionFrame } from "../detect-vision-frame";
import { getVisionContext } from "../vision-context";
import { drawBodyDebug } from "./draw-body-debug";
import { drawHandsDebug } from "./draw-hands-debug";

let currentBlur = 0;

const bodyMaskRender = new BodyMaskRender({
  threshold: 0.45,
  alpha: 0.75,
});

export async function render() {
  const context = await getVisionContext();
  const { video, canvas, ctx, drawingUtils } = context;

  resizeCanvasToVideo(canvas, video);

  const timestamp = performance.now();
  const frame = detectVisionFrame(context, timestamp);

  const targetBlur = frame.handsResult.gestureIntensity * 5;
  currentBlur += (targetBlur - currentBlur) * 0.15;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.filter = `blur(${currentBlur}px)`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (frame.bodyResult.segmentationMask) {
    bodyMaskRender.drawMaskOverlay(
      ctx,
      frame.bodyResult.segmentationMask,
      canvas.width,
      canvas.height
    );
  }

  drawBodyDebug(drawingUtils, frame.bodyResult);
  drawHandsDebug(drawingUtils, frame.handsResult);

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