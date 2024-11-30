/**
 * 此枚举类型用于表示键盘修饰键。这些是与其他事件类型一起按下的键。
 *
 * @enum {number}
 */
const KeyboardEventModifier = {
  /**
   * 表示按下了 Shift 键。
   *
   * @type {number}
   * @constant
   */
  SHIFT: 0,

  /**
   * 表示按下了 Control 键。
   *
   * @type {number}
   * @constant
   */
  CTRL: 1,

  /**
   * 表示按下了 Alt 键。
   *
   * @type {number}
   * @constant
   */
  ALT: 2,
};
export default Object.freeze(KeyboardEventModifier);
