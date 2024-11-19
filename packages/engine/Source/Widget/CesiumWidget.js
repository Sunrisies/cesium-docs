import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Clock from "../Core/Clock.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import formatError from "../Core/formatError.js";
import HeadingPitchRange from "../Core/HeadingPitchRange.js";
import Matrix4 from "../Core/Matrix4.js";
import BoundingSphereState from "../DataSources/BoundingSphereState.js";
import DataSourceCollection from "../DataSources/DataSourceCollection.js";
import DataSourceDisplay from "../DataSources/DataSourceDisplay.js";
import EntityView from "../DataSources/EntityView.js";
import getElement from "../DataSources/getElement.js";
import Property from "../DataSources/Property.js";
import Cesium3DTileset from "../Scene/Cesium3DTileset.js";
import computeFlyToLocationForRectangle from "../Scene/computeFlyToLocationForRectangle.js";
import Globe from "../Scene/Globe.js";
import ImageryLayer from "../Scene/ImageryLayer.js";
import Moon from "../Scene/Moon.js";
import Scene from "../Scene/Scene.js";
import SceneMode from "../Scene/SceneMode.js";
import ScreenSpaceEventHandler from "../Core/ScreenSpaceEventHandler.js";
import ShadowMode from "../Scene/ShadowMode.js";
import SkyAtmosphere from "../Scene/SkyAtmosphere.js";
import SkyBox from "../Scene/SkyBox.js";
import Sun from "../Scene/Sun.js";
import TimeDynamicPointCloud from "../Scene/TimeDynamicPointCloud.js";
import VoxelPrimitive from "../Scene/VoxelPrimitive.js";

function trackDataSourceClock(clock, dataSource) {
  if (defined(dataSource)) {
    const dataSourceClock = dataSource.clock;
    if (defined(dataSourceClock)) {
      dataSourceClock.getValue(clock);
    }
  }
}

function startRenderLoop(widget) {
  widget._renderLoopRunning = true;

  let lastFrameTime = 0;
  function render(frameTime) {
    if (widget.isDestroyed()) {
      return;
    }

    if (widget._useDefaultRenderLoop) {
      try {
        const targetFrameRate = widget._targetFrameRate;
        if (!defined(targetFrameRate)) {
          widget.resize();
          widget.render();
          requestAnimationFrame(render);
        } else {
          const interval = 1000.0 / targetFrameRate;
          const delta = frameTime - lastFrameTime;

          if (delta > interval) {
            widget.resize();
            widget.render();
            lastFrameTime = frameTime - (delta % interval);
          }
          requestAnimationFrame(render);
        }
      } catch (error) {
        widget._useDefaultRenderLoop = false;
        widget._renderLoopRunning = false;
        if (widget._showRenderLoopErrors) {
          const title =
            "An error occurred while rendering.  Rendering has stopped.";
          widget.showErrorPanel(title, undefined, error);
        }
      }
    } else {
      widget._renderLoopRunning = false;
    }
  }

  requestAnimationFrame(render);
}

function configurePixelRatio(widget) {
  let pixelRatio = widget._useBrowserRecommendedResolution
    ? 1.0
    : window.devicePixelRatio;
  pixelRatio *= widget._resolutionScale;
  if (defined(widget._scene)) {
    widget._scene.pixelRatio = pixelRatio;
  }

  return pixelRatio;
}

function configureCanvasSize(widget) {
  const canvas = widget._canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  const pixelRatio = configurePixelRatio(widget);

  widget._canvasClientWidth = width;
  widget._canvasClientHeight = height;

  width *= pixelRatio;
  height *= pixelRatio;

  canvas.width = width;
  canvas.height = height;

  widget._canRender = width !== 0 && height !== 0;
  widget._lastDevicePixelRatio = window.devicePixelRatio;
}

function configureCameraFrustum(widget) {
  const canvas = widget._canvas;
  const width = canvas.width;
  const height = canvas.height;
  if (width !== 0 && height !== 0) {
    const frustum = widget._scene.camera.frustum;
    if (defined(frustum.aspectRatio)) {
      frustum.aspectRatio = width / height;
    } else {
      frustum.top = frustum.right * (height / width);
      frustum.bottom = -frustum.top;
    }
  }
}

