import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 四维笛卡尔点.
 * @alias Cartesian4
 * @constructor
 *
 * @param {number} [x=0.0] X轴坐标.
 * @param {number} [y=0.0] Y轴坐标.
 * @param {number} [z=0.0] Z轴坐标.
 * @param {number} [w=0.0] W轴坐标.
 *
 * @see Cartesian2
 * @see Cartesian3
 * @see Packable
 */
function Cartesian4(x, y, z, w) {
  /**
   * X轴坐标.
   * @type {number}
   * @default 0.0
   */
  this.x = defaultValue(x, 0.0);

  /**
   * Y轴坐标.
   * @type {number}
   * @default 0.0
   */
  this.y = defaultValue(y, 0.0);

  /**
   * Z轴坐标.
   * @type {number}
   * @default 0.0
   */
  this.z = defaultValue(z, 0.0);

  /**
   * W轴坐标.
   * @type {number}
   * @default 0.0
   */
  this.w = defaultValue(w, 0.0);
}

/**
 * 根据 x、y、z 和 w 坐标创建一个 四维笛卡尔 实例.
 *
 * @param {number} x x坐标
 * @param {number} y y坐标
 * @param {number} z z坐标
 * @param {number} w w坐标
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4} 修改后的结果参数或新的 四维笛卡尔 实例（如果未提供）。
 */
Cartesian4.fromElements = function (x, y, z, w, result) {
  if (!defined(result)) {
    return new Cartesian4(x, y, z, w);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};

/**
 * 根据 {@link Color} 创建 四维笛卡尔 实例。<code>red</code>、<code>green</code>、<code>blue</code>、
* 和 <code>alpha</code> 分别映射到 <code>x</code>、<code>y</code>、<code>z</code> 和 <code>w</code>。
 *
 * @param {Color} color 源颜色.
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4} 修改后的结果参数或新的 四维笛卡尔 实例（如果未提供）。
 */
Cartesian4.fromColor = function (color, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("color", color);
  //>>includeEnd('debug');
  if (!defined(result)) {
    return new Cartesian4(color.red, color.green, color.blue, color.alpha);
  }

  result.x = color.red;
  result.y = color.green;
  result.z = color.blue;
  result.w = color.alpha;
  return result;
};

/**
 * 复制 四维笛卡尔 实例。
 *
 * @param {Cartesian4} cartesian 笛卡尔重复.
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4} 修改后的结果参数或新的 四维笛卡尔 实例（如果未提供）。（如果 cartesian 未定义，则返回 undefined）
 */
Cartesian4.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  result.z = cartesian.z;
  result.w = cartesian.w;
  return result;
};

/**
 * 用于将对象打包到数组中的元素数量.
 * @type {number}
 */
Cartesian4.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {Cartesian4} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
Cartesian4.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.x;
  array[startingIndex++] = value.y;
  array[startingIndex++] = value.z;
  array[startingIndex] = value.w;

  return array;
};

/**
 * 从打包数组中检索实例.
 *
 * @param {number[]} array 压缩数组.
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4}  修改后的结果参数或新的 四维笛卡尔 实例（如果未提供）。
 */
Cartesian4.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Cartesian4();
  }
  result.x = array[startingIndex++];
  result.y = array[startingIndex++];
  result.z = array[startingIndex++];
  result.w = array[startingIndex];
  return result;
};

/**
 * 将 四维笛卡尔 数组展平为组件数组.
 *
 * @param {Cartesian4[]} array 要打包的笛卡尔数组.
 * @param {number[]} [result] 存储结果的数组. 如果这是一个类型化数组，它必须具有 array.length * 4 个组件，否则将抛出 {@link DeveloperError}。如果它是常规数组，它将被调整大小以包含 (array.length * 4) 个元素.
 * @returns {number[]} 压缩数组.
 */
Cartesian4.packArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 4;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 4 elements",
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Cartesian4.pack(array[i], result, i * 4);
  }
  return result;
};

/**
 * 将笛卡尔分量数组解包为 四维笛卡尔 数组.
 *
 * @param {number[]} array 要解包的组件数组。
 * @param {Cartesian4[]} [result] 存储结果的数组.
 * @returns {Cartesian4[]} 解包后的数组.
 */
