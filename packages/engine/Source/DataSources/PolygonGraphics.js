import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import PolygonHierarchy from "../Core/PolygonHierarchy.js";
import ConstantProperty from "./ConstantProperty.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

function createPolygonHierarchyProperty(value) {
  if (Array.isArray(value)) {
    // convert array of positions to PolygonHierarchy object
    value = new PolygonHierarchy(value);
  }
  return new ConstantProperty(value);
}
/**
 * @typedef {object} PolygonGraphics.ConstructorOptions
 *
 * PolygonGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔 Property，指定多边形的可见性。
 * @property {Property | PolygonHierarchy | Cartesian3[]} [hierarchy] 一个 Property，指定 {@link PolygonHierarchy}。
 * @property {Property | number} [height=0] 一个数值 Property，指定相对于椭球体表面的多边形高度。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个 Property，指定高度的参考基准。
 * @property {Property | number} [extrudedHeight] 一个数值 Property，指定相对于椭球体表面的多边形挤出面高度。
 * @property {Property | HeightReference} [extrudedHeightReference=HeightReference.NONE] 一个 Property，指定挤出高度的参考基准。
 * @property {Property | number} [stRotation=0.0] 一个数值属性，指定多边形纹理从北开始逆时针旋转的角度。只有在未定义纹理坐标的情况下有效。
 * @property {Property | number} [granularity=Cesium.Math.RADIANS_PER_DEGREE] 一个数值 Property，指定每个纬度和经度点之间的角距离。
 * @property {Property | boolean} [fill=true] 一个布尔 Property，指定多边形是否用所提供的材料填充。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个 Property，指定用于填充多边形的材料。
 * @property {Property | boolean} [outline=false] 一个布尔 Property，指定多边形是否有轮廓线。
 * @property {Property | Color} [outlineColor=Color.BLACK] 一个 Property，指定轮廓的 {@link Color}。
 * @property {Property | number} [outlineWidth=1.0] 一个数值 Property，指定轮廓的宽度。
 * @property {Property | boolean} [perPositionHeight=false] 一个布尔属性，指定是否使用每个位置的高度。
 * @property {boolean | boolean} [closeTop=true] 当为 false 时，留下一个开放的挤出多边形的顶部。
 * @property {boolean | boolean} [closeBottom=true] 当为 false 时，留下一个开放的挤出多边形的底部。
 * @property {Property | ArcType} [arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线的类型。
 * @property {Property | ShadowMode} [shadows=ShadowMode.DISABLED] 一个枚举 Property，指定多边形是否会给光源投射或接收阴影。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个 Property，指定在距离相机多远时显示该多边形。
 * @property {Property | ClassificationType} [classificationType=ClassificationType.BOTH] 一个枚举 Property，指定此多边形是在地面上分类地形、3D Tiles还是两者都有。
 * @property {Property | number} [zIndex=0] 一个属性，指定用于排序地面几何体的 zIndex。只有在多边形是常量且未指定高度或挤出高度时才有效。
 * @property {Property | PolygonHierarchy} [textureCoordinates] 一个 Property，指定纹理坐标作为 {@link PolygonHierarchy} 的 {@link Cartesian2} 点。对地面原语没有影响。
 */


/**
 * 描述由线性环的层次结构定义的多边形，该结构构成外部形状和任何嵌套孔。
 * 该多边形符合地球的曲率，可以放置在表面上或
 * 处于高度，并可以选择性地挤出成一个体积。
 *
 * @alias PolygonGraphics
 * @constructor
 *
 * @param {PolygonGraphics.ConstructorOptions} [options] Object describing initialization options
 *
 * @see Entity
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polygon.html|Cesium Sandcastle Polygon Demo}
 */
function PolygonGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._hierarchy = undefined;
  this._hierarchySubscription = undefined;
  this._height = undefined;
  this._heightSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._extrudedHeight = undefined;
  this._extrudedHeightSubscription = undefined;
  this._extrudedHeightReference = undefined;
  this._extrudedHeightReferenceSubscription = undefined;
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
  this._perPositionHeight = undefined;
  this._perPositionHeightSubscription = undefined;
  this._closeTop = undefined;
  this._closeTopSubscription = undefined;
  this._closeBottom = undefined;
  this._closeBottomSubscription = undefined;
  this._arcType = undefined;
  this._arcTypeSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._classificationType = undefined;
  this._classificationTypeSubscription = undefined;
  this._zIndex = undefined;
  this._zIndexSubscription = undefined;
  this._textureCoordinates = undefined;
  this._textureCoordinatesSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PolygonGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PolygonGraphics.prototype
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
   * 获取或设置布尔 Property，指定多边形的可见性。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置 Property，指定 {@link PolygonHierarchy}。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  hierarchy: createPropertyDescriptor(
    "hierarchy",
    undefined,
    createPolygonHierarchyProperty,
  ),

  /**
   * 获取或设置数值 Property，指定多边形的常量高度。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  height: createPropertyDescriptor("height"),

  /**
   * 获取或设置 Property，指定 {@link HeightReference}。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置数值 Property，指定多边形的挤出高度。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为 false，体积从 {@link PolygonGraphics#height} 开始，结束于此高度。
   * 如果 {@link PolygonGraphics#perPositionHeight} 为 true，体积从每个 {@link PolygonGraphics#hierarchy} 位置的高度开始，结束于此高度。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  extrudedHeight: createPropertyDescriptor("extrudedHeight"),

  /**
   * 获取或设置 Property，指定挤出高度的 {@link HeightReference}。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  extrudedHeightReference: createPropertyDescriptor("extrudedHeightReference"),

  /**
   * 获取或设置数值属性，指定多边形纹理从北方向逆时针旋转的角度。只有在未定义纹理坐标的情况下有效。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 0
   */
  stRotation: createPropertyDescriptor("stRotation"),

  /**
   * 获取或设置数值 Property，指定多边形上点之间的角距离。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default {CesiumMath.RADIANS_PER_DEGREE}
   */
  granularity: createPropertyDescriptor("granularity"),

  /**
   * 获取或设置布尔 Property，指定多边形是否用所提供的材料填充。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  fill: createPropertyDescriptor("fill"),

  /**
   * 获取或设置用于填充多边形的材料 Property。
   * @memberof PolygonGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置 Property，指定多边形是否有轮廓线。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default false
   */
  outline: createPropertyDescriptor("outline"),

  /**
   * 获取或设置 Property，指定轮廓的 {@link Color}。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  outlineColor: createPropertyDescriptor("outlineColor"),

  /**
   * 获取或设置数值 Property，指定轮廓的宽度（以像素为单位）。
   * <p>
   * 注意：此属性将在 Windows 平台上的所有主要浏览器上被忽略。有关详细信息，请参见 (@link https://github.com/CesiumGS/cesium/issues/40}。
   * </p>
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  outlineWidth: createPropertyDescriptor("outlineWidth"),

  /**
   * 获取或设置布尔属性，指定是否使用每个位置的高度。
   * 如果为 true，则形状的高度由每个 {@link PolygonGraphics#hierarchy} 位置的高度定义；
   * 如果为 false，则形状的高度为 {@link PolygonGraphics#height} 指定的常量高度。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  perPositionHeight: createPropertyDescriptor("perPositionHeight"),

  /**
   * 获取或设置布尔属性，指定挤出多边形的顶部是否包含。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeTop: createPropertyDescriptor("closeTop"),

  /**
   * 获取或设置布尔属性，指定挤出多边形的底部是否包含。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  closeBottom: createPropertyDescriptor("closeBottom"),

  /**
   * 获取或设置 {@link ArcType} 属性，指定多边形边缘使用的线的类型。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ArcType.GEODESIC
   */
  arcType: createPropertyDescriptor("arcType"),

  /**
   * 获取或设置枚举属性，指定多边形是否会对光源投射或接收阴影。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.DISABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} Property，指定在距离相机多远时显示该多边形。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置 {@link ClassificationType} 属性，指定该多边形是在地面上分类地形、3D Tiles 还是两者都有。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   * @default ClassificationType.BOTH
   */
  classificationType: createPropertyDescriptor("classificationType"),

  /**
   * 获取或设置 zIndex 属性，指定用于排序地面几何体的 zIndex。只有在多边形是常量且未指定高度或挤出高度时才有效。
   * @memberof PolygonGraphics.prototype
   * @type {ConstantProperty|undefined}
   * @default 0
   */
  zIndex: createPropertyDescriptor("zIndex"),

  /**
   * 一个 Property，指定纹理坐标作为 {@link PolygonHierarchy} 的 {@link Cartesian2} 点。对地面原语没有影响。
   * @memberof PolygonGraphics.prototype
   * @type {Property|undefined}
   */
  textureCoordinates: createPropertyDescriptor("textureCoordinates"),
});


/**
 * 复制此实例。
 *
 * @param {PolygonGraphics} [result] 存储结果的对象.
 * @returns {PolygonGraphics} 修改后的结果参数或如果未提供，则返回一个新的实例。
 */

PolygonGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PolygonGraphics(this);
  }
  result.show = this.show;
  result.hierarchy = this.hierarchy;
  result.height = this.height;
  result.heightReference = this.heightReference;
  result.extrudedHeight = this.extrudedHeight;
  result.extrudedHeightReference = this.extrudedHeightReference;
  result.stRotation = this.stRotation;
  result.granularity = this.granularity;
  result.fill = this.fill;
  result.material = this.material;
  result.outline = this.outline;
  result.outlineColor = this.outlineColor;
  result.outlineWidth = this.outlineWidth;
  result.perPositionHeight = this.perPositionHeight;
  result.closeTop = this.closeTop;
  result.closeBottom = this.closeBottom;
  result.arcType = this.arcType;
  result.shadows = this.shadows;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.classificationType = this.classificationType;
  result.zIndex = this.zIndex;
  result.textureCoordinates = this.textureCoordinates;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {PolygonGraphics} source 要合并到此对象中的对象。
 */

PolygonGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.hierarchy = defaultValue(this.hierarchy, source.hierarchy);
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
  this.stRotation = defaultValue(this.stRotation, source.stRotation);
  this.granularity = defaultValue(this.granularity, source.granularity);
  this.fill = defaultValue(this.fill, source.fill);
  this.material = defaultValue(this.material, source.material);
  this.outline = defaultValue(this.outline, source.outline);
  this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
  this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
  this.perPositionHeight = defaultValue(
    this.perPositionHeight,
    source.perPositionHeight,
  );
  this.closeTop = defaultValue(this.closeTop, source.closeTop);
  this.closeBottom = defaultValue(this.closeBottom, source.closeBottom);
  this.arcType = defaultValue(this.arcType, source.arcType);
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
  this.textureCoordinates = defaultValue(
    this.textureCoordinates,
    source.textureCoordinates,
  );
};
export default PolygonGraphics;
