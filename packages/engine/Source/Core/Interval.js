import defaultValue from "./defaultValue.js";

/**
 * 表示闭合区间 [start, stop]。
 * @alias Interval
 * @constructor
 *
 * @param {number} [start=0.0] 区间的起始值。
 * @param {number} [stop=0.0] 区间的结束值。
 */
function Interval(start, stop) {
  /**
   * 区间的起始值。
   * @type {number}
   * @default 0.0
   */
  this.start = defaultValue(start, 0.0);
  /**
   * 区间的结束值。
   * @type {number}
   * @default 0.0
   */
  this.stop = defaultValue(stop, 0.0);
}
export default Interval;
