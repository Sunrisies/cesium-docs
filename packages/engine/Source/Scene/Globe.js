import BoundingSphere from "../Core/BoundingSphere.js";
import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidTerrainProvider from "../Core/EllipsoidTerrainProvider.js";
import Event from "../Core/Event.js";
import IntersectionTests from "../Core/IntersectionTests.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Ray from "../Core/Ray.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import Texture from "../Renderer/Texture.js";
import GlobeFS from "../Shaders/GlobeFS.js";
import GlobeVS from "../Shaders/GlobeVS.js";
import AtmosphereCommon from "../Shaders/AtmosphereCommon.js";
import GroundAtmosphere from "../Shaders/GroundAtmosphere.js";
import GlobeSurfaceShaderSet from "./GlobeSurfaceShaderSet.js";
import GlobeSurfaceTileProvider from "./GlobeSurfaceTileProvider.js";
import GlobeTranslucency from "./GlobeTranslucency.js";
import ImageryLayerCollection from "./ImageryLayerCollection.js";
import QuadtreePrimitive from "./QuadtreePrimitive.js";
import SceneMode from "./SceneMode.js";
import ShadowMode from "./ShadowMode.js";
import CesiumMath from "../Core/Math.js";
/**
 * 在场景中渲染的地球，包括其地形（{@link Globe#terrainProvider}）
 * 和影像层（{@link Globe#imageryLayers}）。使用 {@link Scene#globe} 访问地球。
 *
 * @alias Globe
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 确定地球的大小和形状。
 */

