import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import PixelFormat from "../Core/PixelFormat.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import Sampler from "../Renderer/Sampler.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import PassThrough from "../Shaders/PostProcessStages/PassThrough.js";
import PostProcessStageLibrary from "./PostProcessStageLibrary.js";
import PostProcessStageTextureCache from "./PostProcessStageTextureCache.js";
import Tonemapper, { validateTonemapper } from "./Tonemapper.js";

const stackScratch = [];

/**
 * 一个 {@link PostProcessStage} 和/或 {@link PostProcessStageComposite} 的集合。
 * <p>
 * 每个后处理阶段的输入纹理是由场景渲染的纹理或由集合中上一个阶段渲染的纹理。
 * </p>
 * <p>
 * 如果启用了环境光遮蔽或辉光阶段，它们将在所有其他阶段之前执行。
 * </p>
 * <p>
 * 如果启用了 FXAA 阶段，它将在所有其他阶段之后执行。
 * </p>
 *
 * @alias PostProcessStageCollection
 * @constructor
 */

function PostProcessStageCollection() {
  const fxaa = PostProcessStageLibrary.createFXAAStage();
  const ao = PostProcessStageLibrary.createAmbientOcclusionStage();
  const bloom = PostProcessStageLibrary.createBloomStage();

  // Auto-exposure is currently disabled because most shaders output a value in [0.0, 1.0].
  // Some shaders, such as the atmosphere and ground atmosphere, output values slightly over 1.0.
  this._autoExposureEnabled = false;
  this._autoExposure = PostProcessStageLibrary.createAutoExposureStage();
  this._exposure = 1.0;
  this._tonemapping = undefined;
  this._tonemapper = undefined;

  // set tonemapper and tonemapping using the setter
  this.tonemapper = Tonemapper.PBR_NEUTRAL;

  const tonemapping = this._tonemapping;

  fxaa.enabled = false;
  ao.enabled = false;
  bloom.enabled = false;
  tonemapping.enabled = false; // will be enabled if necessary in update

  const textureCache = new PostProcessStageTextureCache(this);

  const stageNames = {};
  const stack = stackScratch;
  stack.push(fxaa, ao, bloom, tonemapping);
  while (stack.length > 0) {
    const stage = stack.pop();
    stageNames[stage.name] = stage;
    stage._textureCache = textureCache;

    const length = stage.length;
    if (defined(length)) {
      for (let i = 0; i < length; ++i) {
        stack.push(stage.get(i));
      }
    }
  }

  this._stages = [];
  this._activeStages = [];
  this._previousActiveStages = [];

  this._randomTexture = undefined; // For AO

  const that = this;
  ao.uniforms.randomTexture = function () {
    return that._randomTexture;
  };

  this._ao = ao;
  this._bloom = bloom;
  this._fxaa = fxaa;

  this._aoEnabled = undefined;
  this._bloomEnabled = undefined;
  this._tonemappingEnabled = undefined;
  this._fxaaEnabled = undefined;

  this._activeStagesChanged = false;
  this._stagesRemoved = false;
  this._textureCacheDirty = false;

  this._stageNames = stageNames;
  this._textureCache = textureCache;
}

