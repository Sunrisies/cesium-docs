import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import TranslationRotationScale from "../Core/TranslationRotationScale.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

const defaultNodeTransformation = new TranslationRotationScale();

/**
 * 一个 {@link Property}，生成 {@link TranslationRotationScale} 数据。
 * @alias NodeTransformationProperty
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Property|Cartesian3} [options.translation=Cartesian3.ZERO] 一个 {@link Cartesian3} 属性，指定要应用于节点的 (x, y, z) 平移。
 * @param {Property|Quaternion} [options.rotation=Quaternion.IDENTITY] 一个 {@link Quaternion} 属性，指定要应用于节点的 (x, y, z, w) 旋转。
 * @param {Property|Cartesian3} [options.scale=new Cartesian3(1.0, 1.0, 1.0)] 一个 {@link Cartesian3} 属性，指定要应用于节点的 (x, y, z) 缩放。
 */

function NodeTransformationProperty(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._definitionChanged = new Event();
  this._translation = undefined;
  this._translationSubscription = undefined;
  this._rotation = undefined;
  this._rotationSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;

  this.translation = options.translation;
  this.rotation = options.rotation;
  this.scale = options.scale;
}

Object.defineProperties(NodeTransformationProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。如果 getValue 对当前定义始终返回相同结果，则该属性被视为常量。
   * @memberof NodeTransformationProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */

  isConstant: {
    get: function () {
      return (
        Property.isConstant(this._translation) &&
        Property.isConstant(this._rotation) &&
        Property.isConstant(this._scale)
      );
    },
  },

  /**
   * 获取每当该属性的定义改变时触发的事件。
   * 如果对同一时间的 getValue 调用返回不同的结果，则认为定义已改变。
   * @memberof NodeTransformationProperty.prototype
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
   * 获取或设置 {@link Cartesian3} 属性，指定要应用于节点的 (x, y, z) 平移。
   * @memberof NodeTransformationProperty.prototype
   * @type {Property|undefined}
   * @default Cartesian3.ZERO
   */
  translation: createPropertyDescriptor("translation"),

  /**
   * 获取或设置 {@link Quaternion} 属性，指定要应用于节点的 (x, y, z, w) 旋转。
   * @memberof NodeTransformationProperty.prototype
   * @type {Property|undefined}
   * @default Quaternion.IDENTITY
   */
  rotation: createPropertyDescriptor("rotation"),

  /**
   * 获取或设置 {@link Cartesian3} 属性，指定要应用于节点的 (x, y, z) 缩放。
   * @memberof NodeTransformationProperty.prototype
   * @type {Property|undefined}
   * @default new Cartesian3(1.0, 1.0, 1.0)
   */

  scale: createPropertyDescriptor("scale"),
});

const timeScratch = new JulianDate();

/**
 * 获取在提供时间下属性的值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要获取值的时间。如果省略，则使用当前系统时间。
 * @param {TranslationRotationScale} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {TranslationRotationScale} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

NodeTransformationProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = new TranslationRotationScale();
  }

  result.translation = Property.getValueOrClonedDefault(
    this._translation,
    time,
    defaultNodeTransformation.translation,
    result.translation,
  );
  result.rotation = Property.getValueOrClonedDefault(
    this._rotation,
    time,
    defaultNodeTransformation.rotation,
    result.rotation,
  );
  result.scale = Property.getValueOrClonedDefault(
    this._scale,
    time,
    defaultNodeTransformation.scale,
    result.scale,
  );
  return result;
};

/**
 * 将此属性与提供的属性进行比较，如果相等则返回
 * <code>true</code>，否则返回 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两者相等，则返回 <code>true</code>，否则返回 <code>false</code>
 */

NodeTransformationProperty.prototype.equals = function (other) {
  return (
    this === other ||
    (other instanceof NodeTransformationProperty &&
      Property.equals(this._translation, other._translation) &&
      Property.equals(this._rotation, other._rotation) &&
      Property.equals(this._scale, other._scale))
  );
};
export default NodeTransformationProperty;
