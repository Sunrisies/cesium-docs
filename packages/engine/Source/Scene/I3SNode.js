import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import HeadingPitchRoll from "../Core/HeadingPitchRoll.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import Quaternion from "../Core/Quaternion.js";
import Transforms from "../Core/Transforms.js";
import Cesium3DTile from "./Cesium3DTile.js";
import I3SDataProvider from "./I3SDataProvider.js";
import I3SDecoder from "./I3SDecoder.js";
import I3SFeature from "./I3SFeature.js";
import I3SField from "./I3SField.js";
import I3SGeometry from "./I3SGeometry.js";

/**
 * @typedef {object} I3SNode.AttributeFilter
 *
 * 通过属性名称和值给出的过滤器。
 * 如果 3D 特征对象的属性值未在值集合中指定，则应隐藏该特征对象。
 *
 * @property {string} name 属性名称
 * @property {string[]|number[]} values 值的集合
 */

/**
 * 该类实现了 I3S 节点。在 CesiumJS 中，每个 I3SNode 创建一个 Cesium3DTile。
 * <p>
 * 不要直接构造此类，而是通过 {@link I3SLayer} 访问图块。
 * </p>
 * @alias I3SNode
 * @internalConstructor
 */

function I3SNode(parent, ref, isRoot) {
  let level;
  let layer;
  let nodeIndex;
  let resource;

  if (isRoot) {
    level = 0;
    layer = parent;
  } else {
    level = parent._level + 1;
    layer = parent._layer;
  }

  if (typeof ref === "number") {
    nodeIndex = ref;
  } else {
    resource = parent.resource.getDerivedResource({
      url: `${ref}/`,
    });
  }

  this._parent = parent;
  this._dataProvider = parent._dataProvider;
  this._isRoot = isRoot;
  this._level = level;
  this._layer = layer;
  this._nodeIndex = nodeIndex;
  this._resource = resource;
  this._isLoading = false;

  this._tile = undefined;
  this._data = undefined;
  this._geometryData = [];
  this._featureData = [];
  this._fields = {};
  this._children = [];
  this._childrenReadyPromise = undefined;
  this._globalTransform = undefined;
  this._inverseGlobalTransform = undefined;
  this._inverseRotationMatrix = undefined;
  this._symbologyData = undefined;
}