Object.defineProperties(PostProcessStageCollection.prototype, {
  /**
   * 确定集合中的所有后处理阶段是否准备好执行。
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {boolean}
   * @readonly
   */

  ready: {
    get: function () {
      let readyAndEnabled = false;
      const stages = this._stages;
      const length = stages.length;
      for (let i = length - 1; i >= 0; --i) {
        const stage = stages[i];
        readyAndEnabled = readyAndEnabled || (stage.ready && stage.enabled);
      }

      const fxaa = this._fxaa;
      const ao = this._ao;
      const bloom = this._bloom;
      const tonemapping = this._tonemapping;

      readyAndEnabled = readyAndEnabled || (fxaa.ready && fxaa.enabled);
      readyAndEnabled = readyAndEnabled || (ao.ready && ao.enabled);
      readyAndEnabled = readyAndEnabled || (bloom.ready && bloom.enabled);
      readyAndEnabled =
        readyAndEnabled || (tonemapping.ready && tonemapping.enabled);

      return readyAndEnabled;
    },
  },
  /**
   * 用于快速近似抗锯齿的后处理阶段。
   * <p>
   * 启用时，该阶段将在所有其他阶段之后执行。
   * </p>
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {PostProcessStage}
   * @readonly
   */

  fxaa: {
    get: function () {
      return this._fxaa;
    },
  },
  /**
   * 一个后处理阶段，它对输入纹理应用基于地平线的环境光遮蔽 (HBAO)。
   * <p>
   * 环境光遮蔽模拟来自环境光的阴影。这些阴影在表面接收光线时始终存在，无论光源的位置如何。
   * </p>
   * <p>
   * uniforms 具有以下属性： <code>intensity</code>、<code>bias</code>、<code>lengthCap</code>、
   * <code>stepSize</code>、<code>frustumLength</code>、<code>ambientOcclusionOnly</code>、
   * <code>delta</code>、<code>sigma</code> 和 <code>blurStepSize</code>。
   * </p>
   * <ul>
   * <li><code>intensity</code> 是一个标量值，用于以指数方式增强或减弱阴影。较高的值使阴影变得更深。默认值为 <code>3.0</code>。</li>
   *
   * <li><code>bias</code> 是代表弧度的标量值。如果样本的法线与指向相机的向量之间的点积小于此值，
   * 则在当前方向上停止采样。这用于消除近似平面边缘的阴影。默认值为 <code>0.1</code>。</li>
   *
   * <li><code>lengthCap</code> 是一个标量值，表示以米为单位的长度。如果当前样本到第一个样本的距离大于此值，
   * 则在当前方向上停止采样。默认值为 <code>0.26</code>。</li>
   *
   * <li><code>stepSize</code> 是一个标量值，表示当前方向上下一个纹理样本的距离。默认值为 <code>1.95</code>。</li>
   *
   * <li><code>frustumLength</code> 是一个以米为单位的标量值。如果当前片段与相机的距离大于此值，则不计算该片段的环境光遮蔽。
   * 默认值为 <code>1000.0</code>。</li>
   *
   * <li><code>ambientOcclusionOnly</code> 是一个布尔值。当 <code>true</code> 时，仅生成的阴影会写入输出。当 <code>false</code> 时，输入纹理会与环境光遮蔽进行调制。
   * 这是一个有用的调试选项，可以查看更改 uniform 值的效果。默认值为 <code>false</code>。</li>
   * </ul>
   * <p>
   * <code>delta</code>、<code>sigma</code> 和 <code>blurStepSize</code> 是与 {@link PostProcessStageLibrary#createBlurStage} 相同的属性。
   * 模糊应用于从图像生成的阴影，以使其更平滑。
   * </p>
   * <p>
   * 启用时，该阶段将在所有其他阶段之前执行。
   * </p>
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {PostProcessStageComposite}
   * @readonly
   */

  ambientOcclusion: {
    get: function () {
      return this._ao;
    },
  },
  /**
   * 一个用于辉光效果的后处理阶段。
   * <p>
   * 辉光效果添加了发光效果，使亮区更亮，暗区更暗。
   * </p>
   * <p>
   * 此阶段具有以下 uniforms： <code>contrast</code>、<code>brightness</code>、<code>glowOnly</code>、
   * <code>delta</code>、<code>sigma</code> 和 <code>stepSize</code>。
   * </p>
   * <ul>
   * <li><code>contrast</code> 是范围为 [-255.0, 255.0] 的标量值，影响效果的对比度。默认值为 <code>128.0</code>。</li>
   *
   * <li><code>brightness</code> 是一个标量值。输入纹理的 RGB 值被转换为色调、饱和度和亮度 (HSB)，然后将这个值添加到亮度中。默认值为 <code>-0.3</code>。</li>
   *
   * <li><code>glowOnly</code> 是一个布尔值。当 <code>true</code> 时，仅显示辉光效果；当 <code>false</code> 时，辉光将添加到输入纹理中。
   * 默认值为 <code>false</code>。这是一个调试选项，用于查看更改其他 uniform 值时的效果。</li>
   * </ul>
   * <p>
   * <code>delta</code>、<code>sigma</code> 和 <code>stepSize</code> 是与 {@link PostProcessStageLibrary#createBlurStage} 相同的属性。
   * 模糊应用于从图像生成的阴影，以使其更平滑。
   * </p>
   * <p>
   * 启用时，该阶段将在所有其他阶段之前执行。
   * </p>
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {PostProcessStageComposite}
   * @readonly
   */

  bloom: {
    get: function () {
      return this._bloom;
    },
  },
  /**
   * 此集合中的后处理阶段数。
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      removeStages(this);
      return this._stages.length;
    },
  },
  /**
   * 执行此集合中的后处理阶段时写入的最后一个纹理的引用。
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */

  outputTexture: {
    get: function () {
      const fxaa = this._fxaa;
      if (fxaa.enabled && fxaa.ready) {
        return this.getOutputTexture(fxaa.name);
      }

      const stages = this._stages;
      const length = stages.length;
      for (let i = length - 1; i >= 0; --i) {
        const stage = stages[i];
        if (defined(stage) && stage.ready && stage.enabled) {
          return this.getOutputTexture(stage.name);
        }
      }

      const tonemapping = this._tonemapping;
      if (tonemapping.enabled && tonemapping.ready) {
        return this.getOutputTexture(tonemapping.name);
      }

      const bloom = this._bloom;
      if (bloom.enabled && bloom.ready) {
        return this.getOutputTexture(bloom.name);
      }

      const ao = this._ao;
      if (ao.enabled && ao.ready) {
        return this.getOutputTexture(ao.name);
      }

      return undefined;
    },
  },
  /**
   * 集合是否有一个阶段具有选定的特征。
   *
   * @memberof PostProcessStageCollection.prototype
   * @type {boolean}
   * @readonly
   * @private
   */

  hasSelected: {
    get: function () {
      const stages = this._stages.slice();
      while (stages.length > 0) {
        const stage = stages.pop();
        if (!defined(stage)) {
          continue;
        }
        if (defined(stage.selected)) {
          return true;
        }
        const length = stage.length;
        if (defined(length)) {
          for (let i = 0; i < length; ++i) {
            stages.push(stage.get(i));
          }
        }
      }
      return false;
    },
  },

  /**
   * 指定在高动态范围渲染时使用的调色映射算法。
   * {@link https://sandcastle.cesium.com/?src=High%20Dynamic%20Range.html|Sandcastle Demo}
   *
   * @example viewer.scene.postProcessStages.tonemapper = Cesium.Tonemapper.ACES;
   *
   * @default Tonemapper.PBR_NEUTRAL
   * @memberof PostProcessStageCollection.prototype
   * @type {Tonemapper}
   */

  tonemapper: {
    get: function () {
      return this._tonemapper;
    },
    set: function (value) {
      if (this._tonemapper === value) {
        return;
      }
      //>>includeStart('debug', pragmas.debug);
      if (!validateTonemapper(value)) {
        throw new DeveloperError("tonemapper was set to an invalid value.");
      }
      //>>includeEnd('debug');

      if (defined(this._tonemapping)) {
        delete this._stageNames[this._tonemapping.name];
        this._tonemapping.destroy();
      }

      const useAutoExposure = this._autoExposureEnabled;
      let tonemapping;

      switch (value) {
        case Tonemapper.REINHARD:
          tonemapping =
            PostProcessStageLibrary.createReinhardTonemappingStage(
              useAutoExposure,
            );
          break;
        case Tonemapper.MODIFIED_REINHARD:
          tonemapping =
            PostProcessStageLibrary.createModifiedReinhardTonemappingStage(
              useAutoExposure,
            );
          break;
        case Tonemapper.FILMIC:
          tonemapping =
            PostProcessStageLibrary.createFilmicTonemappingStage(
              useAutoExposure,
            );
          break;
        case Tonemapper.PBR_NEUTRAL:
          tonemapping =
            PostProcessStageLibrary.createPbrNeutralTonemappingStage(
              useAutoExposure,
            );
          break;
        default:
          tonemapping =
            PostProcessStageLibrary.createAcesTonemappingStage(useAutoExposure);
          break;
      }

      if (useAutoExposure) {
        const autoexposure = this._autoExposure;
        tonemapping.uniforms.autoExposure = function () {
          return autoexposure.outputTexture;
        };
      } else {
        tonemapping.uniforms.exposure = this._exposure;
      }

      this._tonemapper = value;
      this._tonemapping = tonemapping;

      if (defined(this._stageNames)) {
        this._stageNames[tonemapping.name] = tonemapping;
        tonemapping._textureCache = this._textureCache;
      }

      this._textureCacheDirty = true;
    },
  },

  /**
   * 控制高动态范围 (HDR) 打开时的曝光。小于 1.0 会使调色映射变暗，而大于 1.0 会使其变亮。
   *
   * @example viewer.scene.postProcessStages.exposure = 1.0;
   *
   * @default 1.0
   * @memberof PostProcessStageCollection.prototype
   * @type {number}
   */

  exposure: {
    get: function () {
      return this._exposure;
    },
    set: function (value) {
      this._tonemapping.uniforms.exposure = value;
      this._exposure = value;
    },
  },
});

