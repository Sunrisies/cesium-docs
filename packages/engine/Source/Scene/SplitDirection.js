/**
 * 相对于 {@link Scene#splitPosition} 显示基元或影像层的方向。
 *
 * @enum {number}
 *
 * @see ImageryLayer#splitDirection
 * @see Cesium3DTileset#splitDirection
 */
const SplitDirection = {
  /**
   * 将基元或影像层显示在 {@link Scene#splitPosition} 的左侧。
   *
   * @type {number}
   * @constant
   */
  LEFT: -1.0,

  /**
   * 始终显示基元或影像层。
   *
   * @type {number}
   * @constant
   */
  NONE: 0.0,

  /**
   * 将基元或影像层显示在 {@link Scene#splitPosition} 的右侧。
   *
   * @type {number}
   * @constant
   */
  RIGHT: 1.0,
};
export default Object.freeze(SplitDirection);
