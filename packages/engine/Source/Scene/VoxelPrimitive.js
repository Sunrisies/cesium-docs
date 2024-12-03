import buildVoxelDrawCommands from "./buildVoxelDrawCommands.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import CesiumMath from "../Core/Math.js";
import Check from "../Core/Check.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import ClippingPlaneCollection from "./ClippingPlaneCollection.js";
import Material from "./Material.js";
import MetadataComponentType from "./MetadataComponentType.js";
import MetadataType from "./MetadataType.js";
import PolylineCollection from "./PolylineCollection.js";
import VoxelShapeType from "./VoxelShapeType.js";
import VoxelTraversal from "./VoxelTraversal.js";
import CustomShader from "./Model/CustomShader.js";
import Cartographic from "../Core/Cartographic.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import VerticalExaggeration from "../Core/VerticalExaggeration.js";

/**
 * 一个渲染来自 {@link VoxelProvider} 的体素数据的原始图元。
 *
 * @alias VoxelPrimitive
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {VoxelProvider} [options.provider] 提供图元所需瓦片数据的体素提供者。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 用于变换图元的模型矩阵。
 * @param {CustomShader} [options.customShader] 用于样式化图元的自定义着色器。
 * @param {Clock} [options.clock] 用于控制时间动态行为的时钟。
 *
 * @see VoxelProvider
 * @see Cesium3DTilesVoxelProvider
 * @see VoxelShapeType
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

function VoxelPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * @type {boolean}
   * @private
   */
  this._ready = false;

  /**
   * @type {VoxelProvider}
   * @private
   */
  this._provider = defaultValue(
    options.provider,
    VoxelPrimitive.DefaultProvider,
  );

  /**
   * 此成员在提供者和形状准备好之前不会创建。
   *
   * @type {VoxelTraversal}
   * @private
   */
  this._traversal = undefined;

  /**
   * 此成员在提供者准备好之前不会创建。
   *
   * @type {VoxelShape}
   * @private
   */
  this._shape = undefined;

  /**
   * @type {boolean}
   * @private
   */
  this._shapeVisible = false;

  /**
   * 此成员在提供者准备好之前不会创建。
   *
   * @type {Cartesian3}
   * @private
   */
  this._paddingBefore = new Cartesian3();

  /**
   * 此成员在提供者准备好之前不会创建。
   *
   * @type {Cartesian3}
   * @private
   */
  this._paddingAfter = new Cartesian3();

  /**
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._minBounds = new Cartesian3();

  /**
   * 用于检测形状是否变脏。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._minBoundsOld = new Cartesian3();

  /**
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._maxBounds = new Cartesian3();

  /**
   * 用于检测形状是否变脏。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._maxBoundsOld = new Cartesian3();

  /**
   * 应用垂直夸张后的最小边界
   *
   * @type {Cartesian3}
   * @private
   */

  this._exaggeratedMinBounds = new Cartesian3();

  /**
   * 用于检测形状是否变脏。
   *
   * @type {Cartesian3}
   * @private
   */
  this._exaggeratedMinBoundsOld = new Cartesian3();

  /**
   * 应用垂直夸张后的最大边界
   *
   * @type {Cartesian3}
   * @private
   */
  this._exaggeratedMaxBounds = new Cartesian3();

  /**
   * 用于检测形状是否变脏。
   *
   * @type {Cartesian3}
   * @private
   */
  this._exaggeratedMaxBoundsOld = new Cartesian3();

  /**
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._minClippingBounds = new Cartesian3();

  /**
   * 用于检测剪切是否变脏。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._minClippingBoundsOld = new Cartesian3();

  /**
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._maxClippingBounds = new Cartesian3();

  /**
   * 用于检测剪切是否变脏。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Cartesian3}
   * @private
   */
  this._maxClippingBoundsOld = new Cartesian3();

  /**
   * 图元上的剪切平面
   *
   * @type {ClippingPlaneCollection}
   * @private
   */
  this._clippingPlanes = undefined;

  /**
   * 跟踪剪切平面何时发生变化
   *
   * @type {number}
   * @private
   */
  this._clippingPlanesState = 0;

  /**
   * 跟踪剪切平面是否启用/禁用
   *
   * @type {boolean}
   * @private
   */
  this._clippingPlanesEnabled = false;

  /**
   * 图元的模型矩阵。
   *
   * @type {Matrix4}
   * @private
   */

  this._modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );

  /**
   * 应用垂直夸张后的模型矩阵。仅用于 BOX 形状类型。
   *
   * @type {Matrix4}
   * @private
   */
  this._exaggeratedModelMatrix = Matrix4.clone(this._modelMatrix);

  /**
   * 图元的模型矩阵与提供者的模型矩阵相乘。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Matrix4}
   * @private
   */
  this._compoundModelMatrix = new Matrix4();

  /**
   * 用于检测形状是否变脏。
   * 此成员在提供者准备好之前未知。
   *
   * @type {Matrix4}
   * @private
   */

  this._compoundModelMatrixOld = new Matrix4();

  /**
   * @type {CustomShader}
   * @private
   */
  this._customShader = defaultValue(
    options.customShader,
    VoxelPrimitive.DefaultCustomShader,
  );

  /**
   * @type {Event}
   * @private
   */
  this._customShaderCompilationEvent = new Event();

  /**
   * @type {boolean}
   * @private
   */
  this._shaderDirty = true;

  /**
   * @type {DrawCommand}
   * @private
   */
  this._drawCommand = undefined;

  /**
   * @type {DrawCommand}
   * @private
   */
  this._drawCommandPick = undefined;

  /**
   * @type {object}
   * @private
   */
  this._pickId = undefined;

  /**
   * @type {Clock}
   * @private
   */
  this._clock = options.clock;

  // Transforms and other values that are computed when the shape changes

  /**
   * @type {Matrix4}
   * @private
   */
  this._transformPositionWorldToUv = new Matrix4();

  /**
   * @type {Matrix4}
   * @private
   */
  this._transformPositionUvToWorld = new Matrix4();

  /**
   * @type {Matrix3}
   * @private
   */
  this._transformDirectionWorldToLocal = new Matrix3();

  /**
   * @type {Matrix3}
   * @private
   */
  this._transformNormalLocalToWorld = new Matrix3();

  // Rendering
  /**
   * @type {boolean}
   * @private
   */
  this._nearestSampling = false;

  /**
   * @type {number}
   * @private
   */
  this._levelBlendFactor = 0.0;

  /**
   * @type {number}
   * @private
   */
  this._stepSizeMultiplier = 1.0;

  /**
   * @type {boolean}
   * @private
   */
  this._depthTest = true;

  /**
   * @type {boolean}
   * @private
   */
  this._useLogDepth = undefined;

  /**
   * @type {number}
   * @private
   */
  this._screenSpaceError = 4.0; // in pixels

  // Debug / statistics
  /**
   * @type {PolylineCollection}
   * @private
   */
  this._debugPolylines = new PolylineCollection();

  /**
   * @type {boolean}
   * @private
   */
  this._debugDraw = false;

  /**
   * @type {boolean}
   * @private
   */
  this._disableRender = false;

  /**
   * @type {boolean}
   * @private
   */
  this._disableUpdate = false;

  /**
   * @type {Object<string, any>}
   * @private
   */
  this._uniforms = {
    octreeInternalNodeTexture: undefined,
    octreeInternalNodeTilesPerRow: 0,
    octreeInternalNodeTexelSizeUv: new Cartesian2(),
    octreeLeafNodeTexture: undefined,
    octreeLeafNodeTilesPerRow: 0,
    octreeLeafNodeTexelSizeUv: new Cartesian2(),
    megatextureTextures: [],
    megatextureSliceDimensions: new Cartesian2(),
    megatextureTileDimensions: new Cartesian2(),
    megatextureVoxelSizeUv: new Cartesian2(),
    megatextureSliceSizeUv: new Cartesian2(),
    megatextureTileSizeUv: new Cartesian2(),
    dimensions: new Cartesian3(),
    paddingBefore: new Cartesian3(),
    paddingAfter: new Cartesian3(),
    transformPositionViewToUv: new Matrix4(),
    transformPositionUvToView: new Matrix4(),
    transformDirectionViewToLocal: new Matrix3(),
    transformNormalLocalToWorld: new Matrix3(),
    cameraPositionUv: new Cartesian3(),
    ndcSpaceAxisAlignedBoundingBox: new Cartesian4(),
    clippingPlanesTexture: undefined,
    clippingPlanesMatrix: new Matrix4(),
    stepSize: 0,
    pickColor: new Color(),
  };

