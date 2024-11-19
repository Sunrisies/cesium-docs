import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import deprecationWarning from "../Core/deprecationWarning.js";
import destroyObject from "../Core/destroyObject.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Event from "../Core/Event.js";
import ImageBasedLighting from "./ImageBasedLighting.js";
import Interval from "../Core/Interval.js";
import IntersectionTests from "../Core/IntersectionTests.js";
import IonResource from "../Core/IonResource.js";
import JulianDate from "../Core/JulianDate.js";
import ManagedArray from "../Core/ManagedArray.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import Transforms from "../Core/Transforms.js";
import ClearCommand from "../Renderer/ClearCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import Axis from "./Axis.js";
import Cesium3DTile from "./Cesium3DTile.js";
import Cesium3DTileColorBlendMode from "./Cesium3DTileColorBlendMode.js";
import Cesium3DTileContentState from "./Cesium3DTileContentState.js";
import Cesium3DTilesetMetadata from "./Cesium3DTilesetMetadata.js";
import Cesium3DTileOptimizations from "./Cesium3DTileOptimizations.js";
import Cesium3DTilePass from "./Cesium3DTilePass.js";
import Cesium3DTileRefine from "./Cesium3DTileRefine.js";
import Cesium3DTilesetCache from "./Cesium3DTilesetCache.js";
import Cesium3DTilesetHeatmap from "./Cesium3DTilesetHeatmap.js";
import Cesium3DTilesetStatistics from "./Cesium3DTilesetStatistics.js";
import Cesium3DTileStyleEngine from "./Cesium3DTileStyleEngine.js";
import ClippingPlaneCollection from "./ClippingPlaneCollection.js";
import ClippingPolygonCollection from "./ClippingPolygonCollection.js";
import hasExtension from "./hasExtension.js";
import ImplicitTileset from "./ImplicitTileset.js";
import ImplicitTileCoordinates from "./ImplicitTileCoordinates.js";
import LabelCollection from "./LabelCollection.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import PointCloudEyeDomeLighting from "./PointCloudEyeDomeLighting.js";
import PointCloudShading from "./PointCloudShading.js";
import ResourceCache from "./ResourceCache.js";
import SceneMode from "./SceneMode.js";
import ShadowMode from "./ShadowMode.js";
import SplitDirection from "./SplitDirection.js";
import StencilConstants from "./StencilConstants.js";
import TileBoundingRegion from "./TileBoundingRegion.js";
import TileBoundingSphere from "./TileBoundingSphere.js";
import TileOrientedBoundingBox from "./TileOrientedBoundingBox.js";
import Cesium3DTilesetMostDetailedTraversal from "./Cesium3DTilesetMostDetailedTraversal.js";
import Cesium3DTilesetBaseTraversal from "./Cesium3DTilesetBaseTraversal.js";
import Cesium3DTilesetSkipTraversal from "./Cesium3DTilesetSkipTraversal.js";
import Ray from "../Core/Ray.js";
import DynamicEnvironmentMapManager from "./DynamicEnvironmentMapManager.js";

/**
 * @typedef {Object} Cesium3DTileset.ConstructorOptions
 *
 * Cesium3DTileset 构造函数的初始化选项
 *
 * @property {boolean} [show=true] 确定瓦片集是否可见。
 * @property {Matrix4} [modelMatrix=Matrix4.IDENTITY] 变换矩阵，用于转换瓦片集的根瓦片。
 * @property {Axis} [modelUpAxis=Axis.Y] 加载瓦片内容模型时，哪个轴被视为向上。
 * @property {Axis} [modelForwardAxis=Axis.X] 加载瓦片内容模型时，哪个轴被视为向前。
 * @property {ShadowMode} [shadows=ShadowMode.ENABLED] 确定瓦片集是投射阴影还是接收光源的阴影。
 * @property {number} [maximumScreenSpaceError=16] 用于驱动细节级别优化的最大屏幕空间误差。
 * @property {number} [cacheBytes=536870912] 瓦片缓存将被修剪的大小（以字节为单位），如果缓存中包含当前视图不需要的瓦片。
 * @property {number} [maximumCacheOverflowBytes=536870912] 允许的最大额外内存（以字节为单位），用于缓存冗余空间，如果当前视图需要的内存超过 {@link Cesium3DTileset#cacheBytes}。
 * @property {boolean} [cullWithChildrenBounds=true] 优化选项。是否使用子瓦片的边界体积的联合来剔除瓦片。
 * @property {boolean} [cullRequestsWhileMoving=true] 优化选项。在相机移动时不要请求可能未使用的瓦片。当相机处于静止状态时，此优化适用。
 * @property {number} [cullRequestsWhileMovingMultiplier=60.0] 优化选项。在移动时剔除请求所用的乘数。更大的值会导致更激进的剔除，更小的值则导致剔除较少。
 * @property {boolean} [preloadWhenHidden=false] 当 <code>tileset.show</code> 为 <code>false</code> 时预加载瓦片。加载瓦片就像瓦片集可见一样，但不渲染这些瓦片。
 * @property {boolean} [preloadFlightDestinations=true] 优化选项。在相机飞行时预加载相机飞行目标处的瓦片。
 * @property {boolean} [preferLeaves=false] 优化选项。优先加载叶子瓦片。
 * @property {boolean} [dynamicScreenSpaceError=true] 优化选项。对于街道级景观视图，远离相机的地方使用较低分辨率的瓦片。这将减少加载的数据量，并在视觉质量稍有下降的情况下提高瓦片集的加载时间。
 * @property {number} [dynamicScreenSpaceErrorDensity=2.0e-4] 类似于 {@link Fog#density}，此选项控制 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化应用的相机距离。较大的值将导致离相机更近的瓦片受到影响。
 * @property {number} [dynamicScreenSpaceErrorFactor=24.0] 控制 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化在地平线瓦片上的强度的参数。较大的值会导致加载较低分辨率的瓦片，提高运行时性能，但在视觉质量上会稍有下降。
 * @property {number} [dynamicScreenSpaceErrorHeightFalloff=0.25] 瓦片集高度的比例，确定“街道级”相机视图的位置。当相机位于此高度以下时，{@link Cesium3DTileset#dynamicScreenSpaceError} 优化将产生最大作用，超过此值后将逐渐减弱。
 * @property {number} [progressiveResolutionHeightFraction=0.3] 优化选项。如果在 (0.0, 0.5] 之间，屏幕空间误差达到或超过 <code>progressiveResolutionHeightFraction*screenHeight</code> 的瓦片将首先被优先加载。这可以帮助快速加载一层瓦片，同时继续加载全分辨率瓦片。
 * @property {boolean} [foveatedScreenSpaceError=true] 优化选项。通过暂时提高边缘瓦片的屏幕空间误差，优先加载屏幕中心的瓦片。一旦所有屏幕中心的瓦片（由 {@link Cesium3DTileset#foveatedConeSize} 确定）加载完毕，屏幕空间误差将恢复正常。
 * @property {number} [foveatedConeSize=0.1] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为真时，用于控制确定哪些瓦片被延迟的锥形大小。处于锥形内的瓦片会立即加载。处于锥形外的瓦片会根据它们距锥形的远近及其屏幕空间误差进行延迟。这由 {@link Cesium3DTileset#foveatedInterpolationCallback} 和 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 控制。将其设置为 0.0 意味着锥形将由相机位置和视角形成的直线。将其设置为 1.0 意味着锥形将包含相机的整个视野，禁用此效果。
 * @property {number} [foveatedMinimumScreenSpaceErrorRelaxation=0.0] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为真时，用于控制锥形外瓦片的起始屏幕空间误差放松。屏幕空间误差将根据提供的 {@link Cesium3DTileset#foveatedInterpolationCallback} 从瓦片集值提升到 {@link Cesium3DTileset#maximumScreenSpaceError}。
 * @property {Cesium3DTileset.foveatedInterpolationCallback} [foveatedInterpolationCallback=Math.lerp] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为真时，用于控制在锥形外提升屏幕空间误差的程度，从 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 插值到 {@link Cesium3DTileset#maximumScreenSpaceError}。
 * @property {number} [foveatedTimeDelay=0.2] 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为真时，用于控制在相机停止移动后等待多少秒再开始加载延迟的瓦片。这个时间延迟可以防止在相机移动时请求屏幕边缘附近的瓦片。将其设置为 0.0 会立即请求任何给定视图中的所有瓦片。
 * @property {boolean} [skipLevelOfDetail=false] 优化选项。确定在遍历期间是否应用细节级别跳过。
 * @property {number} [baseScreenSpaceError=1024] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，必须达到的屏幕空间误差才能跳过细节级别。
 * @property {number} [skipScreenSpaceErrorFactor=16] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，定义跳过的最小屏幕空间误差的乘数。与 <code>skipLevels</code> 一起用于确定要加载哪些瓦片。
 * @property {number} [skipLevels=1] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，定义在加载瓦片时跳过的最小级别数的常量。设置为 0 时，不会跳过任何级别。与 <code>skipScreenSpaceErrorFactor</code> 一起用于确定要加载哪些瓦片。
 * @property {boolean} [immediatelyLoadDesiredLevelOfDetail=false] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，仅下载满足最大屏幕空间误差的瓦片。跳过因子被忽略，只有所需的瓦片会被加载。
 * @property {boolean} [loadSiblings=false] 当 <code>skipLevelOfDetail</code> 为 <code>true</code> 时，确定在遍历期间是否始终下载可见瓦片的兄弟瓦片。
 * @property {ClippingPlaneCollection} [clippingPlanes] 用于选择性禁用瓦片集呈现的 {@link ClippingPlaneCollection}。
 * @property {ClippingPolygonCollection} [clippingPolygons] 用于选择性禁用瓦片集呈现的 {@link ClippingPolygonCollection}。
 * @property {ClassificationType} [classificationType] 确定地形、3D 瓷砖或两者将由此瓦片集分类。有关限制和限制的详细信息，请参见 {@link Cesium3DTileset#classificationType}。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 确定地球大小和形状的椭球体。
 * @property {object} [pointCloudShading] 用于构造 {@link PointCloudShading} 对象以基于几何误差和光照控制点衰减的选项。
 * @property {Cartesian3} [lightColor] 着色模型时的光源颜色。当 <code>undefined</code> 时，将使用场景的光源颜色。
 * @property {ImageBasedLighting} [imageBasedLighting] 用于管理此瓦片集的图像基照明的属性。
 * @param {DynamicEnvironmentMapManager.ConstructorOptions} [options.environmentMapOptions] 用于管理此模型的动态环境贴图的属性。
 * @property {boolean} [backFaceCulling=true] 是否剔除背面的几何体。当为真时，背面剔除由 glTF 材料的 doubleSided 属性决定；当为假时，将禁用背面剔除。
 * @property {boolean} [enableShowOutline=true] 是否启用使用 {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展的模型的轮廓。这可以设置为 false，以避免加载时对几何体进行额外处理。为 false 时，showOutlines 和 outlineColor 选项将被忽略。
 * @property {boolean} [showOutline=true] 是否显示使用 {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展的模型的轮廓。当为 true 时，显示轮廓；为 false 时，不显示轮廓。
 * @property {Color} [outlineColor=Color.BLACK] 渲染轮廓时使用的颜色。
 * @property {boolean} [vectorClassificationOnly=false] 表示仅应使用瓷砖集的向量瓦片进行分类。
 * @property {boolean} [vectorKeepDecodedPositions=false] 向量瓦片是否应将解码的位置保留在内存中。此选项与 {@link Cesium3DTileFeature.getPolylinePositions} 一起使用。
 * @property {string|number} [featureIdLabel="featureId_0"] 用于拾取和样式设置的特征 ID 集的标签。对于 EXT_mesh_features，这是特征 ID 的标签属性，或在未指定的情况下为 "featureId_N"（其中 N 是特征 ID 数组中的索引）。EXT_feature_metadata 没有标签字段，因此此类特征 ID 集始终标记为 "featureId_N"，其中 N 是所有特征 ID 列表中特征 ID 属性出现在特征 ID 纹理之前时的索引。如果 featureIdLabel 是整数 N，则会自动转换为字符串 "featureId_N"。如果存在逐个原始和逐实例特征 ID，实例特征 ID 将优先。
 * @property {string|number} [instanceFeatureIdLabel="instanceFeatureId_0"] 用于拾取和样式设置的实例特征 ID 集的标签。如果 instanceFeatureIdLabel 设置为整数 N，则会自动转换为字符串 "instanceFeatureId_N"。如果存在逐个原始和逐实例特征 ID，实例特征 ID 将优先。
 * @property {boolean} [showCreditsOnScreen=false] 是否在屏幕上显示此瓦片集的版权信息。
 * @property {SplitDirection} [splitDirection=SplitDirection.NONE] 要应用于此瓦片集的 {@link SplitDirection} 分割。
 * @property {boolean} [enableCollision=false] 当 <code>true</code> 时，启用相机或 CPU 拾取的碰撞检测。当 <code>true</code> 时，相机将被阻止在瓦片集表面以下移动，如果 {@link ScreenSpaceCameraController#enableCollisionDetection} 为 true。
 * @property {boolean} [projectTo2D=false] 是否准确地将瓦片集投影到 2D。如果为真，则瓦片集将在 2D 中准确投影，但将使用更多内存。如果为假，瓦片集将使用更少的内存，并且仍将在 2D / CV 模式中呈现，但其投影位置可能不准确。此选项在瓦片集创建后无法设置。
 * @property {boolean} [enablePick=false] 是否允许在使用 WebGL 1 时与 <code>pick</code> 进行碰撞和 CPU 拾取。如果使用 WebGL 2 或更高版本，则将忽略此选项。如果使用 WebGL 1 且此选项为真，<code>pick</code> 操作将正常工作，但将使用更多内存。如果在 WebGL 1 中运行且此选项为假，模型将使用更少的内存，但 <code>pick</code> 将始终返回 <code>undefined</code>。此选项在瓦片集加载后无法设置。
 * @property {string} [debugHeatmapTilePropertyName] 用于作为热图着色的瓦片变量。所有渲染的瓦片将相对于彼此指定的变量值着色。
 * @property {boolean} [debugFreezeFrame=false] 仅用于调试。确定是否仅使用前一帧的瓦片进行渲染。
 * @property {boolean} [debugColorizeTiles=false] 仅用于调试。当为真时，为每个瓦片分配随机颜色。
 * @property {boolean} [enableDebugWireframe=false] 仅用于调试。此选项必须为真才能在 WebGL1 中有效。此选项在瓦片集创建后无法设置。
 * @property {boolean} [debugWireframe=false] 仅用于调试。当为真时，以线框的形式渲染每个瓦片的内容。
 * @property {boolean} [debugShowBoundingVolume=false] 仅用于调试。当为真时，渲染每个瓦片的边界体积。
 * @property {boolean} [debugShowContentBoundingVolume=false] 仅用于调试。当为真时，渲染每个瓦片内容的边界体积。
 * @property {boolean} [debugShowViewerRequestVolume=false] 仅用于调试。当为真时，渲染每个瓦片的查看请求体积。
 * @property {boolean} [debugShowGeometricError=false] 仅用于调试。当为真时，绘制标签以指示每个瓦片的几何误差。
 * @property {boolean} [debugShowRenderingStatistics=false] 仅用于调试。当为真时，绘制标签以指示每个瓦片的命令数量、点数、三角形和特征数量。
 * @property {boolean} [debugShowMemoryUsage=false] 仅用于调试。当为真时，绘制标签以指示每个瓦片使用的纹理和几何体内存（以兆字节为单位）。
 * @property {boolean} [debugShowUrl=false] 仅用于调试。当为真时，绘制标签以指示每个瓦片的 URL。
 */


