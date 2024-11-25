import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import TerrainProvider from "./TerrainProvider.js";

/**
 * 一个非常简单的 {@link TerrainProvider}，通过对椭球体表面进行细分来生成几何体。
 *
 * @alias EllipsoidTerrainProvider
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {TilingScheme} [options.tilingScheme] 指定椭球体表面如何分解为瓦片的瓦片方案。如果未提供此参数，将使用 {@link GeographicTilingScheme}。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 椭球体。如果指定了瓦片方案，则忽略此参数，使用瓦片方案的椭球体。如果两个参数都未指定，则使用默认椭球体。
 *
 * @see TerrainProvider
 */

function EllipsoidTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = options.tilingScheme;
  if (!defined(this._tilingScheme)) {
    this._tilingScheme = new GeographicTilingScheme({
      ellipsoid: defaultValue(options.ellipsoid, Ellipsoid.default),
    });
  }

  // Note: the 64 below does NOT need to match the actual vertex dimensions, because
  // the ellipsoid is significantly smoother than actual terrain.
  this._levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      64,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    );

  this._errorEvent = new Event();
}

Object.defineProperties(EllipsoidTerrainProvider.prototype, {
  /**
   * 获取当地形提供者遇到异步错误时引发的事件。通过订阅
   * 该事件，您将收到错误通知并有可能从中恢复。事件监听器
   * 会接收一个 {@link TileProviderError} 的实例。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在此地形提供者处于活动状态时要显示的信用信息。通常用于致谢
   * 地形的来源。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {GeographicTilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个指示提供者是否包含水面蒙版的值。水面蒙版
   * 指示地球的哪些区域是水而不是陆地，以便可以将其呈现为
   * 具有动态波浪的反光表面。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个指示请求的瓦片是否包含顶点法线的值。
   * @memberof EllipsoidTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },
  /**
   * 获取一个对象，该对象可用于确定从此提供者获取地形的可用性，例如
   * 在点和矩形中。如果无法获得可用性信息，则此属性可能为 undefined。
   * @memberof EllipsoidTerrainProvider.prototype
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
 * 请求给定瓦片的几何体。结果包括地形
 * 数据，并指示所有子瓦片均可用。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求几何体的承诺。如果此方法
 *          返回 undefined 而不是承诺，则表示已经有太多请求处于挂起状态，
 *          请求将稍后重试。
 */

EllipsoidTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const width = 16;
  const height = 16;
  return Promise.resolve(
    new HeightmapTerrainData({
      buffer: new Uint8Array(width * height),
      width: width,
      height: height,
    }),
  );
};

/**
 * 获取给定级别瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

EllipsoidTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level,
) {
  return this._levelZeroMaximumGeometricError / (1 << level);
};

/**
 * 确定瓦片的数据是否可供加载。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {boolean|undefined} 如果不支持则返回 undefined，否则返回 true 或 false。
 */

EllipsoidTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 确保我们为瓦片加载可用性数据。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {undefined} 此提供者不支持加载可用性。
 */

EllipsoidTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  return undefined;
};
export default EllipsoidTerrainProvider;
