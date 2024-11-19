import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import Property from "./Property.js";

/**
 * A {@link MaterialProperty} that maps to PolylineArrow {@link Material} uniforms.
 *
 * @param {Property|Color} [color=Color.WHITE] The {@link Color} Property to be used.
 *
 * @alias PolylineArrowMaterialProperty
 * @constructor
 */
function PolylineArrowMaterialProperty(color) {
  this._definitionChanged = new Event();
  this._color = undefined;
  this._colorSubscription = undefined;

  this.color = color;
}

Object.defineProperties(PolylineArrowMaterialProperty.prototype, {
  /**
   * Gets a value indicating if this property is constant.  A property is considered
   * constant if getValue always returns the same result for the current definition.
   * @memberof PolylineArrowMaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(this._color);
    },
  },
  /**
   * Gets the event that is raised whenever the definition of this property changes.
   * The definition is considered to have changed if a call to getValue would return
   * a different result for the same time.
   * @memberof PolylineArrowMaterialProperty.prototype
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
   * Gets or sets the {@link Color} {@link Property}.
   * @memberof PolylineArrowMaterialProperty.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),
});

/**
 * Gets the {@link Material} type at the provided time.
 *
 * @param {JulianDate} time The time for which to retrieve the type.
 * @returns {string} The type of material.
 */
PolylineArrowMaterialProperty.prototype.getType = function (time) {
  return "PolylineArrow";
};

const timeScratch = new JulianDate();

/**
 * Gets the value of the property at the provided time.
 *
 * @param {JulianDate} [time=JulianDate.now()] The time for which to retrieve the value. If omitted, the current system time is used.
 * @param {object} [result] The object to store the value into, if omitted, a new instance is created and returned.
 * @returns {object} The modified result parameter or a new instance if the result parameter was not supplied.
 */
PolylineArrowMaterialProperty.prototype.getValue = function (time, result) {
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  if (!defined(result)) {
    result = {};
  }
  result.color = Property.getValueOrClonedDefault(
    this._color,
    time,
    Color.WHITE,
    result.color,
  );
  return result;
};

/**
 * Compares this property to the provided property and returns
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] The other property.
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */
PolylineArrowMaterialProperty.prototype.equals = function (other) {
  return (
    this === other || //
    (other instanceof PolylineArrowMaterialProperty && //
      Property.equals(this._color, other._color))
  );
};
export default PolylineArrowMaterialProperty;