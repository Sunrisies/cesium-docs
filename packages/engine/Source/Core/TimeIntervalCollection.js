import binarySearch from "./binarySearch.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import GregorianDate from "./GregorianDate.js";
import isLeapYear from "./isLeapYear.js";
import Iso8601 from "./Iso8601.js";
import JulianDate from "./JulianDate.js";
import TimeInterval from "./TimeInterval.js";

function compareIntervalStartTimes(left, right) {
  return JulianDate.compare(left.start, right.start);
}

/**
 * 一个不重叠的 {@link TimeInterval} 实例集合，按开始时间排序。
 * @alias TimeIntervalCollection
 * @constructor
 *
 * @param {TimeInterval[]} [intervals] 要添加到集合的区间数组。
 */

function TimeIntervalCollection(intervals) {
  this._intervals = [];
  this._changedEvent = new Event();

  if (defined(intervals)) {
    const length = intervals.length;
    for (let i = 0; i < length; i++) {
      this.addInterval(intervals[i]);
    }
  }
}

Object.defineProperties(TimeIntervalCollection.prototype, {
  /**
   * 获取每当区间集合发生变化时触发的事件。
   * @memberof TimeIntervalCollection.prototype
   * @type {Event}
   * @readonly
   */
  changedEvent: {
    get: function () {
      return this._changedEvent;
    },
  },

  /**
   * 获取集合的开始时间。
   * @memberof TimeIntervalCollection.prototype
   * @type {JulianDate}
   * @readonly
   */
  start: {
    get: function () {
      const intervals = this._intervals;
      return intervals.length === 0 ? undefined : intervals[0].start;
    },
  },

  /**
   * 获取开始时间是否包含在集合中。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isStartIncluded: {
    get: function () {
      const intervals = this._intervals;
      return intervals.length === 0 ? false : intervals[0].isStartIncluded;
    },
  },

  /**
   * 获取集合的结束时间。
   * @memberof TimeIntervalCollection.prototype
   * @type {JulianDate}
   * @readonly
   */
  stop: {
    get: function () {
      const intervals = this._intervals;
      const length = intervals.length;
      return length === 0 ? undefined : intervals[length - 1].stop;
    },
  },

  /**
   * 获取结束时间是否包含在集合中。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isStopIncluded: {
    get: function () {
      const intervals = this._intervals;
      const length = intervals.length;
      return length === 0 ? false : intervals[length - 1].isStopIncluded;
    },
  },

  /**
   * 获取集合中的区间数量。
   * @memberof TimeIntervalCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._intervals.length;
    },
  },

  /**
   * 获取集合是否为空。
   * @memberof TimeIntervalCollection.prototype
   * @type {boolean}
   * @readonly
   */
  isEmpty: {
    get: function () {
      return this._intervals.length === 0;
    },
  },
});


/**
 * 将此实例与提供的实例逐个比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {TimeIntervalCollection} [right] 右侧集合。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */

TimeIntervalCollection.prototype.equals = function (right, dataComparer) {
  if (this === right) {
    return true;
  }
  if (!(right instanceof TimeIntervalCollection)) {
    return false;
  }
  const intervals = this._intervals;
  const rightIntervals = right._intervals;
  const length = intervals.length;
  if (length !== rightIntervals.length) {
    return false;
  }
  for (let i = 0; i < length; i++) {
    if (!TimeInterval.equals(intervals[i], rightIntervals[i], dataComparer)) {
      return false;
    }
  }
  return true;
};

/**
 * 获取指定索引处的区间。
 *
 * @param {number} index 要检索的区间的索引。
 * @returns {TimeInterval|undefined} 指定索引处的区间，如果该索引没有区间，则返回 <code>undefined</code>。
 */
TimeIntervalCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._intervals[index];
};

/**
 * 从集合中移除所有区间。
 */

TimeIntervalCollection.prototype.removeAll = function () {
  if (this._intervals.length > 0) {
    this._intervals.length = 0;
    this._changedEvent.raiseEvent(this);
  }
};

