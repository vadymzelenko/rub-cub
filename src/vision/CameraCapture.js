// Обёртка над navigator.mediaDevices.getUserMedia.
// Возвращает MediaStream; <video> управляется React-компонентом (через JSX).
export class CameraCapture {
  constructor() {
    this.stream = null;
    this._pending = null;
    this._facing = 'environment';
  }

  async start(facingMode = 'environment') {
    if (this.stream) return this.stream;
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
        return this.stream;
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
  }
}

export const cameraCapture = new CameraCapture();


