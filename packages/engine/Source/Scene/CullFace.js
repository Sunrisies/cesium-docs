import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定哪些三角形被剔除（如果有的话）。
 *
 * @enum {number}
 */
const CullFace = {
  /**
   * 剔除前向三角形。
   *
   * @type {number}
   * @constant
   */
  FRONT: WebGLConstants.FRONT,

  /**
   * 剔除后向三角形。
   *
   * @type {number}
   * @constant
   */
  BACK: WebGLConstants.BACK,

  /**
   * 同时剔除前向和后向三角形。
   *
   * @type {number}
   * @constant
   */
  FRONT_AND_BACK: WebGLConstants.FRONT_AND_BACK,
};

export default Object.freeze(CullFace);
