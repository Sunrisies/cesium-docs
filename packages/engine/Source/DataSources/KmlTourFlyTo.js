import BoundingSphere from "../Core/BoundingSphere.js";
import combine from "../Core/combine.js";
import defined from "../Core/defined.js";
import EasingFunction from "../Core/EasingFunction.js";
/**
 * 将 KmlTour 过渡到下一个目的地。此过渡通过
 * 在给定的秒数内使用指定的 flyToMode 来实现。
 *
 * @alias KmlTourFlyTo
 * @constructor
 *
 * @param {number} duration 条目持续时间
 * @param {string} flyToMode KML 飞往模式：bounce、smooth 等
 * @param {KmlCamera|KmlLookAt} view KmlCamera 或 KmlLookAt
 *
 * @see KmlTour
 * @see KmlTourWait
 */

function KmlTourFlyTo(duration, flyToMode, view) {
  this.type = "KmlTourFlyTo";
  this.blocking = true;
  this.activeCamera = null;
  this.activeCallback = null;

  this.duration = duration;
  this.view = view;
  this.flyToMode = flyToMode;
}

/**
 * 播放此播放列表条目
 *
 * @param {KmlTourFlyTo.DoneCallback} done 播放结束时将被调用的函数
 * @param {Camera} camera Cesium 摄像机
 * @param {object} [cameraOptions] 将与摄像机的飞行到选项合并。请参见 {@link Camera#flyTo}
 */

KmlTourFlyTo.prototype.play = function (done, camera, cameraOptions) {
  this.activeCamera = camera;
  if (defined(done) && done !== null) {
    const self = this;
    this.activeCallback = function (terminated) {
      delete self.activeCallback;
      delete self.activeCamera;
      done(defined(terminated) ? false : terminated);
    };
  }

  const options = this.getCameraOptions(cameraOptions);
  if (this.view.headingPitchRoll) {
    camera.flyTo(options);
  } else if (this.view.headingPitchRange) {
    const target = new BoundingSphere(this.view.position);
    camera.flyToBoundingSphere(target, options);
  }
};

/**
 * 停止当前条目的执行。取消摄像机的飞行到操作。
 */

KmlTourFlyTo.prototype.stop = function () {
  if (defined(this.activeCamera)) {
    this.activeCamera.cancelFlight();
  }
  if (defined(this.activeCallback)) {
    this.activeCallback(true);
  }
};

/**
 * 返回 {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 的选项
 * 取决于 this.view 的类型。
 *
 * @param {object} cameraOptions 要与生成的选项合并的选项。请参见 {@link Camera#flyTo}
 * @returns {object} {@link Camera#flyTo} 或 {@link Camera#flyToBoundingSphere} 的选项
 */

KmlTourFlyTo.prototype.getCameraOptions = function (cameraOptions) {
  let options = {
    duration: this.duration,
  };

  if (defined(this.activeCallback)) {
    options.complete = this.activeCallback;
  }

  if (this.flyToMode === "smooth") {
    options.easingFunction = EasingFunction.LINEAR_NONE;
  }

  if (this.view.headingPitchRoll) {
    options.destination = this.view.position;
    options.orientation = this.view.headingPitchRoll;
  } else if (this.view.headingPitchRange) {
    options.offset = this.view.headingPitchRange;
  }

  if (defined(cameraOptions)) {
    options = combine(options, cameraOptions);
  }
  return options;
};

/**
 * 飞行完成时将执行的函数。
 * @callback KmlTourFlyTo.DoneCallback
 *
 * @param {boolean} terminated 如果在条目播放完成之前调用了 {@link KmlTourFlyTo#stop}，则为 true。
 */

export default KmlTourFlyTo;
