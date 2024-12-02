import PixelDatatype from "../Renderer/PixelDatatype.js";
import WebGLConstants from "./WebGLConstants.js";

/**
 * 像素的格式，即它拥有的分量数量及其所表示的内容。
 *
 * @enum {number}
 */

const PixelFormat = {
  /**
   * 包含深度值的像素格式。
   *
   * @type {number}
   * @constant
   */
  DEPTH_COMPONENT: WebGLConstants.DEPTH_COMPONENT,

  /**
   * 包含深度和模板值的像素格式，通常与 {@link PixelDatatype.UNSIGNED_INT_24_8} 一起使用。
   *
   * @type {number}
   * @constant
   */
  DEPTH_STENCIL: WebGLConstants.DEPTH_STENCIL,

  /**
   * 包含 alpha 通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  ALPHA: WebGLConstants.ALPHA,

  /**
   * 包含红色通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  RED: WebGLConstants.RED,

  /**
   * 包含红色和绿色通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  RG: WebGLConstants.RG,

  /**
   * 包含红色、绿色和蓝色通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB: WebGLConstants.RGB,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA: WebGLConstants.RGBA,

  /**
   * 包含亮度（强度）通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  LUMINANCE: WebGLConstants.LUMINANCE,

  /**
   * 包含亮度（强度）和 alpha 通道的像素格式。
   *
   * @type {number}
   * @constant
   */
  LUMINANCE_ALPHA: WebGLConstants.LUMINANCE_ALPHA,

  /**
   * 包含红色、绿色和蓝色通道的 DXT1 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB_DXT1: WebGLConstants.COMPRESSED_RGB_S3TC_DXT1_EXT,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 DXT1 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_DXT1: WebGLConstants.COMPRESSED_RGBA_S3TC_DXT1_EXT,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 DXT3 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_DXT3: WebGLConstants.COMPRESSED_RGBA_S3TC_DXT3_EXT,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 DXT5 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_DXT5: WebGLConstants.COMPRESSED_RGBA_S3TC_DXT5_EXT,

  /**
   * 包含红色、绿色和蓝色通道的 PVR 4bpp 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB_PVRTC_4BPPV1: WebGLConstants.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,

  /**
   * 包含红色、绿色和蓝色通道的 PVR 2bpp 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB_PVRTC_2BPPV1: WebGLConstants.COMPRESSED_RGB_PVRTC_2BPPV1_IMG,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 PVR 4bpp 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_PVRTC_4BPPV1: WebGLConstants.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 PVR 2bpp 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_PVRTC_2BPPV1: WebGLConstants.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 ASTC 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_ASTC: WebGLConstants.COMPRESSED_RGBA_ASTC_4x4_WEBGL,

  /**
   * 包含红色、绿色和蓝色通道的 ETC1 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB_ETC1: WebGLConstants.COMPRESSED_RGB_ETC1_WEBGL,

  /**
   * 包含红色、绿色和蓝色通道的 ETC2 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGB8_ETC2: WebGLConstants.COMPRESSED_RGB8_ETC2,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 ETC2 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA8_ETC2_EAC: WebGLConstants.COMPRESSED_RGBA8_ETC2_EAC,

  /**
   * 包含红色、绿色、蓝色和 alpha 通道的 BC7 压缩像素格式。
   *
   * @type {number}
   * @constant
   */
  RGBA_BC7: WebGLConstants.COMPRESSED_RGBA_BPTC_UNORM,
};

/**
 * @private
 */
PixelFormat.componentsLength = function (pixelFormat) {
  switch (pixelFormat) {
    case PixelFormat.RGB:
      return 3;
    case PixelFormat.RGBA:
      return 4;
    case PixelFormat.LUMINANCE_ALPHA:
    case PixelFormat.RG:
      return 2;
    case PixelFormat.ALPHA:
    case PixelFormat.RED:
    case PixelFormat.LUMINANCE:
      return 1;
    default:
      return 1;
  }
};

/**
 * @private
 */