/**
 * 一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles specification}，
 * 用于流式传输大规模异构的 3D 地理空间数据集。
 *
 * <div class="notice">
 * 此对象通常不直接实例化，请使用 {@link Cesium3DTileset.fromUrl}。
 * </div>
 *
 * @alias Cesium3DTileset
 * @constructor
 *
 * @param {Cesium3DTileset.ConstructorOptions} options 描述初始化选项的对象。
 *
 * @exception {DeveloperError} 瓦片集必须是 3D Tiles 版本 0.0 或 1.0。
 *
 * @example
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json"
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Turn on camera collisions with the tileset.
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json",
 *      { enableCollision: true }
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Common setting for the skipLevelOfDetail optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      skipLevelOfDetail: true,
 *      baseScreenSpaceError: 1024,
 *      skipScreenSpaceErrorFactor: 16,
 *      skipLevels: 1,
 *      immediatelyLoadDesiredLevelOfDetail: false,
 *      loadSiblings: false,
 *      cullWithChildrenBounds: true
 * });
 * scene.primitives.add(tileset);
 *
 * @example
 * // Common settings for the dynamicScreenSpaceError optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      dynamicScreenSpaceError: true,
 *      dynamicScreenSpaceErrorDensity: 2.0e-4,
 *      dynamicScreenSpaceErrorFactor: 24.0,
 *      dynamicScreenSpaceErrorHeightFalloff: 0.25
 * });
 * scene.primitives.add(tileset);
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles specification}
 */
