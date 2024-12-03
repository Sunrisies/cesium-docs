import {
  defined,
  destroyObject,
  DeveloperError,
  FeatureDetection,
  getElement,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import BaseLayerPickerViewModel from "./BaseLayerPickerViewModel.js";

/**
 * <span style="display: block; text-align: center;">
 * <img src="Images/BaseLayerPicker.png" width="264" alt="BaseLayerPicker" />
 * <br />BaseLayerPicker 打开下拉面板。
 * </span>
 * <br /><br />
 * BaseLayerPicker 是一个单按钮小部件，显示可用影像和地形提供者的面板。当选择影像时，将创建相应的影像图层并作为影像集合的基础层插入；移除现有基础层。当选择地形时，将替换当前的地形提供者。可用提供者列表中的每个项包含一个名称、一个代表性图标和一个工具提示，在悬停时显示更多信息。列表最初为空，且必须在使用前进行配置，如下面的示例所示。
 * <br /><br />
 * 默认情况下，BaseLayerPicker 使用默认的示例提供者列表进行演示。特别是这些提供者中的一些，例如 <a href="https://developers.arcgis.com" target="_blank">Esri ArcGIS</a> 和 <a href="https://docs.stadiamaps.com/" target="_blank">Stadia Maps</a>，具有单独的服务条款，并且在生产使用中需要身份验证。
 *
 * @alias BaseLayerPicker
 * @constructor
 *
 * @param {Element|string} container 此小部件的父 HTML 容器节点或 ID。
 * @param {object} options 包含以下属性的对象：
 * @param {Globe} options.globe 要使用的 Globe。
 * @param {ProviderViewModel[]} [options.imageryProviderViewModels=[]] 用于影像的 ProviderViewModel 实例数组。
 * @param {ProviderViewModel} [options.selectedImageryProviderViewModel] 当前基础影像图层的视图模型，如果未提供，则使用第一个可用影像图层。
 * @param {ProviderViewModel[]} [options.terrainProviderViewModels=[]] 用于地形的 ProviderViewModel 实例数组。
 * @param {ProviderViewModel} [options.selectedTerrainProviderViewModel] 当前基础地形图层的视图模型，如果未提供，则使用第一个可用地形图层。
 *
 * @exception {DeveloperError} 文档中不存在 ID 为“container”的元素.
 *
 *
 * @example
 * // In HTML head, include a link to the BaseLayerPicker.css stylesheet,
 * // and in the body, include: <div id="baseLayerPickerContainer"
 * //   style="position:absolute;top:24px;right:24px;width:38px;height:38px;"></div>
 *
 * //Create the list of available providers we would like the user to select from.
 * //This example uses 3, OpenStreetMap, The Black Marble, and a single, non-streaming world image.
 * const imageryViewModels = [];
 * imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Open\u00adStreet\u00adMap",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
 *      tooltip: "OpenStreetMap (OSM) is a collaborative project to create a free editable \
 * map of the world.\nhttp://www.openstreetmap.org",
 *      creationFunction: function() {
 *          return new Cesium.OpenStreetMapImageryProvider({
 *              url: "https://tile.openstreetmap.org/"
 *          });
 *      }
 *  }));
 *
 *  imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Earth at Night",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/blackMarble.png"),
 *      tooltip: "The lights of cities and villages trace the outlines of civilization \
 * in this global view of the Earth at night as seen by NASA/NOAA's Suomi NPP satellite.",
 *      creationFunction: function() {
 *          return Cesium.IonImageryProvider.fromAssetId(3812);
 *      }
 *  }));
 *
 *  imageryViewModels.push(new Cesium.ProviderViewModel({
 *      name: "Natural Earth\u00a0II",
 *      iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/naturalEarthII.png"),
 *      tooltip: "Natural Earth II, darkened for contrast.\nhttp://www.naturalearthdata.com/",
 *      creationFunction: function() {
 *          return Cesium.TileMapServiceImageryProvider.fromUrl(
 *              Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
 *          );
 *      }
 *  }));
 *
 * //Create a CesiumWidget without imagery, if you haven't already done so.
 * const cesiumWidget = new Cesium.CesiumWidget("cesiumContainer", { baseLayer: false });
 *
 * //Finally, create the baseLayerPicker widget using our view models.
 * const layers = cesiumWidget.imageryLayers;
 * const baseLayerPicker = new Cesium.BaseLayerPicker("baseLayerPickerContainer", {
 *     globe: cesiumWidget.scene.globe,
 *     imageryProviderViewModels: imageryViewModels
 * });
 *
 * @see TerrainProvider
 * @see ImageryProvider
 * @see ImageryLayerCollection
 */
function BaseLayerPicker(container, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);

  const viewModel = new BaseLayerPickerViewModel(options);

  const element = document.createElement("button");
  element.type = "button";
  element.className = "cesium-button cesium-toolbar-button";
  element.setAttribute(
    "data-bind",
    "\
attr: { title: buttonTooltip },\
click: toggleDropDown",
  );
  container.appendChild(element);

  const imgElement = document.createElement("img");
  imgElement.setAttribute("draggable", "false");
  imgElement.className = "cesium-baseLayerPicker-selected";
  imgElement.setAttribute(
    "data-bind",
    "\
attr: { src: buttonImageUrl }, visible: !!buttonImageUrl",
  );
  element.appendChild(imgElement);

  const dropPanel = document.createElement("div");
  dropPanel.className = "cesium-baseLayerPicker-dropDown";
  dropPanel.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-dropDown-visible" : dropDownVisible }',
  );
  container.appendChild(dropPanel);

  const imageryTitle = document.createElement("div");
  imageryTitle.className = "cesium-baseLayerPicker-sectionTitle";
  imageryTitle.setAttribute(
    "data-bind",
    "visible: imageryProviderViewModels.length > 0",
  );
  imageryTitle.innerHTML = "Imagery";
  dropPanel.appendChild(imageryTitle);

  const imagerySection = document.createElement("div");
  imagerySection.className = "cesium-baseLayerPicker-section";
  imagerySection.setAttribute("data-bind", "foreach: _imageryProviders");
  dropPanel.appendChild(imagerySection);

  const imageryCategories = document.createElement("div");
  imageryCategories.className = "cesium-baseLayerPicker-category";
  imagerySection.appendChild(imageryCategories);

  const categoryTitle = document.createElement("div");
  categoryTitle.className = "cesium-baseLayerPicker-categoryTitle";
  categoryTitle.setAttribute("data-bind", "text: name");
  imageryCategories.appendChild(categoryTitle);

  const imageryChoices = document.createElement("div");
  imageryChoices.className = "cesium-baseLayerPicker-choices";
  imageryChoices.setAttribute("data-bind", "foreach: providers");
  imageryCategories.appendChild(imageryChoices);

  const imageryProvider = document.createElement("div");
  imageryProvider.className = "cesium-baseLayerPicker-item";
  imageryProvider.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-selectedItem" : $data === $parents[1].selectedImagery },\
attr: { title: tooltip },\
visible: creationCommand.canExecute,\
click: function($data) { $parents[1].selectedImagery = $data; }',
  );
  imageryChoices.appendChild(imageryProvider);

  const providerIcon = document.createElement("img");
  providerIcon.className = "cesium-baseLayerPicker-itemIcon";
  providerIcon.setAttribute("data-bind", "attr: { src: iconUrl }");
  providerIcon.setAttribute("draggable", "false");
  imageryProvider.appendChild(providerIcon);

  const providerLabel = document.createElement("div");
  providerLabel.className = "cesium-baseLayerPicker-itemLabel";
  providerLabel.setAttribute("data-bind", "text: name");
  imageryProvider.appendChild(providerLabel);

  const terrainTitle = document.createElement("div");
  terrainTitle.className = "cesium-baseLayerPicker-sectionTitle";
  terrainTitle.setAttribute(
    "data-bind",
    "visible: terrainProviderViewModels.length > 0",
  );
  terrainTitle.innerHTML = "Terrain";
  dropPanel.appendChild(terrainTitle);

  const terrainSection = document.createElement("div");
  terrainSection.className = "cesium-baseLayerPicker-section";
  terrainSection.setAttribute("data-bind", "foreach: _terrainProviders");
  dropPanel.appendChild(terrainSection);

  const terrainCategories = document.createElement("div");
  terrainCategories.className = "cesium-baseLayerPicker-category";
  terrainSection.appendChild(terrainCategories);

  const terrainCategoryTitle = document.createElement("div");
  terrainCategoryTitle.className = "cesium-baseLayerPicker-categoryTitle";
  terrainCategoryTitle.setAttribute("data-bind", "text: name");
  terrainCategories.appendChild(terrainCategoryTitle);

  const terrainChoices = document.createElement("div");
  terrainChoices.className = "cesium-baseLayerPicker-choices";
  terrainChoices.setAttribute("data-bind", "foreach: providers");
  terrainCategories.appendChild(terrainChoices);

  const terrainProvider = document.createElement("div");
  terrainProvider.className = "cesium-baseLayerPicker-item";
  terrainProvider.setAttribute(
    "data-bind",
    '\
css: { "cesium-baseLayerPicker-selectedItem" : $data === $parents[1].selectedTerrain },\
attr: { title: tooltip },\
visible: creationCommand.canExecute,\
click: function($data) { $parents[1].selectedTerrain = $data; }',
  );
  terrainChoices.appendChild(terrainProvider);

  const terrainProviderIcon = document.createElement("img");
  terrainProviderIcon.className = "cesium-baseLayerPicker-itemIcon";
  terrainProviderIcon.setAttribute("data-bind", "attr: { src: iconUrl }");
  terrainProviderIcon.setAttribute("draggable", "false");
  terrainProvider.appendChild(terrainProviderIcon);

  const terrainProviderLabel = document.createElement("div");
  terrainProviderLabel.className = "cesium-baseLayerPicker-itemLabel";
  terrainProviderLabel.setAttribute("data-bind", "text: name");
  terrainProvider.appendChild(terrainProviderLabel);

  knockout.applyBindings(viewModel, element);
  knockout.applyBindings(viewModel, dropPanel);

  this._viewModel = viewModel;
  this._container = container;
  this._element = element;
  this._dropPanel = dropPanel;

  this._closeDropDown = function (e) {
    if (!(element.contains(e.target) || dropPanel.contains(e.target))) {
      viewModel.dropDownVisible = false;
    }
  };

  if (FeatureDetection.supportsPointerEvents()) {
    document.addEventListener("pointerdown", this._closeDropDown, true);
  } else {
    document.addEventListener("mousedown", this._closeDropDown, true);
    document.addEventListener("touchstart", this._closeDropDown, true);
  }
}

Object.defineProperties(BaseLayerPicker.prototype, {
  /**
   * 获取父容器.
   * @memberof BaseLayerPicker.prototype
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
   * @memberof BaseLayerPicker.prototype
   *
   * @type {BaseLayerPickerViewModel}
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
BaseLayerPicker.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。如果永久地,从布局中移除小部件，则应调用此方法.
 */
BaseLayerPicker.prototype.destroy = function () {
  if (FeatureDetection.supportsPointerEvents()) {
    document.removeEventListener("pointerdown", this._closeDropDown, true);
  } else {
    document.removeEventListener("mousedown", this._closeDropDown, true);
    document.removeEventListener("touchstart", this._closeDropDown, true);
  }

  knockout.cleanNode(this._element);
  knockout.cleanNode(this._dropPanel);
  this._container.removeChild(this._element);
  this._container.removeChild(this._dropPanel);
  return destroyObject(this);
};
export default BaseLayerPicker;