/**
 * 包含 Cesium 场景的小部件。
 *
 * @alias CesiumWidget
 * @constructor
 *
 * @param {Element|string} container 包含小部件的 DOM 元素或 ID。
 * @param {object} [options] 包含以下属性的对象：
 * @param {Clock} [options.clock=new Clock()] 用于控制当前时间的时钟。
 * @param {boolean} [options.shouldAnimate=false] <code>true</code> 如果时钟应尝试默认情况下推进模拟时间，<code>false</code> 否则。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 默认的椭球体。
 * @param {ImageryLayer|false} [options.baseLayer=ImageryLayer.fromWorldImagery()] 应用于地球的最底层影像层。如果设置为 <code>false</code>，则不会添加任何影像提供者。
 * @param {TerrainProvider} [options.terrainProvider=new EllipsoidTerrainProvider(options.ellipsoid)] 地形提供者。
 * @param {Terrain} [options.terrain] 处理异步地形提供者的地形对象。只有在 options.terrainProvider 未定义时才能指定。
 * @param {SkyBox|false} [options.skyBox] 用于渲染星星的天空盒。当 <code>undefined</code> 并且使用 WGS84 椭球体时，将使用默认星星。如果设置为 <code>false</code>，则不会添加任何天空盒、太阳或月亮。
 * @param {SkyAtmosphere|false} [options.skyAtmosphere] 藏蓝天空和地球边缘的光晕。当使用默认椭球体时启用。设置为 <code>false</code> 以关闭它。
 * @param {SceneMode} [options.sceneMode=SceneMode.SCENE3D] 初始场景模式。
 * @param {boolean} [options.scene3DOnly=false] 当 <code>true</code> 时，每个几何实例仅在 3D 中渲染以节省 GPU 内存。
 * @param {boolean} [options.orderIndependentTranslucency=true] 如果为 true，并且配置支持它，则使用无序独立半透明。
 * @param {MapProjection} [options.mapProjection=new GeographicProjection(options.ellipsoid)] 用于 2D 和哥伦布视图模式的地图投影。
 * @param {Globe|false} [options.globe=new Globe(options.ellipsoid)] 用于场景的地球。如果设置为 <code>false</code>，则不会添加地球，天空大气将默认隐藏。
 * @param {boolean} [options.useDefaultRenderLoop=true] 如果该小部件应控制渲染循环，则为 true，否则为 false。
 * @param {boolean} [options.useBrowserRecommendedResolution=true] 如果为 true，则以浏览器推荐的分辨率渲染，忽略 <code>window.devicePixelRatio</code>。
 * @param {number} [options.targetFrameRate] 使用默认渲染循环时的目标帧率。
 * @param {boolean} [options.showRenderLoopErrors=true] 如果为 true，当发生渲染循环错误时，该小部件将自动向用户显示一个 HTML 面板，包含错误信息。
 * @param {boolean} [options.automaticallyTrackDataSourceClocks=true] 如果为 true，该小部件将自动跟踪新添加数据源的时钟设置，并在数据源的时钟变化时更新。如果想独立配置时钟，请将其设置为 false。
 * @param {ContextOptions} [options.contextOptions] 传递给 {@link Scene} 的上下文和 WebGL 创建属性。
 * @param {Element|string} [options.creditContainer] 将包含 {@link CreditDisplay} 的 DOM 元素或 ID。如果未指定，信用信息将添加到小部件底部。
 * @param {Element|string} [options.creditViewport] 将包含 {@link CreditDisplay} 创建的信用弹出窗口的 DOM 元素或 ID。如果未指定，它将出现在小部件本身上。
 * @param {DataSourceCollection} [options.dataSources=new DataSourceCollection()] 由小部件可视化的数据源集合。如果提供此参数，则实例被认为由调用者拥有，当小部件被销毁时将不会被销毁。
 * @param {boolean} [options.shadows=false] 确定光源是否投射阴影。
 * @param {ShadowMode} [options.terrainShadows=ShadowMode.RECEIVE_ONLY] 确定地形是否投射或接收光源的阴影。
 * @param {MapMode2D} [options.mapMode2D=MapMode2D.INFINITE_SCROLL] 确定 2D 地图是否可旋转或在水平方向上可以无限滚动。
 * @param {boolean} [options.blurActiveElementOnCanvasFocus=true] 如果为 true，当小部件的画布被点击时，活动元素将失去焦点。将其设置为 false 在只需点击画布以获取位置或实体数据而不实际意味着将画布设置为活动元素的情况下很有用。
 * @param {boolean} [options.requestRenderMode=false] 如果为 true，将仅在场景内的变化确定时才渲染一帧。启用将改善应用程序的性能，但要求在此模式下使用 {@link Scene#requestRender} 显示地渲染新帧。这在许多情况下是必要的，例如在 API 的其他部分对场景进行更改后。请参阅 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染改善性能}。
 * @param {number} [options.maximumRenderTimeChange=0.0] 如果 requestRenderMode 为 true，则此值定义要求渲染时允许的最大模拟时间变化。请参阅 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染改善性能}。
 * @param {number} [options.msaaSamples=4] 如果提供，此值控制多重采样抗锯齿的速率。典型的多重采样率为每像素 2、4 和有时 8 次采样。更高的 MSAA 采样率可能会影响性能，以换取更好的视觉质量。此值仅适用于支持多重采样渲染目标的 WebGL2 上下文。设置为 1 以禁用 MSAA。
 *
 * @exception {DeveloperError} 文档中不存在 ID 为“container”的元素.
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Cesium%20Widget.html|Cesium Sandcastle Cesium Widget Demo}
 *
 * @example
 * // For each example, include a link to CesiumWidget.css stylesheet in HTML head,
 * // and in the body, include: <div id="cesiumContainer"></div>
 *
 * // Widget with no terrain and default Bing Maps imagery provider.
 * const widget = new Cesium.CesiumWidget("cesiumContainer");
 *
 * // Widget with ion imagery and Cesium World Terrain.
 * const widget2 = new Cesium.CesiumWidget("cesiumContainer", {
 *     baseLayer: Cesium.ImageryLayer.fromWorldTerrain(),
 *     terrain: Cesium.Terrain.fromWorldTerrain()
 *     skyBox: new Cesium.SkyBox({
 *       sources: {
 *         positiveX: "stars/TychoSkymapII.t3_08192x04096_80_px.jpg",
 *         negativeX: "stars/TychoSkymapII.t3_08192x04096_80_mx.jpg",
 *         positiveY: "stars/TychoSkymapII.t3_08192x04096_80_py.jpg",
 *         negativeY: "stars/TychoSkymapII.t3_08192x04096_80_my.jpg",
 *         positiveZ: "stars/TychoSkymapII.t3_08192x04096_80_pz.jpg",
 *         negativeZ: "stars/TychoSkymapII.t3_08192x04096_80_mz.jpg"
 *       }
 *     }),
 *     // Show Columbus View map with Web Mercator projection
 *     sceneMode: Cesium.SceneMode.COLUMBUS_VIEW,
 *     mapProjection: new Cesium.WebMercatorProjection()
 * });
 */
