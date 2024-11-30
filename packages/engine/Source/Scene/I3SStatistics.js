import defined from "../Core/defined.js";
import I3SDataProvider from "./I3SDataProvider.js";
import Resource from "../Core/Resource.js";

/**
 * 该类实现了建筑场景层的 I3S 统计信息。
 * <p>
 * 不要直接构造此类，而是通过 {@link I3SDataProvider} 访问统计数据。
 * </p>
 * @alias I3SStatistics
 * @internalConstructor
 */

function I3SStatistics(dataProvider, uri) {
  this._dataProvider = dataProvider;

  this._resource = new Resource({ url: uri });
  this._resource.setQueryParameters(dataProvider.resource.queryParameters);
  this._resource.appendForwardSlash();
}

Object.defineProperties(I3SStatistics.prototype, {
  /**
   * 获取统计信息的资源
   * @memberof I3SStatistics.prototype
   * @type {Resource}
   * @readonly
   */

  resource: {
    get: function () {
      return this._resource;
    },
  },

  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SStatistics.prototype
   * @type {object}
   * @readonly
   */

  data: {
    get: function () {
      return this._data;
    },
  },

  /**
   * 获取属性名称的集合。
   * @memberof I3SStatistics.prototype
   * @type {string[]}
   * @readonly
   */

  names: {
    get: function () {
      const names = [];
      const summary = this._data.summary;
      if (defined(summary)) {
        for (let i = 0; i < summary.length; ++i) {
          names.push(summary[i].fieldName);
        }
      }
      return names;
    },
  },
});

/**
 * 加载内容。
 * @returns {Promise<object>} 当 I3S 统计数据加载完成时解析的 Promise
 * @private
 */

I3SStatistics.prototype.load = async function () {
  this._data = await I3SDataProvider.loadJson(this._resource);
  return this._data;
};

/**
 * @private
 */
I3SStatistics.prototype._getValues = function (attributeName) {
  const summary = this._data.summary;
  if (defined(summary)) {
    for (let i = 0; i < summary.length; ++i) {
      const attribute = summary[i];
      if (attribute.fieldName === attributeName) {
        if (defined(attribute.mostFrequentValues)) {
          return [...attribute.mostFrequentValues];
        }
        return [];
      }
    }
  }
};

export default I3SStatistics;
