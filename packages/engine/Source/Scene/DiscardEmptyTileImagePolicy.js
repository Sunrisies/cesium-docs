import defined from "../Core/defined.js";

/**
 * 一个策略，用于丢弃不包含数据（因此实际上不是图像）的瓦片图像。
 * 这个策略会丢弃 {@link DiscardEmptyTileImagePolicy.EMPTY_IMAGE}，预计图像加载代码会用它来代替任何空的瓦片图像。
 *
 * @alias DiscardEmptyTileImagePolicy
 * @constructor
 *
 * @see DiscardMissingTileImagePolicy
 */
function DiscardEmptyTileImagePolicy(options) {}

/**
 * 确定丢弃策略是否准备好处理图像。
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则返回 true；否则，返回 false。
 */
DiscardEmptyTileImagePolicy.prototype.isReady = function () {
  return true;
};

/**
 * 给定一个瓦片图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果图像应该被丢弃，则返回 true；否则，返回 false。
 */
DiscardEmptyTileImagePolicy.prototype.shouldDiscardImage = function (image) {
  return DiscardEmptyTileImagePolicy.EMPTY_IMAGE === image;
};

let emptyImage;

Object.defineProperties(DiscardEmptyTileImagePolicy, {
  /**
   * 表示空图像的默认值。
   * @type {HTMLImageElement}
   * @readonly
   * @memberof DiscardEmptyTileImagePolicy
   */
  EMPTY_IMAGE: {
    get: function () {
      if (!defined(emptyImage)) {
        emptyImage = new Image();
        // 加载一个带有1x1透明像素的空白数据URI。
        emptyImage.src =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      }
      return emptyImage;
    },
  },
});
export default DiscardEmptyTileImagePolicy;