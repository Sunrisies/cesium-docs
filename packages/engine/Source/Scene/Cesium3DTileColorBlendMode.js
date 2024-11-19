/**
 * 定义从 Cesium API 或声明式样式设置的每个特征颜色如何与原始特征的源颜色混合， 
 * 例如 glTF 材质或瓷砖中的每个点颜色。
 * <p>
 * 当使用 <code>REPLACE</code> 或 <code>MIX</code> 时，如果源颜色是 glTF 材质，则该技术必须将
 * <code>_3DTILESDIFFUSE</code> 语义分配给漫反射颜色参数。否则，仅支持 <code>HIGHLIGHT</code>。
 * </p>
 * <p>
 * 颜色评估为白色 (1.0, 1.0, 1.0) 的特征始终不进行颜色混合渲染，无论瓷砖集的颜色混合模式如何。
 * </p>
 * <pre><code>
 * "techniques": {
 *   "technique0": {
 *     "parameters": {
 *       "diffuse": {
 *         "semantic": "_3DTILESDIFFUSE",
 *         "type": 35666
 *       }
 *     }
 *   }
 * }
 * </code></pre>
 *
 * @enum {number}
 */

const Cesium3DTileColorBlendMode = {
  /**
   * 将源颜色与特征颜色相乘。
   *
   * @type {number}
   * @constant
   */
  HIGHLIGHT: 0,

  /**
   * 用特征颜色替换源颜色。
   *
   * @type {number}
   * @constant
   */
  REPLACE: 1,

  /**
   * 将源颜色和特征颜色混合在一起。
   *
   * @type {number}
   * @constant
   */
  MIX: 2,
};

export default Object.freeze(Cesium3DTileColorBlendMode);
