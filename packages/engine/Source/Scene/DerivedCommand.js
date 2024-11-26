import defined from "../Core/defined.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import MetadataType from "./MetadataType.js";
import MetadataPickingPipelineStage from "./Model/MetadataPickingPipelineStage.js";

/**
 * @private
 */
function DerivedCommand() {}

const fragDepthRegex = /\bgl_FragDepth\b/;
const discardRegex = /\bdiscard\b/;

function getDepthOnlyShaderProgram(context, shaderProgram) {
  const cachedShader = context.shaderCache.getDerivedShaderProgram(
    shaderProgram,
    "depthOnly",
  );
  if (defined(cachedShader)) {
    return cachedShader;
  }

  let fs = shaderProgram.fragmentShaderSource;

  let writesDepthOrDiscards = false;
  const sources = fs.sources;
  for (let i = 0; i < sources.length; ++i) {
    if (fragDepthRegex.test(sources[i]) || discardRegex.test(sources[i])) {
      writesDepthOrDiscards = true;
      break;
    }
  }

  const usesLogDepth = fs.defines.indexOf("LOG_DEPTH") >= 0;

  if (!writesDepthOrDiscards && !usesLogDepth) {
    const source = `void main()
{
    out_FragColor = vec4(1.0);
}
`;
    fs = new ShaderSource({
      sources: [source],
    });
  } else if (!writesDepthOrDiscards && usesLogDepth) {
    const source = `void main()
{
    out_FragColor = vec4(1.0);
    czm_writeLogDepth();
}
`;
    fs = new ShaderSource({
      defines: ["LOG_DEPTH"],
      sources: [source],
    });
  }

  return context.shaderCache.createDerivedShaderProgram(
    shaderProgram,
    "depthOnly",
    {
      vertexShaderSource: shaderProgram.vertexShaderSource,
      fragmentShaderSource: fs,
      attributeLocations: shaderProgram._attributeLocations,
    },
  );
}

function getDepthOnlyRenderState(scene, renderState) {
  const cache = scene._depthOnlyRenderStateCache;

  const cachedDepthOnlyState = cache[renderState.id];
  if (defined(cachedDepthOnlyState)) {
    return cachedDepthOnlyState;
  }

  const rs = RenderState.getState(renderState);
  rs.depthMask = true;
  rs.colorMask = {
    red: false,
    green: false,
    blue: false,
    alpha: false,
  };

  const depthOnlyState = RenderState.fromCache(rs);
  cache[renderState.id] = depthOnlyState;

  return depthOnlyState;
}

DerivedCommand.createDepthOnlyDerivedCommand = function (
  scene,
  command,
  context,
  result,
) {
  // For a depth only pass, we bind a framebuffer with only a depth attachment (no color attachments),
  // do not write color, and write depth. If the fragment shader doesn't modify the fragment depth
  // or discard, the driver can replace the fragment shader with a pass-through shader. We're unsure if this
  // actually happens so we modify the shader to use a pass-through fragment shader.

  if (!defined(result)) {
    result = {};
  }

  const shader = result.depthOnlyCommand?.shaderProgram;
  const renderState = result.depthOnlyCommand?.renderState;

  result.depthOnlyCommand = DrawCommand.shallowClone(
    command,
    result.depthOnlyCommand,
  );

  if (!defined(shader) || result.shaderProgramId !== command.shaderProgram.id) {
    result.depthOnlyCommand.shaderProgram = getDepthOnlyShaderProgram(
      context,
      command.shaderProgram,
    );
    result.depthOnlyCommand.renderState = getDepthOnlyRenderState(
      scene,
      command.renderState,
    );
    result.shaderProgramId = command.shaderProgram.id;
  } else {
    result.depthOnlyCommand.shaderProgram = shader;
    result.depthOnlyCommand.renderState = renderState;
  }

  return result;
};

