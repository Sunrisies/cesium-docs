import DeveloperError from "../Core/DeveloperError.js";

/**
 * 用于指示要显示的传感器体积部分的常量。
 *
 * @enum {Number}
 */
const SensorVolumePortionToDisplay = {
  /**
   * 0x0000. 显示完整的传感器体积。
   *
   * @type {Number}
   * @constant
   */
  COMPLETE: 0x0000,
  /**
   * 0x0001. 显示位于椭球体真实地平线下方的传感器体积部分。
   *
   * @type {Number}
   * @constant
   */
  BELOW_ELLIPSOID_HORIZON: 0x0001,
  /**
   * 0x0002. 显示位于椭球体真实地平线以上的传感器体积部分。
   *
   * @type {Number}
   * @constant
   */
  ABOVE_ELLIPSOID_HORIZON: 0x0002,
};

/**
 * 验证提供的值是否为有效的 {@link SensorVolumePortionToDisplay} 枚举值。
 *
 * @param {SensorVolumePortionToDisplay} portionToDisplay 要验证的值。
 *
 * @returns {Boolean} 如果提供的值是有效的枚举值，则返回 <code>true</code>；否则返回 <code>false</code>。
 */
SensorVolumePortionToDisplay.validate = function (portionToDisplay) {
  return (
    portionToDisplay === SensorVolumePortionToDisplay.COMPLETE ||
    portionToDisplay === SensorVolumePortionToDisplay.BELOW_ELLIPSOID_HORIZON ||
    portionToDisplay === SensorVolumePortionToDisplay.ABOVE_ELLIPSOID_HORIZON
  );
};

/**
 * 将提供的值转换为其相应的枚举字符串。
 *
 * @param {SensorVolumePortionToDisplay} portionToDisplay 要转换为其相应枚举字符串的值。
 *
 * @returns {String} 与该值相对应的枚举字符串。
 */
SensorVolumePortionToDisplay.toString = function (portionToDisplay) {
  switch (portionToDisplay) {
    case SensorVolumePortionToDisplay.COMPLETE:
      return "COMPLETE";
    case SensorVolumePortionToDisplay.BELOW_ELLIPSOID_HORIZON:
      return "BELOW_ELLIPSOID_HORIZON";
    case SensorVolumePortionToDisplay.ABOVE_ELLIPSOID_HORIZON:
      return "ABOVE_ELLIPSOID_HORIZON";
    default:
      throw new DeveloperError(
        "SensorVolumePortionToDisplay value is not valid and cannot be converted to a String.",
      );
  }
};

export default SensorVolumePortionToDisplay;