/**
   * 来自上一次形状更新的形状特定着色器定义。用于检测是否需要重建着色器。
   * @type {Object<string, any>}
   * @private
   */
  this._shapeDefinesOld = {};

  /**
   * 将统一变量名称映射到返回统一值的函数。
   * @type {Object<string, function():any>}
   * @private
   */

  this._uniformMap = {};

  const uniforms = this._uniforms;
  const uniformMap = this._uniformMap;
  for (const key in uniforms) {
    if (uniforms.hasOwnProperty(key)) {
      const name = `u_${key}`;
      uniformMap[name] = function () {
        return uniforms[key];
      };
    }
  }

  // If the provider fails to initialize the primitive will fail too.
  const provider = this._provider;
  initialize(this, provider);
}

function initialize(primitive, provider) {
  // Set the bounds
  const {
    shape: shapeType,
    minBounds = VoxelShapeType.getMinBounds(shapeType),
    maxBounds = VoxelShapeType.getMaxBounds(shapeType),
  } = provider;

  primitive.minBounds = minBounds;
  primitive.maxBounds = maxBounds;
  primitive.minClippingBounds = VoxelShapeType.getMinBounds(shapeType);
  primitive.maxClippingBounds = VoxelShapeType.getMaxBounds(shapeType);

  // Initialize the exaggerated versions of bounds and model matrix
  primitive._exaggeratedMinBounds = Cartesian3.clone(
    primitive._minBounds,
    primitive._exaggeratedMinBounds,
  );
  primitive._exaggeratedMaxBounds = Cartesian3.clone(
    primitive._maxBounds,
    primitive._exaggeratedMaxBounds,
  );
  primitive._exaggeratedModelMatrix = Matrix4.clone(
    primitive._modelMatrix,
    primitive._exaggeratedModelMatrix,
  );

  checkTransformAndBounds(primitive, provider);

  // Create the shape object, and update it so it is valid for VoxelTraversal
  const ShapeConstructor = VoxelShapeType.getShapeConstructor(shapeType);
  primitive._shape = new ShapeConstructor();
  primitive._shapeVisible = updateShapeAndTransforms(
    primitive,
    primitive._shape,
    provider,
  );
}