function CesiumWidget(container, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(container)) {
    throw new DeveloperError("container is required.");
  }
  //>>includeEnd('debug');

  container = getElement(container);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //Configure the widget DOM elements
  const element = document.createElement("div");
  element.className = "cesium-widget";
  container.appendChild(element);

  const canvas = document.createElement("canvas");
  const supportsImageRenderingPixelated =
    FeatureDetection.supportsImageRenderingPixelated();
  this._supportsImageRenderingPixelated = supportsImageRenderingPixelated;
  if (supportsImageRenderingPixelated) {
    canvas.style.imageRendering = FeatureDetection.imageRenderingValue();
  }

  canvas.oncontextmenu = function () {
    return false;
  };
  canvas.onselectstart = function () {
    return false;
  };

  // Interacting with a canvas does not automatically blur the previously focused element.
  // This leads to unexpected interaction if the last element was an input field.
  // For example, clicking the mouse wheel could lead to the value in  the field changing
  // unexpectedly. The solution is to blur whatever has focus as soon as canvas interaction begins.
  // Although in some cases the active element needs to stay active even after interacting with the canvas,
  // for example when clicking on it only for getting the data of a clicked position or an entity.
  // For this case, the `blurActiveElementOnCanvasFocus` can be passed with false to avoid blurring
  // the active element after interacting with the canvas.
  function blurActiveElement() {
    if (canvas !== canvas.ownerDocument.activeElement) {
      canvas.ownerDocument.activeElement.blur();
    }
  }

  const blurActiveElementOnCanvasFocus = defaultValue(
    options.blurActiveElementOnCanvasFocus,
    true,
  );

  if (blurActiveElementOnCanvasFocus) {
    canvas.addEventListener("mousedown", blurActiveElement);
    canvas.addEventListener("pointerdown", blurActiveElement);
  }

  element.appendChild(canvas);

  const innerCreditContainer = document.createElement("div");
  innerCreditContainer.className = "cesium-widget-credits";

  const creditContainer = defined(options.creditContainer)
    ? getElement(options.creditContainer)
    : element;
  creditContainer.appendChild(innerCreditContainer);

  const creditViewport = defined(options.creditViewport)
    ? getElement(options.creditViewport)
    : element;

  const showRenderLoopErrors = defaultValue(options.showRenderLoopErrors, true);

  const useBrowserRecommendedResolution = defaultValue(
    options.useBrowserRecommendedResolution,
    true,
  );

  this._element = element;
  this._container = container;
  this._canvas = canvas;
  this._canvasClientWidth = 0;
  this._canvasClientHeight = 0;
  this._lastDevicePixelRatio = 0;
  this._creditViewport = creditViewport;
  this._creditContainer = creditContainer;
  this._innerCreditContainer = innerCreditContainer;
  this._canRender = false;
  this._renderLoopRunning = false;
  this._showRenderLoopErrors = showRenderLoopErrors;
  this._resolutionScale = 1.0;
  this._useBrowserRecommendedResolution = useBrowserRecommendedResolution;
  this._forceResize = false;
  this._entityView = undefined;
  this._clockTrackedDataSource = undefined;
  this._trackedEntity = undefined;
  this._needTrackedEntityUpdate = false;
  this._zoomIsFlight = false;
  this._zoomTarget = undefined;
  this._zoomPromise = undefined;
  this._zoomOptions = undefined;
  this._trackedEntityChanged = new Event();
  this._allowDataSourcesToSuspendAnimation = true;

  this._clock = defined(options.clock) ? options.clock : new Clock();

  if (defined(options.shouldAnimate)) {
    this._clock.shouldAnimate = options.shouldAnimate;
  }

  configureCanvasSize(this);

  try {
    const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);

    const scene = new Scene({
      canvas: canvas,
      contextOptions: options.contextOptions,
      creditContainer: innerCreditContainer,
      creditViewport: creditViewport,
      ellipsoid: ellipsoid,
      mapProjection: options.mapProjection,
      orderIndependentTranslucency: options.orderIndependentTranslucency,
      scene3DOnly: defaultValue(options.scene3DOnly, false),
      shadows: options.shadows,
      mapMode2D: options.mapMode2D,
      requestRenderMode: options.requestRenderMode,
      maximumRenderTimeChange: options.maximumRenderTimeChange,
      depthPlaneEllipsoidOffset: options.depthPlaneEllipsoidOffset,
      msaaSamples: options.msaaSamples,
    });
    this._scene = scene;

    scene.camera.constrainedAxis = Cartesian3.UNIT_Z;

    configurePixelRatio(this);
    configureCameraFrustum(this);

    let globe = options.globe;
    if (!defined(globe)) {
      globe = new Globe(ellipsoid);
    }
    if (globe !== false) {
      scene.globe = globe;
      scene.globe.shadows = defaultValue(
        options.terrainShadows,
        ShadowMode.RECEIVE_ONLY,
      );
    }

    let skyBox = options.skyBox;
    if (!defined(skyBox) && Ellipsoid.WGS84.equals(ellipsoid)) {
      skyBox = SkyBox.createEarthSkyBox();
    }
    if (skyBox !== false) {
      scene.skyBox = skyBox;
      scene.sun = new Sun();

      if (Ellipsoid.WGS84.equals(ellipsoid)) {
        scene.moon = new Moon();
      }
    }

    // Blue sky, and the glow around the Earth's limb.
    let skyAtmosphere = options.skyAtmosphere;
    if (!defined(skyAtmosphere) && Ellipsoid.WGS84.equals(ellipsoid)) {
      skyAtmosphere = new SkyAtmosphere(ellipsoid);
      skyAtmosphere.show = options.globe !== false && globe.show;
    }
    if (skyAtmosphere !== false) {
      scene.skyAtmosphere = skyAtmosphere;
    }

    // Set the base imagery layer
    let baseLayer = options.baseLayer;
    if (options.globe !== false && baseLayer !== false) {
      if (!defined(baseLayer)) {
        baseLayer = ImageryLayer.fromWorldImagery();
      }
      scene.imageryLayers.add(baseLayer);
    }

    // Set the terrain provider if one is provided.
    if (defined(options.terrainProvider) && options.globe !== false) {
      scene.terrainProvider = options.terrainProvider;
    }

    if (defined(options.terrain) && options.globe !== false) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(options.terrainProvider)) {
        throw new DeveloperError(
          "Specify either options.terrainProvider or options.terrain.",
        );
      }
      //>>includeEnd('debug')

      scene.setTerrain(options.terrain);
    }

    this._screenSpaceEventHandler = new ScreenSpaceEventHandler(canvas);

    if (defined(options.sceneMode)) {
      if (options.sceneMode === SceneMode.SCENE2D) {
        this._scene.morphTo2D(0);
      }
      if (options.sceneMode === SceneMode.COLUMBUS_VIEW) {
        this._scene.morphToColumbusView(0);
      }
    }

    this._useDefaultRenderLoop = undefined;
    this.useDefaultRenderLoop = defaultValue(
      options.useDefaultRenderLoop,
      true,
    );

    this._targetFrameRate = undefined;
    this.targetFrameRate = options.targetFrameRate;

    const that = this;
    this._onRenderError = function (scene, error) {
      that._useDefaultRenderLoop = false;
      that._renderLoopRunning = false;
      if (that._showRenderLoopErrors) {
        const title =
          "An error occurred while rendering.  Rendering has stopped.";
        that.showErrorPanel(title, undefined, error);
      }
    };
    scene.renderError.addEventListener(this._onRenderError);

    let dataSourceCollection = options.dataSources;
    let destroyDataSourceCollection = false;
    if (!defined(dataSourceCollection)) {
      dataSourceCollection = new DataSourceCollection();
      destroyDataSourceCollection = true;
    }

    const dataSourceDisplay = new DataSourceDisplay({
      scene: scene,
      dataSourceCollection: dataSourceCollection,
    });

    const eventHelper = new EventHelper();
    this._dataSourceChangedListeners = {};
    this._automaticallyTrackDataSourceClocks =
      options.automaticallyTrackDataSourceClocks ?? true;

    this._dataSourceCollection = dataSourceCollection;
    this._destroyDataSourceCollection = destroyDataSourceCollection;
    this._dataSourceDisplay = dataSourceDisplay;
    this._eventHelper = eventHelper;
    this._canAnimateUpdateCallback = this._updateCanAnimate;

    eventHelper.add(this._clock.onTick, CesiumWidget.prototype._onTick, this);
    eventHelper.add(
      scene.morphStart,
      CesiumWidget.prototype._clearTrackedObject,
      this,
    );

    //Listen to data source events in order to track clock changes.
    eventHelper.add(
      dataSourceCollection.dataSourceAdded,
      CesiumWidget.prototype._onDataSourceAdded,
      this,
    );
    eventHelper.add(
      dataSourceCollection.dataSourceRemoved,
      CesiumWidget.prototype._onDataSourceRemoved,
      this,
    );

    eventHelper.add(scene.postRender, CesiumWidget.prototype._postRender, this);

    // We need to subscribe to the data sources and collections so that we can clear the
    // tracked object when it is removed from the scene.
    // Subscribe to current data sources
    const dataSourceLength = dataSourceCollection.length;
    for (let i = 0; i < dataSourceLength; i++) {
      this._dataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
    }
    this._dataSourceAdded(undefined, dataSourceDisplay.defaultDataSource);

    // Hook up events so that we can subscribe to future sources.
    eventHelper.add(
      dataSourceCollection.dataSourceAdded,
      CesiumWidget.prototype._dataSourceAdded,
      this,
    );
    eventHelper.add(
      dataSourceCollection.dataSourceRemoved,
      CesiumWidget.prototype._dataSourceRemoved,
      this,
    );
  } catch (error) {
    if (showRenderLoopErrors) {
      const title = "Error constructing CesiumWidget.";
      const message =
        'Visit <a href="http://get.webgl.org">http://get.webgl.org</a> to verify that your web browser and hardware support WebGL.  Consider trying a different web browser or updating your video drivers.  Detailed error information is below:';
      this.showErrorPanel(title, message, error);
    }
    throw error;
  }
}

