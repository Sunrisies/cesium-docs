import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import destroyObject from "./destroyObject.js";
import Iso8601 from "./Iso8601.js";
import JulianDate from "./JulianDate.js";

/**
 * 将视频元素与仿真时钟同步。
 *
 * @alias VideoSynchronizer
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Clock} [options.clock] 用于驱动视频的时钟实例。
 * @param {HTMLVideoElement} [options.element] 要同步的视频元素。
 * @param {JulianDate} [options.epoch=Iso8601.MINIMUM_VALUE] 标记视频开始的仿真时间。
 * @param {number} [options.tolerance=1.0] 时钟和视频之间允许的最大时间差，单位为秒。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Video.html|Video Material Demo}
 */

function VideoSynchronizer(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._clock = undefined;
  this._element = undefined;
  this._clockSubscription = undefined;
  this._seekFunction = undefined;
  this._lastPlaybackRate = undefined;

  this.clock = options.clock;
  this.element = options.element;

  /**
   * 获取或设置标记视频开始的仿真时间。
   * @type {JulianDate}
   * @default Iso8601.MINIMUM_VALUE
   */
  this.epoch = defaultValue(options.epoch, Iso8601.MINIMUM_VALUE);

  /**
   * 获取或设置视频的当前时间和时钟的当前时间可以偏差的时间（以秒为单位），
   * 在此时间后会执行视频寻址。较低的值使同步更准确，但视频
   * 性能可能会受到影响。较高的值提供更好的性能，但会牺牲准确性。
   * @type {number}
   * @default 1.0
   */

  this.tolerance = defaultValue(options.tolerance, 1.0);

  this._seeking = false;
  this._seekFunction = undefined;
  this._firstTickAfterSeek = false;
}

Object.defineProperties(VideoSynchronizer.prototype, {
  /**
   * 获取或设置用于驱动视频元素的时钟。
   *
   * @memberof VideoSynchronizer.prototype
   * @type {Clock}
   */

  clock: {
    get: function () {
      return this._clock;
    },
    set: function (value) {
      const oldValue = this._clock;

      if (oldValue === value) {
        return;
      }

      if (defined(oldValue)) {
        this._clockSubscription();
        this._clockSubscription = undefined;
      }

      if (defined(value)) {
        this._clockSubscription = value.onTick.addEventListener(
          VideoSynchronizer.prototype._onTick,
          this,
        );
      }

      this._clock = value;
    },
  },
  /**
   * 获取或设置要同步的视频元素。
   *
   * @memberof VideoSynchronizer.prototype
   * @type {HTMLVideoElement}
   */

  element: {
    get: function () {
      return this._element;
    },
    set: function (value) {
      const oldValue = this._element;

      if (oldValue === value) {
        return;
      }

      if (defined(oldValue)) {
        oldValue.removeEventListener("seeked", this._seekFunction, false);
      }

      if (defined(value)) {
        this._seeking = false;
        this._seekFunction = createSeekFunction(this);
        value.addEventListener("seeked", this._seekFunction, false);
      }

      this._element = value;
      this._seeking = false;
      this._firstTickAfterSeek = false;
    },
  },
});

/**
 * 销毁对象使用的所有资源。一旦对象被销毁，就不应再使用它。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */
VideoSynchronizer.prototype.destroy = function () {
  this.element = undefined;
  this.clock = undefined;
  return destroyObject(this);
};

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 *
 * @returns {boolean} 如果此对象已被销毁，则为true；否则为false。
 */

VideoSynchronizer.prototype.isDestroyed = function () {
  return false;
};

VideoSynchronizer.prototype._trySetPlaybackRate = function (clock) {
  if (this._lastPlaybackRate === clock.multiplier) {
    return;
  }

  const element = this._element;
  try {
    element.playbackRate = clock.multiplier;
  } catch (error) {
    // Seek manually for unsupported playbackRates.
    element.playbackRate = 0.0;
  }
  this._lastPlaybackRate = clock.multiplier;
};

VideoSynchronizer.prototype._onTick = function (clock) {
  const element = this._element;
  if (!defined(element) || element.readyState < 2) {
    return;
  }

  const paused = element.paused;
  const shouldAnimate = clock.shouldAnimate;
  if (shouldAnimate === paused) {
    if (shouldAnimate) {
      element.play();
    } else {
      element.pause();
    }
  }

  //We need to avoid constant seeking or the video will
  //never contain a complete frame for us to render.
  //So don't do anything if we're seeing or on the first
  //tick after a seek (the latter of which allows the frame
  //to actually be rendered.
  if (this._seeking || this._firstTickAfterSeek) {
    this._firstTickAfterSeek = false;
    return;
  }

  this._trySetPlaybackRate(clock);

  const clockTime = clock.currentTime;
  const epoch = defaultValue(this.epoch, Iso8601.MINIMUM_VALUE);
  let videoTime = JulianDate.secondsDifference(clockTime, epoch);

  const duration = element.duration;
  let desiredTime;
  const currentTime = element.currentTime;
  if (element.loop) {
    videoTime = videoTime % duration;
    if (videoTime < 0.0) {
      videoTime = duration - videoTime;
    }
    desiredTime = videoTime;
  } else if (videoTime > duration) {
    desiredTime = duration;
  } else if (videoTime < 0.0) {
    desiredTime = 0.0;
  } else {
    desiredTime = videoTime;
  }

  //If the playing video's time and the scene's clock time
  //ever drift too far apart, we want to set the video to match
  const tolerance = shouldAnimate ? defaultValue(this.tolerance, 1.0) : 0.001;
  if (Math.abs(desiredTime - currentTime) > tolerance) {
    this._seeking = true;
    element.currentTime = desiredTime;
  }
};

function createSeekFunction(that) {
  return function () {
    that._seeking = false;
    that._firstTickAfterSeek = true;
  };
}
export default VideoSynchronizer;
