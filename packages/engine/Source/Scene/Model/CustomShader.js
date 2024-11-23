import Check from "../../Core/Check.js";
import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import destroyObject from "../../Core/destroyObject.js";
import DeveloperError from "../../Core/DeveloperError.js";
import CustomShaderMode from "./CustomShaderMode.js";
import UniformType from "./UniformType.js";
import TextureManager from "./TextureManager.js";
import CustomShaderTranslucencyMode from "./CustomShaderTranslucencyMode.js";

/**
 * 描述一个 uniform、其类型和初始值的对象。
 *
 * @typedef {object} UniformSpecifier
 * @property {UniformType} type uniform 的 Glsl 类型。
 * @property {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|TextureUniform} value uniform 的初始值。
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范尚未最终确定，可能会在没有 Cesium 标准弃用政策的情况下发生更改。
 */


/**
 * 从用户定义的着色器代码解析的一组变量。这些变量可以
 * 在生成整体着色器时用于优化。尽管它们表示为 JS 对象，
 * 但预期的用法类似于集合，因此只有键的存在是重要的。
 * 如果定义，值将始终为 <code>true</code>。使用此数据结构的原因是：
 * <ul>
 *   <li>我们尚不能使用 ES6 Set 对象</li>
 *   <li>使用字典可以自动去重变量名称</li>
 *   <li>诸如 <code>variableSet.hasOwnProperty("position")</code> 的查询很简单</li>
 * </ul>
 * @typedef {Object<string, boolean>} VariableSet
 * @private
 */


/**
 * 从用户定义的顶点着色器文本解析的变量集。
 * @typedef {object} VertexVariableSets
 * @property {VariableSet} attributeSet 通过 <code>vsInput.attributes</code> 结构使用的所有唯一属性的集合。
 * @property {VariableSet} featureIdSet 通过 <code>vsInput.featureIds</code> 结构使用的所有唯一特征 ID 集合。
 * @property {VariableSet} metadataSet 通过 <code>vsInput.metadata</code> 结构使用的所有唯一元数据属性的集合。
 * @private
 */


/**
 * 从用户定义的片元着色器文本解析的变量集。
 * @typedef {object} FragmentVariableSets
 * @property {VariableSet} attributeSet 通过 <code>fsInput.attributes</code> 结构使用的所有唯一属性的集合。
 * @property {VariableSet} featureIdSet 通过 <code>fsInput.featureIds</code> 结构使用的所有唯一特征 ID 集合。
 * @property {VariableSet} metadataSet 通过 <code>fsInput.metadata</code> 结构使用的所有唯一元数据属性的集合。
 * @property {VariableSet} materialSet 通过 <code>material</code> 结构使用的所有材料变量的集合，例如漫反射、镜面反射或透明度。
 * @private
 */


