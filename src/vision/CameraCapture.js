// Обёртка над navigator.mediaDevices.getUserMedia.
// Не зависит от фреймворка — возвращает <video> элемент с потоком камеры.
export class CameraCapture {
  constructor() {
    this.stream = null;
    this.video = null;
  }

  async start(facingMode = 'environment') {
    if (this.stream && this.video) return this.video;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('MediaDevices API недоступен в этом окружении');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });

    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.muted = true;
    this.video.srcObject = this.stream;
    await this.video.play();

    return this.video;
  }

  async switchFacing() {
    const next = this._facing === 'environment' ? 'user' : 'environment';
    this._facing = next;
    this.stop();
    return this.start(next);
  }

  get facing() {
    return this._facing || 'environment';
  }

  stop() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
  }
}

export const cameraCapture = new CameraCapture();
