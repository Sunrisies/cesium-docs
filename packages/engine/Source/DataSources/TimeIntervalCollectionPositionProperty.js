import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import TimeIntervalCollection from "../Core/TimeIntervalCollection.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";

/**
 * 一个 {@link TimeIntervalCollectionProperty}，同时也是一个 {@link PositionProperty}。
 *
 * @alias TimeIntervalCollectionPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 位置定义的参考框架。
 */

function TimeIntervalCollectionPositionProperty(referenceFrame) {
  this._definitionChanged = new Event();
  this._intervals = new TimeIntervalCollection();
  this._intervals.changedEvent.addEventListener(
    TimeIntervalCollectionPositionProperty.prototype._intervalsChanged,
    this,
  );
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
}

Object.defineProperties(TimeIntervalCollectionPositionProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否是恒定的。如果getValue始终返回相同的结果，
   * 则该属性被视为恒定。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._intervals.isEmpty;
    },
  },
  /**
   * 获取每当此属性的定义发生变化时触发的事件。
   * 如果对getValue的调用对于同一时间返回不同的结果，则认为定义已更改。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
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
   * 获取区间集合。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   * @type {TimeIntervalCollection}
   * @readonly
   */
  intervals: {
    get: function () {
      return this._intervals;
    },
  },
  /**
   * 获取位置定义的参考框架。
   * @memberof TimeIntervalCollectionPositionProperty.prototype
   * @type {ReferenceFrame}
   * @readonly
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
});


const timeScratch = new JulianDate();

/**
 * 获取在固定框架中于提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，将使用当前系统时间。
 * @param {object} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或新实例，如果未提供结果参数。
 */
TimeIntervalCollectionPositionProperty.prototype.getValue = function (
  time,
  result,
) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在提供时间和提供参考框架下的属性值。
 *
 * @param {JulianDate} time 要检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考框架。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或新实例，如果未提供结果参数。
 */

TimeIntervalCollectionPositionProperty.prototype.getValueInReferenceFrame =
  function (time, referenceFrame, result) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(time)) {
      throw new DeveloperError("time is required.");
    }
    if (!defined(referenceFrame)) {
      throw new DeveloperError("referenceFrame is required.");
    }
    //>>includeEnd('debug');

    const position = this._intervals.findDataForIntervalContainingDate(time);
    if (defined(position)) {
      return PositionProperty.convertToReferenceFrame(
        time,
        position,
        this._referenceFrame,
        referenceFrame,
        result,
      );
    }
    return undefined;
  };

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则为 <code>true</code>，否则为 <code>false</code>。
 */

TimeIntervalCollectionPositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof TimeIntervalCollectionPositionProperty && //
      this._intervals.equals(other._intervals, Property.equals) && //
      this._referenceFrame === other._referenceFrame)
  );
};

/**
 * @private
 */
TimeIntervalCollectionPositionProperty.prototype._intervalsChanged =
  function () {
    this._definitionChanged.raiseEvent(this);
  };
export default TimeIntervalCollectionPositionProperty;
