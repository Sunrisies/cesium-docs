import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import ImageryLayer from "./ImageryLayer.js";

/**
 * 一个有序的图像层集合。
 *
 * @alias ImageryLayerCollection
 * @constructor
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Adjustment.html|Cesium Sandcastle Imagery Adjustment Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers%20Manipulation.html|Cesium Sandcastle Imagery Manipulation Demo}
 */
function ImageryLayerCollection() {
  this._layers = [];

  /**
   * 当层被添加到集合时引发的事件。事件处理程序接收被添加的层和添加位置的索引。
   * @type {Event}
   * @default Event()
   */
  this.layerAdded = new Event();

  /**
   * 当层从集合中移除时引发的事件。事件处理程序接收被移除的层和移除位置的索引。
   * @type {Event}
   * @default Event()
   */
  this.layerRemoved = new Event();

  /**
   * 当层在集合中位置发生变化时引发的事件。事件处理程序接收被移动的层、移动后的新索引和移动前的旧索引。
   * @type {Event}
   * @default Event()
   */
  this.layerMoved = new Event();

  /**
   * 当层通过设置 {@link ImageryLayer#show} 属性被显示或隐藏时引发的事件。事件处理程序接收对该层的引用、
   * 在集合中的索引，以及一个标志，该标志为 true 表示层现在显示，为 false 表示层现在隐藏。
   *
   * @type {Event}
   * @default Event()
   */
  this.layerShownOrHidden = new Event();
}


Object.defineProperties(ImageryLayerCollection.prototype, {
  /**
   * 获取此集合中的层数量。
   * @memberof ImageryLayerCollection.prototype
   * @type {number}
   */

  length: {
    get: function () {
      return this._layers.length;
    },
  },
});

/**
 * 将一个图层添加到集合中。
 *
 * @param {ImageryLayer} layer 要添加的图层。
 * @param {number} [index] 添加图层的索引。如果省略，则图层将
 *                         被添加到所有现有图层之上。
 *
 * @exception {DeveloperError} 如果提供 index，则必须大于等于零且小于等于层的数量。
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromWorldImagery();
 * scene.imageryLayers.add(imageryLayer);
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * scene.imageryLayers.add(imageryLayer);
 */
ImageryLayerCollection.prototype.add = function (layer, index) {
  const hasIndex = defined(index);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(layer)) {
    throw new DeveloperError("layer is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._layers.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of layers.",
      );
    }
  }
  //>>includeEnd('debug');

  if (!hasIndex) {
    index = this._layers.length;
    this._layers.push(layer);
  } else {
    this._layers.splice(index, 0, layer);
  }

  this._update();
  this.layerAdded.raiseEvent(layer, index);
  const removeReadyEventListener = layer.readyEvent.addEventListener(() => {
    this.layerShownOrHidden.raiseEvent(layer, layer._layerIndex, layer.show);
    removeReadyEventListener();
  });
};

/**
 * 使用给定的 ImageryProvider 创建一个新图层并将其添加到集合中。
 *
 * @param {ImageryProvider} imageryProvider 要为其创建新图层的图像提供者。
 * @param {number} [index] 添加图层的索引。如果省略，则图层将
 *                         添加到所有现有图层之上。
 * @returns {ImageryLayer} 新创建的图层。
 *
 * @example
 * try {
 *    const provider = await Cesium.IonImageryProvider.fromAssetId(3812);
 *    scene.imageryLayers.addImageryProvider(provider);
 * } catch (error) {
 *   console.log(`There was an error creating the imagery layer. ${error}`)
 * }
 */
ImageryLayerCollection.prototype.addImageryProvider = function (
  imageryProvider,
  index,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(imageryProvider)) {
    throw new DeveloperError("imageryProvider is required.");
  }
  //>>includeEnd('debug');

  const layer = new ImageryLayer(imageryProvider);
  this.add(layer, index);
  return layer;
};

/**
 * 从此集合中移除一个图层（如果存在）。
 *
 * @param {ImageryLayer} layer 要移除的图层。
 * @param {boolean} [destroy=true] 移除图层的同时是否销毁它们。
 * @returns {boolean} 如果图层在集合中并被移除，则返回 true；
 *                    如果图层不在集合中，则返回 false。
 */

