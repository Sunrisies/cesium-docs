import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import EllipsoidalOccluder from "../Core/EllipsoidalOccluder.js";
import Event from "../Core/Event.js";
import Matrix4 from "../Core/Matrix4.js";
import Billboard from "../Scene/Billboard.js";
import BillboardCollection from "../Scene/BillboardCollection.js";
import Label from "../Scene/Label.js";
import LabelCollection from "../Scene/LabelCollection.js";
import PointPrimitive from "../Scene/PointPrimitive.js";
import PointPrimitiveCollection from "../Scene/PointPrimitiveCollection.js";
import SceneMode from "../Scene/SceneMode.js";
import KDBush from "kdbush";

/**
 * 定义如何对屏幕空间对象（广告牌、点、标签）进行聚类。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.enabled=false] 是否启用聚类。
 * @param {number} [options.pixelRange=80] 扩展屏幕空间边界框的像素范围。
 * @param {number} [options.minimumClusterSize=2] 可聚类的屏幕空间对象的最小数量。
 * @param {boolean} [options.clusterBillboards=true] 是否对实体的广告牌进行聚类。
 * @param {boolean} [options.clusterLabels=true] 是否对实体的标签进行聚类。
 * @param {boolean} [options.clusterPoints=true] 是否对实体的点进行聚类。
 * @param {boolean} [options.show=true] 决定聚类中的实体是否可见。
 *
 * @alias EntityCluster
 * @constructor
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Clustering.html|Cesium Sandcastle Clustering Demo}
 */
function EntityCluster(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._enabled = defaultValue(options.enabled, false);
  this._pixelRange = defaultValue(options.pixelRange, 80);
  this._minimumClusterSize = defaultValue(options.minimumClusterSize, 2);
  this._clusterBillboards = defaultValue(options.clusterBillboards, true);
  this._clusterLabels = defaultValue(options.clusterLabels, true);
  this._clusterPoints = defaultValue(options.clusterPoints, true);

  this._labelCollection = undefined;
  this._billboardCollection = undefined;
  this._pointCollection = undefined;

  this._clusterBillboardCollection = undefined;
  this._clusterLabelCollection = undefined;
  this._clusterPointCollection = undefined;

  this._collectionIndicesByEntity = {};

  this._unusedLabelIndices = [];
  this._unusedBillboardIndices = [];
  this._unusedPointIndices = [];

  this._previousClusters = [];
  this._previousHeight = undefined;

  this._enabledDirty = false;
  this._clusterDirty = false;

  this._cluster = undefined;
  this._removeEventListener = undefined;

  this._clusterEvent = new Event();

  /**
   * 决定此集合中的实体是否可见。
   *
   * @type {boolean}
   * @default true
   */

  this.show = defaultValue(options.show, true);
}

function expandBoundingBox(bbox, pixelRange) {
  bbox.x -= pixelRange;
  bbox.y -= pixelRange;
  bbox.width += pixelRange * 2.0;
  bbox.height += pixelRange * 2.0;
}

const labelBoundingBoxScratch = new BoundingRectangle();

function getBoundingBox(item, coord, pixelRange, entityCluster, result) {
  if (defined(item._labelCollection) && entityCluster._clusterLabels) {
    result = Label.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    defined(item._billboardCollection) &&
    entityCluster._clusterBillboards
  ) {
    result = Billboard.getScreenSpaceBoundingBox(item, coord, result);
  } else if (
    defined(item._pointPrimitiveCollection) &&
    entityCluster._clusterPoints
  ) {
    result = PointPrimitive.getScreenSpaceBoundingBox(item, coord, result);
  }

  expandBoundingBox(result, pixelRange);

  if (
    entityCluster._clusterLabels &&
    !defined(item._labelCollection) &&
    defined(item.id) &&
    hasLabelIndex(entityCluster, item.id.id) &&
    defined(item.id._label)
  ) {
    const labelIndex =
      entityCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = entityCluster._labelCollection.get(labelIndex);
    const labelBBox = Label.getScreenSpaceBoundingBox(
      label,
      coord,
      labelBoundingBoxScratch,
    );
    expandBoundingBox(labelBBox, pixelRange);
    result = BoundingRectangle.union(result, labelBBox, result);
  }

  return result;
}

