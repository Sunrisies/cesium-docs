import binarySearch from "./binarySearch.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import GregorianDate from "./GregorianDate.js";
import isLeapYear from "./isLeapYear.js";
import LeapSecond from "./LeapSecond.js";
import TimeConstants from "./TimeConstants.js";
import TimeStandard from "./TimeStandard.js";

const gregorianDateScratch = new GregorianDate();
const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const daysInLeapFeburary = 29;

function compareLeapSecondDates(leapSecond, dateToFind) {
  return JulianDate.compare(leapSecond.julianDate, dateToFind.julianDate);
}

// we don't really need a leap second instance, anything with a julianDate property will do
const binarySearchScratchLeapSecond = new LeapSecond();

function convertUtcToTai(julianDate) {
  //Even though julianDate is in UTC, we'll treat it as TAI and
  //search the leap second table for it.
  binarySearchScratchLeapSecond.julianDate = julianDate;
  const leapSeconds = JulianDate.leapSeconds;
  let index = binarySearch(
    leapSeconds,
    binarySearchScratchLeapSecond,
    compareLeapSecondDates,
  );

  if (index < 0) {
    index = ~index;
  }

  if (index >= leapSeconds.length) {
    index = leapSeconds.length - 1;
  }

  let offset = leapSeconds[index].offset;
  if (index > 0) {
    //Now we have the index of the closest leap second that comes on or after our UTC time.
    //However, if the difference between the UTC date being converted and the TAI
    //defined leap second is greater than the offset, we are off by one and need to use
    //the previous leap second.
    const difference = JulianDate.secondsDifference(
      leapSeconds[index].julianDate,
      julianDate,
    );
    if (difference > offset) {
      index--;
      offset = leapSeconds[index].offset;
    }
  }

  JulianDate.addSeconds(julianDate, offset, julianDate);
}

function convertTaiToUtc(julianDate, result) {
  binarySearchScratchLeapSecond.julianDate = julianDate;
  const leapSeconds = JulianDate.leapSeconds;
  let index = binarySearch(
    leapSeconds,
    binarySearchScratchLeapSecond,
    compareLeapSecondDates,
  );
  if (index < 0) {
    index = ~index;
  }

  //All times before our first leap second get the first offset.
  if (index === 0) {
    return JulianDate.addSeconds(julianDate, -leapSeconds[0].offset, result);
  }

  //All times after our leap second get the last offset.
  if (index >= leapSeconds.length) {
    return JulianDate.addSeconds(
      julianDate,
      -leapSeconds[index - 1].offset,
      result,
    );
  }

  //Compute the difference between the found leap second and the time we are converting.
  const difference = JulianDate.secondsDifference(
    leapSeconds[index].julianDate,
    julianDate,
  );

  if (difference === 0) {
    //The date is in our leap second table.
    return JulianDate.addSeconds(
      julianDate,
      -leapSeconds[index].offset,
      result,
    );
  }

  if (difference <= 1.0) {
    //The requested date is during the moment of a leap second, then we cannot convert to UTC
    return undefined;
  }

  //The time is in between two leap seconds, index is the leap second after the date
  //we're converting, so we subtract one to get the correct LeapSecond instance.
  return JulianDate.addSeconds(
    julianDate,
    -leapSeconds[--index].offset,
    result,
  );
}

function setComponents(wholeDays, secondsOfDay, julianDate) {
  const extraDays = (secondsOfDay / TimeConstants.SECONDS_PER_DAY) | 0;
  wholeDays += extraDays;
  secondsOfDay -= TimeConstants.SECONDS_PER_DAY * extraDays;

  if (secondsOfDay < 0) {
    wholeDays--;
    secondsOfDay += TimeConstants.SECONDS_PER_DAY;
  }

  julianDate.dayNumber = wholeDays;
  julianDate.secondsOfDay = secondsOfDay;
  return julianDate;
}

function computeJulianDateComponents(
  year,
  month,
  day,
  hour,
  minute,
  second,
  millisecond,
) {
  // Algorithm from page 604 of the Explanatory Supplement to the
  // Astronomical Almanac (Seidelmann 1992).

  const a = ((month - 14) / 12) | 0;
  const b = year + 4800 + a;
  let dayNumber =
    (((1461 * b) / 4) | 0) +
    (((367 * (month - 2 - 12 * a)) / 12) | 0) -
    (((3 * (((b + 100) / 100) | 0)) / 4) | 0) +
    day -
    32075;

  // JulianDates are noon-based
  hour = hour - 12;
  if (hour < 0) {
    hour += 24;
  }

  const secondsOfDay =
    second +
    (hour * TimeConstants.SECONDS_PER_HOUR +
      minute * TimeConstants.SECONDS_PER_MINUTE +
      millisecond * TimeConstants.SECONDS_PER_MILLISECOND);

  if (secondsOfDay >= 43200.0) {
    dayNumber -= 1;
  }

  return [dayNumber, secondsOfDay];
}

