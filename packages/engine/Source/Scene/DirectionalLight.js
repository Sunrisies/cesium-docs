import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import DeveloperError from "../Core/DeveloperError.js";

/**
 * 从一个无限远处单向发射的光源。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3} options.direction 发光的方向。
 * @param {Color} [options.color=Color.WHITE] 光的颜色。
 * @param {number} [options.intensity=1.0] 光的强度。
 *
 * @exception {DeveloperError} options.direction 不能为零长度
 *
 * @alias DirectionalLight
 * @constructor
 */
function DirectionalLight(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.direction", options.direction);
  if (Cartesian3.equals(options.direction, Cartesian3.ZERO)) {
    throw new DeveloperError("options.direction cannot be zero-length");
  }
  //>>includeEnd('debug');

  /**
   * 发光的方向。
   * @type {Cartesian3}
   */
  this.direction = Cartesian3.clone(options.direction);

  /**
   * 光的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.color = Color.clone(defaultValue(options.color, Color.WHITE));

  /**
   * 光的强度。
   * @type {number}
   * @default 1.0
   */
  this.intensity = defaultValue(options.intensity, 1.0);
}

export default DirectionalLight;