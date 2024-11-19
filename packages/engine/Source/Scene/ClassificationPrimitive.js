import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import combine from "../Core/combine.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import ShadowVolumeAppearanceVS from "../Shaders/ShadowVolumeAppearanceVS.js";
import ShadowVolumeFS from "../Shaders/ShadowVolumeFS.js";
import BlendingState from "./BlendingState.js";
import ClassificationType from "./ClassificationType.js";
import DepthFunction from "./DepthFunction.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Primitive from "./Primitive.js";
import SceneMode from "./SceneMode.js";
import ShadowVolumeAppearance from "./ShadowVolumeAppearance.js";
import StencilConstants from "./StencilConstants.js";
import StencilFunction from "./StencilFunction.js";
import StencilOperation from "./StencilOperation.js";

/**
 * 分类原语表示包围 {@link Scene} 中要高亮显示的几何体的体积。
 * <p>
 * 原语将几何体实例与描述完整着色的 {@link Appearance} 结合在一起，包括
 * {@link Material} 和 {@link RenderState}。大致上，几何体实例定义了结构和位置，
 * 而外观定义了视觉特征。将几何体和外观解耦允许我们混合
 * 和匹配大多数原语，并独立添加新的几何体或外观。
 * 目前，直接使用 ClassificationPrimitive 时，仅支持具有相同颜色的
 * {@link PerInstanceColorAppearance}。
 * 要在分类地形或 3D Tiles 时获得完整的 {@link Appearance} 支持，请使用 {@link GroundPrimitive}。
 * </p>
 * <p>
 * 为了正确渲染，此功能需要 EXT_frag_depth WebGL 扩展。对于不支持此扩展的硬件， 
 * 在某些观察角度下会出现渲染伪影。
 * </p>
 * <p>
 * 有效的几何体包含 {@link BoxGeometry}、{@link CylinderGeometry}、{@link EllipsoidGeometry}、{@link PolylineVolumeGeometry} 和 {@link SphereGeometry}。
 * </p>
 * <p>
 * 跟随椭球体表面的几何体，如 {@link CircleGeometry}、{@link CorridorGeometry}、{@link EllipseGeometry}、{@link PolygonGeometry} 和 {@link RectangleGeometry}，
 * 也有效，如果它们是挤出的体积；否则，它们将不被渲染。
 * </p>
 *
 * @alias ClassificationPrimitive
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {Array|GeometryInstance} [options.geometryInstances] 要渲染的几何体实例。这可以是单个实例或长度为一的数组。
 * @param {Appearance} [options.appearance] 用于渲染原语的外观。当几何体实例具有颜色属性时，默认为 PerInstanceColorAppearance。
 * @param {boolean} [options.show=true] 确定该原语是否将被显示。
 * @param {boolean} [options.vertexCacheOptimize=false] 当 <code>true</code> 时，几何体顶点针对顶点着色器前后缓存进行了优化。
 * @param {boolean} [options.interleave=false] 当 <code>true</code> 时，几何体顶点属性是交错的，这可以稍微提高渲染性能，但会增加加载时间。
 * @param {boolean} [options.compressVertices=true] 当 <code>true</code> 时，几何体顶点被压缩，这将节省内存。
 * @param {boolean} [options.releaseGeometryInstances=true] 当 <code>true</code> 时，该原语不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
 * @param {boolean} [options.allowPicking=true] 当 <code>true</code> 时，每个几何体实例仅可通过 {@link Scene#pick} 进行拾取。当 <code>false</code> 时，将节省 GPU 内存。
 * @param {boolean} [options.asynchronous=true] 确定该原语是异步创建还是阻塞直到准备就绪。如果为 false，必须先调用 initializeTerrainHeights()。
 * @param {ClassificationType} [options.classificationType=ClassificationType.BOTH] 确定地形、3D Tiles 或两者都将被分类。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示该原语的命令的包围球。
 * @param {boolean} [options.debugShowShadowVolume=false] 仅用于调试。确定是否绘制原语中每个几何体的阴影体。必须在创建时设置为 <code>true</code>，以便在几何体释放之前创建体积，或者 options.releaseGeometryInstance 必须为 <code>false</code>。
 *
 * @see Primitive
 * @see GroundPrimitive
 * @see GeometryInstance
 * @see Appearance
 */

function ClassificationPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const geometryInstances = options.geometryInstances;

  /**
   * 与该原语一起渲染的几何体实例。如果在构造原语时
   * <code>options.releaseGeometryInstances</code> 为 <code>true</code>
   * 则可能为 <code>undefined</code>。
   * <p>
   * 在原语渲染后更改此属性将无效。
   * </p>
   * <p>
   * 由于使用的渲染技术，所有几何体实例必须具有相同的颜色。
   * 如果存在颜色不同的实例，将在第一次尝试渲染时抛出
   * <code>DeveloperError</code>。
   * </p>
   *
   * @readonly
   * @type {Array|GeometryInstance}
   *
   * @default undefined
   */

  this.geometryInstances = geometryInstances;
  /**
   * 确定该原语是否将被显示。这会影响原语中的所有几何体实例。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.show = defaultValue(options.show, true);
  /**
   * 确定地形、3D Tiles 或两者都会被分类。
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
   * 此属性仅用于调试；不用于生产环境，也未经过优化。
   * <p>
   * 绘制原语中每个绘制命令的包围球。
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
   * 此属性仅用于调试；不用于生产环境，也未经过优化。
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
  this._debugShowShadowVolume = false;

  // These are used by GroundPrimitive to augment the shader and uniform map.
  this._extruded = defaultValue(options._extruded, false);
  this._uniformMap = options._uniformMap;

  this._sp = undefined;
  this._spStencil = undefined;
  this._spPick = undefined;
  this._spColor = undefined;

  this._spPick2D = undefined; // only derived if necessary
  this._spColor2D = undefined; // only derived if necessary

  this._rsStencilDepthPass = undefined;
  this._rsStencilDepthPass3DTiles = undefined;
  this._rsColorPass = undefined;
  this._rsPickPass = undefined;

  this._commandsIgnoreShow = [];

  this._ready = false;
  this._primitive = undefined;
  this._pickPrimitive = options._pickPrimitive;

  // Set in update
  this._hasSphericalExtentsAttribute = false;
  this._hasPlanarExtentsAttributes = false;
  this._hasPerColorAttribute = false;

  this.appearance = options.appearance;

  this._createBoundingVolumeFunction = options._createBoundingVolumeFunction;
  this._updateAndQueueCommandsFunction =
    options._updateAndQueueCommandsFunction;

  this._usePickOffsets = false;

  this._primitiveOptions = {
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
    _createRenderStatesFunction: undefined,
    _createShaderProgramFunction: undefined,
    _createCommandsFunction: undefined,
    _updateAndQueueCommandsFunction: undefined,
    _createPickOffsets: true,
  };
}

Object.defineProperties(ClassificationPrimitive.prototype, {
  /**
   * 当 <code>true</code> 时，几何体顶点针对顶点着色器前后缓存进行了优化。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  vertexCacheOptimize: {
    get: function () {
      return this._primitiveOptions.vertexCacheOptimize;
    },
  },

  /**
   * 确定几何体顶点属性是否是交错的，这可以稍微提高渲染性能。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  interleave: {
    get: function () {
      return this._primitiveOptions.interleave;
    },
  },

  /**
   * 当 <code>true</code> 时，该原语不会保留对输入 <code>geometryInstances</code> 的引用以节省内存。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */

  releaseGeometryInstances: {
    get: function () {
      return this._primitiveOptions.releaseGeometryInstances;
    },
  },

  /**
   * 当 <code>true</code> 时，每个几何体实例仅可通过 {@link Scene#pick} 进行拾取。当 <code>false</code> 时，将节省 GPU 内存。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  allowPicking: {
    get: function () {
      return this._primitiveOptions.allowPicking;
    },
  },

  /**
   * 确定几何体实例是否将在 Web Worker 中创建和批处理。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  asynchronous: {
    get: function () {
      return this._primitiveOptions.asynchronous;
    },
  },

  /**
   * 当 <code>true</code> 时，几何体顶点被压缩，这将节省内存。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  compressVertices: {
    get: function () {
      return this._primitiveOptions.compressVertices;
    },
  },

  /**
   * 确定原语是否完整并准备好进行渲染。如果此属性为
   * true，则将在下次调用 {@link ClassificationPrimitive#update} 时渲染原语。
   *
   * @memberof ClassificationPrimitive.prototype
   *
   * @type {boolean}
   * @readonly
   */

  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 如果 ClassificationPrimitive 需要单独的着色器和 2D 命令，则返回 true。
   * 这是因为 ClassificationPrimitive 上的纹理坐标计算方式不同，
   * 并且在将多个 GeometryInstances 批处理到一个 ClassificationPrimitive 时用于剔除。
   * @memberof ClassificationPrimitive.prototype
   * @type {boolean}
   * @readonly
   * @private
   */

  _needs2DShader: {
    get: function () {
      return (
        this._hasPlanarExtentsAttributes || this._hasSphericalExtentsAttribute
      );
    },
  },
});

/**
 * 确定是否支持 ClassificationPrimitive 渲染。
 *
 * @param {Scene} scene 场景。
 * @returns {boolean} 如果支持 ClassificationPrimitives 则返回 <code>true</code>；否则返回 <code>false</code>
 */

ClassificationPrimitive.isSupported = function (scene) {
  return scene.context.stencilBuffer;
};

