import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 一个样条曲线，在线性插值的基础上处理用于形态目标的权重值数组。
 *
 * @alias MorphWeightSpline
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number[]} options.times 一个严格递增的、无单位的浮点数数组，表示每个点的时间。
 *                这些值与时钟时间没有任何关联。它们是曲线的参数化。
 * @param {number[]} options.weights 提供的浮点控制权重数组。权重按顺序排列，确保目标的所有权重
 *                按时间顺序给出，并且按它们在源于的 glTF 中出现的顺序排列。这意味着对于 2 个目标，weights = [w(0,0), w(0,1), w(1,0), w(1,1) ...]，
 *                其中 i 和 j 在 w(i,j) 中分别是时间索引和目标索引。
 *
 * @exception {DeveloperError} weights.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须是 weights.length 的因子。
 *
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const weights = [0.0, 1.0, 0.25, 0.75, 0.5, 0.5, 0.75, 0.25, 1.0, 0.0]; //Two targets
 * const spline = new Cesium.WeightSpline({
 *     times : times,
 *     weights : weights
 * });
 *
 * const p0 = spline.evaluate(times[0]);
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see LinearSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 */
function MorphWeightSpline(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const weights = options.weights;
  const times = options.times;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("weights", weights);
  Check.defined("times", times);
  Check.typeOf.number.greaterThanOrEquals("weights.length", weights.length, 3);
  if (weights.length % times.length !== 0) {
    throw new DeveloperError(
      "times.length must be a factor of weights.length.",
    );
  }
  //>>includeEnd('debug');

  this._times = times;
  this._weights = weights;
  this._count = weights.length / times.length;

  this._lastTimeIndex = 0;
}

Object.defineProperties(MorphWeightSpline.prototype, {
  /**
   * 控制权重的时间数组。
   *
   * @memberof WeightSpline.prototype
   *
   * @type {number[]}
   * @readonly
   */
  times: {
    get: function () {
      return this._times;
    },
  },

  /**
   * 浮点数数组控制权重的数组。
   *
   * @memberof WeightSpline.prototype
   *
   * @type {number[]}
   * @readonly
   */

  weights: {
    get: function () {
      return this._weights;
    },
  },
});

/**
 * 在 <code>times</code> 中找到一个索引 <code>i</code>，使得参数 <code>time</code> 在区间 <code>[times[i], times[i + 1]]</code> 内。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 区间起始位置的元素索引。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，而 <code>t<sub>n</sub></code> 是数组
 *                             <code>times</code> 中的最后一个元素。
 */

MorphWeightSpline.prototype.findTimeInterval =
  Spline.prototype.findTimeInterval;

/**
 * 将给定时间包装到样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 包装后的时间，更新到动画。
 */
MorphWeightSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制在样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，限制在动画周期内。
 */
MorphWeightSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 要评估曲线的时间。
 * @param {number[]} [result] 存储结果的对象。
 * @returns {number[]} 修改后的结果参数或该时间点上曲线的新实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，而 <code>t<sub>n</sub></code> 是数组
 *                             <code>times</code> 中的最后一个元素。
 */

MorphWeightSpline.prototype.evaluate = function (time, result) {
  const weights = this.weights;
  const times = this.times;

  const i = (this._lastTimeIndex = this.findTimeInterval(
    time,
    this._lastTimeIndex,
  ));
  const u = (time - times[i]) / (times[i + 1] - times[i]);

  if (!defined(result)) {
    result = new Array(this._count);
  }

  for (let j = 0; j < this._count; j++) {
    const index = i * this._count + j;
    result[j] = weights[index] * (1.0 - u) + weights[index + this._count] * u;
  }

  return result;
};
export default MorphWeightSpline;