function Globe(ellipsoid) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  const terrainProvider = new EllipsoidTerrainProvider({
    ellipsoid: ellipsoid,
  });
  const imageryLayerCollection = new ImageryLayerCollection();

  this._ellipsoid = ellipsoid;
  this._imageryLayerCollection = imageryLayerCollection;

  this._surfaceShaderSet = new GlobeSurfaceShaderSet();
  this._material = undefined;

  this._surface = new QuadtreePrimitive({
    tileProvider: new GlobeSurfaceTileProvider({
      terrainProvider: terrainProvider,
      imageryLayers: imageryLayerCollection,
      surfaceShaderSet: this._surfaceShaderSet,
    }),
  });

  this._terrainProvider = terrainProvider;
  this._terrainProviderChanged = new Event();

  this._undergroundColor = Color.clone(Color.BLACK);
  this._undergroundColorAlphaByDistance = new NearFarScalar(
    ellipsoid.maximumRadius / 1000.0,
    0.0,
    ellipsoid.maximumRadius / 5.0,
    1.0,
  );

  this._translucency = new GlobeTranslucency();

  makeShadersDirty(this);

  /**
   * 确定地球是否将被显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  this._oceanNormalMapResourceDirty = true;
  this._oceanNormalMapResource = new Resource({
    url: buildModuleUrl("Assets/Textures/waterNormalsSmall.jpg"),
  });

  /**
   * 用于驱动细节层次优化的最大屏幕空间误差。更高的
   * 值将提供更好的性能，但视觉质量较低。
   *
   * @type {number}
   * @default 2
   */
  this.maximumScreenSpaceError = 2;

  /**
   * 地形瓦片缓存的大小，以瓦片数量表示。超过此数量的额外
   * 瓦片将在不需要渲染此帧时被释放。更大的数字将消耗更多内存，但会更快显示细节
   * 当，例如，缩小然后再放大时。
   *
   * @type {number}
   * @default 100
   */
  this.tileCacheSize = 100;

  /**
   * 获取或设置被认为“太多”的正在加载的子瓦片数量。
   * 如果一个瓦片有太多正在加载的子瓦片，该瓦片将在其任何子瓦片被加载和渲染之前被加载和渲染。
   * 这意味着用户可以更快地收到反馈，表明正在发生某些事情，但总体加载时间会延长。
   * 将该值设置为 0 会导致每个
   * 瓦片层被依次加载，显著增加加载时间。将其设置为较大的
   * 数字（例如 1000）将最小化加载的瓦片数量，但往往会使
   * 细节在长时间等待后一次性出现。
   * @type {number}
   * @default 20
   */
  this.loadingDescendantLimit = 20;

  /**
   * 获取或设置一个值，指示渲染瓦片的祖先是否应该预加载。
   * 将此设置为 true 可以优化缩小缩放的体验，并在平移时提供新暴露区域的更多细节。
   * 缺点是这需要加载更多的瓦片。
   * @type {boolean}
   * @default true
   */
  this.preloadAncestors = true;

  /**
   * 获取或设置一个值，指示渲染瓦片的兄弟瓦片是否应该预加载。
   * 将此设置为 true 会导致与已渲染瓦片具有相同父级的瓦片被加载，即使它们被剔除。
   * 将此设置为 true 可能会在加载更多瓦片的情况下提供更好的平移体验。
   * @type {boolean}
   * @default false
   */
  this.preloadSiblings = false;

  /**
   * 用于突出显示地形填充瓦片的颜色。如果未定义，则填充瓦片将不会
   * 被突出显示。alpha 值用于与瓦片的
   * 实际颜色进行 alpha 混合。由于地形填充瓦片并不代表实际地形表面，
   * 在某些应用中，用视觉方式指示它们不可信可能是有用的。
   * @type {Color}
   * @default undefined
   */
  this.fillHighlightColor = undefined;

  /**
   * 启用使用场景光源照亮地球。
   *
   * @type {boolean}
   * @default false
   */
  this.enableLighting = false;

  /**
   * 用于调整地形兰伯特光照的倍增器。
   * 此数字乘以 GlobeFS.glsl 中 <code>czm_getLambertDiffuse</code> 的结果。
   * 仅当 <code>enableLighting</code> 为 <code>true</code> 时才生效。
   *
   * @type {number}
   * @default 0.9
   */
  this.lambertDiffuseMultiplier = 0.9;

  /**
   * 启用大气和雾的动态光照效果。仅在 <code>enableLighting</code> 为 <code>true</code> 时生效。
   *
   * @type {boolean}
   * @default true
   */
  this.dynamicAtmosphereLighting = true;

  /**
   * 动态大气光照是否使用太阳方向而不是场景的光源方向。
   * 仅在 <code>enableLighting</code> 和 <code>dynamicAtmosphereLighting</code> 为 <code>true</code> 时生效。
   *
   * @type {boolean}
   * @default false
   */
  this.dynamicAtmosphereLightingFromSun = false;

  /**
   * 启用地面大气，在从 <code>lightingFadeInDistance</code> 和 <code>lightingFadeOutDistance</code> 之间的距离观看时绘制在地球上。
   *
   * @type {boolean}
   * @default 在使用 WGS84 椭球体时为 true，其他情况下为 false
   */
  this.showGroundAtmosphere = Ellipsoid.WGS84.equals(ellipsoid);

  /**
   * 用于计算地面大气颜色的光照强度。
   *
   * @type {number}
   * @default 10.0
   */
  this.atmosphereLightIntensity = 10.0;

  /**
   * 在地面大气的散射方程中使用的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */
  this.atmosphereRayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

  /**
   * 在地面大气的散射方程中使用的米散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */
  this.atmosphereMieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 在地面大气的散射方程中使用的瑞利尺度高度，以米为单位。
   *
   * @type {number}
   * @default 10000.0
   */
  this.atmosphereRayleighScaleHeight = 10000.0;

  /**
   * 在地面大气的散射方程中使用的米尺度高度，以米为单位。
   *
   * @type {number}
   * @default 3200.0
   */
  this.atmosphereMieScaleHeight = 3200.0;

  /**
   * 进行米散射时考虑的介质的各向异性。
   * <p>
   * 有效值在 -1.0 和 1.0 之间。
   * </p>
   * @type {number}
   * @default 0.9
   */
  this.atmosphereMieAnisotropy = 0.9;

  /**
   * 所有物体被照亮的距离。仅在 <code>enableLighting</code> 或 <code>showGroundAtmosphere</code> 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 1/2 * pi * ellipsoid.minimumRadius
   */
  this.lightingFadeOutDistance =
    CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 照明恢复的距离。仅在 <code>enableLighting</code> 或 <code>showGroundAtmosphere</code> 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default pi * ellipsoid.minimumRadius
   */
  this.lightingFadeInDistance = CesiumMath.PI * ellipsoid.minimumRadius;

  /**
   * 从地面大气中夜间黑暗淡化为亮的地面大气的距离。
   * 仅在 <code>showGroundAtmosphere</code>、<code>enableLighting</code> 和
   * <code>dynamicAtmosphereLighting</code> 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 1/2 * pi * ellipsoid.minimumRadius
   */
  this.nightFadeOutDistance = CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 从地面大气中夜间黑暗淡化为未照亮的地面大气的距离。
   * 仅在 <code>showGroundAtmosphere</code>、<code>enableLighting</code> 和
   * <code>dynamicAtmosphereLighting</code> 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 5/2 * pi * ellipsoid.minimumRadius
   */
  this.nightFadeInDistance =
    5.0 * CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 如果在水域覆盖的地球区域应显示动画波浪效果则为真；否则为假。如果 <code>terrainProvider</code> 不提供水面掩码，则忽略此属性。
   *
   * @type {boolean}
   * @default true
   */
  this.showWaterEffect = true;

  /**
   * 如果诸如广告牌、多边线、标签等图元应与地形表面进行深度测试，则为真；如果这些图元应始终绘制在地形之上（除非它们在地球的另一侧），则为假。对地形进行深度测试的缺点是，细微的数值噪声或地形细节层次切换有时会使本应在表面的图元消失在其下方。
   *
   * @type {boolean}
   * @default false
   *
   */
  this.depthTestAgainstTerrain = false;

  /**
   * 确定地球是否从光源投射或接收阴影。将地球设置为投射阴影可能会影响性能，因为地形会从光源的视角重新渲染。
   * 目前，只有在视图中的地形会投射阴影。默认情况下，地球不投射阴影。
   *
   * @type {ShadowMode}
   * @default ShadowMode.RECEIVE_ONLY
   */
  this.shadows = ShadowMode.RECEIVE_ONLY;

  /**
   * 应用于大气的色调偏移。默认为 0.0（无偏移）。
   * 色调偏移为 1.0 表示可用色调的完整旋转。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereHueShift = 0.0;

  /**
   * 应用于大气的饱和度偏移。默认为 0.0（无偏移）。
   * 饱和度偏移为 -1.0 表示单色。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereSaturationShift = 0.0;

  /**
   * 应用于大气的亮度偏移。默认为 0.0（无偏移）。
   * 亮度偏移为 -1.0 表示完全黑暗，这将使空间显示出来。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereBrightnessShift = 0.0;

  /**
   * 是否显示地形裙边。地形裙边是从瓦片边缘向下延伸的几何体，用于隐藏相邻瓦片之间的接缝。
   * 当相机位于地下或启用透明度时，裙边总是隐藏。
   *
   * @type {boolean}
   * @default true
   */
  this.showSkirts = true;

  /**
   * 是否剔除背面地形。当相机位于地下或启用透明度时，背面不被剔除。
   *
   * @type {boolean}
   * @default true
   */
  this.backFaceCulling = true;

  this._oceanNormalMap = undefined;
  this._zoomedOutOceanSpecularIntensity = undefined;

  /**
   * 确定顶点阴影的暗度。
   * 仅在 <code>enableLighting</code> 为 <code>true</code> 时生效。
   *
   * @type {number}
   * @default 0.3
   */

  this.vertexShadowDarkness = 0.3;
}

