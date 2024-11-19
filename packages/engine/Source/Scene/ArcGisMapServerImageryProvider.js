import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import WebMercatorProjection from "../Core/WebMercatorProjection.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import ArcGisMapService from "./ArcGisMapService.js";
import DiscardMissingTileImagePolicy from "./DiscardMissingTileImagePolicy.js";
import ImageryLayerFeatureInfo from "./ImageryLayerFeatureInfo.js";
import ImageryProvider from "./ImageryProvider.js";
import ArcGisBaseMapType from "./ArcGisBaseMapType.js";
import DeveloperError from "../Core/DeveloperError.js";
/**
 * @typedef {object} ArcGisMapServerImageryProvider.ConstructorOptions
 *
 * ArcGisMapServerImageryProvider 构造函数的初始化选项
 *
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否无效并应被丢弃的策略。如果未指定此值，则对于切片地图服务器使用默认的 {@link DiscardMissingTileImagePolicy}，
 * 对于非切片地图服务器使用 {@link NeverTileDiscardPolicy}。在前一种情况下，
 * 我们在最大瓦片级别请求瓦片 0,0，并检查像素 (0,0)、(200,20)、(20,200)、(80,110) 和 (160, 130)。如果所有这些像素都是透明的，则丢弃检查被禁用，并且没有瓦片被丢弃。如果其中任何一个像素具有非透明颜色，则丢弃所有在这些像素位置具有相同值的瓦片。这些默认设置的最终结果应为标准 ArcGIS 服务器的正确瓦片丢弃。为确保不丢弃任何瓦片，请为此参数构造并传递 {@link NeverTileDiscardPolicy}。
 * @property {boolean} [usePreCachedTilesIfAvailable=true] 如果为 true，则在可用时使用服务器的预缓存瓦片。导出瓦片仅支持使用已弃用的 API。
 * @property {string} [layers] 要显示的图层的逗号分隔列表，或者如果应显示所有图层则为未定义。
 * @property {boolean} [enablePickFeatures=true] 如果为 true，
 * {@link ArcGisMapServerImageryProvider#pickFeatures} 将在 MapServer 上调用识别服务并返回响应中包含的特征。
 * 如果为 false，{@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回未定义（表示没有可选择的特征），
 * 而不与服务器通信。如果您不希望此提供程序的特征可被选择，请将此属性设置为 false。
 * 可以通过在对象上设置 {@link ArcGisMapServerImageryProvider#enablePickFeatures} 属性来覆盖此设置。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形。当访问切片图层时，此参数被忽略。
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 用于将世界划分为瓦片的切片方案。当访问切片服务器时，此参数被忽略。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果指定并使用了切片方案，则忽略此参数。如果两个参数都未指定，则使用默认椭球体。
 * @property {Credit|string} [credit] 数据源的信用信息，在画布上显示。当访问切片服务器时，此参数被忽略。
 * @property {number} [tileWidth=256] 每个瓦片的宽度（像素）。当访问切片服务器时，此参数被忽略。
 * @property {number} [tileHeight=256] 每个瓦片的高度（像素）。当访问切片服务器时，此参数被忽略。
 * @property {number} [maximumLevel] 请求的最大瓦片级别，或如果没有最大值则为未定义。当访问切片服务器时，此参数被忽略。
 *
 *
 */


/**
 * 用于在获取初始元数据时跟踪创建细节
 *
 * @constructor
 * @private
 *
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} options An object describing initialization options
 */
function ImageryProviderBuilder(options) {
  this.useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);

  const ellipsoid = options.ellipsoid;
  this.tilingScheme = defaultValue(
    options.tilingScheme,
    new GeographicTilingScheme({ ellipsoid: ellipsoid }),
  );
  this.rectangle = defaultValue(options.rectangle, this.tilingScheme.rectangle);
  this.ellipsoid = ellipsoid;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this.credit = credit;
  this.tileCredits = undefined;
  this.tileDiscardPolicy = options.tileDiscardPolicy;

  this.tileWidth = defaultValue(options.tileWidth, 256);
  this.tileHeight = defaultValue(options.tileHeight, 256);
  this.maximumLevel = options.maximumLevel;
}

