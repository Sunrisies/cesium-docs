import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import JulianDate from "./JulianDate.js";

/**
 * 由开始和结束时间定义的区间；可选择地将这些时间包括在区间内。
 * 可以选择性地将任意数据与每个实例关联，以便与 {@link TimeIntervalCollection} 一起使用。
 *
 * @alias TimeInterval
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {JulianDate} [options.start=new JulianDate()] 区间的开始时间。
 * @param {JulianDate} [options.stop=new JulianDate()] 区间的结束时间。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在区间内，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在区间内，则为 <code>true</code>，否则为 <code>false</code>。
 * @param {object} [options.data] 与此区间关联的任意数据。
 *
 * @example
 * // Create an instance that spans August 1st, 1980 and is associated
 * // with a Cartesian position.
 * const timeInterval = new Cesium.TimeInterval({
 *     start : Cesium.JulianDate.fromIso8601('1980-08-01T00:00:00Z'),
 *     stop : Cesium.JulianDate.fromIso8601('1980-08-02T00:00:00Z'),
 *     isStartIncluded : true,
 *     isStopIncluded : false,
 *     data : Cesium.Cartesian3.fromDegrees(39.921037, -75.170082)
 * });
 *
 * @example
 * // Create two instances from ISO 8601 intervals with associated numeric data
 * // then compute their intersection, summing the data they contain.
 * const left = Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '2000/2010',
 *     data : 2
 * });
 *
 * const right = Cesium.TimeInterval.fromIso8601({
 *     iso8601 : '1995/2005',
 *     data : 3
 * });
 *
 * //The result of the below intersection will be an interval equivalent to
 * //const intersection = Cesium.TimeInterval.fromIso8601({
 * //  iso8601 : '2000/2005',
 * //  data : 5
 * //});
 * const intersection = new Cesium.TimeInterval();
 * Cesium.TimeInterval.intersect(left, right, intersection, function(leftData, rightData) {
 *     return leftData + rightData;
 * });
 *
 * @example
 * // Check if an interval contains a specific time.
 * const dateToCheck = Cesium.JulianDate.fromIso8601('1982-09-08T11:30:00Z');
 * const containsDate = Cesium.TimeInterval.contains(timeInterval, dateToCheck);
 */
function TimeInterval(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  /**
   * 获取或设置此区间的开始时间。
   * @type {JulianDate}
   */
  this.start = defined(options.start)
    ? JulianDate.clone(options.start)
    : new JulianDate();

  /**
   * 获取或设置此区间的结束时间。
   * @type {JulianDate}
   */
  this.stop = defined(options.stop)
    ? JulianDate.clone(options.stop)
    : new JulianDate();

  /**
   * 获取或设置与此区间关联的数据。
   * @type {*}
   */
  this.data = options.data;

  /**
   * 获取或设置开始时间是否包含在此区间内。
   * @type {boolean}
   * @default true
   */
  this.isStartIncluded = defaultValue(options.isStartIncluded, true);

  /**
   * 获取或设置结束时间是否包含在此区间内。
   * @type {boolean}
   * @default true
   */
  this.isStopIncluded = defaultValue(options.isStopIncluded, true);
}


Object.defineProperties(TimeInterval.prototype, {
  /**
   * 获取此区间是否为空。
   * @memberof TimeInterval.prototype
   * @type {boolean}
   * @readonly
   */

  isEmpty: {
    get: function () {
      const stopComparedToStart = JulianDate.compare(this.stop, this.start);
      return (
        stopComparedToStart < 0 ||
        (stopComparedToStart === 0 &&
          (!this.isStartIncluded || !this.isStopIncluded))
      );
    },
  },
});

const scratchInterval = {
  start: undefined,
  stop: undefined,
  isStartIncluded: undefined,
  isStopIncluded: undefined,
  data: undefined,
};

/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 区间创建一个新实例。
 *
 * @throws DeveloperError 如果 options.iso8601 不符合正确的格式。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} options.iso8601 一个ISO 8601区间。
 * @param {boolean} [options.isStartIncluded=true] 如果 <code>options.start</code> 包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果 <code>options.stop</code> 包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {object} [options.data] 与此区间关联的任意数据。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

