/*
 * Esri 贡献：此代码实现了对 I3S（索引 3D 场景图层）的支持，这是 OGC 社区标准。
 * 联合作者：Alexandre Jean-Claude ajeanclaude@spiria.com
 * 联合作者：Anthony Mirabeau anthony.mirabeau@presagis.com
 * 联合作者：Elizabeth Rudkin elizabeth.rudkin@presagis.com
 * 联合作者：Tamrat Belayneh tbelayneh@esri.com
 *
 * I3S 格式由 Esri 开发，基于 Apache 2.0 许可共享，并维护在 https://github.com/Esri/i3s-spec。
 * 此实现支持在 CesiumJS 查看器中加载、显示和查询 I3S 图层（支持的版本包括
 * Esri GitHub I3S 版本 1.6、1.7/1.8 - 其 OGC 等效版本为 I3S 社区标准版本 1.1 和 1.2）。
 * 它使用户能够通过其 URL 访问 I3S 图层并将其加载到 CesiumJS 查看器中。
 *
 * 当场景图层初始化时，它完成如下操作：
 *
 * 处理 I3S 数据集的 3D 场景层资源 (https://github.com/Esri/i3s-spec/blob/master/docs/1.8/3DSceneLayer.cmn.md)
 * 并加载层数据。它通过为给定的 i3s 图层创建一个 Cesium 3D Tileset 来完成此操作，并加载根节点。
 * 当根节点被导入时，它创建一个附加到 Cesium 3D Tileset 的 Cesium 3D Tile
 * 并加载所有子节点：
 *  对于每个子节点
 *   创建一个占位符 3D tile，以便 LOD 显示可以使用节点的选择标准 (maximumScreenSpaceError)
 *   根据当前 LOD 显示和评估选择适当的节点。如果 Cesium 3D tile 可见，则在其上调用 requestContent。
 *   此时，我们拦截对 requestContent 的调用，并加载 I3S 格式的几何体
 *   该几何体实时转码为 glTF 格式，并由 CesiumJS 吞吐
 *   当几何体加载后，我们然后加载此节点的所有子节点作为占位符，以使 LOD
 *   也能了解它们。
 *
 * 关于转码：
 *
 * 我们使用网络工作者将 I3S 几何体转码为 glTF
 * 步骤如下：
 *
 * 解码几何体属性（位置、法线等..）以 DRACO 或二进制格式进行。
 * 如果请求，在创建 I3SDataProvider 时，用户可以选择指定一个平铺的高程地形提供者
 * (geoidTiledTerrainProvider)，例如基于 ArcGISTiledElevationTerrainProvider 的沙盒示例，
 * 允许将 I3S 图层的所有顶点和边界框的高度从（通常）与重力相关的（正交）高度转换为椭球高度。
 * 此步骤在融合具有不同高度来源的数据时至关重要（如在沙盒示例中融合 I3S 数据集（与重力相关）
 * 与 cesium 世界地形（椭球）时）。
 * 然后我们将顶点坐标从 LONG/LAT/HEIGHT 转换为局部空间中的笛卡尔坐标，并
 * 如果在属性元数据中指定，则进行适当缩放
 * 如果在属性元数据中定义了 UV 区域，则裁剪 UV
 * 在内存中创建一个 glTF 文档，将作为 glb 负载的一部分进行处理。
 *
 * 关于 GEOID 数据：
 *
 * 我们提供使用 GEOID 数据的能力，将高度从与重力相关的（正交）高度系统转换为椭球高度。
 * 我们采用服务架构来获取给定经纬度值的转换因子，利用基于 ArcGISTiledElevationTerrainProvider 的现有实现
 * 以避免需要庞大的查找文件。用于此转码服务的源数据编译自 https://earth-info.nga.mil/#tab_wgs84-data，并基于
 * EGM2008 重力模型。沙盒示例展示了如何在需要时设置地形提供服务。
 */