function addNonClusteredItem(item, entityCluster) {
  item.clusterShow = true;

  if (
    !defined(item._labelCollection) &&
    defined(item.id) &&
    hasLabelIndex(entityCluster, item.id.id) &&
    defined(item.id._label)
  ) {
    const labelIndex =
      entityCluster._collectionIndicesByEntity[item.id.id].labelIndex;
    const label = entityCluster._labelCollection.get(labelIndex);
    label.clusterShow = true;
  }
}

function addCluster(position, numPoints, ids, entityCluster) {
  const cluster = {
    billboard: entityCluster._clusterBillboardCollection.add(),
    label: entityCluster._clusterLabelCollection.add(),
    point: entityCluster._clusterPointCollection.add(),
  };

  cluster.billboard.show = false;
  cluster.point.show = false;
  cluster.label.show = true;
  cluster.label.text = numPoints.toLocaleString();
  cluster.label.id = ids;
  cluster.billboard.position =
    cluster.label.position =
    cluster.point.position =
      position;

  entityCluster._clusterEvent.raiseEvent(ids, cluster);
}

function hasLabelIndex(entityCluster, entityId) {
  return (
    defined(entityCluster) &&
    defined(entityCluster._collectionIndicesByEntity[entityId]) &&
    defined(entityCluster._collectionIndicesByEntity[entityId].labelIndex)
  );
}

function getScreenSpacePositions(
  collection,
  points,
  scene,
  occluder,
  entityCluster,
) {
  if (!defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    const item = collection.get(i);
    item.clusterShow = false;

    if (
      !item.show ||
      (entityCluster._scene.mode === SceneMode.SCENE3D &&
        !occluder.isPointVisible(item.position))
    ) {
      continue;
    }

    const canClusterLabels =
      entityCluster._clusterLabels && defined(item._labelCollection);
    const canClusterBillboards =
      entityCluster._clusterBillboards && defined(item.id._billboard);
    const canClusterPoints =
      entityCluster._clusterPoints && defined(item.id._point);
    if (canClusterLabels && (canClusterPoints || canClusterBillboards)) {
      continue;
    }

    const coord = item.computeScreenSpacePosition(scene);
    if (!defined(coord)) {
      continue;
    }

    points.push({
      index: i,
      collection: collection,
      clustered: false,
      coord: coord,
    });
  }
}

const pointBoundinRectangleScratch = new BoundingRectangle();
const totalBoundingRectangleScratch = new BoundingRectangle();
const neighborBoundingRectangleScratch = new BoundingRectangle();