/**
 * 查找并返回包含指定日期的区间。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {TimeInterval|undefined} 包含指定日期的区间，如果没有这样的区间，则返回 <code>undefined</code>。
 */
TimeIntervalCollection.prototype.findIntervalContainingDate = function (date) {
  const index = this.indexOf(date);
  return index >= 0 ? this._intervals[index] : undefined;
};

/**
 * 查找并返回包含指定日期的区间的数据。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {object} 包含指定日期的区间的数据，如果没有这样的区间，则返回 <code>undefined</code>。
 */

TimeIntervalCollection.prototype.findDataForIntervalContainingDate = function (
  date,
) {
  const index = this.indexOf(date);
  return index >= 0 ? this._intervals[index].data : undefined;
};

/**
 * 检查指定日期是否在此集合内。
 *
 * @param {JulianDate} julianDate 要检查的日期。
 * @returns {boolean} 如果集合包含指定日期，则为 <code>true</code>；否则为 <code>false</code>。
 */
TimeIntervalCollection.prototype.contains = function (julianDate) {
  return this.indexOf(julianDate) >= 0;
};

const indexOfScratch = new TimeInterval();

/**
 * 查找并返回包含指定日期的区间在集合中的索引。
 *
 * @param {JulianDate} date 要搜索的日期。
 * @returns {number} 包含指定日期的区间的索引，如果没有这样的区间，
 * 返回一个负数，该负数是下一个在日期之后开始的区间索引的按位补码；如果没有区间在指定日期之后开始，则返回集合长度的按位补码。
 */

TimeIntervalCollection.prototype.indexOf = function (date) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required");
  }
  //>>includeEnd('debug');

  const intervals = this._intervals;
  indexOfScratch.start = date;
  indexOfScratch.stop = date;
  let index = binarySearch(
    intervals,
    indexOfScratch,
    compareIntervalStartTimes,
  );
  if (index >= 0) {
    if (intervals[index].isStartIncluded) {
      return index;
    }

    if (
      index > 0 &&
      intervals[index - 1].stop.equals(date) &&
      intervals[index - 1].isStopIncluded
    ) {
      return index - 1;
    }
    return ~index;
  }

  index = ~index;
  if (
    index > 0 &&
    index - 1 < intervals.length &&
    TimeInterval.contains(intervals[index - 1], date)
  ) {
    return index - 1;
  }
  return ~index;
};

/**
 * 返回集合中第一个匹配指定参数的区间。
 * 所有参数都是可选的，<code>undefined</code> 参数被视为不关心条件。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {JulianDate} [options.start] 区间的开始时间。
 * @param {JulianDate} [options.stop] 区间的结束时间。
 * @param {boolean} [options.isStartIncluded] 如果 <code>options.start</code> 包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded] 如果 <code>options.stop</code> 包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @returns {TimeInterval|undefined} 集合中第一个匹配指定参数的区间。
 */

TimeIntervalCollection.prototype.findInterval = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const start = options.start;
  const stop = options.stop;
  const isStartIncluded = options.isStartIncluded;
  const isStopIncluded = options.isStopIncluded;

  const intervals = this._intervals;
  for (let i = 0, len = intervals.length; i < len; i++) {
    const interval = intervals[i];
    if (
      (!defined(start) || interval.start.equals(start)) &&
      (!defined(stop) || interval.stop.equals(stop)) &&
      (!defined(isStartIncluded) ||
        interval.isStartIncluded === isStartIncluded) &&
      (!defined(isStopIncluded) || interval.isStopIncluded === isStopIncluded)
    ) {
      return intervals[i];
    }
  }
  return undefined;
};

/**
 * 将一个区间添加到集合中，合并包含相同数据的区间，
 * 并在需要时拆分不同数据的区间，以保持一个不重叠的集合。
 * 新区间中的数据优先于集合中任何现有区间的数据。
 *
 * @param {TimeInterval} interval 要添加的区间。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 */