function Cesium3DTileset(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._url = undefined;
  this._basePath = undefined;
  this._root = undefined;
  this._resource = undefined;
  this._asset = undefined; // Metadata for the entire tileset
  this._properties = undefined; // Metadata for per-model/point/etc properties
  this._geometricError = undefined; // Geometric error when the tree is not rendered at all
  this._scaledGeometricError = undefined; // Geometric error scaled by root tile scale
  this._extensionsUsed = undefined;
  this._extensions = undefined;
  this._modelUpAxis = undefined;
  this._modelForwardAxis = undefined;
  this._cache = new Cesium3DTilesetCache();
  this._processingQueue = [];
  this._selectedTiles = [];
  this._emptyTiles = [];
  this._requestedTiles = [];
  this._selectedTilesToStyle = [];
  this._loadTimestamp = undefined;
  this._timeSinceLoad = 0.0;
  this._updatedVisibilityFrame = 0;
  this._updatedModelMatrixFrame = 0;
  this._modelMatrixChanged = false;
  this._previousModelMatrix = undefined;
  this._extras = undefined;
  this._credits = undefined;

  this._showCreditsOnScreen = defaultValue(options.showCreditsOnScreen, false);

  this._cullWithChildrenBounds = defaultValue(
    options.cullWithChildrenBounds,
    true,
  );
  this._allTilesAdditive = true;

  this._hasMixedContent = false;

  this._stencilClearCommand = undefined;
  this._backfaceCommands = new ManagedArray();

  this._maximumScreenSpaceError = defaultValue(
    options.maximumScreenSpaceError,
    16,
  );
  this._memoryAdjustedScreenSpaceError = this._maximumScreenSpaceError;

  this._cacheBytes = defaultValue(options.cacheBytes, 512 * 1024 * 1024);
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("cacheBytes", this._cacheBytes, 0);
  //>>includeEnd('debug');

  const maximumCacheOverflowBytes = defaultValue(
    options.maximumCacheOverflowBytes,
    512 * 1024 * 1024,
  );
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals(
    "maximumCacheOverflowBytes",
    maximumCacheOverflowBytes,
    0,
  );
  //>>includeEnd('debug');
  this._maximumCacheOverflowBytes = maximumCacheOverflowBytes;

  this._styleEngine = new Cesium3DTileStyleEngine();
  this._styleApplied = false;

  this._modelMatrix = defined(options.modelMatrix)
    ? Matrix4.clone(options.modelMatrix)
    : Matrix4.clone(Matrix4.IDENTITY);

  this._addHeightCallbacks = [];

  this._statistics = new Cesium3DTilesetStatistics();
  this._statisticsLast = new Cesium3DTilesetStatistics();
  this._statisticsPerPass = new Array(Cesium3DTilePass.NUMBER_OF_PASSES);

  for (let i = 0; i < Cesium3DTilePass.NUMBER_OF_PASSES; ++i) {
    this._statisticsPerPass[i] = new Cesium3DTilesetStatistics();
  }

  this._requestedTilesInFlight = [];

  this._maximumPriority = {
    foveatedFactor: -Number.MAX_VALUE,
    depth: -Number.MAX_VALUE,
    distance: -Number.MAX_VALUE,
    reverseScreenSpaceError: -Number.MAX_VALUE,
  };
  this._minimumPriority = {
    foveatedFactor: Number.MAX_VALUE,
    depth: Number.MAX_VALUE,
    distance: Number.MAX_VALUE,
    reverseScreenSpaceError: Number.MAX_VALUE,
  };
  this._heatmap = new Cesium3DTilesetHeatmap(
    options.debugHeatmapTilePropertyName,
  );

  /**
   * 优化选项。在相机移动时，不请求可能在返回时未被使用的瓦片。此优化仅适用于静止的瓦片集。
   *
   * @type {boolean}
   * @default true
   */

  this.cullRequestsWhileMoving = defaultValue(
    options.cullRequestsWhileMoving,
    true,
  );
  this._cullRequestsWhileMoving = false;

  /**
   * 优化选项。在移动时用于剔除请求的乘数。较大的值会导致更激进的剔除，较小的值会导致剔除较少。
   *
   * @type {number}
   * @default 60.0
   */

  this.cullRequestsWhileMovingMultiplier = defaultValue(
    options.cullRequestsWhileMovingMultiplier,
    60.0,
  );
  /**
     * 优化选项。如果在 (0.0, 0.5] 之间，屏幕空间误差达到或超过 <code>progressiveResolutionHeightFraction*screenHeight</code> 的瓦片将首先被优先加载。这可以帮助快速加载一层瓦片，同时继续加载全分辨率的瓦片。
     *
     * @type {number}
     * @default 0.3
     */

  this.progressiveResolutionHeightFraction = CesiumMath.clamp(
    defaultValue(options.progressiveResolutionHeightFraction, 0.3),
    0.0,
    0.5,
  );

  /**
   * 优化选项。优先加载叶子瓦片。
   *
   * @type {boolean}
   * @default false
   */

  this.preferLeaves = defaultValue(options.preferLeaves, false);

  this._tilesLoaded = false;
  this._initialTilesLoaded = false;

  this._tileDebugLabels = undefined;

  this._classificationType = options.classificationType;

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);

  this._initialClippingPlanesOriginMatrix = Matrix4.IDENTITY; // Computed from the tileset JSON.
  this._clippingPlanesOriginMatrix = undefined; // Combines the above with any run-time transforms.
  this._clippingPlanesOriginMatrixDirty = true;

  this._vectorClassificationOnly = defaultValue(
    options.vectorClassificationOnly,
    false,
  );

  this._vectorKeepDecodedPositions = defaultValue(
    options.vectorKeepDecodedPositions,
    false,
  );

  /**
   * 当 <code>tileset.show</code> 为 <code>false</code> 时预加载瓦片。加载瓦片就像瓦片集是可见的一样，但不渲染它们。
   *
   * @type {boolean}
   * @default false
   */
  this.preloadWhenHidden = defaultValue(options.preloadWhenHidden, false);

  /**
   * 优化选项。在相机飞行时获取相机的飞行目的地处的瓦片。
   *
   * @type {boolean}
   * @default true
   */

  this.preloadFlightDestinations = defaultValue(
    options.preloadFlightDestinations,
    true,
  );
  this._pass = undefined; // Cesium3DTilePass

  /**
   * 优化选项。对于街道级地平线视图，在远离相机时使用较低分辨率的瓦片。这减少了加载的数据量，并改善了瓦片集的加载时间，同时在远处视觉质量略有下降。
   * <p>
   * 当相机靠近瓦片集的地面平面并朝向地平线时，该优化效果最强。此外，对于紧密适合的边界体积（如盒子和区域），结果更加准确。
   *
   * @type {boolean}
   * @default true
   */

  this.dynamicScreenSpaceError = defaultValue(
    options.dynamicScreenSpaceError,
    true,
  );

  /**
   * 优化选项。通过临时提高屏幕边缘瓦片的屏幕空间误差，优先加载屏幕中心的瓦片。当屏幕中心的所有瓦片（由 {@link Cesium3DTileset#foveatedConeSize} 确定）加载完成后，屏幕空间误差将恢复正常。
   *
   * @type {boolean}
   * @default true
   */

  this.foveatedScreenSpaceError = defaultValue(
    options.foveatedScreenSpaceError,
    true,
  );
  this._foveatedConeSize = defaultValue(options.foveatedConeSize, 0.1);
  this._foveatedMinimumScreenSpaceErrorRelaxation = defaultValue(
    options.foveatedMinimumScreenSpaceErrorRelaxation,
    0.0,
  );

  /**
   * 获取或设置一个回调，以控制在锥形外部瓦片的屏幕空间误差应提高多少，并在 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 和 {@link Cesium3DTileset#maximumScreenSpaceError} 之间插值。
   *
   * @type {Cesium3DTileset.foveatedInterpolationCallback}
   */
  this.foveatedInterpolationCallback = defaultValue(
    options.foveatedInterpolationCallback,
    CesiumMath.lerp,
  );

  /**
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为真时，用于控制在相机停止移动后等待多少秒再开始加载延迟的瓦片。
   * 此时间延迟可以防止在相机移动时请求屏幕边缘附近的瓦片。
   * 将此值设置为 0.0 将立即请求任何给定视图中的所有瓦片。
   *
   * @type {number}
   * @default 0.2
   */

  this.foveatedTimeDelay = defaultValue(options.foveatedTimeDelay, 0.2);

  /**
   * 类似于 {@link Fog#density}，此选项控制 {@link Cesium3DTileset#dynamicScreenSpaceError}
   * 优化应用的相机距离。较大的值会导致离相机更近的瓦片受到影响。此值必须为非负数。
   * <p>
   * 此优化通过随着相机距离的变化，像钟形曲线一样使瓦片的屏幕空间误差 (SSE) 滚降。
   * 这会导致在远离相机时选择低分辨率的瓦片。靠近相机时，不进行调整。
   * 对于更远的瓦片，SSE 可降低最多达到 {@link Cesium3DTileset#dynamicScreenSpaceErrorFactor}
   * （以像素误差为单位）。
   * </p>
   * <p>
   * 增加密度会使钟形曲线变得更窄，从而影响离相机更近的瓦片。这类似于将雾移动得更靠近相机。
   * </p>
   * <p>
   * 当密度为 0 时，优化将对瓦片集没有影响。
   * </p>
   *
   * @type {number}
   * @default 2.0e-4
   */

  this.dynamicScreenSpaceErrorDensity = defaultValue(
    options.dynamicScreenSpaceErrorDensity,
    2.0e-4,
  );

  /**
   * 一个参数，控制 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化在地平线瓦片上的强度。
   * 较大的值会导致加载低分辨率的瓦片，从而在略微降低视觉质量的情况下提高运行时性能。该值必须为非负数。
   * <p>
   * 更具体地说，此参数表示离相机较远的瓦片的屏幕空间误差 (SSE) 的最大调整（以像素为单位）。有关此优化如何工作的更多详细信息，请参见 {@link Cesium3DTileset#dynamicScreenSpaceErrorDensity}。
   * </p>
   * <p>
   * 当 SSE 因子设置为 0 时，优化将对瓦片集没有影响。
   * </p>
   *
   * @type {number}
   * @default 24.0
   */

  this.dynamicScreenSpaceErrorFactor = defaultValue(
    options.dynamicScreenSpaceErrorFactor,
    24.0,
  );

  /**
   * 瓦片高度的比例，用于确定 {@link Cesium3DTileset#dynamicScreenSpaceError} 优化的“街道级”水平。
   * 当相机低于此高度时，动态屏幕空间误差优化将产生最大效果，并在超过此值时逐渐减弱。有效值介于 0.0 和 1.0 之间。
   * <p>
   *
   * @type {number}
   * @default 0.25
   */

  this.dynamicScreenSpaceErrorHeightFalloff = defaultValue(
    options.dynamicScreenSpaceErrorHeightFalloff,
    0.25,
  );

  // Updated based on the camera position and direction
  this._dynamicScreenSpaceErrorComputedDensity = 0.0;

  /**
   * 确定瓦片集是否从光源投射或接收阴影。
   * <p>
   * 启用阴影会对性能产生影响。投射阴影的瓦片集必须被渲染两次，第一次从相机视角，第二次从光源视角。
   * </p>
   * <p>
   * 仅当 {@link Viewer#shadows} 为 <code>true</code> 时，阴影才会被渲染。
   * </p>
   *
   * @type {ShadowMode}
   * @default ShadowMode.ENABLED
   */

  this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);

  /**
   * 确定瓦片集是否可见。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 定义来自 Cesium API 或声明性样式的每个特征颜色如何与原始特征的源颜色（例如 glTF 材料或瓦片中的每个点颜色）混合。
   *
   * @type {Cesium3DTileColorBlendMode}
   * @default Cesium3DTileColorBlendMode.HIGHLIGHT
   */
  this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

  /**
   * 定义在 {@link Cesium3DTileset#colorBlendMode} 为 <code>MIX</code> 时，用于在源颜色和特征颜色之间线性插值的值。
   * 值为 0.0 时呈现源颜色，值为 1.0 时呈现特征颜色，介于两者之间的任何值都会导致源颜色和特征颜色的混合。
   *
   * @type {number}
   * @default 0.5
   */

  this.colorBlendAmount = 0.5;

  this._pointCloudShading = new PointCloudShading(options.pointCloudShading);
  this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();

  /**
   * 触发以指示加载新瓦片的进度。当请求新瓦片时、请求的瓦片下载完成时，以及下载的瓦片被处理并准备渲染时，都会触发此事件。
   * <p>
   * 待处理瓦片请求的数量 <code>numberOfPendingRequests</code> 和正在处理的瓦片数量 <code>numberOfTilesProcessing</code> 会传递给事件监听器。
   * </p>
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {
   *     if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
   *         console.log('Stopped loading');
   *         return;
   *     }
   *
   *     console.log(`Loading: requests: ${numberOfPendingRequests}, processing: ${numberOfTilesProcessing}`);
   * });
   */
  this.loadProgress = new Event();

  /**
   * 触发以指示此帧中所有满足屏幕空间误差的瓦片已加载完成。对于此视图，瓦片集已完全加载。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.allTilesLoaded.addEventListener(function() {
   *     console.log('All tiles are loaded');
   * });
   *
   * @see Cesium3DTileset#tilesLoaded
   */
  this.allTilesLoaded = new Event();

  /**
   * 触发以指示此帧中所有满足屏幕空间误差的瓦片已加载完成。此事件在初始视图中的所有瓦片加载完成时触发一次。
   * <p>
   * 此事件在场景渲染后的帧结束时触发。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.initialTilesLoaded.addEventListener(function() {
   *     console.log('Initial tiles are loaded');
   * });
   *
   * @see Cesium3DTileset#allTilesLoaded
   */
  this.initialTilesLoaded = new Event();

  /**
   * 触发以指示瓦片的内容已加载。
   * <p>
   * 已加载的 {@link Cesium3DTile} 将传递给事件监听器。
   * </p>
   * <p>
   * 此事件在瓦片集遍历期间触发，同时帧正在渲染，以便在同一帧内使瓦片的更新生效。请勿在事件监听器中创建或修改
   * Cesium 实体或原始对象。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileLoad.addEventListener(function(tile) {
   *     console.log('A tile was loaded.');
   * });
   */
  this.tileLoad = new Event();

  /**
   * 触发以指示瓦片的内容已卸载。
   * <p>
   * 卸载的 {@link Cesium3DTile} 将传递给事件监听器。
   * </p>
   * <p>
   * 此事件在瓦片内容卸载之前立即触发，同时帧正在渲染，以便事件监听器能够访问瓦片的内容。请勿在事件监听器中创建
   * 或修改 Cesium 实体或原始对象。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileUnload.addEventListener(function(tile) {
   *     console.log('A tile was unloaded from the cache.');
   * });
   *
   * @see Cesium3DTileset#cacheBytes
   * @see Cesium3DTileset#trimLoadedTiles
   */
  this.tileUnload = new Event();

  /**
   * 触发以指示瓦片的内容加载失败。
   * <p>
   * 如果没有事件监听器，错误消息将记录到控制台。
   * </p>
   * <p>
   * 传递给监听器的错误对象包含两个属性：
   * <ul>
   * <li><code>url</code>：加载失败的瓦片的 URL。</li>
   * <li><code>message</code>：错误消息。</li>
   * </ul>
   * <p>
   * 如果存在多个内容，则此事件将在每个有错误的内部内容上触发一次。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileFailed.addEventListener(function(error) {
   *     console.log(`An error occurred loading tile: ${error.url}`);
   *     console.log(`Error: ${error.message}`);
   * });
   */
  this.tileFailed = new Event();

  /**
   * 此事件会在每个帧内对每个可见瓦片触发一次。这可以用来手动
   * 样式化瓦片集。
   * <p>
   * 可见的 {@link Cesium3DTile} 将传递给事件监听器。
   * </p>
   * <p>
   * 此事件在瓦片集遍历期间触发，同时帧正在渲染，以便在同一帧内使瓦片的更新生效。
   * 请勿在事件监听器中创建或修改
   * Cesium 实体或原始对象。
   * </p>
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * tileset.tileVisible.addEventListener(function(tile) {
   *     if (tile.content instanceof Cesium.Model3DTileContent) {
   *         console.log('A 3D model tile is visible.');
   *     }
   * });
   *
   * @example
   * // Apply a red style and then manually set random colors for every other feature when the tile becomes visible.
   * tileset.style = new Cesium.Cesium3DTileStyle({
   *     color : 'color("red")'
   * });
   * tileset.tileVisible.addEventListener(function(tile) {
   *     const content = tile.content;
   *     const featuresLength = content.featuresLength;
   *     for (let i = 0; i < featuresLength; i+=2) {
   *         content.getFeature(i).color = Cesium.Color.fromRandom();
   *     }
   * });
   */
  this.tileVisible = new Event();

  /**
    * 优化选项。确定在遍历期间是否应应用细节级别跳过。
    * <p>
    * 替代精细化遍历的常见策略是将树的所有级别存储在内存中，并要求在父级可以细化之前加载所有子级。使用此优化后，可以完全跳过树的级别，并可以与其父级一起渲染子级。使用此优化时，瓦片集所需的内存显著减少。
    * </p>
    *
    * @type {boolean}
    * @default false
    */

  this.skipLevelOfDetail = defaultValue(options.skipLevelOfDetail, false);

  this._disableSkipLevelOfDetail = false;

  /**
   * 必须达到的屏幕空间误差，以便在跳过细节级别之前。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 1024
   */

  this.baseScreenSpaceError = defaultValue(options.baseScreenSpaceError, 1024);

  /**
   * 定义跳过的最小屏幕空间误差的乘数。
   * 例如，如果一个瓦片的屏幕空间误差为 100，则不会加载任何瓦片，除非它们是叶子瓦片或屏幕空间误差 <code><= 100 / skipScreenSpaceErrorFactor</code>。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 16
   */

  this.skipScreenSpaceErrorFactor = defaultValue(
    options.skipScreenSpaceErrorFactor,
    16,
  );

  /**
   * 常量，定义加载瓦片时跳过的最小级别数。当为 0 时，不跳过任何级别。
   * 例如，如果一个瓦片是 1 级，则不会加载任何瓦片，除非它们的级别大于 2。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {number}
   * @default 1
   */
  this.skipLevels = defaultValue(options.skipLevels, 1);

  /**
   * 当为真时，仅下载满足最大屏幕空间误差的瓦片。
   * 跳过因子将被忽略，仅加载所需的瓦片。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.immediatelyLoadDesiredLevelOfDetail = defaultValue(
    options.immediatelyLoadDesiredLevelOfDetail,
    false,
  );

  /**
   * 确定在遍历期间是否始终下载可见瓦片的兄弟瓦片。
   * 这可能有助于确保在查看器向左/右转时瓦片已可用。
   * <p>
   * 仅在 {@link Cesium3DTileset#skipLevelOfDetail} 为 <code>true</code> 时使用。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.loadSiblings = defaultValue(options.loadSiblings, false);

  this._clippingPlanes = undefined;
  if (defined(options.clippingPlanes)) {
    ClippingPlaneCollection.setOwner(
      options.clippingPlanes,
      this,
      "_clippingPlanes",
    );
  }

  this._clippingPolygons = undefined;
  if (defined(options.clippingPolygons)) {
    ClippingPolygonCollection.setOwner(
      options.clippingPolygons,
      this,
      "_clippingPolygons",
    );
  }

  if (defined(options.imageBasedLighting)) {
    this._imageBasedLighting = options.imageBasedLighting;
    this._shouldDestroyImageBasedLighting = false;
  } else {
    this._imageBasedLighting = new ImageBasedLighting();
    this._shouldDestroyImageBasedLighting = true;
  }

  this._environmentMapManager = new DynamicEnvironmentMapManager(
    options.environmentMapOptions,
  );

  /**
   * 模型着色时的光源颜色。当为 <code>undefined</code> 时，将使用场景的光源颜色。
   * <p>
   * 例如，通过设置
   * <code>tileset.imageBasedLighting.imageBasedLightingFactor = new Cartesian2(0.0, 0.0)</code>
   * 来禁用额外的光源会使瓦片集变得更暗。在这里，增加光源的强度会使瓦片集变得更亮。
   * </p>
   *
   * @type {Cartesian3}
   * @default undefined
   */
  this.lightColor = options.lightColor;

  /**
   * 是否剔除背面的几何体。当为真时，背面剔除由 glTF 材料的 doubleSided 属性决定；当为假时，背面剔除被禁用。
   *
   * @type {boolean}
   * @default true
   */

  this.backFaceCulling = defaultValue(options.backFaceCulling, true);

  this._enableShowOutline = defaultValue(options.enableShowOutline, true);

  /**
   * 是否显示使用 {@link https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/CESIUM_primitive_outline|CESIUM_primitive_outline} 扩展的模型的轮廓。
   * 当为真时，将显示轮廓；当为假时，将不显示轮廓。
   *
   * @type {boolean}
   * @default true
   */
  this.showOutline = defaultValue(options.showOutline, true);

  /**
   * 渲染轮廓时使用的颜色。
   *
   * @type {Color}
   * @default Color.BLACK
   */
  this.outlineColor = defaultValue(options.outlineColor, Color.BLACK);

  /**
   * 要应用于此瓦片集的 {@link SplitDirection}。
   *
   * @type {SplitDirection}
   * @default {@link SplitDirection.NONE}
   */

  this.splitDirection = defaultValue(
    options.splitDirection,
    SplitDirection.NONE,
  );

  /**
   * 如果为 <code>true</code>，则允许相机发生碰撞或进行拾取。当此选项为 <code>true</code> 时，如果 {@link ScreenSpaceCameraController#enableCollisionDetection} 为真，相机将被阻止进入或低于瓦片集表面。如果瓦片集中包含较多顶点的瓦片，这可能会对性能产生影响。
   *
   * @type {boolean}
   * @default false
   */
  this.enableCollision = defaultValue(options.enableCollision, false);
  this._projectTo2D = defaultValue(options.projectTo2D, false);
  this._enablePick = defaultValue(options.enablePick, false);

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 确定是否仅使用上一个帧的瓦片进行渲染。 这
   * 有效地“冻结”瓦片集到上一个帧，从而可以缩放
   * 离开并查看已渲染的内容。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugFreezeFrame = defaultValue(options.debugFreezeFrame, false);

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，为每个瓦片分配随机颜色。 这对于可视化
   * 特征属于哪个瓦片非常有用，特别是在增量细化的情况下，
   * 父瓦片的特征可能与子瓦片的特征交错。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugColorizeTiles = defaultValue(options.debugColorizeTiles, false);

  this._enableDebugWireframe = defaultValue(
    options.enableDebugWireframe,
    false,
  );

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，将每个瓦片的内容渲染为线框。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugWireframe = defaultValue(options.debugWireframe, false);

  // Warning for improper setup of debug wireframe
  if (this.debugWireframe === true && this._enableDebugWireframe === false) {
    oneTimeWarning(
      "tileset-debug-wireframe-ignored",
      "enableDebugWireframe must be set to true in the Cesium3DTileset constructor, otherwise debugWireframe will be ignored.",
    );
  }

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，将渲染每个可见瓦片的边界体积。如果瓦片具有内容边界体积或为空，则边界体积为白色；否则为红色。未达到屏幕空间误差且仍在细化到其后代的瓦片为黄色。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，将渲染每个可见瓦片内容的边界体积。如果瓦片具有内容边界体积，则边界体积为蓝色；否则为红色。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugShowContentBoundingVolume = defaultValue(
    options.debugShowContentBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，将为每个瓦片渲染查看请求体积。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugShowViewerRequestVolume = defaultValue(
    options.debugShowViewerRequestVolume,
    false,
  );

  /**
   * @private
   * @type {LabelCollection|undefined}
   */
  this._tileDebugLabels = undefined;
  this.debugPickedTileLabelOnly = false;
  this.debugPickedTile = undefined;
  this.debugPickPosition = undefined;

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，绘制标签以指示每个瓦片的几何误差。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowGeometricError = defaultValue(
    options.debugShowGeometricError,
    false,
  );

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，绘制标签以指示每个瓦片的命令数量、点数、三角形和特征数量。
   * </p>
   *
   * @type {boolean}
   * @default false
   */

  this.debugShowRenderingStatistics = defaultValue(
    options.debugShowRenderingStatistics,
    false,
  );

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，绘制标签以指示每个瓦片的几何体和纹理内存使用情况。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowMemoryUsage = defaultValue(options.debugShowMemoryUsage, false);

  /**
   * 此属性仅用于调试；未针对生产使用进行优化。
   * <p>
   * 当为真时，绘制标签以指示每个瓦片的 URL。
   * </p>
   *
   * @type {boolean}
   * @default false
   */
  this.debugShowUrl = defaultValue(options.debugShowUrl, false);

  /**
   * 用于检查正在流式传输的矢量线的函数。
   *
   * @experimental 此功能使用了3D Tiles规范中的部分内容，该规范尚未定稿，可能会在不遵循Cesium标准弃用政策的情况下发生更改。
   *
   * @type {Function}
   */

  this.examineVectorLinesFunction = undefined;

  // this is the underlying Cesium3DTileMetadata object, whether it came from
  // the 3DTILES_metadata extension or a 3D Tiles 1.1 tileset JSON. Getters
  // like tileset.metadata and tileset.schema will delegate to this object.
  this._metadataExtension = undefined;

  this._customShader = options.customShader;

  let featureIdLabel = defaultValue(options.featureIdLabel, "featureId_0");
  if (typeof featureIdLabel === "number") {
    featureIdLabel = `featureId_${featureIdLabel}`;
  }
  this._featureIdLabel = featureIdLabel;

  let instanceFeatureIdLabel = defaultValue(
    options.instanceFeatureIdLabel,
    "instanceFeatureId_0",
  );
  if (typeof instanceFeatureIdLabel === "number") {
    instanceFeatureIdLabel = `instanceFeatureId_${instanceFeatureIdLabel}`;
  }
  this._instanceFeatureIdLabel = instanceFeatureIdLabel;
}

