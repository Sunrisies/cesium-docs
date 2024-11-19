import Check from "../Core/Check.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import CesiumMath from "../Core/Math.js";
import PolygonGeometry from "../Core/PolygonGeometry.js";
import Rectangle from "../Core/Rectangle.js";

/**
 * 一个测地多边形，用于与{@link ClippingPlaneCollection}一起选择性地隐藏模型、3D Tileset或地球中的区域。
 * @alias ClippingPolygon
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3[]} options.positions 定义裁剪多边形外环的三个或更多Cartesian坐标的列表。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default]
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * const polygon = new Cesium.ClippingPolygon({
 *     positions: positions
 * });
 */
function ClippingPolygon(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.positions", options.positions);
  Check.typeOf.number.greaterThanOrEquals(
    "options.positions.length",
    options.positions.length,
    3,
  );
  //>>includeEnd('debug');

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._positions = [...options.positions];
}

Object.defineProperties(ClippingPolygon.prototype, {
  /**
   * 返回多边形中位置的总数，包括任何孔洞。
   *
   * @memberof ClippingPolygon.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._positions.length;
    },
  },
  /**
   * 返回外环的位置。
   *
   * @memberof ClippingPolygon.prototype
   * @type {Cartesian3[]}
   * @readonly
   */
  positions: {
    get: function () {
      return this._positions;
    },
  },
  /**
   * 返回用于在裁剪时将多边形投影到表面上的椭球体。
   *
   * @memberof ClippingPolygon.prototype
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
 * 克隆ClippingPolygon而不设置其所有权。
 * @param {ClippingPolygon} polygon 要克隆的ClippingPolygon
 * @param {ClippingPolygon} [result] 用于存储克隆参数的对象。
 * @returns {ClippingPolygon} 输入ClippingPolygon的克隆
 */

ClippingPolygon.clone = function (polygon, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new ClippingPolygon({
      positions: polygon.positions,
      ellipsoid: polygon.ellipsoid,
    });
  }

  result._ellipsoid = polygon.ellipsoid;
  result._positions.length = 0;
  result._positions.push(...polygon.positions);
  return result;
};

/**
 * 比较提供的ClippingPolygons并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Plane} left 第一个多边形。
 * @param {Plane} right 第二个多边形。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

ClippingPolygon.equals = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.ellipsoid.equals(right.ellipsoid) && left.positions === right.positions
  );
};

/**
 * 计算包围由位置列表定义的多边形的测地矩形，包括跨越国际日期线和极点的情况。
 *
 * @param {Rectangle} [result] 用于存储结果的对象。
 * @returns {Rectangle} 结果矩形
 */

ClippingPolygon.prototype.computeRectangle = function (result) {
  return PolygonGeometry.computeRectangleFromPositions(
    this.positions,
    this.ellipsoid,
    undefined,
    result,
  );
};

const scratchRectangle = new Rectangle();
const spherePointScratch = new Cartesian3();
/**
 * 计算包围由位置列表定义的多边形的球面范围矩形，包括跨越国际日期线和极点的情况。
 *
 * @private
 *
 * @param {Rectangle} [result] 用于存储结果的对象。
 * @returns {Rectangle} 具有球面范围的结果矩形。
 */

ClippingPolygon.prototype.computeSphericalExtents = function (result) {
  if (!defined(result)) {
    result = new Rectangle();
  }

  const rectangle = this.computeRectangle(scratchRectangle);

  let spherePoint = Cartographic.toCartesian(
    Rectangle.southwest(rectangle),
    this.ellipsoid,
    spherePointScratch,
  );

  // Project into plane with vertical for latitude
  let magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y,
  );

  // Use fastApproximateAtan2 for alignment with shader
  let sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  let sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y,
  );

  result.south = sphereLatitude;
  result.west = sphereLongitude;

  spherePoint = Cartographic.toCartesian(
    Rectangle.northeast(rectangle),
    this.ellipsoid,
    spherePointScratch,
  );

  // Project into plane with vertical for latitude
  magXY = Math.sqrt(
    spherePoint.x * spherePoint.x + spherePoint.y * spherePoint.y,
  );

  // Use fastApproximateAtan2 for alignment with shader
  sphereLatitude = CesiumMath.fastApproximateAtan2(magXY, spherePoint.z);
  sphereLongitude = CesiumMath.fastApproximateAtan2(
    spherePoint.x,
    spherePoint.y,
  );

  result.north = sphereLatitude;
  result.east = sphereLongitude;

  return result;
};

export default ClippingPolygon;