import Cartesian2 from "../Core/Cartesian2.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import HeightmapEncoding from "../Core/HeightmapEncoding.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import I3SLayer from "./I3SLayer.js";
import I3SStatistics from "./I3SStatistics.js";
import I3SSublayer from "./I3SSublayer.js";
import Lerc from "lerc";
import Rectangle from "../Core/Rectangle.js";

/**
 * @typedef {Object} I3SDataProvider.ConstructorOptions
 *
 * I3SDataProvider 构造函数的初始化选项
 *
 * @property {string} [name] I3S 数据集的名称。
 * @property {boolean} [show=true] 确定数据集是否显示。
 * @property {ArcGISTiledElevationTerrainProvider|Promise<ArcGISTiledElevationTerrainProvider>} [geoidTiledTerrainProvider] 描述地球重力模型的平铺高程提供者。如果定义，几何体将根据此提供者给出的偏移量进行移动。用于将与重力相关的高度的 I3S 数据集定位在正确的位置。
 * @property {Cesium3DTileset.ConstructorOptions} [cesium3dTilesetOptions] 包含传递给内部创建的 {@link Cesium3DTileset} 的选项的对象。有关有效属性列表，请参见 {@link Cesium3DTileset}。除 <code>url</code> 和 <code>show</code> 被 I3SDataProvider 的值覆盖外，所有选项均可使用。
 * @property {boolean} [showFeatures=false] 确定是否显示特征。
 * @property {boolean} [adjustMaterialAlphaMode=false] 根据顶点颜色的透明度调整材质的 alpha 模式的选项。当 <code>true</code> 时，材质的 alpha 模式（如果未定义）将设置为 BLEND，以适应颜色顶点属性中任何透明度的几何体。
 * @property {boolean} [applySymbology=false] 确定是否解析并应用 I3S 符号学以用于图层。
 * @property {boolean} [calculateNormals=false] 确定是否生成没有法线的 I3S 几何体的平面法线。
 *
 * @example
 * // Increase LOD by reducing SSE
 * const cesium3dTilesetOptions = {
 *   maximumScreenSpaceError: 1,
 * };
 * const i3sOptions = {
 *   cesium3dTilesetOptions: cesium3dTilesetOptions,
 * };
 *
 * @example
 * // Set a custom outline color to replace the color defined in I3S symbology
 * const cesium3dTilesetOptions = {
 *   outlineColor: Cesium.Color.BLUE,
 * };
 * const i3sOptions = {
 *   cesium3dTilesetOptions: cesium3dTilesetOptions,
 *   applySymbology: true,
 * };
 */

/**
 * I3SDataProvider 是支持 I3S 的主要公共类。url 选项
 * 应返回场景对象。目前支持的 I3S 版本是 1.6 和
 * 1.7/1.8（OGC I3S 1.2）。I3SFeature 和 I3SNode 类实现了
 * I3S 实体的对象模型，并提供公共接口。
 *
 * <div class="notice">
 * 此对象通常不直接实例化，使用 {@link I3SDataProvider.fromUrl}。
 * </div>
 *
 * @alias I3SDataProvider
 * @constructor
 *
 * @param {I3SDataProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see I3SDataProvider.fromUrl
 * @see ArcGISTiledElevationTerrainProvider
 *
 * @example
 * try {
 *   const i3sData = await I3SDataProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Frankfurt2017_vi3s_18/SceneServer/layers/0"
 *   );
 *   viewer.scene.primitives.add(i3sData);
 * } catch (error) {
 *   console.log(`There was an error creating the I3S Data Provider: ${error}`);
 * }
 *
 * @example
 * try {
 *   const geoidService = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/EGM2008/ImageServer"
 *   );
 *   const i3sData = await I3SDataProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Frankfurt2017_vi3s_18/SceneServer/layers/0", {
 *       geoidTiledTerrainProvider: geoidService
 *   });
 *   viewer.scene.primitives.add(i3sData);
 * } catch (error) {
 *   console.log(`There was an error creating the I3S Data Provider: ${error}`);
 * }
 */
