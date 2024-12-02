/**
 * 确定对 {@link PostProcessStage} 的输入纹理是如何进行采样的。
 *
 * @enum {number}
 */
const PostProcessStageSampleMode = {
  /**
   * 通过返回最近的纹素来对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  NEAREST: 0,
  /**
   * 通过对四个最近的纹素进行双线性插值来对纹理进行采样。
   *
   * @type {number}
   * @constant
   */
  LINEAR: 1,
};
export default PostProcessStageSampleMode;
