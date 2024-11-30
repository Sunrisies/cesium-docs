import Cartesian4 from "../Core/Cartesian4.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import Cesium3DTileset from "./Cesium3DTileset.js";
import I3SNode from "./I3SNode.js";
import I3SSymbology from "./I3SSymbology.js";

/**
 * 该类实现了 I3S 图层。在 CesiumJS 中，每个 I3SLayer 创建一个 Cesium3DTileset。
 * <p>
 * 不要直接构造此类，而是通过 {@link I3SDataProvider} 访问图层。
 * </p>
 * @alias I3SLayer
 * @internalConstructor
 * @privateParam {I3SDataProvider} dataProvider I3S 数据提供者
 * @privateParam {object} layerData 从场景图层加载的图层数据
 * @privateParam {I3SDataProvider|I3SSublayer} parent 该图层的父节点
 */

function I3SLayer(dataProvider, layerData, parent) {
  this._dataProvider = dataProvider;
  this._parent = parent;

  if (!defined(layerData.href) && defined(layerData.id)) {
    // assign a default layer
    layerData.href = `layers/${layerData.id}`;
  }

  const parentUrl = this._parent.resource.getUrlComponent();

  let tilesetUrl = "";
  if (parentUrl.match(/layers\/\d/)) {
    tilesetUrl = `${parentUrl}`.replace(/\/+$/, "");
  } else {
    // Add '/' to url if needed + `${layerData.href}` if tilesetUrl not already in ../layers/[id] format
    tilesetUrl = `${parentUrl}`
      .replace(/\/?$/, "/")
      .concat(`${layerData.href}`);
  }

  this._version = layerData.store.version;
  const splitVersion = this._version.split(".");
  this._majorVersion = parseInt(splitVersion[0]);
  this._minorVersion = splitVersion.length > 1 ? parseInt(splitVersion[1]) : 0;

  this._resource = new Resource({ url: tilesetUrl });
  this._resource.setQueryParameters(
    this._dataProvider.resource.queryParameters,
  );
  this._resource.appendForwardSlash();
  this._data = layerData;
  this._rootNode = undefined;
  this._nodePages = {};
  this._nodePageFetches = {};
  this._extent = undefined;
  this._tileset = undefined;
  this._geometryDefinitions = undefined;
  this._filters = [];
  this._symbology = undefined;

  this._computeGeometryDefinitions(true);
  this._computeExtent();
}

Object.defineProperties(I3SLayer.prototype, {
  /**
   * 获取图层的资源。
   * @memberof I3SLayer.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },

  /**
   * 获取此图层的根节点。
   * @memberof I3SLayer.prototype
   * @type {I3SNode}
   * @readonly
   */
  rootNode: {
    get: function () {
      return this._rootNode;
    },
  },
  /**
   * 获取此图层的 Cesium3DTileset。
   * @memberof I3SLayer.prototype
   * @type {Cesium3DTileset|undefined}
   * @readonly
   */
  tileset: {
    get: function () {
      return this._tileset;
    },
  },
  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SLayer.prototype
   * @type {object}
   * @readonly
   */
  data: {
    get: function () {
      return this._data;
    },
  },

  /**
   * 加载的 I3S 数据集的版本字符串
   * @memberof I3SLayer.prototype
   * @type {string}
   * @readonly
   */
  version: {
    get: function () {
      return this._version;
    },
  },

  /**
   * 加载的 I3S 数据集的主要版本号
   * @memberof I3SLayer.prototype
   * @type {number}
   * @readonly
   */
  majorVersion: {
    get: function () {
      return this._majorVersion;
    },
  },

  /**
   * 加载的 I3S 数据集的次要版本号
   * @memberof I3SLayer.prototype
   * @type {number}
   * @readonly
   */
  minorVersion: {
    get: function () {
      return this._minorVersion;
    },
  },

  /**
   * 如果为 <code>true</code>，则表示加载的 I3S 版本为 1.6 或更早版本
   * @memberof I3SLayer.prototype
   * @type {boolean}
   * @readonly
   */
  legacyVersion16: {
    get: function () {
      if (!defined(this.version)) {
        return undefined;
      }
      if (
        this.majorVersion < 1 ||
        (this.majorVersion === 1 && this.minorVersion <= 6)
      ) {
        return true;
      }
      return false;
    },
  },
});


