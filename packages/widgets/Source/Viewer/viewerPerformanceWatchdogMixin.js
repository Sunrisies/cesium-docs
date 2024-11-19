import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import PerformanceWatchdog from "../PerformanceWatchdog/PerformanceWatchdog.js";

/**
 * 一个混入，将 {@link PerformanceWatchdog} 小部件添加到 {@link Viewer} 小部件。
 * 这个函数通常不会直接调用，而是作为参数传递给 {@link Viewer#extend}，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例.
 * @param {object} [options] 一个具有属性的对象.
 * @param {string} [options.lowFrameRateMessage='此应用程序在您的系统上表现不佳。请尝试使用不同的网络浏览器或更新您的视频驱动程序.'] 
 * 在检测到低帧率时显示的消息。该消息被解释为 HTML，因此请确保来自可信来源，以便您的应用程序不容易受到跨站脚本攻击
 *
 * @exception {DeveloperError} 必须提供 viewe.
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerPerformanceWatchdogMixin, {
 *     lowFrameRateMessage : 'Why is this going so <em>slowly</em>?'
 * });
 */
function viewerPerformanceWatchdogMixin(viewer, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(viewer)) {
    throw new DeveloperError("viewer is required.");
  }
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const performanceWatchdog = new PerformanceWatchdog({
    scene: viewer.scene,
    container: viewer.bottomContainer,
    lowFrameRateMessage: options.lowFrameRateMessage,
  });

  Object.defineProperties(viewer, {
    performanceWatchdog: {
      get: function () {
        return performanceWatchdog;
      },
    },
  });
}
export default viewerPerformanceWatchdogMixin;
