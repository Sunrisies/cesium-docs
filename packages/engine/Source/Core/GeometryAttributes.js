import defaultValue from "./defaultValue.js";

/**
 * 组成几何体顶点的属性。此对象中的每个属性对应于一个
 * {@link GeometryAttribute}，包含属性的数据。
 * <p>
 * 属性始终以非交错的方式存储在几何体中。
 * </p>
 *
 * @alias GeometryAttributes
 * @constructor
 */

function GeometryAttributes(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 3D 位置属性。
   * <p>
   * 64位浮点数（为了精确）。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.position = options.position;

  /**
   * 法线属性（归一化），常用于光照。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.normal = options.normal;

 /**
   * 2D 纹理坐标属性。
   * <p>
   * 32位浮点数。每个属性2个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.st = options.st;

  /**
   * 切向属性（归一化），用于切线空间效果，如凹凸映射。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.bitangent = options.bitangent;

  /**
   * 切线属性（归一化），用于切线空间效果，如凹凸映射。
   * <p>
   * 32位浮点数。每个属性3个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.tangent = options.tangent;

  /**
   * 颜色属性。
   * <p>
   * 8位无符号整数。每个属性4个分量。
   * </p>
   *
   * @type {GeometryAttribute|undefined}
   *
   * @default undefined
   */
  this.color = options.color;
}
export default GeometryAttributes;
