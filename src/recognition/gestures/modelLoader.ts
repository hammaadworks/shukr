import { FaceLandmarker, HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class GestureModelLoader {
  private static instance: GestureModelLoader;
  private faceLandmarker: FaceLandmarker | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private isLoaded = false;
  private loadingPromise: Promise<{ face: FaceLandmarker; hand: HandLandmarker }> | null = null;

  private constructor() {}

  static getInstance(): GestureModelLoader {
    if (!GestureModelLoader.instance) {
      GestureModelLoader.instance = new GestureModelLoader();
    }
    return GestureModelLoader.instance;
  }

  async loadModels(): Promise<{ face: FaceLandmarker; hand: HandLandmarker }> {
    if (this.isLoaded && this.faceLandmarker && this.handLandmarker) {
      return { face: this.faceLandmarker, hand: this.handLandmarker };
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = (async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm'
        );

        const [face, hand] = await Promise.all([
          FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU'
            },
            outputFaceBlendshapes: true,
            runningMode: 'VIDEO',
            numFaces: 1
          }),
          HandLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numHands: 1
          })
        ]);

        this.faceLandmarker = face;
        this.handLandmarker = hand;
        this.isLoaded = true;
        this.loadingPromise = null;
        return { face, hand };
      } catch (error) {
        this.loadingPromise = null;
        console.error('[GestureModelLoader] Failed to load models:', error);
        throw error;
      }
    })();

    return this.loadingPromise;
  }

  getModels() {
    return { face: this.faceLandmarker, hand: this.handLandmarker, isLoaded: this.isLoaded };
  }

  async closeModels() {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.isLoaded = false;
    this.loadingPromise = null;
    console.log('[GestureModelLoader] Models closed and memory freed');
  }
}
