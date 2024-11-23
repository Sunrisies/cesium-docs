import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} CylinderGraphics.ConstructorOptions
 *
 * CylinderGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定圆柱体的可见性。
 * @property {Property | number} [length] 一个数值属性，指定圆柱体的长度。
 * @property {Property | number} [topRadius] 一个数值属性，指定圆柱体顶部的半径。
 * @property {Property | number} [bottomRadius] 一个数值属性，指定圆柱体底部的半径。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定实体位置的高度相对于什么。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定圆柱体是否用提供的材质填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充圆柱体的材质。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定圆柱体是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | number} [numberOfVerticalLines=16] 一个数值属性，指定沿轮廓绘制的垂直线条数量。
 * @property {Property | number} [slices=128] 指定圆柱体周围的边缘数量。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定圆柱体是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机到圆柱体的显示距离。
 */


/**
 * 描述一个圆柱体、截头圆锥或圆锥，该圆柱体由长度、顶部半径和底部半径定义。
 * 中心位置和方向由包含的 {@link Entity} 确定。
 *
 * @alias CylinderGraphics
 * @constructor
 *
 * @param {CylinderGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */

function CylinderGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._length = undefined;
  this._lengthSubscription = undefined;
  this._topRadius = undefined;
  this._topRadiusSubscription = undefined;
  this._bottomRadius = undefined;
  this._bottomRadiusSubscription = undefined;
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
  this._numberOfVerticalLines = undefined;
  this._numberOfVerticalLinesSubscription = undefined;
  this._slices = undefined;
  this._slicesSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(CylinderGraphics.prototype, {
  /**
   * 获取每当属性或子属性发生更改或修改时触发的事件。
   * @memberof CylinderGraphics.prototype
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
   * 获取或设置布尔属性，指定圆柱体的可见性。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置数值属性，指定圆柱体的长度。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  length: createPropertyDescriptor("length"),

  /**
   * 获取或设置数值属性，指定圆柱体顶部的半径。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  topRadius: createPropertyDescriptor("topRadius"),

  /**
   * 获取或设置数值属性，指定圆柱体底部的半径。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  bottomRadius: createPropertyDescriptor("bottomRadius"),

  /**
   * 获取或设置属性，指定 {@link HeightReference}。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置布尔属性，指定圆柱体是否用提供的材质填充。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置属性，指定用于填充圆柱体的材质。
   * @memberof CylinderGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置布尔属性，指定圆柱体是否有轮廓。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置属性，指定轮廓的 {@link Color}。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓的宽度。
   * <p>
   * 注意：此属性在 Windows 平台的所有主要浏览器中将被忽略。有关详细信息，请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置属性，指定沿轮廓绘制的垂直线条数量。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置属性，指定圆柱体周围的边缘数量。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  slices: createPropertyDescriptor("slices"),

  /**
   * 获取或设置枚举属性，指定圆柱体是否从光源投射或接收阴影。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置属性，指定从相机到圆柱体的显示距离。
   * @memberof CylinderGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});


/**
 * 复制此实例。
 *
 * @param {CylinderGraphics} [result] 存储结果的对象。
 * @returns {CylinderGraphics} 修改后的结果参数或如果未提供则返回一个新实例。
 */

CylinderGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new CylinderGraphics(this);
  }
  result.show = this.show;
  result.length = this.length;
  result.topRadius = this.topRadius;
  result.bottomRadius = this.bottomRadius;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.numberOfVerticalLines = this.numberOfVerticalLines;
  result.slices = this.slices;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {CylinderGraphics} source 要合并到此对象中的对象。
 */

CylinderGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.length = defaultValue(this.length, source.length);
  this.topRadius = defaultValue(this.topRadius, source.topRadius);
  this.bottomRadius = defaultValue(this.bottomRadius, source.bottomRadius);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.numberOfVerticalLines = defaultValue(
    this.numberOfVerticalLines,
    source.numberOfVerticalLines,
  );
  this.slices = defaultValue(this.slices, source.slices);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default CylinderGraphics;
