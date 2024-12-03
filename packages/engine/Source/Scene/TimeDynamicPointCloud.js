import Check from "../Core/Check.js";
import combine from "../Core/combine.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Event from "../Core/Event.js";
import getTimestamp from "../Core/getTimestamp.js";
import JulianDate from "../Core/JulianDate.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import ClippingPlaneCollection from "./ClippingPlaneCollection.js";
import PointCloud from "./PointCloud.js";
import PointCloudEyeDomeLighting from "./PointCloudEyeDomeLighting.js";
import PointCloudShading from "./PointCloudShading.js";
import SceneMode from "./SceneMode.js";
import ShadowMode from "./ShadowMode.js";

/**
 * 提供时间动态点云数据的回放。
 * <p>
 * 点云帧在由平均帧加载时间和当前时钟速度决定的间隔中预加载。
 * 如果中间帧无法及时加载以满足播放速度，则将跳过它们。如果帧足够小或时钟速度足够慢，则不会跳过任何帧。
 * </p>
 *
 * @alias TimeDynamicPointCloud
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Clock} options.clock 用于确定时间维度值的 {@link Clock} 实例。
 * @param {TimeIntervalCollection} options.intervals 一个 {@link TimeIntervalCollection}，其data属性是一个包含指向3D Tiles点云瓦片的<code>uri</code>和可选<code>transform</code>的对象。
 * @param {boolean} [options.show=true] 确定点云是否显示。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 用于变换点云的4x4变换矩阵。
 * @param {ShadowMode} [options.shadows=ShadowMode.ENABLED] 确定点云是否会从光源投射或接收阴影。
 * @param {number} [options.maximumMemoryUsage=256] 点云可以使用的最大内存量（以MB为单位）。
 * @param {object} [options.shading] 用于构造 {@link PointCloudShading} 对象的选项，以控制点衰减和眼罩照明。
 * @param {Cesium3DTileStyle} [options.style] 使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles样式语言} 定义的样式，应用于点云中的每个点。
 * @param {ClippingPlaneCollection} [options.clippingPlanes] {@link ClippingPlaneCollection}，用于选择性禁用点云的渲染。
 */

