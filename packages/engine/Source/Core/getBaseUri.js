import Uri from "urijs";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 给定一个 URI，返回该 URI 的基础路径。
 * @function
 *
 * @param {string} uri URI。
 * @param {boolean} [includeQuery = false] 是否包含 URI 的查询字符串和片段。
 * @returns {string} URI 的基础路径。
 *
 * @example
 * // basePath will be "/Gallery/";
 * const basePath = Cesium.getBaseUri('/Gallery/simple.czml?value=true&example=false');
 *
 * // basePath will be "/Gallery/?value=true&example=false";
 * const basePath = Cesium.getBaseUri('/Gallery/simple.czml?value=true&example=false', true);
 */
function getBaseUri(uri, includeQuery) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(uri)) {
    throw new DeveloperError("uri is required.");
  }
  //>>includeEnd('debug');

  let basePath = "";
  const i = uri.lastIndexOf("/");
  if (i !== -1) {
    basePath = uri.substring(0, i + 1);
  }

  if (!includeQuery) {
    return basePath;
  }

  uri = new Uri(uri);
  if (uri.query().length !== 0) {
    basePath += `?${uri.query()}`;
  }
  if (uri.fragment().length !== 0) {
    basePath += `#${uri.fragment()}`;
  }

  return basePath;
}
export default getBaseUri;
