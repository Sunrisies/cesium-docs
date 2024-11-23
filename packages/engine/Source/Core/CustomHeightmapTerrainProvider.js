import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * @callback CustomHeightmapTerrainProvider.GeometryCallback
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]|Promise<Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|number[]>|undefined} 一个数组或一个承诺，表示以行主序的高度数组。如果为 undefined，则地球将渲染父瓦片。
 */


/**
 * 一个简单的 {@link TerrainProvider}，通过回调函数获取高度值。
 * 它可以用于程序生成的地形或作为加载自定义高度图数据的方式，而无需创建 {@link TerrainProvider} 的子类。
 *
 * 还有一些限制，例如没有水面遮罩、没有顶点法线和可用性，因此一个完整的 {@link TerrainProvider} 子类更适合这些更复杂的用例。
 *
 * @alias CustomHeightmapTerrainProvider
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {CustomHeightmapTerrainProvider.GeometryCallback} options.callback 请求瓦片几何体的回调函数。
 * @param {number} options.width 每个高度图瓦片的列数。
 * @param {number} options.height 每个高度图瓦片的行数。
 * @param {TilingScheme} [options.tilingScheme] 定义椭球表面如何划分为瓦片的瓦片方案。如果未提供此参数，将使用 {@link GeographicTilingScheme}。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球体。如果指定了瓦片方案，则忽略此参数，使用瓦片方案的椭球体。如果两个参数都未指定，将使用默认椭球体。
 * @param {Credit|string} [options.credit] 数据源的信用信息，将显示在画布上。
 *
 * @example
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrainProvider: new Cesium.CustomHeightmapTerrainProvider({
 *     width: 32,
 *     height: 32,
 *     callback: function (x, y, level) {
 *       return new Float32Array(32 * 32); // all zeros
 *     },
 *   }),
 * });
 *
 * @see TerrainProvider
 */
function CustomHeightmapTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.callback", options.callback);
  Check.defined("options.width", options.width);
  Check.defined("options.height", options.height);
  //>>includeEnd('debug');

  this._callback = options.callback;

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: defaultValue(options.ellipsoid, Ellipsoid.default),
    });
  }

  this._width = options.width;
  this._height = options.height;
  const maxTileDimensions = Math.max(this._width, this._height);

  this._levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      maxTileDimensions,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    );

  this._errorEvent = new Event();

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;
}

Object.defineProperties(CustomHeightmapTerrainProvider.prototype, {
  /**
   * 获取在地形提供者遇到异步错误时触发的事件。通过订阅
   * 该事件，您将收到错误通知，并可以进行可能的恢复。事件监听器
   * 将接收到一个 {@link TileProviderError} 的实例。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当此地形提供者处于活动状态时显示的信用信息。通常用于感谢
   * 地形的来源。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，指示该提供者是否包括水面遮罩。水面遮罩
   * 指示地球上哪些区域是水而不是陆地，这样它们可以被渲染
   * 成具有动态波浪的反射表面。
   * {@link CustomHeightmapTerrainProvider} 不支持水面遮罩，因此返回
   * 值将始终为 false。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个值，指示请求的瓦片是否包括顶点法线。
   * {@link CustomHeightmapTerrainProvider} 不支持顶点法线，因此返回
   * 值将始终为 false。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个对象，可以用来确定此提供者的地形可用性，例如
   * 在特定点和矩形中。此属性如果不可用，将可能是未定义的。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */
  availability: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取每个高度图瓦片的列数。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  width: {
    get: function () {
      return this._width;
    },
  },

  /**
   * 获取每个高度图瓦片的行数。
   * @memberof CustomHeightmapTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  height: {
    get: function () {
      return this._height;
    },
  },
});


/**
 * 请求给定瓦片的几何体。结果包括地形
 * 数据并指示所有子瓦片均可用。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @param {Request} [request] 请求对象，仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 对请求几何体的承诺。如果此方法
 *          返回 undefined 而不是承诺，则表示已有过多请求在等待
 *          处理，请求将稍后重试。
 */

CustomHeightmapTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const promise = this._callback(x, y, level);
  if (!defined(promise)) {
    return undefined;
  }

  const width = this._width;
  const height = this._height;

  return Promise.resolve(promise).then(function (heightmapData) {
    let buffer = heightmapData;
    if (Array.isArray(buffer)) {
      // HeightmapTerrainData expects a TypedArray, so convert from number[] to Float64Array
      buffer = new Float64Array(buffer);
    }

    return new HeightmapTerrainData({
      buffer: buffer,
      width: width,
      height: height,
    });
  });
};

/**
 * 获取给定级别瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

CustomHeightmapTerrainProvider.prototype.getLevelMaximumGeometricError =
  function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

/**
 * 确定瓦片的数据是否可供加载。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {boolean|undefined} 如果不支持则为未定义， 否则为 true 或 false。
 */

CustomHeightmapTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 确保我们加载瓦片的可用性数据。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {undefined|Promise<void>} 如果没有需要加载的内容则为未定义，或者返回一个承诺，当所有需要的瓦片加载完成时解析。
 */

CustomHeightmapTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default CustomHeightmapTerrainProvider;
