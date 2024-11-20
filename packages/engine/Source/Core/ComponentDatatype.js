import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import WebGLConstants from "./WebGLConstants.js";

/**
 * WebGL 组件数据类型。组件是内置的，
 * 形成属性，进而形成顶点。
 *
 * @enum {number}
 */

const ComponentDatatype = {
  /**
 * 对应于 <code>gl.BYTE</code> 的 8 位有符号字节，以及 
 * <code>Int8Array</code> 中元素的类型。
 *
 * @type {number}
 * @constant
 */
BYTE: WebGLConstants.BYTE,

/**
 * 对应于 <code>UNSIGNED_BYTE</code> 的 8 位无符号字节，以及 
 * <code>Uint8Array</code> 中元素的类型。
 *
 * @type {number}
 * @constant
 */
UNSIGNED_BYTE: WebGLConstants.UNSIGNED_BYTE,

/**
 * 对应于 <code>SHORT</code> 的 16 位有符号短整型，以及 
 * <code>Int16Array</code> 中元素的类型。
 *
 * @type {number}
 * @constant
 */

  SHORT: WebGLConstants.SHORT,

  /**
 * 对应于 <code>UNSIGNED_SHORT</code> 的 16 位无符号短整型，以及 
 * <code>Uint16Array</code> 中元素的类型。
 *
 * @type {number}
 * @constant
 */
UNSIGNED_SHORT: WebGLConstants.UNSIGNED_SHORT,

/**
 * 对应于 <code>INT</code> 的 32 位有符号整型，以及 
 * <code>Int32Array</code> 中元素的类型。
 *
 * @memberOf ComponentDatatype
 *
 * @type {number}
 * @constant
 */
INT: WebGLConstants.INT,

/**
 * 对应于 <code>UNSIGNED_INT</code> 的 32 位无符号整型，以及 
 * <code>Uint32Array</code> 中元素的类型。
 *
 * @memberOf ComponentDatatype
 *
 * @type {number}
 * @constant
 */

  UNSIGNED_INT: WebGLConstants.UNSIGNED_INT,

  /**
 * 对应于 <code>FLOAT</code> 的 32 位浮点数，以及 
 * <code>Float32Array</code> 中元素的类型。
 *
 * @type {number}
 * @constant
 */
FLOAT: WebGLConstants.FLOAT,

/**
 * 对应于 <code>gl.DOUBLE</code> 的 64 位浮点数（在桌面 OpenGL 中；
 * 这在 WebGL 中不被支持，并通过 {@link GeometryPipeline.encodeAttribute} 在 Cesium 中模拟）
 * 以及 <code>Float64Array</code> 中元素的类型。
 *
 * @memberOf ComponentDatatype
 *
 * @type {number}
 * @constant
 * @default 0x140A
 */

  DOUBLE: WebGLConstants.DOUBLE,
};

/**
 * 返回对应数据类型的大小（以字节为单位）。
 *
 * @param {ComponentDatatype} componentDatatype 要获取大小的组件数据类型。
 * @returns {number} 大小（以字节为单位）。
 *
 * @exception {DeveloperError} componentDatatype 不是有效值。
 *
 * @example
 * // Returns Int8Array.BYTES_PER_ELEMENT
 * const size = Cesium.ComponentDatatype.getSizeInBytes(Cesium.ComponentDatatype.BYTE);
 */
ComponentDatatype.getSizeInBytes = function (componentDatatype) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return Int8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.SHORT:
      return Int16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.INT:
      return Int32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.FLOAT:
      return Float32Array.BYTES_PER_ELEMENT;
    case ComponentDatatype.DOUBLE:
      return Float64Array.BYTES_PER_ELEMENT;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 获取提供的 TypedArray 实例对应的 {@link ComponentDatatype}。
 *
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} array 该类型数组。
 * @returns {ComponentDatatype} 提供的数组对应的 ComponentDatatype，如果数组不是 TypedArray 则返回 undefined。
 */

ComponentDatatype.fromTypedArray = function (array) {
  if (array instanceof Int8Array) {
    return ComponentDatatype.BYTE;
  }
  if (array instanceof Uint8Array) {
    return ComponentDatatype.UNSIGNED_BYTE;
  }
  if (array instanceof Int16Array) {
    return ComponentDatatype.SHORT;
  }
  if (array instanceof Uint16Array) {
    return ComponentDatatype.UNSIGNED_SHORT;
  }
  if (array instanceof Int32Array) {
    return ComponentDatatype.INT;
  }
  if (array instanceof Uint32Array) {
    return ComponentDatatype.UNSIGNED_INT;
  }
  if (array instanceof Float32Array) {
    return ComponentDatatype.FLOAT;
  }
  if (array instanceof Float64Array) {
    return ComponentDatatype.DOUBLE;
  }

  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "array must be an Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, or Float64Array.",
  );
  //>>includeEnd('debug');
};

