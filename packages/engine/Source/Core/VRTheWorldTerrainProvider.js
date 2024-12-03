import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import getImagePixels from "./getImagePixels.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import RuntimeError from "./RuntimeError.js";
import TerrainProvider from "./TerrainProvider.js";
import TileProviderError from "./TileProviderError.js";

function DataRectangle(rectangle, maxLevel) {
  this.rectangle = rectangle;
  this.maxLevel = maxLevel;
}

/**
 * @typedef {Object} VRTheWorldTerrainProvider.ConstructorOptions
 *
 * VRTheWorldTerrainProvider 构造函数的初始化选项
 *
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，则使用默认椭球体。
 * @property {Credit|string} [credit] 数据源的版权信息，将显示在画布上。
 */

/**
 * 用于在获取初始元数据时跟踪创建细节
 *
 * @constructor
 * @private
 *
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} options 描述初始化选项的对象
 */

function TerrainProviderBuilder(options) {
  this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this.tilingScheme = undefined;
  this.heightmapWidth = undefined;
  this.heightmapHeight = undefined;
  this.levelZeroMaximumGeometricError = undefined;
  this.rectangles = [];
}

TerrainProviderBuilder.prototype.build = function (provider) {
  provider._tilingScheme = this.tilingScheme;
  provider._heightmapWidth = this.heightmapWidth;
  provider._heightmapHeight = this.heightmapHeight;
  provider._levelZeroMaximumGeometricError =
    this.levelZeroMaximumGeometricError;
  provider._rectangles = this.rectangles;
};

function metadataSuccess(terrainProviderBuilder, xml) {
  const srs = xml.getElementsByTagName("SRS")[0].textContent;
  if (srs === "EPSG:4326") {
    terrainProviderBuilder.tilingScheme = new GeographicTilingScheme({
      ellipsoid: terrainProviderBuilder.ellipsoid,
    });
  } else {
    throw new RuntimeError(`SRS ${srs} is not supported`);
  }

  const tileFormat = xml.getElementsByTagName("TileFormat")[0];
  terrainProviderBuilder.heightmapWidth = parseInt(
    tileFormat.getAttribute("width"),
    10,
  );
  terrainProviderBuilder.heightmapHeight = parseInt(
    tileFormat.getAttribute("height"),
    10,
  );
  terrainProviderBuilder.levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      terrainProviderBuilder.ellipsoid,
      Math.min(
        terrainProviderBuilder.heightmapWidth,
        terrainProviderBuilder.heightmapHeight,
      ),
      terrainProviderBuilder.tilingScheme.getNumberOfXTilesAtLevel(0),
    );

  const dataRectangles = xml.getElementsByTagName("DataExtent");

  for (let i = 0; i < dataRectangles.length; ++i) {
    const dataRectangle = dataRectangles[i];

    const west = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("minx")),
    );
    const south = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("miny")),
    );
    const east = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("maxx")),
    );
    const north = CesiumMath.toRadians(
      parseFloat(dataRectangle.getAttribute("maxy")),
    );
    const maxLevel = parseInt(dataRectangle.getAttribute("maxlevel"), 10);

    terrainProviderBuilder.rectangles.push(
      new DataRectangle(new Rectangle(west, south, east, north), maxLevel),
    );
  }
}

function metadataFailure(resource, error, provider) {
  let message = `An error occurred while accessing ${resource.url}`;

  if (defined(error) && defined(error.message)) {
    message = `${message}: ${error.message}`;
  }

  TileProviderError.reportError(
    undefined,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
  );

  throw new RuntimeError(message);
}

async function requestMetadata(terrainProviderBuilder, resource, provider) {
  try {
    const xml = await resource.fetchXML();
    metadataSuccess(terrainProviderBuilder, xml);
  } catch (error) {
    metadataFailure(resource, error, provider);
  }
}

/**
 * <div class="notice">
 * 要构造一个 VRTheWorldTerrainProvider，请调用 {@link VRTheWorldTerrainProvider.fromUrl}。请不要直接调用构造函数。
 * </div>
 *
 * 一个 {@link TerrainProvider}，通过对从 {@link http://vr-theworld.com/|VT MÄK VR-TheWorld 服务器} 检索到的高度图进行网格化来生成地形几何体。
 *
 * @alias VRTheWorldTerrainProvider
 * @constructor
 *
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 *
 * @example
 * const terrainProvider = await Cesium.VRTheWorldTerrainProvider.fromUrl(
 *   "https://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/"
 * );
 * viewer.terrainProvider = terrainProvider;
 *
 * @see TerrainProvider
 */
function VRTheWorldTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._errorEvent = new Event();

  this._terrainDataStructure = {
    heightScale: 1.0 / 1000.0,
    heightOffset: -1000.0,
    elementsPerHeight: 3,
    stride: 4,
    elementMultiplier: 256.0,
    isBigEndian: true,
    lowestEncodedHeight: 0,
    highestEncodedHeight: 256 * 256 * 256 - 1,
  };

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  this._tilingScheme = undefined;
  this._rectangles = [];
}

