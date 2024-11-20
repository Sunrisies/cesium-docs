import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import deprecationWarning from "../Core/deprecationWarning.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Geometry from "../Core/Geometry.js";
import GeometryAttribute from "../Core/GeometryAttribute.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Matrix4 from "../Core/Matrix4.js";
import PixelFormat from "../Core/PixelFormat.js";
import PrimitiveType from "../Core/PrimitiveType.js";
import RuntimeError from "../Core/RuntimeError.js";
import WebGLConstants from "../Core/WebGLConstants.js";
import ViewportQuadVS from "../Shaders/ViewportQuadVS.js";
import BufferUsage from "./BufferUsage.js";
import ClearCommand from "./ClearCommand.js";
import ContextLimits from "./ContextLimits.js";
import CubeMap from "./CubeMap.js";
import DrawCommand from "./DrawCommand.js";
import PassState from "./PassState.js";
import PixelDatatype from "./PixelDatatype.js";
import RenderState from "./RenderState.js";
import ShaderCache from "./ShaderCache.js";
import ShaderProgram from "./ShaderProgram.js";
import Texture from "./Texture.js";
import TextureCache from "./TextureCache.js";
import UniformState from "./UniformState.js";
import VertexArray from "./VertexArray.js";

/**
 * @private
 * @constructor
 *
 * @param {HTMLCanvasElement} canvas 要关联上下文的画布元素
 * @param {ContextOptions} [options] 控制上下文的 WebGL 设置的选项
 */