Object.defineProperties(VoxelPrimitive.prototype, {
/**
   * 获取一个值，指示图元是否准备好使用。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 获取与该图元关联的 {@link VoxelProvider}。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {VoxelProvider}
   * @readonly
   */
  provider: {
    get: function () {
      return this._provider;
    },
  },

  /**
   * 获取包围球。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {BoundingSphere}
   * @readonly
   */
  boundingSphere: {
    get: function () {
      return this._shape.boundingSphere;
    },
  },

  /**
   * 获取有向包围盒。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {OrientedBoundingBox}
   * @readonly
   */
  orientedBoundingBox: {
    get: function () {
      return this._shape.orientedBoundingBox;
    },
  },

  /**
   * 获取模型矩阵。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Matrix4}
   * @readonly
   */
  modelMatrix: {
    get: function () {
      return this._modelMatrix;
    },
    set: function (modelMatrix) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("modelMatrix", modelMatrix);
      //>>includeEnd('debug');

      this._modelMatrix = Matrix4.clone(modelMatrix, this._modelMatrix);
    },
  },

  /**
   * 获取形状类型。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {VoxelShapeType}
   * @readonly
   */
  shape: {
    get: function () {
      return this._provider.shape;
    },
  },

  /**
   * 获取体素的维度。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Cartesian3}
   * @readonly
   */
  dimensions: {
    get: function () {
      return this._provider.dimensions;
    },
  },

  /**
   * 获取每个通道的体素数据的最小值。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {number[][]}
   * @readonly
   */
  minimumValues: {
    get: function () {
      return this._provider.minimumValues;
    },
  },

  /**
   * 获取每个通道的体素数据的最大值。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {number[][]}
   * @readonly
   */

  maximumValues: {
    get: function () {
      return this._provider.maximumValues;
    },
  },

/**
   * 获取或设置该图元是否应显示。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return !this._disableRender;
    },
    set: function (show) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("show", show);
      //>>includeEnd('debug');

      this._disableRender = !show;
    },
  },

  /**
   * 获取或设置当视图变化时图元是否应更新。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   */
  disableUpdate: {
    get: function () {
      return this._disableUpdate;
    },
    set: function (disableUpdate) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("disableUpdate", disableUpdate);
      //>>includeEnd('debug');

      this._disableUpdate = disableUpdate;
    },
  },

  /**
   * 获取或设置是否渲染调试可视化。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   */
  debugDraw: {
    get: function () {
      return this._debugDraw;
    },
    set: function (debugDraw) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("debugDraw", debugDraw);
      //>>includeEnd('debug');

      this._debugDraw = debugDraw;
    },
  },

  /**
   * 获取或设置渲染时是否进行深度测试。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   */
  depthTest: {
    get: function () {
      return this._depthTest;
    },
    set: function (depthTest) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("depthTest", depthTest);
      //>>includeEnd('debug');

      if (this._depthTest !== depthTest) {
        this._depthTest = depthTest;
        this._shaderDirty = true;
      }
    },
  },

  /**
   * 获取或设置最近采样。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {boolean}
   */
  nearestSampling: {
    get: function () {
      return this._nearestSampling;
    },
    set: function (nearestSampling) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("nearestSampling", nearestSampling);
      //>>includeEnd('debug');

      if (this._nearestSampling !== nearestSampling) {
        this._nearestSampling = nearestSampling;
        this._shaderDirty = true;
      }
    },
  },

  /**
   * 控制在不同级别之间融合的速度。
   * 0.0 意味着瞬间弹出。
   * 1.0 意味着完全线性融合。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {number}
   * @private
   */
  levelBlendFactor: {
    get: function () {
      return this._levelBlendFactor;
    },
    set: function (levelBlendFactor) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("levelBlendFactor", levelBlendFactor);
      //>>includeEnd('debug');

      this._levelBlendFactor = CesiumMath.clamp(levelBlendFactor, 0.0, 1.0);
    },
  },

  /**
   * 获取或设置屏幕空间误差（以像素为单位）。
   * 如果体素的屏幕空间尺寸大于屏幕空间误差，则该瓦片被细分。
   * 较低的屏幕空间误差对应更高的细节渲染，但可能导致性能下降和内存消耗增加。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {number}
   */
  screenSpaceError: {
    get: function () {
      return this._screenSpaceError;
    },
    set: function (screenSpaceError) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("screenSpaceError", screenSpaceError);
      //>>includeEnd('debug');

      this._screenSpaceError = screenSpaceError;
    },
  },

  /**
   * 获取或设置在光线行进过程中使用的步长倍增器。
   * 值越低，渲染质量越高，但性能也越差。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {number}
   */
  stepSize: {
    get: function () {
      return this._stepSizeMultiplier;
    },
    set: function (stepSize) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("stepSize", stepSize);
      //>>includeEnd('debug');

      this._stepSizeMultiplier = stepSize;
    },
  },

  /**
   * 获取或设置在形状本地坐标系统中的最小边界。
   * 体素数据被拉伸或压缩以适应边界。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Cartesian3}
   */
  minBounds: {
    get: function () {
      return this._minBounds;
    },
    set: function (minBounds) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("minBounds", minBounds);
      //>>includeEnd('debug');

      this._minBounds = Cartesian3.clone(minBounds, this._minBounds);
    },
  },

  /**
   * 获取或设置在形状本地坐标系统中的最大边界。
   * 体素数据被拉伸或压缩以适应边界。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Cartesian3}
   */

  maxBounds: {
    get: function () {
      return this._maxBounds;
    },
    set: function (maxBounds) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("maxBounds", maxBounds);
      //>>includeEnd('debug');

      this._maxBounds = Cartesian3.clone(maxBounds, this._maxBounds);
    },
  },

  /**
   * 获取或设置在形状本地坐标系统中的最小剪切位置。
   * 超出该范围的任何体素内容都会被剪切。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Cartesian3}
   */

  minClippingBounds: {
    get: function () {
      return this._minClippingBounds;
    },
    set: function (minClippingBounds) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("minClippingBounds", minClippingBounds);
      //>>includeEnd('debug');

      this._minClippingBounds = Cartesian3.clone(
        minClippingBounds,
        this._minClippingBounds,
      );
    },
  },

  /**
   * 获取或设置在形状本地坐标系统中的最大剪切位置。
   * 超出该范围的任何体素内容都会被剪切。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Cartesian3}
   */
  maxClippingBounds: {
    get: function () {
      return this._maxClippingBounds;
    },
    set: function (maxClippingBounds) {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("maxClippingBounds", maxClippingBounds);
      //>>includeEnd('debug');

      this._maxClippingBounds = Cartesian3.clone(
        maxClippingBounds,
        this._maxClippingBounds,
      );
    },
  },

  /**
   * 用于选择性禁用图元渲染的 {@link ClippingPlaneCollection}。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._clippingPlanes;
    },
    set: function (clippingPlanes) {
      // 不需要检查未定义，因为它在 setOwner 函数中处理
      ClippingPlaneCollection.setOwner(clippingPlanes, this, "_clippingPlanes");
    },
  },

  /**
   * 获取或设置自定义着色器。如果未定义，则设置为 {@link VoxelPrimitive.DefaultCustomShader}。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {CustomShader}
   */

  customShader: {
    get: function () {
      return this._customShader;
    },
    set: function (customShader) {
      if (this._customShader !== customShader) {
        // Delete old custom shader entries from the uniform map
        const uniformMap = this._uniformMap;
        const oldCustomShader = this._customShader;
        const oldCustomShaderUniformMap = oldCustomShader.uniformMap;
        for (const uniformName in oldCustomShaderUniformMap) {
          if (oldCustomShaderUniformMap.hasOwnProperty(uniformName)) {
            // If the custom shader was set but the voxel shader was never
            // built, the custom shader uniforms wouldn't have been added to
            // the uniform map. But it doesn't matter because the delete
            // operator ignores if the key doesn't exist.
            delete uniformMap[uniformName];
          }
        }

        if (!defined(customShader)) {
          this._customShader = VoxelPrimitive.DefaultCustomShader;
        } else {
          this._customShader = customShader;
        }
        this._shaderDirty = true;
      }
    },
  },

  /**
   * 获取一个事件，每当自定义着色器编译时会触发该事件。
   *
   * @memberof VoxelPrimitive.prototype
   * @type {Event}
   * @readonly
   */

  customShaderCompilationEvent: {
    get: function () {
      return this._customShaderCompilationEvent;
    },
  },
});

const scratchDimensions = new Cartesian3();
const scratchIntersect = new Cartesian4();
const scratchNdcAabb = new Cartesian4();
const scratchScale = new Cartesian3();
const scratchLocalScale = new Cartesian3();
const scratchRotation = new Matrix3();
const scratchRotationAndLocalScale = new Matrix3();
const scratchTransformPositionWorldToLocal = new Matrix4();
const scratchTransformPositionLocalToWorld = new Matrix4();
const scratchTransformPositionLocalToProjection = new Matrix4();

const transformPositionLocalToUv = Matrix4.fromRotationTranslation(
  Matrix3.fromUniformScale(0.5, new Matrix3()),
  new Cartesian3(0.5, 0.5, 0.5),
  new Matrix4(),
);
const transformPositionUvToLocal = Matrix4.fromRotationTranslation(
  Matrix3.fromUniformScale(2.0, new Matrix3()),
  new Cartesian3(-1.0, -1.0, -1.0),
  new Matrix4(),
);

