import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import combine from "../Core/combine.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import ImageryProvider from "./ImageryProvider.js";

const templateRegex = /{[^}]+}/g;

const tags = {
  x: xTag,
  y: yTag,
  z: zTag,
  s: sTag,
  reverseX: reverseXTag,
  reverseY: reverseYTag,
  reverseZ: reverseZTag,
  westDegrees: westDegreesTag,
  southDegrees: southDegreesTag,
  eastDegrees: eastDegreesTag,
  northDegrees: northDegreesTag,
  westProjected: westProjectedTag,
  southProjected: southProjectedTag,
  eastProjected: eastProjectedTag,
  northProjected: northProjectedTag,
  width: widthTag,
  height: heightTag,
};

const pickFeaturesTags = combine(tags, {
  i: iTag,
  j: jTag,
  reverseI: reverseITag,
  reverseJ: reverseJTag,
  longitudeDegrees: longitudeDegreesTag,
  latitudeDegrees: latitudeDegreesTag,
  longitudeProjected: longitudeProjectedTag,
  latitudeProjected: latitudeProjectedTag,
  format: formatTag,
});

/**
 * 初始化UrlTemplateImageryProvider构造函数的选项。
 *
 * @typedef {object} UrlTemplateImageryProvider.ConstructorOptions
 *
 * @property {Resource|string} url 用于请求瓦片的URL模板。它具有以下关键字：
 * <ul>
 *     <li><code>{z}</code>: 瓦片在瓦片方案中的级别。零级是四叉树金字塔的根。</li>
 *     <li><code>{x}</code>: 瓦片在瓦片方案中的X坐标，其中0是最西的瓦片。</li>
 *     <li><code>{y}</code>: 瓦片在瓦片方案中的Y坐标，其中0是最北的瓦片。</li>
 *     <li><code>{s}</code>: 可用的子域之一，用于克服每个主机的同时请求数量限制。</li>
 *     <li><code>{reverseX}</code>: 瓦片在瓦片方案中的X坐标，其中0是最东的瓦片。</li>
 *     <li><code>{reverseY}</code>: 瓦片在瓦片方案中的Y坐标，其中0是最南的瓦片。</li>
 *     <li><code>{reverseZ}</code>: 瓦片在瓦片方案中的级别，其中零级是四叉树金字塔的最大级别。使用reverseZ时，必须定义maximumLevel。</li>
 *     <li><code>{westDegrees}</code>: 瓦片在大地度数中的西边缘。</li>
 *     <li><code>{southDegrees}</code>: 瓦片在大地度数中的南边缘。</li>
 *     <li><code>{eastDegrees}</code>: 瓦片在大地度数中的东边缘。</li>
 *     <li><code>{northDegrees}</code>: 瓦片在大地度数中的北边缘。</li>
 *     <li><code>{westProjected}</code>: 瓦片在瓦片方案的投影坐标中的西边缘。</li>
 *     <li><code>{southProjected}</code>: 瓦片在瓦片方案的投影坐标中的南边缘。</li>
 *     <li><code>{eastProjected}</code>: 瓦片在瓦片方案的投影坐标中的东边缘。</li>
 *     <li><code>{northProjected}</code>: 瓦片在瓦片方案的投影坐标中的北边缘。</li>
 *     <li><code>{width}</code>: 每个瓦片的宽度（以像素为单位）。</li>
 *     <li><code>{height}</code>: 每个瓦片的高度（以像素为单位）。</li>
 * </ul>
 * @property {Resource|string} [pickFeaturesUrl] 用于选择特征的URL模板。如果未指定此属性，
 *                 {@link UrlTemplateImageryProvider#pickFeatures} 将立即返回 undefined，表示没有
 *                 被选中的特征。URL模板支持 <code>url</code> 参数支持的所有关键字，以及以下内容：
 * <ul>
 *     <li><code>{i}</code>: 被选中位置的像素列（水平坐标），其中最西的像素为0。</li>
 *     <li><code>{j}</code>: 被选中位置的像素行（垂直坐标），其中最北的像素为0。</li>
 *     <li><code>{reverseI}</code>: 被选中位置的像素列（水平坐标），其中最东的像素为0。</li>
 *     <li><code>{reverseJ}</code>: 被选中位置的像素行（垂直坐标），其中最南的像素为0。</li>
 *     <li><code>{longitudeDegrees}</code>: 被选中位置的经度（以度为单位）。</li>
 *     <li><code>{latitudeDegrees}</code>: 被选中位置的纬度（以度为单位）。</li>
 *     <li><code>{longitudeProjected}</code>: 被选中位置的经度在瓦片方案的投影坐标中。</li>
 *     <li><code>{latitudeProjected}</code>: 被选中位置的纬度在瓦片方案的投影坐标中。</li>
 *     <li><code>{format}</code>: 获取特征信息的格式，如 {@link GetFeatureInfoFormat} 中所指定的。</li>
 * </ul>
 * @property {object} [urlSchemeZeroPadding] 获取每个瓦片坐标的URL方案零填充。格式为 '000'，每个坐标将在左侧用零填充以匹配传递的零字符串的宽度。例如，设置：
 * urlSchemeZeroPadding : { '{x}' : '0000'}
 * 将导致 'x' 值为12时，在生成的URL中 {x} 返回字符串 '0012'。
 * 传递的对象具有以下关键字：
 * <ul>
 *  <li><code>{z}</code>: 瓦片在瓦片方案中的级别的零填充。</li>
 *  <li><code>{x}</code>: 瓦片在瓦片方案中的X坐标的零填充。</li>
 *  <li><code>{y}</code>: 瓦片在瓦片方案中的Y坐标的零填充。</li>
 *  <li><code>{reverseX}</code>: 瓦片在瓦片方案中的reverseX坐标的零填充。</li>
 *  <li><code>{reverseY}</code>: 瓦片在瓦片方案中的reverseY坐标的零填充。</li>
 *  <li><code>{reverseZ}</code>: 瓦片在瓦片方案中的reverseZ坐标的零填充。</li>
 * </ul>
 * @property {string|string[]} [subdomains='abc'] 用于URL模板中 <code>{s}</code> 占位符的子域。
 *                          如果此参数是一个单独的字符串，则字符串中的每个字符都是一个子域。如果是
 *                          数组，则数组中的每个元素都是一个子域。
 * @property {Credit|string} [credit=''] 数据源的信用信息，将显示在画布上。
 * @property {number} [minimumLevel=0] 影像提供者支持的最小细节级别。指定此时要注意
 *                 最小级别的瓦片数量较小，如四个或更少。较大的数量可能会
 *                 导致渲染问题。
 * @property {number} [maximumLevel] 影像提供者支持的最大细节级别，如果没有限制，则为undefined。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形（单位为弧度）。
 * @property {TilingScheme} [tilingScheme=WebMercatorTilingScheme] 指定如何将椭球表面划分为瓦片的瓦片方案。
 *                    如果未提供此参数，则使用 {@link WebMercatorTilingScheme}。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果指定瓦片方案，
 *                    则忽略此参数并使用瓦片方案的椭球体。如果两个参数都未指定，则使用WGS84椭球体。
 * @property {number} [tileWidth=256] 图像瓦片的像素宽度。
 * @property {number} [tileHeight=256] 图像瓦片的像素高度。
 * @property {boolean} [hasAlphaChannel=true] 如果此影像提供者提供的图像
 *                  包含alpha通道，则为true；否则为false。如果该属性为false，则如果
 *                  alpha通道存在，将被忽略。如果该属性为true，则任何没有alpha通道的图像
 *                  将被视为其alpha在所有地方为1.0。当此属性为false时，内存使用量
 *                  和纹理上传时间可能会减少。
 * @property {GetFeatureInfoFormat[]} [getFeatureInfoFormats] 在 {@link UrlTemplateImageryProvider#pickFeatures} 被调用时，在特定位置获取特征信息的格式。如果未
 *                                 指定此参数，则禁用特征选择。
 * @property {boolean} [enablePickFeatures=true] 如果为true，则{@link UrlTemplateImageryProvider#pickFeatures}将
 *        请求 <code>pickFeaturesUrl</code> 并尝试解释响应中包含的特征。如果为false，
 *        {@link UrlTemplateImageryProvider#pickFeatures}将立即返回undefined（表示没有可选择的
 *        特征），而不与服务器通信。如果您知道数据
 *        源不支持选择特征，或者不希望该提供者的特征可以选择，则将此属性设置为false。注意
 *        这可以通过修改 {@link UriTemplateImageryProvider#enablePickFeatures}
 *        属性动态覆盖。
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 根据某些标准丢弃瓦片图像的策略。
 * @property {Object} [customTags] 允许在URL模板中替换自定义关键字。对象必须具有字符串作为键和函数作为值。
 */


