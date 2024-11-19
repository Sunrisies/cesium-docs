import Check from "../../../../Core/Check.js";

/**
 * @typedef {object} AnchorPointDirect.ConstructorOptions
 *
 * AnchorPointDirect 构造函数的初始化选项
 *
 * @property {Cartesian3} position  锚点地理坐标
 * @property {Cartesian3} adjustmentParams 调整值，单位为米
 */

/**
 * 使用直接存储的一个存储锚点的元数据.
 *
 * 这反映了  {@link https://nsgreg.nga.mil/csmwg.jsp|NGA_gpm_local} glTF 扩展的 `anchronPointDirect` 定义.
 *
 * @constructor
 * @param {AnchorPointDirect.ConstructorOptions} options 描述初始化选项的对象
 * @experimental 此功能尚未最终确定，可能会在没有 Cesium 标准弃用政策的情况下发生更改.
 */
function AnchorPointDirect(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.position", options.position);
  Check.typeOf.object("options.adjustmentParams", options.adjustmentParams);
  //>>includeEnd('debug');

  this._position = options.position;
  this._adjustmentParams = options.adjustmentParams;
}

Object.defineProperties(AnchorPointDirect.prototype, {
  /**
   * 锚点的地理坐标（以米为单位）作为 X/Easting, Y/Northing, Z/HAE
   *
   * @memberof AnchorPointDirect.prototype
   * @type {Cartesian3}
   * @readonly
   */
  position: {
    get: function () {
      return this._position;
    },
  },

  /**
   * 每个锚点的 delta-x、delta-y 和 delta-z 调整值（以米为单位）.
   *
   * @memberof AnchorPointDirect.prototype
   * @type {Cartesian3}
   * @readonly
   */
  adjustmentParams: {
    get: function () {
      return this._adjustmentParams;
    },
  },
});

export default AnchorPointDirect;
