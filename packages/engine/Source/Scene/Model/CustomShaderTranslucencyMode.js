/**
 * 一个枚举，用于控制 {@link CustomShader} 如何处理与原始
 * 原始对象相比的半透明度。
 *
 * @enum {number}
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范尚未最终确定，并可能在没有 Cesium 标准弃用政策的情况下发生更改。
 */
const CustomShaderTranslucencyMode = {
  /**
   * 从原始对象的材质继承半透明设置。如果原始对象使用了
   * 半透明材质，则自定义着色器也将被视为半透明。如果原始对象
   * 使用了不透明材质，则自定义着色器将被视为不透明。
   *
   * @type {number}
   * @constant
   */
  INHERIT: 0,

  /**
   * 强制原始对象以不透明形式渲染，而忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  OPAQUE: 1,

  /**
   * 强制原始对象以半透明形式渲染，而忽略任何材质设置。
   *
   * @type {number}
   * @constant
   */
  TRANSLUCENT: 2,
};

export default Object.freeze(CustomShaderTranslucencyMode);