function getStencilDepthRenderState(enableStencil, mask3DTiles) {
  const stencilFunction = mask3DTiles
    ? StencilFunction.EQUAL
    : StencilFunction.ALWAYS;
  return {
    colorMask: {
      red: false,
      green: false,
      blue: false,
      alpha: false,
    },
    stencilTest: {
      enabled: enableStencil,
      frontFunction: stencilFunction,
      frontOperation: {
        fail: StencilOperation.KEEP,
        zFail: StencilOperation.DECREMENT_WRAP,
        zPass: StencilOperation.KEEP,
      },
      backFunction: stencilFunction,
      backOperation: {
        fail: StencilOperation.KEEP,
        zFail: StencilOperation.INCREMENT_WRAP,
        zPass: StencilOperation.KEEP,
      },
      reference: StencilConstants.CESIUM_3D_TILE_MASK,
      mask: StencilConstants.CESIUM_3D_TILE_MASK,
    },
    stencilMask: StencilConstants.CLASSIFICATION_MASK,
    depthTest: {
      enabled: true,
      func: DepthFunction.LESS_OR_EQUAL,
    },
    depthMask: false,
  };
}

function getColorRenderState(enableStencil) {
  return {
    stencilTest: {
      enabled: enableStencil,
      frontFunction: StencilFunction.NOT_EQUAL,
      frontOperation: {
        fail: StencilOperation.ZERO,
        zFail: StencilOperation.ZERO,
        zPass: StencilOperation.ZERO,
      },
      backFunction: StencilFunction.NOT_EQUAL,
      backOperation: {
        fail: StencilOperation.ZERO,
        zFail: StencilOperation.ZERO,
        zPass: StencilOperation.ZERO,
      },
      reference: 0,
      mask: StencilConstants.CLASSIFICATION_MASK,
    },
    stencilMask: StencilConstants.CLASSIFICATION_MASK,
    depthTest: {
      enabled: false,
    },
    depthMask: false,
    blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND,
  };
}

const pickRenderState = {
  stencilTest: {
    enabled: true,
    frontFunction: StencilFunction.NOT_EQUAL,
    frontOperation: {
      fail: StencilOperation.ZERO,
      zFail: StencilOperation.ZERO,
      zPass: StencilOperation.ZERO,
    },
    backFunction: StencilFunction.NOT_EQUAL,
    backOperation: {
      fail: StencilOperation.ZERO,
      zFail: StencilOperation.ZERO,
      zPass: StencilOperation.ZERO,
    },
    reference: 0,
    mask: StencilConstants.CLASSIFICATION_MASK,
  },
  stencilMask: StencilConstants.CLASSIFICATION_MASK,
  depthTest: {
    enabled: false,
  },
  depthMask: false,
};

function createRenderStates(
  classificationPrimitive,
  context,
  appearance,
  twoPasses,
) {
  if (defined(classificationPrimitive._rsStencilDepthPass)) {
    return;
  }
  const stencilEnabled = !classificationPrimitive.debugShowShadowVolume;

  classificationPrimitive._rsStencilDepthPass = RenderState.fromCache(
    getStencilDepthRenderState(stencilEnabled, false),
  );
  classificationPrimitive._rsStencilDepthPass3DTiles = RenderState.fromCache(
    getStencilDepthRenderState(stencilEnabled, true),
  );
  classificationPrimitive._rsColorPass = RenderState.fromCache(
    getColorRenderState(stencilEnabled, false),
  );
  classificationPrimitive._rsPickPass = RenderState.fromCache(pickRenderState);
}

function modifyForEncodedNormals(primitive, vertexShaderSource) {
  if (!primitive.compressVertices) {
    return vertexShaderSource;
  }

  if (vertexShaderSource.search(/in\s+vec3\s+extrudeDirection;/g) !== -1) {
    const attributeName = "compressedAttributes";

    //only shadow volumes use extrudeDirection, and shadow volumes use vertexFormat: POSITION_ONLY so we don't need to check other attributes
    const attributeDecl = `in vec2 ${attributeName};`;

    const globalDecl = "vec3 extrudeDirection;\n";
    const decode = `    extrudeDirection = czm_octDecode(${attributeName}, 65535.0);\n`;

    let modifiedVS = vertexShaderSource;
    modifiedVS = modifiedVS.replace(/in\s+vec3\s+extrudeDirection;/g, "");
    modifiedVS = ShaderSource.replaceMain(
      modifiedVS,
      "czm_non_compressed_main",
    );
    const compressedMain =
      `${"void main() \n" + "{ \n"}${decode}    czm_non_compressed_main(); \n` +
      `}`;

    return [attributeDecl, globalDecl, modifiedVS, compressedMain].join("\n");
  }
}

