export const HandLandmarkIndex = {
    indexTip: 8,
    indexPip: 6,
    middleTip: 12,
    middlePip: 10,
    ringTip: 16,
    ringPip: 14,
    pinkyTip: 20,
    pinkyPip: 18,
    thumbTip: 4,
    thumbIp: 3,
    wrist: 0,
    palmCenter: 9
} as const;

export type HandLandmarkName = keyof typeof HandLandmarkIndex;