function I3SDataProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  // All public configuration is defined as ES5 properties
  // These are just the "private" variables and their defaults.
  this._name = options.name;
  this._show = defaultValue(options.show, true);
  this._geoidTiledTerrainProvider = options.geoidTiledTerrainProvider;
  this._showFeatures = defaultValue(options.showFeatures, false);
  this._adjustMaterialAlphaMode = defaultValue(
    options.adjustMaterialAlphaMode,
    false,
  );
  this._applySymbology = defaultValue(options.applySymbology, false);
  this._calculateNormals = defaultValue(options.calculateNormals, false);

  this._cesium3dTilesetOptions = defaultValue(
    options.cesium3dTilesetOptions,
    defaultValue.EMPTY_OBJECT,
  );

  this._layers = [];
  this._sublayers = [];
  this._data = undefined;
  this._extent = undefined;
  this._geoidDataPromise = undefined;
  this._geoidDataList = undefined;
  this._decoderTaskProcessor = undefined;
  this._taskProcessorReadyPromise = undefined;
  this._attributeStatistics = [];
  this._layersExtent = [];
}

Object.defineProperties(I3SDataProvider.prototype, {
  /**
   * 获取此数据集的人类可读名称。
   * @memberof I3SDataProvider.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },

  /**
   * 确定数据集是否会被显示。
   * @memberof I3SDataProvider.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("value", value);
      //>>includeEnd('debug');

      if (this._show !== value) {
        this._show = value;
        for (let i = 0; i < this._layers.length; i++) {
          this._layers[i]._updateVisibility();
        }
      }
    },
  },

  /**
   * 引用 GEOID 服务用于正交高度到椭球高度转换的地形提供者。
   * @memberof I3SDataProvider.prototype
   * @type {ArcGISTiledElevationTerrainProvider}
   * @readonly
   */
  geoidTiledTerrainProvider: {
    get: function () {
      return this._geoidTiledTerrainProvider;
    },
  },

  /**
   * 获取图层集合。
   * @memberof I3SDataProvider.prototype
   * @type {I3SLayer[]}
   * @readonly
   */
  layers: {
    get: function () {
      return this._layers;
    },
  },

  /**
   * 获取建筑子图层集合。
   * @memberof I3SDataProvider.prototype
   * @type {I3SSublayer[]}
   * @readonly
   */
  sublayers: {
    get: function () {
      return this._sublayers;
    },
  },

  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SDataProvider.prototype
   * @type {object}
   * @readonly
   */
  data: {
    get: function () {
      return this._data;
    },
  },

  /**
   * 获取此 I3S 覆盖的范围。
   * @memberof I3SDataProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  extent: {
    get: function () {
      return this._extent;
    },
  },

  /**
   * 用于获取 I3S 数据集的资源。
   * @memberof I3SDataProvider.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },

  /**
   * 确定特征是否会被显示。
   * @memberof I3SDataProvider.prototype
   * @type {boolean}
   * @readonly
   */
  showFeatures: {
    get: function () {
      return this._showFeatures;
    },
  },

  /**
   * 确定材质的 alpha 模式是否会根据颜色顶点属性进行调整。
   * @memberof I3SDataProvider.prototype
   * @type {boolean}
   * @readonly
   */
  adjustMaterialAlphaMode: {
    get: function () {
      return this._adjustMaterialAlphaMode;
    },
  },

  /**
   * 确定 I3S 符号学是否会被解析并应用于图层。
   * @memberof I3SDataProvider.prototype
   * @type {boolean}
   * @readonly
   */
  applySymbology: {
    get: function () {
      return this._applySymbology;
    },
  },

  /**
   * 确定是否为没有法线的 I3S 几何体生成平面法线。
   * @memberof I3SDataProvider.prototype
   * @type {boolean}
   * @readonly
   */
  calculateNormals: {
    get: function () {
      return this._calculateNormals;
    },
  },
});


