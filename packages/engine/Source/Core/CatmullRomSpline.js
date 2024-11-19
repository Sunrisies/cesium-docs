import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import HermiteSpline from "./HermiteSpline.js";
import Matrix4 from "./Matrix4.js";
import Spline from "./Spline.js";

const scratchTimeVec = new Cartesian4();
const scratchTemp0 = new Cartesian3();
const scratchTemp1 = new Cartesian3();

function createEvaluateFunction(spline) {
  const points = spline.points;
  const times = spline.times;

  if (points.length < 3) {
    const t0 = times[0];
    const invSpan = 1.0 / (times[1] - t0);

    const p0 = points[0];
    const p1 = points[1];

    return function (time, result) {
      if (!defined(result)) {
        result = new Cartesian3();
      }
      const u = (time - t0) * invSpan;
      return Cartesian3.lerp(p0, p1, u, result);
    };
  }

  return function (time, result) {
    if (!defined(result)) {
      result = new Cartesian3();
    }
    const i = (spline._lastTimeIndex = spline.findTimeInterval(
      time,
      spline._lastTimeIndex,
    ));
    const u = (time - times[i]) / (times[i + 1] - times[i]);

    const timeVec = scratchTimeVec;
    timeVec.z = u;
    timeVec.y = u * u;
    timeVec.x = timeVec.y * u;
    timeVec.w = 1.0;

    let p0;
    let p1;
    let p2;
    let p3;
    let coefs;

    if (i === 0) {
      p0 = points[0];
      p1 = points[1];
      p2 = spline.firstTangent;

      p3 = Cartesian3.subtract(points[2], p0, scratchTemp0);
      Cartesian3.multiplyByScalar(p3, 0.5, p3);

      coefs = Matrix4.multiplyByVector(
        HermiteSpline.hermiteCoefficientMatrix,
        timeVec,
        timeVec,
      );
    } else if (i === points.length - 2) {
      p0 = points[i];
      p1 = points[i + 1];
      p3 = spline.lastTangent;

      p2 = Cartesian3.subtract(p1, points[i - 1], scratchTemp0);
      Cartesian3.multiplyByScalar(p2, 0.5, p2);

      coefs = Matrix4.multiplyByVector(
        HermiteSpline.hermiteCoefficientMatrix,
        timeVec,
        timeVec,
      );
    } else {
      p0 = points[i - 1];
      p1 = points[i];
      p2 = points[i + 1];
      p3 = points[i + 2];
      coefs = Matrix4.multiplyByVector(
        CatmullRomSpline.catmullRomCoefficientMatrix,
        timeVec,
        timeVec,
      );
    }
    result = Cartesian3.multiplyByScalar(p0, coefs.x, result);
    Cartesian3.multiplyByScalar(p1, coefs.y, scratchTemp1);
    Cartesian3.add(result, scratchTemp1, result);
    Cartesian3.multiplyByScalar(p2, coefs.z, scratchTemp1);
    Cartesian3.add(result, scratchTemp1, result);
    Cartesian3.multiplyByScalar(p3, coefs.w, scratchTemp1);
    return Cartesian3.add(result, scratchTemp1, result);
  };
}

const firstTangentScratch = new Cartesian3();
const lastTangentScratch = new Cartesian3();

/**
 * Catmull-Rom 样条曲线是一种立方样条曲线，在控制点处（除了第一个和最后一个控制点）的切线
 * 是通过前一个和后一个控制点计算得出的。Catmull-Rom 样条曲线属于 C<sup>1</sup> 类。
 *
 * @alias CatmullRomSpline
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {number[]} options.times 一个严格递增的无单位浮点数数组，表示每个点的时间。
 *                这些值与时钟时间没有任何关联。它们是曲线的参数化。
 * @param {Cartesian3[]} options.points {@link Cartesian3} 控制点的数组。
 * @param {Cartesian3} [options.firstTangent] 第一个控制点处曲线的切线。
 *                     如果未给出切线，则将进行估算。
 * @param {Cartesian3} [options.lastTangent] 最后一个控制点处曲线的切线。
 *                     如果未给出切线，则将进行估算。
 *
 * @exception {DeveloperError} points.length 必须大于或等于 2。
 * @exception {DeveloperError} times.length 必须等于 points.length。
 *
 * @example
 * // spline above the earth from Philadelphia to Los Angeles
 * const spline = new Cesium.CatmullRomSpline({
 *     times : [ 0.0, 1.5, 3.0, 4.5, 6.0 ],
 *     points : [
 *         new Cesium.Cartesian3(1235398.0, -4810983.0, 4146266.0),
 *         new Cesium.Cartesian3(1372574.0, -5345182.0, 4606657.0),
 *         new Cesium.Cartesian3(-757983.0, -5542796.0, 4514323.0),
 *         new Cesium.Cartesian3(-2821260.0, -5248423.0, 4021290.0),
 *         new Cesium.Cartesian3(-2539788.0, -4724797.0, 3620093.0)
 *     ]
 * });
 *
 * const p0 = spline.evaluate(times[i]);         // equal to positions[i]
 * const p1 = spline.evaluate(times[i] + delta); // interpolated value when delta < times[i + 1] - times[i]
 *
 * @see ConstantSpline
 * @see SteppedSpline
 * @see HermiteSpline
 * @see LinearSpline
 * @see QuaternionSpline
 * @see MorphWeightSpline
 */