Cartesian4.unpackArray = function (array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 4);
  if (array.length % 4 !== 0) {
    throw new DeveloperError("array length must be a multiple of 4.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  if (!defined(result)) {
    result = new Array(length / 4);
  } else {
    result.length = length / 4;
  }

  for (let i = 0; i < length; i += 4) {
    const index = i / 4;
    result[index] = Cartesian4.unpack(array, i, result[index]);
  }
  return result;
};

/**
 * 根据数组中四个连续元素创建一个 四维笛卡尔.
 * @function
 *
 * @param {number[]} array 四个连续元素分别对应 x、y、z 和 w 分量的数组.
 * @param {number} [startingIndex=0] 第一个元素在数组中的偏移量，对应于 x 分量.
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4}  修改后的结果参数或新的 四维笛卡尔 实例（如果未提供）.
 *
 * @example
 * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0)
 * const v = [1.0, 2.0, 3.0, 4.0];
 * const p = Cesium.Cartesian4.fromArray(v);
 *
 * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0) using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 2.0, 3.0, 4.0];
 * const p2 = Cesium.Cartesian4.fromArray(v2, 2);
 */
Cartesian4.fromArray = Cartesian4.unpack;

/**
 * 计算所提供的笛卡尔坐标的最大分量的值.
 *
 * @param {Cartesian4} cartesian 要使用的笛卡尔.
 * @returns {number} 最大分量的值.
 */
Cartesian4.maximumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
};

/**
 * 计算提供的笛卡尔坐标的最小分量的值.
 *
 * @param {Cartesian4} cartesian 要使用的笛卡尔.
 * @returns {number} 最小分量的值.
 */
Cartesian4.minimumComponent = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最小分量的笛卡尔坐标.
 *
 * @param {Cartesian4} first 一个笛卡尔坐标.
 * @param {Cartesian4} second 一个笛卡尔坐标.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 具有最少组件的笛卡尔.
 */
Cartesian4.minimumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.min(first.x, second.x);
  result.y = Math.min(first.y, second.y);
  result.z = Math.min(first.z, second.z);
  result.w = Math.min(first.w, second.w);

  return result;
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标最大分量的笛卡尔坐标。
 *
 * @param {Cartesian4} first 一个笛卡尔坐标.
 * @param {Cartesian4} second 一个笛卡尔坐标.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 具有最大分量的笛卡尔.
 */
Cartesian4.maximumByComponent = function (first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.max(first.x, second.x);
  result.y = Math.max(first.y, second.y);
  result.z = Math.max(first.z, second.z);
  result.w = Math.max(first.w, second.w);

  return result;
};

/**
 * 将一个值限制在两个值之间.
 *
 * @param {Cartesian4} value 要 clamp 的值.
 * @param {Cartesian4} min 最小边界.
 * @param {Cartesian4} max 最大边界.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 限制值使得最小值 <= 结果 <= 最大值.
 */
Cartesian4.clamp = function (value, min, max, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.typeOf.object("min", min);
  Check.typeOf.object("max", max);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = CesiumMath.clamp(value.x, min.x, max.x);
  const y = CesiumMath.clamp(value.y, min.y, max.y);
  const z = CesiumMath.clamp(value.z, min.z, max.z);
  const w = CesiumMath.clamp(value.w, min.w, max.w);

  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;

  return result;
};

/**
 * 计算提供的笛卡尔量级.
 *
 * @param {Cartesian4} cartesian 计算提供的笛卡尔量级.
 * @returns {number} 平方幅度.
 */
Cartesian4.magnitudeSquared = function (cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return (
    cartesian.x * cartesian.x +
    cartesian.y * cartesian.y +
    cartesian.z * cartesian.z +
    cartesian.w * cartesian.w
  );
};

/**
 * 计算笛卡尔的量级（长度）.
 *
 * @param {Cartesian4} cartesian 要计算其大小的笛卡尔实例.
 * @returns {number} 量级.
 */
Cartesian4.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
};

const distanceScratch = new Cartesian4();

