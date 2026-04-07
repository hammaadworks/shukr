export class FaceGestureRecognizer {
  /**
   * Detects face-based gestures (e.g., mouth open)
   * @param results MediaPipe FaceLandmarkerResult (any for vite compat)
   * @returns Gesture key string or null
   */
  static detectGesture(results: any): string | null {
    if (!results.faceBlendshapes || results.faceBlendshapes.length === 0) return null;

    const shapes = results.faceBlendshapes[0].categories;
    const jawOpen = shapes.find((b: any) => b.categoryName === 'jawOpen')?.score || 0;

    // Mouth Open (Speak)
    if (jawOpen > 0.45) {
      return 'mouth_open';
    }

    return null;
  }
}