/**
 * 加载内容，包括根节点定义及其子节点
 * @param {Cesium3DTileset.ConstructorOptions} [cesium3dTilesetOptions] Cesium3D Tileset 构造函数的选项
 * @returns {Promise<void>} 当图层数据加载完成时解析的 Promise
 * @private
 */

I3SLayer.prototype.load = async function (cesium3dTilesetOptions) {
  if (this._data.spatialReference.wkid !== 4326) {
    throw new RuntimeError(
      `Unsupported spatial reference: ${this._data.spatialReference.wkid}`,
    );
  }

  if (this._dataProvider.applySymbology) {
    this._symbology = new I3SSymbology(this);
  }
  await this._dataProvider.loadGeoidData();
  await this._loadRootNode(cesium3dTilesetOptions);
  await this._create3DTileset(cesium3dTilesetOptions);

  this._rootNode._tile = this._tileset._root;
  this._tileset._root._i3sNode = this._rootNode;
  if (this.legacyVersion16) {
    return this._rootNode._loadChildren();
  }
};

/**
 * @private
 */
I3SLayer.prototype._computeGeometryDefinitions = function (useCompression) {
  // create a table of all geometry buffers based on
  // the number of attributes and whether they are
  // compressed or not, sort them by priority

  this._geometryDefinitions = [];

  if (defined(this._data.geometryDefinitions)) {
    for (
      let defIndex = 0;
      defIndex < this._data.geometryDefinitions.length;
      defIndex++
    ) {
      const geometryBuffersInfo = [];
      const geometryBuffers =
        this._data.geometryDefinitions[defIndex].geometryBuffers;

      for (let bufIndex = 0; bufIndex < geometryBuffers.length; bufIndex++) {
        const geometryBuffer = geometryBuffers[bufIndex];
        const collectedAttributes = [];
        let compressed = false;

        if (defined(geometryBuffer.compressedAttributes) && useCompression) {
          // check if compressed
          compressed = true;
          const attributes = geometryBuffer.compressedAttributes.attributes;
          for (let i = 0; i < attributes.length; i++) {
            collectedAttributes.push(attributes[i]);
          }
        } else {
          // uncompressed attributes
          for (const attribute in geometryBuffer) {
            if (attribute !== "offset") {
              collectedAttributes.push(attribute);
            }
          }
        }

        geometryBuffersInfo.push({
          compressed: compressed,
          attributes: collectedAttributes,
          index: geometryBuffers.indexOf(geometryBuffer),
        });
      }

      // rank the buffer info
      geometryBuffersInfo.sort(function (a, b) {
        if (a.compressed && !b.compressed) {
          return -1;
        } else if (!a.compressed && b.compressed) {
          return 1;
        }
        return a.attributes.length - b.attributes.length;
      });
      this._geometryDefinitions.push(geometryBuffersInfo);
    }
  }
};

/**
 * @private
 */
I3SLayer.prototype._findBestGeometryBuffers = function (
  definition,
  attributes,
) {
  // find the most appropriate geometry definition
  // based on the required attributes, and by favouring
  // compression to improve bandwidth requirements

  const geometryDefinition = this._geometryDefinitions[definition];

  if (defined(geometryDefinition)) {
    for (let index = 0; index < geometryDefinition.length; ++index) {
      const geometryBufferInfo = geometryDefinition[index];
      let missed = false;
      const geometryAttributes = geometryBufferInfo.attributes;
      for (let attrIndex = 0; attrIndex < attributes.length; attrIndex++) {
        if (!geometryAttributes.includes(attributes[attrIndex])) {
          missed = true;
          break;
        }
      }
      if (!missed) {
        return {
          bufferIndex: geometryBufferInfo.index,
          definition: geometryDefinition,
          geometryBufferInfo: geometryBufferInfo,
        };
      }
    }
    // If no match found return first geometryBuffer
    if (defined(geometryDefinition[0])) {
      return {
        bufferIndex: 0,
        definition: geometryDefinition,
        geometryBufferInfo: geometryDefinition[0],
      };
    }
  }
};

/**
 * @private
 */
I3SLayer.prototype._loadRootNode = function (cesium3dTilesetOptions) {
  if (defined(this._data.nodePages)) {
    let rootIndex = 0;
    if (defined(this._data.nodePages.rootIndex)) {
      rootIndex = this._data.nodePages.rootIndex;
    }
    this._rootNode = new I3SNode(this, rootIndex, true);
  } else {
    this._rootNode = new I3SNode(this, this._data.store.rootNode, true);
  }

  return this._rootNode.load(cesium3dTilesetOptions);
};

