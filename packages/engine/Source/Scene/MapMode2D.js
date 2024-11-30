/**
 * 描述地图在 2D 中的操作方式。
 *
 * @enum {number}
 */
const MapMode2D = {
  /**
   * 2D 地图可以围绕 z 轴旋转。
   *
   * @type {number}
   * @constant
   */
  ROTATE: 0,

  /**
   * 2D 地图可以在水平方向上无限滚动。
   *
   * @type {number}
   * @constant
   */
  INFINITE_SCROLL: 1,
};
export default Object.freeze(MapMode2D);
