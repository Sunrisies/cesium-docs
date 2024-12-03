import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import GeographicTilingScheme from "../Core/GeographicTilingScheme.js";

/**
 * @typedef {object} TileCoordinatesImageryProvider.ConstructorOptions
 *
 * TileCoordinatesImageryProvider构造函数的初始化选项
 *
 * @property {TilingScheme} [tilingScheme=new GeographicTilingScheme()] 用于绘制瓦片的瓦片方案。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果指定了tilingScheme，
 *                    则此参数被忽略，使用瓦片方案的椭球体。如果两个参数都未指定，则使用WGS84椭球体。
 * @property {Color} [color=Color.YELLOW] 绘制瓦片框和标签的颜色。
 * @property {number} [tileWidth=256] 用于细节级别选择的瓦片宽度。
 * @property {number} [tileHeight=256] 用于细节级别选择的瓦片高度。
 */

/**
 * 一个{@link ImageryProvider}，在瓦片方案中为每个渲染的瓦片绘制一个框，并在其中绘制
 * 一个标签，指示瓦片的X、Y、Level坐标。这主要用于调试地形和影像渲染问题。
 *
 * @alias TileCoordinatesImageryProvider
 * @constructor
 *
 * @param {TileCoordinatesImageryProvider.ConstructorOptions} [options] 描述初始化选项的对象
 */

function TileCoordinatesImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = defined(options.tilingScheme)
    ? options.tilingScheme
    : new GeographicTilingScheme({ ellipsoid: options.ellipsoid });
  this._color = defaultValue(options.color, Color.YELLOW);
  this._errorEvent = new Event();
  this._tileWidth = defaultValue(options.tileWidth, 256);
  this._tileHeight = defaultValue(options.tileHeight, 256);

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
}

Object.defineProperties(TileCoordinatesImageryProvider.prototype, {
  /**
   * 获取此提供者使用的代理。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取每个瓦片的宽度（以像素为单位）。
   * @memberof TileCoordinatesImageryProvider.prototype
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
   * @memberof TileCoordinatesImageryProvider.prototype
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
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumLevel: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取可以请求的最小细节级别。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {number}
   * @readonly
   */
  minimumLevel: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取此提供者使用的瓦片方案。
   * @memberof TileCoordinatesImageryProvider.prototype
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
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Rectangle}
   * @readonly
   */
  rectangle: {
    get: function () {
      return this._tilingScheme.rectangle;
    },
  },

  /**
   * 获取瓦片丢弃策略。如果不为undefined，则丢弃策略负责
   * 通过其shouldDiscardImage函数过滤掉“缺失”瓦片。如果该函数
   * 返回undefined，则不会过滤任何瓦片。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {TileDiscardPolicy}
   * @readonly
   */
  tileDiscardPolicy: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取当影像提供者遇到异步错误时触发的事件。通过订阅
   * 此事件，您将被通知错误并可能能够从中恢复。事件监听器
   * 会接收一个 {@link TileProviderError} 的实例。
   * @memberof TileCoordinatesImageryProvider.prototype
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
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return undefined;
    },
  },

  /**
   * 获取一个值，指示此影像提供者提供的图像是否包含alpha通道。
   * 如果该属性为false，则如果存在，将忽略alpha通道。如果该属性为true，则任何没有alpha通道的图像都将被视为其alpha在所有地方都是1.0。将此属性设置为false可以减少内存使用和纹理上传时间。
   * @memberof TileCoordinatesImageryProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasAlphaChannel: {
    get: function () {
      return true;
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
TileCoordinatesImageryProvider.prototype.getTileCredits = function (
  x,
  y,
  level,
) {
  return undefined;
};

/**
 * 请求给定瓦片的图像。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅用于内部使用。
 * @returns {Promise<HTMLCanvasElement>} 解析后的图像，作为Canvas DOM对象。
 */

TileCoordinatesImageryProvider.prototype.requestImage = function (
  x,
  y,
  level,
  request,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  const cssColor = this._color.toCssColorString();

  context.strokeStyle = cssColor;
  context.lineWidth = 2;
  context.strokeRect(1, 1, 255, 255);

  context.font = "bold 25px Arial";
  context.textAlign = "center";
  context.fillStyle = cssColor;
  context.fillText(`L: ${level}`, 124, 86);
  context.fillText(`X: ${x}`, 124, 136);
  context.fillText(`Y: ${y}`, 124, 186);

  return Promise.resolve(canvas);
};

/**
 * 此影像提供者当前不支持拾取特征，因此此函数仅返回
 * undefined。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {number} longitude 要拾取特征的经度。
 * @param {number} latitude 要拾取特征的纬度。
 * @return {undefined} 因为不支持拾取，所以返回undefined。
 */

TileCoordinatesImageryProvider.prototype.pickFeatures = function (
  x,
  y,
  level,
  longitude,
  latitude,
) {
  return undefined;
};
export default TileCoordinatesImageryProvider;
