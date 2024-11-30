import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Spline from "./Spline.js";

/**
 * 一个使用分段线性插值创建曲线的样条。
 *
 * @alias LinearSpline
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number[]} options.times 一个严格递增的无单位浮点数数组，表示每个点的时间。
 *                这些值与时钟时间无关。它们是曲线的参数化。
 * @param {number[]|Cartesian3[]} options.points 控制点的数组。
 *
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。
 *
 *
 * @example
 * const times = [ 0.0, 1.5, 3.0, 4.5, 6.0 ];
 * const spline = new Cesium.LinearSpline({
 *     times : times,
 *     points : [
 *         new Cesium.Cartesian3(1235398.0, -4810983.0, 4146266.0),
 *         new Cesium.Cartesian3(1372574.0, -5345182.0, 4606657.0),
 *         new Cesium.Cartesian3(-757983.0, -5542796.0, 4514323.0),
 *         new Cesium.Cartesian3(-2821260.0, -5248423.0, 4021290.0),
 *         new Cesium.Cartesian3(-2539788.0, -4724797.0, 3620093.0)
 *     ]
 * });
 *
 * const p0 = spline.evaluate(times[0]);
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see CatmullRomSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function LinearSpline(options) {
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
  this._pointType = Spline.getPointType(points[0]);

  this._lastTimeIndex = 0;
}

Object.defineProperties(LinearSpline.prototype, {
  /**
   * 控制点的时间数组。
   *
   * @memberof LinearSpline.prototype
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
   * {@link Cartesian3} 控制点的数组。
   *
   * @memberof LinearSpline.prototype
   *
   * @type {number[]|Cartesian3[]}
   * @readonly
   */
  points: {
    get: function () {
      return this._points;
    },
  },
});


/**
 * 查找 <code>times</code> 中的索引 <code>i</code>，使得参数 <code>time</code> 在区间 <code>[times[i], times[i + 1]]</code> 内。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 区间起始位置元素的索引。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，而 <code>t<sub>n</sub></code> 是数组
 *                             <code>times</code> 中的最后一个元素。
 */

LinearSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间包装到样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，包装到更新的动画中。
 */

LinearSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制在样条覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 时间，限制在动画周期内。
 */

LinearSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {number|Cartesian3} 修改后的结果参数，或在给定时间曲线上点的新实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 中的第一个元素，而 <code>t<sub>n</sub></code> 是数组
 *                             <code>times</code> 中的最后一个元素。
 */

LinearSpline.prototype.evaluate = function (time, result) {
  const points = this.points;
  const times = this.times;

  const i = (this._lastTimeIndex = this.findTimeInterval(
    time,
    this._lastTimeIndex,
  ));
  const u = (time - times[i]) / (times[i + 1] - times[i]);

  const PointType = this._pointType;
  if (PointType === Number) {
    return (1.0 - u) * points[i] + u * points[i + 1];
  }

  if (!defined(result)) {
    result = new Cartesian3();
  }

  return Cartesian3.lerp(points[i], points[i + 1], u, result);
};

export default LinearSpline;
