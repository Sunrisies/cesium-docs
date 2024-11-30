import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 定义在局部坐标系中的航向角、俯仰角和范围。
 * 航向是从局部东方向旋转的角度，正角度表示向南增加。
 * 俯仰是从局部xy平面旋转的角度。正俯仰角在平面上方。负俯仰角在平面下方。
 * 范围是从坐标系中心的距离。
 * @alias HeadingPitchRange
 * @constructor
 *
 * @param {number} [heading=0.0] 航向角（以弧度为单位）。
 * @param {number} [pitch=0.0] 俯仰角（以弧度为单位）。
 * @param {number} [range=0.0] 从中心到目标的距离（以米为单位）。
 */

function HeadingPitchRange(heading, pitch, range) {
  /**
   * 航向是从局部东方向旋转的角度，正角度表示向南增加。
   * @type {number}
   * @default 0.0
   */
  this.heading = defaultValue(heading, 0.0);

  /**
   * 俯仰是从局部xy平面旋转的角度。正俯仰角在平面上方。负俯仰角在平面下方。
   * @type {number}
   * @default 0.0
   */
  this.pitch = defaultValue(pitch, 0.0);

  /**
   * 范围是从局部坐标系中心的距离。
   * @type {number}
   * @default 0.0
   */
  this.range = defaultValue(range, 0.0);
}


/**
 * 复制一个 HeadingPitchRange 实例。
 *
 * @param {HeadingPitchRange} hpr 要复制的 HeadingPitchRange。
 * @param {HeadingPitchRange} [result] 存储结果的对象。
 * @returns {HeadingPitchRange} 修改后的结果参数，如果未提供则返回一个新的 HeadingPitchRange 实例。（如果 hpr 为 undefined，则返回 undefined）
 */

HeadingPitchRange.clone = function (hpr, result) {
  if (!defined(hpr)) {
    return undefined;
  }
  if (!defined(result)) {
    result = new HeadingPitchRange();
  }

  result.heading = hpr.heading;
  result.pitch = hpr.pitch;
  result.range = hpr.range;
  return result;
};
export default HeadingPitchRange;
