import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import FeatureDetection from "./FeatureDetection.js";
import CesiumMath from "./Math.js";

function hue2rgb(m1, m2, h) {
  if (h < 0) {
    h += 1;
  }
  if (h > 1) {
    h -= 1;
  }
  if (h * 6 < 1) {
    return m1 + (m2 - m1) * 6 * h;
  }
  if (h * 2 < 1) {
    return m2;
  }
  if (h * 3 < 2) {
    return m1 + (m2 - m1) * (2 / 3 - h) * 6;
  }
  return m1;
}

/**
 * 一个颜色，由红、绿、蓝和 alpha 值指定，
 * 范围从 <code>0</code>（无强度）到 <code>1.0</code>（完全强度）。
 * @param {number} [red=1.0] 红色成分。
 * @param {number} [green=1.0] 绿色成分。
 * @param {number} [blue=1.0] 蓝色成分。
 * @param {number} [alpha=1.0] alpha 成分。
 *
 * @constructor
 * @alias Color
 *
 * @see Packable
 */

function Color(red, green, blue, alpha) {
  /**
   * 红色成分。
   * @type {number}
   * @default 1.0
   */
  this.red = defaultValue(red, 1.0);
  /**
   * 绿色成分。
   * @type {number}
   * @default 1.0
   */
  this.green = defaultValue(green, 1.0);
  /**
   * 蓝色成分。
   * @type {number}
   * @default 1.0
   */
  this.blue = defaultValue(blue, 1.0);
  /**
   * alpha 成分。
   * @type {number}
   * @default 1.0
   */
  this.alpha = defaultValue(alpha, 1.0);
}

/**
 * 从 {@link Cartesian4} 创建一个 Color 实例。<code>x</code>、<code>y</code>、<code>z</code>
 * 和 <code>w</code> 分别映射到 <code>red</code>、<code>green</code>、<code>blue</code> 和 <code>alpha</code>。
 *
 * @param {Cartesian4} cartesian 源 Cartesian。
 * @param {Color} [result] 存储结果的对象。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 */

Color.fromCartesian4 = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartesian", cartesian);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Color(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }

  result.red = cartesian.x;
  result.green = cartesian.y;
  result.blue = cartesian.z;
  result.alpha = cartesian.w;
  return result;
};

/**
 * 创建一个新的 Color，使用范围为 0 到 255 的红、绿、蓝和 alpha 值指定，
 * 并在内部转换为 0.0 到 1.0 的范围。
 *
 * @param {number} [red=255] 红色成分。
 * @param {number} [green=255] 绿色成分。
 * @param {number} [blue=255] 蓝色成分。
 * @param {number} [alpha=255] alpha 成分。
 * @param {Color} [result] 存储结果的对象。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 */

Color.fromBytes = function(red, green, blue, alpha, result) {
  red = Color.byteToFloat(defaultValue(red, 255.0));
  green = Color.byteToFloat(defaultValue(green, 255.0));
  blue = Color.byteToFloat(defaultValue(blue, 255.0));
  alpha = Color.byteToFloat(defaultValue(alpha, 255.0));

  if (!defined(result)) {
    return new Color(red, green, blue, alpha);
  }

  result.red = red;
  result.green = green;
  result.blue = blue;
  result.alpha = alpha;
  return result;
};

/**
 * 创建一个新的 Color，该颜色具有指定颜色的相同红、绿和蓝成分，
 * 但具有指定的 alpha 值。
 *
 * @param {Color} color 基础颜色。
 * @param {number} alpha 新的 alpha 成分。
 * @param {Color} [result] 存储结果的对象。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 *
 * @example const translucentRed = Cesium.Color.fromAlpha(Cesium.Color.RED, 0.9);
 */

Color.fromAlpha = function(color, alpha, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("color", color);
  Check.typeOf.number("alpha", alpha);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Color(color.red, color.green, color.blue, alpha);
  }

  result.red = color.red;
  result.green = color.green;
  result.blue = color.blue;
  result.alpha = alpha;
  return result;
};

let scratchArrayBuffer;
let scratchUint32Array;
let scratchUint8Array;
if (FeatureDetection.supportsTypedArrays()) {
  scratchArrayBuffer = new ArrayBuffer(4);
  scratchUint32Array = new Uint32Array(scratchArrayBuffer);
  scratchUint8Array = new Uint8Array(scratchArrayBuffer);
}

/**
 * 从单个无符号 32 位 RGBA 数值创建一个新的 Color，使用系统的字节序。
 *
 * @param {number} rgba 单个无符号 32 位 RGBA 数值。
 * @param {Color} [result] 用于存储结果的对象，如果未定义，将创建一个新的实例。
 * @returns {Color} 颜色对象。
 *
 * @example
 * const color = Cesium.Color.fromRgba(0x67ADDFFF);
 *
 * @see Color#toRgba
 */

Color.fromRgba = function(rgba, result) {
  // scratchUint32Array and scratchUint8Array share an underlying array buffer
  scratchUint32Array[0] = rgba;
  return Color.fromBytes(
    scratchUint8Array[0],
    scratchUint8Array[1],
    scratchUint8Array[2],
    scratchUint8Array[3],
    result,
  );
};

/**
 * 从色相、饱和度和亮度创建一个 Color 实例。
 *
 * @param {number} [hue=0] 色相角度 0...1
 * @param {number} [saturation=0] 饱和度值 0...1
 * @param {number} [lightness=0] 亮度值 0...1
 * @param {number} [alpha=1.0] alpha 成分 0...1
 * @param {Color} [result] 用于存储结果的对象，如果未定义，将创建一个新的实例。
 * @returns {Color} 颜色对象。
 *
 * @see {@link http://www.w3.org/TR/css3-color/#hsl-color|CSS color values}
 */

Color.fromHsl = function(hue, saturation, lightness, alpha, result) {
  hue = defaultValue(hue, 0.0) % 1.0;
  saturation = defaultValue(saturation, 0.0);
  lightness = defaultValue(lightness, 0.0);
  alpha = defaultValue(alpha, 1.0);

  let red = lightness;
  let green = lightness;
  let blue = lightness;

  if (saturation !== 0) {
    let m2;
    if (lightness < 0.5) {
      m2 = lightness * (1 + saturation);
    } else {
      m2 = lightness + saturation - lightness * saturation;
    }

    const m1 = 2.0 * lightness - m2;
    red = hue2rgb(m1, m2, hue + 1 / 3);
    green = hue2rgb(m1, m2, hue);
    blue = hue2rgb(m1, m2, hue - 1 / 3);
  }

  if (!defined(result)) {
    return new Color(red, green, blue, alpha);
  }

  result.red = red;
  result.green = green;
  result.blue = blue;
  result.alpha = alpha;
  return result;
};

