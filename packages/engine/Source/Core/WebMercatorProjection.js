import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";

/**
 * Google 地图、Bing 地图和大多数 ArcGIS Online 使用的地图投影，EPSG:3857。此
 * 投影使用以 WGS84 表示的经度和纬度，并使用
 * 球面（而非椭球面）方程将它们转换为墨卡托。
 *
 * @alias WebMercatorProjection
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 椭球体。
 *
 * @see GeographicProjection
 */

function WebMercatorProjection(ellipsoid) {
  this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
  this._semimajorAxis = this._ellipsoid.maximumRadius;
  this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
}

Object.defineProperties(WebMercatorProjection.prototype, {
  /**
   * 获取 {@link Ellipsoid}.
   *
   * @memberof WebMercatorProjection.prototype
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
 * 将范围为 -PI 到 PI 的墨卡托角转换为范围为 -PI/2 到 PI/2 的大地纬度。
 *
 * @param {number} mercatorAngle 要转换的角度。
 * @returns {number} 以弧度表示的大地纬度。
 */
WebMercatorProjection.mercatorAngleToGeodeticLatitude = function (
  mercatorAngle,
) {
  return CesiumMath.PI_OVER_TWO - 2.0 * Math.atan(Math.exp(-mercatorAngle));
};

/**
 * 将以弧度表示的地理纬度（范围为 -PI/2 到 PI/2）转换为范围为 -PI 到 PI 的墨卡托
 * 角。
 *
 * @param {number} latitude 以弧度表示的大地纬度。
 * @returns {number} 墨卡托角。
 */

WebMercatorProjection.geodeticLatitudeToMercatorAngle = function (latitude) {
  // Clamp the latitude coordinate to the valid Mercator bounds.
  if (latitude > WebMercatorProjection.MaximumLatitude) {
    latitude = WebMercatorProjection.MaximumLatitude;
  } else if (latitude < -WebMercatorProjection.MaximumLatitude) {
    latitude = -WebMercatorProjection.MaximumLatitude;
  }
  const sinLatitude = Math.sin(latitude);
  return 0.5 * Math.log((1.0 + sinLatitude) / (1.0 - sinLatitude));
};

/**
 * Web Mercator (EPSG:3857) 投影所支持的最大纬度（北纬和南纬）。从技术上讲，墨卡托投影定义
 * 为任何纬度，直到（但不包括）90度，但提早截止是有意义的，因为它随着纬度的增加而
 * 指数增长。此特定截止值的逻辑是，使用该值的 Google 地图、Bing 地图和 Esri 的投影
 * 是正方形的。即，矩形在 X 和 Y 方向上是相等的。
 *
 * 常量值通过调用：
 *    WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI)
 *
 * @type {number}
 */
WebMercatorProjection.MaximumLatitude =
  WebMercatorProjection.mercatorAngleToGeodeticLatitude(Math.PI);

/**
 * 将以弧度表示的地理椭球坐标转换为等效的 Web Mercator
 * X、Y、Z 坐标（以米为单位），并以 {@link Cartesian3} 返回。高度
 * 不经修改地复制到 Z 坐标。
 *
 * @param {Cartographic} cartographic 以弧度表示的地理坐标。
 * @param {Cartesian3} [result] 用于复制结果的实例，如果应创建
 *        新实例，则为未定义。
 * @returns {Cartesian3} 等效的 web mercator X、Y、Z 坐标（以米为单位）。
 */

WebMercatorProjection.prototype.project = function (cartographic, result) {
  const semimajorAxis = this._semimajorAxis;
  const x = cartographic.longitude * semimajorAxis;
  const y =
    WebMercatorProjection.geodeticLatitudeToMercatorAngle(
      cartographic.latitude,
    ) * semimajorAxis;
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
 * 将以米为单位表示的 Web Mercator X、Y 坐标转换为包含大地椭球坐标的 {@link Cartographic}。
 * Z 坐标不经修改地复制到高度。
 *
 * @param {Cartesian3} cartesian 要进行反投影的 Web Mercator 笛卡尔位置，高度 (z) 以米为单位。
 * @param {Cartographic} [result] 用于复制结果的实例，如果应创建
 *        新实例，则为未定义。
 * @returns {Cartographic} 等效的地理坐标。
 */

WebMercatorProjection.prototype.unproject = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required");
  }
  //>>includeEnd('debug');

  const oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
  const longitude = cartesian.x * oneOverEarthSemimajorAxis;
  const latitude = WebMercatorProjection.mercatorAngleToGeodeticLatitude(
    cartesian.y * oneOverEarthSemimajorAxis,
  );
  const height = cartesian.z;

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};
export default WebMercatorProjection;
