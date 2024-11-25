import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import scaleToGeodeticSurface from "./scaleToGeodeticSurface.js";

function initialize(ellipsoid, x, y, z) {
  x = defaultValue(x, 0.0);
  y = defaultValue(y, 0.0);
  z = defaultValue(z, 0.0);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("x", x, 0.0);
  Check.typeOf.number.greaterThanOrEquals("y", y, 0.0);
  Check.typeOf.number.greaterThanOrEquals("z", z, 0.0);
  //>>includeEnd('debug');

  ellipsoid._radii = new Cartesian3(x, y, z);

  ellipsoid._radiiSquared = new Cartesian3(x * x, y * y, z * z);

  ellipsoid._radiiToTheFourth = new Cartesian3(
    x * x * x * x,
    y * y * y * y,
    z * z * z * z,
  );

  ellipsoid._oneOverRadii = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / x,
    y === 0.0 ? 0.0 : 1.0 / y,
    z === 0.0 ? 0.0 : 1.0 / z,
  );

  ellipsoid._oneOverRadiiSquared = new Cartesian3(
    x === 0.0 ? 0.0 : 1.0 / (x * x),
    y === 0.0 ? 0.0 : 1.0 / (y * y),
    z === 0.0 ? 0.0 : 1.0 / (z * z),
  );

  ellipsoid._minimumRadius = Math.min(x, y, z);

  ellipsoid._maximumRadius = Math.max(x, y, z);

  ellipsoid._centerToleranceSquared = CesiumMath.EPSILON1;

  if (ellipsoid._radiiSquared.z !== 0) {
    ellipsoid._squaredXOverSquaredZ =
      ellipsoid._radiiSquared.x / ellipsoid._radiiSquared.z;
  }
}

/**
 * 通过方程式定义的二次曲面，使用笛卡尔坐标表示
 * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>。主要用于
 * Cesium 表示行星体的形状。
 *
 * 通常不直接构造此对象，而是使用提供的常量之一。
 * @alias Ellipsoid
 * @constructor
 *
 * @param {number} [x=0] x 方向的半径。
 * @param {number} [y=0] y 方向的半径。
 * @param {number} [z=0] z 方向的半径。
 *
 * @exception {DeveloperError} 所有半径组件必须大于或等于零。
 *
 * @see Ellipsoid.fromCartesian3
 * @see Ellipsoid.WGS84
 * @see Ellipsoid.UNIT_SPHERE
 */

function Ellipsoid(x, y, z) {
  this._radii = undefined;
  this._radiiSquared = undefined;
  this._radiiToTheFourth = undefined;
  this._oneOverRadii = undefined;
  this._oneOverRadiiSquared = undefined;
  this._minimumRadius = undefined;
  this._maximumRadius = undefined;
  this._centerToleranceSquared = undefined;
  this._squaredXOverSquaredZ = undefined;

  initialize(this, x, y, z);
}

Object.defineProperties(Ellipsoid.prototype, {
  /**
   * 获取椭球体的半径。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radii: {
    get: function () {
      return this._radii;
    },
  },
  /**
   * 获取椭球体的平方半径。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radiiSquared: {
    get: function () {
      return this._radiiSquared;
    },
  },
  /**
   * 获取椭球体半径的四次方。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  radiiToTheFourth: {
    get: function () {
      return this._radiiToTheFourth;
    },
  },
  /**
   * 获取椭球体半径的倒数。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  oneOverRadii: {
    get: function () {
      return this._oneOverRadii;
    },
  },
  /**
   * 获取椭球体平方半径的倒数。
   * @memberof Ellipsoid.prototype
   * @type {Cartesian3}
   * @readonly
   */
  oneOverRadiiSquared: {
    get: function () {
      return this._oneOverRadiiSquared;
    },
  },
  /**
   * 获取椭球体的最小半径。
   * @memberof Ellipsoid.prototype
   * @type {number}
   * @readonly
   */
  minimumRadius: {
    get: function () {
      return this._minimumRadius;
    },
  },
  /**
   * 获取椭球体的最大半径。
   * @memberof Ellipsoid.prototype
   * @type {number}
   * @readonly
   */
  maximumRadius: {
    get: function () {
      return this._maximumRadius;
    },
  },
});

