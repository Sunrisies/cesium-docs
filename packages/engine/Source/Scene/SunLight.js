import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";

/**
 * 一个来自太阳的方向光源。
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Color} [options.color=Color.WHITE] 光的颜色。
 * @param {number} [options.intensity=2.0] 光的强度。
 *
 * @alias SunLight
 * @constructor
 */

function SunLight(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  /**
   * 光的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.color = Color.clone(defaultValue(options.color, Color.WHITE));

  /**
   * 光的强度。
   * @type {number}
   * @default 2.0
   */
  this.intensity = defaultValue(options.intensity, 2.0);
}


export default SunLight;