/**
 * 用户定义的 GLSL 着色器，适用于 {@link Model} 以及
 * {@link Cesium3DTileset}。
 * <p>
 * 如果使用了纹理 uniform，则必须进行额外的资源管理：
 * </p>
 * <ul>
 *   <li>
 *      每帧必须调用 <code>update</code> 函数。当自定义着色器传递给 {@link Model} 或
 *      {@link Cesium3DTileset} 时，此步骤会自动处理。
 *   </li>
 *   <li>
 *      当不再需要自定义着色器时，必须调用 {@link CustomShader#destroy} 以正确清理 GPU 资源。应用程序
 *      负责调用此方法。
 *   </li>
 * </ul>
 * <p>
 * 有关更详细的文档，请参见 {@link https://github.com/CesiumGS/cesium/tree/main/Documentation/CustomShaderGuide|Custom Shader Guide}。
 * </p>
 *
  * @param {object} options 一个具有以下选项的对象。
 * @param {CustomShaderMode} [options.mode=CustomShaderMode.MODIFY_MATERIAL] 自定义着色器模式，决定自定义着色器代码如何插入片元着色器。
 * @param {LightingModel} [options.lightingModel] 光照模型（例如 PBR 或无光照）。如果存在，则此选项将覆盖模型的默认光照设置。
 * @param {CustomShaderTranslucencyMode} [options.translucencyMode=CustomShaderTranslucencyMode.INHERIT] 半透明模式，决定自定义着色器将如何应用。如果值为 CustomShaderTranslucencyMode.OPAQUE 或 CustomShaderTranslucencyMode.TRANSLUCENT，自定义着色器将覆盖模型材质的设置。如果值为 CustomShaderTranslucencyMode.INHERIT，则自定义着色器将根据原始材质的设置以不透明或半透明形式进行渲染。
 * @param {Object<string, UniformSpecifier>} [options.uniforms] 用户定义的 uniforms 的字典。键是将在 GLSL 代码中出现的 uniform 名称。值是描述 uniform 类型和初始值的对象。
 * @param {Object<string, VaryingType>} [options.varyings] 用于在着色器中声明额外 GLSL varyings 的字典。键是将在 GLSL 代码中出现的 varying 名称。值是 varying 的数据类型。对于每个 varying，声明将自动添加到着色器的顶部。调用者负责在顶点着色器中分配一个值，并在片元着色器中使用该值。
 * @param {string} [options.vertexShaderText] 自定义顶点着色器，作为 GLSL 代码字符串。必须包含一个名为 vertexMain 的 GLSL 函数。有关预期签名的示例，请参见示例。如果未指定，则将在计算的顶点着色器中跳过自定义顶点着色器步骤。
 * @param {string} [options.fragmentShaderText] 自定义片元着色器，作为 GLSL 代码字符串。必须包含一个名为 fragmentMain 的 GLSL 函数。有关预期签名的示例，请参见示例。如果未指定，则将在计算的片元着色器中跳过自定义片元着色器步骤。
 *
 * @alias CustomShader
 * @constructor
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范尚未最终确定，并可能在没有 Cesium 标准弃用政策的情况下发生更改。
 *
 * @example
 * const customShader = new CustomShader({
 *   uniforms: {
 *     u_colorIndex: {
 *       type: Cesium.UniformType.FLOAT,
 *       value: 1.0
 *     },
 *     u_normalMap: {
 *       type: Cesium.UniformType.SAMPLER_2D,
 *       value: new Cesium.TextureUniform({
 *         url: "http://example.com/normal.png"
 *       })
 *     }
 *   },
 *   varyings: {
 *     v_selectedColor: Cesium.VaryingType.VEC3
 *   },
 *   vertexShaderText: `
 *   void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
 *     v_selectedColor = mix(vsInput.attributes.color_0, vsInput.attributes.color_1, u_colorIndex);
 *     vsOutput.positionMC += 0.1 * vsInput.attributes.normal;
 *   }
 *   `,
 *   fragmentShaderText: `
 *   void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
 *     material.normal = texture(u_normalMap, fsInput.attributes.texCoord_0);
 *     material.diffuse = v_selectedColor;
 *   }
 *   `
 * });
 */
function CustomShader(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 一个值，决定自定义着色器如何与整体片元着色器交互。此值由 {@link CustomShaderPipelineStage} 使用。
   *
   * @type {CustomShaderMode}
   * @readonly
   */
  this.mode = defaultValue(options.mode, CustomShaderMode.MODIFY_MATERIAL);

  /**
   * 使用自定义着色器时的光照模型。此值由 {@link CustomShaderPipelineStage} 使用。
   *
   * @type {LightingModel}
   * @readonly
   */
  this.lightingModel = options.lightingModel;

  /**
   * 用户声明的附加 uniforms。
   *
   * @type {Object<string, UniformSpecifier>}
   * @readonly
   */
  this.uniforms = defaultValue(options.uniforms, defaultValue.EMPTY_OBJECT);

  /**
   * 用户声明的附加 varyings。此值由 {@link CustomShaderPipelineStage} 使用。
   *
   * @type {Object<string, VaryingType>}
   * @readonly
   */
  this.varyings = defaultValue(options.varyings, defaultValue.EMPTY_OBJECT);

  /**
   * 用户定义的顶点着色器的 GLSL 代码。
   *
   * @type {string}
   * @readonly
   */
  this.vertexShaderText = options.vertexShaderText;

  /**
   * 用户定义的片元着色器的 GLSL 代码。
   *
   * @type {string}
   * @readonly
   */
  this.fragmentShaderText = options.fragmentShaderText;

  /**
   * 半透明模式，决定自定义着色器的应用方式。如果值为
   * CustomShaderTranslucencyMode.OPAQUE 或 CustomShaderTranslucencyMode.TRANSLUCENT，自定义着色器
   * 将覆盖模型材质的设置。如果值为 CustomShaderTranslucencyMode.INHERIT，
   * 则自定义着色器将根据原始材质的设置以不透明或半透明形式进行渲染。
   *
   * @type {CustomShaderTranslucencyMode}
   * @default CustomShaderTranslucencyMode.INHERIT
   * @readonly
   */
  this.translucencyMode = defaultValue(
    options.translucencyMode,
    CustomShaderTranslucencyMode.INHERIT,
  );

  /**
   * 纹理 uniforms 需要一些异步处理。此处理委托给纹理管理器。
   *
   * @type {TextureManager}
   * @readonly
   * @private
   */
  this._textureManager = new TextureManager();

  /**
   * 在纹理加载时使用的默认纹理（来自 {@link Context}）。
   *
   * @type {Texture}
   * @readonly
   * @private
   */
  this._defaultTexture = undefined;

  /**
   * uniform 名称到返回值的函数的映射。此映射与 {@link DrawCommand} 使用的整体 uniform 映射结合。
   *
   * @type {Object<string, Function>}
   * @readonly
   * @private
   */
  this.uniformMap = buildUniformMap(this);

  /**
   * 在 <code>vertexShaderText</code> 中使用的变量集合。仅在 {@link CustomShaderPipelineStage} 中用于优化。
   * @type {VertexVariableSets}
   * @private
   */
  this.usedVariablesVertex = {
    attributeSet: {},
    featureIdSet: {},
    metadataSet: {},
  };

  /**
   * 在 <code>fragmentShaderText</code> 中使用的变量集合。仅在 {@link CustomShaderPipelineStage} 中用于优化。
   * @type {FragmentVariableSets}
   * @private
   */
  this.usedVariablesFragment = {
    attributeSet: {},
    featureIdSet: {},
    metadataSet: {},
    materialSet: {},
  };

  findUsedVariables(this);
  validateBuiltinVariables(this);
}


