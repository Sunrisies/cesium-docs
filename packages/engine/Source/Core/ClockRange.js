/**
 * {@link Clock#tick}用于确定在达到{@link Clock#startTime}或{@link Clock#stopTime}时的行为的常量。
 *
 * @enum {number}
 *
 * @see Clock
 * @see ClockStep
 */
const ClockRange = {
  /**
   * {@link Clock#tick}将始终在其当前方向推进时钟。
   *
   * @type {number}
   * @constant
   */
  UNBOUNDED: 0,

  /**
   * 当达到{@link Clock#startTime}或{@link Clock#stopTime}时，
   * {@link Clock#tick}将不再推进{@link Clock#currentTime}。
   *
   * @type {number}
   * @constant
   */
  CLAMPED: 1,

  /**
   * 当达到{@link Clock#stopTime}时，{@link Clock#tick}将推进
   * {@link Clock#currentTime}到时间区间的另一端。当
   * 时间向后移动时，{@link Clock#tick}将不会超过
   * {@link Clock#startTime}。
   *
   * @type {number}
   * @constant
   */
  LOOP_STOP: 2,
};
export default Object.freeze(ClockRange);
