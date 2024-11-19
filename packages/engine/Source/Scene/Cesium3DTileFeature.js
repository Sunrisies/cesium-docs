import Color from "../Core/Color.js";
import defined from "../Core/defined.js";

/**
 * {@link Cesium3DTileset} 的一个特征。
 * <p>
 * 提供对存储在瓦片的批处理表中的特征属性的访问，以及通过
 * {@link Cesium3DTileFeature#show} 和 {@link Cesium3DTileFeature#color} 分别显示/隐藏特征和更改其高亮颜色的能力。
 * </p>
 * <p>
 * 对 <code>Cesium3DTileFeature</code> 对象的修改具有瓦片内容的生命周期。如果瓦片的内容被卸载，例如，由于它超出视野并需要
 * 在缓存中释放空间以容纳可见的瓦片，请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何
 * 修改。同时监听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造此对象。请通过 {@link Cesium3DTileContent#getFeature}
 * 或使用 {@link Scene#pick} 进行选择访问它。
 * </p>
 *
 * @alias Cesium3DTileFeature
 * @constructor
 *
 * @example
 * // On mouse over, display all the properties for a feature in the console log.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
function Cesium3DTileFeature(content, batchId) {
  this._content = content;
  this._batchId = batchId;
  this._color = undefined; // for calling getColor
}

Object.defineProperties(Cesium3DTileFeature.prototype, {
  /**
   * 获取或设置特征是否可见。当评估样式的显示属性时，将为所有特征设置此值。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._content.batchTable.getShow(this._batchId);
    },
    set: function (value) {
      this._content.batchTable.setShow(this._batchId, value);
    },
  },

  /**
   * 获取或设置与特征颜色相乘的高亮颜色。当它为白色时，特征的颜色不会改变。当评估样式的颜色时，将为所有特征设置此值。
   *
   * @memberof Cesium3DTileFeature.prototype
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
      return this._content.batchTable.getColor(this._batchId, this._color);
    },
    set: function (value) {
      this._content.batchTable.setColor(this._batchId, value);
    },
  },

  /**
   * 获取包含多线段的ECEF位置的类型化数组。如果 {@link Cesium3DTileset#vectorKeepDecodedPositions} 为 false
   * 或特征不是向量瓦片中的多线段，则返回 undefined。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
   *
   * @type {Float64Array}
   */

  polylinePositions: {
    get: function () {
      if (!defined(this._content.getPolylinePositions)) {
        return undefined;
      }

      return this._content.getPolylinePositions(this._batchId);
    },
  },

  /**
   * 获取包含该特征的瓦片内容。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileContent}
   *
   * @readonly
   * @private
   */

  content: {
    get: function () {
      return this._content;
    },
  },

  /**
   * 获取包含该特征的瓦片集。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */

  tileset: {
    get: function () {
      return this._content.tileset;
    },
  },

  /**
   * 所有由 {@link Scene#pick} 返回的对象都有一个 <code>primitive</code> 属性。该属性返回
   * 包含该特征的瓦片集。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */

  primitive: {
    get: function () {
      return this._content.tileset;
    },
  },

  /**
   * 获取与此特征关联的特征 ID。对于 3D Tiles 1.0，返回批处理 ID。对于 EXT_mesh_features，这是来自
   * 选定特征 ID 集的特征 ID。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {number}
   *
   * @readonly
   * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
   */

  featureId: {
    get: function () {
      return this._batchId;
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function () {
      return this._content.batchTable.getPickColor(this._batchId);
    },
  },
});

/**
 * 返回特征是否包含此属性。这包括在使用批处理表层次结构时来自该特征类及继承类的属性。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string} name 属性的区分大小写名称。
 * @returns {boolean} 特征是否包含此属性。
 */

Cesium3DTileFeature.prototype.hasProperty = function (name) {
  return this._content.batchTable.hasProperty(this._batchId, name);
};

/**
 * 返回特征的属性 ID 数组。这包括在使用批处理表层次结构时来自该特征类及继承类的属性。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string[]} [results] 存储结果的数组。
 * @returns {string[]} 特征属性的 ID。
 */