function Context(canvas, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("canvas", canvas);
  //>>includeEnd('debug');

  const {
    getWebGLStub,
    requestWebgl1,
    webgl: webglOptions = {},
    allowTextureFilterAnisotropic = true,
  } = defaultValue(options, {});

  // Override select WebGL defaults
  webglOptions.alpha = defaultValue(webglOptions.alpha, false); // WebGL default is true
  webglOptions.stencil = defaultValue(webglOptions.stencil, true); // WebGL default is false
  webglOptions.powerPreference = defaultValue(
    webglOptions.powerPreference,
    "high-performance",
  ); // WebGL default is "default"

  const glContext = defined(getWebGLStub)
    ? getWebGLStub(canvas, webglOptions)
    : getWebGLContext(canvas, webglOptions, requestWebgl1);

  // Get context type. instanceof will throw if WebGL2 is not supported
  const webgl2Supported = typeof WebGL2RenderingContext !== "undefined";
  const webgl2 = webgl2Supported && glContext instanceof WebGL2RenderingContext;

  this._canvas = canvas;
  this._originalGLContext = glContext;
  this._gl = glContext;
  this._webgl2 = webgl2;
  this._id = createGuid();

  // Validation and logging disabled by default for speed.
  this.validateFramebuffer = false;
  this.validateShaderProgram = false;
  this.logShaderCompilation = false;

  this._throwOnWebGLError = false;

  this._shaderCache = new ShaderCache(this);
  this._textureCache = new TextureCache();

  const gl = glContext;

  this._stencilBits = gl.getParameter(gl.STENCIL_BITS);

  ContextLimits._maximumCombinedTextureImageUnits = gl.getParameter(
    gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS,
  ); // min: 8
  ContextLimits._maximumCubeMapSize = gl.getParameter(
    gl.MAX_CUBE_MAP_TEXTURE_SIZE,
  ); // min: 16
  ContextLimits._maximumFragmentUniformVectors = gl.getParameter(
    gl.MAX_FRAGMENT_UNIFORM_VECTORS,
  ); // min: 16
  ContextLimits._maximumTextureImageUnits = gl.getParameter(
    gl.MAX_TEXTURE_IMAGE_UNITS,
  ); // min: 8
  ContextLimits._maximumRenderbufferSize = gl.getParameter(
    gl.MAX_RENDERBUFFER_SIZE,
  ); // min: 1
  ContextLimits._maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE); // min: 64
  ContextLimits._maximumVaryingVectors = gl.getParameter(
    gl.MAX_VARYING_VECTORS,
  ); // min: 8
  ContextLimits._maximumVertexAttributes = gl.getParameter(
    gl.MAX_VERTEX_ATTRIBS,
  ); // min: 8
  ContextLimits._maximumVertexTextureImageUnits = gl.getParameter(
    gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS,
  ); // min: 0
  ContextLimits._maximumVertexUniformVectors = gl.getParameter(
    gl.MAX_VERTEX_UNIFORM_VECTORS,
  ); // min: 128

  ContextLimits._maximumSamples = this._webgl2
    ? gl.getParameter(gl.MAX_SAMPLES)
    : 0;

  const aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE); // must include 1
  ContextLimits._minimumAliasedLineWidth = aliasedLineWidthRange[0];
  ContextLimits._maximumAliasedLineWidth = aliasedLineWidthRange[1];

  const aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE); // must include 1
  ContextLimits._minimumAliasedPointSize = aliasedPointSizeRange[0];
  ContextLimits._maximumAliasedPointSize = aliasedPointSizeRange[1];

  const maximumViewportDimensions = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  ContextLimits._maximumViewportWidth = maximumViewportDimensions[0];
  ContextLimits._maximumViewportHeight = maximumViewportDimensions[1];

  const highpFloat = gl.getShaderPrecisionFormat(
    gl.FRAGMENT_SHADER,
    gl.HIGH_FLOAT,
  );
  ContextLimits._highpFloatSupported = highpFloat.precision !== 0;
  const highpInt = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT);
  ContextLimits._highpIntSupported = highpInt.rangeMax !== 0;

  this._antialias = gl.getContextAttributes().antialias;

  // Query and initialize extensions
  this._standardDerivatives = !!getExtension(gl, ["OES_standard_derivatives"]);
  this._blendMinmax = !!getExtension(gl, ["EXT_blend_minmax"]);
  this._elementIndexUint = !!getExtension(gl, ["OES_element_index_uint"]);
  this._depthTexture = !!getExtension(gl, [
    "WEBGL_depth_texture",
    "WEBKIT_WEBGL_depth_texture",
  ]);
  this._fragDepth = !!getExtension(gl, ["EXT_frag_depth"]);
  this._debugShaders = getExtension(gl, ["WEBGL_debug_shaders"]);

  this._textureFloat = !!getExtension(gl, ["OES_texture_float"]);
  this._textureHalfFloat = !!getExtension(gl, ["OES_texture_half_float"]);

  this._textureFloatLinear = !!getExtension(gl, ["OES_texture_float_linear"]);
  this._textureHalfFloatLinear = !!getExtension(gl, [
    "OES_texture_half_float_linear",
  ]);

  this._supportsTextureLod = !!getExtension(gl, ["EXT_shader_texture_lod"]);

  this._colorBufferFloat = !!getExtension(gl, [
    "EXT_color_buffer_float",
    "WEBGL_color_buffer_float",
  ]);
  this._floatBlend = !!getExtension(gl, ["EXT_float_blend"]);
  this._colorBufferHalfFloat = !!getExtension(gl, [
    "EXT_color_buffer_half_float",
  ]);

  this._s3tc = !!getExtension(gl, [
    "WEBGL_compressed_texture_s3tc",
    "MOZ_WEBGL_compressed_texture_s3tc",
    "WEBKIT_WEBGL_compressed_texture_s3tc",
  ]);
  this._pvrtc = !!getExtension(gl, [
    "WEBGL_compressed_texture_pvrtc",
    "WEBKIT_WEBGL_compressed_texture_pvrtc",
  ]);
  this._astc = !!getExtension(gl, ["WEBGL_compressed_texture_astc"]);
  this._etc = !!getExtension(gl, ["WEBG_compressed_texture_etc"]);
  this._etc1 = !!getExtension(gl, ["WEBGL_compressed_texture_etc1"]);
  this._bc7 = !!getExtension(gl, ["EXT_texture_compression_bptc"]);

  // It is necessary to pass supported formats to loadKTX2
  // because imagery layers don't have access to the context.
  loadKTX2.setKTX2SupportedFormats(
    this._s3tc,
    this._pvrtc,
    this._astc,
    this._etc,
    this._etc1,
    this._bc7,
  );

  const textureFilterAnisotropic = allowTextureFilterAnisotropic
    ? getExtension(gl, [
      "EXT_texture_filter_anisotropic",
      "WEBKIT_EXT_texture_filter_anisotropic",
    ])
    : undefined;
  this._textureFilterAnisotropic = textureFilterAnisotropic;
  ContextLimits._maximumTextureFilterAnisotropy = defined(
    textureFilterAnisotropic,
  )
    ? gl.getParameter(textureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
    : 1.0;

  let glCreateVertexArray;
  let glBindVertexArray;
  let glDeleteVertexArray;

  let glDrawElementsInstanced;
  let glDrawArraysInstanced;
  let glVertexAttribDivisor;

  let glDrawBuffers;

  let vertexArrayObject;
  let instancedArrays;
  let drawBuffers;

  if (webgl2) {
    const that = this;

    glCreateVertexArray = function() {
      return that._gl.createVertexArray();
    };
    glBindVertexArray = function(vao) {
      that._gl.bindVertexArray(vao);
    };
    glDeleteVertexArray = function(vao) {
      that._gl.deleteVertexArray(vao);
    };

    glDrawElementsInstanced = function(
      mode,
      count,
      type,
      offset,
      instanceCount,
    ) {
      gl.drawElementsInstanced(mode, count, type, offset, instanceCount);
    };
    glDrawArraysInstanced = function(mode, first, count, instanceCount) {
      gl.drawArraysInstanced(mode, first, count, instanceCount);
    };
    glVertexAttribDivisor = function(index, divisor) {
      gl.vertexAttribDivisor(index, divisor);
    };

    glDrawBuffers = function(buffers) {
      gl.drawBuffers(buffers);
    };
  } else {
    vertexArrayObject = getExtension(gl, ["OES_vertex_array_object"]);
    if (defined(vertexArrayObject)) {
      glCreateVertexArray = function() {
        return vertexArrayObject.createVertexArrayOES();
      };
      glBindVertexArray = function(vertexArray) {
        vertexArrayObject.bindVertexArrayOES(vertexArray);
      };
      glDeleteVertexArray = function(vertexArray) {
        vertexArrayObject.deleteVertexArrayOES(vertexArray);
      };
    }

    instancedArrays = getExtension(gl, ["ANGLE_instanced_arrays"]);
    if (defined(instancedArrays)) {
      glDrawElementsInstanced = function(
        mode,
        count,
        type,
        offset,
        instanceCount,
      ) {
        instancedArrays.drawElementsInstancedANGLE(
          mode,
          count,
          type,
          offset,
          instanceCount,
        );
      };
      glDrawArraysInstanced = function(mode, first, count, instanceCount) {
        instancedArrays.drawArraysInstancedANGLE(
          mode,
          first,
          count,
          instanceCount,
        );
      };
      glVertexAttribDivisor = function(index, divisor) {
        instancedArrays.vertexAttribDivisorANGLE(index, divisor);
      };
    }

    drawBuffers = getExtension(gl, ["WEBGL_draw_buffers"]);
    if (defined(drawBuffers)) {
      glDrawBuffers = function(buffers) {
        drawBuffers.drawBuffersWEBGL(buffers);
      };
    }
  }

  this.glCreateVertexArray = glCreateVertexArray;
  this.glBindVertexArray = glBindVertexArray;
  this.glDeleteVertexArray = glDeleteVertexArray;

  this.glDrawElementsInstanced = glDrawElementsInstanced;
  this.glDrawArraysInstanced = glDrawArraysInstanced;
  this.glVertexAttribDivisor = glVertexAttribDivisor;

  this.glDrawBuffers = glDrawBuffers;

  this._vertexArrayObject = !!vertexArrayObject;
  this._instancedArrays = !!instancedArrays;
  this._drawBuffers = !!drawBuffers;

  ContextLimits._maximumDrawBuffers = this.drawBuffers
    ? gl.getParameter(WebGLConstants.MAX_DRAW_BUFFERS)
    : 1;
  ContextLimits._maximumColorAttachments = this.drawBuffers
    ? gl.getParameter(WebGLConstants.MAX_COLOR_ATTACHMENTS)
    : 1;

  this._clearColor = new Color(0.0, 0.0, 0.0, 0.0);
  this._clearDepth = 1.0;
  this._clearStencil = 0;

  const us = new UniformState();
  const ps = new PassState(this);
  const rs = RenderState.fromCache();

  this._defaultPassState = ps;
  this._defaultRenderState = rs;
  // default texture has a value of (1, 1, 1)
  // default emissive texture has a value of (0, 0, 0)
  // default normal texture is +z which is encoded as (0.5, 0.5, 1)
  this._defaultTexture = undefined;
  this._defaultEmissiveTexture = undefined;
  this._defaultNormalTexture = undefined;
  this._defaultCubeMap = undefined;

  this._us = us;
  this._currentRenderState = rs;
  this._currentPassState = ps;
  this._currentFramebuffer = undefined;
  this._maxFrameTextureUnitIndex = 0;

  // Vertex attribute divisor state cache. Workaround for ANGLE (also look at VertexArray.setVertexAttribDivisor)
  this._vertexAttribDivisors = [];
  this._previousDrawInstanced = false;
  for (let i = 0; i < ContextLimits._maximumVertexAttributes; i++) {
    this._vertexAttribDivisors.push(0);
  }

  this._pickObjects = {};
  this._nextPickColor = new Uint32Array(1);

  /**
   * 用于构造此上下文的选项
   *
   * @type {ContextOptions}
   */

  this.options = {
    getWebGLStub: getWebGLStub,
    requestWebgl1: requestWebgl1,
    webgl: webglOptions,
    allowTextureFilterAnisotropic: allowTextureFilterAnisotropic,
  };

  /**
   * 与此上下文相关联的对象缓存。在上下文被销毁之前，
   * 将对这个对象字面量中具有 <code>destroy</code> 方法的每个对象调用该方法。
   * 这对于缓存任何可能被全局存储的对象非常有用，但这些对象是与特定上下文相关联的，并用于管理
   * 它们的生命周期。
   *
   * @type {object}
   */

  this.cache = {};

  RenderState.apply(gl, rs, ps);
}

