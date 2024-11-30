import Color from "../../Core/Color.js";
import defined from "../../Core/defined.js";

/**
 * {@link Model} 的一个特性。
 * <p>
 * 提供对存储在模型特性表中的特性的属性的访问。
 * </p>
 * <p>
 * 对 <code>ModelFeature</code> 对象的修改在模型的生命周期内有效。
 * </p>
 * <p>
 * 请勿直接构造此对象。通过使用 {@link Scene#pick} 进行选择来访问它。
 * </p>
 *
 * @alias ModelFeature
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Model} options.model 特性所属的模型。
 * @param {number} options.featureId 此特性的唯一整数标识符。
 *
 * @example
 * // On mouse over, display all the properties for a feature in the console log.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.ModelFeature) {
 *         console.log(feature);
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 *
 */
function ModelFeature(options) {
  this._model = options.model;

  // This ModelFeatureTable is not documented as an option since it is
  // part of the private API and should not appear in the documentation.
  this._featureTable = options.featureTable;

  this._featureId = options.featureId;
  this._color = undefined; // for calling getColor
}

Object.defineProperties(ModelFeature.prototype, {
  /**
   * 获取或设置特性是否显示。当样式的显示进行评估时，将为所有特性设置此属性。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._featureTable.getShow(this._featureId);
    },
    set: function (value) {
      this._featureTable.setShow(this._featureId, value);
    },
  },

  /**
   * 获取或设置高亮颜色，它将与特性的颜色相乘。当这一点是白色时，特性的颜色不会改变。当样式的颜色被评估时，将为所有特性设置此属性。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {Color}
   *
   * @default {@link Color.WHITE}
   */
  color: {
    get: function () {
      if (!defined(this._color)) {
        this._color = new Color();
      }
      return this._featureTable.getColor(this._featureId, this._color);
    },
    set: function (value) {
      this._featureTable.setColor(this._featureId, value);
    },
  },
  
  /**
   * 所有由 {@link Scene#pick} 返回的对象都有一个 <code>primitive</code> 属性。此属性返回
   * 包含该特性的模型。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {Model}
   *
   * @readonly
   * @private
   */
  primitive: {
    get: function () {
      return this._model;
    },
  },

  /**
   * 此特性所属的 {@link ModelFeatureTable}。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {ModelFeatureTable}
   *
   * @readonly
   * @private
   */
  featureTable: {
    get: function () {
      return this._featureTable;
    },
  },

  /**
   * 获取与此特性相关联的特征 ID。对于 3D Tiles 1.0，返回的是批次 ID。对于 EXT_mesh_features，
   * 返回的是来自所选特征 ID 集的特征 ID。
   *
   * @memberof ModelFeature.prototype
   *
   * @type {number}
   *
   * @readonly
   * @experimental 该功能使用的是 3D Tiles 规范中的一部分，该部分尚未确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
   */
  featureId: {
    get: function () {
      return this._featureId;
    },
  },
});


/**
 * 返回特性是否包含此属性。
 *
 * @param {string} name 属性的区分大小写名称。
 * @returns {boolean} 特性是否包含此属性。
 */

ModelFeature.prototype.hasProperty = function (name) {
  return this._featureTable.hasProperty(this._featureId, name);
};

/**
 * 返回具有给定名称的特性属性的值的副本。
 *
 * @param {string} name 属性的区分大小写名称。
 * @returns {*} 属性的值，如果特性没有此属性，则返回 <code>undefined</code>。
 *
 * @example
 * // Display all the properties for a feature in the console log.
 * const propertyIds = feature.getPropertyIds();
 * const length = propertyIds.length;
 * for (let i = 0; i < length; ++i) {
 *     const propertyId = propertyIds[i];
 *     console.log(propertyId + ': ' + feature.getProperty(propertyId));
 * }
 */
ModelFeature.prototype.getProperty = function (name) {
  return this._featureTable.getProperty(this._featureId, name);
};

/**
 * 返回具有给定名称的特性属性的副本，检查来自 EXT_structural_metadata 和旧版 EXT_feature_metadata glTF
 * 扩展的所有元数据。元数据按从最具体到最一般的名称进行检查，返回第一个匹配项。元数据的检查顺序如下：
 * <ol>
 *   <li>按语义检查结构化元数据属性</li>
 *   <li>按属性 ID 检查结构化元数据属性</li>
 * </ol>
 * <p>
 * 请参阅 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata Extension} 以及
 * 之前的 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata|EXT_feature_metadata Extension} 以了解 glTF 的相关信息。
 * </p>
 *
 * @param {string} name 特性的语义或属性 ID。语义在每个元数据粒度中优先于属性 ID 进行检查。
 * @return {*} 属性的值，如果特性没有此属性，则返回 <code>undefined</code>。
 *
 * @experimental 该功能使用的是 3D Tiles 规范中的一部分，该部分尚未确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
 */

ModelFeature.prototype.getPropertyInherited = function (name) {
  if (this._featureTable.hasPropertyBySemantic(this._featureId, name)) {
    return this._featureTable.getPropertyBySemantic(this._featureId, name);
  }

  return this._featureTable.getProperty(this._featureId, name);
};

/**
 * 返回特性的属性 ID 数组。
 *
 * @param {string[]} [results] 一个数组，用于存储结果。
 * @returns {string[]} 特性属性的 ID。
 */

ModelFeature.prototype.getPropertyIds = function (results) {
  return this._featureTable.getPropertyIds(results);
};

/**
 * 设置具有给定名称的特性属性的值。
 *
 * @param {string} name 属性的区分大小写名称。
 * @param {*} value 要复制的属性值。
 * @returns {boolean} 如果属性设置成功则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 继承的批次表层次属性是只读的。
 *
 * @example
 * const height = feature.getProperty('Height'); // e.g., the height of a building
 *
 * @example
 * const name = 'clicked';
 * if (feature.getProperty(name)) {
 *     console.log('already clicked');
 * } else {
 *     feature.setProperty(name, true);
 *     console.log('first click');
 * }
 */
ModelFeature.prototype.setProperty = function (name, value) {
  return this._featureTable.setProperty(this._featureId, name, value);
};

export default ModelFeature;