/**
 * 使用提供的选项创建一个随机颜色。为了实现可重复的随机颜色，应在应用程序开始时调用一次 {@link CesiumMath#setRandomNumberSeed}。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.red] 如果指定，则使用该红色成分，代替随机值。
 * @param {number} [options.minimumRed=0.0] 如果未指定，则生成的最小红色值。
 * @param {number} [options.maximumRed=1.0] 如果未指定，则生成的最大红色值。
 * @param {number} [options.green] 如果指定，则使用该绿色成分，代替随机值。
 * @param {number} [options.minimumGreen=0.0] 如果未指定，则生成的最小绿色值。
 * @param {number} [options.maximumGreen=1.0] 如果未指定，则生成的最大绿色值。
 * @param {number} [options.blue] 如果指定，则使用该蓝色成分，代替随机值。
 * @param {number} [options.minimumBlue=0.0] 如果未指定，则生成的最小蓝色值。
 * @param {number} [options.maximumBlue=1.0] 如果未指定，则生成的最大蓝色值。
 * @param {number} [options.alpha] 如果指定，则使用该 alpha 成分，代替随机值。
 * @param {number} [options.minimumAlpha=0.0] 如果未指定，则生成的最小 alpha 值。
 * @param {number} [options.maximumAlpha=1.0] 如果未指定，则生成的最大 alpha 值。
 * @param {Color} [result] 用于存储结果的对象，如果未定义，将创建一个新的实例。
 * @returns {Color} 修改后的结果参数，如果 result 为未定义则返回一个新的实例。
 *
 * @exception {DeveloperError} minimumRed 必须小于或等于 maximumRed。
 * @exception {DeveloperError} minimumGreen 必须小于或等于 maximumGreen。
 * @exception {DeveloperError} minimumBlue 必须小于或等于 maximumBlue。
 * @exception {DeveloperError} minimumAlpha 必须小于或等于 maximumAlpha。
 *
 * @example
 * //Create a completely random color
 * const color = Cesium.Color.fromRandom();
 *
 * //Create a random shade of yellow.
 * const color1 = Cesium.Color.fromRandom({
 *     red : 1.0,
 *     green : 1.0,
 *     alpha : 1.0
 * });
 *
 * //Create a random bright color.
 * const color2 = Cesium.Color.fromRandom({
 *     minimumRed : 0.75,
 *     minimumGreen : 0.75,
 *     minimumBlue : 0.75,
 *     alpha : 1.0
 * });
 */
Color.fromRandom = function(options, result) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let red = options.red;
  if (!defined(red)) {
    const minimumRed = defaultValue(options.minimumRed, 0);
    const maximumRed = defaultValue(options.maximumRed, 1.0);

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.lessThanOrEquals("minimumRed", minimumRed, maximumRed);
    //>>includeEnd('debug');

    red =
      minimumRed + CesiumMath.nextRandomNumber() * (maximumRed - minimumRed);
  }

  let green = options.green;
  if (!defined(green)) {
    const minimumGreen = defaultValue(options.minimumGreen, 0);
    const maximumGreen = defaultValue(options.maximumGreen, 1.0);

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.lessThanOrEquals(
      "minimumGreen",
      minimumGreen,
      maximumGreen,
    );
    //>>includeEnd('debug');
    green =
      minimumGreen +
      CesiumMath.nextRandomNumber() * (maximumGreen - minimumGreen);
  }

  let blue = options.blue;
  if (!defined(blue)) {
    const minimumBlue = defaultValue(options.minimumBlue, 0);
    const maximumBlue = defaultValue(options.maximumBlue, 1.0);

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.lessThanOrEquals(
      "minimumBlue",
      minimumBlue,
      maximumBlue,
    );
    //>>includeEnd('debug');

    blue =
      minimumBlue + CesiumMath.nextRandomNumber() * (maximumBlue - minimumBlue);
  }

  let alpha = options.alpha;
  if (!defined(alpha)) {
    const minimumAlpha = defaultValue(options.minimumAlpha, 0);
    const maximumAlpha = defaultValue(options.maximumAlpha, 1.0);

    //>>includeStart('debug', pragmas.debug);
    Check.typeOf.number.lessThanOrEquals(
      "minimumAlpha",
      minimumAlpha,
      maximumAlpha,
    );
    //>>includeEnd('debug');

    alpha =
      minimumAlpha +
      CesiumMath.nextRandomNumber() * (maximumAlpha - minimumAlpha);
  }

  if (!defined(result)) {
    return new Color(red, green, blue, alpha);
  }

  result.red = red;
  result.green = green;
  result.blue = blue;
  result.alpha = alpha;
  return result;
};

//#rgba
const rgbaMatcher = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i;
//#rrggbbaa
const rrggbbaaMatcher =
  /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i;
//rgb(), rgba(), or rgb%()
const rgbParenthesesMatcher =
  /^rgba?\s*\(\s*([0-9.]+%?)\s*[,\s]+\s*([0-9.]+%?)\s*[,\s]+\s*([0-9.]+%?)(?:\s*[,\s/]+\s*([0-9.]+))?\s*\)$/i;
//hsl() or hsla()
const hslParenthesesMatcher =
  /^hsla?\s*\(\s*([0-9.]+)\s*[,\s]+\s*([0-9.]+%)\s*[,\s]+\s*([0-9.]+%)(?:\s*[,\s/]+\s*([0-9.]+))?\s*\)$/i;

/**
 * 从 CSS 颜色值创建一个 Color 实例。
 *
 * @param {string} color CSS 颜色值，格式可以为 #rgb、#rgba、#rrggbb、#rrggbbaa、rgb()、rgba()、hsl() 或 hsla()。
 * @param {Color} [result] 用于存储结果的对象，如果未定义，将创建一个新的实例。
 * @returns {Color} 颜色对象，如果字符串不是有效的 CSS 颜色，则返回 undefined。
 *
 * @example
 * const cesiumBlue = Cesium.Color.fromCssColorString('#67ADDF');
 * const green = Cesium.Color.fromCssColorString('green');
 *
 * @see {@link http://www.w3.org/TR/css3-color|CSS color values}
 */
