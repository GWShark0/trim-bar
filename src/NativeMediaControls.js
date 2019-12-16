const _preloadedUrls = {};

const DEFAULT_DESYNC_TOLERANCE = 1 / 90;

const RETRY_STATUSES = [206];
const MAX_ATTEMPTS = 2;
const RETRY_DELAY = 100;

// When NativeMediaControls is initialized with a null HtmlMediaElement,
// nullMedia is used in its place to keep NativeMediaControls from erroring out
const nullMedia = {
  addEventListener: (ignored, callback) => callback(),
  pause: () => { },
  play: () => { },
  removeEventListener: () => { },
};

function preloadBlobAsObjectURL(sourceUrl, mimetype) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', sourceUrl);
    if (mimetype) {
      request.overrideMimeType(mimetype);
    }
    request.responseType = 'blob';
    request.onload = () => {
      if (request.status !== 200) {
        reject(request.status);
      }
      resolve(request.response);
    };
    request.send();
  }).then(preloadedBlob => URL.createObjectURL(preloadedBlob));
}

async function retryHelper(
  task,
  {
    baseDelay = RETRY_DELAY,
    maxAttempts = MAX_ATTEMPTS,
    shouldRetry = () => true,
  }
) {
  let error = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      error = err;
      if (!shouldRetry(err)) {
        break;
      }
      // delay next attempt with exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, baseDelay * 2 ** attempt)
      );
    }
  }
  throw error;
}

export default class NativeMediaControls {
  /**
   * Preload a media source fully.
   * Can optionally override the mimetype.
   */
  static preloadSource(sourceUrl, mimetype) {
    if (!_preloadedUrls[sourceUrl]) {
      _preloadedUrls[sourceUrl] = retryHelper(
        () => preloadBlobAsObjectURL(sourceUrl, mimetype),
        { shouldRetry: status => RETRY_STATUSES.includes(status) }
      ).catch(status => {
        throw Error(
          `Unable to preload source ${sourceUrl}, received HTTP status ${status}`
        );
      });
    }
    return _preloadedUrls[sourceUrl];
  }

  /**
   * Convenience function for preloading MP4 video sources
   */
  static preloadVideoSource(sourceUrl) {
    // safari won't load the video if it doesn't have the correct mime type
    return NativeMediaControls.preloadSource(sourceUrl, 'video/mp4');
  }

  /**
   * Ensures a <video> or <audio> element is loaded and ready for interactions
   */
  static preloadMediaElement(media, src) {
    // this is the only reliable way we've found to make sure video is ready
    // waiting for these events doesn't work: loadeddata, canplay, canplaythrough
    return new Promise((resolve, reject) => {
      let isLoaded = false;

      const loaded = () => {
        media.removeEventListener('canplaythrough', loaded);
        if (!isLoaded) {
          isLoaded = true;
          const controls = new NativeMediaControls(media);
          controls.seek(0.1).then(() => resolve());
        }
      };

      // NOTE: this is a mitigation due to issues on Safari
      setTimeout(() => {
        if (!isLoaded) {
          console.log(`Media Not Loaded after 5 seconds: ${media.src}`);
          loaded();
        }
      }, 5000);

      media.addEventListener('canplaythrough', loaded);
      media.src = src;
    });
  }

  static async preloadOffscreenVideo(sourceUrl) {
    const source = await NativeMediaControls.preloadVideoSource(sourceUrl);
    const video = document.createElement('video');
    video.setAttribute('crossorigin', 'anonymous');

    await NativeMediaControls.preloadMediaElement(video, source);

    video.setAttribute('muted', '');
    video.muted = true;

    return video;
  }

  static async preloadOffscreenAudio(sourceUrl) {
    const source = await NativeMediaControls.preloadSource(sourceUrl);
    const audio = document.createElement('audio');

    await NativeMediaControls.preloadMediaElement(audio, source);

    return audio;
  }

  constructor(media, desyncTolerance = DEFAULT_DESYNC_TOLERANCE) {
    this._media = media || nullMedia;
    this.desyncTolerance = desyncTolerance;
  }

  get media() {
    return this._media;
  }

  pause() {
    if (!this.media.paused) {
      this.media.pause();
    }
  }

  mute() {
    this.media.muted = true;
  }

  unmute() {
    this.media.muted = false;
  }

  play() {
    if (this.media.paused) {
      return this.media.play();
    }
    return Promise.resolve();
  }

  seek(timestamp) {
    if (timestamp < 0 || timestamp > this.media.duration) {
      console.warn('Requested seek timestamp is invalid.', {
        requested: timestamp,
        mediaDuration: this.media.duration,
      });
    }

    // make sure the target timestamp is in bounds for the source media
    timestamp = Math.max(timestamp, 0);
    timestamp = Math.min(timestamp, this.media.duration);

    if (this.media.seeking && !this._isNearTime(timestamp)) {
      console.warn('Requested media seek before previous one completed.', {
        requested: timestamp,
        previous: this.media.currentTime,
      });
    }

    if (!this.media.seeking && this._isNearTime(timestamp)) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      const seekHandler = () => {
        this.media.removeEventListener('seeked', seekHandler);

        return resolve();
      };
      this.media.addEventListener('seeked', seekHandler);

      this.media.currentTime = timestamp;
    });
  }

  _isNearTime(timestamp) {
    return Math.abs(this.media.currentTime - timestamp) < this.desyncTolerance;
  }
}