/**
 * 根据构建器值完成 ArcGisMapServerImageryProvider 创建.
 *
 * @private
 *
 * @param {ArcGisMapServerImageryProvider} provider
 */
ImageryProviderBuilder.prototype.build = function(provider) {
  provider._useTiles = this.useTiles;
  provider._tilingScheme = this.tilingScheme;
  provider._rectangle = this.rectangle;
  provider._credit = this.credit;
  provider._tileCredits = this.tileCredits;
  provider._tileDiscardPolicy = this.tileDiscardPolicy;
  provider._tileWidth = this.tileWidth;
  provider._tileHeight = this.tileHeight;
  provider._maximumLevel = this.maximumLevel;

  // Install the default tile discard policy if none has been supplied.
  if (this.useTiles && !defined(this.tileDiscardPolicy)) {
    provider._tileDiscardPolicy = new DiscardMissingTileImagePolicy({
      missingImageUrl: buildImageResource(provider, 0, 0, this.maximumLevel)
        .url,
      pixelsToCheck: [
        new Cartesian2(0, 0),
        new Cartesian2(200, 20),
        new Cartesian2(20, 200),
        new Cartesian2(80, 110),
        new Cartesian2(160, 130),
      ],
      disableCheckIfAllPixelsAreTransparent: true,
    });
  }
};

function metadataSuccess(data, imageryProviderBuilder) {
  const tileInfo = data.tileInfo;
  if (!defined(tileInfo)) {
    imageryProviderBuilder.useTiles = false;
  } else {
    imageryProviderBuilder.tileWidth = tileInfo.rows;
    imageryProviderBuilder.tileHeight = tileInfo.cols;

    if (
      tileInfo.spatialReference.wkid === 102100 ||
      tileInfo.spatialReference.wkid === 102113
    ) {
      imageryProviderBuilder.tilingScheme = new WebMercatorTilingScheme({
        ellipsoid: imageryProviderBuilder.ellipsoid,
      });
    } else if (data.tileInfo.spatialReference.wkid === 4326) {
      imageryProviderBuilder.tilingScheme = new GeographicTilingScheme({
        ellipsoid: imageryProviderBuilder.ellipsoid,
      });
    } else {
      const message = `Tile spatial reference WKID ${data.tileInfo.spatialReference.wkid} is not supported.`;
      throw new RuntimeError(message);
    }
    imageryProviderBuilder.maximumLevel = data.tileInfo.lods.length - 1;

    if (defined(data.fullExtent)) {
      if (
        defined(data.fullExtent.spatialReference) &&
        defined(data.fullExtent.spatialReference.wkid)
      ) {
        if (
          data.fullExtent.spatialReference.wkid === 102100 ||
          data.fullExtent.spatialReference.wkid === 102113
        ) {
          const projection = new WebMercatorProjection();
          const extent = data.fullExtent;
          const sw = projection.unproject(
            new Cartesian3(
              Math.max(
                extent.xmin,
                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                Math.PI,
              ),
              Math.max(
                extent.ymin,
                -imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                Math.PI,
              ),
              0.0,
            ),
          );
          const ne = projection.unproject(
            new Cartesian3(
              Math.min(
                extent.xmax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                Math.PI,
              ),
              Math.min(
                extent.ymax,
                imageryProviderBuilder.tilingScheme.ellipsoid.maximumRadius *
                Math.PI,
              ),
              0.0,
            ),
          );
          imageryProviderBuilder.rectangle = new Rectangle(
            sw.longitude,
            sw.latitude,
            ne.longitude,
            ne.latitude,
          );
        } else if (data.fullExtent.spatialReference.wkid === 4326) {
          imageryProviderBuilder.rectangle = Rectangle.fromDegrees(
            data.fullExtent.xmin,
            data.fullExtent.ymin,
            data.fullExtent.xmax,
            data.fullExtent.ymax,
          );
        } else {
          const extentMessage = `fullExtent.spatialReference WKID ${data.fullExtent.spatialReference.wkid} is not supported.`;
          throw new RuntimeError(extentMessage);
        }
      }
    } else {
      imageryProviderBuilder.rectangle =
        imageryProviderBuilder.tilingScheme.rectangle;
    }

    imageryProviderBuilder.useTiles = true;
  }

  if (defined(data.copyrightText) && data.copyrightText.length > 0) {
    if (defined(imageryProviderBuilder.credit)) {
      imageryProviderBuilder.tileCredits = [new Credit(data.copyrightText)];
    } else {
      imageryProviderBuilder.credit = new Credit(data.copyrightText);
    }
  }
}