function TimeDynamicPointCloud(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.clock", options.clock);
  Check.typeOf.object("options.intervals", options.intervals);
  //>>includeEnd('debug');

  /**
   * 确定点云是否会被显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 用于变换点云的4x4变换矩阵。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */

  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );

  /**
   * 确定点云是否会从光源投射或接收阴影。
   * <p>
   * 启用阴影会影响性能。投射阴影的点云必须渲染两次，一次从相机角度渲染，另一次从光源的视角渲染。
   * </p>
   * <p>
   * 仅当 {@link Viewer#shadows} 为 <code>true</code> 时，才会渲染阴影。
   * </p>
   *
   * @type {ShadowMode}
   * @default ShadowMode.ENABLED
   */
  this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);

  /**
   * 用于缓存点云帧的最大GPU内存（以MB为单位）。
   * <p>
   * 不被加载或渲染的帧将被卸载以强制执行此限制。
   * </p>
   * <p>
   * 如果减少此值导致卸载瓦片，则在下一帧卸载这些瓦片。
   * </p>
   *
   * @type {number}
   * @default 256
   *
   * @see TimeDynamicPointCloud#totalMemoryUsageInBytes
   */

  this.maximumMemoryUsage = defaultValue(options.maximumMemoryUsage, 256);

  /**
   * 用于基于几何误差和眼罩照明控制点大小的选项。
   * @type {PointCloudShading}
   */

  this.shading = new PointCloudShading(options.shading);

  /**
   * 使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 定义的样式，
   * 应用到点云中的每个点。
   * <p>
   * 赋值 <code>undefined</code> 将移除样式，在未应用任何样式时将点云的视觉外观恢复为默认。
   * </p>
   *
   * @type {Cesium3DTileStyle}
   *
   * @example
   * pointCloud.style = new Cesium.Cesium3DTileStyle({
   *    color : {
   *        conditions : [
   *            ['${Classification} === 0', 'color("purple", 0.5)'],
   *            ['${Classification} === 1', 'color("red")'],
   *            ['true', '${COLOR}']
   *        ]
   *    },
   *    show : '${Classification} !== 2'
   * });
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
   */
  this.style = options.style;

  /**
   * 触发的事件，指示帧加载失败。如果请求其uri失败或由于内容无效而导致处理失败，帧可能会加载失败。
   * <p>
   * 如果没有事件监听器，将在控制台记录错误消息。
   * </p>
   * <p>
   * 传递给监听器的错误对象包含两个属性：
   * <ul>
   * <li><code>uri</code>: 加载失败的帧的uri。</li>
   * <li><code>message</code>: 错误消息。</li>
   * </ul>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * pointCloud.frameFailed.addEventListener(function(error) {
   *     console.log(`An error occurred loading frame: ${error.uri}`);
   *     console.log(`Error: ${error.message}`);
   * });
   */
  this.frameFailed = new Event();

  /**
   * 触发的事件，指示新帧已渲染。
   * <p>
   * 时间动态点云 {@link TimeDynamicPointCloud} 会传递给事件监听器。
   * </p>
   * @type {Event}
   * @default new Event()
   *
   * @example
   * pointCloud.frameChanged.addEventListener(function(timeDynamicPointCloud) {
   *     viewer.camera.viewBoundingSphere(timeDynamicPointCloud.boundingSphere);
   * });
   */
  this.frameChanged = new Event();

  this._clock = options.clock;
  this._intervals = options.intervals;
  this._clippingPlanes = undefined;
  this.clippingPlanes = options.clippingPlanes; // Call setter
  this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();
  this._loadTimestamp = undefined;
  this._clippingPlanesState = 0;
  this._styleDirty = false;
  this._pickId = undefined;
  this._totalMemoryUsageInBytes = 0;
  this._frames = [];
  this._previousInterval = undefined;
  this._nextInterval = undefined;
  this._lastRenderedFrame = undefined;
  this._clockMultiplier = 0.0;

  // For calculating average load time of the last N frames
  this._runningSum = 0.0;
  this._runningLength = 0;
  this._runningIndex = 0;
  this._runningSamples = new Array(5).fill(0.0);
  this._runningAverage = 0.0;
}

Object.defineProperties(TimeDynamicPointCloud.prototype, {
  /**
   * 用于选择性禁用点云渲染的 {@link ClippingPlaneCollection}。
   *
   * @memberof TimeDynamicPointCloud.prototype
   *
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._clippingPlanes;
    },
    set: function (value) {
      ClippingPlaneCollection.setOwner(value, this, "_clippingPlanes");
    },
  },

  /**
   * 点云使用的GPU内存总量（以字节为单位）。
   *
   * @memberof TimeDynamicPointCloud.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see TimeDynamicPointCloud#maximumMemoryUsage
   */
  totalMemoryUsageInBytes: {
    get: function () {
      return this._totalMemoryUsageInBytes;
    },
  },

  /**
   * 正在渲染的帧的包围球。如果没有帧被渲染，则返回 <code>undefined</code>。
   *
   * @memberof TimeDynamicPointCloud.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   */
  boundingSphere: {
    get: function () {
      if (defined(this._lastRenderedFrame)) {
        return this._lastRenderedFrame.pointCloud.boundingSphere;
      }
      return undefined;
    },
  },
});


function getFragmentShaderLoaded(fs) {
  return `uniform vec4 czm_pickColor;\n${fs}`;
}

function getUniformMapLoaded(stream) {
  return function (uniformMap) {
    return combine(uniformMap, {
      czm_pickColor: function () {
        return stream._pickId.color;
      },
    });
  };
}

function getPickIdLoaded() {
  return "czm_pickColor";
}

/**
 * 将点云的 {@link TimeDynamicPointCloud#style} 标记为脏，这会迫使所有
 * 点在下一帧中重新评估样式。
 */