function removeStages(collection) {
  if (!collection._stagesRemoved) {
    return;
  }

  collection._stagesRemoved = false;

  const newStages = [];
  const stages = collection._stages;
  for (let i = 0, j = 0; i < stages.length; ++i) {
    const stage = stages[i];
    if (stage) {
      stage._index = j++;
      newStages.push(stage);
    }
  }

  collection._stages = newStages;
}

/**
 * 将后处理阶段添加到集合中。
 *
 * @param {PostProcessStage|PostProcessStageComposite} stage 要添加到集合中的后处理阶段。
 * @return {PostProcessStage|PostProcessStageComposite} 被添加到集合中的后处理阶段。
 *
 * @exception {DeveloperError} 后处理阶段已被添加到集合中或没有唯一名称。
 */

PostProcessStageCollection.prototype.add = function (stage) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("stage", stage);
  //>>includeEnd('debug');

  const stageNames = this._stageNames;

  const stack = stackScratch;
  stack.push(stage);
  while (stack.length > 0) {
    const currentStage = stack.pop();
    //>>includeStart('debug', pragmas.debug);
    if (defined(stageNames[currentStage.name])) {
      throw new DeveloperError(
        `${currentStage.name} has already been added to the collection or does not have a unique name.`,
      );
    }
    //>>includeEnd('debug');
    stageNames[currentStage.name] = currentStage;
    currentStage._textureCache = this._textureCache;

    const length = currentStage.length;
    if (defined(length)) {
      for (let i = 0; i < length; ++i) {
        stack.push(currentStage.get(i));
      }
    }
  }

  const stages = this._stages;
  stage._index = stages.length;
  stages.push(stage);
  this._textureCacheDirty = true;
  return stage;
};