/**
 * 更新体素图元。
 *
 * @param {FrameState} frameState
 * @private
 */

VoxelPrimitive.prototype.update = function (frameState) {
  const provider = this._provider;

  // Update the custom shader in case it has texture uniforms.
  this._customShader.update(frameState);

  // Initialize from the ready provider. This only happens once.
  const context = frameState.context;
  if (!this._ready) {
    initFromProvider(this, provider, context);
    // Set the primitive as ready after the first frame render since the user might set up events subscribed to
    // the post render event, and the primitive may not be ready for those past the first frame.
    frameState.afterRender.push(() => {
      this._ready = true;
      return true;
    });

    // Don't render until the next frame after ready is set to true
    return;
  }

  updateVerticalExaggeration(this, frameState);

  // Check if the shape is dirty before updating it. This needs to happen every
  // frame because the member variables can be modified externally via the
  // getters.
  const shapeDirty = checkTransformAndBounds(this, provider);
  const shape = this._shape;
  if (shapeDirty) {
    this._shapeVisible = updateShapeAndTransforms(this, shape, provider);
    if (checkShapeDefines(this, shape)) {
      this._shaderDirty = true;
    }
  }
  if (!this._shapeVisible) {
    return;
  }

  // Update the traversal and prepare for rendering.
  const keyframeLocation = getKeyframeLocation(
    provider.timeIntervalCollection,
    this._clock,
  );

  const traversal = this._traversal;
  const sampleCountOld = traversal._sampleCount;

  traversal.update(
    frameState,
    keyframeLocation,
    shapeDirty, // recomputeBoundingVolumes
    this._disableUpdate, // pauseUpdate
  );

  if (sampleCountOld !== traversal._sampleCount) {
    this._shaderDirty = true;
  }

  if (!traversal.isRenderable(traversal.rootNode)) {
    return;
  }

  if (this._debugDraw) {
    // Debug draw bounding boxes and other things. Must go after traversal update
    // because that's what updates the tile bounding boxes.
    debugDraw(this, frameState);
  }

  if (this._disableRender) {
    return;
  }

  // Check if log depth changed
  if (this._useLogDepth !== frameState.useLogDepth) {
    this._useLogDepth = frameState.useLogDepth;
    this._shaderDirty = true;
  }

  // Check if clipping planes changed
  const clippingPlanesChanged = updateClippingPlanes(this, frameState);
  if (clippingPlanesChanged) {
    this._shaderDirty = true;
  }

  const leafNodeTexture = traversal.leafNodeTexture;
  const uniforms = this._uniforms;
  if (defined(leafNodeTexture)) {
    uniforms.octreeLeafNodeTexture = traversal.leafNodeTexture;
    uniforms.octreeLeafNodeTexelSizeUv = Cartesian2.clone(
      traversal.leafNodeTexelSizeUv,
      uniforms.octreeLeafNodeTexelSizeUv,
    );
    uniforms.octreeLeafNodeTilesPerRow = traversal.leafNodeTilesPerRow;
  }

  // Rebuild shaders
  if (this._shaderDirty) {
    buildVoxelDrawCommands(this, context);
    this._shaderDirty = false;
  }

  // Calculate the NDC-space AABB to "scissor" the fullscreen quad
  const transformPositionWorldToProjection =
    context.uniformState.viewProjection;
  const orientedBoundingBox = shape.orientedBoundingBox;
  const ndcAabb = orientedBoundingBoxToNdcAabb(
    orientedBoundingBox,
    transformPositionWorldToProjection,
    scratchNdcAabb,
  );

  // If the object is offscreen, don't render it.
  const offscreen =
    ndcAabb.x === +1.0 ||
    ndcAabb.y === +1.0 ||
    ndcAabb.z === -1.0 ||
    ndcAabb.w === -1.0;
  if (offscreen) {
    return;
  }

  // Prepare to render: update uniforms that can change every frame
  // Using a uniform instead of going through RenderState's scissor because the viewport is not accessible here, and the scissor command needs pixel coordinates.
  uniforms.ndcSpaceAxisAlignedBoundingBox = Cartesian4.clone(
    ndcAabb,
    uniforms.ndcSpaceAxisAlignedBoundingBox,
  );
  const transformPositionViewToWorld = context.uniformState.inverseView;
  uniforms.transformPositionViewToUv = Matrix4.multiplyTransformation(
    this._transformPositionWorldToUv,
    transformPositionViewToWorld,
    uniforms.transformPositionViewToUv,
  );
  const transformPositionWorldToView = context.uniformState.view;
  uniforms.transformPositionUvToView = Matrix4.multiplyTransformation(
    transformPositionWorldToView,
    this._transformPositionUvToWorld,
    uniforms.transformPositionUvToView,
  );
  const transformDirectionViewToWorld =
    context.uniformState.inverseViewRotation;
  uniforms.transformDirectionViewToLocal = Matrix3.multiply(
    this._transformDirectionWorldToLocal,
    transformDirectionViewToWorld,
    uniforms.transformDirectionViewToLocal,
  );
  uniforms.transformNormalLocalToWorld = Matrix3.clone(
    this._transformNormalLocalToWorld,
    uniforms.transformNormalLocalToWorld,
  );
  const cameraPositionWorld = frameState.camera.positionWC;
  uniforms.cameraPositionUv = Matrix4.multiplyByPoint(
    this._transformPositionWorldToUv,
    cameraPositionWorld,
    uniforms.cameraPositionUv,
  );
  uniforms.stepSize = this._stepSizeMultiplier;

  // Render the primitive
  const command = frameState.passes.pick
    ? this._drawCommandPick
    : frameState.passes.pickVoxel
      ? this._drawCommandPickVoxel
      : this._drawCommand;
  command.boundingVolume = shape.boundingSphere;
  frameState.commandList.push(command);
};

const scratchExaggerationScale = new Cartesian3();
const scratchExaggerationCenter = new Cartesian3();
const scratchCartographicCenter = new Cartographic();
const scratchExaggerationTranslation = new Cartesian3();

/**
 * 更新图元的夸张边界以考虑垂直夸张
 * 目前仅适用于椭球形状类型
 * @param {VoxelPrimitive} primitive
 * @param {FrameState} frameState
 * @private
 */