Object.defineProperties(CesiumWidget.prototype, {
  /**
   * 获取父容器.
   * @memberof CesiumWidget.prototype
   *
   * @type {Element}
   * @readonly
   */
  container: {
    get: function () {
      return this._container;
    },
  },

  /**
   * 获取画布。
   * @memberof CesiumWidget.prototype
   *
   * @type {HTMLCanvasElement}
   * @readonly
   */
  canvas: {
    get: function () {
      return this._canvas;
    },
  },

  /**
   * 获取信用容器。
   * @memberof CesiumWidget.prototype
   *
   * @type {Element}
   * @readonly
   */

  creditContainer: {
    get: function () {
      return this._creditContainer;
    },
  },

  /**
   * 获取信用视口
   * @memberof CesiumWidget.prototype
   *
   * @type {Element}
   * @readonly
   */
  creditViewport: {
    get: function () {
      return this._creditViewport;
    },
  },

  /**
   * 获取场景。
   * @memberof CesiumWidget.prototype
   *
   * @type {Scene}
   * @readonly
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },

  /**
   * 获取将在地球上渲染的影像层集合。
   * @memberof CesiumWidget.prototype
   *
   * @type {ImageryLayerCollection}
   * @readonly
   */
  imageryLayers: {
    get: function () {
      return this._scene.imageryLayers;
    },
  },

  /**
   * 提供地球表面几何的地形提供者。
   * @memberof CesiumWidget.prototype
   *
   * @type {TerrainProvider}
   */

  terrainProvider: {
    get: function () {
      return this._scene.terrainProvider;
    },
    set: function (terrainProvider) {
      this._scene.terrainProvider = terrainProvider;
    },
  },

  /**
   * 管理要在屏幕上和灯箱中显示的信用列表。
   * @memberof CesiumWidget.prototype
   *
   * @type {CreditDisplay}
   */
  creditDisplay: {
    get: function () {
      return this._scene.frameState.creditDisplay;
    },
  },

  /**
   * 获取用于 {@link DataSource} 可视化的显示。
   * @memberof CesiumWidget.prototype
   * @type {DataSourceDisplay}
   * @readonly
   */
  dataSourceDisplay: {
    get: function () {
      return this._dataSourceDisplay;
    },
  },

  /**
   * 获取未绑定到特定数据源的实体集合。
   * 这是对 [dataSourceDisplay.defaultDataSource.entities]{@link CesiumWidget#dataSourceDisplay} 的快捷方式。
   * @memberof CesiumWidget.prototype
   * @type {EntityCollection}
   * @readonly
   */
  entities: {
    get: function () {
      return this._dataSourceDisplay.defaultDataSource.entities;
    },
  },

  /**
   * 获取要可视化的 {@link DataSource} 实例集合。
   * @memberof CesiumWidget.prototype
   * @type {DataSourceCollection}
   * @readonly
   */

  dataSources: {
    get: function () {
      return this._dataSourceCollection;
    },
  },

  /**
   * 获取相机。
   * @memberof CesiumWidget.prototype
   *
   * @type {Camera}
   * @readonly
   */
  camera: {
    get: function () {
      return this._scene.camera;
    },
  },

  /**
   * 获取场景的默认椭球体。
   * @memberof CesiumWidget.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._scene.ellipsoid;
    },
  },

  /**
   * 获取时钟。
   * @memberof CesiumWidget.prototype
   *
   * @type {Clock}
   * @readonly
   */
  clock: {
    get: function () {
      return this._clock;
    },
  },

  /**
   * 获取屏幕空间事件处理程序。
   * @memberof CesiumWidget.prototype
   *
   * @type {ScreenSpaceEventHandler}
   * @readonly
   */

  screenSpaceEventHandler: {
    get: function () {
      return this._screenSpaceEventHandler;
    },
  },

  /**
   * 获取或设置小部件的目标帧率，当 <code>useDefaultRenderLoop</code>
   * 为 true 时。如果未定义，浏览器的 requestAnimationFrame 实现
   * 将决定帧率。如果定义，则该值必须大于 0。高于基础 requestAnimationFrame
   * 实现的值将无效。
   * @memberof CesiumWidget.prototype
   *
   * @type {number}
   */

  targetFrameRate: {
    get: function () {
      return this._targetFrameRate;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (value <= 0) {
        throw new DeveloperError(
          "targetFrameRate must be greater than 0, or undefined.",
        );
      }
      //>>includeEnd('debug');
      this._targetFrameRate = value;
    },
  },

  /**
   * 获取或设置该小部件是否应控制渲染循环。
   * 如果为 true，小部件将使用 requestAnimationFrame
   * 进行渲染和调整小部件大小，并驱动
   * 模拟时钟。如果设置为 false，则必须手动调用
   * <code>resize</code> 和 <code>render</code> 方法作为自定义
   * 渲染循环的一部分。如果在渲染过程中发生错误，将引发
   * {@link Scene} 的 <code>renderError</code> 事件，并且此属性
   * 将设置为 false。在错误发生后，必须将其设置回 true
   * 以继续渲染。
   * @memberof CesiumWidget.prototype
   *
   * @type {boolean}
   */

  useDefaultRenderLoop: {
    get: function () {
      return this._useDefaultRenderLoop;
    },
    set: function (value) {
      if (this._useDefaultRenderLoop !== value) {
        this._useDefaultRenderLoop = value;
        if (value && !this._renderLoopRunning) {
          startRenderLoop(this);
        }
      }
    },
  },

  /**
   * 获取或设置渲染分辨率的缩放因子。小于 1.0 的值可以在性能较弱的设备上提高性能，而大于 1.0 的值将以更高的分辨率进行渲染，然后缩小，从而提高视觉保真度。
   * 例如，如果小部件的布局大小为 640x480，将此值设置为 0.5 将导致场景以 320x240 的分辨率渲染，然后放大，而将其设置为 2.0 将导致场景以 1280x960 的分辨率渲染，然后缩小。
   * @memberof CesiumWidget.prototype
   *
   * @type {number}
   * @default 1.0
   */

  resolutionScale: {
    get: function () {
      return this._resolutionScale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (value <= 0) {
        throw new DeveloperError("resolutionScale must be greater than 0.");
      }
      //>>includeEnd('debug');
      if (this._resolutionScale !== value) {
        this._resolutionScale = value;
        this._forceResize = true;
      }
    },
  },

  /**
   * 布尔标志，指示是否使用浏览器推荐的分辨率。
   * 如果为 true，则忽略浏览器的设备像素比，而是使用 1.0，
   * 有效地基于 CSS 像素而不是设备像素进行渲染。这可以改善
   * 性能在高像素密度的低性能设备上。当为 false 时，
   * 渲染将以设备像素进行。无论此标志为 true 还是 false，
   * {@link CesiumWidget#resolutionScale} 仍然会生效。
   * @memberof CesiumWidget.prototype
   *
   * @type {boolean}
   * @default true
   */

  useBrowserRecommendedResolution: {
    get: function () {
      return this._useBrowserRecommendedResolution;
    },
    set: function (value) {
      if (this._useBrowserRecommendedResolution !== value) {
        this._useBrowserRecommendedResolution = value;
        this._forceResize = true;
      }
    },
  },

  /**
   * 获取或设置数据源是否可以暂时暂停
   * 动画，以避免向用户显示不完整的图像。
   * 例如，如果正在后台处理异步图元，
   * 时钟将在几何体准备好之前不会推进。
   *
   * @memberof CesiumWidget.prototype
   *
   * @type {boolean}
   */

  allowDataSourcesToSuspendAnimation: {
    get: function () {
      return this._allowDataSourcesToSuspendAnimation;
    },
    set: function (value) {
      this._allowDataSourcesToSuspendAnimation = value;
    },
  },

  /**
   * 获取或设置当前正在被相机跟踪的实体实例。
   * @memberof CesiumWidget.prototype
   * @type {Entity | undefined}
   */

  trackedEntity: {
    get: function () {
      return this._trackedEntity;
    },
    set: function (value) {
      if (this._trackedEntity !== value) {
        this._trackedEntity = value;

        //Cancel any pending zoom
        cancelZoom(this);

        const scene = this.scene;
        const sceneMode = scene.mode;

        //Stop tracking
        if (!defined(value) || !defined(value.position)) {
          this._needTrackedEntityUpdate = false;
          if (
            sceneMode === SceneMode.COLUMBUS_VIEW ||
            sceneMode === SceneMode.SCENE2D
          ) {
            scene.screenSpaceCameraController.enableTranslate = true;
          }

          if (
            sceneMode === SceneMode.COLUMBUS_VIEW ||
            sceneMode === SceneMode.SCENE3D
          ) {
            scene.screenSpaceCameraController.enableTilt = true;
          }

          this._entityView = undefined;
          this.camera.lookAtTransform(Matrix4.IDENTITY);
        } else {
          //We can't start tracking immediately, so we set a flag and start tracking
          //when the bounding sphere is ready (most likely next frame).
          this._needTrackedEntityUpdate = true;
        }

        this._trackedEntityChanged.raiseEvent(value);
        this.scene.requestRender();
      }
    },
  },

  /**
   * 获取当跟踪的实体改变时引发的事件。
   * @memberof CesiumWidget.prototype
   * @type {Event}
   * @readonly
   */
  trackedEntityChanged: {
    get: function () {
      return this._trackedEntityChanged;
    },
  },

  /**
   * 获取或设置要用小部件时钟进行跟踪的数据源。
   * @memberof CesiumWidget.prototype
   * @type {DataSource}
   */

  clockTrackedDataSource: {
    get: function () {
      return this._clockTrackedDataSource;
    },
    set: function (value) {
      if (this._clockTrackedDataSource !== value) {
        this._clockTrackedDataSource = value;
        trackDataSourceClock(this.clock, value);
      }
    },
  },
});

