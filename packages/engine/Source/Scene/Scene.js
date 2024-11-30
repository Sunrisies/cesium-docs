import BoundingRectangle from "../Core/BoundingRectangle.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import BoxGeometry from "../Core/BoxGeometry.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import createGuid from "../Core/createGuid.js";
import CullingVolume from "../Core/CullingVolume.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidGeometry from "../Core/EllipsoidGeometry.js";
import Event from "../Core/Event.js";
import GeographicProjection from "../Core/GeographicProjection.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import HeightReference from "./HeightReference.js";
import Intersect from "../Core/Intersect.js";
import JulianDate from "../Core/JulianDate.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import mergeSort from "../Core/mergeSort.js";
import Occluder from "../Core/Occluder.js";
import OrthographicFrustum from "../Core/OrthographicFrustum.js";
import OrthographicOffCenterFrustum from "../Core/OrthographicOffCenterFrustum.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import PerspectiveOffCenterFrustum from "../Core/PerspectiveOffCenterFrustum.js";
import Rectangle from "../Core/Rectangle.js";
import RequestScheduler from "../Core/RequestScheduler.js";
import TaskProcessor from "../Core/TaskProcessor.js";
import Transforms from "../Core/Transforms.js";
import ClearCommand from "../Renderer/ClearCommand.js";
import ComputeEngine from "../Renderer/ComputeEngine.js";
import Context from "../Renderer/Context.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import Atmosphere from "./Atmosphere.js";
import BrdfLutGenerator from "./BrdfLutGenerator.js";
import Camera from "./Camera.js";
import Cesium3DTilePass from "./Cesium3DTilePass.js";
import Cesium3DTilePassState from "./Cesium3DTilePassState.js";
import CreditDisplay from "./CreditDisplay.js";
import DebugCameraPrimitive from "./DebugCameraPrimitive.js";
import DepthPlane from "./DepthPlane.js";
import DerivedCommand from "./DerivedCommand.js";
import DeviceOrientationCameraController from "./DeviceOrientationCameraController.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";
import Fog from "./Fog.js";
import FrameState from "./FrameState.js";
import GlobeTranslucencyState from "./GlobeTranslucencyState.js";
import InvertClassification from "./InvertClassification.js";
import JobScheduler from "./JobScheduler.js";
import MapMode2D from "./MapMode2D.js";
import PerformanceDisplay from "./PerformanceDisplay.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Picking from "./Picking.js";
import PostProcessStageCollection from "./PostProcessStageCollection.js";
import Primitive from "./Primitive.js";
import PrimitiveCollection from "./PrimitiveCollection.js";
import SceneMode from "./SceneMode.js";
import SceneTransforms from "./SceneTransforms.js";
import SceneTransitioner from "./SceneTransitioner.js";
import ScreenSpaceCameraController from "./ScreenSpaceCameraController.js";
import ShadowMap from "./ShadowMap.js";
import SpecularEnvironmentCubeMap from "./SpecularEnvironmentCubeMap.js";
import StencilConstants from "./StencilConstants.js";
import SunLight from "./SunLight.js";
import SunPostProcess from "./SunPostProcess.js";
import TweenCollection from "./TweenCollection.js";
import View from "./View.js";
import DebugInspector from "./DebugInspector.js";
import VoxelCell from "./VoxelCell.js";
import VoxelPrimitive from "./VoxelPrimitive.js";
import getMetadataClassProperty from "./getMetadataClassProperty.js";
import PickedMetadataInfo from "./PickedMetadataInfo.js";

const requestRenderAfterFrame = function (scene) {
  return function () {
    scene.frameState.afterRender.push(function () {
      scene.requestRender();
    });
  };
};

/**
 * Cesium 虚拟场景中所有 3D 图形对象和状态的容器。一般来说，
 * 场景不是直接创建的；相反，它是由 {@link CesiumWidget} 隐式创建的。
 *
 * @alias Scene
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {HTMLCanvasElement} options.canvas 创建场景的 HTML 画布元素。
 * @param {ContextOptions} [options.contextOptions] 上下文和 WebGL 创建属性。
 * @param {Element} [options.creditContainer] 显示版权信息的 HTML 元素。
 * @param {Element} [options.creditViewport] 用于显示版权弹窗的 HTML 元素。如果未指定，视口将作为画布的兄弟元素添加。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 默认椭球体。如果未指定，则使用默认椭球体。
 * @param {MapProjection} [options.mapProjection=new GeographicProjection(options.ellipsoid)] 用于 2D 和 哥伦布视图模式的地图投影。
 * @param {boolean} [options.orderIndependentTranslucency=true] 如果为 true，并且配置支持，则使用无序独立透明度。
 * @param {boolean} [options.scene3DOnly=false] 如果为 true，则优化 3D 模式的内存使用和性能，但禁用使用 2D 或哥伦布视图的能力。
 * @param {boolean} [options.shadows=false] 确定光源是否投射阴影。
 * @param {MapMode2D} [options.mapMode2D=MapMode2D.INFINITE_SCROLL] 确定 2D 地图是否可以旋转或在水平方向上无限滚动。
 * @param {boolean} [options.requestRenderMode=false] 如果为 true，则仅在场景中的变化需要时渲染帧。启用后会提高应用程序的性能，但需要在此模式下使用 {@link Scene#requestRender} 显式渲染新帧。在 API 的其他部分更改场景后，在许多情况下都需要这样做。有关禁用 MSAA 的更多信息，请参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染提高性能}。
 * @param {number} [options.maximumRenderTimeChange=0.0] 如果 requestRenderMode 为 true，则此值定义请求渲染之前允许的最大模拟时间变化。有关更多信息，请参见 {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|通过显式渲染提高性能}。
 * @param {number} [options.depthPlaneEllipsoidOffset=0.0] 调整深度平面以解决低于椭球体零高度的渲染伪影。
 * @param {number} [options.msaaSamples=4] 如果提供，则此值控制多重采样抗锯齿的样本率。典型的多重采样率为每像素 2、4 或有时 8 个样本。较高的 MSAA 采样率可能会影响性能，以获得更好的视觉质量。此值仅适用于支持多重采样渲染目标的 WebGL2 上下文。设置为 1 以禁用 MSAA。
 *
 * @see CesiumWidget
 * @see {@link http://www.khronos.org/registry/webgl/specs/latest/#5.2|WebGLContextAttributes}
 *
 * @exception {DeveloperError} options and options.canvas are required.
 *
 * @example
 * // Create scene without anisotropic texture filtering
 * const scene = new Cesium.Scene({
 *   canvas : canvas,
 *   contextOptions : {
 *     allowTextureFilterAnisotropic : false
 *   }
 * });
 */
function Scene(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const canvas = options.canvas;
  let creditContainer = options.creditContainer;
  let creditViewport = options.creditViewport;

  const contextOptions = clone(options.contextOptions);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(canvas)) {
    throw new DeveloperError("options and options.canvas are required.");
  }
  //>>includeEnd('debug');
  const hasCreditContainer = defined(creditContainer);
  const context = new Context(canvas, contextOptions);
  if (!hasCreditContainer) {
    creditContainer = document.createElement("div");
    creditContainer.style.position = "absolute";
    creditContainer.style.bottom = "0";
    creditContainer.style["text-shadow"] = "0 0 2px #000000";
    creditContainer.style.color = "#ffffff";
    creditContainer.style["font-size"] = "10px";
    creditContainer.style["padding-right"] = "5px";
    canvas.parentNode.appendChild(creditContainer);
  }
  if (!defined(creditViewport)) {
    creditViewport = canvas.parentNode;
  }

  this._id = createGuid();
  this._jobScheduler = new JobScheduler();
  this._frameState = new FrameState(
    context,
    new CreditDisplay(creditContainer, "•", creditViewport),
    this._jobScheduler,
  );
  this._frameState.scene3DOnly = defaultValue(options.scene3DOnly, false);
  this._removeCreditContainer = !hasCreditContainer;
  this._creditContainer = creditContainer;

  this._canvas = canvas;
  this._context = context;
  this._computeEngine = new ComputeEngine(context);

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._globe = undefined;
  this._globeTranslucencyState = new GlobeTranslucencyState();
  this._primitives = new PrimitiveCollection();
  this._groundPrimitives = new PrimitiveCollection();

  this._globeHeight = undefined;
  this._globeHeightDirty = true;
  this._cameraUnderground = false;
  this._removeUpdateHeightCallback = undefined;

  this._logDepthBuffer = Scene.defaultLogDepthBuffer && context.fragmentDepth;
  this._logDepthBufferDirty = true;

  this._tweens = new TweenCollection();

  this._shaderFrameCount = 0;

  this._sunPostProcess = undefined;

  this._computeCommandList = [];
  this._overlayCommandList = [];

  this._useOIT = defaultValue(options.orderIndependentTranslucency, true);
  /**
   * 当 useOIT 为 true 时，将用于执行半透明命令的函数。该函数在
   * obtainTranslucentCommandExecutionFunction 中创建一次，然后缓存于此。
   * @private
   */

  this._executeOITFunction = undefined;

  this._depthPlane = new DepthPlane(options.depthPlaneEllipsoidOffset);

  this._clearColorCommand = new ClearCommand({
    color: new Color(),
    stencil: 0,
    owner: this,
  });
  this._depthClearCommand = new ClearCommand({
    depth: 1.0,
    owner: this,
  });
  this._stencilClearCommand = new ClearCommand({
    stencil: 0,
  });
  this._classificationStencilClearCommand = new ClearCommand({
    stencil: 0,
    renderState: RenderState.fromCache({
      stencilMask: StencilConstants.CLASSIFICATION_MASK,
    }),
  });

  this._depthOnlyRenderStateCache = {};

  this._transitioner = new SceneTransitioner(this);

  this._preUpdate = new Event();
  this._postUpdate = new Event();

  this._renderError = new Event();
  this._preRender = new Event();
  this._postRender = new Event();

  this._minimumDisableDepthTestDistance = 0.0;
  this._debugInspector = new DebugInspector();

  this._msaaSamples = defaultValue(options.msaaSamples, 4);

  /**
   * 在 <code>render</code> 中发生的异常总是会被捕获，以便触发
   * <code>renderError</code> 事件。如果此属性为 true，在事件触发后会重新抛出错误。
   * 如果此属性为 false，<code>render</code> 函数将在触发事件后正常返回。
   *
   * @type {boolean}
   * @default false
   */
  this.rethrowRenderErrors = false;

  /**
   * 确定在用户输入时是否立即完成场景过渡动画。
   *
   * @type {boolean}
   * @default true
   */
  this.completeMorphOnUserInput = true;

  /**
   * 在场景过渡开始时触发的事件。
   * @type {Event}
   * @default Event()
   */

  this.morphStart = new Event();

  /**
   * 在场景过渡完成时触发的事件。
   * @type {Event}
   * @default Event()
   */
  this.morphComplete = new Event();

  /**
   * 用于绘制星星的 {@link SkyBox}。
   *
   * @type {SkyBox}
   * @default undefined
   *
   * @see Scene#backgroundColor
   */
  this.skyBox = undefined;

  /**
   * 绕地球绘制的天空大气层。
   *
   * @type {SkyAtmosphere}
   * @default undefined
   */
  this.skyAtmosphere = undefined;

  /**
   * {@link Sun}。
   *
   * @type {Sun}
   * @default undefined
   */
  this.sun = undefined;

  /**
   * 启用时对太阳使用辉光滤镜。
   *
   * @type {boolean}
   * @default true
   */

  this.sunBloom = true;
  this._sunBloom = undefined;

  /**
   * {@link Moon}
   *
   * @type Moon
   * @default undefined
   */
  this.moon = undefined;

  /**
   * 背景颜色，仅在没有天空盒时可见，即 {@link Scene#skyBox} 为未定义时。
   *
   * @type {Color}
   * @default {@link Color.BLACK}
   *
   * @see Scene#skyBox
   */
  this.backgroundColor = Color.clone(Color.BLACK);

  this._mode = SceneMode.SCENE3D;

  this._mapProjection = defined(options.mapProjection)
    ? options.mapProjection
    : new GeographicProjection(this._ellipsoid);

  /**
   * 2D/哥伦布视图与 3D 之间的当前变换过渡时间，
   * 其中 0.0 表示 2D 或哥伦布视图，1.0 表示 3D。
   *
   * @type {number}
   * @default 1.0
   */
  this.morphTime = 1.0;

  /**
   * 使用普通深度缓冲时多视锥体的远近比率。
   * <p>
   * 此值用于为多视锥体的每个视锥体创建近和远值。仅在 {@link Scene#logarithmicDepthBuffer} 为 <code>false</code> 时使用。当 <code>logarithmicDepthBuffer</code> 为
   * <code>true</code> 时, 使用 {@link Scene#logarithmicDepthFarToNearRatio}。
   * </p>
   *
   * @type {number}
   * @default 1000.0
   */

  this.farToNearRatio = 1000.0;

  /**
   * 使用对数深度缓冲时，多视锥体的远近比率。
   * <p>
   * 此值用于为多视锥体的每个视锥体创建近和远值。仅在 {@link Scene#logarithmicDepthBuffer} 为 <code>true</code> 时使用。当 <code>logarithmicDepthBuffer</code> 为
   * <code>false</code> 时，使用 {@link Scene#farToNearRatio}。
   * </p>
   *
   * @type {number}
   * @default 1e9
   */
  this.logarithmicDepthFarToNearRatio = 1e9;

  /**
   * 确定 2D 中多视锥体每个视锥体的一致深度大小（以米为单位）。如果靠近表面的图元或模型出现 Z 争斗，减小此值将消除该伪影，但会降低性能。
   * 另一方面，增加此值将提高性能，但可能会导致靠近表面的图元之间发生 Z 争斗。
   *
   * @type {number}
   * @default 1.75e6
   */
  this.nearToFarDistance2D = 1.75e6;

  /**
   * 场景的垂直夸张。
   * 设置为 1.0 时，不应用夸张。
   *
   * @type {number}
   * @default 1.0
   */
  this.verticalExaggeration = 1.0;

  /**
   * 场景垂直夸张的参考高度。
   * 设置为 0.0 时，夸张相对于椭球体表面应用。
   *
   * @type {number}
   * @default 0.0
   */

  this.verticalExaggerationRelativeHeight = 0.0;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 一个决定执行哪些命令的函数。如下面的示例所示，
   * 该函数将命令的 <code>owner</code> 作为参数，并返回一个布尔值，指示命令是否应执行。
   * </p>
   * <p>
   * 默认值为 <code>undefined</code>，表示执行所有命令。
   * </p>
   *
   * @type Function
   *
   * @default undefined
   *
   * @example
   * // Do not execute any commands.
   * scene.debugCommandFilter = function(command) {
   *     return false;
   * };
   *
   * // Execute only the billboard's commands.  That is, only draw the billboard.
   * const billboards = new Cesium.BillboardCollection();
   * scene.debugCommandFilter = function(command) {
   *     return command.owner === billboards;
   * };
   */
  this.debugCommandFilter = undefined;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 当 <code>true</code> 时，命令将随机着色。这对于性能分析很有用，可以查看场景或模型的哪些部分命令密集，可能会受益于批处理。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowCommands = false;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 当 <code>true</code> 时，命令将根据它们重叠的视锥体着色。最近的视锥体中的命令呈红色，次近的命令呈绿色，最远的视锥体中的命令呈蓝色。如果命令与多个视锥体重叠，颜色组件将结合，例如，与前两个视锥体重叠的命令会呈现黄色。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFrustums = false;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 显示每秒帧数和帧间时间。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFramesPerSecond = false;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 指示哪个视锥体将显示深度信息。
   * </p>
   *
   * @type {number}
   *
   * @default 1
   */

  this.debugShowDepthFrustum = 1;

  /**
   * 此属性仅用于调试；不适合生产使用。
   * <p>
   * 当 <code>true</code> 时，绘制轮廓以显示相机视锥体的边界。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowFrustumPlanes = false;
  this._debugShowFrustumPlanes = false;
  this._debugFrustumPlanes = undefined;

  /**
   * 当 <code>true</code> 时，启用使用深度缓冲进行拾取。
   *
   * @type {boolean}
   * @default true
   */

  this.useDepthPicking = true;

  /**
   * 当 <code>true</code> 时，启用使用深度缓冲进行半透明几何体的拾取。请注意，{@link Scene#useDepthPicking} 也必须为 true，以使此功能正常工作。
   *
   * <p>
   * 启用后会降低性能。会有额外的绘制调用来为半透明几何体写入深度。
   * </p>
   *
   * @example
   * // picking the position of a translucent primitive
   * viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
   *      const pickedFeature = viewer.scene.pick(movement.position);
   *      if (!Cesium.defined(pickedFeature)) {
   *          // nothing picked
   *          return;
   *      }
   *      const worldPosition = viewer.scene.pickPosition(movement.position);
   * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
   *
   * @type {boolean}
   * @default false
   */
  this.pickTranslucentDepth = false;

  /**
   * 在检查相机是否未移动并触发 cameraMoveEnd 事件之前等待的时间（以毫秒为单位）。
   * @type {number}
   * @default 500.0
   * @private
   */
  this.cameraEventWaitTime = 500.0;

  /**
   * 影响 3D Tiles 和模型渲染的气氛光照效果设置。此项不应与
   * {@link Scene#skyAtmosphere} 混淆，后者负责渲染天空。
   *
   * @type {Atmosphere}
   */
  this.atmosphere = new Atmosphere();

  /**
   * 为远离相机的几何体进行混合以实现地平线视图。这允许通过渲染更少的几何体和调度更少的地形请求来实现额外的性能改进。
   *
   * 如果使用的椭球体不是 WGS84，默认情况下禁用。
   * @type {Fog}
   */
  this.fog = new Fog();
  this.fog.enabled = Ellipsoid.WGS84.equals(this._ellipsoid);

  if (!Ellipsoid.WGS84.equals(this._ellipsoid)) {
    Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
      -45.0,
      -45.0,
      45.0,
      45.0,
    );
  }

  this._shadowMapCamera = new Camera(this);

  /**
   * 场景光源的阴影图。当启用时，模型、图元和地球可能会投射和接收阴影。
   * @type {ShadowMap}
   */
  this.shadowMap = new ShadowMap({
    context: context,
    lightCamera: this._shadowMapCamera,
    enabled: defaultValue(options.shadows, false),
  });

  /**
   * 当 <code>false</code> 时，3D Tiles 将正常渲染。当 <code>true</code> 时，分类的 3D Tile 几何体将正常渲染，而未分类的 3D Tile 几何体将以 {@link Scene#invertClassificationColor} 乘以的颜色渲染。
   * @type {boolean}
   * @default false
   */

  this.invertClassification = false;

  /**
   * 当 {@link Scene#invertClassification} 为 <code>true</code> 时，未分类 3D Tile 几何体的高亮颜色。
   * <p>当颜色的 alpha 值小于 1.0 时，3D Tiles 的未分类部分将无法与 3D Tiles 的分类位置正确混合。</p>
   * <p>此外，当颜色的 alpha 值小于 1.0 时，必须支持 WEBGL_depth_texture 和 EXT_frag_depth WebGL 扩展。</p>
   * @type {Color}
   * @default Color.WHITE
   */

  this.invertClassificationColor = Color.clone(Color.WHITE);

  this._actualInvertClassificationColor = Color.clone(
    this._invertClassificationColor,
  );
  this._invertClassification = new InvertClassification();

  /**
   * 用于纸板或 WebVR 的焦距。
   * @type {number}
   */
  this.focalLength = undefined;

  /**
   * 用于纸板或 WebVR 的眼睛间距（以米为单位）。
   * @type {number}
   */
  this.eyeSeparation = undefined;

  /**
   * 应用于最终渲染的后期处理效果。
   * @type {PostProcessStageCollection}
   */

  this.postProcessStages = new PostProcessStageCollection();

  this._brdfLutGenerator = new BrdfLutGenerator();

  this._performanceDisplay = undefined;
  this._debugVolume = undefined;

  this._screenSpaceCameraController = new ScreenSpaceCameraController(this);
  this._cameraUnderground = false;
  this._mapMode2D = defaultValue(options.mapMode2D, MapMode2D.INFINITE_SCROLL);

  // Keeps track of the state of a frame. FrameState is the state across
  // the primitives of the scene. This state is for internally keeping track
  // of celestial and environment effects that need to be updated/rendered in
  // a certain order as well as updating/tracking framebuffer usage.
  this._environmentState = {
    skyBoxCommand: undefined,
    skyAtmosphereCommand: undefined,
    sunDrawCommand: undefined,
    sunComputeCommand: undefined,
    moonCommand: undefined,

    isSunVisible: false,
    isMoonVisible: false,
    isReadyForAtmosphere: false,
    isSkyAtmosphereVisible: false,

    clearGlobeDepth: false,
    useDepthPlane: false,
    renderTranslucentDepthForPick: false,

    originalFramebuffer: undefined,
    useGlobeDepthFramebuffer: false,
    useOIT: false,
    useInvertClassification: false,
    usePostProcess: false,
    usePostProcessSelected: false,
    useWebVR: false,
  };

  this._useWebVR = false;
  this._cameraVR = undefined;
  this._aspectRatioVR = undefined;

