import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";
import StripeOrientation from "./StripeOrientation.js";

const defaultOrientation = StripeOrientation.HORIZONTAL;
const defaultEvenColor = Color.WHITE;
const defaultOddColor = Color.BLACK;
const defaultOffset = 0;
const defaultRepeat = 1;

/**
 * 一个 {@link MaterialProperty}，映射到条纹 {@link Material} 的 uniform。
 * @alias StripeMaterialProperty
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|StripeOrientation} [options.orientation=StripeOrientation.HORIZONTAL] 一个指定 {@link StripeOrientation} 的属性。
 * @param {Property|Color} [options.evenColor=Color.WHITE] 一个指定第一个 {@link Color} 的属性。
 * @param {Property|Color} [options.oddColor=Color.BLACK] 一个指定第二个 {@link Color} 的属性。
 * @param {Property|number} [options.offset=0] 一个数值属性，用于指定从图案开始的偏移量。
 * @param {Property|number} [options.repeat=1] 一个数值属性，用于指定条纹重复的次数。
 */

function StripeMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._orientation = undefined;
  this._orientationSubscription = undefined;
  this._evenColor = undefined;
  this._evenColorSubscription = undefined;
  this._oddColor = undefined;
  this._oddColorSubscription = undefined;
  this._offset = undefined;
  this._offsetSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;

  this.orientation = options.orientation;
  this.evenColor = options.evenColor;
  this.oddColor = options.oddColor;
  this.offset = options.offset;
  this.repeat = options.repeat;
}

Object.defineProperties(StripeMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 始终返回当前定义的相同结果，
   * 则该属性被视为常量。
   * @memberof StripeMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */

  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._orientation) && //
        Property.isConstant(this._evenColor) && //
        Property.isConstant(this._oddColor) && //
        Property.isConstant(this._offset) && //
        Property.isConstant(this._repeat)
      );
    },
  },
  /**
   * 获取每当此属性的定义更改时引发的事件。
   * 如果对 getValue 的调用会返回同一时间的不同结果，则认为定义已更改。
   * @memberof StripeMaterialProperty.prototype
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
   * 获取或设置指定 {@link StripeOrientation} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default StripeOrientation.HORIZONTAL
   */

  orientation: createPropertyDescriptor("orientation"),

  /**
   * 获取或设置指定第一个 {@link Color} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  evenColor: createPropertyDescriptor("evenColor"),

  /**
   * 获取或设置指定第二个 {@link Color} 的属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.BLACK
   */
  oddColor: createPropertyDescriptor("oddColor"),

  /**
   * 获取或设置指定绘制开始点的数值属性；0.0 表示偶数颜色的开始，1.0 表示奇数颜色的开始，
   * 2.0 再次表示偶数颜色，任何倍数或分数值都表示在两者之间。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 0.0
   */

  offset: createPropertyDescriptor("offset"),

  /**
   * 获取或设置指定条纹重复次数的数值属性。
   * @memberof StripeMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */

  repeat: createPropertyDescriptor("repeat"),
});

/**
 * 获取在指定时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */

StripeMaterialProperty.prototype.getType = function (time) {
  return "Stripe";
};

const timeScratch = new JulianDate();

/**
 * 获取在指定时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，将创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或如果未提供结果参数则返回一个新实例。
 */

StripeMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.horizontal =
    Property.getValueOrDefault(this._orientation, time, defaultOrientation) ===
    StripeOrientation.HORIZONTAL;
  result.evenColor = Property.getValueOrClonedDefault(
    this._evenColor,
    time,
    defaultEvenColor,
    result.evenColor,
  );
  result.oddColor = Property.getValueOrClonedDefault(
    this._oddColor,
    time,
    defaultOddColor,
    result.oddColor,
  );
  result.offset = Property.getValueOrDefault(this._offset, time, defaultOffset);
  result.repeat = Property.getValueOrDefault(this._repeat, time, defaultRepeat);
  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果属性相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */

StripeMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof StripeMaterialProperty && //
      Property.equals(this._orientation, other._orientation) && //
      Property.equals(this._evenColor, other._evenColor) && //
      Property.equals(this._oddColor, other._oddColor) && //
      Property.equals(this._offset, other._offset) && //
      Property.equals(this._repeat, other._repeat))
  );
};
export default StripeMaterialProperty;
