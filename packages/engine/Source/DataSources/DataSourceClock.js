import Clock from "../Core/Clock.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createRawPropertyDescriptor from "./createRawPropertyDescriptor.js";

/**
 * 表示特定 {@link DataSource} 的所需时钟设置。这些设置可能会在
 * 数据源加载时应用于 {@link Clock}。
 *
 * @alias DataSourceClock
 * @constructor
 */

function DataSourceClock() {
  this._definitionChanged = new Event();
  this._startTime = undefined;
  this._stopTime = undefined;
  this._currentTime = undefined;
  this._clockRange = undefined;
  this._clockStep = undefined;
  this._multiplier = undefined;
}

Object.defineProperties(DataSourceClock.prototype, {
  /**
   * 获取每当分配新属性时触发的事件。
   * @memberof DataSourceClock.prototype
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
   * 获取或设置时钟的所需开始时间。
   * 参见 {@link Clock#startTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  startTime: createRawPropertyDescriptor("startTime"),

  /**
   * 获取或设置时钟的所需停止时间。
   * 参见 {@link Clock#stopTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  stopTime: createRawPropertyDescriptor("stopTime"),

  /**
   * 获取或设置此数据源加载时所需的当前时间。
   * 参见 {@link Clock#currentTime}。
   * @memberof DataSourceClock.prototype
   * @type {JulianDate}
   */
  currentTime: createRawPropertyDescriptor("currentTime"),

  /**
   * 获取或设置所需的时钟范围设置。
   * 参见 {@link Clock#clockRange}。
   * @memberof DataSourceClock.prototype
   * @type {ClockRange}
   */
  clockRange: createRawPropertyDescriptor("clockRange"),

  /**
   * 获取或设置所需的时钟步长设置。
   * 参见 {@link Clock#clockStep}。
   * @memberof DataSourceClock.prototype
   * @type {ClockStep}
   */
  clockStep: createRawPropertyDescriptor("clockStep"),

  /**
   * 获取或设置所需的时钟倍增器。
   * 参见 {@link Clock#multiplier}。
   * @memberof DataSourceClock.prototype
   * @type {number}
   */
  multiplier: createRawPropertyDescriptor("multiplier"),
});


/**
 * 复制一个 DataSourceClock 实例。
 *
 * @param {DataSourceClock} [result] 存储结果的对象。
 * @returns {DataSourceClock} 修改后的结果参数或如果未提供则返回一个新实例。
 */

DataSourceClock.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new DataSourceClock();
  }
  result.startTime = this.startTime;
  result.stopTime = this.stopTime;
  result.currentTime = this.currentTime;
  result.clockRange = this.clockRange;
  result.clockStep = this.clockStep;
  result.multiplier = this.multiplier;
  return result;
};

/**
 * 如果这个 DataSourceClock 与另一个相等，则返回 true。
 *
 * @param {DataSourceClock} other 要比较的另一个 DataSourceClock。
 * @returns {boolean} 如果 DataSourceClock 相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

DataSourceClock.prototype.equals = function (other) {
  return (
    this === other ||
    (defined(other) &&
      JulianDate.equals(this.startTime, other.startTime) &&
      JulianDate.equals(this.stopTime, other.stopTime) &&
      JulianDate.equals(this.currentTime, other.currentTime) &&
      this.clockRange === other.clockRange &&
      this.clockStep === other.clockStep &&
      this.multiplier === other.multiplier)
  );
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {DataSourceClock} source 要合并到此对象中的对象。
 */

DataSourceClock.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.startTime = defaultValue(this.startTime, source.startTime);
  this.stopTime = defaultValue(this.stopTime, source.stopTime);
  this.currentTime = defaultValue(this.currentTime, source.currentTime);
  this.clockRange = defaultValue(this.clockRange, source.clockRange);
  this.clockStep = defaultValue(this.clockStep, source.clockStep);
  this.multiplier = defaultValue(this.multiplier, source.multiplier);
};
/**
 * 获取此时钟实例的值，作为 {@link Clock} 对象。
 *
 * @returns {Clock} 修改后的结果参数或如果未提供则返回一个新实例。
 */

DataSourceClock.prototype.getValue = function (result) {
  if (!defined(result)) {
    result = new Clock();
  }
  result.startTime = defaultValue(this.startTime, result.startTime);
  result.stopTime = defaultValue(this.stopTime, result.stopTime);
  result.currentTime = defaultValue(this.currentTime, result.currentTime);
  result.clockRange = defaultValue(this.clockRange, result.clockRange);
  result.multiplier = defaultValue(this.multiplier, result.multiplier);
  result.clockStep = defaultValue(this.clockStep, result.clockStep);
  return result;
};
export default DataSourceClock;
