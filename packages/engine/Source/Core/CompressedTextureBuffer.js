import defined from "./defined.js";

/**
 * 描述一个压缩纹理并包含一个压缩纹理缓冲区。
 * @alias CompressedTextureBuffer
 * @constructor
 *
 * @param {PixelFormat} internalFormat 压缩纹理的像素格式。
 * @param {PixelDatatype} pixelDatatype 压缩纹理的像素数据类型。
 * @param {number} width 纹理的宽度。
 * @param {number} height 纹理的高度。
 * @param {Uint8Array} buffer 压缩纹理缓冲区。
 */

function CompressedTextureBuffer(
  internalFormat,
  pixelDatatype,
  width,
  height,
  buffer,
) {
  this._format = internalFormat;
  this._datatype = pixelDatatype;
  this._width = width;
  this._height = height;
  this._buffer = buffer;
}

Object.defineProperties(CompressedTextureBuffer.prototype, {
  /**
   * 压缩纹理的格式。
   * @type {PixelFormat}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  internalFormat: {
    get: function() {
      return this._format;
    },
  },
  /**
   * 压缩纹理的数据类型。
   * @type {PixelDatatype}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  pixelDatatype: {
    get: function() {
      return this._datatype;
    },
  },
  /**
   * 纹理的宽度。
   * @type {number}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  width: {
    get: function() {
      return this._width;
    },
  },
  /**
   * 纹理的高度。
   * @type {number}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  height: {
    get: function() {
      return this._height;
    },
  },
  /**
   * 压缩纹理缓冲区。
   * @type {Uint8Array}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  bufferView: {
    get: function() {
      return this._buffer;
    },
  },
  /**
   * 压缩纹理缓冲区。bufferView 的别名。
   * @type {Uint8Array}
   * @readonly
   * @memberof CompressedTextureBuffer.prototype
   */
  arrayBufferView: {
    get: function() {
      return this._buffer;
    },
  },
});


/**
 * 创建一个压缩纹理缓冲区的浅拷贝。
 *
 * @param {CompressedTextureBuffer} object 要被克隆的压缩纹理缓冲区。
 * @return {CompressedTextureBuffer} 压缩纹理缓冲区的浅拷贝。
 */

CompressedTextureBuffer.clone = function(object) {
  if (!defined(object)) {
    return undefined;
  }

  return new CompressedTextureBuffer(
    object._format,
    object._datatype,
    object._width,
    object._height,
    object._buffer,
  );
};

/**
 * 创建此压缩纹理缓冲区的浅拷贝。
 *
 * @return {CompressedTextureBuffer} 压缩纹理缓冲区的浅拷贝。
 */

CompressedTextureBuffer.prototype.clone = function() {
  return CompressedTextureBuffer.clone(this);
};
export default CompressedTextureBuffer;
