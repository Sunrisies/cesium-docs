/**
 * 用于协方差信息的存储类型枚举。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展的
 * `gltfGpmLocal.storageType` 定义。
 *
 * @enum {string}
 * @experimental 此功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

const StorageType = {
  /**
   * 存储锚点的完整误差协方差，包括交叉协方差项。
   *
   * @type {string}
   * @constant
   */
  Direct: "Direct",

  /**
   * 为每个锚点存储一个完整的协方差矩阵。然而，在这种情况下，
   * 交叉协方差项并未直接存储，但可以通过一组存储在元数据中的空间
   * 相关函数参数计算得出。
   *
   * @type {string}
   * @constant
   */

  Indirect: "Indirect",
};

export default Object.freeze(StorageType);
