import {
  defined,
  destroyObject,
  DeveloperError,
  FeatureDetection,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import GeocoderViewModel from "./GeocoderViewModel.js";

const startSearchPath =
  "M29.772,26.433l-7.126-7.126c0.96-1.583,1.523-3.435,1.524-5.421C24.169,8.093,19.478,3.401,13.688,3.399C7.897,3.401,3.204,8.093,3.204,13.885c0,5.789,4.693,10.481,10.484,10.481c1.987,0,3.839-0.563,5.422-1.523l7.128,7.127L29.772,26.433zM7.203,13.885c0.006-3.582,2.903-6.478,6.484-6.486c3.579,0.008,6.478,2.904,6.484,6.486c-0.007,3.58-2.905,6.476-6.484,6.484C10.106,20.361,7.209,17.465,7.203,13.885z";
const stopSearchPath =
  "M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z";

/**
 * 一个用于查找地址和地标，并将相机飞向它们的小部件。地理编码是
 * 使用 {@link https://cesium.com/cesium-ion/|Cesium ion}.
 *
 * @alias Geocoder
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Element|string} options.container 将包含小部件的DOM元素或ID。
 * @param {Scene} options.scene 要使用的场景实例。
 * @param {GeocoderService[]} [options.geocoderServices] 要使用的地理编码器服务
 * @param {boolean} [options.autoComplete = true] 如果地理编码器应在用户键入自动完成时进行查询，则为True
 * @param {number} [options.flightDuration=1.5] 摄像机飞行到输入位置的持续时间，以秒为单位。
 * @param {Geocoder.DestinationFoundFunction} [options.destinationFound=GeocoderViewModel.flyToDestination] 在地理编码成功后调用的回调函数。如果没有提供，默认行为是将相机飞到结果目的地。
 */
function Geocoder(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.container)) {
    throw new DeveloperError("options.container is required.");
  }
  if (!defined(options.scene)) {
    throw new DeveloperError("options.scene is required.");
  }
  //>>includeEnd('debug');

  const container = getElement(options.container);
  const viewModel = new GeocoderViewModel(options);

  viewModel._startSearchPath = startSearchPath;
  viewModel._stopSearchPath = stopSearchPath;

  const form = document.createElement("form");
  form.setAttribute("data-bind", "submit: search");

  const textBox = document.createElement("input");
  textBox.type = "search";
  textBox.className = "cesium-geocoder-input";
  textBox.setAttribute("placeholder", "Enter an address or landmark...");
  textBox.setAttribute(
    "data-bind",
    '\
textInput: searchText,\
disable: isSearchInProgress,\
event: { keyup: handleKeyUp, keydown: handleKeyDown, mouseover: deselectSuggestion },\
css: { "cesium-geocoder-input-wide" : keepExpanded || searchText.length > 0 },\
hasFocus: _focusTextbox',
  );

  this._onTextBoxFocus = function() {
    // as of 2016-10-19, setTimeout is required to ensure that the
    // text is focused on Safari 10
    setTimeout(function() {
      textBox.select();
    }, 0);
  };

  textBox.addEventListener("focus", this._onTextBoxFocus, false);
  form.appendChild(textBox);
  this._textBox = textBox;

  const searchButton = document.createElement("span");
  searchButton.className = "cesium-geocoder-searchButton";
  searchButton.setAttribute(
    "data-bind",
    "\
click: search,\
cesiumSvgPath: { path: isSearchInProgress ? _stopSearchPath : _startSearchPath, width: 32, height: 32 }",
  );
  form.appendChild(searchButton);

  container.appendChild(form);

  const searchSuggestionsContainer = document.createElement("div");
  searchSuggestionsContainer.className = "search-results";
  searchSuggestionsContainer.setAttribute(
    "data-bind",
    "visible: _suggestionsVisible",
  );

  const suggestionsList = document.createElement("ul");
  suggestionsList.setAttribute("data-bind", "foreach: _suggestions");
  const suggestions = document.createElement("li");
  suggestionsList.appendChild(suggestions);
  suggestions.setAttribute(
    "data-bind",
    "text: $data.displayName, \
click: $parent.activateSuggestion, \
event: { mouseover: $parent.handleMouseover}, \
css: { active: $data === $parent._selectedSuggestion }",
  );

  searchSuggestionsContainer.appendChild(suggestionsList);
  container.appendChild(searchSuggestionsContainer);

  knockout.applyBindings(viewModel, form);
  knockout.applyBindings(viewModel, searchSuggestionsContainer);

  this._container = container;
  this._searchSuggestionsContainer = searchSuggestionsContainer;
  this._viewModel = viewModel;
  this._form = form;

  this._onInputBegin = function(e) {
    // e.target will not be correct if we are inside of the Shadow DOM
    // and contains will always fail. To retrieve the correct target,
    // we need to access the first element of the composedPath.
    // This allows us to use shadow DOM if it exists and fall
    // back to legacy behavior if its not being used.

    let target = e.target;
    if (typeof e.composedPath === "function") {
      target = e.composedPath()[0];
    }

    if (!container.contains(target)) {
      viewModel._focusTextbox = false;
      viewModel.hideSuggestions();
    }
  };

  this._onInputEnd = function(e) {
    viewModel._focusTextbox = true;
    viewModel.showSuggestions();
  };

  //We subscribe to both begin and end events in order to give the text box
  //focus no matter where on the widget is clicked.

  if (FeatureDetection.supportsPointerEvents()) {
    document.addEventListener("pointerdown", this._onInputBegin, true);
    container.addEventListener("pointerup", this._onInputEnd, true);
    container.addEventListener("pointercancel", this._onInputEnd, true);
  } else {
    document.addEventListener("mousedown", this._onInputBegin, true);
    container.addEventListener("mouseup", this._onInputEnd, true);
    document.addEventListener("touchstart", this._onInputBegin, true);
    container.addEventListener("touchend", this._onInputEnd, true);
    container.addEventListener("touchcancel", this._onInputEnd, true);
  }
}