/**
 * 通过使用指定的URL模板请求瓦片来提供影像。
 *
 * @alias UrlTemplateImageryProvider
 * @constructor
 *
 * @param {UrlTemplateImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @example
 * // Access Natural Earth II imagery, which uses a TMS tiling scheme and Geographic (EPSG:4326) project
 * const tms = new Cesium.UrlTemplateImageryProvider({
 *     url : Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII') + '/{z}/{x}/{reverseY}.jpg',
 *     tilingScheme : new Cesium.GeographicTilingScheme(),
 *     maximumLevel : 5
 * });
 * // Access the CartoDB Positron basemap, which uses an OpenStreetMap-like tiling scheme.
 * const positron = new Cesium.UrlTemplateImageryProvider({
 *     url : 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
 *     credit : 'Map tiles by CartoDB, under CC BY 3.0. Data by OpenStreetMap, under ODbL.'
 * });
 * // Access a Web Map Service (WMS) server.
 * const wms = new Cesium.UrlTemplateImageryProvider({
 *    url : 'https://programs.communications.gov.au/geoserver/ows?tiled=true&' +
 *          'transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&' +
 *          'styles=&service=WMS&version=1.1.1&request=GetMap&' +
 *          'layers=public%3AMyBroadband_Availability&srs=EPSG%3A3857&' +
 *          'bbox={westProjected}%2C{southProjected}%2C{eastProjected}%2C{northProjected}&' +
 *          'width=256&height=256',
 *    rectangle : Cesium.Rectangle.fromDegrees(96.799393, -43.598214999057824, 153.63925700000001, -9.2159219997013)
 * });
 * // Using custom tags in your template url.
 * const custom = new Cesium.UrlTemplateImageryProvider({
 *    url : 'https://yoururl/{Time}/{z}/{y}/{x}.png',
 *    customTags : {
 *        Time: function(imageryProvider, x, y, level) {
 *            return '20171231'
 *        }
 *    }
 * });
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 */
function UrlTemplateImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._errorEvent = new Event();

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.url", options.url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(options.url);
  const pickFeaturesResource = Resource.createIfNeeded(options.pickFeaturesUrl);

  this._resource = resource;
  this._urlSchemeZeroPadding = options.urlSchemeZeroPadding;
  this._getFeatureInfoFormats = options.getFeatureInfoFormats;
  this._pickFeaturesResource = pickFeaturesResource;

  let subdomains = options.subdomains;
  if (Array.isArray(subdomains)) {
    subdomains = subdomains.slice();
  } else if (defined(subdomains) && subdomains.length > 0) {
    subdomains = subdomains.split("");
  } else {
    subdomains = ["a", "b", "c"];
  }
  this._subdomains = subdomains;

  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);
  this._minimumLevel = defaultValue(options.minimumLevel, 0);
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme = defaultValue(
    options.tilingScheme,
    new WebMercatorTilingScheme({ ellipsoid: options.ellipsoid }),
  );

  this._rectangle = defaultValue(
    options.rectangle,
    this._tilingScheme.rectangle,
  );
  this._rectangle = Rectangle.intersection(
    this._rectangle,
    this._tilingScheme.rectangle,
  );

  this._tileDiscardPolicy = options.tileDiscardPolicy;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;
  this._hasAlphaChannel = defaultValue(options.hasAlphaChannel, true);

  const customTags = options.customTags;
  const allTags = combine(tags, customTags);
  const allPickFeaturesTags = combine(pickFeaturesTags, customTags);
  this._tags = allTags;
  this._pickFeaturesTags = allPickFeaturesTags;

  this._defaultAlpha = undefined;
  this._defaultNightAlpha = undefined;
  this._defaultDayAlpha = undefined;
  this._defaultBrightness = undefined;
  this._defaultContrast = undefined;
  this._defaultHue = undefined;
  this._defaultSaturation = undefined;
  this._defaultGamma = undefined;
  this._defaultMinificationFilter = undefined;
  this._defaultMagnificationFilter = undefined;

  /**
   * 获取或设置一个值，指示是否启用特征选择。如果为true，{@link UrlTemplateImageryProvider#pickFeatures} 
   * 将请求 <code>options.pickFeaturesUrl</code> 并尝试解释响应中包含的特征。
   * 如果为false，{@link UrlTemplateImageryProvider#pickFeatures} 将立即返回undefined（表示没有可选择的特征），
   * 而不与服务器通信。如果您知道数据源不支持选择特征，或者不希望该提供者的特征可以选择，则将此属性设置为false。
   * @type {boolean}
   * @default true
   */

  this.enablePickFeatures = defaultValue(options.enablePickFeatures, true);
}

