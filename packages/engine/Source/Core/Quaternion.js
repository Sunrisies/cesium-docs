import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import FeatureDetection from "./FeatureDetection.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";

/**
 * 一组四维坐标，用于表示三维空间中的旋转.
 * @alias Quaternion
 * @constructor
 *
 * @param {number} [x=0.0] X轴坐标.
 * @param {number} [y=0.0] Y轴坐标.
 * @param {number} [z=0.0] Z轴坐标.
 * @param {number} [w=0.0] W轴坐标.
 *
 * @see PackableForInterpolation
 */
function Quaternion(x, y, z, w) {
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

let fromAxisAngleScratch = new Cartesian3();

/**
 * 计算表示绕轴旋转的四元数。
 *
 * @param {Cartesian3} axis 旋转轴。
 * @param {number} angle 绕轴旋转的角度（以弧度为单位）。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 */

Quaternion.fromAxisAngle = function(axis, angle, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("axis", axis);
  Check.typeOf.number("angle", angle);
  //>>includeEnd('debug');

  const halfAngle = angle / 2.0;
  const s = Math.sin(halfAngle);
  fromAxisAngleScratch = Cartesian3.normalize(axis, fromAxisAngleScratch);

  const x = fromAxisAngleScratch.x * s;
  const y = fromAxisAngleScratch.y * s;
  const z = fromAxisAngleScratch.z * s;
  const w = Math.cos(halfAngle);
  if (!defined(result)) {
    return new Quaternion(x, y, z, w);
  }
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};

const fromRotationMatrixNext = [1, 2, 0];
const fromRotationMatrixQuat = new Array(3);
/**
 * 从提供的 Matrix3 实例计算出一个四元数。
 *
 * @param {Matrix3} matrix 旋转矩阵。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 *
 * @see Matrix3.fromQuaternion
 */

Quaternion.fromRotationMatrix = function(matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("matrix", matrix);
  //>>includeEnd('debug');

  let root;
  let x;
  let y;
  let z;
  let w;

  const m00 = matrix[Matrix3.COLUMN0ROW0];
  const m11 = matrix[Matrix3.COLUMN1ROW1];
  const m22 = matrix[Matrix3.COLUMN2ROW2];
  const trace = m00 + m11 + m22;

  if (trace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    root = Math.sqrt(trace + 1.0); // 2w
    w = 0.5 * root;
    root = 0.5 / root; // 1/(4w)

    x = (matrix[Matrix3.COLUMN1ROW2] - matrix[Matrix3.COLUMN2ROW1]) * root;
    y = (matrix[Matrix3.COLUMN2ROW0] - matrix[Matrix3.COLUMN0ROW2]) * root;
    z = (matrix[Matrix3.COLUMN0ROW1] - matrix[Matrix3.COLUMN1ROW0]) * root;
  } else {
    // |w| <= 1/2
    const next = fromRotationMatrixNext;

    let i = 0;
    if (m11 > m00) {
      i = 1;
    }
    if (m22 > m00 && m22 > m11) {
      i = 2;
    }
    const j = next[i];
    const k = next[j];

    root = Math.sqrt(
      matrix[Matrix3.getElementIndex(i, i)] -
      matrix[Matrix3.getElementIndex(j, j)] -
      matrix[Matrix3.getElementIndex(k, k)] +
      1.0,
    );

    const quat = fromRotationMatrixQuat;
    quat[i] = 0.5 * root;
    root = 0.5 / root;
    w =
      (matrix[Matrix3.getElementIndex(k, j)] -
        matrix[Matrix3.getElementIndex(j, k)]) *
      root;
    quat[j] =
      (matrix[Matrix3.getElementIndex(j, i)] +
        matrix[Matrix3.getElementIndex(i, j)]) *
      root;
    quat[k] =
      (matrix[Matrix3.getElementIndex(k, i)] +
        matrix[Matrix3.getElementIndex(i, k)]) *
      root;

    x = -quat[0];
    y = -quat[1];
    z = -quat[2];
  }

  if (!defined(result)) {
    return new Quaternion(x, y, z, w);
  }
  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};

const scratchHPRQuaternion = new Quaternion();
let scratchHeadingQuaternion = new Quaternion();
let scratchPitchQuaternion = new Quaternion();
let scratchRollQuaternion = new Quaternion();

/**
 * 根据给定的航向、俯仰和滚动角度计算旋转。航向是关于负 z 轴的旋转。俯仰是关于负 y 轴的旋转。滚动是关于正 x 轴的旋转。
 *
 * @param {HeadingPitchRoll} headingPitchRoll 以航向、俯仰和滚动表示的旋转。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 */

Quaternion.fromHeadingPitchRoll = function(headingPitchRoll, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("headingPitchRoll", headingPitchRoll);
  //>>includeEnd('debug');

  scratchRollQuaternion = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_X,
    headingPitchRoll.roll,
    scratchHPRQuaternion,
  );
  scratchPitchQuaternion = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Y,
    -headingPitchRoll.pitch,
    result,
  );
  result = Quaternion.multiply(
    scratchPitchQuaternion,
    scratchRollQuaternion,
    scratchPitchQuaternion,
  );
  scratchHeadingQuaternion = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -headingPitchRoll.heading,
    scratchHPRQuaternion,
  );
  return Quaternion.multiply(scratchHeadingQuaternion, result, result);
};