function createDeclutterCallback(entityCluster) {
  return function (amount) {
    if ((defined(amount) && amount < 0.05) || !entityCluster.enabled) {
      return;
    }

    const scene = entityCluster._scene;

    const labelCollection = entityCluster._labelCollection;
    const billboardCollection = entityCluster._billboardCollection;
    const pointCollection = entityCluster._pointCollection;

    if (
      (!defined(labelCollection) &&
        !defined(billboardCollection) &&
        !defined(pointCollection)) ||
      (!entityCluster._clusterBillboards &&
        !entityCluster._clusterLabels &&
        !entityCluster._clusterPoints)
    ) {
      return;
    }

    let clusteredLabelCollection = entityCluster._clusterLabelCollection;
    let clusteredBillboardCollection =
      entityCluster._clusterBillboardCollection;
    let clusteredPointCollection = entityCluster._clusterPointCollection;

    if (defined(clusteredLabelCollection)) {
      clusteredLabelCollection.removeAll();
    } else {
      clusteredLabelCollection = entityCluster._clusterLabelCollection =
        new LabelCollection({
          scene: scene,
        });
    }

    if (defined(clusteredBillboardCollection)) {
      clusteredBillboardCollection.removeAll();
    } else {
      clusteredBillboardCollection = entityCluster._clusterBillboardCollection =
        new BillboardCollection({
          scene: scene,
        });
    }

    if (defined(clusteredPointCollection)) {
      clusteredPointCollection.removeAll();
    } else {
      clusteredPointCollection = entityCluster._clusterPointCollection =
        new PointPrimitiveCollection();
    }

    const pixelRange = entityCluster._pixelRange;
    const minimumClusterSize = entityCluster._minimumClusterSize;

    const clusters = entityCluster._previousClusters;
    const newClusters = [];

    const previousHeight = entityCluster._previousHeight;
    const currentHeight = scene.camera.positionCartographic.height;

    const ellipsoid = scene.ellipsoid;
    const cameraPosition = scene.camera.positionWC;
    const occluder = new EllipsoidalOccluder(ellipsoid, cameraPosition);

    const points = [];
    if (entityCluster._clusterLabels) {
      getScreenSpacePositions(
        labelCollection,
        points,
        scene,
        occluder,
        entityCluster,
      );
    }
    if (entityCluster._clusterBillboards) {
      getScreenSpacePositions(
        billboardCollection,
        points,
        scene,
        occluder,
        entityCluster,
      );
    }
    if (entityCluster._clusterPoints) {
      getScreenSpacePositions(
        pointCollection,
        points,
        scene,
        occluder,
        entityCluster,
      );
    }

    let i;
    let j;
    let length;
    let bbox;
    let neighbors;
    let neighborLength;
    let neighborIndex;
    let neighborPoint;
    let ids;
    let numPoints;

    let collection;
    let collectionIndex;

    if (points.length > 0) {
      const index = new KDBush(points.length, 64, Uint32Array);
      for (let p = 0; p < points.length; ++p) {
        index.add(points[p].coord.x, points[p].coord.y);
      }
      index.finish();

      if (currentHeight < previousHeight) {
        length = clusters.length;
        for (i = 0; i < length; ++i) {
          const cluster = clusters[i];

          if (!occluder.isPointVisible(cluster.position)) {
            continue;
          }

          const coord = Billboard._computeScreenSpacePosition(
            Matrix4.IDENTITY,
            cluster.position,
            Cartesian3.ZERO,
            Cartesian2.ZERO,
            scene,
          );
          if (!defined(coord)) {
            continue;
          }

          const factor = 1.0 - currentHeight / previousHeight;
          let width = (cluster.width = cluster.width * factor);
          let height = (cluster.height = cluster.height * factor);

          width = Math.max(width, cluster.minimumWidth);
          height = Math.max(height, cluster.minimumHeight);

          const minX = coord.x - width * 0.5;
          const minY = coord.y - height * 0.5;
          const maxX = coord.x + width;
          const maxY = coord.y + height;

          neighbors = index.range(minX, minY, maxX, maxY);
          neighborLength = neighbors.length;
          numPoints = 0;
          ids = [];

          for (j = 0; j < neighborLength; ++j) {
            neighborIndex = neighbors[j];
            neighborPoint = points[neighborIndex];
            if (!neighborPoint.clustered) {
              ++numPoints;

              collection = neighborPoint.collection;
              collectionIndex = neighborPoint.index;
              ids.push(collection.get(collectionIndex).id);
            }
          }

          if (numPoints >= minimumClusterSize) {
            addCluster(cluster.position, numPoints, ids, entityCluster);
            newClusters.push(cluster);

            for (j = 0; j < neighborLength; ++j) {
              points[neighbors[j]].clustered = true;
            }
          }
        }
      }

      length = points.length;
      for (i = 0; i < length; ++i) {
        const point = points[i];
        if (point.clustered) {
          continue;
        }

        point.clustered = true;

        collection = point.collection;
        collectionIndex = point.index;

        const item = collection.get(collectionIndex);
        bbox = getBoundingBox(
          item,
          point.coord,
          pixelRange,
          entityCluster,
          pointBoundinRectangleScratch,
        );
        const totalBBox = BoundingRectangle.clone(
          bbox,
          totalBoundingRectangleScratch,
        );

        neighbors = index.range(
          bbox.x,
          bbox.y,
          bbox.x + bbox.width,
          bbox.y + bbox.height,
        );
        neighborLength = neighbors.length;

        const clusterPosition = Cartesian3.clone(item.position);
        numPoints = 1;
        ids = [item.id];

        for (j = 0; j < neighborLength; ++j) {
          neighborIndex = neighbors[j];
          neighborPoint = points[neighborIndex];
          if (!neighborPoint.clustered) {
            const neighborItem = neighborPoint.collection.get(
              neighborPoint.index,
            );
            const neighborBBox = getBoundingBox(
              neighborItem,
              neighborPoint.coord,
              pixelRange,
              entityCluster,
              neighborBoundingRectangleScratch,
            );

            Cartesian3.add(
              neighborItem.position,
              clusterPosition,
              clusterPosition,
            );

            BoundingRectangle.union(totalBBox, neighborBBox, totalBBox);
            ++numPoints;

            ids.push(neighborItem.id);
          }
        }

        if (numPoints >= minimumClusterSize) {
          const position = Cartesian3.multiplyByScalar(
            clusterPosition,
            1.0 / numPoints,
            clusterPosition,
          );
          addCluster(position, numPoints, ids, entityCluster);
          newClusters.push({
            position: position,
            width: totalBBox.width,
            height: totalBBox.height,
            minimumWidth: bbox.width,
            minimumHeight: bbox.height,
          });

          for (j = 0; j < neighborLength; ++j) {
            points[neighbors[j]].clustered = true;
          }
        } else {
          addNonClusteredItem(item, entityCluster);
        }
      }
    }

    if (clusteredLabelCollection.length === 0) {
      clusteredLabelCollection.destroy();
      entityCluster._clusterLabelCollection = undefined;
    }

    if (clusteredBillboardCollection.length === 0) {
      clusteredBillboardCollection.destroy();
      entityCluster._clusterBillboardCollection = undefined;
    }

    if (clusteredPointCollection.length === 0) {
      clusteredPointCollection.destroy();
      entityCluster._clusterPointCollection = undefined;
    }

    entityCluster._previousClusters = newClusters;
    entityCluster._previousHeight = currentHeight;
  };
}

