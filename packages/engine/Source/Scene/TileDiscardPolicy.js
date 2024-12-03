import DeveloperError from "../Core/DeveloperError.js";

/**
 * 根据某些标准丢弃瓦片图像的策略。此类型描述了
 * 一个接口，并不打算直接实例化。
 *
 * @alias TileDiscardPolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 * @see NeverTileDiscardPolicy
 */
function TileDiscardPolicy(options) {
  DeveloperError.throwInstantiationError();
}

/**
 * 确定丢弃策略是否准备好处理图像。
 * @function
 *
 * @returns {boolean} 如果丢弃策略准备好处理图像，则为true；否则为false。
 */
TileDiscardPolicy.prototype.isReady = DeveloperError.throwInstantiationError;

/**
 * 根据给定的瓦片图像，决定是否丢弃该图像。
 * @function
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果图像应被丢弃，则为true；否则为false。
 */
TileDiscardPolicy.prototype.shouldDiscardImage =
  DeveloperError.throwInstantiationError;
export default TileDiscardPolicy;