const sampledQuaternionAxis = new Cartesian3();
const sampledQuaternionRotation = new Cartesian3();
const sampledQuaternionTempQuaternion = new Quaternion();
const sampledQuaternionQuaternion0 = new Quaternion();
const sampledQuaternionQuaternion0Conjugate = new Quaternion();

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
Quaternion.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {Quaternion} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
Quaternion.pack = function(value, array, startingIndex) {
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
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 */

Quaternion.unpack = function(array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new Quaternion();
  }
  result.x = array[startingIndex];
  result.y = array[startingIndex + 1];
  result.z = array[startingIndex + 2];
  result.w = array[startingIndex + 3];
  return result;
};

/**
 * 用于以可插值形式将对象存储到数组中的元素数量。
 * @type {number}
 */
Quaternion.packedInterpolationLength = 3;

/**
 * 将压缩数组转换为适合插值的形式。
 *
 * @param {number[]} packedArray 压缩数组。
 * @param {number} [startingIndex=0] 要转换的第一个元素的索引。
 * @param {number} [lastIndex=packedArray.length] 要转换的最后一个元素的索引。
 * @param {number[]} [result] 存储结果的对象。
 */

Quaternion.convertPackedArrayForInterpolation = function(
  packedArray,
  startingIndex,
  lastIndex,
  result,
) {
  Quaternion.unpack(
    packedArray,
    lastIndex * 4,
    sampledQuaternionQuaternion0Conjugate,
  );
  Quaternion.conjugate(
    sampledQuaternionQuaternion0Conjugate,
    sampledQuaternionQuaternion0Conjugate,
  );

  for (let i = 0, len = lastIndex - startingIndex + 1; i < len; i++) {
    const offset = i * 3;
    Quaternion.unpack(
      packedArray,
      (startingIndex + i) * 4,
      sampledQuaternionTempQuaternion,
    );

    Quaternion.multiply(
      sampledQuaternionTempQuaternion,
      sampledQuaternionQuaternion0Conjugate,
      sampledQuaternionTempQuaternion,
    );

    if (sampledQuaternionTempQuaternion.w < 0) {
      Quaternion.negate(
        sampledQuaternionTempQuaternion,
        sampledQuaternionTempQuaternion,
      );
    }

    Quaternion.computeAxis(
      sampledQuaternionTempQuaternion,
      sampledQuaternionAxis,
    );
    const angle = Quaternion.computeAngle(sampledQuaternionTempQuaternion);
    if (!defined(result)) {
      result = [];
    }
    result[offset] = sampledQuaternionAxis.x * angle;
    result[offset + 1] = sampledQuaternionAxis.y * angle;
    result[offset + 2] = sampledQuaternionAxis.z * angle;
  }
};

