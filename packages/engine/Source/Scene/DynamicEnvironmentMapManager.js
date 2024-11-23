import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import JulianDate from "../Core/JulianDate.js";
import Matrix4 from "../Core/Matrix4.js";
import PixelFormat from "../Core/PixelFormat.js";
import SceneMode from "./SceneMode.js";
import Transforms from "../Core/Transforms.js";
import ComputeCommand from "../Renderer/ComputeCommand.js";
import CubeMap from "../Renderer/CubeMap.js";
import Framebuffer from "../Renderer/Framebuffer.js";
import Texture from "../Renderer/Texture.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import Sampler from "../Renderer/Sampler.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import Atmosphere from "./Atmosphere.js";
import DynamicAtmosphereLightingType from "./DynamicAtmosphereLightingType.js";
import AtmosphereCommon from "../Shaders/AtmosphereCommon.js";
import ComputeIrradianceFS from "../Shaders/ComputeIrradianceFS.js";
import ComputeRadianceMapFS from "../Shaders/ComputeRadianceMapFS.js";
import ConvolveSpecularMapFS from "../Shaders/ConvolveSpecularMapFS.js";
import ConvolveSpecularMapVS from "../Shaders/ConvolveSpecularMapVS.js";

/**
 * @typedef {object} DynamicEnvironmentMapManager.ConstructorOptions
 * DynamicEnvironmentMapManager 构造函数的选项
 * @property {boolean} [enabled=true] 如果为 true，环境贴图和相关属性将继续更新。
 * @property {number} [mipmapLevels=10] 为高光贴图生成的 mipmap 级别数。更多的 mipmap 级别将产生更高分辨率的高光反射。
 * @property {number} [maximumSecondsDifference=3600] 创建新的环境贴图之前允许经过的最大秒数。
 * @property {number} [maximumPositionEpsilon=1000] 创建新的环境贴图之前，位置的最大差异（以米为单位）。小位置差异不会明显影响结果。
 * @property {number} [atmosphereScatteringIntensity=2.0] 从大气中散射的光的强度。应根据 {@link Scene.light} 的强度值进行调整。
 * @property {number} [gamma=1.0] 应用于环境中发出光线范围的伽玛校正。1.0 使用未经修改的发光颜色。
 * @property {number} [brightness=1.0] 环境中发出光的亮度。1.0 使用未经修改的环境颜色。小于 1.0 会使光变暗，而大于 1.0 会使光变亮。
 * @property {number} [saturation=1.0] 环境中发出光的饱和度。1.0 使用未经修改的环境颜色。小于 1.0 会降低饱和度，而大于 1.0 会增加饱和度。
 * @property {Color} [groundColor=DynamicEnvironmentMapManager.AVERAGE_EARTH_GROUND_COLOR] 用于表示地面的固体颜色。
 * @property {number} [groundAlbedo=0.31] 从地面反射的光的百分比。地球的平均反照率约为 0.31。
 */


/**
 * 根据场景当前的光照条件，在给定位置生成环境贴图。由此生成多个级别的高光贴图和球面谐波系数，这些可以与 {@link ImageBasedLighting} 一起用于模型或瓦片集。
 * @alias DynamicEnvironmentMapManager
 * @constructor
 * @param {DynamicEnvironmentMapManager.ConstructorOptions} [options] 描述初始化选项的对象。
 *
 * @example
 * // Enable time-of-day environment mapping in a scene
 * scene.atmosphere.dynamicLighting = Cesium.DynamicAtmosphereLightingType.SUNLIGHT;
 *
 * // Decrease the directional lighting contribution
 * scene.light.intensity = 0.5
 *
 * // Increase the intensity of of the environment map lighting contribution
 * const environmentMapManager = tileset.environmentMapManager;
 * environmentMapManager.atmosphereScatteringIntensity = 3.0;
 *
 * @example
 * // Change the ground color used for a model's environment map to a forest green
 * const environmentMapManager = model.environmentMapManager;
 * environmentMapManager.groundColor = Cesium.Color.fromCssColorString("#203b34");
 */
