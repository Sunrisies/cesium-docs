import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} CorrelationGroup.ConstructorOptions
 *
 * Initialization options for the CorrelationGroup constructor
 *
 * @property {boolean[]} groupFlags Array of 3 booleans indicating if
 * parameters delta-x delta-y delta-z used in the correlation group
 * @property {Cartesian3} rotationThetas Rotations in milliradians
 * about X, Y, Z axes, respectively
 * @property {Spdcf[]} params Array of `Spdcf` (Strictly Positive-Definite
 * Correlation Function) parameters, for the U, V, W directions, respectively
 */

/**
 * 使用相同相关建模和相关参数标识元数据。
 *
 * 这反映了 {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展的 `correlationGroup` 定义。
 *
 * @constructor
 * @param {CorrelationGroup.ConstructorOptions} options 描述初始化选项的对象。
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化。
 */

function CorrelationGroup(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.groupFlags", options.groupFlags);
  Check.typeOf.object("options.rotationThetas", options.rotationThetas);
  Check.typeOf.object("options.params", options.params);
  //>>includeEnd('debug');

  this._groupFlags = options.groupFlags;
  this._rotationThetas = options.rotationThetas;
  this._params = options.params;
}

Object.defineProperties(CorrelationGroup.prototype, {
  /**
   * 表示在相关组中使用的参数 delta-x、delta-y 和 delta-z 的 3 个布尔值数组。
   *
   * @memberof CorrelationGroup.prototype
   * @type {boolean[]}
   * @readonly
   */
  groupFlags: {
    get: function () {
      return this._groupFlags;
    },
  },

  /**
   * 关于 X、Y、Z 轴的旋转（以毫弧度为单位），分别。
   *
   * @memberof CorrelationGroup.prototype
   * @type {Cartesian3}
   * @readonly
   */
  rotationThetas: {
    get: function () {
      return this._rotationThetas;
    },
  },

  /**
   * 三组 SPDCF 参数的数组，分别用于 U、V、W 方向。
   *
   * @memberof CorrelationGroup.prototype
   * @type {Spdcf[]}
   * @readonly
   */
  params: {
    get: function () {
      return this._params;
    },
  },
});


export default CorrelationGroup;
