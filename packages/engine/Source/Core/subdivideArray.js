import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 将数组细分为多个较小、大小相等的数组。
 *
 * @function subdivideArray
 *
 * @param {Array} array 要细分的数组。
 * @param {number} numberOfArrays 要将提供的数组细分成的数组数量。
 *
 * @exception {DeveloperError} numberOfArrays 必须大于 0。
 */

function subdivideArray(array, numberOfArrays) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required.");
  }

  if (!defined(numberOfArrays) || numberOfArrays < 1) {
    throw new DeveloperError("numberOfArrays must be greater than 0.");
  }
  //>>includeEnd('debug');

  const result = [];
  const len = array.length;
  let i = 0;
  while (i < len) {
    const size = Math.ceil((len - i) / numberOfArrays--);
    result.push(array.slice(i, i + size));
    i += size;
  }
  return result;
}
export default subdivideArray;