function DynamicEnvironmentMapManager(options) {
  this._position = undefined;

  this._radianceMapDirty = false;
  this._radianceCommandsDirty = false;
  this._convolutionsCommandsDirty = false;
  this._irradianceCommandDirty = false;
  this._irradianceTextureDirty = false;
  this._sphericalHarmonicCoefficientsDirty = false;

  this._shouldRegenerateShaders = false;

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const mipmapLevels = defaultValue(options.mipmapLevels, 10);
  this._mipmapLevels = mipmapLevels;
  this._radianceMapComputeCommands = new Array(6);
  this._convolutionComputeCommands = new Array((mipmapLevels - 1) * 6);
  this._irradianceComputeCommand = undefined;

  this._radianceMapFS = undefined;
  this._irradianceMapFS = undefined;
  this._convolveSP = undefined;
  this._va = undefined;

  this._radianceMapTextures = new Array(6);
  this._specularMapTextures = new Array((mipmapLevels - 1) * 6);
  this._radianceCubeMap = undefined;
  this._irradianceMapTexture = undefined;

  this._sphericalHarmonicCoefficients =
    DynamicEnvironmentMapManager.DEFAULT_SPHERICAL_HARMONIC_COEFFICIENTS.slice();

  this._lastTime = new JulianDate();
  const width = Math.pow(2, mipmapLevels - 1);
  this._textureDimensions = new Cartesian2(width, width);

  this._radiiAndDynamicAtmosphereColor = new Cartesian3();
  this._sceneEnvironmentMap = undefined;
  this._backgroundColor = undefined;

  // If this DynamicEnvironmentMapManager has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference one tileset's DynamicEnvironmentMapManager.
  this._owner = undefined;

  /**
   * 如果为 true，环境贴图和相关属性将继续更新。
   * @type {boolean}
   * @default true
   */
  this.enabled = defaultValue(options.enabled, true);

  /**
   * 禁用更新。仅供内部使用。
   * @private
   * @default true
   */
  this.shouldUpdate = true;

  /**
   * 创建新的环境贴图之前允许经过的最大秒数。
   * @type {number}
   * @default 3600
   */
  this.maximumSecondsDifference = defaultValue(
    options.maximumSecondsDifference,
    60 * 60,
  );

  /**
   * 创建新的环境贴图之前，位置的最大差异（以米为单位）。小位置差异不会明显影响结果。
   * @type {number}
   * @default 1000
   */
  this.maximumPositionEpsilon = defaultValue(
    options.maximumPositionEpsilon,
    1000.0,
  );

  /**
   * 从大气中散射的光的强度。应根据 {@link Scene.light} 的强度值进行调整。
   * @type {number}
   * @default 2.0
   * @see DirectionalLight.intensity
   * @see SunLight.intensity
   */

  this.atmosphereScatteringIntensity = defaultValue(
    options.atmosphereScatteringIntensity,
    2.0,
  );

  /**
   * 应用于环境中发出光线范围的伽玛校正。1.0 使用未经修改的入射光颜色。
   * @type {number}
   * @default 1.0
   */
  this.gamma = defaultValue(options.gamma, 1.0);

  /**
   * 环境中发出的光的亮度。1.0 使用未经修改的环境颜色。小于 1.0
   * 会使光变暗，而大于 1.0 会使光变亮。
   * @type {number}
   * @default 1.0
   */
  this.brightness = defaultValue(options.brightness, 1.0);

  /**
   * 环境中发出的光的饱和度。1.0 使用未经修改的环境颜色。小于 1.0 会降低
   * 饱和度，而大于 1.0 会增加饱和度。
   * @type {number}
   * @default 1.0
   */
  this.saturation = defaultValue(options.saturation, 1.0);

  /**
   * 用于表示地面的固体颜色。
   * @type {Color}
   * @default DynamicEnvironmentMapManager.AVERAGE_EARTH_GROUND_COLOR
   */
  this.groundColor = defaultValue(
    options.groundColor,
    DynamicEnvironmentMapManager.AVERAGE_EARTH_GROUND_COLOR,
  );

  /**
   * 从地面反射的光的百分比。地球的平均反照率约为 0.31。
   * @type {number}
   * @default 0.31
   */
  this.groundAlbedo = defaultValue(options.groundAlbedo, 0.31);
}

