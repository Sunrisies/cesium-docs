import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";

/**
 * 一个 {@link DataSource} 实例的集合。
 * @alias DataSourceCollection
 * @constructor
 */

function DataSourceCollection() {
  this._dataSources = [];
  this._dataSourceAdded = new Event();
  this._dataSourceRemoved = new Event();
  this._dataSourceMoved = new Event();
}

Object.defineProperties(DataSourceCollection.prototype, {
  /**
   * 获取此集合中的数据源数量。
   * @memberof DataSourceCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._dataSources.length;
    },
  },

  /**
   * 当数据源被添加到集合时触发的事件。
   * 事件处理程序会接收到被添加的数据源。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceAdded: {
    get: function () {
      return this._dataSourceAdded;
    },
  },

  /**
   * 当数据源从集合中移除时触发的事件。
   * 事件处理程序会接收到被移除的数据源。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceRemoved: {
    get: function () {
      return this._dataSourceRemoved;
    },
  },

  /**
   * 当数据源在集合中的位置发生变化时触发的事件。
   * 事件处理程序会接收到被移动的数据源、移动后的新索引以及移动前的旧索引。
   * @memberof DataSourceCollection.prototype
   * @type {Event}
   * @readonly
   */
  dataSourceMoved: {
    get: function () {
      return this._dataSourceMoved;
    },
  },
});


/**
 * 将数据源添加到集合中。
 *
 * @param {DataSource|Promise<DataSource>} dataSource 要添加到集合中的数据源或数据源的 Promise。
 *                                        当传递一个 Promise 时，数据源在 Promise 成功解析之前不会实际添加
 *                                        到集合中。
 * @returns {Promise<DataSource>} 一旦数据源被添加到集合中，就会解析的 Promise。
 */

DataSourceCollection.prototype.add = function (dataSource) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(dataSource)) {
    throw new DeveloperError("dataSource is required.");
  }
  //>>includeEnd('debug');

  const that = this;
  const dataSources = this._dataSources;
  return Promise.resolve(dataSource).then(function (value) {
    //Only add the data source if removeAll has not been called
    //Since it was added.
    if (dataSources === that._dataSources) {
      that._dataSources.push(value);
      that._dataSourceAdded.raiseEvent(that, value);
    }
    return value;
  });
};

/**
 * 从此集合中移除数据源（如果存在）。
 *
 * @param {DataSource} dataSource 要移除的数据源。
 * @param {boolean} [destroy=false] 是否在移除的数据源的同时销毁它。
 * @returns {boolean} 如果数据源在集合中并已被移除，则返回 true；
 *                    如果数据源不在集合中，则返回 false。
 */

DataSourceCollection.prototype.remove = function (dataSource, destroy) {
  destroy = defaultValue(destroy, false);

  const index = this._dataSources.indexOf(dataSource);
  if (index !== -1) {
    this._dataSources.splice(index, 1);
    this._dataSourceRemoved.raiseEvent(this, dataSource);

    if (destroy && typeof dataSource.destroy === "function") {
      dataSource.destroy();
    }

    return true;
  }

  return false;
};

/**
 * 从此集合中移除所有数据源。
 *
 * @param {boolean} [destroy=false] 是否在移除数据源的同时销毁它们。
 */

DataSourceCollection.prototype.removeAll = function (destroy) {
  destroy = defaultValue(destroy, false);

  const dataSources = this._dataSources;
  for (let i = 0, len = dataSources.length; i < len; ++i) {
    const dataSource = dataSources[i];
    this._dataSourceRemoved.raiseEvent(this, dataSource);

    if (destroy && typeof dataSource.destroy === "function") {
      dataSource.destroy();
    }
  }
  this._dataSources = [];
};

/**
 * 检查集合中是否包含给定的数据源。
 *
 * @param {DataSource} dataSource 要检查的数据源。
 * @returns {boolean} 如果集合中包含该数据源则返回 true；否则返回 false。
 */

DataSourceCollection.prototype.contains = function (dataSource) {
  return this.indexOf(dataSource) !== -1;
};

/**
 * 确定给定数据源在集合中的索引。
 *
 * @param {DataSource} dataSource 要查找索引的数据源。
 * @returns {number} 数据源在集合中的索引，如果数据源不在集合中则返回 -1。
 */

DataSourceCollection.prototype.indexOf = function (dataSource) {
  return this._dataSources.indexOf(dataSource);
};

/**
 * 从集合中按索引获取数据源。
 *
 * @param {number} index 要检索的索引。
 * @returns {DataSource} 在指定索引处的数据源。
 */

DataSourceCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._dataSources[index];
};

/**
 * 从集合中按名称获取数据源。
 *
 * @param {string} name 要检索的名称。
 * @returns {DataSource[]} 匹配提供名称的所有数据源的列表。
 */

DataSourceCollection.prototype.getByName = function (name) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(name)) {
    throw new DeveloperError("name is required.");
  }
  //>>includeEnd('debug');

  return this._dataSources.filter(function (dataSource) {
    return dataSource.name === name;
  });
};

function getIndex(dataSources, dataSource) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(dataSource)) {
    throw new DeveloperError("dataSource is required.");
  }
  //>>includeEnd('debug');

  const index = dataSources.indexOf(dataSource);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("dataSource is not in this collection.");
  }
  //>>includeEnd('debug');

  return index;
}

function swapDataSources(collection, i, j) {
  const arr = collection._dataSources;
  const length = arr.length - 1;
  i = CesiumMath.clamp(i, 0, length);
  j = CesiumMath.clamp(j, 0, length);

  if (i === j) {
    return;
  }

  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;

  collection.dataSourceMoved.raiseEvent(temp, j, i);
}

/**
 * 将数据源在集合中向上移动一位。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} 数据源不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

DataSourceCollection.prototype.raise = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index + 1);
};

/**
 * 将数据源在集合中向下移动一位。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} 数据源不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

DataSourceCollection.prototype.lower = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  swapDataSources(this, index, index - 1);
};

/**
 * 将数据源提升到集合的顶部。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} 数据源不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

DataSourceCollection.prototype.raiseToTop = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  if (index === this._dataSources.length - 1) {
    return;
  }
  this._dataSources.splice(index, 1);
  this._dataSources.push(dataSource);

  this.dataSourceMoved.raiseEvent(
    dataSource,
    this._dataSources.length - 1,
    index,
  );
};

/**
 * 将数据源移到底部集合。
 *
 * @param {DataSource} dataSource 要移动的数据源。
 *
 * @exception {DeveloperError} 数据源不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

DataSourceCollection.prototype.lowerToBottom = function (dataSource) {
  const index = getIndex(this._dataSources, dataSource);
  if (index === 0) {
    return;
  }
  this._dataSources.splice(index, 1);
  this._dataSources.splice(0, 0, dataSource);

  this.dataSourceMoved.raiseEvent(dataSource, 0, index);
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * 如果此对象已被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @see DataSourceCollection#destroy
 */

DataSourceCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中所有数据源所占用的资源。显式地销毁此
 * 对象允许确定性地释放 WebGL 资源，而不是依赖垃圾
 * 收集器。一旦此对象被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * dataSourceCollection = dataSourceCollection && dataSourceCollection.destroy();
 *
 * @see DataSourceCollection#isDestroyed
 */
DataSourceCollection.prototype.destroy = function () {
  this.removeAll(true);
  return destroyObject(this);
};
export default DataSourceCollection;
