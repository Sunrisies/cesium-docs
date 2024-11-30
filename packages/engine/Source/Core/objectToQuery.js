import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 将表示一组名称/值对的对象转换为查询字符串，
 * 并对名称和值进行适当编码以便用于 URL。值是数组的
 * 将产生多个相同名称的值。
 * @function objectToQuery
 *
 * @param {object} obj 包含要编码的数据的对象。
 * @returns {string} 编码后的查询字符串。
 *
 * @example
 * const str = Cesium.objectToQuery({
 *     key1 : 'some value',
 *     key2 : 'a/b',
 *     key3 : ['x', 'y']
 * });
 *
 * @see queryToObject
 * // str will be:
 * // 'key1=some%20value&key2=a%2Fb&key3=x&key3=y'
 */
function objectToQuery(obj) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(obj)) {
    throw new DeveloperError("obj is required.");
  }
  //>>includeEnd('debug');

  let result = "";
  for (const propName in obj) {
    if (obj.hasOwnProperty(propName)) {
      const value = obj[propName];

      const part = `${encodeURIComponent(propName)}=`;
      if (Array.isArray(value)) {
        for (let i = 0, len = value.length; i < len; ++i) {
          result += `${part + encodeURIComponent(value[i])}&`;
        }
      } else {
        result += `${part + encodeURIComponent(value)}&`;
      }
    }
  }

  // trim last &
  result = result.slice(0, -1);

  // This function used to replace %20 with + which is more compact and readable.
  // However, some servers didn't properly handle + as a space.
  // https://github.com/CesiumGS/cesium/issues/2192

  return result;
}
export default objectToQuery;