Object.defineProperties(DynamicEnvironmentMapManager.prototype, {
  /**
   * 对 DynamicEnvironmentMapManager 的所有者的引用（如果有的话）。
   * @memberof DynamicEnvironmentMapManager.prototype
   * @type {object|undefined}
   * @readonly
   * @private
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },

  /**
   * 如果模型着色器需要重新生成以反映更新，则为 true。
   * @memberof DynamicEnvironmentMapManager.prototype
   * @type {boolean}
   * @readonly
   * @private
   */

  shouldRegenerateShaders: {
    get: function () {
      return this._shouldRegenerateShaders;
    },
  },

  /**
   * 环境贴图生成的中心位置。
   * @memberof DynamicEnvironmentMapManager.prototype
   * @type {Cartesian3|undefined}
   */

  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      if (
        Cartesian3.equalsEpsilon(
          value,
          this._position,
          0.0,
          this.maximumPositionEpsilon,
        )
      ) {
        return;
      }

      this._position = Cartesian3.clone(value, this._position);
      this.reset();
    },
  },

  /**
   * 计算得出的辐射图，如果尚未创建则为 <code>undefined</code>。
   * @memberof DynamicEnvironmentMapManager.prototype
   * @type {CubeMap|undefined}
   * @readonly
   * @private
   */
  radianceCubeMap: {
    get: function () {
      return this._radianceCubeMap;
    },
  },

  /**
   * 辐射立方体贴图中可用的最大 mip 级别数。
   * @memberof DynamicEnvironmentMapManager.prototype
   * @type {number}
   * @readonly
   * @private
   */
  maximumMipmapLevel: {
    get: function () {
      return this._mipmapLevels;
    },
  },

  /**
   * 用于基于图像的光照的扩散颜色的三阶球面谐波系数。
   * <p>
   * 共有九个 <code>Cartesian3</code> 系数。
   * 系数的顺序是：L<sub>0,0</sub>, L<sub>1,-1</sub>, L<sub>1,0</sub>, L<sub>1,1</sub>, L<sub>2,-2</sub>, L<sub>2,-1</sub>, L<sub>2,0</sub>, L<sub>2,1</sub>, L<sub>2,2</sub>
   * </p>
   * @memberof DynamicEnvironmentMapManager.prototype
   * @readonly
   * @type {Cartesian3[]}
   * @see {@link https://graphics.stanford.edu/papers/envmap/envmap.pdf|一个有效的辐照环境贴图表示}
   * @private
   */

  sphericalHarmonicCoefficients: {
    get: function () {
      return this._sphericalHarmonicCoefficients;
    },
  },
});

/**
 * 为输入的 DynamicEnvironmentMapManager 设置所有者，如果没有其他所有者的话。
 * 如果设置成功，则销毁所有者之前的 DynamicEnvironmentMapManager。
 * @param {DynamicEnvironmentMapManager} [environmentMapManager] 要附加到对象上的 DynamicEnvironmentMapManager（或 undefined）
 * @param {object} owner 一个应该接收新的 DynamicEnvironmentMapManager 的对象
 * @param {string} key 用于对象引用 DynamicEnvironmentMapManager 的键
 * @private
 */

DynamicEnvironmentMapManager.setOwner = function (
  environmentMapManager,
  owner,
  key,
) {
  // Don't destroy the DynamicEnvironmentMapManager if it's already owned by newOwner
  if (environmentMapManager === owner[key]) {
    return;
  }
  // Destroy the existing DynamicEnvironmentMapManager, if any
  owner[key] = owner[key] && owner[key].destroy();
  if (defined(environmentMapManager)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(environmentMapManager._owner)) {
      throw new DeveloperError(
        "DynamicEnvironmentMapManager should only be assigned to one object",
      );
    }
    //>>includeEnd('debug');
    environmentMapManager._owner = owner;
    owner[key] = environmentMapManager;
  }
};

/**
 * 取消所有正在进行的命令，并将环境贴图标记为脏。
 * @private
 */

DynamicEnvironmentMapManager.prototype.reset = function () {
  let length = this._radianceMapComputeCommands.length;
  for (let i = 0; i < length; ++i) {
    this._radianceMapComputeCommands[i] = undefined;
  }

  length = this._convolutionComputeCommands.length;
  for (let i = 0; i < length; ++i) {
    this._convolutionComputeCommands[i] = undefined;
  }

  if (defined(this._irradianceComputeCommand)) {
    this._irradianceComputeCommand = undefined;
  }

  this._radianceMapDirty = true;
  this._radianceCommandsDirty = true;
};