/**
 * 销毁此对象持有的 WebGL 资源。销毁一个对象允许确定性地释放
 * WebGL 资源，而不是依赖垃圾收集器来销毁此对象。
 * <p>
 * 一旦对象被销毁，就不应再使用它；调用除 <code>isDestroyed</code> 之外的任何函数
 * 将导致 {@link DeveloperError} 异常。因此，将返回值（<code>undefined</code>）分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 * @see I3SDataProvider#isDestroyed
 */

I3SDataProvider.prototype.destroy = function () {
  for (let i = 0; i < this._layers.length; i++) {
    if (defined(this._layers[i]._tileset)) {
      this._layers[i]._tileset.destroy();
    }
  }

  return destroyObject(this);
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应再使用；调用除 <code>isDestroyed</code> 之外的任何函数
 * 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} <code>true</code> 如果此对象已被销毁；否则返回 <code>false</code>。
 *
 * @see I3SDataProvider#destroy
 */

I3SDataProvider.prototype.isDestroyed = function () {
  return false;
};

/**
 * @private
 */
I3SDataProvider.prototype.update = function (frameState) {
  for (let i = 0; i < this._layers.length; i++) {
    if (defined(this._layers[i]._tileset)) {
      this._layers[i]._tileset.update(frameState);
    }
  }
};

/**
 * @private
 */
I3SDataProvider.prototype.prePassesUpdate = function (frameState) {
  for (let i = 0; i < this._layers.length; i++) {
    if (defined(this._layers[i]._tileset)) {
      this._layers[i]._tileset.prePassesUpdate(frameState);
    }
  }
};

/**
 * @private
 */
I3SDataProvider.prototype.postPassesUpdate = function (frameState) {
  for (let i = 0; i < this._layers.length; i++) {
    if (defined(this._layers[i]._tileset)) {
      this._layers[i]._tileset.postPassesUpdate(frameState);
    }
  }
};

/**
 * @private
 */
I3SDataProvider.prototype.updateForPass = function (frameState, passState) {
  for (let i = 0; i < this._layers.length; i++) {
    if (defined(this._layers[i]._tileset)) {
      this._layers[i]._tileset.updateForPass(frameState, passState);
    }
  }
};

function buildLayerUrl(provider, layerId) {
  const dataProviderUrl = provider.resource.getUrlComponent();

  let layerUrl = "";
  if (dataProviderUrl.match(/layers\/\d/)) {
    layerUrl = `${dataProviderUrl}`.replace(/\/+$/, "");
  } else {
    // Add '/' to url if needed + `$layers/${layerId}/` if tilesetUrl not already in ../layers/[id] format
    layerUrl = `${dataProviderUrl}`
      .replace(/\/?$/, "/")
      .concat(`layers/${layerId}`);
  }
  return layerUrl;
}

async function addLayers(provider, data, options) {
  if (data.layerType === "Building") {
    if (!defined(options.showFeatures)) {
      // The Building Scene Layer requires features to be shown to support filtering
      provider._showFeatures = true;
    }
    if (!defined(options.adjustMaterialAlphaMode)) {
      // The Building Scene Layer enables transparency by default
      provider._adjustMaterialAlphaMode = true;
    }
    if (!defined(options.applySymbology)) {
      // The Building Scene Layer applies symbology by default
      provider._applySymbology = true;
    }
    if (!defined(options.calculateNormals)) {
      // The Building Scene Layer calculates flat normals by default
      provider._calculateNormals = true;
    }

    const buildingLayerUrl = buildLayerUrl(provider, data.id);
    if (defined(data.sublayers)) {
      const promises = [];
      for (let i = 0; i < data.sublayers.length; i++) {
        const promise = I3SSublayer._fromData(
          provider,
          buildingLayerUrl,
          data.sublayers[i],
          provider,
        );
        promises.push(promise);
      }
      const sublayers = await Promise.all(promises);
      for (let i = 0; i < sublayers.length; i++) {
        const sublayer = sublayers[i];
        provider._sublayers.push(sublayer);
        provider._layers.push(...sublayer._i3sLayers);
      }
    }

    if (defined(data.statisticsHRef)) {
      const uri = buildingLayerUrl.concat(`/${data.statisticsHRef}`);
      const statistics = new I3SStatistics(provider, uri);
      await statistics.load();
      provider._attributeStatistics.push(statistics);
    }

    if (defined(data.fullExtent)) {
      const extent = Rectangle.fromDegrees(
        data.fullExtent.xmin,
        data.fullExtent.ymin,
        data.fullExtent.xmax,
        data.fullExtent.ymax,
      );
      provider._layersExtent.push(extent);
    }
  } else if (
    data.layerType === "3DObject" ||
    data.layerType === "IntegratedMesh"
  ) {
    if (
      !defined(options.calculateNormals) &&
      !defined(data.textureSetDefinitions)
    ) {
      // I3S Layers without textures should calculate flat normals by default
      provider._calculateNormals = true;
    }

    const newLayer = new I3SLayer(provider, data, provider);
    provider._layers.push(newLayer);
    if (defined(newLayer._extent)) {
      provider._layersExtent.push(newLayer._extent);
    }
  } else {
    // Filter other scene layer types out
    console.log(
      `${data.layerType} layer ${data.name} is skipped as not supported.`,
    );
  }
}

