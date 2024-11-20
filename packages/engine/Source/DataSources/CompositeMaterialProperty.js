import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 一个既是 {@link CompositeProperty} 又是 {@link MaterialProperty} 的属性。
 *
 * @alias CompositeMaterialProperty
 * @constructor
 */

function CompositeMaterialProperty() {
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositeMaterialProperty.prototype._raiseDefinitionChanged,
    this,
  );
}

Object.defineProperties(CompositeMaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果对于当前定义，getValue 始终返回相同的结果，则该属性被视为常量。
   * @memberof CompositeMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._composite.isConstant;
    },
  },
  /**
   * 获取每当此属性的定义更改时引发的事件。
   * 每当使用不同于当前值的数据调用 setValue 时，定义就会改变。
   * @memberof CompositeMaterialProperty.prototype
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
   * 获取时间区间集合。
   * @memberof CompositeMaterialProperty.prototype
   *
   * @type {TimeIntervalCollection}
   */
  intervals: {
    get: function () {
      return this._composite._intervals;
    },
  },
});


/**
 * 获取在指定时间的 {@link Material} 类型。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */

CompositeMaterialProperty.prototype.getType = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required");
  }
  //>>includeEnd('debug');

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getType(time);
  }
  return undefined;
};

const timeScratch = new JulianDate();

/**
 * 获取在指定时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，或如果未提供结果参数则返回新实例。
 */

CompositeMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getValue(time, result);
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

CompositeMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CompositeMaterialProperty && //
      this._composite.equals(other._composite, Property.equals))
  );
};

/**
 * @private
 */
CompositeMaterialProperty.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default CompositeMaterialProperty;