/**
 * 从通过 {@link convertPackedArrayForInterpolation} 转换的压缩数组中检索实例。
 *
 * @param {number[]} array 之前为插值而压缩的数组。
 * @param {number[]} sourceArray 原始压缩数组。
 * @param {number} [firstIndex=0] 用于转换数组的 firstIndex。
 * @param {number} [lastIndex=packedArray.length] 用于转换数组的 lastIndex。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 */

Quaternion.unpackInterpolationResult = function(
  array,
  sourceArray,
  firstIndex,
  lastIndex,
  result,
) {
  if (!defined(result)) {
    result = new Quaternion();
  }
  Cartesian3.fromArray(array, 0, sampledQuaternionRotation);
  const magnitude = Cartesian3.magnitude(sampledQuaternionRotation);

  Quaternion.unpack(sourceArray, lastIndex * 4, sampledQuaternionQuaternion0);

  if (magnitude === 0) {
    Quaternion.clone(Quaternion.IDENTITY, sampledQuaternionTempQuaternion);
  } else {
    Quaternion.fromAxisAngle(
      sampledQuaternionRotation,
      magnitude,
      sampledQuaternionTempQuaternion,
    );
  }

  return Quaternion.multiply(
    sampledQuaternionTempQuaternion,
    sampledQuaternionQuaternion0,
    result,
  );
};

/**
 * 复制一个四元数实例。
 *
 * @param {Quaternion} quaternion 要复制的四元数。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。（如果 quaternion 为 undefined，则返回 undefined）
 */

Quaternion.clone = function(quaternion, result) {
  if (!defined(quaternion)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Quaternion(
      quaternion.x,
      quaternion.y,
      quaternion.z,
      quaternion.w,
    );
  }

  result.x = quaternion.x;
  result.y = quaternion.y;
  result.z = quaternion.z;
  result.w = quaternion.w;
  return result;
};

/**
 * 计算提供的四元数的共轭。
 *
 * @param {Quaternion} quaternion 要进行共轭操作的四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.conjugate = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -quaternion.x;
  result.y = -quaternion.y;
  result.z = -quaternion.z;
  result.w = quaternion.w;
  return result;
};

/**
 * 计算提供的四元数的平方幅度。
 *
 * @param {Quaternion} quaternion 要计算平方幅度的四元数。
 * @returns {number} 平方幅度的值。
 */

Quaternion.magnitudeSquared = function(quaternion) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  //>>includeEnd('debug');

  return (
    quaternion.x * quaternion.x +
    quaternion.y * quaternion.y +
    quaternion.z * quaternion.z +
    quaternion.w * quaternion.w
  );
};

/**
 * 计算提供的四元数的量级。
 *
 * @param {Quaternion} quaternion 要计算量级的四元数。
 * @returns {number} 量级。
 */
Quaternion.magnitude = function(quaternion) {
  return Math.sqrt(Quaternion.magnitudeSquared(quaternion));
};

/**
 * 计算提供的四元数的标准化形式。
 *
 * @param {Quaternion} quaternion 要进行标准化的四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.normalize = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const inverseMagnitude = 1.0 / Quaternion.magnitude(quaternion);
  const x = quaternion.x * inverseMagnitude;
  const y = quaternion.y * inverseMagnitude;
  const z = quaternion.z * inverseMagnitude;
  const w = quaternion.w * inverseMagnitude;

  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};

/**
 * 计算提供的四元数的逆。
 *
 * @param {Quaternion} quaternion 要进行标准化的四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.inverse = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const magnitudeSquared = Quaternion.magnitudeSquared(quaternion);
  result = Quaternion.conjugate(quaternion, result);
  return Quaternion.multiplyByScalar(result, 1.0 / magnitudeSquared, result);
};

/**
 * 计算两个四元数的分量和。
 *
 * @param {Quaternion} left 第一个四元数。
 * @param {Quaternion} right 第二个四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.add = function(left, right, result) {
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
 * 计算两个四元数的分量差。
 *
 * @param {Quaternion} left 第一个四元数。
 * @param {Quaternion} right 第二个四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.subtract = function(left, right, result) {
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
 * 取反提供的四元数。
 *
 * @param {Quaternion} quaternion 要取反的四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */
