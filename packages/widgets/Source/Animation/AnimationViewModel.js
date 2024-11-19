import {
  binarySearch,
  ClockRange,
  ClockStep,
  defined,
  DeveloperError,
  JulianDate,
} from "@cesium/engine";

import knockout from "../ThirdParty/knockout.js";
import createCommand from "../createCommand.js";
import ToggleButtonViewModel from "../ToggleButtonViewModel.js";

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const realtimeShuttleRingAngle = 15;
const maxShuttleRingAngle = 105;

function numberComparator(left, right) {
  return left - right;
}

function getTypicalMultiplierIndex(multiplier, shuttleRingTicks) {
  const index = binarySearch(shuttleRingTicks, multiplier, numberComparator);
  return index < 0 ? ~index : index;
}

function angleToMultiplier(angle, shuttleRingTicks) {
  //Use a linear scale for -1 to 1 between -15 < angle < 15 degrees
  if (Math.abs(angle) <= realtimeShuttleRingAngle) {
    return angle / realtimeShuttleRingAngle;
  }

  const minp = realtimeShuttleRingAngle;
  const maxp = maxShuttleRingAngle;
  let maxv;
  const minv = 0;
  let scale;
  if (angle > 0) {
    maxv = Math.log(shuttleRingTicks[shuttleRingTicks.length - 1]);
    scale = (maxv - minv) / (maxp - minp);
    return Math.exp(minv + scale * (angle - minp));
  }

  maxv = Math.log(-shuttleRingTicks[0]);
  scale = (maxv - minv) / (maxp - minp);
  return -Math.exp(minv + scale * (Math.abs(angle) - minp));
}

function multiplierToAngle(multiplier, shuttleRingTicks, clockViewModel) {
  if (clockViewModel.clockStep === ClockStep.SYSTEM_CLOCK) {
    return realtimeShuttleRingAngle;
  }

  if (Math.abs(multiplier) <= 1) {
    return multiplier * realtimeShuttleRingAngle;
  }

  const fastedMultipler = shuttleRingTicks[shuttleRingTicks.length - 1];
  if (multiplier > fastedMultipler) {
    multiplier = fastedMultipler;
  } else if (multiplier < -fastedMultipler) {
    multiplier = -fastedMultipler;
  }

  const minp = realtimeShuttleRingAngle;
  const maxp = maxShuttleRingAngle;
  let maxv;
  const minv = 0;
  let scale;

  if (multiplier > 0) {
    maxv = Math.log(fastedMultipler);
    scale = (maxv - minv) / (maxp - minp);
    return (Math.log(multiplier) - minv) / scale + minp;
  }

  maxv = Math.log(-shuttleRingTicks[0]);
  scale = (maxv - minv) / (maxp - minp);
  return -((Math.log(Math.abs(multiplier)) - minv) / scale + minp);
}

/**
 *  {@link Animation} 小部件视图模型.
 * @alias AnimationViewModel
 * @constructor
 *
 * @param {ClockViewModel} clockViewModel 要使用 ClockViewModel 的实例.
 *
 * @see Animation
 */
