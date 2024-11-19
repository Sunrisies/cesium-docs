import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";

/**
 * 一个{@link PositionProperty}，其值由回调函数惰性计算。
 *
 * @alias CallbackPositionProperty
 * @constructor
 *
 * @param {CallbackPositionProperty.Callback} callback 在评估位置属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code> 表示回调函数每次返回相同的值，<code>false</code> 表示值会发生变化。
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考框架。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Callback%20Position%20Property.html|Cesium Sandcastle Callback Position Property Demo}
 */
function CallbackPositionProperty(callback, isConstant, referenceFrame) {
  this._callback = undefined;
  this._isConstant = undefined;
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
  this._definitionChanged = new Event();
  this.setCallback(callback, isConstant);
}

Object.defineProperties(CallbackPositionProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。
   * @memberof CallbackPositionProperty.prototype
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
   * 如果调用 getValue 在相同时间返回不同的结果，则认为定义已发生变化。
   * @memberof CallbackPositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */

  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取位置定义所在的参考框架。
   * @memberof CallbackPositionProperty.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */

  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
});

const timeScratch = new JulianDate();

/**
 * 获取在提供时间点上属性在固定框架中的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 存储值的对象。如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，或者如果未提供结果参数则返回一个新实例。
 */

CallbackPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 设置要使用的回调函数。
 *
 * @param {CallbackPositionProperty.Callback} callback 在评估属性时要调用的函数。
 * @param {boolean} isConstant <code>true</code> 表示回调函数每次返回相同的值，<code>false</code> 表示值会发生变化。
 */

CallbackPositionProperty.prototype.setCallback = function (
  callback,
  isConstant,
) {
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
 * 获取在提供的时间和参考框架下属性的值。
 *
 * @param {JulianDate} time 要获取值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考框架。
 * @param {Cartesian3} [result] 存储值的对象。如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，或者如果未提供结果参数则返回一个新实例。
 */

CallbackPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  if (!defined(referenceFrame)) {
    throw new DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

  const value = this._callback(time, result);

  return PositionProperty.convertToReferenceFrame(
    time,
    value,
    this._referenceFrame,
    referenceFrame,
    result,
  );
};

/**
 * 将此属性与提供的属性进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两者相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */

CallbackPositionProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof CallbackPositionProperty &&
      this._callback === other._callback &&
      this._isConstant === other._isConstant &&
      this._referenceFrame === other._referenceFrame)
  );
};

/**
 * 一个返回位置属性值的函数。
 * @callback CallbackPositionProperty.Callback
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 存储值的对象。如果省略，函数必须创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，或者如果未提供结果参数或不支持，则返回一个新实例。
 */

export default CallbackPositionProperty;
