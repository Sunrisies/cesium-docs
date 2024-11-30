import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

const leftScratchArray = [];
const rightScratchArray = [];

function merge(array, compare, userDefinedObject, start, middle, end) {
  const leftLength = middle - start + 1;
  const rightLength = end - middle;

  const left = leftScratchArray;
  const right = rightScratchArray;

  let i;
  let j;

  for (i = 0; i < leftLength; ++i) {
    left[i] = array[start + i];
  }

  for (j = 0; j < rightLength; ++j) {
    right[j] = array[middle + j + 1];
  }

  i = 0;
  j = 0;
  for (let k = start; k <= end; ++k) {
    const leftElement = left[i];
    const rightElement = right[j];
    if (
      i < leftLength &&
      (j >= rightLength ||
        compare(leftElement, rightElement, userDefinedObject) <= 0)
    ) {
      array[k] = leftElement;
      ++i;
    } else if (j < rightLength) {
      array[k] = rightElement;
      ++j;
    }
  }
}

function sort(array, compare, userDefinedObject, start, end) {
  if (start >= end) {
    return;
  }

  const middle = Math.floor((start + end) * 0.5);
  sort(array, compare, userDefinedObject, start, middle);
  sort(array, compare, userDefinedObject, middle + 1, end);
  merge(array, compare, userDefinedObject, start, middle, end);
}

/**
 * 一个稳定的归并排序。
 *
 * @function mergeSort
 * @param {Array} array 要排序的数组。
 * @param {mergeSortComparator} comparator 用于比较数组中元素的函数。
 * @param {*} [userDefinedObject] 作为第三个参数传递给 <code>comparator</code> 的任何项目。
 *
 * @example
 * // Assume array contains BoundingSpheres in world coordinates.
 * // Sort them in ascending order of distance from the camera.
 * const position = camera.positionWC;
 * Cesium.mergeSort(array, function(a, b, position) {
 *     return Cesium.BoundingSphere.distanceSquaredTo(b, position) - Cesium.BoundingSphere.distanceSquaredTo(a, position);
 * }, position);
 */
function mergeSort(array, comparator, userDefinedObject) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required.");
  }
  if (!defined(comparator)) {
    throw new DeveloperError("comparator is required.");
  }
  //>>includeEnd('debug');

  const length = array.length;
  const scratchLength = Math.ceil(length * 0.5);

  // preallocate space in scratch arrays
  leftScratchArray.length = scratchLength;
  rightScratchArray.length = scratchLength;

  sort(array, comparator, userDefinedObject, 0, length - 1);

  // trim scratch arrays
  leftScratchArray.length = 0;
  rightScratchArray.length = 0;
}

/**
 * 在执行归并排序时用于比较两个项目的函数。
 * @callback mergeSortComparator
 *
 * @param {*} a 数组中的一个项目。
 * @param {*} b 数组中的一个项目。
 * @param {*} [userDefinedObject] 作为参数传递给 {@link mergeSort} 的对象。
 * @returns {number} 如果 <code>a</code> 小于 <code>b</code> 则返回负值，
 *          如果 <code>a</code> 大于 <code>b</code> 则返回正值，
 *          如果 <code>a</code> 等于 <code>b</code> 则返回 0。
 *
 * @example
 * function compareNumbers(a, b, userDefinedObject) {
 *     return a - b;
 * }
 */
export default mergeSort;