ImageryLayerCollection.prototype.remove = function (layer, destroy) {
  destroy = defaultValue(destroy, true);

  const index = this._layers.indexOf(layer);
  if (index !== -1) {
    this._layers.splice(index, 1);

    this._update();

    this.layerRemoved.raiseEvent(layer, index);

    if (destroy) {
      layer.destroy();
    }

    return true;
  }

  return false;
};

/**
 * 从此集合中移除所有图层。
 *
 * @param {boolean} [destroy=true] 移除图层的同时是否销毁它们。
 */

ImageryLayerCollection.prototype.removeAll = function (destroy) {
  destroy = defaultValue(destroy, true);

  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; i++) {
    const layer = layers[i];
    this.layerRemoved.raiseEvent(layer, i);

    if (destroy) {
      layer.destroy();
    }
  }

  this._layers = [];
};

/**
 * 检查集合中是否包含给定的图层。
 *
 * @param {ImageryLayer} layer 要检查的图层。
 *
 * @returns {boolean} 如果集合包含该图层则返回 true，否則返回 false。
 */

ImageryLayerCollection.prototype.contains = function (layer) {
  return this.indexOf(layer) !== -1;
};

/**
 * 确定集合中给定图层的索引。
 *
 * @param {ImageryLayer} layer 要查找索引的图层。
 *
 * @returns {number} 图层在集合中的索引，如果图层不存在于集合中则返回 -1。
 */

ImageryLayerCollection.prototype.indexOf = function (layer) {
  return this._layers.indexOf(layer);
};

/**
 * 从集合中根据索引获取一个图层。
 *
 * @param {number} index 要检索的索引。
 *
 * @returns {ImageryLayer} 在给定索引处的图像层。
 */

ImageryLayerCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.", "index");
  }
  //>>includeEnd('debug');

  return this._layers[index];
};

function getLayerIndex(layers, layer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(layer)) {
    throw new DeveloperError("layer is required.");
  }
  //>>includeEnd('debug');

  const index = layers.indexOf(layer);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("layer is not in this collection.");
  }
  //>>includeEnd('debug');

  return index;
}

function swapLayers(collection, i, j) {
  const arr = collection._layers;
  i = CesiumMath.clamp(i, 0, arr.length - 1);
  j = CesiumMath.clamp(j, 0, arr.length - 1);

  if (i === j) {
    return;
  }

  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;

  collection._update();

  collection.layerMoved.raiseEvent(temp, j, i);
}

/**
 * 从集合中根据索引获取一个图层。
 *
 * @param {number} index 要检索的索引。
 *
 * @returns {ImageryLayer} 在给定索引处的图像层。
 */

ImageryLayerCollection.prototype.raise = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index + 1);
};

/**
 * 将图层在集合中下移一个位置。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} 图层不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */

ImageryLayerCollection.prototype.lower = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index - 1);
};
/**
 * 将图层提升到集合的顶部。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} 图层不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */

ImageryLayerCollection.prototype.raiseToTop = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  if (index === this._layers.length - 1) {
    return;
  }
  this._layers.splice(index, 1);
  this._layers.push(layer);

  this._update();

  this.layerMoved.raiseEvent(layer, this._layers.length - 1, index);
};

/**
 * 将图层降低到集合的底部。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} 图层不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */

ImageryLayerCollection.prototype.lowerToBottom = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  if (index === 0) {
    return;
  }
  this._layers.splice(index, 1);
  this._layers.splice(0, 0, layer);

  this._update();

  this.layerMoved.raiseEvent(layer, 0, index);
};

const applicableRectangleScratch = new Rectangle();

