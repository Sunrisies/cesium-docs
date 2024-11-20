import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import CompositeProperty from "./CompositeProperty.js";
import Property from "./Property.js";

/**
 * 一个既是 {@link CompositeProperty} 又是 {@link PositionProperty} 的属性。
 *
 * @alias CompositePositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 定义位置的参考坐标系。
 */

function CompositePositionProperty(referenceFrame) {
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
  this._definitionChanged = new Event();
  this._composite = new CompositeProperty();
  this._composite.definitionChanged.addEventListener(
    CompositePositionProperty.prototype._raiseDefinitionChanged,
    this,
  );
}

Object.defineProperties(CompositePositionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果对于当前定义，getValue 始终返回相同的结果，则该属性被视为常量。
   * @memberof CompositePositionProperty.prototype
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
   * @memberof CompositePositionProperty.prototype
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
   * @memberof CompositePositionProperty.prototype
   *
   * @type {TimeIntervalCollection}
   */
  intervals: {
    get: function () {
      return this._composite.intervals;
    },
  },
  /**
   * 获取或设置此位置所呈现的参考坐标系。
   * 组成此对象的每个 PositionProperty 都有其自己的参考坐标系，
   * 因此此属性仅公开一个供客户端使用的“首选”参考坐标系。
   * @memberof CompositePositionProperty.prototype
   *
   * @type {ReferenceFrame}
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
    set: function (value) {
      this._referenceFrame = value;
    },
  },
});


const timeScratch = new JulianDate();

/**
 * 获取在固定坐标系中指定时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数则返回新实例。
 */

CompositePositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在指定时间和指定参考坐标系中的属性值。
 *
 * @param {JulianDate} time 要检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考坐标系。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数则返回新实例。
 */

CompositePositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  if (!defined(referenceFrame)) {
    throw new DeveloperError("referenceFrame is required.");
  }
  //>>includeEnd('debug');

  const innerProperty =
    this._composite._intervals.findDataForIntervalContainingDate(time);
  if (defined(innerProperty)) {
    return innerProperty.getValueInReferenceFrame(time, referenceFrame, result);
  }
  return undefined;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */

CompositePositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof CompositePositionProperty && //
      this._referenceFrame === other._referenceFrame && //
      this._composite.equals(other._composite, Property.equals))
  );
};

/**
 * @private
 */
CompositePositionProperty.prototype._raiseDefinitionChanged = function () {
  this._definitionChanged.raiseEvent(this);
};
export default CompositePositionProperty;
