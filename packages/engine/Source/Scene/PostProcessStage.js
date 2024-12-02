import BoundingRectangle from "../Core/BoundingRectangle.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import combine from "../Core/combine.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import PixelFormat from "../Core/PixelFormat.js";
import Resource from "../Core/Resource.js";
import PassState from "../Renderer/PassState.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import RenderState from "../Renderer/RenderState.js";
import Sampler from "../Renderer/Sampler.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import PostProcessStageSampleMode from "./PostProcessStageSampleMode.js";

/**
 * 在场景渲染的纹理或先前后处理阶段的输出上运行后处理阶段。
 *
 * @alias PostProcessStage
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {string} options.fragmentShader 要使用的片段着色器。默认的 <code>sampler2D</code> uniforms 是 <code>colorTexture</code> 和 <code>depthTexture</code>。色彩纹理是渲染场景的输出或先前阶段的输出。深度纹理是渲染场景的输出。着色器应包含一个或两个 uniforms。还有一个名为 <code>v_textureCoordinates</code> 的 <code>vec2</code> 变量，用于采样纹理。
 * @param {object} [options.uniforms] 一个对象，其属性将用于设置着色器的 uniforms。属性可以是常量值或函数。常量值也可以是 URI、数据 URI 或作为纹理使用的 HTML 元素。
 * @param {number} [options.textureScale=1.0] 范围在 (0.0, 1.0] 的数字，用于缩放纹理的尺寸。缩放为 1.0 将把此后处理阶段渲染到与视口大小相同的纹理上。
 * @param {boolean} [options.forcePowerOfTwo=false] 是否强制纹理的维度都为相等的二次幂。二次幂将是维度最小值的下一个二次幂。
 * @param {PostProcessStageSampleMode} [options.sampleMode=PostProcessStageSampleMode.NEAREST] 如何对输入颜色纹理进行采样。
 * @param {PixelFormat} [options.pixelFormat=PixelFormat.RGBA] 输出纹理的颜色像素格式。
 * @param {PixelDatatype} [options.pixelDatatype=PixelDatatype.UNSIGNED_BYTE] 输出纹理的像素数据类型。
 * @param {Color} [options.clearColor=Color.BLACK] 用于清除输出纹理的颜色。
 * @param {BoundingRectangle} [options.scissorRectangle] 用于剪切测试的矩形。
 * @param {string} [options.name=createGuid()] 此后处理阶段的唯一名称，以便其他阶段在复合中引用。如果未提供名称，则将生成一个 GUID。
 *
 * @exception {DeveloperError} options.textureScale 必须大于 0.0 并且小于或等于 1.0。
 * @exception {DeveloperError} options.pixelFormat 必须为颜色格式。
 * @exception {DeveloperError} 当 options.pixelDatatype 为 FLOAT 时，此 WebGL 实现必须支持浮动点纹理。检查上下文的 floatingPointTexture。
 *
 * @see PostProcessStageComposite
 *
 * @example
 * // Simple stage to change the color
 * const fs =`
 *     uniform sampler2D colorTexture;
 *     in vec2 v_textureCoordinates;
 *     uniform float scale;
 *     uniform vec3 offset;
 *     void main() {
 *         vec4 color = texture(colorTexture, v_textureCoordinates);
 *         out_FragColor = vec4(color.rgb * scale + offset, 1.0);
 *     }`;
 * scene.postProcessStages.add(new Cesium.PostProcessStage({
 *     fragmentShader : fs,
 *     uniforms : {
 *         scale : 1.1,
 *         offset : function() {
 *             return new Cesium.Cartesian3(0.1, 0.2, 0.3);
 *         }
 *     }
 * }));
 *
 * @example
 * // Simple stage to change the color of what is selected.
 * // If czm_selected returns true, the current fragment belongs to geometry in the selected array.
 * const fs =`
 *     uniform sampler2D colorTexture;
 *     in vec2 v_textureCoordinates;
 *     uniform vec4 highlight;
 *     void main() {
 *         vec4 color = texture(colorTexture, v_textureCoordinates);
 *         if (czm_selected()) {
 *             vec3 highlighted = highlight.a * highlight.rgb + (1.0 - highlight.a) * color.rgb;
 *             out_FragColor = vec4(highlighted, 1.0);
 *         } else {
 *             out_FragColor = color;
 *         }
 *     }`;
 * const stage = scene.postProcessStages.add(new Cesium.PostProcessStage({
 *     fragmentShader : fs,
 *     uniforms : {
 *         highlight : function() {
 *             return new Cesium.Color(1.0, 0.0, 0.0, 0.5);
 *         }
 *     }
 * }));
 * stage.selected = [cesium3DTileFeature];
 */