TimeDynamicPointCloud.prototype.makeStyleDirty = function () {
  this._styleDirty = true;
};

/**
 * 公开用于测试。
 *
 * @private
 */

TimeDynamicPointCloud.prototype._getAverageLoadTime = function () {
  if (this._runningLength === 0) {
    // Before any frames have loaded make a best guess about the average load time
    return 0.05;
  }
  return this._runningAverage;
};

const scratchDate = new JulianDate();

function getClockMultiplier(that) {
  const clock = that._clock;
  const isAnimating = clock.canAnimate && clock.shouldAnimate;
  const multiplier = clock.multiplier;
  return isAnimating ? multiplier : 0.0;
}

function getIntervalIndex(that, interval) {
  return that._intervals.indexOf(interval.start);
}

function getNextInterval(that, currentInterval) {
  const intervals = that._intervals;
  const clock = that._clock;
  const multiplier = getClockMultiplier(that);

  if (multiplier === 0.0) {
    return undefined;
  }

  const averageLoadTime = that._getAverageLoadTime();
  const time = JulianDate.addSeconds(
    clock.currentTime,
    averageLoadTime * multiplier,
    scratchDate,
  );
  let index = intervals.indexOf(time);

  const currentIndex = getIntervalIndex(that, currentInterval);
  if (index === currentIndex) {
    if (multiplier >= 0) {
      ++index;
    } else {
      --index;
    }
  }

  // Returns undefined if not in range
  return intervals.get(index);
}

function getCurrentInterval(that) {
  const intervals = that._intervals;
  const clock = that._clock;
  const time = clock.currentTime;
  const index = intervals.indexOf(time);

  // Returns undefined if not in range
  return intervals.get(index);
}

function reachedInterval(that, currentInterval, nextInterval) {
  const multiplier = getClockMultiplier(that);
  const currentIndex = getIntervalIndex(that, currentInterval);
  const nextIndex = getIntervalIndex(that, nextInterval);

  if (multiplier >= 0) {
    return currentIndex >= nextIndex;
  }
  return currentIndex <= nextIndex;
}

function handleFrameFailure(that, uri) {
  return function (error) {
    const message = defined(error.message) ? error.message : error.toString();
    if (that.frameFailed.numberOfListeners > 0) {
      that.frameFailed.raiseEvent({
        uri: uri,
        message: message,
      });
    } else {
      console.log(`A frame failed to load: ${uri}`);
      console.log(`Error: ${message}`);
    }
  };
}

function requestFrame(that, interval, frameState) {
  const index = getIntervalIndex(that, interval);
  const frames = that._frames;
  let frame = frames[index];
  if (!defined(frame)) {
    const transformArray = interval.data.transform;
    const transform = defined(transformArray)
      ? Matrix4.fromArray(transformArray)
      : undefined;
    const uri = interval.data.uri;
    frame = {
      pointCloud: undefined,
      transform: transform,
      timestamp: getTimestamp(),
      sequential: true,
      ready: false,
      touchedFrameNumber: frameState.frameNumber,
      uri: uri,
    };
    frames[index] = frame;
    Resource.fetchArrayBuffer({
      url: uri,
    })
      .then(function (arrayBuffer) {
        // PERFORMANCE_IDEA: share a memory pool, render states, shaders, and other resources among all
        // frames. Each frame just needs an index/offset into the pool.
        frame.pointCloud = new PointCloud({
          arrayBuffer: arrayBuffer,
          cull: true,
          fragmentShaderLoaded: getFragmentShaderLoaded,
          uniformMapLoaded: getUniformMapLoaded(that),
          pickIdLoaded: getPickIdLoaded,
        });
      })
      .catch(handleFrameFailure(that, uri));
  }
  return frame;
}

