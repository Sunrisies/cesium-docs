import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";
import Rectangle from "../Core/Rectangle.js";
import VerticalExaggeration from "../Core/VerticalExaggeration.js";
import ClassificationPrimitive from "./ClassificationPrimitive.js";
import ClassificationType from "./ClassificationType.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import SceneMode from "./SceneMode.js";
import ShadowVolumeAppearance from "./ShadowVolumeAppearance.js";

const GroundPrimitiveUniformMap = {
  u_globeMinimumAltitude: function () {
    return 55000.0;
  },
};

/**
 * 地面原语表示在 {@link Scene} 中悬挂于地形或 3D Tiles 上的几何体。
 * <p>
 * 原语将几何体实例与描述完整着色的 {@link Appearance} 结合在一起，包括
 * {@link Material} 和 {@link RenderState}。大致而言，几何体实例定义了结构和位置，
 * 而外观定义了视觉特征。解耦几何体和外观使我们能够自由混合
 * 和匹配大多数内容，并独立添加新的几何体或外观。
 * </p>
 * <p>
 * 使用具有不同 PerInstanceColors 或材料的 GeometryInstances 需要支持 WEBGL_depth_texture 扩展。
 * </p>
 * <p>
 * 带纹理的 GroundPrimitives 是为概念图案设计的，旨在不精确地将
 * 纹理映射到地形 - 对于该用例，请使用 {@link SingleTileImageryProvider}。
 * </p>
 * <p>
 * 为了正确渲染，此功能需要 EXT_frag_depth WebGL 扩展。对不支持此扩展的硬件，
 * 某些视角会出现渲染伪影。
 * </p>
 * <p>
 * 有效几何体包括 {@link CircleGeometry}、{@link CorridorGeometry}、{@link EllipseGeometry}、{@link PolygonGeometry} 和 {@link RectangleGeometry}。
 * </p>
 *
 * @alias GroundPrimitive
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Array|GeometryInstance} [options.geometryInstances] 要渲染的几何体实例。
 * @param {Appearance} [options.appearance] 用于渲染原语的外观。默认情况下，当 GeometryInstances 具有颜色属性时，默认为平面 PerInstanceColorAppearance。
 * @param {boolean} [options.show=true] 确定该原语是否显示。
 * @param {boolean} [options.vertexCacheOptimize=false] 当 <code>true</code> 时，几何体顶点经过优化，以适应顶点着色器之前和之后的缓存。
 * @param {boolean} [options.interleave=false] 当 <code>true</code> 时，几何体顶点属性是交错的，这可以稍微提高渲染性能，但会增加加载时间。
 * @param {boolean} [options.compressVertices=true] 当 <code>true</code> 时，几何体顶点被压缩，将节省内存。
 * @param {boolean} [options.releaseGeometryInstances=true] 当 <code>true</code> 时，原语不会保留对输入 <code>geometryInstances</code> 的引用，以节省内存。
 * @param {boolean} [options.allowPicking=true] 当 <code>true</code> 时，每个几何体实例只能通过 {@link Scene#pick} 被拾取。当 <code>false</code> 时，节省 GPU 内存。
 * @param {boolean} [options.asynchronous=true] 确定原语是异步创建还是阻塞直到准备好。如果为 false，则必须首先调用 initializeTerrainHeights()。
 * @param {ClassificationType} [options.classificationType=ClassificationType.BOTH] 确定是对地形、3D Tiles 还是两者进行分类。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示该原语命令的边界球。
 * @param {boolean} [options.debugShowShadowVolume=false] 仅用于调试。确定每个几何体在原语中的阴影体是否被绘制。必须在创建时为 <code>true</code> 才能生效。
 *
 * @example
 * // Example 1: Create primitive with a single instance
 * const rectangleInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(-140.0, 30.0, -100.0, 40.0)
 *   }),
 *   id : 'rectangle',
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
 *   }
 * });
 * scene.primitives.add(new Cesium.GroundPrimitive({
 *   geometryInstances : rectangleInstance
 * }));
 *
 * // Example 2: Batch instances
 * const color = new Cesium.ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5); // Both instances must have the same color.
 * const rectangleInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(-140.0, 30.0, -100.0, 40.0)
 *   }),
 *   id : 'rectangle',
 *   attributes : {
 *     color : color
 *   }
 * });
 * const ellipseInstance = new Cesium.GeometryInstance({
 *     geometry : new Cesium.EllipseGeometry({
 *         center : Cesium.Cartesian3.fromDegrees(-105.0, 40.0),
 *         semiMinorAxis : 300000.0,
 *         semiMajorAxis : 400000.0
 *     }),
 *     id : 'ellipse',
 *     attributes : {
 *         color : color
 *     }
 * });
 * scene.primitives.add(new Cesium.GroundPrimitive({
 *   geometryInstances : [rectangleInstance, ellipseInstance]
 * }));
 *
 * @see Primitive
 * @see ClassificationPrimitive
 * @see GeometryInstance
 * @see Appearance
 */
function GroundPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let appearance = options.appearance;
  const geometryInstances = options.geometryInstances;
  if (!defined(appearance) && defined(geometryInstances)) {
    const geometryInstancesArray = Array.isArray(geometryInstances)
      ? geometryInstances
      : [geometryInstances];
    const geometryInstanceCount = geometryInstancesArray.length;
    for (let i = 0; i < geometryInstanceCount; i++) {
      const attributes = geometryInstancesArray[i].attributes;
      if (defined(attributes) && defined(attributes.color)) {
        appearance = new PerInstanceColorAppearance({
          flat: true,
        });
        break;
      }
    }
  }
  /**
   * 用于给此原语着色的 {@link Appearance}。每个几何体
   * 实例使用相同的外观进行着色。一些外观，例如
   * {@link PerInstanceColorAppearance} 允许为每个实例赋予独特
   * 的属性。
   *
   * @type Appearance
   *
   * @default undefined
   */
  this.appearance = appearance;

  /**
   * 与此原语一起渲染的几何体实例。如果在构造原语时
   * <code>options.releaseGeometryInstances</code> 为 <code>true</code>，
   * 则可能为 <code>undefined</code>。
   * <p>
   * 在原语渲染后更改此属性没有效果。
   * </p>
   *
   * @readonly
   * @type {Array|GeometryInstance}
   *
   * @default undefined
   */
  this.geometryInstances = options.geometryInstances;

  /**
   * 确定该原语是否显示。此属性影响原语中的所有几何体
   * 实例。
   *
   * @type {boolean}
   *
   * @default true
   */

  this.show = defaultValue(options.show, true);
  /**
   * 确定是否将地形、3D Tiles 或两者进行分类。
   *
   * @type {ClassificationType}
   *
   * @default ClassificationType.BOTH
   */
  this.classificationType = defaultValue(
    options.classificationType,
    ClassificationType.BOTH,
  );

  /**
   * 此属性仅用于调试；不适用于生产环境，也未经过优化。
   * <p>
   * 绘制原语中每个绘制命令的边界球。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试；不适用于生产环境，也未经过优化。
   * <p>
   * 绘制原语中每个几何体的阴影体。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */

  this.debugShowShadowVolume = defaultValue(
    options.debugShowShadowVolume,
    false,
  );

  this._boundingVolumes = [];
  this._boundingVolumes2D = [];

  this._ready = false;
  this._primitive = undefined;

  this._maxHeight = undefined;
  this._minHeight = undefined;

  this._maxTerrainHeight = ApproximateTerrainHeights._defaultMaxTerrainHeight;
  this._minTerrainHeight = ApproximateTerrainHeights._defaultMinTerrainHeight;

  this._boundingSpheresKeys = [];
  this._boundingSpheres = [];

  this._useFragmentCulling = false;
  // Used when inserting in an OrderedPrimitiveCollection
  this._zIndex = undefined;

  const that = this;
  this._classificationPrimitiveOptions = {
    geometryInstances: undefined,
    appearance: undefined,
    vertexCacheOptimize: defaultValue(options.vertexCacheOptimize, false),
    interleave: defaultValue(options.interleave, false),
    releaseGeometryInstances: defaultValue(
      options.releaseGeometryInstances,
      true,
    ),
    allowPicking: defaultValue(options.allowPicking, true),
    asynchronous: defaultValue(options.asynchronous, true),
    compressVertices: defaultValue(options.compressVertices, true),
    _createBoundingVolumeFunction: undefined,
    _updateAndQueueCommandsFunction: undefined,
    _pickPrimitive: that,
    _extruded: true,
    _uniformMap: GroundPrimitiveUniformMap,
  };
}