EntityCluster.prototype._initialize = function (scene) {
  this._scene = scene;

  const cluster = createDeclutterCallback(this);
  this._cluster = cluster;
  this._removeEventListener = scene.camera.changed.addEventListener(cluster);
};

Object.defineProperties(EntityCluster.prototype, {
  /**
   * 获取或设置是否启用聚类。
   * @memberof EntityCluster.prototype
   * @type {boolean}
   */
  enabled: {
    get: function () {
      return this._enabled;
    },
    set: function (value) {
      this._enabledDirty = value !== this._enabled;
      this._enabled = value;
    },
  },
  
  /**
   * 获取或设置扩展屏幕空间边界框的像素范围。
   * @memberof EntityCluster.prototype
   * @type {number}
   */
  pixelRange: {
    get: function () {
      return this._pixelRange;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._pixelRange;
      this._pixelRange = value;
    },
  },
  
  /**
   * 获取或设置可以聚类的最小屏幕空间对象数量。
   * @memberof EntityCluster.prototype
   * @type {number}
   */
  minimumClusterSize: {
    get: function () {
      return this._minimumClusterSize;
    },
    set: function (value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._minimumClusterSize;
      this._minimumClusterSize = value;
    },
  },

  /**
   * 获取将在新聚类显示时引发的事件。事件监听器的签名为 {@link EntityCluster.newClusterCallback}。
   * @memberof EntityCluster.prototype
   * @type {Event<EntityCluster.newClusterCallback>}
   */
  clusterEvent: {
    get: function () {
      return this._clusterEvent;
    },
  },

  /**
   * 获取或设置是否启用广告牌实体的聚类。
   * @memberof EntityCluster.prototype
   * @type {boolean}
   */
  clusterBillboards: {
    get: function () {
      return this._clusterBillboards;
    },
    set: function (value) {
      this._clusterDirty =
        this._clusterDirty || value !== this._clusterBillboards;
      this._clusterBillboards = value;
    },
  },

  /**
   * 获取或设置是否启用标签实体的聚类。
   * @memberof EntityCluster.prototype
   * @type {boolean}
   */
  clusterLabels: {
    get: function () {
      return this._clusterLabels;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterLabels;
      this._clusterLabels = value;
    },
  },

  /**
   * 获取或设置是否启用点实体的聚类。
   * @memberof EntityCluster.prototype
   * @type {boolean}
   */
  clusterPoints: {
    get: function () {
      return this._clusterPoints;
    },
    set: function (value) {
      this._clusterDirty = this._clusterDirty || value !== this._clusterPoints;
      this._clusterPoints = value;
    },
  },
});