function AnimationViewModel(clockViewModel) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(clockViewModel)) {
    throw new DeveloperError("clockViewModel is required.");
  }
  //>>includeEnd('debug');

  const that = this;
  this._clockViewModel = clockViewModel;
  this._allShuttleRingTicks = [];
  this._dateFormatter = AnimationViewModel.defaultDateFormatter;
  this._timeFormatter = AnimationViewModel.defaultTimeFormatter;

  /**
   * 获取或设置当前是否正在拖动梭子环.此属性是可观察的.
   * @type {boolean}
   * @default false
   */
  this.shuttleRingDragging = false;

  /**
   * 获取或设置拖动梭子环是否应使乘数对齐到定义的刻度值，而不是在它们之间插值。此属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.snapToTicks = false;

  knockout.track(this, [
    "_allShuttleRingTicks",
    "_dateFormatter",
    "_timeFormatter",
    "shuttleRingDragging",
    "snapToTicks",
  ]);

  this._sortedFilteredPositiveTicks = [];

  this.setShuttleRingTicks(AnimationViewModel.defaultTicks);

  /**
   * 获取当前时间的字符串表示形式。此属性是可观察的.
   * @type {string}
   */
  this.timeLabel = undefined;
  knockout.defineProperty(this, "timeLabel", function () {
    return that._timeFormatter(that._clockViewModel.currentTime, that);
  });

  /**
   * 获取当前日期的字符串表示形式,此属性是可观察的.
   * @type {string}
   */
  this.dateLabel = undefined;
  knockout.defineProperty(this, "dateLabel", function () {
    return that._dateFormatter(that._clockViewModel.currentTime, that);
  });

  /**
   * 获取当前乘数的字符串表示形式,此属性是可观察的.
   * @type {string}
   */
  this.multiplierLabel = undefined;
  knockout.defineProperty(this, "multiplierLabel", function () {
    const clockViewModel = that._clockViewModel;
    if (clockViewModel.clockStep === ClockStep.SYSTEM_CLOCK) {
      return "Today";
    }

    const multiplier = clockViewModel.multiplier;

    //If it's a whole number, just return it.
    if (multiplier % 1 === 0) {
      return `${multiplier.toFixed(0)}x`;
    }

    //Convert to decimal string and remove any trailing zeroes
    return `${multiplier.toFixed(3).replace(/0{0,3}$/, "")}x`;
  });

  /**
   * 获取或设置当前梭子环角度。此属性是可观察的。
   * @type {number}
   */
  this.shuttleRingAngle = undefined;
  knockout.defineProperty(this, "shuttleRingAngle", {
    get: function () {
      return multiplierToAngle(
        clockViewModel.multiplier,
        that._allShuttleRingTicks,
        clockViewModel,
      );
    },
    set: function (angle) {
      angle = Math.max(
        Math.min(angle, maxShuttleRingAngle),
        -maxShuttleRingAngle,
      );
      const ticks = that._allShuttleRingTicks;

      const clockViewModel = that._clockViewModel;
      clockViewModel.clockStep = ClockStep.SYSTEM_CLOCK_MULTIPLIER;

      //If we are at the max angle, simply return the max value in either direction.
      if (Math.abs(angle) === maxShuttleRingAngle) {
        clockViewModel.multiplier =
          angle > 0 ? ticks[ticks.length - 1] : ticks[0];
        return;
      }

      let multiplier = angleToMultiplier(angle, ticks);
      if (that.snapToTicks) {
        multiplier = ticks[getTypicalMultiplierIndex(multiplier, ticks)];
      } else if (multiplier !== 0) {
        const positiveMultiplier = Math.abs(multiplier);

        if (positiveMultiplier > 100) {
          const numDigits = positiveMultiplier.toFixed(0).length - 2;
          const divisor = Math.pow(10, numDigits);
          multiplier = (Math.round(multiplier / divisor) * divisor) | 0;
        } else if (positiveMultiplier > realtimeShuttleRingAngle) {
          multiplier = Math.round(multiplier);
        } else if (positiveMultiplier > 1) {
          multiplier = +multiplier.toFixed(1);
        } else if (positiveMultiplier > 0) {
          multiplier = +multiplier.toFixed(2);
        }
      }
      clockViewModel.multiplier = multiplier;
    },
  });

  this._canAnimate = undefined;
  knockout.defineProperty(this, "_canAnimate", function () {
    const clockViewModel = that._clockViewModel;
    const clockRange = clockViewModel.clockRange;

    if (that.shuttleRingDragging || clockRange === ClockRange.UNBOUNDED) {
      return true;
    }

    const multiplier = clockViewModel.multiplier;
    const currentTime = clockViewModel.currentTime;
    const startTime = clockViewModel.startTime;

    let result = false;
    if (clockRange === ClockRange.LOOP_STOP) {
      result =
        JulianDate.greaterThan(currentTime, startTime) ||
        (currentTime.equals(startTime) && multiplier > 0);
    } else {
      const stopTime = clockViewModel.stopTime;
      result =
        (JulianDate.greaterThan(currentTime, startTime) &&
          JulianDate.lessThan(currentTime, stopTime)) || //
        (currentTime.equals(startTime) && multiplier > 0) || //
        (currentTime.equals(stopTime) && multiplier < 0);
    }

    if (!result) {
      clockViewModel.shouldAnimate = false;
    }
    return result;
  });

  this._isSystemTimeAvailable = undefined;
  knockout.defineProperty(this, "_isSystemTimeAvailable", function () {
    const clockViewModel = that._clockViewModel;
    const clockRange = clockViewModel.clockRange;
    if (clockRange === ClockRange.UNBOUNDED) {
      return true;
    }

    const systemTime = clockViewModel.systemTime;
    return (
      JulianDate.greaterThanOrEquals(systemTime, clockViewModel.startTime) &&
      JulianDate.lessThanOrEquals(systemTime, clockViewModel.stopTime)
    );
  });

  this._isAnimating = undefined;
  knockout.defineProperty(this, "_isAnimating", function () {
    return (
      that._clockViewModel.shouldAnimate &&
      (that._canAnimate || that.shuttleRingDragging)
    );
  });

  const pauseCommand = createCommand(function () {
    const clockViewModel = that._clockViewModel;
    if (clockViewModel.shouldAnimate) {
      clockViewModel.shouldAnimate = false;
    } else if (that._canAnimate) {
      clockViewModel.shouldAnimate = true;
    }
  });

  this._pauseViewModel = new ToggleButtonViewModel(pauseCommand, {
    toggled: knockout.computed(function () {
      return !that._isAnimating;
    }),
    tooltip: "Pause",
  });

  const playReverseCommand = createCommand(function () {
    const clockViewModel = that._clockViewModel;
    const multiplier = clockViewModel.multiplier;
    if (multiplier > 0) {
      clockViewModel.multiplier = -multiplier;
    }
    clockViewModel.shouldAnimate = true;
  });

  this._playReverseViewModel = new ToggleButtonViewModel(playReverseCommand, {
    toggled: knockout.computed(function () {
      return that._isAnimating && clockViewModel.multiplier < 0;
    }),
    tooltip: "Play Reverse",
  });

  const playForwardCommand = createCommand(function () {
    const clockViewModel = that._clockViewModel;
    const multiplier = clockViewModel.multiplier;
    if (multiplier < 0) {
      clockViewModel.multiplier = -multiplier;
    }
    clockViewModel.shouldAnimate = true;
  });

  this._playForwardViewModel = new ToggleButtonViewModel(playForwardCommand, {
    toggled: knockout.computed(function () {
      return (
        that._isAnimating &&
        clockViewModel.multiplier > 0 &&
        clockViewModel.clockStep !== ClockStep.SYSTEM_CLOCK
      );
    }),
    tooltip: "Play Forward",
  });

  const playRealtimeCommand = createCommand(
    function () {
      that._clockViewModel.clockStep = ClockStep.SYSTEM_CLOCK;
    },
    knockout.getObservable(this, "_isSystemTimeAvailable"),
  );

  this._playRealtimeViewModel = new ToggleButtonViewModel(playRealtimeCommand, {
    toggled: knockout.computed(function () {
      return clockViewModel.clockStep === ClockStep.SYSTEM_CLOCK;
    }),
    tooltip: knockout.computed(function () {
      return that._isSystemTimeAvailable
        ? "Today (real-time)"
        : "Current time not in range";
    }),
  });

  this._slower = createCommand(function () {
    const clockViewModel = that._clockViewModel;
    const shuttleRingTicks = that._allShuttleRingTicks;
    const multiplier = clockViewModel.multiplier;
    const index = getTypicalMultiplierIndex(multiplier, shuttleRingTicks) - 1;
    if (index >= 0) {
      clockViewModel.multiplier = shuttleRingTicks[index];
    }
  });

  this._faster = createCommand(function () {
    const clockViewModel = that._clockViewModel;
    const shuttleRingTicks = that._allShuttleRingTicks;
    const multiplier = clockViewModel.multiplier;
    const index = getTypicalMultiplierIndex(multiplier, shuttleRingTicks) + 1;
    if (index < shuttleRingTicks.length) {
      clockViewModel.multiplier = shuttleRingTicks[index];
    }
  });
}

