import { BodyMaskCompositor } from "./body-mask-compositor";
import { detectVisionFrame } from "../vision/detect-vision-frame";
import { getVisionContext } from "../vision/vision-context";
import { drawBodyDebug } from "./draw-body-debug";
import { drawHandsDebug } from "./draw-hands-debug";
import { drawBodyReplacementDemo } from "./draw-body-replacement-demo";

let currentBlur = 0;

const bodyMaskCompositor = new BodyMaskCompositor({
  threshold: 0.45,
  alpha: 1,
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

  // 1. Draw base video
  ctx.save();
  ctx.filter = `blur(${currentBlur}px)`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  // 2. If Exists Body Mask -> Update
  if (frame.bodyResult.segmentationMask) {
    bodyMaskCompositor.updateMask(
      frame.bodyResult.segmentationMask,
      canvas.width,
      canvas.height
    );

    // 3. Remove real body
    bodyMaskCompositor.cutOutBody(ctx, canvas.width, canvas.height);

    // 4. Draw body effect
    bodyMaskCompositor.drawMaskedLayer(
      ctx,
      canvas.width,
      canvas.height,
      (layerCtx, width, height) => {
        drawBodyReplacementDemo(layerCtx, width, height, timestamp);
      }
    );
  }

  // 5. Debug overlays
  drawBodyDebug(drawingUtils, frame.bodyResult);
  drawHandsDebug(drawingUtils, frame.handsResult);

  // 6. Free current frame mask
  frame.bodyResult.segmentationMask?.close();

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