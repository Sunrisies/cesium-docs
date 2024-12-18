import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import getAbsoluteUri from "./getAbsoluteUri.js";
import Resource from "./Resource.js";

/*global CESIUM_BASE_URL,define,require*/

const cesiumScriptRegex = /((?:.*\/)|^)Cesium\.js(?:\?|\#|$)/;
function getBaseUrlFromCesiumScript() {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0, len = scripts.length; i < len; ++i) {
    const src = scripts[i].getAttribute("src");
    const result = cesiumScriptRegex.exec(src);
    if (result !== null) {
      return result[1];
    }
  }
  return undefined;
}

let a;
function tryMakeAbsolute(url) {
  if (typeof document === "undefined") {
    // Node.js and Web Workers. In both cases, the URL will already be absolute.
    return url;
  }

  if (!defined(a)) {
    a = document.createElement("a");
  }
  a.href = url;
  return a.href;
}

let baseResource;
function getCesiumBaseUrl() {
  if (defined(baseResource)) {
    return baseResource;
  }

  let baseUrlString;
  if (typeof CESIUM_BASE_URL !== "undefined") {
    baseUrlString = CESIUM_BASE_URL;
  } else if (defined(import.meta?.url)) {
    // ESM
    baseUrlString = getAbsoluteUri(".", import.meta.url);
  } else if (
    typeof define === "object" &&
    defined(define.amd) &&
    !define.amd.toUrlUndefined &&
    defined(require.toUrl)
  ) {
    // RequireJS
    baseUrlString = getAbsoluteUri(
      "..",
      buildModuleUrl("Core/buildModuleUrl.js"),
    );
  } else {
    // IIFE
    baseUrlString = getBaseUrlFromCesiumScript();
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(baseUrlString)) {
    throw new DeveloperError(
      "Unable to determine Cesium base URL automatically, try defining a global variable called CESIUM_BASE_URL.",
    );
  }
  //>>includeEnd('debug');

  baseResource = new Resource({
    url: tryMakeAbsolute(baseUrlString),
  });
  baseResource.appendForwardSlash();

  return baseResource;
}

function buildModuleUrlFromRequireToUrl(moduleID) {
  //moduleID will be non-relative, so require it relative to this module, in Core.
  return tryMakeAbsolute(require.toUrl(`../${moduleID}`));
}

function buildModuleUrlFromBaseUrl(moduleID) {
  const resource = getCesiumBaseUrl().getDerivedResource({
    url: moduleID,
  });
  return resource.url;
}

let implementation;

/**
 * 根据 Cesium 基础 URL 下的相对 URL，返回绝对 URL。
 * @function
 *
 * @param {string} relativeUrl 相对路径。
 * @returns {string} 提供路径的绝对 URL 表示。
 *
 * @example
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.TileMapServiceImageryProvider.fromUrl(
 *       Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
 *     )),
 *   baseLayerPicker: false,
 * });
 */
function buildModuleUrl(relativeUrl) {
  if (!defined(implementation)) {
    //select implementation
    if (
      typeof define === "object" &&
      defined(define.amd) &&
      !define.amd.toUrlUndefined &&
      defined(require.toUrl)
    ) {
      implementation = buildModuleUrlFromRequireToUrl;
    } else {
      implementation = buildModuleUrlFromBaseUrl;
    }
  }

  const url = implementation(relativeUrl);
  return url;
}

// exposed for testing
buildModuleUrl._cesiumScriptRegex = cesiumScriptRegex;
buildModuleUrl._buildModuleUrlFromBaseUrl = buildModuleUrlFromBaseUrl;
buildModuleUrl._clearBaseResource = function () {
  baseResource = undefined;
};

/**
 * 设置用于解析模块的基础 URL。
 * @param {string} value 新的基础 URL。
 */

buildModuleUrl.setBaseUrl = function (value) {
  baseResource = Resource.DEFAULT.getDerivedResource({
    url: value,
  });
};

/**
 * 获取用于解析模块的基础 URL。
 *
 * @function
 * @returns {string} 配置的基础 URL。
 */

buildModuleUrl.getCesiumBaseUrl = getCesiumBaseUrl;

export default buildModuleUrl;
