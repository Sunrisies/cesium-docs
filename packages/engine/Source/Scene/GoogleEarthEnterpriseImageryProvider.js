import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import decodeGoogleEarthEnterpriseData from "../Core/decodeGoogleEarthEnterpriseData.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";
import GoogleEarthEnterpriseMetadata from "../Core/GoogleEarthEnterpriseMetadata.js";
import loadImageFromTypedArray from "../Core/loadImageFromTypedArray.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import Request from "../Core/Request.js";
import RuntimeError from "../Core/RuntimeError.js";
import * as protobuf from "protobufjs/dist/minimal/protobuf.js";

/**
 * @private
 */
function GoogleEarthEnterpriseDiscardPolicy() {
  this._image = new Image();
}

/**
 * 确定丢弃策略是否准备好处理图像。
 * @returns {boolean} 如果丢弃策略准备好处理图像则为 true；否则为 false。
 */
GoogleEarthEnterpriseDiscardPolicy.prototype.isReady = function () {
  return true;
};

/**
 * 给定一个瓦片图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果图像应该被丢弃则为 true；否则为 false。
 */

GoogleEarthEnterpriseDiscardPolicy.prototype.shouldDiscardImage = function (
  image,
) {
  return image === this._image;
};

/**
 * @typedef {object} GoogleEarthEnterpriseImageryProvider.ConstructorOptions
 *
 * GoogleEarthEnterpriseImageryProvider 构造函数的初始化选项
 *
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，则使用默认椭球体。
 * @property {TileDiscardPolicy} [tileDiscardPolicy] 确定瓦片是否无效并应被丢弃的策略。如果未指定此值，默认情况下将丢弃下载失败的瓦片。
 * @property {Credit|string} [credit] 数据源的信用信息，将显示在画布上。
 */

/**
 * <div class="notice">
 * 要构造 GoogleEarthEnterpriseImageryProvider，请调用 {@link GoogleEarthEnterpriseImageryProvider.fromMetadata}。请勿直接调用构造函数。
 * </div>
 *
 * 使用 Google Earth Enterprise REST API 提供分块影像。
 *
 * 注意：此提供程序用于 Google Earth Enterprise 的 3D 地球 API，
 *        {@link GoogleEarthEnterpriseMapsProvider} 应与 2D 地图 API 一起使用。
 *
 * @alias GoogleEarthEnterpriseImageryProvider
 * @constructor
 *
 * @param {GoogleEarthEnterpriseImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see GoogleEarthEnterpriseImageryProvider.fromMetadata
 * @see GoogleEarthEnterpriseTerrainProvider
 * @see ArcGisMapServerImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see OpenStreetMapImageryProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 *
 * @example
 * const geeMetadata = await GoogleEarthEnterpriseMetadata.fromUrl("http://www.example.com");
 * const gee = Cesium.GoogleEarthEnterpriseImageryProvider.fromMetadata(geeMetadata);
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
function GoogleEarthEnterpriseImageryProvider(options) {
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

  this._tilingScheme = new GeographicTilingScheme({
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 2,
    rectangle: new Rectangle(
      -CesiumMath.PI,
      -CesiumMath.PI,
      CesiumMath.PI,
      CesiumMath.PI,
    ),
    ellipsoid: options.ellipsoid,
  });

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  this._tileWidth = 256;
  this._tileHeight = 256;
  this._maximumLevel = 23;

  // Install the default tile discard policy if none has been supplied.
  if (!defined(this._tileDiscardPolicy)) {
    this._tileDiscardPolicy = new GoogleEarthEnterpriseDiscardPolicy();
  }

  this._errorEvent = new Event();
}

Object.defineProperties(GoogleEarthEnterpriseImageryProvider.prototype, {
  /**
   * 获取托管影像的 Google Earth Enterprise 服务器 URL 的名称。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._metadata.url;
    },
  },

  /**
   * 获取此提供者使用的代理。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._metadata.proxy;
    },
  },

  /**
   * 获取每个瓦片的宽度，以像素为单位。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileWidth: {
    get: function () {
      return this._tileWidth;
    },
  },

  /**
   * 获取每个瓦片的高度，以像素为单位。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  tileHeight: {
    get: function () {
      return this._tileHeight;
    },
  },

  /**
   * 获取可以请求的最大细节层级。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return this._maximumLevel;
    },
  },

  /**
   * 获取可以请求的最小细节层级。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
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
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取此实例提供的影像的矩形，以弧度为单位。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果未定义，则丢弃策略负责
   * 通过其 shouldDiscardImage 函数过滤掉“缺失”的瓦片。如果该函数
   * 返回 undefined，则不会过滤任何瓦片。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return this._tileDiscardPolicy;
    },
  },

  /**
   * 获取一个事件，当影像提供者遇到异步错误时触发。通过订阅
   * 该事件，您将收到错误通知，并可以潜在地从中恢复。事件监听器
   * 将被传递一个 {@link TileProviderError} 实例。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取在此影像提供者处于活动状态时显示的信用信息。通常用于为
   * 影像源提供信用。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含 alpha 通道。
   * 如果此属性为假，则如果存在，alpha 通道将被忽略。
   * 如果此属性为真，则任何没有 alpha 通道的图像将被视为
   * 其 alpha 到处为 1.0。将此属性设置为假将减少内存使用
   * 和纹理上传时间。
   * @memberof GoogleEarthEnterpriseImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return false;
    },
  },
});


/**
 * 使用 Google Earth Enterprise REST API 创建一个瓦片影像提供者。
 * @param {GoogleEarthEnterpriseMetadata} metadata 可以与 GoogleEarthEnterpriseTerrainProvider 共享元数据请求的元数据对象。
 * @param {GoogleEarthEnterpriseImageryProvider.ConstructorOptions} options 描述初始化选项的对象。
 * @returns {GoogleEarthEnterpriseImageryProvider}
 *
 * @exception {RuntimeError} 元数据 URL 不包含影像。
 *
 * @example
 * const geeMetadata = await GoogleEarthEnterpriseMetadata.fromUrl("http://www.example.com");
 * const gee = Cesium.GoogleEarthEnterpriseImageryProvider.fromMetadata(geeMetadata);
 */