Object.defineProperties(Globe.prototype, {
  /**
   * 获取描述此地球形状的椭球体。
   * @memberof Globe.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
  /**
   * 获取将在此地球上渲染的图像层集合。
   * @memberof Globe.prototype
   * @type {ImageryLayerCollection}
   */
  imageryLayers: {
    get: function () {
      return this._imageryLayerCollection;
    },
  },
  /**
   * 获取一个事件，每当图像层被添加、显示、隐藏、移动或移除时触发。
   *
   * @memberof Globe.prototype
   * @type {Event}
   * @readonly
   */
  imageryLayersUpdatedEvent: {
    get: function () {
      return this._surface.tileProvider.imageryLayersUpdatedEvent;
    },
  },
  /**
   * 当瓦片加载队列为空时返回 <code>true</code>，否则返回 <code>false</code>。当加载队列为空时，
   * 当前视图的所有地形和影像已被加载。
   * @memberof Globe.prototype
   * @type {boolean}
   * @readonly
   */
  tilesLoaded: {
    get: function () {
      if (!defined(this._surface)) {
        return true;
      }
      return (
        this._surface._tileLoadQueueHigh.length === 0 &&
        this._surface._tileLoadQueueMedium.length === 0 &&
        this._surface._tileLoadQueueLow.length === 0
      );
    },
  },
  /**
   * 获取或设置在没有影像可用时地球的颜色。
   * @memberof Globe.prototype
   * @type {Color}
   */
  baseColor: {
    get: function () {
      return this._surface.tileProvider.baseColor;
    },
    set: function (value) {
      this._surface.tileProvider.baseColor = value;
    },
  },
  /**
   * 指定一个 {@link ClippingPlaneCollection} 的属性，用于选择性地禁用每个平面外部的渲染。
   *
   * @memberof Globe.prototype
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._surface.tileProvider.clippingPlanes;
    },
    set: function (value) {
      this._surface.tileProvider.clippingPlanes = value;
    },
  },
  /**
   * 指定一个 {@link ClippingPolygonCollection} 的属性，用于选择性地禁用在一组多边形内部或外部的渲染。
   *
   * @memberof Globe.prototype
   * @type {ClippingPolygonCollection}
   */
  clippingPolygons: {
    get: function () {
      return this._surface.tileProvider.clippingPolygons;
    },
    set: function (value) {
      this._surface.tileProvider.clippingPolygons = value;
    },
  },
  /**
   * 指定一个 {@link Rectangle} 的属性，用于限制地球的渲染到一个大地区域。
   * 默认为大地坐标的最大范围。
   *
   * @memberof Globe.prototype
   * @type {Rectangle}
   * @default {@link Rectangle.MAX_VALUE}
   */
  cartographicLimitRectangle: {
    get: function () {
      return this._surface.tileProvider.cartographicLimitRectangle;
    },
    set: function (value) {
      if (!defined(value)) {
        value = Rectangle.clone(Rectangle.MAX_VALUE);
      }
      this._surface.tileProvider.cartographicLimitRectangle = value;
    },
  },
  /**
   * 用于在海洋中渲染波浪的法线贴图。设置此属性
   * 仅在配置的地形提供者包含水面掩码时才有效。
   * @memberof Globe.prototype
   * @type {string}
   * @default buildModuleUrl('Assets/Textures/waterNormalsSmall.jpg')
   */
  oceanNormalMapUrl: {
    get: function () {
      return this._oceanNormalMapResource.url;
    },
    set: function (value) {
      this._oceanNormalMapResource.url = value;
      this._oceanNormalMapResourceDirty = true;
    },
  },
  /**
   * 为此地球提供表面几何体的地形提供者。
   * @type {TerrainProvider}
   *
   * @memberof Globe.prototype
   * @type {TerrainProvider}
   *
   */
  terrainProvider: {
    get: function () {
      return this._terrainProvider;
    },
    set: function (value) {
      if (value !== this._terrainProvider) {
        this._terrainProvider = value;
        this._terrainProviderChanged.raiseEvent(value);
        if (defined(this._material)) {
          makeShadersDirty(this);
        }
      }
    },
  },
  /**
   * 获取一个在地形提供者发生变化时触发的事件。
   *
   * @memberof Globe.prototype
   * @type {Event}
   * @readonly
   */
  terrainProviderChanged: {
    get: function () {
      return this._terrainProviderChanged;
    },
  },
  /**
   * 获取一个在瓦片加载队列的长度自上一个渲染帧以来发生变化时触发的事件。当加载队列为空时，
   * 当前视图的所有地形和影像已被加载。事件将传递新长度的瓦片加载队列。
   *
   * @memberof Globe.prototype
   * @type {Event}
   */
  tileLoadProgressEvent: {
    get: function () {
      return this._surface.tileLoadProgressEvent;
    },
  },

  /**
   * 获取或设置地球的材质外观。这可以是几个内置的 {@link Material} 对象之一，或者是自定义材质，使用
   * {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric} 脚本化。
   * @memberof Globe.prototype
   * @type {Material | undefined}
   */
  material: {
    get: function () {
      return this._material;
    },
    set: function (material) {
      if (this._material !== material) {
        this._material = material;
        makeShadersDirty(this);
      }
    },
  },

  /**
   * 用于渲染地球背面颜色的颜色，当相机位于地下或地球透明时，
   * 根据相机的距离与地球颜色进行混合。
   * <br /><br />
   * 要禁用地下着色，将 <code>undergroundColor</code> 设置为 <code>undefined</code>。
   *
   * @memberof Globe.prototype
   * @type {Color}
   * @default {@link Color.BLACK}
   *
   * @see Globe#undergroundColorAlphaByDistance
   */

  undergroundColor: {
    get: function () {
      return this._undergroundColor;
    },
    set: function (value) {
      this._undergroundColor = Color.clone(value, this._undergroundColor);
    },
  },

  /**
   * 获取或设置用于混合 {@link Globe#undergroundColor} 与地球颜色的近距离和远距离。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 范围内时，alpha 会在
   * {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间进行插值。
   * 在这些范围之外，alpha 保持在离最近的边界。如果未定义，
   * 地下颜色将不会与地球颜色混合。
   * <br /> <br />
   * 当相机位于椭球体上方时，距离是从椭球体上最近的点计算，而不是相机的位置。
   *
   * @memberof Globe.prototype
   * @type {NearFarScalar}
   *
   * @see Globe#undergroundColor
   * */
  undergroundColorAlphaByDistance: {
    get: function () {
      return this._undergroundColorAlphaByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far < value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');
      this._undergroundColorAlphaByDistance = NearFarScalar.clone(
        value,
        this._undergroundColorAlphaByDistance,
      );
    },
  },

  /**
   * 控制地球透明度的属性。
   *
   * @memberof Globe.prototype
   * @type {GlobeTranslucency}
   */

  translucency: {
    get: function () {
      return this._translucency;
    },
  },
});