Quaternion.negate = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = -quaternion.x;
  result.y = -quaternion.y;
  result.z = -quaternion.z;
  result.w = -quaternion.w;
  return result;
};

/**
 * 计算两个四元数的点（标量）积。
 *
 * @param {Quaternion} left 第一个四元数。
 * @param {Quaternion} right 第二个四元数。
 * @returns {number} 点积。
 */

Quaternion.dot = function(left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  return (
    left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w
  );
};

/**
 * 计算两个四元数的乘积。
 *
 * @param {Quaternion} left 第一个四元数。
 * @param {Quaternion} right 第二个四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.multiply = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const leftX = left.x;
  const leftY = left.y;
  const leftZ = left.z;
  const leftW = left.w;

  const rightX = right.x;
  const rightY = right.y;
  const rightZ = right.z;
  const rightW = right.w;

  const x = leftW * rightX + leftX * rightW + leftY * rightZ - leftZ * rightY;
  const y = leftW * rightY - leftX * rightZ + leftY * rightW + leftZ * rightX;
  const z = leftW * rightZ + leftX * rightY - leftY * rightX + leftZ * rightW;
  const w = leftW * rightW - leftX * rightX - leftY * rightY - leftZ * rightZ;

  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result;
};

/**
 * 按分量将提供的四元数与给定的标量相乘。
 *
 * @param {Quaternion} quaternion 要缩放的四元数。
 * @param {number} scalar 要乘以的标量。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.multiplyByScalar = function(quaternion, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = quaternion.x * scalar;
  result.y = quaternion.y * scalar;
  result.z = quaternion.z * scalar;
  result.w = quaternion.w * scalar;
  return result;
};

/**
 * 按分量将提供的四元数除以给定的标量。
 *
 * @param {Quaternion} quaternion 要被除的四元数。
 * @param {number} scalar 要除以的标量。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.divideByScalar = function(quaternion, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.x = quaternion.x / scalar;
  result.y = quaternion.y / scalar;
  result.z = quaternion.z / scalar;
  result.w = quaternion.w / scalar;
  return result;
};

/**
 * 计算提供的四元数的旋转轴。
 *
 * @param {Quaternion} quaternion 要使用的四元数。
 * @param {Cartesian3} result 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */

Quaternion.computeAxis = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const w = quaternion.w;
  if (
    Math.abs(w - 1.0) < CesiumMath.EPSILON6 ||
    Math.abs(w + 1.0) < CesiumMath.EPSILON6
  ) {
    result.x = 1;
    result.y = result.z = 0;
    return result;
  }

  const scalar = 1.0 / Math.sqrt(1.0 - w * w);

  result.x = quaternion.x * scalar;
  result.y = quaternion.y * scalar;
  result.z = quaternion.z * scalar;
  return result;
};

/**
 * 计算提供的四元数的旋转角度。
 *
 * @param {Quaternion} quaternion 要使用的四元数。
 * @returns {number} 旋转角度。
 */

Quaternion.computeAngle = function(quaternion) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  //>>includeEnd('debug');

  if (Math.abs(quaternion.w - 1.0) < CesiumMath.EPSILON6) {
    return 0.0;
  }
  return 2.0 * Math.acos(quaternion.w);
};

let lerpScratch = new Quaternion();
/**
 * 计算使用提供的四元数在 t 点进行线性插值或外推。
 *
 * @param {Quaternion} start t 在 0.0 时对应的值。
 * @param {Quaternion} end t 为 1.0 时对应的值。
 * @param {number} t 沿 t 进行插值的点。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.lerp = function(start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  lerpScratch = Quaternion.multiplyByScalar(end, t, lerpScratch);
  result = Quaternion.multiplyByScalar(start, 1.0 - t, result);
  return Quaternion.add(lerpScratch, result, result);
};

let slerpEndNegated = new Quaternion();
let slerpScaledP = new Quaternion();
let slerpScaledR = new Quaternion();
/**
 * 计算使用提供的四元数在 t 点进行球面线性插值或外推。
 *
 * @param {Quaternion} start t 在 0.0 时对应的值。
 * @param {Quaternion} end t 为 1.0 时对应的值。
 * @param {number} t 沿 t 进行插值的点。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 *
 * @see Quaternion#fastSlerp
 */

