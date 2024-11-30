import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Resource from "../Core/Resource.js";

/**
 * @typedef {HTMLImageElement|HTMLCanvasElement|ImageBitmap} ImageryTypes
 *
 * {@link ImageryProvider} 方法返回图像的格式可能因提供者、配置或服务器设置而异。最常见的格式是
 * <code>HTMLImageElement</code>、<code>HTMLCanvasElement</code>，或在支持的浏览器中使用的
 * <code>ImageBitmap</code>。
 *
 * 有关每个 ImageryProvider 类如何返回图像的更多信息，请参见相关文档。
 */

/**
 * 提供将在椭球体表面显示的图像。此类型描述了一个接口， 
 * 并不打算被直接实例化。
 *
 * @alias ImageryProvider
 * @constructor
 * @abstract
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see OpenStreetMapImageryProvider
 * @see TileMapServiceImageryProvider
 * @see GoogleEarthEnterpriseImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see GridImageryProvider
 * @see IonImageryProvider
 * @see MapboxImageryProvider
 * @see MapboxStyleImageryProvider
 * @see SingleTileImageryProvider
 * @see TileCoordinatesImageryProvider
 * @see UrlTemplateImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers.html|Cesium Sandcastle Imagery Layers Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers%20Manipulation.html|Cesium Sandcastle Imagery Manipulation Demo}
 */
function ImageryProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(ImageryProvider.prototype, {
  /**
   * 获取此实例提供的图像的矩形，单位为弧度。
   * @memberof ImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个瓦片的宽度，单位为像素。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取每个瓦片的高度，单位为像素。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可以请求的最大细节级别。
   * @memberof ImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取可以请求的最小细节级别。通常，
   * 仅当图像的矩形足够小，使得最小级别的瓦片数量较小时，才应使用最小级别。
   * 拥有超过几个瓦片的图像提供者在最小级别将导致
   * 渲染问题。
   * @memberof ImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供者使用的瓦片方案。
   * @memberof ImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉“缺失”瓦片。如果此函数
   * 返回未定义，则不过滤任何瓦片。
   * @memberof ImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取在此图像提供者激活时要显示的信用信息。通常用于信用
   * 图像的来源。
   * @memberof ImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof ImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示此图像提供者提供的图像是否包含 alpha 通道。
   * 如果此属性为 false，如果存在，将忽略 alpha 通道。
   * 如果此属性为 true，则没有 alpha 通道的图像将被视为其
   * alpha 在所有地方都是 1.0。当此属性为 false 时，
   * 内存使用量和纹理上传时间会减少。
   * @memberof ImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: DeveloperError.throwInstantiationError,
  },
});


/**
 * 获取在给定瓦片显示时要显示的信用信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 在瓦片显示时要展示的信用信息。
 */

ImageryProvider.prototype.getTileCredits = function (x, y, level) {
  DeveloperError.throwInstantiationError();
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 返回一个 Promise，该 Promise 在图像可用时解析；如果对服务器的活动请求过多，则返回 undefined，表示请求应稍后重试。
 */

ImageryProvider.prototype.requestImage = function (x, y, level, request) {
  DeveloperError.throwInstantiationError();
};

/**
 * 异步确定在给定经度和纬度内，瓦片上是否存在特征（如果有的话）。
 * 此函数是可选的，因此并非所有的 ImageryProviders 都会存在该函数。
 *
 * @function
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个 Promise，表示选中的特征，在异步选择完成时解析。解析值是一个 {@link ImageryLayerFeatureInfo} 实例的数组。如果在给定位置未找到特征，数组可能为空。如果不支持选择，则可能返回 undefined。
 *
 */

ImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  DeveloperError.throwInstantiationError();
};

const ktx2Regex = /\.ktx2$/i;

/**
 * 从给定 URL 加载图像。如果 URL 所引用的服务器已经有
 * 太多待处理请求，则此函数将返回 undefined，指示
 * 请求应稍后重试。
 *
 * @param {ImageryProvider} imageryProvider 该 URL 的图像提供者。
 * @param {Resource|string} url 图像的 URL。
 * @returns {Promise<ImageryTypes|CompressedTextureBuffer>|undefined} 一个 Promise，该 Promise 在图像可用时解析为图像，或
 *          如果对服务器的活动请求过多，则返回 undefined，表示请求应稍后重试。
 */

ImageryProvider.loadImage = function (imageryProvider, url) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);

  if (ktx2Regex.test(resource.url)) {
    // Resolves with `CompressedTextureBuffer`
    return loadKTX2(resource);
  } else if (
    defined(imageryProvider) &&
    defined(imageryProvider.tileDiscardPolicy)
  ) {
    // Resolves with `HTMLImageElement` or `ImageBitmap`
    return resource.fetchImage({
      preferBlob: true,
      preferImageBitmap: true,
      flipY: true,
    });
  }

  return resource.fetchImage({
    preferImageBitmap: true,
    flipY: true,
  });
};
export default ImageryProvider;
