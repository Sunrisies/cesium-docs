import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import getTimestamp from "../Core/getTimestamp.js";
import TimeConstants from "../Core/TimeConstants.js";

/**
 * 监测 {@link Scene} 中的帧率（每秒帧数），如果帧率低于阈值则引发事件。稍后，如果帧率恢复到所需水平，将会引发一个单独的事件。
 * 为了避免为单个 {@link Scene} 创建多个 FrameRateMonitors，请使用 {@link FrameRateMonitor.fromScene}
 * 而不是显式构造实例。
 *
 * @alias FrameRateMonitor
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Scene} options.scene 要监控性能的 Scene 实例。
 * @param {number} [options.samplingWindow=5.0] 用于计算平均帧率的滑动窗口长度（以秒为单位）。
 * @param {number} [options.quietPeriod=2.0] 启动时和每次页面变为可见时（即用户切换回标签时）待机的时间长度（以秒为单位），然后开始测量性能。
 * @param {number} [options.warmupPeriod=5.0] 预热期的长度（以秒为单位）。在预热期间，需要一个单独的（通常更低的）帧率。
 * @param {number} [options.minimumFrameRateDuringWarmup=4] 预热期间可接受性能所需的最低每秒帧数。如果在预热期间的任何 samplingWindow 中，帧率平均低于此值，则将引发 lowFrameRate 事件，
 * 并且如果有的话，页面将重定向到 redirectOnLowFrameRateUrl。
 * @param {number} [options.minimumFrameRateAfterWarmup=8] 预热期结束后，可接受性能所需的最低每秒帧数。如果在预热期后在任何 samplingWindow 中，帧率平均低于此值，则将引发 lowFrameRate 事件
 * 并且如果有的话，页面将重定向到 redirectOnLowFrameRateUrl。
 */

function FrameRateMonitor(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = options.scene;

  /**
   * 获取或设置用于计算平均帧率的滑动窗口长度，单位为秒。
   * @type {number}
   */
  this.samplingWindow = defaultValue(
    options.samplingWindow,
    FrameRateMonitor.defaultSettings.samplingWindow,
  );

  /**
   * 获取或设置在启动时以及每次页面变为可见时（即用户切换回标签时）等待的时间长度（以秒为单位），
   * 然后开始测量性能。
   * @type {number}
   */
  this.quietPeriod = defaultValue(
    options.quietPeriod,
    FrameRateMonitor.defaultSettings.quietPeriod,
  );

  /**
   * 获取或设置预热期的长度（以秒为单位）。在预热期间，需要一个单独的（通常较低的）帧率。
   * @type {number}
   */
  this.warmupPeriod = defaultValue(
    options.warmupPeriod,
    FrameRateMonitor.defaultSettings.warmupPeriod,
  );

  /**
   * 获取或设置在预热期间可接受性能所需的最低每秒帧数。如果在预热期间的任何 <code>samplingWindow</code> 中，帧率平均低于此值，
   * 则将引发 <code>lowFrameRate</code> 事件，并且如果有的话，页面将重定向到 <code>redirectOnLowFrameRateUrl</code>。
   * @type {number}
   */
  this.minimumFrameRateDuringWarmup = defaultValue(
    options.minimumFrameRateDuringWarmup,
    FrameRateMonitor.defaultSettings.minimumFrameRateDuringWarmup,
  );

  /**
   * 获取或设置在预热期结束后可接受性能所需的最低每秒帧数。如果在预热期后在任何 <code>samplingWindow</code> 中，帧率平均低于此值，
   * 则将触发 <code>lowFrameRate</code> 事件，并且如果有的话，页面将重定向到 <code>redirectOnLowFrameRateUrl</code>。
   * @type {number}
   */

  this.minimumFrameRateAfterWarmup = defaultValue(
    options.minimumFrameRateAfterWarmup,
    FrameRateMonitor.defaultSettings.minimumFrameRateAfterWarmup,
  );

  this._lowFrameRate = new Event();
  this._nominalFrameRate = new Event();

  this._frameTimes = [];
  this._needsQuietPeriod = true;
  this._quietPeriodEndTime = 0.0;
  this._warmupPeriodEndTime = 0.0;
  this._frameRateIsLow = false;
  this._lastFramesPerSecond = undefined;
  this._pauseCount = 0;

  const that = this;
  this._preUpdateRemoveListener = this._scene.preUpdate.addEventListener(
    function (scene, time) {
      update(that, time);
    },
  );

  this._hiddenPropertyName =
    document.hidden !== undefined
      ? "hidden"
      : document.mozHidden !== undefined
        ? "mozHidden"
        : document.msHidden !== undefined
          ? "msHidden"
          : document.webkitHidden !== undefined
            ? "webkitHidden"
            : undefined;

  const visibilityChangeEventName =
    document.hidden !== undefined
      ? "visibilitychange"
      : document.mozHidden !== undefined
        ? "mozvisibilitychange"
        : document.msHidden !== undefined
          ? "msvisibilitychange"
          : document.webkitHidden !== undefined
            ? "webkitvisibilitychange"
            : undefined;

  function visibilityChangeListener() {
    visibilityChanged(that);
  }

  this._visibilityChangeRemoveListener = undefined;
  if (defined(visibilityChangeEventName)) {
    document.addEventListener(
      visibilityChangeEventName,
      visibilityChangeListener,
      false,
    );

    this._visibilityChangeRemoveListener = function () {
      document.removeEventListener(
        visibilityChangeEventName,
        visibilityChangeListener,
        false,
      );
    };
  }
}

