import defined from "../../../../Core/defined.js";
import Check from "../../../../Core/Check.js";
import RuntimeError from "../../../../Core/RuntimeError.js";
import StorageType from "./StorageType.js";

/**
 * @typedef {object} GltfGpmLocal.ConstructorOptions
 *
 * GltfGpmLocal 构造函数的初始化选项
 *
 * @property {string} storageType 存储类型。
 * 这必须是 `StorageType` 常量之一，即 `Direct` 或 `Indirect`。
 * @property {AnchorPointIndirect[]|undefined} [anchorPointsIndirect] 间接锚点。
 * 仅当存储类型为 `Indirect` 时，此项必须存在。
 * @property {CorrelationGroup[]|undefined} [intraTileCorrelationGroups] 瓦片内相关组。
 * 仅当存储类型为 `Indirect` 时，此项必须存在。
 * @property {AnchorPointDirect[]|undefined} [anchorPointsDirect] 直接锚点。
 * 仅当存储类型为 `Direct` 时，此项必须存在。
 * @property {Matrix3|undefined} [covarianceDirect] 锚点参数的协方差。
 * 仅当存储类型为 `Direct` 时，此项必须存在。
 */


/**
 * 局部存储的地面空间间接实现的 GPM 元数据（即瓦片和/或叶节点）。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local}
 * glTF 扩展的根扩展对象。当加载包含此扩展的模型时，
 * 可以通过调用 
 * ```
 * const gltfGpmLocal = model.getExtension("NGA_gpm_local");
 * ```
 * 来获取此类型的对象。
 *
 * 存储类型决定了可选属性的存在：
 * <ul>
 *  <li>
 *   当存储类型为 `StorageType.Indirect` 时，
 *   `anchorPointsIndirect` 和 `intraTileCorrelationGroups`
 *   存在。
 *  </li>
 *  <li>
 *   当存储类型为 `StorageType.Direct` 时，
 *   `anchorPointsDirect` 和 `covarianceDirect` 存在。
 *  </li>
 * </ul>
 *
 * @constructor
 * @param {GltfGpmLocal.ConstructorOptions} options 描述初始化选项的对象
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

function GltfGpmLocal(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.storageType", options.storageType);
  //>>includeEnd('debug');

  this._storageType = options.storageType;
  this._anchorPointsIndirect = options.anchorPointsIndirect;
  this._anchorPointsDirect = options.anchorPointsDirect;
  this._intraTileCorrelationGroups = options.intraTileCorrelationGroups;
  this._covarianceDirect = options.covarianceDirect;

  //>>includeStart('debug', pragmas.debug);
  if (this.storageType === StorageType.Indirect) {
    if (!defined(this.anchorPointsIndirect)) {
      throw new RuntimeError(
        "The anchorPointsIndirect are required for 'Indirect' storage",
      );
    }
    if (!defined(this.intraTileCorrelationGroups)) {
      throw new RuntimeError(
        "The intraTileCorrelationGroups are required for 'Indirect' storage",
      );
    }
    if (defined(this.anchorPointsDirect)) {
      throw new RuntimeError(
        "The anchorPointsDirect must be omitted for 'Indirect' storage",
      );
    }
    if (defined(this.covarianceDirect)) {
      throw new RuntimeError(
        "The covarianceDirect must be omitted for 'Indirect' storage",
      );
    }
  } else {
    // Direct storage
    if (!defined(this.anchorPointsDirect)) {
      throw new RuntimeError(
        "The anchorPointsDirect are required for 'Direct' storage",
      );
    }
    if (!defined(this.covarianceDirect)) {
      throw new RuntimeError(
        "The covarianceDirect is required for 'Direct' storage",
      );
    }
    if (defined(this.anchorPointsIndirect)) {
      throw new RuntimeError(
        "The anchorPointsIndirect must be omitted for 'Direct' storage",
      );
    }
    if (defined(this.intraTileCorrelationGroups)) {
      throw new RuntimeError(
        "The intraTileCorrelationGroups must be omitted for 'Direct' storage",
      );
    }
  }
  //>>includeEnd('debug');
}

Object.defineProperties(GltfGpmLocal.prototype, {
  /**
   * 指定协方差存储是间接的还是直接的。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {StorageType}
   * @readonly
   */
  storageType: {
    get: function () {
      return this._storageType;
    },
  },

  /**
   * 存储的间接锚点数组。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {AnchorPointIndirect[]|undefined}
   * @readonly
   */
  anchorPointsIndirect: {
    get: function () {
      return this._anchorPointsIndirect;
    },
  },

  /**
   * 存储的直接锚点数组。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {AnchorPointDirect[]|undefined}
   * @readonly
   */
  anchorPointsDirect: {
    get: function () {
      return this._anchorPointsDirect;
    },
  },

  /**
   * 使用相同相关建模的参数识别的元数据和
   * 相关参数数组。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {CorrelationGroup[]|undefined}
   * @readonly
   */
  intraTileCorrelationGroups: {
    get: function () {
      return this._intraTileCorrelationGroups;
    },
  },

  /**
   * 锚点参数的完整协方差。
   *
   * @memberof GltfGpmLocal.prototype
   * @type {Matrix3|undefined}
   * @readonly
   */
  covarianceDirect: {
    get: function () {
      return this._covarianceDirect;
    },
  },
});


export default GltfGpmLocal;
