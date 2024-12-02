import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix3 from "../Core/Matrix3.js";
import ReferenceFrame from "../Core/ReferenceFrame.js";
import Transforms from "../Core/Transforms.js";

/**
 * 所有 {@link Property} 对象的接口，这些对象将世界位置定义为带有关联 {@link ReferenceFrame} 的 {@link Cartesian3}。
 * 该类型定义了一个接口，不能直接实例化。
 *
 * @alias PositionProperty
 * @constructor
 * @abstract
 *
 * @see CallbackPositionProperty
 * @see CompositePositionProperty
 * @see ConstantPositionProperty
 * @see SampledPositionProperty
 * @see TimeIntervalCollectionPositionProperty
 */

function PositionProperty() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(PositionProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。如果 getValue 始终返回相同的结果，则该属性被认为是常量。
   * @memberof PositionProperty.prototype
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
   * @memberof PositionProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取位置所定义的参考框架。
   * @memberof PositionProperty.prototype
   * @type {ReferenceFrame}
   */

  referenceFrame: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 获取在固定框架中提供时间的属性值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */
PositionProperty.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 获取在提供时间和提供的参考框架中的属性值。
 * @function
 *
 * @param {JulianDate} time 要检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果的期望参考框架。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3 | undefined} 修改后的结果参数或如果未提供结果参数则返回的新实例。
 */
PositionProperty.prototype.getValueInReferenceFrame =
  DeveloperError.throwInstantiationError;

/**
 * 比较此属性与提供的属性并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

PositionProperty.prototype.equals = DeveloperError.throwInstantiationError;

const scratchMatrix3 = new Matrix3();

/**
 * @private
 */
PositionProperty.convertToReferenceFrame = function (
  time,
  value,
  inputFrame,
  outputFrame,
  result,
) {
  if (!defined(value)) {
    return value;
  }
  if (!defined(result)) {
    result = new Cartesian3();
  }

  if (inputFrame === outputFrame) {
    return Cartesian3.clone(value, result);
  }

  const icrfToFixed = Transforms.computeIcrfToCentralBodyFixedMatrix(
    time,
    scratchMatrix3,
  );
  if (inputFrame === ReferenceFrame.INERTIAL) {
    return Matrix3.multiplyByVector(icrfToFixed, value, result);
  }
  if (inputFrame === ReferenceFrame.FIXED) {
    return Matrix3.multiplyByVector(
      Matrix3.transpose(icrfToFixed, scratchMatrix3),
      value,
      result,
    );
  }
};
export default PositionProperty;