/**
 * 向用户显示一个错误面板，包含标题和更长的错误消息，
 * 可以通过 OK 按钮来关闭。 当发生渲染循环错误时，
 * 如果在构造小部件时未将 showRenderLoopErrors 设置为 false，
 * 则会自动显示此面板。
 *
 * @param {string} title 要在错误面板上显示的标题。此字符串被解释为文本。
 * @param {string} [message] 在详细错误信息之前显示的有用用户消息。此字符串被解释为 HTML。
 * @param {string} [error] 要在错误面板上显示的错误。此字符串使用 {@link formatError} 格式化后，然后作为文本显示。
 */

CesiumWidget.prototype.showErrorPanel = function (title, message, error) {
  const element = this._element;
  const overlay = document.createElement("div");
  overlay.className = "cesium-widget-errorPanel";

  const content = document.createElement("div");
  content.className = "cesium-widget-errorPanel-content";
  overlay.appendChild(content);

  const errorHeader = document.createElement("div");
  errorHeader.className = "cesium-widget-errorPanel-header";
  errorHeader.appendChild(document.createTextNode(title));
  content.appendChild(errorHeader);

  const errorPanelScroller = document.createElement("div");
  errorPanelScroller.className = "cesium-widget-errorPanel-scroll";
  content.appendChild(errorPanelScroller);
  function resizeCallback() {
    errorPanelScroller.style.maxHeight = `${Math.max(
      Math.round(element.clientHeight * 0.9 - 100),
      30,
    )}px`;
  }
  resizeCallback();
  if (defined(window.addEventListener)) {
    window.addEventListener("resize", resizeCallback, false);
  }

  const hasMessage = defined(message);
  const hasError = defined(error);

  if (hasMessage || hasError) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "cesium-widget-errorPanel-message";
    errorPanelScroller.appendChild(errorMessage);

    if (hasError) {
      let errorDetails = formatError(error);
      if (!hasMessage) {
        if (typeof error === "string") {
          error = new Error(error);
        }

        message = formatError({
          name: error.name,
          message: error.message,
        });
        errorDetails = error.stack;
      }

      //IE8 does not have a console object unless the dev tools are open.
      if (typeof console !== "undefined") {
        console.error(`${title}\n${message}\n${errorDetails}`);
      }

      const errorMessageDetails = document.createElement("div");
      errorMessageDetails.className =
        "cesium-widget-errorPanel-message-details collapsed";

      const moreDetails = document.createElement("span");
      moreDetails.className = "cesium-widget-errorPanel-more-details";
      moreDetails.appendChild(document.createTextNode("See more..."));
      errorMessageDetails.appendChild(moreDetails);

      errorMessageDetails.onclick = function (e) {
        errorMessageDetails.removeChild(moreDetails);
        errorMessageDetails.appendChild(document.createTextNode(errorDetails));
        errorMessageDetails.className =
          "cesium-widget-errorPanel-message-details";
        content.className = "cesium-widget-errorPanel-content expanded";
        errorMessageDetails.onclick = undefined;
      };

      errorPanelScroller.appendChild(errorMessageDetails);
    }

    errorMessage.innerHTML = `<p>${message}</p>`;
  }

  const buttonPanel = document.createElement("div");
  buttonPanel.className = "cesium-widget-errorPanel-buttonPanel";
  content.appendChild(buttonPanel);

  const okButton = document.createElement("button");
  okButton.setAttribute("type", "button");
  okButton.className = "cesium-button";
  okButton.appendChild(document.createTextNode("OK"));
  okButton.onclick = function () {
    if (defined(resizeCallback) && defined(window.removeEventListener)) {
      window.removeEventListener("resize", resizeCallback, false);
    }
    element.removeChild(overlay);
  };

  buttonPanel.appendChild(okButton);

  element.appendChild(overlay);
};

