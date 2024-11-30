import CesiumMath from "../Core/Math.js";
import Check from "../Core/Check.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import DeveloperError from "../Core/DeveloperError.js";
import FeatureDetection from "../Core/FeatureDetection.js";

/**
 * 元数据组件类型的枚举。
 *
 * @enum {string}
 * @experimental 该功能使用的是 3D Tiles 规范中的一部分，该部分尚未确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
 */

const MetadataComponentType = {
  /**
   * 8 位有符号整数
   *
   * @type {string}
   * @constant
   */
  INT8: "INT8",
  /**
   * 8 位无符号整数
   *
   * @type {string}
   * @constant
   */
  UINT8: "UINT8",
  /**
   * 16 位有符号整数
   *
   * @type {string}
   * @constant
   */
  INT16: "INT16",
  /**
   * 16 位无符号整数
   *
   * @type {string}
   * @constant
   */
  UINT16: "UINT16",
  /**
   * 32 位有符号整数
   *
   * @type {string}
   * @constant
   */
  INT32: "INT32",
  /**
   * 32 位无符号整数
   *
   * @type {string}
   * @constant
   */
  UINT32: "UINT32",
  /**
   * 64 位有符号整数。此类型需要支持 BigInt。
   *
   * @see FeatureDetection.supportsBigInt
   *
   * @type {string}
   * @constant
   */
  INT64: "INT64",
  /**
   * 64 位无符号整数。此类型需要支持 BigInt。
   *
   * @see FeatureDetection.supportsBigInt
   *
   * @type {string}
   * @constant
   */
  UINT64: "UINT64",
  /**
   * 32 位（单精度）浮点数
   *
   * @type {string}
   * @constant
   */
  FLOAT32: "FLOAT32",
  /**
   * 64 位（双精度）浮点数
   *
   * @type {string}
   * @constant
   */
  FLOAT64: "FLOAT64",
};


/**
 * 获取数字类型的最小值。
 * <p>
 * 如果该平台支持 BigInt，则为 INT64 和 UINT64 类型返回一个 BigInt。
 * 否则返回一个近似值。
 * </p>
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {number|bigint} 最小值。
 *
 * @private
 */

MetadataComponentType.getMinimum = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
      return -128;
    case MetadataComponentType.UINT8:
      return 0;
    case MetadataComponentType.INT16:
      return -32768;
    case MetadataComponentType.UINT16:
      return 0;
    case MetadataComponentType.INT32:
      return -2147483648;
    case MetadataComponentType.UINT32:
      return 0;
    case MetadataComponentType.INT64:
      if (FeatureDetection.supportsBigInt()) {
        return BigInt("-9223372036854775808"); // eslint-disable-line
      }
      return -Math.pow(2, 63);
    case MetadataComponentType.UINT64:
      if (FeatureDetection.supportsBigInt()) {
        return BigInt(0); // eslint-disable-line
      }
      return 0;
    case MetadataComponentType.FLOAT32:
      // Maximum 32-bit floating point number. This value will be converted to the nearest 64-bit Number
      return -340282346638528859811704183484516925440.0;
    case MetadataComponentType.FLOAT64:
      return -Number.MAX_VALUE;
  }
};

/**
 * 获取数字类型的最大值。
 * <p>
 * 如果该平台支持 BigInt，则为 INT64 和 UINT64 类型返回一个 BigInt。
 * 否则返回一个近似值。
 * </p>
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {number|bigint} 最大值。
 *
 * @private
 */

