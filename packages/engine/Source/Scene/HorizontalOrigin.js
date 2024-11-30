/**
 * 原点相对于对象的水平位置，例如 {@link Billboard} 或 {@link Label}。
 * 例如，将水平原点设置为 <code>LEFT</code> 或 <code>RIGHT</code> 将在锚点位置的左侧或右侧（屏幕空间）显示广告牌。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.setHorizontalOrigin.png' width='648' height='196' /><br />
 * </div>
 *
 * @enum {number}
 *
 * @see Billboard#horizontalOrigin
 * @see Label#horizontalOrigin
 */

const HorizontalOrigin = {
  /**
   * 原点位于对象的水平中心。
   *
   * @type {number}
   * @constant
   */
  CENTER: 0,

  /**
   * 原点位于对象的左侧。
   *
   * @type {number}
   * @constant
   */
  LEFT: 1,

  /**
   * 原点位于对象的右侧。
   *
   * @type {number}
   * @constant
   */
  RIGHT: -1,
};

export default Object.freeze(HorizontalOrigin);
