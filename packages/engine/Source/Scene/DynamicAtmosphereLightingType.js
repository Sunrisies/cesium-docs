/**
 * 大气光照效果（天空大气、地面大气、雾）可以通过随时间变化的太阳或其他光源的动态光照进一步修改。
 * 这个枚举决定了使用哪个光源。
 *
 * @enum {number}
 */
const DynamicAtmosphereLightingType = {
  /**
   * 不使用动态大气光照。大气光照效果将直接从正上方照亮，而不是使用场景的光源。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,
  /**
   * 使用场景的当前光源进行动态大气光照。
   *
   * @type {number}
   * @constant
   */
  SCENE_LIGHT: 1,
  /**
   * 强制动态大气光照始终使用阳光方向，即使场景使用不同的光源。
   *
   * @type {number}
   * @constant
   */
  SUNLIGHT: 2,
};

/**
 * 从旧的地球仪标志中获取光照枚举
 *
 * @param {Globe} globe 地球仪
 * @return {DynamicAtmosphereLightingType} 对应的枚举值
 *
 * @private
 */
DynamicAtmosphereLightingType.fromGlobeFlags = function (globe) {
  const lightingOn = globe.enableLighting && globe.dynamicAtmosphereLighting;
  if (!lightingOn) {
    return DynamicAtmosphereLightingType.NONE;
  }

  // 强制使用阳光
  if (globe.dynamicAtmosphereLightingFromSun) {
    return DynamicAtmosphereLightingType.SUNLIGHT;
  }

  return DynamicAtmosphereLightingType.SCENE_LIGHT;
};

export default Object.freeze(DynamicAtmosphereLightingType);