function PostProcessStage(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const {
    fragmentShader,
    textureScale = 1.0,
    pixelFormat = PixelFormat.RGBA,
  } = options;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.fragmentShader", fragmentShader);
  Check.typeOf.number.greaterThan("options.textureScale", textureScale, 0.0);
  Check.typeOf.number.lessThanOrEquals(
    "options.textureScale",
    textureScale,
    1.0,
  );
  if (!PixelFormat.isColorFormat(pixelFormat)) {
    throw new DeveloperError("options.pixelFormat must be a color format.");
  }
  //>>includeEnd('debug');

  this._fragmentShader = fragmentShader;
  this._uniforms = options.uniforms;
  this._textureScale = textureScale;
  this._forcePowerOfTwo = defaultValue(options.forcePowerOfTwo, false);
  this._sampleMode = defaultValue(
    options.sampleMode,
    PostProcessStageSampleMode.NEAREST,
  );
  this._pixelFormat = pixelFormat;
  this._pixelDatatype = defaultValue(
    options.pixelDatatype,
    PixelDatatype.UNSIGNED_BYTE,
  );
  this._clearColor = defaultValue(options.clearColor, Color.BLACK);

  this._uniformMap = undefined;
  this._command = undefined;

  this._colorTexture = undefined;
  this._depthTexture = undefined;
  this._idTexture = undefined;

  this._actualUniforms = {};
  this._dirtyUniforms = [];
  this._texturesToRelease = [];
  this._texturesToCreate = [];
  this._texturePromise = undefined;

  const passState = new PassState();
  passState.scissorTest = {
    enabled: true,
    rectangle: defined(options.scissorRectangle)
      ? BoundingRectangle.clone(options.scissorRectangle)
      : new BoundingRectangle(),
  };
  this._passState = passState;

  this._ready = false;

  let name = options.name;
  if (!defined(name)) {
    name = createGuid();
  }
  this._name = name;

  this._logDepthChanged = undefined;
  this._useLogDepth = undefined;

  this._selectedIdTexture = undefined;
  this._selected = undefined;
  this._selectedShadow = undefined;
  this._parentSelected = undefined;
  this._parentSelectedShadow = undefined;
  this._combinedSelected = undefined;
  this._combinedSelectedShadow = undefined;
  this._selectedLength = 0;
  this._parentSelectedLength = 0;
  this._selectedDirty = true;

  // set by PostProcessStageCollection
  this._textureCache = undefined;
  this._index = undefined;

  /**
   * 是否在准备好时执行此后处理阶段。
   *
   * @type {boolean}
   */

  this.enabled = true;
  this._enabled = true;
}