/**
   * 当 <code>true</code> 时，仅在根据场景内的变化需要时才会渲染帧。
   * 启用此选项将提高应用程序的性能，但需要在此模式下使用 {@link Scene#requestRender}
   * 显式渲染新帧。在 API 的其他部分对场景进行更改后，在许多情况下这将是必要的。
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#maximumRenderTimeChange
   * @see Scene#requestRender
   *
   * @type {boolean}
   * @default false
   */
  this.requestRenderMode = defaultValue(options.requestRenderMode, false);
  this._renderRequested = true;

  /**
   * 如果 {@link Scene#requestRenderMode} 为 <code>true</code>，则此值定义在请求渲染之前允许的最大模拟时间变化。
   * 较低的值会增加渲染的帧数，而较高的值会减少渲染的帧数。如果为 <code>undefined</code>，则对
   * 模拟时间的更改将永远不会请求渲染。
   * 此值会影响场景中如光照、实体属性更新和动画等变化的渲染速度。
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|Improving Performance with Explicit Rendering}
   * @see Scene#requestRenderMode
   *
   * @type {number}
   * @default 0.0
   */
  this.maximumRenderTimeChange = defaultValue(
    options.maximumRenderTimeChange,
    0.0,
  );
  this._lastRenderTime = undefined;
  this._frameRateMonitor = undefined;

  this._removeRequestListenerCallback =
    RequestScheduler.requestCompletedEvent.addEventListener(
      requestRenderAfterFrame(this),
    );
  this._removeTaskProcessorListenerCallback =
    TaskProcessor.taskCompletedEvent.addEventListener(
      requestRenderAfterFrame(this),
    );
  this._removeGlobeCallbacks = [];
  this._removeTerrainProviderReadyListener = undefined;

  const viewport = new BoundingRectangle(
    0,
    0,
    context.drawingBufferWidth,
    context.drawingBufferHeight,
  );
  const camera = new Camera(this);

  if (this._logDepthBuffer) {
    camera.frustum.near = 0.1;
    camera.frustum.far = 10000000000.0;
  }

  /**
   * 场景相机飞行目的地的相机视图。用于预加载飞行目的地的瓦片。
   * @type {Camera}
   * @private
   */
  this.preloadFlightCamera = new Camera(this);

  /**
   * 场景相机飞行目的地的剔除体积。用于预加载飞行目的地的瓦片。
   * @type {CullingVolume}
   * @private
   */

  this.preloadFlightCullingVolume = undefined;

  this._picking = new Picking(this);
  this._defaultView = new View(this, camera, viewport);
  this._view = this._defaultView;

  this._hdr = undefined;
  this._hdrDirty = undefined;
  this.highDynamicRange = false;
  this.gamma = 2.2;

  /**
   * 用于 PBR 模型的基于图像照明的球面调和系数。
   * @type {Cartesian3[]}
   */
  this.sphericalHarmonicCoefficients = undefined;

  /**
   * 指向包含 PBR 模型的基于图像照明的高光环境贴图和卷积 mipmaps 的 KTX2 文件的 URL。
   * @type {string}
   */
  this.specularEnvironmentMaps = undefined;
  this._specularEnvironmentCubeMap = undefined;

  /**
   * 用于阴影的光源。默认为来自太阳的方向光。
   * @type {Light}
   */

  this.light = new SunLight();

  // Give frameState, camera, and screen space camera controller initial state before rendering
  updateFrameNumber(this, 0.0, JulianDate.now());
  this.updateFrameState();
  this.initializeFrame();
}

/**
 * 使用此项在新构建的场景中设置 {@link Scene#logarithmicDepthBuffer} 的默认值。
 * 此属性依赖于支持 fragmentDepth。
 */

Scene.defaultLogDepthBuffer = true;

function updateGlobeListeners(scene, globe) {
  for (let i = 0; i < scene._removeGlobeCallbacks.length; ++i) {
    scene._removeGlobeCallbacks[i]();
  }
  scene._removeGlobeCallbacks.length = 0;

  const removeGlobeCallbacks = [];
  if (defined(globe)) {
    removeGlobeCallbacks.push(
      globe.imageryLayersUpdatedEvent.addEventListener(
        requestRenderAfterFrame(scene),
      ),
    );
    removeGlobeCallbacks.push(
      globe.terrainProviderChanged.addEventListener(
        requestRenderAfterFrame(scene),
      ),
    );
  }
  scene._removeGlobeCallbacks = removeGlobeCallbacks;
}

Object.defineProperties(Scene.prototype, {
  /**
   * 获取与该场景绑定的画布元素。
   * @memberof Scene.prototype
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
   * 底层 GL 上下文的 drawingBufferHeight。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferHeight|drawingBufferHeight}
   */
  drawingBufferHeight: {
    get: function () {
      return this._context.drawingBufferHeight;
    },
  },

  /**
   * 底层 GL 上下文的 drawingBufferWidth。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferWidth|drawingBufferWidth}
   */
  drawingBufferWidth: {
    get: function () {
      return this._context.drawingBufferWidth;
    },
  },

  /**
   * 此 WebGL 实现支持的最大别名线宽（以像素为单位）。至少为 1。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} with <code>ALIASED_LINE_WIDTH_RANGE</code>.
   */
  maximumAliasedLineWidth: {
    get: function () {
      return ContextLimits.maximumAliasedLineWidth;
    },
  },

  /**
   * 此 WebGL 实现支持的一个立方体贴图的边长度（以像素为单位）。至少为 16。
   * @memberof Scene.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} with <code>GL_MAX_CUBE_MAP_TEXTURE_SIZE</code>.
   */
  maximumCubeMapSize: {
    get: function () {
      return ContextLimits.maximumCubeMapSize;
    },
  },

  /**
   * 如果支持 {@link Scene#pickPosition} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#pickPosition
   */
  pickPositionSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#sampleHeight} 和 {@link Scene#sampleHeightMostDetailed} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#sampleHeight
   * @see Scene#sampleHeightMostDetailed
   */
  sampleHeightSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#clampToHeight} 和 {@link Scene#clampToHeightMostDetailed} 函数，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#clampToHeight
   * @see Scene#clampToHeightMostDetailed
   */
  clampToHeightSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 如果支持 {@link Scene#invertClassification}，则返回 <code>true</code>。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#invertClassification
   */
  invertClassificationSupported: {
    get: function () {
      return this._context.depthTexture;
    },
  },

  /**
   * 返回 <code>true</code> 如果支持镜面环境贴图。
   * @memberof Scene.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @see Scene#specularEnvironmentMaps
   */
  specularEnvironmentMapsSupported: {
    get: function () {
      return SpecularEnvironmentCubeMap.isSupported(this._context);
    },
  },

  /**
   * 椭球体。如果未指定，将使用默认椭球体。
   * @memberof Scene.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取或设置深度测试椭球体。
   * @memberof Scene.prototype
   *
   * @type {Globe}
   */
  globe: {
    get: function () {
      return this._globe;
    },

    set: function (globe) {
      this._globe = this._globe && this._globe.destroy();
      this._globe = globe;

      updateGlobeListeners(this, globe);
    },
  },

  /**
   * 获取原始集合的集合。
   * @memberof Scene.prototype
   *
   * @type {PrimitiveCollection}
   * @readonly
   */
  primitives: {
    get: function () {
      return this._primitives;
    },
  },

  /**
   * 获取地面原始集合的集合。
   * @memberof Scene.prototype
   *
   * @type {PrimitiveCollection}
   * @readonly
   */
  groundPrimitives: {
    get: function () {
      return this._groundPrimitives;
    },
  },

  /**
   * 获取或设置相机。
   * @memberof Scene.prototype
   *
   * @type {Camera}
   * @readonly
   */
  camera: {
    get: function () {
      return this._view.camera;
    },
    set: function (camera) {
      // 仅供内部使用。文档仍为 @readonly。
      this._view.camera = camera;
    },
  },

  /**
   * 获取或设置视图。
   * @memberof Scene.prototype
   *
   * @type {View}
   * @readonly
   *
   * @private
   */
  view: {
    get: function () {
      return this._view;
    },
    set: function (view) {
      // 仅供内部使用。文档仍为 @readonly。
      this._view = view;
    },
  },

  /**
   * 获取默认视图。
   * @memberof Scene.prototype
   *
   * @type {View}
   * @readonly
   *
   * @private
   */
  defaultView: {
    get: function () {
      return this._defaultView;
    },
  },

  /**
   * 获取拾取函数和状态
   * @memberof Scene.prototype
   *
   * @type {Picking}
   * @readonly
   *
   * @private
   */
  picking: {
    get: function () {
      return this._picking;
    },
  },

  /**
   * 获取相机输入处理的控制器。
   * @memberof Scene.prototype
   *
   * @type {ScreenSpaceCameraController}
   * @readonly
   */
  screenSpaceCameraController: {
    get: function () {
      return this._screenSpaceCameraController;
    },
  },

  /**
   * 获取在 2D 和哥伦布视图模式下使用的地图投影。
   * @memberof Scene.prototype
   *
   * @type {MapProjection}
   * @readonly
   *
   * @default new GeographicProjection()
   */
  mapProjection: {
    get: function () {
      return this._mapProjection;
    },
  },

  /**
   * 获取作业调度程序
   * @memberof Scene.prototype
   * @type {JobScheduler}
   * @readonly
   *
   * @private
   */
  jobScheduler: {
    get: function () {
      return this._jobScheduler;
    },
  },

  /**
   * 获取当前场景的状态信息。如果在原始的 <code>update</code> 函数外调用，将返回上一个帧的状态。
   * @memberof Scene.prototype
   *
   * @type {FrameState}
   * @readonly
   *
   * @private
   */
  frameState: {
    get: function () {
      return this._frameState;
    },
  },

  /**
   * 获取环境状态。
   * @memberof Scene.prototype
   *
   * @type {EnvironmentState}
   * @readonly
   *
   * @private
   */
  environmentState: {
    get: function () {
      return this._environmentState;
    },
  },

  /**
   * 获取场景中发生的 tween 集合。
   * @memberof Scene.prototype
   *
   * @type {TweenCollection}
   * @readonly
   *
   * @private
   */
  tweens: {
    get: function () {
      return this._tweens;
    },
  },

  /**
   * 获取将在地球上渲染的图层集合。
   * @memberof Scene.prototype
   *
   * @type {ImageryLayerCollection}
   * @readonly
   */
  imageryLayers: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.imageryLayers;
    },
  },

  /**
   * 提供地球表面几何结构的地形提供程序。
   * @memberof Scene.prototype
   *
   * @type {TerrainProvider}
   */
  terrainProvider: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.terrainProvider;
    },
    set: function (terrainProvider) {
      // 取消任何正在进行的地形更新
      this._removeTerrainProviderReadyListener =
        this._removeTerrainProviderReadyListener &&
        this._removeTerrainProviderReadyListener();

      if (defined(this.globe)) {
        this.globe.terrainProvider = terrainProvider;
      }
    },
  },

  /**
   * 获取地形提供程序更改时引发的事件
   * @memberof Scene.prototype
   *
   * @type {Event}
   * @readonly
   */
  terrainProviderChanged: {
    get: function () {
      if (!defined(this.globe)) {
        return undefined;
      }

      return this.globe.terrainProviderChanged;
    },
  },

  /**
   * 获取将在场景更新或渲染之前引发的事件。事件的订阅者将接收场景实例作为第一个参数，当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|mproving Performance with Explicit Rendering}
   * @see Scene#postUpdate
   * @see Scene#preRender
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  preUpdate: {
    get: function () {
      return this._preUpdate;
    },
  },

  /**
   * 获取在场景更新后立即引发的事件，场景渲染之前。事件的订阅者将接收场景实例作为第一个参数，当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|mproving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#preRender
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  postUpdate: {
    get: function () {
      return this._postUpdate;
    },
  },

  /**
   * 获取在 <code>render</code> 函数内抛出错误时引发的事件。场景实例和抛出的错误是传递给事件处理程序的唯一两个参数。
   * 默认情况下，错误在此事件引发后不会被再次抛出，但可以通过设置 <code>rethrowRenderErrors</code> 属性来更改。
   * @memberof Scene.prototype
   *
   * @type {Event}
   * @readonly
   */
  renderError: {
    get: function () {
      return this._renderError;
    },
  },

  /**
   * 获取在场景更新后立即引发的事件，场景渲染之前。事件的订阅者将接收场景实例作为第一个参数，当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|mproving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#postUpdate
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  preRender: {
    get: function () {
      return this._preRender;
    },
  },

  /**
   * 获取在场景渲染后立即引发的事件。事件的订阅者将接收场景实例作为第一个参数，当前时间作为第二个参数。
   * @memberof Scene.prototype
   *
   * @see {@link https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/|mproving Performance with Explicit Rendering}
   * @see Scene#preUpdate
   * @see Scene#postUpdate
   * @see Scene#postRender
   *
   * @type {Event}
   * @readonly
   */
  postRender: {
    get: function () {
      return this._postRender;
    },
  },

  /**
   * 获取上次渲染时的模拟时间。如果场景尚未渲染，则返回未定义。
   * @memberof Scene.prototype
   *
   * @type {JulianDate}
   * @readonly
   */
  lastRenderTime: {
    get: function () {
      return this._lastRenderTime;
    },
  },

  /**
   * @memberof Scene.prototype
   * @private
   * @readonly
   */
  context: {
    get: function () {
      return this._context;
    },
  },

  /**
   * 此属性仅用于调试；不适用于生产使用。
   * <p>
   * 当 {@link Scene.debugShowFrustums} 为 <code>true</code> 时，此属性包含
   * 具有每个视锥体执行的命令数的统计信息。
   * <code>totalCommands</code> 是执行的命令总数，忽略
   * 重叠。 <code>commandsInFrustums</code> 是一个数组，包含命令冗余执行的次数
   * ，例如，有多少命令重叠两个或三个视锥体。
   * </p>
   *
   * @memberof Scene.prototype
   *
   * @type {object}
   * @readonly
   *
   * @default undefined
   */
  debugFrustumStatistics: {
    get: function () {
      return this._view.debugFrustumStatistics;
    },
  },

  /**
   * 获取场景是否优化为仅用于 3D 视图。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  scene3DOnly: {
    get: function () {
      return this._frameState.scene3DOnly;
    },
  },

  /**
   * 获取场景是否启用了顺序无关半透明度。
   * 注意，这仅反映原始构造选项，还有其他因素可能
   * 阻止在给定系统配置上起作用。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  orderIndependentTranslucency: {
    get: function () {
      return this._useOIT;
    },
  },

  /**
   * 获取此场景的唯一标识符。
   * @memberof Scene.prototype
   * @type {string}
   * @readonly
   */
  id: {
    get: function () {
      return this._id;
    },
  },

  /**
   * 获取或设置场景的当前模式。
   * @memberof Scene.prototype
   * @type {SceneMode}
   * @default {@link SceneMode.SCENE3D}
   */
  mode: {
    get: function () {
      return this._mode;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (this.scene3DOnly && value !== SceneMode.SCENE3D) {
        throw new DeveloperError(
          "只有当 scene3DOnly 为 true 时，SceneMode.SCENE3D 是有效的。",
        );
      }
      //>>includeEnd('debug');
      if (value === SceneMode.SCENE2D) {
        this.morphTo2D(0);
      } else if (value === SceneMode.SCENE3D) {
        this.morphTo3D(0);
      } else if (value === SceneMode.COLUMBUS_VIEW) {
        this.morphToColumbusView(0);
        //>>includeStart('debug', pragmas.debug);
      } else {
        throw new DeveloperError(
          "value 必须是有效的 SceneMode 枚举值。",
        );
        //>>includeEnd('debug');
      }
      this._mode = value;
    },
  },

  /**
   * 获取上一个帧中使用的视锥体数量。
   * @memberof Scene.prototype
   * @type {FrustumCommands[]}
   *
   * @private
   */
  frustumCommandsList: {
    get: function () {
      return this._view.frustumCommandsList;
    },
  },

  /**
   * 获取上一个帧中使用的视锥体数量。
   * @memberof Scene.prototype
   * @type {number}
   *
   * @private
   */
  numberOfFrustums: {
    get: function () {
      return this._view.frustumCommandsList.length;
    },
  },

  /**
   * 当 <code>true</code> 时，将场景拆分为两个视口，左右眼具有立体视图。
   * 用于纸板和 WebVR。
   * @memberof Scene.prototype
   * @type {boolean}
   * @default false
   */
  useWebVR: {
    get: function () {
      return this._useWebVR;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (this.camera.frustum instanceof OrthographicFrustum) {
        throw new DeveloperError(
          "不支持使用正交投影进行 VR。",
        );
      }
      //>>includeEnd('debug');
      this._useWebVR = value;
      if (this._useWebVR) {
        this._frameState.creditDisplay.container.style.visibility = "hidden";
        this._cameraVR = new Camera(this);
        if (!defined(this._deviceOrientationCameraController)) {
          this._deviceOrientationCameraController =
            new DeviceOrientationCameraController(this);
        }

        this._aspectRatioVR = this.camera.frustum.aspectRatio;
      } else {
        this._frameState.creditDisplay.container.style.visibility = "visible";
        this._cameraVR = undefined;
        this._deviceOrientationCameraController =
          this._deviceOrientationCameraController &&
          !this._deviceOrientationCameraController.isDestroyed() &&
          this._deviceOrientationCameraController.destroy();

        this.camera.frustum.aspectRatio = this._aspectRatioVR;
        this.camera.frustum.xOffset = 0.0;
      }
    },
  },

  /**
   * 确定 2D 地图是否可旋转，或是否可以在水平方向上无限滚动。
   * @memberof Scene.prototype
   * @type {MapMode2D}
   * @readonly
   */
  mapMode2D: {
    get: function () {
      return this._mapMode2D;
    },
  },

  /**
   * 获取或设置分隔器在视口中的位置。有效值介于 0.0 和 1.0 之间。
   * @memberof Scene.prototype
   *
   * @type {number}
   */
  splitPosition: {
    get: function () {
      return this._frameState.splitPosition;
    },
    set: function (value) {
      this._frameState.splitPosition = value;
    },
  },

  /**
   * 相机在其中禁用深度测试的距离，例如，防止与地形的剪切。设置为零时，深度测试应始终
   * 应用。当小于零时，深度测试应永远不应用。为广告牌、标签或点设置的 disableDepthTestDistance
   * 属性将覆盖此值。
   * @memberof Scene.prototype
   * @type {number}
   * @default 0.0
   */
  minimumDisableDepthTestDistance: {
    get: function () {
      return this._minimumDisableDepthTestDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value) || value < 0.0) {
        throw new DeveloperError(
          "minimumDisableDepthTestDistance 必须大于或等于 0.0。",
        );
      }
      //>>includeEnd('debug');
      this._minimumDisableDepthTestDistance = value;
    },
  },

  /**
   * 是否使用对数深度缓冲区。启用此选项将允许在多视锥体中减少视锥体数量，
   * 提高性能。此属性依赖于 fragmentDepth 的支持。
   * @memberof Scene.prototype
   * @type {boolean}
   */
  logarithmicDepthBuffer: {
    get: function () {
      return this._logDepthBuffer;
    },
    set: function (value) {
      value = this._context.fragmentDepth && value;
      if (this._logDepthBuffer !== value) {
        this._logDepthBuffer = value;
        this._logDepthBufferDirty = true;
      }
    },
  },

  /**
   * 用于伽马校正的值。仅在使用高动态范围渲染时使用。
   * @memberof Scene.prototype
   * @type {number}
   * @default 2.2
   */
  gamma: {
    get: function () {
      return this._context.uniformState.gamma;
    },
    set: function (value) {
      this._context.uniformState.gamma = value;
    },
  },

  /**
   * 是否使用高动态范围渲染。
   * @memberof Scene.prototype
   * @type {boolean}
   * @default false
   */
  highDynamicRange: {
    get: function () {
      return this._hdr;
    },
    set: function (value) {
      const context = this._context;
      const hdr =
        value &&
        context.depthTexture &&
        (context.colorBufferFloat || context.colorBufferHalfFloat);
      this._hdrDirty = hdr !== this._hdr;
      this._hdr = hdr;
    },
  },

  /**
   * 是否支持高动态范围渲染。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   * @default true
   */
  highDynamicRangeSupported: {
    get: function () {
      const context = this._context;
      return (
        context.depthTexture &&
        (context.colorBufferFloat || context.colorBufferHalfFloat)
      );
    },
  },

  /**
   * 相机是否在地球球体下方。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   * @default false
   */
  cameraUnderground: {
    get: function () {
      return this._cameraUnderground;
    },
  },

  /**
   * 多重采样抗锯齿的采样率（值大于 1 启用 MSAA）。
   * @memberof Scene.prototype
   * @type {number}
   * @default 4
   */
  msaaSamples: {
    get: function () {
      return this._msaaSamples;
    },
    set: function (value) {
      value = Math.min(value, ContextLimits.maximumSamples);
      this._msaaSamples = value;
    },
  },

  /**
   * 如果场景的上下文支持 MSAA，则返回 <code>true</code>。
   * @memberof Scene.prototype
   * @type {boolean}
   * @readonly
   */
  msaaSupported: {
    get: function () {
      return this._context.msaa;
    },
  },

  /**
   * 像素和密度独立像素之间的比例。为特定设备提供适当的真实像素测量的标准单位。
   *
   * @memberof Scene.prototype
   * @type {number}
   * @default 1.0
   * @private
   */
  pixelRatio: {
    get: function () {
      return this._frameState.pixelRatio;
    },
    set: function (value) {
      this._frameState.pixelRatio = value;
    },
  },

  /**
   * @private
   */
  opaqueFrustumNearOffset: {
    get: function () {
      return 0.9999;
    },
  },

  /**
   * @private
   */
  globeHeight: {
    get: function () {
      return this._globeHeight;
    },
  },
});