/**
 * 从集合中移除一个后处理阶段并销毁它。
 *
 * @param {PostProcessStage|PostProcessStageComposite} stage 要从集合中移除的后处理阶段。
 * @return {boolean} 后处理阶段是否被成功移除。
 */

PostProcessStageCollection.prototype.remove = function (stage) {
  if (!this.contains(stage)) {
    return false;
  }

  const stageNames = this._stageNames;

  const stack = stackScratch;
  stack.push(stage);
  while (stack.length > 0) {
    const currentStage = stack.pop();
    delete stageNames[currentStage.name];

    const length = currentStage.length;
    if (defined(length)) {
      for (let i = 0; i < length; ++i) {
        stack.push(currentStage.get(i));
      }
    }
  }

  this._stages[stage._index] = undefined;
  this._stagesRemoved = true;
  this._textureCacheDirty = true;
  stage._index = undefined;
  stage._textureCache = undefined;
  stage.destroy();
  return true;
};

/**
 * 返回集合是否包含一个后处理阶段。
 *
 * @param {PostProcessStage|PostProcessStageComposite} stage 后处理阶段。
 * @return {boolean} 集合是否包含该后处理阶段。
 */
PostProcessStageCollection.prototype.contains = function (stage) {
  return (
    defined(stage) &&
    defined(stage._index) &&
    stage._textureCache === this._textureCache
  );
};