Object.defineProperties(PostProcessStage.prototype, {
  /**
   * 确定此后处理阶段是否准备好执行。只有在 <code>ready</code>
   * 和 {@link PostProcessStage#enabled} 都为 <code>true</code> 时才会执行该阶段。等待纹理
   * 加载时，该阶段不会准备好。
   *
   * @memberof PostProcessStage.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },
  /**
   * 此后处理阶段的唯一名称，以便其他阶段在 {@link PostProcessStageComposite} 中引用。
   *
   * @memberof PostProcessStage.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },
  /**
   * 执行此后处理阶段时要使用的片段着色器。
   * <p>
   * 着色器必须包含 <code>colorTexture</code>、<code>depthTexture</code> 或者两者的采样器 uniform 声明。
   * </p>
   * <p>
   * 着色器必须包含一个 <code>vec2</code> 变量声明，用于 <code>v_textureCoordinates</code> 以便对
   * 纹理 uniforms 进行采样。
   * </p>
   *
   * @memberof PostProcessStage.prototype
   * @type {string}
   * @readonly
   */
  fragmentShader: {
    get: function () {
      return this._fragmentShader;
    },
  },
  /**
   * 一个对象，其属性用于设置片段着色器的 uniforms。
   * <p>
   * 对象属性值可以是常量或函数。该函数将在每帧执行后处理阶段之前被调用。
   * </p>
   * <p>
   * 常量值也可以是图像的 URI、数据 URI，或可以作为纹理使用的 HTML 元素，例如 HTMLImageElement 或 HTMLCanvasElement。
   * </p>
   * <p>
   * 如果此后处理阶段是 {@link PostProcessStageComposite} 的一部分且不是按顺序执行的，则常量值也可以是
   * 复合中另一个阶段的名称。这将把 uniform 设置为输出纹理，该阶段使用该名称。
   * </p>
   *
   * @memberof PostProcessStage.prototype
   * @type {object}
   * @readonly
   */
  uniforms: {
    get: function () {
      return this._uniforms;
    },
  },
  /**
   * 范围在 (0.0, 1.0] 的数字，用于缩放输出纹理的尺寸。缩放为 1.0 将把此后处理阶段渲染到与视口大小相同的纹理上。
   *
   * @memberof PostProcessStage.prototype
   * @type {number}
   * @readonly
   */
  textureScale: {
    get: function () {
      return this._textureScale;
    },
  },
  /**
   * 是否强制输出纹理的维度都为相等的二次幂。二次幂将是维度最小值的下一个二次幂。
   *
   * @memberof PostProcessStage.prototype
   * @type {boolean}
   * @readonly
   */
  forcePowerOfTwo: {
    get: function () {
      return this._forcePowerOfTwo;
    },
  },
  /**
   * 如何对输入颜色纹理进行采样。
   *
   * @memberof PostProcessStage.prototype
   * @type {PostProcessStageSampleMode}
   * @readonly
   */
  sampleMode: {
    get: function () {
      return this._sampleMode;
    },
  },
  /**
   * 输出纹理的颜色像素格式。
   *
   * @memberof PostProcessStage.prototype
   * @type {PixelFormat}
   * @readonly
   */
  pixelFormat: {
    get: function () {
      return this._pixelFormat;
    },
  },
  /**
   * 输出纹理的像素数据类型。
   *
   * @memberof PostProcessStage.prototype
   * @type {PixelDatatype}
   * @readonly
   */
  pixelDatatype: {
    get: function () {
      return this._pixelDatatype;
    },
  },
  /**
   * 用于清除输出纹理的颜色。
   *
   * @memberof PostProcessStage.prototype
   * @type {Color}
   * @readonly
   */
  clearColor: {
    get: function () {
      return this._clearColor;
    },
  },
  /**
   * 用于剪切测试的 {@link BoundingRectangle}。默认的包围矩形将禁用剪切测试。
   *
   * @memberof PostProcessStage.prototype
   * @type {BoundingRectangle}
   * @readonly
   */
  scissorRectangle: {
    get: function () {
      return this._passState.scissorTest.rectangle;
    },
  },
  /**
   * 执行此后处理阶段时写入的纹理的引用。
   *
   * @memberof PostProcessStage.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  outputTexture: {
    get: function () {
      if (defined(this._textureCache)) {
        const framebuffer = this._textureCache.getFramebuffer(this._name);
        if (defined(framebuffer)) {
          return framebuffer.getColorTexture(0);
        }
      }
      return undefined;
    },
  },
  /**
   * 应用后处理的特征选择。
   * <p>
   * 在片段着色器中，使用 <code>czm_selected</code> 来确定是否将后处理阶段应用于该片段。例如：
   * <code>
   * if (czm_selected(v_textureCoordinates)) {
   *     // apply post-process stage
   * } else {
   *     out_FragColor = texture(colorTexture, v_textureCoordinates);
   * }
   * </code>
   * </p>
   *
   * @memberof PostProcessStage.prototype
   * @type {Array}
   */
  selected: {
    get: function () {
      return this._selected;
    },
    set: function (value) {
      this._selected = value;
    },
  },
  /**
   * @private
   */
  parentSelected: {
    get: function () {
      return this._parentSelected;
    },
    set: function (value) {
      this._parentSelected = value;
    },
  },
});


