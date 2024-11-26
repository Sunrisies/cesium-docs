import defined from "./defined.js";

const context2DsByWidthAndHeight = {};

/**
 * 从加载的图像中提取像素数组。将图像绘制到画布中，以便可以读取像素。
 *
 * @function getImagePixels
 *
 * @param {HTMLImageElement|ImageBitmap} image 要提取像素的图像。
 * @param {number} width 图像的宽度。如果未定义，则分配 image.width。
 * @param {number} height 图像的高度。如果未定义，则分配 image.height。
 * @returns {ImageData} 图像的像素。
 */
function getImagePixels(image, width, height) {
  if (!defined(width)) {
    width = image.width;
  }
  if (!defined(height)) {
    height = image.height;
  }

  let context2DsByHeight = context2DsByWidthAndHeight[width];
  if (!defined(context2DsByHeight)) {
    context2DsByHeight = {};
    context2DsByWidthAndHeight[width] = context2DsByHeight;
  }

  let context2d = context2DsByHeight[height];
  if (!defined(context2d)) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    // Since we re-use contexts, use the willReadFrequently option – See https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
    context2d = canvas.getContext("2d", { willReadFrequently: true });
    context2d.globalCompositeOperation = "copy";
    context2DsByHeight[height] = context2d;
  }

  context2d.drawImage(image, 0, 0, width, height);
  return context2d.getImageData(0, 0, width, height).data;
}
export default getImagePixels;