//Regular expressions used for ISO8601 date parsing.
//YYYY
const matchCalendarYear = /^(\d{4})$/;
//YYYY-MM (YYYYMM is invalid)
const matchCalendarMonth = /^(\d{4})-(\d{2})$/;
//YYYY-DDD or YYYYDDD
const matchOrdinalDate = /^(\d{4})-?(\d{3})$/;
//YYYY-Www or YYYYWww or YYYY-Www-D or YYYYWwwD
const matchWeekDate = /^(\d{4})-?W(\d{2})-?(\d{1})?$/;
//YYYY-MM-DD or YYYYMMDD
const matchCalendarDate = /^(\d{4})-?(\d{2})-?(\d{2})$/;
// Match utc offset
const utcOffset = /([Z+\-])?(\d{2})?:?(\d{2})?$/;
// Match hours HH or HH.xxxxx
const matchHours = /^(\d{2})(\.\d+)?/.source + utcOffset.source;
// Match hours/minutes HH:MM HHMM.xxxxx
const matchHoursMinutes = /^(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;
// Match hours/minutes HH:MM:SS HHMMSS.xxxxx
const matchHoursMinutesSeconds =
  /^(\d{2}):?(\d{2}):?(\d{2})(\.\d+)?/.source + utcOffset.source;

const iso8601ErrorMessage = "Invalid ISO 8601 date.";

/**
 * 表示天文学的儒略日期，即自公元前4712年1月1日中午以来的天数（4713 BC）。
 * 为了提高精确度，此类将日期的整数部分和秒数部分存储在单独的组件中。 
 * 为了安全进行算术运算并表示闰秒，日期始终按照国际原子时间标准 {@link TimeStandard.TAI} 存储。
 * @alias JulianDate
 * @constructor
 *
 * @param {number} [julianDayNumber=0.0] 表示完整天数的儒略日数。 也会正确处理分数天。
 * @param {number} [secondsOfDay=0.0] 当前儒略日数内的秒数。 分数秒、负秒和大于一天的秒数都会被正确处理。
 * @param {TimeStandard} [timeStandard=TimeStandard.UTC] 首两个参数所定义的时间标准。
 */

function JulianDate(julianDayNumber, secondsOfDay, timeStandard) {
  /**
   * 获取或设置完整天数。
   * @type {number}
   */
  this.dayNumber = undefined;

  /**
   * 获取或设置当前日内的秒数。
   * @type {number}
   */
  this.secondsOfDay = undefined;

  julianDayNumber = defaultValue(julianDayNumber, 0.0);
  secondsOfDay = defaultValue(secondsOfDay, 0.0);
  timeStandard = defaultValue(timeStandard, TimeStandard.UTC);

  //If julianDayNumber is fractional, make it an integer and add the number of seconds the fraction represented.
  const wholeDays = julianDayNumber | 0;
  secondsOfDay =
    secondsOfDay +
    (julianDayNumber - wholeDays) * TimeConstants.SECONDS_PER_DAY;

  setComponents(wholeDays, secondsOfDay, this);

  if (timeStandard === TimeStandard.UTC) {
    convertUtcToTai(this);
  }
}

/**
 * 从 GregorianDate 创建一个新实例。
 *
 * @param {GregorianDate} date 一个 GregorianDate。
 * @param {JulianDate} [result] 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 *
 * @exception {DeveloperError} date 必须是有效的 GregorianDate。
 */

JulianDate.fromGregorianDate = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!(date instanceof GregorianDate)) {
    throw new DeveloperError("date must be a valid GregorianDate.");
  }
  //>>includeEnd('debug');

  const components = computeJulianDateComponents(
    date.year,
    date.month,
    date.day,
    date.hour,
    date.minute,
    date.second,
    date.millisecond,
  );
  if (!defined(result)) {
    return new JulianDate(components[0], components[1], TimeStandard.UTC);
  }
  setComponents(components[0], components[1], result);
  convertUtcToTai(result);
  return result;
};

/**
 * 从 JavaScript Date 创建一个新实例。
 *
 * @param {Date} date 一个 JavaScript Date 对象。
 * @param {JulianDate} [result] 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 *
 * @exception {DeveloperError} date 必须是有效的 JavaScript Date。
 */

JulianDate.fromDate = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new DeveloperError("date must be a valid JavaScript Date.");
  }
  //>>includeEnd('debug');

  const components = computeJulianDateComponents(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
  if (!defined(result)) {
    return new JulianDate(components[0], components[1], TimeStandard.UTC);
  }
  setComponents(components[0], components[1], result);
  convertUtcToTai(result);
  return result;
};