TimeIntervalCollection.prototype.addInterval = function (
  interval,
  dataComparer,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(interval)) {
    throw new DeveloperError("interval is required");
  }
  //>>includeEnd('debug');

  if (interval.isEmpty) {
    return;
  }

  const intervals = this._intervals;

  // Handle the common case quickly: we're adding a new interval which is after all existing intervals.
  if (
    intervals.length === 0 ||
    JulianDate.greaterThan(interval.start, intervals[intervals.length - 1].stop)
  ) {
    intervals.push(interval);
    this._changedEvent.raiseEvent(this);
    return;
  }

  // Keep the list sorted by the start date
  let index = binarySearch(intervals, interval, compareIntervalStartTimes);
  if (index < 0) {
    index = ~index;
  } else {
    // interval's start date exactly equals the start date of at least one interval in the collection.
    // It could actually equal the start date of two intervals if one of them does not actually
    // include the date.  In that case, the binary search could have found either.  We need to
    // look at the surrounding intervals and their IsStartIncluded properties in order to make sure
    // we're working with the correct interval.

    // eslint-disable-next-line no-lonely-if
    if (
      index > 0 &&
      interval.isStartIncluded &&
      intervals[index - 1].isStartIncluded &&
      intervals[index - 1].start.equals(interval.start)
    ) {
      --index;
    } else if (
      index < intervals.length &&
      !interval.isStartIncluded &&
      intervals[index].isStartIncluded &&
      intervals[index].start.equals(interval.start)
    ) {
      ++index;
    }
  }

  let comparison;
  if (index > 0) {
    // Not the first thing in the list, so see if the interval before this one
    // overlaps this one.

    comparison = JulianDate.compare(intervals[index - 1].stop, interval.start);
    if (
      comparison > 0 ||
      (comparison === 0 &&
        (intervals[index - 1].isStopIncluded || interval.isStartIncluded))
    ) {
      // There is an overlap
      if (
        defined(dataComparer)
          ? dataComparer(intervals[index - 1].data, interval.data)
          : intervals[index - 1].data === interval.data
      ) {
        // Overlapping intervals have the same data, so combine them
        if (JulianDate.greaterThan(interval.stop, intervals[index - 1].stop)) {
          interval = new TimeInterval({
            start: intervals[index - 1].start,
            stop: interval.stop,
            isStartIncluded: intervals[index - 1].isStartIncluded,
            isStopIncluded: interval.isStopIncluded,
            data: interval.data,
          });
        } else {
          interval = new TimeInterval({
            start: intervals[index - 1].start,
            stop: intervals[index - 1].stop,
            isStartIncluded: intervals[index - 1].isStartIncluded,
            isStopIncluded:
              intervals[index - 1].isStopIncluded ||
              (interval.stop.equals(intervals[index - 1].stop) &&
                interval.isStopIncluded),
            data: interval.data,
          });
        }
        intervals.splice(index - 1, 1);
        --index;
      } else {
        // Overlapping intervals have different data.  The new interval
        // being added 'wins' so truncate the previous interval.
        // If the existing interval extends past the end of the new one,
        // split the existing interval into two intervals.
        comparison = JulianDate.compare(
          intervals[index - 1].stop,
          interval.stop,
        );
        if (
          comparison > 0 ||
          (comparison === 0 &&
            intervals[index - 1].isStopIncluded &&
            !interval.isStopIncluded)
        ) {
          intervals.splice(
            index,
            0,
            new TimeInterval({
              start: interval.stop,
              stop: intervals[index - 1].stop,
              isStartIncluded: !interval.isStopIncluded,
              isStopIncluded: intervals[index - 1].isStopIncluded,
              data: intervals[index - 1].data,
            }),
          );
        }
        intervals[index - 1] = new TimeInterval({
          start: intervals[index - 1].start,
          stop: interval.start,
          isStartIncluded: intervals[index - 1].isStartIncluded,
          isStopIncluded: !interval.isStartIncluded,
          data: intervals[index - 1].data,
        });
      }
    }
  }

  while (index < intervals.length) {
    // Not the last thing in the list, so see if the intervals after this one overlap this one.
    comparison = JulianDate.compare(interval.stop, intervals[index].start);
    if (
      comparison > 0 ||
      (comparison === 0 &&
        (interval.isStopIncluded || intervals[index].isStartIncluded))
    ) {
      // There is an overlap
      if (
        defined(dataComparer)
          ? dataComparer(intervals[index].data, interval.data)
          : intervals[index].data === interval.data
      ) {
        // Overlapping intervals have the same data, so combine them
        interval = new TimeInterval({
          start: interval.start,
          stop: JulianDate.greaterThan(intervals[index].stop, interval.stop)
            ? intervals[index].stop
            : interval.stop,
          isStartIncluded: interval.isStartIncluded,
          isStopIncluded: JulianDate.greaterThan(
            intervals[index].stop,
            interval.stop,
          )
            ? intervals[index].isStopIncluded
            : interval.isStopIncluded,
          data: interval.data,
        });
        intervals.splice(index, 1);
      } else {
        // Overlapping intervals have different data.  The new interval
        // being added 'wins' so truncate the next interval.
        intervals[index] = new TimeInterval({
          start: interval.stop,
          stop: intervals[index].stop,
          isStartIncluded: !interval.isStopIncluded,
          isStopIncluded: intervals[index].isStopIncluded,
          data: intervals[index].data,
        });

        if (intervals[index].isEmpty) {
          intervals.splice(index, 1);
        } else {
          // Found a partial span, so it is not possible for the next
          // interval to be spanned at all.  Stop looking.
          break;
        }
      }
    } else {
      // Found the last one we're spanning, so stop looking.
      break;
    }
  }

  // Add the new interval
  intervals.splice(index, 0, interval);
  this._changedEvent.raiseEvent(this);
};