/**
 * 创建一个 I3SDataProvider。目前支持的 I3S 版本是 1.6 和
 * 1.7/1.8（OGC I3S 1.2）。
 *
 * @param {string|Resource} url I3S 数据集的 URL，应该返回一个 I3S 场景对象
 * @param {I3SDataProvider.ConstructorOptions} options 描述初始化选项的对象
 * @returns {Promise<I3SDataProvider>}
 *
 * @example
 * try {
 *   const i3sData = await I3SDataProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Frankfurt2017_vi3s_18/SceneServer/layers/0"
 *   );
 *   viewer.scene.primitives.add(i3sData);
 * } catch (error) {
 *   console.log(`There was an error creating the I3S Data Provider: ${error}`);
 * }
 *
 * @example
 * try {
 *   const geoidService = await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/EGM2008/ImageServer"
 *   );
 *   const i3sData = await I3SDataProvider.fromUrl(
 *     "https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/Frankfurt2017_vi3s_18/SceneServer/layers/0", {
 *       geoidTiledTerrainProvider: geoidService
 *   });
 *   viewer.scene.primitives.add(i3sData);
 * } catch (error) {
 *   console.log(`There was an error creating the I3S Data Provider: ${error}`);
 * }
 */
I3SDataProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(url);
  // Set a query parameter for json to avoid failure on html pages
  resource.setQueryParameters({ f: "pjson" }, true);
  const data = await I3SDataProvider.loadJson(resource);

  const provider = new I3SDataProvider(options);
  provider._resource = resource;
  provider._data = data;

  // Success
  if (defined(data.layers)) {
    const promises = [];
    for (let layerIndex = 0; layerIndex < data.layers.length; layerIndex++) {
      const promise = addLayers(provider, data.layers[layerIndex], options);
      promises.push(promise);
    }
    await Promise.all(promises);
  } else {
    await addLayers(provider, data, options);
  }

  provider._computeExtent();

  // Start loading all of the tiles
  const layerPromises = [];
  for (let i = 0; i < provider._layers.length; i++) {
    layerPromises.push(
      provider._layers[i].load(options.cesium3dTilesetOptions),
    );
  }

  await Promise.all(layerPromises);
  return provider;
};

/**
 * @private
 */
I3SDataProvider._fetchJson = function (resource) {
  return resource.fetchJson();
};

/**
 * @private
 *
 * @param {Resource} resource 要请求的 JSON 资源
 * @returns {Promise<object>} 获取到的数据
 */

I3SDataProvider.loadJson = async function (resource) {
  const data = await I3SDataProvider._fetchJson(resource);
  if (defined(data.error)) {
    console.error("Failed to fetch I3S ", resource.url);
    if (defined(data.error.message)) {
      console.error(data.error.message);
    }
    if (defined(data.error.details)) {
      for (let i = 0; i < data.error.details.length; i++) {
        console.log(data.error.details[i]);
      }
    }

    throw new RuntimeError(data.error);
  }

  return data;
};