/**
 * 从 {@link http://en.wikipedia.org/wiki/ISO_8601|ISO 8601} 日期创建一个新实例。
 * 该方法优于 <code>Date.parse</code>，因为它将处理 ISO 8601 规范定义的所有有效格式，
 * 包括闰秒和子毫秒时间，而这些在大多数 JavaScript 实现中被忽略。
 *
 * @param {string} iso8601String 一个 ISO 8601 日期。
 * @param {JulianDate} [result] 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 *
 * @exception {DeveloperError} 无效的 ISO 8601 日期。
 */

JulianDate.fromIso8601 = function (iso8601String, result) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof iso8601String !== "string") {
    throw new DeveloperError(iso8601ErrorMessage);
  }
  //>>includeEnd('debug');

  //Comma and decimal point both indicate a fractional number according to ISO 8601,
  //start out by blanket replacing , with . which is the only valid such symbol in JS.
  iso8601String = iso8601String.replace(",", ".");

  //Split the string into its date and time components, denoted by a mandatory T
  let tokens = iso8601String.split("T");
  let year;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let millisecond = 0;

  //Lacking a time is okay, but a missing date is illegal.
  const date = tokens[0];
  const time = tokens[1];
  let tmp;
  let inLeapYear;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError(iso8601ErrorMessage);
  }

  let dashCount;
  //>>includeEnd('debug');

  //First match the date against possible regular expressions.
  tokens = date.match(matchCalendarDate);
  if (tokens !== null) {
    //>>includeStart('debug', pragmas.debug);
    dashCount = date.split("-").length - 1;
    if (dashCount > 0 && dashCount !== 2) {
      throw new DeveloperError(iso8601ErrorMessage);
    }
    //>>includeEnd('debug');
    year = +tokens[1];
    month = +tokens[2];
    day = +tokens[3];
  } else {
    tokens = date.match(matchCalendarMonth);
    if (tokens !== null) {
      year = +tokens[1];
      month = +tokens[2];
    } else {
      tokens = date.match(matchCalendarYear);
      if (tokens !== null) {
        year = +tokens[1];
      } else {
        //Not a year/month/day so it must be an ordinal date.
        let dayOfYear;
        tokens = date.match(matchOrdinalDate);
        if (tokens !== null) {
          year = +tokens[1];
          dayOfYear = +tokens[2];
          inLeapYear = isLeapYear(year);

          //This validation is only applicable for this format.
          //>>includeStart('debug', pragmas.debug);
          if (
            dayOfYear < 1 ||
            (inLeapYear && dayOfYear > 366) ||
            (!inLeapYear && dayOfYear > 365)
          ) {
            throw new DeveloperError(iso8601ErrorMessage);
          }
          //>>includeEnd('debug')
        } else {
          tokens = date.match(matchWeekDate);
          if (tokens !== null) {
            //ISO week date to ordinal date from
            //http://en.wikipedia.org/w/index.php?title=ISO_week_date&oldid=474176775
            year = +tokens[1];
            const weekNumber = +tokens[2];
            const dayOfWeek = +tokens[3] || 0;

            //>>includeStart('debug', pragmas.debug);
            dashCount = date.split("-").length - 1;
            if (
              dashCount > 0 &&
              ((!defined(tokens[3]) && dashCount !== 1) ||
                (defined(tokens[3]) && dashCount !== 2))
            ) {
              throw new DeveloperError(iso8601ErrorMessage);
            }
            //>>includeEnd('debug')

            const january4 = new Date(Date.UTC(year, 0, 4));
            dayOfYear = weekNumber * 7 + dayOfWeek - january4.getUTCDay() - 3;
          } else {
            //None of our regular expressions succeeded in parsing the date properly.
            //>>includeStart('debug', pragmas.debug);
            throw new DeveloperError(iso8601ErrorMessage);
            //>>includeEnd('debug')
          }
        }
        //Split an ordinal date into month/day.
        tmp = new Date(Date.UTC(year, 0, 1));
        tmp.setUTCDate(dayOfYear);
        month = tmp.getUTCMonth() + 1;
        day = tmp.getUTCDate();
      }
    }
  }

  //Now that we have all of the date components, validate them to make sure nothing is out of range.
  inLeapYear = isLeapYear(year);
  //>>includeStart('debug', pragmas.debug);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    ((month !== 2 || !inLeapYear) && day > daysInMonth[month - 1]) ||
    (inLeapYear && month === 2 && day > daysInLeapFeburary)
  ) {
    throw new DeveloperError(iso8601ErrorMessage);
  }
  //>>includeEnd('debug')

  //Now move onto the time string, which is much simpler.
  //If no time is specified, it is considered the beginning of the day, UTC to match Javascript's implementation.
  let offsetIndex;
  if (defined(time)) {
    tokens = time.match(matchHoursMinutesSeconds);
    if (tokens !== null) {
      //>>includeStart('debug', pragmas.debug);
      dashCount = time.split(":").length - 1;
      if (dashCount > 0 && dashCount !== 2 && dashCount !== 3) {
        throw new DeveloperError(iso8601ErrorMessage);
      }
      //>>includeEnd('debug')

      hour = +tokens[1];
      minute = +tokens[2];
      second = +tokens[3];
      millisecond = +(tokens[4] || 0) * 1000.0;
      offsetIndex = 5;
    } else {
      tokens = time.match(matchHoursMinutes);
      if (tokens !== null) {
        //>>includeStart('debug', pragmas.debug);
        dashCount = time.split(":").length - 1;
        if (dashCount > 2) {
          throw new DeveloperError(iso8601ErrorMessage);
        }
        //>>includeEnd('debug')

        hour = +tokens[1];
        minute = +tokens[2];
        second = +(tokens[3] || 0) * 60.0;
        offsetIndex = 4;
      } else {
        tokens = time.match(matchHours);
        if (tokens !== null) {
          hour = +tokens[1];
          minute = +(tokens[2] || 0) * 60.0;
          offsetIndex = 3;
        } else {
          //>>includeStart('debug', pragmas.debug);
          throw new DeveloperError(iso8601ErrorMessage);
          //>>includeEnd('debug')
        }
      }
    }

    //Validate that all values are in proper range.  Minutes and hours have special cases at 60 and 24.
    //>>includeStart('debug', pragmas.debug);
    if (
      minute >= 60 ||
      second >= 61 ||
      hour > 24 ||
      (hour === 24 && (minute > 0 || second > 0 || millisecond > 0))
    ) {
      throw new DeveloperError(iso8601ErrorMessage);
    }
    //>>includeEnd('debug');

    //Check the UTC offset value, if no value exists, use local time
    //a Z indicates UTC, + or - are offsets.
    const offset = tokens[offsetIndex];
    const offsetHours = +tokens[offsetIndex + 1];
    const offsetMinutes = +(tokens[offsetIndex + 2] || 0);
    switch (offset) {
      case "+":
        hour = hour - offsetHours;
        minute = minute - offsetMinutes;
        break;
      case "-":
        hour = hour + offsetHours;
        minute = minute + offsetMinutes;
        break;
      case "Z":
        break;
      default:
        minute =
          minute +
          new Date(
            Date.UTC(year, month - 1, day, hour, minute),
          ).getTimezoneOffset();
        break;
    }
  }

  //ISO8601 denotes a leap second by any time having a seconds component of 60 seconds.
  //If that's the case, we need to temporarily subtract a second in order to build a UTC date.
  //Then we add it back in after converting to TAI.
  const isLeapSecond = second === 60;
  if (isLeapSecond) {
    second--;
  }

  //Even if we successfully parsed the string into its components, after applying UTC offset or
  //special cases like 24:00:00 denoting midnight, we need to normalize the data appropriately.

  //milliseconds can never be greater than 1000, and seconds can't be above 60, so we start with minutes
  while (minute >= 60) {
    minute -= 60;
    hour++;
  }

  while (hour >= 24) {
    hour -= 24;
    day++;
  }

  tmp = inLeapYear && month === 2 ? daysInLeapFeburary : daysInMonth[month - 1];
  while (day > tmp) {
    day -= tmp;
    month++;

    if (month > 12) {
      month -= 12;
      year++;
    }

    tmp =
      inLeapYear && month === 2 ? daysInLeapFeburary : daysInMonth[month - 1];
  }

  //If UTC offset is at the beginning/end of the day, minutes can be negative.
  while (minute < 0) {
    minute += 60;
    hour--;
  }

  while (hour < 0) {
    hour += 24;
    day--;
  }

  while (day < 1) {
    month--;
    if (month < 1) {
      month += 12;
      year--;
    }

    tmp =
      inLeapYear && month === 2 ? daysInLeapFeburary : daysInMonth[month - 1];
    day += tmp;
  }

  //Now create the JulianDate components from the Gregorian date and actually create our instance.
  const components = computeJulianDateComponents(
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
  );

  if (!defined(result)) {
    result = new JulianDate(components[0], components[1], TimeStandard.UTC);
  } else {
    setComponents(components[0], components[1], result);
    convertUtcToTai(result);
  }

  //If we were on a leap second, add it back.
  if (isLeapSecond) {
    JulianDate.addSeconds(result, 1, result);
  }

  return result;
};

