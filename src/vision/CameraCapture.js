/**
 * Обёртка над navigator.mediaDevices.getUserMedia.
 * Пишет поток в <video id="camera-video"> (создан в index.html, лежит под
 * Phaser/Three canvas-слоями по z-index).
 */
export class CameraCapture {
  constructor() {
    this.videoEl = document.getElementById('camera-video');
    this.stream = null;
    this.facingMode = 'environment'; // задняя камера по умолчанию
  }

  async start() {
    if (this.stream) return this.videoEl;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Камера недоступна в этом окружении (нет MediaDevices API)');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });

    this.videoEl.srcObject = this.stream;
    this.videoEl.style.display = 'block';
    await this.videoEl.play();
    return this.videoEl;
  }

  stop() {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.videoEl) {
      this.videoEl.style.display = 'none';
      this.videoEl.srcObject = null;
    }
  }

  async switchFacing() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    this.stop();
    return this.start();
  }

  /** Захватывает текущий кадр в offscreen canvas и возвращает ImageData. */
  grabFrame() {
    if (!this.videoEl || this.videoEl.readyState < 2) return null;
    const canvas = this._scratchCanvas || (this._scratchCanvas = document.createElement('canvas'));
    canvas.width = this.videoEl.videoWidth;
    canvas.height = this.videoEl.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(this.videoEl, 0, 0);
    return { canvas, ctx, width: canvas.width, height: canvas.height };
  }
}

export const cameraCapture = new CameraCapture();