function createGetEntity(
  collectionProperty,
  CollectionConstructor,
  unusedIndicesProperty,
  entityIndexProperty,
) {
  return function (entity) {
    let collection = this[collectionProperty];

    if (!defined(this._collectionIndicesByEntity)) {
      this._collectionIndicesByEntity = {};
    }

    let entityIndices = this._collectionIndicesByEntity[entity.id];

    if (!defined(entityIndices)) {
      entityIndices = this._collectionIndicesByEntity[entity.id] = {
        billboardIndex: undefined,
        labelIndex: undefined,
        pointIndex: undefined,
      };
    }

    if (defined(collection) && defined(entityIndices[entityIndexProperty])) {
      return collection.get(entityIndices[entityIndexProperty]);
    }

    if (!defined(collection)) {
      collection = this[collectionProperty] = new CollectionConstructor({
        scene: this._scene,
      });
    }

    let index;
    let entityItem;

    const unusedIndices = this[unusedIndicesProperty];
    if (unusedIndices.length > 0) {
      index = unusedIndices.shift();
      entityItem = collection.get(index);
    } else {
      entityItem = collection.add();
      index = collection.length - 1;
    }

    entityIndices[entityIndexProperty] = index;

    const that = this;
    Promise.resolve().then(function () {
      that._clusterDirty = true;
    });

    return entityItem;
  };
}

function removeEntityIndicesIfUnused(entityCluster, entityId) {
  const indices = entityCluster._collectionIndicesByEntity[entityId];

  if (
    !defined(indices.billboardIndex) &&
    !defined(indices.labelIndex) &&
    !defined(indices.pointIndex)
  ) {
    delete entityCluster._collectionIndicesByEntity[entityId];
  }
}

/**
 * 返回一个新的 {@link Label}。
 * @param {Entity} entity 将使用返回的 {@link Label} 进行可视化的实体。
 * @returns {Label} 将用于可视化实体的标签。
 *
 * @private
 */
EntityCluster.prototype.getLabel = createGetEntity(
  "_labelCollection",
  LabelCollection,
  "_unusedLabelIndices",
  "labelIndex",
);

/**
 * 移除与实体相关联的 {@link Label}，以便可以被另一个实体重用。
 * @param {Entity} entity 将使用返回的 {@link Label} 进行可视化的实体。
 *
 * @private
 */

EntityCluster.prototype.removeLabel = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._labelCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.labelIndex)
  ) {
    return;
  }

  const index = entityIndices.labelIndex;
  entityIndices.labelIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const label = this._labelCollection.get(index);
  label.show = false;
  label.text = "";
  label.id = undefined;

  this._unusedLabelIndices.push(index);

  this._clusterDirty = true;
};