/**
 * @typedef {object} ContextOptions
 *
 * 控制 WebGL 上下文设置的选项。
 * <p>
 * <code>allowTextureFilterAnisotropic</code> 默认为 true，这在支持 WebGL 扩展时启用
 * 各向异性纹理过滤。将其设置为 false 将提高性能，但会影响视觉质量，
 * 尤其是在地平线视图下。
 * </p>
 *
 * @property {boolean} [requestWebgl1=false] 如果为 true 且浏览器支持，则使用 WebGL 1 渲染上下文
 * @property {boolean} [allowTextureFilterAnisotropic=true] 如果为 true，则在纹理采样期间使用各向异性过滤
 * @property {WebGLOptions} [webgl] 传递给 canvas.getContext 的 WebGL 选项
 * @property {Function} [getWebGLStub] 用于创建 WebGL 存根以进行测试的函数
 */


/**
 * @private
 * @param {HTMLCanvasElement} canvas 要关联上下文的画布元素
 * @param {WebGLOptions} webglOptions 要传递给 HTMLCanvasElement.getContext() 的 WebGL 选项
 * @param {boolean} requestWebgl1 是否请求 WebGLRenderingContext 或 WebGL2RenderingContext。
 * @returns {WebGLRenderingContext|WebGL2RenderingContext}
 */

function getWebGLContext(canvas, webglOptions, requestWebgl1) {
  if (typeof WebGLRenderingContext === "undefined") {
    throw new RuntimeError(
      "The browser does not support WebGL.  Visit http://get.webgl.org.",
    );
  }

  // Ensure that WebGL 2 is supported when it is requested. Otherwise, fall back to WebGL 1.
  const webgl2Supported = typeof WebGL2RenderingContext !== "undefined";
  if (!requestWebgl1 && !webgl2Supported) {
    requestWebgl1 = true;
  }

  const contextType = requestWebgl1 ? "webgl" : "webgl2";
  const glContext = canvas.getContext(contextType, webglOptions);

  if (!defined(glContext)) {
    throw new RuntimeError(
      "The browser supports WebGL, but initialization failed.",
    );
  }

  return glContext;
}

/**
 * @typedef {object} WebGLOptions
 *
 * 要传递给 HTMLCanvasElement.getContext() 的 WebGL 选项。
 * 参见 {@link https://registry.khronos.org/webgl/specs/latest/1.0/#5.2|WebGLContextAttributes}
 * 但请注意，'alpha'、'stencil' 和 'powerPreference' 的默认值已被修改。
 *
 * <p>
 * <code>alpha</code> 默认为 false，这相比于标准的 WebGL 默认值 true 可以提高性能。
 * 如果一个应用程序需要使用透明混合在其他 HTML 元素上合成 Cesium，则将 <code>alpha</code> 设置为 true。
 * </p>
 *
 * @property {boolean} [alpha=false]
 * @property {boolean} [depth=true]
 * @property {boolean} [stencil=false]
 * @property {boolean} [antialias=true]
 * @property {boolean} [premultipliedAlpha=true]
 * @property {boolean} [preserveDrawingBuffer=false]
 * @property {("default"|"low-power"|"high-performance")} [powerPreference="high-performance"]
 * @property {boolean} [failIfMajorPerformanceCaveat=false]
 */


function errorToString(gl, error) {
  let message = "WebGL Error:  ";
  switch (error) {
    case gl.INVALID_ENUM:
      message += "INVALID_ENUM";
      break;
    case gl.INVALID_VALUE:
      message += "INVALID_VALUE";
      break;
    case gl.INVALID_OPERATION:
      message += "INVALID_OPERATION";
      break;
    case gl.OUT_OF_MEMORY:
      message += "OUT_OF_MEMORY";
      break;
    case gl.CONTEXT_LOST_WEBGL:
      message += "CONTEXT_LOST_WEBGL lost";
      break;
    default:
      message += `Unknown (${error})`;
  }

  return message;
}

function createErrorMessage(gl, glFunc, glFuncArguments, error) {
  let message = `${errorToString(gl, error)}: ${glFunc.name}(`;

  for (let i = 0; i < glFuncArguments.length; ++i) {
    if (i !== 0) {
      message += ", ";
    }
    message += glFuncArguments[i];
  }
  message += ");";

  return message;
}

function throwOnError(gl, glFunc, glFuncArguments) {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    throw new RuntimeError(
      createErrorMessage(gl, glFunc, glFuncArguments, error),
    );
  }
}

