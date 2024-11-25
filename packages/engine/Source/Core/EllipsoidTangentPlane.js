import AxisAlignedBoundingBox from "./AxisAlignedBoundingBox.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import IntersectionTests from "./IntersectionTests.js";
import Matrix4 from "./Matrix4.js";
import Plane from "./Plane.js";
import Ray from "./Ray.js";
import Transforms from "./Transforms.js";

const scratchCart4 = new Cartesian4();
/**
 * 与提供的椭球体在提供的原点处相切的平面。
 * 如果原点不在椭球体表面，将使用其表面投影。
 * 如果原点位于椭球体的中心，将抛出异常。
 * @alias EllipsoidTangentPlane
 * @constructor
 *
 * @param {Cartesian3} origin 椭球体表面上切平面接触的点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 要使用的椭球体。
 *
 * @exception {DeveloperError} 原点必须不在椭球体的中心。
 */

function EllipsoidTangentPlane(origin, ellipsoid) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("origin", origin);
  //>>includeEnd('debug');

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  origin = ellipsoid.scaleToGeodeticSurface(origin);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(origin)) {
    throw new DeveloperError(
      "origin must not be at the center of the ellipsoid.",
    );
  }
  //>>includeEnd('debug');

  const eastNorthUp = Transforms.eastNorthUpToFixedFrame(origin, ellipsoid);
  this._ellipsoid = ellipsoid;
  this._origin = origin;
  this._xAxis = Cartesian3.fromCartesian4(
    Matrix4.getColumn(eastNorthUp, 0, scratchCart4),
  );
  this._yAxis = Cartesian3.fromCartesian4(
    Matrix4.getColumn(eastNorthUp, 1, scratchCart4),
  );

  const normal = Cartesian3.fromCartesian4(
    Matrix4.getColumn(eastNorthUp, 2, scratchCart4),
  );
  this._plane = Plane.fromPointNormal(origin, normal);
}

Object.defineProperties(EllipsoidTangentPlane.prototype, {
  /**
   * 获取椭球体。
   * @memberof EllipsoidTangentPlane.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取原点。
   * @memberof EllipsoidTangentPlane.prototype
   * @type {Cartesian3}
   */
  origin: {
    get: function () {
      return this._origin;
    },
  },

  /**
   * 获取与椭球体相切的平面。
   * @memberof EllipsoidTangentPlane.prototype
   * @readonly
   * @type {Plane}
   */
  plane: {
    get: function () {
      return this._plane;
    },
  },

  /**
   * 获取切平面的局部 X 轴（东向）。
   * @memberof EllipsoidTangentPlane.prototype
   * @readonly
   * @type {Cartesian3}
   */
  xAxis: {
    get: function () {
      return this._xAxis;
    },
  },

  /**
   * 获取切平面的局部 Y 轴（北向）。
   * @memberof EllipsoidTangentPlane.prototype
   * @readonly
   * @type {Cartesian3}
   */
  yAxis: {
    get: function () {
      return this._yAxis;
    },
  },

  /**
   * 获取切平面的局部 Z 轴（向上）。
   * @memberof EllipsoidTangentPlane.prototype
   * @readonly
   * @type {Cartesian3}
   */
  zAxis: {
    get: function () {
      return this._plane.normal;
    },
  },
});


const tmp = new AxisAlignedBoundingBox();
/**
 * 根据提供的椭球体和给定笛卡尔坐标的中心点创建一个新实例。
 *
 * @param {Cartesian3[]} cartesians 包围中心点的位置列表。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 要使用的椭球体。
 * @returns {EllipsoidTangentPlane} EllipsoidTangentPlane 的新实例。
 */

EllipsoidTangentPlane.fromPoints = function (cartesians, ellipsoid) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');

  const box = AxisAlignedBoundingBox.fromPoints(cartesians, tmp);
  return new EllipsoidTangentPlane(box.center, ellipsoid);
};

const scratchProjectPointOntoPlaneRay = new Ray();
const scratchProjectPointOntoPlaneCartesian3 = new Cartesian3();

/**
 * 计算给定的 3D 位置在 2D 平面上的投影，该平面从 {@link EllipsoidTangentPlane.ellipsoid} 坐标系原点
 * 向外径向延伸。
 *
 * @param {Cartesian3} cartesian 要投影的点。
 * @param {Cartesian2} [result] 用于存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数，或者如果未提供则返回一个新的 Cartesian2 实例。如果没有交点，则返回 undefined。
 */

EllipsoidTangentPlane.prototype.projectPointOntoPlane = function (
  cartesian,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesian", cartesian);
  //>>includeEnd('debug');

  const ray = scratchProjectPointOntoPlaneRay;
  ray.origin = cartesian;
  Cartesian3.normalize(cartesian, ray.direction);

  let intersectionPoint = IntersectionTests.rayPlane(
    ray,
    this._plane,
    scratchProjectPointOntoPlaneCartesian3,
  );
  if (!defined(intersectionPoint)) {
    Cartesian3.negate(ray.direction, ray.direction);
    intersectionPoint = IntersectionTests.rayPlane(
      ray,
      this._plane,
      scratchProjectPointOntoPlaneCartesian3,
    );
  }

  if (defined(intersectionPoint)) {
    const v = Cartesian3.subtract(
      intersectionPoint,
      this._origin,
      intersectionPoint,
    );
    const x = Cartesian3.dot(this._xAxis, v);
    const y = Cartesian3.dot(this._yAxis, v);

    if (!defined(result)) {
      return new Cartesian2(x, y);
    }
    result.x = x;
    result.y = y;
    return result;
  }
  return undefined;
};

