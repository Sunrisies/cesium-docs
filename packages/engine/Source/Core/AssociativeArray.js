import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个键值对集合，存储为哈希以便于
 * 查找，同时也提供一个数组以便于快速迭代。
 * @alias AssociativeArray
 * @constructor
 */

function AssociativeArray() {
  this._array = [];
  this._hash = {};
}

Object.defineProperties(AssociativeArray.prototype, {
 /**
   * 获取集合中的项数。
   * @memberof AssociativeArray.prototype
   *
   * @type {number}
   */

  length: {
    get: function () {
      return this._array.length;
    },
  },
  /**
   * 获取集合中所有值的无序数组。
   * 这是一个动态数组，将自动反映集合中的值，
   * 不应直接修改。
   * @memberof AssociativeArray.prototype
   *
   * @type {Array}
   */

  values: {
    get: function () {
      return this._array;
    },
  },
});

/**
 * 确定提供的键是否在数组中。
 *
 * @param {string|number} key 要检查的键。
 * @returns {boolean} <code>true</code> 如果键在数组中，<code>false</code> 否则。
 */

AssociativeArray.prototype.contains = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');
  return defined(this._hash[key]);
};

/**
 * 将提供的键与提供的值关联。如果键已存在，
 * 则将其用新值覆盖。
 *
 * @param {string|number} key 一个唯一标识符。
 * @param {*} value 要与提供的键关联的值。
 */

AssociativeArray.prototype.set = function (key, value) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');

  const oldValue = this._hash[key];
  if (value !== oldValue) {
    this.remove(key);
    this._hash[key] = value;
    this._array.push(value);
  }
};

/**
 * 检索与提供的键关联的值。
 *
 * @param {string|number} key 要检索其值的键。
 * @returns {*} 关联的值，如果键在集合中不存在，则为 undefined。
 */

AssociativeArray.prototype.get = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');
  return this._hash[key];
};

/**
 * 从集合中移除一个键值对。
 *
 * @param {string|number} key 要移除的键。
 * @returns {boolean} 如果被移除则为 true，如果键不在集合中则为 false。
 */

AssociativeArray.prototype.remove = function (key) {
  //>>includeStart('debug', pragmas.debug);
  if (defined(key) && typeof key !== "string" && typeof key !== "number") {
    throw new DeveloperError("key is required to be a string or number.");
  }
  //>>includeEnd('debug');

  const value = this._hash[key];
  const hasValue = defined(value);
  if (hasValue) {
    const array = this._array;
    array.splice(array.indexOf(value), 1);
    delete this._hash[key];
  }
  return hasValue;
};

/**
 * 清空集合。
 */

AssociativeArray.prototype.removeAll = function () {
  const array = this._array;
  if (array.length > 0) {
    this._hash = {};
    array.length = 0;
  }
};
export default AssociativeArray;