/**
 * @returns {boolean} 如果对象已被销毁则返回 true，否则返回 false.
 */
CesiumWidget.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁小部件。如果永久地,从布局中移除小部件，则应调用此方法.
 */
CesiumWidget.prototype.destroy = function () {
  // Unsubscribe from data sources
  const dataSources = this.dataSources;
  const dataSourceLength = dataSources.length;
  for (let i = 0; i < dataSourceLength; i++) {
    this._dataSourceRemoved(dataSources, dataSources.get(i));
  }
  this._dataSourceRemoved(undefined, this._dataSourceDisplay.defaultDataSource);

  this._dataSourceDisplay = this._dataSourceDisplay.destroy();

  if (defined(this._scene)) {
    this._scene.renderError.removeEventListener(this._onRenderError);
    this._scene = this._scene.destroy();
  }
  this._container.removeChild(this._element);
  this._creditContainer.removeChild(this._innerCreditContainer);

  this._eventHelper.removeAll();

  if (this._destroyDataSourceCollection) {
    this._dataSourceCollection = this._dataSourceCollection.destroy();
  }

  destroyObject(this);
};

/**
 * 更新画布大小、相机纵横比和视口大小。
 * 此函数会在需要时自动调用，除非
 * <code>useDefaultRenderLoop</code> 设置为 false。
 */

CesiumWidget.prototype.resize = function () {
  const canvas = this._canvas;
  if (
    !this._forceResize &&
    this._canvasClientWidth === canvas.clientWidth &&
    this._canvasClientHeight === canvas.clientHeight &&
    this._lastDevicePixelRatio === window.devicePixelRatio
  ) {
    return;
  }
  this._forceResize = false;

  configureCanvasSize(this);
  configureCameraFrustum(this);

  this._scene.requestRender();
};

/**
 * 渲染场景。此函数会在需要时自动调用，
 * 除非 <code>useDefaultRenderLoop</code> 设置为 false；
 */

CesiumWidget.prototype.render = function () {
  if (this._canRender) {
    this._scene.initializeFrame();
    const currentTime = this._clock.tick();
    this._scene.render(currentTime);
  } else {
    this._clock.tick();
  }
};

/**
 * @private
 */
CesiumWidget.prototype._dataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.addEventListener(
    CesiumWidget.prototype._onEntityCollectionChanged,
    this,
  );
};

/**
 * @private
 */
CesiumWidget.prototype._dataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const entityCollection = dataSource.entities;
  entityCollection.collectionChanged.removeEventListener(
    CesiumWidget.prototype._onEntityCollectionChanged,
    this,
  );

  if (defined(this.trackedEntity)) {
    if (
      entityCollection.getById(this.trackedEntity.id) === this.trackedEntity
    ) {
      this.trackedEntity = undefined;
    }
  }
};

/**
 * @private
 */
CesiumWidget.prototype._updateCanAnimate = function (isUpdated) {
  this._clock.canAnimate = isUpdated;
};

const boundingSphereScratch = new BoundingSphere();

/**
 * @private
 */
CesiumWidget.prototype._onTick = function (clock) {
  const time = clock.currentTime;

  const isUpdated = this._dataSourceDisplay.update(time);
  if (this._allowDataSourcesToSuspendAnimation) {
    this._canAnimateUpdateCallback(isUpdated);
  }

  const entityView = this._entityView;
  if (defined(entityView)) {
    const trackedEntity = this._trackedEntity;
    const trackedState = this._dataSourceDisplay.getBoundingSphere(
      trackedEntity,
      true,
      boundingSphereScratch,
    );
    if (trackedState === BoundingSphereState.DONE) {
      entityView.update(time, boundingSphereScratch);
    }
  }
};

/**
 * @private
 */
CesiumWidget.prototype._onEntityCollectionChanged = function (
  collection,
  added,
  removed,
) {
  const length = removed.length;
  for (let i = 0; i < length; i++) {
    const removedObject = removed[i];
    if (this.trackedEntity === removedObject) {
      this.trackedEntity = undefined;
    }
  }
};

/**
 * @private
 */
CesiumWidget.prototype._clearTrackedObject = function () {
  this.trackedEntity = undefined;
};

/**
 * @private
 */
CesiumWidget.prototype._onDataSourceChanged = function (dataSource) {
  if (this.clockTrackedDataSource === dataSource) {
    trackDataSourceClock(this.clock, dataSource);
  }
};

/**
 * @private
 */