/**
 * 获取或设置新实例的默认日期格式化程序。
 *
 * @member
 * @type {AnimationViewModel.DateFormatter}
 */
AnimationViewModel.defaultDateFormatter = function (date, viewModel) {
  const gregorianDate = JulianDate.toGregorianDate(date);
  return `${monthNames[gregorianDate.month - 1]} ${gregorianDate.day} ${
    gregorianDate.year
  }`;
};

/**
 * 获取或设置与穿梭环的新实例关联的已知时钟乘法器的默认数组。
 * @type {number[]}
 */
AnimationViewModel.defaultTicks = [
  //
  0.001,
  0.002,
  0.005,
  0.01,
  0.02,
  0.05,
  0.1,
  0.25,
  0.5,
  1.0,
  2.0,
  5.0,
  10.0, //
  15.0,
  30.0,
  60.0,
  120.0,
  300.0,
  600.0,
  900.0,
  1800.0,
  3600.0,
  7200.0,
  14400.0, //
  21600.0,
  43200.0,
  86400.0,
  172800.0,
  345600.0,
  604800.0,
];

/**
 * 获取或设置新实例使用的默认时间格式化程序。
 *
 * @member
 * @type {AnimationViewModel.TimeFormatter}
 */
AnimationViewModel.defaultTimeFormatter = function (date, viewModel) {
  const gregorianDate = JulianDate.toGregorianDate(date);
  const millisecond = Math.round(gregorianDate.millisecond);
  if (Math.abs(viewModel._clockViewModel.multiplier) < 1) {
    return `${gregorianDate.hour
      .toString()
      .padStart(2, "0")}:${gregorianDate.minute
      .toString()
      .padStart(2, "0")}:${gregorianDate.second
      .toString()
      .padStart(2, "0")}.${millisecond.toString().padStart(3, "0")}`;
  }
  return `${gregorianDate.hour
    .toString()
    .padStart(2, "0")}:${gregorianDate.minute
    .toString()
    .padStart(2, "0")}:${gregorianDate.second.toString().padStart(2, "0")} UTC`;
};