Object.defineProperties(GroundPrimitive.prototype, {
  /**
   * 当 <code>true</code> 时，几何体顶点经过优化，以适应顶点着色器之前和之后的缓存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  vertexCacheOptimize: {
    get: function () {
      return this._classificationPrimitiveOptions.vertexCacheOptimize;
    },
  },

  /**
   * 确定几何体顶点属性是否交错，这可以略微提高渲染性能。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  interleave: {
    get: function () {
      return this._classificationPrimitiveOptions.interleave;
    },
  },

  /**
   * 当 <code>true</code> 时，原语不会保留对输入 <code>geometryInstances</code> 的引用，以节省内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  releaseGeometryInstances: {
    get: function () {
      return this._classificationPrimitiveOptions.releaseGeometryInstances;
    },
  },

  /**
   * 当 <code>true</code> 时，每个几何体实例只能通过 {@link Scene#pick} 被拾取。当 <code>false</code> 时，节省 GPU 内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  allowPicking: {
    get: function () {
      return this._classificationPrimitiveOptions.allowPicking;
    },
  },

  /**
   * 确定几何体实例是否将在 Web Worker 中创建和批处理。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  asynchronous: {
    get: function () {
      return this._classificationPrimitiveOptions.asynchronous;
    },
  },

  /**
   * 当 <code>true</code> 时，几何体顶点被压缩，将节省内存。
   *
   * @memberof GroundPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  compressVertices: {
    get: function () {
      return this._classificationPrimitiveOptions.compressVertices;
    },
  },

  /**
   * 确定原语是否完成并准备渲染。如果此属性为
   * true，则原语将在下一次调用 {@link GroundPrimitive#update} 时渲染。
   *
   * @memberof GroundPrimitive.prototype
   *
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
 * 确定是否支持 GroundPrimitive 渲染。
 *
 * @function
 * @param {Scene} scene 场景。
 * @returns {boolean} 如果支持 GroundPrimitives，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

GroundPrimitive.isSupported = ClassificationPrimitive.isSupported;

function getComputeMaximumHeightFunction(primitive) {
  return function (granularity, ellipsoid) {
    const r = ellipsoid.maximumRadius;
    const delta = r / Math.cos(granularity * 0.5) - r;
    return primitive._maxHeight + delta;
  };
}

function getComputeMinimumHeightFunction(primitive) {
  return function (granularity, ellipsoid) {
    return primitive._minHeight;
  };
}

const scratchBVCartesianHigh = new Cartesian3();
const scratchBVCartesianLow = new Cartesian3();
const scratchBVCartesian = new Cartesian3();
const scratchBVCartographic = new Cartographic();
const scratchBVRectangle = new Rectangle();

function getRectangle(frameState, geometry) {
  const ellipsoid = frameState.mapProjection.ellipsoid;

  if (
    !defined(geometry.attributes) ||
    !defined(geometry.attributes.position3DHigh)
  ) {
    if (defined(geometry.rectangle)) {
      return geometry.rectangle;
    }

    return undefined;
  }

  const highPositions = geometry.attributes.position3DHigh.values;
  const lowPositions = geometry.attributes.position3DLow.values;
  const length = highPositions.length;

  let minLat = Number.POSITIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < length; i += 3) {
    const highPosition = Cartesian3.unpack(
      highPositions,
      i,
      scratchBVCartesianHigh,
    );
    const lowPosition = Cartesian3.unpack(
      lowPositions,
      i,
      scratchBVCartesianLow,
    );

    const position = Cartesian3.add(
      highPosition,
      lowPosition,
      scratchBVCartesian,
    );
    const cartographic = ellipsoid.cartesianToCartographic(
      position,
      scratchBVCartographic,
    );

    const latitude = cartographic.latitude;
    const longitude = cartographic.longitude;

    minLat = Math.min(minLat, latitude);
    minLon = Math.min(minLon, longitude);
    maxLat = Math.max(maxLat, latitude);
    maxLon = Math.max(maxLon, longitude);
  }

  const rectangle = scratchBVRectangle;
  rectangle.north = maxLat;
  rectangle.south = minLat;
  rectangle.east = maxLon;
  rectangle.west = minLon;

  return rectangle;
}

function setMinMaxTerrainHeights(primitive, rectangle, ellipsoid) {
  const result = ApproximateTerrainHeights.getMinimumMaximumHeights(
    rectangle,
    ellipsoid,
  );

  primitive._minTerrainHeight = result.minimumTerrainHeight;
  primitive._maxTerrainHeight = result.maximumTerrainHeight;
}

function createBoundingVolume(groundPrimitive, frameState, geometry) {
  const ellipsoid = frameState.mapProjection.ellipsoid;
  const rectangle = getRectangle(frameState, geometry);

  const obb = OrientedBoundingBox.fromRectangle(
    rectangle,
    groundPrimitive._minHeight,
    groundPrimitive._maxHeight,
    ellipsoid,
  );
  groundPrimitive._boundingVolumes.push(obb);

  if (!frameState.scene3DOnly) {
    const projection = frameState.mapProjection;
    const boundingVolume = BoundingSphere.fromRectangleWithHeights2D(
      rectangle,
      projection,
      groundPrimitive._maxHeight,
      groundPrimitive._minHeight,
    );
    Cartesian3.fromElements(
      boundingVolume.center.z,
      boundingVolume.center.x,
      boundingVolume.center.y,
      boundingVolume.center,
    );

    groundPrimitive._boundingVolumes2D.push(boundingVolume);
  }
}

function boundingVolumeIndex(commandIndex, length) {
  return Math.floor((commandIndex % length) / 2);
}

function updateAndQueueRenderCommand(
  groundPrimitive,
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
  debugShowBoundingVolume,
) {
  // Use derived appearance command for 2D if needed
  const classificationPrimitive = groundPrimitive._primitive;
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    command.shaderProgram === classificationPrimitive._spColor &&
    classificationPrimitive._needs2DShader
  ) {
    command = command.derivedCommands.appearance2D;
  }

  command.owner = groundPrimitive;
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;
  command.debugShowBoundingVolume = debugShowBoundingVolume;

  frameState.commandList.push(command);
}

function updateAndQueuePickCommand(
  groundPrimitive,
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
) {
  // Use derived pick command for 2D if needed
  const classificationPrimitive = groundPrimitive._primitive;
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    command.shaderProgram === classificationPrimitive._spPick &&
    classificationPrimitive._needs2DShader
  ) {
    command = command.derivedCommands.pick2D;
  }

  command.owner = groundPrimitive;
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;

  frameState.commandList.push(command);
}

function updateAndQueueCommands(
  groundPrimitive,
  frameState,
  colorCommands,
  pickCommands,
  modelMatrix,
  cull,
  debugShowBoundingVolume,
  twoPasses,
) {
  let boundingVolumes;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingVolumes = groundPrimitive._boundingVolumes;
  } else {
    boundingVolumes = groundPrimitive._boundingVolumes2D;
  }

  const classificationType = groundPrimitive.classificationType;
  const queueTerrainCommands =
    classificationType !== ClassificationType.CESIUM_3D_TILE;
  const queue3DTilesCommands =
    classificationType !== ClassificationType.TERRAIN;

  const passes = frameState.passes;
  const classificationPrimitive = groundPrimitive._primitive;

  let i;
  let boundingVolume;
  let command;

  if (passes.render) {
    const colorLength = colorCommands.length;

    for (i = 0; i < colorLength; ++i) {
      boundingVolume = boundingVolumes[boundingVolumeIndex(i, colorLength)];
      if (queueTerrainCommands) {
        command = colorCommands[i];
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume,
        );
      }
      if (queue3DTilesCommands) {
        command = colorCommands[i].derivedCommands.tileset;
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume,
        );
      }
    }

    if (frameState.invertClassification) {
      const ignoreShowCommands = classificationPrimitive._commandsIgnoreShow;
      const ignoreShowCommandsLength = ignoreShowCommands.length;
      for (i = 0; i < ignoreShowCommandsLength; ++i) {
        boundingVolume = boundingVolumes[i];
        command = ignoreShowCommands[i];
        updateAndQueueRenderCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
          debugShowBoundingVolume,
        );
      }
    }
  }

  if (passes.pick) {
    const pickLength = pickCommands.length;

    let pickOffsets;
    if (!groundPrimitive._useFragmentCulling) {
      // Must be using pick offsets
      pickOffsets = classificationPrimitive._primitive._pickOffsets;
    }
    for (i = 0; i < pickLength; ++i) {
      boundingVolume = boundingVolumes[boundingVolumeIndex(i, pickLength)];
      if (!groundPrimitive._useFragmentCulling) {
        const pickOffset = pickOffsets[boundingVolumeIndex(i, pickLength)];
        boundingVolume = boundingVolumes[pickOffset.index];
      }
      if (queueTerrainCommands) {
        command = pickCommands[i];
        updateAndQueuePickCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
        );
      }
      if (queue3DTilesCommands) {
        command = pickCommands[i].derivedCommands.tileset;
        updateAndQueuePickCommand(
          groundPrimitive,
          command,
          frameState,
          modelMatrix,
          cull,
          boundingVolume,
        );
      }
    }
  }
}

/**
 * 初始化最小和最大地形高度。只有在同步创建 GroundPrimitive 时才需要调用此方法。
 *
 * @returns {Promise<void>} 一旦地形高度加载完成，将解析的 Promise。
 *
 */

GroundPrimitive.initializeTerrainHeights = function () {
  return ApproximateTerrainHeights.initialize();
};

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，以获取渲染此原语所需的绘制命令。
 * <p>
 * 不要直接调用此函数。此文档仅用于列出在渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} 对于同步的 GroundPrimitive，必须调用 GroundPrimitive.initializeTerrainHeights() 并等待返回的 Promise 解析。
 * @exception {DeveloperError} 所有实例几何体必须具有相同的 primitiveType。
 * @exception {DeveloperError} Appearance 和 material 具有相同名称的 uniform。
 */

GroundPrimitive.prototype.update = function (frameState) {
  if (!defined(this._primitive) && !defined(this.geometryInstances)) {
    return;
  }

  if (!ApproximateTerrainHeights.initialized) {
    //>>includeStart('debug', pragmas.debug);
    if (!this.asynchronous) {
      throw new DeveloperError(
        "For synchronous GroundPrimitives, you must call GroundPrimitive.initializeTerrainHeights() and wait for the returned promise to resolve.",
      );
    }
    //>>includeEnd('debug');

    GroundPrimitive.initializeTerrainHeights();
    return;
  }

  const that = this;
  const primitiveOptions = this._classificationPrimitiveOptions;

  if (!defined(this._primitive)) {
    const ellipsoid = frameState.mapProjection.ellipsoid;

    let instance;
    let geometry;
    let instanceType;

    const instances = Array.isArray(this.geometryInstances)
      ? this.geometryInstances
      : [this.geometryInstances];
    const length = instances.length;
    const groundInstances = new Array(length);

    let i;
    let rectangle;
    for (i = 0; i < length; ++i) {
      instance = instances[i];
      geometry = instance.geometry;
      const instanceRectangle = getRectangle(frameState, geometry);
      if (!defined(rectangle)) {
        rectangle = Rectangle.clone(instanceRectangle);
      } else if (defined(instanceRectangle)) {
        Rectangle.union(rectangle, instanceRectangle, rectangle);
      }

      const id = instance.id;
      if (defined(id) && defined(instanceRectangle)) {
        const boundingSphere = ApproximateTerrainHeights.getBoundingSphere(
          instanceRectangle,
          ellipsoid,
        );
        this._boundingSpheresKeys.push(id);
        this._boundingSpheres.push(boundingSphere);
      }

      instanceType = geometry.constructor;
      if (!defined(instanceType) || !defined(instanceType.createShadowVolume)) {
        //>>includeStart('debug', pragmas.debug);
        throw new DeveloperError(
          "Not all of the geometry instances have GroundPrimitive support.",
        );
        //>>includeEnd('debug');
      }
    }

    // Now compute the min/max heights for the primitive
    setMinMaxTerrainHeights(this, rectangle, ellipsoid);
    const exaggeration = frameState.verticalExaggeration;
    const exaggerationRelativeHeight =
      frameState.verticalExaggerationRelativeHeight;
    this._minHeight = VerticalExaggeration.getHeight(
      this._minTerrainHeight,
      exaggeration,
      exaggerationRelativeHeight,
    );
    this._maxHeight = VerticalExaggeration.getHeight(
      this._maxTerrainHeight,
      exaggeration,
      exaggerationRelativeHeight,
    );

    const useFragmentCulling = GroundPrimitive._supportsMaterials(
      frameState.context,
    );
    this._useFragmentCulling = useFragmentCulling;

    if (useFragmentCulling) {
      // Determine whether to add spherical or planar extent attributes for computing texture coordinates.
      // This depends on the size of the GeometryInstances.
      let attributes;
      let usePlanarExtents = true;
      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        rectangle = getRectangle(frameState, geometry);
        if (ShadowVolumeAppearance.shouldUseSphericalCoordinates(rectangle)) {
          usePlanarExtents = false;
          break;
        }
      }

      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        instanceType = geometry.constructor;

        const boundingRectangle = getRectangle(frameState, geometry);
        const textureCoordinateRotationPoints =
          geometry.textureCoordinateRotationPoints;

        if (usePlanarExtents) {
          attributes =
            ShadowVolumeAppearance.getPlanarTextureCoordinateAttributes(
              boundingRectangle,
              textureCoordinateRotationPoints,
              ellipsoid,
              frameState.mapProjection,
              this._maxHeight,
            );
        } else {
          attributes =
            ShadowVolumeAppearance.getSphericalExtentGeometryInstanceAttributes(
              boundingRectangle,
              textureCoordinateRotationPoints,
              ellipsoid,
              frameState.mapProjection,
            );
        }

        const instanceAttributes = instance.attributes;
        for (const attributeKey in instanceAttributes) {
          if (instanceAttributes.hasOwnProperty(attributeKey)) {
            attributes[attributeKey] = instanceAttributes[attributeKey];
          }
        }

        groundInstances[i] = new GeometryInstance({
          geometry: instanceType.createShadowVolume(
            geometry,
            getComputeMinimumHeightFunction(this),
            getComputeMaximumHeightFunction(this),
          ),
          attributes: attributes,
          id: instance.id,
        });
      }
    } else {
      // ClassificationPrimitive will check if the colors are all the same if it detects lack of fragment culling attributes
      for (i = 0; i < length; ++i) {
        instance = instances[i];
        geometry = instance.geometry;
        instanceType = geometry.constructor;
        groundInstances[i] = new GeometryInstance({
          geometry: instanceType.createShadowVolume(
            geometry,
            getComputeMinimumHeightFunction(this),
            getComputeMaximumHeightFunction(this),
          ),
          attributes: instance.attributes,
          id: instance.id,
        });
      }
    }

    primitiveOptions.geometryInstances = groundInstances;
    primitiveOptions.appearance = this.appearance;

    primitiveOptions._createBoundingVolumeFunction = function (
      frameState,
      geometry,
    ) {
      createBoundingVolume(that, frameState, geometry);
    };
    primitiveOptions._updateAndQueueCommandsFunction = function (
      primitive,
      frameState,
      colorCommands,
      pickCommands,
      modelMatrix,
      cull,
      debugShowBoundingVolume,
      twoPasses,
    ) {
      updateAndQueueCommands(
        that,
        frameState,
        colorCommands,
        pickCommands,
        modelMatrix,
        cull,
        debugShowBoundingVolume,
        twoPasses,
      );
    };

    this._primitive = new ClassificationPrimitive(primitiveOptions);
  }

  this._primitive.appearance = this.appearance;
  this._primitive.show = this.show;
  this._primitive.debugShowShadowVolume = this.debugShowShadowVolume;
  this._primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
  this._primitive.update(frameState);

  frameState.afterRender.push(() => {
    if (!this._ready && defined(this._primitive) && this._primitive.ready) {
      this._ready = true;

      if (this.releaseGeometryInstances) {
        this.geometryInstances = undefined;
      }
    }
  });
};

