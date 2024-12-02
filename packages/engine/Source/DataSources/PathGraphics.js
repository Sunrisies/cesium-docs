import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createMaterialPropertyDescriptor from "./createMaterialPropertyDescriptor.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} PathGraphics.ConstructorOptions
 *
 * PathGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔 Property，指定路径的可见性。
 * @property {Property | number} [leadTime] 一个 Property，指定在对象前方显示的秒数。
 * @property {Property | number} [trailTime] 一个 Property，指定在对象后方显示的秒数。
 * @property {Property | number} [width=1.0] 一个数值 Property，指定宽度（以像素为单位）。
 * @property {Property | number} [resolution=60] 一个数值 Property，指定在采样位置时的最大步进秒数。
 * @property {MaterialProperty | Color} [material=Color.WHITE] 一个 Property，指定用于绘制路径的材料。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个 Property，指定从相机到该路径的显示距离。
 */


/**
 * 描述一个多线段，它是一个 {@link Entity} 随时间移动所形成的路径。
 *
 * @alias PathGraphics
 * @constructor
 *
 * @param {PathGraphics.ConstructorOptions} [options] 描述初始化选项的对象。
 */

function PathGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._leadTime = undefined;
  this._leadTimeSubscription = undefined;
  this._trailTime = undefined;
  this._trailTimeSubscription = undefined;
  this._width = undefined;
  this._widthSubscription = undefined;
  this._resolution = undefined;
  this._resolutionSubscription = undefined;
  this._material = undefined;
  this._materialSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(PathGraphics.prototype, {
  /**
   * 获取每当属性或子属性更改或修改时引发的事件。
   * @memberof PathGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔 Property，指定路径的可见性。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置 Property，指定在对象前方显示的秒数。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  leadTime: createPropertyDescriptor("leadTime"),

  /**
   * 获取或设置 Property，指定在对象后方显示的秒数。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  trailTime: createPropertyDescriptor("trailTime"),

  /**
   * 获取或设置数值 Property，指定宽度（以像素为单位）。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  width: createPropertyDescriptor("width"),

  /**
   * 获取或设置 Property，指定在采样位置时的最大步进秒数。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   * @default 60
   */
  resolution: createPropertyDescriptor("resolution"),

  /**
   * 获取或设置 Property，指定用于绘制路径的材料。
   * @memberof PathGraphics.prototype
   * @type {MaterialProperty}
   * @default Color.WHITE
   */
  material: createMaterialPropertyDescriptor("material"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} Property，指定从相机到该路径的显示距离。
   * @memberof PathGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),
});


/**
 * 复制此实例。
 *
 * @param {PathGraphics} [result] 存储结果的对象.
 * @returns {PathGraphics} 修改后的结果参数或如果未提供，则返回一个新的实例。
 */

PathGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new PathGraphics(this);
  }
  result.show = this.show;
  result.leadTime = this.leadTime;
  result.trailTime = this.trailTime;
  result.width = this.width;
  result.resolution = this.resolution;
  result.material = this.material;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {PathGraphics} source 要合并到此对象中的对象。
 */

PathGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.leadTime = defaultValue(this.leadTime, source.leadTime);
  this.trailTime = defaultValue(this.trailTime, source.trailTime);
  this.width = defaultValue(this.width, source.width);
  this.resolution = defaultValue(this.resolution, source.resolution);
  this.material = defaultValue(this.material, source.material);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
};
export default PathGraphics;