/**
 * 复制一个 Ellipsoid 实例。
 *
 * @param {Ellipsoid} ellipsoid 要复制的椭球体。
 * @param {Ellipsoid} [result] 存储结果的对象，如果应该创建一个新实例则为 undefined。
 * @returns {Ellipsoid} 克隆的椭球体。 （如果 ellipsoid 是 undefined，则返回 undefined）
 */

Ellipsoid.clone = function (ellipsoid, result) {
  if (!defined(ellipsoid)) {
    return undefined;
  }
  const radii = ellipsoid._radii;

  if (!defined(result)) {
    return new Ellipsoid(radii.x, radii.y, radii.z);
  }

  Cartesian3.clone(radii, result._radii);
  Cartesian3.clone(ellipsoid._radiiSquared, result._radiiSquared);
  Cartesian3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
  Cartesian3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
  Cartesian3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
  result._minimumRadius = ellipsoid._minimumRadius;
  result._maximumRadius = ellipsoid._maximumRadius;
  result._centerToleranceSquared = ellipsoid._centerToleranceSquared;

  return result;
};

/**
 * 从指定 x、y 和 z 方向上的半径的 Cartesian 坐标计算一个椭球体。
 *
 * @param {Cartesian3} [cartesian=Cartesian3.ZERO] 椭球体在 x、y 和 z 方向上的半径。
 * @param {Ellipsoid} [result] 存储结果的对象，如果应该创建一个新实例则为 undefined。
 * @returns {Ellipsoid} 一个新的椭球体实例。
 *
 * @exception {DeveloperError} 所有半径组件必须大于或等于零。
 *
 * @see Ellipsoid.WGS84
 * @see Ellipsoid.UNIT_SPHERE
 */

Ellipsoid.fromCartesian3 = function (cartesian, result) {
  if (!defined(result)) {
    result = new Ellipsoid();
  }

  if (!defined(cartesian)) {
    return result;
  }

  initialize(result, cartesian.x, cartesian.y, cartesian.z);
  return result;
};

/**
 * 初始化为 WGS84 标准的椭球体实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.WGS84 = Object.freeze(
  new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793),
);

/**
 * 初始化为半径为 (1.0, 1.0, 1.0) 的椭球体实例。
 *
 * @type {Ellipsoid}
 * @constant
 */
Ellipsoid.UNIT_SPHERE = Object.freeze(new Ellipsoid(1.0, 1.0, 1.0));

/**
 * 初始化为具有月球半径的球体的椭球体实例。
 *
 * @type {Ellipsoid}
 * @constant
 */

Ellipsoid.MOON = Object.freeze(
  new Ellipsoid(
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS,
    CesiumMath.LUNAR_RADIUS,
  ),
);

Ellipsoid._default = Ellipsoid.WGS84;
Object.defineProperties(Ellipsoid, {
  /**
   *  默认椭球体，当未另行指定时使用。
   * @memberof Ellipsoid
   * @type {Ellipsoid}
   * @example
   * Cesium.Ellipsoid.default = Cesium.Ellipsoid.MOON;
   *
   * // Apollo 11 landing site
   * const position = Cesium.Cartesian3.fromRadians(
   *   0.67416,
   *   23.47315,
   * );
   */
  default: {
    get: function () {
      return Ellipsoid._default;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      Ellipsoid._default = value;
      Cartesian3._ellipsoidRadiiSquared = value.radiiSquared;
      Cartographic._ellipsoidOneOverRadii = value.oneOverRadii;
      Cartographic._ellipsoidOneOverRadiiSquared = value.oneOverRadiiSquared;
      Cartographic._ellipsoidCenterToleranceSquared =
        value._centerToleranceSquared;
    },
  },
});

/**
 * 复制一个 Ellipsoid 实例。
 *
 * @param {Ellipsoid} [result] 存储结果的对象，如果应该创建一个新实例则为 undefined。
 * @returns {Ellipsoid} 克隆的椭球体。
 */
Ellipsoid.prototype.clone = function (result) {
  return Ellipsoid.clone(this, result);
};

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */

Ellipsoid.packedLength = Cartesian3.packedLength;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {Ellipsoid} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
Ellipsoid.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  Cartesian3.pack(value._radii, array, startingIndex);

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {Ellipsoid} [result] 存储结果的对象。
 * @returns {Ellipsoid} 修改后的结果参数，或者如果未提供，则返回一个新的 Ellipsoid 实例。
 */

