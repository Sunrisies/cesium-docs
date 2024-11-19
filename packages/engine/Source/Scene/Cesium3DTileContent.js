import DeveloperError from "../Core/DeveloperError.js";

/**
 * {@link Cesium3DTileset} 中瓦片的内容。
 * <p>
 * 该接口的派生类提供对瓦片中单个特征的访问。
 * 通过 {@link Cesium3DTile#content} 访问派生对象。
 * </p>
 * <p>
 * 此类型描述了一个接口，且不打算直接实例化。
 * </p>
 *
 * @alias Cesium3DTileContent
 * @constructor
 */

function Cesium3DTileContent() {
  /**
   * 获取或设置是否有任何特征的属性发生变化。用于
   * 优化在特征属性发生变化时应用样式。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
   * </p>
   *
   * @type {boolean}
   *
   * @private
   */

  this.featurePropertiesDirty = false;
}

Object.defineProperties(Cesium3DTileContent.prototype, {
  /**
   * 获取瓦片中的特征数量。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */

  featuresLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片中的点数量。
   * <p>
   * 仅适用于具有点云内容的瓦片。与 {@link Cesium3DTileContent#featuresLength} 不同，
   * 后者等于由 <code>BATCH_ID</code> 特征表语义区分的点组数量。
   * </p>
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/PointCloud#batched-points}
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */
  pointsLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片中的三角形数量。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */

  trianglesLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片的几何体内存字节数。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */

  geometryByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片的纹理内存字节数。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */

  texturesByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取批处理表纹理和任何未在 geometryByteLength 或
   * texturesByteLength 中计算的二进制元数据属性所使用的内存量。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {number}
   * @readonly
   */

  batchTableByteLength: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取包含其他内容的 {@link Cesium3DTileContent} 对象数组，例如复合瓦片。内部内容可以再次包含内部内容，例如一个包含复合瓦片的复合瓦片。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/Composite|Composite specification}
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Array}
   * @readonly
   */
  innerContents: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 当瓦片的内容准备好渲染时返回 true；否则返回 false。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {boolean}
   * @readonly
   */

  ready: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此瓦片的瓦片集。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Cesium3DTileset}
   * @readonly
   */

  tileset: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取包含此内容的瓦片。
   *
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {Cesium3DTile}
   * @readonly
   */

  tile: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取瓦片内容的URL。
   * @memberof Cesium3DTileContent.prototype
   *
   * @type {string}
   * @readonly
   */

  url: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此内容的批处理表。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
   * </p>
   *
   * @type {Cesium3DTileBatchTable}
   * @readonly
   *
   * @private
   */
  batchTable: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此内容的元数据，无论是明确定义的还是通过隐式瓦片的方式。如果没有元数据，则该属性应为未定义。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
   * </p>
   *
   * @type {ImplicitMetadataView|undefined}
   *
   * @private
   * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
   */

  metadata: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
    set: function (value) {
      DeveloperError.throwInstantiationError();
    },
  },

  /**
   * 获取此内容的组，如果内容具有元数据（3D Tiles 1.1）或使用了 <code>3DTILES_metadata</code> 扩展。如果两者均不存在，则该属性应为未定义。
   * <p>
   * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
   * </p>
   *
   * @type {Cesium3DTileContentGroup|undefined}
   *
   * @private
   * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
   */

  group: {
    // eslint-disable-next-line getter-return
    get: function () {
      DeveloperError.throwInstantiationError();
    },
    set: function (value) {
      DeveloperError.throwInstantiationError();
    },
  },
});

/**
 * 返回特征是否具有此属性。
 *
 * @param {number} batchId 特征的 batchId。
 * @param {string} name 属性的区分大小写名称。
 * @returns {boolean} 如果特征具有此属性则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Cesium3DTileContent.prototype.hasProperty = function (batchId, name) {
  DeveloperError.throwInstantiationError();
};

/**
 * 返回具有给定 <code>batchId</code> 的特征的 {@link Cesium3DTileFeature} 对象。该对象用于获取和修改特征的属性。
 * <p>
 * 瓦片中的特征按 <code>batchId</code> 排序，这是一个用于从批处理表中检索其元数据的索引。
 * </p>
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/TileFormats/BatchTable}.
 *
 * @param {number} batchId 特征的 batchId。
 * @returns {Cesium3DTileFeature} 相应的 {@link Cesium3DTileFeature} 对象。
 *
 * @exception {DeveloperError} batchId 必须在零与 {@link Cesium3DTileContent#featuresLength} - 1 之间。
 */

Cesium3DTileContent.prototype.getFeature = function (batchId) {
  DeveloperError.throwInstantiationError();
};

/**
     * 当 {@link Cesium3DTileset#debugColorizeTiles} 发生变化时调用。
     * <p>
     * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
     * </p>
     *
     * @param {boolean} enabled 是否启用或禁用调试设置。
     * @returns {Cesium3DTileFeature} 相应的 {@link Cesium3DTileFeature} 对象。

     * @private
     */

Cesium3DTileContent.prototype.applyDebugSettings = function (enabled, color) {
  DeveloperError.throwInstantiationError();
};

/**
 * 对内容应用样式
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
 * </p>
 *
 * @param {Cesium3DTileStyle} style 样式。
 *
 * @private
 */

Cesium3DTileContent.prototype.applyStyle = function (style) {
  DeveloperError.throwInstantiationError();
};

/**
 * 在瓦片集遍历期间，由瓦片调用以获取渲染此内容所需的绘制命令。
 * 当瓦片的内容处于处理状态时，这会创建WebGL资源，以最终
 * 转移到就绪状态。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
 * </p>
 *
 * @param {Cesium3DTileset} tileset 包含此瓦片的瓦片集。
 * @param {FrameState} frameState 帧状态。
 *
 * @private
 */

Cesium3DTileContent.prototype.update = function (tileset, frameState) {
  DeveloperError.throwInstantiationError();
};

/**
 * 查找光线与已渲染的瓦片内容表面之间的交点。光线必须以世界坐标表示。
 *
 * @param {Ray} ray 要测试交点的光线。
 * @param {FrameState} frameState 帧状态。
 * @param {Cartesian3|undefined} [result] 交点，如果未找到则为 <code>undefined</code>。
 * @returns {Cartesian3|undefined} 交点，如果未找到则为 <code>undefined</code>。
 *
 * @private
 */

Cesium3DTileContent.prototype.pick = function (ray, frameState, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果该对象已被销毁，则不应使用；调用任何其他函数
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
 * </p>
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see Cesium3DTileContent#destroy
 *
 * @private
 */

Cesium3DTileContent.prototype.isDestroyed = function () {
  DeveloperError.throwInstantiationError();
};

/**
 * 销毁此对象持有的WebGL资源。销毁对象允许确定性地释放WebGL资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应再使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值 (<code>undefined</code>) 赋值给对象，如示例所示。
 * <p>
 * 这用于实现 <code>Cesium3DTileContent</code> 接口，但不是公共Cesium API的一部分。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy() 方法。
 *
 * @example
 * content = content && content.destroy();
 *
 * @see Cesium3DTileContent#isDestroyed
 *
 * @private
 */

Cesium3DTileContent.prototype.destroy = function () {
  DeveloperError.throwInstantiationError();
};
export default Cesium3DTileContent;
