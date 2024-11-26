import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 一种简单的地图投影，其中经度和纬度通过乘以 {@link Ellipsoid#maximumRadius} 线性映射到 X 和 Y。该投影
 * 通常被称为地理投影、等矩形投影、等距圆柱投影或平面投影。当使用 WGS84 椭球体时，
 * 也称为 EPSG:4326。
 *
 * @alias GeographicProjection
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。
 *
 * @see WebMercatorProjection
 */

function GeographicProjection(ellipsoid) {
  this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  this._semimajorAxis = this._ellipsoid.maximumRadius;
  this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
}

Object.defineProperties(GeographicProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}.
   *
   * @memberof GeographicProjection.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
});

/**
 * 将一组 {@link Cartographic} 坐标（以弧度为单位）投影到地图坐标（以米为单位）。
 * X 和 Y 分别是经度和纬度，乘以椭球体的最大半径。Z 是未修改的高度。
 *
 * @param {Cartographic} cartographic 要投影的坐标。
 * @param {Cartesian3} [result] 用于复制结果的实例。如果此参数
 *        未定义，将创建一个新实例并返回。
 * @returns {Cartesian3} 投影后的坐标。如果结果参数不为未定义，坐标将复制到该实例中并返回。否则，将创建并返回一个新实例。
 */

GeographicProjection.prototype.project = function (cartographic, result) {
  // Actually this is the special case of equidistant cylindrical called the plate carree
  const semimajorAxis = this._semimajorAxis;
  const x = cartographic.longitude * semimajorAxis;
  const y = cartographic.latitude * semimajorAxis;
  const z = cartographic.height;

  if (!defined(result)) {
    return new Cartesian3(x, y, z);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * 将一组投影的 {@link Cartesian3} 坐标（以米为单位）逆投影到 {@link Cartographic}
 * 坐标（以弧度为单位）。经度和纬度分别是 X 和 Y 坐标，
 * 除以椭球体的最大半径。高度是未修改的 Z 坐标。
 *
 * @param {Cartesian3} cartesian 要逆投影的笛卡尔位置（高度 z 以米为单位）。
 * @param {Cartographic} [result] 用于复制结果的实例。如果此参数
 *        未定义，将创建一个新实例并返回。
 * @returns {Cartographic} 逆投影后的坐标。如果结果参数不为未定义，坐标将复制到该实例中并返回。否则，将创建并返回一个新实例。
 */

GeographicProjection.prototype.unproject = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required");
  }
  //>>includeEnd('debug');

  const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
  const longitude = cartesian.x * oneOverEarthSemimajorAxis;
  const latitude = cartesian.y * oneOverEarthSemimajorAxis;
  const height = cartesian.z;

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

export default GeographicProjection;
