import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import IonResource from "../Core/IonResource.js";
import RuntimeError from "../Core/RuntimeError.js";
import ArcGisMapServerImageryProvider from "./ArcGisMapServerImageryProvider.js";
import BingMapsImageryProvider from "./BingMapsImageryProvider.js";
import TileMapServiceImageryProvider from "./TileMapServiceImageryProvider.js";
import GoogleEarthEnterpriseMapsProvider from "./GoogleEarthEnterpriseMapsProvider.js";
import MapboxImageryProvider from "./MapboxImageryProvider.js";
import SingleTileImageryProvider from "./SingleTileImageryProvider.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";
import WebMapServiceImageryProvider from "./WebMapServiceImageryProvider.js";
import WebMapTileServiceImageryProvider from "./WebMapTileServiceImageryProvider.js";

// These values are the list of supported external imagery
// assets in the Cesium ion beta. They are subject to change.
const ImageryProviderAsyncMapping = {
  ARCGIS_MAPSERVER: ArcGisMapServerImageryProvider.fromUrl,
  BING: async (url, options) => {
    return BingMapsImageryProvider.fromUrl(url, options);
  },
  GOOGLE_EARTH: async (url, options) => {
    const channel = options.channel;
    delete options.channel;
    return GoogleEarthEnterpriseMapsProvider.fromUrl(url, channel, options);
  },
  MAPBOX: (url, options) => {
    return new MapboxImageryProvider({
      url: url,
      ...options,
    });
  },
  SINGLE_TILE: SingleTileImageryProvider.fromUrl,
  TMS: TileMapServiceImageryProvider.fromUrl,
  URL_TEMPLATE: (url, options) => {
    return new UrlTemplateImageryProvider({
      url: url,
      ...options,
    });
  },
  WMS: (url, options) => {
    return new WebMapServiceImageryProvider({
      url: url,
      ...options,
    });
  },
  WMTS: (url, options) => {
    return new WebMapTileServiceImageryProvider({
      url: url,
      ...options,
    });
  },
};

/**
 * @typedef {object} IonImageryProvider.ConstructorOptions
 *
 * TileMapServiceImageryProvider 构造函数的初始化选项。
 *
 * @property {string} [accessToken=Ion.defaultAccessToken] 要使用的访问令牌。
 * @property {string|Resource} [server=Ion.defaultServer] 指向 Cesium ion API 服务器的资源。
 */

/**
 * <div class="notice">
 * 要构造一个 IonImageryProvider，请调用 {@link IonImageryProvider.fromAssetId}。请勿直接调用构造函数。
 * </div>
 *
 * 提供使用 Cesium ion REST API 的平铺图像。
 *
 * @alias IonImageryProvider
 * @constructor
 *
 * @param {IonImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @see IonImageryProvider.fromAssetId
 */
function IonImageryProvider(options) {
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

  this._tileCredits = undefined;
  this._errorEvent = new Event();
}

Object.defineProperties(IonImageryProvider.prototype, {
  /**
   * 获取此实例提供的图像的矩形，单位为弧度。
   * @memberof IonImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._imageryProvider.rectangle;
    },
  },

  /**
   * 获取每个瓦片的宽度，单位为像素。
   * @memberof IonImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._imageryProvider.tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度，单位为像素。
   * @memberof IonImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._imageryProvider.tileHeight;
    },
  },

  /**
   * 获取可以请求的最大细节级别。
   * @memberof IonImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._imageryProvider.maximumLevel;
    },
  },

  /**
   * 获取可以请求的最小细节级别。通常，
   * 仅当图像的矩形足够小，使得最小级别的瓦片数量较小时，才应使用最小级别。
   * 拥有超过几个瓦片的图像提供者在最小级别将导致
   * 渲染问题。
   * @memberof IonImageryProvider.prototype
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
   * @memberof IonImageryProvider.prototype
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
   * 通过其 shouldDiscardImage 函数过滤掉“缺失”瓦片。如果此函数
   * 返回未定义，则不会过滤任何瓦片。
   * @memberof IonImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._imageryProvider.tileDiscardPolicy;
    },
  },

  /**
   * 获取当图像提供者遇到异步错误时引发的事件。通过订阅此事件，您将收到错误通知并可以进行潜在的恢复。
   * 事件监听器会接收到 {@link TileProviderError} 的实例。
   * @memberof IonImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在此图像提供者激活时要显示的信用信息。通常用于信用图像的来源。
   * @memberof IonImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._imageryProvider.credit;
    },
  },

  /**
   * 获取一个值，指示此图像提供者提供的图像是否包含 alpha 通道。
   * 如果此属性为 false，则如果存在，将忽略 alpha 通道。
   * 如果此属性为 true，则没有 alpha 通道的图像将被视为其 alpha 在所有地方都是 1.0。
   * 当此属性为 false 时，内存使用量和纹理上传时间会减少。
   * @memberof IonImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return this._imageryProvider.hasAlphaChannel;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof IonImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   * @default undefined
   */
  proxy: {
    get: function () {
      return undefined;
    },
  },
});