/**
 * 确定是否支持压缩纹理格式。
 * @param {string} format 纹理格式。可以是格式的名称或 WebGL 扩展名称，例如 s3tc 或 WEBGL_compressed_texture_s3tc。
 * @return {boolean} 是否支持该格式。
 */

Scene.prototype.getCompressedTextureFormatSupported = function (format) {
  const context = this.context;
  return (
    ((format === "WEBGL_compressed_texture_s3tc" || format === "s3tc") &&
      context.s3tc) ||
    ((format === "WEBGL_compressed_texture_pvrtc" || format === "pvrtc") &&
      context.pvrtc) ||
    ((format === "WEBGL_compressed_texture_etc" || format === "etc") &&
      context.etc) ||
    ((format === "WEBGL_compressed_texture_etc1" || format === "etc1") &&
      context.etc1) ||
    ((format === "WEBGL_compressed_texture_astc" || format === "astc") &&
      context.astc) ||
    ((format === "EXT_texture_compression_bptc" || format === "bc7") &&
      context.bc7)
  );
};

function pickedMetadataInfoChanged(command, frameState) {
  const oldPickedMetadataInfo = command.pickedMetadataInfo;
  const newPickedMetadataInfo = frameState.pickedMetadataInfo;
  if (oldPickedMetadataInfo?.schemaId !== newPickedMetadataInfo?.schemaId) {
    return true;
  }
  if (oldPickedMetadataInfo?.className !== newPickedMetadataInfo?.className) {
    return true;
  }
  if (
    oldPickedMetadataInfo?.propertyName !== newPickedMetadataInfo?.propertyName
  ) {
    return true;
  }
  return false;
}

function updateDerivedCommands(scene, command, shadowsDirty) {
  const frameState = scene._frameState;
  const context = scene._context;
  const oit = scene._view.oit;
  const { lightShadowMaps, lightShadowsEnabled } = frameState.shadowState;

  let derivedCommands = command.derivedCommands;

  if (defined(command.pickId)) {
    derivedCommands.picking = DerivedCommand.createPickDerivedCommand(
      scene,
      command,
      context,
      derivedCommands.picking,
    );
  }
  if (frameState.pickingMetadata && command.pickMetadataAllowed) {
    command.pickedMetadataInfo = frameState.pickedMetadataInfo;
    if (defined(command.pickedMetadataInfo)) {
      derivedCommands.pickingMetadata =
        DerivedCommand.createPickMetadataDerivedCommand(
          scene,
          command,
          context,
          derivedCommands.pickingMetadata,
        );
    }
  }
  if (!command.pickOnly) {
    derivedCommands.depth = DerivedCommand.createDepthOnlyDerivedCommand(
      scene,
      command,
      context,
      derivedCommands.depth,
    );
  }

  derivedCommands.originalCommand = command;

  if (scene._hdr) {
    derivedCommands.hdr = DerivedCommand.createHdrCommand(
      command,
      context,
      derivedCommands.hdr,
    );
    command = derivedCommands.hdr.command;
    derivedCommands = command.derivedCommands;
  }

  if (lightShadowsEnabled && command.receiveShadows) {
    derivedCommands.shadows = ShadowMap.createReceiveDerivedCommand(
      lightShadowMaps,
      command,
      shadowsDirty,
      context,
      derivedCommands.shadows,
    );
  }

  if (command.pass === Pass.TRANSLUCENT && defined(oit) && oit.isSupported()) {
    if (lightShadowsEnabled && command.receiveShadows) {
      derivedCommands.oit = defined(derivedCommands.oit)
        ? derivedCommands.oit
        : {};
      derivedCommands.oit.shadows = oit.createDerivedCommands(
        derivedCommands.shadows.receiveCommand,
        context,
        derivedCommands.oit.shadows,
      );
    } else {
      derivedCommands.oit = oit.createDerivedCommands(
        command,
        context,
        derivedCommands.oit,
      );
    }
  }
}

/**
 * @private
 */
Scene.prototype.updateDerivedCommands = function (command) {
  const { derivedCommands } = command;
  if (!defined(derivedCommands)) {
    // Is not a DrawCommand
    return;
  }

  const frameState = this._frameState;
  const { shadowState, useLogDepth } = this._frameState;
  const context = this._context;

  // Update derived commands when any shadow maps become dirty
  let shadowsDirty = false;
  const lastDirtyTime = shadowState.lastDirtyTime;
  if (command.lastDirtyTime !== lastDirtyTime) {
    command.lastDirtyTime = lastDirtyTime;
    command.dirty = true;
    shadowsDirty = true;
  }

  const useHdr = this._hdr;
  const hasLogDepthDerivedCommands = defined(derivedCommands.logDepth);
  const hasHdrCommands = defined(derivedCommands.hdr);
  const hasDerivedCommands = defined(derivedCommands.originalCommand);
  const needsLogDepthDerivedCommands =
    useLogDepth && !hasLogDepthDerivedCommands;
  const needsHdrCommands = useHdr && !hasHdrCommands;
  const needsDerivedCommands = (!useLogDepth || !useHdr) && !hasDerivedCommands;
  const needsUpdateForMetadataPicking =
    frameState.pickingMetadata &&
    pickedMetadataInfoChanged(command, frameState);
  command.dirty =
    command.dirty ||
    needsLogDepthDerivedCommands ||
    needsHdrCommands ||
    needsDerivedCommands ||
    needsUpdateForMetadataPicking;

  if (!command.dirty) {
    return;
  }

  command.dirty = false;

  const { shadowsEnabled, shadowMaps } = shadowState;
  if (shadowsEnabled && command.castShadows) {
    derivedCommands.shadows = ShadowMap.createCastDerivedCommand(
      shadowMaps,
      command,
      shadowsDirty,
      context,
      derivedCommands.shadows,
    );
  }

  if (hasLogDepthDerivedCommands || needsLogDepthDerivedCommands) {
    derivedCommands.logDepth = DerivedCommand.createLogDepthCommand(
      command,
      context,
      derivedCommands.logDepth,
    );
    updateDerivedCommands(this, derivedCommands.logDepth.command, shadowsDirty);
  }
  if (hasDerivedCommands || needsDerivedCommands) {
    updateDerivedCommands(this, command, shadowsDirty);
  }
};

const renderTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.RENDER,
});

const preloadTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.PRELOAD,
});

const preloadFlightTilesetPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.PRELOAD_FLIGHT,
});

const requestRenderModeDeferCheckPassState = new Cesium3DTilePassState({
  pass: Cesium3DTilePass.REQUEST_RENDER_MODE_DEFER_CHECK,
});

const scratchOccluderBoundingSphere = new BoundingSphere();
let scratchOccluder;
/**
 * 获取场景的中央主体遮挡器。
 * 假定只有一个中央主体遮挡器，即顶层地球。
 *
 * @param {Scene} scene
 * @returns {Occluder|undefined}
 *
 * @private
 */

function getOccluder(scene) {
  if (
    scene._mode !== SceneMode.SCENE3D ||
    !scene.globe?.show ||
    scene._cameraUnderground ||
    scene._globeTranslucencyState.translucent
  ) {
    return undefined;
  }

  scratchOccluderBoundingSphere.radius =
    scene.ellipsoid.minimumRadius + scene.frameState.minimumTerrainHeight;
  scratchOccluder = Occluder.fromBoundingSphere(
    scratchOccluderBoundingSphere,
    scene.camera.positionWC,
    scratchOccluder,
  );

  return scratchOccluder;
}

/**
 * @private
 * @param {FrameState.Passes} passes
 */
Scene.prototype.clearPasses = function (passes) {
  passes.render = false;
  passes.pick = false;
  passes.pickVoxel = false;
  passes.depth = false;
  passes.postProcess = false;
  passes.offscreen = false;
};

function updateFrameNumber(scene, frameNumber, time) {
  const frameState = scene._frameState;
  frameState.frameNumber = frameNumber;
  frameState.time = JulianDate.clone(time, frameState.time);
}

/**
 * @private
 */
Scene.prototype.updateFrameState = function () {
  const camera = this.camera;

  const frameState = this._frameState;
  frameState.commandList.length = 0;
  frameState.shadowMaps.length = 0;
  frameState.brdfLutGenerator = this._brdfLutGenerator;
  frameState.environmentMap = this.skyBox && this.skyBox._cubeMap;
  frameState.mode = this._mode;
  frameState.morphTime = this.morphTime;
  frameState.mapProjection = this.mapProjection;
  frameState.camera = camera;
  frameState.cullingVolume = camera.frustum.computeCullingVolume(
    camera.positionWC,
    camera.directionWC,
    camera.upWC,
  );
  frameState.occluder = getOccluder(this);
  frameState.minimumTerrainHeight = 0.0;
  frameState.minimumDisableDepthTestDistance =
    this._minimumDisableDepthTestDistance;
  frameState.invertClassification = this.invertClassification;
  frameState.useLogDepth =
    this._logDepthBuffer &&
    !(
      this.camera.frustum instanceof OrthographicFrustum ||
      this.camera.frustum instanceof OrthographicOffCenterFrustum
    );
  frameState.light = this.light;
  frameState.cameraUnderground = this._cameraUnderground;
  frameState.globeTranslucencyState = this._globeTranslucencyState;

  const { globe } = this;
  if (defined(globe) && globe._terrainExaggerationChanged) {
    // Honor a user-set value for the old deprecated globe.terrainExaggeration.
    // This can be removed when Globe.terrainExaggeration is removed.
    this.verticalExaggeration = globe._terrainExaggeration;
    this.verticalExaggerationRelativeHeight =
      globe._terrainExaggerationRelativeHeight;
    globe._terrainExaggerationChanged = false;
  }
  frameState.verticalExaggeration = this.verticalExaggeration;
  frameState.verticalExaggerationRelativeHeight =
    this.verticalExaggerationRelativeHeight;

  if (
    defined(this._specularEnvironmentCubeMap) &&
    this._specularEnvironmentCubeMap.ready
  ) {
    frameState.specularEnvironmentMaps =
      this._specularEnvironmentCubeMap.texture;
    frameState.specularEnvironmentMapsMaximumLOD =
      this._specularEnvironmentCubeMap.maximumMipmapLevel;
  } else {
    frameState.specularEnvironmentMaps = undefined;
    frameState.specularEnvironmentMapsMaximumLOD = undefined;
  }

  frameState.sphericalHarmonicCoefficients = this.sphericalHarmonicCoefficients;

  this._actualInvertClassificationColor = Color.clone(
    this.invertClassificationColor,
    this._actualInvertClassificationColor,
  );
  if (!InvertClassification.isTranslucencySupported(this._context)) {
    this._actualInvertClassificationColor.alpha = 1.0;
  }

  frameState.invertClassificationColor = this._actualInvertClassificationColor;

  if (defined(this.globe)) {
    frameState.maximumScreenSpaceError = this.globe.maximumScreenSpaceError;
  } else {
    frameState.maximumScreenSpaceError = 2;
  }

  this.clearPasses(frameState.passes);

  frameState.tilesetPassState = undefined;
};

/**
 * 检查绘制命令是否会在当前场景中渲染任何可见内容，
 * 基于其包围体积。
 *
 * @param {CullingVolume} cullingVolume 当前场景的剔除体积。
 * @param {DrawCommand} [command] 绘制命令
 * @param {Occluder} [occluder] 可能位于命令包围体积前面的遮挡器。
 * @returns {boolean} 如果命令的包围体积在场景中可见，则返回 <code>true</code>。
 *
 * @private
 */

Scene.prototype.isVisible = function (cullingVolume, command, occluder) {
  if (!defined(command)) {
    return false;
  }
  const { boundingVolume } = command;
  if (!defined(boundingVolume) || !command.cull) {
    return true;
  }
  if (cullingVolume.computeVisibility(boundingVolume) === Intersect.OUTSIDE) {
    return false;
  }
  return (
    !defined(occluder) ||
    !command.occlude ||
    !boundingVolume.isOccluded(occluder)
  );
};

let transformFrom2D = new Matrix4(
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
);
transformFrom2D = Matrix4.inverseTransformation(
  transformFrom2D,
  transformFrom2D,
);