/**
 * 返回一个新的 {@link Billboard}。
 * @param {Entity} entity 将使用返回的 {@link Billboard} 进行可视化的实体。
 * @returns {Billboard} 将用于可视化实体的广告牌。
 *
 * @private
 */

EntityCluster.prototype.getBillboard = createGetEntity(
  "_billboardCollection",
  BillboardCollection,
  "_unusedBillboardIndices",
  "billboardIndex",
);

/**
 * 移除与实体相关联的 {@link Billboard}，以便可以被另一个实体重用。
 * @param {Entity} entity 将使用返回的 {@link Billboard} 进行可视化的实体。
 *
 * @private
 */

EntityCluster.prototype.removeBillboard = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._billboardCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.billboardIndex)
  ) {
    return;
  }

  const index = entityIndices.billboardIndex;
  entityIndices.billboardIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const billboard = this._billboardCollection.get(index);
  billboard.id = undefined;
  billboard.show = false;
  billboard.image = undefined;

  this._unusedBillboardIndices.push(index);

  this._clusterDirty = true;
};

/**
 * 返回一个新的 {@link Point}。
 * @param {Entity} entity 将使用返回的 {@link Point} 进行可视化的实体。
 * @returns {Point} 将用于可视化实体的点。
 *
 * @private
 */

EntityCluster.prototype.getPoint = createGetEntity(
  "_pointCollection",
  PointPrimitiveCollection,
  "_unusedPointIndices",
  "pointIndex",
);

/**
 * 移除与实体相关联的 {@link Point}，以便可以被另一个实体重用。
 * @param {Entity} entity 将使用返回的 {@link Point} 进行可视化的实体。
 *
 * @private
 */

EntityCluster.prototype.removePoint = function (entity) {
  const entityIndices =
    this._collectionIndicesByEntity &&
    this._collectionIndicesByEntity[entity.id];
  if (
    !defined(this._pointCollection) ||
    !defined(entityIndices) ||
    !defined(entityIndices.pointIndex)
  ) {
    return;
  }

  const index = entityIndices.pointIndex;
  entityIndices.pointIndex = undefined;
  removeEntityIndicesIfUnused(this, entity.id);

  const point = this._pointCollection.get(index);
  point.show = false;
  point.id = undefined;

  this._unusedPointIndices.push(index);

  this._clusterDirty = true;
};

function disableCollectionClustering(collection) {
  if (!defined(collection)) {
    return;
  }

  const length = collection.length;
  for (let i = 0; i < length; ++i) {
    collection.get(i).clusterShow = true;
  }
}

function updateEnable(entityCluster) {
  if (entityCluster.enabled) {
    return;
  }

  if (defined(entityCluster._clusterLabelCollection)) {
    entityCluster._clusterLabelCollection.destroy();
  }
  if (defined(entityCluster._clusterBillboardCollection)) {
    entityCluster._clusterBillboardCollection.destroy();
  }
  if (defined(entityCluster._clusterPointCollection)) {
    entityCluster._clusterPointCollection.destroy();
  }

  entityCluster._clusterLabelCollection = undefined;
  entityCluster._clusterBillboardCollection = undefined;
  entityCluster._clusterPointCollection = undefined;

  disableCollectionClustering(entityCluster._labelCollection);
  disableCollectionClustering(entityCluster._billboardCollection);
  disableCollectionClustering(entityCluster._pointCollection);
}

/**
 * 获取聚类的广告牌/点/标签的绘制命令（如果启用），否则，
 * 排队为实体创建的广告牌/点/标签的绘制命令。
 * @private
 */