Color.fromCssColorString = function(color, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("color", color);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Color();
  }

  // Remove all surrounding whitespaces from the color string
  color = color.trim();

  const namedColor = Color[color.toUpperCase()];
  if (defined(namedColor)) {
    Color.clone(namedColor, result);
    return result;
  }

  let matches = rgbaMatcher.exec(color);
  if (matches !== null) {
    result.red = parseInt(matches[1], 16) / 15;
    result.green = parseInt(matches[2], 16) / 15.0;
    result.blue = parseInt(matches[3], 16) / 15.0;
    result.alpha = parseInt(defaultValue(matches[4], "f"), 16) / 15.0;
    return result;
  }

  matches = rrggbbaaMatcher.exec(color);
  if (matches !== null) {
    result.red = parseInt(matches[1], 16) / 255.0;
    result.green = parseInt(matches[2], 16) / 255.0;
    result.blue = parseInt(matches[3], 16) / 255.0;
    result.alpha = parseInt(defaultValue(matches[4], "ff"), 16) / 255.0;
    return result;
  }

  matches = rgbParenthesesMatcher.exec(color);
  if (matches !== null) {
    result.red =
      parseFloat(matches[1]) / ("%" === matches[1].substr(-1) ? 100.0 : 255.0);
    result.green =
      parseFloat(matches[2]) / ("%" === matches[2].substr(-1) ? 100.0 : 255.0);
    result.blue =
      parseFloat(matches[3]) / ("%" === matches[3].substr(-1) ? 100.0 : 255.0);
    result.alpha = parseFloat(defaultValue(matches[4], "1.0"));
    return result;
  }

  matches = hslParenthesesMatcher.exec(color);
  if (matches !== null) {
    return Color.fromHsl(
      parseFloat(matches[1]) / 360.0,
      parseFloat(matches[2]) / 100.0,
      parseFloat(matches[3]) / 100.0,
      parseFloat(defaultValue(matches[4], "1.0")),
      result,
    );
  }

  result = undefined;
  return result;
};

/**
 * 将对象打包成数组所使用的元素数量。
 * @type {number}
 */

Color.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {Color} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
Color.pack = function(value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);
  array[startingIndex++] = value.red;
  array[startingIndex++] = value.green;
  array[startingIndex++] = value.blue;
  array[startingIndex] = value.alpha;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {Color} [result] 存储结果的对象。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 */

Color.unpack = function(array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);
  if (!defined(result)) {
    result = new Color();
  }
  result.red = array[startingIndex++];
  result.green = array[startingIndex++];
  result.blue = array[startingIndex++];
  result.alpha = array[startingIndex];
  return result;
};

/**
 * 将范围在 0 到 255 的“字节”颜色成分转换为
 * 范围在 0 到 1.0 的“浮点”颜色成分。
 *
 * @param {number} number 要转换的数字。
 * @returns {number} 转换后的数字。
 */

Color.byteToFloat = function(number) {
  return number / 255.0;
};

/**
 * 将范围在 0 到 1.0 的“浮点”颜色成分转换为
 * 范围在 0 到 255 的“字节”颜色成分。
 *
 * @param {number} number 要转换的数字。
 * @returns {number} 转换后的数字。
 */

Color.floatToByte = function(number) {
  return number === 1.0 ? 255.0 : (number * 256.0) | 0;
};

/**
 * 复制一个颜色。
 *
 * @param {Color} color 要复制的颜色。
 * @param {Color} [result] 用于存储结果的对象，如果未定义，则创建一个新的实例。
 * @returns {Color} 修改后的结果参数，如果 result 为未定义，则返回一个新的实例。（如果 color 为未定义，则返回 undefined）
 */

Color.clone = function(color, result) {
  if (!defined(color)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Color(color.red, color.green, color.blue, color.alpha);
  }
  result.red = color.red;
  result.green = color.green;
  result.blue = color.blue;
  result.alpha = color.alpha;
  return result;
};

/**
 * 如果第一个颜色等于第二个颜色，则返回 true。
 *
 * @param {Color} left 要比较的第一个颜色。
 * @param {Color} right 要比较的第二个颜色。
 * @returns {boolean} 如果颜色相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Color.equals = function(left, right) {
  return (
    left === right || //
    (defined(left) && //
      defined(right) && //
      left.red === right.red && //
      left.green === right.green && //
      left.blue === right.blue && //
      left.alpha === right.alpha)
  );
};

/**
 * @private
 */
Color.equalsArray = function(color, array, offset) {
  return (
    color.red === array[offset] &&
    color.green === array[offset + 1] &&
    color.blue === array[offset + 2] &&
    color.alpha === array[offset + 3]
  );
};

/**
 * 返回一个颜色实例的副本。
 *
 * @param {Color} [result] 用于存储结果的对象，如果未定义，则创建一个新的实例。
 * @returns {Color} 修改后的结果参数，如果 result 为未定义，则返回一个新的实例。
 */

Color.prototype.clone = function(result) {
  return Color.clone(this, result);
};
/**
 * 如果此颜色等于其他颜色，则返回 true。
 *
 * @param {Color} other 要比较的颜色。
 * @returns {boolean} 如果颜色相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Color.prototype.equals = function(other) {
  return Color.equals(this, other);
};

/**
 * 如果此颜色在指定的 epsilon 范围内逐分量等于其他颜色，则返回 <code>true</code>。
 *
 * @param {Color} other 要比较的颜色。
 * @param {number} [epsilon=0.0] 用于相等测试的 epsilon 值。
 * @returns {boolean} 如果颜色在指定的 epsilon 范围内相等，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Color.prototype.equalsEpsilon = function(other, epsilon) {
  return (
    this === other || //
    (defined(other) && //
      Math.abs(this.red - other.red) <= epsilon && //
      Math.abs(this.green - other.green) <= epsilon && //
      Math.abs(this.blue - other.blue) <= epsilon && //
      Math.abs(this.alpha - other.alpha) <= epsilon)
  );
};

/**
 * 创建一个表示该颜色的字符串，格式为 '(红, 绿, 蓝, alpha)'。
 *
 * @returns {string} 表示该颜色的字符串，格式为 '(红, 绿, 蓝, alpha)'。
 */