const depthTextureRegex = /uniform\s+sampler2D\s+depthTexture/g;

/**
 * @private
 */
PostProcessStage.prototype._isSupported = function (context) {
  return !depthTextureRegex.test(this._fragmentShader) || context.depthTexture;
};

function getUniformValueGetterAndSetter(stage, uniforms, name) {
  const currentValue = uniforms[name];
  if (
    typeof currentValue === "string" ||
    currentValue instanceof HTMLCanvasElement ||
    currentValue instanceof HTMLImageElement ||
    currentValue instanceof HTMLVideoElement ||
    currentValue instanceof ImageData
  ) {
    stage._dirtyUniforms.push(name);
  }

  return {
    get: function () {
      return uniforms[name];
    },
    set: function (value) {
      const currentValue = uniforms[name];
      uniforms[name] = value;

      const actualUniforms = stage._actualUniforms;
      const actualValue = actualUniforms[name];
      if (
        defined(actualValue) &&
        actualValue !== currentValue &&
        actualValue instanceof Texture &&
        !defined(stage._textureCache.getStageByName(name))
      ) {
        stage._texturesToRelease.push(actualValue);
        delete actualUniforms[name];
        delete actualUniforms[`${name}Dimensions`];
      }

      if (currentValue instanceof Texture) {
        stage._texturesToRelease.push(currentValue);
      }

      if (
        typeof value === "string" ||
        value instanceof HTMLCanvasElement ||
        value instanceof HTMLImageElement ||
        value instanceof HTMLVideoElement ||
        value instanceof ImageData
      ) {
        stage._dirtyUniforms.push(name);
      } else {
        actualUniforms[name] = value;
      }
    },
  };
}

function getUniformMapFunction(stage, name) {
  return function () {
    const value = stage._actualUniforms[name];
    if (typeof value === "function") {
      return value();
    }
    return value;
  };
}

function getUniformMapDimensionsFunction(uniformMap, name) {
  return function () {
    const texture = uniformMap[name]();
    if (defined(texture)) {
      return texture.dimensions;
    }
    return undefined;
  };
}

function createUniformMap(stage) {
  if (defined(stage._uniformMap)) {
    return;
  }

  const uniformMap = {};
  const newUniforms = {};
  const uniforms = stage._uniforms;
  const actualUniforms = stage._actualUniforms;
  for (const name in uniforms) {
    if (!uniforms.hasOwnProperty(name)) {
      continue;
    }
    if (typeof uniforms[name] !== "function") {
      uniformMap[name] = getUniformMapFunction(stage, name);
      newUniforms[name] = getUniformValueGetterAndSetter(stage, uniforms, name);
    } else {
      uniformMap[name] = uniforms[name];
      newUniforms[name] = uniforms[name];
    }

    actualUniforms[name] = uniforms[name];

    const value = uniformMap[name]();
    if (
      typeof value === "string" ||
      value instanceof Texture ||
      value instanceof HTMLImageElement ||
      value instanceof HTMLCanvasElement ||
      value instanceof HTMLVideoElement
    ) {
      uniformMap[`${name}Dimensions`] = getUniformMapDimensionsFunction(
        uniformMap,
        name,
      );
    }
  }

  stage._uniforms = {};
  Object.defineProperties(stage._uniforms, newUniforms);

  stage._uniformMap = combine(uniformMap, {
    colorTexture: function () {
      return stage._colorTexture;
    },
    colorTextureDimensions: function () {
      return stage._colorTexture.dimensions;
    },
    depthTexture: function () {
      return stage._depthTexture;
    },
    depthTextureDimensions: function () {
      return stage._depthTexture.dimensions;
    },
    czm_idTexture: function () {
      return stage._idTexture;
    },
    czm_selectedIdTexture: function () {
      return stage._selectedIdTexture;
    },
    czm_selectedIdTextureStep: function () {
      return 1.0 / stage._selectedIdTexture.width;
    },
  });
}