/**
 * 获取在 <code>index</code> 的后处理阶段。
 *
 * @param {number} index 后处理阶段的索引。
 * @return {PostProcessStage|PostProcessStageComposite} 指定索引的后处理阶段。
 */

PostProcessStageCollection.prototype.get = function (index) {
  removeStages(this);
  const stages = this._stages;
  //>>includeStart('debug', pragmas.debug);
  const length = stages.length;
  Check.typeOf.number.greaterThanOrEquals("stages length", length, 0);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThan("index", index, length);
  //>>includeEnd('debug');
  return stages[index];
};

/**
 * 从集合中移除所有后处理阶段并销毁它们。
 */
PostProcessStageCollection.prototype.removeAll = function () {
  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    this.remove(stages[i]);
  }
  stages.length = 0;
};

/**
 * 根据名称获取集合中的后处理阶段。
 *
 * @param {string} name 后处理阶段的名称。
 * @return {PostProcessStage|PostProcessStageComposite} 后处理阶段。
 *
 * @private
 */
PostProcessStageCollection.prototype.getStageByName = function (name) {
  return this._stageNames[name];
};

/**
 * 在集合中的后处理阶段执行之前调用。对每个阶段调用更新并创建 WebGL 资源。
 *
 * @param {Context} context 上下文。
 * @param {boolean} useLogDepth 场景是否使用对数深度缓冲区。
 *
 * @private
 */

