/**
 * 此枚举类型用于分类鼠标事件：按下、抬起、点击、双击、移动和在按住按钮时移动。
 *
 * @enum {number}
 */
const ScreenSpaceEventType = {
  /**
   * 表示鼠标左键按下事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_DOWN: 0,

  /**
   * 表示鼠标左键抬起事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_UP: 1,

  /**
   * 表示鼠标左键点击事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_CLICK: 2,

  /**
   * 表示鼠标左键双击事件。
   *
   * @type {number}
   * @constant
   */
  LEFT_DOUBLE_CLICK: 3,

  /**
   * 表示鼠标右键按下事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_DOWN: 5,

  /**
   * 表示鼠标右键抬起事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_UP: 6,

  /**
   * 表示鼠标右键点击事件。
   *
   * @type {number}
   * @constant
   */
  RIGHT_CLICK: 7,

  /**
   * 表示鼠标中键按下事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_DOWN: 10,

  /**
   * 表示鼠标中键抬起事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_UP: 11,

  /**
   * 表示鼠标中键点击事件。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_CLICK: 12,

  /**
   * 表示鼠标移动事件。
   *
   * @type {number}
   * @constant
   */
  MOUSE_MOVE: 15,

  /**
   * 表示鼠标滚轮事件。
   *
   * @type {number}
   * @constant
   */
  WHEEL: 16,

  /**
   * 表示在触摸表面上的两指事件开始。
   *
   * @type {number}
   * @constant
   */
  PINCH_START: 17,

  /**
   * 表示在触摸表面上的两指事件结束。
   *
   * @type {number}
   * @constant
   */
  PINCH_END: 18,

  /**
   * 表示在触摸表面上的两指事件变化。
   *
   * @type {number}
   * @constant
   */
  PINCH_MOVE: 19,
};
export default Object.freeze(ScreenSpaceEventType);
