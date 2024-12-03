import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 顶点格式定义了构成顶点的属性。可以将VertexFormat提供给
 * {@link Geometry}以请求计算某些属性，例如，仅位置、
 * 位置和法线等。
 *
 * @param {object} [options] 一个具有布尔属性的对象，对应于代码示例中所示的VertexFormat属性。
 *
 * @alias VertexFormat
 * @constructor
 *
 * @example
 * // Create a vertex format with position and 2D texture coordinate attributes.
 * const format = new Cesium.VertexFormat({
 *   position : true,
 *   st : true
 * });
 *
 * @see Geometry#attributes
 * @see Packable
 */
function VertexFormat(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 当 <code>true</code> 时，顶点具有3D位置属性。
   * <p>
   * 64位浮点数（用于精度）。每个属性3个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.position = defaultValue(options.position, false);

  /**
   * 当 <code>true</code> 时，顶点具有法线属性（归一化），通常用于照明。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.normal = defaultValue(options.normal, false);

  /**
   * 当 <code>true</code> 时，顶点具有2D纹理坐标属性。
   * <p>
   * 32位浮点数。每个属性2个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.st = defaultValue(options.st, false);

  /**
   * 当 <code>true</code> 时，顶点具有切线属性（归一化），用于切线空间效果，如凹凸贴图。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.bitangent = defaultValue(options.bitangent, false);

  /**
   * 当 <code>true</code> 时，顶点具有切线属性（归一化），用于切线空间效果，如凹凸贴图。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.tangent = defaultValue(options.tangent, false);

  /**
   * 当 <code>true</code> 时，顶点具有RGB颜色属性。
   * <p>
   * 8位无符号字节。每个属性3个分量。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.color = defaultValue(options.color, false);
}


/**
 * 一个只有位置属性的不可变顶点格式。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 */
VertexFormat.POSITION_ONLY = Object.freeze(
  new VertexFormat({
    position: true,
  }),
);

/**
 * 一个具有位置和法线属性的不可变顶点格式。
 * 这与像 {@link PerInstanceColorAppearance} 的每实例颜色外观兼容。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 */

VertexFormat.POSITION_AND_NORMAL = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
  }),
);

/**
 * 一个不可变的顶点格式，包含位置、法线和st属性。
 * 当 {@link MaterialAppearance} 的 {@link MaterialAppearance#materialSupport} 为 <code>TEXTURED</code> 时，与其兼容。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 * @see VertexFormat#st
 */
VertexFormat.POSITION_NORMAL_AND_ST = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
    st: true,
  }),
);

/**
 * 一个不可变的顶点格式，包含位置和st属性。
 * 这与 {@link EllipsoidSurfaceAppearance} 兼容。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#st
 */

VertexFormat.POSITION_AND_ST = Object.freeze(
  new VertexFormat({
    position: true,
    st: true,
  }),
);

/**
 * 一个不可变的顶点格式，包含位置和颜色属性。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#color
 */
VertexFormat.POSITION_AND_COLOR = Object.freeze(
  new VertexFormat({
    position: true,
    color: true,
  }),
);

/**
 * 一个不可变的顶点格式，包含众所周知的属性：位置、法线、st、切线和副切线。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 * @see VertexFormat#st
 * @see VertexFormat#tangent
 * @see VertexFormat#bitangent
 */

VertexFormat.ALL = Object.freeze(
  new VertexFormat({
    position: true,
    normal: true,
    st: true,
    tangent: true,
    bitangent: true,
  }),
);

/**
 * 一个不可变的顶点格式，包含位置、法线和st属性。
 * 这与大多数外观和材质兼容；然而，法线和st属性并不总是必需的。
 * 当已知这一点时，应该使用另一种 <code>VertexFormat</code>。
 *
 * @type {VertexFormat}
 * @constant
 *
 * @see VertexFormat#position
 * @see VertexFormat#normal
 */

VertexFormat.DEFAULT = VertexFormat.POSITION_NORMAL_AND_ST;

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
VertexFormat.packedLength = 6;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {VertexFormat} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
VertexFormat.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.position ? 1.0 : 0.0;
  array[startingIndex++] = value.normal ? 1.0 : 0.0;
  array[startingIndex++] = value.st ? 1.0 : 0.0;
  array[startingIndex++] = value.tangent ? 1.0 : 0.0;
  array[startingIndex++] = value.bitangent ? 1.0 : 0.0;
  array[startingIndex] = value.color ? 1.0 : 0.0;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {VertexFormat} [result] 存储结果的对象。
 * @returns {VertexFormat} 修改后的结果参数，如果未提供则返回一个新的VertexFormat实例。
 */

VertexFormat.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new VertexFormat();
  }

  result.position = array[startingIndex++] === 1.0;
  result.normal = array[startingIndex++] === 1.0;
  result.st = array[startingIndex++] === 1.0;
  result.tangent = array[startingIndex++] === 1.0;
  result.bitangent = array[startingIndex++] === 1.0;
  result.color = array[startingIndex] === 1.0;
  return result;
};

/**
 * 复制一个VertexFormat实例。
 *
 * @param {VertexFormat} vertexFormat 要复制的顶点格式。
 * @param {VertexFormat} [result] 存储结果的对象。
 * @returns {VertexFormat} 修改后的结果参数，如果未提供则返回一个新的VertexFormat实例。（如果vertexFormat是undefined，则返回undefined）
 */

VertexFormat.clone = function (vertexFormat, result) {
  if (!defined(vertexFormat)) {
    return undefined;
  }
  if (!defined(result)) {
    result = new VertexFormat();
  }

  result.position = vertexFormat.position;
  result.normal = vertexFormat.normal;
  result.st = vertexFormat.st;
  result.tangent = vertexFormat.tangent;
  result.bitangent = vertexFormat.bitangent;
  result.color = vertexFormat.color;
  return result;
};
export default VertexFormat;