PixelFormat.validate = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.DEPTH_COMPONENT ||
    pixelFormat === PixelFormat.DEPTH_STENCIL ||
    pixelFormat === PixelFormat.ALPHA ||
    pixelFormat === PixelFormat.RED ||
    pixelFormat === PixelFormat.RG ||
    pixelFormat === PixelFormat.RGB ||
    pixelFormat === PixelFormat.RGBA ||
    pixelFormat === PixelFormat.LUMINANCE ||
    pixelFormat === PixelFormat.LUMINANCE_ALPHA ||
    pixelFormat === PixelFormat.RGB_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT3 ||
    pixelFormat === PixelFormat.RGBA_DXT5 ||
    pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_ASTC ||
    pixelFormat === PixelFormat.RGB_ETC1 ||
    pixelFormat === PixelFormat.RGB8_ETC2 ||
    pixelFormat === PixelFormat.RGBA8_ETC2_EAC ||
    pixelFormat === PixelFormat.RGBA_BC7
  );
};

/**
 * @private
 */
PixelFormat.isColorFormat = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.RED ||
    pixelFormat === PixelFormat.ALPHA ||
    pixelFormat === PixelFormat.RGB ||
    pixelFormat === PixelFormat.RGBA ||
    pixelFormat === PixelFormat.LUMINANCE ||
    pixelFormat === PixelFormat.LUMINANCE_ALPHA
  );
};

/**
 * @private
 */
PixelFormat.isDepthFormat = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.DEPTH_COMPONENT ||
    pixelFormat === PixelFormat.DEPTH_STENCIL
  );
};

/**
 * @private
 */
PixelFormat.isCompressedFormat = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.RGB_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT3 ||
    pixelFormat === PixelFormat.RGBA_DXT5 ||
    pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_ASTC ||
    pixelFormat === PixelFormat.RGB_ETC1 ||
    pixelFormat === PixelFormat.RGB8_ETC2 ||
    pixelFormat === PixelFormat.RGBA8_ETC2_EAC ||
    pixelFormat === PixelFormat.RGBA_BC7
  );
};

/**
 * @private
 */
PixelFormat.isDXTFormat = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.RGB_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT3 ||
    pixelFormat === PixelFormat.RGBA_DXT5
  );
};

/**
 * @private
 */
PixelFormat.isPVRTCFormat = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1
  );
};

/**
 * @private
 */
PixelFormat.isASTCFormat = function (pixelFormat) {
  return pixelFormat === PixelFormat.RGBA_ASTC;
};

/**
 * @private
 */
PixelFormat.isETC1Format = function (pixelFormat) {
  return pixelFormat === PixelFormat.RGB_ETC1;
};

/**
 * @private
 */
PixelFormat.isETC2Format = function (pixelFormat) {
  return (
    pixelFormat === PixelFormat.RGB8_ETC2 ||
    pixelFormat === PixelFormat.RGBA8_ETC2_EAC
  );
};

/**
 * @private
 */
PixelFormat.isBC7Format = function (pixelFormat) {
  return pixelFormat === PixelFormat.RGBA_BC7;
};

/**
 * @private
 */
