import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 表示从提供的原点沿提供的方向无限延伸的光线。
 * @alias Ray
 * @constructor
 *
 * @param {Cartesian3} [origin=Cartesian3.ZERO] 光线的原点。
 * @param {Cartesian3} [direction=Cartesian3.ZERO] 光线的方向。
 */

function Ray(origin, direction) {
  direction = Cartesian3.clone(defaultValue(direction, Cartesian3.ZERO));
  if (!Cartesian3.equals(direction, Cartesian3.ZERO)) {
    Cartesian3.normalize(direction, direction);
  }

  /**
   * 光线的原点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.origin = Cartesian3.clone(defaultValue(origin, Cartesian3.ZERO));

  /**
   * 光线的方向。
   * @type {Cartesian3}
   */

  this.direction = direction;
}

/**
 * 复制一个光线实例。
 *
 * @param {Ray} ray 要复制的光线。
 * @param {Ray} [result] 存储结果的对象。
 * @returns {Ray} 修改后的结果参数或如果未提供结果参数则返回的新 Ray 实例。（如果 ray 为 undefined，则返回 undefined）
 */

Ray.clone = function (ray, result) {
  if (!defined(ray)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Ray(ray.origin, ray.direction);
  }
  result.origin = Cartesian3.clone(ray.origin);
  result.direction = Cartesian3.clone(ray.direction);
  return result;
};

/**
 * 计算沿光线的点，由 r(t) = o + t*d 给出，
 * 其中 o 是光线的原点，d 是方向。
 *
 * @param {Ray} ray 光线。
 * @param {number} t 标量值。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回新实例。
 *
 * @example
 * //Get the first intersection point of a ray and an ellipsoid.
 * const intersection = Cesium.IntersectionTests.rayEllipsoid(ray, ellipsoid);
 * const point = Cesium.Ray.getPoint(ray, intersection.start);
 */
Ray.getPoint = function (ray, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("ray", ray);
  Check.typeOf.number("t", t);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  result = Cartesian3.multiplyByScalar(ray.direction, t, result);
  return Cartesian3.add(ray.origin, result, result);
};
export default Ray;