function makeShadersDirty(globe) {
  const defines = [];

  const requireNormals =
    defined(globe._material) &&
    (defined(globe._material.shaderSource.match(/slope/)) ||
      defined(globe._material.shaderSource.match("normalEC")));

  const fragmentSources = [AtmosphereCommon, GroundAtmosphere];
  if (
    defined(globe._material) &&
    (!requireNormals || globe._terrainProvider.requestVertexNormals)
  ) {
    fragmentSources.push(globe._material.shaderSource);
    defines.push("APPLY_MATERIAL");
    globe._surface._tileProvider.materialUniformMap = globe._material._uniforms;
  } else {
    globe._surface._tileProvider.materialUniformMap = undefined;
  }
  fragmentSources.push(GlobeFS);

  globe._surfaceShaderSet.baseVertexShaderSource = new ShaderSource({
    sources: [AtmosphereCommon, GroundAtmosphere, GlobeVS],
    defines: defines,
  });

  globe._surfaceShaderSet.baseFragmentShaderSource = new ShaderSource({
    sources: fragmentSources,
    defines: defines,
  });
  globe._surfaceShaderSet.material = globe._material;
}

function createComparePickTileFunction(rayOrigin) {
  return function (a, b) {
    const aDist = BoundingSphere.distanceSquaredTo(
      a.pickBoundingSphere,
      rayOrigin,
    );
    const bDist = BoundingSphere.distanceSquaredTo(
      b.pickBoundingSphere,
      rayOrigin,
    );

    return aDist - bDist;
  };
}