Object.defineProperties(Cesium3DTileset.prototype, {
  /**
   * 注意：此getter的存在是为了让 `Picking.js` 能够区分
   *       PrimitiveCollection 和 Cesium3DTileset 对象，而不必通过 `instanceof Cesium3DTileset`
   *       增加模块的大小。
   * @private
   */

  isCesium3DTileset: {
    get: function() {
      return true;
    },
  },

  /**
   * 获取瓦片集的资产对象属性，该属性包含有关瓦片集的元数据。
   * <p>
   * 请参见 3D Tiles 规范中的 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#reference-asset|asset schema reference}
   * 以获取完整的属性集。
   * </p>

   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   */
  asset: {
    get: function() {
      return this._asset;
    },
  },

  /**
   * 获取瓦片集的扩展对象属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   */

  extensions: {
    get: function() {
      return this._extensions;
    },
  },

  /**
   * 用于选择性禁用瓦片集渲染的 {@link ClippingPlaneCollection}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClippingPlaneCollection}
   */

  clippingPlanes: {
    get: function() {
      return this._clippingPlanes;
    },
    set: function(value) {
      ClippingPlaneCollection.setOwner(value, this, "_clippingPlanes");
    },
  },

  /**
   * 用于选择性禁用瓦片集渲染的 {@link ClippingPolygonCollection}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClippingPolygonCollection}
   */

  clippingPolygons: {
    get: function() {
      return this._clippingPolygons;
    },
    set: function(value) {
      ClippingPolygonCollection.setOwner(value, this, "_clippingPolygons");
    },
  },

  /**
   * 获取瓦片集的属性字典对象，其中包含有关每个要素属性的元数据。
   * <p>
   * 请参阅 3D Tiles 规范中的 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#reference-properties|properties schema reference}
   * 以获取完整的属性集。
   * </p>

   * @memberof Cesium3DTileset.prototype
   *
   * @type {object}
   * @readonly
   *
   * @example
   * console.log(`Maximum building height: ${tileset.properties.height.maximum}`);
   * console.log(`Minimum building height: ${tileset.properties.height.minimum}`);
   *
   * @see Cesium3DTileFeature#getProperty
   * @see Cesium3DTileFeature#setProperty
   */
  properties: {
    get: function() {
      return this._properties;
    },
  },

  /**
   * 当 <code>true</code> 时，所有满足此帧屏幕空间误差的瓦片将被加载。该视图的瓦片集将
   * 完全加载。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   *
   * @see Cesium3DTileset#allTilesLoaded
   */

  tilesLoaded: {
    get: function() {
      return this._tilesLoaded;
    },
  },

  /**
   * 用于获取瓦片集 JSON 文件的资源
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Resource}
   * @readonly
   */

  resource: {
    get: function() {
      return this._resource;
    },
  },

  /**
   * 瓦片集 JSON 文件中非绝对路径所相对的基路径。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @readonly
   * @deprecated
   */

  basePath: {
    get: function() {
      deprecationWarning(
        "Cesium3DTileset.basePath",
        "Cesium3DTileset.basePath has been deprecated. All tiles are relative to the url of the tileset JSON file that contains them. Use the url property instead.",
      );
      return this._basePath;
    },
  },
  /**
   * 使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 定义的样式，
   * 应用于瓦片集中的每个要素。
   * <p>
   * 将 <code>undefined</code> 赋值以移除样式，这将恢复瓦片集的视觉外观到默认状态
   * （当没有应用样式时）。
   * </p>
   * <p>
   * 样式在 {@link Cesium3DTileset#tileVisible} 事件被触发之前应用于瓦片，因此
   * <code>tileVisible</code> 中的代码可以在样式应用后手动设置要素的属性（例如颜色和显示）。
   * 当分配新样式时，任何手动设置的属性都将被覆盖。
   * </p>
   * <p>
   * 使用始终为 "true" 的条件来指定所有未被先前条件覆盖的对象的颜色。
   * 否则，将使用默认颜色 Cesium.Color.White。类似地，使用始终为 "true" 的条件来
   * 指定所有未被先前条件覆盖的对象的显示属性。否则，将使用默认显示值 true。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Cesium3DTileStyle|undefined}
   *
   * @default undefined
   *
   * @example
   * tileset.style = new Cesium.Cesium3DTileStyle({
   *    color : {
   *        conditions : [
   *            ['${Height} >= 100', 'color("purple", 0.5)'],
   *            ['${Height} >= 50', 'color("red")'],
   *            ['true', 'color("blue")']
   *        ]
   *    },
   *    show : '${Height} > 0',
   *    meta : {
   *        description : '"Building id ${id} has height ${Height}."'
   *    }
   * });
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
   */
  style: {
    get: function() {
      return this._styleEngine.style;
    },
    set: function(value) {
      this._styleEngine.style = value;
    },
  },

  /**
   * 应用于瓦片集所有瓦片的自定义着色器。仅用于使用 {@link Model} 的内容。
   * 将自定义着色器与 {@link Cesium3DTileStyle} 一起使用可能会导致未定义行为。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {CustomShader|undefined}
   *
   * @default undefined
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  customShader: {
    get: function() {
      return this._customShader;
    },
    set: function(value) {
      this._customShader = value;
    },
  },

  /**
   * 瓦片集是否在同一视图中渲染不同的细节级别。
   * 仅在 {@link Cesium3DTileset.isSkippingLevelOfDetail} 为 true 时相关。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @private
   */

  hasMixedContent: {
    get: function() {
      return this._hasMixedContent;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');

      this._hasMixedContent = value;
    },
  },

  /**
   * 此瓦片集是否实际上在跳过细节级别。
   * 如果所有瓦片都使用加法细化，或者某些瓦片具有不支持跳过渲染的内容类型，
   * 用户选项可能已被禁用。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @private
   * @readonly
   */

  isSkippingLevelOfDetail: {
    get: function() {
      return (
        this.skipLevelOfDetail &&
        !defined(this._classificationType) &&
        !this._disableSkipLevelOfDetail &&
        !this._allTilesAdditive
      );
    },
  },

  /**
   * 瓦片集的架构、组、瓦片集元数据及来自 3DTILES_metadata 扩展或 3D Tiles 1.1 瓦片集 JSON 的其他细节。
   * 此 getter 供其他类内部使用。
   *
   * @memberof Cesium3DTileset.prototype
   * @type {Cesium3DTilesetMetadata}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  metadataExtension: {
    get: function() {
      return this._metadataExtension;
    },
  },

  /**
   * 附加到瓦片集整体的元数据属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {TilesetMetadata}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  metadata: {
    get: function() {
      if (defined(this._metadataExtension)) {
        return this._metadataExtension.tileset;
      }

      return undefined;
    },
  },

  /**
   * 此瓦片集使用的元数据架构。是 <code>tileset.metadataExtension.schema</code> 的简写
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {MetadataSchema}
   * @private
   * @readonly
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  schema: {
    get: function() {
      if (defined(this._metadataExtension)) {
        return this._metadataExtension.schema;
      }

      return undefined;
    },
  },

  /**
   * 用于驱动细节级别细化的最大屏幕空间误差。该值帮助确定何时瓦片
   * 会细化到其子瓦片，因此在平衡性能与视觉质量方面起着主要作用。
   * <p>
   * 瓦片的屏幕空间误差大致等同于如果在瓦片位置渲染一个半径等于瓦片的 <b>几何误差</b> 的球体
   * 所绘制的像素宽度。如果该值超过 <code>maximumScreenSpaceError</code>，则瓦片细化到其子瓦片。
   * </p>
   * <p>
   * 根据瓦片集的不同，<code>maximumScreenSpaceError</code> 可能需要进行调整以达到适当的平衡。
   * 较高的值提供更好的性能，但视觉质量较低。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 16
   *
   * @exception {DeveloperError} <code>maximumScreenSpaceError</code> 必须大于或等于零。
   */

  maximumScreenSpaceError: {
    get: function() {
      return this._maximumScreenSpaceError;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals(
        "maximumScreenSpaceError",
        value,
        0,
      );
      //>>includeEnd('debug');

      this._maximumScreenSpaceError = value;
      this._memoryAdjustedScreenSpaceError = value;
    },
  },

  /**
   * 用于缓存瓦片的 GPU 内存量（以字节为单位）。该内存使用量是根据加载的瓦片的几何图形、纹理和批处理表纹理估算的。
   * 对于点云，此值还包括每个点的元数据。
   * <p>
   * 不在视图中的瓦片会被卸载以强制执行此限制。
   * </p>
   * <p>
   * 如果降低此值导致瓦片卸载，则在下一帧卸载这些瓦片。
   * </p>
   * <p>
   * 如果为了满足当前视图的期望屏幕空间误差（由 {@link Cesium3DTileset#maximumScreenSpaceError} 确定），
   * 需要的瓦片大小超过 <code>cacheBytes</code>，则加载的瓦片的内存使用量将超过
   * <code>cacheBytes</code>，最多达到 <code>maximumCacheOverflowBytes</code>。
   * 例如，如果 <code>cacheBytes</code> 是 500000，但需要 600000 字节的瓦片
   * 来满足屏幕空间误差，则可以加载 600000 字节的瓦片（如果 <code>maximumCacheOverflowBytes</code> 至少为 100000）。
   * 当这些瓦片超出视图时，它们将被卸载。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 536870912
   *
   * @exception {DeveloperError} <code>cacheBytes</code> 必须是 'number' 类型并且大于或等于 0
   * @see Cesium3DTileset#totalMemoryUsageInBytes
   */

  cacheBytes: {
    get: function() {
      return this._cacheBytes;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0);
      //>>includeEnd('debug');

      this._cacheBytes = value;
    },
  },

  /**
   * 用于缓存瓦片的最大额外 GPU 内存量（以字节为单位）。
   * <p>
   * 如果需要的瓦片大小超过 <code>cacheBytes</code> 加上 <code>maximumCacheOverflowBytes</code>
   * 来满足当前视图的期望屏幕空间误差（由 {@link Cesium3DTileset#maximumScreenSpaceError} 确定），
   * 则 {@link Cesium3DTileset#memoryAdjustedScreenSpaceError} 将被调整，
   * 直到满足调整后的屏幕空间误差所需的瓦片使用的内存少于
   * <code>cacheBytes</code> 加上 <code>maximumCacheOverflowBytes</code>。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 536870912
   *
   * @exception {DeveloperError} <code>maximumCacheOverflowBytes</code> 必须是 'number' 类型并且大于或等于 0
   * @see Cesium3DTileset#totalMemoryUsageInBytes
   */

  maximumCacheOverflowBytes: {
    get: function() {
      return this._maximumCacheOverflowBytes;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("value", value, 0);
      //>>includeEnd('debug');

      this._maximumCacheOverflowBytes = value;
    },
  },

  /**
   * 如果加载由 {@link Cesium3DTileset#maximumScreenSpaceError} 所需的细节级别
   * 导致内存使用超过 {@link Cesium3DTileset#cacheBytes}
   * 加 {@link Cesium3DTileset#maximumCacheOverflowBytes}，则细节级别细化
   * 将改为使用此（更大的）调整屏幕空间误差，以便在可用内存内
   * 实现最佳的视觉质量。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   *
   * @private
   */

  memoryAdjustedScreenSpaceError: {
    get: function() {
      return this._memoryAdjustedScreenSpaceError;
    },
  },

  /**
   * 用于根据几何误差和眼穹顶光照控制点大小的选项。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {PointCloudShading}
   */

  pointCloudShading: {
    get: function() {
      return this._pointCloudShading;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("pointCloudShading", value);
      //>>includeEnd('debug');
      this._pointCloudShading = value;
    },
  },

  /**
   * 根瓦片。
   *
   * @memberOf Cesium3DTileset.prototype
   *
   * @type {Cesium3DTile}
   * @readonly
   */

  root: {
    get: function() {
      return this._root;
    },
  },

  /**
   * 瓦片集的包围球。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   *
   * @example
   * const tileset = await Cesium.Cesium3DTileset.fromUrl("http://localhost:8002/tilesets/Seattle/tileset.json");
   *
   * viewer.scene.primitives.add(tileset);
   *
   * // 设置相机以查看新添加的瓦片集
   * viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
   */

  boundingSphere: {
    get: function() {
      this._root.updateTransform(this._modelMatrix);
      return this._root.boundingSphere;
    },
  },

  /**
   * 一个 4x4 的变换矩阵，用于转换整个瓦片集。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   *
   * @example
   * // Adjust a tileset's height from the globe's surface.
   * const heightOffset = 20.0;
   * const boundingSphere = tileset.boundingSphere;
   * const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
   * const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
   * const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
   * const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
   * tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
   */
  modelMatrix: {
    get: function() {
      return this._modelMatrix;
    },
    set: function(value) {
      this._modelMatrix = Matrix4.clone(value, this._modelMatrix);
    },
  },

  /**
   * 返回自瓦片集加载和首次更新以来的时间，单位为毫秒。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   */
  timeSinceLoad: {
    get: function() {
      return this._timeSinceLoad;
    },
  },

  /**
   * 瓦片集使用的 GPU 内存总量，以字节为单位。该值是根据加载的瓦片的几何图形、纹理、批处理表纹理和二进制元数据估算的。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @readonly
   *
   * @see Cesium3DTileset#cacheBytes
   */

  totalMemoryUsageInBytes: {
    get: function() {
      const statistics = this._statistics;
      return (
        statistics.texturesByteLength +
        statistics.geometryByteLength +
        statistics.batchTableByteLength
      );
    },
  },

  /**
   * @private
   */
  clippingPlanesOriginMatrix: {
    get: function() {
      if (!defined(this._clippingPlanesOriginMatrix)) {
        return Matrix4.IDENTITY;
      }

      if (this._clippingPlanesOriginMatrixDirty) {
        Matrix4.multiply(
          this.root.computedTransform,
          this._initialClippingPlanesOriginMatrix,
          this._clippingPlanesOriginMatrix,
        );
        this._clippingPlanesOriginMatrixDirty = false;
      }

      return this._clippingPlanesOriginMatrix;
    },
  },

  /**
   * @private
   */
  styleEngine: {
    get: function() {
      return this._styleEngine;
    },
  },

  /**
   * @private
   */
  statistics: {
    get: function() {
      return this._statistics;
    },
  },

  /**
   * 确定该瓦片集是否会对地形、3D 瓦片或两者进行分类。
   * <p>
   * 此选项仅适用于包含批处理 3D 模型、glTF 内容、几何数据或矢量数据的瓦片集。
   * 即使未定义，矢量和几何数据也必须作为分类进行渲染，并默认为在地形和其他 3D 瓦片集上进行渲染。
   * </p>
   * <p>
   * 对于批处理 3D 模型和 glTF 瓦片集启用此功能时，对 glTF 有一些要求/限制：
   * <ul>
   *     <li>glTF 不能包含形态目标、绑定或动画。</li>
   *     <li>glTF 不能包含 <code>EXT_mesh_gpu_instancing</code> 扩展。</li>
   *     <li>仅支持使用 TRIANGLES 的网格来分类其他资产。</li>
   *     <li>网格必须是密闭的。</li>
   *     <li>必须包含 <code>POSITION</code> 语义。</li>
   *     <li>如果同时存在 <code>_BATCHID</code> 和索引缓冲区，则所有具有相同批处理 ID 的索引必须占据索引缓冲区的连续部分。</li>
   *     <li>如果存在 <code>_BATCHID</code> 而没有索引缓冲区，则所有具有相同批处理 ID 的位置必须占据位置缓冲区的连续部分。</li>
   * </ul>
   * </p>
   * <p>
   * 此外，点或实例化的 3D 模型不支持分类。
   * </p>
   * <p>
   * 接收分类的 3D 瓦片或地形必须是完全不透明的。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ClassificationType}
   * @default undefined
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   * @readonly
   */

  classificationType: {
    get: function() {
      return this._classificationType;
    },
  },

  /**
   * 获取描述地球形状的椭球体。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {Ellipsoid}
   * @readonly
   */

  ellipsoid: {
    get: function() {
      return this._ellipsoid;
    },
  },

  /**
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制决定哪些瓦片被延迟加载的锥形大小。
   * 位于该锥形内部的瓦片会立即加载。锥形外部的瓦片将根据它们距锥形的远近以及 {@link Cesium3DTileset#foveatedInterpolationCallback} 和 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 进行潜在延迟加载。
   * 将此设置为 0.0 表示锥形将是由相机位置和视线方向形成的直线。将此设置为 1.0 表示锥形覆盖相机的整个视野，基本上禁用该效果。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 0.3
   */

  foveatedConeSize: {
    get: function() {
      return this._foveatedConeSize;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("foveatedConeSize", value, 0.0);
      Check.typeOf.number.lessThanOrEquals("foveatedConeSize", value, 1.0);
      //>>includeEnd('debug');

      this._foveatedConeSize = value;
    },
  },

  /**
   * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时使用，以控制位于锥形外部瓦片的起始屏幕空间误差松弛值。
   * 屏幕空间误差将从该值开始逐步提升，直到 {@link Cesium3DTileset#maximumScreenSpaceError}，具体根据提供的 {@link Cesium3DTileset#foveatedInterpolationCallback}。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {number}
   * @default 0.0
   */

  foveatedMinimumScreenSpaceErrorRelaxation: {
    get: function() {
      return this._foveatedMinimumScreenSpaceErrorRelaxation;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals(
        "foveatedMinimumScreenSpaceErrorRelaxation",
        value,
        0.0,
      );
      Check.typeOf.number.lessThanOrEquals(
        "foveatedMinimumScreenSpaceErrorRelaxation",
        value,
        this.maximumScreenSpaceError,
      );
      //>>includeEnd('debug');

      this._foveatedMinimumScreenSpaceErrorRelaxation = value;
    },
  },

  /**
   * 返回瓦片集 JSON 顶层的 <code>extras</code> 属性，其中包含应用特定的元数据。
   * 如果 <code>extras</code> 不存在，则返回 <code>undefined</code>。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {*}
   * @readonly
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#specifying-extensions-and-application-specific-extras|3D Tiles 规范中的 Extras。}
   */

  extras: {
    get: function() {
      return this._extras;
    },
  },

  /**
   * 管理此瓦片集上的基于图像的光照的属性。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {ImageBasedLighting}
   */

  imageBasedLighting: {
    get: function() {
      return this._imageBasedLighting;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("imageBasedLighting", this._imageBasedLighting);
      //>>includeEnd('debug');
      if (value !== this._imageBasedLighting) {
        if (
          this._shouldDestroyImageBasedLighting &&
          !this._imageBasedLighting.isDestroyed()
        ) {
          this._imageBasedLighting.destroy();
        }
        this._imageBasedLighting = value;
        this._shouldDestroyImageBasedLighting = false;
      }
    },
  },

  /**
   * 管理此模型上的动态环境贴图的属性。影响光照。
   *
   * @memberof Cesium3DTileset.prototype
   * @readonly
   *
   * @example
   * // Change the ground color used for a tileset's environment map to a forest green
   * const environmentMapManager = tileset.environmentMapManager;
   * environmentMapManager.groundColor = Cesium.Color.fromCssColorString("#203b34");
   *
   * @type {DynamicEnvironmentMapManager}
   */
  environmentMapManager: {
    get: function() {
      return this._environmentMapManager;
    },
  },

  /**
   * 表示仅应使用瓦片集的矢量瓦片进行分类。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @type {boolean}
   * @default false
   */

  vectorClassificationOnly: {
    get: function() {
      return this._vectorClassificationOnly;
    },
  },

  /**
   * 是否应将解码后的位置保留在内存中。
   * 这与 {@link Cesium3DTileFeature.getPolylinePositions} 一起使用。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @type {boolean}
   * @default false
   */
  vectorKeepDecodedPositions: {
    get: function() {
      return this._vectorKeepDecodedPositions;
    },
  },

  /**
   * 确定瓦片集的版权信息是否在屏幕上显示。
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {boolean}
   * @default false
   */
  showCreditsOnScreen: {
    get: function() {
      return this._showCreditsOnScreen;
    },
    set: function(value) {
      this._showCreditsOnScreen = value;
      createCredits(this);
    },
  },

  /**
   * 用于拾取和样式的特征 ID 的标签。
   * <p>
   * 对于 EXT_mesh_features，这是特征 ID 的标签属性，
   * 或者当未指定时为 "featureId_N"（其中 N 是 featureIds 数组中的索引）。
   * EXT_feature_metadata 没有标签字段，因此这样的特征 ID 集始终标记为 "featureId_N"，其中 N 是
   * 所有特征 ID 列表中的索引，特征 ID 属性在特征 ID 纹理之前列出。
   * </p>
   * <p>
   * 如果 featureIdLabel 设置为整数 N，它会自动转换为字符串 "featureId_N"。
   * 如果同时存在每个图元和每个实例的特征 ID，则实例特征 ID 优先。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  featureIdLabel: {
    get: function() {
      return this._featureIdLabel;
    },
    set: function(value) {
      // indices get converted into featureId_N
      if (typeof value === "number") {
        value = `featureId_${value}`;
      }

      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.string("value", value);
      //>>includeEnd('debug');

      this._featureIdLabel = value;
    },
  },

  /**
   * 用于拾取和样式的实例特征 ID 集的标签。
   * <p>
   * 如果 instanceFeatureIdLabel 设置为整数 N，它会自动转换为字符串 "instanceFeatureId_N"。
   * 如果同时存在每个图元和每个实例的特征 ID，则实例特征 ID 优先。
   * </p>
   *
   * @memberof Cesium3DTileset.prototype
   *
   * @type {string}
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   */

  instanceFeatureIdLabel: {
    get: function() {
      return this._instanceFeatureIdLabel;
    },
    set: function(value) {
      // indices get converted into instanceFeatureId_N
      if (typeof value === "number") {
        value = `instanceFeatureId_${value}`;
      }

      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.string("value", value);
      //>>includeEnd('debug');

      this._instanceFeatureIdLabel = value;
    },
  },
});