function makeGetterSetter(gl, propertyName, logFunction) {
  return {
    get: function() {
      const value = gl[propertyName];
      logFunction(gl, `get: ${propertyName}`, value);
      return gl[propertyName];
    },
    set: function(value) {
      gl[propertyName] = value;
      logFunction(gl, `set: ${propertyName}`, value);
    },
  };
}

function wrapGL(gl, logFunction) {
  if (!defined(logFunction)) {
    return gl;
  }

  function wrapFunction(property) {
    return function() {
      const result = property.apply(gl, arguments);
      logFunction(gl, property, arguments);
      return result;
    };
  }

  const glWrapper = {};

  // JavaScript linters normally demand that a for..in loop must directly contain an if,
  // but in our loop below, we actually intend to iterate all properties, including
  // those in the prototype.
  /*eslint-disable guard-for-in*/
  for (const propertyName in gl) {
    const property = gl[propertyName];

    // wrap any functions we encounter, otherwise just copy the property to the wrapper.
    if (property instanceof Function) {
      glWrapper[propertyName] = wrapFunction(property);
    } else {
      Object.defineProperty(
        glWrapper,
        propertyName,
        makeGetterSetter(gl, propertyName, logFunction),
      );
    }
  }
  /*eslint-enable guard-for-in*/

  return glWrapper;
}

function getExtension(gl, names) {
  const length = names.length;
  for (let i = 0; i < length; ++i) {
    const extension = gl.getExtension(names[i]);
    if (extension) {
      return extension;
    }
  }

  return undefined;
}

const defaultFramebufferMarker = {};

