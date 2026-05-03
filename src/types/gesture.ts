export const Gestures = {
    OpenPalm: 'OPEN_PALM',
    Four: 'FOUR',
    Three: 'THREE',
    PeaceSign: 'PEACE_SIGN',
    Pistol: 'PISTOL',
    Pinch: 'PINCH',
    ThumbUp: 'THUMB_UP',
    None: 'NONE'
};

export type Gesture = typeof Gestures[keyof typeof Gestures];