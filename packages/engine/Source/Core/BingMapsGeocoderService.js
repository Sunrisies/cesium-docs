import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import Rectangle from "./Rectangle.js";
import Resource from "./Resource.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

const url = "https://dev.virtualearth.net/REST/v1/Locations";

/**
 * 通过 Bing Maps 提供地理编码服务。
 * @alias BingMapsGeocoderService
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} options.key 用于 Bing Maps 地理编码服务的密钥。
 * @param {string} [options.culture] 指定返回结果的特定文化和语言的 Bing Maps {@link https://docs.microsoft.com/en-us/bingmaps/rest-services/common-parameters-and-types/supported-culture-codes|文化代码}。
 */
function BingMapsGeocoderService(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const key = options.key;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(key)) {
    throw new DeveloperError("options.key is required.");
  }
  //>>includeEnd('debug');

  this._key = key;

  const queryParameters = {
    key: key,
  };

  if (defined(options.culture)) {
    queryParameters.culture = options.culture;
  }

  this._resource = new Resource({
    url: url,
    queryParameters: queryParameters,
  });

  this._credit = new Credit(
    `<img src="http:\/\/dev.virtualearth.net\/Branding\/logo_powered_by.png"\/>`,
    false,
  );
}

Object.defineProperties(BingMapsGeocoderService.prototype, {
  /**
   * Bing 地理编码服务的 URL 端点
   * @type {string}
   * @memberof BingMapsGeocoderService.prototype
   * @readonly
   */
  url: {
    get: function () {
      return url;
    },
  },

  /**
   * Bing 地理编码服务的密钥
   * @type {string}
   * @memberof BingMapsGeocoderService.prototype
   * @readonly
   */
  key: {
    get: function () {
      return this._key;
    },
  },

  /**
   * 获取在执行地理编码后显示的信用。通常用于注明
   * 地理编码服务。
   * @memberof BingMapsGeocoderService.prototype
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
 * @param {string} query 要发送到地理编码服务的查询
 * @returns {Promise<GeocoderService.Result[]>}
 */
BingMapsGeocoderService.prototype.geocode = async function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const resource = this._resource.getDerivedResource({
    queryParameters: {
      query: query,
    },
  });

  return resource.fetchJsonp("jsonp").then(function (result) {
    if (result.resourceSets.length === 0) {
      return [];
    }

    const results = result.resourceSets[0].resources;

    return results.map(function (resource) {
      const bbox = resource.bbox;
      const south = bbox[0];
      const west = bbox[1];
      const north = bbox[2];
      const east = bbox[3];
      return {
        displayName: resource.name,
        destination: Rectangle.fromDegrees(west, south, east, north),
      };
    });
  });
};
export default BingMapsGeocoderService;
