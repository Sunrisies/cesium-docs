import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Resource from "../Core/Resource.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const trailingSlashRegex = /\/$/;
const defaultCredit = new Credit(
  '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/">Improve this map</a></strong>',
);

/**
 * @typedef {object} MapboxImageryProvider.ConstructorOptions
 *
 * MapboxImageryProvider 构造函数的初始化选项
 *
 * @property {string} [url='https://api.mapbox.com/v4/'] Mapbox 服务器的 URL。
 * @property {string} mapId Mapbox 地图 ID。
 * @property {string} accessToken 图像的公共访问令牌。
 * @property {string} [format='png'] 图像请求的格式。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，将使用默认椭球体。
 * @property {number} [minimumLevel=0] 图像提供者支持的最小细节级别。指定此值时要小心，最小级别的瓦片数量应较小，例如四个或更少。较大的数字可能导致渲染问题。
 * @property {number} [maximumLevel] 图像提供者支持的最大细节级别，或者如果没有限制则为未定义。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形区域（以弧度表示）。
 * @property {Credit|string} [credit] 数据源的授权信息，将显示在画布上。
 */


/**
 * 提供由 Mapbox 托管的图块图像。
 *
 * @alias MapboxImageryProvider
 * @constructor
 *
 * @param {MapboxImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @example
 * // Mapbox tile provider
 * const mapbox = new Cesium.MapboxImageryProvider({
 *     mapId: 'mapbox.mapbox-terrain-v2',
 *     accessToken: 'thisIsMyAccessToken'
 * });
 *
 * @see {@link https://docs.mapbox.com/api/maps/raster-tiles/}
 * @see {@link https://docs.mapbox.com/api/accounts/tokens/}
 */
function MapboxImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const mapId = options.mapId;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(mapId)) {
    throw new DeveloperError("options.mapId is required.");
  }
  //>>includeEnd('debug');

  const accessToken = options.accessToken;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(accessToken)) {
    throw new DeveloperError("options.accessToken is required.");
  }
  //>>includeEnd('debug');

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

  const resource = Resource.createIfNeeded(
    defaultValue(options.url, "https://{s}.tiles.mapbox.com/v4/"),
  );

  this._mapId = mapId;
  this._accessToken = accessToken;

  let format = defaultValue(options.format, "png");
  if (!/\./.test(format)) {
    format = `.${format}`;
  }
  this._format = format;

  let templateUrl = resource.getUrlComponent();
  if (!trailingSlashRegex.test(templateUrl)) {
    templateUrl += "/";
  }
  templateUrl += `${mapId}/{z}/{x}/{y}${this._format}`;
  resource.url = templateUrl;

  resource.setQueryParameters({
    access_token: accessToken,
  });

  let credit;
  if (defined(options.credit)) {
    credit = options.credit;
    if (typeof credit === "string") {
      credit = new Credit(credit);
    }
  } else {
    credit = defaultCredit;
  }

  this._resource = resource;
  this._imageryProvider = new UrlTemplateImageryProvider({
    url: resource,
    credit: credit,
    ellipsoid: options.ellipsoid,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    rectangle: options.rectangle,
  });
}

Object.defineProperties(MapboxImageryProvider.prototype, {
  /**
   * 获取 Mapbox 服务器的 URL。
   * @memberof MapboxImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._imageryProvider.url;
    },
  },

  /**
   * 获取实例提供的图像的矩形区域（以弧度表示）。
   * @memberof MapboxImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._imageryProvider.rectangle;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof MapboxImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._imageryProvider.tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof MapboxImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._imageryProvider.tileHeight;
    },
  },

  /**
   * 获取可请求的最大细节级别。
   * @memberof MapboxImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._imageryProvider.maximumLevel;
    },
  },

  /**
   * 获取可请求的最小细节级别。一般来说，
   * 仅在图像的矩形区域足够小以致于最小级别的瓦片数量较少时，
   * 应该使用最小级别。拥有多个以上瓦片的图像提供者在最小级别时会导致渲染问题。
   * @memberof MapboxImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._imageryProvider.minimumLevel;
    },
  },

  /**
   * 获取提供者使用的瓦片方案。
   * @memberof MapboxImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._imageryProvider.tilingScheme;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉“丢失”的瓦片。如果此函数
   * 返回未定义，则不过滤任何瓦片。
   * @memberof MapboxImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取在图像提供者遇到异步错误时引发的事件。通过订阅
   * 此事件，您将收到错误通知并可以潜在地恢复。事件监听器
   * 将传递 {@link TileProviderError} 的实例。
   * @memberof MapboxImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._imageryProvider.errorEvent;
    },
  },

  /**
   * 获取在此图像提供者处于活动状态时显示的信用信息。通常用于给出
   * 图像源的来源。
   * @memberof MapboxImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._imageryProvider.credit;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof MapboxImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._imageryProvider.proxy;
    },
  },

  /**
   * 获取一个值，指示此图像提供者提供的图像是否包含 alpha 通道。 如果此属性为 false，且存在 alpha 通道，将被忽略。 如果此属性为 true，任何没有 alpha 通道的图像都将被视为其 alpha 值在所有地方都是 1.0。 当此属性为 false 时，内存使用
   * 和纹理上传时间都会减少。
   * @memberof MapboxImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._imageryProvider.hasAlphaChannel;
    },
  },
});


/**
 * 获取在显示给定瓦片时要显示的信用信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 在显示瓦片时要显示的信用信息。
 */

MapboxImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 图像的承诺，当图像可用时将解决，或者
 *          如果对服务器的活动请求过多，则返回未定义，请求应稍后重试。
 */

MapboxImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return this._imageryProvider.requestImage(x, y, level, request);
};

/**
 * 异步确定在给定经度和纬度内的瓦片上是否存在特征（如果有）。
 * 该函数是可选的，因此可能并非所有 ImageryProviders 都存在此函数。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 选择的特征的承诺，当异步选择完成时将解决。
 *                   解析值是 {@link ImageryLayerFeatureInfo} 实例的数组。如果在给定位置未找到特征，
 *                   数组可能为空。如果不支持选择，则可能未定义。
 */

MapboxImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

// Exposed for tests
MapboxImageryProvider._defaultCredit = defaultCredit;
export default MapboxImageryProvider;
