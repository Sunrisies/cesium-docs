import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} LabelGraphics.ConstructorOptions
 *
 * LabelGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定标签的可见性。
 * @property {Property | string} [text] 一个属性，指定文本。支持显式换行符 '\n'。
 * @property {Property | string} [font='30px sans-serif'] 一个属性，指定 CSS 字体。
 * @property {Property | LabelStyle} [style=LabelStyle.FILL] 一个属性，指定 {@link LabelStyle}。
 * @property {Property | number} [scale=1.0] 一个数值属性，指定应用于文本的缩放比例。
 * @property {Property | boolean} [showBackground=false] 一个布尔属性，指定标签后背景的可见性。
 * @property {Property | Color} [backgroundColor=new Color(0.165, 0.165, 0.165, 0.8)] 一个属性，指定背景 {@link Color}。
 * @property {Property | Cartesian2} [backgroundPadding=new Cartesian2(7, 5)] 一个 {@link Cartesian2} 属性，指定背景的水平和垂直填充（以像素为单位）。
 * @property {Property | Cartesian2} [pixelOffset=Cartesian2.ZERO] 一个 {@link Cartesian2} 属性，指定像素偏移。
 * @property {Property | Cartesian3} [eyeOffset=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，指定眼偏移。
 * @property {Property | HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 一个属性，指定 {@link HorizontalOrigin}。
 * @property {Property | VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 一个属性，指定 {@link VerticalOrigin}。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定高度的相对参考。
 * @property {Property | Color} [fillColor=Color.WHITE] 一个属性，指定填充 {@link Color}。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓宽度。
 * @property {Property | NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} 属性，用于根据距离相机设置半透明度。
 * @property {Property | NearFarScalar} [pixelOffsetScaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据距离相机设置像素偏移。
 * @property {Property | NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据距离相机设置缩放。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距离相机的多远时显示该标签。
 * @property {Property | number} [disableDepthTestDistance] 一个属性，指定距离相机的距离，在此处禁用深度测试。
 */

/**
 * 描述一个位于包含 {@link Entity} 位置的二维标签。
 * <p>
 * <div align='center'>
 * <img src='Images/Label.png' width='400' height='300' /><br />
 * 示例标签
 * </div>
 * </p>
 *
 * @alias LabelGraphics
 * @constructor
 *
 * @param {LabelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Labels.html|Cesium Sandcastle Labels Demo}
 */
function LabelGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._text = undefined;
  this._textSubscription = undefined;
  this._font = undefined;
  this._fontSubscription = undefined;
  this._style = undefined;
  this._styleSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
  this._showBackground = undefined;
  this._showBackgroundSubscription = undefined;
  this._backgroundColor = undefined;
  this._backgroundColorSubscription = undefined;
  this._backgroundPadding = undefined;
  this._backgroundPaddingSubscription = undefined;
  this._pixelOffset = undefined;
  this._pixelOffsetSubscription = undefined;
  this._eyeOffset = undefined;
  this._eyeOffsetSubscription = undefined;
  this._horizontalOrigin = undefined;
  this._horizontalOriginSubscription = undefined;
  this._verticalOrigin = undefined;
  this._verticalOriginSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._fillColor = undefined;
  this._fillColorSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._pixelOffsetScaleByDistance = undefined;
  this._pixelOffsetScaleByDistanceSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(LabelGraphics.prototype, {
  /**
   * 获取在属性或子属性更改或修改时引发的事件。
   * @memberof LabelGraphics.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔属性，指定标签的可见性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置字符串属性，指定标签的文本。
   * 显式换行符 '\n' 受到支持。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  text: createPropertyDescriptor("text"),

  /**
   * 获取或设置字符串属性，指定 CSS 语法的字体。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/CSS/font|MDN 上的 CSS 字体}
   */
  font: createPropertyDescriptor("font"),

  /**
   * 获取或设置属性，指定 {@link LabelStyle}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  style: createPropertyDescriptor("style"),

  /**
   * 获取或设置数值属性，指定应用于图像的均匀缩放。
   * 大于 <code>1.0</code> 的缩放会放大标签，而小于 <code>1.0</code> 的缩放会缩小它。
   * <p>
   * <div align='center'>
   * <img src='Images/Label.setScale.png' width='400' height='300' /><br/>
   * 上图中的缩放值从左到右分别为 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * </p>
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置布尔属性，指定标签后背景的可见性。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  showBackground: createPropertyDescriptor("showBackground"),

  /**
   * 获取或设置属性，指定背景 {@link Color}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default new Color(0.165, 0.165, 0.165, 0.8)
   */
  backgroundColor: createPropertyDescriptor("backgroundColor"),

  /**
   * 获取或设置 {@link Cartesian2} 属性，指定标签的水平和垂直背景填充（以像素为单位）。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(7, 5)
   */
  backgroundPadding: createPropertyDescriptor("backgroundPadding"),

  /**
   * 获取或设置 {@link Cartesian2} 属性，指定该标签在屏幕空间中从原点的像素偏移。
   * 这通常用于将多个标签和其他对象排列在同一位置，例如图像和文本。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian2.ZERO
   */
  pixelOffset: createPropertyDescriptor("pixelOffset"),

  /**
   * 获取或设置 {@link Cartesian3} 属性，指定标签的眼坐标偏移。
   * 眼坐标系是一个左手坐标系统，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，
   * <code>z</code> 指向屏幕内侧。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  eyeOffset: createPropertyDescriptor("eyeOffset"),

  /**
   * 获取或设置属性，指定 {@link HorizontalOrigin}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  horizontalOrigin: createPropertyDescriptor("horizontalOrigin"),

  /**
   * 获取或设置属性，指定 {@link VerticalOrigin}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  verticalOrigin: createPropertyDescriptor("verticalOrigin"),

  /**
   * 获取或设置属性，指定 {@link HeightReference}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置属性，指定填充 {@link Color}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  fillColor: createPropertyDescriptor("fillColor"),

  /**
   * 获取或设置属性，指定轮廓 {@link Color}。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓宽度。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，基于距离相机设置标签的半透明度。
   * 标签的半透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值，
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的范围内。
   * 超出这些范围，标签的半透明度将保持在最近的边界。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，基于相机距离设置标签的像素偏移。
   * 标签的像素偏移将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值，
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的范围内。
   * 超出这些范围，标签的像素偏移将保持在最近的边界。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  pixelOffsetScaleByDistance: createPropertyDescriptor("pixelOffsetScaleByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} 属性，基于相机距离设置标签的缩放。
   * 标签的缩放将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值，
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的范围内。
   * 超出这些范围，标签的缩放将保持在最近的边界。如果未定义，
   * scaleByDistance 将被禁用。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定在距离相机的多远时显示该标签。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor("distanceDisplayCondition"),

  /**
   * 获取或设置距离相机的距离，在此距离禁用深度测试。
   * 设置为零时，始终应用深度测试；设置为 Number.POSITIVE_INFINITY 时，深度测试将永远不应用。
   * @memberof LabelGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor("disableDepthTestDistance"),
});


/**
 * 复制此实例。
 *
 * @param {LabelGraphics} [result] 存储结果的对象。
 * @returns {LabelGraphics} 修改后的结果参数，如果未提供则返回一个新实例。
 */

LabelGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new LabelGraphics(this);
  }
  result.show = this.show;
  result.text = this.text;
  result.font = this.font;
  result.style = this.style;
  result.scale = this.scale;
  result.showBackground = this.showBackground;
  result.backgroundColor = this.backgroundColor;
  result.backgroundPadding = this.backgroundPadding;
  result.pixelOffset = this.pixelOffset;
  result.eyeOffset = this.eyeOffset;
  result.horizontalOrigin = this.horizontalOrigin;
  result.verticalOrigin = this.verticalOrigin;
  result.heightReference = this.heightReference;
  result.fillColor = this.fillColor;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.translucencyByDistance = this.translucencyByDistance;
  result.pixelOffsetScaleByDistance = this.pixelOffsetScaleByDistance;
  result.scaleByDistance = this.scaleByDistance;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.disableDepthTestDistance = this.disableDepthTestDistance;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上同名属性的值。
 *
 * @param {LabelGraphics} source 要合并到此对象中的对象。
 */

LabelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.text = defaultValue(this.text, source.text);
  this.font = defaultValue(this.font, source.font);
  this.style = defaultValue(this.style, source.style);
  this.scale = defaultValue(this.scale, source.scale);
  this.showBackground = defaultValue(
    this.showBackground,
    source.showBackground,
  );
  this.backgroundColor = defaultValue(
    this.backgroundColor,
    source.backgroundColor,
  );
  this.backgroundPadding = defaultValue(
    this.backgroundPadding,
    source.backgroundPadding,
  );
  this.pixelOffset = defaultValue(this.pixelOffset, source.pixelOffset);
  this.eyeOffset = defaultValue(this.eyeOffset, source.eyeOffset);
  this.horizontalOrigin = defaultValue(
    this.horizontalOrigin,
    source.horizontalOrigin,
  );
  this.verticalOrigin = defaultValue(
    this.verticalOrigin,
    source.verticalOrigin,
  );
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fillColor = defaultValue(this.fillColor, source.fillColor);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.translucencyByDistance = defaultValue(
    this.translucencyByDistance,
    source.translucencyByDistance,
  );
  this.pixelOffsetScaleByDistance = defaultValue(
    this.pixelOffsetScaleByDistance,
    source.pixelOffsetScaleByDistance,
  );
  this.scaleByDistance = defaultValue(
    this.scaleByDistance,
    source.scaleByDistance,
  );
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.disableDepthTestDistance = defaultValue(
    this.disableDepthTestDistance,
    source.disableDepthTestDistance,
  );
};
export default LabelGraphics;