function createShaderProgram(classificationPrimitive, frameState) {
  const context = frameState.context;
  const primitive = classificationPrimitive._primitive;
  let vs = ShadowVolumeAppearanceVS;
  vs =
    classificationPrimitive._primitive._batchTable.getVertexShaderCallback()(
      vs,
    );
  vs = Primitive._appendDistanceDisplayConditionToShader(primitive, vs);
  vs = Primitive._modifyShaderPosition(
    classificationPrimitive,
    vs,
    frameState.scene3DOnly,
  );
  vs = Primitive._updateColorAttribute(primitive, vs);

  const planarExtents = classificationPrimitive._hasPlanarExtentsAttributes;
  const cullFragmentsUsingExtents =
    planarExtents || classificationPrimitive._hasSphericalExtentsAttribute;

  if (classificationPrimitive._extruded) {
    vs = modifyForEncodedNormals(primitive, vs);
  }

  const extrudedDefine = classificationPrimitive._extruded
    ? "EXTRUDED_GEOMETRY"
    : "";

  let vsSource = new ShaderSource({
    defines: [extrudedDefine],
    sources: [vs],
  });
  const fsSource = new ShaderSource({
    sources: [ShadowVolumeFS],
  });
  const attributeLocations =
    classificationPrimitive._primitive._attributeLocations;

  const shadowVolumeAppearance = new ShadowVolumeAppearance(
    cullFragmentsUsingExtents,
    planarExtents,
    classificationPrimitive.appearance,
  );

  classificationPrimitive._spStencil = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: classificationPrimitive._spStencil,
    vertexShaderSource: vsSource,
    fragmentShaderSource: fsSource,
    attributeLocations: attributeLocations,
  });

  if (classificationPrimitive._primitive.allowPicking) {
    let vsPick = ShaderSource.createPickVertexShaderSource(vs);
    vsPick = Primitive._appendShowToShader(primitive, vsPick);
    vsPick = Primitive._updatePickColorAttribute(vsPick);

    const pickFS3D = shadowVolumeAppearance.createPickFragmentShader(false);
    const pickVS3D = shadowVolumeAppearance.createPickVertexShader(
      [extrudedDefine],
      vsPick,
      false,
      frameState.mapProjection,
    );

    classificationPrimitive._spPick = ShaderProgram.replaceCache({
      context: context,
      shaderProgram: classificationPrimitive._spPick,
      vertexShaderSource: pickVS3D,
      fragmentShaderSource: pickFS3D,
      attributeLocations: attributeLocations,
    });

    // Derive a 2D pick shader if the primitive uses texture coordinate-based fragment culling,
    // since texture coordinates are computed differently in 2D.
    if (cullFragmentsUsingExtents) {
      let pickProgram2D = context.shaderCache.getDerivedShaderProgram(
        classificationPrimitive._spPick,
        "2dPick",
      );
      if (!defined(pickProgram2D)) {
        const pickFS2D = shadowVolumeAppearance.createPickFragmentShader(true);
        const pickVS2D = shadowVolumeAppearance.createPickVertexShader(
          [extrudedDefine],
          vsPick,
          true,
          frameState.mapProjection,
        );

        pickProgram2D = context.shaderCache.createDerivedShaderProgram(
          classificationPrimitive._spPick,
          "2dPick",
          {
            vertexShaderSource: pickVS2D,
            fragmentShaderSource: pickFS2D,
            attributeLocations: attributeLocations,
          },
        );
      }
      classificationPrimitive._spPick2D = pickProgram2D;
    }
  } else {
    classificationPrimitive._spPick = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vsSource,
      fragmentShaderSource: fsSource,
      attributeLocations: attributeLocations,
    });
  }

  vs = Primitive._appendShowToShader(primitive, vs);
  vsSource = new ShaderSource({
    defines: [extrudedDefine],
    sources: [vs],
  });

  classificationPrimitive._sp = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: classificationPrimitive._sp,
    vertexShaderSource: vsSource,
    fragmentShaderSource: fsSource,
    attributeLocations: attributeLocations,
  });

  // Create a fragment shader that computes only required material hookups using screen space techniques
  const fsColorSource = shadowVolumeAppearance.createFragmentShader(false);
  const vsColorSource = shadowVolumeAppearance.createVertexShader(
    [extrudedDefine],
    vs,
    false,
    frameState.mapProjection,
  );

  classificationPrimitive._spColor = ShaderProgram.replaceCache({
    context: context,
    shaderProgram: classificationPrimitive._spColor,
    vertexShaderSource: vsColorSource,
    fragmentShaderSource: fsColorSource,
    attributeLocations: attributeLocations,
  });

  // Derive a 2D shader if the primitive uses texture coordinate-based fragment culling,
  // since texture coordinates are computed differently in 2D.
  // Any material that uses texture coordinates will also equip texture coordinate-based fragment culling.
  if (cullFragmentsUsingExtents) {
    let colorProgram2D = context.shaderCache.getDerivedShaderProgram(
      classificationPrimitive._spColor,
      "2dColor",
    );
    if (!defined(colorProgram2D)) {
      const fsColorSource2D = shadowVolumeAppearance.createFragmentShader(true);
      const vsColorSource2D = shadowVolumeAppearance.createVertexShader(
        [extrudedDefine],
        vs,
        true,
        frameState.mapProjection,
      );

      colorProgram2D = context.shaderCache.createDerivedShaderProgram(
        classificationPrimitive._spColor,
        "2dColor",
        {
          vertexShaderSource: vsColorSource2D,
          fragmentShaderSource: fsColorSource2D,
          attributeLocations: attributeLocations,
        },
      );
    }
    classificationPrimitive._spColor2D = colorProgram2D;
  }
}

