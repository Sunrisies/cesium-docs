/**
 * An enum of storage types for covariance information.
 *
 * This reflects the `gltfGpmLocal.storageType` definition of the
 * {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF extension.
 *
 * @enum {string}
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */
const StorageType = {
  /**
   * Store the full error covariance of the anchor points, to include the cross-covariance terms
   *
   * @type {string}
   * @constant
   */
  Direct: "Direct",

  /**
   * A full covariance matrix is stored for each of the anchor points. However, in this case the
   * cross-covariance terms are not directly stored, but can be computed by a set of spatial
   * correlation function parameters which are stored in the metadata.
   *
   * @type {string}
   * @constant
   */
  Indirect: "Indirect",
};

export default Object.freeze(StorageType);
