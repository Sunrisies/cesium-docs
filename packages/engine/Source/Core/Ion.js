import Credit from "./Credit.js";
import defined from "./defined.js";
import Resource from "./Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZjBmMDE4Ny05M2JlLTRlMzgtYjIxYi05YmJjM2QwMzJkYWMiLCJpZCI6MjU5LCJpYXQiOjE3MzA0NjY3MDl9.t-7gCGPUe-oGCyCoeXPtYmlMVdgqUQD9mn-Da23yUoI";
/**
 * 访问 Cesium ion API 的默认设置。
 *
 * 只有在使用任何与 ion 相关的 API 时才需要 ion 访问令牌。
 * 提供的默认访问令牌仅用于评估目的。
 * 注册一个免费的 ion 账户，并在 {@link https://cesium.com} 获取您的访问令牌。
 *
 * @see IonResource
 * @see IonImageryProvider
 * @see IonGeocoderService
 * @see createWorldImagery
 * @see createWorldTerrain
 * @namespace Ion
 */

const Ion = {};

/**
 * 获取或设置默认的 Cesium ion 访问令牌。
 *
 * @type {string}
 */
Ion.defaultAccessToken = defaultAccessToken;

/**
 * 获取或设置默认的 Cesium ion 服务器。
 *
 * @type {string|Resource}
 * @default https://api.cesium.com
 */

Ion.defaultServer = new Resource({ url: "https://api.cesium.com/" });

Ion.getDefaultTokenCredit = function (providedKey) {
  if (providedKey !== defaultAccessToken) {
    return undefined;
  }

  if (!defined(defaultTokenCredit)) {
    const defaultTokenMessage =
      '<b> \
            This application is using Cesium\'s default ion access token. Please assign <i>Cesium.Ion.defaultAccessToken</i> \
            with an access token from your ion account before making any Cesium API calls. \
            You can sign up for a free ion account at <a href="https://cesium.com">https://cesium.com</a>.</b>';

    defaultTokenCredit = new Credit(defaultTokenMessage, true);
  }

  return defaultTokenCredit;
};
export default Ion;
