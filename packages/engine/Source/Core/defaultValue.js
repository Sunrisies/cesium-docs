/**
 * 如果第一个参数不是 undefined，则返回第一个参数，否则返回第二个参数。
 * 适用于为参数设置默认值。
 *
 * @function
 *
 * @param {*} a
 * @param {*} b
 * @returns {*} 如果第一个参数不是 undefined，则返回第一个参数，否则返回第二个参数。
 *
 * @example
 * param = Cesium.defaultValue(param, 'default');
 */
function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

/**
 * 一个被冻结的空对象，可以用作作为对象字面量传递的选项的默认值。
 * @type {object}
 * @memberof defaultValue
 */
defaultValue.EMPTY_OBJECT = Object.freeze({});

export default defaultValue;