import Cartesian3 from "../Core/Cartesian3.js";
import CesiumMath from "../Core/Math.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";

/**
 * 3D Tiles 和模型用于渲染天空气氛、地面气氛和雾的常见大气设置。
 *
 * <p>
 * 此类与 {@link SkyAtmosphere} 不应混淆，它负责渲染天空。
 * </p>
 * <p>
 * 虽然大气设置影响雾的颜色，请参见 {@link Fog} 控制雾的渲染方式。
 * </p>
 *

 * @alias Atmosphere
 * @constructor
 *
 * @example
 * // Turn on dynamic atmosphere lighting using the sun direction
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SUNLIGHT;
 *
 * @example
 * // Turn on dynamic lighting using whatever light source is in the scene
 * scene.light = new Cesium.DirectionalLight({
 *   direction: new Cesium.Cartesian3(1, 0, 0)
 * });
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SCENE_LIGHT;
 *
 * @example
 * // Adjust the color of the atmosphere effects.
 * scene.atmosphere.hueShift = 0.4; // Cycle 40% around the color wheel
 * scene.atmosphere.brightnessShift = 0.25; // Increase the brightness
 * scene.atmosphere.saturationShift = -0.1; // Desaturate the colors
 *
 * @see SkyAtmosphere
 * @see Globe
 * @see Fog
 */
function Atmosphere() {
  /**
   * 用于计算地面气氛颜色的光的强度。
   *
   * @type {number}
   * @default 10.0
   */

  this.lightIntensity = 10.0;

  /**
   * 用于地面气氛的气态散射方程中的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */

  this.rayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

 /**
   * 用于地面气氛的气态散射方程中的米散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */

  this.mieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 用于地面气氛的气态散射方程中的瑞利尺度高度，以米为单位。
   *
   * @type {number}
   * @default 10000.0
   */

  this.rayleighScaleHeight = 10000.0;

  /**
   * 用于地面气氛的气态散射方程中的米尺度高度，以米为单位。
   *
   * @type {number}
   * @default 3200.0
   */

  this.mieScaleHeight = 3200.0;

  /**
   * 考虑到米散射的介质各向异性。
   * <p>
   * 有效值在 -1.0 和 1.0 之间。
   * </p>
   *
   * @type {number}
   * @default 0.9
   */

  this.mieAnisotropy = 0.9;

  /**
   * 应用于大气的色调偏移。默认值为 0.0（无偏移）。
   * 色调偏移为 1.0 表示可用色调的完全旋转。
   *
   * @type {number}
   * @default 0.0
   */

  this.hueShift = 0.0;

  /**
   * 应用于大气的饱和度偏移。默认值为 0.0（无偏移）。
   * 饱和度偏移为 -1.0 表示单色。
   *
   * @type {number}
   * @default 0.0
   */

  this.saturationShift = 0.0;

  /**
   * 应用于大气的亮度偏移。默认值为 0.0（无偏移）。
   * 亮度偏移为 -1.0 表示完全黑暗，将允许空间显现出来。
   *
   * @type {number}
   * @default 0.0
   */

  this.brightnessShift = 0.0;

  /**
   * 当不是 DynamicAtmosphereLightingType.NONE 时，选择的光源将
   * 用于动态照亮所有与大气相关的渲染效果。
   *
   * @type {DynamicAtmosphereLightingType}
   * @default DynamicAtmosphereLightingType.NONE
   */

  this.dynamicLighting = DynamicAtmosphereLightingType.NONE;
}

/**
 * 返回 <code>true</code> 如果大气着色器需要颜色校正步骤。
 * @param {Atmosphere} atmosphere 要检查的大气实例
 * @returns {boolean} 如果大气着色器需要颜色校正步骤则返回 true
 */

Atmosphere.requiresColorCorrect = function (atmosphere) {
  return !(
    CesiumMath.equalsEpsilon(atmosphere.hueShift, 0.0, CesiumMath.EPSILON7) &&
    CesiumMath.equalsEpsilon(
      atmosphere.saturationShift,
      0.0,
      CesiumMath.EPSILON7,
    ) &&
    CesiumMath.equalsEpsilon(
      atmosphere.brightnessShift,
      0.0,
      CesiumMath.EPSILON7,
    )
  );
};

export default Atmosphere;
