import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import Matrix4 from "./Matrix4.js";

/**
 * 以 Hessian 标准形式定义的平面
 * <pre>
 * ax + by + cz + d = 0
 * </pre>
 * 其中 (a, b, c) 是平面的 <code>normal</code>，d 是到平面的带符号
 * <code>distance</code>，(x, y, z) 是平面上的任意点。
 *
 * @alias Plane
 * @constructor
 *
 * @param {Cartesian3} normal 平面的法线（已归一化）。
 * @param {number} distance 从原点到平面的最短距离。<code>distance</code> 的符号
 * 决定原点位于平面的哪一侧。如果 <code>distance</code> 为正，原点位于
 * 向法线方向的半空间中；如果为负，原点位于与法线相反的半空间；
 * 如果为零，平面通过原点。
 *
 * @example
 * // The plane x=0
 * const plane = new Cesium.Plane(Cesium.Cartesian3.UNIT_X, 0.0);
 *
 * @exception {DeveloperError} Normal must be normalized
 */
function Plane(normal, distance) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("normal", normal);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  Check.typeOf.number("distance", distance);
  //>>includeEnd('debug');

  /**
   * 平面的法线。
   *
   * @type {Cartesian3}
   */

  this.normal = Cartesian3.clone(normal);

  /**
   * 从原点到平面的最短距离。<code>distance</code> 的符号
   * 决定原点位于平面的哪一侧。如果 <code>distance</code> 为正，原点位于
   * 向法线方向的半空间中；如果为负，原点位于与法线相反的半空间；
   * 如果为零，平面通过原点。
   *
   * @type {number}
   */

  this.distance = distance;
}

/**
 * 从一个法线和一个平面上的点创建一个平面。
 *
 * @param {Cartesian3} point 平面上的点。
 * @param {Cartesian3} normal 平面的法线（已归一化）。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 一个新的平面实例或修改后的结果参数。
 *

 * @example
 * const point = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
 * const normal = ellipsoid.geodeticSurfaceNormal(point);
 * const tangentPlane = Cesium.Plane.fromPointNormal(point, normal);
 *
 * @exception {DeveloperError} Normal must be normalized
 */
Plane.fromPointNormal = function (point, normal, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("point", point);
  Check.typeOf.object("normal", normal);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  //>>includeEnd('debug');

  const distance = -Cartesian3.dot(normal, point);

  if (!defined(result)) {
    return new Plane(normal, distance);
  }

  Cartesian3.clone(normal, result.normal);
  result.distance = distance;
  return result;
};

const scratchNormal = new Cartesian3();
/**
 * 根据一般方程创建一个平面。
 *
 * @param {Cartesian4} coefficients 平面的法线（已归一化）。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 一个新的平面实例或修改后的结果参数。
 *
 * @exception {DeveloperError} 法线必须是已归一化的
 */

Plane.fromCartesian4 = function (coefficients, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("coefficients", coefficients);
  //>>includeEnd('debug');

  const normal = Cartesian3.fromCartesian4(coefficients, scratchNormal);
  const distance = coefficients.w;

  //>>includeStart('debug', pragmas.debug);
  if (
    !CesiumMath.equalsEpsilon(
      Cartesian3.magnitude(normal),
      1.0,
      CesiumMath.EPSILON6,
    )
  ) {
    throw new DeveloperError("normal must be normalized.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Plane(normal, distance);
  }
  Cartesian3.clone(normal, result.normal);
  result.distance = distance;
  return result;
};

/**
 * 计算一个点到平面的带符号最短距离。
 * 距离的符号决定了点位于平面的哪一侧。如果距离为正，点位于
 * 向法线方向的半空间中；如果为负，点位于与法线相反的半空间；
 * 如果为零，平面通过该点。
 *
 * @param {Plane} plane 平面。
 * @param {Cartesian3} point 点。
 * @returns {number} 点到平面的带符号最短距离。
 */

Plane.getPointDistance = function (plane, point) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  return Cartesian3.dot(plane.normal, point) + plane.distance;
};