PostProcessStageCollection.prototype.update = function (
  context,
  useLogDepth,
  useHdr,
) {
  removeStages(this);

  const previousActiveStages = this._activeStages;
  const activeStages = (this._activeStages = this._previousActiveStages);
  this._previousActiveStages = previousActiveStages;

  const stages = this._stages;
  activeStages.length = stages.length;

  let count = 0;
  for (let i = 0; i < stages.length; ++i) {
    const stage = stages[i];
    if (stage.ready && stage.enabled && stage._isSupported(context)) {
      activeStages[count++] = stage;
    }
  }
  activeStages.length = count;

  let activeStagesChanged = count !== previousActiveStages.length;
  if (!activeStagesChanged) {
    for (let i = 0; i < count; ++i) {
      if (activeStages[i] !== previousActiveStages[i]) {
        activeStagesChanged = true;
        break;
      }
    }
  }

  const ao = this._ao;
  const bloom = this._bloom;
  const autoexposure = this._autoExposure;
  const tonemapping = this._tonemapping;
  const fxaa = this._fxaa;

  tonemapping.enabled = useHdr;

  const aoEnabled = ao.enabled && ao._isSupported(context);
  const bloomEnabled = bloom.enabled && bloom._isSupported(context);
  const tonemappingEnabled =
    tonemapping.enabled && tonemapping._isSupported(context);
  const fxaaEnabled = fxaa.enabled && fxaa._isSupported(context);

  if (
    activeStagesChanged ||
    this._textureCacheDirty ||
    aoEnabled !== this._aoEnabled ||
    bloomEnabled !== this._bloomEnabled ||
    tonemappingEnabled !== this._tonemappingEnabled ||
    fxaaEnabled !== this._fxaaEnabled
  ) {
    // The number of stages to execute has changed.
    // Update dependencies and recreate framebuffers.
    this._textureCache.updateDependencies();

    this._aoEnabled = aoEnabled;
    this._bloomEnabled = bloomEnabled;
    this._tonemappingEnabled = tonemappingEnabled;
    this._fxaaEnabled = fxaaEnabled;
    this._textureCacheDirty = false;
  }

  if (defined(this._randomTexture) && !aoEnabled) {
    this._randomTexture.destroy();
    this._randomTexture = undefined;
  }

  if (!defined(this._randomTexture) && aoEnabled) {
    const length = 256 * 256 * 3;
    const random = new Uint8Array(length);
    for (let i = 0; i < length; i += 3) {
      random[i] = Math.floor(Math.random() * 255.0);
    }

    this._randomTexture = new Texture({
      context: context,
      pixelFormat: PixelFormat.RGB,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      source: {
        arrayBufferView: random,
        width: 256,
        height: 256,
      },
      sampler: new Sampler({
        wrapS: TextureWrap.REPEAT,
        wrapT: TextureWrap.REPEAT,
        minificationFilter: TextureMinificationFilter.NEAREST,
        magnificationFilter: TextureMagnificationFilter.NEAREST,
      }),
    });
  }

  this._textureCache.update(context);

  fxaa.update(context, useLogDepth);
  ao.update(context, useLogDepth);
  bloom.update(context, useLogDepth);
  tonemapping.update(context, useLogDepth);

  if (this._autoExposureEnabled) {
    autoexposure.update(context, useLogDepth);
  }

  for (let i = 0; i < stages.length; ++i) {
    stages[i].update(context, useLogDepth);
  }

  count = 0;
  for (let i = 0; i < stages.length; ++i) {
    const stage = stages[i];
    if (stage.ready && stage.enabled && stage._isSupported(context)) {
      count++;
    }
  }
  activeStagesChanged = count !== activeStages.length;
  if (activeStagesChanged) {
    this.update(context, useLogDepth, useHdr);
  }
};

/**
 * 清除所有阶段使用的帧缓冲区。
 *
 * @param {Context} context 上下文。
 *
 * @private
 */

PostProcessStageCollection.prototype.clear = function (context) {
  this._textureCache.clear(context);

  if (this._autoExposureEnabled) {
    this._autoExposure.clear(context);
  }
};

function getOutputTexture(stage) {
  while (defined(stage.length)) {
    stage = stage.get(stage.length - 1);
  }
  return stage.outputTexture;
}

/**
 * 获取具有给定名称的阶段的输出纹理。
 *
 * @param {string} stageName 阶段的名称。
 * @return {Texture|undefined} 由具有给定名称的阶段渲染的纹理。
 *
 * @private
 */

PostProcessStageCollection.prototype.getOutputTexture = function (stageName) {
  const stage = this.getStageByName(stageName);
  if (!defined(stage)) {
    return undefined;
  }
  return getOutputTexture(stage);
};

function execute(stage, context, colorTexture, depthTexture, idTexture) {
  if (defined(stage.execute)) {
    stage.execute(context, colorTexture, depthTexture, idTexture);
    return;
  }

  if (stage.inputPreviousStageTexture) {
    execute(stage.get(0), context, colorTexture, depthTexture, idTexture);
    for (let i = 1; i < stage.length; ++i) {
      execute(
        stage.get(i),
        context,
        getOutputTexture(stage.get(i - 1)),
        depthTexture,
        idTexture,
      );
    }
  } else {
    for (let i = 0; i < stage.length; ++i) {
      execute(stage.get(i), context, colorTexture, depthTexture, idTexture);
    }
  }
}