function metadataFailure(resource, error) {
  let message = `An error occurred while accessing ${resource.url}`;
  if (defined(error) && defined(error.message)) {
    message += `: ${error.message}`;
  }

  throw new RuntimeError(message);
}

async function requestMetadata(resource, imageryProviderBuilder) {
  const jsonResource = resource.getDerivedResource({
    queryParameters: {
      f: "json",
    },
  });

  try {
    const data = await jsonResource.fetchJson();
    metadataSuccess(data, imageryProviderBuilder);
  } catch (error) {
    metadataFailure(resource, error);
  }
}

/**
 * <div class="notice">
 * 该对象通常不直接实例化，请使用 {@link ArcGisMapServerImageryProvider.fromBasemapType} 或 {@link ArcGisMapServerImageryProvider.fromUrl}。
 * </div>
 *
 * 提供由 ArcGIS MapServer 托管的切片影像。默认情况下，如果可用，将使用服务器预缓存的切片。
 *
 * <br/>
 *
 * 需要一个 {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS Access Token } 来验证对 ArcGIS 图像切片服务的请求。
 * 要访问安全的 ArcGIS 资源，必须创建 ArcGIS 开发者帐户或 ArcGIS 在线帐户，然后实现一种身份验证方法以获取访问令牌。
 *
 * @alias ArcGisMapServerImageryProvider
 * @constructor
 *
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see ArcGisMapServerImageryProvider.fromBasemapType
 * @see ArcGisMapServerImageryProvider.fromUrl
 *
 * @example
 * // Set the default access token for accessing ArcGIS Image Tile service
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 *
 * // Add a base layer from a default ArcGIS basemap
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *       Cesium.ArcGisBaseMapType.SATELLITE
 *     )
 *   ),
 * });
 *
 * @example
 * // Create an imagery provider from the url directly
 * const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
 *   "https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer", {
 *     token: "<ArcGIS Access Token>"
 * });
 *
 * @see {@link https://developers.arcgis.com/rest/|ArcGIS Server REST API}
 * @see {@link https://developers.arcgis.com/documentation/mapping-apis-and-services/security| ArcGIS Access Token }

 */
function ArcGisMapServerImageryProvider(options) {
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

  this._tileDiscardPolicy = options.tileDiscardPolicy;
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);
  this._maximumLevel = options.maximumLevel;
  this._tilingScheme = defaultValue(
    options.tilingScheme,
    new GeographicTilingScheme({ ellipsoid: options.ellipsoid }),
  );
  this._useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);
  this._rectangle = defaultValue(
    options.rectangle,
    this._tilingScheme.rectangle,
  );
  this._layers = options.layers;
  this._credit = options.credit;
  this._tileCredits = undefined;

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }

  /**
    * 获取或设置一个值，该值指示是否启用要素拾取。如果为 true， {@link ArcGisMapServerImageryProvider#pickFeatures} 将
    * 调用 ArcGIS 服务器上的 "identify" 操作并返回响应中包含的要素。如果为 false， 
    * {@link ArcGisMapServerImageryProvider#pickFeatures} 将立即返回 undefined（表示没有可拾取的特征）
    * 而无需与服务器进行通信。
    * @type {boolean}
    * @default true
    */
  this.enablePickFeatures = defaultValue(options.enablePickFeatures, true);

  this._errorEvent = new Event();
}

