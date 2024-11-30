/**
 * 一个 {@link TileDiscardPolicy}，指定瓷砖图像永远不应被丢弃。
 *
 * @alias NeverTileDiscardPolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 */
function NeverTileDiscardPolicy(options) {}

/**
 * 确定丢弃策略是否准备好处理图像。
 * @returns {boolean} 如果丢弃策略准备好处理图像，则返回 true；否则返回 false。
 */
NeverTileDiscardPolicy.prototype.isReady = function () {
  return true;
};

/**
 * 根据瓷砖图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果应丢弃该图像，则返回 true；否则返回 false。
 */
NeverTileDiscardPolicy.prototype.shouldDiscardImage = function (image) {
  return false;
};
export default NeverTileDiscardPolicy;