function updateAverageLoadTime(that, loadTime) {
  that._runningSum += loadTime;
  that._runningSum -= that._runningSamples[that._runningIndex];
  that._runningSamples[that._runningIndex] = loadTime;
  that._runningLength = Math.min(
    that._runningLength + 1,
    that._runningSamples.length,
  );
  that._runningIndex = (that._runningIndex + 1) % that._runningSamples.length;
  that._runningAverage = that._runningSum / that._runningLength;
}

function prepareFrame(that, frame, updateState, frameState) {
  if (frame.touchedFrameNumber < frameState.frameNumber - 1) {
    // If this frame was not loaded in sequential updates then it can't be used it for calculating the average load time.
    // For example: selecting a frame on the timeline, selecting another frame before the request finishes, then selecting this frame later.
    frame.sequential = false;
  }

  const pointCloud = frame.pointCloud;

  if (defined(pointCloud) && !frame.ready) {
    // Call update to prepare renderer resources. Don't render anything yet.
    const commandList = frameState.commandList;
    const lengthBeforeUpdate = commandList.length;
    renderFrame(that, frame, updateState, frameState);

    if (pointCloud.ready) {
      // Point cloud became ready this update
      frame.ready = true;
      that._totalMemoryUsageInBytes += pointCloud.geometryByteLength;
      commandList.length = lengthBeforeUpdate; // Don't allow preparing frame to insert commands.
      if (frame.sequential) {
        // Update the values used to calculate average load time
        const loadTime = (getTimestamp() - frame.timestamp) / 1000.0;
        updateAverageLoadTime(that, loadTime);
      }
    }
  }

  frame.touchedFrameNumber = frameState.frameNumber;
}

const scratchModelMatrix = new Matrix4();

function getGeometricError(that, pointCloud) {
  const shading = that.shading;
  if (defined(shading) && defined(shading.baseResolution)) {
    return shading.baseResolution;
  } else if (defined(pointCloud.boundingSphere)) {
    return CesiumMath.cbrt(
      pointCloud.boundingSphere.volume() / pointCloud.pointsLength,
    );
  }
  return 0.0;
}

function getMaximumAttenuation(that) {
  const shading = that.shading;
  if (defined(shading) && defined(shading.maximumAttenuation)) {
    return shading.maximumAttenuation;
  }

  // Return a hardcoded maximum attenuation. For a tileset this would instead be the maximum screen space error.
  return 10.0;
}

const defaultShading = new PointCloudShading();

function renderFrame(that, frame, updateState, frameState) {
  const shading = defaultValue(that.shading, defaultShading);
  const pointCloud = frame.pointCloud;
  const transform = defaultValue(frame.transform, Matrix4.IDENTITY);
  pointCloud.modelMatrix = Matrix4.multiplyTransformation(
    that.modelMatrix,
    transform,
    scratchModelMatrix,
  );
  pointCloud.style = that.style;
  pointCloud.time = updateState.timeSinceLoad;
  pointCloud.shadows = that.shadows;
  pointCloud.clippingPlanes = that._clippingPlanes;
  pointCloud.isClipped = updateState.isClipped;
  pointCloud.attenuation = shading.attenuation;
  pointCloud.backFaceCulling = shading.backFaceCulling;
  pointCloud.normalShading = shading.normalShading;
  pointCloud.geometricError = getGeometricError(that, pointCloud);
  pointCloud.geometricErrorScale = shading.geometricErrorScale;
  pointCloud.maximumAttenuation = getMaximumAttenuation(that);

  try {
    pointCloud.update(frameState);
  } catch (error) {
    handleFrameFailure(that, frame.uri)(error);
  }

  frame.touchedFrameNumber = frameState.frameNumber;
}

function loadFrame(that, interval, updateState, frameState) {
  const frame = requestFrame(that, interval, frameState);
  prepareFrame(that, frame, updateState, frameState);
}

function getUnloadCondition(frameState) {
  return function (frame) {
    // Unload all frames that aren't currently being loaded or rendered
    return frame.touchedFrameNumber < frameState.frameNumber;
  };
}