const scratchArray = [];
const scratchSphereIntersectionResult = {
  start: 0.0,
  stop: 0.0,
};

/**
 * 找到光线与已渲染的地球表面之间的交点。光线必须以世界坐标给出。
 *
 * @param {Ray} ray 要测试交点的光线。
 * @param {Scene} scene 场景。
 * @param {boolean} [cullBackFaces=true] 设置为 true 以不选择背面。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3|undefined} 交点或 <code>undefined</code> 如果未找到交点。返回的位置在 2D 和哥伦布视图中是投影坐标。
 *
 * @private
 */

Globe.prototype.pickWorldCoordinates = function (
  ray,
  scene,
  cullBackFaces,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(ray)) {
    throw new DeveloperError("ray is required");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required");
  }
  //>>includeEnd('debug');

  cullBackFaces = defaultValue(cullBackFaces, true);

  const mode = scene.mode;
  const projection = scene.mapProjection;

  const sphereIntersections = scratchArray;
  sphereIntersections.length = 0;

  const tilesToRender = this._surface._tilesToRender;
  let length = tilesToRender.length;

  let tile;
  let i;

  for (i = 0; i < length; ++i) {
    tile = tilesToRender[i];
    const surfaceTile = tile.data;

    if (!defined(surfaceTile)) {
      continue;
    }

    let boundingVolume = surfaceTile.pickBoundingSphere;
    if (mode !== SceneMode.SCENE3D) {
      surfaceTile.pickBoundingSphere = boundingVolume =
        BoundingSphere.fromRectangleWithHeights2D(
          tile.rectangle,
          projection,
          surfaceTile.tileBoundingRegion.minimumHeight,
          surfaceTile.tileBoundingRegion.maximumHeight,
          boundingVolume,
        );
      Cartesian3.fromElements(
        boundingVolume.center.z,
        boundingVolume.center.x,
        boundingVolume.center.y,
        boundingVolume.center,
      );
    } else if (defined(surfaceTile.renderedMesh)) {
      BoundingSphere.clone(
        surfaceTile.tileBoundingRegion.boundingSphere,
        boundingVolume,
      );
    } else {
      // So wait how did we render this thing then? It shouldn't be possible to get here.
      continue;
    }

    const boundingSphereIntersection = IntersectionTests.raySphere(
      ray,
      boundingVolume,
      scratchSphereIntersectionResult,
    );
    if (defined(boundingSphereIntersection)) {
      sphereIntersections.push(surfaceTile);
    }
  }

  sphereIntersections.sort(createComparePickTileFunction(ray.origin));

  let intersection;
  length = sphereIntersections.length;
  for (i = 0; i < length; ++i) {
    intersection = sphereIntersections[i].pick(
      ray,
      scene.mode,
      scene.mapProjection,
      cullBackFaces,
      result,
    );
    if (defined(intersection)) {
      break;
    }
  }

  return intersection;
};