Object.defineProperties(I3SNode.prototype, {
  /**
   * 获取节点的资源。
   * @memberof I3SNode.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },
  /**
   * 获取父层。
   * @memberof I3SNode.prototype
   * @type {I3SLayer}
   * @readonly
   */
  layer: {
    get: function () {
      return this._layer;
    },
  },
  /**
   * 获取父节点。
   * @memberof I3SNode.prototype
   * @type {I3SNode|undefined}
   * @readonly
   */
  parent: {
    get: function () {
      return this._parent;
    },
  },
  /**
   * 获取子节点。
   * @memberof I3SNode.prototype
   * @type {I3SNode[]}
   * @readonly
   */
  children: {
    get: function () {
      return this._children;
    },
  },
  /**
   * 获取几何体集合。
   * @memberof I3SNode.prototype
   * @type {I3SGeometry[]}
   * @readonly
   */
  geometryData: {
    get: function () {
      return this._geometryData;
    },
  },
  /**
   * 获取特征集合。
   * @memberof I3SNode.prototype
   * @type {I3SFeature[]}
   * @readonly
   */
  featureData: {
    get: function () {
      return this._featureData;
    },
  },
  /**
   * 获取字段集合。
   * @memberof I3SNode.prototype
   * @type {I3SField[]}
   * @readonly
   */
  fields: {
    get: function () {
      return this._fields;
    },
  },
  /**
   * 获取此节点的 Cesium3DTile。
   * @memberof I3SNode.prototype
   * @type {Cesium3DTile}
   * @readonly
   */
  tile: {
    get: function () {
      return this._tile;
    },
  },
  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SNode.prototype
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
 * @private
 */
I3SNode.prototype.load = async function () {
  const that = this;

  function processData() {
    if (!that._isRoot) {
      // Create a new tile
      const tileDefinition = that._create3DTileDefinition();

      that._tile = new Cesium3DTile(
        that._layer._tileset,
        that._dataProvider.resource,
        tileDefinition,
        that._parent._tile,
      );

      that._tile._i3sNode = that;
    }
  }

  // If we don't have a nodepage index load from json
  if (!defined(this._nodeIndex)) {
    const data = await I3SDataProvider.loadJson(this._resource);
    that._data = data;
    processData();
    return;
  }

  const node = await this._layer._getNodeInNodePages(this._nodeIndex);
  that._data = node;
  let uri;
  if (that._isRoot) {
    uri = "nodes/root/";
  } else if (defined(node.mesh)) {
    const uriIndex = node.mesh.geometry.resource;
    uri = `../${uriIndex}/`;
  }
  if (defined(uri) && defined(that._parent.resource)) {
    that._resource = that._parent.resource.getDerivedResource({ url: uri });
  }

  processData();
};

function createAndLoadField(node, storageInfo) {
  const newField = new I3SField(node, storageInfo);
  node._fields[storageInfo.name] = newField;
  return newField.load();
}

/**
 * 加载节点的字段。
 * @returns {Promise<void>} 当 I3S 节点字段加载完成时解析的 Promise
 */

I3SNode.prototype.loadFields = function () {
  // Check if we must load fields
  const fields = this._layer._data.attributeStorageInfo;

  const promises = [];
  if (defined(fields)) {
    for (let i = 0; i < fields.length; i++) {
      const storageInfo = fields[i];
      const field = this._fields[storageInfo.name];
      if (defined(field)) {
        promises.push(field.load());
      } else {
        promises.push(createAndLoadField(this, storageInfo));
      }
    }
  }

  return Promise.all(promises);
};

/**
 * 加载节点字段。
 * @param {string} name 字段名称
 * @returns {Promise<void>} 当 I3S 节点字段加载完成时解析的 Promise
 */

I3SNode.prototype.loadField = function (name) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("name", name);
  //>>includeEnd('debug');

  const field = this._fields[name];
  if (defined(field)) {
    return field.load();
  }

  const fields = this._layer._data.attributeStorageInfo;
  if (defined(fields)) {
    for (let i = 0; i < fields.length; i++) {
      const storageInfo = fields[i];
      if (storageInfo.name === name) {
        return createAndLoadField(this, storageInfo);
      }
    }
  }

  return Promise.resolve();
};

/**
 * 返回给定选中位置的字段
 * @param {Cartesian3} pickedPosition 被选中的位置
 * @returns {object} 包含字段名称及其值的对象
 */

I3SNode.prototype.getFieldsForPickedPosition = function (pickedPosition) {
  const geometry = this.geometryData[0];
  if (!defined(geometry.customAttributes.featureIndex)) {
    return {};
  }

  const location = geometry.getClosestPointIndexOnTriangle(
    pickedPosition.x,
    pickedPosition.y,
    pickedPosition.z,
  );

  if (
    location.index === -1 ||
    location.index > geometry.customAttributes.featureIndex.length
  ) {
    return {};
  }

  const featureIndex = geometry.customAttributes.featureIndex[location.index];
  return this.getFieldsForFeature(featureIndex);
};
/**
 * 返回给定特征的字段
 * @param {number} featureIndex 要获取其属性的特征索引
 * @returns {object} 包含字段名称及其值的对象
 */

I3SNode.prototype.getFieldsForFeature = function (featureIndex) {
  const featureFields = {};
  for (const fieldName in this.fields) {
    if (this.fields.hasOwnProperty(fieldName)) {
      const field = this.fields[fieldName];
      if (featureIndex >= 0 && featureIndex < field.values.length) {
        featureFields[field.name] = field.values[featureIndex];
      }
    }
  }
  return featureFields;
};

/**
 * @private
 */
I3SNode.prototype._loadChildren = function () {
  const that = this;
  // If the promise for loading the children was already created, just return it
  if (defined(this._childrenReadyPromise)) {
    return this._childrenReadyPromise;
  }

  const childPromises = [];
  if (defined(that._data.children)) {
    for (
      let childIndex = 0;
      childIndex < that._data.children.length;
      childIndex++
    ) {
      const child = that._data.children[childIndex];
      const newChild = new I3SNode(
        that,
        defaultValue(child.href, child),
        false,
      );
      that._children.push(newChild);
      childPromises.push(newChild.load());
    }
  }

  this._childrenReadyPromise = Promise.all(childPromises).then(function () {
    for (let i = 0; i < that._children.length; i++) {
      that._tile.children.push(that._children[i]._tile);
    }
  });

  return this._childrenReadyPromise;
};

/**
 * @private
 */
I3SNode.prototype._loadGeometryData = function () {
  const geometryPromises = [];

  // To debug decoding for a specific tile, add a condition
  // that wraps this if/else to match the tile uri
  if (defined(this._data.geometryData)) {
    for (
      let geomIndex = 0;
      geomIndex < this._data.geometryData.length;
      geomIndex++
    ) {
      const curGeometryData = new I3SGeometry(
        this,
        this._data.geometryData[geomIndex].href,
      );
      this._geometryData.push(curGeometryData);
      geometryPromises.push(curGeometryData.load());
    }
  } else if (defined(this._data.mesh)) {
    const geometryDefinition = this._layer._findBestGeometryBuffers(
      this._data.mesh.geometry.definition,
      ["position", "uv0"],
    );

    const geometryURI = `./geometries/${geometryDefinition.bufferIndex}/`;
    const newGeometryData = new I3SGeometry(this, geometryURI);
    newGeometryData._geometryDefinitions = geometryDefinition.definition;
    newGeometryData._geometryBufferInfo = geometryDefinition.geometryBufferInfo;
    this._geometryData.push(newGeometryData);
    geometryPromises.push(newGeometryData.load());
  }

  return Promise.all(geometryPromises);
};

/**
 * @private
 */
I3SNode.prototype._loadFeatureData = function () {
  const featurePromises = [];

  // To debug decoding for a specific tile, add a condition
  // that wraps this if/else to match the tile uri
  if (defined(this._data.featureData)) {
    for (
      let featureIndex = 0;
      featureIndex < this._data.featureData.length;
      featureIndex++
    ) {
      const newFeatureData = new I3SFeature(
        this,
        this._data.featureData[featureIndex].href,
      );
      this._featureData.push(newFeatureData);
      featurePromises.push(newFeatureData.load());
    }
  }

  return Promise.all(featurePromises);
};

/**
 * @private
 */
I3SNode.prototype._clearGeometryData = function () {
  this._geometryData = [];
};

/**
 * @private
 */
I3SNode.prototype._create3DTileDefinition = function () {
  const obb = this._data.obb;
  const mbs = this._data.mbs;

  if (!defined(obb) && !defined(mbs)) {
    console.error("Failed to load I3S node. Bounding volume is required.");
    return undefined;
  }

  let geoPosition;

  if (defined(obb)) {
    geoPosition = Cartographic.fromDegrees(
      obb.center[0],
      obb.center[1],
      obb.center[2],
    );
  } else {
    geoPosition = Cartographic.fromDegrees(mbs[0], mbs[1], mbs[2]);
  }

  // Offset bounding box position if we have a geoid service defined
  if (defined(this._dataProvider._geoidDataList) && defined(geoPosition)) {
    for (let i = 0; i < this._dataProvider._geoidDataList.length; i++) {
      const tile = this._dataProvider._geoidDataList[i];
      const projectedPos = tile.projection.project(geoPosition);
      if (
        projectedPos.x > tile.nativeExtent.west &&
        projectedPos.x < tile.nativeExtent.east &&
        projectedPos.y > tile.nativeExtent.south &&
        projectedPos.y < tile.nativeExtent.north
      ) {
        geoPosition.height += sampleGeoid(projectedPos.x, projectedPos.y, tile);
        break;
      }
    }
  }

  let boundingVolume = {};
  let position;
  let span = 0;
  if (defined(obb)) {
    boundingVolume = {
      box: [
        0,
        0,
        0,
        obb.halfSize[0],
        0,
        0,
        0,
        obb.halfSize[1],
        0,
        0,
        0,
        obb.halfSize[2],
      ],
    };
    span = Math.max(
      Math.max(this._data.obb.halfSize[0], this._data.obb.halfSize[1]),
      this._data.obb.halfSize[2],
    );
    position = Ellipsoid.WGS84.cartographicToCartesian(geoPosition);
  } else {
    boundingVolume = {
      sphere: [0, 0, 0, mbs[3]],
    };
    position = Ellipsoid.WGS84.cartographicToCartesian(geoPosition);
    span = this._data.mbs[3];
  }
  span *= 2;
  // Compute the geometric error
  let metersPerPixel = Infinity;

  // Get the meters/pixel density required to pop the next LOD
  if (defined(this._data.lodThreshold)) {
    if (
      this._layer._data.nodePages.lodSelectionMetricType ===
      "maxScreenThresholdSQ"
    ) {
      const maxScreenThreshold = Math.sqrt(
        this._data.lodThreshold / (Math.PI * 0.25),
      );
      metersPerPixel = span / maxScreenThreshold;
    } else if (
      this._layer._data.nodePages.lodSelectionMetricType ===
      "maxScreenThreshold"
    ) {
      const maxScreenThreshold = this._data.lodThreshold;
      metersPerPixel = span / maxScreenThreshold;
    } else {
      // Other LOD selection types can only be used for point cloud data
      console.error("Invalid lodSelectionMetricType in Layer");
    }
  } else if (defined(this._data.lodSelection)) {
    for (
      let lodIndex = 0;
      lodIndex < this._data.lodSelection.length;
      lodIndex++
    ) {
      if (
        this._data.lodSelection[lodIndex].metricType === "maxScreenThreshold"
      ) {
        metersPerPixel = span / this._data.lodSelection[lodIndex].maxError;
      }
    }
  }

  if (metersPerPixel === Infinity) {
    metersPerPixel = 100000;
  }

  // Calculate the length of 16 pixels in order to trigger the screen space error
  const geometricError = metersPerPixel * 16;

  // Transformations
  const hpr = new HeadingPitchRoll(0, 0, 0);
  let orientation = Transforms.headingPitchRollQuaternion(position, hpr);

  if (defined(this._data.obb)) {
    orientation = new Quaternion(
      this._data.obb.quaternion[0],
      this._data.obb.quaternion[1],
      this._data.obb.quaternion[2],
      this._data.obb.quaternion[3],
    );
  }

  const rotationMatrix = Matrix3.fromQuaternion(orientation);
  const inverseRotationMatrix = Matrix3.inverse(rotationMatrix, new Matrix3());

  const globalTransform = new Matrix4(
    rotationMatrix[0],
    rotationMatrix[1],
    rotationMatrix[2],
    0,
    rotationMatrix[3],
    rotationMatrix[4],
    rotationMatrix[5],
    0,
    rotationMatrix[6],
    rotationMatrix[7],
    rotationMatrix[8],
    0,
    position.x,
    position.y,
    position.z,
    1,
  );

  const inverseGlobalTransform = Matrix4.inverse(
    globalTransform,
    new Matrix4(),
  );

  const localTransform = Matrix4.clone(globalTransform);

  if (defined(this._parent._globalTransform)) {
    Matrix4.multiply(
      globalTransform,
      this._parent._inverseGlobalTransform,
      localTransform,
    );
  }

  this._globalTransform = globalTransform;
  this._inverseGlobalTransform = inverseGlobalTransform;
  this._inverseRotationMatrix = inverseRotationMatrix;

  // get children definition
  const childrenDefinition = [];
  for (let childIndex = 0; childIndex < this._children.length; childIndex++) {
    childrenDefinition.push(
      this._children[childIndex]._create3DTileDefinition(),
    );
  }

  // Create a tile set
  const inPlaceTileDefinition = {
    children: childrenDefinition,
    refine: "REPLACE",
    boundingVolume: boundingVolume,
    transform: [
      localTransform[0],
      localTransform[4],
      localTransform[8],
      localTransform[12],
      localTransform[1],
      localTransform[5],
      localTransform[9],
      localTransform[13],
      localTransform[2],
      localTransform[6],
      localTransform[10],
      localTransform[14],
      localTransform[3],
      localTransform[7],
      localTransform[11],
      localTransform[15],
    ],
    content: {
      uri: defined(this._resource) ? this._resource.url : undefined,
    },
    geometricError: geometricError,
  };

  return inPlaceTileDefinition;
};

/**
 * @private
 */
I3SNode.prototype._loadSymbology = async function () {
  if (!defined(this._symbologyData) && defined(this._layer._symbology)) {
    this._symbologyData = await this._layer._symbology._getSymbology(this);
  }
};

/**
 * @private
 */
I3SNode.prototype._createContentURL = async function () {
  let rawGltf = {
    scene: 0,
    scenes: [
      {
        nodes: [0],
      },
    ],
    nodes: [
      {
        name: "singleNode",
      },
    ],
    meshes: [],
    buffers: [],
    bufferViews: [],
    accessors: [],
    materials: [],
    textures: [],
    images: [],
    samplers: [],
    asset: {
      version: "2.0",
    },
  };

  // Load the geometry data
  const dataPromises = [this._loadGeometryData()];
  if (this._dataProvider.legacyVersion16) {
    dataPromises.push(this._loadFeatureData());
  }

  await Promise.all(dataPromises);
  // Binary glTF
  if (defined(this._geometryData) && this._geometryData.length > 0) {
    if (this._dataProvider._applySymbology) {
      await this._loadSymbology();
    }

    const url = this._geometryData[0].resource.url;
    const geometrySchema = this._layer._data.store.defaultGeometrySchema;
    const geometryData = this._geometryData[0];
    const result = await I3SDecoder.decode(
      url,
      geometrySchema,
      geometryData,
      this._featureData[0],
      this._symbologyData,
    );
    if (!defined(result)) {
      // Postponed
      return;
    }

    rawGltf = geometryData._generateGltf(
      result.meshData.nodesInScene,
      result.meshData.nodes,
      result.meshData.meshes,
      result.meshData.buffers,
      result.meshData.bufferViews,
      result.meshData.accessors,
      result.meshData.rootExtensions,
      result.meshData.extensionsUsed,
    );

    this._geometryData[0]._customAttributes = result.meshData._customAttributes;
  }

  const binaryGltfData = this._dataProvider._binarizeGltf(rawGltf);
  const glbDataBlob = new Blob([binaryGltfData], {
    type: "application/binary",
  });
  return URL.createObjectURL(glbDataBlob);
};

async function loadFilters(node) {
  const filters = node._layer._filters;
  const promises = [];
  for (let i = 0; i < filters.length; i++) {
    const promise = node.loadField(filters[i].name);
    promises.push(promise);
  }
  await Promise.all(promises);
  return filters;
}

function checkFeatureValue(featureIndex, field, filter) {
  if (!defined(filter.values) || filter.values.length === 0) {
    return false;
  }

  const fieldValues = defined(field) ? field.values : [];
  let featureValue;
  if (featureIndex < fieldValues.length) {
    featureValue = fieldValues[featureIndex];
  }
  let matches = false;
  for (let i = 0; i < filter.values.length; i++) {
    if (filter.values[i] === featureValue) {
      matches = true;
      break;
    }
  }
  return matches;
}

async function filterFeatures(node, contentModel) {
  const batchTable = node._tile.content.batchTable;
  if (defined(batchTable) && batchTable.featuresLength > 0) {
    batchTable.setAllShow(true);

    const filters = await loadFilters(node);
    if (filters.length > 0) {
      for (
        let featureIndex = 0;
        featureIndex < batchTable.featuresLength;
        featureIndex++
      ) {
        for (let filterIndex = 0; filterIndex < filters.length; filterIndex++) {
          const filter = filters[filterIndex];
          if (
            !checkFeatureValue(featureIndex, node._fields[filter.name], filter)
          ) {
            batchTable.setShow(featureIndex, false);
            break;
          }
        }
      }
    }
  }
  contentModel.show = true;
}

/**
 * @private
 */
I3SNode.prototype._filterFeatures = function () {
  const promises = [];
  // Forced filtering is required for loaded nodes only
  for (let i = 0; i < this._children.length; i++) {
    const promise = this._children[i]._filterFeatures();
    promises.push(promise);
  }

  // Filters are applied for nodes with geometry data only
  const contentModel = this._tile?.content?._model;
  if (
    defined(this._geometryData) &&
    this._geometryData.length > 0 &&
    defined(contentModel) &&
    contentModel.ready
  ) {
    // The model needs to be hidden till the filters are applied
    contentModel.show = false;
    const promise = filterFeatures(this, contentModel);
    promises.push(promise);
  }
  return Promise.all(promises);
};

// Reimplement Cesium3DTile.prototype.requestContent so that
// We get a chance to load our own gltf from I3S data
Cesium3DTile.prototype._hookedRequestContent =
  Cesium3DTile.prototype.requestContent;

/**
 * 请求瓦片的内容。
 * <p>
 * 如果 Cesium 请求调度器无法优先处理该请求，则可能无法发出请求。
 * </p>
 *
 * @return {Promise<Cesium3DTileContent>|undefined} 一个在请求完成时解析的 Promise，如果不需要请求或请求无法调度，则返回 undefined。
 * @private
 */

Cesium3DTile.prototype.requestContent = function () {
  if (!this.tileset._isI3STileSet) {
    return this._hookedRequestContent();
  }

  if (!this._isLoading) {
    this._isLoading = true;
    const that = this;
    return this._i3sNode
      ._createContentURL()
      .then((url) => {
        if (!defined(url)) {
          that._isLoading = false;
          return;
        }

        that._contentResource = new Resource({ url: url });
        return that._hookedRequestContent();
      })
      .then((content) => {
        // Filters are applied for nodes with geometry data only
        const contentModel = content?._model;
        if (
          defined(that._i3sNode._geometryData) &&
          that._i3sNode._geometryData.length > 0 &&
          defined(contentModel)
        ) {
          // The model needs to be hidden till the filters are applied
          contentModel.show = false;
          contentModel.readyEvent.addEventListener(() => {
            filterFeatures(that._i3sNode, contentModel);
          });
        }
        that._isLoading = false;
        return content;
      });
  }
};

function bilinearInterpolate(tx, ty, h00, h10, h01, h11) {
  const a = h00 * (1 - tx) + h10 * tx;
  const b = h01 * (1 - tx) + h11 * tx;
  return a * (1 - ty) + b * ty;
}

function sampleMap(u, v, width, data) {
  const address = u + v * width;
  return data[address];
}

function sampleGeoid(sampleX, sampleY, geoidData) {
  const extent = geoidData.nativeExtent;
  let x =
    ((sampleX - extent.west) / (extent.east - extent.west)) *
    (geoidData.width - 1);
  let y =
    ((sampleY - extent.south) / (extent.north - extent.south)) *
    (geoidData.height - 1);
  const xi = Math.floor(x);
  let yi = Math.floor(y);

  x -= xi;
  y -= yi;

  const xNext = xi < geoidData.width ? xi + 1 : xi;
  let yNext = yi < geoidData.height ? yi + 1 : yi;

  yi = geoidData.height - 1 - yi;
  yNext = geoidData.height - 1 - yNext;

  const h00 = sampleMap(xi, yi, geoidData.width, geoidData.buffer);
  const h10 = sampleMap(xNext, yi, geoidData.width, geoidData.buffer);
  const h01 = sampleMap(xi, yNext, geoidData.width, geoidData.buffer);
  const h11 = sampleMap(xNext, yNext, geoidData.width, geoidData.buffer);

  let finalHeight = bilinearInterpolate(x, y, h00, h10, h01, h11);
  finalHeight = finalHeight * geoidData.scale + geoidData.offset;
  return finalHeight;
}

Object.defineProperties(Cesium3DTile.prototype, {
  /**
   * 获取该瓦片的 I3S 节点。
   * @memberof Cesium3DTile.prototype
   * @type {string}
   */

  i3sNode: {
    get: function () {
      return this._i3sNode;
    },
  },
});

export default I3SNode;
