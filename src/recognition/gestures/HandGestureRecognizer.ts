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

    // 1. Palm (Clear/Home) - All 5 fingers MUST be up clearly
    if (upCount === 4 && isThumbUp) return 'palm';

    // 2. Peace Sign (Salam) - Exactly Index & Middle up, others down
    if (upCount === 2 && isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) return 'peace_sign';

    // 3. Thumb Up (Yes/Select fallback) - Only thumb up
    if (isThumbUp && upCount === 0) return 'thumb_up';

    // 4. Three Fingers (Doodle) - Index, Middle, Ring up
    if (upCount === 3 && isIndexUp && isMiddleUp && isRingUp && !isPinkyUp) return 'three_fingers';

    // 5. Two Fingers (Prev) - Index and Middle (already handled by peace_sign, but as fallback)
    if (upCount === 2 && isIndexUp && isMiddleUp) return 'two_fingers';

    // 6. One Finger (Next) - ONLY Index up
    if (upCount === 1 && isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return 'one_finger';

    // 7. Fist (Select) - All fingers down, including thumb
    if (upCount === 0 && !isThumbUp) {
      // Ensure it's actually a hand by checking landmarks distance or just rely on MP
      return 'fist';
    }

    return null;
  }
}
