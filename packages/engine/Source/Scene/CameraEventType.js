/**
 * 列举与相机交互时可用的输入方式。
 *
 * @enum {number}
 */
const CameraEventType = {
  /**
   * 左键按下后移动鼠标并释放按钮。
   *
   * @type {number}
   * @constant
   */
  LEFT_DRAG: 0,

  /**
   * 右键按下后移动鼠标并释放按钮。
   *
   * @type {number}
   * @constant
   */
  RIGHT_DRAG: 1,

  /**
   * 中键按下后移动鼠标并释放按钮。
   *
   * @type {number}
   * @constant
   */
  MIDDLE_DRAG: 2,

  /**
   * 滚动中间鼠标按钮。
   *
   * @type {number}
   * @constant
   */
  WHEEL: 3,

  /**
   * 在触控面上进行双指触摸。
   *
   * @type {number}
   * @constant
   */
  PINCH: 4,
};

export default Object.freeze(CameraEventType);
