import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";

/**
 * 一个二维笛卡尔坐标点。
 * @alias Cartesian2
 * @constructor
 *
 * @param {number} [x=0.0] X轴的坐标.
 * @param {number} [y=0.0] Y轴的坐标.
 *
 * @see Cartesian3
 * @see Cartesian4
 * @see Packable
 */
function Cartesian2(x, y) {
  /**
   * X轴的坐标.
   * @type {number}
   * @default 0.0
   */
  this.x = defaultValue(x, 0.0);

  /**
   * Y轴的坐标.
   * @type {number}
   * @default 0.0
   */
  this.y = defaultValue(y, 0.0);
}

/**
 * 根据 x 和 y 坐标创建一个 二维笛卡尔 实例.
 *
 * @param {number} x X坐标.
 * @param {number} y Y坐标.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 Cartesian2 实例（如果未提供）.
 */
Cartesian2.fromElements = function(x, y, result) {
  if (!defined(result)) {
    return new Cartesian2(x, y);
  }

  result.x = x;
  result.y = y;
  return result;
};

/**
 * 复制 二维笛卡尔 实例.
 *
 * @param {Cartesian2} cartesian 笛卡尔重复.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 Cartesian2 实例（如果未提供）。（如果 cartesian 未定义，则返回 undefined）
 */
Cartesian2.clone = function(cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian2(cartesian.x, cartesian.y);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  return result;
};

/**
 * 从现有的 三维笛卡尔 创建 二维笛卡尔 实例。这仅获取 三维笛卡尔 的 x 和 y 属性并删除 z.
 * @function
 *
 * @param {Cartesian3} cartesian 从 三维笛卡尔 实例创建 二维笛卡尔 实例.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 二维笛卡尔 实例（如果未提供）.
 */
Cartesian2.fromCartesian3 = Cartesian2.clone;

/**
 * 从现有的 四维笛卡尔 创建 二位笛卡尔 实例。这仅获取 四维笛卡尔 的 x 和 y 属性并删除 z 和 w.
 * @function
 *
 * @param {Cartesian4} cartesian 从 四维笛卡尔 实例创建 二维笛卡尔 实例.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 二维笛卡尔 实例（如果未提供）.
 */
Cartesian2.fromCartesian4 = Cartesian2.clone;

/**
 * 用于将对象打包到数组中的元素数量.
 * @type {number}
 */
Cartesian2.packedLength = 2;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {Cartesian2} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
Cartesian2.pack = function(value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.x;
  array[startingIndex] = value.y;

  return array;
};

/**
 * 从打包数组中检索实例.
 *
 * @param {number[]} array 打包的数组.
 * @param {number} [startingIndex=0] 要解包的数组索引.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 二维笛卡尔 实例（如果未提供）.
 */
Cartesian2.unpack = function(array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Cartesian2();
  }
  result.x = array[startingIndex++];
  result.y = array[startingIndex];
  return result;
};

/**
 * 将 二维笛卡尔 数组展平为组件数组.
 *
 * @param {Cartesian2[]} array 要打包的笛卡尔数组.
 * @param {number[]} [result] 用于存储结果的数组。如果这是一个类型化数组，它必须具有 array.length * 2 个组件，否则将抛出 {@link DeveloperError}。如果它是一个常规数组，它将被调整大小以包含 (array.length * 2) 个元素.
 * @returns {number[]} 打包的数组.
 */
Cartesian2.packArray = function(array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  const length = array.length;
  const resultLength = length * 2;
  if (!defined(result)) {
    result = new Array(resultLength);
  } else if (!Array.isArray(result) && result.length !== resultLength) {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(
      "If result is a typed array, it must have exactly array.length * 2 elements",
    );
    //>>includeEnd('debug');
  } else if (result.length !== resultLength) {
    result.length = resultLength;
  }

  for (let i = 0; i < length; ++i) {
    Cartesian2.pack(array[i], result, i * 2);
  }
  return result;
};

/**
 * 将笛卡尔分量数组解压缩到笛卡尔 2 数组中.
 *
 * @param {number[]} array 要解包的组件数组.
 * @param {Cartesian2[]} [result] 要存储结果的数组.
 * @returns {Cartesian2[]} 解压缩的数组.
 */