Ellipsoid.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const radii = Cartesian3.unpack(array, startingIndex);
  return Ellipsoid.fromCartesian3(radii, result);
};

/**
 * 计算从此椭球体中心指向提供的笛卡尔位置的单位向量。
 * @function
 *
 * @param {Cartesian3} cartesian 要确定其地心法线的笛卡尔坐标。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，或者如果未提供，则返回一个新的 Cartesian3 实例。
 */
Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;

/**
 * 计算在提供的位置上，切于椭球体表面的平面的法线。
 *
 * @param {Cartographic} cartographic 要确定其大地法线的地理位置。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，或者如果未提供，则返回一个新的 Cartesian3 实例。
 */

Ellipsoid.prototype.geodeticSurfaceNormalCartographic = function (
  cartographic,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartographic", cartographic);
  //>>includeEnd('debug');

  const longitude = cartographic.longitude;
  const latitude = cartographic.latitude;
  const cosLatitude = Math.cos(latitude);

  const x = cosLatitude * Math.cos(longitude);
  const y = cosLatitude * Math.sin(longitude);
  const z = Math.sin(latitude);

  if (!defined(result)) {
    result = new Cartesian3();
  }
  result.x = x;
  result.y = y;
  result.z = z;
  return Cartesian3.normalize(result, result);
};

/**
 * 计算在提供的位置上，切于椭球体表面的平面的法线。
 *
 * @param {Cartesian3} cartesian 要确定其表面法线的笛卡尔位置。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，或者如果未提供，则返回一个新的 Cartesian3 实例，如果无法找到法线则返回 undefined。
 */

Ellipsoid.prototype.geodeticSurfaceNormal = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  if (isNaN(cartesian.x) || isNaN(cartesian.y) || isNaN(cartesian.z)) {
    throw new DeveloperError("cartesian has a NaN component");
  }
  //>>includeEnd('debug');
  if (
    Cartesian3.equalsEpsilon(cartesian, Cartesian3.ZERO, CesiumMath.EPSILON14)
  ) {
    return undefined;
  }
  if (!defined(result)) {
    result = new Cartesian3();
  }
  result = Cartesian3.multiplyComponents(
    cartesian,
    this._oneOverRadiiSquared,
    result,
  );
  return Cartesian3.normalize(result, result);
};

const cartographicToCartesianNormal = new Cartesian3();
const cartographicToCartesianK = new Cartesian3();

/**
 * 将提供的地理坐标转换为笛卡尔表示。
 *
 * @param {Cartographic} cartographic 地理位置。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，或者如果未提供，则返回一个新的 Cartesian3 实例。
 *
 * @example
 * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
 * const position = new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 5000);
 * const cartesianPosition = Cesium.Ellipsoid.WGS84.cartographicToCartesian(position);
 */
Ellipsoid.prototype.cartographicToCartesian = function (cartographic, result) {
  //`cartographic is required` is thrown from geodeticSurfaceNormalCartographic.
  const n = cartographicToCartesianNormal;
  const k = cartographicToCartesianK;
  this.geodeticSurfaceNormalCartographic(cartographic, n);
  Cartesian3.multiplyComponents(this._radiiSquared, n, k);
  const gamma = Math.sqrt(Cartesian3.dot(n, k));
  Cartesian3.divideByScalar(k, gamma, k);
  Cartesian3.multiplyByScalar(n, cartographic.height, n);

  if (!defined(result)) {
    result = new Cartesian3();
  }
  return Cartesian3.add(k, n, result);
};

/**
 * 将提供的地理坐标数组转换为笛卡尔数组。
 *
 * @param {Cartographic[]} cartographics 一个地理位置数组。
 * @param {Cartesian3[]} [result] 存储结果的对象。
 * @returns {Cartesian3[]} 修改后的结果参数，或者如果未提供，则返回一个新的数组实例。
 *
 * @example
 * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
 * const positions = [new Cesium.Cartographic(Cesium.Math.toRadians(21), Cesium.Math.toRadians(78), 0),
 *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.321), Cesium.Math.toRadians(78.123), 100),
 *                  new Cesium.Cartographic(Cesium.Math.toRadians(21.645), Cesium.Math.toRadians(78.456), 250)];
 * const cartesianPositions = Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
 */
