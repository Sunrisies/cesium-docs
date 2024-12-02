import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";

/**
 * 所有属性的接口，表示一个可以选择随着时间变化的值。
 * 该类型定义了一个接口，不能直接实例化。
 *
 * @alias Property
 * @constructor
 * @abstract
 *
 * @see CompositeProperty
 * @see ConstantProperty
 * @see SampledProperty
 * @see TimeIntervalCollectionProperty
 * @see MaterialProperty
 * @see PositionProperty
 * @see ReferenceProperty
 */

function Property() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(Property.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。如果 getValue 始终返回相同的结果，则该属性被认为是常量。
   * @memberof Property.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取每当该属性的定义发生变化时引发的事件。
   * 如果调用 getValue 返回同一时间不同的结果，则认为定义已发生变化。
   * @memberof Property.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
});


/**
 * 获取在提供时间的属性值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */
Property.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 比较此属性与提供的属性并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

Property.prototype.equals = DeveloperError.throwInstantiationError;

/**
 * @private
 */
Property.equals = function (left, right) {
  return left === right || (defined(left) && left.equals(right));
};

/**
 * @private
 */
Property.arrayEquals = function (left, right) {
  if (left === right) {
    return true;
  }
  if (!defined(left) || !defined(right) || left.length !== right.length) {
    return false;
  }
  const length = left.length;
  for (let i = 0; i < length; i++) {
    if (!Property.equals(left[i], right[i])) {
      return false;
    }
  }
  return true;
};

/**
 * @private
 */
Property.isConstant = function (property) {
  return !defined(property) || property.isConstant;
};

/**
 * @private
 */
Property.getValueOrUndefined = function (property, time, result) {
  return defined(property) ? property.getValue(time, result) : undefined;
};

/**
 * @private
 */
Property.getValueOrDefault = function (property, time, valueDefault, result) {
  return defined(property)
    ? defaultValue(property.getValue(time, result), valueDefault)
    : valueDefault;
};

/**
 * @private
 */
Property.getValueOrClonedDefault = function (
  property,
  time,
  valueDefault,
  result,
) {
  let value;
  if (defined(property)) {
    value = property.getValue(time, result);
  }
  if (!defined(value)) {
    value = valueDefault.clone(value);
  }
  return value;
};
export default Property;
