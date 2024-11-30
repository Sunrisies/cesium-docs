/**
 * 此枚举类型用于确定对象相对于视锥的位置。对象可以完全包含在视锥内（INSIDE），
 * 部分在视锥内部分在视锥外（INTERSECTING），或完全在视锥的 6 个平面之外（OUTSIDE）。
 *
 * @enum {number}
 */
const Intersect = {
  /**
   * 表示对象不包含在视锥内。
   *
   * @type {number}
   * @constant
   */
  OUTSIDE: -1,

  /**
   * 表示对象与视锥的某个平面相交。
   *
   * @type {number}
   * @constant
   */
  INTERSECTING: 0,

  /**
   * 表示对象完全在视锥内。
   *
   * @type {number}
   * @constant
   */
  INSIDE: 1,
};
export default Object.freeze(Intersect);
