import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PolylineGraphics.ConstructorOptions
 *
 * PolylineGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定多段线的可见性。
 * @property {Property | Cartesian3[]} [positions] 一个属性，指定定义线条段的 {@link Cartesian3} 位置数组。
 * @property {Property | number} [width=1.0] 一个数值属性，指定宽度（以像素为单位）。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值属性，指定如果 arcType 不是 ArcType.NONE，每个纬度和经度之间的角距离。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个属性，指定用于绘制多段线的材质。
 * @property {MaterialProperty | Color} [depthFailMaterial] 一个属性，指定在地形以下绘制多段线时使用的材质。
 * @property {Property | ArcType} [arcType=ArcType.GEODESIC] 多段线段必须遵循的线条类型。
 * @property {Property | boolean} [clampToGround=false] 一个布尔属性，指定多段线是否应钉靠在地面上。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举属性，指定多段线是否从光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机的距离显示此多段线。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举属性，指定此多段线在地面上是否会分类地形、3D Tiles 或两者。
 * @property {Property | number} [zIndex=0] 一个属性，指定用于排序地面几何图形的 zIndex。只有在 `clampToGround` 为 true 并且支持地形上的多段线时才有效。
 */


/**
 * 描述一条多段线。前两个位置定义一条线段，
 * 每个额外的位置定义从前一个位置延伸的线段。这些线段
 * 可以是线性连接的点、大弧，或钉靠在地形上。
 *
 * @alias PolylineGraphics
 * @constructor
 *
 * @param {PolylineGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline.html|Cesium Sandcastle Polyline Demo}
 */
function PolylineGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._positions = undefined;
  this._positionsSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._granularity = undefined;
  this._granularitySubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._depthFailMaterial = undefined;
  this._depthFailMaterialSubscription = undefined;
  this._arcType = undefined;
  this._arcTypeSubscription = undefined;
  this._clampToGround = undefined;
  this._clampToGroundSubscription = undefined;
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

Object.defineProperties(PolylineGraphics.prototype, {
  /**
   * 获取每当属性或子属性被更改或修改时引发的事件。
   * @memberof PolylineGraphics.prototype
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
   * 获取或设置一个布尔属性，指定多段线的可见性。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置一个属性，指定定义线条段的 {@link Cartesian3} 位置数组。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  positions: createPropertyDescriptor("positions"),

  /**
   * 获取或设置一个数值属性，指定宽度（以像素为单位）。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置一个数值属性，指定如果 arcType 不是 ArcType.NONE 且 clampToGround 为 false，每个纬度和经度之间的角距离。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default Cesium.Math.RADIANS_PER_DEGREE
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置一个属性，指定用于绘制多段线的材质。
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置一个属性，指定在深度测试失败时用于绘制多段线的材质。
   * <p>
   * 渲染时需要 EXT_frag_depth WebGL 扩展。如果不支持该扩展，可能会出现伪影。
   * </p>
   * @memberof PolylineGraphics.prototype
   * @type {MaterialProperty}
   * @default undefined
   */
  depthFailMaterial: createMaterialPropertyDescriptor("depthFailMaterial"),

  /**
   * 获取或设置 {@link ArcType} 属性，指定线段是否应为大弧、航线或线性连接。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置一个布尔属性，指定多段线是否应钉靠在地面上。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  clampToGround: createPropertyDescriptor("clampToGround"),

  /**
   * 获取或设置枚举属性，指定多段线是否从光源投射或接收阴影。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机的距离显示此多段线。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置 {@link ClassificationType} 属性，指定此多段线在地面上是否会分类地形、3D Tiles 或两者。
   * @memberof PolylineGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置 zIndex 属性，指定多段线的排序。只有在 `clampToGround` 为 true 并且支持地形上的多段线时才有效。
   * @memberof PolylineGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),
});


/**
 * 复制此实例。
 *
 * @param {PolylineGraphics} [result] 存储结果的对象。
 * @returns {PolylineGraphics} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */

PolylineGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolylineGraphics(this);
  }
  result.show = this.show;
  result.positions = this.positions;
  result.width = this.width;
  result.granularity = this.granularity;
  result.material = this.material;
  result.depthFailMaterial = this.depthFailMaterial;
  result.arcType = this.arcType;
  result.clampToGround = this.clampToGround;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上同一属性的值。
 *
 * @param {PolylineGraphics} source 要合并到此对象中的对象。
 */

PolylineGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.positions = defaultValue(this.positions, source.positions);
  this.width = defaultValue(this.width, source.width);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.material = defaultValue(this.material, source.material);
  this.depthFailMaterial = defaultValue(
    this.depthFailMaterial,
    source.depthFailMaterial,
  );
  this.arcType = defaultValue(this.arcType, source.arcType);
  this.clampToGround = defaultValue(this.clampToGround, source.clampToGround);
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
export default PolylineGraphics;
