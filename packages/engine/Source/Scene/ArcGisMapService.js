import Credit from "../Core/Credit.js";
import defined from "../Core/defined.js";
import Resource from "../Core/Resource.js";

let defaultTokenCredit;
const defaultAccessToken =
  "AAPTxy8BH1VEsoebNVZXo8HurEOF051kAEKlhkOhBEc9BmQpcUfxe1Yndhf82d5oKkQJ4_7VPaBQGYSISOMaRew7Sy-eTX1JQ4XwaC8v5aCvV72O6LCPs5Ss1pXXH-0uEw6bSRhTeQYHOmikutC2OMyZt6lu0VfT7FA-jVMO_UsunWNTf2cycP2O4IeDN_UV9G-VNmUu2jRvCHioi8o72ua4238s2219cYLEmcoGRJGVJTA.AT1_PjLvyih0";
/**
 * 访问 ArcGIS 图像切片服务的默认选项。
 *
 * 需要一个 ArcGIS 访问令牌以访问 ArcGIS 图像切片图层。
 * 提供了一个默认令牌，仅用于评估目的。
 * 要获取访问令牌，请访问 {@link https://developers.arcgis.com} 并创建一个免费帐户。
 * 更多信息可以在 {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security/ | ArcGIS 开发者指南} 中找到。
 *
 * @see ArcGisMapServerImageryProvider
 * @namespace ArcGisMapService
 */


const ArcGisMapService = {};
/**
 * 获取或设置默认 ArcGIS 访问令牌.
 *
 * @type {string}
 */
ArcGisMapService.defaultAccessToken = defaultAccessToken;

/**
 * 获取或设置 ArcGIS World Imagery 切片服务的 URL.
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer
 */
ArcGisMapService.defaultWorldImageryServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer",
});

/**
 * 获取或设置 ArcGIS World Hillshade 瓦片服务的 URL.
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer
 */
ArcGisMapService.defaultWorldHillshadeServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer",
});

/**
 * 获取或设置 ArcGIS World Oceans 切片服务的 URL.
 *
 * @type {string|Resource}
 * @default https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer
 */
ArcGisMapService.defaultWorldOceanServer = new Resource({
  url: "https://ibasemaps-api.arcgis.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer",
});

/**
 *
 * @param {string} providedKey
 * @return {string|undefined}
 */
ArcGisMapService.getDefaultTokenCredit = function (providedKey) {
  if (providedKey !== defaultAccessToken) {
    return undefined;
  }

  if (!defined(defaultTokenCredit)) {
    const defaultTokenMessage =
      '<b> \
            This application is using a default ArcGIS access token. Please assign <i>Cesium.ArcGisMapService.defaultAccessToken</i> \
            with an API key from your ArcGIS Developer account before using the ArcGIS tile services. \
            You can sign up for a free ArcGIS Developer account at <a href="https://developers.arcgis.com/">https://developers.arcgis.com/</a>.</b>';

    defaultTokenCredit = new Credit(defaultTokenMessage, true);
  }

  return defaultTokenCredit;
};
export default ArcGisMapService;
