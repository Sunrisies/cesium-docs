import {
  defined,
  destroyObject,
  DeveloperError,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import PerformanceWatchdogViewModel from "./PerformanceWatchdogViewModel.js";

/**
 * 监控应用程序的性能，如果检测到性能较差，则显示消息。
 *
 * @alias PerformanceWatchdog
 * @constructor
 *
 * @param {object} [options] 带有以下属性的对象：
 * @param {Element|string} options.container 包含小部件的 DOM 元素或 ID。
 * @param {Scene} options.scene 要监控性能的 {@link Scene}。
 * @param {string} [options.lowFrameRateMessage='此应用程序在您的系统上似乎表现不佳。请尝试使用其他网络浏览器或更新您的视频驱动程序。'] 
 *        检测到低帧率时要显示的消息。该消息被解释为 HTML，因此请确保它来自可信来源，以便您的应用程序不会受到跨站脚本攻击的威胁。
 */

function PerformanceWatchdog(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.container)) {
    throw new DeveloperError("options.container is required.");
  }
  if (!defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  const container = getElement(options.container);

  const viewModel = new PerformanceWatchdogViewModel(options);

  const element = document.createElement("div");
  element.className = "cesium-performance-watchdog-message-area";
  element.setAttribute("data-bind", "visible: showingLowFrameRateMessage");

  const dismissButton = document.createElement("button");
  dismissButton.setAttribute("type", "button");
  dismissButton.className = "cesium-performance-watchdog-message-dismiss";
  dismissButton.innerHTML = "&times;";
  dismissButton.setAttribute("data-bind", "click: dismissMessage");
  element.appendChild(dismissButton);

  const message = document.createElement("div");
  message.className = "cesium-performance-watchdog-message";
  message.setAttribute("data-bind", "html: lowFrameRateMessage");
  element.appendChild(message);

  container.appendChild(element);

  knockout.applyBindings(viewModel, element);

  this._container = container;
  this._viewModel = viewModel;
  this._element = element;
}

Object.defineProperties(PerformanceWatchdog.prototype, {
  /**
   * 获取父容器.
   * @memberof PerformanceWatchdog.prototype
   *
   * @type {Element}
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取视图模型.
   * @memberof PerformanceWatchdog.prototype
   *
   * @type {PerformanceWatchdogViewModel}
   */
  viewModel: {
    get: function () {
      return this._viewModel;
    },
  },
});

/**
 * @memberof PerformanceWatchdog
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false.
 */
PerformanceWatchdog.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。如果永久地,从布局中移除小部件，则应调用此方法.
 * @memberof PerformanceWatchdog
 */
PerformanceWatchdog.prototype.destroy = function () {
  this._viewModel.destroy();
  knockout.cleanNode(this._element);
  this._container.removeChild(this._element);

  return destroyObject(this);
};
export default PerformanceWatchdog;
