import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PointGraphics.ConstructorOptions
 *
 * PointGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔 Property，指定点的可见性。
 * @property {Property | number} [pixelSize=1] 一个数值 Property，指定点的大小（以像素为单位）。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个 Property，指定高度相对的参考。
 * @property {Property | Color} [color=Color.WHITE] 一个 Property，指定点的 {@link Color}。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个 Property，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=0] 一个数值 Property，指定轮廓宽度（以像素为单位）。
 * @property {Property | NearFarScalar} [scaleByDistance] 一个 {@link NearFarScalar} Property，根据距离缩放点。
 * @property {Property | NearFarScalar} [translucencyByDistance] 一个 {@link NearFarScalar} Property，根据距离设置透明度。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个 Property，指定在距离相机多远时显示该点。
 * @property {Property | number} [disableDepthTestDistance] 一个 Property，指定从相机起禁用深度测试的距离。
 * @property {Property | SplitDirection} [splitDirection] 一个 Property，指定要应用于该点的 {@link SplitDirection} 拆分。
 */

/**
 * 描述一个位于包含 {@link Entity} 位置的图形点。
 *
 * @alias PointGraphics
 * @constructor
 *
 * @param {PointGraphics.ConstructorOptions} [options] 描述初始化选项的对象。
 */

function PointGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._pixelSize = undefined;
  this._pixelSizeSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._scaleByDistance = undefined;
  this._scaleByDistanceSubscription = undefined;
  this._translucencyByDistance = undefined;
  this._translucencyByDistanceSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._disableDepthTestDistance = undefined;
  this._disableDepthTestDistanceSubscription = undefined;
  this._splitDirection = undefined;
  this._splitDirectionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PointGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PointGraphics.prototype
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
   * 获取或设置布尔 Property，指定点的可见性。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置数值 Property，指定点的大小（以像素为单位）。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default 1
   */
  pixelSize: createPropertyDescriptor("pixelSize"),

  /**
   * 获取或设置 Property，指定 {@link HeightReference}。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置 Property，指定点的 {@link Color}。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置 Property，指定轮廓的 {@link Color}。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值 Property，指定轮廓的宽度（以像素为单位）。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置 {@link NearFarScalar} Property，根据距离缩放点。
   * 如果未定义，将使用常量大小。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  scaleByDistance: createPropertyDescriptor("scaleByDistance"),

  /**
   * 获取或设置 {@link NearFarScalar} Property，指定基于到相机的距离的点的透明度。
   * 点的透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值，
   * 同时相机距离位于指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的下限和上限内。
   * 超出这些范围时，点的透明度保持在最近的限制。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  translucencyByDistance: createPropertyDescriptor("translucencyByDistance"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} Property，指定在距离相机多远时显示该点。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置相机的距离，启用深度测试。
   * 例如，防止与地形的裁剪。
   * 设置为零时，始终应用深度测试。
   * 设置为 Number.POSITIVE_INFINITY 时，永远不应用深度测试。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   */
  disableDepthTestDistance: createPropertyDescriptor(
    "disableDepthTestDistance",
  ),

  /**
   * 获取或设置 Property，指定该点的 {@link SplitDirection}。
   * @memberof PointGraphics.prototype
   * @type {Property|undefined}
   * @default SplitDirection.NONE
   */
  splitDirection: createPropertyDescriptor("splitDirection"),
});


/**
 * 复制此实例。
 *
 * @param {PointGraphics} [result] 存储结果的对象.
 * @returns {PointGraphics} 修改后的结果参数或如果未提供，则返回一个新的实例。
 */

PointGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PointGraphics(this);
  }
  result.show = this.show;
  result.pixelSize = this.pixelSize;
  result.heightReference = this.heightReference;
  result.color = this.color;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.scaleByDistance = this.scaleByDistance;
  result.translucencyByDistance = this._translucencyByDistance;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.disableDepthTestDistance = this.disableDepthTestDistance;
  result.splitDirection = this.splitDirection;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {PointGraphics} source 要合并到此对象中的对象。
 */

PointGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.pixelSize = defaultValue(this.pixelSize, source.pixelSize);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.color = defaultValue(this.color, source.color);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.scaleByDistance = defaultValue(
    this.scaleByDistance,
    source.scaleByDistance,
  );
  this.translucencyByDistance = defaultValue(
    this._translucencyByDistance,
    source.translucencyByDistance,
  );
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.disableDepthTestDistance = defaultValue(
    this.disableDepthTestDistance,
    source.disableDepthTestDistance,
  );

  this.splitDirection = defaultValue(
    this.splitDirection,
    source.splitDirection,
  );
};
export default PointGraphics;
