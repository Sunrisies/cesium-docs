import defaultValue from "./defaultValue.js";
import defined from "./defined.js";

/**
 * 合并两个对象，将它们的属性复制到一个新的合并对象中。当两个对象具有相同属性时，将使用第一个对象的属性值。
 * 如果任一对象未定义，则将其视为一个空对象。
 *
 * @example
 * const object1 = {
 *     propOne : 1,
 *     propTwo : {
 *         value1 : 10
 *     }
 * }
 * const object2 = {
 *     propTwo : 2
 * }
 * const final = Cesium.combine(object1, object2);
 *
 * // final === {
 * //     propOne : 1,
 * //     propTwo : {
 * //         value1 : 10
 * //     }
 * // }
 *
 * @param {object} [object1] 要合并的第一个对象。
 * @param {object} [object2] 要合并的第二个对象。
 * @param {boolean} [deep=false] 执行递归合并。
 * @returns {object} 包含来自两个对象的所有属性的合并对象。
 *
 * @function
 */

function combine(object1, object2, deep) {
  deep = defaultValue(deep, false);

  const result = {};

  const object1Defined = defined(object1);
  const object2Defined = defined(object2);
  let property;
  let object1Value;
  let object2Value;
  if (object1Defined) {
    for (property in object1) {
      if (object1.hasOwnProperty(property)) {
        object1Value = object1[property];
        if (
          object2Defined &&
          deep &&
          typeof object1Value === "object" &&
          object2.hasOwnProperty(property)
        ) {
          object2Value = object2[property];
          if (typeof object2Value === "object") {
            result[property] = combine(object1Value, object2Value, deep);
          } else {
            result[property] = object1Value;
          }
        } else {
          result[property] = object1Value;
        }
      }
    }
  }
  if (object2Defined) {
    for (property in object2) {
      if (
        object2.hasOwnProperty(property) &&
        !result.hasOwnProperty(property)
      ) {
        object2Value = object2[property];
        result[property] = object2Value;
      }
    }
  }
  return result;
}
export default combine;
