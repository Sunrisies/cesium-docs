/**
 * 常量，用于确定每次调用{@link Clock#tick}时时间推进多少。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockRange
 */
const ClockStep = {
  /**
   * {@link Clock#tick}根据{@link Clock#multiplier}指定的秒数，通过固定步长推进当前时间。
   *
   * @type {number}
   * @constant
   */
  TICK_DEPENDENT: 0,

  /**
   * {@link Clock#tick}根据自上次调用以来经过的系统时间乘以{@link Clock#multiplier}推进当前时间。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK_MULTIPLIER: 1,

  /**
   * {@link Clock#tick}将时钟设置为当前系统时间；
   * 忽略所有其他设置。
   *
   * @type {number}
   * @constant
   */
  SYSTEM_CLOCK: 2,
};
export default Object.freeze(ClockStep);