/**
 * 创建一个{@link ImageryProvider}，提供来自 ArcGIS 基础地图的切片影像。
 * @param {ArcGisBaseMapType} style ArcGIS 基础地图影像的样式。有效选项为 {@link ArcGisBaseMapType.SATELLITE}, {@link ArcGisBaseMapType.OCEANS}, 和 {@link ArcGisBaseMapType.HILLSHADE}。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<ArcGisMapServerImageryProvider>} 一个承诺，解析为创建的 ArcGisMapServerImageryProvider。
 *
 * @example
 * // Set the default access token for accessing ArcGIS Image Tile service
 * Cesium.ArcGisMapService.defaultAccessToken = "<ArcGIS Access Token>";
 *
 * // Add a base layer from a default ArcGIS basemap
 * const provider = await Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *   Cesium.ArcGisBaseMapType.SATELLITE);
 *
 * @example
 * // Add a base layer from a default ArcGIS Basemap
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   baseLayer: Cesium.ImageryLayer.fromProviderAsync(
 *     Cesium.ArcGisMapServerImageryProvider.fromBasemapType(
 *       Cesium.ArcGisBaseMapType.HILLSHADE, {
 *         token: "<ArcGIS Access Token>"
 *       }
 *     )
 *   ),
 * });
 */

ArcGisMapServerImageryProvider.fromBasemapType = async function(
  style,
  options,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("style", style);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  let accessToken;
  let server;
  let warningCredit;
  switch (style) {
    case ArcGisBaseMapType.SATELLITE:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken,
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldImageryServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.OCEANS:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken,
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldOceanServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    case ArcGisBaseMapType.HILLSHADE:
      {
        accessToken = defaultValue(
          options.token,
          ArcGisMapService.defaultAccessToken,
        );
        server = Resource.createIfNeeded(
          ArcGisMapService.defaultWorldHillshadeServer,
        );
        server.appendForwardSlash();
        const defaultTokenCredit =
          ArcGisMapService.getDefaultTokenCredit(accessToken);
        if (defined(defaultTokenCredit)) {
          warningCredit = Credit.clone(defaultTokenCredit);
        }
      }
      break;
    default:
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(`Unsupported basemap type: ${style}`);
    //>>includeEnd('debug');
  }

  return ArcGisMapServerImageryProvider.fromUrl(server, {
    ...options,
    token: accessToken,
    credit: warningCredit,
    usePreCachedTilesIfAvailable: true, // ArcGIS Base Map Service Layers only support Tiled views
  });
};

function buildImageResource(imageryProvider, x, y, level, request) {
  let resource;
  if (imageryProvider._useTiles) {
    resource = imageryProvider._resource.getDerivedResource({
      url: `tile/${level}/${y}/${x}`,
      request: request,
    });
  } else {
    const nativeRectangle =
      imageryProvider._tilingScheme.tileXYToNativeRectangle(x, y, level);
    const bbox = `${nativeRectangle.west},${nativeRectangle.south},${nativeRectangle.east},${nativeRectangle.north}`;

    const query = {
      bbox: bbox,
      size: `${imageryProvider._tileWidth},${imageryProvider._tileHeight}`,
      format: "png32",
      transparent: true,
      f: "image",
    };

    if (
      imageryProvider._tilingScheme.projection instanceof GeographicProjection
    ) {
      query.bboxSR = 4326;
      query.imageSR = 4326;
    } else {
      query.bboxSR = 3857;
      query.imageSR = 3857;
    }
    if (imageryProvider.layers) {
      query.layers = `show:${imageryProvider.layers}`;
    }

    resource = imageryProvider._resource.getDerivedResource({
      url: "export",
      request: request,
      queryParameters: query,
    });
  }
  return resource;
}