TimeInterval.fromIso8601 = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.string("options.iso8601", options.iso8601);
  //>>includeEnd('debug');

  const dates = options.iso8601.split("/");
  if (dates.length !== 2) {
    throw new DeveloperError(
      "options.iso8601 is an invalid ISO 8601 interval.",
    );
  }
  const start = JulianDate.fromIso8601(dates[0]);
  const stop = JulianDate.fromIso8601(dates[1]);
  const isStartIncluded = defaultValue(options.isStartIncluded, true);
  const isStopIncluded = defaultValue(options.isStopIncluded, true);
  const data = options.data;

  if (!defined(result)) {
    scratchInterval.start = start;
    scratchInterval.stop = stop;
    scratchInterval.isStartIncluded = isStartIncluded;
    scratchInterval.isStopIncluded = isStopIncluded;
    scratchInterval.data = data;
    return new TimeInterval(scratchInterval);
  }

  result.start = start;
  result.stop = stop;
  result.isStartIncluded = isStartIncluded;
  result.isStopIncluded = isStopIncluded;
  result.data = data;
  return result;
};

/**
 * 创建提供的区间的ISO8601表示。
 *
 * @param {TimeInterval} timeInterval 要转换的区间。
 * @param {number} [precision] 用于表示秒组件的数字小数位数。默认情况下，使用最精确的表示。
 * @returns {string} 提供的区间的ISO8601表示。
 */

TimeInterval.toIso8601 = function (timeInterval, precision) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("timeInterval", timeInterval);
  //>>includeEnd('debug');

  return `${JulianDate.toIso8601(
    timeInterval.start,
    precision,
  )}/${JulianDate.toIso8601(timeInterval.stop, precision)}`;
};

/**
 * 复制提供的实例。
 *
 * @param {TimeInterval} [timeInterval] 要克隆的实例。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，如果未提供则返回一个新实例。
 */

TimeInterval.clone = function (timeInterval, result) {
  if (!defined(timeInterval)) {
    return undefined;
  }
  if (!defined(result)) {
    return new TimeInterval(timeInterval);
  }
  result.start = timeInterval.start;
  result.stop = timeInterval.stop;
  result.isStartIncluded = timeInterval.isStartIncluded;
  result.isStopIncluded = timeInterval.isStopIncluded;
  result.data = timeInterval.data;
  return result;
};

/**
 * 比较两个实例并返回如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {TimeInterval} [left] 第一个实例。
 * @param {TimeInterval} [right] 第二个实例。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果日期相等则为 <code>true</code>；否则为 <code>false</code>。
 */

TimeInterval.equals = function (left, right, dataComparer) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      ((left.isEmpty && right.isEmpty) ||
        (left.isStartIncluded === right.isStartIncluded &&
          left.isStopIncluded === right.isStopIncluded &&
          JulianDate.equals(left.start, right.start) &&
          JulianDate.equals(left.stop, right.stop) &&
          (left.data === right.data ||
            (defined(dataComparer) && dataComparer(left.data, right.data))))))
  );
};

/**
 * 比较两个实例并返回 <code>true</code> 如果它们在 <code>epsilon</code> 秒内相互靠近。也就是说，日期被视为相等（并且
 * 此函数返回 <code>true</code>），则它们之间的绝对差值（以秒为单位）必须小于 <code>epsilon</code>。
 *
 * @param {TimeInterval} [left] 第一个实例。
 * @param {TimeInterval} [right] 第二个实例。
 * @param {number} [epsilon=0] 应该将两个实例分开的最大秒数。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果两个日期在 <code>epsilon</code> 秒内相互靠近则为 <code>true</code>；否则为 <code>false</code>。
 */

TimeInterval.equalsEpsilon = function (left, right, epsilon, dataComparer) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      ((left.isEmpty && right.isEmpty) ||
        (left.isStartIncluded === right.isStartIncluded &&
          left.isStopIncluded === right.isStopIncluded &&
          JulianDate.equalsEpsilon(left.start, right.start, epsilon) &&
          JulianDate.equalsEpsilon(left.stop, right.stop, epsilon) &&
          (left.data === right.data ||
            (defined(dataComparer) && dataComparer(left.data, right.data))))))
  );
};

/**
 * 计算两个区间的交集，可选择性地合并它们的数据。
 *
 * @param {TimeInterval} left 第一个区间。
 * @param {TimeInterval} [right] 第二个区间。
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @param {TimeInterval.MergeCallback} [mergeCallback] 一个合并两个区间数据的函数。如果省略，将使用左侧区间的数据。
 * @returns {TimeInterval} 修改后的结果参数。
 */