/**
 * 从此区间集合中移除指定的区间，在指定区间上创建一个空洞。
 * 输入区间的数据属性将被忽略。
 *
 * @param {TimeInterval} interval 要移除的区间。
 * @returns {boolean} 如果区间被移除，则返回 <code>true</code>；如果该区间没有部分在集合中，则返回 <code>false</code>。
 */

TimeIntervalCollection.prototype.removeInterval = function (interval) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(interval)) {
    throw new DeveloperError("interval is required");
  }
  //>>includeEnd('debug');

  if (interval.isEmpty) {
    return false;
  }

  const intervals = this._intervals;

  let index = binarySearch(intervals, interval, compareIntervalStartTimes);
  if (index < 0) {
    index = ~index;
  }

  let result = false;

  // Check for truncation of the end of the previous interval.
  if (
    index > 0 &&
    (JulianDate.greaterThan(intervals[index - 1].stop, interval.start) ||
      (intervals[index - 1].stop.equals(interval.start) &&
        intervals[index - 1].isStopIncluded &&
        interval.isStartIncluded))
  ) {
    result = true;

    if (
      JulianDate.greaterThan(intervals[index - 1].stop, interval.stop) ||
      (intervals[index - 1].isStopIncluded &&
        !interval.isStopIncluded &&
        intervals[index - 1].stop.equals(interval.stop))
    ) {
      // Break the existing interval into two pieces
      intervals.splice(
        index,
        0,
        new TimeInterval({
          start: interval.stop,
          stop: intervals[index - 1].stop,
          isStartIncluded: !interval.isStopIncluded,
          isStopIncluded: intervals[index - 1].isStopIncluded,
          data: intervals[index - 1].data,
        }),
      );
    }
    intervals[index - 1] = new TimeInterval({
      start: intervals[index - 1].start,
      stop: interval.start,
      isStartIncluded: intervals[index - 1].isStartIncluded,
      isStopIncluded: !interval.isStartIncluded,
      data: intervals[index - 1].data,
    });
  }

  // Check if the Start of the current interval should remain because interval.start is the same but
  // it is not included.
  if (
    index < intervals.length &&
    !interval.isStartIncluded &&
    intervals[index].isStartIncluded &&
    interval.start.equals(intervals[index].start)
  ) {
    result = true;

    intervals.splice(
      index,
      0,
      new TimeInterval({
        start: intervals[index].start,
        stop: intervals[index].start,
        isStartIncluded: true,
        isStopIncluded: true,
        data: intervals[index].data,
      }),
    );
    ++index;
  }

  // Remove any intervals that are completely overlapped by the input interval.
  while (
    index < intervals.length &&
    JulianDate.greaterThan(interval.stop, intervals[index].stop)
  ) {
    result = true;
    intervals.splice(index, 1);
  }

  // Check for the case where the input interval ends on the same date
  // as an existing interval.
  if (index < intervals.length && interval.stop.equals(intervals[index].stop)) {
    result = true;

    if (!interval.isStopIncluded && intervals[index].isStopIncluded) {
      // Last point of interval should remain because the stop date is included in
      // the existing interval but is not included in the input interval.
      if (
        index + 1 < intervals.length &&
        intervals[index + 1].start.equals(interval.stop) &&
        intervals[index].data === intervals[index + 1].data
      ) {
        // Combine single point with the next interval
        intervals.splice(index, 1);
        intervals[index] = new TimeInterval({
          start: intervals[index].start,
          stop: intervals[index].stop,
          isStartIncluded: true,
          isStopIncluded: intervals[index].isStopIncluded,
          data: intervals[index].data,
        });
      } else {
        intervals[index] = new TimeInterval({
          start: interval.stop,
          stop: interval.stop,
          isStartIncluded: true,
          isStopIncluded: true,
          data: intervals[index].data,
        });
      }
    } else {
      // Interval is completely overlapped
      intervals.splice(index, 1);
    }
  }

  // Truncate any partially-overlapped intervals.
  if (
    index < intervals.length &&
    (JulianDate.greaterThan(interval.stop, intervals[index].start) ||
      (interval.stop.equals(intervals[index].start) &&
        interval.isStopIncluded &&
        intervals[index].isStartIncluded))
  ) {
    result = true;
    intervals[index] = new TimeInterval({
      start: interval.stop,
      stop: intervals[index].stop,
      isStartIncluded: !interval.isStopIncluded,
      isStopIncluded: intervals[index].isStopIncluded,
      data: intervals[index].data,
    });
  }

  if (result) {
    this._changedEvent.raiseEvent(this);
  }

  return result;
};