MetadataComponentType.getMaximum = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
      return 127;
    case MetadataComponentType.UINT8:
      return 255;
    case MetadataComponentType.INT16:
      return 32767;
    case MetadataComponentType.UINT16:
      return 65535;
    case MetadataComponentType.INT32:
      return 2147483647;
    case MetadataComponentType.UINT32:
      return 4294967295;
    case MetadataComponentType.INT64:
      if (FeatureDetection.supportsBigInt()) {
        // Need to initialize with a string otherwise the value will be 9223372036854775808
        return BigInt("9223372036854775807"); // eslint-disable-line
      }
      return Math.pow(2, 63) - 1;
    case MetadataComponentType.UINT64:
      if (FeatureDetection.supportsBigInt()) {
        // Need to initialize with a string otherwise the value will be 18446744073709551616
        return BigInt("18446744073709551615"); // eslint-disable-line
      }
      return Math.pow(2, 64) - 1;
    case MetadataComponentType.FLOAT32:
      // Maximum 32-bit floating point number
      return 340282346638528859811704183484516925440.0;
    case MetadataComponentType.FLOAT64:
      return Number.MAX_VALUE;
  }
};

/**
 * 返回类型是否为整数类型。
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {boolean} 类型是否为整数类型。
 *
 * @private
 */

MetadataComponentType.isIntegerType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
    case MetadataComponentType.UINT8:
    case MetadataComponentType.INT16:
    case MetadataComponentType.UINT16:
    case MetadataComponentType.INT32:
    case MetadataComponentType.UINT32:
    case MetadataComponentType.INT64:
    case MetadataComponentType.UINT64:
      return true;
    default:
      return false;
  }
};

/**
 * 返回类型是否为无符号整数类型。
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {boolean} 类型是否为无符号整数类型。
 *
 * @private
 */

MetadataComponentType.isUnsignedIntegerType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.UINT8:
    case MetadataComponentType.UINT16:
    case MetadataComponentType.UINT32:
    case MetadataComponentType.UINT64:
      return true;
    default:
      return false;
  }
};

/**
 * 返回类型是否可以用于向量，即 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 类。这包括所有数字
 * 类型，除了需要 64 位整数的类型。
 *
 * @param {MetadataComponentType} type 要检查的类型
 * @return {boolean} 如果该类型可以编码为向量类型，则返回 <code>true</code>，否则返回 <code>false</code>
 * @private
 */

MetadataComponentType.isVectorCompatible = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
    case MetadataComponentType.UINT8:
    case MetadataComponentType.INT16:
    case MetadataComponentType.UINT16:
    case MetadataComponentType.INT32:
    case MetadataComponentType.UINT32:
    case MetadataComponentType.FLOAT32:
    case MetadataComponentType.FLOAT64:
      return true;
    default:
      return false;
  }
};

/**
 * 将有符号整数规范化到范围 [-1.0, 1.0]，将无符号整数规范化到
 * 范围 [0.0, 1.0]。
 * <p>
 * 值可以是 INT64 和 UINT64 类型的 BigInt。在规范化过程中，值会转换
 * 成 64 位浮点数，这可能导致小的精度差异。
 * </p>
 *
 * @param {number|bigint} value 整数值。
 * @param {MetadataComponentType} type 类型。
 * @returns {number} 规范化的值。
 *
 * @exception {DeveloperError} 值必须是数字或 BigInt
 * @exception {DeveloperError} 类型必须是整数类型
 *
 * @private
 */

MetadataComponentType.normalize = function (value, type) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof value !== "number" && typeof value !== "bigint") {
    throw new DeveloperError("value must be a number or a BigInt");
  }
  if (!MetadataComponentType.isIntegerType(type)) {
    throw new DeveloperError("type must be an integer type");
  }
  //>>includeEnd('debug');

  return Math.max(
    Number(value) / Number(MetadataComponentType.getMaximum(type)),
    -1.0,
  );
};

/**
 * 将范围 [-1.0, 1.0] 的有符号数字反规范化为有符号整数，并将范围 [0.0, 1.0] 的无符号数字反规范化为无符号整数。超出范围的值会被限制在该范围内。
 * <p>
 * 如果该平台支持 BigInt，则为 INT64 和 UINT64 类型返回一个 BigInt。
 * </p>
 *
 * @param {number} value 规范化值。
 * @param {MetadataComponentType} type 类型。
 * @returns {number|bigint} 整数值。
 *
 * @exception {DeveloperError} 类型必须是整数类型
 *
 * @private
 */

