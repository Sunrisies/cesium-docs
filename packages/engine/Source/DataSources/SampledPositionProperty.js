import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import PositionProperty from "./PositionProperty.js";
import Property from "./Property.js";
import SampledProperty from "./SampledProperty.js";

/**
 * 一个 {@link SampledProperty}，同时也是一个 {@link PositionProperty}。
 *
 * @alias SampledPositionProperty
 * @constructor
 *
 * @param {ReferenceFrame} [referenceFrame=ReferenceFrame.FIXED] 位置定义的参考框架。
 * @param {number} [numberOfDerivatives=0] 每个位置伴随的导数数量；即速度、加速度等...
 */

function SampledPositionProperty(referenceFrame, numberOfDerivatives) {
  numberOfDerivatives = defaultValue(numberOfDerivatives, 0);

  let derivativeTypes;
  if (numberOfDerivatives > 0) {
    derivativeTypes = new Array(numberOfDerivatives);
    for (let i = 0; i < numberOfDerivatives; i++) {
      derivativeTypes[i] = Cartesian3;
    }
  }

  this._numberOfDerivatives = numberOfDerivatives;
  this._property = new SampledProperty(Cartesian3, derivativeTypes);
  this._definitionChanged = new Event();
  this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);

  this._property._definitionChanged.addEventListener(function () {
    this._definitionChanged.raiseEvent(this);
  }, this);
}

Object.defineProperties(SampledPositionProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。如果 getValue 对于当前定义始终返回相同的结果，则认为该属性是常量。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return this._property.isConstant;
    },
  },
  /**
   * 获取每当该属性的定义发生变化时所触发的事件。
   * 如果调用 getValue 对于相同时间会返回不同的结果，则认为定义已更改。
   * @memberof SampledPositionProperty.prototype
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
   * 获取定义位置的参考框架。
   * @memberof SampledPositionProperty.prototype
   * @type {ReferenceFrame}
   * @default ReferenceFrame.FIXED;
   */
  referenceFrame: {
    get: function () {
      return this._referenceFrame;
    },
  },
  /**
   * 获取检索值时进行的插值程度。调用 <code>setInterpolationOptions</code> 来设置此项。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {number}
   * @default 1
   * @readonly
   */
  interpolationDegree: {
    get: function () {
      return this._property.interpolationDegree;
    },
  },
  /**
   * 获取检索值时使用的插值算法。调用 <code>setInterpolationOptions</code> 来设置此项。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {InterpolationAlgorithm}
   * @default LinearApproximation
   * @readonly
   */
  interpolationAlgorithm: {
    get: function () {
      return this._property.interpolationAlgorithm;
    },
  },
  /**
   * 此属性包含的导数数量；即位置为 0，速度为 1，等等。
   * @memberof SampledPositionProperty.prototype
   *
   * @type {number}
   * @default 0
   */
  numberOfDerivatives: {
    get: function () {
      return this._numberOfDerivatives;
    },
  },
  /**
   * 获取或设置在请求值时执行的向前推断类型
   * 当在任何可用样本之后的时间请求值时。
   * @memberof SampledPositionProperty.prototype
   * @type {ExtrapolationType}
   * @default ExtrapolationType.NONE
   */
  forwardExtrapolationType: {
    get: function () {
      return this._property.forwardExtrapolationType;
    },
    set: function (value) {
      this._property.forwardExtrapolationType = value;
    },
  },
  /**
   * 获取或设置在属性变为未定义之前向前推断的时间量。
   * 值为 0 将无限制向前推断。
   * @memberof SampledPositionProperty.prototype
   * @type {number}
   * @default 0
   */
  forwardExtrapolationDuration: {
    get: function () {
      return this._property.forwardExtrapolationDuration;
    },
    set: function (value) {
      this._property.forwardExtrapolationDuration = value;
    },
  },
  /**
   * 获取或设置在请求值时执行的向后推断类型
   * 当在任何可用样本之前的时间请求值时。
   * @memberof SampledPositionProperty.prototype
   * @type {ExtrapolationType}
   * @default ExtrapolationType.NONE
   */
  backwardExtrapolationType: {
    get: function () {
      return this._property.backwardExtrapolationType;
    },
    set: function (value) {
      this._property.backwardExtrapolationType = value;
    },
  },
  /**
   * 获取或设置在属性变为未定义之前向后推断的时间量。
   * 值为 0 将无限制向后推断。
   * @memberof SampledPositionProperty.prototype
   * @type {number}
   * @default 0
   */
  backwardExtrapolationDuration: {
    get: function () {
      return this._property.backwardExtrapolationDuration;
    },
    set: function (value) {
      this._property.backwardExtrapolationDuration = value;
    },
  },
});