/**
 * @private
 */
I3SDataProvider.prototype._loadBinary = async function (resource) {
  const buffer = await resource.fetchArrayBuffer();
  if (buffer.byteLength > 0) {
    // Check if we have a JSON response with 404
    const array = new Uint8Array(buffer);
    if (array[0] === "{".charCodeAt(0)) {
      const textContent = new TextDecoder();
      const str = textContent.decode(buffer);
      if (str.includes("404")) {
        throw new RuntimeError(`Failed to load binary: ${resource.url}`);
      }
    }
  }
  return buffer;
};

/**
 * @private
 */
I3SDataProvider.prototype._binarizeGltf = function (rawGltf) {
  const encoder = new TextEncoder();
  const rawGltfData = encoder.encode(JSON.stringify(rawGltf));
  const binaryGltfData = new Uint8Array(rawGltfData.byteLength + 20);
  const binaryGltf = {
    magic: new Uint8Array(binaryGltfData.buffer, 0, 4),
    version: new Uint32Array(binaryGltfData.buffer, 4, 1),
    length: new Uint32Array(binaryGltfData.buffer, 8, 1),
    chunkLength: new Uint32Array(binaryGltfData.buffer, 12, 1),
    chunkType: new Uint32Array(binaryGltfData.buffer, 16, 1),
    chunkData: new Uint8Array(
      binaryGltfData.buffer,
      20,
      rawGltfData.byteLength,
    ),
  };

  binaryGltf.magic[0] = "g".charCodeAt();
  binaryGltf.magic[1] = "l".charCodeAt();
  binaryGltf.magic[2] = "T".charCodeAt();
  binaryGltf.magic[3] = "F".charCodeAt();

  binaryGltf.version[0] = 2;
  binaryGltf.length[0] = binaryGltfData.byteLength;
  binaryGltf.chunkLength[0] = rawGltfData.byteLength;
  binaryGltf.chunkType[0] = 0x4e4f534a; // JSON
  binaryGltf.chunkData.set(rawGltfData);

  return binaryGltfData;
};

const scratchCartesian2 = new Cartesian2();

function getCoveredTiles(terrainProvider, extent) {
  const tilingScheme = terrainProvider.tilingScheme;

  // Sort points into a set of tiles
  const tileRequests = []; // Result will be an Array as it's easier to work with
  const tileRequestSet = {}; // A unique set

  const maxLevel = terrainProvider._lodCount;

  const topLeftCorner = Cartographic.fromRadians(extent.west, extent.north);
  const bottomRightCorner = Cartographic.fromRadians(extent.east, extent.south);
  const minCornerXY = tilingScheme.positionToTileXY(topLeftCorner, maxLevel);
  const maxCornerXY = tilingScheme.positionToTileXY(
    bottomRightCorner,
    maxLevel,
  );

  // Get all the tiles in between
  for (let x = minCornerXY.x; x <= maxCornerXY.x; x++) {
    for (let y = minCornerXY.y; y <= maxCornerXY.y; y++) {
      const xy = Cartesian2.fromElements(x, y, scratchCartesian2);
      const key = xy.toString();
      if (!tileRequestSet.hasOwnProperty(key)) {
        // When tile is requested for the first time
        const value = {
          x: xy.x,
          y: xy.y,
          level: maxLevel,
          tilingScheme: tilingScheme,
          terrainProvider: terrainProvider,
          positions: [],
        };
        tileRequestSet[key] = value;
        tileRequests.push(value);
      }
    }
  }

  // Send request for each required tile
  const tilePromises = [];
  for (let i = 0; i < tileRequests.length; ++i) {
    const tileRequest = tileRequests[i];
    const requestPromise = tileRequest.terrainProvider.requestTileGeometry(
      tileRequest.x,
      tileRequest.y,
      tileRequest.level,
    );

    tilePromises.push(requestPromise);
  }

  return Promise.all(tilePromises).then(function (heightMapBuffers) {
    const heightMaps = [];
    for (let i = 0; i < heightMapBuffers.length; i++) {
      const options = {
        tilingScheme: tilingScheme,
        x: tileRequests[i].x,
        y: tileRequests[i].y,
        level: tileRequests[i].level,
      };
      const heightMap = heightMapBuffers[i];

      let projectionType = "Geographic";
      if (tilingScheme._projection instanceof WebMercatorProjection) {
        projectionType = "WebMercator";
      }

      const heightMapData = {
        projectionType: projectionType,
        projection: tilingScheme._projection,
        nativeExtent: tilingScheme.tileXYToNativeRectangle(
          options.x,
          options.y,
          options.level,
        ),
        height: heightMap._height,
        width: heightMap._width,
        scale: heightMap._structure.heightScale,
        offset: heightMap._structure.heightOffset,
      };

      if (heightMap._encoding === HeightmapEncoding.LERC) {
        const result = Lerc.decode(heightMap._buffer);
        heightMapData.buffer = result.pixels[0];
      } else {
        heightMapData.buffer = heightMap._buffer;
      }

      heightMaps.push(heightMapData);
    }

    return heightMaps;
  });
}

