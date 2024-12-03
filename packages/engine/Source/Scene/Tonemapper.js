/**
 * 渲染高动态范围时使用的色调映射算法。
 *
 * @enum {string}
 */
const Tonemapper = {
  /**
   * 使用Reinhard色调映射。
   *
   * @type {string}
   * @constant
   */
  REINHARD: "REINHARD",

  /**
   * 使用修改过的Reinhard色调映射。
   *
   * @type {string}
   * @constant
   */
  MODIFIED_REINHARD: "MODIFIED_REINHARD",

  /**
   * 使用胶卷色调映射。
   *
   * @type {string}
   * @constant
   */
  FILMIC: "FILMIC",

  /**
   * 使用ACES色调映射。
   *
   * @type {string}
   * @constant
   */
  ACES: "ACES",

  /**
   * 使用PBR中性色调映射 {@link https://github.com/KhronosGroup/ToneMapping/tree/main/PBR_Neutral|来自Khronos}。
   *
   * @type {string}
   * @constant
   */
  PBR_NEUTRAL: "PBR_NEUTRAL",
};

/**
 * 验证提供的值是否为已知的色调映射类型
 * @private
 *
 * @param {string} tonemapper
 */
export function validateTonemapper(tonemapper) {
  return (
    tonemapper === Tonemapper.REINHARD ||
    tonemapper === Tonemapper.MODIFIED_REINHARD ||
    tonemapper === Tonemapper.FILMIC ||
    tonemapper === Tonemapper.ACES ||
    tonemapper === Tonemapper.PBR_NEUTRAL
  );
}

export default Object.freeze(Tonemapper);