/**
 * 调试代码以绘制命令的包围体积。未优化！
 * 假定包围体积是包围球或包围盒。
 *
 * @param {DrawCommand} command 要为其渲染包围体积的绘制命令。
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 * @param {Framebuffer} debugFramebuffer 包围体积将被渲染的帧缓冲区。
 *
 * @private
 */

function debugShowBoundingVolume(command, scene, passState, debugFramebuffer) {
  const frameState = scene._frameState;
  const context = frameState.context;
  const boundingVolume = command.boundingVolume;

  if (defined(scene._debugVolume)) {
    scene._debugVolume.destroy();
  }

  let center = Cartesian3.clone(boundingVolume.center);
  if (frameState.mode !== SceneMode.SCENE3D) {
    center = Matrix4.multiplyByPoint(transformFrom2D, center, center);
    const projection = frameState.mapProjection;
    const centerCartographic = projection.unproject(center);
    center = projection.ellipsoid.cartographicToCartesian(centerCartographic);
  }

  let geometry;
  let modelMatrix;
  const { radius } = boundingVolume;
  if (defined(radius)) {
    geometry = EllipsoidGeometry.createGeometry(
      new EllipsoidGeometry({
        radii: new Cartesian3(radius, radius, radius),
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
      }),
    );
    modelMatrix = Matrix4.fromTranslation(center);
  } else {
    geometry = BoxGeometry.createGeometry(
      BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(2.0, 2.0, 2.0),
        vertexFormat: PerInstanceColorAppearance.FLAT_VERTEX_FORMAT,
      }),
    );
    modelMatrix = Matrix4.fromRotationTranslation(
      boundingVolume.halfAxes,
      center,
      new Matrix4(),
    );
  }
  scene._debugVolume = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: GeometryPipeline.toWireframe(geometry),
      modelMatrix: modelMatrix,
      attributes: {
        color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0),
      },
    }),
    appearance: new PerInstanceColorAppearance({
      flat: true,
      translucent: false,
    }),
    asynchronous: false,
  });

  const savedCommandList = frameState.commandList;
  const commandList = (frameState.commandList = []);
  scene._debugVolume.update(frameState);

  command = commandList[0];

  if (frameState.useLogDepth) {
    const logDepth = DerivedCommand.createLogDepthCommand(command, context);
    command = logDepth.command;
  }

  let framebuffer;
  if (defined(debugFramebuffer)) {
    framebuffer = passState.framebuffer;
    passState.framebuffer = debugFramebuffer;
  }

  command.execute(context, passState);

  if (defined(framebuffer)) {
    passState.framebuffer = framebuffer;
  }

  frameState.commandList = savedCommandList;
}

/**
 * 执行单个绘制命令，或者如果适合当前渲染状态，则执行其派生命令之一。
 *
 * @param {DrawCommand} command 要执行的命令。
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 * @param {Framebuffer} debugFramebuffer 将渲染调试 QC 的帧缓冲区。
 *
 * @private
 */

function executeCommand(command, scene, passState, debugFramebuffer) {
  const frameState = scene._frameState;
  const context = scene._context;

  if (defined(scene.debugCommandFilter) && !scene.debugCommandFilter(command)) {
    return;
  }

  if (command instanceof ClearCommand) {
    command.execute(context, passState);
    return;
  }

  if (command.debugShowBoundingVolume && defined(command.boundingVolume)) {
    debugShowBoundingVolume(command, scene, passState, debugFramebuffer);
  }

  if (frameState.useLogDepth && defined(command.derivedCommands.logDepth)) {
    command = command.derivedCommands.logDepth.command;
  }

  const passes = frameState.passes;
  if (
    !passes.pick &&
    !passes.pickVoxel &&
    !passes.depth &&
    scene._hdr &&
    defined(command.derivedCommands) &&
    defined(command.derivedCommands.hdr)
  ) {
    command = command.derivedCommands.hdr.command;
  }

  if (passes.pick || passes.depth) {
    if (passes.pick && !passes.depth) {
      if (
        frameState.pickingMetadata &&
        defined(command.derivedCommands.pickingMetadata)
      ) {
        command = command.derivedCommands.pickingMetadata.pickMetadataCommand;
        command.execute(context, passState);
        return;
      }
      if (
        !frameState.pickingMetadata &&
        defined(command.derivedCommands.picking)
      ) {
        command = command.derivedCommands.picking.pickCommand;
        command.execute(context, passState);
        return;
      }
    } else if (defined(command.derivedCommands.depth)) {
      command = command.derivedCommands.depth.depthOnlyCommand;
      command.execute(context, passState);
      return;
    }
  }

  if (scene.debugShowCommands || scene.debugShowFrustums) {
    scene._debugInspector.executeDebugShowFrustumsCommand(
      scene,
      command,
      passState,
    );
    return;
  }

  if (
    frameState.shadowState.lightShadowsEnabled &&
    command.receiveShadows &&
    defined(command.derivedCommands.shadows)
  ) {
    // If the command receives shadows, execute the derived shadows command.
    // Some commands, such as OIT derived commands, do not have derived shadow commands themselves
    // and instead shadowing is built-in. In this case execute the command regularly below.
    command.derivedCommands.shadows.receiveCommand.execute(context, passState);
  } else {
    command.execute(context, passState);
  }
}

/**
 * 执行单个 ID 绘制命令，用于渲染拾取信息。
 *
 * @param {DrawCommand} command 要执行的命令。
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 *
 * @private
 */

function executeIdCommand(command, scene, passState) {
  const { derivedCommands } = command;
  if (!defined(derivedCommands)) {
    return;
  }

  const frameState = scene._frameState;
  const context = scene._context;

  if (frameState.useLogDepth && defined(derivedCommands.logDepth)) {
    command = derivedCommands.logDepth.command;
  }

  const { picking, pickingMetadata, depth } = command.derivedCommands;
  if (defined(pickingMetadata)) {
    command = derivedCommands.pickingMetadata.pickMetadataCommand;
    command.execute(context, passState);
  }
  if (defined(picking)) {
    command = picking.pickCommand;
    command.execute(context, passState);
  } else if (defined(depth)) {
    command = depth.depthOnlyCommand;
    command.execute(context, passState);
  }
}

function backToFront(a, b, position) {
  return (
    b.boundingVolume.distanceSquaredTo(position) -
    a.boundingVolume.distanceSquaredTo(position)
  );
}

function frontToBack(a, b, position) {
  // When distances are equal equal favor sorting b before a. This gives render priority to commands later in the list.
  return (
    a.boundingVolume.distanceSquaredTo(position) -
    b.boundingVolume.distanceSquaredTo(position) +
    CesiumMath.EPSILON12
  );
}

function executeTranslucentCommandsBackToFront(
  scene,
  executeFunction,
  passState,
  commands,
  invertClassification,
) {
  mergeSort(commands, backToFront, scene.camera.positionWC);

  if (defined(invertClassification)) {
    executeFunction(invertClassification.unclassifiedCommand, scene, passState);
  }

  for (let i = 0; i < commands.length; ++i) {
    executeFunction(commands[i], scene, passState);
  }
}

function executeTranslucentCommandsFrontToBack(
  scene,
  executeFunction,
  passState,
  commands,
  invertClassification,
) {
  mergeSort(commands, frontToBack, scene.camera.positionWC);

  if (defined(invertClassification)) {
    executeFunction(invertClassification.unclassifiedCommand, scene, passState);
  }

  for (let i = 0; i < commands.length; ++i) {
    executeFunction(commands[i], scene, passState);
  }
}

/**
 * 执行命令以在场景中渲染体素。
 *
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 * @param {FrustumCommands} frustumCommands 当前视锥体的绘制命令。
 *
 * @private
 */

function performVoxelsPass(scene, passState, frustumCommands) {
  scene.context.uniformState.updatePass(Pass.VOXELS);

  const commands = frustumCommands.commands[Pass.VOXELS];
  commands.length = frustumCommands.indices[Pass.VOXELS];

  mergeSort(commands, backToFront, scene.camera.positionWC);

  for (let i = 0; i < commands.length; ++i) {
    executeCommand(commands[i], scene, passState);
  }
}

const scratchPerspectiveFrustum = new PerspectiveFrustum();
const scratchPerspectiveOffCenterFrustum = new PerspectiveOffCenterFrustum();
const scratchOrthographicFrustum = new OrthographicFrustum();
const scratchOrthographicOffCenterFrustum = new OrthographicOffCenterFrustum();
/**
 * 从原始相机视锥体创建一个工作视锥体。
 *
 * @param {Camera} camera 相机
 * @returns {PerspectiveFrustum|PerspectiveOffCenterFrustum|OrthographicFrustum|OrthographicOffCenterFrustum} 工作视锥体
 *
 * @private
 */

function createWorkingFrustum(camera) {
  const { frustum } = camera;
  if (defined(frustum.fov)) {
    return frustum.clone(scratchPerspectiveFrustum);
  }
  if (defined(frustum.infiniteProjectionMatrix)) {
    return frustum.clone(scratchPerspectiveOffCenterFrustum);
  }
  if (defined(frustum.width)) {
    return frustum.clone(scratchOrthographicFrustum);
  }
  return frustum.clone(scratchOrthographicOffCenterFrustum);
}

/**
 * 确定如何处理半透明表面。
 *
 * 当启用 OIT 时，将委托给 OIT.executeCommands。
 * 否则，对于渲染通道，它将执行 executeTranslucentCommandsBackToFront，
 * 对于其他通道，则执行 executeTranslucentCommandsFrontToBack。
 *
 * @param {Scene} scene 场景。
 * @returns {Function} 一个用于执行半透明命令的函数。
 */

function obtainTranslucentCommandExecutionFunction(scene) {
  if (scene._environmentState.useOIT) {
    if (!defined(scene._executeOITFunction)) {
      const { view, context } = scene;
      scene._executeOITFunction = function (
        scene,
        executeFunction,
        passState,
        commands,
        invertClassification,
      ) {
        view.globeDepth.prepareColorTextures(context);
        view.oit.executeCommands(
          scene,
          executeFunction,
          passState,
          commands,
          invertClassification,
        );
      };
    }
    return scene._executeOITFunction;
  }
  if (scene.frameState.passes.render) {
    return executeTranslucentCommandsBackToFront;
  }
  return executeTranslucentCommandsFrontToBack;
}

/**
 * 执行绘制命令以在场景中渲染半透明对象。
 *
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 * @param {FrustumCommands} frustumCommands 当前视锥体的绘制命令。
 *
 * @private
 */

function performTranslucentPass(scene, passState, frustumCommands) {
  const { frameState, context } = scene;
  const { pick, pickVoxel } = frameState.passes;
  const picking = pick || pickVoxel;

  let invertClassification;
  if (
    !picking &&
    scene._environmentState.useInvertClassification &&
    frameState.invertClassificationColor.alpha < 1.0
  ) {
    // Fullscreen pass to copy unclassified fragments when alpha < 1.0.
    // Not executed when undefined.
    invertClassification = scene._invertClassification;
  }

  const executeTranslucentCommands =
    obtainTranslucentCommandExecutionFunction(scene);

  context.uniformState.updatePass(Pass.TRANSLUCENT);
  const commands = frustumCommands.commands[Pass.TRANSLUCENT];
  commands.length = frustumCommands.indices[Pass.TRANSLUCENT];
  executeTranslucentCommands(
    scene,
    executeCommand,
    passState,
    commands,
    invertClassification,
  );
}

/**
 * 执行命令以对半透明 3D 瓦片进行分类。
 *
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 * @param {FrustumCommands} frustumCommands 当前视锥体的绘制命令。
 *
 * @private
 */

function performTranslucent3DTilesClassification(
  scene,
  passState,
  frustumCommands,
) {
  const { translucentTileClassification, globeDepth } = scene._view;
  const has3DTilesClassificationCommands =
    frustumCommands.indices[Pass.CESIUM_3D_TILE_CLASSIFICATION] > 0;
  if (
    !has3DTilesClassificationCommands ||
    !translucentTileClassification.isSupported()
  ) {
    return;
  }

  const commands = frustumCommands.commands[Pass.TRANSLUCENT];
  translucentTileClassification.executeTranslucentCommands(
    scene,
    executeCommand,
    passState,
    commands,
    globeDepth.depthStencilTexture,
  );
  translucentTileClassification.executeClassificationCommands(
    scene,
    executeCommand,
    passState,
    frustumCommands,
  );
}

/**
 * 执行所有渲染传递的绘制命令。
 *
 * @param {Scene} scene 场景
 * @param {PassState} passState 渲染状态
 *
 * @private
 */

function executeCommands(scene, passState) {
  const { camera, context, frameState } = scene;
  const { uniformState } = context;

  uniformState.updateCamera(camera);

  const frustum = createWorkingFrustum(camera);
  frustum.near = camera.frustum.near;
  frustum.far = camera.frustum.far;

  const passes = frameState.passes;
  const picking = passes.pick || passes.pickVoxel;

  // Ideally, we would render the sky box and atmosphere last for
  // early-z, but we would have to draw it in each frustum.
  // Do not render environment primitives during a pick pass since they do not generate picking commands.
  if (!picking) {
    renderEnvironment(scene, passState);
  }

  const {
    clearGlobeDepth,
    renderTranslucentDepthForPick,
    useDepthPlane,
    useGlobeDepthFramebuffer,
    useInvertClassification,
    usePostProcessSelected,
  } = scene._environmentState;

  const {
    globeDepth,
    globeTranslucencyFramebuffer,
    sceneFramebuffer,
    frustumCommandsList,
  } = scene._view;
  const numFrustums = frustumCommandsList.length;

  const globeTranslucencyState = scene._globeTranslucencyState;
  const clearDepth = scene._depthClearCommand;
  const clearStencil = scene._stencilClearCommand;
  const clearClassificationStencil = scene._classificationStencilClearCommand;
  const depthPlane = scene._depthPlane;

  const height2D = camera.position.z;

  function performPass(frustumCommands, passId) {
    uniformState.updatePass(passId);
    const commands = frustumCommands.commands[passId];
    const commandCount = frustumCommands.indices[passId];
    for (let j = 0; j < commandCount; ++j) {
      executeCommand(commands[j], scene, passState);
    }
    return commandCount;
  }

  function performIdPass(frustumCommands, passId) {
    uniformState.updatePass(passId);
    const commands = frustumCommands.commands[passId];
    const commandCount = frustumCommands.indices[passId];
    for (let j = 0; j < commandCount; ++j) {
      executeIdCommand(commands[j], scene, passState);
    }
  }

  // Execute commands in each frustum in back to front order
  for (let i = 0; i < numFrustums; ++i) {
    const index = numFrustums - i - 1;
    const frustumCommands = frustumCommandsList[index];

    if (scene.mode === SceneMode.SCENE2D) {
      // To avoid z-fighting in 2D, move the camera to just before the frustum
      // and scale the frustum depth to be in [1.0, nearToFarDistance2D].
      camera.position.z = height2D - frustumCommands.near + 1.0;
      frustum.far = Math.max(1.0, frustumCommands.far - frustumCommands.near);
      frustum.near = 1.0;
      uniformState.update(frameState);
      uniformState.updateFrustum(frustum);
    } else {
      // Avoid tearing artifacts between adjacent frustums in the opaque passes
      frustum.near =
        index !== 0
          ? frustumCommands.near * scene.opaqueFrustumNearOffset
          : frustumCommands.near;
      frustum.far = frustumCommands.far;
      uniformState.updateFrustum(frustum);
    }

    clearDepth.execute(context, passState);

    if (context.stencilBuffer) {
      clearStencil.execute(context, passState);
    }

    if (globeTranslucencyState.translucent) {
      uniformState.updatePass(Pass.GLOBE);
      globeTranslucencyState.executeGlobeCommands(
        frustumCommands,
        executeCommand,
        globeTranslucencyFramebuffer,
        scene,
        passState,
      );
    } else {
      performPass(frustumCommands, Pass.GLOBE);
    }

    if (useGlobeDepthFramebuffer) {
      globeDepth.executeCopyDepth(context, passState);
    }

    // Draw terrain classification
    if (!renderTranslucentDepthForPick) {
      if (globeTranslucencyState.translucent) {
        uniformState.updatePass(Pass.TERRAIN_CLASSIFICATION);
        globeTranslucencyState.executeGlobeClassificationCommands(
          frustumCommands,
          executeCommand,
          globeTranslucencyFramebuffer,
          scene,
          passState,
        );
      } else {
        performPass(frustumCommands, Pass.TERRAIN_CLASSIFICATION);
      }
    }

    if (clearGlobeDepth) {
      clearDepth.execute(context, passState);
      if (useDepthPlane) {
        depthPlane.execute(context, passState);
      }
    }

    let commandCount;
    if (!useInvertClassification || picking || renderTranslucentDepthForPick) {
      // Common/fastest path. Draw 3D Tiles and classification normally.

      // Draw 3D Tiles
      commandCount = performPass(frustumCommands, Pass.CESIUM_3D_TILE);

      if (commandCount > 0) {
        if (useGlobeDepthFramebuffer) {
          globeDepth.prepareColorTextures(context, clearGlobeDepth);
          globeDepth.executeUpdateDepth(
            context,
            passState,
            globeDepth.depthStencilTexture,
          );
        }

        // Draw classifications. Modifies 3D Tiles color.
        if (!renderTranslucentDepthForPick) {
          commandCount = performPass(
            frustumCommands,
            Pass.CESIUM_3D_TILE_CLASSIFICATION,
          );
        }
      }
    } else {
      // When the invert classification color is opaque:
      //    Main FBO (FBO1):                   Main_Color   + Main_DepthStencil
      //    Invert classification FBO (FBO2) : Invert_Color + Main_DepthStencil
      //
      //    1. Clear FBO2 color to vec4(0.0) for each frustum
      //    2. Draw 3D Tiles to FBO2
      //    3. Draw classification to FBO2
      //    4. Fullscreen pass to FBO1, draw Invert_Color when:
      //           * Main_DepthStencil has the stencil bit set > 0 (classified)
      //    5. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
      //           * Main_DepthStencil has stencil bit set to 0 (unclassified) and
      //           * Invert_Color !== vec4(0.0)
      //
      // When the invert classification color is translucent:
      //    Main FBO (FBO1):                  Main_Color         + Main_DepthStencil
      //    Invert classification FBO (FBO2): Invert_Color       + Invert_DepthStencil
      //    IsClassified FBO (FBO3):          IsClassified_Color + Invert_DepthStencil
      //
      //    1. Clear FBO2 and FBO3 color to vec4(0.0), stencil to 0, and depth to 1.0
      //    2. Draw 3D Tiles to FBO2
      //    3. Draw classification to FBO2
      //    4. Fullscreen pass to FBO3, draw any color when
      //           * Invert_DepthStencil has the stencil bit set > 0 (classified)
      //    5. Fullscreen pass to FBO1, draw Invert_Color when:
      //           * Invert_Color !== vec4(0.0) and
      //           * IsClassified_Color !== vec4(0.0)
      //    6. Fullscreen pass to FBO1, draw Invert_Color * czm_invertClassificationColor when:
      //           * Invert_Color !== vec4(0.0) and
      //           * IsClassified_Color === vec4(0.0)
      //
      // NOTE: Step six when translucent invert color occurs after the TRANSLUCENT pass
      //
      scene._invertClassification.clear(context, passState);

      const opaqueClassificationFramebuffer = passState.framebuffer;
      passState.framebuffer = scene._invertClassification._fbo.framebuffer;

      // Draw normally
      commandCount = performPass(frustumCommands, Pass.CESIUM_3D_TILE);

      if (useGlobeDepthFramebuffer) {
        scene._invertClassification.prepareTextures(context);
        globeDepth.executeUpdateDepth(
          context,
          passState,
          scene._invertClassification._fbo.getDepthStencilTexture(),
        );
      }

      // Set stencil
      commandCount = performPass(
        frustumCommands,
        Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW,
      );

      passState.framebuffer = opaqueClassificationFramebuffer;

      // Fullscreen pass to copy classified fragments
      scene._invertClassification.executeClassified(context, passState);
      if (frameState.invertClassificationColor.alpha === 1.0) {
        // Fullscreen pass to copy unclassified fragments when alpha == 1.0
        scene._invertClassification.executeUnclassified(context, passState);
      }

      // Clear stencil set by the classification for the next classification pass
      if (commandCount > 0 && context.stencilBuffer) {
        clearClassificationStencil.execute(context, passState);
      }

      // Draw style over classification.
      commandCount = performPass(
        frustumCommands,
        Pass.CESIUM_3D_TILE_CLASSIFICATION,
      );
    }

    if (commandCount > 0 && context.stencilBuffer) {
      clearStencil.execute(context, passState);
    }

    performVoxelsPass(scene, passState, frustumCommands);

    performPass(frustumCommands, Pass.OPAQUE);

    if (index !== 0 && scene.mode !== SceneMode.SCENE2D) {
      // Do not overlap frustums in the translucent pass to avoid blending artifacts
      frustum.near = frustumCommands.near;
      uniformState.updateFrustum(frustum);
    }

    performTranslucentPass(scene, passState, frustumCommands);

    performTranslucent3DTilesClassification(scene, passState, frustumCommands);

    if (
      context.depthTexture &&
      scene.useDepthPicking &&
      (useGlobeDepthFramebuffer || renderTranslucentDepthForPick)
    ) {
      // PERFORMANCE_IDEA: Use MRT to avoid the extra copy.
      const pickDepth = scene._picking.getPickDepth(scene, index);
      pickDepth.update(context, globeDepth.depthStencilTexture);
      pickDepth.executeCopyDepth(context, passState);
    }

    if (picking || !usePostProcessSelected) {
      continue;
    }

    const originalFramebuffer = passState.framebuffer;
    passState.framebuffer = sceneFramebuffer.getIdFramebuffer();

    // reset frustum
    frustum.near =
      index !== 0
        ? frustumCommands.near * scene.opaqueFrustumNearOffset
        : frustumCommands.near;
    frustum.far = frustumCommands.far;
    uniformState.updateFrustum(frustum);

    if (globeTranslucencyState.translucent) {
      uniformState.updatePass(Pass.GLOBE);
      globeTranslucencyState.executeGlobeCommands(
        frustumCommands,
        executeIdCommand,
        globeTranslucencyFramebuffer,
        scene,
        passState,
      );
    } else {
      performIdPass(frustumCommands, Pass.GLOBE);
    }

    if (clearGlobeDepth) {
      clearDepth.framebuffer = passState.framebuffer;
      clearDepth.execute(context, passState);
      clearDepth.framebuffer = undefined;
    }

    if (clearGlobeDepth && useDepthPlane) {
      depthPlane.execute(context, passState);
    }

    performIdPass(frustumCommands, Pass.CESIUM_3D_TILE);
    performIdPass(frustumCommands, Pass.OPAQUE);
    performIdPass(frustumCommands, Pass.TRANSLUCENT);

    passState.framebuffer = originalFramebuffer;
  }
}