const writeLogDepthRegex = /\s+czm_writeLogDepth\(/;
const vertexlogDepthRegex = /\s+czm_vertexLogDepth\(/;

function getLogDepthShaderProgram(context, shaderProgram) {
  const disableLogDepthWrite =
    shaderProgram.fragmentShaderSource.defines.indexOf("LOG_DEPTH_READ_ONLY") >=
    0;
  if (disableLogDepthWrite) {
    return shaderProgram;
  }

  const cachedShader = context.shaderCache.getDerivedShaderProgram(
    shaderProgram,
    "logDepth",
  );
  if (defined(cachedShader)) {
    return cachedShader;
  }

  const attributeLocations = shaderProgram._attributeLocations;
  const vs = shaderProgram.vertexShaderSource.clone();
  const fs = shaderProgram.fragmentShaderSource.clone();

  vs.defines = defined(vs.defines) ? vs.defines.slice(0) : [];
  vs.defines.push("LOG_DEPTH");
  fs.defines = defined(fs.defines) ? fs.defines.slice(0) : [];
  fs.defines.push("LOG_DEPTH");

  let writesLogDepth = false;
  let sources = vs.sources;
  for (let i = 0; i < sources.length; ++i) {
    if (vertexlogDepthRegex.test(sources[i])) {
      writesLogDepth = true;
      break;
    }
  }

  if (!writesLogDepth) {
    for (let i = 0; i < sources.length; ++i) {
      sources[i] = ShaderSource.replaceMain(sources[i], "czm_log_depth_main");
    }

    const logMain = `

void main()
{
    czm_log_depth_main();
    czm_vertexLogDepth();
}
`;
    sources.push(logMain);
  }

  sources = fs.sources;

  writesLogDepth = false;
  for (let i = 0; i < sources.length; ++i) {
    if (writeLogDepthRegex.test(sources[i])) {
      writesLogDepth = true;
    }
  }
  // This define indicates that a log depth value is written by the shader but doesn't use czm_writeLogDepth.
  if (fs.defines.indexOf("LOG_DEPTH_WRITE") !== -1) {
    writesLogDepth = true;
  }

  let logSource = "";

  if (!writesLogDepth) {
    for (let i = 0; i < sources.length; i++) {
      sources[i] = ShaderSource.replaceMain(sources[i], "czm_log_depth_main");
    }

    logSource = `
void main()
{
    czm_log_depth_main();
    czm_writeLogDepth();
}
`;
  }

  sources.push(logSource);

  return context.shaderCache.createDerivedShaderProgram(
    shaderProgram,
    "logDepth",
    {
      vertexShaderSource: vs,
      fragmentShaderSource: fs,
      attributeLocations: attributeLocations,
    },
  );
}

DerivedCommand.createLogDepthCommand = function (command, context, result) {
  if (!defined(result)) {
    result = {};
  }

  const shader = result.command?.shaderProgram;

  result.command = DrawCommand.shallowClone(command, result.command);

  if (!defined(shader) || result.shaderProgramId !== command.shaderProgram.id) {
    result.command.shaderProgram = getLogDepthShaderProgram(
      context,
      command.shaderProgram,
    );
    result.shaderProgramId = command.shaderProgram.id;
  } else {
    result.command.shaderProgram = shader;
  }

  return result;
};

function getPickShaderProgram(context, shaderProgram, pickId) {
  const cachedShader = context.shaderCache.getDerivedShaderProgram(
    shaderProgram,
    "pick",
  );
  if (defined(cachedShader)) {
    return cachedShader;
  }

  const attributeLocations = shaderProgram._attributeLocations;
  const { sources, defines } = shaderProgram.fragmentShaderSource;

  const hasFragData = sources.some((source) => source.includes("out_FragData"));
  const outputColorVariable = hasFragData ? "out_FragData_0" : "out_FragColor";
  const newMain = `void main () 
{ 
    czm_non_pick_main(); 
    if (${outputColorVariable}.a == 0.0) { 
        discard; 
    } 
    ${outputColorVariable} = ${pickId}; 
} `;

  const length = sources.length;
  const newSources = new Array(length + 1);
  for (let i = 0; i < length; ++i) {
    newSources[i] = ShaderSource.replaceMain(sources[i], "czm_non_pick_main");
  }
  newSources[length] = newMain;
  const fragmentShaderSource = new ShaderSource({
    sources: newSources,
    defines: defines,
  });
  return context.shaderCache.createDerivedShaderProgram(shaderProgram, "pick", {
    vertexShaderSource: shaderProgram.vertexShaderSource,
    fragmentShaderSource: fragmentShaderSource,
    attributeLocations: attributeLocations,
  });
}

function getPickRenderState(scene, renderState) {
  const cache = scene.picking.pickRenderStateCache;
  const cachedPickState = cache[renderState.id];
  if (defined(cachedPickState)) {
    return cachedPickState;
  }

  const rs = RenderState.getState(renderState);
  rs.blending.enabled = false;

  // Turns on depth writing for opaque and translucent passes
  // Overlapping translucent geometry on the globe surface may exhibit z-fighting
  // during the pick pass which may not match the rendered scene. Once
  // terrain is on by default and ground primitives are used instead
  // this will become less of a problem.
  rs.depthMask = true;

  const pickState = RenderState.fromCache(rs);
  cache[renderState.id] = pickState;
  return pickState;
}

DerivedCommand.createPickDerivedCommand = function (
  scene,
  command,
  context,
  result,
) {
  if (!defined(result)) {
    result = {};
  }

  const shader = result.pickCommand?.shaderProgram;
  const renderState = result.pickCommand?.renderState;

  result.pickCommand = DrawCommand.shallowClone(command, result.pickCommand);

  if (!defined(shader) || result.shaderProgramId !== command.shaderProgram.id) {
    result.pickCommand.shaderProgram = getPickShaderProgram(
      context,
      command.shaderProgram,
      command.pickId,
    );
    result.pickCommand.renderState = getPickRenderState(
      scene,
      command.renderState,
    );
    result.shaderProgramId = command.shaderProgram.id;
  } else {
    result.pickCommand.shaderProgram = shader;
    result.pickCommand.renderState = renderState;
  }

  return result;
};

/**
 * 用给定值替换指定的 'define' 指令标识符的值。
 *
 * 给定的定义是存储在 `ShaderSource` 中的 define 指令的部分。例如，定义可以是
 * `["EXAMPLE", "EXAMPLE_VALUE 123"]`
 *
 * 调用 `replaceDefine(defines, "EXAMPLE", 999)` 将导致
 * 定义变为 `["EXAMPLE 999", "EXAMPLE_VALUE 123"]`
 *
 * @param {string[]} defines 定义指令标识符
 * @param {string} defineName 定义指令的名称（标识符）
 * @param {any} newDefineValue 新值，其字符串表示将成为定义指令的标记字符串
 * @private
 */

function replaceDefine(defines, defineName, newDefineValue) {
  const n = defines.length;
  for (let i = 0; i < n; i++) {
    const define = defines[i];
    const tokens = define.trimStart().split(/\s+/);
    if (tokens[0] === defineName) {
      defines[i] = `${defineName} ${newDefineValue}`;
    }
  }
}

/**
 * 返回给定类属性的组件数量，或
 * 如果是数组，则返回其数组长度。
 *
 * 对于类型 `[SCALAR, VEC2, VEC3, VEC4]`，
 * 此值将为 `[1, 2, 3, 4]`，
 * 或者如果是数组则为数组长度。
 *
 * @param {MetadataClassProperty} classProperty 类属性
 * @returns {number} 组件数量
 * @private
 */

function getComponentCount(classProperty) {
  if (!classProperty.isArray) {
    return MetadataType.getComponentCount(classProperty.type);
  }
  return classProperty.arrayLength;
}

/**
 * 返回给定类属性在 GLSL 着色器中的类型。
 *
 * 对于具有给定类属性的属性纹理属性，它返回与 `PropertyTextureProperty.prototype.getGlslType`
 * 相同的字符串。
 *
 * @param {MetadataClassProperty} classProperty 类属性
 * @returns {string} 属性的 GLSL 着色器类型字符串
 */

function getGlslType(classProperty) {
  const componentCount = getComponentCount(classProperty);
  if (classProperty.normalized) {
    if (componentCount === 1) {
      return "float";
    }
    return `vec${componentCount}`;
  }
  if (componentCount === 1) {
    return "int";
  }
  return `ivec${componentCount}`;
}

/**
 * 根据给定的输入创建一个新的 `ShaderProgram`，将元数据
 * 值呈现到帧缓冲区，根据给定的选中元数据信息。
 *
 * 这将通过设置 `METADATA_PICKING_ENABLED` 更新给定着色器
 * 程序的片段着色器的 `defines`，并更新
 * `METADATA_PICKING_VALUE_*` 定义，以反映应写入 RGBA (vec4)
 * 中的元数据组件，最终在帧缓冲区中作为 'color'。
 *
 * RGBA 值最终将通过调用 `MetadataPicking.decodeMetadataValues` 在 `Picking.js` 中
 * 转换回实际的元数据值。
 *
 * @param {Context} context 上下文
 * @param {ShaderProgram} shaderProgram 着色器程序
 * @param {PickedMetadataInfo} pickedMetadataInfo 选中的元数据信息
 * @returns {ShaderProgram} 新的着色器程序
 * @private
 */

function getPickMetadataShaderProgram(
  context,
  shaderProgram,
  pickedMetadataInfo,
) {
  const schemaId = pickedMetadataInfo.schemaId;
  const className = pickedMetadataInfo.className;
  const propertyName = pickedMetadataInfo.propertyName;
  const keyword = `pickMetadata-${schemaId}-${className}-${propertyName}`;
  const shader = context.shaderCache.getDerivedShaderProgram(
    shaderProgram,
    keyword,
  );
  if (defined(shader)) {
    return shader;
  }

  const classProperty = pickedMetadataInfo.classProperty;
  const glslType = getGlslType(classProperty);

  // Define the components that will go into the output `metadataValues`.
  // By default, all of them are 0.0.
  const sourceValueStrings = ["0.0", "0.0", "0.0", "0.0"];
  const componentCount = getComponentCount(classProperty);
  if (componentCount === 1) {
    // When the property is a scalar, store its value directly
    // in `metadataValues.x`
    sourceValueStrings[0] = `float(value)`;
  } else {
    // When the property is an array, store the array elements
    // in `metadataValues.x/y/z/w`
    const components = ["x", "y", "z", "w"];
    for (let i = 0; i < componentCount; i++) {
      const component = components[i];
      const valueString = `value.${component}`;
      sourceValueStrings[i] = `float(${valueString})`;
    }
  }

  // Make sure that the `metadataValues` components are all in
  // the range [0, 1] (which will result in RGBA components
  // in [0, 255] during rendering)
  if (!classProperty.normalized) {
    for (let i = 0; i < componentCount; i++) {
      sourceValueStrings[i] += " / 255.0";
    }
  }

  const newDefines = shaderProgram.fragmentShaderSource.defines.slice();
  newDefines.push(MetadataPickingPipelineStage.METADATA_PICKING_ENABLED);

  // Replace the defines of the shader, using the type, property
  // access, and value components  that have been determined
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_TYPE,
    glslType,
  );
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_STRING,
    `metadata.${propertyName}`,
  );
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_COMPONENT_X,
    sourceValueStrings[0],
  );
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_COMPONENT_Y,
    sourceValueStrings[1],
  );
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_COMPONENT_Z,
    sourceValueStrings[2],
  );
  replaceDefine(
    newDefines,
    MetadataPickingPipelineStage.METADATA_PICKING_VALUE_COMPONENT_W,
    sourceValueStrings[3],
  );

  const newFragmentShaderSource = new ShaderSource({
    sources: shaderProgram.fragmentShaderSource.sources,
    defines: newDefines,
  });
  const newShader = context.shaderCache.createDerivedShaderProgram(
    shaderProgram,
    keyword,
    {
      vertexShaderSource: shaderProgram.vertexShaderSource,
      fragmentShaderSource: newFragmentShaderSource,
      attributeLocations: shaderProgram._attributeLocations,
    },
  );
  return newShader;
}