function updateVerticalExaggeration(primitive, frameState) {
  primitive._exaggeratedMinBounds = Cartesian3.clone(
    primitive._minBounds,
    primitive._exaggeratedMinBounds,
  );
  primitive._exaggeratedMaxBounds = Cartesian3.clone(
    primitive._maxBounds,
    primitive._exaggeratedMaxBounds,
  );

  if (primitive.shape === VoxelShapeType.ELLIPSOID) {
    // Apply the exaggeration by stretching the height bounds
    const relativeHeight = frameState.verticalExaggerationRelativeHeight;
    const exaggeration = frameState.verticalExaggeration;
    primitive._exaggeratedMinBounds.z =
      (primitive._minBounds.z - relativeHeight) * exaggeration + relativeHeight;
    primitive._exaggeratedMaxBounds.z =
      (primitive._maxBounds.z - relativeHeight) * exaggeration + relativeHeight;
  } else if (primitive.shape === VoxelShapeType.BOX) {
    // Apply the exaggeration via the model matrix
    const exaggerationScale = Cartesian3.fromElements(
      1.0,
      1.0,
      frameState.verticalExaggeration,
      scratchExaggerationScale,
    );
    primitive._exaggeratedModelMatrix = Matrix4.multiplyByScale(
      primitive._modelMatrix,
      exaggerationScale,
      primitive._exaggeratedModelMatrix,
    );
    primitive._exaggeratedModelMatrix = Matrix4.multiplyByTranslation(
      primitive._exaggeratedModelMatrix,
      computeBoxExaggerationTranslation(primitive, frameState),
      primitive._exaggeratedModelMatrix,
    );
  }
}

function computeBoxExaggerationTranslation(primitive, frameState) {
  // Compute translation based on box center, relative height, and exaggeration
  const {
    shapeTransform = Matrix4.IDENTITY,
    globalTransform = Matrix4.IDENTITY,
  } = primitive._provider;

  // Find the Cartesian position of the center of the OBB
  const initialCenter = Matrix4.getTranslation(
    shapeTransform,
    scratchExaggerationCenter,
  );
  const intermediateCenter = Matrix4.multiplyByPoint(
    primitive._modelMatrix,
    initialCenter,
    scratchExaggerationCenter,
  );
  const transformedCenter = Matrix4.multiplyByPoint(
    globalTransform,
    intermediateCenter,
    scratchExaggerationCenter,
  );

  // Find the cartographic height
  const ellipsoid = Ellipsoid.WGS84;
  const centerCartographic = ellipsoid.cartesianToCartographic(
    transformedCenter,
    scratchCartographicCenter,
  );

  let centerHeight = 0.0;
  if (defined(centerCartographic)) {
    centerHeight = centerCartographic.height;
  }

  // Find the shift that will put the center in the right position relative
  // to relativeHeight, after it is scaled by verticalExaggeration
  const exaggeratedHeight = VerticalExaggeration.getHeight(
    centerHeight,
    frameState.verticalExaggeration,
    frameState.verticalExaggerationRelativeHeight,
  );

  return Cartesian3.fromElements(
    0.0,
    0.0,
    (exaggeratedHeight - centerHeight) / frameState.verticalExaggeration,
    scratchExaggerationTranslation,
  );
}

/**
 * 初始化源自体素提供者的图元属性
 * @param {VoxelPrimitive} primitive
 * @param {VoxelProvider} provider
 * @param {Context} context
 * @private
 */

function initFromProvider(primitive, provider, context) {
  const uniforms = primitive._uniforms;

  primitive._pickId = context.createPickId({ primitive });
  uniforms.pickColor = Color.clone(primitive._pickId.color, uniforms.pickColor);

  const { shaderDefines, shaderUniforms: shapeUniforms } = primitive._shape;
  primitive._shapeDefinesOld = clone(shaderDefines, true);

  // Add shape uniforms to the uniform map
  const uniformMap = primitive._uniformMap;
  for (const key in shapeUniforms) {
    if (shapeUniforms.hasOwnProperty(key)) {
      const name = `u_${key}`;

      //>>includeStart('debug', pragmas.debug);
      if (defined(uniformMap[name])) {
        oneTimeWarning(
          `VoxelPrimitive: Uniform name "${name}" is already defined`,
        );
      }
      //>>includeEnd('debug');

      uniformMap[name] = function () {
        return shapeUniforms[key];
      };
    }
  }

  // Set uniforms that come from the provider.
  // Note that minBounds and maxBounds can be set dynamically, so their uniforms aren't set here.
  uniforms.dimensions = Cartesian3.clone(
    provider.dimensions,
    uniforms.dimensions,
  );
  primitive._paddingBefore = Cartesian3.clone(
    defaultValue(provider.paddingBefore, Cartesian3.ZERO),
    primitive._paddingBefore,
  );
  uniforms.paddingBefore = Cartesian3.clone(
    primitive._paddingBefore,
    uniforms.paddingBefore,
  );
  primitive._paddingAfter = Cartesian3.clone(
    defaultValue(provider.paddingAfter, Cartesian3.ZERO),
    primitive._paddingBefore,
  );
  uniforms.paddingAfter = Cartesian3.clone(
    primitive._paddingAfter,
    uniforms.paddingAfter,
  );

  // Create the VoxelTraversal, and set related uniforms
  primitive._traversal = setupTraversal(primitive, provider, context);
  setTraversalUniforms(primitive._traversal, uniforms);
}

/**
 * 跟踪提供者变换和图元边界的变化
 * @param {VoxelPrimitive} primitive
 * @param {VoxelProvider} provider
 * @returns {boolean} 变换或边界是否发生变化
 * @private
 */

function checkTransformAndBounds(primitive, provider) {
  const shapeTransform = defaultValue(
    provider.shapeTransform,
    Matrix4.IDENTITY,
  );
  const globalTransform = defaultValue(
    provider.globalTransform,
    Matrix4.IDENTITY,
  );

  // Compound model matrix = global transform * model matrix * shape transform
  Matrix4.multiplyTransformation(
    globalTransform,
    primitive._exaggeratedModelMatrix,
    primitive._compoundModelMatrix,
  );
  Matrix4.multiplyTransformation(
    primitive._compoundModelMatrix,
    shapeTransform,
    primitive._compoundModelMatrix,
  );
  const numChanges =
    updateBound(primitive, "_compoundModelMatrix", "_compoundModelMatrixOld") +
    updateBound(primitive, "_minBounds", "_minBoundsOld") +
    updateBound(primitive, "_maxBounds", "_maxBoundsOld") +
    updateBound(
      primitive,
      "_exaggeratedMinBounds",
      "_exaggeratedMinBoundsOld",
    ) +
    updateBound(
      primitive,
      "_exaggeratedMaxBounds",
      "_exaggeratedMaxBoundsOld",
    ) +
    updateBound(primitive, "_minClippingBounds", "_minClippingBoundsOld") +
    updateBound(primitive, "_maxClippingBounds", "_maxClippingBoundsOld");
  return numChanges > 0;
}

/**
 * 比较边界的旧值和新值，并在不同的情况下更新旧值。
 * @param {VoxelPrimitive} primitive 拥有边界属性的图元
 * @param {string} newBoundKey 指向类型为 Cartesian3 或 Matrix4 的边界属性的键
 * @param {string} oldBoundKey 指向与 newBoundKey 相同类型的边界属性的键
 * @returns {number} 如果边界值发生变化则返回 1，否则返回 0
 *
 * @private
 */

