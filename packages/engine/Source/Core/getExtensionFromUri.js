import Uri from "urijs";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 给定一个 URI，返回该 URI 的扩展名。
 * @function getExtensionFromUri
 *
 * @param {string} uri URI。
 * @returns {string} URI 的扩展名。
 *
 * @example
 * //extension will be "czml";
 * const extension = Cesium.getExtensionFromUri('/Gallery/simple.czml?value=true&example=false');
 */
function getExtensionFromUri(uri) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(uri)) {
    throw new DeveloperError("uri is required.");
  }
  //>>includeEnd('debug');

  const uriObject = new Uri(uri);
  uriObject.normalize();
  let path = uriObject.path();
  let index = path.lastIndexOf("/");
  if (index !== -1) {
    path = path.substr(index + 1);
  }
  index = path.lastIndexOf(".");
  if (index === -1) {
    path = "";
  } else {
    path = path.substr(index + 1);
  }
  return path;
}
export default getExtensionFromUri;