const scratchPackedAtmosphere = new Cartesian3();
const scratchSurfacePosition = new Cartesian3();

/**
 * 更新大气属性并返回如果环境贴图需要重新生成则为 true。
 * @param {DynamicEnvironmentMapManager} manager 本管理器
 * @param {FrameState} frameState 当前的帧状态
 * @returns {boolean} 如果环境贴图需要重新生成则为 true。
 * @private
 */

function atmosphereNeedsUpdate(manager, frameState) {
  const position = manager._position;
  const atmosphere = frameState.atmosphere;

  const ellipsoid = frameState.mapProjection.ellipsoid;
  const surfacePosition = ellipsoid.scaleToGeodeticSurface(
    position,
    scratchSurfacePosition,
  );
  const outerEllipsoidScale = 1.025;

  // Pack outer radius, inner radius, and dynamic atmosphere flag
  const radiiAndDynamicAtmosphereColor = scratchPackedAtmosphere;
  const radius = defined(surfacePosition)
    ? Cartesian3.magnitude(surfacePosition)
    : ellipsoid.maximumRadius;
  radiiAndDynamicAtmosphereColor.x = radius * outerEllipsoidScale;
  radiiAndDynamicAtmosphereColor.y = radius;
  radiiAndDynamicAtmosphereColor.z = atmosphere.dynamicLighting;

  if (
    !Cartesian3.equalsEpsilon(
      manager._radiiAndDynamicAtmosphereColor,
      radiiAndDynamicAtmosphereColor,
    ) ||
    frameState.environmentMap !== manager._sceneEnvironmentMap ||
    frameState.backgroundColor !== manager._backgroundColor
  ) {
    Cartesian3.clone(
      radiiAndDynamicAtmosphereColor,
      manager._radiiAndDynamicAtmosphereColor,
    );
    manager._sceneEnvironmentMap = frameState.environmentMap;
    manager._backgroundColor = frameState.backgroundColor;
    return true;
  }

  return false;
}

const scratchCartesian = new Cartesian3();
const scratchMatrix = new Matrix4();
const scratchAdjustments = new Cartesian4();
const scratchColor = new Color();

/**
 * 通过为每个立方体面创建计算命令来渲染最高分辨率的高光贴图
 * @param {DynamicEnvironmentMapManager} manager 本管理器
 * @param {FrameState} frameState 当前的帧状态
 * @private
 */

function updateRadianceMap(manager, frameState) {
  const context = frameState.context;
  const textureDimensions = manager._textureDimensions;

  if (!defined(manager._radianceCubeMap)) {
    manager._radianceCubeMap = new CubeMap({
      context: context,
      width: textureDimensions.x,
      height: textureDimensions.y,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });
  }

  if (manager._radianceCommandsDirty) {
    let fs = manager._radianceMapFS;
    if (!defined(fs)) {
      fs = new ShaderSource({
        sources: [AtmosphereCommon, ComputeRadianceMapFS],
      });
      manager._radianceMapFS = fs;
    }

    if (Atmosphere.requiresColorCorrect(frameState.atmosphere)) {
      fs.defines.push("ATMOSPHERE_COLOR_CORRECT");
    }

    const position = manager._position;
    const radiiAndDynamicAtmosphereColor =
      manager._radiiAndDynamicAtmosphereColor;

    const ellipsoid = frameState.mapProjection.ellipsoid;
    const enuToFixedFrame = Transforms.eastNorthUpToFixedFrame(
      position,
      ellipsoid,
      scratchMatrix,
    );

    const adjustments = scratchAdjustments;

    adjustments.x = manager.brightness;
    adjustments.y = manager.saturation;
    adjustments.z = manager.gamma;
    adjustments.w = manager.atmosphereScatteringIntensity;

    if (
      manager.brightness !== 1.0 ||
      manager.saturation !== 1.0 ||
      manager.gamma !== 1.0
    ) {
      fs.defines.push("ENVIRONMENT_COLOR_CORRECT");
    }

    let i = 0;
    for (const face of CubeMap.faceNames()) {
      let texture = manager._radianceMapTextures[i];
      if (defined(texture)) {
        texture.destroy();
      }

      texture = new Texture({
        context: context,
        width: textureDimensions.x,
        height: textureDimensions.y,
        pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
        pixelFormat: PixelFormat.RGBA,
      });
      manager._radianceMapTextures[i] = texture;

      const index = i;
      const command = new ComputeCommand({
        fragmentShaderSource: fs,
        outputTexture: texture,
        uniformMap: {
          u_radiiAndDynamicAtmosphereColor: () =>
            radiiAndDynamicAtmosphereColor,
          u_enuToFixedFrame: () => enuToFixedFrame,
          u_faceDirection: () => CubeMap.getDirection(face, scratchCartesian),
          u_positionWC: () => position,
          u_brightnessSaturationGammaIntensity: () => adjustments,
          u_groundColor: () => {
            return manager.groundColor.withAlpha(
              manager.groundAlbedo,
              scratchColor,
            );
          },
        },
        persists: true,
        owner: manager,
        postExecute: () => {
          const commands = manager._radianceMapComputeCommands;
          if (!defined(commands[index])) {
            // This command was cancelled
            return;
          }
          commands[index] = undefined;

          const framebuffer = new Framebuffer({
            context: context,
            colorTextures: [manager._radianceMapTextures[index]],
            destroyAttachments: false,
          });

          // Copy the output texture into the corresponding cubemap face
          framebuffer._bind();
          manager._radianceCubeMap[face].copyFromFramebuffer();
          framebuffer._unBind();
          framebuffer.destroy();

          if (!commands.some(defined)) {
            manager._convolutionsCommandsDirty = true;
            manager._shouldRegenerateShaders = true;
          }
        },
      });
      frameState.commandList.push(command);
      manager._radianceMapComputeCommands[i] = command;
      i++;
    }
    manager._radianceCommandsDirty = false;
  }
}