/**
 * 创建一个新实例，表示当前系统时间。
 * 这相当于调用 <code>JulianDate.fromDate(new Date());</code>。
 *
 * @param {JulianDate} [result] 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 */

JulianDate.now = function (result) {
  return JulianDate.fromDate(new Date(), result);
};

const toGregorianDateScratch = new JulianDate(0, 0, TimeStandard.TAI);

/**
 * 从提供的实例创建一个 {@link GregorianDate}。
 *
 * @param {JulianDate} julianDate 要转换的日期。
 * @param {GregorianDate} [result] 要用于结果的现有实例。
 * @returns {GregorianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 */

JulianDate.toGregorianDate = function (julianDate, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  //>>includeEnd('debug');

  let isLeapSecond = false;
  let thisUtc = convertTaiToUtc(julianDate, toGregorianDateScratch);
  if (!defined(thisUtc)) {
    //Conversion to UTC will fail if we are during a leap second.
    //If that's the case, subtract a second and convert again.
    //JavaScript doesn't support leap seconds, so this results in second 59 being repeated twice.
    JulianDate.addSeconds(julianDate, -1, toGregorianDateScratch);
    thisUtc = convertTaiToUtc(toGregorianDateScratch, toGregorianDateScratch);
    isLeapSecond = true;
  }

  let julianDayNumber = thisUtc.dayNumber;
  const secondsOfDay = thisUtc.secondsOfDay;

  if (secondsOfDay >= 43200.0) {
    julianDayNumber += 1;
  }

  // Algorithm from page 604 of the Explanatory Supplement to the
  // Astronomical Almanac (Seidelmann 1992).
  let L = (julianDayNumber + 68569) | 0;
  const N = ((4 * L) / 146097) | 0;
  L = (L - (((146097 * N + 3) / 4) | 0)) | 0;
  const I = ((4000 * (L + 1)) / 1461001) | 0;
  L = (L - (((1461 * I) / 4) | 0) + 31) | 0;
  const J = ((80 * L) / 2447) | 0;
  const day = (L - (((2447 * J) / 80) | 0)) | 0;
  L = (J / 11) | 0;
  const month = (J + 2 - 12 * L) | 0;
  const year = (100 * (N - 49) + I + L) | 0;

  let hour = (secondsOfDay / TimeConstants.SECONDS_PER_HOUR) | 0;
  let remainingSeconds = secondsOfDay - hour * TimeConstants.SECONDS_PER_HOUR;
  const minute = (remainingSeconds / TimeConstants.SECONDS_PER_MINUTE) | 0;
  remainingSeconds =
    remainingSeconds - minute * TimeConstants.SECONDS_PER_MINUTE;
  let second = remainingSeconds | 0;
  const millisecond =
    (remainingSeconds - second) / TimeConstants.SECONDS_PER_MILLISECOND;

  // JulianDates are noon-based
  hour += 12;
  if (hour > 23) {
    hour -= 24;
  }

  //If we were on a leap second, add it back.
  if (isLeapSecond) {
    second += 1;
  }

  if (!defined(result)) {
    return new GregorianDate(
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      isLeapSecond,
    );
  }

  result.year = year;
  result.month = month;
  result.day = day;
  result.hour = hour;
  result.minute = minute;
  result.second = second;
  result.millisecond = millisecond;
  result.isLeapSecond = isLeapSecond;
  return result;
};