const timeScratch = new JulianDate();

/**
 * 获取在提供时间的位置信息。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

SampledPositionProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
};

/**
 * 获取在提供时间和提供的参考框架下的位置信息。
 *
 * @param {JulianDate} time 要检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考框架。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

SampledPositionProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);
  Check.defined("referenceFrame", referenceFrame);
  //>>includeEnd('debug');

  result = this._property.getValue(time, result);
  if (defined(result)) {
    return PositionProperty.convertToReferenceFrame(
      time,
      result,
      this._referenceFrame,
      referenceFrame,
      result,
    );
  }
  return undefined;
};

/**
 * 设置插值位置时使用的算法和程度。
 *
 * @param {object} [options] 带有以下属性的对象：
 * @param {InterpolationAlgorithm} [options.interpolationAlgorithm] 新的插值算法。如果未定义，则现有属性保持不变。
 * @param {number} [options.interpolationDegree] 新的插值程度。如果未定义，则现有属性保持不变。
 */
SampledPositionProperty.prototype.setInterpolationOptions = function (options) {
  this._property.setInterpolationOptions(options);
};

/**
 * 添加一个新的样本。
 *
 * @param {JulianDate} time 样本时间。
 * @param {Cartesian3} position 提供时间的位置信息。
 * @param {Cartesian3[]} [derivatives] 在提供时间的导数值数组。
 */

SampledPositionProperty.prototype.addSample = function (
  time,
  position,
  derivatives,
) {
  const numberOfDerivatives = this._numberOfDerivatives;
  //>>includeStart('debug', pragmas.debug);
  if (
    numberOfDerivatives > 0 &&
    (!defined(derivatives) || derivatives.length !== numberOfDerivatives)
  ) {
    throw new DeveloperError(
      "derivatives length must be equal to the number of derivatives.",
    );
  }
  //>>includeEnd('debug');
  this._property.addSample(time, position, derivatives);
};

/**
 * 通过并行数组添加多个样本。
 *
 * @param {JulianDate[]} times 一个 JulianDate 实例的数组，每个索引对应一个样本时间。
 * @param {Cartesian3[]} positions 一个 Cartesian3 位置实例的数组，每个值对应于提供的时间索引。
 * @param {Array[]} [derivatives] 一个数组，其中每个值是另一个数组，包含对应时间索引的导数。
 *
 * @exception {DeveloperError} 所有数组必须具有相同的长度。
 */
SampledPositionProperty.prototype.addSamples = function (
  times,
  positions,
  derivatives,
) {
  this._property.addSamples(times, positions, derivatives);
};

/**
 * 作为单个打包数组添加样本，其中每个新样本表示为一个日期，
 * 后跟相应值和导数的打包表示。
 *
 * @param {number[]} packedSamples 打包样本的数组。
 * @param {JulianDate} [epoch] 如果 packedSamples 中的任何日期是数字，则视为相对于该纪元的偏移量（以秒为单位）。
 */

SampledPositionProperty.prototype.addSamplesPackedArray = function (
  packedSamples,
  epoch,
) {
  this._property.addSamplesPackedArray(packedSamples, epoch);
};

/**
 * 移除给定时间的样本（如果存在）。
 *
 * @param {JulianDate} time 样本时间。
 * @returns {boolean} 如果在该时间移除了样本，则返回 <code>true</code>，否则返回 <code>false</code>。
 */
SampledPositionProperty.prototype.removeSample = function (time) {
  return this._property.removeSample(time);
};

/**
 * 移除给定时间区间内的所有样本。
 *
 * @param {TimeInterval} timeInterval 要移除所有样本的时间区间。
 */
SampledPositionProperty.prototype.removeSamples = function (timeInterval) {
  this._property.removeSamples(timeInterval);
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等，则返回 <code>true</code>，否则返回 <code>false</code>。
 */

SampledPositionProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof SampledPositionProperty &&
      Property.equals(this._property, other._property) && //
      this._referenceFrame === other._referenceFrame)
  );
};
export default SampledPositionProperty;