/**
 * 通过对每个粗糙度级别进行环境贴图卷积，为立方体贴图创建一个 mipmap 链
 * @param {DynamicEnvironmentMapManager} manager 此管理器
 * @param {FrameState} frameState 当前的 frameState
 * @private
 */

function updateSpecularMaps(manager, frameState) {
  const radianceCubeMap = manager._radianceCubeMap;
  radianceCubeMap.generateMipmap();

  const mipmapLevels = manager._mipmapLevels;
  const textureDimensions = manager._textureDimensions;
  let width = textureDimensions.x / 2;
  let height = textureDimensions.y / 2;
  const context = frameState.context;

  let facesCopied = 0;
  const getPostExecute = (index, texture, face, level) => () => {
    // Copy output texture to corresponding face and mipmap level
    const commands = manager._convolutionComputeCommands;
    if (!defined(commands[index])) {
      // This command was cancelled
      return;
    }
    commands[index] = undefined;

    radianceCubeMap.copyFace(frameState, texture, face, level);
    facesCopied++;

    // All faces and levels have been copied
    if (facesCopied === manager._specularMapTextures.length) {
      manager._irradianceCommandDirty = true;
      radianceCubeMap.sampler = new Sampler({
        minificationFilter: TextureMinificationFilter.LINEAR_MIPMAP_LINEAR,
      });
      manager._shouldRegenerateShaders = true;
    }
  };

  let index = 0;
  for (let level = 1; level < mipmapLevels; ++level) {
    for (const face of CubeMap.faceNames()) {
      const texture = (manager._specularMapTextures[index] = new Texture({
        context: context,
        width: width,
        height: height,
        pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
        pixelFormat: PixelFormat.RGBA,
      }));

      let vertexArray = manager._va;
      if (!defined(vertexArray)) {
        vertexArray = CubeMap.createVertexArray(context, face);
        manager._va = vertexArray;
      }

      let shaderProgram = manager._convolveSP;
      if (!defined(shaderProgram)) {
        shaderProgram = ShaderProgram.fromCache({
          context: context,
          vertexShaderSource: ConvolveSpecularMapVS,
          fragmentShaderSource: ConvolveSpecularMapFS,
          attributeLocations: {
            positions: 0,
          },
        });
        manager._convolveSP = shaderProgram;
      }

      const command = new ComputeCommand({
        shaderProgram: shaderProgram,
        vertexArray: vertexArray,
        outputTexture: texture,
        persists: true,
        owner: manager,
        uniformMap: {
          u_roughness: () => level / (mipmapLevels - 1),
          u_radianceTexture: () => radianceCubeMap,
          u_faceDirection: () => {
            return CubeMap.getDirection(face, scratchCartesian);
          },
        },
        postExecute: getPostExecute(index, texture, face, level),
      });
      manager._convolutionComputeCommands[index] = command;
      frameState.commandList.push(command);
      ++index;
    }

    width /= 2;
    height /= 2;
  }
}

