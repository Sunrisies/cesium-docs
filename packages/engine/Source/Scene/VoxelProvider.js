import DeveloperError from "../Core/DeveloperError.js";

/**
 * 提供体素数据。旨在与 {@link VoxelPrimitive} 一起使用。
 * 此类型描述了一个接口，不能直接实例化。
 *
 * @alias VoxelProvider
 * @constructor
 *
 * @see Cesium3DTilesVoxelProvider
 * @see VoxelPrimitive
 * @see VoxelShapeType
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

function VoxelProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(VoxelProvider.prototype, {
  /**
   * 从局部空间到全局空间的变换。如果未定义，则使用单位矩阵作为替代。
   *
   * @memberof VoxelProvider.prototype
   * @type {Matrix4|undefined}
   * @readonly
   */
  globalTransform: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 从形状空间到局部空间的变换。如果未定义，则使用单位矩阵作为替代。
   *
   * @memberof VoxelProvider.prototype
   * @type {Matrix4|undefined}
   * @readonly
   */

  shapeTransform: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取 {@link VoxelShapeType}
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {VoxelShapeType}
   * @readonly
   */
  shape: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取最小边界。
   * 如果未定义，则将使用形状的默认最小边界作为替代。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */

  minBounds: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取最大边界。
   * 如果未定义，则将使用形状的默认最大边界作为替代。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  maxBounds: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片每个维度的体素数量。此值在数据集中所有瓦片中都相同。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3}
   * @readonly
   */
  dimensions: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片前面的填充体素数量。在采样瓦片边缘时，这可以改善渲染质量，但会增加内存使用量。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */

  paddingBefore: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片后面的填充体素数量。在采样瓦片边缘时，这可以改善渲染质量，但会增加内存使用量。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {Cartesian3|undefined}
   * @readonly
   */
  paddingAfter: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据名称。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {string[]}
   * @readonly
   */
  names: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据类型。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {MetadataType[]}
   * @readonly
   */

  types: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据组件类型。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {MetadataComponentType[]}
   * @readonly
   */
  componentTypes: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据的最小值。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */

  minimumValues: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取元数据的最大值。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {number[][]|undefined}
   * @readonly
   */
  maximumValues: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 此提供者存在的最大瓦片数量。此值用作提示，以便体素渲染器分配适当数量的 GPU 内存。如果此值未知，则可以为 undefined。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {number|undefined}
   * @readonly
   */
  maximumTileCount: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取数据集中关键帧的数量。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {number}
   * @readonly
   * @private
   */
  keyframeCount: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取数据集的 {@link TimeIntervalCollection}，如果没有时间戳则为 undefined。
   * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此方法。
   *
   * @memberof VoxelProvider.prototype
   * @type {TimeIntervalCollection}
   * @readonly
   * @private
   */

  timeIntervalCollection: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 请求给定瓦片的数据。数据是按 X、Y、Z 顺序排列的扁平 3D 数组。
 * 在 {@link VoxelProvider#ready} 返回 true 之前不应调用此函数。
 * @function
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {number} [options.tileLevel=0] 瓦片的级别。
 * @param {number} [options.tileX=0] 瓦片的 X 坐标。
 * @param {number} [options.tileY=0] 瓦片的 Y 坐标。
 * @param {number} [options.tileZ=0] 瓦片的 Z 坐标。
 * @param {number} [options.keyframe=0] 请求的关键帧。
 * @returns {Promise<Array[]>|undefined} 一个 Promise，解析为包含请求的体素数据的类型数组的数组，或者如果加载数据时出现问题则为 undefined。
 */

VoxelProvider.prototype.requestData = DeveloperError.throwInstantiationError;

export default VoxelProvider;
