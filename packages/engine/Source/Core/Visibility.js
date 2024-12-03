/**
 * 此枚举类型用于确定一个对象（遮挡体）在地平线剔除过程中可见的程度。
 * 一个遮挡体可能完全遮挡一个遮挡体，此时它没有可见性；可能部分遮挡一个遮挡体，
 * 或者根本不遮挡它，从而导致完全可见。
 *
 * @enum {number}
 */
const Visibility = {
  /**
   * 表示对象的任何部分不可见。
   *
   * @type {number}
   * @constant
   */
  NONE: -1,

  /**
   * 表示对象的一部分可见，但并非全部可见。
   *
   * @type {number}
   * @constant
   */
  PARTIAL: 0,

  /**
   * 表示对象完全可见。
   *
   * @type {number}
   * @constant
   */
  FULL: 1,
};
export default Object.freeze(Visibility);