function addSelectedIdToShader(shaderSource, idTextureWidth) {
  shaderSource = shaderSource.replace(/in\s+vec2\s+v_textureCoordinates;/g, "");
  return `#define CZM_SELECTED_FEATURE
uniform sampler2D czm_idTexture;
uniform sampler2D czm_selectedIdTexture;
uniform float czm_selectedIdTextureStep;
in vec2 v_textureCoordinates;
bool czm_selected(vec2 offset)
{
    bool selected = false;
    vec4 id = texture(czm_idTexture, v_textureCoordinates + offset);
    for (int i = 0; i < ${idTextureWidth}; ++i)
    {
        vec4 selectedId = texture(czm_selectedIdTexture, vec2((float(i) + 0.5) * czm_selectedIdTextureStep, 0.5));
        if (all(equal(id, selectedId)))
        {
            return true;
        }
    }
    return false;
}
bool czm_selected()
{
    return czm_selected(vec2(0.0));
}

${shaderSource}`;
}

function createDrawCommand(stage, context) {
  if (
    defined(stage._command) &&
    !stage._logDepthChanged &&
    !stage._selectedDirty
  ) {
    return;
  }

  let fragmentShaderSource = stage._fragmentShader;
  if (defined(stage._selectedIdTexture)) {
    const width = stage._selectedIdTexture.width;
    fragmentShaderSource = addSelectedIdToShader(fragmentShaderSource, width);
  }

  const fragmentShader = new ShaderSource({
    defines: [stage._useLogDepth ? "LOG_DEPTH" : ""],
    sources: [fragmentShaderSource],
  });
  stage._command = context.createViewportQuadCommand(fragmentShader, {
    uniformMap: stage._uniformMap,
    owner: stage,
  });
}

function createSampler(stage) {
  const mode = stage._sampleMode;

  let minFilter;
  let magFilter;

  if (mode === PostProcessStageSampleMode.LINEAR) {
    minFilter = TextureMinificationFilter.LINEAR;
    magFilter = TextureMagnificationFilter.LINEAR;
  } else {
    minFilter = TextureMinificationFilter.NEAREST;
    magFilter = TextureMagnificationFilter.NEAREST;
  }

  const sampler = stage._sampler;
  if (
    !defined(sampler) ||
    sampler.minificationFilter !== minFilter ||
    sampler.magnificationFilter !== magFilter
  ) {
    stage._sampler = new Sampler({
      wrapS: TextureWrap.CLAMP_TO_EDGE,
      wrapT: TextureWrap.CLAMP_TO_EDGE,
      minificationFilter: minFilter,
      magnificationFilter: magFilter,
    });
  }
}

function createLoadImageFunction(stage, name) {
  return function (image) {
    stage._texturesToCreate.push({
      name: name,
      source: image,
    });
  };
}

function createStageOutputTextureFunction(stage, name) {
  return function () {
    return stage._textureCache.getOutputTexture(name);
  };
}

function updateUniformTextures(stage, context) {
  const texturesToRelease = stage._texturesToRelease;
  for (let i = 0; i < texturesToRelease.length; ++i) {
    let texture = texturesToRelease[i];
    texture = texture && texture.destroy();
  }
  texturesToRelease.length = 0;

  const texturesToCreate = stage._texturesToCreate;
  for (let i = 0; i < texturesToCreate.length; ++i) {
    const { name, source } = texturesToCreate[i];
    stage._actualUniforms[name] = new Texture({
      context: context,
      source: source,
    });
  }
  texturesToCreate.length = 0;

  const dirtyUniforms = stage._dirtyUniforms;
  if (dirtyUniforms.length === 0 && !defined(stage._texturePromise)) {
    stage._ready = true;
    return;
  }

  if (dirtyUniforms.length === 0 || defined(stage._texturePromise)) {
    return;
  }

  const uniforms = stage._uniforms;
  const promises = [];
  for (let i = 0; i < dirtyUniforms.length; ++i) {
    const name = dirtyUniforms[i];
    const stageNameUrlOrImage = uniforms[name];
    const stageWithName =
      stage._textureCache.getStageByName(stageNameUrlOrImage);
    if (defined(stageWithName)) {
      stage._actualUniforms[name] = createStageOutputTextureFunction(
        stage,
        stageNameUrlOrImage,
      );
    } else if (typeof stageNameUrlOrImage === "string") {
      const resource = new Resource({
        url: stageNameUrlOrImage,
      });

      promises.push(
        resource.fetchImage().then(createLoadImageFunction(stage, name)),
      );
    } else {
      stage._texturesToCreate.push({
        name: name,
        source: stageNameUrlOrImage,
      });
    }
  }

  dirtyUniforms.length = 0;

  if (promises.length > 0) {
    stage._ready = false;
    stage._texturePromise = Promise.all(promises).then(function () {
      stage._ready = true;
      stage._texturePromise = undefined;
    });
  } else {
    stage._ready = true;
  }
}