Quaternion.slerp = function(start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  let dot = Quaternion.dot(start, end);

  // The angle between start must be acute. Since q and -q represent
  // the same rotation, negate q to get the acute angle.
  let r = end;
  if (dot < 0.0) {
    dot = -dot;
    r = slerpEndNegated = Quaternion.negate(end, slerpEndNegated);
  }

  // dot > 0, as the dot product approaches 1, the angle between the
  // quaternions vanishes. use linear interpolation.
  if (1.0 - dot < CesiumMath.EPSILON6) {
    return Quaternion.lerp(start, r, t, result);
  }

  const theta = Math.acos(dot);
  slerpScaledP = Quaternion.multiplyByScalar(
    start,
    Math.sin((1 - t) * theta),
    slerpScaledP,
  );
  slerpScaledR = Quaternion.multiplyByScalar(
    r,
    Math.sin(t * theta),
    slerpScaledR,
  );
  result = Quaternion.add(slerpScaledP, slerpScaledR, result);
  return Quaternion.multiplyByScalar(result, 1.0 / Math.sin(theta), result);
};

/**
 * 对数四元数函数。
 *
 * @param {Quaternion} quaternion 单位四元数。
 * @param {Cartesian3} result 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数。
 */

Quaternion.log = function(quaternion, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("quaternion", quaternion);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const theta = CesiumMath.acosClamped(quaternion.w);
  let thetaOverSinTheta = 0.0;

  if (theta !== 0.0) {
    thetaOverSinTheta = theta / Math.sin(theta);
  }

  return Cartesian3.multiplyByScalar(quaternion, thetaOverSinTheta, result);
};

/**
 * 指数四元数函数。
 *
 * @param {Cartesian3} cartesian 笛卡尔坐标。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 */

Quaternion.exp = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const theta = Cartesian3.magnitude(cartesian);
  let sinThetaOverTheta = 0.0;

  if (theta !== 0.0) {
    sinThetaOverTheta = Math.sin(theta) / theta;
  }

  result.x = cartesian.x * sinThetaOverTheta;
  result.y = cartesian.y * sinThetaOverTheta;
  result.z = cartesian.z * sinThetaOverTheta;
  result.w = Math.cos(theta);

  return result;
};

const squadScratchCartesian0 = new Cartesian3();
const squadScratchCartesian1 = new Cartesian3();
const squadScratchQuaternion0 = new Quaternion();
const squadScratchQuaternion1 = new Quaternion();

/**
 * 计算内四边形点。
 * <p>这将计算确保四元曲线是 C<sup>1</sup> 的四元数。</p>
 *
 * @param {Quaternion} q0 第一个四元数。
 * @param {Quaternion} q1 第二个四元数。
 * @param {Quaternion} q2 第三个四元数。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 *
 * @see Quaternion#squad
 */

Quaternion.computeInnerQuadrangle = function(q0, q1, q2, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("q0", q0);
  Check.typeOf.object("q1", q1);
  Check.typeOf.object("q2", q2);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const qInv = Quaternion.conjugate(q1, squadScratchQuaternion0);
  Quaternion.multiply(qInv, q2, squadScratchQuaternion1);
  const cart0 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian0);

  Quaternion.multiply(qInv, q0, squadScratchQuaternion1);
  const cart1 = Quaternion.log(squadScratchQuaternion1, squadScratchCartesian1);

  Cartesian3.add(cart0, cart1, cart0);
  Cartesian3.multiplyByScalar(cart0, 0.25, cart0);
  Cartesian3.negate(cart0, cart0);
  Quaternion.exp(cart0, squadScratchQuaternion0);

  return Quaternion.multiply(q1, squadScratchQuaternion0, result);
};