/**
 * 创建一个新实例，该实例是此集合与提供的集合的交集。
 *
 * @param {TimeIntervalCollection} other 要与之交集的集合。
 * @param {TimeInterval.DataComparer} [dataComparer] 一个比较两个区间数据的函数。如果省略，则使用引用相等性。
 * @param {TimeInterval.MergeCallback} [mergeCallback] 一个合并两个区间数据的函数。如果省略，将使用左侧区间的数据。
 * @returns {TimeIntervalCollection} 一个新创建的 TimeIntervalCollection，该集合是此集合与提供的集合的交集。
 */

TimeIntervalCollection.prototype.intersect = function (
  other,
  dataComparer,
  mergeCallback,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(other)) {
    throw new DeveloperError("other is required.");
  }
  //>>includeEnd('debug');

  const result = new TimeIntervalCollection();
  let left = 0;
  let right = 0;
  const intervals = this._intervals;
  const otherIntervals = other._intervals;

  while (left < intervals.length && right < otherIntervals.length) {
    const leftInterval = intervals[left];
    const rightInterval = otherIntervals[right];
    if (JulianDate.lessThan(leftInterval.stop, rightInterval.start)) {
      ++left;
    } else if (JulianDate.lessThan(rightInterval.stop, leftInterval.start)) {
      ++right;
    } else {
      // The following will return an intersection whose data is 'merged' if the callback is defined
      if (
        defined(mergeCallback) ||
        (defined(dataComparer) &&
          dataComparer(leftInterval.data, rightInterval.data)) ||
        (!defined(dataComparer) && rightInterval.data === leftInterval.data)
      ) {
        const intersection = TimeInterval.intersect(
          leftInterval,
          rightInterval,
          new TimeInterval(),
          mergeCallback,
        );
        if (!intersection.isEmpty) {
          // Since we start with an empty collection for 'result', and there are no overlapping intervals in 'this' (as a rule),
          // the 'intersection' will never overlap with a previous interval in 'result'.  So, no need to do any additional 'merging'.
          result.addInterval(intersection, dataComparer);
        }
      }

      if (
        JulianDate.lessThan(leftInterval.stop, rightInterval.stop) ||
        (leftInterval.stop.equals(rightInterval.stop) &&
          !leftInterval.isStopIncluded &&
          rightInterval.isStopIncluded)
      ) {
        ++left;
      } else {
        ++right;
      }
    }
  }
  return result;
};