/**
 * 计算两点之间的 4 维空间距离.
 *
 * @param {Cartesian4} left 计算距离的第一个点.
 * @param {Cartesian4} right 要计算距离的第二点.
 * @returns {number} 两点之间的距离.
 *
 * @example
 * // Returns 1.0
 * const d = Cesium.Cartesian4.distance(
 *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
 *   new Cesium.Cartesian4(2.0, 0.0, 0.0, 0.0));
 */
Cartesian4.distance = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian4.subtract(left, right, distanceScratch);
  return Cartesian4.magnitude(distanceScratch);
};

/**
 * 计算两点之间的平方距离。使用此函数比较平方距离比使用 {@link Cartesian4#distance} 比较距离更有效.
 *
 * @param {Cartesian4} left 计算距离的第一个点.
 * @param {Cartesian4} right 要计算距离的第二点.
 * @returns {number} 两点之间的距离.
 *
 * @example
 * // Returns 4.0, not 2.0
 * const d = Cesium.Cartesian4.distance(
 *   new Cesium.Cartesian4(1.0, 0.0, 0.0, 0.0),
 *   new Cesium.Cartesian4(3.0, 0.0, 0.0, 0.0));
 */
Cartesian4.distanceSquared = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian4.subtract(left, right, distanceScratch);
  return Cartesian4.magnitudeSquared(distanceScratch);
};

/**
 * 计算所提供的笛卡尔的规范化形式。
 *
 * @param {Cartesian4} cartesian 要规范化的笛卡尔.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.normalize = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const magnitude = Cartesian4.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;
  result.z = cartesian.z / magnitude;
  result.w = cartesian.w / magnitude;

  //>>includeStart('debug', pragmas.debug);
  if (
    isNaN(result.x) ||
    isNaN(result.y) ||
    isNaN(result.z) ||
    isNaN(result.w)
  ) {
    throw new DeveloperError("normalized result is not a number");
  }
  //>>includeEnd('debug');

  return result;
};

/**
 * 计算两个笛卡尔坐标的点积（标量积）.
 *
 * @param {Cartesian4} left 第一个笛卡尔.
 * @param {Cartesian4} right 第二个笛卡尔.
 * @returns {number} 点积.
 */
Cartesian4.dot = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w
  );
};

/**
 * 计算两个笛卡尔坐标的分量积.
 *
 * @param {Cartesian4} left 第一个笛卡尔.
 * @param {Cartesian4} right 第二个笛卡尔.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.multiplyComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x * right.x;
  result.y = left.y * right.y;
  result.z = left.z * right.z;
  result.w = left.w * right.w;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量商.
 *
 * @param {Cartesian4} left 第一个笛卡尔.
 * @param {Cartesian4} right 第二个笛卡尔.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.divideComponents = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x / right.x;
  result.y = left.y / right.y;
  result.z = left.z / right.z;
  result.w = left.w / right.w;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量和.
 *
 * @param {Cartesian4} left 第一个笛卡尔.
 * @param {Cartesian4} right 第二个笛卡尔.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.add = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  result.w = left.w + right.w;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量差.
 *
 * @param {Cartesian4} left 第一个笛卡尔.
 * @param {Cartesian4} right 第二个笛卡尔.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.subtract = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  result.w = left.w - right.w;
  return result;
};

/**
 * 将提供的笛卡尔分量与提供的标量相乘.
 *
 * @param {Cartesian4} cartesian 要缩放的笛卡尔坐标.
 * @param {number} scalar 要乘以的标量.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.multiplyByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  result.z = cartesian.z * scalar;
  result.w = cartesian.w * scalar;
  return result;
};

/**
 * 将提供的笛卡尔分量除以提供的标量.
 *
 * @param {Cartesian4} cartesian 要划分的笛卡尔.
 * @param {number} scalar 要除以的标量.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.divideByScalar = function (cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  result.z = cartesian.z / scalar;
  result.w = cartesian.w / scalar;
  return result;
};

/**
 * 否定所提供的笛卡尔.
 *
 * @param {Cartesian4} cartesian 笛卡尔被否定.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.negate = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -cartesian.x;
  result.y = -cartesian.y;
  result.z = -cartesian.z;
  result.w = -cartesian.w;
  return result;
};

/**
 * 计算提供的笛卡尔坐标的绝对值.
 *
 * @param {Cartesian4} cartesian 要计算绝对值的笛卡尔坐标.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.abs = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.abs(cartesian.x);
  result.y = Math.abs(cartesian.y);
  result.z = Math.abs(cartesian.z);
  result.w = Math.abs(cartesian.w);
  return result;
};

const lerpScratch = new Cartesian4();
/**
 * 使用提供的笛卡尔坐标计算 t 处的线性插值或外推.
 *
 * @param {Cartesian4} start t 在 0.0 时对应的值.
 * @param {Cartesian4}end t 为 1.0 时对应的值.
 * @param {number} t 沿 t 进行插值的点.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 修改的结果参数
 */
