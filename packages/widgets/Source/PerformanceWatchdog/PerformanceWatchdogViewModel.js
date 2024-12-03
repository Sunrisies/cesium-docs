import {
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  FrameRateMonitor,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * {@link PerformanceWatchdog} 的视图模型。
 *
 * @alias PerformanceWatchdogViewModel
 * @constructor
 *
 * @param {object} [options] 带有以下属性的对象：
 * @param {Scene} options.scene 要监控性能的 Scene 实例。
 * @param {string} [options.lowFrameRateMessage='此应用程序在您的系统上似乎表现不佳。请尝试使用其他网络浏览器或更新您的视频驱动程序。'] 
 *        检测到低帧率时要显示的消息。该消息被解释为 HTML，因此请确保它来自可信来源，以便您的应用程序不会受到跨站脚本攻击的威胁。
 */

function PerformanceWatchdogViewModel(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = options.scene;

  /**
   * 获取或设置在检测到低帧率时要显示的消息。该字符串将被解释为 HTML。
   * @type {string}
   */
  this.lowFrameRateMessage = defaultValue(
    options.lowFrameRateMessage,
    "此应用程序在您的系统上似乎表现不佳。请尝试使用其他网络浏览器或更新您的视频驱动程序。",
  );

  /**
   * 获取或设置一个值，指示低帧率消息是否已被用户之前关闭。如果已关闭，该消息将不会重新显示，无论帧率如何。
   * @type {boolean}
   */
  this.lowFrameRateMessageDismissed = false;

  /**
   * 获取或设置一个值，指示低帧率消息当前是否正在显示。
   * @type {boolean}
   */

  this.showingLowFrameRateMessage = false;

  knockout.track(this, [
    "lowFrameRateMessage",
    "lowFrameRateMessageDismissed",
    "showingLowFrameRateMessage",
  ]);

  const that = this;
  this._dismissMessage = createCommand(function () {
    that.showingLowFrameRateMessage = false;
    that.lowFrameRateMessageDismissed = true;
  });

  const monitor = FrameRateMonitor.fromScene(options.scene);

  this._unsubscribeLowFrameRate = monitor.lowFrameRate.addEventListener(
    function () {
      if (!that.lowFrameRateMessageDismissed) {
        that.showingLowFrameRateMessage = true;
      }
    },
  );

  this._unsubscribeNominalFrameRate = monitor.nominalFrameRate.addEventListener(
    function () {
      that.showingLowFrameRateMessage = false;
    },
  );
}

Object.defineProperties(PerformanceWatchdogViewModel.prototype, {
  /**
   * 获取要监控性能的 {@link Scene} 实例。
   * @memberof PerformanceWatchdogViewModel.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取一个可以关闭低帧率消息的命令。一旦被关闭，该消息将不会重新显示。
   * @memberof PerformanceWatchdogViewModel.prototype
   * @type {Command}
   */

  dismissMessage: {
    get: function () {
      return this._dismissMessage;
    },
  },
});

PerformanceWatchdogViewModel.prototype.destroy = function () {
  this._unsubscribeLowFrameRate();
  this._unsubscribeNominalFrameRate();

  return destroyObject(this);
};
export default PerformanceWatchdogViewModel;