Cartesian2.unpackArray = function(array, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  Check.typeOf.number.greaterThanOrEquals("array.length", array.length, 2);
  if (array.length % 2 !== 0) {
    throw new DeveloperError("array length must be a multiple of 2.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  if (!defined(result)) {
    result = new Array(length / 2);
  } else {
    result.length = length / 2;
  }

  for (let i = 0; i < length; i += 2) {
    const index = i / 2;
    result[index] = Cartesian2.unpack(array, i, result[index]);
  }
  return result;
};

/**
 * 从数组中的两个连续元素创建 二维笛卡尔 实例.
 * @function
 *
 * @param {number[]} array 其两个连续元素分别对应于 x 和 y 分量的数组.
 * @param {number} [startingIndex=0] 第一个元素数组的偏移量，对应于 x 分量.
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 二维笛卡尔 实例（如果未提供）.
 *
 * @example
 * // Create a Cartesian2 with (1.0, 2.0)
 * const v = [1.0, 2.0];
 * const p = Cesium.Cartesian2.fromArray(v);
 *
 * // Create a Cartesian2 with (1.0, 2.0) using an offset into an array
 * const v2 = [0.0, 0.0, 1.0, 2.0];
 * const p2 = Cesium.Cartesian2.fromArray(v2, 2);
 */
Cartesian2.fromArray = Cartesian2.unpack;

/**
 * 计算提供的笛卡尔矩阵的最大分量值.
 *
 * @param {Cartesian2} cartesian 要使用的笛卡尔坐标.
 * @returns {number} 最大分量的值.
 */
Cartesian2.maximumComponent = function(cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.max(cartesian.x, cartesian.y);
};

/**
 * 计算提供的笛卡尔坐标的最小分量的值.
 *
 * @param {Cartesian2} cartesian 要使用的笛卡尔.
 * @returns {number} 最小元件值.
 */
Cartesian2.minimumComponent = function(cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return Math.min(cartesian.x, cartesian.y);
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最小分量的笛卡尔坐标.
 *
 * @param {Cartesian2} first 一个笛卡尔坐标.
 * @param {Cartesian2} second 一个笛卡尔坐标.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 具有最少组件的笛卡尔.
 */
Cartesian2.minimumByComponent = function(first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.min(first.x, second.x);
  result.y = Math.min(first.y, second.y);

  return result;
};

/**
 * 比较两个笛卡尔坐标并计算一个包含所提供笛卡尔坐标的最大分量的笛卡尔坐标.
 *
 * @param {Cartesian2} first 一个笛卡尔坐标.
 * @param {Cartesian2} second 一个笛卡尔坐标.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 具有最大分量的笛卡尔.
 */
Cartesian2.maximumByComponent = function(first, second, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("first", first);
  Check.typeOf.object("second", second);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.max(first.x, second.x);
  result.y = Math.max(first.y, second.y);
  return result;
};

/**
 * 将值约束为位于两个值之间.
 *
 * @param {Cartesian2} value 要 clamp 的值.
 * @param {Cartesian2} min 最小边界.
 * @param {Cartesian2} max 最大边界.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 限制值，使得最小值 <= 结果 <= 最大值.
 */
Cartesian2.clamp = function(value, min, max, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.typeOf.object("min", min);
  Check.typeOf.object("max", max);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const x = CesiumMath.clamp(value.x, min.x, max.x);
  const y = CesiumMath.clamp(value.y, min.y, max.y);

  result.x = x;
  result.y = y;

  return result;
};

/**
 * 计算提供的笛卡尔量级.
 *
 * @param {Cartesian2} cartesian 要计算其平方大小的笛卡尔实例.
 * @returns {number}  平方大小.
 */
Cartesian2.magnitudeSquared = function(cartesian) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
};

/**
 * 计算笛卡尔的量级（长度）.
 *
 * @param {Cartesian2} cartesian 要计算其大小的笛卡尔实例.
 * @returns {number} 量级.
 */
Cartesian2.magnitude = function(cartesian) {
  return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
};

const distanceScratch = new Cartesian2();

/**
 * 计算两点之间的距离.
 *
 * @param {Cartesian2} left 计算距离的第一个点.
 * @param {Cartesian2} right 要计算距离的第二点.
 * @returns {number} 两点之间的距离.
 *
 * @example
 * // Returns 1.0
 * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(2.0, 0.0));
 */
Cartesian2.distance = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.subtract(left, right, distanceScratch);
  return Cartesian2.magnitude(distanceScratch);
};

