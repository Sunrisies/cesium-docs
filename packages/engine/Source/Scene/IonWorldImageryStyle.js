// 注意，这些值直接映射到 ion 资产 ID.

/**
 * {@link createWorldImagery} 提供的图像类型。
 *
 * @enum {number}
 */
const IonWorldImageryStyle = {
  /**
   * 航拍图像。
   *
   * @type {number}
   * @constant
   */
  AERIAL: 2,

  /**
   * 带有道路叠加的航拍图像。
   *
   * @type {number}
   * @constant
   */
  AERIAL_WITH_LABELS: 3,

  /**
   * 只有道路，没有额外图像。
   *
   * @type {number}
   * @constant
   */
  ROAD: 4,
};
export default Object.freeze(IonWorldImageryStyle);
