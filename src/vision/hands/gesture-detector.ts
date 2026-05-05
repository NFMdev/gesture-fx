import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { GestureAnalysis } from "./hand-types";
import { Gestures } from "../../types/gesture";
import { clamp, distance, inverseLerp, toPoint2D } from "./gestures-calc";
import { HandConstants } from "../../../public/constants/hand-constants";

export function analyzeGesture(landmarks: NormalizedLandmark[]): GestureAnalysis {
    if (isPeaceSign(landmarks)) {
        return {
            gesture: Gestures.PeaceSign,
            intensity: getPeaceSignIntensity(landmarks)
        }
    }

    if (isOpenPalm(landmarks)) {
        return {
            gesture: Gestures.OpenPalm,
            intensity: 1
        }
    }

    return {
        gesture: Gestures.None,
        intensity: 0,
    }
}

export function selectActiveGesture(analyses: GestureAnalysis[]): GestureAnalysis {
    let strongest: GestureAnalysis = {
        gesture: Gestures.None,
        intensity: 0,
    };

    for (const analysis of analyses) {
        if (analysis.gesture === Gestures.None) continue;
        if (analysis.intensity > strongest.intensity) {
            strongest = analysis;
        }
    }

    return strongest;
}

function isPeaceSign(landmarks: NormalizedLandmark[]): boolean {
    const indexUp = isFingerUp(landmarks, HandConstants.INDEX_TIP, HandConstants.INDEX_PIP);
    const middleUp = isFingerUp(landmarks, HandConstants.MIDDLE_TIP, HandConstants.MIDDLE_PIP);

    const ringDown = isFingerDown(landmarks, HandConstants.RING_TIP, HandConstants.RING_PIP);
    const pinkyDown = isFingerDown(landmarks, HandConstants.PINKY_TIP, HandConstants.PINKY_PIP);

    return indexUp && middleUp && ringDown && pinkyDown;
}

function isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
    const indexUp = isFingerUp(landmarks, HandConstants.INDEX_TIP, HandConstants.INDEX_PIP);
    const middleUp = isFingerUp(landmarks, HandConstants.MIDDLE_TIP, HandConstants.MIDDLE_PIP);
    const ringUp = isFingerUp(landmarks, HandConstants.RING_TIP, HandConstants.RING_PIP);
    const pinkyUp = isFingerUp(landmarks, HandConstants.PINKY_TIP, HandConstants.PINKY_PIP);
    // Pending thumb;
    const thumbExtended = true;
    return indexUp && middleUp && ringUp && pinkyUp && thumbExtended;
}

function isFingerUp(landmarks: NormalizedLandmark[], tipIndex: number, pipIndex: number): boolean {
    return landmarks[tipIndex].y > landmarks[pipIndex].y;
}

function isFingerDown(landmarks: NormalizedLandmark[], tipIndex: number, pipIndex: number): boolean {
    return landmarks[tipIndex].y < landmarks[pipIndex].y;
}

function getPeaceSignIntensity(landmarks: NormalizedLandmark[]): number {
  const indexTip = toPoint2D(landmarks[HandConstants.INDEX_TIP]);
  const middleTip = toPoint2D(landmarks[HandConstants.MIDDLE_TIP]);

  const wrist = toPoint2D(landmarks[HandConstants.WRIST]);
  const palmCenter = toPoint2D(landmarks[HandConstants.PALM_CENTER]);

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

// function isPeaceSign(landmarks: NormalizedLandmark[]): boolean {
//   const pinkyUp = landmarks[8].y < landmarks[6].y;
//   const indexUp = landmarks[12].y < landmarks[10].y;
//   const otherFingersDown = (landmarks[14].y < landmarks[16].y) &&
//     (landmarks[18].y < landmarks[20].y) && (landmarks[2].x > landmarks[4].x);
//   return pinkyUp && indexUp && otherFingersDown;
// }