MetadataComponentType.unnormalize = function (value, type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("value", value);
  if (!MetadataComponentType.isIntegerType(type)) {
    throw new DeveloperError("type must be an integer type");
  }
  //>>includeEnd('debug');

  const max = MetadataComponentType.getMaximum(type);
  const min = MetadataComponentType.isUnsignedIntegerType(type) ? 0 : -max;

  value = CesiumMath.sign(value) * Math.round(Math.abs(value) * Number(max));

  if (
    (type === MetadataComponentType.INT64 ||
      type === MetadataComponentType.UINT64) &&
    FeatureDetection.supportsBigInt()
  ) {
    value = BigInt(value); // eslint-disable-line
  }

  if (value > max) {
    return max;
  }

  if (value < min) {
    return min;
  }

  return value;
};

/**
 * @private
 */
MetadataComponentType.applyValueTransform = function (value, offset, scale) {
  return scale * value + offset;
};

/**
 * @private
 */
MetadataComponentType.unapplyValueTransform = function (value, offset, scale) {
  // if the scale is 0, avoid a divide by zero error. The result can be any
  // finite number, so 0.0 will do nicely.
  if (scale === 0) {
    return 0.0;
  }

  return (value - offset) / scale;
};
/**
 * 获取数字类型的字节大小。
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {number} 字节大小。
 *
 * @private
 */

MetadataComponentType.getSizeInBytes = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
    case MetadataComponentType.UINT8:
      return 1;
    case MetadataComponentType.INT16:
    case MetadataComponentType.UINT16:
      return 2;
    case MetadataComponentType.INT32:
    case MetadataComponentType.UINT32:
      return 4;
    case MetadataComponentType.INT64:
    case MetadataComponentType.UINT64:
      return 8;
    case MetadataComponentType.FLOAT32:
      return 4;
    case MetadataComponentType.FLOAT64:
      return 8;
  }
};

/**
 * 从 {@link ComponentDatatype} 获取 {@link MetadataComponentType}。
 *
 * @param {ComponentDatatype} componentDatatype 组件数据类型。
 * @returns {MetadataComponentType} 类型。
 *
 * @private
 */

MetadataComponentType.fromComponentDatatype = function (componentDatatype) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("componentDatatype", componentDatatype);
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return MetadataComponentType.INT8;
    case ComponentDatatype.UNSIGNED_BYTE:
      return MetadataComponentType.UINT8;
    case ComponentDatatype.SHORT:
      return MetadataComponentType.INT16;
    case ComponentDatatype.UNSIGNED_SHORT:
      return MetadataComponentType.UINT16;
    case ComponentDatatype.INT:
      return MetadataComponentType.INT32;
    case ComponentDatatype.UNSIGNED_INT:
      return MetadataComponentType.UINT32;
    case ComponentDatatype.FLOAT:
      return MetadataComponentType.FLOAT32;
    case ComponentDatatype.DOUBLE:
      return MetadataComponentType.FLOAT64;
  }
};

/**
 * 从 {@link MetadataComponentType} 获取 {@link ComponentDatatype}。
 *
 * @param {MetadataComponentType} type 类型。
 * @returns {ComponentDatatype} 组件数据类型。
 *
 * @private
 */

MetadataComponentType.toComponentDatatype = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataComponentType.INT8:
      return ComponentDatatype.BYTE;
    case MetadataComponentType.UINT8:
      return ComponentDatatype.UNSIGNED_BYTE;
    case MetadataComponentType.INT16:
      return ComponentDatatype.SHORT;
    case MetadataComponentType.UINT16:
      return ComponentDatatype.UNSIGNED_SHORT;
    case MetadataComponentType.INT32:
      return ComponentDatatype.INT;
    case MetadataComponentType.UINT32:
      return ComponentDatatype.UNSIGNED_INT;
    case MetadataComponentType.FLOAT32:
      return ComponentDatatype.FLOAT;
    case MetadataComponentType.FLOAT64:
      return ComponentDatatype.DOUBLE;
  }
};

export default Object.freeze(MetadataComponentType);