const irradianceTextureDimensions = new Cartesian2(3, 3); // 9 coefficients

/**
 * 通过对环境贴图进行卷积计算球面谐波系数。
 * @param {DynamicEnvironmentMapManager} manager 此管理器
 * @param {FrameState} frameState 当前的 frameState
 * @private
 */

function updateIrradianceResources(manager, frameState) {
  const context = frameState.context;
  const dimensions = irradianceTextureDimensions;

  let texture = manager._irradianceMapTexture;
  if (!defined(texture)) {
    texture = new Texture({
      context: context,
      width: dimensions.x,
      height: dimensions.y,
      pixelDatatype: PixelDatatype.FLOAT,
      pixelFormat: PixelFormat.RGBA,
    });
    manager._irradianceMapTexture = texture;
  }

  let fs = manager._irradianceMapFS;
  if (!defined(fs)) {
    fs = new ShaderSource({
      sources: [ComputeIrradianceFS],
    });
    manager._irradianceMapFS = fs;
  }

  const command = new ComputeCommand({
    fragmentShaderSource: fs,
    outputTexture: texture,
    uniformMap: {
      u_radianceMap: () => manager._radianceCubeMap,
    },
    postExecute: () => {
      if (!defined(manager._irradianceComputeCommand)) {
        // This command was cancelled
        return;
      }
      manager._irradianceTextureDirty = false;
      manager._irradianceComputeCommand = undefined;
      manager._sphericalHarmonicCoefficientsDirty = true;
    },
  });
  manager._irradianceComputeCommand = command;
  frameState.commandList.push(command);
  manager._irradianceTextureDirty = true;
}

/**
 * 使用 readPixels 从输出纹理复制系数。
 * @param {DynamicEnvironmentMapManager} manager 此管理器
 * @param {FrameState} frameState 当前的 frameState
 * @private
 */

function updateSphericalHarmonicCoefficients(manager, frameState) {
  const context = frameState.context;

  const framebuffer = new Framebuffer({
    context: context,
    colorTextures: [manager._irradianceMapTexture],
    destroyAttachments: false,
  });

  const dimensions = irradianceTextureDimensions;
  const data = context.readPixels({
    x: 0,
    y: 0,
    width: dimensions.x,
    height: dimensions.y,
    framebuffer: framebuffer,
  });

  for (let i = 0; i < 9; ++i) {
    manager._sphericalHarmonicCoefficients[i] = Cartesian3.unpack(data, i * 4);
    Cartesian3.multiplyByScalar(
      manager._sphericalHarmonicCoefficients[i],
      manager.atmosphereScatteringIntensity,
      manager._sphericalHarmonicCoefficients[i],
    );
  }

  framebuffer.destroy();
  manager._shouldRegenerateShaders = true;
}

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景以构建环境贴图的资源时调用。
 * <p>
 * 不要直接调用此功能。
 * </p>
 * @private
 */

DynamicEnvironmentMapManager.prototype.update = function (frameState) {
  const mode = frameState.mode;
  const isSupported =
    // A FrameState type works here because the function only references the context parameter.
    // @ts-ignore
    DynamicEnvironmentMapManager.isDynamicUpdateSupported(frameState);

  if (
    !isSupported ||
    !this.enabled ||
    !this.shouldUpdate ||
    !defined(this._position) ||
    mode === SceneMode.MORPHING
  ) {
    this._shouldRegenerateShaders = false;
    return;
  }

  const dynamicLighting = frameState.atmosphere.dynamicLighting;
  const regenerateEnvironmentMap =
    atmosphereNeedsUpdate(this, frameState) ||
    (dynamicLighting === DynamicAtmosphereLightingType.SUNLIGHT &&
      !JulianDate.equalsEpsilon(
        frameState.time,
        this._lastTime,
        this.maximumSecondsDifference,
      ));

  if (regenerateEnvironmentMap) {
    this.reset();
    this._lastTime = JulianDate.clone(frameState.time, this._lastTime);
  }

  if (this._radianceMapDirty) {
    updateRadianceMap(this, frameState);
    this._radianceMapDirty = false;
  }

  if (this._convolutionsCommandsDirty) {
    updateSpecularMaps(this, frameState);
    this._convolutionsCommandsDirty = false;
  }

  if (this._irradianceCommandDirty) {
    updateIrradianceResources(this, frameState);
    this._irradianceCommandDirty = false;
  }

  if (this._irradianceTextureDirty) {
    this._shouldRegenerateShaders = false;
    return;
  }

  if (this._sphericalHarmonicCoefficientsDirty) {
    updateSphericalHarmonicCoefficients(this, frameState);
    this._sphericalHarmonicCoefficientsDirty = false;
    return;
  }

  this._shouldRegenerateShaders = false;
};

