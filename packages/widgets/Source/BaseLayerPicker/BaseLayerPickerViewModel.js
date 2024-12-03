import {
  defaultValue,
  defined,
  DeveloperError,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Terrain,
} from "@cesium/engine";
import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";

/**
 * {@link BaseLayerPicker} 的视图模型。
 * @alias BaseLayerPickerViewModel
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Globe} options.globe 要使用的 Globe。
 * @param {ProviderViewModel[]} [options.imageryProviderViewModels=[]] 用于影像的 ProviderViewModel 实例数组。
 * @param {ProviderViewModel} [options.selectedImageryProviderViewModel] 当前基础影像图层的视图模型，如果未提供，则使用第一个可用影像图层。
 * @param {ProviderViewModel[]} [options.terrainProviderViewModels=[]] 用于地形的 ProviderViewModel 实例数组。
 * @param {ProviderViewModel} [options.selectedTerrainProviderViewModel] 当前基础地形图层的视图模型，如果未提供，则使用第一个可用地形图层。
 *
 * @exception {DeveloperError} imageryProviderViewModels 必须是一个数组。
 * @exception {DeveloperError} terrainProviderViewModels 必须是一个数组。
 */

function BaseLayerPickerViewModel(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const globe = options.globe;
  const imageryProviderViewModels = defaultValue(
    options.imageryProviderViewModels,
    [],
  );
  const terrainProviderViewModels = defaultValue(
    options.terrainProviderViewModels,
    [],
  );

  //>>includeStart('debug', pragmas.debug);
  if (!defined(globe)) {
    throw new DeveloperError("globe is required");
  }
  //>>includeEnd('debug');

  this._globe = globe;

  /**
   * 获取或设置可供影像选择的 ProviderViewModel 实例数组。
   * 此属性是可观察的。
   * @type {ProviderViewModel[]}
   */
  this.imageryProviderViewModels = imageryProviderViewModels.slice(0);

  /**
   * 获取或设置可供地形选择的 ProviderViewModel 实例数组。
   * 此属性是可观察的。
   * @type {ProviderViewModel[]}
   */
  this.terrainProviderViewModels = terrainProviderViewModels.slice(0);

  /**
   * 获取或设置影像选择下拉菜单当前是否可见。
   * @type {boolean}
   * @default false
   */

  this.dropDownVisible = false;

  knockout.track(this, [
    "imageryProviderViewModels",
    "terrainProviderViewModels",
    "dropDownVisible",
  ]);

  const imageryObservable = knockout.getObservable(
    this,
    "imageryProviderViewModels",
  );
  const imageryProviders = knockout.pureComputed(function () {
    const providers = imageryObservable();
    const categories = {};
    let i;
    for (i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const category = provider.category;
      if (defined(categories[category])) {
        categories[category].push(provider);
      } else {
        categories[category] = [provider];
      }
    }
    const allCategoryNames = Object.keys(categories);

    const result = [];
    for (i = 0; i < allCategoryNames.length; i++) {
      const name = allCategoryNames[i];
      result.push({
        name: name,
        providers: categories[name],
      });
    }
    return result;
  });
  this._imageryProviders = imageryProviders;

  const terrainObservable = knockout.getObservable(
    this,
    "terrainProviderViewModels",
  );
  const terrainProviders = knockout.pureComputed(function () {
    const providers = terrainObservable();
    const categories = {};
    let i;
    for (i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const category = provider.category;
      if (defined(categories[category])) {
        categories[category].push(provider);
      } else {
        categories[category] = [provider];
      }
    }
    const allCategoryNames = Object.keys(categories);

    const result = [];
    for (i = 0; i < allCategoryNames.length; i++) {
      const name = allCategoryNames[i];
      result.push({
        name: name,
        providers: categories[name],
      });
    }
    return result;
  });
  this._terrainProviders = terrainProviders;

  /**
   * 获取按钮工具提示。此属性是可观察的。
   * @type {string}
   */

  this.buttonTooltip = undefined;
  knockout.defineProperty(this, "buttonTooltip", function () {
    const selectedImagery = this.selectedImagery;
    const selectedTerrain = this.selectedTerrain;

    const imageryTip = defined(selectedImagery)
      ? selectedImagery.name
      : undefined;
    const terrainTip = defined(selectedTerrain)
      ? selectedTerrain.name
      : undefined;

    if (defined(imageryTip) && defined(terrainTip)) {
      return `${imageryTip}\n${terrainTip}`;
    } else if (defined(imageryTip)) {
      return imageryTip;
    }
    return terrainTip;
  });

  /**
   * 获取按钮背景图像。此属性是可观察的。
   * @type {string}
   */
  this.buttonImageUrl = undefined;
  knockout.defineProperty(this, "buttonImageUrl", function () {
    const selectedImagery = this.selectedImagery;
    if (defined(selectedImagery)) {
      return selectedImagery.iconUrl;
    }
  });

  /**
   * 获取或设置当前选定的影像。此属性是可观察的。
   * @type {ProviderViewModel}
   * @default undefined
   */

  this.selectedImagery = undefined;
  const selectedImageryViewModel = knockout.observable();

  this._currentImageryLayers = [];
  knockout.defineProperty(this, "selectedImagery", {
    get: function () {
      return selectedImageryViewModel();
    },
    set: function (value) {
      if (selectedImageryViewModel() === value) {
        this.dropDownVisible = false;
        return;
      }

      let i;
      const currentImageryLayers = this._currentImageryLayers;
      const currentImageryLayersLength = currentImageryLayers.length;
      const imageryLayers = this._globe.imageryLayers;
      let hadExistingBaseLayer = false;
      for (i = 0; i < currentImageryLayersLength; i++) {
        const layersLength = imageryLayers.length;
        for (let x = 0; x < layersLength; x++) {
          const layer = imageryLayers.get(x);
          if (layer === currentImageryLayers[i]) {
            imageryLayers.remove(layer);
            hadExistingBaseLayer = true;
            break;
          }
        }
      }

      if (defined(value)) {
        const newProviders = value.creationCommand();
        if (Array.isArray(newProviders)) {
          const newProvidersLength = newProviders.length;
          this._currentImageryLayers = [];
          for (i = newProvidersLength - 1; i >= 0; i--) {
            const layer = ImageryLayer.fromProviderAsync(newProviders[i]);
            imageryLayers.add(layer, 0);
            this._currentImageryLayers.push(layer);
          }
        } else {
          this._currentImageryLayers = [];
          const layer = ImageryLayer.fromProviderAsync(newProviders);
          layer.name = value.name;
          if (hadExistingBaseLayer) {
            imageryLayers.add(layer, 0);
          } else {
            const baseLayer = imageryLayers.get(0);
            if (defined(baseLayer)) {
              imageryLayers.remove(baseLayer);
            }
            imageryLayers.add(layer, 0);
          }
          this._currentImageryLayers.push(layer);
        }
      }
      selectedImageryViewModel(value);
      this.dropDownVisible = false;
    },
  });

  /**
   * 获取或设置当前选定的地形。此属性是可观察的。
   * @type {ProviderViewModel}
   * @default undefined
   */

  this.selectedTerrain = undefined;
  const selectedTerrainViewModel = knockout.observable();

  knockout.defineProperty(this, "selectedTerrain", {
    get: function () {
      return selectedTerrainViewModel();
    },
    set: function (value) {
      if (selectedTerrainViewModel() === value) {
        this.dropDownVisible = false;
        return;
      }

      let newProvider;
      if (defined(value)) {
        newProvider = value.creationCommand();
      }

      // If this is not a promise, we must set this synchronously to avoid overriding depthTestAgainstTerrain
      // See https://github.com/CesiumGS/cesium/issues/6991
      if (defined(newProvider) && !defined(newProvider.then)) {
        this._globe.depthTestAgainstTerrain = !(
          newProvider instanceof EllipsoidTerrainProvider
        );
        this._globe.terrainProvider = newProvider;
      } else if (defined(newProvider)) {
        let cancelUpdate = false;
        const removeCancelListener =
          this._globe.terrainProviderChanged.addEventListener(() => {
            cancelUpdate = true;
            removeCancelListener();
          });

        const terrain = new Terrain(newProvider);
        const removeEventListener = terrain.readyEvent.addEventListener(
          (terrainProvider) => {
            if (cancelUpdate) {
              // Early return in case something has changed outside of the picker.
              return;
            }

            this._globe.depthTestAgainstTerrain = !(
              terrainProvider instanceof EllipsoidTerrainProvider
            );
            this._globe.terrainProvider = terrainProvider;
            removeEventListener();
          },
        );
      }

      selectedTerrainViewModel(value);
      this.dropDownVisible = false;
    },
  });

  const that = this;
  this._toggleDropDown = createCommand(function () {
    that.dropDownVisible = !that.dropDownVisible;
  });

  this.selectedImagery = defaultValue(
    options.selectedImageryProviderViewModel,
    imageryProviderViewModels[0],
  );
  this.selectedTerrain = options.selectedTerrainProviderViewModel;
}

Object.defineProperties(BaseLayerPickerViewModel.prototype, {
  /**
   * 获取切换下拉面板可见性的命令。
   * @memberof BaseLayerPickerViewModel.prototype
   *
   * @type {Command}
   */
  toggleDropDown: {
    get: function () {
      return this._toggleDropDown;
    },
  },

  /**
   * 获取地球对象。
   * @memberof BaseLayerPickerViewModel.prototype
   *
   * @type {Globe}
   */

  globe: {
    get: function () {
      return this._globe;
    },
  },
});
export default BaseLayerPickerViewModel;
