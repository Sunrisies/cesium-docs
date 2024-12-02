import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultColor = Color.WHITE;
const defaultGlowPower = 0.25;
const defaultTaperPower = 1.0;

/**
 * 一个 {@link MaterialProperty}，映射到多段线发光 {@link Material} 的 uniforms。
 * @alias PolylineGlowMaterialProperty
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|Color} [options.color=Color.WHITE] 一个属性，指定线条的 {@link Color}。
 * @param {Property|number} [options.glowPower=0.25] 一个数值属性，指定发光的强度，作为总线宽的百分比。
 * @param {Property|number} [options.taperPower=1.0] 一个数值属性，指定渐缩效果的强度，作为总线长度的百分比。如果为 1.0 或更高，则不使用渐缩效果。
 */

function PolylineGlowMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;
  this._glowPower = undefined;
  this._glowPowerSubscription = undefined;
  this._taperPower = undefined;
  this._taperPowerSubscription = undefined;

  this.color = options.color;
  this.glowPower = options.glowPower;
  this.taperPower = options.taperPower;
}

Object.defineProperties(PolylineGlowMaterialProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。如果 getValue 始终返回相同的结果，则该属性被认为是常量。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._color) && Property.isConstant(this._glow)
      );
    },
  },
  /**
   * 获取每当该属性的定义发生变化时引发的事件。
   * 如果调用 getValue 返回同一时间不同的结果，则认为定义已发生变化。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取或设置指定线条 {@link Color} 的属性。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定发光强度的数值属性，作为总线宽的百分比（小于 1.0）。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  glowPower: createPropertyDescriptor("glowPower"),

  /**
   * 获取或设置指定渐缩效果强度的数值属性，作为总线长度的百分比。如果为 1.0 或更高，则不使用渐缩效果。
   * @memberof PolylineGlowMaterialProperty.prototype
   * @type {Property|undefined}
   */
  taperPower: createPropertyDescriptor("taperPower"),
});


/**
 * 获取在提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */
PolylineGlowMaterialProperty.prototype.getType = function (time) {
  return "PolylineGlow";
};

const timeScratch = new JulianDate();

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */

PolylineGlowMaterialProperty.prototype.getValue = function (time, result) {
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
  result.glowPower = Property.getValueOrDefault(
    this._glowPower,
    time,
    defaultGlowPower,
    result.glowPower,
  );
  result.taperPower = Property.getValueOrDefault(
    this._taperPower,
    time,
    defaultTaperPower,
    result.taperPower,
  );
  return result;
};

/**
 * 比较此属性与提供的属性并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

PolylineGlowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof PolylineGlowMaterialProperty &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._glowPower, other._glowPower) &&
      Property.equals(this._taperPower, other._taperPower))
  );
};
export default PolylineGlowMaterialProperty;
