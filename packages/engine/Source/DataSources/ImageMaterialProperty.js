import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultRepeat = new Cartesian2(1, 1);
const defaultTransparent = false;
const defaultColor = Color.WHITE;

/**
 * 一个 {@link MaterialProperty}，映射到图像 {@link Material} 的 uniform。
 * @alias ImageMaterialProperty
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Property|string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} [options.image] 一个指定图像、URL、Canvas 或 Video 的属性。
 * @param {Property|Cartesian2} [options.repeat=new Cartesian2(1.0, 1.0)] 一个 {@link Cartesian2} 属性，指定图像在每个方向上重复的次数。
 * @param {Property|Color} [options.color=Color.WHITE] 应用于图像的颜色
 * @param {Property|boolean} [options.transparent=false] 当图像具有透明度时设置为 true（例如，当 PNG 文件具有透明区域时）
 */

function ImageMaterialProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._image = undefined;
  this._imageSubscription = undefined;
  this._repeat = undefined;
  this._repeatSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._transparent = undefined;
  this._transparentSubscription = undefined;

  this.image = options.image;
  this.repeat = options.repeat;
  this.color = options.color;
  this.transparent = options.transparent;
}

Object.defineProperties(ImageMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否是常量。 如果 getValue 总是为当前定义返回相同的结果，则视为常量。
   * @memberof ImageMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._image) && Property.isConstant(this._repeat)
      );
    },
  },

  /**
   * 获取每当此属性的定义发生变化时引发的事件。
   * 如果对 getValue 的调用对相同时间返回不同的结果，则认为定义已发生变化。
   * @memberof ImageMaterialProperty.prototype
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
   * 获取或设置指定要使用的图像、URL、Canvas 或 Video 的属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   */
  image: createPropertyDescriptor("image"),

  /**
   * 获取或设置 {@link Cartesian2} 属性，指定图像在每个方向上重复的次数。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian2(1, 1)
   */
  repeat: createPropertyDescriptor("repeat"),

  /**
   * 获取或设置指定应用于图像的颜色的 Color 属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置指定图像是否具有透明度的布尔属性。
   * @memberof ImageMaterialProperty.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  transparent: createPropertyDescriptor("transparent"),
});


/**
 * 获取提供时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */

ImageMaterialProperty.prototype.getType = function (time) {
  return "Image";
};

const timeScratch = new JulianDate();

/**
 * 获取提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */

ImageMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  if (!defined(result)) {
    result = {};
  }

  result.image = Property.getValueOrUndefined(this._image, time);
  result.repeat = Property.getValueOrClonedDefault(
    this._repeat,
    time,
    defaultRepeat,
    result.repeat,
  );
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    defaultColor,
    result.color,
  );
  if (Property.getValueOrDefault(this._transparent, time, defaultTransparent)) {
    result.color.alpha = Math.min(0.99, result.color.alpha);
  }

  return result;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

ImageMaterialProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof ImageMaterialProperty &&
      Property.equals(this._image, other._image) &&
      Property.equals(this._repeat, other._repeat) &&
      Property.equals(this._color, other._color) &&
      Property.equals(this._transparent, other._transparent))
  );
};
export default ImageMaterialProperty;