/**
 * @private
 */
DerivedCommand.createPickMetadataDerivedCommand = function (
  scene,
  command,
  context,
  result,
) {
  if (!defined(result)) {
    result = {};
  }
  result.pickMetadataCommand = DrawCommand.shallowClone(
    command,
    result.pickMetadataCommand,
  );

  result.pickMetadataCommand.shaderProgram = getPickMetadataShaderProgram(
    context,
    command.shaderProgram,
    command.pickedMetadataInfo,
  );
  result.pickMetadataCommand.renderState = getPickRenderState(
    scene,
    command.renderState,
  );
  result.shaderProgramId = command.shaderProgram.id;

  return result;
};

function getHdrShaderProgram(context, shaderProgram) {
  const cachedShader = context.shaderCache.getDerivedShaderProgram(
    shaderProgram,
    "HDR",
  );
  if (defined(cachedShader)) {
    return cachedShader;
  }

  const attributeLocations = shaderProgram._attributeLocations;
  const vs = shaderProgram.vertexShaderSource.clone();
  const fs = shaderProgram.fragmentShaderSource.clone();

  vs.defines = defined(vs.defines) ? vs.defines.slice(0) : [];
  vs.defines.push("HDR");
  fs.defines = defined(fs.defines) ? fs.defines.slice(0) : [];
  fs.defines.push("HDR");

  return context.shaderCache.createDerivedShaderProgram(shaderProgram, "HDR", {
    vertexShaderSource: vs,
    fragmentShaderSource: fs,
    attributeLocations: attributeLocations,
  });
}

DerivedCommand.createHdrCommand = function (command, context, result) {
  if (!defined(result)) {
    result = {};
  }

  const shader = result.command?.shaderProgram;

  result.command = DrawCommand.shallowClone(command, result.command);

  if (!defined(shader) || result.shaderProgramId !== command.shaderProgram.id) {
    result.command.shaderProgram = getHdrShaderProgram(
      context,
      command.shaderProgram,
    );
    result.shaderProgramId = command.shaderProgram.id;
  } else {
    result.command.shaderProgram = shader;
  }

  return result;
};
export default DerivedCommand;