/**
 * 创建一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles tileset}，
 * 用于从 Cesium ion 资产 ID 流式传输大规模异构 3D 地理空间数据集。
 *
 * @param {number} assetId Cesium ion 资产 ID。
 * @param {Cesium3DTileset.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<Cesium3DTileset>}
 *
 * @exception {RuntimeError} 当瓦片集资产版本不是 0.0、1.0 或 1.1，
 * 或者当瓦片集包含未支持的必需扩展时。
 *
 * @see Cesium3DTileset#fromUrl
 *
 * @example
 * // Load a Cesium3DTileset with a Cesium ion asset ID of 124624234
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(124624234);
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 */
Cesium3DTileset.fromIonAssetId = async function(assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("assetId", assetId);
  //>>includeEnd('debug');

  const resource = await IonResource.fromAssetId(assetId);
  return Cesium3DTileset.fromUrl(resource, options);
};

/**
 * 创建一个 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification|3D Tiles tileset}，
 * 用于流式传输大规模异构 3D 地理空间数据集。
 *
 * @param {Resource|string} url 瓦片集 JSON 文件的 URL。
 * @param {Cesium3DTileset.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<Cesium3DTileset>}
 *
 * @exception {RuntimeError} 当瓦片集资产版本不是 0.0、1.0 或 1.1，
 * 或者当瓦片集包含未支持的必需扩展时。
 *

 * @see Cesium3DTileset#fromIonAssetId
 *
 * @example
 * try {
 *   const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *      "http://localhost:8002/tilesets/Seattle/tileset.json"
 *   );
 *   scene.primitives.add(tileset);
 * } catch (error) {
 *   console.error(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Common setting for the skipLevelOfDetail optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      skipLevelOfDetail: true,
 *      baseScreenSpaceError: 1024,
 *      skipScreenSpaceErrorFactor: 16,
 *      skipLevels: 1,
 *      immediatelyLoadDesiredLevelOfDetail: false,
 *      loadSiblings: false,
 *      cullWithChildrenBounds: true
 * });
 * scene.primitives.add(tileset);
 *
 * @example
 * // Common settings for the dynamicScreenSpaceError optimization
 * const tileset = await Cesium.Cesium3DTileset.fromUrl(
 *   "http://localhost:8002/tilesets/Seattle/tileset.json", {
 *      dynamicScreenSpaceError: true,
 *      dynamicScreenSpaceErrorDensity: 2.0e-4,
 *      dynamicScreenSpaceErrorFactor: 24.0,
 *      dynamicScreenSpaceErrorHeightFalloff: 0.25
 * });
 * scene.primitives.add(tileset);
 */
Cesium3DTileset.fromUrl = async function(url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(url);
  let basePath;
  if (resource.extension === "json") {
    basePath = resource.getBaseUri(true);
  } else if (resource.isDataUri) {
    basePath = "";
  }

  const tilesetJson = await Cesium3DTileset.loadJson(resource);
  const metadataExtension = await processMetadataExtension(
    resource,
    tilesetJson,
  );

  const tileset = new Cesium3DTileset(options);
  tileset._resource = resource;
  tileset._url = resource.url;
  tileset._basePath = basePath;
  tileset._metadataExtension = metadataExtension;
  // Set these before loading the tileset since _geometricError
  // and _scaledGeometricError get accessed during tile creation
  tileset._geometricError = tilesetJson.geometricError;
  tileset._scaledGeometricError = tilesetJson.geometricError;

  const asset = tilesetJson.asset;
  tileset._asset = asset;
  tileset._extras = tilesetJson.extras;

  createCredits(tileset);

  // Handle legacy gltfUpAxis option
  const gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis)
    ? Axis.fromName(tilesetJson.asset.gltfUpAxis)
    : Axis.Y;
  const modelUpAxis = defaultValue(options.modelUpAxis, gltfUpAxis);
  const modelForwardAxis = defaultValue(options.modelForwardAxis, Axis.X);

  tileset._properties = tilesetJson.properties;
  tileset._extensionsUsed = tilesetJson.extensionsUsed;
  tileset._extensions = tilesetJson.extensions;
  tileset._modelUpAxis = modelUpAxis;
  tileset._modelForwardAxis = modelForwardAxis;

  tileset._root = tileset.loadTileset(resource, tilesetJson);

  // Save the original, untransformed bounding volume position so we can apply
  // the tile transform and model matrix at run time
  const boundingVolume = tileset._root.createBoundingVolume(
    tilesetJson.root.boundingVolume,
    Matrix4.IDENTITY,
  );
  const clippingPlanesOrigin = boundingVolume.boundingSphere.center;
  // If this origin is above the surface of the earth
  // we want to apply an ENU orientation as our best guess of orientation.
  // Otherwise, we assume it gets its position/orientation completely from the
  // root tile transform and the tileset's model matrix
  const originCartographic =
    tileset._ellipsoid.cartesianToCartographic(clippingPlanesOrigin);
  if (
    defined(originCartographic) &&
    originCartographic.height >
    ApproximateTerrainHeights._defaultMinTerrainHeight
  ) {
    tileset._initialClippingPlanesOriginMatrix =
      Transforms.eastNorthUpToFixedFrame(clippingPlanesOrigin);
  }
  tileset._clippingPlanesOriginMatrix = Matrix4.clone(
    tileset._initialClippingPlanesOriginMatrix,
  );

  return tileset;
};

/**
 * 提供了一个钩子，以覆盖用于请求瓦片集 JSON 的方法，
 * 在从远程服务器获取瓦片集时非常有用。
 * @param {Resource|string} tilesetUrl 要获取的 JSON 文件的 URL。
 * @returns {Promise<object>} 一个承诺，解析为获取的 JSON 数据。
 */
Cesium3DTileset.loadJson = function(tilesetUrl) {
  const resource = Resource.createIfNeeded(tilesetUrl);
  return resource.fetchJson();
};

/**
 * 将瓦片集的 {@link Cesium3DTileset#style} 标记为脏值，这将强制所有
 * 特征在每个可见的下一帧中重新评估样式。
 */
Cesium3DTileset.prototype.makeStyleDirty = function() {
  this._styleEngine.makeDirty();
};

/**
 * 加载主瓦片集 JSON 文件或从某个瓦片引用的瓦片集 JSON 文件。
 *
 * @exception {RuntimeError} 当瓦片集资产版本不是 0.0、1.0 或 1.1，
 * 或者当瓦片集包含未支持的必需扩展时。
 *
 * @private
 */

Cesium3DTileset.prototype.loadTileset = function(
  resource,
  tilesetJson,
  parentTile,
) {
  const asset = tilesetJson.asset;
  if (!defined(asset)) {
    throw new RuntimeError("Tileset must have an asset property.");
  }
  if (
    asset.version !== "0.0" &&
    asset.version !== "1.0" &&
    asset.version !== "1.1"
  ) {
    throw new RuntimeError(
      "The tileset must be 3D Tiles version 0.0, 1.0, or 1.1",
    );
  }

  if (defined(tilesetJson.extensionsRequired)) {
    Cesium3DTileset.checkSupportedExtensions(tilesetJson.extensionsRequired);
  }

  const statistics = this._statistics;

  const tilesetVersion = asset.tilesetVersion;
  if (defined(tilesetVersion)) {
    // Append the tileset version to the resource
    this._basePath += `?v=${tilesetVersion}`;
    resource = resource.clone();
    resource.setQueryParameters({ v: tilesetVersion });
  }

  // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
  // Get the basePath relative to the external tileset.
  const rootTile = makeTile(this, resource, tilesetJson.root, parentTile);

  // If there is a parentTile, add the root of the currently loading tileset
  // to parentTile's children, and update its _depth.
  if (defined(parentTile)) {
    parentTile.children.push(rootTile);
    rootTile._depth = parentTile._depth + 1;
  }

  const stack = [];
  stack.push(rootTile);

  while (stack.length > 0) {
    const tile = stack.pop();
    ++statistics.numberOfTilesTotal;
    this._allTilesAdditive =
      this._allTilesAdditive && tile.refine === Cesium3DTileRefine.ADD;
    const children = tile._header.children;
    if (defined(children)) {
      for (let i = 0; i < children.length; ++i) {
        const childHeader = children[i];
        const childTile = makeTile(this, resource, childHeader, tile);
        tile.children.push(childTile);
        childTile._depth = tile._depth + 1;
        stack.push(childTile);
      }
    }

    if (this._cullWithChildrenBounds) {
      Cesium3DTileOptimizations.checkChildrenWithinParent(tile);
    }
  }

  return rootTile;
};