const scratchCartesian = new Cartesian3();
/**
 * 将一个点投影到平面上。
 * @param {Plane} plane 要将点投影到的平面。
 * @param {Cartesian3} point 要投影到平面的点。
 * @param {Cartesian3} [result] 结果点。如果未定义，将创建一个新的 Cartesian3。
 * @returns {Cartesian3} 修改后的结果参数或新的三维笛卡尔实例（如果未提供）。
 */

Plane.projectPointOntoPlane = function (plane, point, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  // projectedPoint = point - (normal.point + scale) * normal
  const pointDistance = Plane.getPointDistance(plane, point);
  const scaledNormal = Cartesian3.multiplyByScalar(
    plane.normal,
    pointDistance,
    scratchCartesian,
  );

  return Cartesian3.subtract(point, scaledNormal, result);
};

const scratchInverseTranspose = new Matrix4();
const scratchPlaneCartesian4 = new Cartesian4();
const scratchTransformNormal = new Cartesian3();
/**
 * 通过给定的变换矩阵变换平面。
 *
 * @param {Plane} plane 要变换的平面。
 * @param {Matrix4} transform 变换矩阵。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 通过给定变换矩阵变换后的平面。
 */

Plane.transform = function (plane, transform, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  Check.typeOf.object("transform", transform);
  //>>includeEnd('debug');

  const normal = plane.normal;
  const distance = plane.distance;
  const inverseTranspose = Matrix4.inverseTranspose(
    transform,
    scratchInverseTranspose,
  );
  let planeAsCartesian4 = Cartesian4.fromElements(
    normal.x,
    normal.y,
    normal.z,
    distance,
    scratchPlaneCartesian4,
  );
  planeAsCartesian4 = Matrix4.multiplyByVector(
    inverseTranspose,
    planeAsCartesian4,
    planeAsCartesian4,
  );

  // Convert the transformed plane to Hessian Normal Form
  const transformedNormal = Cartesian3.fromCartesian4(
    planeAsCartesian4,
    scratchTransformNormal,
  );

  planeAsCartesian4 = Cartesian4.divideByScalar(
    planeAsCartesian4,
    Cartesian3.magnitude(transformedNormal),
    planeAsCartesian4,
  );

  return Plane.fromCartesian4(planeAsCartesian4, result);
};

/**
 * 复制一个 Plane 实例。
 *
 * @param {Plane} plane 要复制的平面。
 * @param {Plane} [result] 存储结果的对象。
 * @returns {Plane} 修改后的结果参数或如果未提供，则返回一个新的 Plane 实例。
 */

Plane.clone = function (plane, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("plane", plane);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Plane(plane.normal, plane.distance);
  }

  Cartesian3.clone(plane.normal, result.normal);
  result.distance = plane.distance;

  return result;
};

/**
 * 按法线和距离比较提供的平面，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Plane} left 第一个平面。
 * @param {Plane} right 第二个平面。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>。
 */

Plane.equals = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.distance === right.distance &&
    Cartesian3.equals(left.normal, right.normal)
  );
};

/**
 * 一个常量，初始化为通过原点的 XY 平面，法线在正 Z 方向。
 *
 * @type {Plane}
 * @constant
 */
Plane.ORIGIN_XY_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_Z, 0.0));

/**
 * 一个常量，初始化为通过原点的 YZ 平面，法线在正 X 方向。
 *
 * @type {Plane}
 * @constant
 */
Plane.ORIGIN_YZ_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_X, 0.0));

/**
 * 一个常量，初始化为通过原点的 ZX 平面，法线在正 Y 方向。
 *
 * @type {Plane}
 * @constant
 */

Plane.ORIGIN_ZX_PLANE = Object.freeze(new Plane(Cartesian3.UNIT_Y, 0.0));
export default Plane;
