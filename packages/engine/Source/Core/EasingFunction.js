import { Easing } from "@tweenjs/tween.js";

/**
 * 用于TweenCollection的缓动函数。这些函数来自
 * {@link https://github.com/sole/tween.js/|Tween.js} 和 Robert Penner。查看
 * {@link http://sole.github.io/tween.js/examples/03_graphs.html|Tween.js graphs for each function}.
 *
 * @namespace
 */
const EasingFunction = {
  /**
   * 线性缓动。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  LINEAR_NONE: Easing.Linear.None,

  /**
   * 二次方入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN: Easing.Quadratic.In,
  /**
   * 二次方出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_OUT: Easing.Quadratic.Out,
  /**
   * 二次方入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUADRATIC_IN_OUT: Easing.Quadratic.InOut,

  /**
   * 三次方入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN: Easing.Cubic.In,
  /**
   * 三次方出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_OUT: Easing.Cubic.Out,
  /**
   * 三次方入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CUBIC_IN_OUT: Easing.Cubic.InOut,

  /**
   * 四次方入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN: Easing.Quartic.In,
  /**
   * 四次方出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_OUT: Easing.Quartic.Out,
  /**
   * 四次方入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUARTIC_IN_OUT: Easing.Quartic.InOut,

  /**
   * 五次方入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN: Easing.Quintic.In,
  /**
   * 五次方出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_OUT: Easing.Quintic.Out,
  /**
   * 五次方入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  QUINTIC_IN_OUT: Easing.Quintic.InOut,

  /**
   * 正弦入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN: Easing.Sinusoidal.In,
  /**
   * 正弦出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_OUT: Easing.Sinusoidal.Out,
  /**
   * 正弦入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  SINUSOIDAL_IN_OUT: Easing.Sinusoidal.InOut,

  /**
   * 指数入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN: Easing.Exponential.In,
  /**
   * 指数出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_OUT: Easing.Exponential.Out,
  /**
   * 指数入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  EXPONENTIAL_IN_OUT: Easing.Exponential.InOut,

  /**
   * 圆形入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN: Easing.Circular.In,
  /**
   * 圆形出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_OUT: Easing.Circular.Out,
  /**
   * 圆形入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  CIRCULAR_IN_OUT: Easing.Circular.InOut,

  /**
   * 弹性入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN: Easing.Elastic.In,
  /**
   * 弹性出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_OUT: Easing.Elastic.Out,
  /**
   * 弹性入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  ELASTIC_IN_OUT: Easing.Elastic.InOut,

  /**
   * 回退入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN: Easing.Back.In,
  /**
   * 回退出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_OUT: Easing.Back.Out,
  /**
   * 回退入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BACK_IN_OUT: Easing.Back.InOut,

  /**
   * 弹跳入。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN: Easing.Bounce.In,
  /**
   * 弹跳出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_OUT: Easing.Bounce.Out,
  /**
   * 弹跳入后出。
   *
   * @type {EasingFunction.Callback}
   * @constant
   */
  BOUNCE_IN_OUT: Easing.Bounce.InOut,
};

/**
 * 实现自定义缓动函数的函数接口。
 * @callback EasingFunction.Callback
 * @param {number} time 时间值在范围 <code>[0, 1]</code> 内。
 * @returns {number} 给定时间的函数值。
 *
 * @example
 * function quadraticIn(time) {
 *     return time * time;
 * }
 *
 * @example
 * function quadraticOut(time) {
 *     return time * (2.0 - time);
 * }
 */

export default Object.freeze(EasingFunction);