Color.prototype.toString = function() {
  return `(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
};

/**
 * 创建一个包含此颜色的 CSS 颜色值的字符串。
 *
 * @returns {string} 此颜色的 CSS 等效值。
 *
 * @see {@link http://www.w3.org/TR/css3-color/#rgba-color|CSS RGB or RGBA color values}
 */
Color.prototype.toCssColorString = function() {
  const red = Color.floatToByte(this.red);
  const green = Color.floatToByte(this.green);
  const blue = Color.floatToByte(this.blue);
  if (this.alpha === 1) {
    return `rgb(${red},${green},${blue})`;
  }
  return `rgba(${red},${green},${blue},${this.alpha})`;
};

/**
 * 创建一个包含此颜色的 CSS 十六进制字符串颜色值的字符串。
 *
 * @returns {string} 此颜色的 CSS 十六进制字符串等效值。
 */

Color.prototype.toCssHexString = function() {
  let r = Color.floatToByte(this.red).toString(16);
  if (r.length < 2) {
    r = `0${r}`;
  }
  let g = Color.floatToByte(this.green).toString(16);
  if (g.length < 2) {
    g = `0${g}`;
  }
  let b = Color.floatToByte(this.blue).toString(16);
  if (b.length < 2) {
    b = `0${b}`;
  }
  if (this.alpha < 1) {
    let hexAlpha = Color.floatToByte(this.alpha).toString(16);
    if (hexAlpha.length < 2) {
      hexAlpha = `0${hexAlpha}`;
    }
    return `#${r}${g}${b}${hexAlpha}`;
  }
  return `#${r}${g}${b}`;
};

/**
 * 将此颜色转换为红、绿、蓝和 alpha 值的数组，
 * 范围为 0 到 255。
 *
 * @param {number[]} [result] 用于存储结果的数组，如果未定义，将创建一个新的实例。
 * @returns {number[]} 修改后的结果参数，如果 result 为未定义，则返回一个新的实例。
 */

Color.prototype.toBytes = function(result) {
  const red = Color.floatToByte(this.red);
  const green = Color.floatToByte(this.green);
  const blue = Color.floatToByte(this.blue);
  const alpha = Color.floatToByte(this.alpha);

  if (!defined(result)) {
    return [red, green, blue, alpha];
  }
  result[0] = red;
  result[1] = green;
  result[2] = blue;
  result[3] = alpha;
  return result;
};

/**
 * 将此颜色转换为单个无符号 32 位 RGBA 数值，使用系统的字节序。
 *
 * @returns {number} 单个无符号 32 位 RGBA 数值。
 *
 *
 * @example
 * const rgba = Cesium.Color.BLUE.toRgba();
 *
 * @see Color.fromRgba
 */
Color.prototype.toRgba = function() {
  // scratchUint32Array and scratchUint8Array share an underlying array buffer
  scratchUint8Array[0] = Color.floatToByte(this.red);
  scratchUint8Array[1] = Color.floatToByte(this.green);
  scratchUint8Array[2] = Color.floatToByte(this.blue);
  scratchUint8Array[3] = Color.floatToByte(this.alpha);
  return scratchUint32Array[0];
};

/**
 * 按照提供的幅度使此颜色变亮。
 *
 * @param {number} magnitude 一个正数，表示要加亮的量。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 *
 * @example
 * const brightBlue = Cesium.Color.BLUE.brighten(0.5, new Cesium.Color());
 */
Color.prototype.brighten = function(magnitude, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("magnitude", magnitude);
  Check.typeOf.number.greaterThanOrEquals("magnitude", magnitude, 0.0);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  magnitude = 1.0 - magnitude;
  result.red = 1.0 - (1.0 - this.red) * magnitude;
  result.green = 1.0 - (1.0 - this.green) * magnitude;
  result.blue = 1.0 - (1.0 - this.blue) * magnitude;
  result.alpha = this.alpha;
  return result;
};

/**
 * 按照提供的幅度使此颜色变暗。
 *
 * @param {number} magnitude 一个正数，表示要加深的量。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 *
 * @example
 * const darkBlue = Cesium.Color.BLUE.darken(0.5, new Cesium.Color());
 */
Color.prototype.darken = function(magnitude, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("magnitude", magnitude);
  Check.typeOf.number.greaterThanOrEquals("magnitude", magnitude, 0.0);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  magnitude = 1.0 - magnitude;
  result.red = this.red * magnitude;
  result.green = this.green * magnitude;
  result.blue = this.blue * magnitude;
  result.alpha = this.alpha;
  return result;
};

/**
 * 创建一个新的 Color，该颜色具有与此 Color 相同的红、绿和蓝成分，
 * 但具有指定的 alpha 值。
 *
 * @param {number} alpha 新的 alpha 成分。
 * @param {Color} [result] 用于存储结果的对象，如果未定义，则创建一个新的实例。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 *
 * @example const translucentRed = Cesium.Color.RED.withAlpha(0.9);
 */

Color.prototype.withAlpha = function(alpha, result) {
  return Color.fromAlpha(this, alpha, result);
};