/**
 * 执行集合中所有准备好和启用的阶段。
 *
 * @param {Context} context 上下文。
 * @param {Texture} colorTexture 渲染到场景的颜色纹理。
 * @param {Texture} depthTexture 渲染到场景的深度纹理。
 * @param {Texture} idTexture 渲染到场景的 ID 纹理。
 *
 * @private
 */

PostProcessStageCollection.prototype.execute = function (
  context,
  colorTexture,
  depthTexture,
  idTexture,
) {
  const activeStages = this._activeStages;
  const length = activeStages.length;
  const fxaa = this._fxaa;
  const ao = this._ao;
  const bloom = this._bloom;
  const autoexposure = this._autoExposure;
  const tonemapping = this._tonemapping;

  const aoEnabled = ao.enabled && ao._isSupported(context);
  const bloomEnabled = bloom.enabled && bloom._isSupported(context);
  const autoExposureEnabled = this._autoExposureEnabled;
  const tonemappingEnabled =
    tonemapping.enabled && tonemapping._isSupported(context);
  const fxaaEnabled = fxaa.enabled && fxaa._isSupported(context);

  if (
    !fxaaEnabled &&
    !aoEnabled &&
    !bloomEnabled &&
    !tonemappingEnabled &&
    length === 0
  ) {
    return;
  }

  let initialTexture = colorTexture;
  if (aoEnabled && ao.ready) {
    execute(ao, context, initialTexture, depthTexture, idTexture);
    initialTexture = getOutputTexture(ao);
  }
  if (bloomEnabled && bloom.ready) {
    execute(bloom, context, initialTexture, depthTexture, idTexture);
    initialTexture = getOutputTexture(bloom);
  }
  if (autoExposureEnabled && autoexposure.ready) {
    execute(autoexposure, context, initialTexture, depthTexture, idTexture);
  }
  if (tonemappingEnabled && tonemapping.ready) {
    execute(tonemapping, context, initialTexture, depthTexture, idTexture);
    initialTexture = getOutputTexture(tonemapping);
  }

  let lastTexture = initialTexture;

  if (length > 0) {
    execute(activeStages[0], context, initialTexture, depthTexture, idTexture);
    for (let i = 1; i < length; ++i) {
      execute(
        activeStages[i],
        context,
        getOutputTexture(activeStages[i - 1]),
        depthTexture,
        idTexture,
      );
    }
    lastTexture = getOutputTexture(activeStages[length - 1]);
  }

  if (fxaaEnabled && fxaa.ready) {
    execute(fxaa, context, lastTexture, depthTexture, idTexture);
  }
};

/**
 * 将所有已执行阶段的输出复制到帧缓冲区的颜色纹理中。
 *
 * @param {Context} context 上下文。
 * @param {Framebuffer} framebuffer 要复制到的帧缓冲区。
 *
 * @private
 */

PostProcessStageCollection.prototype.copy = function (context, framebuffer) {
  if (!defined(this._copyColorCommand)) {
    const that = this;
    this._copyColorCommand = context.createViewportQuadCommand(PassThrough, {
      uniformMap: {
        colorTexture: function () {
          return that.outputTexture;
        },
      },
      owner: this,
    });
  }

  this._copyColorCommand.framebuffer = framebuffer;
  this._copyColorCommand.execute(context);
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see PostProcessStageCollection#destroy
 */
PostProcessStageCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地释放
 * WebGL 资源，而不是依赖于垃圾收集器销毁此对象。
 * <p>
 * 一旦对象被销毁，就不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。因此，
 * 将返回值 (<code>undefined</code>) 赋给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PostProcessStageCollection#isDestroyed
 */

PostProcessStageCollection.prototype.destroy = function () {
  this._fxaa.destroy();
  this._ao.destroy();
  this._bloom.destroy();
  this._autoExposure.destroy();
  this._tonemapping.destroy();
  this.removeAll();
  this._textureCache = this._textureCache && this._textureCache.destroy();
  return destroyObject(this);
};
export default PostProcessStageCollection;
