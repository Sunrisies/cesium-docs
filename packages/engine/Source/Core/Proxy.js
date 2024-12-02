import DeveloperError from "./DeveloperError.js";

/**
 * 基类，用于代理 {@link Resource} 进行的请求。
 *
 * @alias Proxy
 * @constructor
 *
 * @see DefaultProxy
 */
function Proxy() {
  DeveloperError.throwInstantiationError();
}

/**
 * 获取用于请求给定资源的最终 URL。
 *
 * @param {string} resource 要请求的资源。
 * @returns {string} 代理的资源
 * @function
 */
Proxy.prototype.getURL = DeveloperError.throwInstantiationError;

export default Proxy;