/**
 * 获取要与穿梭环关联的正已知 clock multipliers 数组的副本.
 *
 * @returns {number[]} 与穿梭环关联的已知 clock multipliers 数组.
 */
AnimationViewModel.prototype.getShuttleRingTicks = function () {
  return this._sortedFilteredPositiveTicks.slice(0);
};

/**
 * 设置要与穿梭环关联的正已知 clock multipliers 数组.
 * 这些值将为它们创建负等效值，并设置梭子环的最小和最大范围值，以及单击时要对齐到的值。
 * 这些值不需要按顺序排列，因为它们将自动排序，并且重复值将被删除。
 *
 * @param {number[]} positiveTicks 与 shuttle ring 关联的已知正 clock multipliers 列表.
 */
AnimationViewModel.prototype.setShuttleRingTicks = function (positiveTicks) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(positiveTicks)) {
    throw new DeveloperError("positiveTicks is required.");
  }
  //>>includeEnd('debug');

  let i;
  let len;
  let tick;

  const hash = {};
  const sortedFilteredPositiveTicks = this._sortedFilteredPositiveTicks;
  sortedFilteredPositiveTicks.length = 0;
  for (i = 0, len = positiveTicks.length; i < len; ++i) {
    tick = positiveTicks[i];
    //filter duplicates
    if (!hash.hasOwnProperty(tick)) {
      hash[tick] = true;
      sortedFilteredPositiveTicks.push(tick);
    }
  }
  sortedFilteredPositiveTicks.sort(numberComparator);

  const allTicks = [];
  for (len = sortedFilteredPositiveTicks.length, i = len - 1; i >= 0; --i) {
    tick = sortedFilteredPositiveTicks[i];
    if (tick !== 0) {
      allTicks.push(-tick);
    }
  }
  Array.prototype.push.apply(allTicks, sortedFilteredPositiveTicks);

  this._allShuttleRingTicks = allTicks;
};