function CatmullRomSpline(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const points = options.points;
  const times = options.times;
  let firstTangent = options.firstTangent;
  let lastTangent = options.lastTangent;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("points", points);
  Check.defined("times", times);
  Check.typeOf.number.greaterThanOrEquals("points.length", points.length, 2);
  Check.typeOf.number.equals(
    "times.length",
    "points.length",
    times.length,
    points.length,
  );
  //>>includeEnd('debug');

  if (points.length > 2) {
    if (!defined(firstTangent)) {
      firstTangent = firstTangentScratch;
      Cartesian3.multiplyByScalar(points[1], 2.0, firstTangent);
      Cartesian3.subtract(firstTangent, points[2], firstTangent);
      Cartesian3.subtract(firstTangent, points[0], firstTangent);
      Cartesian3.multiplyByScalar(firstTangent, 0.5, firstTangent);
    }

    if (!defined(lastTangent)) {
      const n = points.length - 1;
      lastTangent = lastTangentScratch;
      Cartesian3.multiplyByScalar(points[n - 1], 2.0, lastTangent);
      Cartesian3.subtract(points[n], lastTangent, lastTangent);
      Cartesian3.add(lastTangent, points[n - 2], lastTangent);
      Cartesian3.multiplyByScalar(lastTangent, 0.5, lastTangent);
    }
  }

  this._times = times;
  this._points = points;
  this._firstTangent = Cartesian3.clone(firstTangent);
  this._lastTangent = Cartesian3.clone(lastTangent);

  this._evaluateFunction = createEvaluateFunction(this);
  this._lastTimeIndex = 0;
}

Object.defineProperties(CatmullRomSpline.prototype, {
 /**
   * 控制点的时间数组。
   *
   * @memberof CatmullRomSpline.prototype
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
   * 一个 {@link Cartesian3} 控制点的数组。
   *
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3[]}
   * @readonly
   */

  points: {
    get: function () {
      return this._points;
    },
  },

  /**
   * 第一个控制点处的切线。
   *
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */

  firstTangent: {
    get: function () {
      return this._firstTangent;
    },
  },

  /**
   * 最后一个控制点处的切线。
   *
   * @memberof CatmullRomSpline.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */

  lastTangent: {
    get: function () {
      return this._lastTangent;
    },
  },
});

/**
 * @private
 */
CatmullRomSpline.catmullRomCoefficientMatrix = new Matrix4(
  -0.5,
  1.0,
  -0.5,
  0.0,
  1.5,
  -2.5,
  0.0,
  1.0,
  -1.5,
  2.0,
  0.5,
  0.0,
  0.5,
  -0.5,
  0.0,
  0.0,
);

/**
 * 查找索引 <code>i</code>，使得参数 <code>time</code> 在区间 <code>[times[i], times[i + 1]]</code> 内。
 * @function
 *
 * @param {number} time 时间。
 * @returns {number} 表示区间起始位置的元素索引。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 的第一个元素，<code>t<sub>n</sub></code> 是数组 <code>times</code> 的最后一个元素。
 */

CatmullRomSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

/**
 * 将给定时间包装到样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 包装后的时间，对应更新后的动画。
 */
CatmullRomSpline.prototype.wrapTime = Spline.prototype.wrapTime;

/**
 * 将给定时间限制在样条曲线覆盖的周期内。
 * @function
 *
 * @param {number} time 时间。
 * @return {number} 被限制在动画周期内的时间。
 */

CatmullRomSpline.prototype.clampTime = Spline.prototype.clampTime;

/**
 * 在给定时间评估曲线。
 *
 * @param {number} time 评估曲线的时间。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 修改后的结果参数或该时间上曲线的点的新实例。
 *
 * @exception {DeveloperError} time 必须在范围 <code>[t<sub>0</sub>, t<sub>n</sub>]</code> 内，其中 <code>t<sub>0</sub></code>
 *                             是数组 <code>times</code> 的第一个元素，而 <code>t<sub>n</sub></code> 是数组 <code>times</code> 的最后一个元素。
 */

CatmullRomSpline.prototype.evaluate = function (time, result) {
  return this._evaluateFunction(time, result);
};
export default CatmullRomSpline;
