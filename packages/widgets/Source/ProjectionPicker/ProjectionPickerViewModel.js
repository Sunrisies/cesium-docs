import {
  defined,
  destroyObject,
  DeveloperError,
  EventHelper,
  OrthographicFrustum,
  SceneMode,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * {@link ProjectionPicker} 的视图模型。
 * @alias ProjectionPickerViewModel
 * @constructor
 *
 * @param {Scene} scene 要切换投影的场景。
 */

function ProjectionPickerViewModel(scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  this._scene = scene;
  this._orthographic = scene.camera.frustum instanceof OrthographicFrustum;
  this._flightInProgress = false;

 /**
   * 获取或设置按钮下拉菜单当前是否可见。此属性是可观察的。
   * @type {boolean}
   * @default false
   */

  this.dropDownVisible = false;

  /**
   * 获取或设置透视投影的工具提示。此属性是可观察的.
   * @type {string}
   * @default 'Perspective Projection'
   */
  this.tooltipPerspective = "Perspective Projection";

  /**
   * 获取或设置正交投影的工具提示。此属性是可观察的.
   * @type {string}
   * @default 'Orthographic Projection'
   */
  this.tooltipOrthographic = "Orthographic Projection";

  /**
   * 获取当前活动的工具提示。此属性是可观察的.
   * @type {string}
   */
  this.selectedTooltip = undefined;

  /**
   * 获取或设置当前的 SceneMode。此属性是可观察的.
   * @type {SceneMode}
   */
  this.sceneMode = scene.mode;

  knockout.track(this, [
    "_orthographic",
    "_flightInProgress",
    "sceneMode",
    "dropDownVisible",
    "tooltipPerspective",
    "tooltipOrthographic",
  ]);

  const that = this;
  knockout.defineProperty(this, "selectedTooltip", function () {
    if (that._orthographic) {
      return that.tooltipOrthographic;
    }
    return that.tooltipPerspective;
  });

  this._toggleDropDown = createCommand(function () {
    if (that.sceneMode === SceneMode.SCENE2D || that._flightInProgress) {
      return;
    }

    that.dropDownVisible = !that.dropDownVisible;
  });

  this._eventHelper = new EventHelper();
  this._eventHelper.add(
    scene.morphComplete,
    function (transitioner, oldMode, newMode, isMorphing) {
      that.sceneMode = newMode;
      that._orthographic =
        newMode === SceneMode.SCENE2D ||
        that._scene.camera.frustum instanceof OrthographicFrustum;
    },
  );
  this._eventHelper.add(scene.preRender, function () {
    that._flightInProgress = defined(scene.camera._currentFlight);
  });

  this._switchToPerspective = createCommand(function () {
    if (that.sceneMode === SceneMode.SCENE2D) {
      return;
    }

    that._scene.camera.switchToPerspectiveFrustum();
    that._orthographic = false;
    that.dropDownVisible = false;
  });

  this._switchToOrthographic = createCommand(function () {
    if (that.sceneMode === SceneMode.SCENE2D) {
      return;
    }

    that._scene.camera.switchToOrthographicFrustum();
    that._orthographic = true;
    that.dropDownVisible = false;
  });

  //Used by knockout
  this._sceneMode = SceneMode;
}

Object.defineProperties(ProjectionPickerViewModel.prototype, {
  /**
   * 获取场景
   * @memberof ProjectionPickerViewModel.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取切换下拉框的命令。
   * @memberof ProjectionPickerViewModel.prototype
   *
   * @type {Command}
   */
  toggleDropDown: {
    get: function () {
      return this._toggleDropDown;
    },
  },

  /**
   * 获取切换到透视投影的命令。
   * @memberof ProjectionPickerViewModel.prototype
   *
   * @type {Command}
   */
  switchToPerspective: {
    get: function () {
      return this._switchToPerspective;
    },
  },

  /**
   * 获取切换到正交投影的命令。
   * @memberof ProjectionPickerViewModel.prototype
   *
   * @type {Command}
   */
  switchToOrthographic: {
    get: function () {
      return this._switchToOrthographic;
    },
  },

  /**
   * 获取当前场景是否正在使用正交投影。
   * @memberof ProjectionPickerViewModel.prototype
   *
   * @type {Command}
   */
  isOrthographicProjection: {
    get: function () {
      return this._orthographic;
    },
  },
});


/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false.
 */
ProjectionPickerViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 毁视图模型
 */
ProjectionPickerViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();
  destroyObject(this);
};
export default ProjectionPickerViewModel;
