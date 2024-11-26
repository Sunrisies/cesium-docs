import defined from "./defined.js";

let _supportsFullscreen;
const _names = {
  requestFullscreen: undefined,
  exitFullscreen: undefined,
  fullscreenEnabled: undefined,
  fullscreenElement: undefined,
  fullscreenchange: undefined,
  fullscreenerror: undefined,
};

/**
 *  /**
 * 与标准全屏API一起使用的浏览器无关的功能。
 *
 * @namespace Fullscreen
 *
 * @see {@link http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html|W3C Fullscreen Living Specification}
 */
const Fullscreen = {};

Object.defineProperties(Fullscreen, {
  /**
   * 当前处于全屏模式的元素（如果有的话）。要简单检查浏览器是否处于全屏模式，请使用 {@link Fullscreen#fullscreen}。
   * @memberof Fullscreen
   * @type {object}
   * @readonly
   */

  element: {
    get: function () {
      if (!Fullscreen.supportsFullscreen()) {
        return undefined;
      }

      return document[_names.fullscreenElement];
    },
  },

  /**
   * 当进入或退出全屏时，在文档上触发的事件名称。该事件名称旨在与 addEventListener 一起使用。
   * 在您的事件处理程序中，要确定浏览器是否处于全屏模式，请使用 {@link Fullscreen#fullscreen}。
   * @memberof Fullscreen
   * @type {string}
   * @readonly
   */

  changeEventName: {
    get: function () {
      if (!Fullscreen.supportsFullscreen()) {
        return undefined;
      }

      return _names.fullscreenchange;
    },
  },

  /**
   * 当发生全屏错误时触发的事件名称。该事件名称旨在与 addEventListener 一起使用。
   * @memberof Fullscreen
   * @type {string}
   * @readonly
   */

  errorEventName: {
    get: function () {
      if (!Fullscreen.supportsFullscreen()) {
        return undefined;
      }

      return _names.fullscreenerror;
    },
  },

  /**
   * 确定浏览器是否允许元素进入全屏模式。
   * 例如，默认情况下，iframe 不能进入全屏，除非包含页面添加了 "allowfullscreen" 属性（或带前缀的等效属性）。
   * @memberof Fullscreen
   * @type {boolean}
   * @readonly
   */

  enabled: {
    get: function () {
      if (!Fullscreen.supportsFullscreen()) {
        return undefined;
      }

      return document[_names.fullscreenEnabled];
    },
  },

  /**
   * 确定浏览器当前是否处于全屏模式。
   * @memberof Fullscreen
   * @type {boolean}
   * @readonly
   */

  fullscreen: {
    get: function () {
      if (!Fullscreen.supportsFullscreen()) {
        return undefined;
      }

      return Fullscreen.element !== null;
    },
  },
});

/**
 * 检测浏览器是否支持标准全屏API。
 *
 * @returns {boolean} <code>true</code> 如果浏览器支持标准全屏API，
 * <code>false</code> 否则。
 */

Fullscreen.supportsFullscreen = function () {
  if (defined(_supportsFullscreen)) {
    return _supportsFullscreen;
  }

  _supportsFullscreen = false;

  const body = document.body;
  if (typeof body.requestFullscreen === "function") {
    // go with the unprefixed, standard set of names
    _names.requestFullscreen = "requestFullscreen";
    _names.exitFullscreen = "exitFullscreen";
    _names.fullscreenEnabled = "fullscreenEnabled";
    _names.fullscreenElement = "fullscreenElement";
    _names.fullscreenchange = "fullscreenchange";
    _names.fullscreenerror = "fullscreenerror";
    _supportsFullscreen = true;
    return _supportsFullscreen;
  }

  //check for the correct combination of prefix plus the various names that browsers use
  const prefixes = ["webkit", "moz", "o", "ms", "khtml"];
  let name;
  for (let i = 0, len = prefixes.length; i < len; ++i) {
    const prefix = prefixes[i];

    // casing of Fullscreen differs across browsers
    name = `${prefix}RequestFullscreen`;
    if (typeof body[name] === "function") {
      _names.requestFullscreen = name;
      _supportsFullscreen = true;
    } else {
      name = `${prefix}RequestFullScreen`;
      if (typeof body[name] === "function") {
        _names.requestFullscreen = name;
        _supportsFullscreen = true;
      }
    }

    // disagreement about whether it's "exit" as per spec, or "cancel"
    name = `${prefix}ExitFullscreen`;
    if (typeof document[name] === "function") {
      _names.exitFullscreen = name;
    } else {
      name = `${prefix}CancelFullScreen`;
      if (typeof document[name] === "function") {
        _names.exitFullscreen = name;
      }
    }

    // casing of Fullscreen differs across browsers
    name = `${prefix}FullscreenEnabled`;
    if (document[name] !== undefined) {
      _names.fullscreenEnabled = name;
    } else {
      name = `${prefix}FullScreenEnabled`;
      if (document[name] !== undefined) {
        _names.fullscreenEnabled = name;
      }
    }

    // casing of Fullscreen differs across browsers
    name = `${prefix}FullscreenElement`;
    if (document[name] !== undefined) {
      _names.fullscreenElement = name;
    } else {
      name = `${prefix}FullScreenElement`;
      if (document[name] !== undefined) {
        _names.fullscreenElement = name;
      }
    }

    // thankfully, event names are all lowercase per spec
    name = `${prefix}fullscreenchange`;
    // event names do not have 'on' in the front, but the property on the document does
    if (document[`on${name}`] !== undefined) {
      //except on IE
      if (prefix === "ms") {
        name = "MSFullscreenChange";
      }
      _names.fullscreenchange = name;
    }

    name = `${prefix}fullscreenerror`;
    if (document[`on${name}`] !== undefined) {
      //except on IE
      if (prefix === "ms") {
        name = "MSFullscreenError";
      }
      _names.fullscreenerror = name;
    }
  }

  return _supportsFullscreen;
};

/**
 * 异步请求浏览器在给定元素上进入全屏模式。
 * 如果浏览器不支持全屏模式，则不执行任何操作。
 *
 * @param {object} element 将被置于全屏模式的HTML元素。
 * @param {object} [vrDevice] HMDVRDevice设备。
 *
 * @example
 * // Put the entire page into fullscreen.
 * Cesium.Fullscreen.requestFullscreen(document.body)
 *
 * // Place only the Cesium canvas into fullscreen.
 * Cesium.Fullscreen.requestFullscreen(scene.canvas)
 */
Fullscreen.requestFullscreen = function (element, vrDevice) {
  if (!Fullscreen.supportsFullscreen()) {
    return;
  }

  element[_names.requestFullscreen]({ vrDisplay: vrDevice });
};

/**
 * 异步退出全屏模式。如果浏览器当前不在全屏中，或者浏览器不支持全屏模式，则不执行任何操作。
 */

Fullscreen.exitFullscreen = function () {
  if (!Fullscreen.supportsFullscreen()) {
    return;
  }

  document[_names.exitFullscreen]();
};

//For unit tests
Fullscreen._names = _names;
export default Fullscreen;
