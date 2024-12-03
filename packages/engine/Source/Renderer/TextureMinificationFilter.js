import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 枚举在缩小WebGL纹理时使用的所有可能的滤镜。
 *
 * @enum {number}
 *
 * @see TextureMagnificationFilter
 */

const TextureMinificationFilter = {
  /**
   * 通过返回最近的像素来采样纹理。
   *
   * @type {number}
   * @constant
   */
  NEAREST: WebGLConstants.NEAREST,
  /**
   * 通过对四个最近像素进行双线性插值来采样纹理。这比 <code>NEAREST</code> 滤镜产生更平滑的结果。
   *
   * @type {number}
   * @constant
   */
  LINEAR: WebGLConstants.LINEAR,
  /**
   * 选择最近的mip级别，并在该级别内应用最近采样。
   * <p>
   * 要求纹理具有mipmap。mip级别由视角和纹理的屏幕空间大小决定。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_NEAREST: WebGLConstants.NEAREST_MIPMAP_NEAREST,
  /**
   * 选择最近的mip级别，并在该级别内应用线性采样。
   * <p>
   * 要求纹理具有mipmap。mip级别由视角和纹理的屏幕空间大小决定。
   * </p>
   *
   * @type {number}
   * @constant
   */
  LINEAR_MIPMAP_NEAREST: WebGLConstants.LINEAR_MIPMAP_NEAREST,
  /**
   * 从两个相邻的mip级别中以最近采样读取纹理值，并对结果进行线性插值。
   * <p>
   * 此选项在从mipmap纹理采样时提供视觉质量和速度的良好平衡。
   * </p>
   * <p>
   * 要求纹理具有mipmap。mip级别由视角和纹理的屏幕空间大小决定。
   * </p>
   *
   * @type {number}
   * @constant
   */
  NEAREST_MIPMAP_LINEAR: WebGLConstants.NEAREST_MIPMAP_LINEAR,
  /**
   * 从两个相邻的mip级别中以线性采样读取纹理值，并对结果进行线性插值。
   * <p>
   * 此选项在从mipmap纹理采样时提供视觉质量和速度的良好平衡。
   * </p>
   * <p>
   * 要求纹理具有mipmap。mip级别由视角和纹理的屏幕空间大小决定。
   * </p>
   * @type {number}
   * @constant
   */

  LINEAR_MIPMAP_LINEAR: WebGLConstants.LINEAR_MIPMAP_LINEAR,
};

/**
 * 验证给定的 <code>textureMinificationFilter</code> 是否符合可能的枚举值。
 *
 * @private
 *
 * @param textureMinificationFilter
 * @returns {boolean} 如果 <code>textureMinificationFilter</code> 是有效的，则返回 <code>true</code>。
 */

TextureMinificationFilter.validate = function (textureMinificationFilter) {
  return (
    textureMinificationFilter === TextureMinificationFilter.NEAREST ||
    textureMinificationFilter === TextureMinificationFilter.LINEAR ||
    textureMinificationFilter ===
      TextureMinificationFilter.NEAREST_MIPMAP_NEAREST ||
    textureMinificationFilter ===
      TextureMinificationFilter.LINEAR_MIPMAP_NEAREST ||
    textureMinificationFilter ===
      TextureMinificationFilter.NEAREST_MIPMAP_LINEAR ||
    textureMinificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_LINEAR
  );
};

export default Object.freeze(TextureMinificationFilter);
