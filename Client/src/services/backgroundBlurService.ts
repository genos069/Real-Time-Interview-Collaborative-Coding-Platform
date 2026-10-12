/**
 * Background Blur Service using MediaPipe Selfie Segmentation.
 * Performs real-time person segmentation and background-only blur compositing on canvas,
 * producing a MediaStreamTrack that can be transmitted over WebRTC and displayed locally.
 */

let scriptLoadingPromise: Promise<void> | null = null;

/**
 * Dynamically loads the MediaPipe SelfieSegmentation runtime script.
 * Tries local static assets first (/mediapipe/selfie_segmentation.js), falling back to CDN.
 */
export function loadMediaPipeSelfieSegmentation(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window is not available"));
  }
  if ((window as any).SelfieSegmentation) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/mediapipe/selfie_segmentation.js";
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => {
      if ((window as any).SelfieSegmentation) {
        resolve();
      } else {
        fallbackToCDN();
      }
    };

    script.onerror = () => {
      fallbackToCDN();
    };

    function fallbackToCDN() {
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
      cdnScript.async = true;
      cdnScript.crossOrigin = "anonymous";

      cdnScript.onload = () => {
        if ((window as any).SelfieSegmentation) {
          resolve();
        } else {
          scriptLoadingPromise = null;
          reject(new Error("MediaPipe SelfieSegmentation not found after CDN load"));
        }
      };

      cdnScript.onerror = (err) => {
        scriptLoadingPromise = null;
        reject(new Error("Failed to load MediaPipe SelfieSegmentation from local and CDN: " + err));
      };

      document.head.appendChild(cdnScript);
    }

    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

export interface BlurProcessorOptions {
  blurRadius?: number;
  onReady?: (processedStream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export class BackgroundBlurProcessor {
  private sourceVideo: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private personCanvas: HTMLCanvasElement | null = null;
  private personCtx: CanvasRenderingContext2D | null = null;
  private segmenter: any = null;
  private processedStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isProcessingFrame: boolean = false;
  private blurRadius: number = 18;
  private options: BlurProcessorOptions;
  private hasReportedReady: boolean = false;

  constructor(options?: BlurProcessorOptions) {
    this.options = options || {};
    this.blurRadius = options?.blurRadius ?? 18;
  }

  /**
   * Initializes the segmentation pipeline with a camera MediaStream.
   */
  public async start(cameraStream: MediaStream): Promise<MediaStream> {
    this.stop();
    this.isRunning = true;
    this.hasReportedReady = false;

    try {
      // 1. Ensure runtime script is loaded
      await loadMediaPipeSelfieSegmentation();

      const SelfieSegmentationClass = (window as any).SelfieSegmentation;
      if (!SelfieSegmentationClass) {
        throw new Error("SelfieSegmentation constructor not available");
      }

      // 2. Set up hidden video element to feed camera frames
      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = cameraStream;
      video.style.position = "fixed";
      video.style.top = "-9999px";
      video.style.left = "-9999px";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      document.body.appendChild(video);
      this.sourceVideo = video;

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            resolve();
          } else {
            reject(new Error("Timeout waiting for camera video dimensions"));
          }
        }, 5000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          video.play().then(() => resolve()).catch(reject);
        };
      });

      if (!this.isRunning) {
        this.stop();
        throw new Error("Processor stopped during initialization");
      }

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      // 3. Set up main output canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      this.canvas = canvas;
      const ctx = canvas.getContext("2d", { willReadFrequently: false });
      if (!ctx) throw new Error("Could not acquire 2D context from canvas");
      this.ctx = ctx;

      // 4. Set up offscreen person canvas for alpha compositing
      const personCanvas = document.createElement("canvas");
      personCanvas.width = width;
      personCanvas.height = height;
      this.personCanvas = personCanvas;
      const personCtx = personCanvas.getContext("2d");
      if (!personCtx) throw new Error("Could not acquire 2D context from offscreen canvas");
      this.personCtx = personCtx;

      // 5. Initialize MediaPipe Selfie Segmentation
      this.segmenter = new SelfieSegmentationClass({
        locateFile: (file: string) => `/mediapipe/${file}`,
      });

      this.segmenter.setOptions({
        modelSelection: 1, // 1 = landscape selfie model (optimized for video-conferencing)
        selfieMode: false,
      });

      this.segmenter.onResults((results: any) => {
        this.handleResults(results);
      });

      // 6. Capture processed video stream from canvas at 30 fps
      const captureStream = canvas.captureStream(30);
      this.processedStream = captureStream;

      // 7. Start processing loop
      this.startLoop();

      return captureStream;
    } catch (err: any) {
      this.stop();
      const error = err instanceof Error ? err : new Error(String(err));
      this.options.onError?.(error);
      throw error;
    }
  }

  /**
   * Animation frame processing loop.
   */
  private startLoop() {
    const loop = async () => {
      if (!this.isRunning || !this.sourceVideo || !this.segmenter) {
        return;
      }

      const video = this.sourceVideo;
      if (
        video.readyState >= 2 &&
        !video.paused &&
        !video.ended &&
        !this.isProcessingFrame
      ) {
        this.isProcessingFrame = true;
        try {
          await this.segmenter.send({ image: video });
        } catch (e) {
          console.warn("SelfieSegmentation inference frame warning:", e);
        } finally {
          this.isProcessingFrame = false;
        }
      }

      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    if (this.sourceVideo) {
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  /**
   * Compositing callback: renders blurred background + sharp person using the segmentation mask.
   */
  private handleResults(results: any) {
    if (!this.isRunning || !this.ctx || !this.canvas || !this.personCanvas || !this.personCtx) {
      return;
    }

    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const personCanvas = this.personCanvas;
    const personCtx = this.personCtx;
    const image = results.image;
    const mask = results.segmentationMask;

    if (!image || !mask) return;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Draw strongly blurred background behind the person
    ctx.filter = `blur(${this.blurRadius}px)`;
    ctx.drawImage(image, 0, 0, width, height);
    ctx.filter = "none";

    // 2. Isolate sharp person using the segmentation mask on the offscreen canvas
    personCtx.clearRect(0, 0, width, height);
    personCtx.drawImage(mask, 0, 0, width, height);
    personCtx.globalCompositeOperation = "source-in";
    personCtx.drawImage(image, 0, 0, width, height);
    personCtx.globalCompositeOperation = "source-over";

    // 3. Composite sharp person on top of the blurred background
    ctx.drawImage(personCanvas, 0, 0, width, height);
    ctx.restore();

    if (!this.hasReportedReady && this.processedStream) {
      this.hasReportedReady = true;
      this.options.onReady?.(this.processedStream);
    }
  }

  /**
   * Returns the processed MediaStream, if running.
   */
  public getProcessedStream(): MediaStream | null {
    return this.processedStream;
  }

  /**
   * Stops the background blur processor and releases all resources.
   */
  public stop() {
    this.isRunning = false;
    this.isProcessingFrame = false;
    this.hasReportedReady = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.sourceVideo) {
      this.sourceVideo.pause();
      this.sourceVideo.srcObject = null;
      this.sourceVideo.remove();
      this.sourceVideo = null;
    }

    if (this.processedStream) {
      this.processedStream.getTracks().forEach((track) => track.stop());
      this.processedStream = null;
    }

    if (this.segmenter) {
      try {
        this.segmenter.close?.();
      } catch {
        // ignore closure error
      }
      this.segmenter = null;
    }

    this.ctx = null;
    this.canvas = null;
    this.personCtx = null;
    this.personCanvas = null;
  }
}
