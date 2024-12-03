import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Property from "./Property.js";

/**
 * 一个 {@link Property}，根据提供的 {@link PositionProperty} 的速度计算出一个 {@link Cartesian3} 向量。
 *
 * @alias VelocityVectorProperty
 * @constructor
 *
 * @param {PositionProperty} [position] 用于计算速度的位置属性。
 * @param {boolean} [normalize=true] 是否归一化计算出的速度向量。
 *
 * @example
 * //Create an entity with a billboard rotated to match its velocity.
 * const position = new Cesium.SampledProperty();
 * position.addSamples(...);
 * const entity = viewer.entities.add({
 *   position : position,
 *   billboard : {
 *     image : 'image.png',
 *     alignedAxis : new Cesium.VelocityVectorProperty(position, true) // alignedAxis must be a unit vector
 *   }
 * }));
 */
function VelocityVectorProperty(position, normalize) {
  this._position = undefined;
  this._subscription = undefined;
  this._definitionChanged = new Event();
  this._normalize = defaultValue(normalize, true);

  this.position = position;
}

Object.defineProperties(VelocityVectorProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否是恒定的。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._position);
    },
  },
  /**
   * 获取每当此属性的定义发生变化时触发的事件。
   * @memberof VelocityVectorProperty.prototype
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
   * 获取或设置用于计算速度向量的位置属性。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {Property|undefined}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      const oldValue = this._position;
      if (oldValue !== value) {
        if (defined(oldValue)) {
          this._subscription();
        }

        this._position = value;

        if (defined(value)) {
          this._subscription = value._definitionChanged.addEventListener(
            function () {
              this._definitionChanged.raiseEvent(this);
            },
            this,
          );
        }

        this._definitionChanged.raiseEvent(this);
      }
    },
  },
  /**
   * 获取或设置由此属性生成的向量是否被归一化。
   * @memberof VelocityVectorProperty.prototype
   *
   * @type {boolean}
   */
  normalize: {
    get: function () {
      return this._normalize;
    },
    set: function (value) {
      if (this._normalize === value) {
        return;
      }

      this._normalize = value;
      this._definitionChanged.raiseEvent(this);
    },
  },
});


const position1Scratch = new Cartesian3();
const position2Scratch = new Cartesian3();
const timeScratch = new JulianDate();
const timeNowScratch = new JulianDate();
const step = 1.0 / 60.0;

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，将使用当前系统时间。
 * @param {Cartesian3} [result] 要存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供则返回一个新实例。
 */

VelocityVectorProperty.prototype.getValue = function (time, result) {
  return this._getValue(time, result);
};

/**
 * @private
 */
VelocityVectorProperty.prototype._getValue = function (
  time,
  velocityResult,
  positionResult,
) {
  if (!defined(time)) {
    time = JulianDate.now(timeNowScratch);
  }

  if (!defined(velocityResult)) {
    velocityResult = new Cartesian3();
  }

  const property = this._position;
  if (Property.isConstant(property)) {
    return this._normalize
      ? undefined
      : Cartesian3.clone(Cartesian3.ZERO, velocityResult);
  }

  let position1 = property.getValue(time, position1Scratch);
  let position2 = property.getValue(
    JulianDate.addSeconds(time, step, timeScratch),
    position2Scratch,
  );

  //If we don't have a position for now, return undefined.
  if (!defined(position1)) {
    return undefined;
  }

  //If we don't have a position for now + step, see if we have a position for now - step.
  if (!defined(position2)) {
    position2 = position1;
    position1 = property.getValue(
      JulianDate.addSeconds(time, -step, timeScratch),
      position2Scratch,
    );

    if (!defined(position1)) {
      return undefined;
    }
  }

  if (Cartesian3.equals(position1, position2)) {
    return this._normalize
      ? undefined
      : Cartesian3.clone(Cartesian3.ZERO, velocityResult);
  }

  if (defined(positionResult)) {
    position1.clone(positionResult);
  }

  const velocity = Cartesian3.subtract(position2, position1, velocityResult);
  if (this._normalize) {
    return Cartesian3.normalize(velocity, velocityResult);
  }

  return Cartesian3.divideByScalar(velocity, step, velocityResult);
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果左右相等，则为 <code>true</code>，否则为 <code>false</code>。
 */

VelocityVectorProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof VelocityVectorProperty &&
      Property.equals(this._position, other._position))
  );
};
export default VelocityVectorProperty;