CesiumWidget.prototype._onDataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  if (this._automaticallyTrackDataSourceClocks) {
    this.clockTrackedDataSource = dataSource;
  }
  const id = dataSource.entities.id;
  const removalFunc = this._eventHelper.add(
    dataSource.changedEvent,
    CesiumWidget.prototype._onDataSourceChanged,
    this,
  );
  this._dataSourceChangedListeners[id] = removalFunc;
};

/**
 * @private
 */
CesiumWidget.prototype._onDataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const resetClock = this.clockTrackedDataSource === dataSource;
  const id = dataSource.entities.id;
  this._dataSourceChangedListeners[id]();
  this._dataSourceChangedListeners[id] = undefined;
  if (resetClock) {
    const numDataSources = dataSourceCollection.length;
    if (this._automaticallyTrackDataSourceClocks && numDataSources > 0) {
      this.clockTrackedDataSource = dataSourceCollection.get(
        numDataSources - 1,
      );
    } else {
      this.clockTrackedDataSource = undefined;
    }
  }
};

/**
 * 异步设置相机以查看提供的实体、实体集合或数据源。
 * 如果数据源仍在加载过程中，或可视化仍在加载中，
 * 此方法将在数据准备好后进行缩放。
 *
 * <p>偏移量是以局部东-北-上参考框架中的方位角/俯仰角/范围，
 * 该框架以包围球的中心为中心。方位角和俯仰角定义在局部东-北-上参考框架中。
 * 方位角是从 y 轴的角度，并朝 x 轴增加。俯仰角是从 xy 平面旋转的角度。正的俯仰角
 * 在平面上方。负的俯仰角在平面下方。范围是从中心的距离。如果范围为
 * 零，将计算一个范围，使整个包围球可见。</p>
 *
 * <p>在 2D 中，必须有一个俯视图。相机会放置在目标上方向下看。相对于目标的高度
 * 将是范围。方位角将根据偏移量确定。如果无法通过偏移量确定方位角，
 * 方位角将是北方。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或影像层。您还可以传递一个解析为上述类型之一的 Promise。
 * @param {HeadingPitchRange} [offset] 在局部东-北-上参考框架中从实体中心的偏移量。
 * @returns {Promise<boolean>} 一个 Promise，如果缩放成功解析为 true，如果目标当前未在场景中可视化或缩放被取消则解析为 false。
 */

CesiumWidget.prototype.zoomTo = function (target, offset) {
  const options = {
    offset: offset,
  };
  return zoomToOrFly(this, target, options, false);
};

/**
 * 将相机飞向提供的实体、实体集合或数据源。
 * 如果数据源仍在加载过程中，或可视化仍在加载中，
 * 此方法将在数据准备好后进行飞行。
 *
 * <p>偏移量是以局部东-北-上参考框架中的方位角/俯仰角/范围，
 * 该框架以包围球的中心为中心。方位角和俯仰角定义在局部东-北-上参考框架中。
 * 方位角是从 y 轴的角度，并朝 x 轴增加。俯仰角是从 xy 平面旋转的角度。正的俯仰角
 * 在平面上方。负的俯仰角在平面下方。范围是从中心的距离。如果范围为
 * 零，将计算一个范围，使整个包围球可见。</p>
 *
 * <p>在 2D 中，必须有一个俯视图。相机会放置在目标上方向下看。相对于目标的高度
 * 将是范围。方位角将根据偏移量确定。如果无法通过偏移量确定方位角，
 * 方位角将是北方。</p>
 *
 * @param {Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|Promise<Entity|Entity[]|EntityCollection|DataSource|ImageryLayer|Cesium3DTileset|TimeDynamicPointCloud|VoxelPrimitive>} target 要查看的实体、实体数组、实体集合、数据源、Cesium3DTileset、点云或影像层。您还可以传递一个解析为上述类型之一的 Promise。
 * @param {object} [options] 包含以下属性的对象：
 * @param {number} [options.duration=3.0] 飞行持续时间（秒）。
 * @param {number} [options.maximumHeight] 飞行峰值时的最大高度。
 * @param {HeadingPitchRange} [options.offset] 在局部东-北-上参考框架中从目标的偏移量，以目标为中心。
 * @returns {Promise<boolean>} 一个 Promise，如果飞行成功解析为 true，如果目标当前未在场景中可视化或飞行被取消则解析为 false。 //TODO: 清理实体提及
 */

CesiumWidget.prototype.flyTo = function (target, options) {
  return zoomToOrFly(this, target, options, true);
};

function zoomToOrFly(that, zoomTarget, options, isFlight) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(zoomTarget)) {
    throw new DeveloperError("zoomTarget is required.");
  }
  //>>includeEnd('debug');

  cancelZoom(that);

  //We can't actually perform the zoom until all visualization is ready and
  //bounding spheres have been computed.  Therefore we create and return
  //a deferred which will be resolved as part of the post-render step in the
  //frame that actually performs the zoom.
  const zoomPromise = new Promise((resolve) => {
    that._completeZoom = function (value) {
      resolve(value);
    };
  });
  that._zoomPromise = zoomPromise;
  that._zoomIsFlight = isFlight;
  that._zoomOptions = options;

  Promise.resolve(zoomTarget).then(function (zoomTarget) {
    //Only perform the zoom if it wasn't cancelled before the promise resolved.
    if (that._zoomPromise !== zoomPromise) {
      return;
    }

    //If the zoom target is a rectangular imagery in an ImageLayer
    if (zoomTarget instanceof ImageryLayer) {
      let rectanglePromise;

      if (defined(zoomTarget.imageryProvider)) {
        rectanglePromise = Promise.resolve(zoomTarget.getImageryRectangle());
      } else {
        rectanglePromise = new Promise((resolve) => {
          const removeListener = zoomTarget.readyEvent.addEventListener(() => {
            removeListener();
            resolve(zoomTarget.getImageryRectangle());
          });
        });
      }
      rectanglePromise
        .then(function (rectangle) {
          return computeFlyToLocationForRectangle(rectangle, that.scene);
        })
        .then(function (position) {
          //Only perform the zoom if it wasn't cancelled before the promise was resolved
          if (that._zoomPromise === zoomPromise) {
            that._zoomTarget = position;
          }
        });
      return;
    }

    if (
      zoomTarget instanceof Cesium3DTileset ||
      zoomTarget instanceof TimeDynamicPointCloud ||
      zoomTarget instanceof VoxelPrimitive
    ) {
      that._zoomTarget = zoomTarget;
      return;
    }

    //If the zoom target is a data source, and it's in the middle of loading, wait for it to finish loading.
    if (zoomTarget.isLoading && defined(zoomTarget.loadingEvent)) {
      const removeEvent = zoomTarget.loadingEvent.addEventListener(function () {
        removeEvent();

        //Only perform the zoom if it wasn't cancelled before the data source finished.
        if (that._zoomPromise === zoomPromise) {
          that._zoomTarget = zoomTarget.entities.values.slice(0);
        }
      });
      return;
    }

    //Zoom target is already an array, just copy it and return.
    if (Array.isArray(zoomTarget)) {
      that._zoomTarget = zoomTarget.slice(0);
      return;
    }

    //If zoomTarget is an EntityCollection, this will retrieve the array
    zoomTarget = zoomTarget.values ?? zoomTarget;

    //If zoomTarget is a DataSource, this will retrieve the array.
    if (defined(zoomTarget.entities)) {
      zoomTarget = zoomTarget.entities.values;
    }

    //Zoom target is already an array, just copy it and return.
    if (Array.isArray(zoomTarget)) {
      that._zoomTarget = zoomTarget.slice(0);
    } else {
      //Single entity
      that._zoomTarget = [zoomTarget];
    }
  });

  that.scene.requestRender();
  return zoomPromise;
}

