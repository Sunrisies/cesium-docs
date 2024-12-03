import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import TileProviderError from "../Core/TileProviderError.js";
import ImageryProvider from "./ImageryProvider.js";

/**
 * @typedef {object} SingleTileImageryProvider.ConstructorOptions
 *
 * SingleTileImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url 瓦片的网址。
 * @property {number} [tileWidth] 瓦片的宽度（以像素为单位）。
 * @property {number} [tileHeight] 瓦片的高度（以像素为单位）。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形（以弧度为单位）。
 * @property {Credit|string} [credit] 数据源的信用信息，将显示在画布上。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果未指定，则使用 WGS84 椭球体。
 */


/**
 * 提供单个顶层影像瓦片。假定单个图像为地理投影（即 WGS84 / EPSG:4326），
 * 并将使用 {@link GeographicTilingScheme} 进行渲染。
 *
 * @alias SingleTileImageryProvider
 * @constructor
 *
 * @param {SingleTileImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 */

function SingleTileImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

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

  const rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
  const tilingScheme = new GeographicTilingScheme({
    rectangle: rectangle,
    numberOfLevelZeroTilesX: 1,
    numberOfLevelZeroTilesY: 1,
    ellipsoid: options.ellipsoid,
  });
  this._tilingScheme = tilingScheme;
  this._image = undefined;
  this._texture = undefined;

  this._hasError = false;
  this._errorEvent = new Event();

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.url", options.url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(options.url);
  this._resource = resource;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.tileWidth", options.tileWidth);
  Check.typeOf.number("options.tileHeight", options.tileHeight);
  //>>includeEnd('debug');

  this._tileWidth = options.tileWidth;
  this._tileHeight = options.tileHeight;
}

Object.defineProperties(SingleTileImageryProvider.prototype, {
  /**
   * 获取单个顶层影像瓦片的 URL。
   * @memberof SingleTileImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource.url;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度，单位为像素。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度，单位为像素。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可以请求的最大细节级别。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取可以请求的最小细节级别。
   * @memberof SingleTileImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return 0;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof SingleTileImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形，单位为弧度。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责通过其 shouldDiscardImage 函数筛选出“缺失”的瓦片。
   * 如果此函数返回未定义，则不会筛选任何瓦片。
   * @memberof SingleTileImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取当此影像提供者遇到异步错误时触发的事件。通过订阅该事件，您将被通知错误并可以潜在地从中恢复。事件监听器
   * 会传递一个 {@link TileProviderError} 的实例。
   * @memberof SingleTileImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 alpha 通道。如果此属性为 false，若存在，则将忽略 alpha 通道。
   * 如果此属性为 true，则没有 alpha 通道的任何图像将被视为其 alpha 在所有地方均为 1.0。当此属性为 false 时，减少内存使用
   * 和纹理上传时间。
   * @memberof SingleTileImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },
});


function failure(resource, error, provider, previousError) {
  let message = `Failed to load image ${resource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  const reportedError = TileProviderError.reportError(
    previousError,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
    0,
    0,
    0,
    error,
  );
  if (reportedError.retry) {
    return doRequest(resource, provider, reportedError);
  }

  if (defined(provider)) {
    provider._hasError = true;
  }
  throw new RuntimeError(message);
}

async function doRequest(resource, provider, previousError) {
  try {
    const image = await ImageryProvider.loadImage(null, resource);
    return image;
  } catch (error) {
    return failure(resource, error, provider, previousError);
  }
}

/**
 * @typedef {Object} SingleTileImageryProvider.fromUrlOptions
 *
 * 使用 SingleTileImageryProvider.fromUrl 时的 SingleTileImageryProvider 构造函数初始化选项
 *
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图像覆盖的矩形（以弧度为单位）。
 * @property {Credit|String} [credit] 数据源的信用信息，将显示在画布上。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果未指定，则使用 WGS84 椭球体。
 */

/**
 * 创建单个顶层影像瓦片的提供者。假定单个图像使用一个
 * @param {Resource|String} url 瓦片的网址
 * @param {SingleTileImageryProvider.fromUrlOptions} [options] 描述初始化选项的对象。
 * @returns {Promise.<SingleTileImageryProvider>} 解析后的 SingleTileImageryProvider。
 *
 * @example
 * const provider = await SingleTileImageryProvider.fromUrl("https://yoururl.com/image.png");
 */

SingleTileImageryProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);
  const image = await doRequest(resource);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const provider = new SingleTileImageryProvider({
    ...options,
    url: url,
    tileWidth: image.width,
    tileHeight: image.height,
  });
  provider._image = image;
  return provider;
};

/**
 * 获取在显示给定瓦片时要显示的信用信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别；
 * @returns {Credit[]} 在显示瓦片时要显示的信用信息。
 */
SingleTileImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise.<ImageryTypes>|undefined} 解析后的图像
 */

SingleTileImageryProvider.prototype.requestImage = async function (
  x,
  y,
  level,
  request,
) {
  if (!this._hasError && !defined(this._image)) {
    const image = await doRequest(this._resource, this);
    this._image = image;
    TileProviderError.reportSuccess(this._errorEvent);
    return image;
  }

  return this._image;
};

/**
 * 目前此影像提供者不支持拾取功能，因此此函数仅返回
 * 未定义。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片的级别。
 * @param {number} longitude 要拾取特征的经度。
 * @param {number} latitude 要拾取特征的纬度。
 * @return {undefined} 未定义，因为不支持拾取。
 */

SingleTileImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default SingleTileImageryProvider;