Object.defineProperties(AnimationViewModel.prototype, {
  /**
   * 获取降低动画速度的命令。
   * @memberof AnimationViewModel.prototype
   * @type {Command}
   */
  slower: {
    get: function () {
      return this._slower;
    },
  },

  /**
   * 获取提高动画速度的命令。
   * @memberof AnimationViewModel.prototype
   * @type {Command}
   */
  faster: {
    get: function () {
      return this._faster;
    },
  },

  /**
   * 获取clock view 模型 .
   * @memberof AnimationViewModel.prototype
   *
   * @type {ClockViewModel}
   */
  clockViewModel: {
    get: function () {
      return this._clockViewModel;
    },
  },

  /**
   * 获取暂停切换按钮视图模型.
   * @memberof AnimationViewModel.prototype
   *
   * @type {ToggleButtonViewModel}
   */
  pauseViewModel: {
    get: function () {
      return this._pauseViewModel;
    },
  },

  /**
   * 获取反向切换按钮视图模型.
   * @memberof AnimationViewModel.prototype
   *
   * @type {ToggleButtonViewModel}
   */
  playReverseViewModel: {
    get: function () {
      return this._playReverseViewModel;
    },
  },

  /**
   * 获取播放切换按钮视图模型.
   * @memberof AnimationViewModel.prototype
   *
   * @type {ToggleButtonViewModel}
   */
  playForwardViewModel: {
    get: function () {
      return this._playForwardViewModel;
    },
  },

  /**
   * 获取实时切换按钮视图模型.
   * @memberof AnimationViewModel.prototype
   *
   * @type {ToggleButtonViewModel}
   */
  playRealtimeViewModel: {
    get: function () {
      return this._playRealtimeViewModel;
    },
  },

  /**
   * 
   * 获取或设置用于设置显示日期格式的函数.
   * @memberof AnimationViewModel.prototype
   *
   * @type {AnimationViewModel.DateFormatter}
   * @default AnimationViewModel.defaultDateFormatter
   */
  dateFormatter: {
    //TODO:@exception {DeveloperError} dateFormatter must be a function.
    get: function () {
      return this._dateFormatter;
    },
    set: function (dateFormatter) {
      //>>includeStart('debug', pragmas.debug);
      if (typeof dateFormatter !== "function") {
        throw new DeveloperError("dateFormatter must be a function");
      }
      //>>includeEnd('debug');

      this._dateFormatter = dateFormatter;
    },
  },

  /**
   * 获取或设置设置显示时间格式的函数.
   * @memberof AnimationViewModel.prototype
   *
   * @type {AnimationViewModel.TimeFormatter}
   * @default AnimationViewModel.defaultTimeFormatter
   */
  timeFormatter: {
    //TODO:@exception {DeveloperError} timeFormatter must be a function.
    get: function () {
      return this._timeFormatter;
    },
    set: function (timeFormatter) {
      //>>includeStart('debug', pragmas.debug);
      if (typeof timeFormatter !== "function") {
        throw new DeveloperError("timeFormatter must be a function");
      }
      //>>includeEnd('debug');

      this._timeFormatter = timeFormatter;
    },
  },
});

//Currently exposed for tests.
AnimationViewModel._maxShuttleRingAngle = maxShuttleRingAngle;
AnimationViewModel._realtimeShuttleRingAngle = realtimeShuttleRingAngle;

/**
 * 设置显示日期格式的函数.
 * @callback AnimationViewModel.DateFormatter
 *
 * @param {JulianDate} date 要格式化的日期.
 * @param {AnimationViewModel} viewModel 请求格式设置的 AnimationViewModel 实例.
 * @returns {string} 所提供日期的日历日期部分的字符串表示形式.
 */

/**
 * 设置显示时间格式的函数.
 * @callback AnimationViewModel.TimeFormatter
 *
 * @param {JulianDate} date 要格式化的日期.
 * @param {AnimationViewModel} viewModel 请求格式设置的 AnimationViewModel 实例.
 * @returns {string} 所提供日期的时间部分的字符串表示形式.
 */
export default AnimationViewModel;