/**
 * 渲染天空、大气、太阳和月亮
 *
 * @param {Scene} scene 场景。
 * @param {PassState} passState 当前渲染传递的状态。
 *
 * @private
 */

function renderEnvironment(scene, passState) {
  const { context, environmentState, view } = scene;

  context.uniformState.updatePass(Pass.ENVIRONMENT);

  if (defined(environmentState.skyBoxCommand)) {
    executeCommand(environmentState.skyBoxCommand, scene, passState);
  }

  if (environmentState.isSkyAtmosphereVisible) {
    executeCommand(environmentState.skyAtmosphereCommand, scene, passState);
  }

  if (environmentState.isSunVisible) {
    environmentState.sunDrawCommand.execute(context, passState);
    if (scene.sunBloom && !environmentState.useWebVR) {
      let framebuffer;
      if (environmentState.useGlobeDepthFramebuffer) {
        framebuffer = view.globeDepth.framebuffer;
      } else if (environmentState.usePostProcess) {
        framebuffer = view.sceneFramebuffer.framebuffer;
      } else {
        framebuffer = environmentState.originalFramebuffer;
      }
      scene._sunPostProcess.execute(context);
      scene._sunPostProcess.copy(context, framebuffer);
      passState.framebuffer = framebuffer;
    }
  }

  // Moon can be seen through the atmosphere, since the sun is rendered after the atmosphere.
  if (environmentState.isMoonVisible) {
    environmentState.moonCommand.execute(context, passState);
  }
}

/**
 * 执行来自场景环境状态和计算命令列表的计算命令
 *
 * @param {Scene} scene 场景
 *
 * @private
 */

function executeComputeCommands(scene) {
  scene.context.uniformState.updatePass(Pass.COMPUTE);

  const sunComputeCommand = scene._environmentState.sunComputeCommand;
  if (defined(sunComputeCommand)) {
    sunComputeCommand.execute(scene._computeEngine);
  }

  const commandList = scene._computeCommandList;
  for (let i = 0; i < commandList.length; ++i) {
    commandList[i].execute(scene._computeEngine);
  }
}

/**
 * 执行覆盖层的绘制命令
 *
 * @param {Scene} scene 场景
 * @param {PassState} passState 渲染状态
 *
 * @private
 */

function executeOverlayCommands(scene, passState) {
  scene.context.uniformState.updatePass(Pass.OVERLAY);

  const context = scene.context;
  const commandList = scene._overlayCommandList;
  for (let i = 0; i < commandList.length; ++i) {
    commandList[i].execute(context, passState);
  }
}

/**
 * 将场景的绘制命令添加到阴影图传递中。
 *
 * @param {Scene} scene 场景
 * @param {DrawCommand[]} commandList 绘制命令列表
 * @param {ShadowMap} shadowMap 阴影图
 *
 * @private
 */

function insertShadowCastCommands(scene, commandList, shadowMap) {
  const { shadowMapCullingVolume, isPointLight, passes } = shadowMap;
  const numberOfPasses = passes.length;

  const shadowedPasses = [
    Pass.GLOBE,
    Pass.CESIUM_3D_TILE,
    Pass.OPAQUE,
    Pass.TRANSLUCENT,
  ];

  for (let i = 0; i < commandList.length; ++i) {
    const command = commandList[i];
    scene.updateDerivedCommands(command);

    if (
      !command.castShadows ||
      shadowedPasses.indexOf(command.pass) < 0 ||
      !scene.isVisible(shadowMapCullingVolume, command)
    ) {
      continue;
    }

    if (isPointLight) {
      for (let k = 0; k < numberOfPasses; ++k) {
        passes[k].commandList.push(command);
      }
    } else if (numberOfPasses === 1) {
      passes[0].commandList.push(command);
    } else {
      let wasVisible = false;
      // Loop over cascades from largest to smallest
      for (let j = numberOfPasses - 1; j >= 0; --j) {
        const cascadeVolume = passes[j].cullingVolume;
        if (scene.isVisible(cascadeVolume, command)) {
          passes[j].commandList.push(command);
          wasVisible = true;
        } else if (wasVisible) {
          // If it was visible in the previous cascade but now isn't
          // then there is no need to check any more cascades
          break;
        }
      }
    }
  }
}

/**
 * 执行绘制命令以将阴影投射到阴影图中。
 *
 * @param {Scene} scene 场景
 *
 * @private
 */

function executeShadowMapCastCommands(scene) {
  const { shadowState, commandList } = scene.frameState;
  const { shadowsEnabled, shadowMaps } = shadowState;

  if (!shadowsEnabled) {
    return;
  }

  const { context } = scene;
  const { uniformState } = context;

  for (let i = 0; i < shadowMaps.length; ++i) {
    const shadowMap = shadowMaps[i];
    if (shadowMap.outOfView) {
      continue;
    }

    // Reset the command lists
    const { passes } = shadowMap;
    for (let j = 0; j < passes.length; ++j) {
      passes[j].commandList.length = 0;
    }

    // Insert the primitive/model commands into the shadow map command lists
    insertShadowCastCommands(scene, commandList, shadowMap);

    for (let j = 0; j < passes.length; ++j) {
      const pass = shadowMap.passes[j];
      const { camera, commandList } = pass;
      uniformState.updateCamera(camera);
      shadowMap.updatePass(context, j);
      for (let k = 0; k < commandList.length; ++k) {
        const command = commandList[k];
        // Set the correct pass before rendering into the shadow map because some shaders
        // conditionally render based on whether the pass is translucent or opaque.
        uniformState.updatePass(command.pass);
        const castCommand = command.derivedCommands.shadows.castCommands[i];
        executeCommand(castCommand, scene, pass.passState);
      }
    }
  }
}

const scratchEyeTranslation = new Cartesian3();

/**
 * 更新和清除帧缓冲区，并执行绘制命令。
 *
 * @param {PassState} passState 每个渲染传递特有的状态。
 * @param {Color} backgroundColor 背景颜色
 *
 * @private
 */

Scene.prototype.updateAndExecuteCommands = function (
  passState,
  backgroundColor,
) {
  updateAndClearFramebuffers(this, passState, backgroundColor);

  if (this._environmentState.useWebVR) {
    executeWebVRCommands(this, passState, backgroundColor);
  } else if (
    this._frameState.mode !== SceneMode.SCENE2D ||
    this._mapMode2D === MapMode2D.ROTATE
  ) {
    executeCommandsInViewport(true, this, passState);
  } else {
    execute2DViewportCommands(this, passState);
  }
};

/**
 * 执行绘制命令以将场景渲染到 WebVR 应用的立体视口中。
 *
 * @param {Scene} scene 场景
 * @param {PassState} passState 渲染状态
 *
 * @private
 */

function executeWebVRCommands(scene, passState) {
  const view = scene._view;
  const camera = view.camera;
  const environmentState = scene._environmentState;
  const renderTranslucentDepthForPick =
    environmentState.renderTranslucentDepthForPick;

  updateAndRenderPrimitives(scene);

  view.createPotentiallyVisibleSet(scene);

  executeComputeCommands(scene);

  if (!renderTranslucentDepthForPick) {
    executeShadowMapCastCommands(scene);
  }

  // Based on Calculating Stereo pairs by Paul Bourke
  // http://paulbourke.net/stereographics/stereorender/
  const viewport = passState.viewport;
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = viewport.width * 0.5;

  const savedCamera = Camera.clone(camera, scene._cameraVR);
  savedCamera.frustum = camera.frustum;

  const near = camera.frustum.near;
  const fo = near * defaultValue(scene.focalLength, 5.0);
  const eyeSeparation = defaultValue(scene.eyeSeparation, fo / 30.0);
  const eyeTranslation = Cartesian3.multiplyByScalar(
    savedCamera.right,
    eyeSeparation * 0.5,
    scratchEyeTranslation,
  );

  camera.frustum.aspectRatio = viewport.width / viewport.height;

  const offset = (0.5 * eyeSeparation * near) / fo;

  Cartesian3.add(savedCamera.position, eyeTranslation, camera.position);
  camera.frustum.xOffset = offset;

  executeCommands(scene, passState);

  viewport.x = viewport.width;

  Cartesian3.subtract(savedCamera.position, eyeTranslation, camera.position);
  camera.frustum.xOffset = -offset;

  executeCommands(scene, passState);

  Camera.clone(savedCamera, camera);
}

const scratch2DViewportCartographic = new Cartographic(
  Math.PI,
  CesiumMath.PI_OVER_TWO,
);
const scratch2DViewportMaxCoord = new Cartesian3();
const scratch2DViewportSavedPosition = new Cartesian3();
const scratch2DViewportTransform = new Matrix4();
const scratch2DViewportCameraTransform = new Matrix4();
const scratch2DViewportEyePoint = new Cartesian3();
const scratch2DViewportWindowCoords = new Cartesian3();
const scratch2DViewport = new BoundingRectangle();

/**
 * 执行绘制命令以渲染到 2D 视口中。
 *
 * @param {Scene} scene 场景
 * @param {PassState} passState 渲染状态
 *
 * @private
 */

function execute2DViewportCommands(scene, passState) {
  const { frameState, camera } = scene;
  const { uniformState } = scene.context;

  const originalViewport = passState.viewport;
  const viewport = BoundingRectangle.clone(originalViewport, scratch2DViewport);
  passState.viewport = viewport;

  const maxCartographic = scratch2DViewportCartographic;
  const maxCoord = scratch2DViewportMaxCoord;

  const projection = scene.mapProjection;
  projection.project(maxCartographic, maxCoord);

  const position = Cartesian3.clone(
    camera.position,
    scratch2DViewportSavedPosition,
  );
  const transform = Matrix4.clone(
    camera.transform,
    scratch2DViewportCameraTransform,
  );
  const frustum = camera.frustum.clone();

  camera._setTransform(Matrix4.IDENTITY);

  const viewportTransformation = Matrix4.computeViewportTransformation(
    viewport,
    0.0,
    1.0,
    scratch2DViewportTransform,
  );
  const projectionMatrix = camera.frustum.projectionMatrix;

  const x = camera.positionWC.y;
  const eyePoint = Cartesian3.fromElements(
    CesiumMath.sign(x) * maxCoord.x - x,
    0.0,
    -camera.positionWC.x,
    scratch2DViewportEyePoint,
  );
  const windowCoordinates = Transforms.pointToGLWindowCoordinates(
    projectionMatrix,
    viewportTransformation,
    eyePoint,
    scratch2DViewportWindowCoords,
  );

  windowCoordinates.x = Math.floor(windowCoordinates.x);

  const viewportX = viewport.x;
  const viewportWidth = viewport.width;

  if (
    x === 0.0 ||
    windowCoordinates.x <= viewportX ||
    windowCoordinates.x >= viewportX + viewportWidth
  ) {
    executeCommandsInViewport(true, scene, passState);
  } else if (
    Math.abs(viewportX + viewportWidth * 0.5 - windowCoordinates.x) < 1.0
  ) {
    viewport.width = windowCoordinates.x - viewport.x;

    camera.position.x *= CesiumMath.sign(camera.position.x);

    camera.frustum.right = 0.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = windowCoordinates.x;

    camera.position.x = -camera.position.x;

    camera.frustum.right = -camera.frustum.left;
    camera.frustum.left = 0.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  } else if (windowCoordinates.x > viewportX + viewportWidth * 0.5) {
    viewport.width = windowCoordinates.x - viewportX;

    const right = camera.frustum.right;
    camera.frustum.right = maxCoord.x - x;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = windowCoordinates.x;
    viewport.width = viewportX + viewportWidth - windowCoordinates.x;

    camera.position.x = -camera.position.x;

    camera.frustum.left = -camera.frustum.right;
    camera.frustum.right = right - camera.frustum.right * 2.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  } else {
    viewport.x = windowCoordinates.x;
    viewport.width = viewportX + viewportWidth - windowCoordinates.x;

    const left = camera.frustum.left;
    camera.frustum.left = -maxCoord.x - x;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(true, scene, passState);

    viewport.x = viewportX;
    viewport.width = windowCoordinates.x - viewportX;

    camera.position.x = -camera.position.x;

    camera.frustum.right = -camera.frustum.left;
    camera.frustum.left = left - camera.frustum.left * 2.0;

    frameState.cullingVolume = camera.frustum.computeCullingVolume(
      camera.positionWC,
      camera.directionWC,
      camera.upWC,
    );
    uniformState.update(frameState);

    executeCommandsInViewport(false, scene, passState);
  }

  camera._setTransform(transform);
  Cartesian3.clone(position, camera.position);
  camera.frustum = frustum.clone();
  passState.viewport = originalViewport;
}

/**
 * 执行绘制命令以将场景渲染到视口中。
 * 如果这是渲染的第一个位图，帧缓冲区将清除为背景颜色。
 *
 * @param {boolean} firstViewport 如果这是渲染的第一个位图，则为 <code>true</code>。
 * @param {Scene} scene 场景
 * @param {PassState} passState 渲染状态
 *
 * @private
 */

function executeCommandsInViewport(firstViewport, scene, passState) {
  const view = scene._view;
  const { renderTranslucentDepthForPick } = scene._environmentState;

  if (!firstViewport) {
    scene.frameState.commandList.length = 0;
  }

  updateAndRenderPrimitives(scene);

  view.createPotentiallyVisibleSet(scene);

  if (firstViewport) {
    executeComputeCommands(scene);
    if (!renderTranslucentDepthForPick) {
      executeShadowMapCastCommands(scene);
    }
  }

  executeCommands(scene, passState);
}

const scratchCullingVolume = new CullingVolume();

/**
 * @private
 */
