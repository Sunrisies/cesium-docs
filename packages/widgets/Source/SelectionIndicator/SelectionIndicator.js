import {
  defined,
  destroyObject,
  DeveloperError,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import SelectionIndicatorViewModel from "./SelectionIndicatorViewModel.js";

/**
 * 用于在选定对象上显示指示器的小部件.
 *
 * @alias SelectionIndicator
 * @constructor
 *
 * @param {Element|string} container 包含小部件的 DOM 元素或 ID.
 * @param {Scene} scene 要使用的场景实例.
 *
 * @exception {DeveloperError} 文档中不存在 ID 为“container”的元素.
 */
function SelectionIndicator(container, scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug')

  container = getElement(container);

  this._container = container;

  const el = document.createElement("div");
  el.className = "cesium-selection-wrapper";
  el.setAttribute(
    "data-bind",
    '\
style: { "top" : _screenPositionY, "left" : _screenPositionX },\
css: { "cesium-selection-wrapper-visible" : isVisible }',
  );
  container.appendChild(el);
  this._element = el;

  const svgNS = "http://www.w3.org/2000/svg";
  const path =
    "M -34 -34 L -34 -11.25 L -30 -15.25 L -30 -30 L -15.25 -30 L -11.25 -34 L -34 -34 z M 11.25 -34 L 15.25 -30 L 30 -30 L 30 -15.25 L 34 -11.25 L 34 -34 L 11.25 -34 z M -34 11.25 L -34 34 L -11.25 34 L -15.25 30 L -30 30 L -30 15.25 L -34 11.25 z M 34 11.25 L 30 15.25 L 30 30 L 15.25 30 L 11.25 34 L 34 34 L 34 11.25 z";

  const svg = document.createElementNS(svgNS, "svg:svg");
  svg.setAttribute("width", 160);
  svg.setAttribute("height", 160);
  svg.setAttribute("viewBox", "0 0 160 160");

  const group = document.createElementNS(svgNS, "g");
  group.setAttribute("transform", "translate(80,80)");
  svg.appendChild(group);

  const pathElement = document.createElementNS(svgNS, "path");
  pathElement.setAttribute("data-bind", "attr: { transform: _transform }");
  pathElement.setAttribute("d", path);
  group.appendChild(pathElement);

  el.appendChild(svg);

  const viewModel = new SelectionIndicatorViewModel(
    scene,
    this._element,
    this._container,
  );
  this._viewModel = viewModel;

  knockout.applyBindings(this._viewModel, this._element);
}

Object.defineProperties(SelectionIndicator.prototype, {
  /**
   * 获取父容器.
   * @memberof SelectionIndicator.prototype
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
   * @memberof SelectionIndicator.prototype
   *
   * @type {SelectionIndicatorViewModel}
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
SelectionIndicator.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。如果永久地,从布局中移除小部件，则应调用此方法.
 */
SelectionIndicator.prototype.destroy = function () {
  const container = this._container;
  knockout.cleanNode(this._element);
  container.removeChild(this._element);
  return destroyObject(this);
};
export default SelectionIndicator;
