import DeveloperError from "./DeveloperError.js";

/**
 * 定义大地测量椭球坐标（{@link Cartographic}）如何投影到
 * 像 Cesium 的 2D 和 Columbus View 模式这样的平面地图上。
 *
 * @alias MapProjection
 * @constructor
 * @abstract
 *
 * @see GeographicProjection
 * @see WebMercatorProjection
 */

function MapProjection() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(MapProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}.
   *
   * @memberof MapProjection.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 将 {@link Cartographic} 坐标（以弧度表示）投影为特定投影的地图坐标（以米为单位）。
 *
 * @memberof MapProjection
 * @function
 *
 * @param {Cartographic} cartographic 要投影的坐标。
 * @param {Cartesian3} [result] 用于拷贝结果的实例。如果此参数为
 *        未定义，则会创建并返回一个新实例。
 * @returns {Cartesian3} 投影后的坐标。如果结果参数不为未定义，
 *          则坐标会被复制到该实例中并返回。否则，将创建并返回一个新实例。
 */

MapProjection.prototype.project = DeveloperError.throwInstantiationError;

/**
 * 将投影特定的地图 {@link Cartesian3} 坐标（以米为单位）反投影为 {@link Cartographic}
 * 坐标（以弧度表示）。
 *
 * @memberof MapProjection
 * @function
 *
 * @param {Cartesian3} cartesian 要反投影的笛卡尔位置（z 高度，以米为单位）。
 * @param {Cartographic} [result] 用于拷贝结果的实例。如果此参数为
 *        未定义，则会创建并返回一个新实例。
 * @returns {Cartographic} 反投影后的坐标。如果结果参数不为未定义，
 *          则坐标会被复制到该实例中并返回。否则，将创建并返回一个新实例。
 */

MapProjection.prototype.unproject = DeveloperError.throwInstantiationError;
export default MapProjection;