function updateBound(primitive, newBoundKey, oldBoundKey) {
  const newBound = primitive[newBoundKey];
  const oldBound = primitive[oldBoundKey];

  const changed = !newBound.equals(oldBound);
  if (changed) {
    newBound.clone(oldBound);
  }
  return changed ? 1 : 0;
}

/**
 * 更新形状和相关变换
 * @param {VoxelPrimitive} primitive
 * @param {VoxelShape} shape
 * @param {VoxelProvider} provider
 * @returns {boolean} 如果形状可见则返回 true
 * @private
 */

function updateShapeAndTransforms(primitive, shape, provider) {
  const visible = shape.update(
    primitive._compoundModelMatrix,
    primitive._exaggeratedMinBounds,
    primitive._exaggeratedMaxBounds,
    primitive.minClippingBounds,
    primitive.maxClippingBounds,
  );
  if (!visible) {
    return false;
  }

  const transformPositionLocalToWorld = shape.shapeTransform;
  const transformPositionWorldToLocal = Matrix4.inverse(
    transformPositionLocalToWorld,
    scratchTransformPositionWorldToLocal,
  );
  const rotation = Matrix4.getRotation(
    transformPositionLocalToWorld,
    scratchRotation,
  );
  // Note that inverse(rotation) is the same as transpose(rotation)
  const scale = Matrix4.getScale(transformPositionLocalToWorld, scratchScale);
  const maximumScaleComponent = Cartesian3.maximumComponent(scale);
  const localScale = Cartesian3.divideByScalar(
    scale,
    maximumScaleComponent,
    scratchLocalScale,
  );
  const rotationAndLocalScale = Matrix3.multiplyByScale(
    rotation,
    localScale,
    scratchRotationAndLocalScale,
  );

  // Set member variables when the shape is dirty
  primitive._transformPositionWorldToUv = Matrix4.multiplyTransformation(
    transformPositionLocalToUv,
    transformPositionWorldToLocal,
    primitive._transformPositionWorldToUv,
  );
  primitive._transformPositionUvToWorld = Matrix4.multiplyTransformation(
    transformPositionLocalToWorld,
    transformPositionUvToLocal,
    primitive._transformPositionUvToWorld,
  );
  primitive._transformDirectionWorldToLocal = Matrix4.getMatrix3(
    transformPositionWorldToLocal,
    primitive._transformDirectionWorldToLocal,
  );
  primitive._transformNormalLocalToWorld = Matrix3.inverseTranspose(
    rotationAndLocalScale,
    primitive._transformNormalLocalToWorld,
  );

  return true;
}

/**
 * 基于图元和提供者的维度和类型设置一个 VoxelTraversal
 * @param {VoxelPrimitive} primitive
 * @param {VoxelProvider} provider
 * @param {Context} context
 * @returns {VoxelTraversal}
 * @private
 */

function setupTraversal(primitive, provider, context) {
  const dimensions = Cartesian3.clone(provider.dimensions, scratchDimensions);
  Cartesian3.add(dimensions, primitive._paddingBefore, dimensions);
  Cartesian3.add(dimensions, primitive._paddingAfter, dimensions);

  // It's ok for memory byte length to be undefined.
  // The system will choose a default memory size.
  const maximumTileCount = provider.maximumTileCount;
  const maximumTextureMemoryByteLength = defined(maximumTileCount)
    ? VoxelTraversal.getApproximateTextureMemoryByteLength(
        maximumTileCount,
        dimensions,
        provider.types,
        provider.componentTypes,
      )
    : undefined;

  const keyframeCount = defaultValue(provider.keyframeCount, 1);

  return new VoxelTraversal(
    primitive,
    context,
    dimensions,
    provider.types,
    provider.componentTypes,
    keyframeCount,
    maximumTextureMemoryByteLength,
  );
}

/**
 * 设置来自遍历的统一变量。
 * @param {VoxelTraversal} traversal
 * @param {object} uniforms
 * @private
 */

function setTraversalUniforms(traversal, uniforms) {
  uniforms.octreeInternalNodeTexture = traversal.internalNodeTexture;
  uniforms.octreeInternalNodeTexelSizeUv = Cartesian2.clone(
    traversal.internalNodeTexelSizeUv,
    uniforms.octreeInternalNodeTexelSizeUv,
  );
  uniforms.octreeInternalNodeTilesPerRow = traversal.internalNodeTilesPerRow;

  const megatextures = traversal.megatextures;
  const megatexture = megatextures[0];
  const megatextureLength = megatextures.length;
  uniforms.megatextureTextures = new Array(megatextureLength);
  for (let i = 0; i < megatextureLength; i++) {
    uniforms.megatextureTextures[i] = megatextures[i].texture;
  }

  uniforms.megatextureSliceDimensions = Cartesian2.clone(
    megatexture.sliceCountPerRegion,
    uniforms.megatextureSliceDimensions,
  );
  uniforms.megatextureTileDimensions = Cartesian2.clone(
    megatexture.regionCountPerMegatexture,
    uniforms.megatextureTileDimensions,
  );
  uniforms.megatextureVoxelSizeUv = Cartesian2.clone(
    megatexture.voxelSizeUv,
    uniforms.megatextureVoxelSizeUv,
  );
  uniforms.megatextureSliceSizeUv = Cartesian2.clone(
    megatexture.sliceSizeUv,
    uniforms.megatextureSliceSizeUv,
  );
  uniforms.megatextureTileSizeUv = Cartesian2.clone(
    megatexture.regionSizeUv,
    uniforms.megatextureTileSizeUv,
  );
}

/**
 * 跟踪与形状相关的着色器定义的变化
 * @param {VoxelPrimitive} primitive
 * @param {VoxelShape} shape
 * @returns {boolean} 如果任何形状定义发生变化，需要重建着色器则返回 true
 * @private
 */
function checkShapeDefines(primitive, shape) {
  const shapeDefines = shape.shaderDefines;
  const shapeDefinesChanged = Object.keys(shapeDefines).some(
    (key) => shapeDefines[key] !== primitive._shapeDefinesOld[key],
  );
  if (shapeDefinesChanged) {
    primitive._shapeDefinesOld = clone(shapeDefines, true);
  }
  return shapeDefinesChanged;
}

/**
 * 找到用于渲染的关键帧位置。可以不是一个整数。
 * @param {TimeIntervalCollection} timeIntervalCollection
 * @param {Clock} clock
 * @returns {number}
 *
 * @private
 */