/**
 * 计算两点之间的平方距离。使用此函数比较平方距离比使用 {@link Cartesian2#distance} 比较距离更有效。
 *
 * @param {Cartesian2} left 计算距离的第一个点.
 * @param {Cartesian2} right 要计算距离的第二点.
 * @returns {number} 两点之间的距离.
 *
 * @example
 * // Returns 4.0, not 2.0
 * const d = Cesium.Cartesian2.distance(new Cesium.Cartesian2(1.0, 0.0), new Cesium.Cartesian2(3.0, 0.0));
 */
Cartesian2.distanceSquared = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.subtract(left, right, distanceScratch);
  return Cartesian2.magnitudeSquared(distanceScratch);
};

/**
 * 计算提供的笛卡尔坐标的规范化形式.
 *
 * @param {Cartesian2} cartesian 要规范化的笛卡尔.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.normalize = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const magnitude = Cartesian2.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;

  //>>includeStart('debug', pragmas.debug);
  if (isNaN(result.x) || isNaN(result.y)) {
    throw new DeveloperError("normalized result is not a number");
  }
  //>>includeEnd('debug');

  return result;
};

/**
 * 计算两个笛卡尔坐标的点积（标量积）.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @returns {number} 点积.
 */
Cartesian2.dot = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return left.x * right.x + left.y * right.y;
};

/**
 * 计算将输入向量的 Z 坐标隐式设置为 0 所产生的叉积的幅度
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @returns {number} 叉积.
 */
Cartesian2.cross = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return left.x * right.y - left.y * right.x;
};

/**
 * 计算两个笛卡尔坐标的分量积.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.multiplyComponents = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x * right.x;
  result.y = left.y * right.y;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量商.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.divideComponents = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x / right.x;
  result.y = left.y / right.y;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量和.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.add = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x + right.x;
  result.y = left.y + right.y;
  return result;
};

/**
 * 计算两个笛卡尔坐标的分量差.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.subtract = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = left.x - right.x;
  result.y = left.y - right.y;
  return result;
};

/**
 * 将提供的笛卡尔分量与提供的标量相乘.
 *
 * @param {Cartesian2} cartesian 要缩放的笛卡尔坐标.
 * @param {number} scalar 要乘以的标量.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.multiplyByScalar = function(cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  return result;
};

/**
 * 将提供的笛卡尔分量除以提供的标量.
 *
 * @param {Cartesian2} cartesian 要划分的笛卡尔.
 * @param {number} scalar 要除以的标量.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.divideByScalar = function(cartesian, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  return result;
};

/**
 * 否定所提供的笛卡尔.
 *
 * @param {Cartesian2} cartesian 笛卡尔被否定.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.negate = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -cartesian.x;
  result.y = -cartesian.y;
  return result;
};

/**
 * 计算提供的笛卡尔坐标的绝对值.
 *
 * @param {Cartesian2} cartesian 要计算绝对值的笛卡尔坐标.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.abs = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = Math.abs(cartesian.x);
  result.y = Math.abs(cartesian.y);
  return result;
};

const lerpScratch = new Cartesian2();
/**
 * 使用提供的笛卡尔坐标计算 t 处的线性插值或外推.
 *
 * @param {Cartesian2} start t 在 0.0 时对应的值.
 * @param {Cartesian2} end t 为 1.0 时对应的值.
 * @param {number} t 沿 t 进行插值的点.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 修改的结果参数
 */
Cartesian2.lerp = function(start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  Cartesian2.multiplyByScalar(end, t, lerpScratch);
  result = Cartesian2.multiplyByScalar(start, 1.0 - t, result);
  return Cartesian2.add(lerpScratch, result, result);
};

