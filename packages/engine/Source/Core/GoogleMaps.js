import Credit from "./Credit.js";
import Resource from "./Resource.js";

/**
 * 访问 Google Maps API 的默认设置。
 * <br/>
 * 仅在直接使用任何 Google Maps API 时需要 API 密钥，例如通过 {@link createGooglePhotorealistic3DTileset}。
 * 有关管理 Google Maps 平台 API 密钥的说明，请参阅 {@link https://developers.google.com/maps/documentation/embed/get-api-key}
 *
 * @see createGooglePhotorealistic3DTileset
 * @see https://developers.google.com/maps/documentation/embed/get-api-key
 *
 * @namespace GoogleMaps
 */

const GoogleMaps = {};

/**
 * 获取或设置默认的 Google Maps API 密钥。
 *
 * @type {undefined|string}
 */
GoogleMaps.defaultApiKey = undefined;

/**
 * 获取或设置默认的 Google Map Tiles API 端点。
 *
 * @type {string|Resource}
 * @default https://tile.googleapis.com/v1/
 */

GoogleMaps.mapTilesApiEndpoint = new Resource({
  url: "https://tile.googleapis.com/v1/",
});

GoogleMaps.getDefaultCredit = function () {
  return new Credit(
    `<img src="https://assets.ion.cesium.com/google-credit.png" style="vertical-align: -5px" alt="Google">`,
    true,
  );
};
export default GoogleMaps;
