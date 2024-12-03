import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} WallGraphics.ConstructorOptions
 *
 * WallGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定墙的可见性。
 * @property {Property | Cartesian3[]} [positions] 一个属性，指定定义墙顶部的 {@link Cartesian3} 位置数组。
 * @property {Property | number[]} [minimumHeights] 一个属性，指定用于墙底部的高度数组，而不是地球表面。
 * @property {Property | number[]} [maximumHeights] 一个属性，指定用于墙顶部的高度数组，而不是每个位置的高度。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，指定每个纬度和经度点之间的角距离。
 * @property {Property | boolean} [fill=true] 一个布尔属性，指定墙是否填充提供的材料。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于填充墙的材料。
 * @property {Property | boolean} [outline=false] 一个布尔属性，指定墙是否有轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值属性，指定轮廓的宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定墙是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定在距离摄像机的多远时该墙将被显示。
 */

/**
 * 描述一个定义为线条带的二维墙，并具有可选的最大和最小高度。
 * 墙遵循地球的曲率，可以放置在表面或在高度上。
 *
 * @alias WallGraphics
 * @constructor
 *
 * @param {WallGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Wall.html|Cesium Sandcastle Wall Demo}
 */
function WallGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._minimumHeights = undefined;
  this._minimumHeightsSubscription = undefined;
  this._maximumHeights = undefined;
  this._maximumHeightsSubscription = undefined;
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
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(WallGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof WallGraphics.prototype
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
   * 获取或设置指定墙的可见性的布尔属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置指定定义墙顶部的 {@link Cartesian3} 位置数组的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置指定用于墙底部的高度数组的属性，而不是地球表面。
   * 如果定义，则数组必须与 {@link Wall#positions} 具有相同的长度。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  minimumHeights: createPropertyDescriptor("minimumHeights"),

  /**
   * 获取或设置指定用于墙顶部的高度数组的属性，而不是每个位置的高度。
   * 如果定义，则数组必须与 {@link Wall#positions} 具有相同的长度。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  maximumHeights: createPropertyDescriptor("maximumHeights"),

  /**
   * 获取或设置指定墙上点之间的角距离的数值属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置指定墙是否填充提供的材料的布尔属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置指定用于填充墙的材料的属性。
   * @memberof WallGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置指定墙是否有轮廓的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置指定轮廓的 {@link Color} 的属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置指定轮廓宽度的数值属性。
   * <p>
   * 注意：在 Windows 平台的所有主要浏览器上将忽略此属性。有关详细信息，请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置指定墙是否从光源投射或接收阴影的枚举属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定墙在距离摄像机多远时显示的 {@link DistanceDisplayCondition} 属性。
   * @memberof WallGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});


/**
 * 复制此实例。
 *
 * @param {WallGraphics} [result] 存储结果的对象。
 * @returns {WallGraphics} 修改后的结果参数，或者如果未提供，则返回一个新的实例。
 */

WallGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new WallGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.minimumHeights = this.minimumHeights;
  result.maximumHeights = this.maximumHeights;
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
 * 将此对象上的每个未分配属性赋值为提供的源对象上相同属性的值。
 *
 * @param {WallGraphics} source 要合并到此对象中的对象。
 */

WallGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.minimumHeights = defaultValue(
    this.minimumHeights,
    source.minimumHeights,
  );
  this.maximumHeights = defaultValue(
    this.maximumHeights,
    source.maximumHeights,
  );
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
export default WallGraphics;
