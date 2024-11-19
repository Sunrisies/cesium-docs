import BlendEquation from "./BlendEquation.js";
import BlendFunction from "./BlendFunction.js";

/**
 * 混合状态结合了 {@link BlendEquation} 和 {@link BlendFunction} 以及
 * <code>enabled</code> 标志，以定义在渲染时用于组合源片段和目标片段的完整混合状态。
 * <p>
 * 这是在与 {@link Appearance#renderState} 使用自定义渲染状态时的一个辅助工具。
 * </p>
 *
 * @namespace
 */

const BlendingState = {
 /**
   * 混合被禁用。
   *
   * @type {object}
   * @constant
   */

  DISABLED: Object.freeze({
    enabled: false,
  }),

  /**
   * 混合通过 alpha 混合启用，<code>source(source.alpha) + destination(1 - source.alpha)</code>。
   *
   * @type {object}
   * @constant
   */

  ALPHA_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.SOURCE_ALPHA,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
    functionDestinationAlpha: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
  }),

  /**
   * 混合通过预乘 alpha 的 alpha 混合启用，<code>source + destination(1 - source.alpha)</code>。
   *
   * @type {object}
   * @constant
   */

  PRE_MULTIPLIED_ALPHA_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.ONE,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
    functionDestinationAlpha: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
  }),

  /**
   * 混合通过叠加混合启用，<code>source(source.alpha) + destination</code>。
   *
   * @type {object}
   * @constant
   */

  ADDITIVE_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.SOURCE_ALPHA,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE,
    functionDestinationAlpha: BlendFunction.ONE,
  }),
};
export default Object.freeze(BlendingState);
