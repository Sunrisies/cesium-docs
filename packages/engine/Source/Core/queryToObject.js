import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 将查询字符串解析为对象，其中对象的键和值是解码后的查询字符串中的
 * 名称/值对。如果名称出现多次，则对象中的值将是一个值的数组。
 * @function queryToObject
 *
 * @param {string} queryString 查询字符串。
 * @returns {object} 包含从查询字符串解析的参数的对象。
 *
 *
 * @example
 * const obj = Cesium.queryToObject('key1=some%20value&key2=a%2Fb&key3=x&key3=y');
 * // obj will be:
 * // {
 * //   key1 : 'some value',
 * //   key2 : 'a/b',
 * //   key3 : ['x', 'y']
 * // }
 *
 * @see objectToQuery
 */
function queryToObject(queryString) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(queryString)) {
    throw new DeveloperError("queryString is required.");
  }
  //>>includeEnd('debug');

  const result = {};
  if (queryString === "") {
    return result;
  }
  const parts = queryString.replace(/\+/g, "%20").split(/[&;]/);
  for (let i = 0, len = parts.length; i < len; ++i) {
    const subparts = parts[i].split("=");

    const name = decodeURIComponent(subparts[0]);
    let value = subparts[1];
    if (defined(value)) {
      value = decodeURIComponent(value);
    } else {
      value = "";
    }

    const resultValue = result[name];
    if (typeof resultValue === "string") {
      // expand the single value to an array
      result[name] = [resultValue, value];
    } else if (Array.isArray(resultValue)) {
      resultValue.push(value);
    } else {
      result[name] = value;
    }
  }
  return result;
}
export default queryToObject;
