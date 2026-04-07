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
    const isIndexUp = landmarks[8].y < landmarks[6].y;
    const isMiddleUp = landmarks[12].y < landmarks[10].y;
    const isRingUp = landmarks[16].y < landmarks[14].y;
    const isPinkyUp = landmarks[20].y < landmarks[18].y;
    
    const upCount = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

    // 1. Palm (Toggle Recognition) - 4 fingers up
    if (upCount >= 4) return 'palm';

    // 2. Peace Sign (Salam) - 2 fingers up (Index & Middle)
    if (upCount === 2 && isIndexUp && isMiddleUp) return 'peace_sign';

    // 3. One Finger (Doodle) - 1 finger up (Index)
    if (upCount === 1 && isIndexUp) return 'one_finger';

    // 4. Thumb Up (Yes) - All fingers closed, thumb orientation check
    // Mediapipe landmarks: 4 is thumb tip, 3 is IP, 2 is MCP
    const isThumbUp = landmarks[4].y < landmarks[3].y && upCount === 0;
    if (isThumbUp) return 'thumb_up';

    return null;
  }
}