Object.defineProperties(UrlTemplateImageryProvider.prototype, {
  /**
   * 获取用于请求瓦片的URL模板。它具有以下关键字：
   * <ul>
   *  <li> <code>{z}</code>: 瓦片在瓦片方案中的级别。零级是四叉树金字塔的根。</li>
   *  <li> <code>{x}</code>: 瓦片在瓦片方案中的X坐标，其中0是最西的瓦片。</li>
   *  <li> <code>{y}</code>: 瓦片在瓦片方案中的Y坐标，其中0是最北的瓦片。</li>
   *  <li> <code>{s}</code>: 可用的子域之一，用于克服每个主机的同时请求数量限制。</li>
   *  <li> <code>{reverseX}</code>: 瓦片在瓦片方案中的X坐标，其中0是最东的瓦片。</li>
   *  <li> <code>{reverseY}</code>: 瓦片在瓦片方案中的Y坐标，其中0是最南的瓦片。</li>
   *  <li> <code>{reverseZ}</code>: 瓦片在瓦片方案中的级别，其中零级是四叉树金字塔的最大级别。使用reverseZ时，必须定义maximumLevel。</li>
   *  <li> <code>{westDegrees}</code>: 瓦片在大地度数中的西边缘。</li>
   *  <li> <code>{southDegrees}</code>: 瓦片在大地度数中的南边缘。</li>
   *  <li> <code>{eastDegrees}</code>: 瓦片在大地度数中的东边缘。</li>
   *  <li> <code>{northDegrees}</code>: 瓦片在大地度数中的北边缘。</li>
   *  <li> <code>{westProjected}</code>: 瓦片在瓦片方案的投影坐标中的西边缘。</li>
   *  <li> <code>{southProjected}</code>: 瓦片在瓦片方案的投影坐标中的南边缘。</li>
   *  <li> <code>{eastProjected}</code>: 瓦片在瓦片方案的投影坐标中的东边缘。</li>
   *  <li> <code>{northProjected}</code>: 瓦片在瓦片方案的投影坐标中的北边缘。</li>
   *  <li> <code>{width}</code>: 每个瓦片的宽度（以像素为单位）。</li>
   *  <li> <code>{height}</code>: 每个瓦片的高度（以像素为单位）。</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {string}
   * @readonly
   */

  url: {
    get: function () {
      return this._resource.url;
    },
  },

  /**
   * 获取每个瓦片坐标的URL方案零填充。格式为 '000'，每个坐标将在左侧用零填充
   * 以匹配传递的零字符串的宽度。例如，设置：
   * urlSchemeZeroPadding : { '{x}' : '0000'}
   * 将导致 'x' 值为12时，在生成的URL中 {x} 返回字符串 '0012'。
   * 它具有以下关键字：
   * <ul>
   *  <li> <code>{z}</code>: 瓦片在瓦片方案中的级别的零填充。</li>
   *  <li> <code>{x}</code>: 瓦片在瓦片方案中的X坐标的零填充。</li>
   *  <li> <code>{y}</code>: 瓦片在瓦片方案中的Y坐标的零填充。</li>
   *  <li> <code>{reverseX}</code>: 瓦片在瓦片方案中的reverseX坐标的零填充。</li>
   *  <li> <code>{reverseY}</code>: 瓦片在瓦片方案中的reverseY坐标的零填充。</li>
   *  <li> <code>{reverseZ}</code>: 瓦片在瓦片方案中的reverseZ坐标的零填充。</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {object}
   * @readonly
   */

  urlSchemeZeroPadding: {
    get: function () {
      return this._urlSchemeZeroPadding;
    },
  },

  /**
   * 获取用于选择特征的URL模板。如果未指定此属性，
   * {@link UrlTemplateImageryProvider#pickFeatures} 将立即返回 undefined，表示没有
   * 被选中的特征。URL模板支持所有由
   * {@link UrlTemplateImageryProvider#url} 属性支持的关键字，以及以下：
   * <ul>
   *     <li><code>{i}</code>: 被选中位置的像素列（水平坐标），其中最西的像素为0。</li>
   *     <li><code>{j}</code>: 被选中位置的像素行（垂直坐标），其中最北的像素为0。</li>
   *     <li><code>{reverseI}</code>: 被选中位置的像素列（水平坐标），其中最东的像素为0。</li>
   *     <li><code>{reverseJ}</code>: 被选中位置的像素行（垂直坐标），其中最南的像素为0。</li>
   *     <li><code>{longitudeDegrees}</code>: 被选中位置的经度（以度为单位）。</li>
   *     <li><code>{latitudeDegrees}</code>: 被选中位置的纬度（以度为单位）。</li>
   *     <li><code>{longitudeProjected}</code>: 被选中位置的经度在瓦片方案的投影坐标中。</li>
   *     <li><code>{latitudeProjected}</code>: 被选中位置的纬度在瓦片方案的投影坐标中。</li>
   *     <li><code>{format}</code>: 获取特征信息的格式，如 {@link GetFeatureInfoFormat} 中所指定的。</li>
   * </ul>
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {string}
   * @readonly
   */

  pickFeaturesUrl: {
    get: function () {
      return this._pickFeaturesResource.url;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   * @default undefined
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 256
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 256
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可以请求的最大细节级别，如果没有限制则为undefined。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   * @default undefined
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可以请求的最小细节级别。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {number}
   * @readonly
   * @default 0
   */
  minimumLevel: {
    get: function () {
      return this._minimumLevel;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   * @default new WebMercatorTilingScheme()
   */

  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

 /**
   * 获取此实例提供的影像的矩形（单位为弧度）。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   * @default tilingScheme.rectangle
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果不为undefined，则丢弃策略负责
   * 通过其shouldDiscardImage函数过滤掉“缺失”瓦片。如果该函数
   * 返回undefined，则不会过滤任何瓦片。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   * @default undefined
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取每当影像提供者遇到异步错误时触发的事件。通过订阅
   * 此事件，您将被通知错误并可能能够从中恢复。事件监听器
   * 会接收一个 {@link TileProviderError} 的实例。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在此影像提供者激活时显示的信用信息。通常用于标明
   * 影像的来源。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {Credit}
   * @readonly
   * @default undefined
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含alpha通道。
   * 如果该属性为false，则如果存在，将忽略alpha通道。如果该属性为true，则任何没有alpha通道的图像
   * 将被视为其alpha在所有地方为1.0。当此属性为false时，内存使用量
   * 和纹理上传时间会减少。
   * @memberof UrlTemplateImageryProvider.prototype
   * @type {boolean}
   * @readonly
   * @default true
   */

  hasAlphaChannel: {
    get: function () {
      return this._hasAlphaChannel;
    },
  },
});

/**
 * 获取在显示给定瓦片时要显示的信用信息。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别；
 * @returns {Credit[]} 显示瓦片时要展示的信用信息。
 */
UrlTemplateImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅用于内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 一个图像的承诺，当图像可用时将解析，或者
 *          如果对服务器的活动请求过多，则返回undefined，该请求应在稍后重试。
 */

UrlTemplateImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  return ImageryProvider.loadImage(
    this,
    buildImageResource(this, x, y, level, request),
  );
};

/**
 * 异步确定在给定经度和纬度内的瓦片中是否存在特征（如果有）。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个关于被选中特征的承诺，当异步选择完成时将解析。解析值是一个 {@link ImageryLayerFeatureInfo} 实例的数组。 如果在给定位置没有找到特征，数组可能为空。如果不支持选择，也可能返回undefined。
 */

UrlTemplateImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  if (
    !this.enablePickFeatures ||
    !defined(this._pickFeaturesResource) ||
    this._getFeatureInfoFormats.length === 0
  ) {
    return undefined;
  }

  let formatIndex = 0;

  const that = this;

  function handleResponse(format, data) {
    return format.callback(data);
  }

  function doRequest() {
    if (formatIndex >= that._getFeatureInfoFormats.length) {
      // No valid formats, so no features picked.
      return Promise.resolve([]);
    }

    const format = that._getFeatureInfoFormats[formatIndex];
    const resource = buildPickFeaturesResource(
      that,
      x,
      y,
      level,
      longitude,
      latitude,
      format.format,
    );

    ++formatIndex;

    if (format.type === "json") {
      return resource.fetchJson().then(format.callback).catch(doRequest);
    } else if (format.type === "xml") {
      return resource.fetchXML().then(format.callback).catch(doRequest);
    } else if (format.type === "text" || format.type === "html") {
      return resource.fetchText().then(format.callback).catch(doRequest);
    }
    return resource
      .fetch({
        responseType: format.format,
      })
      .then(handleResponse.bind(undefined, format))
      .catch(doRequest);
  }

  return doRequest();
};

let degreesScratchComputed = false;
const degreesScratch = new Rectangle();
let projectedScratchComputed = false;
const projectedScratch = new Rectangle();

function buildImageResource(imageryProvider, x, y, level, request) {
  degreesScratchComputed = false;
  projectedScratchComputed = false;

  const resource = imageryProvider._resource;
  const url = resource.getUrlComponent(true);
  const allTags = imageryProvider._tags;
  const templateValues = {};

  const match = url.match(templateRegex);
  if (defined(match)) {
    match.forEach(function (tag) {
      const key = tag.substring(1, tag.length - 1); //strip {}
      if (defined(allTags[key])) {
        templateValues[key] = allTags[key](imageryProvider, x, y, level);
      }
    });
  }

  return resource.getDerivedResource({
    request: request,
    templateValues: templateValues,
  });
}

let ijScratchComputed = false;
const ijScratch = new Cartesian2();
let longitudeLatitudeProjectedScratchComputed = false;

function buildPickFeaturesResource(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  degreesScratchComputed = false;
  projectedScratchComputed = false;
  ijScratchComputed = false;
  longitudeLatitudeProjectedScratchComputed = false;

  const resource = imageryProvider._pickFeaturesResource;
  const url = resource.getUrlComponent(true);
  const allTags = imageryProvider._pickFeaturesTags;
  const templateValues = {};
  const match = url.match(templateRegex);
  if (defined(match)) {
    match.forEach(function (tag) {
      const key = tag.substring(1, tag.length - 1); //strip {}
      if (defined(allTags[key])) {
        templateValues[key] = allTags[key](
          imageryProvider,
          x,
          y,
          level,
          longitude,
          latitude,
          format,
        );
      }
    });
  }

  return resource.getDerivedResource({
    templateValues: templateValues,
  });
}

function padWithZerosIfNecessary(imageryProvider, key, value) {
  if (
    imageryProvider &&
    imageryProvider.urlSchemeZeroPadding &&
    imageryProvider.urlSchemeZeroPadding.hasOwnProperty(key)
  ) {
    const paddingTemplate = imageryProvider.urlSchemeZeroPadding[key];
    if (typeof paddingTemplate === "string") {
      const paddingTemplateWidth = paddingTemplate.length;
      if (paddingTemplateWidth > 1) {
        value =
          value.length >= paddingTemplateWidth
            ? value
            : new Array(
                paddingTemplateWidth - value.toString().length + 1,
              ).join("0") + value;
      }
    }
  }
  return value;
}

function xTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{x}", x);
}

function reverseXTag(imageryProvider, x, y, level) {
  const reverseX =
    imageryProvider.tilingScheme.getNumberOfXTilesAtLevel(level) - x - 1;
  return padWithZerosIfNecessary(imageryProvider, "{reverseX}", reverseX);
}

function yTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{y}", y);
}

