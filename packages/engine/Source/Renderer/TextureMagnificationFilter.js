import WebGLConstants from "../Core/WebGLConstants.js";

/**
 * 枚举在放大WebGL纹理时使用的所有可能的滤镜。
 *
 * @enum {number}
 *
 * @see TextureMinificationFilter
 */

const TextureMagnificationFilter = {
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
};

/**
 * 验证给定的 <code>textureMinificationFilter</code> 是否符合可能的枚举值。
 * @param textureMagnificationFilter
 * @returns {boolean} 如果 <code>textureMagnificationFilter</code> 是有效的，则返回 <code>true</code>。
 *
 * @private
 */

TextureMagnificationFilter.validate = function (textureMagnificationFilter) {
  return (
    textureMagnificationFilter === TextureMagnificationFilter.NEAREST ||
    textureMagnificationFilter === TextureMagnificationFilter.LINEAR
  );
};

export default Object.freeze(TextureMagnificationFilter);