/**
 * 如果这个对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果这个对象已经被销毁，则不应该使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 * @returns {boolean} <code>true</code> 如果这个对象已被销毁；否则返回 <code>false</code>。
 * @see DynamicEnvironmentMapManager#destroy
 */

DynamicEnvironmentMapManager.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁一个对象允许确定性地释放 WebGL 资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该再使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值 (<code>undefined</code>) 赋给对象，如示例中所示。
 * @throws {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 * @example
 * mapManager = mapManager && mapManager.destroy();
 * @see DynamicEnvironmentMapManager#isDestroyed
 */

DynamicEnvironmentMapManager.prototype.destroy = function () {
  // Cancel in-progress commands
  let length = this._radianceMapComputeCommands.length;
  for (let i = 0; i < length; ++i) {
    this._radianceMapComputeCommands[i] = undefined;
  }

  length = this._convolutionComputeCommands.length;
  for (let i = 0; i < length; ++i) {
    this._convolutionComputeCommands[i] = undefined;
  }

  this._irradianceMapComputeCommand = undefined;

  // Destroy all textures
  length = this._radianceMapTextures.length;
  for (let i = 0; i < length; ++i) {
    this._radianceMapTextures[i] =
      this._radianceMapTextures[i] && this._radianceMapTextures[i].destroy();
  }

  length = this._specularMapTextures.length;
  for (let i = 0; i < length; ++i) {
    this._specularMapTextures[i] =
      this._specularMapTextures[i] && this._specularMapTextures[i].destroy();
  }

  this._radianceCubeMap =
    this._radianceCubeMap && this._radianceCubeMap.destroy();
  this._irradianceMapTexture =
    this._irradianceMapTexture && this._irradianceMapTexture.destroy();

  return destroyObject(this);
};

/**
 * 如果在当前 WebGL 渲染上下文中支持动态更新，则返回 <code>true</code>。
 * 动态更新需要 EXT_color_buffer_float 或 EXT_color_buffer_half_float 扩展。
 *
 * @param {Scene} scene 包含渲染上下文的对象
 * @returns {boolean} 如果支持则返回 true
 */

DynamicEnvironmentMapManager.isDynamicUpdateSupported = function (scene) {
  const context = scene.context;
  return context.halfFloatingPointTexture || context.colorBufferFloat;
};

/**
 * 地球上地面颜色的平均色调，温暖的绿色灰色。
 * @type {Color}
 * @readonly
 */

DynamicEnvironmentMapManager.AVERAGE_EARTH_GROUND_COLOR = Object.freeze(
  Color.fromCssColorString("#717145"),
);

/**
 * 默认的第三阶球面谐波系数，用于基于图像的照明的漫反射颜色，低强度的白色环境光。
 * <p>
 * 一共有九个 <code>Cartesian3</code> 系数。
 * 系数的顺序是：L<sub>0,0</sub>, L<sub>1,-1</sub>, L<sub>1,0</sub>, L<sub>1,1</sub>, L<sub>2,-2</sub>, L<sub>2,-1</sub>, L<sub>2,0</sub>, L<sub>2,1</sub>, L<sub>2,2</sub>
 * </p>

 * @readonly
 * @type {Cartesian3[]}
 * @see {@link https://graphics.stanford.edu/papers/envmap/envmap.pdf|An Efficient Representation for Irradiance Environment Maps}
 */
DynamicEnvironmentMapManager.DEFAULT_SPHERICAL_HARMONIC_COEFFICIENTS =
  Object.freeze([
    Object.freeze(new Cartesian3(0.35449, 0.35449, 0.35449)),
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
    Cartesian3.ZERO,
  ]);

export default DynamicEnvironmentMapManager;