/**
 * 从提供的实例创建一个 JavaScript Date。
 * 由于 JavaScript 日期的精度仅为最近毫秒，且
 * 无法表示闰秒，因此请考虑使用 {@link JulianDate.toGregorianDate}。
 * 如果提供的 JulianDate 在闰秒期间，则使用前一秒。
 *
 * @param {JulianDate} julianDate 要转换的日期。
 * @returns {Date} 一个新的实例，表示提供的日期。
 */

JulianDate.toDate = function (julianDate) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  //>>includeEnd('debug');

  const gDate = JulianDate.toGregorianDate(julianDate, gregorianDateScratch);
  let second = gDate.second;
  if (gDate.isLeapSecond) {
    second -= 1;
  }
  return new Date(
    Date.UTC(
      gDate.year,
      gDate.month - 1,
      gDate.day,
      gDate.hour,
      gDate.minute,
      second,
      gDate.millisecond,
    ),
  );
};

/**
 * 创建提供日期的 ISO8601 表示。
 *
 * @param {JulianDate} julianDate 要转换的日期。
 * @param {number} [precision] 用于表示秒组件的小数位数。 默认情况下，使用最精确的表示法。
 * @returns {string} 提供日期的 ISO8601 表示。
 */

JulianDate.toIso8601 = function (julianDate, precision) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  //>>includeEnd('debug');

  const gDate = JulianDate.toGregorianDate(julianDate, gregorianDateScratch);
  let year = gDate.year;
  let month = gDate.month;
  let day = gDate.day;
  let hour = gDate.hour;
  const minute = gDate.minute;
  const second = gDate.second;
  const millisecond = gDate.millisecond;

  // special case - Iso8601.MAXIMUM_VALUE produces a string which we can't parse unless we adjust.
  // 10000-01-01T00:00:00 is the same instant as 9999-12-31T24:00:00
  if (
    year === 10000 &&
    month === 1 &&
    day === 1 &&
    hour === 0 &&
    minute === 0 &&
    second === 0 &&
    millisecond === 0
  ) {
    year = 9999;
    month = 12;
    day = 31;
    hour = 24;
  }

  let millisecondStr;

  if (!defined(precision) && millisecond !== 0) {
    //Forces milliseconds into a number with at least 3 digits to whatever the default toString() precision is.
    millisecondStr = (millisecond * 0.01).toString().replace(".", "");
    return `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
      .toString()
      .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second
      .toString()
      .padStart(2, "0")}.${millisecondStr}Z`;
  }

  //Precision is either 0 or milliseconds is 0 with undefined precision, in either case, leave off milliseconds entirely
  if (!defined(precision) || precision === 0) {
    return `${year.toString().padStart(4, "0")}-${month
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
      .toString()
      .padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:${second.toString().padStart(2, "0")}Z`;
  }

  //Forces milliseconds into a number with at least 3 digits to whatever the specified precision is.
  millisecondStr = (millisecond * 0.01)
    .toFixed(precision)
    .replace(".", "")
    .slice(0, precision);
  return `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}T${hour
    .toString()
    .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second
    .toString()
    .padStart(2, "0")}.${millisecondStr}Z`;
};

