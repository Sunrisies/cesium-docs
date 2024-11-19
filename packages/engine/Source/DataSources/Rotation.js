import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";

/**
 * Represents a {@link Packable} number that always interpolates values
 * towards the shortest angle of rotation. This object is never used directly
 * but is instead passed to the constructor of {@link SampledProperty}
 * in order to represent a two-dimensional angle of rotation.
 *
 * @interface Rotation
 *
 *
 * @example
 * const time1 = Cesium.JulianDate.fromIso8601('2010-05-07T00:00:00');
 * const time2 = Cesium.JulianDate.fromIso8601('2010-05-07T00:01:00');
 * const time3 = Cesium.JulianDate.fromIso8601('2010-05-07T00:02:00');
 *
 * const property = new Cesium.SampledProperty(Cesium.Rotation);
 * property.addSample(time1, 0);
 * property.addSample(time3, Cesium.Math.toRadians(350));
 *
 * //Getting the value at time2 will equal 355 degrees instead
 * //of 175 degrees (which is what you get if you construct
 * //a SampledProperty(Number) instead.  Note, the actual
 * //return value is in radians, not degrees.
 * property.getValue(time2);
 *
 * @see PackableForInterpolation
 */
const Rotation = {
  /**
   * The number of elements used to pack the object into an array.
   * @type {number}
   */
  packedLength: 1,

  /**
   * 将提供的实例存储到提供的数组中.
   *
   * @param {Rotation} value 要打包的值.
   * @param {number[]} array 要打包到的数组.
   * @param {number} [startingIndex=0] 开始打包元素的数组索引.
   *
   * @returns {number[]} 被打包成的数组
   */
  pack: function (value, array, startingIndex) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(value)) {
      throw new DeveloperError("value is required");
    }

    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);
    array[startingIndex] = value;

    return array;
  },

  /**
   * 从打包数组中检索实例.
   *
   * @param {number[]} array 压缩数组.
   * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
   * @param {Rotation} [result] 存储结果的对象.
   * @returns {Rotation} The modified result parameter or a new Rotation instance if one was not provided.
   */
  unpack: function (array, startingIndex, result) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    //>>includeEnd('debug');

    startingIndex = defaultValue(startingIndex, 0);
    return array[startingIndex];
  },

  /**
   * Converts a packed array into a form suitable for interpolation.
   *
   * @param {number[]} packedArray 压缩数组.
   * @param {number} [startingIndex=0] The index of the first element to be converted.
   * @param {number} [lastIndex=packedArray.length] The index of the last element to be converted.
   * @param {number[]} [result] 存储结果的对象.
   */
  convertPackedArrayForInterpolation: function (
    packedArray,
    startingIndex,
    lastIndex,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(packedArray)) {
      throw new DeveloperError("packedArray is required");
    }
    //>>includeEnd('debug');

    if (!defined(result)) {
      result = [];
    }

    startingIndex = defaultValue(startingIndex, 0);
    lastIndex = defaultValue(lastIndex, packedArray.length);

    let previousValue;
    for (let i = 0, len = lastIndex - startingIndex + 1; i < len; i++) {
      const value = packedArray[startingIndex + i];
      if (i === 0 || Math.abs(previousValue - value) < Math.PI) {
        result[i] = value;
      } else {
        result[i] = value - CesiumMath.TWO_PI;
      }
      previousValue = value;
    }
  },

  /**
   * Retrieves an instance from a packed array converted with {@link Rotation.convertPackedArrayForInterpolation}.
   *
   * @param {number[]} array The array previously packed for interpolation.
   * @param {number[]} sourceArray The original packed array.
   * @param {number} [firstIndex=0] The firstIndex used to convert the array.
   * @param {number} [lastIndex=packedArray.length] The lastIndex used to convert the array.
   * @param {Rotation} [result] 存储结果的对象.
   * @returns {Rotation} The modified result parameter or a new Rotation instance if one was not provided.
   */
  unpackInterpolationResult: function (
    array,
    sourceArray,
    firstIndex,
    lastIndex,
    result,
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(array)) {
      throw new DeveloperError("array is required");
    }
    if (!defined(sourceArray)) {
      throw new DeveloperError("sourceArray is required");
    }
    //>>includeEnd('debug');

    result = array[0];
    if (result < 0) {
      return result + CesiumMath.TWO_PI;
    }
    return result;
  },
};
export default Rotation;