function reverseYTag(imageryProvider, x, y, level) {
  const reverseY =
    imageryProvider.tilingScheme.getNumberOfYTilesAtLevel(level) - y - 1;
  return padWithZerosIfNecessary(imageryProvider, "{reverseY}", reverseY);
}

function reverseZTag(imageryProvider, x, y, level) {
  const maximumLevel = imageryProvider.maximumLevel;
  const reverseZ =
    defined(maximumLevel) && level < maximumLevel
      ? maximumLevel - level - 1
      : level;
  return padWithZerosIfNecessary(imageryProvider, "{reverseZ}", reverseZ);
}

function zTag(imageryProvider, x, y, level) {
  return padWithZerosIfNecessary(imageryProvider, "{z}", level);
}

function sTag(imageryProvider, x, y, level) {
  const index = (x + y + level) % imageryProvider._subdomains.length;
  return imageryProvider._subdomains[index];
}

function computeDegrees(imageryProvider, x, y, level) {
  if (degreesScratchComputed) {
    return;
  }

  imageryProvider.tilingScheme.tileXYToRectangle(x, y, level, degreesScratch);
  degreesScratch.west = CesiumMath.toDegrees(degreesScratch.west);
  degreesScratch.south = CesiumMath.toDegrees(degreesScratch.south);
  degreesScratch.east = CesiumMath.toDegrees(degreesScratch.east);
  degreesScratch.north = CesiumMath.toDegrees(degreesScratch.north);

  degreesScratchComputed = true;
}

function westDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.west;
}

function southDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.south;
}

function eastDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.east;
}

function northDegreesTag(imageryProvider, x, y, level) {
  computeDegrees(imageryProvider, x, y, level);
  return degreesScratch.north;
}

function computeProjected(imageryProvider, x, y, level) {
  if (projectedScratchComputed) {
    return;
  }

  imageryProvider.tilingScheme.tileXYToNativeRectangle(
    x,
    y,
    level,
    projectedScratch,
  );

  projectedScratchComputed = true;
}

function westProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.west;
}

function southProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.south;
}

function eastProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.east;
}

function northProjectedTag(imageryProvider, x, y, level) {
  computeProjected(imageryProvider, x, y, level);
  return projectedScratch.north;
}

function widthTag(imageryProvider, x, y, level) {
  return imageryProvider.tileWidth;
}

function heightTag(imageryProvider, x, y, level) {
  return imageryProvider.tileHeight;
}

function iTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return ijScratch.x;
}

function jTag(imageryProvider, x, y, level, longitude, latitude, format) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return ijScratch.y;
}

function reverseITag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return imageryProvider.tileWidth - ijScratch.x - 1;
}

function reverseJTag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  computeIJ(imageryProvider, x, y, level, longitude, latitude);
  return imageryProvider.tileHeight - ijScratch.y - 1;
}

