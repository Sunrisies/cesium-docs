import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

/**
 * 由经度、纬度和高度定义的位置.
 * @alias Cartographic
 * @constructor
 *
 * @param {number} [longitude=0.0] 经度，以弧度为单位
 * @param {number} [latitude=0.0] 纬度，以弧度为单位.
 * @param {number} [height=0.0] 椭圆体上方的高度，以米为单位。
 *
 * @see Ellipsoid
 */
function Cartographic(longitude, latitude, height) {
  /**
   * 经度，以弧度为单位
   * @type {number}
   * @default 0.0
   */
  this.longitude = defaultValue(longitude, 0.0);

  /**
   * 纬度，以弧度为单位.
   * @type {number}
   * @default 0.0
   */
  this.latitude = defaultValue(latitude, 0.0);

  /**
   * 椭圆体上方的高度，以米为单位。
   * @type {number}
   * @default 0.0
   */
  this.height = defaultValue(height, 0.0);
}

/**
 * 根据以弧度指定的经度和纬度创建一个新的 地图 实例.
 *
 * @param {number} longitude 经度，以弧度为单位
 * @param {number} latitude 纬度，以弧度为单位.
 * @param {number} [height=0.0] 椭圆体上方的高度，以米为单位。
 * @param {Cartographic} [result] 存储结果的对象.
 * @returns {Cartographic} 修改后的结果参数或新的 Cartographic 实例（如果未提供）.
 */
Cartographic.fromRadians = function (longitude, latitude, height, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  height = defaultValue(height, 0.0);

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }

  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

/**
 * 根据以度为单位指定的经度和纬度创建一个新的 Cartographic 实例。结果对象中的值将以弧度为单位.
 *
 * @param {number} longitude 经度（以度为单位）.
 * @param {number} latitude 纬度（以度为单位）.
 * @param {number} [height=0.0] 椭圆体上方的高度，以米为单位。
 * @param {Cartographic} [result] 存储结果的对象.
 * @returns {Cartographic} 修改后的结果参数或新的 Cartographic 实例（如果未提供）.
 */
Cartographic.fromDegrees = function (longitude, latitude, height, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("longitude", longitude);
  Check.typeOf.number("latitude", latitude);
  //>>includeEnd('debug');

  longitude = CesiumMath.toRadians(longitude);
  latitude = CesiumMath.toRadians(latitude);

  return Cartographic.fromRadians(longitude, latitude, height, result);
};

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

// To avoid circular dependencies, these are set by Ellipsoid when Ellipsoid.default is set.
Cartographic._ellipsoidOneOverRadii = new Cartesian3(
  1.0 / 6378137.0,
  1.0 / 6378137.0,
  1.0 / 6356752.3142451793,
);
Cartographic._ellipsoidOneOverRadiiSquared = new Cartesian3(
  1.0 / (6378137.0 * 6378137.0),
  1.0 / (6378137.0 * 6378137.0),
  1.0 / (6356752.3142451793 * 6356752.3142451793),
);
Cartographic._ellipsoidCenterToleranceSquared = CesiumMath.EPSILON1;

/**
 * 从笛卡尔位置创建一个新的 Cartographic 实例。结果对象中的值将以弧度为单位.
 *
 * @param {Cartesian3} cartesian 转换为制图表示的笛卡尔位置.
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 该位置所在的椭圆体.
 * @param {Cartographic} [result] 存储结果的对象.
 * @returns {Cartographic}修改后的结果参数，如果没有提供则为新的 Cartographic 实例，如果笛卡尔位于椭圆体的中心则为未定义.
 */
Cartographic.fromCartesian = function (cartesian, ellipsoid, result) {
  const oneOverRadii = defined(ellipsoid)
    ? ellipsoid.oneOverRadii
    : Cartographic._ellipsoidOneOverRadii;
  const oneOverRadiiSquared = defined(ellipsoid)
    ? ellipsoid.oneOverRadiiSquared
    : Cartographic._ellipsoidOneOverRadiiSquared;
  const centerToleranceSquared = defined(ellipsoid)
    ? ellipsoid._centerToleranceSquared
    : Cartographic._ellipsoidCenterToleranceSquared;

  //`cartesian is required.` is thrown from scaleToGeodeticSurface
  const p = scaleToGeodeticSurface(
    cartesian,
    oneOverRadii,
    oneOverRadiiSquared,
    centerToleranceSquared,
    cartesianToCartographicP,
  );

  if (!defined(p)) {
    return undefined;
  }

  let n = Cartesian3.multiplyComponents(
    p,
    oneOverRadiiSquared,
    cartesianToCartographicN,
  );
  n = Cartesian3.normalize(n, n);

  const h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

  const longitude = Math.atan2(n.y, n.x);
  const latitude = Math.asin(n.z);
  const height =
    CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

  if (!defined(result)) {
    return new Cartographic(longitude, latitude, height);
  }
  result.longitude = longitude;
  result.latitude = latitude;
  result.height = height;
  return result;
};