Ellipsoid.prototype.cartographicArrayToCartesianArray = function (
  cartographics,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("cartographics", cartographics);
  //>>includeEnd('debug')

  const length = cartographics.length;
  if (!defined(result)) {
    result = new Array(length);
  } else {
    result.length = length;
  }
  for (let i = 0; i < length; i++) {
    result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
  }
  return result;
};

const cartesianToCartographicN = new Cartesian3();
const cartesianToCartographicP = new Cartesian3();
const cartesianToCartographicH = new Cartesian3();

/**
 * 将提供的笛卡尔坐标转换为地理坐标表示。
 * 在椭球体中心，笛卡尔坐标是 undefined。
 *
 * @param {Cartesian3} cartesian 要转换为地理坐标表示的笛卡尔位置。
 * @param {Cartographic} [result] 存储结果的对象。
 * @returns {Cartographic} 修改后的结果参数，如果未提供则返回新的 Cartographic 实例，如果笛卡尔坐标位于椭球体中心则返回 undefined。
 *
 * @example
 * //Create a Cartesian and determine it's Cartographic representation on a WGS84 ellipsoid.
 * const position = new Cesium.Cartesian3(17832.12, 83234.52, 952313.73);
 * const cartographicPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position);
 */
Ellipsoid.prototype.cartesianToCartographic = function (cartesian, result) {
  //`cartesian is required.` is thrown from scaleToGeodeticSurface
  const p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);

  if (!defined(p)) {
    return undefined;
  }

  const n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
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
 * 将提供的笛卡尔数组转换为地理坐标数组。
 *
 * @param {Cartesian3[]} cartesians 一个笛卡尔位置数组。
 * @param {Cartographic[]} [result] 存储结果的对象。
 * @returns {Cartographic[]} 修改后的结果参数，或者如果未提供，则返回一个新的数组实例。
 *
 * @example
 * //Create an array of Cartesians and determine their Cartographic representation on a WGS84 ellipsoid.
 * const positions = [new Cesium.Cartesian3(17832.12, 83234.52, 952313.73),
 *                  new Cesium.Cartesian3(17832.13, 83234.53, 952313.73),
 *                  new Cesium.Cartesian3(17832.14, 83234.54, 952313.73)]
 * const cartographicPositions = Cesium.Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
 */
Ellipsoid.prototype.cartesianArrayToCartographicArray = function (
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
    result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
  }
  return result;
};

/**
 * 沿着大地表面法线缩放提供的笛卡尔位置，使其位于此椭球体的表面上。
 * 如果位置位于椭球体的中心，则此函数返回 undefined。
 *
 * @param {Cartesian3} cartesian 要缩放的笛卡尔位置。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回一个新的 Cartesian3 实例，或者如果位置在中心则返回 undefined。
 */

Ellipsoid.prototype.scaleToGeodeticSurface = function (cartesian, result) {
  return scaleToGeodeticSurface(
    cartesian,
    this._oneOverRadii,
    this._oneOverRadiiSquared,
    this._centerToleranceSquared,
    result,
  );
};

/**
 * 沿着地心表面法线缩放提供的笛卡尔位置，使其位于此椭球体的表面上。
 *
 * @param {Cartesian3} cartesian 要缩放的笛卡尔位置。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回一个新的 Cartesian3 实例。
 */

Ellipsoid.prototype.scaleToGeocentricSurface = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }

  const positionX = cartesian.x;
  const positionY = cartesian.y;
  const positionZ = cartesian.z;
  const oneOverRadiiSquared = this._oneOverRadiiSquared;

  const beta =
    1.0 /
    Math.sqrt(
      positionX * positionX * oneOverRadiiSquared.x +
        positionY * positionY * oneOverRadiiSquared.y +
        positionZ * positionZ * oneOverRadiiSquared.z,
    );

  return Cartesian3.multiplyByScalar(cartesian, beta, result);
};