/**
 * 复制一个 JulianDate 实例。
 *
 * @param {JulianDate} julianDate 要复制的日期。
 * @param {JulianDate} [result] 用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。如果 julianDate 是 undefined，返回 undefined。
 */

JulianDate.clone = function (julianDate, result) {
  if (!defined(julianDate)) {
    return undefined;
  }
  if (!defined(result)) {
    return new JulianDate(
      julianDate.dayNumber,
      julianDate.secondsOfDay,
      TimeStandard.TAI,
    );
  }
  result.dayNumber = julianDate.dayNumber;
  result.secondsOfDay = julianDate.secondsOfDay;
  return result;
};
/**
 * 比较两个实例。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {number} 如果 left 小于 right，则返回负值；如果 left 大于 right，则返回正值；如果 left 和 right 相等，则返回零。
 */

JulianDate.compare = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("left is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("right is required.");
  }
  //>>includeEnd('debug');

  const julianDayNumberDifference = left.dayNumber - right.dayNumber;
  if (julianDayNumberDifference !== 0) {
    return julianDayNumberDifference;
  }
  return left.secondsOfDay - right.secondsOfDay;
};

/**
 * 比较两个实例并返回如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {JulianDate} [left] 第一个实例。
 * @param {JulianDate} [right] 第二个实例。
 * @returns {boolean} 如果日期相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.dayNumber === right.dayNumber &&
      left.secondsOfDay === right.secondsOfDay)
  );
};

/**
 * 比较两个实例并返回 <code>true</code> 如果它们之间的差值在 <code>epsilon</code> 秒以内。
 * 也就是说，要认为日期相等（并且此函数返回 <code>true</code>），
 * 它们之间的绝对差值（以秒为单位）必须小于 <code>epsilon</code>。
 *
 * @param {JulianDate} [left] 第一个实例。
 * @param {JulianDate} [right] 第二个实例。
 * @param {number} [epsilon=0] 应该使两个实例分开的最大秒数。
 * @returns {boolean} 如果两个日期相差在 <code>epsilon</code> 秒以内，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0);

  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(JulianDate.secondsDifference(left, right)) <= epsilon)
  );
};

/**
 * 计算由提供的实例表示的完整和分数天总数。
 *
 * @param {JulianDate} julianDate 日期。
 * @returns {number} 作为单个浮点数的儒略日期。
 */

JulianDate.totalDays = function (julianDate) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  //>>includeEnd('debug');
  return (
    julianDate.dayNumber +
    julianDate.secondsOfDay / TimeConstants.SECONDS_PER_DAY
  );
};

/**
 * 计算提供的实例之间的秒数差异。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {number} 从 <code>left</code> 中减去 <code>right</code> 时的差值，以秒为单位。
 */

JulianDate.secondsDifference = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("left is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("right is required.");
  }
  //>>includeEnd('debug');

  const dayDifference =
    (left.dayNumber - right.dayNumber) * TimeConstants.SECONDS_PER_DAY;
  return dayDifference + (left.secondsOfDay - right.secondsOfDay);
};

/**
 * 计算提供的实例之间的天数差异。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {number} 从 <code>left</code> 中减去 <code>right</code> 时的差值，以天为单位。
 */

JulianDate.daysDifference = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(left)) {
    throw new DeveloperError("left is required.");
  }
  if (!defined(right)) {
    throw new DeveloperError("right is required.");
  }
  //>>includeEnd('debug');

  const dayDifference = left.dayNumber - right.dayNumber;
  const secondDifference =
    (left.secondsOfDay - right.secondsOfDay) / TimeConstants.SECONDS_PER_DAY;
  return dayDifference + secondDifference;
};

/**
 * 计算提供的实例相对于 UTC 的超前秒数。
 *
 * @param {JulianDate} julianDate 日期。
 * @returns {number} 提供的实例相对于 UTC 超前的秒数。
 */

