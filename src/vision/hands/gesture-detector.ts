import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { GestureAnalysis } from "./hand-types";
import { Gestures } from "../../types/gesture";
import { clamp, distance, inverseLerp, toPoint2D } from "./gestures-calc";
import { HandLandmarkIndex } from "../../constants/hand-constants";

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
    const indexUp = isFingerUp(landmarks, HandLandmarkIndex.indexTip, HandLandmarkIndex.indexPip);
    const middleUp = isFingerUp(landmarks, HandLandmarkIndex.middleTip, HandLandmarkIndex.middlePip);

    const ringDown = isFingerDown(landmarks, HandLandmarkIndex.ringTip, HandLandmarkIndex.ringPip);
    const pinkyDown = isFingerDown(landmarks, HandLandmarkIndex.pinkyTip, HandLandmarkIndex.pinkyPip);

    return indexUp && middleUp && ringDown && pinkyDown;
}

function isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
    const indexUp = isFingerUp(landmarks, HandLandmarkIndex.indexTip, HandLandmarkIndex.indexPip);
    const middleUp = isFingerUp(landmarks, HandLandmarkIndex.middleTip, HandLandmarkIndex.middlePip);
    const ringUp = isFingerUp(landmarks, HandLandmarkIndex.ringTip, HandLandmarkIndex.ringPip);
    const pinkyUp = isFingerUp(landmarks, HandLandmarkIndex.pinkyTip, HandLandmarkIndex.pinkyPip);
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
  const indexTip = toPoint2D(landmarks[HandLandmarkIndex.indexTip]);
  const middleTip = toPoint2D(landmarks[HandLandmarkIndex.middleTip]);

  const wrist = toPoint2D(landmarks[HandLandmarkIndex.wrist]);
  const palmCenter = toPoint2D(landmarks[HandLandmarkIndex.palmCenter]);

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