Scene.prototype.updateEnvironment = function () {
  const frameState = this._frameState;
  const view = this._view;

  // Update celestial and terrestrial environment effects.
  const environmentState = this._environmentState;
  const renderPass = frameState.passes.render;
  const offscreenPass = frameState.passes.offscreen;
  const atmosphere = this.atmosphere;
  const skyAtmosphere = this.skyAtmosphere;
  const globe = this.globe;
  const globeTranslucencyState = this._globeTranslucencyState;

  if (
    !renderPass ||
    (this._mode !== SceneMode.SCENE2D &&
      view.camera.frustum instanceof OrthographicFrustum) ||
    !globeTranslucencyState.environmentVisible
  ) {
    environmentState.skyAtmosphereCommand = undefined;
    environmentState.skyBoxCommand = undefined;
    environmentState.sunDrawCommand = undefined;
    environmentState.sunComputeCommand = undefined;
    environmentState.moonCommand = undefined;
  } else {
    if (defined(skyAtmosphere)) {
      if (defined(globe)) {
        skyAtmosphere.setDynamicLighting(
          DynamicAtmosphereLightingType.fromGlobeFlags(globe),
        );
        environmentState.isReadyForAtmosphere =
          environmentState.isReadyForAtmosphere ||
          !globe.show ||
          globe._surface._tilesToRender.length > 0;
      } else {
        const dynamicLighting = atmosphere.dynamicLighting;
        skyAtmosphere.setDynamicLighting(dynamicLighting);
        environmentState.isReadyForAtmosphere = true;
      }

      environmentState.skyAtmosphereCommand = skyAtmosphere.update(
        frameState,
        globe,
      );
      if (defined(environmentState.skyAtmosphereCommand)) {
        this.updateDerivedCommands(environmentState.skyAtmosphereCommand);
      }
    } else {
      environmentState.skyAtmosphereCommand = undefined;
    }

    environmentState.skyBoxCommand = defined(this.skyBox)
      ? this.skyBox.update(frameState, this._hdr)
      : undefined;
    const sunCommands = defined(this.sun)
      ? this.sun.update(frameState, view.passState, this._hdr)
      : undefined;
    environmentState.sunDrawCommand = defined(sunCommands)
      ? sunCommands.drawCommand
      : undefined;
    environmentState.sunComputeCommand = defined(sunCommands)
      ? sunCommands.computeCommand
      : undefined;
    environmentState.moonCommand = defined(this.moon)
      ? this.moon.update(frameState)
      : undefined;
  }

  const clearGlobeDepth = (environmentState.clearGlobeDepth =
    defined(globe) &&
    globe.show &&
    (!globe.depthTestAgainstTerrain || this.mode === SceneMode.SCENE2D));
  const useDepthPlane = (environmentState.useDepthPlane =
    clearGlobeDepth &&
    this.mode === SceneMode.SCENE3D &&
    globeTranslucencyState.useDepthPlane);
  if (useDepthPlane) {
    // Update the depth plane that is rendered in 3D when the primitives are
    // not depth tested against terrain so primitives on the backface
    // of the globe are not picked.
    this._depthPlane.update(frameState);
  }

  environmentState.renderTranslucentDepthForPick = false;
  environmentState.useWebVR =
    this._useWebVR && this.mode !== SceneMode.SCENE2D && !offscreenPass;

  const occluder =
    frameState.mode === SceneMode.SCENE3D &&
    !globeTranslucencyState.sunVisibleThroughGlobe
      ? frameState.occluder
      : undefined;
  let cullingVolume = frameState.cullingVolume;

  // get user culling volume minus the far plane.
  const planes = scratchCullingVolume.planes;
  for (let k = 0; k < 5; ++k) {
    planes[k] = cullingVolume.planes[k];
  }
  cullingVolume = scratchCullingVolume;

  // Determine visibility of celestial and terrestrial environment effects.
  environmentState.isSkyAtmosphereVisible =
    defined(environmentState.skyAtmosphereCommand) &&
    environmentState.isReadyForAtmosphere;
  environmentState.isSunVisible = this.isVisible(
    cullingVolume,
    environmentState.sunDrawCommand,
    occluder,
  );
  environmentState.isMoonVisible = this.isVisible(
    cullingVolume,
    environmentState.moonCommand,
    occluder,
  );

  const envMaps = this.specularEnvironmentMaps;
  let specularEnvironmentCubeMap = this._specularEnvironmentCubeMap;
  if (defined(envMaps) && specularEnvironmentCubeMap?.url !== envMaps) {
    specularEnvironmentCubeMap =
      specularEnvironmentCubeMap && specularEnvironmentCubeMap.destroy();
    this._specularEnvironmentCubeMap = new SpecularEnvironmentCubeMap(envMaps);
  } else if (!defined(envMaps) && defined(specularEnvironmentCubeMap)) {
    specularEnvironmentCubeMap.destroy();
    this._specularEnvironmentCubeMap = undefined;
  }

  if (defined(this._specularEnvironmentCubeMap)) {
    this._specularEnvironmentCubeMap.update(frameState);
  }
};

function updateDebugFrustumPlanes(scene) {
  const frameState = scene._frameState;
  if (scene.debugShowFrustumPlanes !== scene._debugShowFrustumPlanes) {
    if (scene.debugShowFrustumPlanes) {
      scene._debugFrustumPlanes = new DebugCameraPrimitive({
        camera: scene.camera,
        updateOnChange: false,
        frustumSplits: frameState.frustumSplits,
      });
    } else {
      scene._debugFrustumPlanes =
        scene._debugFrustumPlanes && scene._debugFrustumPlanes.destroy();
    }
    scene._debugShowFrustumPlanes = scene.debugShowFrustumPlanes;
  }

  if (defined(scene._debugFrustumPlanes)) {
    scene._debugFrustumPlanes.update(frameState);
  }
}

function updateShadowMaps(scene) {
  const frameState = scene._frameState;
  const { passes, shadowState, shadowMaps } = frameState;
  const length = shadowMaps.length;

  const shadowsEnabled =
    length > 0 &&
    !passes.pick &&
    !passes.pickVoxel &&
    scene.mode === SceneMode.SCENE3D;
  if (shadowsEnabled !== shadowState.shadowsEnabled) {
    // Update derived commands when shadowsEnabled changes
    ++shadowState.lastDirtyTime;
    shadowState.shadowsEnabled = shadowsEnabled;
  }

  shadowState.lightShadowsEnabled = false;

  if (!shadowsEnabled) {
    return;
  }

  // Check if the shadow maps are different than the shadow maps last frame.
  // If so, the derived commands need to be updated.
  for (let j = 0; j < length; ++j) {
    if (shadowMaps[j] !== shadowState.shadowMaps[j]) {
      ++shadowState.lastDirtyTime;
      break;
    }
  }

  shadowState.shadowMaps.length = 0;
  shadowState.lightShadowMaps.length = 0;

  for (let i = 0; i < length; ++i) {
    const shadowMap = shadowMaps[i];
    shadowMap.update(frameState);

    shadowState.shadowMaps.push(shadowMap);

    if (shadowMap.fromLightSource) {
      shadowState.lightShadowMaps.push(shadowMap);
      shadowState.lightShadowsEnabled = true;
    }

    if (shadowMap.dirty) {
      ++shadowState.lastDirtyTime;
      shadowMap.dirty = false;
    }
  }
}

function updateAndRenderPrimitives(scene) {
  const frameState = scene._frameState;

  scene._groundPrimitives.update(frameState);
  scene._primitives.update(frameState);

  updateDebugFrustumPlanes(scene);
  updateShadowMaps(scene);

  if (scene._globe) {
    scene._globe.render(frameState);
  }
}

function updateAndClearFramebuffers(scene, passState, clearColor) {
  const context = scene._context;
  const frameState = scene._frameState;
  const environmentState = scene._environmentState;
  const view = scene._view;

  const passes = frameState.passes;
  const picking = passes.pick || passes.pickVoxel;
  if (defined(view.globeDepth)) {
    view.globeDepth.picking = picking;
  }
  const useWebVR = environmentState.useWebVR;

  // Preserve the reference to the original framebuffer.
  environmentState.originalFramebuffer = passState.framebuffer;

  // Manage sun bloom post-processing effect.
  if (defined(scene.sun) && scene.sunBloom !== scene._sunBloom) {
    if (scene.sunBloom && !useWebVR) {
      scene._sunPostProcess = new SunPostProcess();
    } else if (defined(scene._sunPostProcess)) {
      scene._sunPostProcess = scene._sunPostProcess.destroy();
    }

    scene._sunBloom = scene.sunBloom;
  } else if (!defined(scene.sun) && defined(scene._sunPostProcess)) {
    scene._sunPostProcess = scene._sunPostProcess.destroy();
    scene._sunBloom = false;
  }

  // Clear the pass state framebuffer.
  const clear = scene._clearColorCommand;
  Color.clone(clearColor, clear.color);
  clear.execute(context, passState);

  // Update globe depth rendering based on the current context and clear the globe depth framebuffer.
  // Globe depth is copied for the pick pass to support picking batched geometries in GroundPrimitives.
  const useGlobeDepthFramebuffer = (environmentState.useGlobeDepthFramebuffer =
    defined(view.globeDepth));
  if (useGlobeDepthFramebuffer) {
    view.globeDepth.update(
      context,
      passState,
      view.viewport,
      scene.msaaSamples,
      scene._hdr,
      environmentState.clearGlobeDepth,
    );
    view.globeDepth.clear(context, passState, clearColor);
  }

  // If supported, configure OIT to use the globe depth framebuffer and clear the OIT framebuffer.
  const oit = view.oit;
  const useOIT = (environmentState.useOIT =
    !picking && defined(oit) && oit.isSupported());
  if (useOIT) {
    oit.update(
      context,
      passState,
      view.globeDepth.colorFramebufferManager,
      scene._hdr,
      scene.msaaSamples,
    );
    oit.clear(context, passState, clearColor);
    environmentState.useOIT = oit.isSupported();
  }

  const postProcess = scene.postProcessStages;
  let usePostProcess = (environmentState.usePostProcess =
    !picking &&
    (scene._hdr ||
      postProcess.length > 0 ||
      postProcess.ambientOcclusion.enabled ||
      postProcess.fxaa.enabled ||
      postProcess.bloom.enabled));
  environmentState.usePostProcessSelected = false;
  if (usePostProcess) {
    view.sceneFramebuffer.update(
      context,
      view.viewport,
      scene._hdr,
      scene.msaaSamples,
    );
    view.sceneFramebuffer.clear(context, passState, clearColor);

    postProcess.update(context, frameState.useLogDepth, scene._hdr);
    postProcess.clear(context);

    usePostProcess = environmentState.usePostProcess = postProcess.ready;
    environmentState.usePostProcessSelected =
      usePostProcess && postProcess.hasSelected;
  }

  if (environmentState.isSunVisible && scene.sunBloom && !useWebVR) {
    passState.framebuffer = scene._sunPostProcess.update(passState);
    scene._sunPostProcess.clear(context, passState, clearColor);
  } else if (useGlobeDepthFramebuffer) {
    passState.framebuffer = view.globeDepth.framebuffer;
  } else if (usePostProcess) {
    passState.framebuffer = view.sceneFramebuffer.framebuffer;
  }

  if (defined(passState.framebuffer)) {
    clear.execute(context, passState);
  }

  const useInvertClassification = (environmentState.useInvertClassification =
    !picking && defined(passState.framebuffer) && scene.invertClassification);
  if (useInvertClassification) {
    let depthFramebuffer;
    if (frameState.invertClassificationColor.alpha === 1.0) {
      if (useGlobeDepthFramebuffer) {
        depthFramebuffer = view.globeDepth.framebuffer;
      }
    }

    if (defined(depthFramebuffer) || context.depthTexture) {
      scene._invertClassification.previousFramebuffer = depthFramebuffer;
      scene._invertClassification.update(
        context,
        scene.msaaSamples,
        view.globeDepth.colorFramebufferManager,
      );
      scene._invertClassification.clear(context, passState);

      if (frameState.invertClassificationColor.alpha < 1.0 && useOIT) {
        const command = scene._invertClassification.unclassifiedCommand;
        const derivedCommands = command.derivedCommands;
        derivedCommands.oit = oit.createDerivedCommands(
          command,
          context,
          derivedCommands.oit,
        );
      }
    } else {
      environmentState.useInvertClassification = false;
    }
  }

  if (scene._globeTranslucencyState.translucent) {
    view.globeTranslucencyFramebuffer.updateAndClear(
      scene._hdr,
      view.viewport,
      context,
      passState,
    );
  }
}

/**
 * @private
 */
Scene.prototype.resolveFramebuffers = function (passState) {
  const context = this._context;
  const environmentState = this._environmentState;
  const view = this._view;
  const { globeDepth, translucentTileClassification } = view;
  if (defined(globeDepth)) {
    globeDepth.prepareColorTextures(context);
  }

  const {
    useOIT,
    useGlobeDepthFramebuffer,
    usePostProcess,
    originalFramebuffer,
  } = environmentState;

  const globeFramebuffer = useGlobeDepthFramebuffer
    ? globeDepth.colorFramebufferManager
    : undefined;
  const sceneFramebuffer = view.sceneFramebuffer._colorFramebuffer;
  const idFramebuffer = view.sceneFramebuffer.idFramebuffer;

  if (useOIT) {
    passState.framebuffer = usePostProcess
      ? sceneFramebuffer.framebuffer
      : originalFramebuffer;
    view.oit.execute(context, passState);
  }

  if (
    translucentTileClassification.hasTranslucentDepth &&
    translucentTileClassification.isSupported()
  ) {
    translucentTileClassification.execute(this, passState);
  }

  if (usePostProcess) {
    view.sceneFramebuffer.prepareColorTextures(context);
    let inputFramebuffer = sceneFramebuffer;
    if (useGlobeDepthFramebuffer && !useOIT) {
      inputFramebuffer = globeFramebuffer;
    }

    const postProcess = this.postProcessStages;
    const colorTexture = inputFramebuffer.getColorTexture(0);
    const idTexture = idFramebuffer.getColorTexture(0);
    const depthTexture = defaultValue(
      globeFramebuffer,
      sceneFramebuffer,
    ).getDepthStencilTexture();
    postProcess.execute(context, colorTexture, depthTexture, idTexture);
    postProcess.copy(context, originalFramebuffer);
  }

  if (!useOIT && !usePostProcess && useGlobeDepthFramebuffer) {
    passState.framebuffer = originalFramebuffer;
    globeDepth.executeCopyColor(context, passState);
  }
};

function callAfterRenderFunctions(scene) {
  // Functions are queued up during primitive update and executed here in case
  // the function modifies scene state that should remain constant over the frame.
  const functions = scene._frameState.afterRender;
  for (let i = 0; i < functions.length; ++i) {
    const shouldRequestRender = functions[i]();
    if (shouldRequestRender) {
      scene.requestRender();
    }
  }

  functions.length = 0;
}

function getGlobeHeight(scene) {
  if (scene.mode === SceneMode.MORPHING) {
    return;
  }
  const cartographic = scene.camera.positionCartographic;
  return scene.getHeight(cartographic);
}

/**
 * 获取在地图位置处加载表面的高度。
 * @param {Cartographic} cartographic 地图位置。
 * @param {HeightReference} [heightReference=CLAMP_TO_GROUND] 根据高度参考值，确定是否忽略来自 3D 瓦片或地形的高度。
 * @private
 */

Scene.prototype.getHeight = function (cartographic, heightReference) {
  if (!defined(cartographic)) {
    return undefined;
  }

  const ignore3dTiles =
    heightReference === HeightReference.CLAMP_TO_TERRAIN ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN;

  const ignoreTerrain =
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE;

  if (!defined(cartographic)) {
    return;
  }

  let maxHeight = Number.NEGATIVE_INFINITY;

  if (!ignore3dTiles) {
    const length = this.primitives.length;
    for (let i = 0; i < length; ++i) {
      const primitive = this.primitives.get(i);
      if (
        !primitive.isCesium3DTileset ||
        !primitive.show ||
        !primitive.enableCollision
      ) {
        continue;
      }

      const result = primitive.getHeight(cartographic, this);
      if (defined(result) && result > maxHeight) {
        maxHeight = result;
      }
    }
  }

  const globe = this._globe;
  if (!ignoreTerrain && defined(globe) && globe.show) {
    const result = globe.getHeight(cartographic);
    if (result > maxHeight) {
      maxHeight = result;
    }
  }

  if (maxHeight > Number.NEGATIVE_INFINITY) {
    return maxHeight;
  }

  return undefined;
};

const updateHeightScratchCartographic = new Cartographic();
/**
 * 当渲染包含给定地图位置的新 tile 时调用回调。唯一的参数
 * 是 tile 上的笛卡尔位置。
 *
 * @private
 *
 * @param {Cartographic} cartographic 地图位置。
 * @param {Function} callback 当加载包含更新后的地图位置的新 tile 时要调用的函数。
 * @param {HeightReference} [heightReference=CLAMP_TO_GROUND] 根据高度参考值，确定是否忽略来自 3D 瓦片或地形的高度。
 * @returns {Function} 用于从四叉树中移除此回调的函数。
 */

Scene.prototype.updateHeight = function (
  cartographic,
  callback,
  heightReference,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.func("callback", callback);
  //>>includeEnd('debug');

  const callbackWrapper = () => {
    Cartographic.clone(cartographic, updateHeightScratchCartographic);

    const height = this.getHeight(cartographic, heightReference);
    if (defined(height)) {
      updateHeightScratchCartographic.height = height;
      callback(updateHeightScratchCartographic);
    }
  };

  const ignore3dTiles =
    heightReference === HeightReference.CLAMP_TO_TERRAIN ||
    heightReference === HeightReference.RELATIVE_TO_TERRAIN;

  const ignoreTerrain =
    heightReference === HeightReference.CLAMP_TO_3D_TILE ||
    heightReference === HeightReference.RELATIVE_TO_3D_TILE;

  let terrainRemoveCallback;
  if (!ignoreTerrain && defined(this.globe)) {
    terrainRemoveCallback = this.globe._surface.updateHeight(
      cartographic,
      callbackWrapper,
    );
  }

  let tilesetRemoveCallbacks = {};
  const ellipsoid = this._ellipsoid;
  const createPrimitiveEventListener = (primitive) => {
    if (
      ignore3dTiles ||
      primitive.isDestroyed() ||
      !primitive.isCesium3DTileset
    ) {
      return;
    }

    const tilesetRemoveCallback = primitive.updateHeight(
      cartographic,
      callbackWrapper,
      ellipsoid,
    );
    tilesetRemoveCallbacks[primitive.id] = tilesetRemoveCallback;
  };

  if (!ignore3dTiles) {
    const length = this.primitives.length;
    for (let i = 0; i < length; ++i) {
      const primitive = this.primitives.get(i);
      createPrimitiveEventListener(primitive);
    }
  }

  const removeAddedListener = this.primitives.primitiveAdded.addEventListener(
    createPrimitiveEventListener,
  );
  const removeRemovedListener =
    this.primitives.primitiveRemoved.addEventListener((primitive) => {
      if (primitive.isDestroyed() || !primitive.isCesium3DTileset) {
        return;
      }
      if (defined(tilesetRemoveCallbacks[primitive.id])) {
        tilesetRemoveCallbacks[primitive.id]();
      }
      delete tilesetRemoveCallbacks[primitive.id];
    });

  const removeCallback = () => {
    terrainRemoveCallback = terrainRemoveCallback && terrainRemoveCallback();
    Object.values(tilesetRemoveCallbacks).forEach((tilesetRemoveCallback) =>
      tilesetRemoveCallback(),
    );
    tilesetRemoveCallbacks = {};
    removeAddedListener();
    removeRemovedListener();
  };

  return removeCallback;
};

