import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { GestureAnalysis } from "./hand-types";
import { Gestures } from "../../types/gesture";
import { clamp, distance, inverseLerp, toPoint2D } from "./gestures-calc";

const INDEX_TIP = 8;
const INDEX_PIP = 6;

const MIDDLE_TIP = 12;
const MIDDLE_PIP = 10;

const RING_TIP = 16;
const RING_PIP = 14;

const PINKY_TIP = 20;
const PINKY_PIP = 18;

const THUMB_TIP = 4;
const THUMB_IP = 3;

const WRIST = 0;
const PALM_CENTER = 9;

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
    const indexUp = isFingerUp(landmarks, INDEX_TIP, INDEX_PIP);
    const middleUp = isFingerUp(landmarks, MIDDLE_TIP, MIDDLE_PIP);

    const ringDown = isFingerDown(landmarks, RING_TIP, RING_PIP);
    const pinkyDown = isFingerDown(landmarks, PINKY_TIP, PINKY_PIP);

    return indexUp && middleUp && ringDown && pinkyDown;
}

function isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
    const indexUp = isFingerUp(landmarks, INDEX_TIP, INDEX_PIP);
    const middleUp = isFingerUp(landmarks, MIDDLE_TIP, MIDDLE_PIP);
    const ringUp = isFingerUp(landmarks, RING_TIP, RING_PIP);
    const pinkyUp = isFingerUp(landmarks, PINKY_TIP, PINKY_PIP);
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
  const indexTip = toPoint2D(landmarks[INDEX_TIP]);
  const middleTip = toPoint2D(landmarks[MIDDLE_TIP]);

  const wrist = toPoint2D(landmarks[WRIST]);
  const palmCenter = toPoint2D(landmarks[PALM_CENTER]);

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