/**
 * 从 JulianDate 数组创建一个新实例。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {JulianDate[]} options.julianDates 一组 ISO 8601 日期的数组。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果结束时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加一个从 Iso8601.MINIMUM_VALUE 到开始时间的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加一个从结束时间到 Iso8601.MAXIMUM_VALUE 的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个返回数据的函数，该函数在每个区间被添加到集合之前被调用。如果未指定，则数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

TimeIntervalCollection.fromJulianDateArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.julianDates)) {
    throw new DeveloperError("options.iso8601Array is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new TimeIntervalCollection();
  }

  const julianDates = options.julianDates;
  const length = julianDates.length;
  const dataCallback = options.dataCallback;

  const isStartIncluded = defaultValue(options.isStartIncluded, true);
  const isStopIncluded = defaultValue(options.isStopIncluded, true);
  const leadingInterval = defaultValue(options.leadingInterval, false);
  const trailingInterval = defaultValue(options.trailingInterval, false);
  let interval;

  // Add a default interval, which will only end up being used up to first interval
  let startIndex = 0;
  if (leadingInterval) {
    ++startIndex;
    interval = new TimeInterval({
      start: Iso8601.MINIMUM_VALUE,
      stop: julianDates[0],
      isStartIncluded: true,
      isStopIncluded: !isStartIncluded,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);
  }

  for (let i = 0; i < length - 1; ++i) {
    let startDate = julianDates[i];
    const endDate = julianDates[i + 1];

    interval = new TimeInterval({
      start: startDate,
      stop: endDate,
      isStartIncluded: result.length === startIndex ? isStartIncluded : true,
      isStopIncluded: i === length - 2 ? isStopIncluded : false,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);

    startDate = endDate;
  }

  if (trailingInterval) {
    interval = new TimeInterval({
      start: julianDates[length - 1],
      stop: Iso8601.MAXIMUM_VALUE,
      isStartIncluded: !isStopIncluded,
      isStopIncluded: true,
    });
    interval.data = defined(dataCallback)
      ? dataCallback(interval, result.length)
      : result.length;
    result.addInterval(interval);
  }

  return result;
};

const scratchGregorianDate = new GregorianDate();
const monthLengths = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * 将以 GregorianDate 表示的持续时间添加到 JulianDate。
 *
 * @param {JulianDate} julianDate 日期。
 * @param {GregorianDate} duration 作为 GregorianDate 表示的持续时间。
 * @param {JulianDate} result 用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数。
 *
 * @private
 */

function addToDate(julianDate, duration, result) {
  if (!defined(result)) {
    result = new JulianDate();
  }
  JulianDate.toGregorianDate(julianDate, scratchGregorianDate);

  let millisecond = scratchGregorianDate.millisecond + duration.millisecond;
  let second = scratchGregorianDate.second + duration.second;
  let minute = scratchGregorianDate.minute + duration.minute;
  let hour = scratchGregorianDate.hour + duration.hour;
  let day = scratchGregorianDate.day + duration.day;
  let month = scratchGregorianDate.month + duration.month;
  let year = scratchGregorianDate.year + duration.year;

  if (millisecond >= 1000) {
    second += Math.floor(millisecond / 1000);
    millisecond = millisecond % 1000;
  }

  if (second >= 60) {
    minute += Math.floor(second / 60);
    second = second % 60;
  }

  if (minute >= 60) {
    hour += Math.floor(minute / 60);
    minute = minute % 60;
  }

  if (hour >= 24) {
    day += Math.floor(hour / 24);
    hour = hour % 24;
  }

  // If days is greater than the month's length we need to remove those number of days,
  //  readjust month and year and repeat until days is less than the month's length.
  monthLengths[2] = isLeapYear(year) ? 29 : 28;
  while (day > monthLengths[month] || month >= 13) {
    if (day > monthLengths[month]) {
      day -= monthLengths[month];
      ++month;
    }

    if (month >= 13) {
      --month;
      year += Math.floor(month / 12);
      month = month % 12;
      ++month;
    }

    monthLengths[2] = isLeapYear(year) ? 29 : 28;
  }

  scratchGregorianDate.millisecond = millisecond;
  scratchGregorianDate.second = second;
  scratchGregorianDate.minute = minute;
  scratchGregorianDate.hour = hour;
  scratchGregorianDate.day = day;
  scratchGregorianDate.month = month;
  scratchGregorianDate.year = year;

  return JulianDate.fromGregorianDate(scratchGregorianDate, result);
}