EntityCluster.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  // If clustering is enabled before the label collection is updated,
  // the glyphs haven't been created so the screen space bounding boxes
  // are incorrect.
  let commandList;
  if (
    defined(this._labelCollection) &&
    this._labelCollection.length > 0 &&
    this._labelCollection.get(0)._glyphs.length === 0
  ) {
    commandList = frameState.commandList;
    frameState.commandList = [];
    this._labelCollection.update(frameState);
    frameState.commandList = commandList;
  }

  // If clustering is enabled before the billboard collection is updated,
  // the images haven't been added to the image atlas so the screen space bounding boxes
  // are incorrect.
  if (
    defined(this._billboardCollection) &&
    this._billboardCollection.length > 0 &&
    !defined(this._billboardCollection.get(0).width)
  ) {
    commandList = frameState.commandList;
    frameState.commandList = [];
    this._billboardCollection.update(frameState);
    frameState.commandList = commandList;
  }

  if (this._enabledDirty) {
    this._enabledDirty = false;
    updateEnable(this);
    this._clusterDirty = true;
  }

  if (this._clusterDirty) {
    this._clusterDirty = false;
    this._cluster();
  }

  if (defined(this._clusterLabelCollection)) {
    this._clusterLabelCollection.update(frameState);
  }
  if (defined(this._clusterBillboardCollection)) {
    this._clusterBillboardCollection.update(frameState);
  }
  if (defined(this._clusterPointCollection)) {
    this._clusterPointCollection.update(frameState);
  }

  if (defined(this._labelCollection)) {
    this._labelCollection.update(frameState);
  }
  if (defined(this._billboardCollection)) {
    this._billboardCollection.update(frameState);
  }
  if (defined(this._pointCollection)) {
    this._pointCollection.update(frameState);
  }
};

/**
 * 销毁此对象所持有的 WebGL 资源。销毁对象允许对 WebGL 资源的确定性释放，
 * 而不是依赖于垃圾收集器来销毁此对象。
 * <p>
 * 与其他使用 WebGL 资源的对象不同，此对象可以被重用。例如，如果一个数据源从
 * 数据源集合中移除并添加到另一个集合中。
 * </p>
 */

EntityCluster.prototype.destroy = function () {
  this._labelCollection =
    this._labelCollection && this._labelCollection.destroy();
  this._billboardCollection =
    this._billboardCollection && this._billboardCollection.destroy();
  this._pointCollection =
    this._pointCollection && this._pointCollection.destroy();

  this._clusterLabelCollection =
    this._clusterLabelCollection && this._clusterLabelCollection.destroy();
  this._clusterBillboardCollection =
    this._clusterBillboardCollection &&
    this._clusterBillboardCollection.destroy();
  this._clusterPointCollection =
    this._clusterPointCollection && this._clusterPointCollection.destroy();

  if (defined(this._removeEventListener)) {
    this._removeEventListener();
    this._removeEventListener = undefined;
  }

  this._labelCollection = undefined;
  this._billboardCollection = undefined;
  this._pointCollection = undefined;

  this._clusterBillboardCollection = undefined;
  this._clusterLabelCollection = undefined;
  this._clusterPointCollection = undefined;

  this._collectionIndicesByEntity = undefined;

  this._unusedLabelIndices = [];
  this._unusedBillboardIndices = [];
  this._unusedPointIndices = [];

  this._previousClusters = [];
  this._previousHeight = undefined;

  this._enabledDirty = false;
  this._pixelRangeDirty = false;
  this._minimumClusterSizeDirty = false;

  return undefined;
};

/**
 * 用于样式化聚类的事件监听器函数。
 * @callback EntityCluster.newClusterCallback
 *
 * @param {Entity[]} clusteredEntities 包含在聚类中的实体数组。
 * @param {object} cluster 一个对象，包含表示该聚类的广告牌、标签和点
 * 图元。
 * @param {Billboard} cluster.billboard
 * @param {Label} cluster.label
 * @param {PointPrimitive} cluster.point
 *
 * @example
 * // The default cluster values.
 * dataSource.clustering.clusterEvent.addEventListener(function(entities, cluster) {
 *     cluster.label.show = true;
 *     cluster.label.text = entities.length.toLocaleString();
 * });
 */
export default EntityCluster;
