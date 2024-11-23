import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import EventHelper from "../Core/EventHelper.js";
import GroundPolylinePrimitive from "../Scene/GroundPolylinePrimitive.js";
import GroundPrimitive from "../Scene/GroundPrimitive.js";
import OrderedGroundPrimitiveCollection from "../Scene/OrderedGroundPrimitiveCollection.js";
import PrimitiveCollection from "../Scene/PrimitiveCollection.js";
import BillboardVisualizer from "./BillboardVisualizer.js";
import BoundingSphereState from "./BoundingSphereState.js";
import CustomDataSource from "./CustomDataSource.js";
import GeometryVisualizer from "./GeometryVisualizer.js";
import LabelVisualizer from "./LabelVisualizer.js";
import ModelVisualizer from "./ModelVisualizer.js";
import Cesium3DTilesetVisualizer from "./Cesium3DTilesetVisualizer.js";
import PathVisualizer from "./PathVisualizer.js";
import PointVisualizer from "./PointVisualizer.js";
import PolylineVisualizer from "./PolylineVisualizer.js";

/**
 * 可视化 {@link DataSource} 实例的集合。
 * @alias DataSourceDisplay
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Scene} options.scene 显示数据的场景。
 * @param {DataSourceCollection} options.dataSourceCollection 要显示的数据源。
 * @param {DataSourceDisplay.VisualizersCallback} [options.visualizersCallback=DataSourceDisplay.defaultVisualizersCallback]
 *        一个用于创建可视化所需的可视化器数组的函数。
 *        如果未定义，则使用所有标准可视化器。
 */

function DataSourceDisplay(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.scene", options.scene);
  Check.typeOf.object(
    "options.dataSourceCollection",
    options.dataSourceCollection,
  );
  //>>includeEnd('debug');

  GroundPrimitive.initializeTerrainHeights();
  GroundPolylinePrimitive.initializeTerrainHeights();

  const scene = options.scene;
  const dataSourceCollection = options.dataSourceCollection;

  this._eventHelper = new EventHelper();
  this._eventHelper.add(
    dataSourceCollection.dataSourceAdded,
    this._onDataSourceAdded,
    this,
  );
  this._eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    this._onDataSourceRemoved,
    this,
  );
  this._eventHelper.add(
    dataSourceCollection.dataSourceMoved,
    this._onDataSourceMoved,
    this,
  );
  this._eventHelper.add(scene.postRender, this._postRender, this);

  this._dataSourceCollection = dataSourceCollection;
  this._scene = scene;
  this._visualizersCallback = defaultValue(
    options.visualizersCallback,
    DataSourceDisplay.defaultVisualizersCallback,
  );

  let primitivesAdded = false;
  const primitives = new PrimitiveCollection();
  const groundPrimitives = new PrimitiveCollection();

  if (dataSourceCollection.length > 0) {
    scene.primitives.add(primitives);
    scene.groundPrimitives.add(groundPrimitives);
    primitivesAdded = true;
  }

  this._primitives = primitives;
  this._groundPrimitives = groundPrimitives;

  for (let i = 0, len = dataSourceCollection.length; i < len; i++) {
    this._onDataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
  }

  const defaultDataSource = new CustomDataSource();
  this._onDataSourceAdded(undefined, defaultDataSource);
  this._defaultDataSource = defaultDataSource;

  let removeDefaultDataSourceListener;
  let removeDataSourceCollectionListener;
  if (!primitivesAdded) {
    const that = this;
    const addPrimitives = function () {
      scene.primitives.add(primitives);
      scene.groundPrimitives.add(groundPrimitives);
      removeDefaultDataSourceListener();
      removeDataSourceCollectionListener();
      that._removeDefaultDataSourceListener = undefined;
      that._removeDataSourceCollectionListener = undefined;
    };
    removeDefaultDataSourceListener =
      defaultDataSource.entities.collectionChanged.addEventListener(
        addPrimitives,
      );
    removeDataSourceCollectionListener =
      dataSourceCollection.dataSourceAdded.addEventListener(addPrimitives);
  }

  this._removeDefaultDataSourceListener = removeDefaultDataSourceListener;
  this._removeDataSourceCollectionListener = removeDataSourceCollectionListener;

  this._ready = false;
}

const ExtraVisualizers = [];
/**
 * 如果提供的可视化器尚未包含，则将其添加到默认可视化器回调中。
 * @private
 * @param {Visualizer} visualizer 要添加的可视化器类。
 */
DataSourceDisplay.registerVisualizer = function (visualizer) {
  if (!ExtraVisualizers.includes(visualizer)) {
    ExtraVisualizers.push(visualizer);
  }
};

/**
 * 如果提供的可视化器已经包含，则将其从默认可视化器回调中移除。
 * @private
 * @param {Visualizer} visualizer 要移除的可视化器类。
 */

DataSourceDisplay.unregisterVisualizer = function (visualizer) {
  if (ExtraVisualizers.includes(visualizer)) {
    const index = ExtraVisualizers.indexOf(visualizer);
    ExtraVisualizers.splice(index, 1);
  }
};

