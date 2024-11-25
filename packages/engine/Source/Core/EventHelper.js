import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个方便的对象，简化了将事件监听器附加到多个事件的常见模式，
 * 然后在以后（例如，在销毁方法中）同时移除所有这些监听器。
 *
 * @alias EventHelper
 * @constructor
 *
 *
 * @example
 * const helper = new Cesium.EventHelper();
 *
 * helper.add(someObject.event, listener1, this);
 * helper.add(otherObject.event, listener2, this);
 *
 * // later...
 * helper.removeAll();
 *
 * @see Event
 */
function EventHelper() {
  this._removalFunctions = [];
}

/**
 * 将监听器添加到事件，并记录注册以便稍后清理。
 *
 * @param {Event} event 要附加的事件。
 * @param {Function} listener 当事件被触发时要执行的函数。
 * @param {object} [scope] 可选的对象作用域，用作 <code>this</code>
 *        指针，以便在执行监听函数时使用。
 * @returns {EventHelper.RemoveCallback} 一个函数，当被调用时将移除此事件监听器。
 *
 * @see Event#addEventListener
 */

EventHelper.prototype.add = function (event, listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(event)) {
    throw new DeveloperError("event is required");
  }
  //>>includeEnd('debug');

  const removalFunction = event.addEventListener(listener, scope);
  this._removalFunctions.push(removalFunction);

  const that = this;
  return function () {
    removalFunction();
    const removalFunctions = that._removalFunctions;
    removalFunctions.splice(removalFunctions.indexOf(removalFunction), 1);
  };
};

/**
 * 注销之前添加的所有监听器。
 *
 * @see Event#removeEventListener
 */

EventHelper.prototype.removeAll = function () {
  const removalFunctions = this._removalFunctions;
  for (let i = 0, len = removalFunctions.length; i < len; ++i) {
    removalFunctions[i]();
  }
  removalFunctions.length = 0;
};

/**
 * 一个用于移除监听器的函数。
 * @callback EventHelper.RemoveCallback
 */

export default EventHelper;
