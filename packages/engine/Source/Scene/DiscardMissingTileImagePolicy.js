import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import getImagePixels from "../Core/getImagePixels.js";
import Resource from "../Core/Resource.js";

/**
 * 一个策略，用于丢弃与已知包含“缺失”图像的图像相匹配的瓦片图像。
 *
 * @alias DiscardMissingTileImagePolicy
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Resource|string} options.missingImageUrl 已知缺失图像的URL。
 * @param {Cartesian2[]} options.pixelsToCheck 一个 {@link Cartesian2} 像素位置数组，用于与缺失图像进行比较。
 * @param {boolean} [options.disableCheckIfAllPixelsAreTransparent=false] 如果为 true，则如果 missingImageUrl 中的所有 pixelsToCheck 像素的 alpha 值都为 0，则禁用丢弃检查。如果为 false，则无论 pixelsToCheck 的值如何，都将进行丢弃检查。
 */
function DiscardMissingTileImagePolicy(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.missingImageUrl)) {
    throw new DeveloperError("options.missingImageUrl is required.");
  }

  if (!defined(options.pixelsToCheck)) {
    throw new DeveloperError("options.pixelsToCheck is required.");
  }
  //>>includeEnd('debug');

  this._pixelsToCheck = options.pixelsToCheck;
  this._missingImagePixels = undefined;
  this._missingImageByteLength = undefined;
  this._isReady = false;

  const resource = Resource.createIfNeeded(options.missingImageUrl);

  const that = this;

  function success(image) {
    if (defined(image.blob)) {
      that._missingImageByteLength = image.blob.size;
    }

    let pixels = getImagePixels(image);

    if (options.disableCheckIfAllPixelsAreTransparent) {
      let allAreTransparent = true;
      const width = image.width;

      const pixelsToCheck = options.pixelsToCheck;
      for (
        let i = 0, len = pixelsToCheck.length;
        allAreTransparent && i < len;
        ++i
      ) {
        const pos = pixelsToCheck[i];
        const index = pos.x * 4 + pos.y * width;
        const alpha = pixels[index + 3];

        if (alpha > 0) {
          allAreTransparent = false;
        }
      }

      if (allAreTransparent) {
        pixels = undefined;
      }
    }

    that._missingImagePixels = pixels;
    that._isReady = true;
  }

  function failure() {
    // 无法下载“缺失”图像，因此假设任何真正缺失的瓦片也将无法下载，并禁用丢弃检查。
    that._missingImagePixels = undefined;
    that._isReady = true;
  }

  resource
    .fetchImage({
      preferBlob: true,
      preferImageBitmap: true,
      flipY: true,
    })
    .then(success)
    .catch(failure);
}

/**
 * 确定丢弃策略是否准备好处理图像。
 * @returns {boolean} 如果丢弃策略已准备好处理图像，则返回 true；否则，返回 false。
 */
DiscardMissingTileImagePolicy.prototype.isReady = function () {
  return this._isReady;
};

/**
 * 给定一个瓦片图像，决定是否丢弃该图像。
 *
 * @param {HTMLImageElement} image 要测试的图像。
 * @returns {boolean} 如果图像应该被丢弃，则返回 true；否则，返回 false。
 *
 * @exception {DeveloperError} <code>shouldDiscardImage</code> 不能在丢弃策略准备好之前调用。
 */
DiscardMissingTileImagePolicy.prototype.shouldDiscardImage = function (image) {
  //>>includeStart('debug', pragmas.debug);
  if (!this._isReady) {
    throw new DeveloperError(
      "shouldDiscardImage must not be called before the discard policy is ready.",
    );
  }
  //>>includeEnd('debug');

  const pixelsToCheck = this._pixelsToCheck;
  const missingImagePixels = this._missingImagePixels;

  // 如果 missingImagePixels 未定义，则表示已禁用丢弃检查。
  if (!defined(missingImagePixels)) {
    return false;
  }

  if (defined(image.blob) && image.blob.size !== this._missingImageByteLength) {
    return false;
  }

  const pixels = getImagePixels(image);
  const width = image.width;

  for (let i = 0, len = pixelsToCheck.length; i < len; ++i) {
    const pos = pixelsToCheck[i];
    const index = pos.x * 4 + pos.y * width;
    for (let offset = 0; offset < 4; ++offset) {
      const pixel = index + offset;
      if (pixels[pixel] !== missingImagePixels[pixel]) {
        return false;
      }
    }
  }
  return true;
};
export default DiscardMissingTileImagePolicy;