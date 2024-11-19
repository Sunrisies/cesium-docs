import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} BillboardGraphics.ConstructorOptions
 *
 * BillboardGraphics 构造函数的初始化选项。
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定广告牌的可见性。
 * @property {Property | string | HTMLCanvasElement} [image] 一个属性，指定用于广告牌的图像、URI 或画布。
 * @property {Property | number} [scale=1.0] 一个数字属性，指定应用于图像大小的缩放因子。
 * @property {Property | Cartesian2} [pixelOffset=Cartesian2.ZERO] 一个 {@link Cartesian2} 属性，指定像素偏移。
 * @property {Property | Cartesian3} [eyeOffset=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，指定眼睛偏移。
 * @property {Property | HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 一个属性，指定 {@link HorizontalOrigin}。
 * @property {Property | VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 一个属性，指定 {@link VerticalOrigin}。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定高度相对的参考。
 * @property {Property | Color} [color=Color.WHITE] 一个属性，指定图像的色调 {@link Color}。
 * @property {Property | number} [rotation=0] 一个数字属性，指定围绕对齐轴的旋转角度。
 * @property {Property | Cartesian3} [alignedAxis=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，指定旋转的单位向量轴。
 * @property {Property | boolean} [sizeInMeters] 一个布尔属性，指定此广告牌的大小是否应以米为单位测量。
 * @property {Property | number} [width] 一个数字属性，指定广告牌的宽度（以像素为单位），覆盖原始大小。
 * @property {Property | number} [height] 一个数字属性，指定广告牌的高度（以像素为单位），覆盖原始大小。
 * @property {Property | NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与相机的距离缩放广告牌。
 * @property {Property | NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} 属性，用于根据与相机的距离设置半透明度。
 * @property {Property | NearFarScalar} [pixelOffsetScaleByDistance] 一个 {@link NearFarScalar} 属性，用于根据与相机的距离设置像素偏移。
 * @property {Property | BoundingRectangle} [imageSubRegion] 一个属性，指定一个 {@link BoundingRectangle}，定义用于广告牌的图像的子区域，而不是整个图像，测量从左下角的像素值。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机到此广告牌将显示的距离的条件。
 * @property {Property | number} [disableDepthTestDistance] 一个属性，指定从相机起禁用深度测试的距离。
 * @property {Property | SplitDirection} [splitDirection] 一个属性，指定广告牌的 {@link SplitDirection}。
 */


/**
 * 描述一个位于包含的 {@link Entity} 位置的二维图标。
 * <p>
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 示例广告牌
 * </div>
 * </p>
 *
 * @alias BillboardGraphics
 * @constructor
 *
 * @param {BillboardGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Billboards.html|Cesium Sandcastle Billboard 演示}
 */

function BillboardGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._image = undefined;
  this._imageSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
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
  this._color = undefined;
  this._colorSubscription = undefined;
  this._rotation = undefined;
  this._rotationSubscription = undefined;
  this._alignedAxis = undefined;
  this._alignedAxisSubscription = undefined;
  this._sizeInMeters = undefined;
  this._sizeInMetersSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._pixelOffsetScaleByDistance = undefined;
  this._pixelOffsetScaleByDistanceSubscription = undefined;
  this._imageSubRegion = undefined;
  this._imageSubRegionSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;
  this._splitDirection = undefined;
  this._splitDirectionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(BillboardGraphics.prototype, {
  /**
    * 获取在每当属性或子属性被更改或修改时引发的事件。
    * @memberof BillboardGraphics.prototype
    *
    * @type {Event}
    * @readonly
    */
  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置指定广告牌可见性的布尔属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定用于广告牌的图像、URI 或画布的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */

  image: createPropertyDescriptor("image"),

  /**
   * 获取或设置指定应用于图像的均匀缩放的数值属性。
   * 大于 <code>1.0</code> 的缩放会放大广告牌，而小于 <code>1.0</code> 的缩放则会缩小它。
   * <p>
   * <div align='center'>
   * <img src='Images/Billboard.setScale.png' width='400' height='300' /><br/>
   * 在上面的图像中，从左到右，缩放分别为 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */

  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置指定广告牌在屏幕空间中从原点的像素偏移的 {@link Cartesian2} 属性。
   * 这通常用于将多个广告牌和标签对齐到相同位置，例如图像和文本。
   * 屏幕空间的原点是画布的左上角；<code>x</code> 从左到右增加，<code>y</code> 从上到下增加。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>b.pixeloffset = new Cartesian2(50, 25);</code><br/><img src='Images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 广告牌的原点由黄色点指示。
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian2.ZERO
   */

  pixelOffset: createPropertyDescriptor("pixelOffset"),

  /**
   * 获取或设置指定广告牌在眼睛坐标系中的偏移的 {@link Cartesian3} 属性。
   * 眼睛坐标系是一个左手坐标系统，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，<code>z</code> 指向屏幕内。
   * <p>
   * 眼睛偏移通常用于将多个广告牌或对象安排在相同的位置，例如将广告牌放置在其对应三维模型的上方。
   * </p>
   * 下方的广告牌被放置在地球中心，但眼睛偏移使其始终出现在地球顶部，而不管观察者或地球的方向如何。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>b.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code>
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */

  eyeOffset: createPropertyDescriptor("eyeOffset"),

  /**
   * 获取或设置指定 {@link HorizontalOrigin} 的属性。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default HorizontalOrigin.CENTER
   */
  horizontalOrigin: createPropertyDescriptor("horizontalOrigin"),

  /**
     * 获取或设置指定 {@link VerticalOrigin} 的属性。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     * @default VerticalOrigin.CENTER
     */
  verticalOrigin: createPropertyDescriptor("verticalOrigin"),

  /**
     * 获取或设置指定 {@link HeightReference} 的属性。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     * @default HeightReference.NONE
     */

  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定 {@link Color} 的属性，该颜色与 <code>image</code> 相乘。
   * 这有两个常见的使用案例。首先，同样的白色纹理可以被许多不同的广告牌使用，
   * 每个广告牌都有不同的颜色，从而创建彩色广告牌。其次，颜色的 alpha 组件可以
   * 用于使广告牌半透明，如下所示。alpha 为 <code>0.0</code> 使广告牌
   * 透明，而 <code>1.0</code> 使广告牌不透明。
   * <p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setColor.Alpha255.png' width='250' height='188' /></td>
   * <td align='center'><code>alpha : 0.5</code><br/><img src='Images/Billboard.setColor.Alpha127.png' width='250' height='188' /></td>
   * </tr></table>
   * </div>
   * </p>
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定图像旋转的数值属性，以从 <code>alignedAxis</code> 逆时针旋转。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
     * 获取或设置指定固定框架中的旋转单位向量轴的 {@link Cartesian3} 属性。
     * 当设置为 Cartesian3.ZERO 时，旋转从屏幕顶部开始。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     * @default Cartesian3.ZERO
     */
  alignedAxis: createPropertyDescriptor("alignedAxis"),

  /**
     * 获取或设置指定广告牌大小是否以米为单位测量的布尔属性。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     * @default false
     */
  sizeInMeters: createPropertyDescriptor("sizeInMeters"),

  /**
     * 获取或设置指定广告牌宽度的数值属性（以像素为单位）。
     * 如果未定义，将使用原始宽度。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  width: createPropertyDescriptor("width"),

  /**
     * 获取或设置指定广告牌高度的数值属性（以像素为单位）。
     * 如果未定义，将使用原始高度。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  height: createPropertyDescriptor("height"),

  /**
     * 获取或设置 {@link NearFarScalar} 属性，根据与相机的距离指定广告牌的缩放。
     * 广告牌的缩放将在 {@link NearFarScalar#nearValue} 和
     * {@link NearFarScalar#farValue} 之间插值，当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内。
     * 超出这些范围时，广告牌的缩放保持在最近的边界。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
     * 获取或设置 {@link NearFarScalar} 属性，根据与相机的距离指定广告牌的半透明度。
     * 广告牌的半透明度将在 {@link NearFarScalar#nearValue} 和
     * {@link NearFarScalar#farValue} 之间插值，当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内。
     * 超出这些范围时，广告牌的半透明度保持在最近的边界。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
     * 获取或设置 {@link NearFarScalar} 属性，根据与相机的距离指定广告牌的像素偏移。
     * 广告牌的像素偏移将在 {@link NearFarScalar#nearValue} 和
     * {@link NearFarScalar#farValue} 之间插值，当相机距离落在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内。
     * 超出这些范围时，广告牌的像素偏移保持在最近的边界。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  pixelOffsetScaleByDistance: createPropertyDescriptor(
    "pixelOffsetScaleByDistance",
  ),

  /**
     * 获取或设置指定 {@link BoundingRectangle} 的属性，该属性定义了
     * 用于广告牌的 <code>image</code> 的子区域，而不是整个图像，
     * 从左下角测量的像素。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */

  imageSubRegion: createPropertyDescriptor("imageSubRegion"),

  /**
   * 获取或设置指定的 {@link DistanceDisplayCondition} 属性，该属性指定从相机到此广告牌将显示的距离。
   * @memberof BillboardGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
     * 获取或设置从相机起禁用深度测试的距离，例如，用于防止与地形剪切。
     * 设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，深度测试永远不应用。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),

  /**
     * 获取或设置指定此广告牌的 {@link SplitDirection} 属性。
     * @memberof BillboardGraphics.prototype
     * @type {Property|undefined}
     * @default SplitDirection.NONE
     */

  splitDirection: createPropertyDescriptor("splitDirection"),
});

/**
 * 复制此实例。
 *
 * @param {BillboardGraphics} [result] 存储结果的对象。
 * @returns {BillboardGraphics} 修改后的结果参数或如果未提供则返回一个新实例。
 */

BillboardGraphics.prototype.clone = function(result) {
  if (!defined(result)) {
    return new BillboardGraphics(this);
  }
  result.show = this._show;
  result.image = this._image;
  result.scale = this._scale;
  result.pixelOffset = this._pixelOffset;
  result.eyeOffset = this._eyeOffset;
  result.horizontalOrigin = this._horizontalOrigin;
  result.verticalOrigin = this._verticalOrigin;
  result.heightReference = this._heightReference;
  result.color = this._color;
  result.rotation = this._rotation;
  result.alignedAxis = this._alignedAxis;
  result.sizeInMeters = this._sizeInMeters;
  result.width = this._width;
  result.height = this._height;
  result.scaleByDistance = this._scaleByDistance;
  result.translucencyByDistance = this._translucencyByDistance;
  result.pixelOffsetScaleByDistance = this._pixelOffsetScaleByDistance;
  result.imageSubRegion = this._imageSubRegion;
  result.distanceDisplayCondition = this._distanceDisplayCondition;
  result.disableDepthTestDistance = this._disableDepthTestDistance;
  result.splitDirection = this._splitDirection;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象中同名属性的值。
 *
 * @param {BillboardGraphics} source 要合并到此对象中的对象。
 */

BillboardGraphics.prototype.merge = function(source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this._show, source.show);
  this.image = defaultValue(this._image, source.image);
  this.scale = defaultValue(this._scale, source.scale);
  this.pixelOffset = defaultValue(this._pixelOffset, source.pixelOffset);
  this.eyeOffset = defaultValue(this._eyeOffset, source.eyeOffset);
  this.horizontalOrigin = defaultValue(
    this._horizontalOrigin,
    source.horizontalOrigin,
  );
  this.verticalOrigin = defaultValue(
    this._verticalOrigin,
    source.verticalOrigin,
  );
  this.heightReference = defaultValue(
    this._heightReference,
    source.heightReference,
  );
  this.color = defaultValue(this._color, source.color);
  this.rotation = defaultValue(this._rotation, source.rotation);
  this.alignedAxis = defaultValue(this._alignedAxis, source.alignedAxis);
  this.sizeInMeters = defaultValue(this._sizeInMeters, source.sizeInMeters);
  this.width = defaultValue(this._width, source.width);
  this.height = defaultValue(this._height, source.height);
  this.scaleByDistance = defaultValue(
    this._scaleByDistance,
    source.scaleByDistance,
  );
  this.translucencyByDistance = defaultValue(
    this._translucencyByDistance,
    source.translucencyByDistance,
  );
  this.pixelOffsetScaleByDistance = defaultValue(
    this._pixelOffsetScaleByDistance,
    source.pixelOffsetScaleByDistance,
  );
  this.imageSubRegion = defaultValue(
    this._imageSubRegion,
    source.imageSubRegion,
  );
  this.distanceDisplayCondition = defaultValue(
    this._distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.disableDepthTestDistance = defaultValue(
    this._disableDepthTestDistance,
    source.disableDepthTestDistance,
  );
  this.splitDirection = defaultValue(
    this.splitDirection,
    source.splitDirection,
  );
};
export default BillboardGraphics;
