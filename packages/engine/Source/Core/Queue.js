/**
 * 一个队列，可以在末尾入队项，从前面出队项。
 *
 * @alias Queue
 * @constructor
 */

function Queue() {
  this._array = [];
  this._offset = 0;
  this._length = 0;
}

Object.defineProperties(Queue.prototype, {
  /**
   * 队列的长度。
   *
   * @memberof Queue.prototype
   *
   * @type {number}
   * @readonly
   */

  length: {
    get: function () {
      return this._length;
    },
  },
});

/**
 * 将指定的项入队。
 *
 * @param {*} item 要入队的项。
 */
Queue.prototype.enqueue = function (item) {
  this._array.push(item);
  this._length++;
};

/**
 * 出队一个项。如果队列为空，则返回 undefined。
 *
 * @returns {*} 被出队的项。
 */

Queue.prototype.dequeue = function () {
  if (this._length === 0) {
    return undefined;
  }

  const array = this._array;
  let offset = this._offset;
  const item = array[offset];
  array[offset] = undefined;

  offset++;
  if (offset > 10 && offset * 2 > array.length) {
    //compact array
    this._array = array.slice(offset);
    offset = 0;
  }

  this._offset = offset;
  this._length--;

  return item;
};

/**
 * 返回队列前面的项。如果队列为空，则返回 undefined。
 *
 * @returns {*} 队列前面的项。
 */
Queue.prototype.peek = function () {
  if (this._length === 0) {
    return undefined;
  }

  return this._array[this._offset];
};

/**
 * 检查此队列是否包含指定的项。
 *
 * @param {*} item 要搜索的项。
 */

Queue.prototype.contains = function (item) {
  return this._array.indexOf(item) !== -1;
};

/**
 * 从队列中移除所有项。
 */
Queue.prototype.clear = function () {
  this._array.length = this._offset = this._length = 0;
};

/**
 * 原地对队列中的项进行排序。
 *
 * @param {Queue.Comparator} compareFunction 定义排序顺序的函数。
 */

Queue.prototype.sort = function (compareFunction) {
  if (this._offset > 0) {
    //compact array
    this._array = this._array.slice(this._offset);
    this._offset = 0;
  }

  this._array.sort(compareFunction);
};

/**
 * 用于在排序队列时比较两个项的函数。
 * @callback Queue.Comparator
 *
 * @param {*} a 数组中的一个项。
 * @param {*} b 数组中的一个项。
 * @returns {number} 如果 <code>a</code> 小于 <code>b</code>，返回负值；
 *          如果 <code>a</code> 大于 <code>b</code>，返回正值；
 *          如果 <code>a</code> 等于 <code>b</code>，返回 0。
 *
 * @example
 * function compareNumbers(a, b) {
 *     return a - b;
 * }
 */
export default Queue;
