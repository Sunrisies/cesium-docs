/**
 * 用于照明 {@link Model} 的光照模型。
 *
 * @enum {number}
 *
 * @experimental 该功能使用 3D Tiles 规范的部分内容，该内容尚未最终确定，并且可能会在没有 Cesium 标准弃用政策的情况下发生更改。
 */
const LightingModel = {
  /**
   * 使用未照明阴影，即跳过照明计算。模型的
   * 漫反射颜色（假设为线性 RGB，而不是 sRGB）在计算 <code>out_FragColor</code> 时直接使用。仍然会应用 alpha 模式。
   *
   * @type {number}
   * @constant
   */
  UNLIT: 0,
  
  /**
   * 使用物理基础渲染光照计算。这包括
   * PBR 金属粗糙度和 PBR 镀光的计算。还会在可能的情况下应用基于图像的
   * 照明。
   *
   * @type {number}
   * @constant
   */
  PBR: 1,
};

export default Object.freeze(LightingModel);
