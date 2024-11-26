/**
 * 获取一个时间戳，可用于测量事件之间的时间。时间戳
 * 以毫秒为单位表示，但未指定这些毫秒是从何处测量的。此函数在可用时使用 performance.now()，否则使用 Date.now()。
 *
 * @function getTimestamp
 *
 * @returns {number} 从某个未指定的参考时间起的时间戳，单位为毫秒。
 */

let getTimestamp;

if (
  typeof performance !== "undefined" &&
  typeof performance.now === "function" &&
  isFinite(performance.now())
) {
  getTimestamp = function () {
    return performance.now();
  };
} else {
  getTimestamp = function () {
    return Date.now();
  };
}
export default getTimestamp;