/**
 * 计算四元数之间的球面四边形插值。
 *
 * @param {Quaternion} q0 第一个四元数。
 * @param {Quaternion} q1 第二个四元数。
 * @param {Quaternion} s0 第一个内四边形。
 * @param {Quaternion} s1 第二个内四边形。
 * @param {number} t 用于插值的时间，范围在 [0,1] 之间。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 *
 * @example
 * // 1. compute the squad interpolation between two quaternions on a curve
 * const s0 = Cesium.Quaternion.computeInnerQuadrangle(quaternions[i - 1], quaternions[i], quaternions[i + 1], new Cesium.Quaternion());
 * const s1 = Cesium.Quaternion.computeInnerQuadrangle(quaternions[i], quaternions[i + 1], quaternions[i + 2], new Cesium.Quaternion());
 * const q = Cesium.Quaternion.squad(quaternions[i], quaternions[i + 1], s0, s1, t, new Cesium.Quaternion());
 *
 * // 2. compute the squad interpolation as above but where the first quaternion is a end point.
 * const s1 = Cesium.Quaternion.computeInnerQuadrangle(quaternions[0], quaternions[1], quaternions[2], new Cesium.Quaternion());
 * const q = Cesium.Quaternion.squad(quaternions[0], quaternions[1], quaternions[0], s1, t, new Cesium.Quaternion());
 *
 * @see Quaternion#computeInnerQuadrangle
 */
Quaternion.squad = function(q0, q1, s0, s1, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("q0", q0);
  Check.typeOf.object("q1", q1);
  Check.typeOf.object("s0", s0);
  Check.typeOf.object("s1", s1);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const slerp0 = Quaternion.slerp(q0, q1, t, squadScratchQuaternion0);
  const slerp1 = Quaternion.slerp(s0, s1, t, squadScratchQuaternion1);
  return Quaternion.slerp(slerp0, slerp1, 2.0 * t * (1.0 - t), result);
};

const fastSlerpScratchQuaternion = new Quaternion();
// eslint-disable-next-line no-loss-of-precision
const opmu = 1.90110745351730037;
const u = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
const v = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
const bT = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];
const bD = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];

for (let i = 0; i < 7; ++i) {
  const s = i + 1.0;
  const t = 2.0 * s + 1.0;
  u[i] = 1.0 / (s * t);
  v[i] = s / t;
}

u[7] = opmu / (8.0 * 17.0);
v[7] = (opmu * 8.0) / 17.0;

/**
 * 计算使用提供的四元数在 t 点进行球面线性插值或外推。
 * 此实现比 {@link Quaternion#slerp} 更快，但准确度仅到 10<sup>-6</sup>。
 *
 * @param {Quaternion} start t 在 0.0 时对应的值。
 * @param {Quaternion} end t 为 1.0 时对应的值。
 * @param {number} t 沿 t 进行插值的点。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数。
 *
 * @see Quaternion#slerp
 */

Quaternion.fastSlerp = function(start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  let x = Quaternion.dot(start, end);

  let sign;
  if (x >= 0) {
    sign = 1.0;
  } else {
    sign = -1.0;
    x = -x;
  }

  const xm1 = x - 1.0;
  const d = 1.0 - t;
  const sqrT = t * t;
  const sqrD = d * d;

  for (let i = 7; i >= 0; --i) {
    bT[i] = (u[i] * sqrT - v[i]) * xm1;
    bD[i] = (u[i] * sqrD - v[i]) * xm1;
  }

  const cT =
    sign *
    t *
    (1.0 +
      bT[0] *
      (1.0 +
        bT[1] *
        (1.0 +
          bT[2] *
          (1.0 +
            bT[3] *
            (1.0 +
              bT[4] *
              (1.0 + bT[5] * (1.0 + bT[6] * (1.0 + bT[7]))))))));
  const cD =
    d *
    (1.0 +
      bD[0] *
      (1.0 +
        bD[1] *
        (1.0 +
          bD[2] *
          (1.0 +
            bD[3] *
            (1.0 +
              bD[4] *
              (1.0 + bD[5] * (1.0 + bD[6] * (1.0 + bD[7]))))))));

  const temp = Quaternion.multiplyByScalar(
    start,
    cD,
    fastSlerpScratchQuaternion,
  );
  Quaternion.multiplyByScalar(end, cT, result);
  return Quaternion.add(temp, result, result);
};

