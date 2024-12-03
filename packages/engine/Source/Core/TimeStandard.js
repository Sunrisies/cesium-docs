/**
 * 提供JulianDate可以作为输入的时间标准类型。
 *
 * @enum {number}
 *
 * @see JulianDate
 */
const TimeStandard = {
  /**
   * 表示协调世界时间（UTC）时间标准。
   *
   * UTC与TAI的关系为
   * <code>UTC = TAI - deltaT</code>，其中 <code>deltaT</code> 是截至TAI时引入的
   * 闰秒数量。
   *
   * @type {number}
   * @constant
   */
  UTC: 0,

  /**
   * 表示国际原子时间（TAI）时间标准。
   * TAI是与其他时间标准相关的主要时间标准。
   *
   * @type {number}
   * @constant
   */
  TAI: 1,
};
export default Object.freeze(TimeStandard);
