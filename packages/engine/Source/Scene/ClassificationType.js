/**
 * 分类是否影响地形、3D Tiles 或两者。
 *
 * @enum {number}
 */
const ClassificationType = {
  /**
   * 仅对地形进行分类。
   *
   * @type {number}
   * @constant
   */
  TERRAIN: 0,
  /**
   * 仅对 3D Tiles 进行分类。
   *
   * @type {number}
   * @constant
   */
  CESIUM_3D_TILE: 1,
  /**
   * 对地形和 3D Tiles 都进行分类。
   *
   * @type {number}
   * @constant
   */
  BOTH: 2,
};

/**
 * @private
 */
ClassificationType.NUMBER_OF_CLASSIFICATION_TYPES = 3;

export default Object.freeze(ClassificationType);