/**
 * 验证提供的组件数据类型是否为有效的 {@link ComponentDatatype}
 *
 * @param {ComponentDatatype} componentDatatype 要验证的组件数据类型。
 * @returns {boolean} 如果提供的组件数据类型是有效值则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @example
 * if (!Cesium.ComponentDatatype.validate(componentDatatype)) {
 *   throw new Cesium.DeveloperError('componentDatatype must be a valid value.');
 * }
 */
ComponentDatatype.validate = function (componentDatatype) {
  return (
    defined(componentDatatype) &&
    (componentDatatype === ComponentDatatype.BYTE ||
      componentDatatype === ComponentDatatype.UNSIGNED_BYTE ||
      componentDatatype === ComponentDatatype.SHORT ||
      componentDatatype === ComponentDatatype.UNSIGNED_SHORT ||
      componentDatatype === ComponentDatatype.INT ||
      componentDatatype === ComponentDatatype.UNSIGNED_INT ||
      componentDatatype === ComponentDatatype.FLOAT ||
      componentDatatype === ComponentDatatype.DOUBLE)
  );
};

/**
 * 创建一个与组件数据类型对应的类型数组。
 *
 * @param {ComponentDatatype} componentDatatype 组件数据类型。
 * @param {number|Array} valuesOrLength 要创建的数组的长度或一个数组。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} 一个类型数组。
 *
 * @exception {DeveloperError} componentDatatype is not a valid value.
 *
 * @example
 * // creates a Float32Array with length of 100
 * const typedArray = Cesium.ComponentDatatype.createTypedArray(Cesium.ComponentDatatype.FLOAT, 100);
 */
ComponentDatatype.createTypedArray = function (
  componentDatatype,
  valuesOrLength,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("componentDatatype is required.");
  }
  if (!defined(valuesOrLength)) {
    throw new DeveloperError("valuesOrLength is required.");
  }
  //>>includeEnd('debug');

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(valuesOrLength);
    case ComponentDatatype.SHORT:
      return new Int16Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(valuesOrLength);
    case ComponentDatatype.INT:
      return new Int32Array(valuesOrLength);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(valuesOrLength);
    case ComponentDatatype.FLOAT:
      return new Float32Array(valuesOrLength);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(valuesOrLength);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 创建一个字节数组的类型视图。
 *
 * @param {ComponentDatatype} componentDatatype 要创建的视图类型。
 * @param {ArrayBuffer} buffer 用于视图的缓冲区存储。
 * @param {number} [byteOffset] 视图中第一个元素的字节偏移量。
 * @param {number} [length] 视图中的元素数量。
 * @returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} 缓冲区的类型数组视图。
 *
 * @exception {DeveloperError} componentDatatype 不是有效值。
 */

ComponentDatatype.createArrayBufferView = function (
  componentDatatype,
  buffer,
  byteOffset,
  length,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(componentDatatype)) {
    throw new DeveloperError("componentDatatype is required.");
  }
  if (!defined(buffer)) {
    throw new DeveloperError("buffer is required.");
  }
  //>>includeEnd('debug');

  byteOffset = defaultValue(byteOffset, 0);
  length = defaultValue(
    length,
    (buffer.byteLength - byteOffset) /
      ComponentDatatype.getSizeInBytes(componentDatatype),
  );

  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(buffer, byteOffset, length);
    case ComponentDatatype.SHORT:
      return new Int16Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(buffer, byteOffset, length);
    case ComponentDatatype.INT:
      return new Int32Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(buffer, byteOffset, length);
    case ComponentDatatype.FLOAT:
      return new Float32Array(buffer, byteOffset, length);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(buffer, byteOffset, length);
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("componentDatatype is not a valid value.");
    //>>includeEnd('debug');
  }
};

/**
 * 从名称获取 ComponentDatatype。
 *
 * @param {string} name ComponentDatatype 的名称。
 * @returns {ComponentDatatype} 对应的 ComponentDatatype。
 *
 * @exception {DeveloperError} name 不是有效值。
 */

ComponentDatatype.fromName = function (name) {
  switch (name) {
    case "BYTE":
      return ComponentDatatype.BYTE;
    case "UNSIGNED_BYTE":
      return ComponentDatatype.UNSIGNED_BYTE;
    case "SHORT":
      return ComponentDatatype.SHORT;
    case "UNSIGNED_SHORT":
      return ComponentDatatype.UNSIGNED_SHORT;
    case "INT":
      return ComponentDatatype.INT;
    case "UNSIGNED_INT":
      return ComponentDatatype.UNSIGNED_INT;
    case "FLOAT":
      return ComponentDatatype.FLOAT;
    case "DOUBLE":
      return ComponentDatatype.DOUBLE;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError("name is not a valid value.");
    //>>includeEnd('debug');
  }
};
export default Object.freeze(ComponentDatatype);
