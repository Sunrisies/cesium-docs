import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import Resource from "../Core/Resource.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import GetFeatureInfoFormat from "./GetFeatureInfoFormat.js";
import TimeDynamicImagery from "./TimeDynamicImagery.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

/**
 * 已知包含反转坐标轴顺序但不在 4000-5000 范围内的 EPSG 代码。
 *
 * @type {number[]}
 */

const includesReverseAxis = [
  3034, // ETRS89-extended / LCC Europe
  3035, // ETRS89-extended / LAEA Europe
  3042, // ETRS89 / UTM zone 30N (N-E)
  3043, // ETRS89 / UTM zone 31N (N-E)
  3044, // ETRS89 / UTM zone 32N (N-E)
];

/**
 * 已知不包含反转坐标轴顺序且在 4000-5000 范围内的 EPSG 代码。
 *
 * @type {number[]}
 */

const excludesReverseAxis = [
  4471, // Mayotte
  4559, // French Antilles
];

/**
 * @typedef {object} WebMapServiceImageryProvider.ConstructorOptions
 *
 * WebMapServiceImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url WMS 服务的 URL。该 URL 支持与 {@link UrlTemplateImageryProvider} 相同的关键字。
 * @property {string} layers 要包括的图层，以逗号分隔。
 * @property {object} [parameters=WebMapServiceImageryProvider.DefaultParameters] 要传递给 WMS 服务器的 GetMap URL 中的附加参数。
 * @property {object} [getFeatureInfoParameters=WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters] 要传递给 WMS 服务器的 GetFeatureInfo URL 中的附加参数。
 * @property {boolean} [enablePickFeatures=true] 如果为 true，{@link WebMapServiceImageryProvider#pickFeatures} 将调用
 *        WMS 服务器的 GetFeatureInfo 操作，并返回响应中包含的特征。如果为 false，
 *        {@link WebMapServiceImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可选特征）
 *        而不与服务器通信。如果您知道您的 WMS 服务器不支持
 *        GetFeatureInfo 或者如果您不希望该提供者的特征可被选取，请将此属性设置为 false。请注意，这可以通过动态地
 *        修改 WebMapServiceImageryProvider#enablePickFeatures 属性来覆盖。
 * @property {GetFeatureInfoFormat[]} [getFeatureInfoFormats=WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats] 尝试 WMS GetFeatureInfo 请求的格式。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形范围。
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 用于将世界分割为瓦片的瓦片方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果指定了瓦片方案，
 *        则忽略此参数，使用瓦片方案的椭球体。如果两个参数都未指定，则使用 WGS84 椭球体。
 * @property {number} [tileWidth=256] 每个瓦片的宽度（以像素为单位）。
 * @property {number} [tileHeight=256] 每个瓦片的高度（以像素为单位）。
 * @property {number} [minimumLevel=0] 地影提供者支持的最小细节级别。在指定时要注意，最低级别的瓦片数量应较少，例如四个或更少。较大的数量可能会导致呈现问题。
 * @property {number} [maximumLevel] 地影提供者支持的最大细节级别，如果没有限制则为 undefined。
 *        如果未指定，则没有限制。
 * @property {string} [crs] CRS 规范，用于 WMS 规范 >= 1.3.0。
 * @property {string} [srs] SRS 规范，用于 WMS 规范 1.1.0 或 1.1.1
 * @property {Credit|string} [credit] 数据源的信用信息，将显示在画布上。
 * @property {string|string[]} [subdomains='abc'] 用于 URL 模板中的 <code>{s}</code> 占位符的子域。
 *                          如果此参数是单个字符串，则该字符串中的每个字符都是一个子域。如果是
 *                          数组，则数组中的每个元素都是一个子域。
 * @property {Clock} [clock] 在确定时间维度的值时使用的 Clock 实例。当指定了 `times` 时需要。
 * @property {TimeIntervalCollection} [times] 其 data 属性为一个对象的 TimeIntervalCollection，包含时间动态维度及其值。
 * @property {Resource|string} [getFeatureInfoUrl] WMS 服务的 getFeatureInfo URL。如果该属性未定义，则使用 url 的属性值。
 */

