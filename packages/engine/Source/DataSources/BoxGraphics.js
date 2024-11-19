import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} BoxGraphics.ConstructorOptions
 *
 * BoxGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔类型属性，指定盒子的可见性。
 * @property {Property | Cartesian3} [dimensions] 一个 {@link Cartesian3} 属性，指定盒子的长度、宽度和高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定实体位置的高度相对于什么。
 * @property {Property | boolean} [fill=true] 一个布尔类型属性，指定盒子是否填充提供的材质。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充盒子的材质。
 * @property {Property | boolean} [outline=false] 一个布尔类型属性，指定盒子是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定盒子是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在离相机多远的距离下显示此盒子。
 *
 */


/**
 * 描述一个盒子。中心位置和方向由包含该盒子的 {@link Entity} 决定。
 *
 * @alias BoxGraphics
 * @constructor
 *
 * @param {BoxGraphics.ConstructorOptions} [options] 描述初始化选项的对象。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Box.html|Cesium Sandcastle Box Demo}
 */
function BoxGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._dimensions = undefined;
  this._dimensionsSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._fill = undefined;
  this._fillSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._outline = undefined;
  this._outlineSubscription = undefined;
  this._outlineColor = undefined;
  this._outlineColorSubscription = undefined;
  this._outlineWidth = undefined;
  this._outlineWidthSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(BoxGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof BoxGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔属性，指定盒子的可见性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置 {@link Cartesian3} 属性，指定盒子的长度、宽度和高度。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   */
  dimensions: createPropertyDescriptor("dimensions"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置布尔属性，指定盒子是否填充提供的材质。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充盒子的材质。
   * @memberof BoxGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定盒子是否有轮廓的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * <p>
   * 注意：此属性在Windows平台上的所有主流浏览器中将被忽略。详细信息请参见  {@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定盒子是否从光源投射或接收阴影的枚举属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定从相机多远的距离显示此盒子的 {@link DistanceDisplayCondition} 属性。
   * @memberof BoxGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});


/**
 * 复制此实例。
 *
 * @param {BoxGraphics} [result] 存储结果的对象。
 * @returns {BoxGraphics} 修改后的结果参数，如果未提供则返回一个新的实例。
 */

BoxGraphics.prototype.clone = function(result) {
  if (!defined(result)) {
    return new BoxGraphics(this);
  }
  result.show = this.show;
  result.dimensions = this.dimensions;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};
/**
 * 将此对象上每个未赋值的属性赋值为提供的源对象上同一属性的值。
 *
 * @param {BoxGraphics} source 要合并到此对象中的对象。
 */

BoxGraphics.prototype.merge = function(source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.dimensions = defaultValue(this.dimensions, source.dimensions);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default BoxGraphics;