function unloadFrames(that, unloadCondition) {
  const frames = that._frames;
  const length = frames.length;
  for (let i = 0; i < length; ++i) {
    const frame = frames[i];
    if (defined(frame)) {
      if (!defined(unloadCondition) || unloadCondition(frame)) {
        const pointCloud = frame.pointCloud;
        if (frame.ready) {
          that._totalMemoryUsageInBytes -= pointCloud.geometryByteLength;
        }
        if (defined(pointCloud)) {
          pointCloud.destroy();
        }
        if (frame === that._lastRenderedFrame) {
          that._lastRenderedFrame = undefined;
        }
        frames[i] = undefined;
      }
    }
  }
}

function getFrame(that, interval) {
  const index = getIntervalIndex(that, interval);
  const frame = that._frames[index];
  if (defined(frame) && frame.ready) {
    return frame;
  }
}

function updateInterval(that, interval, frame, updateState, frameState) {
  if (defined(frame)) {
    if (frame.ready) {
      return true;
    }
    loadFrame(that, interval, updateState, frameState);
    return frame.ready;
  }
  return false;
}

function getNearestReadyInterval(
  that,
  previousInterval,
  currentInterval,
  updateState,
  frameState,
) {
  let i;
  let interval;
  let frame;
  const intervals = that._intervals;
  const frames = that._frames;
  const currentIndex = getIntervalIndex(that, currentInterval);
  const previousIndex = getIntervalIndex(that, previousInterval);

  if (currentIndex >= previousIndex) {
    // look backwards
    for (i = currentIndex; i >= previousIndex; --i) {
      interval = intervals.get(i);
      frame = frames[i];
      if (updateInterval(that, interval, frame, updateState, frameState)) {
        return interval;
      }
    }
  } else {
    // look forwards
    for (i = currentIndex; i <= previousIndex; ++i) {
      interval = intervals.get(i);
      frame = frames[i];
      if (updateInterval(that, interval, frame, updateState, frameState)) {
        return interval;
      }
    }
  }

  // If no intervals are ready return the previous interval
  return previousInterval;
}

function setFramesDirty(that, clippingPlanesDirty, styleDirty) {
  const frames = that._frames;
  const framesLength = frames.length;
  for (let i = 0; i < framesLength; ++i) {
    const frame = frames[i];
    if (defined(frame) && defined(frame.pointCloud)) {
      frame.pointCloud.clippingPlanesDirty = clippingPlanesDirty;
      frame.pointCloud.styleDirty = styleDirty;
    }
  }
}

const updateState = {
  timeSinceLoad: 0,
  isClipped: false,
  clippingPlanesDirty: false,
};

/**
 * @private
 */