function getKeyframeLocation(timeIntervalCollection, clock) {
  if (!defined(timeIntervalCollection) || !defined(clock)) {
    return 0.0;
  }
  let date = clock.currentTime;
  let timeInterval;
  let timeIntervalIndex = timeIntervalCollection.indexOf(date);
  if (timeIntervalIndex >= 0) {
    timeInterval = timeIntervalCollection.get(timeIntervalIndex);
  } else {
    // Date fell outside the range
    timeIntervalIndex = ~timeIntervalIndex;
    if (timeIntervalIndex === timeIntervalCollection.length) {
      // Date past range
      timeIntervalIndex = timeIntervalCollection.length - 1;
      timeInterval = timeIntervalCollection.get(timeIntervalIndex);
      date = timeInterval.stop;
    } else {
      // Date before range
      timeInterval = timeIntervalCollection.get(timeIntervalIndex);
      date = timeInterval.start;
    }
  }
  // De-lerp between the start and end of the interval
  const totalSeconds = JulianDate.secondsDifference(
    timeInterval.stop,
    timeInterval.start,
  );
  const secondsDifferenceStart = JulianDate.secondsDifference(
    date,
    timeInterval.start,
  );
  const t = secondsDifferenceStart / totalSeconds;

  return timeIntervalIndex + t;
}

/**
 * 更新剪切平面的状态及相关的统一变量
 *
 * @param {VoxelPrimitive} primitive
 * @param {FrameState} frameState
 * @returns {boolean} 是否剪切平面发生变化，需重建着色器
 * @private
 */

function updateClippingPlanes(primitive, frameState) {
  const clippingPlanes = primitive.clippingPlanes;
  if (!defined(clippingPlanes)) {
    return false;
  }

  clippingPlanes.update(frameState);

  const { clippingPlanesState, enabled } = clippingPlanes;

  if (enabled) {
    const uniforms = primitive._uniforms;
    uniforms.clippingPlanesTexture = clippingPlanes.texture;

    // Compute the clipping plane's transformation to uv space and then take the inverse
    // transpose to properly transform the hessian normal form of the plane.

    // transpose(inverse(worldToUv * clippingPlaneLocalToWorld))
    // transpose(inverse(clippingPlaneLocalToWorld) * inverse(worldToUv))
    // transpose(inverse(clippingPlaneLocalToWorld) * uvToWorld)

    uniforms.clippingPlanesMatrix = Matrix4.transpose(
      Matrix4.multiplyTransformation(
        Matrix4.inverse(
          clippingPlanes.modelMatrix,
          uniforms.clippingPlanesMatrix,
        ),
        primitive._transformPositionUvToWorld,
        uniforms.clippingPlanesMatrix,
      ),
      uniforms.clippingPlanesMatrix,
    );
  }

  if (
    primitive._clippingPlanesState === clippingPlanesState &&
    primitive._clippingPlanesEnabled === enabled
  ) {
    return false;
  }
  primitive._clippingPlanesState = clippingPlanesState;
  primitive._clippingPlanesEnabled = enabled;

  return true;
}

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} <code>true</code> 如果此对象已被销毁；否则，<code>false</code>。
 *
 * @see VoxelPrimitive#destroy
 */
VoxelPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象可以确定性地释放 WebGL 资源，而不用依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应再使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 按照示例中的做法将返回值 (<code>undefined</code>) 赋值给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see VoxelPrimitive#isDestroyed
 *
 * @example
 * voxelPrimitive = voxelPrimitive && voxelPrimitive.destroy();
 */

VoxelPrimitive.prototype.destroy = function () {
  const drawCommand = this._drawCommand;
  if (defined(drawCommand)) {
    drawCommand.shaderProgram =
      drawCommand.shaderProgram && drawCommand.shaderProgram.destroy();
  }
  const drawCommandPick = this._drawCommandPick;
  if (defined(drawCommandPick)) {
    drawCommandPick.shaderProgram =
      drawCommandPick.shaderProgram && drawCommandPick.shaderProgram.destroy();
  }

  this._pickId = this._pickId && this._pickId.destroy();
  this._traversal = this._traversal && this._traversal.destroy();
  this._clippingPlanes = this._clippingPlanes && this._clippingPlanes.destroy();

  return destroyObject(this);
};

const corners = new Array(
  new Cartesian4(-1.0, -1.0, -1.0, 1.0),
  new Cartesian4(+1.0, -1.0, -1.0, 1.0),
  new Cartesian4(-1.0, +1.0, -1.0, 1.0),
  new Cartesian4(+1.0, +1.0, -1.0, 1.0),
  new Cartesian4(-1.0, -1.0, +1.0, 1.0),
  new Cartesian4(+1.0, -1.0, +1.0, 1.0),
  new Cartesian4(-1.0, +1.0, +1.0, 1.0),
  new Cartesian4(+1.0, +1.0, +1.0, 1.0),
);
const vertexNeighborIndices = new Array(
  1,
  2,
  4,
  0,
  3,
  5,
  0,
  3,
  6,
  1,
  2,
  7,
  0,
  5,
  6,
  1,
  4,
  7,
  2,
  4,
  7,
  3,
  5,
  6,
);

const scratchCornersClipSpace = new Array(
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
  new Cartesian4(),
);

/**
 * 将有向包围盒的所有 8 个顶点投影到 NDC 空间，并找到结果的 NDC 轴对齐包围盒。为了避免投影在近平面后面的顶点，它使用每个顶点的边与近平面的交点作为 AABB 计算的一部分。此操作在透视除法之前在裁剪空间中完成。
 *
 * @function
 *
 * @param {OrientedBoundingBox} orientedBoundingBox
 * @param {Matrix4} worldToProjection
 * @param {Cartesian4} result
 * @returns {Cartesian4}
 *
 * @private
 */

