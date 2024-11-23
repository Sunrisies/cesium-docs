/**
 * 一个枚举，描述 {@link CustomShader} 如何添加到
 * 片元着色器。这决定了着色器如何与材质交互。
 *
 * @enum {string}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范尚未最终确定，并可能在没有 Cesium 标准弃用政策的情况下发生更改。
 */
const CustomShaderMode = {
  /**
   * 自定义着色器将用于修改材质阶段的结果
   * 在应用光照之前。
   *
   * @type {string}
   * @constant
   */
  MODIFY_MATERIAL: "MODIFY_MATERIAL",
  
  /**
   * 自定义着色器将替代材质阶段。这是一个提示
   * 以优化掉材质处理代码。
   *
   * @type {string}
   * @constant
   */
  REPLACE_MATERIAL: "REPLACE_MATERIAL",
};

/**
 * 将着色器模式转换为用于 GLSL define 指令的大写标识符。例如： <code>#define CUSTOM_SHADER_MODIFY_MATERIAL</code>
 * @param {CustomShaderMode} customShaderMode 着色器模式
 * @return {string} 要使用的 GLSL 宏名称
 *
 * @private
 */
CustomShaderMode.getDefineName = function (customShaderMode) {
  return `CUSTOM_SHADER_${customShaderMode}`;
};

export default Object.freeze(CustomShaderMode);
