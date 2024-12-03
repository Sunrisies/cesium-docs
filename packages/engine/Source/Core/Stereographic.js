import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import EllipsoidTangentPlane from "./EllipsoidTangentPlane.js";
import IntersectionTests from "./IntersectionTests.js";
import CesiumMath from "./Math.js";
import Ray from "./Ray.js";

/**
 * 表示一个立体坐标系中的点，该坐标系通过将笛卡尔坐标从一个极投影到另一个极的切平面上获得。
 * 立体投影忠实地表示通过其中心点的所有大圆的相对方向。
 * 若要在各处忠实地表示角度，这是一个保角投影，这意味着点被投影到一个任意的球体上。
 * @param {Cartesian2} [position] 立体坐标。
 * @param {EllipseGeometry} [tangentPlane] 点被投影到的切平面。
 */

function Stereographic(position, tangentPlane) {
  this.position = position;
  if (!defined(this.position)) {
    this.position = new Cartesian2();
  }

  this.tangentPlane = tangentPlane;
  if (!defined(this.tangentPlane)) {
    this.tangentPlane = Stereographic.NORTH_POLE_TANGENT_PLANE;
  }
}

Object.defineProperties(Stereographic.prototype, {
  /**
   * 获取椭球体。
   * @memberof Stereographic.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this.tangentPlane.ellipsoid;
    },
  },

  /**
   * 获取 x 坐标
   * @memberof Stereographic.prototype
   * @type {number}
   */
  x: {
    get: function () {
      return this.position.x;
    },
  },

  /**
   * 获取 y 坐标
   * @memberof Stereographic.prototype
   * @type {number}
   */
  y: {
    get: function () {
      return this.position.y;
    },
  },

  /**
   * 计算保角纬度，或投影到任意球体上的椭球纬度。
   * @memberof Stereographic.prototype
   * @type {number}
   */
  conformalLatitude: {
    get: function () {
      const r = Cartesian2.magnitude(this.position);
      const d = 2 * this.ellipsoid.maximumRadius;
      const sign = this.tangentPlane.plane.normal.z;
      return sign * (CesiumMath.PI_OVER_TWO - 2 * Math.atan2(r, d));
    },
  },

  /**
   * 计算经度
   * @memberof Stereographic.prototype
   * @type {number}
   */
  longitude: {
    get: function () {
      let longitude = CesiumMath.PI_OVER_TWO + Math.atan2(this.y, this.x);
      if (longitude > Math.PI) {
        longitude -= CesiumMath.TWO_PI;
      }

      return longitude;
    },
  },
});


const scratchCartographic = new Cartographic();
const scratchCartesian = new Cartesian3();

/**
 * 根据椭球体计算纬度。
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于计算经度的椭球体。
 * @returns {number} 纬度
 */

Stereographic.prototype.getLatitude = function (ellipsoid) {
  if (!defined(ellipsoid)) {
    ellipsoid = Ellipsoid.default;
  }

  scratchCartographic.latitude = this.conformalLatitude;
  scratchCartographic.longitude = this.longitude;
  scratchCartographic.height = 0.0;
  const cartesian = this.ellipsoid.cartographicToCartesian(
    scratchCartographic,
    scratchCartesian,
  );
  ellipsoid.cartesianToCartographic(cartesian, scratchCartographic);
  return scratchCartographic.latitude;
};

const scratchProjectPointOntoPlaneRay = new Ray();
const scratchProjectPointOntoPlaneRayDirection = new Cartesian3();
const scratchProjectPointOntoPlaneCartesian3 = new Cartesian3();

/**
 * 计算提供的 3D 位置在 2D 极平面上的投影，从提供的原点径向向外。
 *
 * @param {Cartesian3} cartesian 要投影的点。
 * @param {Stereographic} [result] 存储结果的对象。
 * @returns {Stereographic} 修改后的结果参数或如果未提供则返回一个新的 Stereographic 实例。
 */

