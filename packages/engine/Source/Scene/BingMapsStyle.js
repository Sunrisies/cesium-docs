/**
 * Bing Maps提供的影像类型。
 *
 * @enum {number}
 *
 * @see BingMapsImageryProvider
 */
const BingMapsStyle = {
  /**
   * 空中影像。
   *
   * @type {string}
   * @constant
   */
  AERIAL: "Aerial",

  /**
   * 带有道路覆盖的空中影像。
   *
   * @type {string}
   * @constant
   * @deprecated 请参见 https://github.com/CesiumGS/cesium/issues/7128。
   * 请使用 `BingMapsStyle.AERIAL_WITH_LABELS_ON_DEMAND` 代替
   */
  AERIAL_WITH_LABELS: "AerialWithLabels",

  /**
   * 带有道路覆盖的空中影像。
   *
   * @type {string}
   * @constant
   */
  AERIAL_WITH_LABELS_ON_DEMAND: "AerialWithLabelsOnDemand",

  /**
   * 不带附加影像的道路。
   *
   * @type {string}
   * @constant
   * @deprecated 请参见 https://github.com/CesiumGS/cesium/issues/7128。
   * 请使用 `BingMapsStyle.ROAD_ON_DEMAND` 代替
   */
  ROAD: "Road",

  /**
   * 不带附加影像的道路。
   *
   * @type {string}
   * @constant
   */
  ROAD_ON_DEMAND: "RoadOnDemand",

  /**
   * 道路地图的深色版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_DARK: "CanvasDark",

  /**
   * 道路地图的浅色版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_LIGHT: "CanvasLight",

  /**
   * 道路地图的灰度版本。
   *
   * @type {string}
   * @constant
   */
  CANVAS_GRAY: "CanvasGray",

  /**
   * 英国军用地图影像。该影像仅在伦敦地区可见。
   *
   * @type {string}
   * @constant
   */
  ORDNANCE_SURVEY: "OrdnanceSurvey",

  /**
   * Collins Bart影像。
   *
   * @type {string}
   * @constant
   */
  COLLINS_BART: "CollinsBart",
};
export default Object.freeze(BingMapsStyle);