/**
 * 默认的帧率监控设置。这些设置在 {@link FrameRateMonitor.fromScene}
 * 需要创建一个新的帧率监控时使用，对于任何未传递给
 * {@link FrameRateMonitor} 构造函数的设置。
 *
 * @memberof FrameRateMonitor
 * @type {object}
 */

FrameRateMonitor.defaultSettings = {
  samplingWindow: 5.0,
  quietPeriod: 2.0,
  warmupPeriod: 5.0,
  minimumFrameRateDuringWarmup: 4,
  minimumFrameRateAfterWarmup: 8,
};

/**
 * 获取给定场景的 {@link FrameRateMonitor}。如果场景尚未具有
 * {@link FrameRateMonitor}，则会使用 {@link FrameRateMonitor.defaultSettings} 创建一个。
 *
 * @param {Scene} scene 要获取 {@link FrameRateMonitor} 的场景。
 * @returns {FrameRateMonitor} 场景的 {@link FrameRateMonitor}。
 */

FrameRateMonitor.fromScene = function (scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  if (
    !defined(scene._frameRateMonitor) ||
    scene._frameRateMonitor.isDestroyed()
  ) {
    scene._frameRateMonitor = new FrameRateMonitor({
      scene: scene,
    });
  }

  return scene._frameRateMonitor;
};

Object.defineProperties(FrameRateMonitor.prototype, {
  /**
   * 获取要监控性能的 {@link Scene} 实例。
   * @memberof FrameRateMonitor.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取检测到低帧率时引发的事件。函数将传递给
   * {@link Scene} 实例作为第一个参数，以及在采样窗口内的平均每秒帧数
   * 作为第二个参数。
   * @memberof FrameRateMonitor.prototype
   * @type {Event}
   */
  lowFrameRate: {
    get: function () {
      return this._lowFrameRate;
    },
  },

  /**
   * 获取帧率恢复到正常水平时引发的事件，之前帧率曾低。
   * 函数将传递给 {@link Scene} 实例作为第一个参数，以及平均
   * 每秒帧数在采样窗口内作为第二个参数。
   * @memberof FrameRateMonitor.prototype
   * @type {Event}
   */
  nominalFrameRate: {
    get: function () {
      return this._nominalFrameRate;
    },
  },

  /**
   * 获取在最后一个 <code>samplingWindow</code> 中最近计算出的平均每秒帧数。
   * 如果尚未计算帧率，则此属性可能为 undefined。
   * @memberof FrameRateMonitor.prototype
   * @type {number}
   */
  lastFramesPerSecond: {
    get: function () {
      return this._lastFramesPerSecond;
    },
  },
});