function createColorCommands(classificationPrimitive, colorCommands) {
  const primitive = classificationPrimitive._primitive;
  let length = primitive._va.length * 2; // each geometry (pack of vertex attributes) needs 2 commands: front/back stencils and fill
  colorCommands.length = length;

  let i;
  let command;
  let derivedCommand;
  let vaIndex = 0;
  let uniformMap = primitive._batchTable.getUniformMapCallback()(
    classificationPrimitive._uniformMap,
  );

  const needs2DShader = classificationPrimitive._needs2DShader;

  for (i = 0; i < length; i += 2) {
    const vertexArray = primitive._va[vaIndex++];

    // Stencil depth command
    command = colorCommands[i];
    if (!defined(command)) {
      command = colorCommands[i] = new DrawCommand({
        owner: classificationPrimitive,
        primitiveType: primitive._primitiveType,
      });
    }

    command.vertexArray = vertexArray;
    command.renderState = classificationPrimitive._rsStencilDepthPass;
    command.shaderProgram = classificationPrimitive._sp;
    command.uniformMap = uniformMap;
    command.pass = Pass.TERRAIN_CLASSIFICATION;

    derivedCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.tileset,
    );
    derivedCommand.renderState =
      classificationPrimitive._rsStencilDepthPass3DTiles;
    derivedCommand.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION;
    command.derivedCommands.tileset = derivedCommand;

    // Color command
    command = colorCommands[i + 1];
    if (!defined(command)) {
      command = colorCommands[i + 1] = new DrawCommand({
        owner: classificationPrimitive,
        primitiveType: primitive._primitiveType,
      });
    }

    command.vertexArray = vertexArray;
    command.renderState = classificationPrimitive._rsColorPass;
    command.shaderProgram = classificationPrimitive._spColor;
    command.pass = Pass.TERRAIN_CLASSIFICATION;

    const appearance = classificationPrimitive.appearance;
    const material = appearance.material;
    if (defined(material)) {
      uniformMap = combine(uniformMap, material._uniforms);
    }

    command.uniformMap = uniformMap;

    derivedCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.tileset,
    );
    derivedCommand.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION;
    command.derivedCommands.tileset = derivedCommand;

    // Derive for 2D if texture coordinates are ever computed
    if (needs2DShader) {
      // First derive from the terrain command
      let derived2DCommand = DrawCommand.shallowClone(
        command,
        command.derivedCommands.appearance2D,
      );
      derived2DCommand.shaderProgram = classificationPrimitive._spColor2D;
      command.derivedCommands.appearance2D = derived2DCommand;

      // Then derive from the 3D Tiles command
      derived2DCommand = DrawCommand.shallowClone(
        derivedCommand,
        derivedCommand.derivedCommands.appearance2D,
      );
      derived2DCommand.shaderProgram = classificationPrimitive._spColor2D;
      derivedCommand.derivedCommands.appearance2D = derived2DCommand;
    }
  }

  const commandsIgnoreShow = classificationPrimitive._commandsIgnoreShow;
  const spStencil = classificationPrimitive._spStencil;

  let commandIndex = 0;
  length = commandsIgnoreShow.length = length / 2;

  for (let j = 0; j < length; ++j) {
    const commandIgnoreShow = (commandsIgnoreShow[j] = DrawCommand.shallowClone(
      colorCommands[commandIndex],
      commandsIgnoreShow[j],
    ));
    commandIgnoreShow.shaderProgram = spStencil;
    commandIgnoreShow.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION_IGNORE_SHOW;

    commandIndex += 2;
  }
}

