import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

/**
 * 一个 {@link MaterialProperty}，映射到 PolylineArrow {@link Material} 的 uniforms。
 *
 * @param {Property|Color} [color=Color.WHITE] 要使用的 {@link Color} Property。
 *
 * @alias PolylineArrowMaterialProperty
 * @constructor
 */

function PolylineArrowMaterialProperty(color) {
  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;

  this.color = color;
}

Object.defineProperties(PolylineArrowMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果在当前定义下，getValue 始终返回相同的结果，则认为属性是常量。
   * @memberof PolylineArrowMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._color);
    },
  },
  /**
   * 获取每当该属性的定义发生变化时引发的事件。
   * 如果调用 getValue 会针对相同时间返回不同的结果，则认为定义已发生变化。
   * @memberof PolylineArrowMaterialProperty.prototype
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
   * 获取或设置 {@link Color} {@link Property}。
   * @memberof PolylineArrowMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */

  color: createPropertyDescriptor("color"),
});

/**
 * 获取在提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要获取类型的时间。
 * @returns {string} 材料的类型。
 */
PolylineArrowMaterialProperty.prototype.getType = function (time) {
  return "PolylineArrow";
};

const timeScratch = new JulianDate();

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 如果省略，将创建一个新的实例并返回的存储值的对象。
 * @returns {object} 修改后的结果参数或如果未提供结果参数则返回一个新实例。
 */

PolylineArrowMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    Color.WHITE,
    result.color,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则返回 <code>true</code>，否则返回 <code>false</code>。
 */

PolylineArrowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineArrowMaterialProperty && //
      Property.equals(this._color, other._color))
  );
};
export default PolylineArrowMaterialProperty;