/**
 * 提供由 Web 地图服务（WMS）服务器托管的瓦片影像。
 *
 * @alias WebMapServiceImageryProvider
 * @constructor
 *
 * @param {WebMapServiceImageryProvider.ConstructorOptions} options 描述初始化选项的对象。
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 * @see {@link http://resources.esri.com/help/9.3/arcgisserver/apis/rest/|ArcGIS Server REST API}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 *
 * @example
 * const provider = new Cesium.WebMapServiceImageryProvider({
 *     url : 'https://sampleserver1.arcgisonline.com/ArcGIS/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer',
 *     layers : '0',
 *     proxy: new Cesium.DefaultProxy('/proxy/')
 * });
 * const imageryLayer = new Cesium.ImageryLayer(provider);
 * viewer.imageryLayers.add(imageryLayer);
 */
function WebMapServiceImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.url)) {
    throw new DeveloperError("options.url is required.");
  }
  if (!defined(options.layers)) {
    throw new DeveloperError("options.layers is required.");
  }
  //>>includeEnd('debug');

  if (defined(options.times) && !defined(options.clock)) {
    throw new DeveloperError(
      "options.times was specified, so options.clock is required.",
    );
  }

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

  this._getFeatureInfoUrl = defaultValue(
    options.getFeatureInfoUrl,
    options.url,
  );

  const resource = Resource.createIfNeeded(options.url);
  const pickFeatureResource = Resource.createIfNeeded(this._getFeatureInfoUrl);

  resource.setQueryParameters(
    WebMapServiceImageryProvider.DefaultParameters,
    true,
  );
  pickFeatureResource.setQueryParameters(
    WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters,
    true,
  );

  if (defined(options.parameters)) {
    resource.setQueryParameters(objectToLowercase(options.parameters));
  }

  if (defined(options.getFeatureInfoParameters)) {
    pickFeatureResource.setQueryParameters(
      objectToLowercase(options.getFeatureInfoParameters),
    );
  }

  const that = this;
  this._reload = undefined;
  if (defined(options.times)) {
    this._timeDynamicImagery = new TimeDynamicImagery({
      clock: options.clock,
      times: options.times,
      requestImageFunction: function (x, y, level, request, interval) {
        return requestImage(that, x, y, level, request, interval);
      },
      reloadFunction: function () {
        if (defined(that._reload)) {
          that._reload();
        }
      },
    });
  }

  const parameters = {};
  parameters.layers = options.layers;
  parameters.bbox =
    "{westProjected},{southProjected},{eastProjected},{northProjected}";
  parameters.width = "{width}";
  parameters.height = "{height}";

  // Use SRS or CRS based on the WMS version.
  if (parseFloat(resource.queryParameters.version) >= 1.3) {
    // Use CRS with 1.3.0 and going forward.
    // For GeographicTilingScheme, use CRS:84 vice EPSG:4326 to specify lon, lat (x, y) ordering for
    // bbox requests.
    parameters.crs = defaultValue(
      options.crs,
      options.tilingScheme &&
        options.tilingScheme.projection instanceof WebMercatorProjection
        ? "EPSG:3857"
        : "CRS:84",
    );

    // The axis order in previous versions of the WMS specifications was to always use easting (x or lon ) and northing (y or
    // lat). WMS 1.3.0 specifies that, depending on the particular CRS, the x axis may or may not be oriented West-to-East,
    // and the y axis may or may not be oriented South-to-North. The WMS portrayal operation shall account for axis order.
    // This affects some of the EPSG codes that were commonly used such as ESPG:4326. The current implementation
    // makes sure that coordinates passed to the server (as part of the GetMap BBOX parameter) as well as those advertised
    // in the capabilities document reflect the inverse axe orders for EPSG codes between 4000 and 5000.
    //  - Taken from Section 9.1.3 of https://download.osgeo.org/mapserver/docs/MapServer-56.pdf
    const parts = parameters.crs.split(":");
    if (parts[0] === "EPSG" && parts.length === 2) {
      const code = Number(parts[1]);
      if (
        (code >= 4000 && code < 5000 && !excludesReverseAxis.includes(code)) ||
        includesReverseAxis.includes(code)
      ) {
        parameters.bbox =
          "{southProjected},{westProjected},{northProjected},{eastProjected}";
      }
    }
  } else {
    // SRS for WMS 1.1.0 or 1.1.1.
    parameters.srs = defaultValue(
      options.srs,
      options.tilingScheme &&
        options.tilingScheme.projection instanceof WebMercatorProjection
        ? "EPSG:3857"
        : "EPSG:4326",
    );
  }

  resource.setQueryParameters(parameters, true);
  pickFeatureResource.setQueryParameters(parameters, true);

  const pickFeatureParams = {
    query_layers: options.layers,
    info_format: "{format}",
  };
  // use correct pixel coordinate identifier based on version
  if (parseFloat(pickFeatureResource.queryParameters.version) >= 1.3) {
    pickFeatureParams.i = "{i}";
    pickFeatureParams.j = "{j}";
  } else {
    pickFeatureParams.x = "{i}";
    pickFeatureParams.y = "{j}";
  }
  pickFeatureResource.setQueryParameters(pickFeatureParams, true);

  this._resource = resource;
  this._pickFeaturesResource = pickFeatureResource;
  this._layers = options.layers;

  // Let UrlTemplateImageryProvider do the actual URL building.
  this._tileProvider = new UrlTemplateImageryProvider({
    url: resource,
    pickFeaturesUrl: pickFeatureResource,
    tilingScheme: defaultValue(
      options.tilingScheme,
      new GeographicTilingScheme({ ellipsoid: options.ellipsoid }),
    ),
    rectangle: options.rectangle,
    tileWidth: options.tileWidth,
    tileHeight: options.tileHeight,
    minimumLevel: options.minimumLevel,
    maximumLevel: options.maximumLevel,
    subdomains: options.subdomains,
    tileDiscardPolicy: options.tileDiscardPolicy,
    credit: options.credit,
    getFeatureInfoFormats: defaultValue(
      options.getFeatureInfoFormats,
      WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats,
    ),
    enablePickFeatures: options.enablePickFeatures,
  });
}