/**
 * @private
 */
GroundPrimitive.prototype.getBoundingSphere = function (id) {
  const index = this._boundingSpheresKeys.indexOf(id);
  if (index !== -1) {
    return this._boundingSpheres[index];
  }

  return undefined;
};

/**
 * 返回 {@link GeometryInstance} 的可修改每实例属性。
 *
 * @param {*} id {@link GeometryInstance} 的 ID。
 * @returns {object} 属性格式中的类型化数组，如果没有与 ID 匹配的实例，则为 undefined。
 *
 * @exception {DeveloperError} 必须在调用 getGeometryInstanceAttributes 之前调用 update。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA);
 * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true);
 */

GroundPrimitive.prototype.getGeometryInstanceAttributes = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(this._primitive)) {
    throw new DeveloperError(
      "must call update before calling getGeometryInstanceAttributes",
    );
  }
  //>>includeEnd('debug');
  return this._primitive.getGeometryInstanceAttributes(id);
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应使用；调用任何其他函数
 * 除 <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则为 <code>true</code>；否则为 <code>false</code>。
 *
 * @see GroundPrimitive#destroy
 */

GroundPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象所持有的 WebGL 资源。销毁对象可以对 WebGL 资源的释放进行确定性管理，
 * 而不是依赖于垃圾回收器来销毁该对象。
 * <p>
 * 一旦对象被销毁，则不应再使用；调用任何其他函数
 * 除 <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如例子中所示。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * e = e && e.destroy();
 *
 * @see GroundPrimitive#isDestroyed
 */
GroundPrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  return destroyObject(this);
};

/**
 * 暴露用于测试。
 *
 * @param {Context} context 渲染上下文
 * @returns {boolean} 当前上下文是否支持 GroundPrimitives 上的材料。
 * @private
 */
GroundPrimitive._supportsMaterials = function (context) {
  return context.depthTexture;
};

/**
 * 检查给定的场景是否支持 GroundPrimitives 上的材料。
 * GroundPrimitives 上的材料需要支持 WEBGL_depth_texture 扩展。
 *
 * @param {Scene} scene 当前场景。
 * @returns {boolean} 当前场景是否支持 GroundPrimitives 上的材料。
 */

GroundPrimitive.supportsMaterials = function (scene) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("scene", scene);
  //>>includeEnd('debug');

  return GroundPrimitive._supportsMaterials(scene.frameState.context);
};
export default GroundPrimitive;