function orientedBoundingBoxToNdcAabb(
  orientedBoundingBox,
  worldToProjection,
  result,
) {
  const transformPositionLocalToWorld = Matrix4.fromRotationTranslation(
    orientedBoundingBox.halfAxes,
    orientedBoundingBox.center,
    scratchTransformPositionLocalToWorld,
  );
  const transformPositionLocalToProjection = Matrix4.multiply(
    worldToProjection,
    transformPositionLocalToWorld,
    scratchTransformPositionLocalToProjection,
  );

  let ndcMinX = +Number.MAX_VALUE;
  let ndcMaxX = -Number.MAX_VALUE;
  let ndcMinY = +Number.MAX_VALUE;
  let ndcMaxY = -Number.MAX_VALUE;
  let cornerIndex;

  // Convert all points to clip space
  const cornersClipSpace = scratchCornersClipSpace;
  const cornersLength = corners.length;
  for (cornerIndex = 0; cornerIndex < cornersLength; cornerIndex++) {
    Matrix4.multiplyByVector(
      transformPositionLocalToProjection,
      corners[cornerIndex],
      cornersClipSpace[cornerIndex],
    );
  }

  for (cornerIndex = 0; cornerIndex < cornersLength; cornerIndex++) {
    const position = cornersClipSpace[cornerIndex];
    if (position.z >= -position.w) {
      // Position is past near plane, so there's no need to clip.
      const ndcX = position.x / position.w;
      const ndcY = position.y / position.w;
      ndcMinX = Math.min(ndcMinX, ndcX);
      ndcMaxX = Math.max(ndcMaxX, ndcX);
      ndcMinY = Math.min(ndcMinY, ndcY);
      ndcMaxY = Math.max(ndcMaxY, ndcY);
    } else {
      for (let neighborIndex = 0; neighborIndex < 3; neighborIndex++) {
        const neighborVertexIndex =
          vertexNeighborIndices[cornerIndex * 3 + neighborIndex];
        const neighborPosition = cornersClipSpace[neighborVertexIndex];
        if (neighborPosition.z >= -neighborPosition.w) {
          // Position is behind the near plane and neighbor is after, so get intersection point on the near plane.
          const distanceToPlaneFromPosition = position.z + position.w;
          const distanceToPlaneFromNeighbor =
            neighborPosition.z + neighborPosition.w;
          const t =
            distanceToPlaneFromPosition /
            (distanceToPlaneFromPosition - distanceToPlaneFromNeighbor);

          const intersect = Cartesian4.lerp(
            position,
            neighborPosition,
            t,
            scratchIntersect,
          );
          const intersectNdcX = intersect.x / intersect.w;
          const intersectNdcY = intersect.y / intersect.w;
          ndcMinX = Math.min(ndcMinX, intersectNdcX);
          ndcMaxX = Math.max(ndcMaxX, intersectNdcX);
          ndcMinY = Math.min(ndcMinY, intersectNdcY);
          ndcMaxY = Math.max(ndcMaxY, intersectNdcY);
        }
      }
    }
  }

  // Clamp the NDC values to -1 to +1 range even if they extend much further.
  ndcMinX = CesiumMath.clamp(ndcMinX, -1.0, +1.0);
  ndcMinY = CesiumMath.clamp(ndcMinY, -1.0, +1.0);
  ndcMaxX = CesiumMath.clamp(ndcMaxX, -1.0, +1.0);
  ndcMaxY = CesiumMath.clamp(ndcMaxY, -1.0, +1.0);
  result = Cartesian4.fromElements(ndcMinX, ndcMinY, ndcMaxX, ndcMaxY, result);

  return result;
}

const polylineAxisDistance = 30000000.0;
const polylineXAxis = new Cartesian3(polylineAxisDistance, 0.0, 0.0);
const polylineYAxis = new Cartesian3(0.0, polylineAxisDistance, 0.0);
const polylineZAxis = new Cartesian3(0.0, 0.0, polylineAxisDistance);

/**
 * 绘制瓦片的包围盒和坐标轴。
 *
 * @function
 *
 * @param {VoxelPrimitive} that
 * @param {FrameState} frameState
 *
 * @private
 */

function debugDraw(that, frameState) {
  const traversal = that._traversal;
  const polylines = that._debugPolylines;
  polylines.removeAll();

  function makePolylineLineSegment(startPos, endPos, color, thickness) {
    polylines.add({
      positions: [startPos, endPos],
      width: thickness,
      material: Material.fromType("Color", {
        color: color,
      }),
    });
  }

  function makePolylineBox(orientedBoundingBox, color, thickness) {
    // Normally would want to use a scratch variable to store the corners, but
    // polylines don't clone the positions.
    const corners = orientedBoundingBox.computeCorners();
    makePolylineLineSegment(corners[0], corners[1], color, thickness);
    makePolylineLineSegment(corners[2], corners[3], color, thickness);
    makePolylineLineSegment(corners[4], corners[5], color, thickness);
    makePolylineLineSegment(corners[6], corners[7], color, thickness);
    makePolylineLineSegment(corners[0], corners[2], color, thickness);
    makePolylineLineSegment(corners[4], corners[6], color, thickness);
    makePolylineLineSegment(corners[1], corners[3], color, thickness);
    makePolylineLineSegment(corners[5], corners[7], color, thickness);
    makePolylineLineSegment(corners[0], corners[4], color, thickness);
    makePolylineLineSegment(corners[2], corners[6], color, thickness);
    makePolylineLineSegment(corners[1], corners[5], color, thickness);
    makePolylineLineSegment(corners[3], corners[7], color, thickness);
  }

  function drawTile(tile) {
    if (!traversal.isRenderable(tile)) {
      return;
    }

    const level = tile.level;
    const startThickness = 5.0;
    const thickness = Math.max(1.0, startThickness / Math.pow(2.0, level));
    const colors = [Color.RED, Color.LIME, Color.BLUE];
    const color = colors[level % 3];

    makePolylineBox(tile.orientedBoundingBox, color, thickness);

    if (defined(tile.children)) {
      for (let i = 0; i < 8; i++) {
        drawTile(tile.children[i]);
      }
    }
  }

  makePolylineBox(that._shape.orientedBoundingBox, Color.WHITE, 5.0);

  drawTile(traversal.rootNode);

  const axisThickness = 10.0;
  makePolylineLineSegment(
    Cartesian3.ZERO,
    polylineXAxis,
    Color.RED,
    axisThickness,
  );
  makePolylineLineSegment(
    Cartesian3.ZERO,
    polylineYAxis,
    Color.LIME,
    axisThickness,
  );
  makePolylineLineSegment(
    Cartesian3.ZERO,
    polylineZAxis,
    Color.BLUE,
    axisThickness,
  );

  polylines.update(frameState);
}

/**
 * 图元使用的默认自定义着色器。
 *
 * @type {CustomShader}
 * @constant
 * @readonly
 *
 * @private
 */

VoxelPrimitive.DefaultCustomShader = new CustomShader({
  fragmentShaderText: `void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material)
{
    material.diffuse = vec3(1.0);
    material.alpha = 1.0;
}`,
});

function DefaultVoxelProvider() {
  this.ready = true;
  this.shape = VoxelShapeType.BOX;
  this.dimensions = new Cartesian3(1, 1, 1);
  this.names = ["data"];
  this.types = [MetadataType.SCALAR];
  this.componentTypes = [MetadataComponentType.FLOAT32];
  this.maximumTileCount = 1;
}

DefaultVoxelProvider.prototype.requestData = function (options) {
  const tileLevel = defined(options) ? defaultValue(options.tileLevel, 0) : 0;
  if (tileLevel >= 1) {
    return undefined;
  }

  return Promise.resolve([new Float32Array(1)]);
};

VoxelPrimitive.DefaultProvider = new DefaultVoxelProvider();

export default VoxelPrimitive;