/**
 * 将笛卡尔坐标 X, Y, Z 位置转换为椭球体缩放空间，通过将其各分量乘以 {@link Ellipsoid#oneOverRadii} 的结果。
 *
 * @param {Cartesian3} position 要转换的位置。
 * @param {Cartesian3} [result] 要复制结果的位置，或者为 undefined 以创建并返回一个新实例。
 * @returns {Cartesian3} 表示在缩放空间中的位置。 如果结果参数不为 undefined，则返回的实例为该实例，否则是一个新的实例。
 */

Ellipsoid.prototype.transformPositionToScaledSpace = function (
  position,
  result,
) {
  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
};

/**
 * 将笛卡尔坐标 X, Y, Z 位置从椭球体缩放空间转换，通过将其各分量乘以 {@link Ellipsoid#radii} 的结果。
 *
 * @param {Cartesian3} position 要转换的位置。
 * @param {Cartesian3} [result] 要复制结果的位置，或者为 undefined 以创建并返回一个新实例。
 * @returns {Cartesian3} 表示在未缩放空间中的位置。如果结果参数不为 undefined，则返回的实例为该实例，否则是一个新的实例。
 */

Ellipsoid.prototype.transformPositionFromScaledSpace = function (
  position,
  result,
) {
  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.multiplyComponents(position, this._radii, result);
};

/**
 * 将此椭球体与提供的椭球体逐分量进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Ellipsoid} [right] 另一个椭球体。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */

Ellipsoid.prototype.equals = function (right) {
  return (
    this === right ||
    (defined(right) && Cartesian3.equals(this._radii, right._radii))
  );
};

/**
 * 创建一个字符串，表示此椭球体的格式为 '(radii.x, radii.y, radii.z)'。
 *
 * @returns {string} 一个字符串，表示此椭球体的格式为 '(radii.x, radii.y, radii.z)'。
 */

Ellipsoid.prototype.toString = function () {
  return this._radii.toString();
};

/**
 * 计算与 z 轴的切面法线相交的点。
 *
 * @param {Cartesian3} position 位置，必须在椭球体的表面上。
 * @param {number} [buffer = 0.0] 在检查点是否在椭球体内时，从椭球体大小中减去的缓冲值。
 *                                在地球的情况下，对于常见的地球基准，无需此缓冲，因为交点总是（相对）非常接近中心。
 *                                在 WGS84 基准中，交点的最大 z 轴值为 ±42841.31151331382（0.673% 的 z 轴）。
 *                                如果 MajorAxis / AxisOfRotation 的比例大于平方根 2，则交点可能在椭球体之外。
 * @param {Cartesian3} [result] 要复制结果的笛卡尔坐标，或者为 undefined 以创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 如果交点在椭球体内，则返回该交点，否则返回 undefined。
 *
 * @exception {DeveloperError} position 是必需的。
 * @exception {DeveloperError} 椭球体必须是旋转椭球体（radii.x == radii.y）。
 * @exception {DeveloperError} Ellipsoid.radii.z 必须大于 0。
 */

Ellipsoid.prototype.getSurfaceNormalIntersectionWithZAxis = function (
  position,
  buffer,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("position", position);

  if (
    !CesiumMath.equalsEpsilon(
      this._radii.x,
      this._radii.y,
      CesiumMath.EPSILON15,
    )
  ) {
    throw new DeveloperError(
      "Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)",
    );
  }

  Check.typeOf.number.greaterThan("Ellipsoid.radii.z", this._radii.z, 0);
  //>>includeEnd('debug');

  buffer = defaultValue(buffer, 0.0);

  const squaredXOverSquaredZ = this._squaredXOverSquaredZ;

  if (!defined(result)) {
    result = new Cartesian3();
  }

  result.x = 0.0;
  result.y = 0.0;
  result.z = position.z * (1 - squaredXOverSquaredZ);

  if (Math.abs(result.z) >= this._radii.z - buffer) {
    return undefined;
  }

  return result;
};

const scratchEndpoint = new Cartesian3();

/**
 * 计算在椭球体表面给定位置的曲率。
 *
 * @param {Cartesian3} surfacePosition 椭球体表面上将计算曲率的位置。
 * @param {Cartesian2} [result] 要复制结果的笛卡尔坐标，或者为 undefined 以创建并返回一个新实例。
 * @returns {Cartesian2} 提供位置处椭球体表面的局部曲率，包含东向和北向的曲率。
 *
 * @exception {DeveloperError} position 是必需的。
 */