PixelFormat.compressedTextureSizeInBytes = function (
  pixelFormat,
  width,
  height,
) {
  switch (pixelFormat) {
    case PixelFormat.RGB_DXT1:
    case PixelFormat.RGBA_DXT1:
    case PixelFormat.RGB_ETC1:
    case PixelFormat.RGB8_ETC2:
      return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;

    case PixelFormat.RGBA_DXT3:
    case PixelFormat.RGBA_DXT5:
    case PixelFormat.RGBA_ASTC:
    case PixelFormat.RGBA8_ETC2_EAC:
      return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;

    case PixelFormat.RGB_PVRTC_4BPPV1:
    case PixelFormat.RGBA_PVRTC_4BPPV1:
      return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

    case PixelFormat.RGB_PVRTC_2BPPV1:
    case PixelFormat.RGBA_PVRTC_2BPPV1:
      return Math.floor(
        (Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8,
      );

    case PixelFormat.RGBA_BC7:
      return Math.ceil(width / 4) * Math.ceil(height / 4) * 16;

    default:
      return 0;
  }
};

/**
 * @private
 */
PixelFormat.textureSizeInBytes = function (
  pixelFormat,
  pixelDatatype,
  width,
  height,
) {
  let componentsLength = PixelFormat.componentsLength(pixelFormat);
  if (PixelDatatype.isPacked(pixelDatatype)) {
    componentsLength = 1;
  }
  return (
    componentsLength * PixelDatatype.sizeInBytes(pixelDatatype) * width * height
  );
};

/**
 * @private
 */
PixelFormat.alignmentInBytes = function (pixelFormat, pixelDatatype, width) {
  const mod =
    PixelFormat.textureSizeInBytes(pixelFormat, pixelDatatype, width, 1) % 4;
  return mod === 0 ? 4 : mod === 2 ? 2 : 1;
};

/**
 * @private
 * @param {PixelFormat} pixelFormat The pixel format.
 * @param {PixelDatatype} pixelDatatype The pixel datatype.
 * @param {Number} width The width of the texture.
 * @param {Number} height The height of the texture.
 * @returns {TypedArray} The typed array.
 */
PixelFormat.createTypedArray = function (
  pixelFormat,
  pixelDatatype,
  width,
  height,
) {
  const constructor = PixelDatatype.getTypedArrayConstructor(pixelDatatype);
  const size = PixelFormat.componentsLength(pixelFormat) * width * height;
  return new constructor(size);
};

/**
 * @private
 */
PixelFormat.flipY = function (
  bufferView,
  pixelFormat,
  pixelDatatype,
  width,
  height,
) {
  if (height === 1) {
    return bufferView;
  }
  const flipped = PixelFormat.createTypedArray(
    pixelFormat,
    pixelDatatype,
    width,
    height,
  );
  const numberOfComponents = PixelFormat.componentsLength(pixelFormat);
  const textureWidth = width * numberOfComponents;
  for (let i = 0; i < height; ++i) {
    const row = i * width * numberOfComponents;
    const flippedRow = (height - i - 1) * width * numberOfComponents;
    for (let j = 0; j < textureWidth; ++j) {
      flipped[flippedRow + j] = bufferView[row + j];
    }
  }
  return flipped;
};

/**
 * @private
 */
PixelFormat.toInternalFormat = function (pixelFormat, pixelDatatype, context) {
  // WebGL 1 require internalFormat to be the same as PixelFormat
  if (!context.webgl2) {
    return pixelFormat;
  }

  // Convert pixelFormat to correct internalFormat for WebGL 2
  if (pixelFormat === PixelFormat.DEPTH_STENCIL) {
    return WebGLConstants.DEPTH24_STENCIL8;
  }

  if (pixelFormat === PixelFormat.DEPTH_COMPONENT) {
    if (pixelDatatype === PixelDatatype.UNSIGNED_SHORT) {
      return WebGLConstants.DEPTH_COMPONENT16;
    } else if (pixelDatatype === PixelDatatype.UNSIGNED_INT) {
      return WebGLConstants.DEPTH_COMPONENT24;
    }
  }

  if (pixelDatatype === PixelDatatype.FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstants.RGBA32F;
      case PixelFormat.RGB:
        return WebGLConstants.RGB32F;
      case PixelFormat.RG:
        return WebGLConstants.RG32F;
      case PixelFormat.RED:
        return WebGLConstants.R32F;
    }
  }

  if (pixelDatatype === PixelDatatype.HALF_FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstants.RGBA16F;
      case PixelFormat.RGB:
        return WebGLConstants.RGB16F;
      case PixelFormat.RG:
        return WebGLConstants.RG16F;
      case PixelFormat.RED:
        return WebGLConstants.R16F;
    }
  }

  return pixelFormat;
};

export default Object.freeze(PixelFormat);
