/**
 * 表示相对于地形的位置。
 *
 * @enum {number}
 */
const HeightReference = {
  /**
   * 位置是绝对的。
   * @type {number}
   * @constant
   */
  NONE: 0,

  /**
   * 位置被固定在地形和 3D 图块上。
   * @type {number}
   * @constant
   */
  CLAMP_TO_GROUND: 1,

  /**
   * 位置高度是相对于地形和 3D 图块的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_GROUND: 2,

  /**
   * 位置被固定在地形上。
   * @type {number}
   * @constant
   */
  CLAMP_TO_TERRAIN: 3,

  /**
   * 位置高度是相对于地形的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_TERRAIN: 4,

  /**
   * 位置被固定在 3D 图块上。
   * @type {number}
   * @constant
   */
  CLAMP_TO_3D_TILE: 5,

  /**
   * 位置高度是相对于 3D 图块的高度。
   * @type {number}
   * @constant
   */
  RELATIVE_TO_3D_TILE: 6,
};

export default Object.freeze(HeightReference);

/**
 * 如果高度应固定在表面上，则返回 true
 * @param {HeightReference} heightReference
 * @returns {boolean} 如果高度应固定在表面上，则返回 true
 * @private
 */
export function isHeightReferenceClamp(heightReference) {
  return (
    heightReference === HeightReference.CLAMP_TO_GROUND ||
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.CLAMP_TO_TERRAIN
  );
}

/**
 * 如果高度应相对于表面偏移，则返回 true
 * @param {HeightReference} heightReference
 * @returns {boolean} 如果高度应相对于表面偏移，则返回 true
 * @private
 */
export function isHeightReferenceRelative(heightReference) {
  return (
    heightReference === HeightReference.RELATIVE_TO_GROUND ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN
  );
}
