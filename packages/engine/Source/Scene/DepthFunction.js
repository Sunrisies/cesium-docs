import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定用于比较两个深度值的函数，用于深度测试。
 *
 * @enum {number}
 */
const DepthFunction = {
  /**
   * 深度测试永远不会通过。
   *
   * @type {number}
   * @constant
   */
  NEVER: WebGLConstants.NEVER,

  /**
   * 如果传入的深度值小于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS: WebGLConstants.LESS,

  /**
   * 如果传入的深度值等于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  EQUAL: WebGLConstants.EQUAL,

  /**
   * 如果传入的深度值小于或等于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS_OR_EQUAL: WebGLConstants.LEQUAL,

  /**
   * 如果传入的深度值大于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER: WebGLConstants.GREATER,

  /**
   * 如果传入的深度值不等于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  NOT_EQUAL: WebGLConstants.NOTEQUAL,

  /**
   * 如果传入的深度值大于或等于存储的深度值，则深度测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER_OR_EQUAL: WebGLConstants.GEQUAL,

  /**
   * 深度测试始终通过。
   *
   * @type {number}
   * @constant
   */
  ALWAYS: WebGLConstants.ALWAYS,
};
export default Object.freeze(DepthFunction);