/**
 * 暂停帧率监控。要恢复监控，必须为每次调用此函数调用一次 {@link FrameRateMonitor#unpause}。
 * @memberof FrameRateMonitor
 */

FrameRateMonitor.prototype.pause = function () {
  ++this._pauseCount;
  if (this._pauseCount === 1) {
    this._frameTimes.length = 0;
    this._lastFramesPerSecond = undefined;
  }
};

/**
 * 恢复帧率监控。如果 {@link FrameRateMonitor#pause} 被调用多次，
 * 则必须调用此函数相同次数才能真正恢复监控。
 * @memberof FrameRateMonitor
 */

FrameRateMonitor.prototype.unpause = function () {
  --this._pauseCount;
  if (this._pauseCount <= 0) {
    this._pauseCount = 0;
    this._needsQuietPeriod = true;
  }
};

/**
 * 如果该对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @memberof FrameRateMonitor
 *
 * @returns {boolean} 如果该对象已被销毁则返回 true；否则返回 false。
 *
 * @see FrameRateMonitor#destroy
 */

FrameRateMonitor.prototype.isDestroyed = function () {
  return false;
};

/**
 * 从所有正在监听的事件中取消订阅此实例。
 * 一旦对象被销毁，则不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）分配给对象，如示例中所示。
 *
 * @memberof FrameRateMonitor
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see FrameRateMonitor#isDestroyed
 */

FrameRateMonitor.prototype.destroy = function () {
  this._preUpdateRemoveListener();

  if (defined(this._visibilityChangeRemoveListener)) {
    this._visibilityChangeRemoveListener();
  }

  return destroyObject(this);
};

function update(monitor, time) {
  if (monitor._pauseCount > 0) {
    return;
  }

  const timeStamp = getTimestamp();

  if (monitor._needsQuietPeriod) {
    monitor._needsQuietPeriod = false;
    monitor._frameTimes.length = 0;
    monitor._quietPeriodEndTime =
      timeStamp + monitor.quietPeriod / TimeConstants.SECONDS_PER_MILLISECOND;
    monitor._warmupPeriodEndTime =
      monitor._quietPeriodEndTime +
      (monitor.warmupPeriod + monitor.samplingWindow) /
        TimeConstants.SECONDS_PER_MILLISECOND;
  } else if (timeStamp >= monitor._quietPeriodEndTime) {
    monitor._frameTimes.push(timeStamp);

    const beginningOfWindow =
      timeStamp -
      monitor.samplingWindow / TimeConstants.SECONDS_PER_MILLISECOND;

    if (
      monitor._frameTimes.length >= 2 &&
      monitor._frameTimes[0] <= beginningOfWindow
    ) {
      while (
        monitor._frameTimes.length >= 2 &&
        monitor._frameTimes[1] < beginningOfWindow
      ) {
        monitor._frameTimes.shift();
      }

      const averageTimeBetweenFrames =
        (timeStamp - monitor._frameTimes[0]) / (monitor._frameTimes.length - 1);

      monitor._lastFramesPerSecond = 1000.0 / averageTimeBetweenFrames;

      const maximumFrameTime =
        1000.0 /
        (timeStamp > monitor._warmupPeriodEndTime
          ? monitor.minimumFrameRateAfterWarmup
          : monitor.minimumFrameRateDuringWarmup);
      if (averageTimeBetweenFrames > maximumFrameTime) {
        if (!monitor._frameRateIsLow) {
          monitor._frameRateIsLow = true;
          monitor._needsQuietPeriod = true;
          monitor.lowFrameRate.raiseEvent(
            monitor.scene,
            monitor._lastFramesPerSecond,
          );
        }
      } else if (monitor._frameRateIsLow) {
        monitor._frameRateIsLow = false;
        monitor._needsQuietPeriod = true;
        monitor.nominalFrameRate.raiseEvent(
          monitor.scene,
          monitor._lastFramesPerSecond,
        );
      }
    }
  }
}

function visibilityChanged(monitor) {
  if (document[monitor._hiddenPropertyName]) {
    monitor.pause();
  } else {
    monitor.unpause();
  }
}
export default FrameRateMonitor;