/**
 * 计算四元数之间的球面四边形插值。
 * 这是一个比 {@link Quaternion#squad} 更快但精度较低的实现。
 *
 * @param {Quaternion} q0 第一个四元数。
 * @param {Quaternion} q1 第二个四元数。
 * @param {Quaternion} s0 第一个内四边形。
 * @param {Quaternion} s1 第二个内四边形。
 * @param {number} t 用于插值的时间，范围在 [0,1] 之间。
 * @param {Quaternion} result 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 *
 * @see Quaternion#squad
 */

Quaternion.fastSquad = function(q0, q1, s0, s1, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("q0", q0);
  Check.typeOf.object("q1", q1);
  Check.typeOf.object("s0", s0);
  Check.typeOf.object("s1", s1);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  const slerp0 = Quaternion.fastSlerp(q0, q1, t, squadScratchQuaternion0);
  const slerp1 = Quaternion.fastSlerp(s0, s1, t, squadScratchQuaternion1);
  return Quaternion.fastSlerp(slerp0, slerp1, 2.0 * t * (1.0 - t), result);
};

/**
 * 按分量比较提供的四元数并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Quaternion} [left] 第一个四元数。
 * @param {Quaternion} [right] 第二个四元数。
 * @returns {boolean} 如果左右相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */

Quaternion.equals = function(left, right) {
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
 * 按分量比较提供的四元数并返回
 * <code>true</code> 如果它们在提供的 epsilon 范围内，
 * <code>false</code> 则返回其他情况。
 *
 * @param {Quaternion} [left] 第一个四元数。
 * @param {Quaternion} [right] 第二个四元数。
 * @param {number} [epsilon=0] 用于相等测试的 epsilon 值。
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则返回 <code>true</code>；否则返回 <code>false</code>。
 */
Quaternion.equalsEpsilon = function(left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.x - right.x) <= epsilon &&
      Math.abs(left.y - right.y) <= epsilon &&
      Math.abs(left.z - right.z) <= epsilon &&
      Math.abs(left.w - right.w) <= epsilon)
  );
};

/**
 * 一个不可变的四元数实例，初始化为 (0.0, 0.0, 0.0, 0.0)。
 *
 * @type {Quaternion}
 * @constant
 */
Quaternion.ZERO = Object.freeze(new Quaternion(0.0, 0.0, 0.0, 0.0));

/**
 * 一个不可变的四元数实例，初始化为 (0.0, 0.0, 0.0, 1.0)。
 *
 * @type {Quaternion}
 * @constant
 */
Quaternion.IDENTITY = Object.freeze(new Quaternion(0.0, 0.0, 0.0, 1.0));

/**
 * 复制此四元数实例。
 *
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或如果未提供结果参数则返回的新 Quaternion 实例。
 */

Quaternion.prototype.clone = function(result) {
  return Quaternion.clone(this, result);
};

/**
 * 按分量比较此四元数与提供的四元数并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Quaternion} [right] 右侧四元数。
 * @returns {boolean} 如果左右相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */
Quaternion.prototype.equals = function(right) {
  return Quaternion.equals(this, right);
};

/**
 * 按分量比较此四元数与提供的四元数并返回
 * <code>true</code> 如果它们在提供的 epsilon 范围内，
 * <code>false</code> 则返回其他情况。
 *
 * @param {Quaternion} [right] 右侧四元数。
 * @param {number} [epsilon=0] 用于相等测试的 epsilon 值。
 * @returns {boolean} 如果左侧和右侧在提供的 epsilon 范围内，则返回 <code>true</code>；否则返回 <code>false</code>。
 */
Quaternion.prototype.equalsEpsilon = function(right, epsilon) {
  return Quaternion.equalsEpsilon(this, right, epsilon);
};

/**
 * 返回一个表示此四元数的字符串，格式为 (x, y, z, w)。
 *
 * @returns {string} 表示此四元数的字符串。
 */

Quaternion.prototype.toString = function() {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};
export default Quaternion;