/**
 * 从 Cartographic 输入创建新的 三维笛卡尔 实例。输入对象中的值应以弧度为单位.
 *
 * @param {Cartographic} cartographic 输入将被转换为 三维笛卡尔坐标的 输出.
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 该位置所在的椭圆体.
 * @param {Cartesian3} [result] 存储结果的对象.
 * @returns {Cartesian3} 坐标
 */
Cartographic.toCartesian = function (cartographic, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartographic", cartographic);
  //>>includeEnd('debug');

  return Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    cartographic.height,
    ellipsoid,
    result,
  );
};

/**
 * 复制制图实例.
 *
 * @param {Cartographic} cartographic 要复制的地图.
 * @param {Cartographic} [result] 存储结果的对象.
 * @returns {Cartographic} 修改后的结果参数或新的 Cartographic 实例（如果未提供）。（如果未定义 cartographic，则返回 undefined）
 */
Cartographic.clone = function (cartographic, result) {
  if (!defined(cartographic)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartographic(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height,
    );
  }
  result.longitude = cartographic.longitude;
  result.latitude = cartographic.latitude;
  result.height = cartographic.height;
  return result;
};

/**
 * 逐个比较提供的制图并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartographic} [left] 第一幅地图.
 * @param {Cartographic} [right] 第二张地图.
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */
Cartographic.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.longitude === right.longitude &&
      left.latitude === right.latitude &&
      left.height === right.height)
  );
};

/**
 * 逐个比较所提供的制图，如果它们在所提供的 epsilon 范围内，则返回 <code>true</code>，否则返回 <code>false</code>.
 *
 * @param {Cartographic} [left] 第一幅地图.
 * @param {Cartographic} [right] 第二张地图.
 * @param {number} [epsilon=0] 用于相等性测试的 epsilon.
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */
Cartographic.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.longitude - right.longitude) <= epsilon &&
      Math.abs(left.latitude - right.latitude) <= epsilon &&
      Math.abs(left.height - right.height) <= epsilon)
  );
};

/**
 * 初始化为不可变的 Cartographic 实例 (0.0, 0.0, 0.0).
 *
 * @type {Cartographic}
 * @constant
 */
Cartographic.ZERO = Object.freeze(new Cartographic(0.0, 0.0, 0.0));

/**
 * 重复此实例.
 *
 * @param {Cartographic} [result] 存储结果的对象.
 * @returns {Cartographic} 修改后的结果参数或新的 Cartographic 实例（如果未提供）.
 */
Cartographic.prototype.clone = function (result) {
  return Cartographic.clone(this, result);
};

/**
 * 修改后的结果参数或新的 Cartographic 实例（如果未提供）
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartographic} [right] The second cartographic.
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */
Cartographic.prototype.equals = function (right) {
  return Cartographic.equals(this, right);
};

/**
 * 修改后的结果参数或新的 Cartographic 实例（如果未提供）
 * <code>true</code> 如果它们在提供的 epsilon 范围内,
 * <code>false</code> 否则.
 *
 * @param {Cartographic} [right] 第二张制图.
 * @param {number} [epsilon=0] 用于相等性测试的 epsilon.
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */
Cartographic.prototype.equalsEpsilon = function (right, epsilon) {
  return Cartographic.equalsEpsilon(this, right, epsilon);
};

/**
 * 创建一个表示此地图的字符串，格式为"（经度、纬度、高度）".
 *
 * @returns {string} 表示所提供地图格式的字符串 '(经度、纬度、高度)'.
 */
Cartographic.prototype.toString = function () {
  return `(${this.longitude}, ${this.latitude}, ${this.height})`;
};
export default Cartographic;
