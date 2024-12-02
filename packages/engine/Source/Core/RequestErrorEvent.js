import defined from "./defined.js";
import parseResponseHeaders from "./parseResponseHeaders.js";

/**
 * 当请求遇到错误时触发的事件。
 *
 * @constructor
 * @alias RequestErrorEvent
 *
 * @param {number} [statusCode] HTTP 错误状态码，例如 404。
 * @param {object} [response] 伴随错误返回的响应。
 * @param {string|object} [responseHeaders] 响应头，可以表示为对象字面量或字符串，格式与 XMLHttpRequest 的 getAllResponseHeaders() 函数返回的格式相同。
 */

function RequestErrorEvent(statusCode, response, responseHeaders) {
  /**
   * HTTP 错误状态码，例如 404。如果错误没有特定的 HTTP 代码，则该属性将为 undefined。
   *
   * @type {number}
   */
  this.statusCode = statusCode;

  /**
   * 伴随错误返回的响应。如果错误不包含响应，则该属性将为 undefined。
   *
   * @type {object}
   */
  this.response = response;

  /**
   * 响应中包含的头部，以键/值对的对象字面量表示。
   * 如果错误不包含任何头部，则该属性将为 undefined。
   *
   * @type {object}
   */
  this.responseHeaders = responseHeaders;

  if (typeof this.responseHeaders === "string") {
    this.responseHeaders = parseResponseHeaders(this.responseHeaders);
  }
}


/**
 * 创建一个表示此 RequestErrorEvent 的字符串。
 * @memberof RequestErrorEvent
 *
 * @returns {string} 表示提供的 RequestErrorEvent 的字符串。
 */

RequestErrorEvent.prototype.toString = function () {
  let str = "Request has failed.";
  if (defined(this.statusCode)) {
    str += ` Status Code: ${this.statusCode}`;
  }
  return str;
};
export default RequestErrorEvent;
