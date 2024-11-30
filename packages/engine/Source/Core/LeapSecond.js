/**
 * 描述一个单一的跳秒，其由一个 {@link JulianDate} 和一个数值偏移量构成，表示 TAI 比 UTC 时间标准提前的秒数。
 * @alias LeapSecond
 * @constructor
 *
 * @param {JulianDate} [date] 一个表示跳秒发生时间的 Julian 日期。
 * @param {number} [offset] 在提供日期时，TAI 相对于 UTC 的累积秒数。
 */
function LeapSecond(date, offset) {
  /**
   * 获取或设置发生跳秒的日期。
   * @type {JulianDate}
   */
  this.julianDate = date;

  /**
   * 获取或设置在此跳秒发生时 UTC 和 TAI 时间标准之间的累积秒数。
   * @type {number}
   */
  this.offset = offset;
}
export default LeapSecond;