function requestImage(imageryProvider, col, row, level, request, interval) {
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;
  const tileProvider = imageryProvider._tileProvider;

  if (defined(dynamicIntervalData)) {
    // We set the query parameters within the tile provider, because it is managing the query.
    tileProvider._resource.setQueryParameters(dynamicIntervalData);
  }
  return tileProvider.requestImage(col, row, level, request);
}

function pickFeatures(
  imageryProvider,
  x,
  y,
  level,
  longitude,
  latitude,
  interval,
) {
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;
  const tileProvider = imageryProvider._tileProvider;

  if (defined(dynamicIntervalData)) {
    // We set the query parameters within the tile provider, because it is managing the query.
    tileProvider._pickFeaturesResource.setQueryParameters(dynamicIntervalData);
  }
  return tileProvider.pickFeatures(x, y, level, longitude, latitude);
}

Object.defineProperties(WebMapServiceImageryProvider.prototype, {
  /**
   * 获取 WMS 服务器的 URL。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._resource._url;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取 WMS 图层的名称，以逗号分隔。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  layers: {
    get: function () {
      return this._layers;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileProvider.tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileProvider.tileHeight;
    },
  },

  /**
   * 获取可以请求的最大细节级别。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._tileProvider.maximumLevel;
    },
  },

  /**
   * 获取可以请求的最小细节级别。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._tileProvider.minimumLevel;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tileProvider.tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形范围（以弧度为单位）。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tileProvider.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉“缺失”瓦片。如果此函数
   * 返回 undefined，则不会过滤任何瓦片。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取一个事件，当影像提供者遇到异步错误时触发。通过订阅
   * 该事件，您将收到错误通知并可以潜在地从中恢复。事件监听器
   * 会接收一个 {@link TileProviderError} 的实例。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._tileProvider.errorEvent;
    },
  },

  /**
   * 获取此影像提供者处于活动状态时要显示的信用信息。通常用于致谢
   * 影像的来源。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._tileProvider.credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 alpha 通道。
   * 如果此属性为 false，则如果存在 alpha 通道将被忽略。
   * 如果此属性为 true，任何没有 alpha 通道的图像将被视为其 alpha
   * 在各处为 1.0。当此属性为 false 时，将减少内存使用
   * 和纹理上传时间。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._tileProvider.hasAlphaChannel;
    },
  },

  /**
   * 获取或设置一个值，指示是否启用特征选择。 如果为 true，{@link WebMapServiceImageryProvider#pickFeatures} 将
   * 调用 WMS 服务器上的 <code>GetFeatureInfo</code> 服务，并尝试解释响应中包含的特征。 如果为 false，
   * {@link WebMapServiceImageryProvider#pickFeatures} 将立即返回 undefined（表明没有可选特征）
   * 而不与服务器进行通信。如果您知道您的数据
   * 源不支持选择特征或不希望此提供者的特征可选，请将此属性设置为 false。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {boolean}
   * @default true
   */
  enablePickFeatures: {
    get: function () {
      return this._tileProvider.enablePickFeatures;
    },
    set: function (enablePickFeatures) {
      this._tileProvider.enablePickFeatures = enablePickFeatures;
    },
  },

  /**
   * 获取或设置一个时钟，用于获取时间动态参数的时间值。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Clock}
   */
  clock: {
    get: function () {
      return this._timeDynamicImagery.clock;
    },
    set: function (value) {
      this._timeDynamicImagery.clock = value;
    },
  },

  /**
   * 获取或设置用于获取时间动态参数的时间区间集合。每个
   * TimeInterval 的数据是一个对象，包含在
   * 瓦片请求时使用的属性的键和值。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {TimeIntervalCollection}
   */
  times: {
    get: function () {
      return this._timeDynamicImagery.times;
    },
    set: function (value) {
      this._timeDynamicImagery.times = value;
    },
  },

  /**
   * 获取 WMS 服务器的 getFeatureInfo URL。
   * @memberof WebMapServiceImageryProvider.prototype
   * @type {Resource|string}
   * @readonly
   */
  getFeatureInfoUrl: {
    get: function () {
      return this._getFeatureInfoUrl;
    },
  },
});

