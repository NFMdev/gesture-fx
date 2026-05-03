import type { Gesture } from "./gesture";

export type RuntimeState = {
  activeGesture: Gesture;
  previousGesture: Gesture;
}