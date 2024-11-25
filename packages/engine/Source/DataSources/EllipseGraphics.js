import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} EllipseGraphics.ConstructorOptions
 *
 * EllipseGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定椭圆可见性的布尔属性。
 * @property {Property | number} [semiMajorAxis] 指定半长轴的数值属性。
 * @property {Property | number} [semiMinorAxis] 指定半短轴的数值属性。
 * @property {Property | number} [height=0] 指定椭圆相对于椭球体表面的高程的数值属性。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 指定高度参照的属性。
 * @property {Property | number} [extrudedHeight] 指定椭圆挤出面相对于椭球体表面的高程的数值属性。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 指定挤出高度参照的属性。
 * @property {Property | number} [rotation=0.0] 指定椭圆从北方向起逆时针旋转角度的数值属性。
 * @property {Property | number} [stRotation=0.0] 指定椭圆纹理从北方向起逆时针旋转角度的数值属性。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 指定椭圆上点之间角距离的数值属性。
 * @property {Property | boolean} [fill=true] 指定是否用提供的材料填充椭圆的布尔属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 指定用于填充椭圆的材料的属性。
 * @property {Property | boolean} [outline=false] 指定是否绘制椭圆轮廓的布尔属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 指定轮廓颜色的属性。
 * @property {Property | number} [outlineWidth=1.0] 指定轮廓宽度的数值属性。
 * @property {Property | number} [numberOfVerticalLines=16] 指定沿周长绘制垂直线数量的数值属性。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 指定椭圆是否投射或接收光源阴影的枚举属性。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 指定椭圆从相机显示距离的属性。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 指定椭圆在地面上时对地形、3D Tiles或两者进行分类的枚举属性。
 * @property {ConstantProperty | number} [zIndex=0] 指定椭圆的 zIndex 属性。用于排序地面几何体。仅当椭圆是常数且未指定高度或挤出高度时有效。
 */

/**
 * 描述由中心点和半长轴、半短轴定义的椭圆。
 * 椭圆符合地球的曲率，可以放置在表面或海拔高度上，并且可以被选择性地挤出成一个体积。
 * 中心点由包含的 {@link Entity} 确定。
 *
 * @alias EllipseGraphics
 * @constructor
 *
 * @param {EllipseGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Circles and Ellipses.html|Cesium Sandcastle Circles and Ellipses Demo}
 */
function EllipseGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._semiMajorAxis = undefined;
  this._semiMajorAxisSubscription = undefined;
  this._semiMinorAxis = undefined;
  this._semiMinorAxisSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
  this._rotation = undefined;
  this._rotationSubscription = undefined;
  this._stRotation = undefined;
  this._stRotationSubscription = undefined;
  this._granularity = undefined;
  this._granularitySubscription = undefined;
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
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(EllipseGraphics.prototype, {
  /**
   * 获取在属性或子属性更改或修改时引发的事件。
   * @memberof EllipseGraphics.prototype
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
   * 获取或设置布尔属性，指定椭圆的可见性。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置数值属性，指定半长轴。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMajorAxis: createPropertyDescriptor("semiMajorAxis"),

  /**
   * 获取或设置数值属性，指定半短轴。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  semiMinorAxis: createPropertyDescriptor("semiMinorAxis"),

  /**
   * 获取或设置数值属性，指定椭圆的高度。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置属性，指定 {@link HeightReference}。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置数值属性，指定椭圆挤出高度。
   * 设置此属性会创建从高度开始到此高度结束的体积。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置属性，指定挤出的 {@link HeightReference}。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置数值属性，指定椭圆逆时针旋转的角度，参考北方。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置数值属性，指定椭圆纹理逆时针旋转的角度，参考北方。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置数值属性，指定椭圆上点之间的角距离。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置布尔属性，指定椭圆是否填充提供的材质。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置属性，指定用于填充椭圆的材质。
   * @memberof EllipseGraphics.prototype
   * @type {MaterialProperty|undefined}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置布尔属性，指定椭圆是否有轮廓。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置属性，指定轮廓的 {@link Color}。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓的宽度。
   * <p>
   * 注意：此属性将在所有主要浏览器的Windows平台上被忽略。详细信息请参阅 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置数值属性，指定沿轮廓绘制的垂直线数。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default 16
   */
  numberOfVerticalLines: createPropertyDescriptor("numberOfVerticalLines"),

  /**
   * 获取或设置枚举属性，指定椭圆是否从光源投射或接收阴影。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机到此椭圆的显示距离。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置 {@link ClassificationType} 属性，指定当在地面时此椭圆将分类地形、3D Tiles或两者。
   * @memberof EllipseGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置 zIndex 属性，指定椭圆的排序。 仅在椭圆是常量且未指定高度或挤出高度时有效。
   * @memberof EllipseGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制此实例。
 *
 * @param {EllipseGraphics} [result] 存储结果的对象。
 * @returns {EllipseGraphics} 修改后的结果参数，或者如果未提供，则返回一个新实例。
 */

EllipseGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new EllipseGraphics(this);
  }
  result.show = this.show;
  result.semiMajorAxis = this.semiMajorAxis;
  result.semiMinorAxis = this.semiMinorAxis;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.rotation = this.rotation;
  result.stRotation = this.stRotation;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.numberOfVerticalLines = this.numberOfVerticalLines;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配为提供的源对象上相同属性的值。
 *
 * @param {EllipseGraphics} source 要合并到此对象中的对象。
 */

EllipseGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.semiMajorAxis = defaultValue(this.semiMajorAxis, source.semiMajorAxis);
  this.semiMinorAxis = defaultValue(this.semiMinorAxis, source.semiMinorAxis);
  this.height = defaultValue(this.height, source.height);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.extrudedHeight = defaultValue(
    this.extrudedHeight,
    source.extrudedHeight,
  );
  this.extrudedHeightReference = defaultValue(
    this.extrudedHeightReference,
    source.extrudedHeightReference,
  );
  this.rotation = defaultValue(this.rotation, source.rotation);
  this.stRotation = defaultValue(this.stRotation, source.stRotation);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.numberOfVerticalLines = defaultValue(
    this.numberOfVerticalLines,
    source.numberOfVerticalLines,
  );
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.classificationType = defaultValue(
    this.classificationType,
    source.classificationType,
  );
  this.zIndex = defaultValue(this.zIndex, source.zIndex);
};
export default EllipseGraphics;