Object.defineProperties(ArcGisMapServerImageryProvider.prototype, {
  /**
   * 获取 ArcGIS MapServer 的 URL.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function() {
      return this._resource._url;
    },
  },

  /**
   * 获取用于验证与 ArcGis MapServer 服务的 ArcGIS 令牌.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  token: {
    get: function() {
      return this._resource.queryParameters.token;
    },
  },

  /**
   * 获取此提供者使用的代理.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function() {
      return this._resource.proxy;
    },
  },

  /**
   * 获取每个切片的宽度，以像素为单位.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function() {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个切片的高度，以像素为单位.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function() {
      return this._tileHeight;
    },
  },

  /**
   * 获取可以请求的最大详细等级.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function() {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可以请求的最低详细等级.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function() {
      return 0;
    },
  },

  /**
   * 获取此提供者使用的切片方案.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function() {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形（以弧度为单位）.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function() {
      return this._rectangle;
    },
  },

  /**
   * 获取切片丢弃策略。如果未定义，则丢弃策略负责通过其 shouldDiscardImage 函数过滤掉“缺失”的切片。 
   * 如果该函数返回未定义，则不对切片进行过滤.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function() {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取一个事件，当影像提供者遇到异步错误时会引发此事件。通过订阅该事件，您将被通知错误，并可能从中恢复。事件监听器
   * 会传递给一个 {@link TileProviderError} 实例.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function() {
      return this._errorEvent;
    },
  },

  /**
   * 获取当该影像提供者处于活动状态时显示的信用。通常用于信任影像的来源.
   * @memberof ArcGisMapServerImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function() {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者是否正在使用 ArcGIS MapServer 的预缓存切片.
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {boolean}
   * @readonly
   * @default true
   */
  usingPrecachedTiles: {
    get: function() {
      return this._useTiles;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 alpha 通道。如果该属性为 false，则将忽略任何存在的 alpha 通道。 
   * 如果该属性为 true，则任何没有 alpha 通道的图像将被视为其 alpha 在所有地方均为 1.0。当该属性为 false 时，内存使用
   * 和纹理上传时间会减少
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {boolean}
   * @readonly
   * @default true
   */
  hasAlphaChannel: {
    get: function() {
      return true;
    },
  },

  /**
   * 获取要显示的层 ID 的逗号分隔列表.
   * @memberof ArcGisMapServerImageryProvider.prototype
   *
   * @type {string}
   */
  layers: {
    get: function() {
      return this._layers;
    },
  },
});

/**
 * 创建一个{@link ImageryProvider}，提供由 ArcGIS MapServer 托管的切片影像。默认情况下，如果可用，将使用服务器的预缓存切片。
 *
 * @param {Resource|String} url ArcGIS MapServer 服务的 URL。
 * @param {ArcGisMapServerImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<ArcGisMapServerImageryProvider>} 一个承诺，解析为创建的 ArcGisMapServerImageryProvider。
 *
 * @example
 * const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
 *     "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
 * );
 *
 * @exception {RuntimeError} 元数据空间参考指定了未知的 WKID
 * @exception {RuntimeError} 元数据 fullExtent.spatialReference 指定未知的 WKID
 */
ArcGisMapServerImageryProvider.fromUrl = async function(url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(url);
  resource.appendForwardSlash();

  if (defined(options.token)) {
    resource.setQueryParameters({
      token: options.token,
    });
  }

  const provider = new ArcGisMapServerImageryProvider(options);
  provider._resource = resource;
  const imageryProviderBuilder = new ImageryProviderBuilder(options);
  const useTiles = defaultValue(options.usePreCachedTilesIfAvailable, true);
  if (useTiles) {
    await requestMetadata(resource, imageryProviderBuilder);
  }

  imageryProviderBuilder.build(provider);
  return provider;
};

/**
 * 获取在给定切片显示时要显示的信用。
 *
 * @param {number} x 切片 X 坐标。
 * @param {number} y 切片 Y 坐标。
 * @param {number} level 切片等级；
 * @returns {Credit[]} 在显示切片时要显示的信用。
 */
ArcGisMapServerImageryProvider.prototype.getTileCredits = function(
  x,
  y,
  level,
) {
  return this._tileCredits;
};

/**
 * 请求给定切片的图像。
 *
 * @param {number} x 切片 X 坐标。
 * @param {number} y 切片 Y 坐标。
 * @param {number} level 切片等级。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 一个承诺，用于可用图像的图像，它将在图像可用时解析，或
 *          undefined 如果对服务器的活动请求太多，应该稍后重试请求。
 */
ArcGisMapServerImageryProvider.prototype.requestImage = function(
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
 * 异步确定在给定的经度和纬度中，是否有位于切片中的任何要素。
 *
 * @param {number} x 切片 X 坐标。
 * @param {number} y 切片 Y 坐标。
 * @param {number} level 切片等级。
 * @param {number} longitude 要拾取要素的经度。
 * @param {number} latitude 要拾取要素的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个承诺，解析为已拾取的要素，当异步
 *                   拾取完成时，该承诺将解析。解析值是一个 {@link ImageryLayerFeatureInfo}
 *                   实例的数组。如果在给定位置未找到要素，则该数组可能为空。
 */
ArcGisMapServerImageryProvider.prototype.pickFeatures = function(
  x,
  y,
  level,
  longitude,
  latitude,
) {
  if (!this.enablePickFeatures) {
    return undefined;
  }

  const rectangle = this._tilingScheme.tileXYToNativeRectangle(x, y, level);

  let horizontal;
  let vertical;
  let sr;
  if (this._tilingScheme.projection instanceof GeographicProjection) {
    horizontal = CesiumMath.toDegrees(longitude);
    vertical = CesiumMath.toDegrees(latitude);
    sr = "4326";
  } else {
    const projected = this._tilingScheme.projection.project(
      new Cartographic(longitude, latitude, 0.0),
    );
    horizontal = projected.x;
    vertical = projected.y;
    sr = "3857";
  }

  let layers = "visible";
  if (defined(this._layers)) {
    layers += `:${this._layers}`;
  }

  const query = {
    f: "json",
    tolerance: 2,
    geometryType: "esriGeometryPoint",
    geometry: `${horizontal},${vertical}`,
    mapExtent: `${rectangle.west},${rectangle.south},${rectangle.east},${rectangle.north}`,
    imageDisplay: `${this._tileWidth},${this._tileHeight},96`,
    sr: sr,
    layers: layers,
  };

  const resource = this._resource.getDerivedResource({
    url: "identify",
    queryParameters: query,
  });

  return resource.fetchJson().then(function(json) {
    const result = [];

    const features = json.results;
    if (!defined(features)) {
      return result;
    }

    for (let i = 0; i < features.length; ++i) {
      const feature = features[i];

      const featureInfo = new ImageryLayerFeatureInfo();
      featureInfo.data = feature;
      featureInfo.name = feature.value;
      featureInfo.properties = feature.attributes;
      featureInfo.configureDescriptionFromProperties(feature.attributes);

      // If this is a point feature, use the coordinates of the point.
      if (feature.geometryType === "esriGeometryPoint" && feature.geometry) {
        const wkid =
          feature.geometry.spatialReference &&
            feature.geometry.spatialReference.wkid
            ? feature.geometry.spatialReference.wkid
            : 4326;
        if (wkid === 4326 || wkid === 4283) {
          featureInfo.position = Cartographic.fromDegrees(
            feature.geometry.x,
            feature.geometry.y,
            feature.geometry.z,
          );
        } else if (wkid === 102100 || wkid === 900913 || wkid === 3857) {
          const projection = new WebMercatorProjection();
          featureInfo.position = projection.unproject(
            new Cartesian3(
              feature.geometry.x,
              feature.geometry.y,
              feature.geometry.z,
            ),
          );
        }
      }

      result.push(featureInfo);
    }

    return result;
  });
};
ArcGisMapServerImageryProvider._metadataCache = {};
export default ArcGisMapServerImageryProvider;
