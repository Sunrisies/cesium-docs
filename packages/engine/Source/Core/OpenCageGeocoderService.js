import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import combine from "./combine.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";

/**
 * 通过 {@link https://opencagedata.com/|OpenCage} 服务器提供地理编码服务。
 * @alias OpenCageGeocoderService
 * @constructor
 *
 * @param {Resource|string} url OpenCage 服务器的端点。
 * @param {string} apiKey OpenCage API 密钥。
 * @param {object} [params] 包含以下属性的对象（参见 https://opencagedata.com/api#forward-opt）：
 * @param {number} [params.abbrv] 设置为 1 时，我们尝试缩写并缩短返回的格式化字符串。
 * @param {number} [options.add_request] 设置为 1 时，各种请求参数将添加到响应中，以方便调试。
 * @param {string} [options.bounds] 为地理编码器提供关于查询所在区域的提示。
 * @param {string} [options.countrycode] 限制结果为指定国家或国家（按照 ISO 3166-1 Alpha 2 标准定义）。
 * @param {string} [options.jsonp] 用函数名称包装返回的 JSON。
 * @param {string} [options.language] IETF 格式的语言代码。
 * @param {number} [options.limit] 我们应该返回的最大结果数量。
 * @param {number} [options.min_confidence] 介于 1 到 10 之间的整数。仅返回至少具有此置信度的结果。
 * @param {number} [options.no_annotations] 设置为 1 时，结果将不包含注释。
 * @param {number} [options.no_dedupe] 设置为 1 时，结果将不会去重。
 * @param {number} [options.no_record] 设置为 1 时，查询内容不会被记录。
 * @param {number} [options.pretty] 设置为 1 时，结果将“美化”打印以便于阅读。对于调试非常有用。
 * @param {string} [options.proximity] 为地理编码器提供关于偏向更接近指定位置的结果的提示（例如：41.40139,2.12870）。
 *
 * @example
 * // Configure a Viewer to use the OpenCage Geocoder
 * const viewer = new Cesium.Viewer('cesiumContainer', {
 *   geocoder: new Cesium.OpenCageGeocoderService('https://api.opencagedata.com/geocode/v1/', '<API key>')
 * });
 */
function OpenCageGeocoderService(url, apiKey, params) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  Check.defined("apiKey", apiKey);
  if (defined(params)) {
    Check.typeOf.object("params", params);
  }
  //>>includeEnd('debug');

  url = Resource.createIfNeeded(url);
  url.appendForwardSlash();
  url.setQueryParameters({ key: apiKey });
  this._url = url;
  this._params = defaultValue(params, {});
  this._credit = new Credit(
    `Geodata copyright <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors`,
    false,
  );
}

Object.defineProperties(OpenCageGeocoderService.prototype, {
  /**
   * 用于访问 OpenCage 端点的资源。
   * @type {Resource}
   * @memberof OpenCageGeocoderService.prototype
   * @readonly
   */
  url: {
    get: function () {
      return this._url;
    },
  },
  /**
   * 传递给 OpenCage 的可选参数，用于自定义地理编码。
   * @type {object}
   * @memberof OpenCageGeocoderService.prototype
   * @readonly
   */
  params: {
    get: function () {
      return this._params;
    },
  },
  /**
   * 获取在执行地理编码后显示的信用信息。通常用于给予地理编码服务以信用。
   * @memberof OpenCageGeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },
});

/**
 * @function
 *
 * @param {string} query 要发送到地理编码服务的查询。
 * @returns {Promise<GeocoderService.Result[]>}
 */

OpenCageGeocoderService.prototype.geocode = async function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._url.getDerivedResource({
    url: "json",
    queryParameters: combine(this._params, { q: query }),
  });
  return resource.fetchJson().then(function (response) {
    return response.results.map(function (resultObject) {
      let destination;
      const bounds = resultObject.bounds;

      if (defined(bounds)) {
        destination = Rectangle.fromDegrees(
          bounds.southwest.lng,
          bounds.southwest.lat,
          bounds.northeast.lng,
          bounds.northeast.lat,
        );
      } else {
        const lon = resultObject.geometry.lat;
        const lat = resultObject.geometry.lng;
        destination = Cartesian3.fromDegrees(lon, lat);
      }

      return {
        displayName: resultObject.formatted,
        destination: destination,
      };
    });
  });
};
export default OpenCageGeocoderService;