Cartesian4.lerp = function (start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  Cartesian4.multiplyByScalar(end, t, lerpScratch);
  result = Cartesian4.multiplyByScalar(start, 1.0 - t, result);
  return Cartesian4.add(lerpScratch, result, result);
};

const mostOrthogonalAxisScratch = new Cartesian4();
/**
 *返回与提供的笛卡尔坐标最正交的轴.
 *
 * @param {Cartesian4} cartesian 寻找最正交轴的笛卡尔坐标.
 * @param {Cartesian4} result 存储结果的对象.
 * @returns {Cartesian4} 最正交轴.
 */
Cartesian4.mostOrthogonalAxis = function (cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const f = Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch);
  Cartesian4.abs(f, f);

  if (f.x <= f.y) {
    if (f.x <= f.z) {
      if (f.x <= f.w) {
        result = Cartesian4.clone(Cartesian4.UNIT_X, result);
      } else {
        result = Cartesian4.clone(Cartesian4.UNIT_W, result);
      }
    } else if (f.z <= f.w) {
      result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
    } else {
      result = Cartesian4.clone(Cartesian4.UNIT_W, result);
    }
  } else if (f.y <= f.z) {
    if (f.y <= f.w) {
      result = Cartesian4.clone(Cartesian4.UNIT_Y, result);
    } else {
      result = Cartesian4.clone(Cartesian4.UNIT_W, result);
    }
  } else if (f.z <= f.w) {
    result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
  } else {
    result = Cartesian4.clone(Cartesian4.UNIT_W, result);
  }

  return result;
};

/**
 * 逐个比较提供的笛卡尔坐标并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartesian4} [left] 第一个笛卡尔.
 * @param {Cartesian4} [right] 第二个笛卡尔.
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */
Cartesian4.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z &&
      left.w === right.w)
  );
};

/**
 * @private
 */
Cartesian4.equalsArray = function (cartesian, array, offset) {
  return (
    cartesian.x === array[offset] &&
    cartesian.y === array[offset + 1] &&
    cartesian.z === array[offset + 2] &&
    cartesian.w === array[offset + 3]
  );
};

