import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import JulianDate from "../Core/JulianDate.js";
import Material from "../Scene/Material.js";

/**
 * 所有表示 {@link Material} uniform 的 {@link Property} 对象的接口。
 * 该类型定义了一个接口，不能直接实例化。
 *
 * @alias MaterialProperty
 * @constructor
 * @abstract
 *
 * @see ColorMaterialProperty
 * @see CompositeMaterialProperty
 * @see GridMaterialProperty
 * @see ImageMaterialProperty
 * @see PolylineGlowMaterialProperty
 * @see PolylineOutlineMaterialProperty
 * @see StripeMaterialProperty
 */
function MaterialProperty() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(MaterialProperty.prototype, {
  /**
   * 获取一个值，指示此属性是否为常量。如果 getValue 始终返回相同的结果，
   * 则认为属性是常量。
   * @memberof MaterialProperty.prototype
   *
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 获取在此属性的定义发生变化时引发的事件。
   * 如果对相同时间的 getValue 调用返回不同的结果，则认为定义已发生变化。
   * @memberof MaterialProperty.prototype
   *
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: DeveloperError.throwInstantiationError,
  },
});


/**
 * 获取在指定时间的 {@link Material} 类型。
 * @function
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材料的类型。
 */

MaterialProperty.prototype.getType = DeveloperError.throwInstantiationError;

/**
 * 获取在指定时间的属性值。
 * @function
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

MaterialProperty.prototype.getValue = DeveloperError.throwInstantiationError;

/**
 * 将此属性与提供的属性进行比较，返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 * @function
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等，则 <code>true</code>，否则 <code>false</code>。
 */

MaterialProperty.prototype.equals = DeveloperError.throwInstantiationError;

const timeScratch = new JulianDate();

/**
 * @private
 */
MaterialProperty.getValue = function (time, materialProperty, material) {
  let type;
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }

  if (defined(materialProperty)) {
    type = materialProperty.getType(time);
    if (defined(type)) {
      if (!defined(material) || material.type !== type) {
        material = Material.fromType(type);
      }
      materialProperty.getValue(time, material.uniforms);
      return material;
    }
  }

  if (!defined(material) || material.type !== Material.ColorType) {
    material = Material.fromType(Material.ColorType);
  }
  Color.clone(Color.WHITE, material.uniforms.color);

  return material;
};
export default MaterialProperty;