const scratchJulianDate = new JulianDate();
const durationRegex =
  /P(?:([\d.,]+)Y)?(?:([\d.,]+)M)?(?:([\d.,]+)W)?(?:([\d.,]+)D)?(?:T(?:([\d.,]+)H)?(?:([\d.,]+)M)?(?:([\d.,]+)S)?)?/;

/**
 * 解析 ISO8601 持续时间字符串。
 *
 * @param {string} iso8601 一个 ISO 8601 持续时间。
 * @param {GregorianDate} result 用于结果的现有实例。
 * @returns {boolean} 解析成功返回 true，失败则返回 false。
 *
 * @private
 */

function parseDuration(iso8601, result) {
  if (!defined(iso8601) || iso8601.length === 0) {
    return false;
  }

  // Reset object
  result.year = 0;
  result.month = 0;
  result.day = 0;
  result.hour = 0;
  result.minute = 0;
  result.second = 0;
  result.millisecond = 0;

  if (iso8601[0] === "P") {
    const matches = iso8601.match(durationRegex);
    if (!defined(matches)) {
      return false;
    }
    if (defined(matches[1])) {
      // Years
      result.year = Number(matches[1].replace(",", "."));
    }
    if (defined(matches[2])) {
      // Months
      result.month = Number(matches[2].replace(",", "."));
    }
    if (defined(matches[3])) {
      // Weeks
      result.day = Number(matches[3].replace(",", ".")) * 7;
    }
    if (defined(matches[4])) {
      // Days
      result.day += Number(matches[4].replace(",", "."));
    }
    if (defined(matches[5])) {
      // Hours
      result.hour = Number(matches[5].replace(",", "."));
    }
    if (defined(matches[6])) {
      // Weeks
      result.minute = Number(matches[6].replace(",", "."));
    }
    if (defined(matches[7])) {
      // Seconds
      const seconds = Number(matches[7].replace(",", "."));
      result.second = Math.floor(seconds);
      result.millisecond = (seconds % 1) * 1000;
    }
  } else {
    // They can technically specify the duration as a normal date with some caveats. Try our best to load it.
    if (iso8601[iso8601.length - 1] !== "Z") {
      // It's not a date, its a duration, so it always has to be UTC
      iso8601 += "Z";
    }
    JulianDate.toGregorianDate(
      JulianDate.fromIso8601(iso8601, scratchJulianDate),
      result,
    );
  }

  // A duration of 0 will cause an infinite loop, so just make sure something is non-zero
  return (
    result.year ||
    result.month ||
    result.day ||
    result.hour ||
    result.minute ||
    result.second ||
    result.millisecond
  );
}

const scratchDuration = new GregorianDate();
/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 时间区间（开始/结束/持续时间）创建一个新实例。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} options.iso8601 一个 ISO 8601 区间。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果结束时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加一个从 Iso8601.MINIMUM_VALUE 到开始时间的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加一个从结束时间到 Iso8601.MAXIMUM_VALUE 的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个返回数据的函数，该函数在每个区间被添加到集合之前被调用。如果未指定，则数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