function releaseResources(stage) {
  if (defined(stage._command)) {
    stage._command.shaderProgram =
      stage._command.shaderProgram && stage._command.shaderProgram.destroy();
    stage._command = undefined;
  }

  stage._selectedIdTexture =
    stage._selectedIdTexture && stage._selectedIdTexture.destroy();

  const textureCache = stage._textureCache;
  if (!defined(textureCache)) {
    return;
  }

  const uniforms = stage._uniforms;
  const actualUniforms = stage._actualUniforms;
  for (const name in actualUniforms) {
    if (!actualUniforms.hasOwnProperty(name)) {
      continue;
    }
    const actualUniform = actualUniforms[name];
    if (actualUniform instanceof Texture) {
      if (!defined(textureCache.getStageByName(uniforms[name]))) {
        actualUniform.destroy();
      }
      stage._dirtyUniforms.push(name);
    }
  }
}

function isSelectedTextureDirty(stage) {
  const length = defined(stage._selected) ? stage._selected.length : 0;
  const parentLength = defined(stage._parentSelected)
    ? stage._parentSelected
    : 0;
  const dirty =
    stage._selected !== stage._selectedShadow ||
    length !== stage._selectedLength ||
    stage._parentSelected !== stage._parentSelectedShadow ||
    parentLength !== stage._parentSelectedLength;

  if (defined(stage._selected) && defined(stage._parentSelected)) {
    stage._combinedSelected = stage._selected.concat(stage._parentSelected);
  } else if (defined(stage._parentSelected)) {
    stage._combinedSelected = stage._parentSelected;
  } else {
    stage._combinedSelected = stage._selected;
  }

  if (!dirty && defined(stage._combinedSelected)) {
    if (!defined(stage._combinedSelectedShadow)) {
      return true;
    }

    for (let i = 0; i < stage._combinedSelected.length; ++i) {
      if (stage._combinedSelected[i] !== stage._combinedSelectedShadow[i]) {
        return true;
      }
    }
  }
  return dirty;
}

function createSelectedTexture(stage, context) {
  if (!stage._selectedDirty) {
    return;
  }

  stage._selectedIdTexture =
    stage._selectedIdTexture && stage._selectedIdTexture.destroy();
  stage._selectedIdTexture = undefined;

  const features = stage._combinedSelected;
  if (!defined(features)) {
    return;
  }

  let textureLength = 0;
  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];
    if (defined(feature.pickIds)) {
      textureLength += feature.pickIds.length;
    } else if (defined(feature.pickId)) {
      ++textureLength;
    }
  }

  if (features.length === 0 || textureLength === 0) {
    // max pick id is reserved
    const empty = new Uint8Array([255, 255, 255, 255]);
    stage._selectedIdTexture = new Texture({
      context: context,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      source: {
        arrayBufferView: empty,
        width: 1,
        height: 1,
      },
      sampler: Sampler.NEAREST,
    });
    return;
  }

  let offset = 0;
  const ids = new Uint8Array(textureLength * 4);
  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];
    if (defined(feature.pickIds)) {
      const pickIds = feature.pickIds;
      const pickIdsLength = pickIds.length;
      for (let j = 0; j < pickIdsLength; ++j) {
        const pickColor = pickIds[j].color;
        ids[offset] = Color.floatToByte(pickColor.red);
        ids[offset + 1] = Color.floatToByte(pickColor.green);
        ids[offset + 2] = Color.floatToByte(pickColor.blue);
        ids[offset + 3] = Color.floatToByte(pickColor.alpha);
        offset += 4;
      }
    } else if (defined(feature.pickId)) {
      const pickColor = feature.pickId.color;
      ids[offset] = Color.floatToByte(pickColor.red);
      ids[offset + 1] = Color.floatToByte(pickColor.green);
      ids[offset + 2] = Color.floatToByte(pickColor.blue);
      ids[offset + 3] = Color.floatToByte(pickColor.alpha);
      offset += 4;
    }
  }

  stage._selectedIdTexture = new Texture({
    context: context,
    pixelFormat: PixelFormat.RGBA,
    pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
    source: {
      arrayBufferView: ids,
      width: textureLength,
      height: 1,
    },
    sampler: Sampler.NEAREST,
  });
}

