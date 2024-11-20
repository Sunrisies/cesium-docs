import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} CorridorGraphics.ConstructorOptions
 *
 * CorridorGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔值属性，指定走廊的可见性。
 * @property {Property | Cartesian3[]} [positions] 一个属性，指定定义走廊中心线的 {@link Cartesian3} 位置数组。
 * @property {Property | number} [width] 一个数字属性，指定走廊边缘之间的距离。
 * @property {Property | number} [height=0] 一个数字属性，指定走廊相对于椭球表面的高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定高度的参考。
 * @property {Property | number} [extrudedHeight] 一个数字属性，指定走廊挤压面相对于椭球表面的高度。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 一个属性，指定挤压高度的参考。
 * @property {Property | CornerType} [cornerType=CornerType.ROUNDED] 一个 {@link CornerType} 属性，指定角落的样式。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数字属性，指定每个经纬度之间的距离。
 * @property {Property | boolean} [fill=true] 一个布尔值属性，指定走廊是否填充提供的材质。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定填充走廊的材质。
 * @property {Property | boolean} [outline=false] 一个布尔值属性，指定走廊是否带轮廓。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数字属性，指定轮廓的宽度。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定走廊是否投射或接收光源的阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定这条走廊在距离相机多远时将被显示。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定当在地面上时此走廊将分类地形、3D Tiles 还是两者。
 * @property {ConstantProperty | number} [zIndex] 一个属性，指定走廊的 zIndex，用于排序。仅在高度和挤压高度未定义，并且走廊为静态时生效。
 */


/**
 * 描述一个走廊，这是一种由中心线和宽度定义的形状，符合地球的曲率。
 * 它可以放置在地面上或在某个高度，并可选择性地挤压成一个体积。
 *
 * @alias CorridorGraphics
 * @constructor
 *
 * @param {CorridorGraphics.ConstructorOptions} [options] Object describing initialization options
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Corridor.html|Cesium Sandcastle Corridor Demo}
 */
function CorridorGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
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
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(CorridorGraphics.prototype, {
  /**
    * 获取每当属性或子属性更改或修改时引发的事件。
    * @memberof CorridorGraphics.prototype
    * @type {Event}
    * @readonly
    */
  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔属性，指定走廊的可见性。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置一个属性，指定定义走廊中心线的 {@link Cartesian3} 位置数组。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置一个数字属性，指定轮廓的宽度。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置一个数字属性，指定走廊的高度。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置一个属性，指定 {@link HeightReference}。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置一个数字属性，指定走廊挤压体的高度。
   * 设置此属性会创建一个形状为走廊的体积，从高度开始，直到达到此高度。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   */

  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置属性，指定挤压的 {@link HeightReference}。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
     * 获取或设置 {@link CornerType} 属性，指定角落的样式。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default CornerType.ROUNDED
     */
  cornerType: createPropertyDescriptor("cornerType"),

  /**
     * 获取或设置一个数字属性，指定每个经纬度点之间的采样距离。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default {CesiumMath.RADIANS_PER_DEGREE}
     */
  granularity: createPropertyDescriptor("granularity"),

  /**
     * 获取或设置布尔属性，指定走廊是否填充提供的材质。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default true
     */
  fill: createPropertyDescriptor("fill"),

  /**
     * 获取或设置属性，指定用于填充走廊的材质。
     * @memberof CorridorGraphics.prototype
     * @type {MaterialProperty|undefined}
     * @default Color.WHITE
     */
  material: createMaterialPropertyDescriptor("material"),

  /**
     * 获取或设置属性，指定走廊是否带轮廓。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default false
     */
  outline: createPropertyDescriptor("outline"),

  /**
     * 获取或设置属性，指定轮廓的 {@link Color}。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default Color.BLACK
     */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
     * 获取或设置一个数字属性，指定轮廓的宽度。
     * <p>
     * 注意：此属性将在 Windows 平台上的所有主要浏览器中被忽略。有关详细信息，请参见 {@link https://github.com/CesiumGS/cesium/issues/40}。
     * </p>
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default 1.0
     */

  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置枚举属性，指定走廊是否投射或接收光源的阴影。
   * @memberof CorridorGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
     * 获取或设置 {@link DistanceDisplayCondition} 属性，指定在距相机多远时将显示此走廊。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
     * 获取或设置 {@link ClassificationType} 属性，指定此走廊在地面上时是否分类地形、3D Tiles 或两者。
     * @memberof CorridorGraphics.prototype
     * @type {Property|undefined}
     * @default ClassificationType.BOTH
     */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
     * 获取或设置 zIndex 属性，指定走廊的排序。只有在走廊是静态的且未指定高度或挤压高度时有效。
     * @memberof CorridorGraphics.prototype
     * @type {ConstantProperty|undefined}
     * @default 0
     */

  zIndex: createPropertyDescriptor("zIndex"),
});

/**
 * 复制此实例。
 *
 * @param {CorridorGraphics} [result] 存储结果的对象。
 * @returns {CorridorGraphics} 修改后的结果参数，如果未提供则返回一个新的实例。
 */

CorridorGraphics.prototype.clone = function(result) {
  if (!defined(result)) {
    return new CorridorGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.width = this.width;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.cornerType = this.cornerType;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上同名属性的值。
 *
 * @param {CorridorGraphics} source 要合并到此对象的对象。
 */

CorridorGraphics.prototype.merge = function(source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.width = defaultValue(this.width, source.width);
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
  this.classificationType = defaultValue(
    this.classificationType,
    source.classificationType,
  );
  this.zIndex = defaultValue(this.zIndex, source.zIndex);
};
export default CorridorGraphics;
