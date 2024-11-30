import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ion from "./Ion.js";
import PeliasGeocoderService from "./PeliasGeocoderService.js";
import Resource from "./Resource.js";

/**
 * 通过 Cesium ion 提供地理编码服务。
 * @alias IonGeocoderService
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Scene} options.scene 场景
 * @param {string} [options.accessToken=Ion.defaultAccessToken] 要使用的访问令牌。
 * @param {string|Resource} [options.server=Ion.defaultServer] 指向 Cesium ion API 服务器的资源。
 *
 * @see Ion
 */

function IonGeocoderService(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.scene", options.scene);
  //>>includeEnd('debug');

  const accessToken = defaultValue(options.accessToken, Ion.defaultAccessToken);
  const server = Resource.createIfNeeded(
    defaultValue(options.server, Ion.defaultServer),
  );
  server.appendForwardSlash();

  const defaultTokenCredit = Ion.getDefaultTokenCredit(accessToken);
  if (defined(defaultTokenCredit)) {
    options.scene.frameState.creditDisplay.addStaticCredit(
      Credit.clone(defaultTokenCredit),
    );
  }

  const searchEndpoint = server.getDerivedResource({
    url: "v1/geocode",
  });

  if (defined(accessToken)) {
    searchEndpoint.appendQueryParameters({ access_token: accessToken });
  }

  this._accessToken = accessToken;
  this._server = server;
  this._pelias = new PeliasGeocoderService(searchEndpoint);
}

Object.defineProperties(IonGeocoderService.prototype, {
  /**
   * 获取在执行地理编码后要显示的信用信息。通常用于给
   * 地理编码服务进行信用声明。
   * @memberof IonGeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */

  credit: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * @function
 *
 * @param {string} query 要发送到地理编码服务的查询
 * @param {GeocodeType} [type=GeocodeType.SEARCH] 要执行的地理编码类型。
 * @returns {Promise<GeocoderService.Result[]>}
 */

IonGeocoderService.prototype.geocode = async function (query, geocodeType) {
  return this._pelias.geocode(query, geocodeType);
};
export default IonGeocoderService;
