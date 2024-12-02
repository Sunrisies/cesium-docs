import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Quaternion from "./Quaternion.js";
import Spline from "./Spline.js";

function createEvaluateFunction(spline) {
  const points = spline.points;
  const times = spline.times;

  // use slerp interpolation
  return function (time, result) {
    if (!defined(result)) {
      result = new Quaternion();
    }
    const i = (spline._lastTimeIndex = spline.findTimeInterval(
      time,
      spline._lastTimeIndex,
    ));
    const u = (time - times[i]) / (times[i + 1] - times[i]);

    const q0 = points[i];
    const q1 = points[i + 1];

    return Quaternion.fastSlerp(q0, q1, u, result);
  };
}

/**
 * 一个使用球面线性插值（slerp）生成四元数曲线的样条曲线。
 * 生成的曲线是 C<sup>1</sup> 类。
 *
 * @alias QuaternionSpline
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {number[]} options.times 一个严格递增的单位无关浮点数时间数组，在每个点上。
 *                这些值与时钟时间没有任何关联。它们是曲线的参数化。
 * @param {Quaternion[]} options.points {@link Quaternion} 控制点的数组。
 *
 * @exception {DeveloperError} points 和 times 是必需的。
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see LinearSpline
 * @see MorphWeightSpline
 */

function QuaternionSpline(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const points = options.points;
  const times = options.times;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(points) || !defined(times)) {
    throw new DeveloperError("points and times are required.");
  }
  if (points.length < 2) {
    throw new DeveloperError(
      "points.length must be greater than or equal to 2.",
    );
  }
  if (times.length !== points.length) {
    throw new DeveloperError("times.length must be equal to points.length.");
  }
  //>>includeEnd('debug');

  this._times = times;
  this._points = points;

  this._evaluateFunction = createEvaluateFunction(this);
  this._lastTimeIndex = 0;
}

Object.defineProperties(QuaternionSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof QuaternionSpline.prototype
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
   * {@link Quaternion} 控制点的数组。
   *
   * @memberof QuaternionSpline.prototype
   *
   * @type {Quaternion[]}
   * @readonly
   */

  points: {
    get: function () {
      return this._points;
    },
  },
});

/**
 * 在 <code>times</code> 中找到一个索引 <code>i</code>，使参数
 * <code>time</code> 在区间 <code>[times[i], times[i + 1]]</code> 中。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 表示区间开始的元素的索引。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 中的最后一个元素。
 */
QuaternionSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间限制在样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 围绕更新动画的时间。
 */
QuaternionSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制在样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 限制到动画周期的时间。
 */
QuaternionSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 要评估曲线的时间。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数或在给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 中的最后一个元素。
 */

QuaternionSpline.prototype.evaluate = function (time, result) {
  return this._evaluateFunction(time, result);
};
export default QuaternionSpline;