Object.defineProperties(Geocoder.prototype, {
  /**
   * 获取父容器
   * @memberof Geocoder.prototype
   *
   * @type {Element}
   */
  container: {
    get: function() {
      return this._container;
    },
  },

  /**
   * 获取父容器。
   * @memberof Geocoder.prototype
   *
   * @type {Element}
   */
  searchSuggestionsContainer: {
    get: function() {
      return this._searchSuggestionsContainer;
    },
  },

  /** 
   * 获取数据 
   * @memberof Geocoder.prototype
   * 
   * @type {string}
   * */
  data: {
    get: function() {
      return '测试数据';
    },
  },

  /**
   * 获取模型
   * @memberof Geocoder.prototype
   *
   * @type {GeocoderViewModel}
   */
  viewModel: {
    get: function() {
      return this._viewModel;
    },
  },
});

/**
 * @returns {boolean} 如果对象已被销毁则为true,否则为false。
 */
Geocoder.prototype.isDestroyed = function() {
  return false;
};

/**
 * 销毁小部件,如果永久
 * 从布局在中移除小部件
 */
Geocoder.prototype.destroy = function() {
  const container = this._container;
  if (FeatureDetection.supportsPointerEvents()) {
    document.removeEventListener("pointerdown", this._onInputBegin, true);
    container.removeEventListener("pointerup", this._onInputEnd, true);
  } else {
    document.removeEventListener("mousedown", this._onInputBegin, true);
    container.removeEventListener("mouseup", this._onInputEnd, true);
    document.removeEventListener("touchstart", this._onInputBegin, true);
    container.removeEventListener("touchend", this._onInputEnd, true);
  }
  this._viewModel.destroy();
  knockout.cleanNode(this._form);
  knockout.cleanNode(this._searchSuggestionsContainer);
  container.removeChild(this._form);
  container.removeChild(this._searchSuggestionsContainer);
  this._textBox.removeEventListener("focus", this._onTextBoxFocus, false);

  return destroyObject(this);
};

/**
 * 处理成功地理编码结果的函数。
 * @callback Geocoder.DestinationFoundFunction
 * @param {GeocoderViewModel} viewModel 视图模型。
 * @param {Cartesian3|Rectangle} destination 地理编码的目标结果。
 */
export default Geocoder;