/**
 * 获取在显示给定瓦片时要显示的信用信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @returns {Credit[]} 在显示该瓦片时要显示的信用信息。
 */

WebMapServiceImageryProvider.prototype.getTileCredits = function (x, y, level) {
  return this._tileProvider.getTileCredits(x, y, level);
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象，仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 有关图像的承诺，当图像可用时解析，或者
 *          如果对服务器的活动请求太多，则返回 undefined，要求稍后重试该请求。
 */

WebMapServiceImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  let result;
  const timeDynamicImagery = this._timeDynamicImagery;
  let currentInterval;

  // Try and load from cache
  if (defined(timeDynamicImagery)) {
    currentInterval = timeDynamicImagery.currentInterval;
    result = timeDynamicImagery.getFromCache(x, y, level, request);
  }

  // Couldn't load from cache
  if (!defined(result)) {
    result = requestImage(this, x, y, level, request, currentInterval);
  }

  // If we are approaching an interval, preload this tile in the next interval
  if (defined(result) && defined(timeDynamicImagery)) {
    timeDynamicImagery.checkApproachingInterval(x, y, level, request);
  }

  return result;
};

/**
 * 异步确定在给定经度和纬度内的瓦片中是否存在特征（如果有的话）。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选取特征的经度。
 * @param {number} latitude 要选取特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个关于选取特征的承诺，当异步
 *                   选取完成时解析。解析的值是 {@link ImageryLayerFeatureInfo}
 *                   实例的数组。如果在给定位置未找到特征，则数组可能为空。
 */

WebMapServiceImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  const timeDynamicImagery = this._timeDynamicImagery;
  const currentInterval = defined(timeDynamicImagery)
    ? timeDynamicImagery.currentInterval
    : undefined;

  return pickFeatures(this, x, y, level, longitude, latitude, currentInterval);
};

/**
 * 获取图像时应包含在 WMS URL 中的默认参数。值如下：
 *    service=WMS
 *    version=1.1.1
 *    request=GetMap
 *    styles=
 *    format=image/jpeg
 *
 * @constant
 * @type {object}
 */

WebMapServiceImageryProvider.DefaultParameters = Object.freeze({
  service: "WMS",
  version: "1.1.1",
  request: "GetMap",
  styles: "",
  format: "image/jpeg",
});

/**
 * 获取特征信息时应包含在 WMS URL 中的默认参数。值如下：
 *     service=WMS
 *     version=1.1.1
 *     request=GetFeatureInfo
 *
 * @constant
 * @type {object}
 */

WebMapServiceImageryProvider.GetFeatureInfoDefaultParameters = Object.freeze({
  service: "WMS",
  version: "1.1.1",
  request: "GetFeatureInfo",
});

WebMapServiceImageryProvider.DefaultGetFeatureInfoFormats = Object.freeze([
  Object.freeze(new GetFeatureInfoFormat("json", "application/json")),
  Object.freeze(new GetFeatureInfoFormat("xml", "text/xml")),
  Object.freeze(new GetFeatureInfoFormat("text", "text/html")),
]);

function objectToLowercase(obj) {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key.toLowerCase()] = obj[key];
    }
  }
  return result;
}
export default WebMapServiceImageryProvider;