/**
 * 获取或设置用于创建可视化器数组的默认函数。
 * 默认情况下，此函数使用所有标准可视化器。
 *
 * @type {DataSourceDisplay.VisualizersCallback}
 */

DataSourceDisplay.defaultVisualizersCallback = function (
  scene,
  entityCluster,
  dataSource,
) {
  const entities = dataSource.entities;
  return [
    new BillboardVisualizer(entityCluster, entities),
    new GeometryVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives,
    ),
    new LabelVisualizer(entityCluster, entities),
    new ModelVisualizer(scene, entities),
    new Cesium3DTilesetVisualizer(scene, entities),
    new PointVisualizer(entityCluster, entities),
    new PathVisualizer(scene, entities),
    new PolylineVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives,
    ),
    ...ExtraVisualizers.map(
      (VisualizerClass) => new VisualizerClass(scene, entities),
    ),
  ];
};

Object.defineProperties(DataSourceDisplay.prototype, {
  /**
   * 获取与此显示相关的场景。
   * @memberof DataSourceDisplay.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },
  
  /**
   * 获取要显示的数据源集合。
   * @memberof DataSourceDisplay.prototype
   * @type {DataSourceCollection}
   */
  dataSources: {
    get: function () {
      return this._dataSourceCollection;
    },
  },

  /**
   * 获取默认数据源实例，可用于
   * 手动创建和可视化未绑定到
   * 特定数据源的实体。此实例始终可用
   * 且不会出现在数据源集合的列表中。
   * @memberof DataSourceDisplay.prototype
   * @type {CustomDataSource}
   */
  defaultDataSource: {
    get: function () {
      return this._defaultDataSource;
    },
  },

  /**
   * 获取一个值，指示数据源中的所有实体是否准备就绪。
   * @memberof DataSourceDisplay.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },
});


/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @see DataSourceDisplay#destroy
 */

DataSourceDisplay.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象所持有的 WebGL 资源。显式销毁对象允许确定性地
 * 释放 WebGL 资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * dataSourceDisplay = dataSourceDisplay.destroy();
 *
 * @see DataSourceDisplay#isDestroyed
 */
DataSourceDisplay.prototype.destroy = function () {
  this._eventHelper.removeAll();

  const dataSourceCollection = this._dataSourceCollection;
  for (let i = 0, length = dataSourceCollection.length; i < length; ++i) {
    this._onDataSourceRemoved(
      this._dataSourceCollection,
      dataSourceCollection.get(i),
    );
  }
  this._onDataSourceRemoved(undefined, this._defaultDataSource);

  if (defined(this._removeDefaultDataSourceListener)) {
    this._removeDefaultDataSourceListener();
    this._removeDataSourceCollectionListener();
  } else {
    this._scene.primitives.remove(this._primitives);
    this._scene.groundPrimitives.remove(this._groundPrimitives);
  }

  return destroyObject(this);
};

/**
 * 更新显示到提供的时间。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果所有数据源准备好显示，则返回 true；否则返回 false。
 */

DataSourceDisplay.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);
  //>>includeEnd('debug');

  if (!ApproximateTerrainHeights.initialized) {
    this._ready = false;
    return false;
  }

  let result = true;

  let i;
  let x;
  let visualizers;
  let vLength;
  const dataSources = this._dataSourceCollection;
  const length = dataSources.length;
  for (i = 0; i < length; i++) {
    const dataSource = dataSources.get(i);
    if (defined(dataSource.update)) {
      result = dataSource.update(time) && result;
    }

    visualizers = dataSource._visualizers;
    vLength = visualizers.length;
    for (x = 0; x < vLength; x++) {
      result = visualizers[x].update(time) && result;
    }
  }

  visualizers = this._defaultDataSource._visualizers;
  vLength = visualizers.length;
  for (x = 0; x < vLength; x++) {
    result = visualizers[x].update(time) && result;
  }

  // Request a rendering of the scene when the data source
  // becomes 'ready' for the first time
  if (!this._ready && result) {
    this._scene.requestRender();
  }
  this._ready = result;

  return result;
};

DataSourceDisplay.prototype._postRender = function () {
  // Adds credits for all datasources
  const frameState = this._scene.frameState;
  const dataSources = this._dataSourceCollection;
  const length = dataSources.length;
  for (let i = 0; i < length; i++) {
    const dataSource = dataSources.get(i);

    const credit = dataSource.credit;
    if (defined(credit)) {
      frameState.creditDisplay.addCreditToNextFrame(credit);
    }

    // Credits from the resource that the user can't remove
    const credits = dataSource._resourceCredits;
    if (defined(credits)) {
      const creditCount = credits.length;
      for (let c = 0; c < creditCount; c++) {
        frameState.creditDisplay.addCreditToNextFrame(credits[c]);
      }
    }
  }
};

const getBoundingSphereArrayScratch = [];
const getBoundingSphereBoundingSphereScratch = new BoundingSphere();