function pickImageryHelper(scene, pickedLocation, pickFeatures, callback) {
  // Find the terrain tile containing the picked location.
  const tilesToRender = scene.globe._surface._tilesToRender;
  let pickedTile;

  for (
    let textureIndex = 0;
    !defined(pickedTile) && textureIndex < tilesToRender.length;
    ++textureIndex
  ) {
    const tile = tilesToRender[textureIndex];
    if (Rectangle.contains(tile.rectangle, pickedLocation)) {
      pickedTile = tile;
    }
  }

  if (!defined(pickedTile)) {
    return;
  }

  // Pick against all attached imagery tiles containing the pickedLocation.
  const imageryTiles = pickedTile.data.imagery;

  for (let i = imageryTiles.length - 1; i >= 0; --i) {
    const terrainImagery = imageryTiles[i];
    const imagery = terrainImagery.readyImagery;
    if (!defined(imagery)) {
      continue;
    }
    if (!imagery.imageryLayer.ready) {
      continue;
    }
    const provider = imagery.imageryLayer.imageryProvider;
    if (pickFeatures && !defined(provider.pickFeatures)) {
      continue;
    }

    if (!Rectangle.contains(imagery.rectangle, pickedLocation)) {
      continue;
    }

    // If this imagery came from a parent, it may not be applicable to its entire rectangle.
    // Check the textureCoordinateRectangle.
    const applicableRectangle = applicableRectangleScratch;

    const epsilon = 1 / 1024; // 1/4 of a pixel in a typical 256x256 tile.
    applicableRectangle.west = CesiumMath.lerp(
      pickedTile.rectangle.west,
      pickedTile.rectangle.east,
      terrainImagery.textureCoordinateRectangle.x - epsilon,
    );
    applicableRectangle.east = CesiumMath.lerp(
      pickedTile.rectangle.west,
      pickedTile.rectangle.east,
      terrainImagery.textureCoordinateRectangle.z + epsilon,
    );
    applicableRectangle.south = CesiumMath.lerp(
      pickedTile.rectangle.south,
      pickedTile.rectangle.north,
      terrainImagery.textureCoordinateRectangle.y - epsilon,
    );
    applicableRectangle.north = CesiumMath.lerp(
      pickedTile.rectangle.south,
      pickedTile.rectangle.north,
      terrainImagery.textureCoordinateRectangle.w + epsilon,
    );
    if (!Rectangle.contains(applicableRectangle, pickedLocation)) {
      continue;
    }

    callback(imagery);
  }
}

/**
 * 确定与拾取光线相交的图像层。要从屏幕上的位置计算拾取光线，请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 要测试相交的光线。
 * @param {Scene} scene 场景。
 * @return {ImageryLayer[]|undefined} 包含所有与给定拾取光线相交的层的数组。如果没有选定任何层，则返回 undefined。
 *
 */

ImageryLayerCollection.prototype.pickImageryLayers = function (ray, scene) {
  // Find the picked location on the globe.
  const pickedPosition = scene.globe.pick(ray, scene);
  if (!defined(pickedPosition)) {
    return;
  }

  const pickedLocation =
    scene.ellipsoid.cartesianToCartographic(pickedPosition);

  const imageryLayers = [];

  pickImageryHelper(scene, pickedLocation, false, function (imagery) {
    imageryLayers.push(imagery.imageryLayer);
  });

  if (imageryLayers.length === 0) {
    return undefined;
  }

  return imageryLayers;
};

/**
 * 异步确定与拾取光线相交的图像图层特征。通过对每个与拾取光线相交的图像层瓦片调用 {@link ImageryProvider#pickFeatures} 
 * 来找到相交的图像层特征。要从屏幕上的位置计算拾取光线，请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 要测试相交的光线。
 * @param {Scene} scene 场景。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个 Promise，解析为与拾取光线相交的特征数组。
 *                                             如果可以快速确定没有特征相交（例如，因为没有活动的图像提供者支持 
 *                                             {@link ImageryProvider#pickFeatures} 或因为拾取光线未与表面相交），
 *                                             此函数将返回 undefined。
 *
 * @example
 * const pickRay = viewer.camera.getPickRay(windowPosition);
 * const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(pickRay, viewer.scene);
 * if (!Cesium.defined(featuresPromise)) {
 *     console.log('No features picked.');
 * } else {
 *     Promise.resolve(featuresPromise).then(function(features) {
 *         // This function is called asynchronously when the list if picked features is available.
 *         console.log(`Number of features: ${features.length}`);
 *         if (features.length > 0) {
 *             console.log(`First feature name: ${features[0].name}`);
 *         }
 *     });
 * }
 */