Cesium3DTileFeature.prototype.getPropertyIds = function (results) {
  return this._content.batchTable.getPropertyIds(this._batchId, results);
};

/**
 * 返回具有给定名称的特征属性值的副本。这包括在使用批处理表层次结构时来自该特征类及继承类的属性。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string} name 属性的区分大小写名称。
 * @returns {*} 属性的值，如果特征没有此属性，则返回 <code>undefined</code>。
 *
 * @example
 * // Display all the properties for a feature in the console log.
 * const propertyIds = feature.getPropertyIds();
 * const length = propertyIds.length;
 * for (let i = 0; i < length; ++i) {
 *     const propertyId = propertyIds[i];
 *     console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 * }
 */
Cesium3DTileFeature.prototype.getProperty = function (name) {
  return this._content.batchTable.getProperty(this._batchId, name);
};

/**
 * 返回具有给定名称的特征属性的副本，检查来自3D Tiles 1.0 格式、EXT_structural_metadata 和遗留的
 * EXT_feature_metadata glTF 扩展的所有元数据，以及在
 * 瓦片集 JSON（3D Tiles 1.1）或 3DTILES_metadata 3D Tiles 扩展中存在的元数据。
 * 元数据按照从最具体到最一般的顺序检查，返回第一个匹配项。元数据检查的顺序为：
 *
 * <ol>
 *   <li>按语义的批处理表（结构元数据）属性</li>
 *   <li>按属性 ID 的批处理表（结构元数据）属性</li>
 *   <li>按语义的内容元数据属性</li>
 *   <li>按属性的内容元数据属性</li>
 *   <li>按语义的瓦片元数据属性</li>
 *   <li>按属性 ID 的瓦片元数据属性</li>
 *   <li>按语义的子树元数据属性</li>
 *   <li>按属性 ID 的子树元数据属性</li>
 *   <li>按语义的组元数据属性</li>
 *   <li>按属性 ID 的组元数据属性</li>
 *   <li>按语义的瓦片集元数据属性</li>
 *   <li>按属性 ID 的瓦片集元数据属性</li>
 *   <li>否则，返回 undefined</li>
 * </ol>
 * <p>
 * 有关 3D Tiles Next 的详细信息，请参见 {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_metadata|3DTILES_metadata 扩展}
 * 以及 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata 扩展}
 * 的 glTF。有关遗留 glTF 扩展的信息，请参见 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata|EXT_feature_metadata 扩展}
 * </p>
 *
 * @param {Cesium3DTileContent} content 用于访问元数据的内容
 * @param {number} batchId 要获取属性的特征的批处理 ID（或特征 ID）
 * @param {string} name 特征的语义或属性 ID。语义在每个元数据细分中优先于属性 ID 进行检查。
 * @return {*} 属性的值，如果特征没有此属性，则返回 <code>undefined</code>。
 *
 * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
 */

Cesium3DTileFeature.getPropertyInherited = function (content, batchId, name) {
  const batchTable = content.batchTable;
  if (defined(batchTable)) {
    if (batchTable.hasPropertyBySemantic(batchId, name)) {
      return batchTable.getPropertyBySemantic(batchId, name);
    }

    if (batchTable.hasProperty(batchId, name)) {
      return batchTable.getProperty(batchId, name);
    }
  }

  const contentMetadata = content.metadata;
  if (defined(contentMetadata)) {
    if (contentMetadata.hasPropertyBySemantic(name)) {
      return contentMetadata.getPropertyBySemantic(name);
    }

    if (contentMetadata.hasProperty(name)) {
      return contentMetadata.getProperty(name);
    }
  }

  const tile = content.tile;
  const tileMetadata = tile.metadata;
  if (defined(tileMetadata)) {
    if (tileMetadata.hasPropertyBySemantic(name)) {
      return tileMetadata.getPropertyBySemantic(name);
    }

    if (tileMetadata.hasProperty(name)) {
      return tileMetadata.getProperty(name);
    }
  }

  let subtreeMetadata;
  if (defined(tile.implicitSubtree)) {
    subtreeMetadata = tile.implicitSubtree.metadata;
  }

  if (defined(subtreeMetadata)) {
    if (subtreeMetadata.hasPropertyBySemantic(name)) {
      return subtreeMetadata.getPropertyBySemantic(name);
    }

    if (subtreeMetadata.hasProperty(name)) {
      return subtreeMetadata.getProperty(name);
    }
  }

  const groupMetadata = defined(content.group)
    ? content.group.metadata
    : undefined;
  if (defined(groupMetadata)) {
    if (groupMetadata.hasPropertyBySemantic(name)) {
      return groupMetadata.getPropertyBySemantic(name);
    }

    if (groupMetadata.hasProperty(name)) {
      return groupMetadata.getProperty(name);
    }
  }

  const tilesetMetadata = content.tileset.metadata;
  if (defined(tilesetMetadata)) {
    if (tilesetMetadata.hasPropertyBySemantic(name)) {
      return tilesetMetadata.getPropertyBySemantic(name);
    }

    if (tilesetMetadata.hasProperty(name)) {
      return tilesetMetadata.getProperty(name);
    }
  }

  return undefined;
};

