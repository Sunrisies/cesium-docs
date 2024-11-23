import defined from "./defined.js";

/**
 * 构造一个由于开发者错误而抛出的异常对象，例如无效的参数、参数超出范围等。
 * 这个异常应该只在开发期间抛出；它通常表示调用代码中的一个bug。
 * 这个异常不应该被捕获；相反，调用代码应该努力不产生它。
 * <br /><br />
 * 另一方面，{@link RuntimeError} 表示可能在运行时抛出的异常，例如内存不足，调用代码应该准备好捕获。
 *
 * @alias DeveloperError
 * @constructor
 * @extends Error
 *
 * @param {string} [message] 这个异常的错误消息。
 *
 * @see RuntimeError
 */
function DeveloperError(message) {
  /**
   * 'DeveloperError' 表示这个异常是由于开发者错误而抛出的。
   * @type {string}
   * @readonly
   */
  this.name = "DeveloperError";

  /**
   * 为什么抛出这个异常的解释。
   * @type {string}
   * @readonly
   */
  this.message = message;

  // 在某些浏览器（如IE）中，直到实际抛出错误之前，都没有stack属性。
  let stack;
  try {
    throw new Error();
  } catch (e) {
    stack = e.stack;
  }

  /**
   * 这个异常的堆栈跟踪，如果可用的话。
   * @type {string}
   * @readonly
   */
  this.stack = stack;
}

if (defined(Object.create)) {
  DeveloperError.prototype = Object.create(Error.prototype);
  DeveloperError.prototype.constructor = DeveloperError;
}

DeveloperError.prototype.toString = function () {
  let str = `${this.name}: ${this.message}`;

  if (defined(this.stack)) {
    str += `\n${this.stack.toString()}`;
  }

  return str;
};

/**
 * @private
 */
DeveloperError.throwInstantiationError = function () {
  throw new DeveloperError(
    "This function defines an interface and should not be called directly.",
  );
};

export default DeveloperError;