function createPickCommands(classificationPrimitive, pickCommands) {
  const usePickOffsets = classificationPrimitive._usePickOffsets;

  const primitive = classificationPrimitive._primitive;
  let length = primitive._va.length * 2; // each geometry (pack of vertex attributes) needs 2 commands: front/back stencils and fill

  // Fallback for batching same-color geometry instances
  let pickOffsets;
  let pickIndex = 0;
  let pickOffset;
  if (usePickOffsets) {
    pickOffsets = primitive._pickOffsets;
    length = pickOffsets.length * 2;
  }

  pickCommands.length = length;

  let j;
  let command;
  let derivedCommand;
  let vaIndex = 0;
  const uniformMap = primitive._batchTable.getUniformMapCallback()(
    classificationPrimitive._uniformMap,
  );

  const needs2DShader = classificationPrimitive._needs2DShader;

  for (j = 0; j < length; j += 2) {
    let vertexArray = primitive._va[vaIndex++];
    if (usePickOffsets) {
      pickOffset = pickOffsets[pickIndex++];
      vertexArray = primitive._va[pickOffset.index];
    }

    // Stencil depth command
    command = pickCommands[j];
    if (!defined(command)) {
      command = pickCommands[j] = new DrawCommand({
        owner: classificationPrimitive,
        primitiveType: primitive._primitiveType,
        pickOnly: true,
      });
    }

    command.vertexArray = vertexArray;
    command.renderState = classificationPrimitive._rsStencilDepthPass;
    command.shaderProgram = classificationPrimitive._sp;
    command.uniformMap = uniformMap;
    command.pass = Pass.TERRAIN_CLASSIFICATION;
    if (usePickOffsets) {
      command.offset = pickOffset.offset;
      command.count = pickOffset.count;
    }

    // Derive for 3D Tiles classification
    derivedCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.tileset,
    );
    derivedCommand.renderState =
      classificationPrimitive._rsStencilDepthPass3DTiles;
    derivedCommand.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION;
    command.derivedCommands.tileset = derivedCommand;

    // Pick color command
    command = pickCommands[j + 1];
    if (!defined(command)) {
      command = pickCommands[j + 1] = new DrawCommand({
        owner: classificationPrimitive,
        primitiveType: primitive._primitiveType,
        pickOnly: true,
      });
    }

    command.vertexArray = vertexArray;
    command.renderState = classificationPrimitive._rsPickPass;
    command.shaderProgram = classificationPrimitive._spPick;
    command.uniformMap = uniformMap;
    command.pass = Pass.TERRAIN_CLASSIFICATION;
    if (usePickOffsets) {
      command.offset = pickOffset.offset;
      command.count = pickOffset.count;
    }

    derivedCommand = DrawCommand.shallowClone(
      command,
      command.derivedCommands.tileset,
    );
    derivedCommand.pass = Pass.CESIUM_3D_TILE_CLASSIFICATION;
    command.derivedCommands.tileset = derivedCommand;

    // Derive for 2D if texture coordinates are ever computed
    if (needs2DShader) {
      // First derive from the terrain command
      let derived2DCommand = DrawCommand.shallowClone(
        command,
        command.derivedCommands.pick2D,
      );
      derived2DCommand.shaderProgram = classificationPrimitive._spPick2D;
      command.derivedCommands.pick2D = derived2DCommand;

      // Then derive from the 3D Tiles command
      derived2DCommand = DrawCommand.shallowClone(
        derivedCommand,
        derivedCommand.derivedCommands.pick2D,
      );
      derived2DCommand.shaderProgram = classificationPrimitive._spPick2D;
      derivedCommand.derivedCommands.pick2D = derived2DCommand;
    }
  }
}

function createCommands(
  classificationPrimitive,
  appearance,
  material,
  translucent,
  twoPasses,
  colorCommands,
  pickCommands,
) {
  createColorCommands(classificationPrimitive, colorCommands);
  createPickCommands(classificationPrimitive, pickCommands);
}

function boundingVolumeIndex(commandIndex, length) {
  return Math.floor((commandIndex % length) / 2);
}

function updateAndQueueRenderCommand(
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
  debugShowBoundingVolume,
) {
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;
  command.debugShowBoundingVolume = debugShowBoundingVolume;

  frameState.commandList.push(command);
}

function updateAndQueuePickCommand(
  command,
  frameState,
  modelMatrix,
  cull,
  boundingVolume,
) {
  command.modelMatrix = modelMatrix;
  command.boundingVolume = boundingVolume;
  command.cull = cull;

  frameState.commandList.push(command);
}

