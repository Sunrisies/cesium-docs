import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Matrix3 from "../Core/Matrix3.js";
import Quaternion from "../Core/Quaternion.js";
import Transforms from "../Core/Transforms.js";
import Property from "./Property.js";
import VelocityVectorProperty from "./VelocityVectorProperty.js";

/**
 * 一个 {@link Property}，根据提供的 {@link PositionProperty} 的速度计算出一个 {@link Quaternion} 旋转。
 *
 * @alias VelocityOrientationProperty
 * @constructor
 *
 * @param {PositionProperty} [position] 用于计算方向的位置属性。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于确定哪个方向是向上的椭球体。
 *
 * @example
 * //Create an entity with position and orientation.
 * const position = new Cesium.SampledProperty();
 * position.addSamples(...);
 * const entity = viewer.entities.add({
 *   position : position,
 *   orientation : new Cesium.VelocityOrientationProperty(position)
 * }));
 */
function VelocityOrientationProperty(position, ellipsoid) {
  this._velocityVectorProperty = new VelocityVectorProperty(position, true);
  this._subscription = undefined;
  this._ellipsoid = undefined;
  this._definitionChanged = new Event();

  this.ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

  const that = this;
  this._velocityVectorProperty.definitionChanged.addEventListener(function () {
    that._definitionChanged.raiseEvent(that);
  });
}

Object.defineProperties(VelocityOrientationProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否是恒定的。
   * @memberof VelocityOrientationProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._velocityVectorProperty);
    },
  },
  /**
   * 获取每当此属性的定义发生变化时触发的事件。
   * @memberof VelocityOrientationProperty.prototype
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
   * 获取或设置用于计算方向的位置属性。
   * @memberof VelocityOrientationProperty.prototype
   *
   * @type {Property|undefined}
   */
  position: {
    get: function () {
      return this._velocityVectorProperty.position;
    },
    set: function (value) {
      this._velocityVectorProperty.position = value;
    },
  },
  /**
   * 获取或设置用于确定哪个方向是向上的椭球体。
   * @memberof VelocityOrientationProperty.prototype
   *
   * @type {Property|undefined}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
    set: function (value) {
      const oldValue = this._ellipsoid;
      if (oldValue !== value) {
        this._ellipsoid = value;
        this._definitionChanged.raiseEvent(this);
      }
    },
  },
});


const positionScratch = new Cartesian3();
const velocityScratch = new Cartesian3();
const rotationScratch = new Matrix3();
const timeScratch = new JulianDate();

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {Quaternion} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Quaternion} 修改后的结果参数，如果未提供则返回一个新实例。
 */

VelocityOrientationProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  const velocity = this._velocityVectorProperty._getValue(
    time,
    velocityScratch,
    positionScratch,
  );

  if (!defined(velocity)) {
    return undefined;
  }

  Transforms.rotationMatrixFromPositionVelocity(
    positionScratch,
    velocity,
    this._ellipsoid,
    rotationScratch,
  );
  return Quaternion.fromRotationMatrix(rotationScratch, result);
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则为 <code>true</code>，否则为 <code>false</code>。
 */

VelocityOrientationProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof VelocityOrientationProperty &&
      Property.equals(
        this._velocityVectorProperty,
        other._velocityVectorProperty,
      ) &&
      (this._ellipsoid === other._ellipsoid ||
        this._ellipsoid.equals(other._ellipsoid)))
  );
};
export default VelocityOrientationProperty;