/**
 * 逐个比较提供的笛卡尔坐标并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Cartesian4} [left] 第一个笛卡尔.
 * @param {Cartesian4} [right] 第二个笛卡尔.
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差.
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差.
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */
Cartesian4.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      CesiumMath.equalsEpsilon(
        left.x,
        right.x,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.y,
        right.y,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.z,
        right.z,
        relativeEpsilon,
        absoluteEpsilon,
      ) &&
      CesiumMath.equalsEpsilon(
        left.w,
        right.w,
        relativeEpsilon,
        absoluteEpsilon,
      ))
  );
};

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (0.0, 0.0, 0.0, 0.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.ZERO = Object.freeze(new Cartesian4(0.0, 0.0, 0.0, 0.0));

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (1.0, 1.0, 1.0, 1.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.ONE = Object.freeze(new Cartesian4(1.0, 1.0, 1.0, 1.0));

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (1.0, 0.0, 0.0, 0.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_X = Object.freeze(new Cartesian4(1.0, 0.0, 0.0, 0.0));

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (0.0, 1.0, 0.0, 0.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_Y = Object.freeze(new Cartesian4(0.0, 1.0, 0.0, 0.0));

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (0.0, 0.0, 1.0, 0.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_Z = Object.freeze(new Cartesian4(0.0, 0.0, 1.0, 0.0));

/**
 * 一个不可变的 四维笛卡尔点 实例初始化为 (0.0, 0.0, 0.0, 1.0).
 *
 * @type {Cartesian4}
 * @constant
 */
Cartesian4.UNIT_W = Object.freeze(new Cartesian4(0.0, 0.0, 0.0, 1.0));

/**
 * 复制此 四维笛卡尔点 实例.
 *
 * @param {Cartesian4} [result] 存储结果的对象.
 * @returns {Cartesian4} 修改后的结果参数或新的 四维笛卡尔点 实例（如果未提供）.
 */
Cartesian4.prototype.clone = function (result) {
  return Cartesian4.clone(this, result);
};

/**
 * 将此笛卡尔坐标与提供的笛卡尔坐标逐个分量进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartesian4} [right] 右侧笛卡尔.
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>
 */
Cartesian4.prototype.equals = function (right) {
  return Cartesian4.equals(this, right);
};

/**
 * 将此笛卡尔坐标与提供的笛卡尔坐标逐个分量进行比较并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Cartesian4} [right] 右侧笛卡尔.
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差.
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差.
 * @returns {boolean} 如果它们在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>
 */
Cartesian4.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return Cartesian4.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon,
  );
};

/**
 * 创建一个表示该笛卡尔坐标的字符串，格式如下 '(x, y, z, w)'.
 *
 * @returns {string} 表示提供的笛卡尔坐标的字符串，格式如下 '(x, y, z, w)'.
 */
Cartesian4.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};

// scratchU8Array and scratchF32Array are views into the same buffer
const scratchF32Array = new Float32Array(1);
const scratchU8Array = new Uint8Array(scratchF32Array.buffer);

const testU32 = new Uint32Array([0x11223344]);
const testU8 = new Uint8Array(testU32.buffer);
const littleEndian = testU8[0] === 0x44;

/**
 * 将任意浮点值打包为 4 个可用 uint8 表示的值.
 *
 * @param {number} value 浮点数.
 * @param {Cartesian4} [result] 包含压缩浮点数的 四维笛卡尔点.
 * @returns {Cartesian4} 一个 四维笛卡尔点，表示将浮点数打包为 x、y、z 和 w 的值.
 */
Cartesian4.packFloat = function (value, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian4();
  }

  // scratchU8Array and scratchF32Array are views into the same buffer
  scratchF32Array[0] = value;

  if (littleEndian) {
    result.x = scratchU8Array[0];
    result.y = scratchU8Array[1];
    result.z = scratchU8Array[2];
    result.w = scratchU8Array[3];
  } else {
    // convert from big-endian to little-endian
    result.x = scratchU8Array[3];
    result.y = scratchU8Array[2];
    result.z = scratchU8Array[1];
    result.w = scratchU8Array[0];
  }
  return result;
};

/**
 * 使用 四维笛卡尔点.packFloat 解压浮点数.
 *
 * @param {Cartesian4} packedFloat 一个 四维笛卡尔点，包含一个浮点数，该浮点数被打包成 4 个可用 uint8 表示的值.
 * @returns {number} 解压后的浮点数.
 * @private
 */
Cartesian4.unpackFloat = function (packedFloat) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("packedFloat", packedFloat);
  //>>includeEnd('debug');

  // scratchU8Array and scratchF32Array are views into the same buffer
  if (littleEndian) {
    scratchU8Array[0] = packedFloat.x;
    scratchU8Array[1] = packedFloat.y;
    scratchU8Array[2] = packedFloat.z;
    scratchU8Array[3] = packedFloat.w;
  } else {
    // convert from little-endian to big-endian
    scratchU8Array[0] = packedFloat.w;
    scratchU8Array[1] = packedFloat.z;
    scratchU8Array[2] = packedFloat.y;
    scratchU8Array[3] = packedFloat.x;
  }
  return scratchF32Array[0];
};
export default Cartesian4;