function clearZoom(widget) {
  widget._zoomPromise = undefined;
  widget._zoomTarget = undefined;
  widget._zoomOptions = undefined;
}

function cancelZoom(widget) {
  const zoomPromise = widget._zoomPromise;
  if (defined(zoomPromise)) {
    clearZoom(widget);
    widget._completeZoom(false);
  }
}

/**
 * @private
 */
CesiumWidget.prototype._postRender = function () {
  updateZoomTarget(this);
  updateTrackedEntity(this);
};

function updateZoomTarget(widget) {
  const target = widget._zoomTarget;
  if (!defined(target) || widget.scene.mode === SceneMode.MORPHING) {
    return;
  }

  const scene = widget.scene;
  const camera = scene.camera;
  const zoomOptions = widget._zoomOptions ?? {};
  let options;
  function zoomToBoundingSphere(boundingSphere) {
    // If offset was originally undefined then give it base value instead of empty object
    if (!defined(zoomOptions.offset)) {
      zoomOptions.offset = new HeadingPitchRange(
        0.0,
        -0.5,
        boundingSphere.radius,
      );
    }

    options = {
      offset: zoomOptions.offset,
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        widget._completeZoom(true);
      },
      cancel: function () {
        widget._completeZoom(false);
      },
    };

    if (widget._zoomIsFlight) {
      camera.flyToBoundingSphere(target.boundingSphere, options);
    } else {
      camera.viewBoundingSphere(boundingSphere, zoomOptions.offset);
      camera.lookAtTransform(Matrix4.IDENTITY);

      // Finish the promise
      widget._completeZoom(true);
    }

    clearZoom(widget);
  }

  if (target instanceof TimeDynamicPointCloud) {
    if (defined(target.boundingSphere)) {
      zoomToBoundingSphere(target.boundingSphere);
      return;
    }

    // Otherwise, the first "frame" needs to have been rendered
    const removeEventListener = target.frameChanged.addEventListener(
      function (timeDynamicPointCloud) {
        zoomToBoundingSphere(timeDynamicPointCloud.boundingSphere);
        removeEventListener();
      },
    );
    return;
  }

  if (target instanceof Cesium3DTileset || target instanceof VoxelPrimitive) {
    zoomToBoundingSphere(target.boundingSphere);
    return;
  }

  // If zoomTarget was an ImageryLayer
  if (target instanceof Cartographic) {
    options = {
      destination: scene.ellipsoid.cartographicToCartesian(target),
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        widget._completeZoom(true);
      },
      cancel: function () {
        widget._completeZoom(false);
      },
    };

    if (widget._zoomIsFlight) {
      camera.flyTo(options);
    } else {
      camera.setView(options);
      widget._completeZoom(true);
    }
    clearZoom(widget);
    return;
  }

  const entities = target;

  const boundingSpheres = [];
  for (let i = 0, len = entities.length; i < len; i++) {
    const state = widget._dataSourceDisplay.getBoundingSphere(
      entities[i],
      false,
      boundingSphereScratch,
    );

    if (state === BoundingSphereState.PENDING) {
      return;
    } else if (state !== BoundingSphereState.FAILED) {
      boundingSpheres.push(BoundingSphere.clone(boundingSphereScratch));
    }
  }

  if (boundingSpheres.length === 0) {
    cancelZoom(widget);
    return;
  }

  // Stop tracking the current entity.
  widget.trackedEntity = undefined;

  const boundingSphere = BoundingSphere.fromBoundingSpheres(boundingSpheres);

  if (!widget._zoomIsFlight) {
    camera.viewBoundingSphere(boundingSphere, zoomOptions.offset);
    camera.lookAtTransform(Matrix4.IDENTITY);
    clearZoom(widget);
    widget._completeZoom(true);
  } else {
    clearZoom(widget);
    camera.flyToBoundingSphere(boundingSphere, {
      duration: zoomOptions.duration,
      maximumHeight: zoomOptions.maximumHeight,
      complete: function () {
        widget._completeZoom(true);
      },
      cancel: function () {
        widget._completeZoom(false);
      },
      offset: zoomOptions.offset,
    });
  }
}

function updateTrackedEntity(widget) {
  if (!widget._needTrackedEntityUpdate) {
    return;
  }

  const trackedEntity = widget._trackedEntity;
  const currentTime = widget.clock.currentTime;

  //Verify we have a current position at this time. This is only triggered if a position
  //has become undefined after trackedEntity is set but before the boundingSphere has been
  //computed. In this case, we will track the entity once it comes back into existence.
  const currentPosition = Property.getValueOrUndefined(
    trackedEntity.position,
    currentTime,
  );

  if (!defined(currentPosition)) {
    return;
  }

  const scene = widget.scene;

  const state = widget._dataSourceDisplay.getBoundingSphere(
    trackedEntity,
    false,
    boundingSphereScratch,
  );
  if (state === BoundingSphereState.PENDING) {
    return;
  }

  const sceneMode = scene.mode;
  if (
    sceneMode === SceneMode.COLUMBUS_VIEW ||
    sceneMode === SceneMode.SCENE2D
  ) {
    scene.screenSpaceCameraController.enableTranslate = false;
  }

  if (
    sceneMode === SceneMode.COLUMBUS_VIEW ||
    sceneMode === SceneMode.SCENE3D
  ) {
    scene.screenSpaceCameraController.enableTilt = false;
  }

  const bs =
    state !== BoundingSphereState.FAILED ? boundingSphereScratch : undefined;
  widget._entityView = new EntityView(trackedEntity, scene, scene.ellipsoid);
  widget._entityView.update(currentTime, bs);
  widget._needTrackedEntityUpdate = false;
}

export default CesiumWidget;