/**
 * 返回具有给定名称的特征属性值的副本。
 * 如果特征位于具有元数据（3D Tiles 1.1）的瓦片集中
 * 或使用 <code>3DTILES_metadata</code> 扩展，则瓦片集、组和瓦片
 * 元数据会被继承。
 * <p>
 * 为了解决名称冲突，此方法按元数据粒度从最具体到最不具体的顺序解决名称：
 * 特征、瓦片、组、瓦片集。在每个粒度中，首先解析语义，然后是其他属性。
 * </p>
 * @param {string} name 属性的区分大小写名称。
 * @returns {*} 属性的值，如果特征没有此属性，则返回 <code>undefined</code>。
 * @private
 */

Cesium3DTileFeature.prototype.getPropertyInherited = function (name) {
  return Cesium3DTileFeature.getPropertyInherited(
    this._content,
    this._batchId,
    name,
  );
};

/**
 * 设置具有给定名称的特征属性的值。
 * <p>
 * 如果不存在具有给定名称的属性，则会创建该属性。
 * </p>
 *
 * @param {string} name 属性的区分大小写名称。
 * @param {*} value 将被复制的属性值。
 *
 * @exception {DeveloperError} 继承的批处理表层次属性是只读的。
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
Cesium3DTileFeature.prototype.setProperty = function (name, value) {
  this._content.batchTable.setProperty(this._batchId, name, value);

  // PERFORMANCE_IDEA: Probably overkill, but maybe only mark the tile dirty if the
  // property is in one of the style's expressions or - if it can be done quickly -
  // if the new property value changed the result of an expression.
  this._content.featurePropertiesDirty = true;
};

/**
 * 返回特征的类名是否等于 <code>className</code>。与 {@link Cesium3DTileFeature#isClass} 不同，
 * 此函数仅检查特征的确切类，而不检查继承类。
 * <p>
 * 如果不存在批处理表层次， 此函数返回 <code>false</code>。
 * </p>
 *
 * @param {string} className 要检查的名称。
 * @returns {boolean} 特征的类名是否等于 <code>className</code>
 *
 * @private
 */

Cesium3DTileFeature.prototype.isExactClass = function (className) {
  return this._content.batchTable.isExactClass(this._batchId, className);
};

/**
 * 返回特征的类或任何继承类是否被命名为 <code>className</code>。
 * <p>
 * 如果不存在批处理表层次，此函数返回 <code>false</code>。
 * </p>
 *
 * @param {string} className 要检查的名称。
 * @returns {boolean} 特征的类或继承类是否被命名为 <code>className</code>
 *
 * @private
 */

Cesium3DTileFeature.prototype.isClass = function (className) {
  return this._content.batchTable.isClass(this._batchId, className);
};

/**
 * 返回特征的类名。
 * <p>
 * 如果不存在批处理表层次，此函数返回 <code>undefined</code>。
 * </p>
 *
 * @returns {string} 特征的类名。
 *
 * @private
 */

Cesium3DTileFeature.prototype.getExactClassName = function () {
  return this._content.batchTable.getExactClassName(this._batchId);
};
export default Cesium3DTileFeature;
