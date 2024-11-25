import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} EllipsoidGraphics.ConstructorOptions
 *
 * EllipsoidGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 指定椭球体可见性的布尔属性。
 * @property {Property | Cartesian3} [radii] 一个 {@link Cartesian3} 属性，指定椭球体的半径。
 * @property {Property | Cartesian3} [innerRadii] 一个 {@link Cartesian3} 属性，指定椭球体的内半径。
 * @property {Property | number} [minimumClock=0.0] 一个属性，指定椭球体的最小时钟角度。
 * @property {Property | number} [maximumClock=2*PI] 一个属性，指定椭球体的最大时钟角度。
 * @property {Property | number} [minimumCone=0.0] 一个属性，指定椭球体的最小锥角。
 * @property {Property | number} [maximumCone=PI] 一个属性，指定椭球体的最大锥角。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定实体位置的高度参考。
 * @property {Property | boolean} [fill=true] 指定椭球体是否使用提供的材质填充的布尔属性。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充椭球体的材质。
 * @property {Property | boolean} [outline=false] 指定椭球体是否有轮廓的布尔属性。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | number} [stackPartitions=64] 一个属性，指定堆的数量。
 * @property {Property | number} [slicePartitions=64] 一个属性，指定径向切片的数量。
 * @property {Property | number} [subdivisions=128] 一个属性，指定每个轮廓环的样本数量，决定曲率的细分程度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定椭球体是否投射或接收光源的阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定距离相机多远时显示该椭球体。
 */

/**
 * 描述一个椭球体或球体。中心位置和方向由包含该 {@link Entity} 决定。
 *
 * @alias EllipsoidGraphics
 * @constructor
 *
 * @param {EllipsoidGraphics.ConstructorOptions} [options] 描述初始化选项的对象。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Spheres%20and%20Ellipsoids.html|Cesium Sandcastle Spheres and Ellipsoids Demo}
 */
function EllipsoidGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._radii = undefined;
  this._radiiSubscription = undefined;
  this._innerRadii = undefined;
  this._innerRadiiSubscription = undefined;
  this._minimumClock = undefined;
  this._minimumClockSubscription = undefined;
  this._maximumClock = undefined;
  this._maximumClockSubscription = undefined;
  this._minimumCone = undefined;
  this._minimumConeSubscription = undefined;
  this._maximumCone = undefined;
  this._maximumConeSubscription = undefined;
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
  this._stackPartitions = undefined;
  this._stackPartitionsSubscription = undefined;
  this._slicePartitions = undefined;
  this._slicePartitionsSubscription = undefined;
  this._subdivisions = undefined;
  this._subdivisionsSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(EllipsoidGraphics.prototype, {
  /**
   * 获取在属性或子属性更改或修改时引发的事件。
   * @memberof EllipsoidGraphics.prototype
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
   * 获取或设置布尔属性，指定椭球体的可见性。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置 {@link Cartesian3} {@link Property}，指定椭球体的半径。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  radii: createPropertyDescriptor("radii"),

  /**
   * 获取或设置 {@link Cartesian3} {@link Property}，指定椭球体的内半径。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default radii
   */
  innerRadii: createPropertyDescriptor("innerRadii"),

  /**
   * 获取或设置属性，指定椭球体的最小时钟角。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumClock: createPropertyDescriptor("minimumClock"),

  /**
   * 获取或设置属性，指定椭球体的最大时钟角。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 2*PI
   */
  maximumClock: createPropertyDescriptor("maximumClock"),

  /**
   * 获取或设置属性，指定椭球体的最小锥角。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumCone: createPropertyDescriptor("minimumCone"),

  /**
   * 获取或设置属性，指定椭球体的最大锥角。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default PI
   */
  maximumCone: createPropertyDescriptor("maximumCone"),

  /**
   * 获取或设置属性，指定 {@link HeightReference}。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置布尔属性，指定椭球体是否使用提供的材质填充。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置属性，指定用于填充椭球体的材质。
   * @memberof EllipsoidGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置属性，指定椭球体是否有轮廓。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置属性，指定轮廓的 {@link Color}。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值属性，指定轮廓的宽度。
   * <p>
   * 注意：此属性将在所有主要浏览器的Windows平台上被忽略。详细信息请参阅 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置属性，指定堆的数量。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  stackPartitions: createPropertyDescriptor("stackPartitions"),

  /**
   * 获取或设置属性，指定每 360 度的径向切片数量。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 64
   */
  slicePartitions: createPropertyDescriptor("slicePartitions"),

  /**
   * 获取或设置属性，指定每个轮廓环的样本数量，决定曲率的细分程度。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default 128
   */
  subdivisions: createPropertyDescriptor("subdivisions"),

  /**
   * 获取或设置枚举属性，指定椭球体是否投射或接收光源的阴影。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定距离相机多远时显示该椭球体。
   * @memberof EllipsoidGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});

/**
 * 复制此实例。
 *
 * @param {EllipsoidGraphics} [result] 存储结果的对象。
 * @returns {EllipsoidGraphics} 修改后的结果参数，或者如果未提供，则返回一个新的实例。
 */

EllipsoidGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new EllipsoidGraphics(this);
  }
  result.show = this.show;
  result.radii = this.radii;
  result.innerRadii = this.innerRadii;
  result.minimumClock = this.minimumClock;
  result.maximumClock = this.maximumClock;
  result.minimumCone = this.minimumCone;
  result.maximumCone = this.maximumCone;
  result.heightReference = this.heightReference;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.stackPartitions = this.stackPartitions;
  result.slicePartitions = this.slicePartitions;
  result.subdivisions = this.subdivisions;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未分配的属性分配为提供的源对象上相同属性的值。
 *
 * @param {EllipsoidGraphics} source 要合并到此对象中的对象。
 */

EllipsoidGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.radii = defaultValue(this.radii, source.radii);
  this.innerRadii = defaultValue(this.innerRadii, source.innerRadii);
  this.minimumClock = defaultValue(this.minimumClock, source.minimumClock);
  this.maximumClock = defaultValue(this.maximumClock, source.maximumClock);
  this.minimumCone = defaultValue(this.minimumCone, source.minimumCone);
  this.maximumCone = defaultValue(this.maximumCone, source.maximumCone);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.stackPartitions = defaultValue(
    this.stackPartitions,
    source.stackPartitions,
  );
  this.slicePartitions = defaultValue(
    this.slicePartitions,
    source.slicePartitions,
  );
  this.subdivisions = defaultValue(this.subdivisions, source.subdivisions);
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default EllipsoidGraphics;