const angleBetweenScratch = new Cartesian2();
const angleBetweenScratch2 = new Cartesian2();
/**
 * 返回提供的笛卡尔坐标之间的角度（以弧度为单位）.
 *
 * @param {Cartesian2} left 第一个笛卡尔.
 * @param {Cartesian2} right 第二个笛卡尔.
 * @returns {number} 笛卡尔坐标系之间的角度.
 */
Cartesian2.angleBetween = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  Cartesian2.normalize(left, angleBetweenScratch);
  Cartesian2.normalize(right, angleBetweenScratch2);
  return CesiumMath.acosClamped(
    Cartesian2.dot(angleBetweenScratch, angleBetweenScratch2),
  );
};

const mostOrthogonalAxisScratch = new Cartesian2();
/**
 *返回与提供的笛卡尔坐标最正交的轴.
 *
 * @param {Cartesian2} cartesian 寻找最正交轴的笛卡尔坐标.
 * @param {Cartesian2} result 存储结果的对象.
 * @returns {Cartesian2} 最正交轴.
 */
Cartesian2.mostOrthogonalAxis = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const f = Cartesian2.normalize(cartesian, mostOrthogonalAxisScratch);
  Cartesian2.abs(f, f);

  if (f.x <= f.y) {
    result = Cartesian2.clone(Cartesian2.UNIT_X, result);
  } else {
    result = Cartesian2.clone(Cartesian2.UNIT_Y, result);
  }

  return result;
};

/**
 * 逐个比较提供的笛卡尔坐标并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartesian2} [left] 第一个笛卡尔.
 * @param {Cartesian2} [right] 第二个笛卡尔.
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */
Cartesian2.equals = function(left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y)
  );
};

/**
 * @private
 */
Cartesian2.equalsArray = function(cartesian, array, offset) {
  return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
};

/**
 * 逐个比较提供的笛卡尔坐标并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Cartesian2} [left] 第一个笛卡尔.
 * @param {Cartesian2} [right] 第二个笛卡尔.
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差.
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差.
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */
Cartesian2.equalsEpsilon = function(
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
      ))
  );
};

/**
 * 一个不可变的 二维笛卡尔 实例初始化为 (0.0, 0.0).
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ZERO = Object.freeze(new Cartesian2(0.0, 0.0));

/**
 * 一个不可变的 二维笛卡尔 实例初始化为 (1.0, 1.0).
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ONE = Object.freeze(new Cartesian2(1.0, 1.0));

/**
 * 一个不可变的 二维笛卡尔 实例初始化为 (1.0, 0.0).
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_X = Object.freeze(new Cartesian2(1.0, 0.0));

/**
 * 一个不可变的 二维笛卡尔 实例初始化为 (0.0, 1.0).
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.UNIT_Y = Object.freeze(new Cartesian2(0.0, 1.0));

/**
 * 复制此 二维笛卡尔 实例.
 *
 * @param {Cartesian2} [result] 存储结果的对象.
 * @returns {Cartesian2} 修改后的结果参数或新的 二维笛卡尔 实例（如果未提供）.
 */
Cartesian2.prototype.clone = function(result) {
  return Cartesian2.clone(this, result);
};

/**
 * 将此笛卡尔坐标与提供的笛卡尔坐标逐个分量进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Cartesian2} [right] 右侧笛卡尔.
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>
 */
Cartesian2.prototype.equals = function(right) {
  return Cartesian2.equals(this, right);
};

/**
 * 将此笛卡尔坐标与提供的笛卡尔坐标逐个分量进行比较并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Cartesian2} [right] 右侧笛卡尔.
 * @param {number} [relativeEpsilon=0] 用于相等性测试的相对 epsilon 容差.
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差.
 * @returns {boolean} 如果它们在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>
 */
Cartesian2.prototype.equalsEpsilon = function(
  right,
  relativeEpsilon,
  absoluteEpsilon,
) {
  return Cartesian2.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon,
  );
};

/**
 * 创建一个表示该笛卡尔坐标的字符串，格式为"(x, y)".
 *
 * @returns {string} 以"（x，y）"格式表示所提供的笛卡尔坐标的字符串.
 */
Cartesian2.prototype.toString = function() {
  return `(${this.x}, ${this.y})`;
};
export default Cartesian2;
