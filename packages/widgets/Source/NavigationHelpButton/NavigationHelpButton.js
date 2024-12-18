import {
  buildModuleUrl,
  defaultValue,
  defined,
  destroyObject,
  DeveloperError,
  FeatureDetection,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import NavigationHelpButtonViewModel from "./NavigationHelpButtonViewModel.js";

/**
 * <p>导航帮助按钮是一个单一的按钮小部件，用于显示使用鼠标导航地球的说明。</p><p style="clear: both;"></p><br/>
 *
 * @alias NavigationHelpButton
 * @constructor
 *
 * @param {object} options 带有以下属性的对象：
 * @param {Element|string} options.container 包含小部件的 DOM 元素或 ID。
 * @param {boolean} [options.instructionsInitiallyVisible=false] 如果导航说明应该最初可见，则为 true；否则为 false。
 *
 * @exception {DeveloperError} 文档中不存在 ID 为“container”的元素。
 *
 * @example
 * // In HTML head, include a link to the NavigationHelpButton.css stylesheet,
 * // and in the body, include: <div id="navigationHelpButtonContainer"></div>
 *
 * const navigationHelpButton = new Cesium.NavigationHelpButton({
 *     container : 'navigationHelpButtonContainer'
 * });
 */
function NavigationHelpButton(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.container)) {
    throw new DeveloperError("options.container is required.");
  }
  //>>includeEnd('debug');

  const container = getElement(options.container);

  const viewModel = new NavigationHelpButtonViewModel();

  const showInsructionsDefault = defaultValue(
    options.instructionsInitiallyVisible,
    false,
  );
  viewModel.showInstructions = showInsructionsDefault;

  viewModel._svgPath =
    "M16,1.466C7.973,1.466,1.466,7.973,1.466,16c0,8.027,6.507,14.534,14.534,14.534c8.027,0,14.534-6.507,14.534-14.534C30.534,7.973,24.027,1.466,16,1.466z M17.328,24.371h-2.707v-2.596h2.707V24.371zM17.328,19.003v0.858h-2.707v-1.057c0-3.19,3.63-3.696,3.63-5.963c0-1.034-0.924-1.826-2.134-1.826c-1.254,0-2.354,0.924-2.354,0.924l-1.541-1.915c0,0,1.519-1.584,4.137-1.584c2.487,0,4.796,1.54,4.796,4.136C21.156,16.208,17.328,16.627,17.328,19.003z";

  const wrapper = document.createElement("span");
  wrapper.className = "cesium-navigationHelpButton-wrapper";
  container.appendChild(wrapper);

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "cesium-button cesium-toolbar-button cesium-navigation-help-button";
  button.setAttribute(
    "data-bind",
    "\
attr: { title: tooltip },\
click: command,\
cesiumSvgPath: { path: _svgPath, width: 32, height: 32 }",
  );
  wrapper.appendChild(button);

  const instructionContainer = document.createElement("div");
  instructionContainer.className = "cesium-navigation-help";
  instructionContainer.setAttribute(
    "data-bind",
    'css: { "cesium-navigation-help-visible" : showInstructions}',
  );
  wrapper.appendChild(instructionContainer);

  const mouseButton = document.createElement("button");
  mouseButton.type = "button";
  mouseButton.className =
    "cesium-navigation-button cesium-navigation-button-left";
  mouseButton.setAttribute(
    "data-bind",
    'click: showClick, css: {"cesium-navigation-button-selected": !_touch, "cesium-navigation-button-unselected": _touch}',
  );
  const mouseIcon = document.createElement("img");
  mouseIcon.src = buildModuleUrl("Widgets/Images/NavigationHelp/Mouse.svg");
  mouseIcon.className = "cesium-navigation-button-icon";
  mouseIcon.style.width = "25px";
  mouseIcon.style.height = "25px";
  mouseButton.appendChild(mouseIcon);
  mouseButton.appendChild(document.createTextNode("Mouse"));

  const touchButton = document.createElement("button");
  touchButton.type = "button";
  touchButton.className =
    "cesium-navigation-button cesium-navigation-button-right";
  touchButton.setAttribute(
    "data-bind",
    'click: showTouch, css: {"cesium-navigation-button-selected": _touch, "cesium-navigation-button-unselected": !_touch}',
  );
  const touchIcon = document.createElement("img");
  touchIcon.src = buildModuleUrl("Widgets/Images/NavigationHelp/Touch.svg");
  touchIcon.className = "cesium-navigation-button-icon";
  touchIcon.style.width = "25px";
  touchIcon.style.height = "25px";
  touchButton.appendChild(touchIcon);
  touchButton.appendChild(document.createTextNode("Touch"));

  instructionContainer.appendChild(mouseButton);
  instructionContainer.appendChild(touchButton);

  const clickInstructions = document.createElement("div");
  clickInstructions.className =
    "cesium-click-navigation-help cesium-navigation-help-instructions";
  clickInstructions.setAttribute(
    "data-bind",
    'css: { "cesium-click-navigation-help-visible" : !_touch}',
  );
  clickInstructions.innerHTML = `\
            <table>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/MouseLeft.svg",
                    )}" width="48" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-pan">Pan view</div>\
                        <div class="cesium-navigation-help-details">Left click + drag</div>\
                    </td>\
                </tr>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/MouseRight.svg",
                    )}" width="48" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-zoom">Zoom view</div>\
                        <div class="cesium-navigation-help-details">Right click + drag, or</div>\
                        <div class="cesium-navigation-help-details">Mouse wheel scroll</div>\
                    </td>\
                </tr>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/MouseMiddle.svg",
                    )}" width="48" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-rotate">Rotate view</div>\
                        <div class="cesium-navigation-help-details">Middle click + drag, or</div>\
                        <div class="cesium-navigation-help-details">CTRL + Left/Right click + drag</div>\
                    </td>\
                </tr>\
            </table>`;

  instructionContainer.appendChild(clickInstructions);

  const touchInstructions = document.createElement("div");
  touchInstructions.className =
    "cesium-touch-navigation-help cesium-navigation-help-instructions";
  touchInstructions.setAttribute(
    "data-bind",
    'css: { "cesium-touch-navigation-help-visible" : _touch}',
  );
  touchInstructions.innerHTML = `\
            <table>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/TouchDrag.svg",
                    )}" width="70" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-pan">Pan view</div>\
                        <div class="cesium-navigation-help-details">One finger drag</div>\
                    </td>\
                </tr>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/TouchZoom.svg",
                    )}" width="70" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-zoom">Zoom view</div>\
                        <div class="cesium-navigation-help-details">Two finger pinch</div>\
                    </td>\
                </tr>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/TouchTilt.svg",
                    )}" width="70" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-rotate">Tilt view</div>\
                        <div class="cesium-navigation-help-details">Two finger drag, same direction</div>\
                    </td>\
                </tr>\
                <tr>\
                    <td><img src="${buildModuleUrl(
                      "Widgets/Images/NavigationHelp/TouchRotate.svg",
                    )}" width="70" height="48" /></td>\
                    <td>\
                        <div class="cesium-navigation-help-tilt">Rotate view</div>\
                        <div class="cesium-navigation-help-details">Two finger drag, opposite direction</div>\
                    </td>\
                </tr>\
            </table>`;

  instructionContainer.appendChild(touchInstructions);

  knockout.applyBindings(viewModel, wrapper);

  this._container = container;
  this._viewModel = viewModel;
  this._wrapper = wrapper;

  this._closeInstructions = function (e) {
    if (!wrapper.contains(e.target)) {
      viewModel.showInstructions = false;
    }
  };

  if (FeatureDetection.supportsPointerEvents()) {
    document.addEventListener("pointerdown", this._closeInstructions, true);
  } else {
    document.addEventListener("mousedown", this._closeInstructions, true);
    document.addEventListener("touchstart", this._closeInstructions, true);
  }
}

Object.defineProperties(NavigationHelpButton.prototype, {
  /**
   * 获取父容器.
   * @memberof NavigationHelpButton.prototype
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
   * @memberof NavigationHelpButton.prototype
   *
   * @type {NavigationHelpButtonViewModel}
   */
  viewModel: {
    get: function () {
      return this._viewModel;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false.
 */
NavigationHelpButton.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。如果永久地,从布局中移除小部件，则应调用此方法.
 */
NavigationHelpButton.prototype.destroy = function () {
  if (FeatureDetection.supportsPointerEvents()) {
    document.removeEventListener("pointerdown", this._closeInstructions, true);
  } else {
    document.removeEventListener("mousedown", this._closeInstructions, true);
    document.removeEventListener("touchstart", this._closeInstructions, true);
  }

  knockout.cleanNode(this._wrapper);
  this._container.removeChild(this._wrapper);

  return destroyObject(this);
};
export default NavigationHelpButton;