/**
 * 为特定瓦片创建一个 {@link Cesium3DTile}。如果瓦片的头部具有隐式
 * 瓦片（3D Tiles 1.1）或使用 <code>3DTILES_implicit_tiling</code> 扩展，
 * 则它会创建一个占位符瓦片，以便懒惰评估隐式瓦片集。
 *
 * @param {Cesium3DTileset} tileset 瓦片集
 * @param {Resource} baseResource 瓦片集的基础资源
 * @param {object} tileHeader 瓦片的 JSON 头部
 * @param {Cesium3DTile} [parentTile] 新瓦片的父瓦片
 * @returns {Cesium3DTile} 新创建的瓦片
 *
 * @private
 */

function makeTile(tileset, baseResource, tileHeader, parentTile) {
  const hasImplicitTiling =
    defined(tileHeader.implicitTiling) ||
    hasExtension(tileHeader, "3DTILES_implicit_tiling");

  if (!hasImplicitTiling) {
    return new Cesium3DTile(tileset, baseResource, tileHeader, parentTile);
  }

  const metadataSchema = tileset.schema;

  const implicitTileset = new ImplicitTileset(
    baseResource,
    tileHeader,
    metadataSchema,
  );
  const rootCoordinates = new ImplicitTileCoordinates({
    subdivisionScheme: implicitTileset.subdivisionScheme,
    subtreeLevels: implicitTileset.subtreeLevels,
    level: 0,
    x: 0,
    y: 0,
    // The constructor will only use this for octrees.
    z: 0,
  });

  // Create a placeholder Cesium3DTile that has an ImplicitTileset
  // object and whose content will resolve to an Implicit3DTileContent
  const contentUri = implicitTileset.subtreeUriTemplate.getDerivedResource({
    templateValues: rootCoordinates.getTemplateValues(),
  }).url;

  const deepCopy = true;
  const tileJson = clone(tileHeader, deepCopy);
  // Replace contents with the subtree
  tileJson.contents = [
    {
      uri: contentUri,
    },
  ];

  delete tileJson.content;

  // The placeholder tile does not have any extensions. If there are any
  // extensions beyond 3DTILES_implicit_tiling, Implicit3DTileContent will
  // copy them to the transcoded tiles.
  delete tileJson.extensions;

  const tile = new Cesium3DTile(tileset, baseResource, tileJson, parentTile);
  tile.implicitTileset = implicitTileset;
  tile.implicitCoordinates = rootCoordinates;
  return tile;
}

/**
 * 如果瓦片集元数据存在，则初始化 {@link Cesium3DTilesetMetadata}
 * 实例。由于元数据架构可能是外部的，因此这是异步操作。
 *
 * @param {Cesium3DTileset} tileset 瓦片集
 * @param {object} tilesetJson 瓦片集 JSON
 * @return {Promise<Cesium3DTilesetMetadata>} 加载的 Cesium3DTilesetMetadata
 * @private
 */

async function processMetadataExtension(resource, tilesetJson) {
  const metadataJson = hasExtension(tilesetJson, "3DTILES_metadata")
    ? tilesetJson.extensions["3DTILES_metadata"]
    : tilesetJson;

  let schemaLoader;
  if (defined(metadataJson.schemaUri)) {
    resource = resource.getDerivedResource({
      url: metadataJson.schemaUri,
    });
    schemaLoader = ResourceCache.getSchemaLoader({
      resource: resource,
    });
  } else if (defined(metadataJson.schema)) {
    schemaLoader = ResourceCache.getSchemaLoader({
      schema: metadataJson.schema,
    });
  } else {
    return;
  }

  await schemaLoader.load();

  const metadataExtension = new Cesium3DTilesetMetadata({
    schema: schemaLoader.schema,
    metadataJson: metadataJson,
  });

  ResourceCache.unload(schemaLoader);

  return metadataExtension;
}

const scratchPositionNormal = new Cartesian3();
const scratchCartographic = new Cartographic();
const scratchMatrix = new Matrix4();
const scratchCenter = new Cartesian3();
const scratchPosition = new Cartesian3();
const scratchDirection = new Cartesian3();
const scratchHalfHeight = new Cartesian3();

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function updateDynamicScreenSpaceError(tileset, frameState) {
  let up;
  let direction;
  let height;
  let minimumHeight;
  let maximumHeight;

  const camera = frameState.camera;
  const root = tileset._root;
  const tileBoundingVolume = root.contentBoundingVolume;

  if (tileBoundingVolume instanceof TileBoundingRegion) {
    up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
    direction = camera.directionWC;
    height = camera.positionCartographic.height;
    minimumHeight = tileBoundingVolume.minimumHeight;
    maximumHeight = tileBoundingVolume.maximumHeight;
  } else {
    // Transform camera position and direction into the local coordinate system of the tileset
    const transformLocal = Matrix4.inverseTransformation(
      root.computedTransform,
      scratchMatrix,
    );
    const ellipsoid = frameState.mapProjection.ellipsoid;
    const boundingVolume = tileBoundingVolume.boundingVolume;
    const centerLocal = Matrix4.multiplyByPoint(
      transformLocal,
      boundingVolume.center,
      scratchCenter,
    );
    if (Cartesian3.magnitude(centerLocal) > ellipsoid.minimumRadius) {
      // The tileset is defined in WGS84. Approximate the minimum and maximum height.
      const centerCartographic = Cartographic.fromCartesian(
        centerLocal,
        ellipsoid,
        scratchCartographic,
      );
      up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
      direction = camera.directionWC;
      height = camera.positionCartographic.height;
      minimumHeight = 0.0;
      maximumHeight = centerCartographic.height * 2.0;
    } else {
      // The tileset is defined in local coordinates (z-up)
      const positionLocal = Matrix4.multiplyByPoint(
        transformLocal,
        camera.positionWC,
        scratchPosition,
      );
      up = Cartesian3.UNIT_Z;
      direction = Matrix4.multiplyByPointAsVector(
        transformLocal,
        camera.directionWC,
        scratchDirection,
      );
      direction = Cartesian3.normalize(direction, direction);
      height = positionLocal.z;
      if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
        // Assuming z-up, the last column is the local z direction and
        // represents the height of the bounding box.
        const halfHeightVector = Matrix3.getColumn(
          boundingVolume.halfAxes,
          2,
          scratchHalfHeight,
        );
        const halfHeight = Cartesian3.magnitude(halfHeightVector);
        minimumHeight = centerLocal.z - halfHeight;
        maximumHeight = centerLocal.z + halfHeight;
      } else if (tileBoundingVolume instanceof TileBoundingSphere) {
        const radius = boundingVolume.radius;
        minimumHeight = centerLocal.z - radius;
        maximumHeight = centerLocal.z + radius;
      }
    }
  }

  // The range where the density starts to lessen. Start at the quarter height of the tileset.
  const heightFalloff = tileset.dynamicScreenSpaceErrorHeightFalloff;
  const heightClose =
    minimumHeight + (maximumHeight - minimumHeight) * heightFalloff;
  const heightFar = maximumHeight;

  const t = CesiumMath.clamp(
    (height - heightClose) / (heightFar - heightClose),
    0.0,
    1.0,
  );

  // Increase density as the camera tilts towards the horizon
  let horizonFactor = 1.0 - Math.abs(Cartesian3.dot(direction, up));

  // Weaken the horizon factor as the camera height increases, implying the camera is further away from the tileset.
  // The goal is to increase density for the "street view", not when viewing the tileset from a distance.
  horizonFactor = horizonFactor * (1.0 - t);

  tileset._dynamicScreenSpaceErrorComputedDensity =
    tileset.dynamicScreenSpaceErrorDensity * horizonFactor;
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function requestContent(tileset, tile) {
  if (tile.hasEmptyContent) {
    return;
  }

  const { statistics } = tileset;
  const contentExpired = tile.contentExpired;

  const promise = tile.requestContent();
  if (!defined(promise)) {
    return;
  }

  promise
    .then((content) => {
      if (!defined(content) || tile.isDestroyed() || tileset.isDestroyed()) {
        return;
      }

      tileset._processingQueue.push(tile);
      ++statistics.numberOfTilesProcessing;
    })
    .catch((error) => {
      handleTileFailure(error, tileset, tile);
    });

  if (contentExpired) {
    if (tile.hasTilesetContent || tile.hasImplicitContent) {
      destroySubtree(tileset, tile);
    } else {
      statistics.decrementLoadCounts(tile.content);
      --statistics.numberOfTilesWithContentReady;
    }
  }

  tileset._requestedTilesInFlight.push(tile);
}

function sortTilesByPriority(a, b) {
  return a._priority - b._priority;
}

/**
 * 在这里执行任何通过不变的任务。该函数在渲染通过后调用。
 * @private
 * @param {FrameState} frameState
 */

Cesium3DTileset.prototype.postPassesUpdate = function(frameState) {
  if (!defined(this._root)) {
    return;
  }

  cancelOutOfViewRequests(this, frameState);
  raiseLoadProgressEvent(this, frameState);
  this._cache.unloadTiles(this, unloadTile);

  // If the style wasn't able to be applied this frame (for example,
  // the tileset was hidden), keep it dirty so the engine can try
  // to apply the style next frame.
  if (this._styleApplied) {
    this._styleEngine.resetDirty();
  }
  this._styleApplied = false;
};

/**
 * 在这里执行任何通过不变的任务。该函数在任何通过执行之前调用。
 * @private
 * @param {FrameState} frameState
 */

Cesium3DTileset.prototype.prePassesUpdate = function(frameState) {
  if (!defined(this._root)) {
    return;
  }

  processTiles(this, frameState);

  // Update clipping planes
  const clippingPlanes = this._clippingPlanes;
  this._clippingPlanesOriginMatrixDirty = true;
  if (defined(clippingPlanes) && clippingPlanes.enabled) {
    clippingPlanes.update(frameState);
  }

  // Update clipping polygons
  const clippingPolygons = this._clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    clippingPolygons.update(frameState);
  }

  if (!defined(this._loadTimestamp)) {
    this._loadTimestamp = JulianDate.clone(frameState.time);
  }
  this._timeSinceLoad = Math.max(
    JulianDate.secondsDifference(frameState.time, this._loadTimestamp) * 1000,
    0.0,
  );

  if (this.dynamicScreenSpaceError) {
    updateDynamicScreenSpaceError(this, frameState);
  }

  if (frameState.newFrame) {
    this._cache.reset();
  }
};

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function cancelOutOfViewRequests(tileset, frameState) {
  const requestedTilesInFlight = tileset._requestedTilesInFlight;
  let removeCount = 0;
  for (let i = 0; i < requestedTilesInFlight.length; ++i) {
    const tile = requestedTilesInFlight[i];

    // NOTE: This is framerate dependant so make sure the threshold check is small
    const outOfView = frameState.frameNumber - tile._touchedFrame >= 1;
    if (tile._contentState !== Cesium3DTileContentState.LOADING) {
      // No longer fetching from host, don't need to track it anymore. Gets marked as LOADING in Cesium3DTile::requestContent().
      ++removeCount;
      continue;
    } else if (outOfView) {
      // RequestScheduler will take care of cancelling it
      tile.cancelRequests();
      ++removeCount;
      continue;
    }

    if (removeCount > 0) {
      requestedTilesInFlight[i - removeCount] = tile;
    }
  }

  requestedTilesInFlight.length -= removeCount;
}

/**
 * 在发出任何请求之前按优先级对请求进行排序。
 * 这使得请求在发出后被取消的可能性较小。
 * @private
 * @param {Cesium3DTileset} tileset
 */

function requestTiles(tileset) {
  const requestedTiles = tileset._requestedTiles;
  requestedTiles.sort(sortTilesByPriority);
  for (let i = 0; i < requestedTiles.length; ++i) {
    requestContent(tileset, requestedTiles[i]);
  }
}

/**
 * @private
 * @param {Error} error
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function handleTileFailure(error, tileset, tile) {
  if (tileset.isDestroyed()) {
    return;
  }

  let url;
  if (!tile.isDestroyed()) {
    url = tile._contentResource.url;
  }

  const message = defined(error.message) ? error.message : error.toString();
  if (tileset.tileFailed.numberOfListeners > 0) {
    tileset.tileFailed.raiseEvent({
      url: url,
      message: message,
    });
  } else {
    console.log(`A 3D tile failed to load: ${url}`);
    console.log(`Error: ${message}`);
    console.log(error.stack);
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 */
function filterProcessingQueue(tileset) {
  const tiles = tileset._processingQueue;

  let removeCount = 0;
  for (let i = 0; i < tiles.length; ++i) {
    const tile = tiles[i];
    if (
      tile.isDestroyed() ||
      tile._contentState !== Cesium3DTileContentState.PROCESSING
    ) {
      ++removeCount;
      continue;
    }
    if (removeCount > 0) {
      tiles[i - removeCount] = tile;
    }
  }
  tiles.length -= removeCount;
}

const scratchUpdateHeightCartographic = new Cartographic();
const scratchUpdateHeightCartographic2 = new Cartographic();
const scratchUpdateHeightCartesian = new Cartesian3();
function processUpdateHeight(tileset, tile, frameState) {
  if (!tileset.enableCollision || !tileset.show) {
    return;
  }

  const heightCallbackData = tileset._addHeightCallbacks;
  const boundingSphere = tile.boundingSphere;

  for (const callbackData of heightCallbackData) {
    // No need to update if the tile was already visible last frame
    if (callbackData.invoked || tile._wasSelectedLastFrame) {
      continue;
    }

    const ellipsoid = callbackData.ellipsoid;
    const positionCartographic = Cartographic.clone(
      callbackData.positionCartographic,
      scratchUpdateHeightCartographic,
    );
    const centerCartographic = Cartographic.fromCartesian(
      boundingSphere.center,
      ellipsoid,
      scratchUpdateHeightCartographic2,
    );

    // This can be undefined when the bounding sphere is at the origin
    if (defined(centerCartographic)) {
      positionCartographic.height = centerCartographic.height;
    }

    const position = Cartographic.toCartesian(
      positionCartographic,
      ellipsoid,
      scratchUpdateHeightCartesian,
    );
    if (
      Cartesian3.distance(position, boundingSphere.center) <=
      boundingSphere.radius
    ) {
      frameState.afterRender.push(() => {
        // Callback can be removed before it actually invoked at the end of the frame
        if (defined(callbackData.callback)) {
          callbackData.callback(positionCartographic);
        }
        callbackData.invoked = false;
      });
    }
  }
}

/**
 * 处理处于 PROCESSING 状态的瓦片，以便它们最终移动到 READY 状态。
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */

