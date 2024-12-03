import DeveloperError from "./DeveloperError.js";

/**
 * 单个瓦片的地形数据。此类型描述一个接口，并不打算直接实例化。
 *
 * @alias TerrainData
 * @constructor
 *
 * @see HeightmapTerrainData
 * @see QuantizedMeshTerrainData
 * @see GoogleEarthEnterpriseTerrainData
 */

function TerrainData() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainData.prototype, {
  /**
   * 此瓦片的信用信息数组。
   * @memberof TerrainData.prototype
   * @type {Credit[]}
   */
  credits: {
    get: DeveloperError.throwInstantiationError,
  },
  /**
   * 此地形数据中包含的水面遮罩（如果有）。水面遮罩是一个矩形的
   * Uint8Array 或图像，其中值为 255 表示水，值为 0 表示陆地。
   * 也允许在 0 和 255 之间的值，以平滑地过渡陆地和水面。
   * @memberof TerrainData.prototype
   * @type {Uint8Array|HTMLImageElement|HTMLCanvasElement}
   */

  waterMask: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 计算指定经度和纬度的地形高度。
 * @function
 *
 * @param {Rectangle} rectangle 该地形数据覆盖的矩形。
 * @param {number} longitude 以弧度表示的经度。
 * @param {number} latitude 以弧度表示的纬度。
 * @returns {number} 指定位置的地形高度。如果该位置在矩形之外，此方法将外推高度，
 *          这对于远距离超出矩形的位置可能会非常不正确。
 */

TerrainData.prototype.interpolateHeight =
  DeveloperError.throwInstantiationError;

/**
 * 根据 {@link TerrainData#childTileMask} 确定给定子瓦片是否可用。假定给定的子瓦片坐标
 * 是此瓦片的四个子瓦片之一。如果给定非子瓦片坐标，则返回东南子瓦片的可用性。
 * @function
 *
 * @param {number} thisX 此（父）瓦片的瓦片 X 坐标。
 * @param {number} thisY 此（父）瓦片的瓦片 Y 坐标。
 * @param {number} childX 要检查可用性的子瓦片的瓦片 X 坐标。
 * @param {number} childY 要检查可用性的子瓦片的瓦片 Y 坐标。
 * @returns {boolean} 如果子瓦片可用则返回 true；否则返回 false。
 */

TerrainData.prototype.isChildAvailable = DeveloperError.throwInstantiationError;

/**
 * 从此地形数据创建一个 {@link TerrainMesh}。
 * @function
 *
 * @private
 *
 * @param {object} options 包含以下属性的对象：
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的瓦片方案。
 * @param {number} options.x 要为其创建地形数据的瓦片的 X 坐标。
 * @param {number} options.y 要为其创建地形数据的瓦片的 Y 坐标。
 * @param {number} options.level 要为其创建地形数据的瓦片级别。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 地形夸大的相对高度。
 * @param {boolean} [options.throttle=true] 如果为 true，表示如果已有太多异步网格创建正在进行，则需要重试此操作。
 * @returns {Promise<TerrainMesh>|undefined} 地形网格的 Promise，如果已有太多异步网格创建正在进行，且操作应稍后重试，则返回 undefined。
 */

TerrainData.prototype.createMesh = DeveloperError.throwInstantiationError;

/**
 * 为后代瓦片上采样此地形数据。
 * @function
 *
 * @param {TilingScheme} tilingScheme 此地形数据的瓦片方案。
 * @param {number} thisX 此瓦片在瓦片方案中的 X 坐标。
 * @param {number} thisY 此瓦片在瓦片方案中的 Y 坐标。
 * @param {number} thisLevel 此瓦片在瓦片方案中的级别。
 * @param {number} descendantX 我们要为其上采样的后代瓦片在瓦片方案中的 X 坐标。
 * @param {number} descendantY 我们要为其上采样的后代瓦片在瓦片方案中的 Y 坐标。
 * @param {number} descendantLevel 我们要为其上采样的后代瓦片在瓦片方案中的级别。
 * @returns {Promise<TerrainData>|undefined} 为后代瓦片上采样的地形数据的 Promise，
 *          如果正在进行的异步上采样操作过多，则返回 undefined，并且请求被延迟。
 */

TerrainData.prototype.upsample = DeveloperError.throwInstantiationError;

/**
 * 获取一个值，指示此地形数据是否是通过对低分辨率地形数据进行上采样而创建的。如果此值为 false，则数据是从其他来源获得的，
 * 例如从远程服务器下载。此方法应对通过调用 {@link TerrainData#upsample} 返回的实例返回 true。
 * @function
 *
 * @returns {boolean} 如果此实例是通过上采样创建的，则返回 true；否则返回 false。
 */
TerrainData.prototype.wasCreatedByUpsampling =
  DeveloperError.throwInstantiationError;

/**
 * 进行地形处理时使用的最大异步任务数量。
 *
 * @type {number}
 * @private
 */

TerrainData.maximumAsynchronousTasks = 5;

export default TerrainData;
