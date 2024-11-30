import defined from "../Core/defined.js";
import I3SDataProvider from "./I3SDataProvider.js";

/**
 * 该类实现了 I3S 特征。
 * <p>
 * 不要直接构造此类，而是通过 {@link I3SNode} 访问图块。
 * </p>
 * @alias I3SFeature
 * @internalConstructor
 */

function I3SFeature(parent, uri) {
  this._parent = parent;
  this._dataProvider = parent._dataProvider;
  this._layer = parent._layer;

  if (defined(this._parent._nodeIndex)) {
    this._resource = this._parent._layer.resource.getDerivedResource({
      url: `nodes/${this._parent._data.mesh.attribute.resource}/${uri}`,
    });
  } else {
    this._resource = this._parent.resource.getDerivedResource({ url: uri });
  }
}

Object.defineProperties(I3SFeature.prototype, {
  /**
   * 获取特征的资源
   * @memberof I3SFeature.prototype
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
   * @memberof I3SFeature.prototype
   * @type {object}
   * @readonly
   */
  data: {
    get: function () {
      return this._data;
    },
  },
});

/**
 * 加载内容。
 * @returns {Promise<object>} 当 I3S 特征的数据加载完成时解析的 Promise
 * @private
 */

I3SFeature.prototype.load = async function () {
  this._data = await I3SDataProvider.loadJson(this._resource);
  return this._data;
};

export default I3SFeature;