ImageryLayerCollection.prototype.pickImageryLayerFeatures = function (
  ray,
  scene,
) {
  // Find the picked location on the globe.
  const pickedPosition = scene.globe.pick(ray, scene);
  if (!defined(pickedPosition)) {
    return;
  }

  const pickedLocation =
    scene.ellipsoid.cartesianToCartographic(pickedPosition);

  const promises = [];
  const imageryLayers = [];

  pickImageryHelper(scene, pickedLocation, true, function (imagery) {
    if (!imagery.imageryLayer.ready) {
      return undefined;
    }
    const provider = imagery.imageryLayer.imageryProvider;
    const promise = provider.pickFeatures(
      imagery.x,
      imagery.y,
      imagery.level,
      pickedLocation.longitude,
      pickedLocation.latitude,
    );
    if (defined(promise)) {
      promises.push(promise);
      imageryLayers.push(imagery.imageryLayer);
    }
  });

  if (promises.length === 0) {
    return undefined;
  }
  return Promise.all(promises).then(function (results) {
    const features = [];
    for (let resultIndex = 0; resultIndex < results.length; ++resultIndex) {
      const result = results[resultIndex];
      const image = imageryLayers[resultIndex];
      if (defined(result) && result.length > 0) {
        for (
          let featureIndex = 0;
          featureIndex < result.length;
          ++featureIndex
        ) {
          const feature = result[featureIndex];
          feature.imageryLayer = image;
          // For features without a position, use the picked location.
          if (!defined(feature.position)) {
            feature.position = pickedLocation;
          }
          features.push(feature);
        }
      }
    }
    return features;
  });
};

/**
 * 更新帧状态以执行任何排队的纹理重新投影。
 *
 * @private
 *
 * @param {FrameState} frameState 帧状态。
 */

ImageryLayerCollection.prototype.queueReprojectionCommands = function (
  frameState,
) {
  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; ++i) {
    layers[i].queueReprojectionCommands(frameState);
  }
};

/**
 * 取消排队在下一帧的重新投影命令。
 *
 * @private
 */

ImageryLayerCollection.prototype.cancelReprojections = function () {
  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; ++i) {
    layers[i].cancelReprojections();
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应再使用它；调用除 <code>isDestroyed</code> 之外的任何函数
 * 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @see ImageryLayerCollection#destroy
 */

ImageryLayerCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中所有层持有的 WebGL 资源。显式销毁此对象允许确定性地释放
 * WebGL 资源，而不是依赖垃圾收集器。
 * <br /><br />
 * 一旦此对象被销毁，就不应再使用它；调用除 <code>isDestroyed</code> 之外的任何函数
 * 将导致 {@link DeveloperError} 异常。因此，将返回值（<code>undefined</code>）分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 *
 * @example
 * layerCollection = layerCollection && layerCollection.destroy();
 *
 * @see ImageryLayerCollection#isDestroyed
 */

ImageryLayerCollection.prototype.destroy = function () {
  this.removeAll(true);
  return destroyObject(this);
};

ImageryLayerCollection.prototype._update = function () {
  let isBaseLayer = true;
  const layers = this._layers;
  let layersShownOrHidden;
  let layer;
  let i, len;
  for (i = 0, len = layers.length; i < len; ++i) {
    layer = layers[i];

    layer._layerIndex = i;

    if (layer.show) {
      layer._isBaseLayer = isBaseLayer;
      isBaseLayer = false;
    } else {
      layer._isBaseLayer = false;
    }

    if (layer.show !== layer._show) {
      if (defined(layer._show)) {
        if (!defined(layersShownOrHidden)) {
          layersShownOrHidden = [];
        }
        layersShownOrHidden.push(layer);
      }
      layer._show = layer.show;
    }
  }

  if (defined(layersShownOrHidden)) {
    for (i = 0, len = layersShownOrHidden.length; i < len; ++i) {
      layer = layersShownOrHidden[i];
      this.layerShownOrHidden.raiseEvent(layer, layer._layerIndex, layer.show);
    }
  }
};
export default ImageryLayerCollection;