GoogleEarthEnterpriseImageryProvider.fromMetadata = function (
  metadata,
  options,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("metadata", metadata);
  //>>includeEnd('debug');

  if (!metadata.imageryPresent) {
    throw new RuntimeError(`The server ${metadata.url} doesn't have imagery`);
  }

  const provider = new GoogleEarthEnterpriseImageryProvider(options);
  provider._metadata = metadata;
  return provider;
};

/**
 * 获取在显示给定瓦片时显示的信用信息。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别；
 * @returns {Credit[]} 显示给定瓦片时要显示的信用信息。
 */

GoogleEarthEnterpriseImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  const metadata = this._metadata;
  const info = metadata.getTileInformation(x, y, level);
  if (defined(info)) {
    const credit = metadata.providers[info.imageryProvider];
    if (defined(credit)) {
      return [credit];
    }
  }

  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<ImageryTypes>|undefined} 一种承诺，将在图像可用时解析，或者
 *          如果对服务器的活动请求过多，则返回 undefined，此时应稍后重试请求。
 */
GoogleEarthEnterpriseImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const invalidImage = this._tileDiscardPolicy._image; // Empty image or undefined depending on discard policy
  const metadata = this._metadata;
  const quadKey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);
  const info = metadata.getTileInformation(x, y, level);
  if (!defined(info)) {
    if (metadata.isValid(quadKey)) {
      const metadataRequest = new Request({
        throttle: request.throttle,
        throttleByServer: request.throttleByServer,
        type: request.type,
        priorityFunction: request.priorityFunction,
      });
      metadata.populateSubtree(x, y, level, metadataRequest);
      return undefined; // No metadata so return undefined so we can be loaded later
    }
    return Promise.resolve(invalidImage); // Image doesn't exist
  }

  if (!info.hasImagery()) {
    // Already have info and there isn't any imagery here
    return Promise.resolve(invalidImage);
  }
  const promise = buildImageResource(
    this,
    info,
    x,
    y,
    level,
    request,
  ).fetchArrayBuffer();
  if (!defined(promise)) {
    return undefined; // Throttled
  }

  return promise.then(function (image) {
    decodeGoogleEarthEnterpriseData(metadata.key, image);
    let a = new Uint8Array(image);
    let type;

    const protoImagery = metadata.protoImagery;
    if (!defined(protoImagery) || !protoImagery) {
      type = getImageType(a);
    }

    if (!defined(type) && (!defined(protoImagery) || protoImagery)) {
      const message = decodeEarthImageryPacket(a);
      type = message.imageType;
      a = message.imageData;
    }

    if (!defined(type) || !defined(a)) {
      return invalidImage;
    }

    return loadImageFromTypedArray({
      uint8Array: a,
      format: type,
      flipY: true,
    });
  });
};