/**
 * 计算两个颜色的逐分量和。
 *
 * @param {Color} left 第一个颜色。
 * @param {Color} right 第二个颜色。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.add = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = left.red + right.red;
  result.green = left.green + right.green;
  result.blue = left.blue + right.blue;
  result.alpha = left.alpha + right.alpha;
  return result;
};

/**
 * 计算两个颜色的逐分量差。
 *
 * @param {Color} left 第一个颜色。
 * @param {Color} right 第二个颜色。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.subtract = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = left.red - right.red;
  result.green = left.green - right.green;
  result.blue = left.blue - right.blue;
  result.alpha = left.alpha - right.alpha;
  return result;
};

/**
 * 计算两个颜色的逐分量积。
 *
 * @param {Color} left 第一个颜色。
 * @param {Color} right 第二个颜色。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.multiply = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = left.red * right.red;
  result.green = left.green * right.green;
  result.blue = left.blue * right.blue;
  result.alpha = left.alpha * right.alpha;
  return result;
};

/**
 * 计算两个颜色的逐分量商。
 *
 * @param {Color} left 第一个颜色。
 * @param {Color} right 第二个颜色。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.divide = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = left.red / right.red;
  result.green = left.green / right.green;
  result.blue = left.blue / right.blue;
  result.alpha = left.alpha / right.alpha;
  return result;
};

/**
 * 计算两个颜色的逐分量模。
 *
 * @param {Color} left 第一个颜色。
 * @param {Color} right 第二个颜色。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.mod = function(left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = left.red % right.red;
  result.green = left.green % right.green;
  result.blue = left.blue % right.blue;
  result.alpha = left.alpha % right.alpha;
  return result;
};

/**
 * 计算在提供的颜色之间，沿 t 进行线性插值或外推。
 *
 * @param {Color} start 对应于 t 为 0.0 的颜色。
 * @param {Color} end 对应于 t 为 1.0 的颜色。
 * @param {number} t 沿 t 进行插值的点。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.lerp = function(start, end, t, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("start", start);
  Check.typeOf.object("end", end);
  Check.typeOf.number("t", t);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = CesiumMath.lerp(start.red, end.red, t);
  result.green = CesiumMath.lerp(start.green, end.green, t);
  result.blue = CesiumMath.lerp(start.blue, end.blue, t);
  result.alpha = CesiumMath.lerp(start.alpha, end.alpha, t);
  return result;
};

/**
 * 将提供的颜色逐分量乘以给定的标量。
 *
 * @param {Color} color 要进行缩放的颜色。
 * @param {number} scalar 要乘以的标量。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.multiplyByScalar = function(color, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("color", color);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = color.red * scalar;
  result.green = color.green * scalar;
  result.blue = color.blue * scalar;
  result.alpha = color.alpha * scalar;
  return result;
};

/**
 * 将提供的颜色逐分量除以给定的标量。
 *
 * @param {Color} color 要进行除法的颜色。
 * @param {number} scalar 要用于除法的标量。
 * @param {Color} result 存储结果的对象。
 * @returns {Color} 修改后的结果参数。
 */

Color.divideByScalar = function(color, scalar, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("color", color);
  Check.typeOf.number("scalar", scalar);
  Check.typeOf.object("result", result);
  //>>includeEnd('debug');

  result.red = color.red / scalar;
  result.green = color.green / scalar;
  result.blue = color.blue / scalar;
  result.alpha = color.alpha / scalar;
  return result;
};

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F0F8FF
 * <span class="colorSwath" style="background: #F0F8FF;"></span>
 *
 * @constant
 * @type {Color}
 */