TimeInterval.intersect = function (left, right, result, mergeCallback) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  //>>includeEnd('debug');

  if (!defined(right)) {
    return TimeInterval.clone(TimeInterval.EMPTY, result);
  }

  const leftStart = left.start;
  const leftStop = left.stop;

  const rightStart = right.start;
  const rightStop = right.stop;

  const intersectsStartRight =
    JulianDate.greaterThanOrEquals(rightStart, leftStart) &&
    JulianDate.greaterThanOrEquals(leftStop, rightStart);
  const intersectsStartLeft =
    !intersectsStartRight &&
    JulianDate.lessThanOrEquals(rightStart, leftStart) &&
    JulianDate.lessThanOrEquals(leftStart, rightStop);

  if (!intersectsStartRight && !intersectsStartLeft) {
    return TimeInterval.clone(TimeInterval.EMPTY, result);
  }

  const leftIsStartIncluded = left.isStartIncluded;
  const leftIsStopIncluded = left.isStopIncluded;
  const rightIsStartIncluded = right.isStartIncluded;
  const rightIsStopIncluded = right.isStopIncluded;
  const leftLessThanRight = JulianDate.lessThan(leftStop, rightStop);

  if (!defined(result)) {
    result = new TimeInterval();
  }

  result.start = intersectsStartRight ? rightStart : leftStart;
  result.isStartIncluded =
    (leftIsStartIncluded && rightIsStartIncluded) ||
    (!JulianDate.equals(rightStart, leftStart) &&
      ((intersectsStartRight && rightIsStartIncluded) ||
        (intersectsStartLeft && leftIsStartIncluded)));
  result.stop = leftLessThanRight ? leftStop : rightStop;
  result.isStopIncluded = leftLessThanRight
    ? leftIsStopIncluded
    : (leftIsStopIncluded && rightIsStopIncluded) ||
      (!JulianDate.equals(rightStop, leftStop) && rightIsStopIncluded);
  result.data = defined(mergeCallback)
    ? mergeCallback(left.data, right.data)
    : left.data;
  return result;
};

/**
 * 检查指定日期是否在提供的区间内。
 *
 * @param {TimeInterval} timeInterval 区间。
 * @param {JulianDate} julianDate 要检查的日期。
 * @returns {boolean} <code>true</code> 如果该区间包含指定日期，<code>false</code> 则返回否则。
 */

TimeInterval.contains = function (timeInterval, julianDate) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("timeInterval", timeInterval);
  Check.typeOf.object("julianDate", julianDate);
  //>>includeEnd('debug');

  if (timeInterval.isEmpty) {
    return false;
  }

  const startComparedToDate = JulianDate.compare(
    timeInterval.start,
    julianDate,
  );
  if (startComparedToDate === 0) {
    return timeInterval.isStartIncluded;
  }

  const dateComparedToStop = JulianDate.compare(julianDate, timeInterval.stop);
  if (dateComparedToStop === 0) {
    return timeInterval.isStopIncluded;
  }

  return startComparedToDate < 0 && dateComparedToStop < 0;
};

/**
 * 复制此实例。
 *
 * @param {TimeInterval} [result] 用于结果的现有实例。
 * @returns {TimeInterval} 修改后的结果参数，如果未提供则返回一个新实例。
 */
TimeInterval.prototype.clone = function (result) {
  return TimeInterval.clone(this, result);
};

/**
 * 将此实例与提供的实例逐个比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {TimeInterval} [right] 右侧区间。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */
TimeInterval.prototype.equals = function (right, dataComparer) {
  return TimeInterval.equals(this, right, dataComparer);
};

/**
 * 将此实例与提供的实例逐个比较，并返回
 * <code>true</code> 如果它们在提供的epsilon范围内，
 * <code>false</code> 则返回否则。
 *
 * @param {TimeInterval} [right] 右侧区间。
 * @param {number} [epsilon=0] 用于相等性测试的epsilon。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果它们在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */

TimeInterval.prototype.equalsEpsilon = function (right, epsilon, dataComparer) {
  return TimeInterval.equalsEpsilon(this, right, epsilon, dataComparer);
};

/**
 * 创建一个表示此TimeInterval的ISO8601格式的字符串。
 *
 * @returns {string} 一个表示此TimeInterval的ISO8601格式的字符串。
 */
TimeInterval.prototype.toString = function () {
  return TimeInterval.toIso8601(this);
};

/**
 * 一个不可变的空区间。
 *
 * @type {TimeInterval}
 * @constant
 */

TimeInterval.EMPTY = Object.freeze(
  new TimeInterval({
    start: new JulianDate(),
    stop: new JulianDate(),
    isStartIncluded: false,
    isStopIncluded: false,
  }),
);

/**
 * 合并区间数据的函数接口。
 * @callback TimeInterval.MergeCallback
 *
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {*} 合并两个数据实例的结果。
 */

/**
 * 比较区间数据的函数接口。
 * @callback TimeInterval.DataComparer
 * @param {*} leftData 第一个数据实例。
 * @param {*} rightData 第二个数据实例。
 * @returns {boolean} 如果提供的实例相等，则为 <code>true</code>；否则为 <code>false</code>。
 */

export default TimeInterval;