function isCameraUnderground(scene) {
  const camera = scene.camera;
  const mode = scene._mode;
  const cameraController = scene._screenSpaceCameraController;
  const cartographic = camera.positionCartographic;

  if (!defined(cartographic)) {
    return false;
  }

  if (!cameraController.onMap() && cartographic.height < 0.0) {
    // The camera can go off the map while in Columbus View.
    // Make a best guess as to whether it's underground by checking if its height is less than zero.
    return true;
  }

  if (mode === SceneMode.SCENE2D || mode === SceneMode.MORPHING) {
    return false;
  }

  const globeHeight = scene._globeHeight;
  return defined(globeHeight) && cartographic.height < globeHeight;
}

/**
 * @private
 */
Scene.prototype.initializeFrame = function () {
  // Destroy released shaders and textures once every 120 frames to avoid thrashing the cache
  if (this._shaderFrameCount++ === 120) {
    this._shaderFrameCount = 0;
    this._context.shaderCache.destroyReleasedShaderPrograms();
    this._context.textureCache.destroyReleasedTextures();
  }

  this._tweens.update();

  if (this._globeHeightDirty) {
    if (defined(this._removeUpdateHeightCallback)) {
      this._removeUpdateHeightCallback();
      this._removeUpdateHeightCallback = undefined;
    }

    this._globeHeight = getGlobeHeight(this);
    this._globeHeightDirty = false;

    const cartographic = this.camera.positionCartographic;
    this._removeUpdateHeightCallback = this.updateHeight(
      cartographic,
      (updatedCartographic) => {
        if (this.isDestroyed()) {
          return;
        }

        this._globeHeight = updatedCartographic.height;
      },
    );
  }
  this._cameraUnderground = isCameraUnderground(this);
  this._globeTranslucencyState.update(this);

  this._screenSpaceCameraController.update();
  if (defined(this._deviceOrientationCameraController)) {
    this._deviceOrientationCameraController.update();
  }

  this.camera.update(this._mode);
  this.camera._updateCameraChanged();
};

function updateDebugShowFramesPerSecond(scene, renderedThisFrame) {
  if (scene.debugShowFramesPerSecond) {
    if (!defined(scene._performanceDisplay)) {
      const performanceContainer = document.createElement("div");
      performanceContainer.className =
        "cesium-performanceDisplay-defaultContainer";
      const container = scene._canvas.parentNode;
      container.appendChild(performanceContainer);
      const performanceDisplay = new PerformanceDisplay({
        container: performanceContainer,
      });
      scene._performanceDisplay = performanceDisplay;
      scene._performanceContainer = performanceContainer;
    }

    scene._performanceDisplay.throttled = scene.requestRenderMode;
    scene._performanceDisplay.update(renderedThisFrame);
  } else if (defined(scene._performanceDisplay)) {
    scene._performanceDisplay =
      scene._performanceDisplay && scene._performanceDisplay.destroy();
    scene._performanceContainer.parentNode.removeChild(
      scene._performanceContainer,
    );
  }
}

function prePassesUpdate(scene) {
  scene._jobScheduler.resetBudgets();

  const frameState = scene._frameState;
  scene.primitives.prePassesUpdate(frameState);

  if (defined(scene.globe)) {
    scene.globe.update(frameState);
  }

  scene._picking.update();
  frameState.creditDisplay.update();
}

function postPassesUpdate(scene) {
  scene.primitives.postPassesUpdate(scene._frameState);
  RequestScheduler.update();
}

const scratchBackgroundColor = new Color();

/**
 * 渲染场景
 *
 * @param {Scene} scene 场景
 * @private
 */

function render(scene) {
  const frameState = scene._frameState;

  const context = scene.context;
  const { uniformState } = context;

  const view = scene._defaultView;
  scene._view = view;

  scene.updateFrameState();
  frameState.passes.render = true;
  frameState.passes.postProcess = scene.postProcessStages.hasSelected;
  frameState.tilesetPassState = renderTilesetPassState;

  let backgroundColor = defaultValue(scene.backgroundColor, Color.BLACK);
  if (scene._hdr) {
    backgroundColor = Color.clone(backgroundColor, scratchBackgroundColor);
    backgroundColor.red = Math.pow(backgroundColor.red, scene.gamma);
    backgroundColor.green = Math.pow(backgroundColor.green, scene.gamma);
    backgroundColor.blue = Math.pow(backgroundColor.blue, scene.gamma);
  }
  frameState.backgroundColor = backgroundColor;

  frameState.atmosphere = scene.atmosphere;
  scene.fog.update(frameState);

  uniformState.update(frameState);

  const shadowMap = scene.shadowMap;
  if (defined(shadowMap) && shadowMap.enabled) {
    if (!defined(scene.light) || scene.light instanceof SunLight) {
      // Negate the sun direction so that it is from the Sun, not to the Sun
      Cartesian3.negate(
        uniformState.sunDirectionWC,
        scene._shadowMapCamera.direction,
      );
    } else {
      Cartesian3.clone(scene.light.direction, scene._shadowMapCamera.direction);
    }
    frameState.shadowMaps.push(shadowMap);
  }

  scene._computeCommandList.length = 0;
  scene._overlayCommandList.length = 0;

  const viewport = view.viewport;
  viewport.x = 0;
  viewport.y = 0;
  viewport.width = context.drawingBufferWidth;
  viewport.height = context.drawingBufferHeight;

  const passState = view.passState;
  passState.framebuffer = undefined;
  passState.blendingEnabled = undefined;
  passState.scissorTest = undefined;
  passState.viewport = BoundingRectangle.clone(viewport, passState.viewport);

  if (defined(scene.globe)) {
    scene.globe.beginFrame(frameState);
  }

  scene.updateEnvironment();
  scene.updateAndExecuteCommands(passState, backgroundColor);
  scene.resolveFramebuffers(passState);

  passState.framebuffer = undefined;
  executeOverlayCommands(scene, passState);

  if (defined(scene.globe)) {
    scene.globe.endFrame(frameState);

    if (!scene.globe.tilesLoaded) {
      scene._renderRequested = true;
    }
  }

  context.endFrame();
}

function tryAndCatchError(scene, functionToExecute) {
  try {
    functionToExecute(scene);
  } catch (error) {
    scene._renderError.raiseEvent(scene, error);

    if (scene.rethrowRenderErrors) {
      throw error;
    }
  }
}

function updateMostDetailedRayPicks(scene) {
  return scene._picking.updateMostDetailedRayPicks(scene);
}

/**
 * 更新并渲染场景。通常不需要直接调用此函数，
 * 因为 {@link CesiumWidget} 会自动执行此操作。
 * @param {JulianDate} [time] 渲染时的模拟时间。
 */

Scene.prototype.render = function (time) {
 /**
 *
 * 预处理更新。在此处执行任何在传递之前应运行的不可变代码。
 *
 */

  this._preUpdate.raiseEvent(this, time);

  const frameState = this._frameState;
  frameState.newFrame = false;

  if (!defined(time)) {
    time = JulianDate.now();
  }

  const cameraChanged = this._view.checkForCameraUpdates(this);
  if (cameraChanged) {
    this._globeHeightDirty = true;
  }

  // Determine if should render a new frame in request render mode
  let shouldRender =
    !this.requestRenderMode ||
    this._renderRequested ||
    cameraChanged ||
    this._logDepthBufferDirty ||
    this._hdrDirty ||
    this.mode === SceneMode.MORPHING;
  if (
    !shouldRender &&
    defined(this.maximumRenderTimeChange) &&
    defined(this._lastRenderTime)
  ) {
    const difference = Math.abs(
      JulianDate.secondsDifference(this._lastRenderTime, time),
    );
    shouldRender = shouldRender || difference > this.maximumRenderTimeChange;
  }

  if (shouldRender) {
    this._lastRenderTime = JulianDate.clone(time, this._lastRenderTime);
    this._renderRequested = false;
    this._logDepthBufferDirty = false;
    this._hdrDirty = false;

    const frameNumber = CesiumMath.incrementWrap(
      frameState.frameNumber,
      15000000.0,
      1.0,
    );
    updateFrameNumber(this, frameNumber, time);
    frameState.newFrame = true;
  }

  tryAndCatchError(this, prePassesUpdate);

  /**
   * 传递更新。请在此处添加任何传递
   */

  if (this.primitives.show) {
    tryAndCatchError(this, updateMostDetailedRayPicks);
    tryAndCatchError(this, updatePreloadPass);
    tryAndCatchError(this, updatePreloadFlightPass);
    if (!shouldRender) {
      tryAndCatchError(this, updateRequestRenderModeDeferCheckPass);
    }
  }

  this._postUpdate.raiseEvent(this, time);

  if (shouldRender) {
    this._preRender.raiseEvent(this, time);
    frameState.creditDisplay.beginFrame();
    tryAndCatchError(this, render);
  }

  /**
   * 后处理更新。在此处执行任何在传递之后应运行的不可变代码。
   */

  updateDebugShowFramesPerSecond(this, shouldRender);
  tryAndCatchError(this, postPassesUpdate);

  // Often used to trigger events (so don't want in trycatch) that the user
  // might be subscribed to. Things like the tile load events, promises, etc.
  // We don't want those events to resolve during the render loop because the events might add new primitives
  callAfterRenderFunctions(this);

  if (shouldRender) {
    this._postRender.raiseEvent(this, time);
    frameState.creditDisplay.endFrame();
  }
};

/**
 * 更新并渲染场景。始终强制进行新的渲染帧，无论之前是否请求过渲染。
 * @param {JulianDate} [time] 渲染时的模拟时间。
 *
 * @private
 */

Scene.prototype.forceRender = function (time) {
  this._renderRequested = true;
  this.render(time);
};

/**
 * 当 {@link Scene#requestRenderMode} 设置为 <code>true</code> 时请求新的渲染帧。
 * 渲染速率不会超过 {@link CesiumWidget#targetFrameRate}。
 *
 * @see Scene#requestRenderMode
 */

Scene.prototype.requestRender = function () {
  this._renderRequested = true;
};

/**
 * @private
 */
Scene.prototype.clampLineWidth = function (width) {
  return Math.max(
    ContextLimits.minimumAliasedLineWidth,
    Math.min(width, ContextLimits.maximumAliasedLineWidth),
  );
};

/**
 * 返回一个包含 `primitive` 属性的对象，该属性包含在特定窗口坐标下场景中的第一个（最上面）原始对象，
 * 如果该位置没有对象，则返回未定义。其他属性可能会根据原始对象的类型设置，
 * 可以用来进一步识别所选对象。
 * <p>
 * 当选择 3D 瓦片集的一个特征时，<code>pick</code> 返回一个 {@link Cesium3DTileFeature} 对象。
 * </p>
 *
 * @example
 * // On mouse over, color the feature yellow.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileFeature) {
 *         feature.color = Cesium.Color.YELLOW;
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 *
 * @param {Cartesian2} windowPosition Window coordinates to perform picking on.
 * @param {number} [width=3] Width of the pick rectangle.
 * @param {number} [height=3] Height of the pick rectangle.
 * @returns {object} Object containing the picked primitive.
 */
Scene.prototype.pick = function (windowPosition, width, height) {
  return this._picking.pick(this, windowPosition, width, height);
};

/**
 * 返回在特定窗口坐标处渲染的 {@link VoxelCell}，
 * 如果该位置未渲染任何体素，则返回未定义。
 *
 * @example
 * 在左键点击时，报告该体素样本的 "color" 属性值。
 * handler.setInputAction(function(movement) {
 *   const voxelCell = scene.pickVoxel(movement.position);
 *   if (defined(voxelCell)) {
 *     console.log(voxelCell.getProperty("color"));
 *   }
 * }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @param {number} [width=3] 拾取矩形的宽度。
 * @param {number} [height=3] 拾取矩形的高度。
 * @returns {VoxelCell|undefined} 关于在选定位置渲染的体素单元的信息。
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

Scene.prototype.pickVoxel = function (windowPosition, width, height) {
  const pickedObject = this.pick(windowPosition, width, height);
  if (!defined(pickedObject)) {
    return;
  }
  const voxelPrimitive = pickedObject.primitive;
  if (!(voxelPrimitive instanceof VoxelPrimitive)) {
    return;
  }
  const voxelCoordinate = this._picking.pickVoxelCoordinate(
    this,
    windowPosition,
    width,
    height,
  );
  // Look up the keyframeNode containing this picked cell
  const tileIndex = 255 * voxelCoordinate[0] + voxelCoordinate[1];
  const keyframeNode = voxelPrimitive._traversal.findKeyframeNode(tileIndex);
  if (!defined(keyframeNode)) {
    // The tile rendered at the pick position has since been discarded by
    // a traversal update
    return;
  }
  // Look up the metadata for the picked cell
  const sampleIndex = 255 * voxelCoordinate[2] + voxelCoordinate[3];
  return VoxelCell.fromKeyframeNode(
    voxelPrimitive,
    tileIndex,
    sampleIndex,
    keyframeNode,
  );
};

/**
 * 在给定窗口位置处拾取元数据值。
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @param {string|undefined} schemaId 要从中拾取值的元数据模式的 ID。
 * 如果此项为 `undefined`，则将从匹配给定类名和属性名称的对象中拾取值，
 * 而不考虑模式 ID。
 * @param {string} className 要从中拾取值的元数据类名称。
 * @param {string} propertyName 要从中拾取值的元数据属性名称。
 * @returns 元数据值
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

Scene.prototype.pickMetadata = function (
  windowPosition,
  schemaId,
  className,
  propertyName,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("windowPosition", windowPosition);
  Check.typeOf.string("className", className);
  Check.typeOf.string("propertyName", propertyName);
  //>>includeEnd('debug');

  const pickedObject = this.pick(windowPosition);
  if (!defined(pickedObject)) {
    return undefined;
  }

  // Check if the picked object is a model that has structural
  // metadata, with a schema that contains the specified
  // property.
  const schema = pickedObject.detail?.model?.structuralMetadata?.schema;
  const classProperty = getMetadataClassProperty(
    schema,
    schemaId,
    className,
    propertyName,
  );
  if (!defined(classProperty)) {
    return undefined;
  }

  const pickedMetadataInfo = new PickedMetadataInfo(
    schemaId,
    className,
    propertyName,
    classProperty,
  );

  const pickedMetadataValues = this._picking.pickMetadata(
    this,
    windowPosition,
    pickedMetadataInfo,
  );

  return pickedMetadataValues;
};

/**
 * 拾取给定位置处对象的元数据模式。
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @returns {MetadataSchema} 元数据模式；如果在给定位置没有与之关联的元数据对象，则返回 `undefined`。
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

Scene.prototype.pickMetadataSchema = function (windowPosition) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("windowPosition", windowPosition);
  //>>includeEnd('debug');

  const pickedObject = this.pick(windowPosition);
  if (!defined(pickedObject)) {
    return undefined;
  }
  const schema = pickedObject.detail?.model?.structuralMetadata?.schema;
  return schema;
};

/**
 * 返回根据深度缓冲区和窗口位置重建的笛卡尔位置。
 * 返回的位置使用世界坐标。该方法在内部由相机功能使用，
 * 以防止转换为投影的 2D 坐标然后再转换回来。
 * <p>
 * 设置 {@link Scene#pickTranslucentDepth} 为 <code>true</code> 以包括
 * 半透明原始对象的深度；否则，这基本上是在半透明原始对象中进行拾取。
 * </p>
 *
 * @private
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @param {Cartesian3} [result] 用于存储结果的对象。
 * @returns {Cartesian3} 世界坐标下的笛卡尔位置。
 *
 * @exception {DeveloperError} 不支持从深度缓冲区进行拾取。检查 pickPositionSupported。
 */

Scene.prototype.pickPositionWorldCoordinates = function (
  windowPosition,
  result,
) {
  return this._picking.pickPositionWorldCoordinates(
    this,
    windowPosition,
    result,
  );
};

/**
 * 返回根据深度缓冲区和窗口位置重建的笛卡尔位置。
 * <p>
 * 从深度缓冲区在 2D 中重建的位置可能与在 3D 和哥伦布视图中重建的位置略有不同。 
 * 这是由于透视投影和正交投影的深度值分布的差异造成的。
 * </p>
 * <p>
 * 设置 {@link Scene#pickTranslucentDepth} 为 <code>true</code> 以包括
 * 半透明原始对象的深度；否则，这基本上是在半透明原始对象中进行拾取。
 * </p>
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @param {Cartesian3} [result] 用于存储结果的对象。
 * @returns {Cartesian3} 笛卡尔位置。
 *
 * @exception {DeveloperError} 不支持从深度缓冲区进行拾取。检查 pickPositionSupported。
 */

Scene.prototype.pickPosition = function (windowPosition, result) {
  return this._picking.pickPosition(this, windowPosition, result);
};

