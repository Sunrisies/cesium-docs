import CesiumMath from "../Core/Math.js";

/**
 * 定义了在目标颜色和原始颜色之间进行混合的不同模式。
 *
 * HIGHLIGHT 将原始颜色与目标颜色相乘
 * REPLACE 用目标颜色替换原始颜色
 * MIX 将原始颜色和目标颜色混合在一起
 *
 * @enum {number}
 *
 * @see Model.colorBlendMode
 */
const ColorBlendMode = {
  HIGHLIGHT: 0,
  REPLACE: 1,
  MIX: 2,
};

/**
 * @private
 */
ColorBlendMode.getColorBlend = function(colorBlendMode, colorBlendAmount) {
  if (colorBlendMode === ColorBlendMode.HIGHLIGHT) {
    return 0.0;
  } else if (colorBlendMode === ColorBlendMode.REPLACE) {
    return 1.0;
  } else if (colorBlendMode === ColorBlendMode.MIX) {
    // The value 0.0 is reserved for highlight, so clamp to just above 0.0.
    return CesiumMath.clamp(colorBlendAmount, CesiumMath.EPSILON4, 1.0);
  }
};
export default Object.freeze(ColorBlendMode);
