import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PolylineVolumeGraphics.ConstructorOptions
 *
 * PolylineVolumeGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定体积的可见性。
 * @property {Property | Cartesian3[]} [positions] 一个属性，指定定义线条段的 {@link Cartesian3} 位置数组。
 * @property {Property | Cartesian2[]} [shape] 一个属性，指定定义挤出形状的 {@link Cartesian2} 位置数组。
 * @property {Property | CornerType} [cornerType=CornerType.ROUNDED] 一个 {@link CornerType} 属性，指定角落的样式。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，指定每个纬度和经度点之间的角距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定体积是否使用提供的材质填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充体积的材质。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定体积是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定体积是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机的距离显示此体积。
 */

/**
 * 描述一个定义为线条段及对应的二维形状并沿其挤出的多段线体积。
 * 结果体积符合地球的曲率。
 *
 * @alias PolylineVolumeGraphics
 * @constructor
 *
 * @param {PolylineVolumeGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline%20Volume.html|Cesium Sandcastle Polyline Volume Demo}
 */
function PolylineVolumeGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._shape = undefined;
  this._shapeSubscription = undefined;
  this._cornerType = undefined;
  this._cornerTypeSubscription = undefined;
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
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubsription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PolylineVolumeGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof PolylineVolumeGraphics.prototype
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
   * 获取或设置一个布尔属性，指定体积的可见性。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置一个属性，指定定义线条段的 {@link Cartesian3} 位置数组。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置一个属性，指定定义挤出形状的 {@link Cartesian2} 位置数组。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  shape: createPropertyDescriptor("shape"),

  /**
   * 获取或设置 {@link CornerType} 属性，指定角落的样式。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default CornerType.ROUNDED
   */
  cornerType: createPropertyDescriptor("cornerType"),

  /**
   * 获取或设置一个数值属性，指定体积上点之间的角距离。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置一个布尔属性，指定体积是否使用提供的材质填充。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置一个属性，指定用于填充体积的材质。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置一个属性，指定体积是否有轮廓。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置一个属性，指定轮廓的 {@link Color}。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置一个数值属性，指定轮廓的宽度。
   * <p>
   * 注意：在所有 Windows 平台的主要浏览器上，此属性将被忽略。相关详情，请参见 (@link https://github.com/CesiumGS/cesium/issues/40}.
   * </p>
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置一个枚举属性，指定体积是否从光源投射或接收阴影。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机的距离显示此体积。
   * @memberof PolylineVolumeGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});


/**
 * 复制此实例。
 *
 * @param {PolylineVolumeGraphics} [result] 存储结果的对象。
 * @returns {PolylineVolumeGraphics} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */

PolylineVolumeGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolylineVolumeGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.shape = this.shape;
  result.cornerType = this.cornerType;
  result.granularity = this.granularity;
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
 * 将此对象上每个未分配的属性赋值为提供的源对象上同一属性的值。
 *
 * @param {PolylineVolumeGraphics} source 要合并到此对象中的对象。
 */

PolylineVolumeGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.shape = defaultValue(this.shape, source.shape);
  this.cornerType = defaultValue(this.cornerType, source.cornerType);
  this.granularity = defaultValue(this.granularity, source.granularity);
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
export default PolylineVolumeGraphics;
