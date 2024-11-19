import ClockRange from "./ClockRange.js";
import ClockStep from "./ClockStep.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import getTimestamp from "./getTimestamp.js";
import JulianDate from "./JulianDate.js";

/**
 * 一个简单的时钟，用于跟踪仿真时间。
 *
 * @alias Clock
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {JulianDate} [options.startTime] 时钟的开始时间。
 * @param {JulianDate} [options.stopTime] 时钟的结束时间。
 * @param {JulianDate} [options.currentTime] 当前时间。
 * @param {number} [options.multiplier=1.0] 确定调用{@link Clock#tick}时时间的推进速度，负值允许时间向后推进。
 * @param {ClockStep} [options.clockStep=ClockStep.SYSTEM_CLOCK_MULTIPLIER] 确定调用{@link Clock#tick}是否依赖于帧或系统时钟。
 * @param {ClockRange} [options.clockRange=ClockRange.UNBOUNDED] 确定当达到{@link Clock#startTime}或{@link Clock#stopTime}时，时钟应如何行为。
 * @param {boolean} [options.canAnimate=true] 指示{@link Clock#tick}是否可以推进时间。例如，如果数据正在缓冲，这可能为false。只有当{@link Clock#canAnimate}和{@link Clock#shouldAnimate}都为true时，时钟才会滴答作响。
 * @param {boolean} [options.shouldAnimate=false] 指示{@link Clock#tick}是否应尝试推进时间。只有当{@link Clock#canAnimate}和{@link Clock#shouldAnimate}都为true时，时钟才会滴答作响。
 *
 * @exception {DeveloperError} startTime必须在stopTime之前。
 *
 * @example
 * // Create a clock that loops on Christmas day 2013 and runs in real-time.
 * const clock = new Cesium.Clock({
 *    startTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    currentTime : Cesium.JulianDate.fromIso8601("2013-12-25"),
 *    stopTime : Cesium.JulianDate.fromIso8601("2013-12-26"),
 *    clockRange : Cesium.ClockRange.LOOP_STOP,
 *    clockStep : Cesium.ClockStep.SYSTEM_CLOCK_MULTIPLIER
 * });
 *
 * @see ClockStep
 * @see ClockRange
 * @see JulianDate
 */
function Clock(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let currentTime = options.currentTime;
  let startTime = options.startTime;
  let stopTime = options.stopTime;

  if (!defined(currentTime)) {
    // if not specified, current time is the start time,
    // or if that is not specified, 1 day before the stop time,
    // or if that is not specified, then now.
    if (defined(startTime)) {
      currentTime = JulianDate.clone(startTime);
    } else if (defined(stopTime)) {
      currentTime = JulianDate.addDays(stopTime, -1.0, new JulianDate());
    } else {
      currentTime = JulianDate.now();
    }
  } else {
    currentTime = JulianDate.clone(currentTime);
  }

  if (!defined(startTime)) {
    // if not specified, start time is the current time
    // (as determined above)
    startTime = JulianDate.clone(currentTime);
  } else {
    startTime = JulianDate.clone(startTime);
  }

  if (!defined(stopTime)) {
    // if not specified, stop time is 1 day after the start time
    // (as determined above)
    stopTime = JulianDate.addDays(startTime, 1.0, new JulianDate());
  } else {
    stopTime = JulianDate.clone(stopTime);
  }

  //>>includeStart('debug', pragmas.debug);
  if (JulianDate.greaterThan(startTime, stopTime)) {
    throw new DeveloperError("startTime must come before stopTime.");
  }
  //>>includeEnd('debug');

  /**
   * 时钟的开始时间。
   * @type {JulianDate}
   */
  this.startTime = startTime;

  /**
   * 时钟的结束时间。
   * @type {JulianDate}
   */
  this.stopTime = stopTime;

  /**
   * 确定当{@link Clock#startTime}或{@link Clock#stopTime}达到时，时钟应如何行为。
   * @type {ClockRange}
   * @default {@link ClockRange.UNBOUNDED}
   */
  this.clockRange = defaultValue(options.clockRange, ClockRange.UNBOUNDED);

  /**
   * 指示{@link Clock#tick}是否可以推进时间。例如，如果数据正在缓冲，这可能为false。时钟只有在{@link Clock#canAnimate}和{@link Clock#shouldAnimate}都为true时才会推进时间。
   * @type {boolean}
   * @default true
   */
  this.canAnimate = defaultValue(options.canAnimate, true);

  /**
   * 每当调用{@link Clock#tick}时触发的{@link Event}。
   * @type {Event}
   */
  this.onTick = new Event();
  
  /**
   * 每当达到{@link Clock#stopTime}时触发的{@link Event}。
   * @type {Event}
   */

  this.onStop = new Event();

  this._currentTime = undefined;
  this._multiplier = undefined;
  this._clockStep = undefined;
  this._shouldAnimate = undefined;
  this._lastSystemTime = getTimestamp();

  // set values using the property setters to
  // make values consistent.

  this.currentTime = currentTime;
  this.multiplier = defaultValue(options.multiplier, 1.0);
  this.shouldAnimate = defaultValue(options.shouldAnimate, false);
  this.clockStep = defaultValue(
    options.clockStep,
    ClockStep.SYSTEM_CLOCK_MULTIPLIER,
  );
}

