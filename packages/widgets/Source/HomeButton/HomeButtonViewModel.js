import { defined, DeveloperError } from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * {@link HomeButton} 的视图模型。
 * @alias HomeButtonViewModel
 * @constructor
 *
 * @param {Scene} scene 要使用的场景实例。
 * @param {number} [duration] 相机飞行的持续时间（以秒为单位）。
 */

function HomeButtonViewModel(scene, duration) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = scene;
  this._duration = duration;

  const that = this;
  this._command = createCommand(function () {
    that._scene.camera.flyHome(that._duration);
  });

  /**
   * 获取或设置工具提示。此属性是可观察的。
   *
   * @type {string}
   */

  this.tooltip = "View Home";

  knockout.track(this, ["tooltip"]);
}

Object.defineProperties(HomeButtonViewModel.prototype, {
  /**
   * 获取控制的场景。
   * @memberof HomeButtonViewModel.prototype
   *
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取按钮点击时执行的命令。
   * @memberof HomeButtonViewModel.prototype
   *
   * @type {Command}
   */
  command: {
    get: function () {
      return this._command;
    },
  },

  /**
   * 获取或设置相机飞行的持续时间（以秒为单位）。
   * 值为零将使相机立即切换到主页视图。
   * 当未定义时，持续时间将根据距离计算。
   * @memberof HomeButtonViewModel.prototype
   *
   * @type {number|undefined}
   */

  duration: {
    get: function () {
      return this._duration;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value < 0) {
        throw new DeveloperError("value must be positive.");
      }
      //>>includeEnd('debug');

      this._duration = value;
    },
  },
});
export default HomeButtonViewModel;