async function loadGeoidData(provider) {
  // Load tiles from arcgis
  const geoidTerrainProvider = provider._geoidTiledTerrainProvider;

  if (!defined(geoidTerrainProvider)) {
    return;
  }

  try {
    const heightMaps = await getCoveredTiles(
      geoidTerrainProvider,
      provider._extent,
    );
    provider._geoidDataList = heightMaps;
  } catch (error) {
    console.log(
      "Error retrieving Geoid Terrain tiles - no geoid conversion will be performed.",
    );
  }
}

/**
 * @private
 */
I3SDataProvider.prototype.loadGeoidData = async function () {
  if (defined(this._geoidDataPromise)) {
    return this._geoidDataPromise;
  }

  this._geoidDataPromise = loadGeoidData(this);
  return this._geoidDataPromise;
};

/**
 * @private
 */
I3SDataProvider.prototype._computeExtent = function () {
  let rectangle;

  // Compute the extent from all layers
  for (
    let layerIndex = 0;
    layerIndex < this._layersExtent.length;
    layerIndex++
  ) {
    const layerExtent = this._layersExtent[layerIndex];
    if (!defined(rectangle)) {
      rectangle = Rectangle.clone(layerExtent);
    } else {
      Rectangle.union(rectangle, layerExtent, rectangle);
    }
  }

  this._extent = rectangle;
};

/**
 * 返回所有可用属性的名称集合
 * @returns {string[]} 属性名称的集合
 */

I3SDataProvider.prototype.getAttributeNames = function () {
  const attributes = [];
  for (let i = 0; i < this._attributeStatistics.length; ++i) {
    attributes.push(...this._attributeStatistics[i].names);
  }
  return attributes;
};

/**
 * 返回具有给定名称的属性的值集合
 * @param {string} name 属性名称
 * @returns {string[]} 属性值的集合
 */

I3SDataProvider.prototype.getAttributeValues = function (name) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("name", name);
  //>>includeEnd('debug');

  for (let i = 0; i < this._attributeStatistics.length; ++i) {
    const values = this._attributeStatistics[i]._getValues(name);
    if (defined(values)) {
      return values;
    }
  }
  return [];
};

/**
 * 对场景绘制的元素进行过滤，筛选特定的属性名称和值
 * @param {I3SNode.AttributeFilter[]} [filters=[]] 属性过滤器集合
 * @returns {Promise<void>} 应用过滤器时解析的 Promise
 */

I3SDataProvider.prototype.filterByAttributes = function (filters) {
  const promises = [];
  for (let i = 0; i < this._layers.length; i++) {
    const promise = this._layers[i].filterByAttributes(filters);
    promises.push(promise);
  }
  return Promise.all(promises);
};

export default I3SDataProvider;