function processTiles(tileset, frameState) {
  filterProcessingQueue(tileset);
  const tiles = tileset._processingQueue;

  const { cacheBytes, maximumCacheOverflowBytes, statistics } = tileset;
  const cacheByteLimit = cacheBytes + maximumCacheOverflowBytes;

  let memoryExceeded = false;
  for (let i = 0; i < tiles.length; ++i) {
    if (tileset.totalMemoryUsageInBytes > cacheByteLimit) {
      memoryExceeded = true;
      break;
    }

    const tile = tiles[i];
    try {
      tile.process(tileset, frameState);

      if (tile.contentReady) {
        --statistics.numberOfTilesProcessing;
        tileset.tileLoad.raiseEvent(tile);
      }
    } catch (error) {
      --statistics.numberOfTilesProcessing;
      handleTileFailure(error, tileset, tile);
    }
  }

  if (tileset.totalMemoryUsageInBytes < cacheBytes) {
    decreaseScreenSpaceError(tileset);
  } else if (memoryExceeded && tiles.length > 0) {
    increaseScreenSpaceError(tileset);
  }
}

function increaseScreenSpaceError(tileset) {
  //>>includeStart('debug', pragmas.debug);
  oneTimeWarning(
    "increase-screenSpaceError",
    `The tiles needed to meet maximumScreenSpaceError would use more memory than allocated for this tileset.
    The tileset will be rendered with a larger screen space error (see memoryAdjustedScreenSpaceError).
    Consider using larger values for cacheBytes and maximumCacheOverflowBytes.`,
  );
  //>>includeEnd('debug');

  tileset._memoryAdjustedScreenSpaceError *= 1.02;
  const tiles = tileset._processingQueue;
  for (let i = 0; i < tiles.length; ++i) {
    tiles[i].updatePriority();
  }
  tiles.sort(sortTilesByPriority);
}

function decreaseScreenSpaceError(tileset) {
  tileset._memoryAdjustedScreenSpaceError = Math.max(
    tileset.memoryAdjustedScreenSpaceError / 1.02,
    tileset.maximumScreenSpaceError,
  );
}

const scratchCartesian = new Cartesian3();

const stringOptions = {
  maximumFractionDigits: 3,
};

/**
 * @private
 * @param {number} memorySizeInBytes
 * @returns {string}
 */
