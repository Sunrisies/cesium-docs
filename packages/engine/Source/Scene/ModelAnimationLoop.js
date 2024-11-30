/**
 * 确定 glTF 动画是否以及如何循环播放。
 *
 * @enum {number}
 *
 * @see ModelAnimationCollection#add
 */
const ModelAnimationLoop = {
  /**
   * 仅播放一次动画；不循环播放。
   *
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 循环播放动画，动画停止后立即从头开始播放。
   *
   * @type {number}
   * @constant
   */
  REPEAT: 1,

  /**
   * 循环播放动画。首先正向播放，然后反向播放，然后再次正向播放，依此类推。
   *
   * @type {number}
   * @constant
   */
  MIRRORED_REPEAT: 2,
};
export default Object.freeze(ModelAnimationLoop);