/**
 * 计算包围指定实体所生成可视化的包围球。
 * 包围球位于场景地球的固定坐标系中。
 *
 * @param {Entity} entity 要计算包围球的实体。
 * @param {boolean} allowPartial 如果为 true，则忽略待处理的包围球，将从当前可用的数据中返回答案。
 *                                如果为 false，一旦有任何包围球待处理，该函数将暂停并返回待处理状态。
 * @param {BoundingSphere} result 用于存储结果的包围球。
 * @returns {BoundingSphereState} 如果结果包含包围球，则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中，则返回 BoundingSphereState.PENDING，
 *                       如果实体在当前场景中没有可视化，则返回 BoundingSphereState.FAILED。
 * @private
 */

DataSourceDisplay.prototype.getBoundingSphere = function (
  entity,
  allowPartial,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("entity", entity);
  Check.typeOf.bool("allowPartial", allowPartial);
  Check.defined("result", result);
  //>>includeEnd('debug');

  if (!this._ready && !allowPartial) {
    return BoundingSphereState.PENDING;
  }

  let i;
  let length;
  let dataSource = this._defaultDataSource;
  if (!dataSource.entities.contains(entity)) {
    dataSource = undefined;

    const dataSources = this._dataSourceCollection;
    length = dataSources.length;
    for (i = 0; i < length; i++) {
      const d = dataSources.get(i);
      if (d.entities.contains(entity)) {
        dataSource = d;
        break;
      }
    }
  }

  if (!defined(dataSource)) {
    return BoundingSphereState.FAILED;
  }

  const boundingSpheres = getBoundingSphereArrayScratch;
  const tmp = getBoundingSphereBoundingSphereScratch;

  let count = 0;
  let state = BoundingSphereState.DONE;
  const visualizers = dataSource._visualizers;
  const visualizersLength = visualizers.length;

  for (i = 0; i < visualizersLength; i++) {
    const visualizer = visualizers[i];
    if (defined(visualizer.getBoundingSphere)) {
      state = visualizers[i].getBoundingSphere(entity, tmp);
      if (!allowPartial && state === BoundingSphereState.PENDING) {
        return BoundingSphereState.PENDING;
      } else if (state === BoundingSphereState.DONE) {
        boundingSpheres[count] = BoundingSphere.clone(
          tmp,
          boundingSpheres[count],
        );
        count++;
      }
    }
  }

  if (count === 0) {
    return BoundingSphereState.FAILED;
  }

  boundingSpheres.length = count;
  BoundingSphere.fromBoundingSpheres(boundingSpheres, result);
  return BoundingSphereState.DONE;
};

DataSourceDisplay.prototype._onDataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  const scene = this._scene;

  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = displayPrimitives.add(new PrimitiveCollection());
  const groundPrimitives = displayGroundPrimitives.add(
    new OrderedGroundPrimitiveCollection(),
  );

  dataSource._primitives = primitives;
  dataSource._groundPrimitives = groundPrimitives;

  const entityCluster = dataSource.clustering;
  entityCluster._initialize(scene);

  primitives.add(entityCluster);

  dataSource._visualizers = this._visualizersCallback(
    scene,
    entityCluster,
    dataSource,
  );
};

DataSourceDisplay.prototype._onDataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = dataSource._primitives;
  const groundPrimitives = dataSource._groundPrimitives;

  const entityCluster = dataSource.clustering;
  primitives.remove(entityCluster);

  const visualizers = dataSource._visualizers;
  const length = visualizers.length;
  for (let i = 0; i < length; i++) {
    visualizers[i].destroy();
  }

  displayPrimitives.remove(primitives);
  displayGroundPrimitives.remove(groundPrimitives);

  dataSource._visualizers = undefined;
};

DataSourceDisplay.prototype._onDataSourceMoved = function (
  dataSource,
  newIndex,
  oldIndex,
) {
  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = dataSource._primitives;
  const groundPrimitives = dataSource._groundPrimitives;

  if (newIndex === oldIndex + 1) {
    displayPrimitives.raise(primitives);
    displayGroundPrimitives.raise(groundPrimitives);
  } else if (newIndex === oldIndex - 1) {
    displayPrimitives.lower(primitives);
    displayGroundPrimitives.lower(groundPrimitives);
  } else if (newIndex === 0) {
    displayPrimitives.lowerToBottom(primitives);
    displayGroundPrimitives.lowerToBottom(groundPrimitives);
    displayPrimitives.raise(primitives); // keep defaultDataSource primitives at index 0 since it's not in the collection
    displayGroundPrimitives.raise(groundPrimitives);
  } else {
    displayPrimitives.raiseToTop(primitives);
    displayGroundPrimitives.raiseToTop(groundPrimitives);
  }
};

/**
 * 创建用于可视化的可视化器数组的函数。
 * @callback DataSourceDisplay.VisualizersCallback
 *
 * @param {Scene} scene 要为其创建可视化器的场景。
 * @param {EntityCluster} entityCluster 要为其创建可视化器的实体集群。
 * @param {DataSource} dataSource 要为其创建可视化器的数据源。
 * @returns {Visualizer[]} 用于可视化的可视化器数组。
 *
 * @example
 * function createVisualizers(scene, entityCluster, dataSource) {
 *     return [new Cesium.BillboardVisualizer(entityCluster, dataSource.entities)];
 * }
 */

export default DataSourceDisplay;
