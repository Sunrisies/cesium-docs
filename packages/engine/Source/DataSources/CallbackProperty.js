import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";

/**
 * 一个{@link Property}，其值由回调函数惰性计算。
 *
 * @alias CallbackProperty
 * @constructor
 *
 * @param {CallbackProperty.Callback} callback 在评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code> 表示回调函数每次返回相同的值，<code>false</code> 表示值会发生变化。
 */

function CallbackProperty(callback, isConstant) {
  this._callback = undefined;
  this._isConstant = undefined;
  this._definitionChanged = new Event();
  this.setCallback(callback, isConstant);
}

Object.defineProperties(CallbackProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。
   * @memberof CallbackProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */

  isConstant: {
    get: function () {
      return this._isConstant;
    },
  },
  /**
   * 获取每当该属性的定义发生变化时所触发的事件。
   * 每当调用 setCallback 时，定义都会发生变化。
   * @memberof CallbackProperty.prototype
   *
   * @type {Event}
   * @readonly
   */

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取属性的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象。如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，或者如果未提供结果参数或不支持，则返回一个新实例。
 */

CallbackProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this._callback(time, result);
};

/**
 * 设置要使用的回调函数。
 *
 * @param {CallbackProperty.Callback} callback 在评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code> 表示回调函数每次返回相同的值，<code>false</code> 表示值会发生变化。
 */

CallbackProperty.prototype.setCallback = function (callback, isConstant) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(callback)) {
    throw new DeveloperError("callback is required.");
  }
  if (!defined(isConstant)) {
    throw new DeveloperError("isConstant is required.");
  }
  //>>includeEnd('debug');

  const changed =
    this._callback !== callback || this._isConstant !== isConstant;

  this._callback = callback;
  this._isConstant = isConstant;

  if (changed) {
    this._definitionChanged.raiseEvent(this);
  }
};
/**
 * 将此属性与提供的属性进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两者相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */

CallbackProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CallbackProperty &&
      this._callback === other._callback &&
      this._isConstant === other._isConstant)
  );
};

/**
 * 一个返回属性值的函数。
 * @callback CallbackProperty.Callback
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 存储值的对象。如果省略，函数必须创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，或者如果未提供结果参数或不支持，则返回一个新实例。
 */

export default CallbackProperty;
