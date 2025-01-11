export class HandGestureRecognizer {
  /**
   * Detects gesture from hand landmarks
   * @param results MediaPipe HandLandmarkerResult (any for type safety/vite compat)
   * @returns Gesture key string or null
   */
  static detectGesture(results: any): string | null {
    if (!results.landmarks || results.landmarks.length === 0) return null;

    const landmarks = results.landmarks[0];
    
    // Check which fingers are up
    const isThumbUp = landmarks[4].y < landmarks[3].y && landmarks[3].y < landmarks[2].y;
    const isIndexUp = landmarks[8].y < landmarks[6].y;
    const isMiddleUp = landmarks[12].y < landmarks[10].y;
    const isRingUp = landmarks[16].y < landmarks[14].y;
    const isPinkyUp = landmarks[20].y < landmarks[18].y;
    
    const upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

    // 1. Palm (Clear/Home) - All 4 main fingers up + thumb
    if (upCount >= 3 && isThumbUp) return 'palm';

    // 2. One Finger (Next) - ONLY Index up
    if (upCount === 1 && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return 'one_finger';

    // 3. Fist (Yes) - All fingers down, including thumb
    if (upCount === 0 && !isThumbUp) return 'fist';

    return null;
  }
}
