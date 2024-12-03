/**
 * 指示场景是在 3D、2D 或 2.5D 哥伦布视图中查看。
 *
 * @enum {number}
 * @see Scene#mode
 */
const SceneMode = {
  /**
   * 在模式之间变形，例如，从 3D 到 2D。
   *
   * @type {number}
   * @constant
   */
  MORPHING: 0,

  /**
   * 哥伦布视图模式。 2.5D 透视视图，其中地图平铺
   * 展开，并且具有非零高度的对象绘制在其上方。
   *
   * @type {number}
   * @constant
   */
  COLUMBUS_VIEW: 1,

  /**
   * 2D 模式。 使用正交投影从顶部查看地图。
   *
   * @type {number}
   * @constant
   */
  SCENE2D: 2,

  /**
   * 3D 模式。 传统的地球 3D 透视视图。
   *
   * @type {number}
   * @constant
   */
  SCENE3D: 3,
};

/**
 * 返回给定场景模式的变形时间。
 *
 * @param {SceneMode} value 场景模式
 * @returns {number} 变形时间
 */
SceneMode.getMorphTime = function (value) {
  if (value === SceneMode.SCENE3D) {
    return 1.0;
  } else if (value === SceneMode.MORPHING) {
    return undefined;
  }
  return 0.0;
};
export default Object.freeze(SceneMode);