function buildUniformMap(customShader) {
  const uniforms = customShader.uniforms;
  const uniformMap = {};
  for (const uniformName in uniforms) {
    if (uniforms.hasOwnProperty(uniformName)) {
      const uniform = uniforms[uniformName];
      const type = uniform.type;
      //>>includeStart('debug', pragmas.debug);
      if (type === UniformType.SAMPLER_CUBE) {
        throw new DeveloperError(
          "CustomShader does not support samplerCube uniforms",
        );
      }
      //>>includeEnd('debug');

      if (type === UniformType.SAMPLER_2D) {
        customShader._textureManager.loadTexture2D(uniformName, uniform.value);
        uniformMap[uniformName] = createUniformTexture2DFunction(
          customShader,
          uniformName,
        );
      } else {
        uniformMap[uniformName] = createUniformFunction(
          customShader,
          uniformName,
        );
      }
    }
  }
  return uniformMap;
}

function createUniformTexture2DFunction(customShader, uniformName) {
  return function () {
    return defaultValue(
      customShader._textureManager.getTexture(uniformName),
      customShader._defaultTexture,
    );
  };
}

function createUniformFunction(customShader, uniformName) {
  return function () {
    return customShader.uniforms[uniformName].value;
  };
}

function getVariables(shaderText, regex, outputSet) {
  let match;
  while ((match = regex.exec(shaderText)) !== null) {
    const variableName = match[1];

    // Using a dictionary like a set. The value doesn't
    // matter, as this will only be used for queries such as
    // if (set.hasOwnProperty(variableName)) { ... }
    outputSet[variableName] = true;
  }
}

function findUsedVariables(customShader) {
  const attributeRegex = /[vf]sInput\.attributes\.(\w+)/g;
  const featureIdRegex = /[vf]sInput\.featureIds\.(\w+)/g;
  const metadataRegex = /[vf]sInput\.metadata.(\w+)/g;
  let attributeSet;

  const vertexShaderText = customShader.vertexShaderText;
  if (defined(vertexShaderText)) {
    attributeSet = customShader.usedVariablesVertex.attributeSet;
    getVariables(vertexShaderText, attributeRegex, attributeSet);

    attributeSet = customShader.usedVariablesVertex.featureIdSet;
    getVariables(vertexShaderText, featureIdRegex, attributeSet);

    attributeSet = customShader.usedVariablesVertex.metadataSet;
    getVariables(vertexShaderText, metadataRegex, attributeSet);
  }

  const fragmentShaderText = customShader.fragmentShaderText;
  if (defined(fragmentShaderText)) {
    attributeSet = customShader.usedVariablesFragment.attributeSet;
    getVariables(fragmentShaderText, attributeRegex, attributeSet);

    attributeSet = customShader.usedVariablesFragment.featureIdSet;
    getVariables(fragmentShaderText, featureIdRegex, attributeSet);

    attributeSet = customShader.usedVariablesFragment.metadataSet;
    getVariables(fragmentShaderText, metadataRegex, attributeSet);

    const materialRegex = /material\.(\w+)/g;
    const materialSet = customShader.usedVariablesFragment.materialSet;
    getVariables(fragmentShaderText, materialRegex, materialSet);
  }
}