/**
 * @private
 */
I3SLayer.prototype._getNodeInNodePages = function (nodeIndex) {
  const index = Math.floor(nodeIndex / this._data.nodePages.nodesPerPage);
  const offsetInPage = nodeIndex % this._data.nodePages.nodesPerPage;
  return this._loadNodePage(index).then(function (data) {
    return data.nodes[offsetInPage];
  });
};

/**
 * @private
 */
I3SLayer._fetchJson = function (resource) {
  return resource.fetchJson();
};

/**
 * @private
 */
I3SLayer.prototype._loadNodePage = function (page) {
  const that = this;

  // If node page was already requested return the same promise
  if (!defined(this._nodePageFetches[page])) {
    const nodePageResource = this.resource.getDerivedResource({
      url: `nodepages/${page}/`,
    });
    const fetchPromise = I3SLayer._fetchJson(nodePageResource).then(
      function (data) {
        if (defined(data.error) && data.error.code !== 200) {
          return Promise.reject(data.error);
        }

        that._nodePages[page] = data.nodes;
        return data;
      },
    );

    this._nodePageFetches[page] = fetchPromise;
  }

  return this._nodePageFetches[page];
};

/**
 * @private
 */
I3SLayer.prototype._computeExtent = function () {
  if (defined(this._data.fullExtent)) {
    this._extent = Rectangle.fromDegrees(
      this._data.fullExtent.xmin,
      this._data.fullExtent.ymin,
      this._data.fullExtent.xmax,
      this._data.fullExtent.ymax,
    );
  } else if (defined(this._data.store.extent)) {
    this._extent = Rectangle.fromDegrees(
      this._data.store.extent[0],
      this._data.store.extent[1],
      this._data.store.extent[2],
      this._data.store.extent[3],
    );
  }
};

/**
 * @private
 */
I3SLayer.prototype._create3DTileset = async function (cesium3dTilesetOptions) {
  const inPlaceTileset = {
    asset: {
      version: "1.0",
    },
    geometricError: Number.MAX_VALUE,
    root: this._rootNode._create3DTileDefinition(),
  };

  const tilesetBlob = new Blob([JSON.stringify(inPlaceTileset)], {
    type: "application/json",
  });

  const tilesetUrl = URL.createObjectURL(tilesetBlob);
  const outlineColor = this._symbology?.defaultSymbology?.edges?.color;
  if (defined(outlineColor) && !defined(cesium3dTilesetOptions?.outlineColor)) {
    cesium3dTilesetOptions = defined(cesium3dTilesetOptions)
      ? clone(cesium3dTilesetOptions)
      : {};
    cesium3dTilesetOptions.outlineColor = Color.fromCartesian4(
      Cartesian4.fromArray(outlineColor),
    );
  }
  this._tileset = await Cesium3DTileset.fromUrl(
    tilesetUrl,
    cesium3dTilesetOptions,
  );
  this._tileset.show = this._parent.show;
  this._tileset._isI3STileSet = true;
  this._tileset.tileUnload.addEventListener(function (tile) {
    tile._i3sNode._clearGeometryData();
    URL.revokeObjectURL(tile._contentResource._url);
    tile._contentResource = tile._i3sNode.resource;
  });

  this._tileset.tileVisible.addEventListener(function (tile) {
    if (defined(tile._i3sNode)) {
      tile._i3sNode._loadChildren();
    }
  });
};

/**
 * @private
 */
I3SLayer.prototype._updateVisibility = function () {
  if (defined(this._tileset)) {
    this._tileset.show = this._parent.show;
  }
};

/**
 * 将图层的绘制元素过滤到特定的属性名称和值。
 * @param {I3SNode.AttributeFilter[]} [filters=[]] 属性过滤器的集合。
 * @returns {Promise<void>} 在应用过滤器时解析的承诺。
 */

I3SLayer.prototype.filterByAttributes = function (filters) {
  // Filters are applied for each node in the layer when the node model is loaded
  this._filters = defined(filters) ? clone(filters, true) : [];

  // Forced filtering is required for loaded nodes only
  const rootNode = this._rootNode;
  if (defined(rootNode)) {
    return rootNode._filterFeatures();
  }
  return Promise.resolve();
};

export default I3SLayer;
