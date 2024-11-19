import AssociativeArray from "../Core/AssociativeArray.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import Cesium3DTileset from "../Scene/Cesium3DTileset.js";
import BoundingSphereState from "./BoundingSphereState.js";
import Property from "./Property.js";

const modelMatrixScratch = new Matrix4();

/**
 * 一个 {@link Visualizer}，将 {@link Entity#tileset} 映射到 {@link Cesium3DTileset}。
 * @alias Cesium3DTilesetVisualizer
 * @constructor
 *
 * @param {Scene} scene 瓦片将在其中渲染的场景。
 * @param {EntityCollection} entityCollection 要可视化的实体集合。
 */

function Cesium3DTilesetVisualizer(scene, entityCollection) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  if (!defined(entityCollection)) {
    throw new DeveloperError("entityCollection is required.");
  }
  //>>includeEnd('debug');

  entityCollection.collectionChanged.addEventListener(
    Cesium3DTilesetVisualizer.prototype._onCollectionChanged,
    this,
  );

  this._scene = scene;
  this._primitives = scene.primitives;
  this._entityCollection = entityCollection;
  this._tilesetHash = {};
  this._entitiesToVisualize = new AssociativeArray();
  this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
}

/**
 * 更新由此可视化器创建的模型，以匹配给定时间的
 * 实体对应物。
 *
 * @param {JulianDate} time 要更新到的时间。
 * @returns {boolean} 此函数始终返回 true。
 */

Cesium3DTilesetVisualizer.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  //>>includeEnd('debug');

  const entities = this._entitiesToVisualize.values;
  const tilesetHash = this._tilesetHash;
  const primitives = this._primitives;

  for (let i = 0, len = entities.length; i < len; i++) {
    const entity = entities[i];
    const tilesetGraphics = entity._tileset;

    let resource;
    const tilesetData = tilesetHash[entity.id];
    const show =
      entity.isShowing &&
      entity.isAvailable(time) &&
      Property.getValueOrDefault(tilesetGraphics._show, time, true);

    let modelMatrix;
    if (show) {
      modelMatrix = entity.computeModelMatrix(time, modelMatrixScratch);
      resource = Resource.createIfNeeded(
        Property.getValueOrUndefined(tilesetGraphics._uri, time),
      );
    }

    const tileset = defined(tilesetData)
      ? tilesetData.tilesetPrimitive
      : undefined;

    if (!show) {
      if (defined(tileset)) {
        tileset.show = false;
      }
      continue;
    }

    if (!defined(tilesetData) || resource.url !== tilesetData.url) {
      if (defined(tileset)) {
        primitives.removeAndDestroy(tileset);
      }

      delete tilesetHash[entity.id];

      createTileset(resource, tilesetHash, entity, primitives);
    }

    if (!defined(tileset)) {
      continue;
    }

    tileset.show = true;
    if (defined(modelMatrix)) {
      tileset.modelMatrix = modelMatrix;
    }
    tileset.maximumScreenSpaceError = Property.getValueOrDefault(
      tilesetGraphics.maximumScreenSpaceError,
      time,
      tileset.maximumScreenSpaceError,
    );
  }

  return true;
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 */

Cesium3DTilesetVisualizer.prototype.isDestroyed = function () {
  return false;
};

/**
 * 移除并销毁此实例创建的所有原始体。
 */

Cesium3DTilesetVisualizer.prototype.destroy = function () {
  this._entityCollection.collectionChanged.removeEventListener(
    Cesium3DTilesetVisualizer.prototype._onCollectionChanged,
    this,
  );
  const entities = this._entitiesToVisualize.values;
  const tilesetHash = this._tilesetHash;
  const primitives = this._primitives;
  for (let i = entities.length - 1; i > -1; i--) {
    removeTileset(this, entities[i], tilesetHash, primitives);
  }
  return destroyObject(this);
};

/**
 * 计算一个包围球，用于包围指定实体产生的可视化。
 * 包围球位于场景地球的固定坐标系中。
 *
 * @param {Entity} entity 要计算包围球的实体。
 * @param {BoundingSphere} result 用于存储结果的包围球。
 * @returns {BoundingSphereState} 如果结果包含包围球，则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中，则返回 BoundingSphereState.PENDING，
 *                       如果实体在当前场景中没有可视化，则返回 BoundingSphereState.FAILED。
 * @private
 */

Cesium3DTilesetVisualizer.prototype.getBoundingSphere = function (
  entity,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const tilesetData = this._tilesetHash[entity.id];
  if (!defined(tilesetData) || tilesetData.loadFail) {
    return BoundingSphereState.FAILED;
  }

  const primitive = tilesetData.tilesetPrimitive;
  if (!defined(primitive)) {
    return BoundingSphereState.PENDING;
  }

  if (!primitive.show) {
    return BoundingSphereState.FAILED;
  }

  BoundingSphere.clone(primitive.boundingSphere, result);

  return BoundingSphereState.DONE;
};

/**
 * @private
 */
Cesium3DTilesetVisualizer.prototype._onCollectionChanged = function (
  entityCollection,
  added,
  removed,
  changed,
) {
  let i;
  let entity;
  const entities = this._entitiesToVisualize;
  const tilesetHash = this._tilesetHash;
  const primitives = this._primitives;

  for (i = added.length - 1; i > -1; i--) {
    entity = added[i];
    if (defined(entity._tileset)) {
      entities.set(entity.id, entity);
    }
  }

  for (i = changed.length - 1; i > -1; i--) {
    entity = changed[i];
    if (defined(entity._tileset)) {
      entities.set(entity.id, entity);
    } else {
      removeTileset(this, entity, tilesetHash, primitives);
      entities.remove(entity.id);
    }
  }

  for (i = removed.length - 1; i > -1; i--) {
    entity = removed[i];
    removeTileset(this, entity, tilesetHash, primitives);
    entities.remove(entity.id);
  }
};

function removeTileset(visualizer, entity, tilesetHash, primitives) {
  const tilesetData = tilesetHash[entity.id];
  if (defined(tilesetData)) {
    if (defined(tilesetData.tilesetPrimitive)) {
      primitives.removeAndDestroy(tilesetData.tilesetPrimitive);
    }
    delete tilesetHash[entity.id];
  }
}

async function createTileset(resource, tilesetHash, entity, primitives) {
  tilesetHash[entity.id] = {
    url: resource.url,
    loadFail: false,
  };

  try {
    const tileset = await Cesium3DTileset.fromUrl(resource);
    tileset.id = entity;
    primitives.add(tileset);

    if (!defined(tilesetHash[entity.id])) {
      return;
    }

    tilesetHash[entity.id].tilesetPrimitive = tileset;
  } catch (error) {
    console.error(error);
    tilesetHash[entity.id].loadFail = true;
  }
}

export default Cesium3DTilesetVisualizer;
