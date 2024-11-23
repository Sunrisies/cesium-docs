/**
 * @function
 *
 * @param {*} value 要检查的对象。
 * @returns {boolean} 如果对象已定义，则返回 true；否则返回 false。
 *
 * @example
 * if (Cesium.defined(positions)) {
 *      doSomething();
 * } else {
 *      doSomethingElse();
 * }
 */
function defined(value) {
  return value !== undefined && value !== null;
}
export default defined;