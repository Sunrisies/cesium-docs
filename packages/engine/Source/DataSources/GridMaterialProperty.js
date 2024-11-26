import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultCellAlpha = 0.1;
const defaultLineCount = new Cartesian2(8, 8);
const defaultLineOffset = new Cartesian2(0, 0);
const defaultLineThickness = new Cartesian2(1, 1);

/**
 * 一个 {@link MaterialProperty}，用于映射网格 {@link Material} 的制服。
 * @alias GridMaterialProperty
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|Color} [options.color=Color.WHITE] 指定网格 {@link Color} 的属性。
 * @param {Property|number} [options.cellAlpha=0.1] 指定单元 alpha 值的数字属性。
 * @param {Property|Cartesian2} [options.lineCount=new Cartesian2(8, 8)] 指定每个轴上网格线数量的 {@link Cartesian2} 属性。
 * @param {Property|Cartesian2} [options.lineThickness=new Cartesian2(1.0, 1.0)] 指定每个轴上网格线厚度的 {@link Cartesian2} 属性。
 * @param {Property|Cartesian2} [options.lineOffset=new Cartesian2(0.0, 0.0)] 指定每个轴上网格线起始偏移量的 {@link Cartesian2} 属性。
 *
 * @constructor
 */

function GridMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._cellAlpha = undefined;
  this._cellAlphaSubscription = undefined;
  this._lineCount = undefined;
  this._lineCountSubscription = undefined;
  this._lineThickness = undefined;
  this._lineThicknessSubscription = undefined;
  this._lineOffset = undefined;
  this._lineOffsetSubscription = undefined;

  this.color = options.color;
  this.cellAlpha = options.cellAlpha;
  this.lineCount = options.lineCount;
  this.lineThickness = options.lineThickness;
  this.lineOffset = options.lineOffset;
}

Object.defineProperties(GridMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 始终返回相同的结果，则认为该属性为常量。
   * @memberof GridMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) &&
        Property.isConstant(this._cellAlpha) &&
        Property.isConstant(this._lineCount) &&
        Property.isConstant(this._lineThickness) &&
        Property.isConstant(this._lineOffset)
      );
    },
  },

  /**
   * 获取每当此属性的定义发生变化时引发的事件。
   * 如果对 getValue 的调用会返回相同时间的不同结果，则认为定义已发生变化。
   * @memberof GridMaterialProperty.prototype
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
   * 获取或设置指定网格 {@link Color} 的属性。
   * @memberof GridMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定单元 alpha 值的数字属性。
   * @memberof GridMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 0.1
   */
  cellAlpha: createPropertyDescriptor("cellAlpha"),

  /**
   * 获取或设置指定每个轴上网格线数量的 {@link Cartesian2} 属性。
   * @memberof GridMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(8.0, 8.0)
   */
  lineCount: createPropertyDescriptor("lineCount"),

  /**
   * 获取或设置指定每个轴上网格线厚度的 {@link Cartesian2} 属性。
   * @memberof GridMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(1.0, 1.0)
   */
  lineThickness: createPropertyDescriptor("lineThickness"),

  /**
   * 获取或设置指定每个轴上网格线起始偏移量的 {@link Cartesian2} 属性。
   * @memberof GridMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(0.0, 0.0)
   */
  lineOffset: createPropertyDescriptor("lineOffset"),
});

/**
 * 获取提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */

GridMaterialProperty.prototype.getType = function (time) {
  return "Grid";
};

const timeScratch = new JulianDate();

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

GridMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  result.cellAlpha = Property.getValueOrDefault(
    this._cellAlpha,
    time,
    defaultCellAlpha,
  );
  result.lineCount = Property.getValueOrClonedDefault(
    this._lineCount,
    time,
    defaultLineCount,
    result.lineCount,
  );
  result.lineThickness = Property.getValueOrClonedDefault(
    this._lineThickness,
    time,
    defaultLineThickness,
    result.lineThickness,
  );
  result.lineOffset = Property.getValueOrClonedDefault(
    this._lineOffset,
    time,
    defaultLineOffset,
    result.lineOffset,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两者相等，则 <code>true</code>，否则 <code>false</code>
 */

GridMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof GridMaterialProperty && //
      Property.equals(this._color, other._color) && //
      Property.equals(this._cellAlpha, other._cellAlpha) && //
      Property.equals(this._lineCount, other._lineCount) && //
      Property.equals(this._lineThickness, other._lineThickness) && //
      Property.equals(this._lineOffset, other._lineOffset))
  );
};
export default GridMaterialProperty;