const cartoScratch = new Cartographic();
/**
 * 找到光线与已渲染的地球表面之间的交点。光线必须以世界坐标给出。
 *
 * @param {Ray} ray 要测试交点的光线。
 * @param {Scene} scene 场景。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3|undefined} 交点或 <code>undefined</code> 如果未找到交点。
 *
 * @example
 * // find intersection of ray through a pixel and the globe
 * const ray = viewer.camera.getPickRay(windowCoordinates);
 * const intersection = globe.pick(ray, scene);
 */
Globe.prototype.pick = function (ray, scene, result) {
  result = this.pickWorldCoordinates(ray, scene, true, result);
  if (defined(result) && scene.mode !== SceneMode.SCENE3D) {
    result = Cartesian3.fromElements(result.y, result.z, result.x, result);
    const carto = scene.mapProjection.unproject(result, cartoScratch);
    result = this._ellipsoid.cartographicToCartesian(carto, result);
  }

  return result;
};

const scratchGetHeightCartesian = new Cartesian3();
const scratchGetHeightIntersection = new Cartesian3();
const scratchGetHeightCartographic = new Cartographic();
const scratchGetHeightRay = new Ray();

function tileIfContainsCartographic(tile, cartographic) {
  return defined(tile) && Rectangle.contains(tile.rectangle, cartographic)
    ? tile
    : undefined;
}

/**
 * 获取给定大地坐标处表面的高度。
 *
 * @param {Cartographic} cartographic 要查找高度的大地坐标。
 * @returns {number|undefined} 大地坐标的高度，如果未找到则返回 undefined。
 */

