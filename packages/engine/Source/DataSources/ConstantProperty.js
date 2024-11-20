import defined from "../Core/defined.js";
import Event from "../Core/Event.js";

/**
 * 一个 {@link Property}，其值不随模拟时间变化。
 *
 * @alias ConstantProperty
 * @constructor
 *
 * @param {*} [value] 属性值。
 *
 * @see ConstantPositionProperty
 */

function ConstantProperty(value) {
  this._value = undefined;
  this._hasClone = false;
  this._hasEquals = false;
  this._definitionChanged = new Event();
  this.setValue(value);
}

Object.defineProperties(ConstantProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。
   * 此属性始终返回 <code>true</code>。
   * @memberof ConstantProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */

  isConstant: {
    value: true,
  },
  /**
   * 获取每当此属性的定义更改时引发的事件。
   * 如果调用 setValue 使用不同于当前值的数据，则视为定义已改变。
   * @memberof ConstantProperty.prototype
   *
   * @type {Event}
   * @readonly
   */

  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    },
  },
});

/**
 * 获取属性的值。
 *
 * @param {JulianDate} [time] 要检索值的时间。此参数未使用，因为该值不随时间变化。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数则返回新实例。
 */

ConstantProperty.prototype.getValue = function(time, result) {
  return this._hasClone ? this._value.clone(result) : this._value;
};

/**
 * 设置属性的值。
 *
 * @param {*} value 属性值。
 */

ConstantProperty.prototype.setValue = function(value) {
  const oldValue = this._value;
  if (oldValue !== value) {
    const isDefined = defined(value);
    const hasClone = isDefined && typeof value.clone === "function";
    const hasEquals = isDefined && typeof value.equals === "function";

    const changed = !hasEquals || !value.equals(oldValue);
    if (changed) {
      this._hasClone = hasClone;
      this._hasEquals = hasEquals;
      this._value = !hasClone ? value : value.clone(this._value);
      this._definitionChanged.raiseEvent(this);
    }
  }
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

ConstantProperty.prototype.equals = function(other) {
  return (
    this === other || //
    (other instanceof ConstantProperty && //
      ((!this._hasEquals && this._value === other._value) || //
        (this._hasEquals && this._value.equals(other._value))))
  );
};

/**
 * 获取此属性的值。
 *
 * @returns {*} 此属性的值。
 */
ConstantProperty.prototype.valueOf = function() {
  return this._value;
};

/**
 * 创建一个表示此属性值的字符串。
 *
 * @returns {string} 表示属性值的字符串。
 */

ConstantProperty.prototype.toString = function() {
  return String(this._value);
};
export default ConstantProperty;