const rectangleScratch = new Rectangle();
const longitudeLatitudeProjectedScratch = new Cartesian3();

function computeIJ(imageryProvider, x, y, level, longitude, latitude, format) {
  if (ijScratchComputed) {
    return;
  }

  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude,
  );
  const projected = longitudeLatitudeProjectedScratch;

  const rectangle = imageryProvider.tilingScheme.tileXYToNativeRectangle(
    x,
    y,
    level,
    rectangleScratch,
  );
  ijScratch.x =
    ((imageryProvider.tileWidth * (projected.x - rectangle.west)) /
      rectangle.width) |
    0;
  ijScratch.y =
    ((imageryProvider.tileHeight * (rectangle.north - projected.y)) /
      rectangle.height) |
    0;
  ijScratchComputed = true;
}

function longitudeDegreesTag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  return CesiumMath.toDegrees(longitude);
}

function latitudeDegreesTag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  return CesiumMath.toDegrees(latitude);
}

function longitudeProjectedTag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude,
  );
  return longitudeLatitudeProjectedScratch.x;
}

function latitudeProjectedTag(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  computeLongitudeLatitudeProjected(
    imageryProvider,
    x,
    y,
    level,
    longitude,
    latitude,
  );
  return longitudeLatitudeProjectedScratch.y;
}

const cartographicScratch = new Cartographic();

function computeLongitudeLatitudeProjected(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  format,
) {
  if (longitudeLatitudeProjectedScratchComputed) {
    return;
  }

  if (imageryProvider.tilingScheme.projection instanceof GeographicProjection) {
    longitudeLatitudeProjectedScratch.x = CesiumMath.toDegrees(longitude);
    longitudeLatitudeProjectedScratch.y = CesiumMath.toDegrees(latitude);
  } else {
    const cartographic = cartographicScratch;
    cartographic.longitude = longitude;
    cartographic.latitude = latitude;
    imageryProvider.tilingScheme.projection.project(
      cartographic,
      longitudeLatitudeProjectedScratch,
    );
  }

  longitudeLatitudeProjectedScratchComputed = true;
}

function formatTag(imageryProvider, x, y, level, longitude, latitude, format) {
  return format;
}
export default UrlTemplateImageryProvider;