Globe.prototype.getHeight = function (cartographic) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartographic)) {
    throw new DeveloperError("cartographic is required");
  }
  //>>includeEnd('debug');

  const levelZeroTiles = this._surface._levelZeroTiles;
  if (!defined(levelZeroTiles)) {
    return;
  }

  let tile;
  let i;

  const length = levelZeroTiles.length;
  for (i = 0; i < length; ++i) {
    tile = levelZeroTiles[i];
    if (Rectangle.contains(tile.rectangle, cartographic)) {
      break;
    }
  }

  if (i >= length) {
    return undefined;
  }

  let tileWithMesh = tile;

  while (defined(tile)) {
    tile =
      tileIfContainsCartographic(tile._southwestChild, cartographic) ||
      tileIfContainsCartographic(tile._southeastChild, cartographic) ||
      tileIfContainsCartographic(tile._northwestChild, cartographic) ||
      tile._northeastChild;

    if (
      defined(tile) &&
      defined(tile.data) &&
      defined(tile.data.renderedMesh)
    ) {
      tileWithMesh = tile;
    }
  }

  tile = tileWithMesh;

  // This tile was either rendered or culled.
  // It is sometimes useful to get a height from a culled tile,
  // e.g. when we're getting a height in order to place a billboard
  // on terrain, and the camera is looking at that same billboard.
  // The culled tile must have a valid mesh, though.
  if (
    !defined(tile) ||
    !defined(tile.data) ||
    !defined(tile.data.renderedMesh)
  ) {
    // Tile was not rendered (culled).
    return undefined;
  }

  const projection = this._surface._tileProvider.tilingScheme.projection;
  const ellipsoid = this._surface._tileProvider.tilingScheme.ellipsoid;

  //cartesian has to be on the ellipsoid surface for `ellipsoid.geodeticSurfaceNormal`
  const cartesian = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0,
    ellipsoid,
    scratchGetHeightCartesian,
  );

  const ray = scratchGetHeightRay;
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(
    cartesian,
    ray.direction,
  );

  // Try to find the intersection point between the surface normal and z-axis.
  // minimum height (-11500.0) for the terrain set, need to get this information from the terrain provider
  const rayOrigin = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesian,
    11500.0,
    ray.origin,
  );

  // Theoretically, not with Earth datums, the intersection point can be outside the ellipsoid
  if (!defined(rayOrigin)) {
    // intersection point is outside the ellipsoid, try other value
    // minimum height (-11500.0) for the terrain set, need to get this information from the terrain provider
    let minimumHeight;
    if (defined(tile.data.tileBoundingRegion)) {
      minimumHeight = tile.data.tileBoundingRegion.minimumHeight;
    }
    const magnitude = Math.min(defaultValue(minimumHeight, 0.0), -11500.0);

    // multiply by the *positive* value of the magnitude
    const vectorToMinimumPoint = Cartesian3.multiplyByScalar(
      surfaceNormal,
      Math.abs(magnitude) + 1,
      scratchGetHeightIntersection,
    );
    Cartesian3.subtract(cartesian, vectorToMinimumPoint, ray.origin);
  }

  const intersection = tile.data.pick(
    ray,
    undefined,
    projection,
    false,
    scratchGetHeightIntersection,
  );
  if (!defined(intersection)) {
    return undefined;
  }

  return ellipsoid.cartesianToCartographic(
    intersection,
    scratchGetHeightCartographic,
  ).height;
};

/**
 * @private
 */
Globe.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  if (frameState.passes.render) {
    this._surface.update(frameState);
  }
};

/**
 * @private
 */