Color.ALICEBLUE = Object.freeze(Color.fromCssColorString("#F0F8FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FAEBD7
 * <span class="colorSwath" style="background: #FAEBD7;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ANTIQUEWHITE = Object.freeze(Color.fromCssColorString("#FAEBD7"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00FFFF
 * <span class="colorSwath" style="background: #00FFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.AQUA = Object.freeze(Color.fromCssColorString("#00FFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #7FFFD4
 * <span class="colorSwath" style="background: #7FFFD4;"></span>
 *
 * @constant
 * @type {Color}
 */

Color.AQUAMARINE = Object.freeze(Color.fromCssColorString("#7FFFD4"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F0FFFF
 * <span class="colorSwath" style="background: #F0FFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.AZURE = Object.freeze(Color.fromCssColorString("#F0FFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F5F5DC
 * <span class="colorSwath" style="background: #F5F5DC;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BEIGE = Object.freeze(Color.fromCssColorString("#F5F5DC"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFE4C4
 * <span class="colorSwath" style="background: #FFE4C4;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BISQUE = Object.freeze(Color.fromCssColorString("#FFE4C4"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #000000
 * <span class="colorSwath" style="background: #000000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BLACK = Object.freeze(Color.fromCssColorString("#000000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFEBCD
 * <span class="colorSwath" style="background: #FFEBCD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BLANCHEDALMOND = Object.freeze(Color.fromCssColorString("#FFEBCD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #0000FF
 * <span class="colorSwath" style="background: #0000FF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BLUE = Object.freeze(Color.fromCssColorString("#0000FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #8A2BE2
 * <span class="colorSwath" style="background: #8A2BE2;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BLUEVIOLET = Object.freeze(Color.fromCssColorString("#8A2BE2"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #A52A2A
 * <span class="colorSwath" style="background: #A52A2A;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BROWN = Object.freeze(Color.fromCssColorString("#A52A2A"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DEB887
 * <span class="colorSwath" style="background: #DEB887;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.BURLYWOOD = Object.freeze(Color.fromCssColorString("#DEB887"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #5F9EA0
 * <span class="colorSwath" style="background: #5F9EA0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CADETBLUE = Object.freeze(Color.fromCssColorString("#5F9EA0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #7FFF00
 * <span class="colorSwath" style="background: #7FFF00;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CHARTREUSE = Object.freeze(Color.fromCssColorString("#7FFF00"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #D2691E
 * <span class="colorSwath" style="background: #D2691E;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CHOCOLATE = Object.freeze(Color.fromCssColorString("#D2691E"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF7F50
 * <span class="colorSwath" style="background: #FF7F50;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CORAL = Object.freeze(Color.fromCssColorString("#FF7F50"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #6495ED
 * <span class="colorSwath" style="background: #6495ED;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CORNFLOWERBLUE = Object.freeze(Color.fromCssColorString("#6495ED"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFF8DC
 * <span class="colorSwath" style="background: #FFF8DC;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CORNSILK = Object.freeze(Color.fromCssColorString("#FFF8DC"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DC143C
 * <span class="colorSwath" style="background: #DC143C;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CRIMSON = Object.freeze(Color.fromCssColorString("#DC143C"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00FFFF
 * <span class="colorSwath" style="background: #00FFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.CYAN = Object.freeze(Color.fromCssColorString("#00FFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00008B
 * <span class="colorSwath" style="background: #00008B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKBLUE = Object.freeze(Color.fromCssColorString("#00008B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #008B8B
 * <span class="colorSwath" style="background: #008B8B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKCYAN = Object.freeze(Color.fromCssColorString("#008B8B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #B8860B
 * <span class="colorSwath" style="background: #B8860B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKGOLDENROD = Object.freeze(Color.fromCssColorString("#B8860B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #A9A9A9
 * <span class="colorSwath" style="background: #A9A9A9;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKGRAY = Object.freeze(Color.fromCssColorString("#A9A9A9"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #006400
 * <span class="colorSwath" style="background: #006400;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKGREEN = Object.freeze(Color.fromCssColorString("#006400"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #A9A9A9
 * <span class="colorSwath" style="background: #A9A9A9;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKGREY = Color.DARKGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #BDB76B
 * <span class="colorSwath" style="background: #BDB76B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKKHAKI = Object.freeze(Color.fromCssColorString("#BDB76B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #8B008B
 * <span class="colorSwath" style="background: #8B008B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKMAGENTA = Object.freeze(Color.fromCssColorString("#8B008B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #556B2F
 * <span class="colorSwath" style="background: #556B2F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKOLIVEGREEN = Object.freeze(Color.fromCssColorString("#556B2F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF8C00
 * <span class="colorSwath" style="background: #FF8C00;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKORANGE = Object.freeze(Color.fromCssColorString("#FF8C00"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #9932CC
 * <span class="colorSwath" style="background: #9932CC;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKORCHID = Object.freeze(Color.fromCssColorString("#9932CC"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #8B0000
 * <span class="colorSwath" style="background: #8B0000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKRED = Object.freeze(Color.fromCssColorString("#8B0000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #E9967A
 * <span class="colorSwath" style="background: #E9967A;"></span>
 *
 * @constant
 * @type {Color}
 */

Color.DARKSALMON = Object.freeze(Color.fromCssColorString("#E9967A"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #8FBC8F
 * <span class="colorSwath" style="background: #8FBC8F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKSEAGREEN = Object.freeze(Color.fromCssColorString("#8FBC8F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #483D8B
 * <span class="colorSwath" style="background: #483D8B;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKSLATEBLUE = Object.freeze(Color.fromCssColorString("#483D8B"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #2F4F4F
 * <span class="colorSwath" style="background: #2F4F4F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKSLATEGRAY = Object.freeze(Color.fromCssColorString("#2F4F4F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #2F4F4F
 * <span class="colorSwath" style="background: #2F4F4F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKSLATEGREY = Color.DARKSLATEGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00CED1
 * <span class="colorSwath" style="background: #00CED1;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKTURQUOISE = Object.freeze(Color.fromCssColorString("#00CED1"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #9400D3
 * <span class="colorSwath" style="background: #9400D3;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DARKVIOLET = Object.freeze(Color.fromCssColorString("#9400D3"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF1493
 * <span class="colorSwath" style="background: #FF1493;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DEEPPINK = Object.freeze(Color.fromCssColorString("#FF1493"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00BFFF
 * <span class="colorSwath" style="background: #00BFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DEEPSKYBLUE = Object.freeze(Color.fromCssColorString("#00BFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #696969
 * <span class="colorSwath" style="background: #696969;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DIMGRAY = Object.freeze(Color.fromCssColorString("#696969"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #696969
 * <span class="colorSwath" style="background: #696969;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DIMGREY = Color.DIMGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #1E90FF
 * <span class="colorSwath" style="background: #1E90FF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.DODGERBLUE = Object.freeze(Color.fromCssColorString("#1E90FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #B22222
 * <span class="colorSwath" style="background: #B22222;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.FIREBRICK = Object.freeze(Color.fromCssColorString("#B22222"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFAF0
 * <span class="colorSwath" style="background: #FFFAF0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.FLORALWHITE = Object.freeze(Color.fromCssColorString("#FFFAF0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #228B22
 * <span class="colorSwath" style="background: #228B22;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.FORESTGREEN = Object.freeze(Color.fromCssColorString("#228B22"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF00FF
 * <span class="colorSwath" style="background: #FF00FF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.FUCHSIA = Object.freeze(Color.fromCssColorString("#FF00FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DCDCDC
 * <span class="colorSwath" style="background: #DCDCDC;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GAINSBORO = Object.freeze(Color.fromCssColorString("#DCDCDC"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F8F8FF
 * <span class="colorSwath" style="background: #F8F8FF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GHOSTWHITE = Object.freeze(Color.fromCssColorString("#F8F8FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFD700
 * <span class="colorSwath" style="background: #FFD700;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GOLD = Object.freeze(Color.fromCssColorString("#FFD700"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DAA520
 * <span class="colorSwath" style="background: #DAA520;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GOLDENROD = Object.freeze(Color.fromCssColorString("#DAA520"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #808080
 * <span class="colorSwath" style="background: #808080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GRAY = Object.freeze(Color.fromCssColorString("#808080"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #008000
 * <span class="colorSwath" style="background: #008000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GREEN = Object.freeze(Color.fromCssColorString("#008000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #ADFF2F
 * <span class="colorSwath" style="background: #ADFF2F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GREENYELLOW = Object.freeze(Color.fromCssColorString("#ADFF2F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #808080
 * <span class="colorSwath" style="background: #808080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.GREY = Color.GRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F0FFF0
 * <span class="colorSwath" style="background: #F0FFF0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.HONEYDEW = Object.freeze(Color.fromCssColorString("#F0FFF0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF69B4
 * <span class="colorSwath" style="background: #FF69B4;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.HOTPINK = Object.freeze(Color.fromCssColorString("#FF69B4"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #CD5C5C
 * <span class="colorSwath" style="background: #CD5C5C;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.INDIANRED = Object.freeze(Color.fromCssColorString("#CD5C5C"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #4B0082
 * <span class="colorSwath" style="background: #4B0082;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.INDIGO = Object.freeze(Color.fromCssColorString("#4B0082"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFFF0
 * <span class="colorSwath" style="background: #FFFFF0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.IVORY = Object.freeze(Color.fromCssColorString("#FFFFF0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F0E68C
 * <span class="colorSwath" style="background: #F0E68C;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.KHAKI = Object.freeze(Color.fromCssColorString("#F0E68C"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #E6E6FA
 * <span class="colorSwath" style="background: #E6E6FA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LAVENDER = Object.freeze(Color.fromCssColorString("#E6E6FA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFF0F5
 * <span class="colorSwath" style="background: #FFF0F5;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LAVENDAR_BLUSH = Object.freeze(Color.fromCssColorString("#FFF0F5"));


/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #7CFC00
 * <span class="colorSwath" style="background: #7CFC00;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LAWNGREEN = Object.freeze(Color.fromCssColorString("#7CFC00"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFACD
 * <span class="colorSwath" style="background: #FFFACD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LEMONCHIFFON = Object.freeze(Color.fromCssColorString("#FFFACD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #ADD8E6
 * <span class="colorSwath" style="background: #ADD8E6;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTBLUE = Object.freeze(Color.fromCssColorString("#ADD8E6"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F08080
 * <span class="colorSwath" style="background: #F08080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTCORAL = Object.freeze(Color.fromCssColorString("#F08080"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #E0FFFF
 * <span class="colorSwath" style="background: #E0FFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTCYAN = Object.freeze(Color.fromCssColorString("#E0FFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FAFAD2
 * <span class="colorSwath" style="background: #FAFAD2;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTGOLDENRODYELLOW = Object.freeze(Color.fromCssColorString("#FAFAD2"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #D3D3D3
 * <span class="colorSwath" style="background: #D3D3D3;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTGRAY = Object.freeze(Color.fromCssColorString("#D3D3D3"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #90EE90
 * <span class="colorSwath" style="background: #90EE90;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTGREEN = Object.freeze(Color.fromCssColorString("#90EE90"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #D3D3D3
 * <span class="colorSwath" style="background: #D3D3D3;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTGREY = Color.LIGHTGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFB6C1
 * <span class="colorSwath" style="background: #FFB6C1;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTPINK = Object.freeze(Color.fromCssColorString("#FFB6C1"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #20B2AA
 * <span class="colorSwath" style="background: #20B2AA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTSEAGREEN = Object.freeze(Color.fromCssColorString("#20B2AA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #87CEFA
 * <span class="colorSwath" style="background: #87CEFA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTSKYBLUE = Object.freeze(Color.fromCssColorString("#87CEFA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #778899
 * <span class="colorSwath" style="background: #778899;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTSLATEGRAY = Object.freeze(Color.fromCssColorString("#778899"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #778899
 * <span class="colorSwath" style="background: #778899;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTSLATEGREY = Color.LIGHTSLATEGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #B0C4DE
 * <span class="colorSwath" style="background: #B0C4DE;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTSTEELBLUE = Object.freeze(Color.fromCssColorString("#B0C4DE"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFFE0
 * <span class="colorSwath" style="background: #FFFFE0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIGHTYELLOW = Object.freeze(Color.fromCssColorString("#FFFFE0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00FF00
 * <span class="colorSwath" style="background: #00FF00;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIME = Object.freeze(Color.fromCssColorString("#00FF00"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #32CD32
 * <span class="colorSwath" style="background: #32CD32;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LIMEGREEN = Object.freeze(Color.fromCssColorString("#32CD32"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FAF0E6
 * <span class="colorSwath" style="background: #FAF0E6;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.LINEN = Object.freeze(Color.fromCssColorString("#FAF0E6"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF00FF
 * <span class="colorSwath" style="background: #FF00FF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MAGENTA = Object.freeze(Color.fromCssColorString("#FF00FF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #800000
 * <span class="colorSwath" style="background: #800000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MAROON = Object.freeze(Color.fromCssColorString("#800000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #66CDAA
 * <span class="colorSwath" style="background: #66CDAA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMAQUAMARINE = Object.freeze(Color.fromCssColorString("#66CDAA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #0000CD
 * <span class="colorSwath" style="background: #0000CD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMBLUE = Object.freeze(Color.fromCssColorString("#0000CD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #BA55D3
 * <span class="colorSwath" style="background: #BA55D3;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMORCHID = Object.freeze(Color.fromCssColorString("#BA55D3"));


/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #9370DB
 * <span class="colorSwath" style="background: #9370DB;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMPURPLE = Object.freeze(Color.fromCssColorString("#9370DB"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #3CB371
 * <span class="colorSwath" style="background: #3CB371;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMSEAGREEN = Object.freeze(Color.fromCssColorString("#3CB371"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #7B68EE
 * <span class="colorSwath" style="background: #7B68EE;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMSLATEBLUE = Object.freeze(Color.fromCssColorString("#7B68EE"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00FA9A
 * <span class="colorSwath" style="background: #00FA9A;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMSPRINGGREEN = Object.freeze(Color.fromCssColorString("#00FA9A"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #48D1CC
 * <span class="colorSwath" style="background: #48D1CC;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMTURQUOISE = Object.freeze(Color.fromCssColorString("#48D1CC"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #C71585
 * <span class="colorSwath" style="background: #C71585;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MEDIUMVIOLETRED = Object.freeze(Color.fromCssColorString("#C71585"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #191970
 * <span class="colorSwath" style="background: #191970;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MIDNIGHTBLUE = Object.freeze(Color.fromCssColorString("#191970"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F5FFFA
 * <span class="colorSwath" style="background: #F5FFFA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MINTCREAM = Object.freeze(Color.fromCssColorString("#F5FFFA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFE4E1
 * <span class="colorSwath" style="background: #FFE4E1;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MISTYROSE = Object.freeze(Color.fromCssColorString("#FFE4E1"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFE4B5
 * <span class="colorSwath" style="background: #FFE4B5;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.MOCCASIN = Object.freeze(Color.fromCssColorString("#FFE4B5"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFDEAD
 * <span class="colorSwath" style="background: #FFDEAD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.NAVAJOWHITE = Object.freeze(Color.fromCssColorString("#FFDEAD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #000080
 * <span class="colorSwath" style="background: #000080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.NAVY = Object.freeze(Color.fromCssColorString("#000080"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FDF5E6
 * <span class="colorSwath" style="background: #FDF5E6;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.OLDLACE = Object.freeze(Color.fromCssColorString("#FDF5E6"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #808000
 * <span class="colorSwath" style="background: #808000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.OLIVE = Object.freeze(Color.fromCssColorString("#808000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #6B8E23
 * <span class="colorSwath" style="background: #6B8E23;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.OLIVEDRAB = Object.freeze(Color.fromCssColorString("#6B8E23"));


/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFA500
 * <span class="colorSwath" style="background: #FFA500;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ORANGE = Object.freeze(Color.fromCssColorString("#FFA500"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF4500
 * <span class="colorSwath" style="background: #FF4500;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ORANGERED = Object.freeze(Color.fromCssColorString("#FF4500"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DA70D6
 * <span class="colorSwath" style="background: #DA70D6;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ORCHID = Object.freeze(Color.fromCssColorString("#DA70D6"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #EEE8AA
 * <span class="colorSwath" style="background: #EEE8AA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PALEGOLDENROD = Object.freeze(Color.fromCssColorString("#EEE8AA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #98FB98
 * <span class="colorSwath" style="background: #98FB98;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PALEGREEN = Object.freeze(Color.fromCssColorString("#98FB98"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #AFEEEE
 * <span class="colorSwath" style="background: #AFEEEE;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PALETURQUOISE = Object.freeze(Color.fromCssColorString("#AFEEEE"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DB7093
 * <span class="colorSwath" style="background: #DB7093;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PALEVIOLETRED = Object.freeze(Color.fromCssColorString("#DB7093"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFEFD5
 * <span class="colorSwath" style="background: #FFEFD5;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PAPAYAWHIP = Object.freeze(Color.fromCssColorString("#FFEFD5"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFDAB9
 * <span class="colorSwath" style="background: #FFDAB9;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PEACHPUFF = Object.freeze(Color.fromCssColorString("#FFDAB9"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #CD853F
 * <span class="colorSwath" style="background: #CD853F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PERU = Object.freeze(Color.fromCssColorString("#CD853F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFC0CB
 * <span class="colorSwath" style="background: #FFC0CB;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PINK = Object.freeze(Color.fromCssColorString("#FFC0CB"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #DDA0DD
 * <span class="colorSwath" style="background: #DDA0DD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PLUM = Object.freeze(Color.fromCssColorString("#DDA0DD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #B0E0E6
 * <span class="colorSwath" style="background: #B0E0E6;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.POWDERBLUE = Object.freeze(Color.fromCssColorString("#B0E0E6"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #800080
 * <span class="colorSwath" style="background: #800080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.PURPLE = Object.freeze(Color.fromCssColorString("#800080"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF0000
 * <span class="colorSwath" style="background: #FF0000;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.RED = Object.freeze(Color.fromCssColorString("#FF0000"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #BC8F8F
 * <span class="colorSwath" style="background: #BC8F8F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ROSYBROWN = Object.freeze(Color.fromCssColorString("#BC8F8F"));


/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #4169E1
 * <span class="colorSwath" style="background: #4169E1;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.ROYALBLUE = Object.freeze(Color.fromCssColorString("#4169E1"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #8B4513
 * <span class="colorSwath" style="background: #8B4513;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SADDLEBROWN = Object.freeze(Color.fromCssColorString("#8B4513"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FA8072
 * <span class="colorSwath" style="background: #FA8072;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SALMON = Object.freeze(Color.fromCssColorString("#FA8072"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F4A460
 * <span class="colorSwath" style="background: #F4A460;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SANDYBROWN = Object.freeze(Color.fromCssColorString("#F4A460"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #2E8B57
 * <span class="colorSwath" style="background: #2E8B57;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SEAGREEN = Object.freeze(Color.fromCssColorString("#2E8B57"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFF5EE
 * <span class="colorSwath" style="background: #FFF5EE;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SEASHELL = Object.freeze(Color.fromCssColorString("#FFF5EE"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #A0522D
 * <span class="colorSwath" style="background: #A0522D;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SIENNA = Object.freeze(Color.fromCssColorString("#A0522D"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #C0C0C0
 * <span class="colorSwath" style="background: #C0C0C0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SILVER = Object.freeze(Color.fromCssColorString("#C0C0C0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #87CEEB
 * <span class="colorSwath" style="background: #87CEEB;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SKYBLUE = Object.freeze(Color.fromCssColorString("#87CEEB"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #6A5ACD
 * <span class="colorSwath" style="background: #6A5ACD;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SLATEBLUE = Object.freeze(Color.fromCssColorString("#6A5ACD"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #708090
 * <span class="colorSwath" style="background: #708090;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SLATEGRAY = Object.freeze(Color.fromCssColorString("#708090"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #708090
 * <span class="colorSwath" style="background: #708090;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SLATEGREY = Color.SLATEGRAY;

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFAFA
 * <span class="colorSwath" style="background: #FFFAFA;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SNOW = Object.freeze(Color.fromCssColorString("#FFFAFA"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #00FF7F
 * <span class="colorSwath" style="background: #00FF7F;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.SPRINGGREEN = Object.freeze(Color.fromCssColorString("#00FF7F"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #4682B4
 * <span class="colorSwath" style="background: #4682B4;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.STEELBLUE = Object.freeze(Color.fromCssColorString("#4682B4"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #D2B48C
 * <span class="colorSwath" style="background: #D2B48C;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.TAN = Object.freeze(Color.fromCssColorString("#D2B48C"));


/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #008080
 * <span class="colorSwath" style="background: #008080;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.TEAL = Object.freeze(Color.fromCssColorString("#008080"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #D8BFD8
 * <span class="colorSwath" style="background: #D8BFD8;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.THISTLE = Object.freeze(Color.fromCssColorString("#D8BFD8"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FF6347
 * <span class="colorSwath" style="background: #FF6347;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.TOMATO = Object.freeze(Color.fromCssColorString("#FF6347"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #40E0D0
 * <span class="colorSwath" style="background: #40E0D0;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.TURQUOISE = Object.freeze(Color.fromCssColorString("#40E0D0"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #EE82EE
 * <span class="colorSwath" style="background: #EE82EE;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.VIOLET = Object.freeze(Color.fromCssColorString("#EE82EE"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F5DEB3
 * <span class="colorSwath" style="background: #F5DEB3;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.WHEAT = Object.freeze(Color.fromCssColorString("#F5DEB3"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFFFF
 * <span class="colorSwath" style="background: #FFFFFF;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.WHITE = Object.freeze(Color.fromCssColorString("#FFFFFF"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #F5F5F5
 * <span class="colorSwath" style="background: #F5F5F5;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.WHITESMOKE = Object.freeze(Color.fromCssColorString("#F5F5F5"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #FFFF00
 * <span class="colorSwath" style="background: #FFFF00;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.YELLOW = Object.freeze(Color.fromCssColorString("#FFFF00"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 颜色 #9ACD32
 * <span class="colorSwath" style="background: #9ACD32;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.YELLOWGREEN = Object.freeze(Color.fromCssColorString("#9ACD32"));

/**
 * 一个不可变的颜色实例，初始化为 CSS 透明色。
 * <span class="colorSwath" style="background: transparent;"></span>
 *
 * @constant
 * @type {Color}
 */
Color.TRANSPARENT = Object.freeze(new Color(0, 0, 0, 0));

export default Color;
