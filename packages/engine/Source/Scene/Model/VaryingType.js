/**
 * 一个用于GLSL变化类型的枚举。这些可以用于在 {@link CustomShader} 中声明变化量。
 *
 * @enum {string}
 *
 * @experimental 此功能使用3D Tiles规范中的部分内容，该内容尚未最终确定，并可能在不遵循Cesium的标准弃用政策的情况下发生更改。
 */
const VaryingType = {
  /**
   * 单个浮点值。
   *
   * @type {string}
   * @constant
   */
  FLOAT: "float",
  /**
   * 由2个浮点值组成的向量。
   *
   * @type {string}
   * @constant
   */
  VEC2: "vec2",
  /**
   * 由3个浮点值组成的向量。
   *
   * @type {string}
   * @constant
   */
  VEC3: "vec3",
  /**
   * 由4个浮点值组成的向量。
   *
   * @type {string}
   * @constant
   */
  VEC4: "vec4",
  /**
   * 2x2浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT2: "mat2",
  /**
   * 3x3浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT3: "mat3",
  /**
   * 4x4浮点值矩阵。
   *
   * @type {string}
   * @constant
   */
  MAT4: "mat4",
};

export default Object.freeze(VaryingType);