/**
 * 计算给定的 3D 位置数组在 2D 平面上的投影（如果可能），径向向外从全球原点。
 * 结果数组可能比输入数组短——如果无法进行单个投影，则该点将不被包含。
 *
 * @see EllipsoidTangentPlane.projectPointOntoPlane
 *
 * @param {Cartesian3[]} cartesians 要投影的点数组。
 * @param {Cartesian2[]} [result] 用于存储结果的 Cartesian2 实例数组。
 * @returns {Cartesian2[]} 修改后的结果参数，或者如果未提供则返回新的 Cartesian2 实例数组。
 */

EllipsoidTangentPlane.prototype.projectPointsOntoPlane = function (
  cartesians,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = [];
  }

  let count = 0;
  const length = cartesians.length;
  for (let i = 0; i < length; i++) {
    const p = this.projectPointOntoPlane(cartesians[i], result[count]);
    if (defined(p)) {
      result[count] = p;
      count++;
    }
  }
  result.length = count;
  return result;
};

/**
 * 计算给定的 3D 位置沿平面法线在 2D 平面上的投影。
 *
 * @param {Cartesian3} cartesian 要投影的点。
 * @param {Cartesian2} [result] 用于存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数，或者如果未提供则返回一个新的 Cartesian2 实例。
 */

EllipsoidTangentPlane.prototype.projectPointToNearestOnPlane = function (
  cartesian,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesian", cartesian);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian2();
  }

  const ray = scratchProjectPointOntoPlaneRay;
  ray.origin = cartesian;
  Cartesian3.clone(this._plane.normal, ray.direction);

  let intersectionPoint = IntersectionTests.rayPlane(
    ray,
    this._plane,
    scratchProjectPointOntoPlaneCartesian3,
  );
  if (!defined(intersectionPoint)) {
    Cartesian3.negate(ray.direction, ray.direction);
    intersectionPoint = IntersectionTests.rayPlane(
      ray,
      this._plane,
      scratchProjectPointOntoPlaneCartesian3,
    );
  }

  const v = Cartesian3.subtract(
    intersectionPoint,
    this._origin,
    intersectionPoint,
  );
  const x = Cartesian3.dot(this._xAxis, v);
  const y = Cartesian3.dot(this._yAxis, v);

  result.x = x;
  result.y = y;
  return result;
};

/**
 * 计算给定的 3D 位置数组沿平面法线在 2D 平面上的投影。
 *
 * @see EllipsoidTangentPlane.projectPointToNearestOnPlane
 *
 * @param {Cartesian3[]} cartesians 要投影的点数组。
 * @param {Cartesian2[]} [result] 用于存储结果的 Cartesian2 实例数组。
 * @returns {Cartesian2[]} 修改后的结果参数，或者如果未提供则返回新的 Cartesian2 实例数组。该数组的长度将与 <code>cartesians</code> 相同。
 */

EllipsoidTangentPlane.prototype.projectPointsToNearestOnPlane = function (
  cartesians,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = [];
  }

  const length = cartesians.length;
  result.length = length;
  for (let i = 0; i < length; i++) {
    result[i] = this.projectPointToNearestOnPlane(cartesians[i], result[i]);
  }
  return result;
};

const projectPointsOntoEllipsoidScratch = new Cartesian3();
/**
 * 计算给定的 2D 位置在 3D 椭球体上的投影。
 *
 * @param {Cartesian2} cartesian 要投影的点。
 * @param {Cartesian3} [result] 用于存储结果的 Cartesian3 实例。
 * @returns {Cartesian3} 修改后的结果参数，或者如果未提供则返回一个新的 Cartesian3 实例。
 */

EllipsoidTangentPlane.prototype.projectPointOntoEllipsoid = function (
  cartesian,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesian", cartesian);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  const ellipsoid = this._ellipsoid;
  const origin = this._origin;
  const xAxis = this._xAxis;
  const yAxis = this._yAxis;
  const tmp = projectPointsOntoEllipsoidScratch;

  Cartesian3.multiplyByScalar(xAxis, cartesian.x, tmp);
  result = Cartesian3.add(origin, tmp, result);
  Cartesian3.multiplyByScalar(yAxis, cartesian.y, tmp);
  Cartesian3.add(result, tmp, result);
  ellipsoid.scaleToGeocentricSurface(result, result);

  return result;
};

/**
 * 计算给定的 2D 位置数组在 3D 椭球体上的投影。
 *
 * @param {Cartesian2[]} cartesians 要投影的点数组。
 * @param {Cartesian3[]} [result] 用于存储结果的 Cartesian3 实例数组。
 * @returns {Cartesian3[]} 修改后的结果参数，或者如果未提供则返回新的 Cartesian3 实例数组。
 */

EllipsoidTangentPlane.prototype.projectPointsOntoEllipsoid = function (
  cartesians,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');

  const length = cartesians.length;
  if (!defined(result)) {
    result = new Array(length);
  } else {
    result.length = length;
  }

  for (let i = 0; i < length; ++i) {
    result[i] = this.projectPointOntoEllipsoid(cartesians[i], result[i]);
  }

  return result;
};
export default EllipsoidTangentPlane;