TimeIntervalCollection.fromIso8601 = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.iso8601)) {
    throw new DeveloperError("options.iso8601 is required.");
  }
  //>>includeEnd('debug');

  const dates = options.iso8601.split("/");
  const start = JulianDate.fromIso8601(dates[0]);
  const stop = JulianDate.fromIso8601(dates[1]);
  const julianDates = [];

  if (!parseDuration(dates[2], scratchDuration)) {
    julianDates.push(start, stop);
  } else {
    let date = JulianDate.clone(start);
    julianDates.push(date);
    while (JulianDate.compare(date, stop) < 0) {
      date = addToDate(date, scratchDuration);
      const afterStop = JulianDate.compare(stop, date) <= 0;
      if (afterStop) {
        JulianDate.clone(stop, date);
      }

      julianDates.push(date);
    }
  }

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: julianDates,
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};

/**
 * 从一个 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 日期数组创建一个新实例。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string[]} options.iso8601Dates 一个 ISO 8601 日期的数组。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果结束时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加一个从 Iso8601.MINIMUM_VALUE 到开始时间的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加一个从结束时间到 Iso8601.MAXIMUM_VALUE 的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个返回数据的函数，该函数在每个区间被添加到集合之前被调用。如果未指定，则数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

TimeIntervalCollection.fromIso8601DateArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.iso8601Dates)) {
    throw new DeveloperError("options.iso8601Dates is required.");
  }
  //>>includeEnd('debug');

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: options.iso8601Dates.map(function (date) {
        return JulianDate.fromIso8601(date);
      }),
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};

/**
 * 从一个 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 持续时间数组创建一个新实例。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {JulianDate} options.epoch 持续时间相对于的日期。
 * @param {string} options.iso8601Durations 一个 ISO 8601 持续时间的数组。
 * @param {boolean} [options.relativeToPrevious=false] 如果持续时间相对于前一个日期，则为 <code>true</code>；如果始终相对于纪元，则为 <code>false</code>。
 * @param {boolean} [options.isStartIncluded=true] 如果开始时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.isStopIncluded=true] 如果结束时间包含在区间内，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.leadingInterval=false] 如果要添加一个从 Iso8601.MINIMUM_VALUE 到开始时间的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {boolean} [options.trailingInterval=false] 如果要添加一个从结束时间到 Iso8601.MAXIMUM_VALUE 的区间，则为 <code>true</code>；否则为 <code>false</code>。
 * @param {Function} [options.dataCallback] 一个返回数据的函数，该函数在每个区间被添加到集合之前被调用。如果未指定，则数据将是集合中的索引。
 * @param {TimeIntervalCollection} [result] 用于结果的现有实例。
 * @returns {TimeIntervalCollection} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

TimeIntervalCollection.fromIso8601DurationArray = function (options, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options)) {
    throw new DeveloperError("options is required.");
  }
  if (!defined(options.epoch)) {
    throw new DeveloperError("options.epoch is required.");
  }
  if (!defined(options.iso8601Durations)) {
    throw new DeveloperError("options.iso8601Durations is required.");
  }
  //>>includeEnd('debug');

  const epoch = options.epoch;
  const iso8601Durations = options.iso8601Durations;
  const relativeToPrevious = defaultValue(options.relativeToPrevious, false);
  const julianDates = [];
  let date, previousDate;

  const length = iso8601Durations.length;
  for (let i = 0; i < length; ++i) {
    // Allow a duration of 0 on the first iteration, because then it is just the epoch
    if (parseDuration(iso8601Durations[i], scratchDuration) || i === 0) {
      if (relativeToPrevious && defined(previousDate)) {
        date = addToDate(previousDate, scratchDuration);
      } else {
        date = addToDate(epoch, scratchDuration);
      }
      julianDates.push(date);
      previousDate = date;
    }
  }

  return TimeIntervalCollection.fromJulianDateArray(
    {
      julianDates: julianDates,
      isStartIncluded: options.isStartIncluded,
      isStopIncluded: options.isStopIncluded,
      leadingInterval: options.leadingInterval,
      trailingInterval: options.trailingInterval,
      dataCallback: options.dataCallback,
    },
    result,
  );
};
export default TimeIntervalCollection;
