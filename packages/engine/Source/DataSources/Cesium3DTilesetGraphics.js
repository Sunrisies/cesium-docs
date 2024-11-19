import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";

/**
 * @typedef {object} Cesium3DTilesetGraphics.ConstructorOptions
 *
 * Cesium3DTilesetGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔类型的属性，指定瓦片集的可见性。
 * @property {Property | string | Resource} [uri] 一个字符串或资源属性，指定瓦片集的 URI。
 * @property {Property | number} [maximumScreenSpaceError] 一个数字或属性，指定用于驱动细节级别细化的最大屏幕空间误差。
 */

/**
 * 由 {@link Entity} 表示的 3D Tiles 瓦片集。
 * 瓦片集的 modelMatrix 由包含的实体的位置和朝向决定，
 * 如果位置未定义，则保持未设置状态。
 *
 * @alias Cesium3DTilesetGraphics
 * @constructor
 *
 * @param {Cesium3DTilesetGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 */

function Cesium3DTilesetGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._uri = undefined;
  this._uriSubscription = undefined;
  this._maximumScreenSpaceError = undefined;
  this._maximumScreenSpaceErrorSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(Cesium3DTilesetGraphics.prototype, {
  /**
   * 获取每当属性或子属性改变或修改时引发的事件。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function() {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔属性，指定模型的可见性。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置字符串属性，指定 glTF 资产的 URI。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置用于驱动细节级别细化的最大屏幕空间误差。
   * @memberof Cesium3DTilesetGraphics.prototype
   * @type {Property|undefined}
   */

  maximumScreenSpaceError: createPropertyDescriptor("maximumScreenSpaceError"),
});

/**
 * 复制此实例。
 *
 * @param {Cesium3DTilesetGraphics} [result] 存储结果的对象。
 * @returns {Cesium3DTilesetGraphics} 修改后的结果参数，或者如果未提供则返回一个新实例。
 */

Cesium3DTilesetGraphics.prototype.clone = function(result) {
  if (!defined(result)) {
    return new Cesium3DTilesetGraphics(this);
  }
  result.show = this.show;
  result.uri = this.uri;
  result.maximumScreenSpaceError = this.maximumScreenSpaceError;

  return result;
};

/**
 * 将此对象上每个未赋值的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {Cesium3DTilesetGraphics} source 要合并到此对象中的对象。
 */

Cesium3DTilesetGraphics.prototype.merge = function(source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.uri = defaultValue(this.uri, source.uri);
  this.maximumScreenSpaceError = defaultValue(
    this.maximumScreenSpaceError,
    source.maximumScreenSpaceError,
  );
};

export default Cesium3DTilesetGraphics;