/**
 * 在执行之前被调用的函数。用于创建 WebGL 资源并加载任何纹理。
 * @param {Context} context 上下文。
 * @param {boolean} useLogDepth 场景是否使用对数深度缓冲区。
 * @private
 */

PostProcessStage.prototype.update = function (context, useLogDepth) {
  if (this.enabled !== this._enabled && !this.enabled) {
    releaseResources(this);
  }

  this._enabled = this.enabled;
  if (!this._enabled) {
    return;
  }

  this._logDepthChanged = useLogDepth !== this._useLogDepth;
  this._useLogDepth = useLogDepth;

  this._selectedDirty = isSelectedTextureDirty(this);

  this._selectedShadow = this._selected;
  this._parentSelectedShadow = this._parentSelected;
  this._combinedSelectedShadow = this._combinedSelected;
  this._selectedLength = defined(this._selected) ? this._selected.length : 0;
  this._parentSelectedLength = defined(this._parentSelected)
    ? this._parentSelected.length
    : 0;

  createSelectedTexture(this, context);
  createUniformMap(this);
  updateUniformTextures(this, context);
  createDrawCommand(this, context);
  createSampler(this);

  this._selectedDirty = false;

  if (!this._ready) {
    return;
  }

  const framebuffer = this._textureCache.getFramebuffer(this._name);
  this._command.framebuffer = framebuffer;

  if (!defined(framebuffer)) {
    return;
  }

  const colorTexture = framebuffer.getColorTexture(0);
  let renderState;
  if (
    colorTexture.width !== context.drawingBufferWidth ||
    colorTexture.height !== context.drawingBufferHeight
  ) {
    renderState = this._renderState;
    if (
      !defined(renderState) ||
      colorTexture.width !== renderState.viewport.width ||
      colorTexture.height !== renderState.viewport.height
    ) {
      this._renderState = RenderState.fromCache({
        viewport: new BoundingRectangle(
          0,
          0,
          colorTexture.width,
          colorTexture.height,
        ),
      });
    }
  }

  this._command.renderState = renderState;
};

/**
 * 执行后处理阶段。颜色纹理是由场景渲染的纹理或来自先前阶段的纹理。
 * @param {Context} context 上下文。
 * @param {Texture} colorTexture 输入的颜色纹理。
 * @param {Texture} depthTexture 输入的深度纹理。
 * @param {Texture} idTexture ID 纹理。
 * @private
 */

PostProcessStage.prototype.execute = function (
  context,
  colorTexture,
  depthTexture,
  idTexture,
) {
  if (
    !defined(this._command) ||
    !defined(this._command.framebuffer) ||
    !this._ready ||
    !this._enabled
  ) {
    return;
  }

  this._colorTexture = colorTexture;
  this._depthTexture = depthTexture;
  this._idTexture = idTexture;

  if (!Sampler.equals(this._colorTexture.sampler, this._sampler)) {
    this._colorTexture.sampler = this._sampler;
  }

  const passState =
    this.scissorRectangle.width > 0 && this.scissorRectangle.height > 0
      ? this._passState
      : undefined;
  if (defined(passState)) {
    passState.context = context;
  }

  this._command.execute(context, passState);
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see PostProcessStage#destroy
 */
PostProcessStage.prototype.isDestroyed = function () {
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
 * @see PostProcessStage#isDestroyed
 */

PostProcessStage.prototype.destroy = function () {
  releaseResources(this);
  return destroyObject(this);
};
export default PostProcessStage;
