import {
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  EventHelper,
  Fullscreen,
  getElement,
  OrthographicFrustum,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import NoSleep from "nosleep.js";
import createCommand from "../createCommand.js";

function lockScreen(orientation) {
  let locked = false;
  const screen = window.screen;
  if (defined(screen)) {
    if (defined(screen.lockOrientation)) {
      locked = screen.lockOrientation(orientation);
    } else if (defined(screen.mozLockOrientation)) {
      locked = screen.mozLockOrientation(orientation);
    } else if (defined(screen.msLockOrientation)) {
      locked = screen.msLockOrientation(orientation);
    } else if (defined(screen.orientation && screen.orientation.lock)) {
      locked = screen.orientation.lock(orientation);
    }
  }
  return locked;
}

function unlockScreen() {
  const screen = window.screen;
  if (defined(screen)) {
    if (defined(screen.unlockOrientation)) {
      screen.unlockOrientation();
    } else if (defined(screen.mozUnlockOrientation)) {
      screen.mozUnlockOrientation();
    } else if (defined(screen.msUnlockOrientation)) {
      screen.msUnlockOrientation();
    } else if (defined(screen.orientation && screen.orientation.unlock)) {
      screen.orientation.unlock();
    }
  }
}

function toggleVR(viewModel, scene, isVRMode, isOrthographic) {
  if (isOrthographic()) {
    return;
  }

  if (isVRMode()) {
    scene.useWebVR = false;
    if (viewModel._locked) {
      unlockScreen();
      viewModel._locked = false;
    }
    viewModel._noSleep.disable();
    Fullscreen.exitFullscreen();
    isVRMode(false);
  } else {
    if (!Fullscreen.fullscreen) {
      Fullscreen.requestFullscreen(viewModel._vrElement);
    }
    viewModel._noSleep.enable();
    if (!viewModel._locked) {
      viewModel._locked = lockScreen("landscape");
    }
    scene.useWebVR = true;
    isVRMode(true);
  }
}

/**
 *  {@link VRButton} 视图模型.
 * @alias VRButtonViewModel
 * @constructor
 *
 * @param {Scene} scene The scene.
 * @param {Element|string} [vrElement=document.body] 要放入 VR 模式的元素或 ID.
 */
function VRButtonViewModel(scene, vrElement) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  const that = this;

  const isEnabled = knockout.observable(Fullscreen.enabled);
  const isVRMode = knockout.observable(false);

  /**
   * 获取 VR 模式是否处于活动状态.
   *
   * @type {boolean}
   */
  this.isVRMode = undefined;
  knockout.defineProperty(this, "isVRMode", {
    get: function () {
      return isVRMode();
    },
  });

  /**
   * 获取或设置是否应启用 VR 功能.
   *
   * @type {boolean}
   * @see Fullscreen.enabled
   */
  this.isVREnabled = undefined;
  knockout.defineProperty(this, "isVREnabled", {
    get: function () {
      return isEnabled();
    },
    set: function (value) {
      isEnabled(value && Fullscreen.enabled);
    },
  });

  /**
   * 获取工具提示。此属性是可观察的.
   *
   * @type {string}
   */
  this.tooltip = undefined;
  knockout.defineProperty(this, "tooltip", function () {
    if (!isEnabled()) {
      return "VR mode is unavailable";
    }
    return isVRMode() ? "Exit VR mode" : "Enter VR mode";
  });

  const isOrthographic = knockout.observable(false);

  this._isOrthographic = undefined;
  knockout.defineProperty(this, "_isOrthographic", {
    get: function () {
      return isOrthographic();
    },
  });

  this._eventHelper = new EventHelper();
  this._eventHelper.add(scene.preRender, function () {
    isOrthographic(scene.camera.frustum instanceof OrthographicFrustum);
  });

  this._locked = false;
  this._noSleep = new NoSleep();

  this._command = createCommand(
    function () {
      toggleVR(that, scene, isVRMode, isOrthographic);
    },
    knockout.getObservable(this, "isVREnabled"),
  );

  this._vrElement = defaultValue(getElement(vrElement), document.body);

  this._callback = function () {
    if (!Fullscreen.fullscreen && isVRMode()) {
      scene.useWebVR = false;
      if (that._locked) {
        unlockScreen();
        that._locked = false;
      }
      that._noSleep.disable();
      isVRMode(false);
    }
  };
  document.addEventListener(Fullscreen.changeEventName, this._callback);
}

Object.defineProperties(VRButtonViewModel.prototype, {
  /**
   * 获取或设置在按下相应按钮时进入 VR 模式的 HTML 元素.
   * @memberof VRButtonViewModel.prototype
   *
   * @type {Element}
   */
  vrElement: {
    //TODO:@exception {DeveloperError} value must be a valid HTML Element.
    get: function () {
      return this._vrElement;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!(value instanceof Element)) {
        throw new DeveloperError("value must be a valid Element.");
      }
      //>>includeEnd('debug');

      this._vrElement = value;
    },
  },

  /**
   * 获取切换 VR 模式的命令.
   * @memberof VRButtonViewModel.prototype
   *
   * @type {Command}
   */
  command: {
    get: function () {
      return this._command;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false.
 */
VRButtonViewModel.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁视图模型。当不再需要视图模型时，应调用此函数来正确清理视图模型.
 */
VRButtonViewModel.prototype.destroy = function () {
  this._eventHelper.removeAll();
  document.removeEventListener(Fullscreen.changeEventName, this._callback);
  destroyObject(this);
};
export default VRButtonViewModel;
