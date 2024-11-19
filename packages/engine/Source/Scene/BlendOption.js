/**
 * 决定广告牌、点和标签的透明部分与场景的混合方式。
 *
 * @enum {number}
 */
const BlendOption = {
  /**
   * 集合中的广告牌、点或标签完全不透明。
   * @type {number}
   * @constant
   */
  OPAQUE: 0,

  /**
   * 集合中的广告牌、点或标签完全半透明。
   * @type {number}
   * @constant
   */
  TRANSLUCENT: 1,

  /**
   * 集合中的广告牌、点或标签既不透明又半透明。
   * @type {number}
   * @constant
   */
  OPAQUE_AND_TRANSLUCENT: 2,
};

export default Object.freeze(BlendOption);