/**
 * 创建一个用于使用 Cesium ion REST API 的平铺图像的提供者。
 *
 * @param {Number} assetId 一个 ion 图像资产 ID。
 * @param {IonImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<IonImageryProvider>} 一个 Promise，解析为创建的 IonImageryProvider。
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * viewer.imageryLayers.add(imageryLayer);
 *
 * @exception {RuntimeError} Cesium ion assetId 不是图像资产。
 * @exception {RuntimeError} 未识别的 Cesium ion 图像类型。
 */

IonImageryProvider.fromAssetId = async function (assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("assetId", assetId);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const endpointResource = IonResource._createEndpointResource(
    assetId,
    options,
  );

  // A simple cache to avoid making repeated requests to ion for endpoints we've
  // already retrieved. This exists mainly to support Bing caching to reduce
  // world imagery sessions, but provides a small boost of performance in general
  // if constantly reloading assets
  const cacheKey = assetId.toString() + options.accessToken + options.server;
  let promise = IonImageryProvider._endpointCache[cacheKey];
  if (!defined(promise)) {
    promise = endpointResource.fetchJson();
    IonImageryProvider._endpointCache[cacheKey] = promise;
  }

  const endpoint = await promise;
  if (endpoint.type !== "IMAGERY") {
    throw new RuntimeError(
      `Cesium ion asset ${assetId} is not an imagery asset.`,
    );
  }

  let imageryProvider;
  const externalType = endpoint.externalType;
  if (!defined(externalType)) {
    imageryProvider = await TileMapServiceImageryProvider.fromUrl(
      new IonResource(endpoint, endpointResource),
    );
  } else {
    const factory = ImageryProviderAsyncMapping[externalType];

    if (!defined(factory)) {
      throw new RuntimeError(
        `Unrecognized Cesium ion imagery type: ${externalType}`,
      );
    }
    // Make a copy before editing since this object reference is cached;
    const options = { ...endpoint.options };
    const url = options.url;
    delete options.url;
    imageryProvider = await factory(url, options);
  }

  const provider = new IonImageryProvider(options);

  imageryProvider.errorEvent.addEventListener(function (tileProviderError) {
    //Propagate the errorEvent but set the provider to this instance instead
    //of the inner instance.
    tileProviderError.provider = provider;
    provider._errorEvent.raiseEvent(tileProviderError);
  });

  provider._tileCredits = IonResource.getCreditsFromEndpoint(
    endpoint,
    endpointResource,
  );

  provider._imageryProvider = imageryProvider;

  return provider;
};
/**
 * 获取在给定瓦片显示时要显示的信用信息。
 * @function
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示瓦片时要展示的信用信息。
 */

IonImageryProvider.prototype.getTileCredits = function (x, y, level) {
  const innerCredits = this._imageryProvider.getTileCredits(x, y, level);
  if (!defined(innerCredits)) {
    return this._tileCredits;
  }

  return this._tileCredits.concat(innerCredits);
};

/**
 * 请求给定瓦片的图像。
 * @function
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象，仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 一个 Promise，在图像可用时解析为图像，
 *          或如果对服务器的活动请求过多，则返回 undefined，表示请求应稍后重试。
 */

IonImageryProvider.prototype.requestImage = function (x, y, level, request) {
  return this._imageryProvider.requestImage(x, y, level, request);
};

/**
 * 异步确定在给定经度和纬度内，瓦片上是否存在特征（如果有的话）。该函数是可选的，因此并非所有的 ImageryProviders 都会存在该函数。
 *
 * @function
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个 Promise，表示选中的特征，在异步选择完成时解析。解析值是一个 {@link ImageryLayerFeatureInfo} 实例的数组。如果在给定位置未找到特征，数组可能为空。如果不支持选择，则可能返回 undefined。
 */

IonImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return this._imageryProvider.pickFeatures(x, y, level, longitude, latitude);
};

//exposed for testing
IonImageryProvider._endpointCache = {};
export default IonImageryProvider;
