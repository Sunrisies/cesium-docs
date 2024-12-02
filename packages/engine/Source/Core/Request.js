import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import RequestState from "./RequestState.js";
import RequestType from "./RequestType.js";

/**
 * 存储发起请求的信息。一般来说，这个对象不需要直接构造。
 *
 * @alias Request
 * @constructor
 *
 * @param {object} [options] 一个具有以下属性的对象：
 * @param {string} [options.url] 要请求的 URL。
 * @param {Request.RequestCallback} [options.requestFunction] 实际进行数据请求的函数。
 * @param {Request.CancelCallback} [options.cancelFunction] 当请求被取消时调用的函数。
 * @param {Request.PriorityCallback} [options.priorityFunction] 用于更新请求优先级的函数，该函数每帧调用一次。
 * @param {number} [options.priority=0.0] 请求的初始优先级。
 * @param {boolean} [options.throttle=false] 是否对请求进行节流并优先处理。如果为 false，则请求将立即发送。如果为 true，则请求将根据优先级进行节流后发送。
 * @param {boolean} [options.throttleByServer=false] 是否通过服务器对请求进行节流。
 * @param {RequestType} [options.type=RequestType.OTHER] 请求的类型。
 * @param {string} [options.serverKey] 用于识别请求目标服务器的键。
 */

function Request(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const throttleByServer = defaultValue(options.throttleByServer, false);
  const throttle = defaultValue(options.throttle, false);

  /**
   * 要请求的 URL。
   *
   * @type {string}
   */
  this.url = options.url;

  /**
   * 实际进行数据请求的函数。
   *
   * @type {Request.RequestCallback}
   */
  this.requestFunction = options.requestFunction;

  /**
   * 当请求被取消时调用的函数。
   *
   * @type {Request.CancelCallback}
   */
  this.cancelFunction = options.cancelFunction;

  /**
   * 用于更新请求优先级的函数，该函数每帧调用一次。
   *
   * @type {Request.PriorityCallback}
   */
  this.priorityFunction = options.priorityFunction;

  /**
   * 优先级是一个无单位的值，较低的值表示更高的优先级。
   * 对于世界坐标系中的对象，这通常是与相机的距离。
   * 没有优先级函数的请求默认为 0 的优先级。
   *
   * 如果定义了 priorityFunction，则此值将在每帧中根据该调用的结果更新。
   *
   * @type {number}
   * @default 0.0
   */
  this.priority = defaultValue(options.priority, 0.0);

  /**
   * 是否对请求进行节流并优先处理。如果为 false，则请求将立即发送。如果为 true，则请求将根据优先级进行节流后发送。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttle = throttle;

  /**
   * 是否通过服务器对请求进行节流。浏览器通常支持对 HTTP/1 服务器的 6-8 个并行连接，
   * 对于 HTTP/2 服务器则没有连接数量限制。对于通过 HTTP/1 服务器的请求，将此值设置为 <code>true</code> 是更优选的。
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  this.throttleByServer = throttleByServer;

  /**
   * 请求的类型。
   *
   * @type {RequestType}
   * @readonly
   *
   * @default RequestType.OTHER
   */
  this.type = defaultValue(options.type, RequestType.OTHER);

  /**
   * 用于识别请求目标服务器的键。它是从 URL 的权限和方案派生而来的。
   *
   * @type {string}
   *
   * @private
   */
  this.serverKey = options.serverKey;

  /**
   * 请求的当前状态。
   *
   * @type {RequestState}
   * @readonly
   */
  this.state = RequestState.UNISSUED;

  /**
   * 请求的延迟 Promise。
   *
   * @type {object}
   *
   * @private
   */
  this.deferred = undefined;

  /**
   * 是否明确取消了请求。
   *
   * @type {boolean}
   *
   * @private
   */
  this.cancelled = false;
}


/**
 * 将请求标记为已取消。
 *
 * @private
 */
Request.prototype.cancel = function () {
  this.cancelled = true;
};

/**
 * 复制一个 Request 实例。
 *
 * @param {Request} [result] 存储结果的对象。
 *
 * @returns {Request} 修改后的结果参数，如果未提供，则返回一个新实例。
 */

Request.prototype.clone = function (result) {
  if (!defined(result)) {
    return new Request(this);
  }

  result.url = this.url;
  result.requestFunction = this.requestFunction;
  result.cancelFunction = this.cancelFunction;
  result.priorityFunction = this.priorityFunction;
  result.priority = this.priority;
  result.throttle = this.throttle;
  result.throttleByServer = this.throttleByServer;
  result.type = this.type;
  result.serverKey = this.serverKey;

  // These get defaulted because the cloned request hasn't been issued
  result.state = RequestState.UNISSUED;
  result.deferred = undefined;
  result.cancelled = false;

  return result;
};

/**
 * 实际进行数据请求的函数。
 * @callback Request.RequestCallback
 * @returns {Promise<void>} 请求数据的 Promise。
 */

/**
 * 当请求被取消时调用的函数。
 * @callback Request.CancelCallback
 */

/**
 * 用于更新请求优先级的函数，该函数每帧调用一次。
 * @callback Request.PriorityCallback
 * @returns {number} 更新后的优先级值。
 */

export default Request;