Object.defineProperties(Clock.prototype, {
  /**
   * 当前时间。
   * 更改此属性将使{@link Clock#clockStep}从{@link ClockStep.SYSTEM_CLOCK}变更为{@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {JulianDate}
   */
  currentTime: {
    get: function () {
      return this._currentTime;
    },
    set: function (value) {
      if (JulianDate.equals(this._currentTime, value)) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._currentTime = value;
    },
  },

  /**
   * 获取或设置在调用{@link Clock#tick}时时间推进的量。负值允许时间向后推进。
   * 如果{@link Clock#clockStep}设置为{@link ClockStep.TICK_DEPENDENT}，这是要推进的秒数。
   * 如果{@link Clock#clockStep}设置为{@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}，则此值将乘以
   * 自上次调用{@link Clock#tick}以来经过的系统时间。
   * 更改此属性将使{@link Clock#clockStep}从{@link ClockStep.SYSTEM_CLOCK}变更为{@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {number}
   * @default 1.0
   */
  multiplier: {
    get: function () {
      return this._multiplier;
    },
    set: function (value) {
      if (this._multiplier === value) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._multiplier = value;
    },
  },

  /**
   * 确定调用{@link Clock#tick}是否依赖于帧或系统时钟。
   * 将此属性更改为{@link ClockStep.SYSTEM_CLOCK}将将{@link Clock#multiplier}设置为1.0，
   * 将{@link Clock#shouldAnimate}设置为true，并将{@link Clock#currentTime}设置为当前系统时钟时间。
   * @memberof Clock.prototype
   * @type ClockStep
   * @default {@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}
   */
  clockStep: {
    get: function () {
      return this._clockStep;
    },
    set: function (value) {
      if (value === ClockStep.SYSTEM_CLOCK) {
        this._multiplier = 1.0;
        this._shouldAnimate = true;
        this._currentTime = JulianDate.now();
      }

      this._clockStep = value;
    },
  },

  /**
   * 指示{@link Clock#tick}是否应尝试推进时间。
   * 时钟只有在{@link Clock#canAnimate}和{@link Clock#shouldAnimate}均为true时才会推进时间。
   * 更改此属性将使{@link Clock#clockStep}从{@link ClockStep.SYSTEM_CLOCK}变更为{@link ClockStep.SYSTEM_CLOCK_MULTIPLIER}。
   * @memberof Clock.prototype
   * @type {boolean}
   * @default false
   */
  shouldAnimate: {
    get: function () {
      return this._shouldAnimate;
    },
    set: function (value) {
      if (this._shouldAnimate === value) {
        return;
      }

      if (this._clockStep === ClockStep.SYSTEM_CLOCK) {
        this._clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;
      }

      this._shouldAnimate = value;
    },
  },
});


/**
 * 根据当前配置选项，从当前时间推进时钟。
 * tick应该在每一帧被调用，无论动画是否正在进行。
 * 要控制动画，请使用{@link Clock#shouldAnimate}属性。
 *
 * @returns {JulianDate} {@link Clock#currentTime}属性的新值。
 */

Clock.prototype.tick = function () {
  const currentSystemTime = getTimestamp();
  let currentTime = JulianDate.clone(this._currentTime);

  if (this.canAnimate && this._shouldAnimate) {
    const clockStep = this._clockStep;
    if (clockStep === ClockStep.SYSTEM_CLOCK) {
      currentTime = JulianDate.now(currentTime);
    } else {
      const multiplier = this._multiplier;

      if (clockStep === ClockStep.TICK_DEPENDENT) {
        currentTime = JulianDate.addSeconds(
          currentTime,
          multiplier,
          currentTime,
        );
      } else {
        const milliseconds = currentSystemTime - this._lastSystemTime;
        currentTime = JulianDate.addSeconds(
          currentTime,
          multiplier * (milliseconds / 1000.0),
          currentTime,
        );
      }

      const clockRange = this.clockRange;
      const startTime = this.startTime;
      const stopTime = this.stopTime;

      if (clockRange === ClockRange.CLAMPED) {
        if (JulianDate.lessThan(currentTime, startTime)) {
          currentTime = JulianDate.clone(startTime, currentTime);
        } else if (JulianDate.greaterThan(currentTime, stopTime)) {
          currentTime = JulianDate.clone(stopTime, currentTime);
          this.onStop.raiseEvent(this);
        }
      } else if (clockRange === ClockRange.LOOP_STOP) {
        if (JulianDate.lessThan(currentTime, startTime)) {
          currentTime = JulianDate.clone(startTime, currentTime);
        }
        while (JulianDate.greaterThan(currentTime, stopTime)) {
          currentTime = JulianDate.addSeconds(
            startTime,
            JulianDate.secondsDifference(currentTime, stopTime),
            currentTime,
          );
          this.onStop.raiseEvent(this);
        }
      }
    }
  }

  this._currentTime = currentTime;
  this._lastSystemTime = currentSystemTime;
  this.onTick.raiseEvent(this);
  return currentTime;
};
export default Clock;
