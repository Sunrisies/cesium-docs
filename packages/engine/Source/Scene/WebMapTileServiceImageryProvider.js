import combine from "../Core/combine.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import ImageryProvider from "./ImageryProvider.js";
import TimeDynamicImagery from "./TimeDynamicImagery.js";

const defaultParameters = Object.freeze({
  service: "WMTS",
  version: "1.0.0",
  request: "GetTile",
});

/**
 * @typedef {object} WebMapTileServiceImageryProvider.ConstructorOptions
 *
 * WebMapTileServiceImageryProvider 构造函数的初始化选项
 *
 * @property {Resource|string} url WMTS GetTile 操作的基本 URL（用于 KVP 编码请求）或瓦片 URL 模板（用于 RESTful 请求）。瓦片 URL 模板应包含以下变量：&#123;style&#125;, &#123;TileMatrixSet&#125;, &#123;TileMatrix&#125;, &#123;TileRow&#125;, &#123;TileCol&#125;。如果实际值是硬编码或服务器不需要，这两个是可选的。&#123;s&#125; 关键字可用于指定子域。
 * @property {string} [format='image/jpeg'] 从服务器检索图像的 MIME 类型。
 * @property {string} layer WMTS 请求的图层名称。
 * @property {string} style WMTS 请求的样式名称。
 * @property {string} tileMatrixSetID 要用于 WMTS 请求的 TileMatrixSet 的标识符。
 * @property {Array} [tileMatrixLabels] 要用于 WMTS 请求的 TileMatrix 中的标识符列表，每个 TileMatrix 级别一个。
 * @property {Clock} [clock] 在确定时间维度的值时使用的时钟实例。当指定 `times` 时，这是必需的。
 * @property {TimeIntervalCollection} [times] 其 <code>data</code> 属性为包含时间动态维度及其值的对象的 TimeIntervalCollection。
 * @property {object} [dimensions] 包含静态维度及其值的对象。
 * @property {number} [tileWidth=256] 瓦片的宽度（以像素为单位）。
 * @property {number} [tileHeight=256] 瓦片的高度（以像素为单位）。
 * @property {TilingScheme} [tilingScheme] 与 TileMatrixSet 中瓦片组织相对应的瓦片方案。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层覆盖的矩形区域。
 * @property {number} [minimumLevel=0] 图像提供者支持的最小细节级别。
 * @property {number} [maximumLevel] 图像提供者支持的最大细节级别，如果没有限制则为未定义。
 * @property {Ellipsoid} [ellipsoid] 椭球。如果未指定，则使用 WGS84 椭球。
 * @property {Credit|string} [credit] 数据源的版权信息，将在画布上显示。
 * @property {string|string[]} [subdomains='abc'] 用于 URL 模板中 <code>{s}</code> 占位符的子域。如果此参数是单个字符串，则字符串中的每个字符都是一个子域。如果是数组，则数组中的每个元素都是一个子域。
 */


/**
 * 提供由符合 {@link http://www.opengeospatial.org/standards/wmts|WMTS 1.0.0} 标准的服务器提供的瓦片影像。
 * 该提供者支持 HTTP KVP 编码和 RESTful GetTile 请求，但尚不支持 SOAP 编码。
 *
 * @alias WebMapTileServiceImageryProvider
 * @constructor
 *
 * @param {WebMapTileServiceImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Web%20Map%20Tile%20Service%20with%20Time.html|Cesium Sandcastle Web Map Tile Service with Time Demo}
 *
 * @example
 * // Example 1. USGS shaded relief tiles (KVP)
 * const shadedRelief1 = new Cesium.WebMapTileServiceImageryProvider({
 *     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
 *     layer : 'USGSShadedReliefOnly',
 *     style : 'default',
 *     format : 'image/jpeg',
 *     tileMatrixSetID : 'default028mm',
 *     // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
 *     maximumLevel: 19,
 *     credit : new Cesium.Credit('U. S. Geological Survey')
 * });
 * viewer.imageryLayers.addImageryProvider(shadedRelief1);
 *
 * @example
 * // Example 2. USGS shaded relief tiles (RESTful)
 * const shadedRelief2 = new Cesium.WebMapTileServiceImageryProvider({
 *     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS/tile/1.0.0/USGSShadedReliefOnly/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
 *     layer : 'USGSShadedReliefOnly',
 *     style : 'default',
 *     format : 'image/jpeg',
 *     tileMatrixSetID : 'default028mm',
 *     maximumLevel: 19,
 *     credit : new Cesium.Credit('U. S. Geological Survey')
 * });
 * viewer.imageryLayers.addImageryProvider(shadedRelief2);
 *
 * @example
 * // Example 3. NASA time dynamic weather data (RESTful)
 * const times = Cesium.TimeIntervalCollection.fromIso8601({
 *     iso8601: '2015-07-30/2017-06-16/P1D',
 *     dataCallback: function dataCallback(interval, index) {
 *         return {
 *             Time: Cesium.JulianDate.toIso8601(interval.start)
 *         };
 *     }
 * });
 * const weather = new Cesium.WebMapTileServiceImageryProvider({
 *     url : 'https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/AMSR2_Snow_Water_Equivalent/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png',
 *     layer : 'AMSR2_Snow_Water_Equivalent',
 *     style : 'default',
 *     tileMatrixSetID : '2km',
 *     maximumLevel : 5,
 *     format : 'image/png',
 *     clock: clock,
 *     times: times,
 *     credit : new Cesium.Credit('NASA Global Imagery Browse Services for EOSDIS')
 * });
 * viewer.imageryLayers.addImageryProvider(weather);
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see UrlTemplateImageryProvider
 */
function WebMapTileServiceImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.url)) {
    throw new DeveloperError("options.url is required.");
  }
  if (!defined(options.layer)) {
    throw new DeveloperError("options.layer is required.");
  }
  if (!defined(options.style)) {
    throw new DeveloperError("options.style is required.");
  }
  if (!defined(options.tileMatrixSetID)) {
    throw new DeveloperError("options.tileMatrixSetID is required.");
  }
  if (defined(options.times) && !defined(options.clock)) {
    throw new DeveloperError(
      "options.times was specified, so options.clock is required.",
    );
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

  const resource = Resource.createIfNeeded(options.url);

  const style = options.style;
  const tileMatrixSetID = options.tileMatrixSetID;
  const url = resource.url;

  const bracketMatch = url.match(/{/g);
  if (
    !defined(bracketMatch) ||
    (bracketMatch.length === 1 && /{s}/.test(url))
  ) {
    resource.setQueryParameters(defaultParameters);
    this._useKvp = true;
  } else {
    const templateValues = {
      style: style,
      Style: style,
      TileMatrixSet: tileMatrixSetID,
    };

    resource.setTemplateValues(templateValues);
    this._useKvp = false;
  }

  this._resource = resource;
  this._layer = options.layer;
  this._style = style;
  this._tileMatrixSetID = tileMatrixSetID;
  this._tileMatrixLabels = options.tileMatrixLabels;
  this._format = defaultValue(options.format, "image/jpeg");
  this._tileDiscardPolicy = options.tileDiscardPolicy;

  this._tilingScheme = defined(options.tilingScheme)
    ? options.tilingScheme
    : new WebMercatorTilingScheme({ ellipsoid: options.ellipsoid });
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);

  this._minimumLevel = defaultValue(options.minimumLevel, 0);
  this._maximumLevel = options.maximumLevel;

  this._rectangle = defaultValue(
    options.rectangle,
    this._tilingScheme.rectangle,
  );
  this._dimensions = options.dimensions;

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

  // Check the number of tiles at the minimum level.  If it's more than four,
  // throw an exception, because starting at the higher minimum
  // level will cause too many tiles to be downloaded and rendered.
  const swTile = this._tilingScheme.positionToTileXY(
    Rectangle.southwest(this._rectangle),
    this._minimumLevel,
  );
  const neTile = this._tilingScheme.positionToTileXY(
    Rectangle.northeast(this._rectangle),
    this._minimumLevel,
  );
  const tileCount =
    (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
  //>>includeStart('debug', pragmas.debug);
  if (tileCount > 4) {
    throw new DeveloperError(
      `The imagery provider's rectangle and minimumLevel indicate that there are ${tileCount} tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.`,
    );
  }
  //>>includeEnd('debug');

  this._errorEvent = new Event();

  const credit = options.credit;
  this._credit = typeof credit === "string" ? new Credit(credit) : credit;

  this._subdomains = options.subdomains;
  if (Array.isArray(this._subdomains)) {
    this._subdomains = this._subdomains.slice();
  } else if (defined(this._subdomains) && this._subdomains.length > 0) {
    this._subdomains = this._subdomains.split("");
  } else {
    this._subdomains = ["a", "b", "c"];
  }
}

function requestImage(imageryProvider, col, row, level, request, interval) {
  const labels = imageryProvider._tileMatrixLabels;
  const tileMatrix = defined(labels) ? labels[level] : level.toString();
  const subdomains = imageryProvider._subdomains;
  const staticDimensions = imageryProvider._dimensions;
  const dynamicIntervalData = defined(interval) ? interval.data : undefined;

  let resource;
  let templateValues;
  if (!imageryProvider._useKvp) {
    templateValues = {
      TileMatrix: tileMatrix,
      TileRow: row.toString(),
      TileCol: col.toString(),
      s: subdomains[(col + row + level) % subdomains.length],
    };

    resource = imageryProvider._resource.getDerivedResource({
      request: request,
    });
    resource.setTemplateValues(templateValues);

    if (defined(staticDimensions)) {
      resource.setTemplateValues(staticDimensions);
    }

    if (defined(dynamicIntervalData)) {
      resource.setTemplateValues(dynamicIntervalData);
    }
  } else {
    // build KVP request
    let query = {};
    query.tilematrix = tileMatrix;
    query.layer = imageryProvider._layer;
    query.style = imageryProvider._style;
    query.tilerow = row;
    query.tilecol = col;
    query.tilematrixset = imageryProvider._tileMatrixSetID;
    query.format = imageryProvider._format;

    if (defined(staticDimensions)) {
      query = combine(query, staticDimensions);
    }

    if (defined(dynamicIntervalData)) {
      query = combine(query, dynamicIntervalData);
    }

    templateValues = {
      s: subdomains[(col + row + level) % subdomains.length],
    };

    resource = imageryProvider._resource.getDerivedResource({
      queryParameters: query,
      request: request,
    });
    resource.setTemplateValues(templateValues);
  }

  return ImageryProvider.loadImage(imageryProvider, resource);
}

Object.defineProperties(WebMapTileServiceImageryProvider.prototype, {
  /**
   * 获取承载影像的服务 URL。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度（以像素为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可以请求的最小细节级别。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return this._minimumLevel;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形（以弧度为单位）。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。如果此函数
   * 返回未定义，则没有瓦片被过滤。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取在影像提供者遇到异步错误时引发的事件。通过订阅
   * 该事件，您将被通知错误并可以潜在地从中恢复。事件监听器
   * 会接收到 {@link TileProviderError} 的实例。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取此影像提供者返回的图像的 MIME 类型。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  format: {
    get: function () {
      return this._format;
    },
  },

  /**
   * 获取激活此影像提供者时要显示的版权信息。通常用于给出
   * 影像的来源。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 alpha 通道。如果此属性为 false，则会忽略任何存在的 alpha 通道。如果此属性为 true，则任何没有 alpha 通道的图像都将被视为其 alpha 在各处为 1.0。当此属性为 false 时，内存使用和纹理上传时间会减少。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
    },
  },

  /**
   * 获取或设置用于获取时间动态参数的时钟。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * 获取或设置用于获取时间动态参数的时间区间集合。每个时间区间的数据是一个包含在瓦片请求期间使用的属性的键和值的对象。
   * @memberof WebMapTileServiceImageryProvider.prototype
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
   * 获取或设置包含静态维度及其值的对象。
   * @memberof WebMapTileServiceImageryProvider.prototype
   * @type {object}
   */
  dimensions: {
    get: function () {
      return this._dimensions;
    },
    set: function (value) {
      if (this._dimensions !== value) {
        this._dimensions = value;
        if (defined(this._reload)) {
          this._reload();
        }
      }
    },
  },
});


/**
 * 获取在显示给定瓦片时要显示的版权信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @returns {Credit[]} 在显示瓦片时要显示的版权信息。
 */
WebMapTileServiceImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 图像的承诺，该承诺将在图像可用时解析，或者
 *          如果活动请求过多，则返回未定义，请求应稍后重试。
 */

WebMapTileServiceImageryProvider.prototype.requestImage = function (
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
 * 当前不支持此影像提供者的特征选择，因此此函数仅返回
 * 未定义。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {undefined} 未定义，因为不支持选择功能。
 */

WebMapTileServiceImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default WebMapTileServiceImageryProvider;