function expandCoordinateAbbreviations(variableName) {
  const modelCoordinatesRegex = /^.*MC$/;
  const worldCoordinatesRegex = /^.*WC$/;
  const eyeCoordinatesRegex = /^.*EC$/;

  if (modelCoordinatesRegex.test(variableName)) {
    return `${variableName} (model coordinates)`;
  }

  if (worldCoordinatesRegex.test(variableName)) {
    return `${variableName} (Cartesian world coordinates)`;
  }

  if (eyeCoordinatesRegex.test(variableName)) {
    return `${variableName} (eye coordinates)`;
  }

  return variableName;
}

function validateVariableUsage(
  variableSet,
  incorrectVariable,
  correctVariable,
  vertexOrFragment,
) {
  if (variableSet.hasOwnProperty(incorrectVariable)) {
    const message = `${expandCoordinateAbbreviations(
      incorrectVariable,
    )} is not available in the ${vertexOrFragment} shader. Did you mean ${expandCoordinateAbbreviations(
      correctVariable,
    )} instead?`;
    throw new DeveloperError(message);
  }
}

function validateBuiltinVariables(customShader) {
  const attributesVS = customShader.usedVariablesVertex.attributeSet;

  // names without MC/WC/EC are ambiguous
  validateVariableUsage(attributesVS, "position", "positionMC", "vertex");
  validateVariableUsage(attributesVS, "normal", "normalMC", "vertex");
  validateVariableUsage(attributesVS, "tangent", "tangentMC", "vertex");
  validateVariableUsage(attributesVS, "bitangent", "bitangentMC", "vertex");

  // world and eye coordinate positions are only available in the fragment shader.
  validateVariableUsage(attributesVS, "positionWC", "positionMC", "vertex");
  validateVariableUsage(attributesVS, "positionEC", "positionMC", "vertex");

  // normal, tangent and bitangent are in model coordinates in the vertex shader
  validateVariableUsage(attributesVS, "normalEC", "normalMC", "vertex");
  validateVariableUsage(attributesVS, "tangentEC", "tangentMC", "vertex");
  validateVariableUsage(attributesVS, "bitangentEC", "bitangentMC", "vertex");

  const attributesFS = customShader.usedVariablesFragment.attributeSet;

  // names without MC/WC/EC are ambiguous
  validateVariableUsage(attributesFS, "position", "positionEC", "fragment");
  validateVariableUsage(attributesFS, "normal", "normalEC", "fragment");
  validateVariableUsage(attributesFS, "tangent", "tangentEC", "fragment");
  validateVariableUsage(attributesFS, "bitangent", "bitangentEC", "fragment");

  // normal, tangent, and bitangent are in eye coordinates in the fragment
  // shader.
  validateVariableUsage(attributesFS, "normalMC", "normalEC", "fragment");
  validateVariableUsage(attributesFS, "tangentMC", "tangentEC", "fragment");
  validateVariableUsage(attributesFS, "bitangentMC", "bitangentEC", "fragment");
}

/**
 * 更新着色器中声明的 uniform 的值。
 * @param {string} uniformName uniform 的 GLSL 名称。必须与构造函数中声明的 uniforms 之一匹配。
 * @param {boolean|number|Cartesian2|Cartesian3|Cartesian4|Matrix2|Matrix3|Matrix4|string|Resource|TextureUniform} value uniform 的新值。
 */

CustomShader.prototype.setUniform = function (uniformName, value) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("uniformName", uniformName);
  Check.defined("value", value);
  if (!defined(this.uniforms[uniformName])) {
    throw new DeveloperError(
      `Uniform ${uniformName} must be declared in the CustomShader constructor.`,
    );
  }
  //>>includeEnd('debug');
  const uniform = this.uniforms[uniformName];
  if (uniform.type === UniformType.SAMPLER_2D) {
    // Textures are loaded asynchronously
    this._textureManager.loadTexture2D(uniformName, value);
  } else if (defined(value.clone)) {
    // clone Cartesian and Matrix types.
    uniform.value = value.clone(uniform.value);
  } else {
    uniform.value = value;
  }
};

CustomShader.prototype.update = function (frameState) {
  this._defaultTexture = frameState.context.defaultTexture;
  this._textureManager.update(frameState);
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果该对象已被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 true；否则返回 false。
 *
 * @see CustomShader#destroy
 * @private
 */

CustomShader.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地
 * 释放 WebGL 资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，则不应使用；调用除
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * customShader = customShader && customShader.destroy();
 *
 * @see CustomShader#isDestroyed
 * @private
 */

CustomShader.prototype.destroy = function () {
  this._textureManager = this._textureManager && this._textureManager.destroy();
  destroyObject(this);
};

export default CustomShader;