Object.defineProperties(VRTheWorldTerrainProvider.prototype, {
  /**
   * 获取一个事件，当地形提供者遇到异步错误时会触发该事件。通过订阅该事件，您将被通知错误，并可以潜在地从中恢复。事件监听器会接收到 {@link TileProviderError} 的实例。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当该地形提供者处于活动状态时要显示的版权信息。通常用于给出地形的来源。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取此提供者使用的拼图方案。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {GeographicTilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，指示提供者是否包含水面掩码。水面掩码指示地球上的哪些区域是水而不是陆地，以便可以将其渲染为带有动态波浪的反射表面。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个对象，用于确定来自该提供者的地形的可用性，例如在点和矩形中。如果不可用信息不可用，该属性可能未定义。
   * @memberof VRTheWorldTerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */
  availability: {
    get: function () {
      return undefined;
    },
  },
});


/**
 * 创建一个 {@link TerrainProvider}，通过对从 {@link http://vr-theworld.com/|VT MÄK VR-TheWorld server} 检索到的高度图进行网格化来生成地形几何体。
 *
 * @param {Resource|String} url VR-TheWorld TileMap 的 URL。
 * @param {VRTheWorldTerrainProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<VRTheWorldTerrainProvider>}
 *
 * @example
 * const terrainProvider = await Cesium.VRTheWorldTerrainProvider.fromUrl(
 *   "https://www.vr-theworld.com/vr-theworld/tiles1.0.0/73/"
 * );
 * viewer.terrainProvider = terrainProvider;
 *
 * @exception {RuntimeError} metadata specifies and unknown SRS
 */
VRTheWorldTerrainProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const terrainProviderBuilder = new TerrainProviderBuilder(options);
  const resource = Resource.createIfNeeded(url);

  await requestMetadata(terrainProviderBuilder, resource);

  const provider = new VRTheWorldTerrainProvider(options);
  terrainProviderBuilder.build(provider);
  provider._resource = resource;

  return provider;
};

/**
 * 请求给定瓦片的几何数据。结果包括地形数据，并指示所有子瓦片均可用。
 *
 * @param {number} x 要请求几何数据的瓦片的 X 坐标。
 * @param {number} y 要请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 要请求几何数据的瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<TerrainData>|undefined} 请求的几何数据的承诺。如果此方法返回未定义而不是承诺，表示已经有太多请求在等待，将稍后重试该请求。
 */

VRTheWorldTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const yTiles = this._tilingScheme.getNumberOfYTilesAtLevel(level);
  const resource = this._resource.getDerivedResource({
    url: `${level}/${x}/${yTiles - y - 1}.tif`,
    queryParameters: {
      cesium: true,
    },
    request: request,
  });
  const promise = resource.fetchImage({
    preferImageBitmap: true,
  });
  if (!defined(promise)) {
    return undefined;
  }

  const that = this;
  return Promise.resolve(promise).then(function (image) {
    return new HeightmapTerrainData({
      buffer: getImagePixels(image),
      width: that._heightmapWidth,
      height: that._heightmapHeight,
      childTileMask: getChildMask(that, x, y, level),
      structure: that._terrainDataStructure,
    });
  });
};

/**
 * 获取在给定级别的瓦片中允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

VRTheWorldTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level,
) {
  return this._levelZeroMaximumGeometricError / (1 << level);
};

const rectangleScratch = new Rectangle();

function getChildMask(provider, x, y, level) {
  const tilingScheme = provider._tilingScheme;
  const rectangles = provider._rectangles;
  const parentRectangle = tilingScheme.tileXYToRectangle(x, y, level);

  let childMask = 0;

  for (let i = 0; i < rectangles.length && childMask !== 15; ++i) {
    const rectangle = rectangles[i];
    if (rectangle.maxLevel <= level) {
      continue;
    }

    const testRectangle = rectangle.rectangle;

    const intersection = Rectangle.intersection(
      testRectangle,
      parentRectangle,
      rectangleScratch,
    );
    if (defined(intersection)) {
      // Parent tile is inside this rectangle, so at least one child is, too.
      if (
        isTileInRectangle(tilingScheme, testRectangle, x * 2, y * 2, level + 1)
      ) {
        childMask |= 4; // northwest
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2 + 1,
          y * 2,
          level + 1,
        )
      ) {
        childMask |= 8; // northeast
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2,
          y * 2 + 1,
          level + 1,
        )
      ) {
        childMask |= 1; // southwest
      }
      if (
        isTileInRectangle(
          tilingScheme,
          testRectangle,
          x * 2 + 1,
          y * 2 + 1,
          level + 1,
        )
      ) {
        childMask |= 2; // southeast
      }
    }
  }

  return childMask;
}

function isTileInRectangle(tilingScheme, rectangle, x, y, level) {
  const tileRectangle = tilingScheme.tileXYToRectangle(x, y, level);
  return defined(
    Rectangle.intersection(tileRectangle, rectangle, rectangleScratch),
  );
}

/**
 * 确定瓦片的数据是否可以加载。
 *
 * @param {number} x 要请求几何数据的瓦片的 X 坐标。
 * @param {number} y 要请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 要请求几何数据的瓦片的级别。
 * @returns {boolean|undefined} 如果不支持则返回未定义，否则返回 true 或 false。
 */
VRTheWorldTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 确保我们加载瓦片的可用性数据。
 *
 * @param {number} x 要请求几何数据的瓦片的 X 坐标。
 * @param {number} y 要请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 要请求几何数据的瓦片的级别。
 * @returns {undefined|Promise<void>} 如果不需要加载任何内容则返回未定义，或者返回一个承诺，当所有所需的瓦片加载完毕时解析。
 */

VRTheWorldTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default VRTheWorldTerrainProvider;