Ellipsoid.prototype.getLocalCurvature = function (surfacePosition, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("surfacePosition", surfacePosition);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian2();
  }

  const primeVerticalEndpoint = this.getSurfaceNormalIntersectionWithZAxis(
    surfacePosition,
    0.0,
    scratchEndpoint,
  );
  const primeVerticalRadius = Cartesian3.distance(
    surfacePosition,
    primeVerticalEndpoint,
  );
  // meridional radius = (1 - e^2) * primeVerticalRadius^3 / a^2
  // where 1 - e^2 = b^2 / a^2,
  // so meridional = b^2 * primeVerticalRadius^3 / a^4
  //   = (b * primeVerticalRadius / a^2)^2 * primeVertical
  const radiusRatio =
    (this.minimumRadius * primeVerticalRadius) / this.maximumRadius ** 2;
  const meridionalRadius = primeVerticalRadius * radiusRatio ** 2;

  return Cartesian2.fromElements(
    1.0 / primeVerticalRadius,
    1.0 / meridionalRadius,
    result,
  );
};

const abscissas = [
  0.14887433898163, 0.43339539412925, 0.67940956829902, 0.86506336668898,
  0.97390652851717, 0.0,
];
const weights = [
  0.29552422471475, 0.26926671930999, 0.21908636251598, 0.14945134915058,
  0.066671344308684, 0.0,
];

/**
 * 计算给定定积分的 10 次高斯-勒让德求积。
 *
 * @param {number} a 积分的下限。
 * @param {number} b 积分的上限。
 * @param {Ellipsoid~RealValuedScalarFunction} func 要积分的函数。
 * @returns {number} 给定域内该函数的积分值。
 *
 * @private
 */

function gaussLegendreQuadrature(a, b, func) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("a", a);
  Check.typeOf.number("b", b);
  Check.typeOf.func("func", func);
  //>>includeEnd('debug');

  // The range is half of the normal range since the five weights add to one (ten weights add to two).
  // The values of the abscissas are multiplied by two to account for this.
  const xMean = 0.5 * (b + a);
  const xRange = 0.5 * (b - a);

  let sum = 0.0;
  for (let i = 0; i < 5; i++) {
    const dx = xRange * abscissas[i];
    sum += weights[i] * (func(xMean + dx) + func(xMean - dx));
  }

  // Scale the sum to the range of x.
  sum *= xRange;
  return sum;
}

/**
 * 实值标量函数。
 * @callback Ellipsoid~RealValuedScalarFunction
 *
 * @param {number} x 用于计算函数的值。
 * @returns {number} 在 x 处的函数值。
 *
 * @private
 */

/**
 * 使用高斯-勒让德 10 次求积法计算椭球体表面上矩形的表面积近似值。
 *
 * @param {Rectangle} rectangle 用于计算表面积的矩形。
 * @returns {number} 此椭球体表面上矩形的近似面积。
 */

Ellipsoid.prototype.surfaceArea = function (rectangle) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  //>>includeEnd('debug');
  const minLongitude = rectangle.west;
  let maxLongitude = rectangle.east;
  const minLatitude = rectangle.south;
  const maxLatitude = rectangle.north;

  while (maxLongitude < minLongitude) {
    maxLongitude += CesiumMath.TWO_PI;
  }

  const radiiSquared = this._radiiSquared;
  const a2 = radiiSquared.x;
  const b2 = radiiSquared.y;
  const c2 = radiiSquared.z;
  const a2b2 = a2 * b2;
  return gaussLegendreQuadrature(minLatitude, maxLatitude, function (lat) {
    // phi represents the angle measured from the north pole
    // sin(phi) = sin(pi / 2 - lat) = cos(lat), cos(phi) is similar
    const sinPhi = Math.cos(lat);
    const cosPhi = Math.sin(lat);
    return (
      Math.cos(lat) *
      gaussLegendreQuadrature(minLongitude, maxLongitude, function (lon) {
        const cosTheta = Math.cos(lon);
        const sinTheta = Math.sin(lon);
        return Math.sqrt(
          a2b2 * cosPhi * cosPhi +
            c2 *
              (b2 * cosTheta * cosTheta + a2 * sinTheta * sinTheta) *
              sinPhi *
              sinPhi,
        );
      })
    );
  });
};

export default Ellipsoid;
