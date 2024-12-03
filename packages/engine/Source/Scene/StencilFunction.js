import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 确定用于比较模板值的函数，以进行模板测试。
 *
 * @enum {number}
 */
const StencilFunction = {
  /**
   * 模板测试永远不通过。
   *
   * @type {number}
   * @constant
   */
  NEVER: WebGLConstants.NEVER,

  /**
   * 当被屏蔽的参考值小于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS: WebGLConstants.LESS,

  /**
   * 当被屏蔽的参考值等于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  EQUAL: WebGLConstants.EQUAL,

  /**
   * 当被屏蔽的参考值小于或等于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  LESS_OR_EQUAL: WebGLConstants.LEQUAL,

  /**
   * 当被屏蔽的参考值大于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER: WebGLConstants.GREATER,

  /**
   * 当被屏蔽的参考值不等于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  NOT_EQUAL: WebGLConstants.NOTEQUAL,

  /**
   * 当被屏蔽的参考值大于或等于被屏蔽的模板值时，模板测试通过。
   *
   * @type {number}
   * @constant
   */
  GREATER_OR_EQUAL: WebGLConstants.GEQUAL,

  /**
   * 模板测试始终通过。
   *
   * @type {number}
   * @constant
   */
  ALWAYS: WebGLConstants.ALWAYS,
};
export default Object.freeze(StencilFunction);