Stereographic.fromCartesian = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesian", cartesian);
  //>>includeEnd('debug');

  const sign = CesiumMath.signNotZero(cartesian.z);
  let tangentPlane = Stereographic.NORTH_POLE_TANGENT_PLANE;
  let origin = Stereographic.SOUTH_POLE;
  if (sign < 0) {
    tangentPlane = Stereographic.SOUTH_POLE_TANGENT_PLANE;
    origin = Stereographic.NORTH_POLE;
  }

  const ray = scratchProjectPointOntoPlaneRay;
  ray.origin = tangentPlane.ellipsoid.scaleToGeocentricSurface(
    cartesian,
    ray.origin,
  );
  ray.direction = Cartesian3.subtract(
    ray.origin,
    origin,
    scratchProjectPointOntoPlaneRayDirection,
  );
  Cartesian3.normalize(ray.direction, ray.direction);

  const intersectionPoint = IntersectionTests.rayPlane(
    ray,
    tangentPlane.plane,
    scratchProjectPointOntoPlaneCartesian3,
  );
  const v = Cartesian3.subtract(intersectionPoint, origin, intersectionPoint);
  const x = Cartesian3.dot(tangentPlane.xAxis, v);
  const y = sign * Cartesian3.dot(tangentPlane.yAxis, v);

  if (!defined(result)) {
    return new Stereographic(new Cartesian2(x, y), tangentPlane);
  }

  result.position = new Cartesian2(x, y);
  result.tangentPlane = tangentPlane;
  return result;
};

/**
 * 计算提供的 3D 位置在 2D 极平面上的投影，从提供的原点径向向外。
 *
 * @param {Cartesian3[]} cartesians 要投影的点。
 * @param {Stereographic[]} [result] 存储结果的对象。
 * @returns {Stereographic[]} 修改后的结果参数或如果未提供则返回一个新的 Stereographic 实例。
 */

Stereographic.fromCartesianArray = function (cartesians, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartesians", cartesians);
  //>>includeEnd('debug');

  const length = cartesians.length;
  if (!defined(result)) {
    result = new Array(length);
  } else {
    result.length = length;
  }
  for (let i = 0; i < length; i++) {
    result[i] = Stereographic.fromCartesian(cartesians[i], result[i]);
  }
  return result;
};

/**
 * 复制一个 Stereographic 实例。
 *
 * @param {Stereographic} stereographic 要复制的 Stereographic。
 * @param {Stereographic} [result] 存储结果的对象。
 * @returns {Stereographic} 修改后的结果参数或如果未提供则返回一个新的 Stereographic 实例。（如果 stereographic 为未定义，则返回未定义）
 */

Stereographic.clone = function (stereographic, result) {
  if (!defined(stereographic)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Stereographic(
      stereographic.position,
      stereographic.tangentPlane,
    );
  }

  result.position = stereographic.position;
  result.tangentPlane = stereographic.tangentPlane;

  return result;
};

/**
 * 一个初始化为 (0.5, 0.5, 0.5) 半径的椭球体实例。
 *
 * @type {Stereographic}
 * @constant
 */

Stereographic.HALF_UNIT_SPHERE = Object.freeze(new Ellipsoid(0.5, 0.5, 0.5));

Stereographic.NORTH_POLE = Object.freeze(new Cartesian3(0.0, 0.0, 0.5));
Stereographic.SOUTH_POLE = Object.freeze(new Cartesian3(0.0, 0.0, -0.5));

Stereographic.NORTH_POLE_TANGENT_PLANE = Object.freeze(
  new EllipsoidTangentPlane(
    Stereographic.NORTH_POLE,
    Stereographic.HALF_UNIT_SPHERE,
  ),
);
Stereographic.SOUTH_POLE_TANGENT_PLANE = Object.freeze(
  new EllipsoidTangentPlane(
    Stereographic.SOUTH_POLE,
    Stereographic.HALF_UNIT_SPHERE,
  ),
);

export default Stereographic;
