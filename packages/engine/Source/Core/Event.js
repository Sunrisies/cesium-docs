import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 一个通用的工具类，用于管理特定事件的订阅者。
 * 此类通常在容器类内部实例化，并
 * 作为属性公开供其他人订阅。
 *
 * @alias Event
 * @template Listener extends (...args: any[]) => void = (...args: any[]) => void
 * @constructor
 * @example
 * MyObject.prototype.myListener = function(arg1, arg2) {
 *     this.myArg1Copy = arg1;
 *     this.myArg2Copy = arg2;
 * }
 *
 * const myObjectInstance = new MyObject();
 * const evt = new Cesium.Event();
 * evt.addEventListener(MyObject.prototype.myListener, myObjectInstance);
 * evt.raiseEvent('1', '2');
 * evt.removeEventListener(MyObject.prototype.myListener);
 */
function Event() {
  this._listeners = [];
  this._scopes = [];
  this._toRemove = [];
  this._insideRaiseEvent = false;
}

Object.defineProperties(Event.prototype, {
  /**
   * 当前订阅该事件的监听器数量。
   * @memberof Event.prototype
   * @type {number}
   * @readonly
   */

  numberOfListeners: {
    get: function () {
      return this._listeners.length - this._toRemove.length;
    },
  },
});

/**
 * 注册一个回调函数，当事件被触发时执行。
 * 可以提供一个可选的作用域作为 <code>this</code> 指针，
 * 来执行该函数。
 *
 * @param {Listener} listener 事件触发时要执行的函数。
 * @param {object} [scope] 可选的对象作用域，用作 <code>this</code>
 *        指针，供监听器函数执行时使用。
 * @returns {Event.RemoveCallback} 一个函数，当调用时将移除此事件监听器。
 *
 * @see Event#raiseEvent
 * @see Event#removeEventListener
 */

Event.prototype.addEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');

  this._listeners.push(listener);
  this._scopes.push(scope);

  const event = this;
  return function () {
    event.removeEventListener(listener, scope);
  };
};

/**
 * 注销先前注册的回调函数。
 *
 * @param {Listener} listener 要注销的函数。
 * @param {object} [scope] 最初传递给 addEventListener 的作用域。
 * @returns {boolean} 如果监听器被移除则返回 <code>true</code>；如果监听器和作用域未注册到事件中则返回 <code>false</code>。
 *
 * @see Event#addEventListener
 * @see Event#raiseEvent
 */

Event.prototype.removeEventListener = function (listener, scope) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("listener", listener);
  //>>includeEnd('debug');

  const listeners = this._listeners;
  const scopes = this._scopes;

  let index = -1;
  for (let i = 0; i < listeners.length; i++) {
    if (listeners[i] === listener && scopes[i] === scope) {
      index = i;
      break;
    }
  }

  if (index !== -1) {
    if (this._insideRaiseEvent) {
      //In order to allow removing an event subscription from within
      //a callback, we don't actually remove the items here.  Instead
      //remember the index they are at and undefined their value.
      this._toRemove.push(index);
      listeners[index] = undefined;
      scopes[index] = undefined;
    } else {
      listeners.splice(index, 1);
      scopes.splice(index, 1);
    }
    return true;
  }

  return false;
};

function compareNumber(a, b) {
  return b - a;
}

/**
 * 通过调用每个注册的监听器并传递所有提供的参数来触发事件。
 *
 * @param {...Parameters<Listener>} arguments 此方法可以接受任意数量的参数，并将它们传递给监听器函数。
 *
 * @see Event#addEventListener
 * @see Event#removeEventListener
 */

Event.prototype.raiseEvent = function () {
  this._insideRaiseEvent = true;

  let i;
  const listeners = this._listeners;
  const scopes = this._scopes;
  let length = listeners.length;

  for (i = 0; i < length; i++) {
    const listener = listeners[i];
    if (defined(listener)) {
      listeners[i].apply(scopes[i], arguments);
    }
  }

  //Actually remove items removed in removeEventListener.
  const toRemove = this._toRemove;
  length = toRemove.length;
  if (length > 0) {
    toRemove.sort(compareNumber);
    for (i = 0; i < length; i++) {
      const index = toRemove[i];
      listeners.splice(index, 1);
      scopes.splice(index, 1);
    }
    toRemove.length = 0;
  }

  this._insideRaiseEvent = false;
};

/**
 * 一个用于移除监听器的函数。
 * @callback Event.RemoveCallback
 */


export default Event;
