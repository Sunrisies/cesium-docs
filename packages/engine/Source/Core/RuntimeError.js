import defined from "./defined.js";

/**
 * 构造一个异常对象，该对象因运行时可能发生的错误而抛出，例如，
 * 内存不足，无法编译着色器等。如果一个函数可能抛出此
 * 异常，则调用代码应准备捕获它。
 * <br /><br />
 * 另一方面，{@link DeveloperError} 表示由于开发者错误而导致的异常，
 * 例如无效参数，通常表示调用代码中的一个bug。
 *
 * @alias RuntimeError
 * @constructor
 * @extends Error
 *
 * @param {string} [message] 此异常的错误消息。
 *
 * @see DeveloperError
 */

function RuntimeError(message) {
  /**
   * 'RuntimeError' 表示该异常是由于运行时错误而抛出的。
   * @type {string}
   * @readonly
   */
  this.name = "RuntimeError";

  /**
   * 此异常被抛出的原因说明。
   * @type {string}
   * @readonly
   */

  this.message = message;

  //Browsers such as IE don't have a stack property until you actually throw the error.
  let stack;
  try {
    throw new Error();
  } catch (e) {
    stack = e.stack;
  }

  /**
   * 此异常的堆栈跟踪，如果可用的话。
   * @type {string}
   * @readonly
   */

  this.stack = stack;
}

if (defined(Object.create)) {
  RuntimeError.prototype = Object.create(Error.prototype);
  RuntimeError.prototype.constructor = RuntimeError;
}

RuntimeError.prototype.toString = function () {
  let str = `${this.name}: ${this.message}`;

  if (defined(this.stack)) {
    str += `\n${this.stack.toString()}`;
  }

  return str;
};
export default RuntimeError;