JulianDate.computeTaiMinusUtc = function (julianDate) {
  binarySearchScratchLeapSecond.julianDate = julianDate;
  const leapSeconds = JulianDate.leapSeconds;
  let index = binarySearch(
    leapSeconds,
    binarySearchScratchLeapSecond,
    compareLeapSecondDates,
  );
  if (index < 0) {
    index = ~index;
    --index;
    if (index < 0) {
      index = 0;
    }
  }
  return leapSeconds[index].offset;
};

/**
 * 将提供的秒数添加到提供的日期实例中。
 *
 * @param {JulianDate} julianDate 日期。
 * @param {number} seconds 要添加或减去的秒数。
 * @param {JulianDate} result 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数
 */

JulianDate.addSeconds = function (julianDate, seconds, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  if (!defined(seconds)) {
    throw new DeveloperError("seconds is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  return setComponents(
    julianDate.dayNumber,
    julianDate.secondsOfDay + seconds,
    result,
  );
};

/**
 * 将提供的分钟数添加到提供的日期实例中。
 *
 * @param {JulianDate} julianDate 日期。
 * @param {number} minutes 要添加或减去的分钟数。
 * @param {JulianDate} result 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数
 */

JulianDate.addMinutes = function (julianDate, minutes, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  if (!defined(minutes)) {
    throw new DeveloperError("minutes is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const newSecondsOfDay =
    julianDate.secondsOfDay + minutes * TimeConstants.SECONDS_PER_MINUTE;
  return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
};

/**
 * 将提供的小时数添加到提供的日期实例中。
 *
 * @param {JulianDate} julianDate 日期。
 * @param {number} hours 要添加或减去的小时数。
 * @param {JulianDate} result 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数
 */

JulianDate.addHours = function (julianDate, hours, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  if (!defined(hours)) {
    throw new DeveloperError("hours is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const newSecondsOfDay =
    julianDate.secondsOfDay + hours * TimeConstants.SECONDS_PER_HOUR;
  return setComponents(julianDate.dayNumber, newSecondsOfDay, result);
};

/**
 * 将提供的天数添加到提供的日期实例中。
 *
 * @param {JulianDate} julianDate 日期。
 * @param {number} days 要添加或减去的天数。
 * @param {JulianDate} result 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数
 */

JulianDate.addDays = function (julianDate, days, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(julianDate)) {
    throw new DeveloperError("julianDate is required.");
  }
  if (!defined(days)) {
    throw new DeveloperError("days is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const newJulianDayNumber = julianDate.dayNumber + days;
  return setComponents(newJulianDayNumber, julianDate.secondsOfDay, result);
};

/**
 * 比较提供的实例，并返回 <code>true</code> 如果 <code>left</code> 早于 <code>right</code>，否则返回 <code>false</code>。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {boolean} 如果 <code>left</code> 早于 <code>right</code>，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.lessThan = function (left, right) {
  return JulianDate.compare(left, right) < 0;
};

/**
 * 比较提供的实例，并返回 <code>true</code> 如果 <code>left</code> 早于或等于 <code>right</code>，否则返回 <code>false</code>。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {boolean} 如果 <code>left</code> 早于或等于 <code>right</code>，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.lessThanOrEquals = function (left, right) {
  return JulianDate.compare(left, right) <= 0;
};

/**
 * 比较提供的实例，并返回 <code>true</code> 如果 <code>left</code> 晚于 <code>right</code>，否则返回 <code>false</code>。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {boolean} 如果 <code>left</code> 晚于 <code>right</code>，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.greaterThan = function (left, right) {
  return JulianDate.compare(left, right) > 0;
};

/**
 * 比较提供的实例，并返回 <code>true</code> 如果 <code>left</code> 晚于或等于 <code>right</code>，否则返回 <code>false</code>。
 *
 * @param {JulianDate} left 第一个实例。
 * @param {JulianDate} right 第二个实例。
 * @returns {boolean} 如果 <code>left</code> 晚于或等于 <code>right</code>，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.greaterThanOrEquals = function (left, right) {
  return JulianDate.compare(left, right) >= 0;
};

/**
 * 复制此实例。
 *
 * @param {JulianDate} [result] 要用于结果的现有实例。
 * @returns {JulianDate} 修改后的结果参数，如果未提供则返回一个新实例。
 */

JulianDate.prototype.clone = function (result) {
  return JulianDate.clone(this, result);
};

/**
 * 比较此实例和提供的实例，并返回如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {JulianDate} [right] 第二个实例。
 * @returns {boolean} 如果日期相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.prototype.equals = function (right) {
  return JulianDate.equals(this, right);
};

/**
 * 比较此实例和提供的实例，并返回 <code>true</code> 如果它们之间的差值在 <code>epsilon</code> 秒以内。
 * 也就是说，要认为日期相等（并且此函数返回 <code>true</code>），
 * 它们之间的绝对差值（以秒为单位）必须小于 <code>epsilon</code>。
 *
 * @param {JulianDate} [right] 第二个实例。
 * @param {number} [epsilon=0] 应该使两个实例分开的最大秒数。
 * @returns {boolean} 如果两个日期相差在 <code>epsilon</code> 秒以内，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

JulianDate.prototype.equalsEpsilon = function (right, epsilon) {
  return JulianDate.equalsEpsilon(this, right, epsilon);
};

/**
 * 创建一个字符串，表示此日期的 ISO8601 格式。
 *
 * @returns {string} 一个表示此日期的 ISO8601 格式的字符串。
 */

JulianDate.prototype.toString = function () {
  return JulianDate.toIso8601(this);
};

/**
 * 获取或设置在整个 Cesium 中使用的闰秒列表。
 * @memberof JulianDate
 * @type {LeapSecond[]}
 */

JulianDate.leapSeconds = [
  new LeapSecond(new JulianDate(2441317, 43210.0, TimeStandard.TAI), 10), // January 1, 1972 00:00:00 UTC
  new LeapSecond(new JulianDate(2441499, 43211.0, TimeStandard.TAI), 11), // July 1, 1972 00:00:00 UTC
  new LeapSecond(new JulianDate(2441683, 43212.0, TimeStandard.TAI), 12), // January 1, 1973 00:00:00 UTC
  new LeapSecond(new JulianDate(2442048, 43213.0, TimeStandard.TAI), 13), // January 1, 1974 00:00:00 UTC
  new LeapSecond(new JulianDate(2442413, 43214.0, TimeStandard.TAI), 14), // January 1, 1975 00:00:00 UTC
  new LeapSecond(new JulianDate(2442778, 43215.0, TimeStandard.TAI), 15), // January 1, 1976 00:00:00 UTC
  new LeapSecond(new JulianDate(2443144, 43216.0, TimeStandard.TAI), 16), // January 1, 1977 00:00:00 UTC
  new LeapSecond(new JulianDate(2443509, 43217.0, TimeStandard.TAI), 17), // January 1, 1978 00:00:00 UTC
  new LeapSecond(new JulianDate(2443874, 43218.0, TimeStandard.TAI), 18), // January 1, 1979 00:00:00 UTC
  new LeapSecond(new JulianDate(2444239, 43219.0, TimeStandard.TAI), 19), // January 1, 1980 00:00:00 UTC
  new LeapSecond(new JulianDate(2444786, 43220.0, TimeStandard.TAI), 20), // July 1, 1981 00:00:00 UTC
  new LeapSecond(new JulianDate(2445151, 43221.0, TimeStandard.TAI), 21), // July 1, 1982 00:00:00 UTC
  new LeapSecond(new JulianDate(2445516, 43222.0, TimeStandard.TAI), 22), // July 1, 1983 00:00:00 UTC
  new LeapSecond(new JulianDate(2446247, 43223.0, TimeStandard.TAI), 23), // July 1, 1985 00:00:00 UTC
  new LeapSecond(new JulianDate(2447161, 43224.0, TimeStandard.TAI), 24), // January 1, 1988 00:00:00 UTC
  new LeapSecond(new JulianDate(2447892, 43225.0, TimeStandard.TAI), 25), // January 1, 1990 00:00:00 UTC
  new LeapSecond(new JulianDate(2448257, 43226.0, TimeStandard.TAI), 26), // January 1, 1991 00:00:00 UTC
  new LeapSecond(new JulianDate(2448804, 43227.0, TimeStandard.TAI), 27), // July 1, 1992 00:00:00 UTC
  new LeapSecond(new JulianDate(2449169, 43228.0, TimeStandard.TAI), 28), // July 1, 1993 00:00:00 UTC
  new LeapSecond(new JulianDate(2449534, 43229.0, TimeStandard.TAI), 29), // July 1, 1994 00:00:00 UTC
  new LeapSecond(new JulianDate(2450083, 43230.0, TimeStandard.TAI), 30), // January 1, 1996 00:00:00 UTC
  new LeapSecond(new JulianDate(2450630, 43231.0, TimeStandard.TAI), 31), // July 1, 1997 00:00:00 UTC
  new LeapSecond(new JulianDate(2451179, 43232.0, TimeStandard.TAI), 32), // January 1, 1999 00:00:00 UTC
  new LeapSecond(new JulianDate(2453736, 43233.0, TimeStandard.TAI), 33), // January 1, 2006 00:00:00 UTC
  new LeapSecond(new JulianDate(2454832, 43234.0, TimeStandard.TAI), 34), // January 1, 2009 00:00:00 UTC
  new LeapSecond(new JulianDate(2456109, 43235.0, TimeStandard.TAI), 35), // July 1, 2012 00:00:00 UTC
  new LeapSecond(new JulianDate(2457204, 43236.0, TimeStandard.TAI), 36), // July 1, 2015 00:00:00 UTC
  new LeapSecond(new JulianDate(2457754, 43237.0, TimeStandard.TAI), 37), // January 1, 2017 00:00:00 UTC
];
export default JulianDate;