Globe.prototype.beginFrame = function (frameState) {
  const surface = this._surface;
  const tileProvider = surface.tileProvider;
  const terrainProvider = this.terrainProvider;
  const hasWaterMask =
    defined(terrainProvider) &&
    terrainProvider.hasWaterMask &&
    terrainProvider.hasWaterMask;

  if (hasWaterMask && this._oceanNormalMapResourceDirty) {
    // url changed, load new normal map asynchronously
    this._oceanNormalMapResourceDirty = false;
    const oceanNormalMapResource = this._oceanNormalMapResource;
    const oceanNormalMapUrl = oceanNormalMapResource.url;
    if (defined(oceanNormalMapUrl)) {
      const that = this;
      oceanNormalMapResource.fetchImage().then(function (image) {
        if (oceanNormalMapUrl !== that._oceanNormalMapResource.url) {
          // url changed while we were loading
          return;
        }

        that._oceanNormalMap =
          that._oceanNormalMap && that._oceanNormalMap.destroy();
        that._oceanNormalMap = new Texture({
          context: frameState.context,
          source: image,
        });
      });
    } else {
      this._oceanNormalMap =
        this._oceanNormalMap && this._oceanNormalMap.destroy();
    }
  }

  const pass = frameState.passes;
  const mode = frameState.mode;

  if (pass.render) {
    if (this.showGroundAtmosphere) {
      this._zoomedOutOceanSpecularIntensity = 0.4;
    } else {
      this._zoomedOutOceanSpecularIntensity = 0.5;
    }

    surface.maximumScreenSpaceError = this.maximumScreenSpaceError;
    surface.tileCacheSize = this.tileCacheSize;
    surface.loadingDescendantLimit = this.loadingDescendantLimit;
    surface.preloadAncestors = this.preloadAncestors;
    surface.preloadSiblings = this.preloadSiblings;

    tileProvider.terrainProvider = this.terrainProvider;
    tileProvider.lightingFadeOutDistance = this.lightingFadeOutDistance;
    tileProvider.lightingFadeInDistance = this.lightingFadeInDistance;
    tileProvider.nightFadeOutDistance = this.nightFadeOutDistance;
    tileProvider.nightFadeInDistance = this.nightFadeInDistance;
    tileProvider.zoomedOutOceanSpecularIntensity =
      mode === SceneMode.SCENE3D ? this._zoomedOutOceanSpecularIntensity : 0.0;
    tileProvider.hasWaterMask = hasWaterMask;
    tileProvider.showWaterEffect = this.showWaterEffect;
    tileProvider.oceanNormalMap = this._oceanNormalMap;
    tileProvider.enableLighting = this.enableLighting;
    tileProvider.dynamicAtmosphereLighting = this.dynamicAtmosphereLighting;
    tileProvider.dynamicAtmosphereLightingFromSun =
      this.dynamicAtmosphereLightingFromSun;
    tileProvider.showGroundAtmosphere = this.showGroundAtmosphere;
    tileProvider.atmosphereLightIntensity = this.atmosphereLightIntensity;
    tileProvider.atmosphereRayleighCoefficient =
      this.atmosphereRayleighCoefficient;
    tileProvider.atmosphereMieCoefficient = this.atmosphereMieCoefficient;
    tileProvider.atmosphereRayleighScaleHeight =
      this.atmosphereRayleighScaleHeight;
    tileProvider.atmosphereMieScaleHeight = this.atmosphereMieScaleHeight;
    tileProvider.atmosphereMieAnisotropy = this.atmosphereMieAnisotropy;
    tileProvider.shadows = this.shadows;
    tileProvider.hueShift = this.atmosphereHueShift;
    tileProvider.saturationShift = this.atmosphereSaturationShift;
    tileProvider.brightnessShift = this.atmosphereBrightnessShift;
    tileProvider.fillHighlightColor = this.fillHighlightColor;
    tileProvider.showSkirts = this.showSkirts;
    tileProvider.backFaceCulling = this.backFaceCulling;
    tileProvider.vertexShadowDarkness = this.vertexShadowDarkness;
    tileProvider.undergroundColor = this._undergroundColor;
    tileProvider.undergroundColorAlphaByDistance =
      this._undergroundColorAlphaByDistance;
    tileProvider.lambertDiffuseMultiplier = this.lambertDiffuseMultiplier;

    surface.beginFrame(frameState);
  }
};

/**
 * @private
 */
Globe.prototype.render = function (frameState) {
  if (!this.show) {
    return;
  }

  if (defined(this._material)) {
    this._material.update(frameState.context);
  }

  this._surface.render(frameState);
};

/**
 * @private
 */
Globe.prototype.endFrame = function (frameState) {
  if (!this.show) {
    return;
  }

  if (frameState.passes.render) {
    this._surface.endFrame(frameState);
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应再使用；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @see Globe#destroy
 */

Globe.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象可以实现 WebGL 资源的可预测释放，而不是依靠垃圾回收器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，则不应再使用；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）分配给该对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * globe = globe && globe.destroy();
 *
 * @see Globe#isDestroyed
 */
Globe.prototype.destroy = function () {
  this._surfaceShaderSet =
    this._surfaceShaderSet && this._surfaceShaderSet.destroy();
  this._surface = this._surface && this._surface.destroy();
  this._oceanNormalMap = this._oceanNormalMap && this._oceanNormalMap.destroy();
  return destroyObject(this);
};
export default Globe;
