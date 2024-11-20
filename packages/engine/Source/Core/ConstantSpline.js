import Check from "./Check.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 一个求值为常数值的样条曲线。虽然它遵循 {@link Spline} 接口，
 * 但由于其值从不改变，因此它不维护内部时间数组。
 *
 * @alias ConstantSpline
 * @constructor
 *
 * @param {number|Cartesian3|Quaternion} value 求值为的常数值。
 *
 * @example
 * const position = new Cesium.Cartesian3(1.0, 2.0, 3.0);
 * const spline = new Cesium.ConstantSpline(position);
 *
 * const p0 = spline.evaluate(0.0);
 *
 * @see LinearSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function ConstantSpline(value) {
  this._value = value;
  this._valueType = Spline.getPointType(value);
}

Object.defineProperties(ConstantSpline.prototype, {
  /**
   * 样条曲线评估出的常数值。
   *
   * @memberof ConstantSpline.prototype
   *
   * @type {number|Cartesian3|Quaternion}
   * @readonly
   */

  value: {
    get: function() {
      return this._value;
    },
  },
});

/**
 * 在 <code>times</code> 中找到索引 <code>i</code>，使得参数
 * <code>time</code> 位于区间 <code>[times[i], times[i + 1]]</code> 内。
 *
 * 由于常数样条曲线没有内部时间数组，因此将抛出错误。
 * @function
 *
 * @param {number} time 时间。
 *
 * @exception {DeveloperError} 不能在 ConstantSpline 上调用 findTimeInterval。
 */

ConstantSpline.prototype.findTimeInterval = function(time) {
  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "findTimeInterval cannot be called on a ConstantSpline.",
  );
  //>>includeEnd('debug');
};

/**
 * 将给定的时间包装到样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，包装到更新后的动画中。
 */

ConstantSpline.prototype.wrapTime = function(time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  return 0.0;
};

/**
 * 将给定的时间限制在样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，被限制在动画周期内。
 */

ConstantSpline.prototype.clampTime = function(time) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  return 0.0;
};

/**
 * 在给定时间评估曲线。
 * @function
 *
 * @param {number} time 要评估曲线的时间。
 * @param {Cartesian3|Quaternion} [result] 存储结果的对象。
 * @returns {number|Cartesian3|Quaternion} 修改后的结果参数或常数样条表示的值。
 */

ConstantSpline.prototype.evaluate = function(time, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("time", time);
  //>>includeEnd('debug');

  const value = this._value;
  const ValueType = this._valueType;

  if (ValueType === Number) {
    return value;
  }

  return ValueType.clone(value, result);
};

export default ConstantSpline;