/**
 * 返回一个对象列表，每个对象包含一个 `primitive` 属性，表示在特定窗口坐标位置的所有原始对象。 
 * 其他属性可能会根据原始对象的类型被设置，用于进一步识别被选中的对象。列表中的原始对象按照 
 * 它们在场景中的视觉顺序排序（从前到后）。
 *
 * @param {Cartesian2} windowPosition 要进行拾取的窗口坐标。
 * @param {number} [limit] 如果提供，则在收集到如此多个拾取后停止钻取。
 * @param {number} [width=3] 拾取矩形的宽度。
 * @param {number} [height=3] 拾取矩形的高度。
 * @returns {any[]} 一个对象数组，每个对象包含一个被拾取的原始对象。
 *
 * @exception {DeveloperError} windowPosition 未定义。
 *
 * @example
 * const pickedObjects = scene.drillPick(new Cesium.Cartesian2(100.0, 200.0));
 *
 * @see Scene#pick
 */

Scene.prototype.drillPick = function (windowPosition, limit, width, height) {
  return this._picking.drillPick(this, windowPosition, limit, width, height);
};

function updatePreloadPass(scene) {
  const frameState = scene._frameState;
  preloadTilesetPassState.camera = frameState.camera;
  preloadTilesetPassState.cullingVolume = frameState.cullingVolume;

  const primitives = scene.primitives;
  primitives.updateForPass(frameState, preloadTilesetPassState);
}

function updatePreloadFlightPass(scene) {
  const frameState = scene._frameState;
  const camera = frameState.camera;
  if (!camera.canPreloadFlight()) {
    return;
  }

  preloadFlightTilesetPassState.camera = scene.preloadFlightCamera;
  preloadFlightTilesetPassState.cullingVolume =
    scene.preloadFlightCullingVolume;

  const primitives = scene.primitives;
  primitives.updateForPass(frameState, preloadFlightTilesetPassState);
}

function updateRequestRenderModeDeferCheckPass(scene) {
  // Check if any ignored requests are ready to go (to wake rendering up again)
  scene.primitives.updateForPass(
    scene._frameState,
    requestRenderModeDeferCheckPassState,
  );
}

/**
 * 返回一个对象，包含被光线第一次交叉的对象及其交叉位置，
 * 如果没有交叉则返回 <code>undefined</code>。交叉对象具有一个 <code>primitive</code>
 * 属性，包含交叉的原始对象。其他属性可能会根据原始对象的类型被设置，
 * 用于进一步识别被选中的对象。光线必须以世界坐标给出。
 * <p>
 * 此函数仅拾取当前视图中渲染的地球瓦片和 3D 瓦片。拾取所有其他
 * 原始对象，无论它们的可见性如何。
 * </p>
 *
 * @private
 *
 * @param {Ray} ray 光线。
 * @param {Object[]} [objectsToExclude] 要从光线交叉中排除的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {object} 包含第一个交叉的对象及其位置的对象。
 *
 * @exception {DeveloperError} 仅在 3D 模式下支持光线交叉。
 */

Scene.prototype.pickFromRay = function (ray, objectsToExclude, width) {
  return this._picking.pickFromRay(this, ray, objectsToExclude, width);
};

/**
 * 返回一个对象列表，每个对象包含被光线交叉的对象及其交叉位置。
 * 交叉对象具有一个 <code>primitive</code> 属性，包含交叉的原始对象。其他
 * 属性可能会根据原始对象的类型被设置，用于进一步识别被选中的对象。
 * 列表中的原始对象按照从第一次交叉到最后一次交叉的顺序排列。光线必须以
 * 世界坐标给出。
 * <p>
 * 此函数仅拾取当前视图中渲染的地球瓦片和 3D 瓦片。拾取所有其他
 * 原始对象，无论它们的可见性如何。
 * </p>
 *
 * @private
 *
 * @param {Ray} ray 光线。
 * @param {number} [limit=Number.MAX_VALUE] 如果提供，在找到如此多个交叉后停止查找交叉。
 * @param {Object[]} [objectsToExclude] 要从光线交叉中排除的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {Object[]} 包含每个交叉的对象及其位置的对象列表。
 *
 * @exception {DeveloperError} 仅在 3D 模式下支持光线交叉。
 */

Scene.prototype.drillPickFromRay = function (
  ray,
  limit,
  objectsToExclude,
  width,
) {
  return this._picking.drillPickFromRay(
    this,
    ray,
    limit,
    objectsToExclude,
    width,
  );
};

/**
 * 使用最大细节级别异步发起 {@link Scene#pickFromRay} 请求，无论可见性如何，适用于 3D 瓦片集。
 *
 * @private
 *
 * @param {Ray} ray 光线。
 * @param {Object[]} [objectsToExclude] 要从光线交叉中排除的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {Promise<object>} 一个承诺，其解析结果为包含第一次交叉的对象及其位置的对象。
 *
 * @exception {DeveloperError} 仅在 3D 模式下支持光线交叉。
 */

Scene.prototype.pickFromRayMostDetailed = function (
  ray,
  objectsToExclude,
  width,
) {
  return this._picking.pickFromRayMostDetailed(
    this,
    ray,
    objectsToExclude,
    width,
  );
};

/**
 * 使用最大细节级别异步发起 {@link Scene#drillPickFromRay} 请求，无论可见性如何，适用于 3D 瓦片集。
 *
 * @private
 *
 * @param {Ray} ray 光线。
 * @param {number} [limit=Number.MAX_VALUE] 如果提供，在找到如此多个交叉后停止查找交叉。
 * @param {Object[]} [objectsToExclude] 要从光线交叉中排除的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {Promise<Object[]>} 一个承诺，其解析结果为包含每个交叉的对象及其位置的对象列表。
 *
 * @exception {DeveloperError} 仅在 3D 模式下支持光线交叉。
 */

Scene.prototype.drillPickFromRayMostDetailed = function (
  ray,
  limit,
  objectsToExclude,
  width,
) {
  return this._picking.drillPickFromRayMostDetailed(
    this,
    ray,
    limit,
    objectsToExclude,
    width,
  );
};

/**
 * 返回给定地图位置处场景几何的高度，如果没有
 * 场景几何可用于采样高度，则返回 <code>undefined</code>。输入位置的高度将被忽略。可以用于将对象固定到
 * 地球、3D 瓦片或场景中的原始对象。
 * <p>
 * 此函数仅从当前视图中渲染的地球瓦片和 3D 瓦片采样高度。仍然会从所有其他
 * 原始对象采样高度，无论它们的可见性如何。
 * </p>
 *
 * @param {Cartographic} position 要从中采样高度的地图位置。
 * @param {Object[]} [objectsToExclude] 不用于采样高度的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {number} 高度。如果没有可用于采样高度的场景几何，则可能为 <code>undefined</code>。
 *
 * @example
 * const position = new Cesium.Cartographic(-1.31968, 0.698874);
 * const height = viewer.scene.sampleHeight(position);
 * console.log(height);
 *
 * @see Scene#clampToHeight
 * @see Scene#clampToHeightMostDetailed
 * @see Scene#sampleHeightMostDetailed
 *
 * @exception {DeveloperError} sampleHeight 仅在 3D 模式下支持。
 * @exception {DeveloperError} sampleHeight 需要深度纹理支持。检查 sampleHeightSupported。
 */

Scene.prototype.sampleHeight = function (position, objectsToExclude, width) {
  return this._picking.sampleHeight(this, position, objectsToExclude, width);
};

/**
 * 将给定的笛卡尔位置沿地理表面法线夹紧到场景几何上。返回
 * 夹紧后的位置或 <code>undefined</code> 如果没有可夹紧到的场景几何。可以用于将对象夹紧到
 * 地球、3D 瓦片或场景中的原始对象。
 * <p>
 * 此函数仅夹紧到当前视图中渲染的地球瓦片和 3D 瓦片。仍然会夹紧到
 * 所有其他原始对象，无论它们的可见性如何。
 * </p>
 *
 * @param {Cartesian3} cartesian 笛卡尔位置。
 * @param {Object[]} [objectsToExclude] 不用于夹紧的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @param {Cartesian3} [result] 一个可选对象，用于返回夹紧后的位置。
 * @returns {Cartesian3} 修改后的结果参数或新的三维笛卡尔实例（如果未提供）；如果没有可夹紧到的场景几何，则可能为 <code>undefined</code>。
 *
 * @example
 * // 将实体夹紧到底层场景几何
 * const position = entity.position.getValue(Cesium.JulianDate.now());
 * entity.position = viewer.scene.clampToHeight(position);
 *
 * @see Scene#sampleHeight
 * @see Scene#sampleHeightMostDetailed
 * @see Scene#clampToHeightMostDetailed
 *
 * @exception {DeveloperError} clampToHeight 仅在 3D 模式下支持。
 * @exception {DeveloperError} clampToHeight 需要深度纹理支持。检查 clampToHeightSupported。
 */

Scene.prototype.clampToHeight = function (
  cartesian,
  objectsToExclude,
  width,
  result,
) {
  return this._picking.clampToHeight(
    this,
    cartesian,
    objectsToExclude,
    width,
    result,
  );
};

/**
 * 以场景中 3D 瓦片集的最大细节级别异步发起 {@link Scene#sampleHeight} 查询，针对一组 {@link Cartographic} 位置。
 * 输入位置的高度将被忽略。返回一个在查询完成时被解析的承诺。每个点的高度将在原地修改。
 * 如果无法确定高度，因为该位置没有可用于采样的几何，或发生其他错误，则高度将被设置为未定义。
 *
 * @param {Cartographic[]} positions 要更新的地图位置，包含采样后的高度。
 * @param {Object[]} [objectsToExclude] 不用于采样高度的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {Promise<Cartographic[]>} 一个承诺，当查询完成时解析为提供的位置列表。
 *
 * @example
 * const positions = [
 *     new Cesium.Cartographic(-1.31968, 0.69887),
 *     new Cesium.Cartographic(-1.10489, 0.83923)
 * ];
 * const promise = viewer.scene.sampleHeightMostDetailed(positions);
 * promise.then(function(updatedPosition) {
 *     // positions[0].height 和 positions[1].height 已被更新。
 *     // updatedPositions 只是对 positions 的引用。
 * });
 *
 * @see Scene#sampleHeight
 *
 * @exception {DeveloperError} sampleHeightMostDetailed 仅在 3D 模式下支持。
 * @exception {DeveloperError} sampleHeightMostDetailed 需要深度纹理支持。检查 sampleHeightSupported。
 */

Scene.prototype.sampleHeightMostDetailed = function (
  positions,
  objectsToExclude,
  width,
) {
  return this._picking.sampleHeightMostDetailed(
    this,
    positions,
    objectsToExclude,
    width,
  );
};

/**
 * 以场景中 3D 瓦片集的最大细节级别异步发起 {@link Scene#clampToHeight} 查询，针对一组 {@link Cartesian3} 位置。
 * 返回一个在查询完成时被解析的承诺。每个位置将在原地修改。
 * 如果无法夹紧某个位置，因为该位置没有可用于采样的几何，或发生其他错误，则数组中的元素将被设置为未定义。
 *
 * @param {Cartesian3[]} cartesians 要更新的笛卡尔位置，包含夹紧后的位置。
 * @param {Object[]} [objectsToExclude] 不用于夹紧的原始对象、实体或 3D 瓦片特征的列表。
 * @param {number} [width=0.1] 交叉体积的宽度，以米为单位。
 * @returns {Promise<Cartesian3[]>} 一个承诺，当查询完成时解析为提供的位置列表。
 *
 * @example
 * const cartesians = [
 *     entities[0].position.getValue(Cesium.JulianDate.now()),
 *     entities[1].position.getValue(Cesium.JulianDate.now())
 * ];
 * const promise = viewer.scene.clampToHeightMostDetailed(cartesians);
 * promise.then(function(updatedCartesians) {
 *     entities[0].position = updatedCartesians[0];
 *     entities[1].position = updatedCartesians[1];
 * });
 *
 * @see Scene#clampToHeight
 *
 * @exception {DeveloperError} clampToHeightMostDetailed 仅在 3D 模式下支持。
 * @exception {DeveloperError} clampToHeightMostDetailed 需要深度纹理支持。检查 clampToHeightSupported。
 */

Scene.prototype.clampToHeightMostDetailed = function (
  cartesians,
  objectsToExclude,
  width,
) {
  return this._picking.clampToHeightMostDetailed(
    this,
    cartesians,
    objectsToExclude,
    width,
  );
};

/**
 * 将笛卡尔坐标中的位置转换为画布坐标。通常用于将
 * HTML 元素放置在与场景中对象相同的屏幕位置。
 *
 * @param {Cartesian3} position 符卡尔坐标中的位置。
 * @param {Cartesian2} [result] 可选对象，用于返回转换为画布坐标的输入位置。
 * @returns {Cartesian2} 修改后的结果参数或新的二维笛卡尔实例（如果未提供）；如果输入位置接近椭球体中心，则可能为 <code>undefined</code>。
 *
 * @example
 * // Output the canvas position of longitude/latitude (0, 0) every time the mouse moves.
 * const scene = widget.scene;
 * const position = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
 * handler.setInputAction(function(movement) {
 *     console.log(scene.cartesianToCanvasCoordinates(position));
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
Scene.prototype.cartesianToCanvasCoordinates = function (position, result) {
  return SceneTransforms.worldToWindowCoordinates(this, position, result);
};

/**
 * 立即完成一个正在进行的过渡。
 */
Scene.prototype.completeMorph = function () {
  this._transitioner.completeMorph();
};

/**
 * 异步地将场景过渡到 2D 模式。
 * @param {number} [duration=2.0] 过渡动画完成的时间，以秒为单位。
 */
Scene.prototype.morphTo2D = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphTo2D(duration, this._ellipsoid);
};

/**
 * 异步地将场景过渡到哥伦布视图模式。
 * @param {number} [duration=2.0] 过渡动画完成的时间，以秒为单位。
 */

Scene.prototype.morphToColumbusView = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphToColumbusView(duration, this._ellipsoid);
};

/**
 * 异步地将场景过渡到 3D 模式。
 * @param {number} [duration=2.0] 过渡动画完成的时间，以秒为单位。
 */

Scene.prototype.morphTo3D = function (duration) {
  duration = defaultValue(duration, 2.0);
  this._transitioner.morphTo3D(duration, this._ellipsoid);
};

function setTerrain(scene, terrain) {
  // Cancel any in-progress terrain update
  scene._removeTerrainProviderReadyListener =
    scene._removeTerrainProviderReadyListener &&
    scene._removeTerrainProviderReadyListener();

  // If the terrain is already loaded, set it immediately
  if (terrain.ready) {
    if (defined(scene.globe)) {
      scene.globe.terrainProvider = terrain.provider;
    }
    return;
  }
  // Otherwise, set a placeholder
  scene.globe.terrainProvider = undefined;
  scene._removeTerrainProviderReadyListener =
    terrain.readyEvent.addEventListener((provider) => {
      if (defined(scene) && defined(scene.globe)) {
        scene.globe.terrainProvider = provider;
      }

      scene._removeTerrainProviderReadyListener();
    });
}

/**
 * 更新提供地球表面几何的地形。
 *
 * @param {Terrain} terrain 地形提供程序异步助手
 * @returns {Terrain} terrain 地形提供程序异步助手
 *
 * @example
 * // Use Cesium World Terrain
 * scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
 *
 * @example
 * // Use a custom terrain provider
 * const terrain = new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 * scene.setTerrain(terrain);
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 */
Scene.prototype.setTerrain = function (terrain) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrain", terrain);
  //>>includeEnd('debug');

  setTerrain(this, terrain);

  return terrain;
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果该对象已被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code> 如果该对象已被销毁；否则返回 <code>false</code>。
 *
 * @see Scene#destroy
 */

Scene.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地
 * 释放 WebGL 资源，而不是依赖垃圾收集器来销毁该对象。
 * <br /><br />
 * 一旦对象被销毁，就不应再使用；调用除
 * <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * scene = scene && scene.destroy();
 *
 * @see Scene#isDestroyed
 */
Scene.prototype.destroy = function () {
  this._tweens.removeAll();
  this._computeEngine = this._computeEngine && this._computeEngine.destroy();
  this._screenSpaceCameraController =
    this._screenSpaceCameraController &&
    this._screenSpaceCameraController.destroy();
  this._deviceOrientationCameraController =
    this._deviceOrientationCameraController &&
    !this._deviceOrientationCameraController.isDestroyed() &&
    this._deviceOrientationCameraController.destroy();
  this._primitives = this._primitives && this._primitives.destroy();
  this._groundPrimitives =
    this._groundPrimitives && this._groundPrimitives.destroy();
  this._globe = this._globe && this._globe.destroy();
  this._removeTerrainProviderReadyListener =
    this._removeTerrainProviderReadyListener &&
    this._removeTerrainProviderReadyListener();
  this.skyBox = this.skyBox && this.skyBox.destroy();
  this.skyAtmosphere = this.skyAtmosphere && this.skyAtmosphere.destroy();
  this._debugSphere = this._debugSphere && this._debugSphere.destroy();
  this.sun = this.sun && this.sun.destroy();
  this._sunPostProcess = this._sunPostProcess && this._sunPostProcess.destroy();
  this._depthPlane = this._depthPlane && this._depthPlane.destroy();
  this._transitioner = this._transitioner && this._transitioner.destroy();
  this._debugFrustumPlanes =
    this._debugFrustumPlanes && this._debugFrustumPlanes.destroy();
  this._brdfLutGenerator =
    this._brdfLutGenerator && this._brdfLutGenerator.destroy();
  this._picking = this._picking && this._picking.destroy();

  this._defaultView = this._defaultView && this._defaultView.destroy();
  this._view = undefined;

  if (this._removeCreditContainer) {
    this._canvas.parentNode.removeChild(this._creditContainer);
  }

  this.postProcessStages =
    this.postProcessStages && this.postProcessStages.destroy();

  this._context = this._context && this._context.destroy();
  this._frameState.creditDisplay =
    this._frameState.creditDisplay && this._frameState.creditDisplay.destroy();

  if (defined(this._performanceDisplay)) {
    this._performanceDisplay =
      this._performanceDisplay && this._performanceDisplay.destroy();
    this._performanceContainer.parentNode.removeChild(
      this._performanceContainer,
    );
  }

  this._removeRequestListenerCallback();
  this._removeTaskProcessorListenerCallback();
  for (let i = 0; i < this._removeGlobeCallbacks.length; ++i) {
    this._removeGlobeCallbacks[i]();
  }
  this._removeGlobeCallbacks.length = 0;

  if (defined(this._removeUpdateHeightCallback)) {
    this._removeUpdateHeightCallback();
    this._removeUpdateHeightCallback = undefined;
  }

  return destroyObject(this);
};
export default Scene;