function updateAndQueueCommands(
  classificationPrimitive,
  frameState,
  colorCommands,
  pickCommands,
  modelMatrix,
  cull,
  debugShowBoundingVolume,
  twoPasses,
) {
  const primitive = classificationPrimitive._primitive;
  Primitive._updateBoundingVolumes(primitive, frameState, modelMatrix);

  let boundingVolumes;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingVolumes = primitive._boundingSphereWC;
  } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
    boundingVolumes = primitive._boundingSphereCV;
  } else if (
    frameState.mode === SceneMode.SCENE2D &&
    defined(primitive._boundingSphere2D)
  ) {
    boundingVolumes = primitive._boundingSphere2D;
  } else if (defined(primitive._boundingSphereMorph)) {
    boundingVolumes = primitive._boundingSphereMorph;
  }

  const classificationType = classificationPrimitive.classificationType;
  const queueTerrainCommands =
    classificationType !== ClassificationType.CESIUM_3D_TILE;
  const queue3DTilesCommands =
    classificationType !== ClassificationType.TERRAIN;

  const passes = frameState.passes;

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
    const pickOffsets = primitive._pickOffsets;
    for (i = 0; i < pickLength; ++i) {
      const pickOffset = pickOffsets[boundingVolumeIndex(i, pickLength)];
      boundingVolume = boundingVolumes[pickOffset.index];
      if (queueTerrainCommands) {
        command = pickCommands[i];
        updateAndQueuePickCommand(
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
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，以获取渲染该原语所需的绘制命令。
 * <p>
 * 不要直接调用此函数。此文档只是为了列出在渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} 所有实例几何体必须具有相同的 primitiveType。
 * @exception {DeveloperError} 外观和材质具有相同名称的 uniform。
 * @exception {DeveloperError} 并非所有几何体实例都有相同的颜色属性。
 */

ClassificationPrimitive.prototype.update = function (frameState) {
  if (!defined(this._primitive) && !defined(this.geometryInstances)) {
    return;
  }

  let appearance = this.appearance;
  if (defined(appearance) && defined(appearance.material)) {
    appearance.material.update(frameState.context);
  }

  const that = this;
  const primitiveOptions = this._primitiveOptions;

  if (!defined(this._primitive)) {
    const instances = Array.isArray(this.geometryInstances)
      ? this.geometryInstances
      : [this.geometryInstances];
    const length = instances.length;

    let i;
    let instance;
    let attributes;

    let hasPerColorAttribute = false;
    let allColorsSame = true;
    let firstColor;
    let hasSphericalExtentsAttribute = false;
    let hasPlanarExtentsAttributes = false;

    if (length > 0) {
      attributes = instances[0].attributes;
      // Not expecting these to be set by users, should only be set via GroundPrimitive.
      // So don't check for mismatch.
      hasSphericalExtentsAttribute =
        ShadowVolumeAppearance.hasAttributesForSphericalExtents(attributes);
      hasPlanarExtentsAttributes =
        ShadowVolumeAppearance.hasAttributesForTextureCoordinatePlanes(
          attributes,
        );
      firstColor = attributes.color;
    }

    for (i = 0; i < length; i++) {
      instance = instances[i];
      const color = instance.attributes.color;
      if (defined(color)) {
        hasPerColorAttribute = true;
      }
      //>>includeStart('debug', pragmas.debug);
      else if (hasPerColorAttribute) {
        throw new DeveloperError(
          "All GeometryInstances must have color attributes to use per-instance color.",
        );
      }
      //>>includeEnd('debug');

      allColorsSame =
        allColorsSame &&
        defined(color) &&
        ColorGeometryInstanceAttribute.equals(firstColor, color);
    }

    // If no attributes exist for computing spherical extents or fragment culling,
    // throw if the colors aren't all the same.
    if (
      !allColorsSame &&
      !hasSphericalExtentsAttribute &&
      !hasPlanarExtentsAttributes
    ) {
      throw new DeveloperError(
        "All GeometryInstances must have the same color attribute except via GroundPrimitives",
      );
    }

    // default to a color appearance
    if (hasPerColorAttribute && !defined(appearance)) {
      appearance = new PerInstanceColorAppearance({
        flat: true,
      });
      this.appearance = appearance;
    }

    //>>includeStart('debug', pragmas.debug);
    if (
      !hasPerColorAttribute &&
      appearance instanceof PerInstanceColorAppearance
    ) {
      throw new DeveloperError(
        "PerInstanceColorAppearance requires color GeometryInstanceAttributes on all GeometryInstances",
      );
    }
    if (
      defined(appearance.material) &&
      !hasSphericalExtentsAttribute &&
      !hasPlanarExtentsAttributes
    ) {
      throw new DeveloperError(
        "Materials on ClassificationPrimitives are not supported except via GroundPrimitives",
      );
    }
    //>>includeEnd('debug');

    this._usePickOffsets =
      !hasSphericalExtentsAttribute && !hasPlanarExtentsAttributes;
    this._hasSphericalExtentsAttribute = hasSphericalExtentsAttribute;
    this._hasPlanarExtentsAttributes = hasPlanarExtentsAttributes;
    this._hasPerColorAttribute = hasPerColorAttribute;

    const geometryInstances = new Array(length);
    for (i = 0; i < length; ++i) {
      instance = instances[i];
      geometryInstances[i] = new GeometryInstance({
        geometry: instance.geometry,
        attributes: instance.attributes,
        modelMatrix: instance.modelMatrix,
        id: instance.id,
        pickPrimitive: defaultValue(this._pickPrimitive, that),
      });
    }

    primitiveOptions.appearance = appearance;
    primitiveOptions.geometryInstances = geometryInstances;

    if (defined(this._createBoundingVolumeFunction)) {
      primitiveOptions._createBoundingVolumeFunction = function (
        frameState,
        geometry,
      ) {
        that._createBoundingVolumeFunction(frameState, geometry);
      };
    }

    primitiveOptions._createRenderStatesFunction = function (
      primitive,
      context,
      appearance,
      twoPasses,
    ) {
      createRenderStates(that, context);
    };
    primitiveOptions._createShaderProgramFunction = function (
      primitive,
      frameState,
      appearance,
    ) {
      createShaderProgram(that, frameState);
    };
    primitiveOptions._createCommandsFunction = function (
      primitive,
      appearance,
      material,
      translucent,
      twoPasses,
      colorCommands,
      pickCommands,
    ) {
      createCommands(
        that,
        undefined,
        undefined,
        true,
        false,
        colorCommands,
        pickCommands,
      );
    };

    if (defined(this._updateAndQueueCommandsFunction)) {
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
        that._updateAndQueueCommandsFunction(
          primitive,
          frameState,
          colorCommands,
          pickCommands,
          modelMatrix,
          cull,
          debugShowBoundingVolume,
          twoPasses,
        );
      };
    } else {
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
    }

    this._primitive = new Primitive(primitiveOptions);
  }

  if (
    this.debugShowShadowVolume &&
    !this._debugShowShadowVolume &&
    this._ready
  ) {
    this._debugShowShadowVolume = true;
    this._rsStencilDepthPass = RenderState.fromCache(
      getStencilDepthRenderState(false, false),
    );
    this._rsStencilDepthPass3DTiles = RenderState.fromCache(
      getStencilDepthRenderState(false, true),
    );
    this._rsColorPass = RenderState.fromCache(getColorRenderState(false));
  } else if (!this.debugShowShadowVolume && this._debugShowShadowVolume) {
    this._debugShowShadowVolume = false;
    this._rsStencilDepthPass = RenderState.fromCache(
      getStencilDepthRenderState(true, false),
    );
    this._rsStencilDepthPass3DTiles = RenderState.fromCache(
      getStencilDepthRenderState(true, true),
    );
    this._rsColorPass = RenderState.fromCache(getColorRenderState(true));
  }
  // Update primitive appearance
  if (this._primitive.appearance !== appearance) {
    //>>includeStart('debug', pragmas.debug);
    // Check if the appearance is supported by the geometry attributes
    if (
      !this._hasSphericalExtentsAttribute &&
      !this._hasPlanarExtentsAttributes &&
      defined(appearance.material)
    ) {
      throw new DeveloperError(
        "Materials on ClassificationPrimitives are not supported except via GroundPrimitive",
      );
    }
    if (
      !this._hasPerColorAttribute &&
      appearance instanceof PerInstanceColorAppearance
    ) {
      throw new DeveloperError(
        "PerInstanceColorAppearance requires color GeometryInstanceAttribute",
      );
    }
    //>>includeEnd('debug');
    this._primitive.appearance = appearance;
  }

  this._primitive.show = this.show;
  this._primitive.debugShowBoundingVolume = this.debugShowBoundingVolume;
  this._primitive.update(frameState);

  frameState.afterRender.push(() => {
    if (defined(this._primitive) && this._primitive.ready) {
      this._ready = true;

      if (this.releaseGeometryInstances) {
        this.geometryInstances = undefined;
      }
    }
  });
};

/**
 * 返回 {@link GeometryInstance} 的可修改每实例属性。
 *
 * @param {*} id {@link GeometryInstance} 的 ID。
 * @returns {object} 属性格式的类型数组，如果没有与 ID 匹配的实例，则返回 undefined。
 *
 * @exception {DeveloperError} 必须在调用 getGeometryInstanceAttributes 之前调用 update。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.color = Cesium.ColorGeometryInstanceAttribute.toValue(Cesium.Color.AQUA);
 * attributes.show = Cesium.ShowGeometryInstanceAttribute.toValue(true);
 */

ClassificationPrimitive.prototype.getGeometryInstanceAttributes = function (
  id,
) {
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
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see ClassificationPrimitive#destroy
 */

ClassificationPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象所持有的 WebGL 资源。销毁对象允许确定性地释放 WebGL 资源，而不是依赖垃圾收集器来销毁此对象。
 * <p>
 * 一旦对象被销毁，就不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）分配给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * e = e && e.destroy();
 *
 * @see ClassificationPrimitive#isDestroyed
 */
ClassificationPrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  this._sp = this._sp && this._sp.destroy();
  this._spPick = this._spPick && this._spPick.destroy();
  this._spColor = this._spColor && this._spColor.destroy();

  // Derived programs, destroyed above if they existed.
  this._spPick2D = undefined;
  this._spColor2D = undefined;
  return destroyObject(this);
};
export default ClassificationPrimitive;