Object.defineProperties(Context.prototype, {
  id: {
    get: function() {
      return this._id;
    },
  },
  webgl2: {
    get: function() {
      return this._webgl2;
    },
  },
  canvas: {
    get: function() {
      return this._canvas;
    },
  },
  shaderCache: {
    get: function() {
      return this._shaderCache;
    },
  },
  textureCache: {
    get: function() {
      return this._textureCache;
    },
  },
  uniformState: {
    get: function() {
      return this._us;
    },
  },

  /**
   * 默认绑定帧缓冲区中每个像素的模板位数。最小值为八位。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/opengles/sdk/docs/man/xhtml/glGet.xml|glGet} 使用 <code>STENCIL_BITS</code>。
   */

  stencilBits: {
    get: function() {
      return this._stencilBits;
    },
  },

  /**
   * 如果 WebGL 上下文支持模板缓冲区，则为 <code>true</code>。
   * 不是所有系统都支持模板缓冲区。
   * @memberof Context.prototype
   * @type {boolean}
   */

  stencilBuffer: {
    get: function() {
      return this._stencilBits >= 8;
    },
  },

  /**
   * 如果 WebGL 上下文支持抗锯齿，则为 <code>true</code>。 默认情况下请求抗锯齿，
   * 但并不是所有系统都支持它。
   * @memberof Context.prototype
   * @type {boolean}
   */

  antialias: {
    get: function() {
      return this._antialias;
    },
  },

  /**
   * 如果 WebGL 上下文支持多重采样抗锯齿，则为 <code>true</code>。需要
   * WebGL2。
   * @memberof Context.prototype
   * @type {boolean}
   */

  msaa: {
    get: function() {
      return this._webgl2;
    },
  },

  /**
   * 如果支持 OES_standard_derivatives 扩展，则为 <code>true</code>。此
   * 扩展提供对 GLSL 中的 <code>dFdx</code>、<code>dFdy</code> 和 <code>fwidth</code>
   * 函数的访问。使用这些函数的着色器仍需通过 <code>#extension GL_OES_standard_derivatives : enable</code> 显式启用扩展。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/gles/extensions/OES/OES_standard_derivatives.txt|OES_standard_derivatives}
   */

  standardDerivatives: {
    get: function() {
      return this._standardDerivatives || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_float_blend 扩展，则为 <code>true</code>。此
   * 扩展启用与 32 位浮点值的混合。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_float_blend/}
   */

  floatBlend: {
    get: function() {
      return this._floatBlend;
    },
  },

  /**
    * 如果支持 EXT_blend_minmax 扩展，则为 <code>true</code>。此
    * 扩展通过添加两个新的混合方程来扩展混合功能：源颜色和目标颜色的最小或最大颜色分量。
    * @memberof Context.prototype
    * @type {boolean}
    * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_blend_minmax/}
    */

  blendMinmax: {
    get: function() {
      return this._blendMinmax || this._webgl2;
    },
  },

  /**
   * 如果支持 OES_element_index_uint 扩展，则为 <code>true</code>。此
   * 扩展允许使用无符号整数索引，这可以通过消除由于无符号短整数索引引起的批处理中断来提高性能。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/OES_element_index_uint/|OES_element_index_uint}
   */

  elementIndexUint: {
    get: function() {
      return this._elementIndexUint || this._webgl2;
    },
  },

  /**
   * 如果支持 WEBGL_depth_texture，则为 <code>true</code>。此
   * 扩展提供对深度纹理的访问，例如，可以将其附加到用于阴影映射的帧缓冲区。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_depth_texture/|WEBGL_depth_texture}
   */

  depthTexture: {
    get: function() {
      return this._depthTexture || this._webgl2;
    },
  },

  /**
   * 如果支持 OES_texture_float，则为 <code>true</code>。此
   * 扩展提供对浮点纹理的访问，例如，可以将其附加到帧缓冲区以实现高动态范围。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_float/}
   */

  floatingPointTexture: {
    get: function() {
      return this._webgl2 || this._textureFloat;
    },
  },

  /**
   * 如果支持 OES_texture_half_float，则为 <code>true</code>。此
   * 扩展提供对浮点纹理的访问，例如，可以将其附加到帧缓冲区以实现高动态范围。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float/}
   */

  halfFloatingPointTexture: {
    get: function() {
      return this._webgl2 || this._textureHalfFloat;
    },
  },

  /**
   * 如果支持 OES_texture_float_linear，则为 <code>true</code>。此
   * 扩展提供对浮点纹理的最小化和放大过滤器的线性采样方法的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_float_linear/}
   */

  textureFloatLinear: {
    get: function() {
      return this._textureFloatLinear;
    },
  },

  /**
   * 如果支持 OES_texture_half_float_linear，则为 <code>true</code>。此
   * 扩展提供对半浮点纹理的最小化和放大过滤器的线性采样方法的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/OES_texture_half_float_linear/}
   */

  textureHalfFloatLinear: {
    get: function() {
      return (
        (this._webgl2 && this._textureFloatLinear) ||
        (!this._webgl2 && this._textureHalfFloatLinear)
      );
    },
  },

  /**
   * 如果支持 EXT_shader_texture_lod，则为 <code>true</code>。此
   * 扩展提供对纹理采样函数中显式 LOD 选择的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://registry.khronos.org/webgl/extensions/EXT_shader_texture_lod/}
   */

  supportsTextureLod: {
    get: function() {
      return this._webgl2 || this._supportsTextureLod;
    },
  },

  /**
   * 如果支持 EXT_texture_filter_anisotropic，则为 <code>true</code>。此
   * 扩展提供对从观察者的倾斜角度观察的纹理表面的各向异性过滤的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_texture_filter_anisotropic/}
   */

  textureFilterAnisotropic: {
    get: function() {
      return !!this._textureFilterAnisotropic;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_s3tc，则为 <code>true</code>。此
   * 扩展提供对 DXT 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/}
   */

  s3tc: {
    get: function() {
      return this._s3tc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_pvrtc，则为 <code>true</code>。此
   * 扩展提供对 PVR 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/}
   */

  pvrtc: {
    get: function() {
      return this._pvrtc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_astc，则为 <code>true</code>。此
   * 扩展提供对 ASTC 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/}
   */

  astc: {
    get: function() {
      return this._astc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_etc，则为 <code>true</code>。此
   * 扩展提供对 ETC 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/}
   */

  etc: {
    get: function() {
      return this._etc;
    },
  },

  /**
   * 如果支持 WEBGL_compressed_texture_etc1，则为 <code>true</code>。此
   * 扩展提供对 ETC1 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/}
   */
  etc1: {
    get: function() {
      return this._etc1;
    },
  },

  /**
   * 如果支持 EXT_texture_compression_bptc，则为 <code>true</code>。此
   * 扩展提供对 BC7 压缩纹理的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_texture_compression_bptc/}
   */
  bc7: {
    get: function() {
      return this._bc7;
    },
  },

  /**
   * 如果支持 S3TC、PVRTC、ASTC、ETC、ETC1 或 BC7 压缩，则为 <code>true</code>。
   * @memberof Context.prototype
   * @type {boolean}
   */

  supportsBasis: {
    get: function() {
      return (
        this._s3tc ||
        this._pvrtc ||
        this._astc ||
        this._etc ||
        this._etc1 ||
        this._bc7
      );
    },
  },

  /**
   * 如果支持 OES_vertex_array_object 扩展，则为 <code>true</code>。此
   * 扩展通过减少切换顶点数组的开销来提高性能。
   * 启用时，此扩展将被 {@link VertexArray} 自动使用。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/OES_vertex_array_object/|OES_vertex_array_object}
   */
  vertexArrayObject: {
    get: function() {
      return this._vertexArrayObject || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_frag_depth 扩展，则为 <code>true</code>。此
   * 扩展提供对 GLSL 片段着色器中的 <code>gl_FragDepthEXT</code> 内置输出变量的访问。
   * 使用这些函数的着色器仍需通过 <code>#extension GL_EXT_frag_depth : enable</code> 显式启用该扩展。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/EXT_frag_depth/|EXT_frag_depth}
   */

  fragmentDepth: {
    get: function() {
      return this._fragDepth || this._webgl2;
    },
  },

  /**
   * 如果支持 ANGLE_instanced_arrays 扩展，则为 <code>true</code>。此
   * 扩展提供对实例化渲染的访问。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/ANGLE_instanced_arrays}
   */
instancedArrays: {
    get: function() {
      return this._instancedArrays || this._webgl2;
    },
  },

  /**
   * 如果支持 EXT_color_buffer_float 扩展，则为 <code>true</code>。此
   * 扩展使得 gl.RGBA32F 格式的颜色可渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/WEBGL_color_buffer_float/}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/}
   */

  colorBufferFloat: {
    get: function() {
      return this._colorBufferFloat;
    },
  },

  /**
   * 如果支持 EXT_color_buffer_half_float 扩展，则为 <code>true</code>。此
   * 扩展使得格式 gl.RGBA16F 的颜色可渲染。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_half_float/}
   * @see {@link https://www.khronos.org/registry/webgl/extensions/EXT_color_buffer_float/}
   */
colorBufferHalfFloat: {
    get: function() {
      return (
        (this._webgl2 && this._colorBufferFloat) ||
        (!this._webgl2 && this._colorBufferHalfFloat)
      );
    },
  },

  /**
   * 如果支持 WEBGL_draw_buffers 扩展，则为 <code>true</code>。此
   * 扩展提供对多个渲染目标的支持。帧缓冲对象可以具有多个
   * 颜色附加，GLSL 片段着色器可以写入内置输出数组 <code>gl_FragData</code>。
   * 使用此功能的着色器需要通过
   * <code>#extension GL_EXT_draw_buffers : enable</code> 显式启用扩展。
   * @memberof Context.prototype
   * @type {boolean}
   * @see {@link http://www.khronos.org/registry/webgl/extensions/WEBGL_draw_buffers/|WEBGL_draw_buffers}
   */

  drawBuffers: {
    get: function() {
      return this._drawBuffers || this._webgl2;
    },
  },

  debugShaders: {
    get: function() {
      return this._debugShaders;
    },
  },

  throwOnWebGLError: {
    get: function() {
      return this._throwOnWebGLError;
    },
    set: function(value) {
      this._throwOnWebGLError = value;
      this._gl = wrapGL(
        this._originalGLContext,
        value ? throwOnError : undefined,
      );
    },
  },

  /**
   * 一个 1x1 的 RGBA 纹理，初始化为 [255, 255, 255, 255]。这可以
   * 用作占位符纹理， enquanto 其他纹理被下载时使用。
   * @memberof Context.prototype
   * @type {Texture}
   */

  defaultTexture: {
    get: function() {
      if (this._defaultTexture === undefined) {
        this._defaultTexture = new Texture({
          context: this,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([255, 255, 255, 255]),
          },
          flipY: false,
        });
      }

      return this._defaultTexture;
    },
  },
  /**
   * 一个 1x1 的 RGB 纹理，初始化为 [0, 0, 0]，表示一个非自发光材料。 
   * 这可以用作自发光纹理的占位符纹理，在其他纹理下载时使用。
   * @memberof Context.prototype
   * @type {Texture}
   */

  defaultEmissiveTexture: {
    get: function() {
      if (this._defaultEmissiveTexture === undefined) {
        this._defaultEmissiveTexture = new Texture({
          context: this,
          pixelFormat: PixelFormat.RGB,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([0, 0, 0]),
          },
          flipY: false,
        });
      }

      return this._defaultEmissiveTexture;
    },
  },
  /**
   * 一个 1x1 的 RGBA 纹理，初始化为 [128, 128, 255]，用于编码指向 +z 方向的切线空间法线，
   * 即 (0, 0, 1)。这可以用作法线纹理的占位符，在其他纹理下载时使用。
   * @memberof Context.prototype
   * @type {Texture}
   */

  defaultNormalTexture: {
    get: function() {
      if (this._defaultNormalTexture === undefined) {
        this._defaultNormalTexture = new Texture({
          context: this,
          pixelFormat: PixelFormat.RGB,
          source: {
            width: 1,
            height: 1,
            arrayBufferView: new Uint8Array([128, 128, 255]),
          },
          flipY: false,
        });
      }

      return this._defaultNormalTexture;
    },
  },

  /**
   * 一个立方体贴图，每个面都是一个 1x1 的 RGBA 纹理，初始化为
   * [255, 255, 255, 255]。这可以用作立方体贴图的占位符，在
   * 其他立方体贴图下载时使用。
   * @memberof Context.prototype
   * @type {CubeMap}
   */

  defaultCubeMap: {
    get: function() {
      if (this._defaultCubeMap === undefined) {
        const face = {
          width: 1,
          height: 1,
          arrayBufferView: new Uint8Array([255, 255, 255, 255]),
        };

        this._defaultCubeMap = new CubeMap({
          context: this,
          source: {
            positiveX: face,
            negativeX: face,
            positiveY: face,
            negativeY: face,
            positiveZ: face,
            negativeZ: face,
          },
          flipY: false,
        });
      }

      return this._defaultCubeMap;
    },
  },

  /**
   * 基础 GL 上下文的 drawingBufferHeight。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferHeight|drawingBufferHeight}
   */
drawingBufferHeight: {
    get: function() {
      return this._gl.drawingBufferHeight;
    },
  },

/**
   * 基础 GL 上下文的 drawingBufferWidth。
   * @memberof Context.prototype
   * @type {number}
   * @see {@link https://www.khronos.org/registry/webgl/specs/1.0/#DOM-WebGLRenderingContext-drawingBufferWidth|drawingBufferWidth}
   */

  drawingBufferWidth: {
    get: function() {
      return this._gl.drawingBufferWidth;
    },
  },

  /**
   * 获取一个表示当前绑定帧缓冲区的对象。虽然该实例不是一个实际的
   * {@link Framebuffer}，但它用于在调用 {@link Texture.fromFramebuffer} 时表示默认的帧缓冲区。
   * @memberof Context.prototype
   * @type {object}
   */

  defaultFramebuffer: {
    get: function() {
      return defaultFramebufferMarker;
    },
  },
});

/**
 * 验证帧缓冲区。
 * 仅在调试版本中可用。
 * @private
 */

function validateFramebuffer(context) {
  //>>includeStart('debug', pragmas.debug);
  if (context.validateFramebuffer) {
    const gl = context._gl;
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      let message;

      switch (status) {
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Incomplete attachment: at least one attachment point with a renderbuffer or texture attached has its attached object no longer in existence or has an attached image with a width or height of zero, or the color attachment point has a non-color-renderable image attached, or the depth attachment point has a non-depth-renderable image attached, or the stencil attachment point has a non-stencil-renderable image attached.  Color-renderable formats include GL_RGBA4, GL_RGB5_A1, and GL_RGB565. GL_DEPTH_COMPONENT16 is the only depth-renderable format. GL_STENCIL_INDEX8 is the only stencil-renderable format.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          message =
            "Framebuffer is not complete.  Incomplete dimensions: not all attached images have the same width and height.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Missing attachment: no images are attached to the framebuffer.";
          break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
          message =
            "Framebuffer is not complete.  Unsupported: the combination of internal formats of the attached images violates an implementation-dependent set of restrictions.";
          break;
      }

      throw new DeveloperError(message);
    }
  }
  //>>includeEnd('debug');
}

function applyRenderState(context, renderState, passState, clear) {
  const previousRenderState = context._currentRenderState;
  const previousPassState = context._currentPassState;
  context._currentRenderState = renderState;
  context._currentPassState = passState;
  RenderState.partialApply(
    context._gl,
    previousRenderState,
    renderState,
    previousPassState,
    passState,
    clear,
  );
}

let scratchBackBufferArray;
// this check must use typeof, not defined, because defined doesn't work with undeclared variables.
if (typeof WebGLRenderingContext !== "undefined") {
  scratchBackBufferArray = [WebGLConstants.BACK];
}

function bindFramebuffer(context, framebuffer) {
  if (framebuffer !== context._currentFramebuffer) {
    context._currentFramebuffer = framebuffer;
    let buffers = scratchBackBufferArray;

    if (defined(framebuffer)) {
      framebuffer._bind();
      validateFramebuffer(context);

      // TODO: Need a way for a command to give what draw buffers are active.
      buffers = framebuffer._getActiveColorAttachments();
    } else {
      const gl = context._gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (context.drawBuffers) {
      context.glDrawBuffers(buffers);
    }
  }
}

const defaultClearCommand = new ClearCommand();

Context.prototype.clear = function(clearCommand, passState) {
  clearCommand = defaultValue(clearCommand, defaultClearCommand);
  passState = defaultValue(passState, this._defaultPassState);

  const gl = this._gl;
  let bitmask = 0;

  const c = clearCommand.color;
  const d = clearCommand.depth;
  const s = clearCommand.stencil;

  if (defined(c)) {
    if (!Color.equals(this._clearColor, c)) {
      Color.clone(c, this._clearColor);
      gl.clearColor(c.red, c.green, c.blue, c.alpha);
    }
    bitmask |= gl.COLOR_BUFFER_BIT;
  }

  if (defined(d)) {
    if (d !== this._clearDepth) {
      this._clearDepth = d;
      gl.clearDepth(d);
    }
    bitmask |= gl.DEPTH_BUFFER_BIT;
  }

  if (defined(s)) {
    if (s !== this._clearStencil) {
      this._clearStencil = s;
      gl.clearStencil(s);
    }
    bitmask |= gl.STENCIL_BUFFER_BIT;
  }

  const rs = defaultValue(clearCommand.renderState, this._defaultRenderState);
  applyRenderState(this, rs, passState, true);

  // The command's framebuffer takes presidence over the pass' framebuffer, e.g., for off-screen rendering.
  const framebuffer = defaultValue(
    clearCommand.framebuffer,
    passState.framebuffer,
  );
  bindFramebuffer(this, framebuffer);

  gl.clear(bitmask);
};

function beginDraw(
  context,
  framebuffer,
  passState,
  shaderProgram,
  renderState,
) {
  //>>includeStart('debug', pragmas.debug);
  if (defined(framebuffer) && renderState.depthTest) {
    if (renderState.depthTest.enabled && !framebuffer.hasDepthAttachment) {
      throw new DeveloperError(
        "The depth test can not be enabled (drawCommand.renderState.depthTest.enabled) because the framebuffer (drawCommand.framebuffer) does not have a depth or depth-stencil renderbuffer.",
      );
    }
  }
  //>>includeEnd('debug');

  bindFramebuffer(context, framebuffer);
  applyRenderState(context, renderState, passState, false);
  shaderProgram._bind();
  context._maxFrameTextureUnitIndex = Math.max(
    context._maxFrameTextureUnitIndex,
    shaderProgram.maximumTextureUnitIndex,
  );
}

function continueDraw(context, drawCommand, shaderProgram, uniformMap) {
  const primitiveType = drawCommand._primitiveType;
  const va = drawCommand._vertexArray;
  let offset = drawCommand._offset;
  let count = drawCommand._count;
  const instanceCount = drawCommand.instanceCount;

  //>>includeStart('debug', pragmas.debug);
  if (!PrimitiveType.validate(primitiveType)) {
    throw new DeveloperError(
      "drawCommand.primitiveType is required and must be valid.",
    );
  }

  Check.defined("drawCommand.vertexArray", va);
  Check.typeOf.number.greaterThanOrEquals("drawCommand.offset", offset, 0);
  if (defined(count)) {
    Check.typeOf.number.greaterThanOrEquals("drawCommand.count", count, 0);
  }
  Check.typeOf.number.greaterThanOrEquals(
    "drawCommand.instanceCount",
    instanceCount,
    0,
  );
  if (instanceCount > 0 && !context.instancedArrays) {
    throw new DeveloperError("Instanced arrays extension is not supported");
  }
  //>>includeEnd('debug');

  context._us.model = defaultValue(drawCommand._modelMatrix, Matrix4.IDENTITY);
  shaderProgram._setUniforms(
    uniformMap,
    context._us,
    context.validateShaderProgram,
  );

  va._bind();
  const indexBuffer = va.indexBuffer;

  if (defined(indexBuffer)) {
    offset = offset * indexBuffer.bytesPerIndex; // offset in vertices to offset in bytes
    if (defined(count)) {
      count = Math.min(count, indexBuffer.numberOfIndices);
    } else {
      count = indexBuffer.numberOfIndices;
    }
    if (instanceCount === 0) {
      context._gl.drawElements(
        primitiveType,
        count,
        indexBuffer.indexDatatype,
        offset,
      );
    } else {
      context.glDrawElementsInstanced(
        primitiveType,
        count,
        indexBuffer.indexDatatype,
        offset,
        instanceCount,
      );
    }
  } else {
    if (defined(count)) {
      count = Math.min(count, va.numberOfVertices);
    } else {
      count = va.numberOfVertices;
    }
    if (instanceCount === 0) {
      context._gl.drawArrays(primitiveType, offset, count);
    } else {
      context.glDrawArraysInstanced(
        primitiveType,
        offset,
        count,
        instanceCount,
      );
    }
  }

  va._unBind();
}

Context.prototype.draw = function(
  drawCommand,
  passState,
  shaderProgram,
  uniformMap,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("drawCommand", drawCommand);
  Check.defined("drawCommand.shaderProgram", drawCommand._shaderProgram);
  //>>includeEnd('debug');

  passState = defaultValue(passState, this._defaultPassState);
  // The command's framebuffer takes precedence over the pass' framebuffer, e.g., for off-screen rendering.
  const framebuffer = defaultValue(
    drawCommand._framebuffer,
    passState.framebuffer,
  );
  const renderState = defaultValue(
    drawCommand._renderState,
    this._defaultRenderState,
  );
  shaderProgram = defaultValue(shaderProgram, drawCommand._shaderProgram);
  uniformMap = defaultValue(uniformMap, drawCommand._uniformMap);

  beginDraw(this, framebuffer, passState, shaderProgram, renderState);
  continueDraw(this, drawCommand, shaderProgram, uniformMap);
};

Context.prototype.endFrame = function() {
  const gl = this._gl;
  gl.useProgram(null);

  this._currentFramebuffer = undefined;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const buffers = scratchBackBufferArray;
  if (this.drawBuffers) {
    this.glDrawBuffers(buffers);
  }

  const length = this._maxFrameTextureUnitIndex;
  this._maxFrameTextureUnitIndex = 0;

  for (let i = 0; i < length; ++i) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }
};

/**
 * @private
 * @param {object} readState 一个具有以下属性的对象：
 * @param {number} [readState.x=0] 要读取的矩形的 x 偏移量。
 * @param {number} [readState.y=0] 要读取的矩形的 y 偏移量。
 * @param {number} [readState.width=gl.drawingBufferWidth] 要读取的矩形的宽度。
 * @param {number} [readState.height=gl.drawingBufferHeight] 要读取的矩形的高度。
 * @param {Framebuffer} [readState.framebuffer] 要读取的帧缓冲区。如果未定义，则将从默认帧缓冲区读取。
 * @returns {Uint8Array|Uint16Array|Float32Array|Uint32Array} 指定矩形中的像素。
 */

Context.prototype.readPixels = function(readState) {
  const gl = this._gl;

  readState = defaultValue(readState, defaultValue.EMPTY_OBJECT);
  const x = Math.max(defaultValue(readState.x, 0), 0);
  const y = Math.max(defaultValue(readState.y, 0), 0);
  const width = defaultValue(readState.width, gl.drawingBufferWidth);
  const height = defaultValue(readState.height, gl.drawingBufferHeight);
  const framebuffer = readState.framebuffer;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThan("readState.width", width, 0);
  Check.typeOf.number.greaterThan("readState.height", height, 0);
  //>>includeEnd('debug');

  let pixelDatatype = PixelDatatype.UNSIGNED_BYTE;
  if (defined(framebuffer) && framebuffer.numberOfColorAttachments > 0) {
    pixelDatatype = framebuffer.getColorTexture(0).pixelDatatype;
  }

  const pixels = PixelFormat.createTypedArray(
    PixelFormat.RGBA,
    pixelDatatype,
    width,
    height,
  );

  bindFramebuffer(this, framebuffer);

  gl.readPixels(
    x,
    y,
    width,
    height,
    PixelFormat.RGBA,
    PixelDatatype.toWebGLConstant(pixelDatatype, this),
    pixels,
  );

  return pixels;
};

const viewportQuadAttributeLocations = {
  position: 0,
  textureCoordinates: 1,
};

Context.prototype.getViewportQuadVertexArray = function() {
  // Per-context cache for viewport quads
  let vertexArray = this.cache.viewportQuad_vertexArray;

  if (!defined(vertexArray)) {
    const geometry = new Geometry({
      attributes: {
        position: new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
        }),

        textureCoordinates: new GeometryAttribute({
          componentDatatype: ComponentDatatype.FLOAT,
          componentsPerAttribute: 2,
          values: [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0],
        }),
      },
      // Workaround Internet Explorer 11.0.8 lack of TRIANGLE_FAN
      indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
      primitiveType: PrimitiveType.TRIANGLES,
    });

    vertexArray = VertexArray.fromGeometry({
      context: this,
      geometry: geometry,
      attributeLocations: viewportQuadAttributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
      interleave: true,
    });

    this.cache.viewportQuad_vertexArray = vertexArray;
  }

  return vertexArray;
};

Context.prototype.createViewportQuadCommand = function(
  fragmentShaderSource,
  overrides,
) {
  overrides = defaultValue(overrides, defaultValue.EMPTY_OBJECT);

  return new DrawCommand({
    vertexArray: this.getViewportQuadVertexArray(),
    primitiveType: PrimitiveType.TRIANGLES,
    renderState: overrides.renderState,
    shaderProgram: ShaderProgram.fromCache({
      context: this,
      vertexShaderSource: ViewportQuadVS,
      fragmentShaderSource: fragmentShaderSource,
      attributeLocations: viewportQuadAttributeLocations,
    }),
    uniformMap: overrides.uniformMap,
    owner: overrides.owner,
    framebuffer: overrides.framebuffer,
    pass: overrides.pass,
  });
};

/**
 * 获取与拾取颜色相关联的对象。
 *
 * @param {Color} pickColor 拾取颜色。
 * @returns {object} 与拾取颜色相关联的对象，如果没有对象与该颜色关联，则返回 undefined。
 *
 * @example
 * const object = context.getObjectByPickColor(pickColor);
 *
 * @see Context#createPickId
 */

Context.prototype.getObjectByPickColor = function(pickColor) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("pickColor", pickColor);
  //>>includeEnd('debug');

  return this._pickObjects[pickColor.toRgba()];
};

function PickId(pickObjects, key, color) {
  this._pickObjects = pickObjects;
  this.key = key;
  this.color = color;
}

Object.defineProperties(PickId.prototype, {
  object: {
    get: function() {
      return this._pickObjects[this.key];
    },
    set: function(value) {
      this._pickObjects[this.key] = value;
    },
  },
});

PickId.prototype.destroy = function() {
  delete this._pickObjects[this.key];
  return undefined;
};

/**
 * 创建与输入对象关联的唯一 ID，以用于色彩缓冲区拾取。
 * 该 ID 具有与此上下文唯一的 RGBA 颜色值。在销毁输入对象时，
 * 必须对拾取 ID 调用 destroy()。
 *
 * @param {object} object 要与拾取 ID 关联的对象。
 * @returns {object} 一个具有 <code>color</code> 属性的 PickId 对象。
 *
 * @exception {RuntimeError} 唯一拾取 ID 用尽。
 *
 *
 * @example
 * this._pickId = context.createPickId({
 *   primitive : this,
 *   id : this.id
 * });
 *
 * @see Context#getObjectByPickColor
 */
Context.prototype.createPickId = function(object) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("object", object);
  //>>includeEnd('debug');

  // the increment and assignment have to be separate statements to
  // actually detect overflow in the Uint32 value
  ++this._nextPickColor[0];
  const key = this._nextPickColor[0];
  if (key === 0) {
    // In case of overflow
    throw new RuntimeError("Out of unique Pick IDs.");
  }

  this._pickObjects[key] = object;
  return new PickId(this._pickObjects, key, Color.fromRgba(key));
};

Context.prototype.isDestroyed = function() {
  return false;
};

Context.prototype.destroy = function() {
  // Destroy all objects in the cache that have a destroy method.
  const cache = this.cache;
  for (const property in cache) {
    if (cache.hasOwnProperty(property)) {
      const propertyValue = cache[property];
      if (defined(propertyValue.destroy)) {
        propertyValue.destroy();
      }
    }
  }

  this._shaderCache = this._shaderCache.destroy();
  this._textureCache = this._textureCache.destroy();
  this._defaultTexture = this._defaultTexture && this._defaultTexture.destroy();
  this._defaultEmissiveTexture =
    this._defaultEmissiveTexture && this._defaultEmissiveTexture.destroy();
  this._defaultNormalTexture =
    this._defaultNormalTexture && this._defaultNormalTexture.destroy();
  this._defaultCubeMap = this._defaultCubeMap && this._defaultCubeMap.destroy();

  return destroyObject(this);
};

// Used for specs.
Context._deprecationWarning = deprecationWarning;

export default Context;