/**
 * 此影像提供程序当前不支持选择特征，因此此函数仅返回
 * undefined。
 *
 * @param {number} x 瓦片的 X 坐标。
 * @param {number} y 瓦片的 Y 坐标。
 * @param {number} level 瓦片级别。
 * @param {number} longitude 要选择特征的经度。
 * @param {number} latitude 要选择特征的纬度。
 * @return {undefined} 由于不支持选择，因此返回 undefined。
 */

GoogleEarthEnterpriseImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};

//
// Functions to handle imagery packets
//
function buildImageResource(imageryProvider, info, x, y, level, request) {
  const quadKey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);
  let version = info.imageryVersion;
  version = defined(version) && version > 0 ? version : 1;

  return imageryProvider._metadata.resource.getDerivedResource({
    url: `flatfile?f1-0${quadKey}-i.${version.toString()}`,
    request: request,
  });
}

// Detects if a Uint8Array is a JPEG or PNG
function getImageType(image) {
  const jpeg = "JFIF";
  if (
    image[6] === jpeg.charCodeAt(0) &&
    image[7] === jpeg.charCodeAt(1) &&
    image[8] === jpeg.charCodeAt(2) &&
    image[9] === jpeg.charCodeAt(3)
  ) {
    return "image/jpeg";
  }

  const png = "PNG";
  if (
    image[1] === png.charCodeAt(0) &&
    image[2] === png.charCodeAt(1) &&
    image[3] === png.charCodeAt(2)
  ) {
    return "image/png";
  }

  return undefined;
}

// Decodes an Imagery protobuf into the message
// Partially generated with the help of protobuf.js static generator
function decodeEarthImageryPacket(data) {
  const reader = protobuf.Reader.create(data);
  const end = reader.len;
  const message = {};
  while (reader.pos < end) {
    const tag = reader.uint32();
    let copyrightIds;
    switch (tag >>> 3) {
      case 1:
        message.imageType = reader.uint32();
        break;
      case 2:
        message.imageData = reader.bytes();
        break;
      case 3:
        message.alphaType = reader.uint32();
        break;
      case 4:
        message.imageAlpha = reader.bytes();
        break;
      case 5:
        copyrightIds = message.copyrightIds;
        if (!defined(copyrightIds)) {
          copyrightIds = message.copyrightIds = [];
        }
        if ((tag & 7) === 2) {
          const end2 = reader.uint32() + reader.pos;
          while (reader.pos < end2) {
            copyrightIds.push(reader.uint32());
          }
        } else {
          copyrightIds.push(reader.uint32());
        }
        break;
      default:
        reader.skipType(tag & 7);
        break;
    }
  }

  const imageType = message.imageType;
  if (defined(imageType)) {
    switch (imageType) {
      case 0:
        message.imageType = "image/jpeg";
        break;
      case 4:
        message.imageType = "image/png";
        break;
      default:
        throw new RuntimeError(
          "GoogleEarthEnterpriseImageryProvider: Unsupported image type.",
        );
    }
  }

  const alphaType = message.alphaType;
  if (defined(alphaType) && alphaType !== 0) {
    console.log(
      "GoogleEarthEnterpriseImageryProvider: External alpha not supported.",
    );
    delete message.alphaType;
    delete message.imageAlpha;
  }

  return message;
}
export default GoogleEarthEnterpriseImageryProvider;