function formatMemoryString(memorySizeInBytes) {
  const memoryInMegabytes = memorySizeInBytes / 1048576;
  if (memoryInMegabytes < 1.0) {
    return memoryInMegabytes.toLocaleString(undefined, stringOptions);
  }
  return Math.round(memoryInMegabytes).toLocaleString();
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @returns {Cartesian3}
 */
function computeTileLabelPosition(tile) {
  const { halfAxes, radius, center } = tile.boundingVolume.boundingVolume;

  let position = Cartesian3.clone(center, scratchCartesian);
  if (defined(halfAxes)) {
    position.x += 0.75 * (halfAxes[0] + halfAxes[3] + halfAxes[6]);
    position.y += 0.75 * (halfAxes[1] + halfAxes[4] + halfAxes[7]);
    position.z += 0.75 * (halfAxes[2] + halfAxes[5] + halfAxes[8]);
  } else if (defined(radius)) {
    let normal = Cartesian3.normalize(center, scratchCartesian);
    normal = Cartesian3.multiplyByScalar(
      normal,
      0.75 * radius,
      scratchCartesian,
    );
    position = Cartesian3.add(normal, center, scratchCartesian);
  }
  return position;
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 * @param {Cartesian3} position
 * @returns {Label}
 */
function addTileDebugLabel(tile, tileset, position) {
  let labelString = "";
  let attributes = 0;

  if (tileset.debugShowGeometricError) {
    labelString += `\nGeometric error: ${tile.geometricError}`;
    attributes++;
  }

  if (tileset.debugShowRenderingStatistics) {
    labelString += `\nCommands: ${tile.commandsLength}`;
    attributes++;

    // Don't display number of points or triangles if 0.
    const numberOfPoints = tile.content.pointsLength;
    if (numberOfPoints > 0) {
      labelString += `\nPoints: ${tile.content.pointsLength}`;
      attributes++;
    }

    const numberOfTriangles = tile.content.trianglesLength;
    if (numberOfTriangles > 0) {
      labelString += `\nTriangles: ${tile.content.trianglesLength}`;
      attributes++;
    }

    labelString += `\nFeatures: ${tile.content.featuresLength}`;
    attributes++;
  }

  if (tileset.debugShowMemoryUsage) {
    labelString += `\nTexture Memory: ${formatMemoryString(
      tile.content.texturesByteLength,
    )}`;
    labelString += `\nGeometry Memory: ${formatMemoryString(
      tile.content.geometryByteLength,
    )}`;
    attributes += 2;
  }

  if (tileset.debugShowUrl) {
    if (tile.hasMultipleContents) {
      labelString += "\nUrls:";
      const urls = tile.content.innerContentUrls;
      for (let i = 0; i < urls.length; i++) {
        labelString += `\n- ${urls[i]}`;
      }
      attributes += urls.length;
    } else {
      labelString += `\nUrl: ${tile._contentHeader.uri}`;
      attributes++;
    }
  }

  const newLabel = {
    text: labelString.substring(1),
    position: position,
    font: `${19 - attributes}px sans-serif`,
    showBackground: true,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  };

  return tileset._tileDebugLabels.add(newLabel);
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function updateTileDebugLabels(tileset, frameState) {
  const selectedTiles = tileset._selectedTiles;
  const selectedLength = selectedTiles.length;
  const emptyTiles = tileset._emptyTiles;
  const emptyLength = emptyTiles.length;
  tileset._tileDebugLabels.removeAll();

  if (tileset.debugPickedTileLabelOnly) {
    if (defined(tileset.debugPickedTile)) {
      const position = defined(tileset.debugPickPosition)
        ? tileset.debugPickPosition
        : computeTileLabelPosition(tileset.debugPickedTile);
      const label = addTileDebugLabel(
        tileset.debugPickedTile,
        tileset,
        position,
      );
      label.pixelOffset = new Cartesian2(15, -15); // Offset to avoid picking the label.
    }
  } else {
    for (let i = 0; i < selectedLength; ++i) {
      const tile = selectedTiles[i];
      addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
    }
    for (let i = 0; i < emptyLength; ++i) {
      const tile = emptyTiles[i];
      if (tile.hasTilesetContent || tile.hasImplicitContent) {
        addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
      }
    }
  }
  tileset._tileDebugLabels.update(frameState);
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {object} passOptions
 */
function updateTiles(tileset, frameState, passOptions) {
  tileset._styleEngine.applyStyle(tileset);
  tileset._styleApplied = true;

  const { commandList, context } = frameState;
  const numberOfInitialCommands = commandList.length;
  const selectedTiles = tileset._selectedTiles;

  const bivariateVisibilityTest =
    tileset.isSkippingLevelOfDetail &&
    tileset._hasMixedContent &&
    context.stencilBuffer &&
    selectedTiles.length > 0;

  tileset._backfaceCommands.length = 0;

  if (bivariateVisibilityTest) {
    if (!defined(tileset._stencilClearCommand)) {
      tileset._stencilClearCommand = new ClearCommand({
        stencil: 0,
        pass: Pass.CESIUM_3D_TILE,
        renderState: RenderState.fromCache({
          stencilMask: StencilConstants.SKIP_LOD_MASK,
        }),
      });
    }
    commandList.push(tileset._stencilClearCommand);
  }

  const { statistics, tileVisible } = tileset;
  const isRender = passOptions.isRender;
  const lengthBeforeUpdate = commandList.length;

  for (let i = 0; i < selectedTiles.length; ++i) {
    const tile = selectedTiles[i];
    // Raise the tileVisible event before update in case the tileVisible event
    // handler makes changes that update needs to apply to WebGL resources
    if (isRender) {
      tileVisible.raiseEvent(tile);
    }
    processUpdateHeight(tileset, tile, frameState);
    tile.update(tileset, frameState, passOptions);
    statistics.incrementSelectionCounts(tile.content);
    ++statistics.selected;
  }
  const emptyTiles = tileset._emptyTiles;
  for (let i = 0; i < emptyTiles.length; ++i) {
    const tile = emptyTiles[i];
    tile.update(tileset, frameState, passOptions);
  }

  let addedCommandsLength = commandList.length - lengthBeforeUpdate;

  tileset._backfaceCommands.trim();

  if (bivariateVisibilityTest) {
    /*
     * 将“有效叶子”瓦片视为没有选定子代的选定瓦片。它们可能有子瓦片，
     * 但它们目前是我们的有效叶子，因为它们没有选定的子代。当 tile._finalResolution === true 时，
     * 这些瓦片就是有效叶子。
     * 将“未解析”瓦片视为 tile._finalResolution === false 的瓦片。
     *
     * 1. 仅渲染未解析瓦片的背面，以便铺设深度值。
     * 2. 在任意 tile._selectionDepth > stencilBuffer 的位置渲染所有前面。
     *    在通过深度测试时，用 tile._selectionDepth 替换 stencilBuffer。
     *    由于子瓦片总是在祖先之前绘制 {@link Cesium3DTilesetTraversal#traverseAndSelect}，
     *    这实际上首先绘制子瓦片，并且如果一个后代已经
     *    在该像素上绘制，则不绘制祖先。
     *    第一步防止子瓦片在实际位于祖先内容前面时出现在顶部。
     *    如果它们位于祖先的背面，则不会被绘制。
     *
     * 注意：第二步有时会导致视觉伪影，当背对相机的子内容有一些面
     * 部分朝向相机并位于祖先内容内部时。由于它们在内部，因此不会
     * 被第一步的深度写入剔除，并且由于它们部分朝向相机，模板测试
     * 会将它们绘制在祖先内容顶部。
     *
     * 注意：由于我们始终渲染未解析瓦片的背面，如果相机正在查看对象的背面，
     * 它们在加载时将始终被绘制，即使启用了背面剔除。
     */


    const backfaceCommands = tileset._backfaceCommands.values;
    const backfaceCommandsLength = backfaceCommands.length;

    commandList.length += backfaceCommandsLength;

    // copy commands to the back of the commandList
    for (let i = addedCommandsLength - 1; i >= 0; --i) {
      commandList[lengthBeforeUpdate + backfaceCommandsLength + i] =
        commandList[lengthBeforeUpdate + i];
    }

    // move backface commands to the front of the commandList
    for (let i = 0; i < backfaceCommandsLength; ++i) {
      commandList[lengthBeforeUpdate + i] = backfaceCommands[i];
    }
  }

  // Number of commands added by each update above
  addedCommandsLength = commandList.length - numberOfInitialCommands;
  statistics.numberOfCommands = addedCommandsLength;

  if (!isRender) {
    return;
  }

  // Only run EDL if simple attenuation is on
  if (
    tileset.pointCloudShading.attenuation &&
    tileset.pointCloudShading.eyeDomeLighting &&
    addedCommandsLength > 0
  ) {
    tileset._pointCloudEyeDomeLighting.update(
      frameState,
      numberOfInitialCommands,
      tileset.pointCloudShading,
      tileset.boundingSphere,
    );
  }

  if (
    tileset.debugShowGeometricError ||
    tileset.debugShowRenderingStatistics ||
    tileset.debugShowMemoryUsage ||
    tileset.debugShowUrl
  ) {
    if (!defined(tileset._tileDebugLabels)) {
      tileset._tileDebugLabels = new LabelCollection();
    }
    updateTileDebugLabels(tileset, frameState);
  } else {
    tileset._tileDebugLabels =
      tileset._tileDebugLabels && tileset._tileDebugLabels.destroy();
  }
}

const scratchStack = [];

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function destroySubtree(tileset, tile) {
  const root = tile;
  const stack = scratchStack;
  stack.push(tile);
  while (stack.length > 0) {
    tile = stack.pop();
    const children = tile.children;
    for (let i = 0; i < children.length; ++i) {
      stack.push(children[i]);
    }
    if (tile !== root) {
      destroyTile(tileset, tile);
      --tileset._statistics.numberOfTilesTotal;
    }
  }
  root.children = [];
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function unloadTile(tileset, tile) {
  tileset.tileUnload.raiseEvent(tile);
  tileset._statistics.decrementLoadCounts(tile.content);
  --tileset._statistics.numberOfTilesWithContentReady;
  tile.unloadContent();
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 */
function destroyTile(tileset, tile) {
  tileset._cache.unloadTile(tileset, tile, unloadTile);
  tile.destroy();
}

/**
 * 卸载上一帧未被选定的所有瓦片。可以用来
 * 明确管理瓦片缓存，并将加载的瓦片总数减少到
 * {@link Cesium3DTileset#cacheBytes} 以下。
 * <p>
 * 瓦片卸载发生在下一帧，以保持所有 WebGL 删除调用
 * 在渲染循环内。
 * </p>
 */

Cesium3DTileset.prototype.trimLoadedTiles = function() {
  this._cache.trim();
};

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function raiseLoadProgressEvent(tileset, frameState) {
  const statistics = tileset._statistics;
  const statisticsLast = tileset._statisticsLast;

  const numberOfPendingRequests = statistics.numberOfPendingRequests;
  const numberOfTilesProcessing = statistics.numberOfTilesProcessing;
  const lastNumberOfPendingRequest = statisticsLast.numberOfPendingRequests;
  const lastNumberOfTilesProcessing = statisticsLast.numberOfTilesProcessing;

  Cesium3DTilesetStatistics.clone(statistics, statisticsLast);

  const progressChanged =
    numberOfPendingRequests !== lastNumberOfPendingRequest ||
    numberOfTilesProcessing !== lastNumberOfTilesProcessing;

  if (progressChanged) {
    frameState.afterRender.push(function() {
      tileset.loadProgress.raiseEvent(
        numberOfPendingRequests,
        numberOfTilesProcessing,
      );

      return true;
    });
  }

  tileset._tilesLoaded =
    statistics.numberOfPendingRequests === 0 &&
    statistics.numberOfTilesProcessing === 0 &&
    statistics.numberOfAttemptedRequests === 0;

  // Events are raised (added to the afterRender queue) here since promises
  // may resolve outside of the update loop that then raise events, e.g.,
  // model's readyEvent
  if (progressChanged && tileset._tilesLoaded) {
    frameState.afterRender.push(function() {
      tileset.allTilesLoaded.raiseEvent();
      return true;
    });
    if (!tileset._initialTilesLoaded) {
      tileset._initialTilesLoaded = true;
      frameState.afterRender.push(function() {
        tileset.initialTilesLoaded.raiseEvent();
        return true;
      });
    }
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 */
function resetMinimumMaximum(tileset) {
  tileset._heatmap.resetMinimumMaximum();
  tileset._minimumPriority.depth = Number.MAX_VALUE;
  tileset._maximumPriority.depth = -Number.MAX_VALUE;
  tileset._minimumPriority.foveatedFactor = Number.MAX_VALUE;
  tileset._maximumPriority.foveatedFactor = -Number.MAX_VALUE;
  tileset._minimumPriority.distance = Number.MAX_VALUE;
  tileset._maximumPriority.distance = -Number.MAX_VALUE;
  tileset._minimumPriority.reverseScreenSpaceError = Number.MAX_VALUE;
  tileset._maximumPriority.reverseScreenSpaceError = -Number.MAX_VALUE;
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function detectModelMatrixChanged(tileset, frameState) {
  if (
    frameState.frameNumber === tileset._updatedModelMatrixFrame &&
    defined(tileset._previousModelMatrix)
  ) {
    return;
  }

  tileset._updatedModelMatrixFrame = frameState.frameNumber;
  tileset._modelMatrixChanged = !Matrix4.equals(
    tileset.modelMatrix,
    tileset._previousModelMatrix,
  );
  if (tileset._modelMatrixChanged) {
    tileset._previousModelMatrix = Matrix4.clone(
      tileset.modelMatrix,
      tileset._previousModelMatrix,
    );
  }
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {Cesium3DTilesetStatistics} passStatistics
 * @param {object} passOptions
 * @returns {boolean}
 */
function update(tileset, frameState, passStatistics, passOptions) {
  if (frameState.mode === SceneMode.MORPHING) {
    return false;
  }

  if (!defined(tileset._root)) {
    return false;
  }

  const statistics = tileset._statistics;
  statistics.clear();

  // Resets the visibility check for each pass
  ++tileset._updatedVisibilityFrame;

  // Update any tracked min max values
  resetMinimumMaximum(tileset);

  detectModelMatrixChanged(tileset, frameState);
  tileset._cullRequestsWhileMoving =
    tileset.cullRequestsWhileMoving && !tileset._modelMatrixChanged;

  const ready = tileset
    .getTraversal(passOptions)
    .selectTiles(tileset, frameState);

  if (passOptions.requestTiles) {
    requestTiles(tileset);
  }

  updateTiles(tileset, frameState, passOptions);

  // Update pass statistics
  Cesium3DTilesetStatistics.clone(statistics, passStatistics);

  if (passOptions.isRender) {
    const credits = tileset._credits;
    if (defined(credits) && statistics.selected !== 0) {
      for (let i = 0; i < credits.length; ++i) {
        const credit = credits[i];
        frameState.creditDisplay.addCreditToNextFrame(credit);
      }
    }
  }

  return ready;
}

function createCredits(tileset) {
  let credits = tileset._credits;
  if (!defined(credits)) {
    credits = [];
  }
  credits.length = 0;

  if (defined(tileset.resource.credits)) {
    tileset.resource.credits.forEach((credit) => {
      credits.push(Credit.clone(credit));
    });
  }

  const assetExtras = tileset.asset.extras;
  if (
    defined(assetExtras) &&
    defined(assetExtras.cesium) &&
    defined(assetExtras.cesium.credits)
  ) {
    const extraCredits = assetExtras.cesium.credits;
    for (let i = 0; i < extraCredits.length; ++i) {
      const credit = extraCredits[i];
      credits.push(new Credit(credit.html));
    }
  }

  credits.forEach(
    (credit) =>
    (credit.showOnScreen =
      credit.showOnScreen || tileset._showCreditsOnScreen),
  );

  tileset._credits = credits;
}

/**
 * @private
 * @param {object} passOptions
 * @returns {Cesium3DTilesetTraversal}
 */
Cesium3DTileset.prototype.getTraversal = function(passOptions) {
  const { pass } = passOptions;
  if (
    pass === Cesium3DTilePass.MOST_DETAILED_PRELOAD ||
    pass === Cesium3DTilePass.MOST_DETAILED_PICK
  ) {
    return Cesium3DTilesetMostDetailedTraversal;
  }
  return this.isSkippingLevelOfDetail
    ? Cesium3DTilesetSkipTraversal
    : Cesium3DTilesetBaseTraversal;
};

/**
 * @private
 * @param {FrameState} frameState
 */
Cesium3DTileset.prototype.update = function(frameState) {
  this.updateForPass(frameState, frameState.tilesetPassState);
};

/**
 * @private
 * @param {FrameState} frameState
 * @param {object} tilesetPassState
 */
Cesium3DTileset.prototype.updateForPass = function(
  frameState,
  tilesetPassState,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("frameState", frameState);
  Check.typeOf.object("tilesetPassState", tilesetPassState);
  //>>includeEnd('debug');

  const pass = tilesetPassState.pass;
  if (
    (pass === Cesium3DTilePass.PRELOAD &&
      (!this.preloadWhenHidden || this.show)) ||
    (pass === Cesium3DTilePass.PRELOAD_FLIGHT &&
      (!this.preloadFlightDestinations ||
        (!this.show && !this.preloadWhenHidden))) ||
    (pass === Cesium3DTilePass.REQUEST_RENDER_MODE_DEFER_CHECK &&
      ((!this._cullRequestsWhileMoving && this.foveatedTimeDelay <= 0) ||
        !this.show))
  ) {
    return;
  }

  const originalCommandList = frameState.commandList;
  const originalCamera = frameState.camera;
  const originalCullingVolume = frameState.cullingVolume;

  tilesetPassState.ready = false;

  const passOptions = Cesium3DTilePass.getPassOptions(pass);
  const ignoreCommands = passOptions.ignoreCommands;

  const commandList = defaultValue(
    tilesetPassState.commandList,
    originalCommandList,
  );
  const commandStart = commandList.length;

  frameState.commandList = commandList;
  frameState.camera = defaultValue(tilesetPassState.camera, originalCamera);
  frameState.cullingVolume = defaultValue(
    tilesetPassState.cullingVolume,
    originalCullingVolume,
  );

  if (passOptions.isRender) {
    const environmentMapManager = this._environmentMapManager;
    if (defined(this._root)) {
      environmentMapManager.position = this.boundingSphere.center;
    }
    environmentMapManager.update(frameState);
  }

  // Update clipping polygons
  const clippingPolygons = this._clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    clippingPolygons.queueCommands(frameState);
  }

  const passStatistics = this._statisticsPerPass[pass];

  if (this.show || ignoreCommands) {
    this._pass = pass;
    tilesetPassState.ready = update(
      this,
      frameState,
      passStatistics,
      passOptions,
    );
  }

  if (ignoreCommands) {
    commandList.length = commandStart;
  }

  frameState.commandList = originalCommandList;
  frameState.camera = originalCamera;
  frameState.cullingVolume = originalCullingVolume;
};

/**
 * 如果瓦片集 JSON 文件在 extensionsUsed 中列出了该扩展，则返回 <code>true</code>；否则返回 <code>false</code>。
 * @param {string} extensionName 要检查的扩展名。
 *
 * @returns {boolean} 如果瓦片集 JSON 文件在 extensionsUsed 中列出了该扩展，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Cesium3DTileset.prototype.hasExtension = function(extensionName) {
  if (!defined(this._extensionsUsed)) {
    return false;
  }

  return this._extensionsUsed.indexOf(extensionName) > -1;
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see Cesium3DTileset#destroy
 */

Cesium3DTileset.prototype.isDestroyed = function() {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁一个对象允许以确定的方式释放 WebGL 资源，
 * 而不是依赖垃圾收集器来销毁该对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给该对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * tileset = tileset && tileset.destroy();
 *
 * @see Cesium3DTileset#isDestroyed
 */

Cesium3DTileset.prototype.destroy = function() {
  this._tileDebugLabels =
    this._tileDebugLabels && this._tileDebugLabels.destroy();
  this._clippingPlanes = this._clippingPlanes && this._clippingPlanes.destroy();
  this._clippingPolygons =
    this._clippingPolygons && this._clippingPolygons.destroy();

  // Traverse the tree and destroy all tiles
  if (defined(this._root)) {
    const stack = scratchStack;
    stack.push(this._root);

    while (stack.length > 0) {
      const tile = stack.pop();
      tile.destroy();

      const children = tile.children;
      for (let i = 0; i < children.length; ++i) {
        stack.push(children[i]);
      }
    }
  }
  this._root = undefined;

  if (
    this._shouldDestroyImageBasedLighting &&
    !this._imageBasedLighting.isDestroyed()
  ) {
    this._imageBasedLighting.destroy();
  }
  this._imageBasedLighting = undefined;

  if (!this._environmentMapManager.isDestroyed()) {
    this._environmentMapManager.destroy();
  }
  this._environmentMapManager = undefined;

  return destroyObject(this);
};

Cesium3DTileset.supportedExtensions = {
  "3DTILES_metadata": true,
  "3DTILES_implicit_tiling": true,
  "3DTILES_content_gltf": true,
  "3DTILES_multiple_contents": true,
  "3DTILES_bounding_volume_S2": true,
  "3DTILES_batch_table_hierarchy": true,
  "3DTILES_draco_point_compression": true,
  MAXAR_content_geojson: true,
};

/**
 * 检查给定的扩展是否被 Cesium3DTileset 支持。如果
 * 扩展不被 Cesium3DTileset 支持，抛出 RuntimeError。
 *
 * @param {object} extensionsRequired 我们希望检查的扩展
 *
 * @private
 */

Cesium3DTileset.checkSupportedExtensions = function(extensionsRequired) {
  for (let i = 0; i < extensionsRequired.length; i++) {
    if (!Cesium3DTileset.supportedExtensions[extensionsRequired[i]]) {
      throw new RuntimeError(
        `Unsupported 3D Tiles Extension: ${extensionsRequired[i]}`,
      );
    }
  }
};

const scratchGetHeightRay = new Ray();
const scratchIntersection = new Cartesian3();
const scratchGetHeightCartographic = new Cartographic();

/**
 * 获取给定地理坐标处加载表面的高度。此函数将仅考虑已加载瓦片的网格，而不一定是瓦片集中可用的最详细瓦片。当对点云进行采样时，此函数将始终返回 undefined。
 *
 * @param {Cartographic} cartographic 要查找高度的地理坐标。
 * @param {Scene} scene 可视化正在进行的场景。
 * @returns {number|undefined} 给定地理坐标的高度，如果无法找到则返回 undefined。
 *
 * @example
 * const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(124624234);
 * scene.primitives.add(tileset);
 *
 * const height = tileset.getHeight(scene.camera.positionCartographic, scene);
 */

Cesium3DTileset.prototype.getHeight = function(cartographic, scene) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("cartographic", cartographic);
  Check.typeOf.object("scene", scene);
  //>>includeEnd('debug');

  let ellipsoid = scene.ellipsoid;
  if (!defined(ellipsoid)) {
    ellipsoid = Ellipsoid.WGS84;
  }

  const ray = scratchGetHeightRay;
  const position = ellipsoid.cartographicToCartesian(
    cartographic,
    ray.direction,
  );
  Cartesian3.normalize(ray.direction, ray.direction);

  ray.direction = Cartesian3.normalize(position, ray.direction);
  ray.direction = Cartesian3.negate(position, ray.direction);
  ray.origin = Cartesian3.multiplyByScalar(
    ray.direction,
    -2 * ellipsoid.maximumRadius,
    ray.origin,
  );

  const intersection = this.pick(ray, scene.frameState, scratchIntersection);
  if (!defined(intersection)) {
    return;
  }

  return ellipsoid.cartesianToCartographic(
    intersection,
    scratchGetHeightCartographic,
  )?.height;
};

/**
 * 当渲染包含给定地理坐标的新瓦片时调用回调函数。唯一的参数
 * 是瓦片上的地理坐标位置。
 *
 * @private
 *
 * @param {Scene} scene 可视化正在进行的场景。
 * @param {Cartographic} cartographic 地理坐标位置。
 * @param {Function} callback 新瓦片加载时调用的函数。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] 要使用的椭球体。
 * @returns {Function} 用于从四叉树中移除此回调的函数。
 */

Cesium3DTileset.prototype.updateHeight = function(
  cartographic,
  callback,
  ellipsoid,
) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

  const object = {
    positionCartographic: cartographic,
    ellipsoid: ellipsoid,
    callback: callback,
    invoked: false,
  };

  const removeCallback = () => {
    const addedCallbacks = this._addHeightCallbacks;
    const length = addedCallbacks.length;
    for (let i = 0; i < length; ++i) {
      if (addedCallbacks[i] === object) {
        addedCallbacks.splice(i, 1);
        break;
      }
    }

    if (object.callback) {
      object.callback = undefined;
    }
  };

  this._addHeightCallbacks.push(object);
  return removeCallback;
};

const scratchSphereIntersection = new Interval();
const scratchPickIntersection = new Cartesian3();

/**
 * 查找光线与已渲染的瓦片集表面之间的交点。光线必须以世界坐标给出。
 *
 * @param {Ray} ray 要测试交点的光线。
 * @param {FrameState} frameState 帧状态。
 * @param {Cartesian3|undefined} [result] 交点，如果未找到则为 <code>undefined</code>。
 * @returns {Cartesian3|undefined} 交点，如果未找到则为 <code>undefined</code>。
 *
 * @private
 */

Cesium3DTileset.prototype.pick = function(ray, frameState, result) {
  if (!frameState.context.webgl2 && !this._enablePick) {
    return;
  }

  const selectedTiles = this._selectedTiles;
  const selectedLength = selectedTiles.length;
  const candidates = [];

  for (let i = 0; i < selectedLength; ++i) {
    const tile = selectedTiles[i];
    const boundsIntersection = IntersectionTests.raySphere(
      ray,
      tile.contentBoundingVolume.boundingSphere,
      scratchSphereIntersection,
    );
    if (!defined(boundsIntersection) || !defined(tile.content)) {
      continue;
    }

    candidates.push(tile);
  }

  const length = candidates.length;
  candidates.sort((a, b) => {
    const aDist = BoundingSphere.distanceSquaredTo(
      a.contentBoundingVolume.boundingSphere,
      ray.origin,
    );
    const bDist = BoundingSphere.distanceSquaredTo(
      b.contentBoundingVolume.boundingSphere,
      ray.origin,
    );

    return aDist - bDist;
  });

  let intersection;
  for (let i = 0; i < length; ++i) {
    const tile = candidates[i];
    const candidate = tile.content.pick(
      ray,
      frameState,
      scratchPickIntersection,
    );

    if (defined(candidate)) {
      intersection = Cartesian3.clone(candidate, result);
      return intersection;
    }
  }
};

/**
 * 优化选项。当 {@link Cesium3DTileset#foveatedScreenSpaceError} 为 true 时作为回调使用，用于控制在锥形外部瓦片的屏幕空间误差提高多少，
 * 在 {@link Cesium3DTileset#foveatedMinimumScreenSpaceErrorRelaxation} 和 {@link Cesium3DTileset#maximumScreenSpaceError} 之间进行插值。
 *
 * @callback Cesium3DTileset.foveatedInterpolationCallback
 * @default Math.lerp
 *
 * @param {number} p 插值的起始值。
 * @param {number} q 插值的结束值。
 * @param {number} time 插值的时间，通常在 <code>[0.0, 1.0]</code> 范围内。
 * @returns {number} 插值后的值。
 */

export default Cesium3DTileset;
