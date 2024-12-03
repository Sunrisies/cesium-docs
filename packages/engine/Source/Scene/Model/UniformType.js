/**
 * 基本GLSL统一类型的枚举。这些可以与
 * {@link CustomShader} 一起使用，以声明用户定义的统一变量。
 *
 * @enum {string}
 *
 * @experimental 此功能使用3D Tiles规范中的部分内容，该内容尚未最终确定，并可能在不遵循Cesium的标准弃用政策的情况下发生更改。
 */
const UniformType = {
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
   * 单个整数值。
   *
   * @type {string}
   * @constant
   */
  INT: "int",
  /**
   * 由2个整数值组成的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC2: "ivec2",
  /**
   * 由3个整数值组成的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC3: "ivec3",
  /**
   * 由4个整数值组成的向量。
   *
   * @type {string}
   * @constant
   */
  INT_VEC4: "ivec4",
  /**
   * 单个布尔值。
   *
   * @type {string}
   * @constant
   */
  BOOL: "bool",
  /**
   * 由2个布尔值组成的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC2: "bvec2",
  /**
   * 由3个布尔值组成的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC3: "bvec3",
  /**
   * 由4个布尔值组成的向量。
   *
   * @type {string}
   * @constant
   */
  BOOL_VEC4: "bvec4",
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
  /**
   * 2D采样纹理。
   * @type {string}
   * @constant
   */
  SAMPLER_2D: "sampler2D",
  SAMPLER_CUBE: "samplerCube",
};

export default Object.freeze(UniformType);
