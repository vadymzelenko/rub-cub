// Обёртка над navigator.mediaDevices.getUserMedia.
// Не зависит от фреймворка — возвращает <video> элемент с потоком камеры.
export class CameraCapture {
  constructor() {
    this.stream = null;
    this.video = null;
    this._pending = null;
    this._facing = 'environment';
  }

  async start(facingMode = 'environment') {
    if (this.stream && this.video) return this.video;
    // Защита от повторного параллельного вызова.
    if (this._pending) return this._pending;
    this._facing = facingMode;

    this._pending = (async () => {
      try {
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
        this.video.defaultMuted = true;
        this.video.setAttribute('playsinline', '');
        this.video.setAttribute('muted', '');
        // Инлайн-стили гарантируют видимость видео независимо от CSS-селекторов.
        this.video.style.cssText =
          'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;background:#000;';
        this.video.srcObject = this.stream;
        // Проиграем после вставки в DOM (вызываем play() повторно в сцене).
        this.video.play().catch(() => {});

        return this.video;
      } catch (e) {
        this.stop();
        throw e;
      } finally {
        this._pending = null;
      }
    })();

    return this._pending;
  }

  async switchFacing() {
    const next = this._facing === 'environment' ? 'user' : 'environment';
    this.stop();
    return this.start(next);
  }

  get facing() {
    return this._facing;
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