TimeDynamicPointCloud.prototype.update = function (frameState) {
  if (frameState.mode === SceneMode.MORPHING) {
    return;
  }

  if (!this.show) {
    return;
  }

  if (!defined(this._pickId)) {
    this._pickId = frameState.context.createPickId({
      primitive: this,
    });
  }

  if (!defined(this._loadTimestamp)) {
    this._loadTimestamp = JulianDate.clone(frameState.time);
  }

  // For styling
  const timeSinceLoad = Math.max(
    JulianDate.secondsDifference(frameState.time, this._loadTimestamp) * 1000,
    0.0,
  );

  // Update clipping planes
  const clippingPlanes = this._clippingPlanes;
  let clippingPlanesState = 0;
  let clippingPlanesDirty = false;
  const isClipped = defined(clippingPlanes) && clippingPlanes.enabled;

  if (isClipped) {
    clippingPlanes.update(frameState);
    clippingPlanesState = clippingPlanes.clippingPlanesState;
  }

  if (this._clippingPlanesState !== clippingPlanesState) {
    this._clippingPlanesState = clippingPlanesState;
    clippingPlanesDirty = true;
  }

  const styleDirty = this._styleDirty;
  this._styleDirty = false;

  if (clippingPlanesDirty || styleDirty) {
    setFramesDirty(this, clippingPlanesDirty, styleDirty);
  }

  updateState.timeSinceLoad = timeSinceLoad;
  updateState.isClipped = isClipped;

  const shading = this.shading;
  const eyeDomeLighting = this._pointCloudEyeDomeLighting;

  const commandList = frameState.commandList;
  const lengthBeforeUpdate = commandList.length;

  let previousInterval = this._previousInterval;
  let nextInterval = this._nextInterval;
  const currentInterval = getCurrentInterval(this);

  if (!defined(currentInterval)) {
    return;
  }

  let clockMultiplierChanged = false;
  const clockMultiplier = getClockMultiplier(this);
  const clockPaused = clockMultiplier === 0;
  if (clockMultiplier !== this._clockMultiplier) {
    clockMultiplierChanged = true;
    this._clockMultiplier = clockMultiplier;
  }

  if (!defined(previousInterval) || clockPaused) {
    previousInterval = currentInterval;
  }

  if (
    !defined(nextInterval) ||
    clockMultiplierChanged ||
    reachedInterval(this, currentInterval, nextInterval)
  ) {
    nextInterval = getNextInterval(this, currentInterval);
  }

  previousInterval = getNearestReadyInterval(
    this,
    previousInterval,
    currentInterval,
    updateState,
    frameState,
  );
  let frame = getFrame(this, previousInterval);

  if (!defined(frame)) {
    // The frame is not ready to render. This can happen when the simulation starts or when scrubbing the timeline
    // to a frame that hasn't loaded yet. Just render the last rendered frame in its place until it finishes loading.
    loadFrame(this, previousInterval, updateState, frameState);
    frame = this._lastRenderedFrame;
  }

  if (defined(frame)) {
    renderFrame(this, frame, updateState, frameState);
  }

  if (defined(nextInterval)) {
    // Start loading the next frame
    loadFrame(this, nextInterval, updateState, frameState);
  }

  const that = this;
  if (defined(frame) && !defined(this._lastRenderedFrame)) {
    frameState.afterRender.push(function () {
      return true;
    });
  }

  if (defined(frame) && frame !== this._lastRenderedFrame) {
    if (that.frameChanged.numberOfListeners > 0) {
      frameState.afterRender.push(function () {
        that.frameChanged.raiseEvent(that);
        return true;
      });
    }
  }

  this._previousInterval = previousInterval;
  this._nextInterval = nextInterval;
  this._lastRenderedFrame = frame;

  const totalMemoryUsageInBytes = this._totalMemoryUsageInBytes;
  const maximumMemoryUsageInBytes = this.maximumMemoryUsage * 1024 * 1024;

  if (totalMemoryUsageInBytes > maximumMemoryUsageInBytes) {
    unloadFrames(this, getUnloadCondition(frameState));
  }

  const lengthAfterUpdate = commandList.length;
  const addedCommandsLength = lengthAfterUpdate - lengthBeforeUpdate;

  if (
    defined(shading) &&
    shading.attenuation &&
    shading.eyeDomeLighting &&
    addedCommandsLength > 0
  ) {
    eyeDomeLighting.update(
      frameState,
      lengthBeforeUpdate,
      shading,
      this.boundingSphere,
    );
  }
};

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code> 如果此对象已被销毁；否则返回 <code>false</code>。
 *
 * @see TimeDynamicPointCloud#destroy
 */

TimeDynamicPointCloud.prototype.isDestroyed = function () {
  return false;
};
/**
 * 销毁此对象持有的WebGL资源。销毁对象允许以确定性的方式释放
 * WebGL资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * pointCloud = pointCloud && pointCloud.destroy();
 *
 * @see TimeDynamicPointCloud#isDestroyed
 */
TimeDynamicPointCloud.prototype.destroy = function () {
  unloadFrames(this);
  this._clippingPlanes = this._clippingPlanes && this._clippingPlanes.destroy();
  this._pickId = this._pickId && this._pickId.destroy();
  return destroyObject(this);
};
export default TimeDynamicPointCloud;
