import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import createPropertyDescriptor from "./createPropertyDescriptor.js";
import NodeTransformationProperty from "./NodeTransformationProperty.js";
import PropertyBag from "./PropertyBag.js";

function createNodeTransformationProperty(value) {
  return new NodeTransformationProperty(value);
}

function createNodeTransformationPropertyBag(value) {
  return new PropertyBag(value, createNodeTransformationProperty);
}

function createArticulationStagePropertyBag(value) {
  return new PropertyBag(value);
}

/**
 * @typedef {object} ModelGraphics.ConstructorOptions
 *
 * ModelGraphics 构造函数的初始化选项
 *
 * @property {Property | boolean} [show=true] 一个布尔属性，指定模型的可见性。
 * @property {Property | string | Resource} [uri] 一个字符串或资源属性，指定 glTF 资产的 URI。
 * @property {Property | number} [scale=1.0] 一个数值属性，指定统一线性缩放。
 * @property {Property | boolean} [enableVerticalExaggeration=true] 一个布尔属性，指定当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型是否在椭球法线方向上夸张。
 * @property {Property | number} [minimumPixelSize=0.0] 一个数值属性，指定模型的近似最小像素大小，忽略缩放。
 * @property {Property | number} [maximumScale] 模型的最大缩放大小，最低像素大小的上限。
 * @property {Property | boolean} [incrementallyLoadTextures=true] 确定模型加载后纹理是否可以继续流入。
 * @property {Property | boolean} [runAnimations=true] 一个布尔属性，指定是否应该开始模型中指定的 glTF 动画。
 * @property {Property | boolean} [clampAnimations=true] 一个布尔属性，指定在没有关键帧的时间段内，glTF 动画是否应保持最后的姿态。
 * @property {Property | ShadowMode} [shadows=ShadowMode.ENABLED] 一个枚举属性，指定模型是否从光源投射或接收阴影。
 * @property {Property | HeightReference} [heightReference=HeightReference.NONE] 一个属性，指定高度相对于什么。
 * @property {Property | Color} [silhouetteColor=Color.RED] 一个属性，指定轮廓的 {@link Color}。
 * @property {Property | number} [silhouetteSize=0.0] 一个数值属性，指定轮廓的大小（以像素为单位）。
 * @property {Property | Color} [color=Color.WHITE] 一个属性，指定与模型渲染颜色混合的 {@link Color}。
 * @property {Property | ColorBlendMode} [colorBlendMode=ColorBlendMode.HIGHLIGHT] 一个枚举属性，指定颜色如何与模型混合。
 * @property {Property | number} [colorBlendAmount=0.5] 一个数值属性，指定当 <code>colorBlendMode</code> 为 <code>MIX</code> 时的颜色强度。值为 0.0 时会呈现模型的颜色，值为 1.0 时会呈现纯色，介于两者之间的值会导致两者的混合。
 * @property {Property | Cartesian2} [imageBasedLightingFactor=new Cartesian2(1.0, 1.0)] 一个属性，指定来自漫反射和高光基于图像的光照的贡献。
 * @property {Property | Color} [lightColor] 一个属性，指定在给模型上色时的光颜色。当 <code>undefined</code> 时，使用场景的光颜色。
 * @property {Property | DistanceDisplayCondition} [distanceDisplayCondition] 一个属性，指定从相机的距离以显示该模型。
 * @property {PropertyBag | Object<string, TranslationRotationScale>} [nodeTransformations] 一个对象，其中键是节点的名称，值是描述对该节点应用的转换的 {@link TranslationRotationScale} 属性。该转换在 glTF 中指定的节点现有转换之后应用，并不会替换节点的现有转换。
 * @property {PropertyBag | Object<string, number>} [articulations] 一个对象，其中键由一个关节名称、一个空格和一个阶段名称组成，值是数值属性。
 * @property {Property | ClippingPlaneCollection} [clippingPlanes] 一个属性，指定用于选择性禁用模型渲染的 {@link ClippingPlaneCollection}。
 * @property {Property | CustomShader} [customShader] 一个属性，指定应用于该模型的 {@link CustomShader}。
 */


/**
 * 基于 {@link https://github.com/KhronosGroup/glTF|glTF} 的 3D 模型，glTF 是 WebGL、OpenGL ES 和 OpenGL 的运行时资产格式。
 * 模型的位置和方向由包含的 {@link Entity} 决定。
 * <p>
 * Cesium 支持 glTF 几何图形、材质、动画和绑定功能。
 * 目前不支持相机和光源。
 * </p>
 *
 * @alias ModelGraphics
 * @constructor
 *
 * @param {ModelGraphics.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=3D%20Models.html|Cesium Sandcastle 3D Models Demo}
 */
function ModelGraphics(options) {
  this._definitionChanged = new Event();
  this._show = undefined;
  this._showSubscription = undefined;
  this._uri = undefined;
  this._uriSubscription = undefined;
  this._scale = undefined;
  this._scaleSubscription = undefined;
  this._hasVerticalExaggeration = undefined;
  this._hasVerticalExaggerationSubscription = undefined;
  this._enableVerticalExaggeration = undefined;
  this._enableVerticalExaggerationSubscription = undefined;
  this._minimumPixelSize = undefined;
  this._minimumPixelSizeSubscription = undefined;
  this._maximumScale = undefined;
  this._maximumScaleSubscription = undefined;
  this._incrementallyLoadTextures = undefined;
  this._incrementallyLoadTexturesSubscription = undefined;
  this._runAnimations = undefined;
  this._runAnimationsSubscription = undefined;
  this._clampAnimations = undefined;
  this._clampAnimationsSubscription = undefined;
  this._shadows = undefined;
  this._shadowsSubscription = undefined;
  this._heightReference = undefined;
  this._heightReferenceSubscription = undefined;
  this._silhouetteColor = undefined;
  this._silhouetteColorSubscription = undefined;
  this._silhouetteSize = undefined;
  this._silhouetteSizeSubscription = undefined;
  this._color = undefined;
  this._colorSubscription = undefined;
  this._colorBlendMode = undefined;
  this._colorBlendModeSubscription = undefined;
  this._colorBlendAmount = undefined;
  this._colorBlendAmountSubscription = undefined;
  this._imageBasedLightingFactor = undefined;
  this._imageBasedLightingFactorSubscription = undefined;
  this._lightColor = undefined;
  this._lightColorSubscription = undefined;
  this._distanceDisplayCondition = undefined;
  this._distanceDisplayConditionSubscription = undefined;
  this._nodeTransformations = undefined;
  this._nodeTransformationsSubscription = undefined;
  this._articulations = undefined;
  this._articulationsSubscription = undefined;
  this._clippingPlanes = undefined;
  this._clippingPlanesSubscription = undefined;
  this._customShader = undefined;
  this._customShaderSubscription = undefined;

  this.merge(defaultValue(options, defaultValue.EMPTY_OBJECT));
}

Object.defineProperties(ModelGraphics.prototype, {
  /**
   * 当属性或子属性发生更改或修改时触发的事件。
   * @memberof ModelGraphics.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },

  /**
   * 获取或设置布尔属性，指定模型的可见性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  show: createPropertyDescriptor("show"),

  /**
   * 获取或设置字符串属性，指定 glTF 资产的 URI。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  uri: createPropertyDescriptor("uri"),

  /**
   * 获取或设置数值属性，指定此模型的统一线性缩放。
   * 大于 1.0 的值增加模型的大小，而小于 1.0 的值减小模型的大小。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 1.0
   */
  scale: createPropertyDescriptor("scale"),

  /**
   * 获取或设置布尔属性，指定当 {@link Scene.verticalExaggeration} 设置为非 <code>1.0</code> 的值时，模型是否在椭球法线方向上夸张。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  enableVerticalExaggeration: createPropertyDescriptor(
    "enableVerticalExaggeration",
  ),

  /**
   * 获取或设置数值属性，指定模型的近似最小像素大小，忽略缩放。
   * 这可用于确保模型在查看器缩小时可见。当 <code>0.0</code> 时，
   * 不强制执行最小大小。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  minimumPixelSize: createPropertyDescriptor("minimumPixelSize"),

  /**
   * 获取或设置数值属性，指定模型的最大缩放大小。
   * 该属性用作 {@link ModelGraphics#minimumPixelSize} 的上限。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  maximumScale: createPropertyDescriptor("maximumScale"),

  /**
   * 获取或设置布尔属性，指定纹理是否可以在模型加载后继续流入。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  incrementallyLoadTextures: createPropertyDescriptor(
    "incrementallyLoadTextures",
  ),

  /**
   * 获取或设置布尔属性，指定是否应运行 glTF 动画。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  runAnimations: createPropertyDescriptor("runAnimations"),

  /**
   * 获取或设置布尔属性，指定在没有关键帧的时间段内，glTF 动画是否应保持最后的姿态。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default true
   */
  clampAnimations: createPropertyDescriptor("clampAnimations"),

  /**
   * 获取或设置枚举属性，指定模型是否从光源投射或接收阴影。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default ShadowMode.ENABLED
   */
  shadows: createPropertyDescriptor("shadows"),

  /**
   * 获取或设置指定 {@link HeightReference} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default HeightReference.NONE
   */
  heightReference: createPropertyDescriptor("heightReference"),

  /**
   * 获取或设置指定轮廓颜色的属性 {@link Color}。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.RED
   */
  silhouetteColor: createPropertyDescriptor("silhouetteColor"),

  /**
   * 获取或设置数值属性，指定轮廓的大小（以像素为单位）。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.0
   */
  silhouetteSize: createPropertyDescriptor("silhouetteSize"),

  /**
   * 获取或设置指定 {@link Color} 的属性，该属性与模型渲染颜色混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default Color.WHITE
   */
  color: createPropertyDescriptor("color"),

  /**
   * 获取或设置枚举属性，指定颜色如何与模型混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default ColorBlendMode.HIGHLIGHT
   */
  colorBlendMode: createPropertyDescriptor("colorBlendMode"),

  /**
   * 指定当 <code>colorBlendMode</code> 为 MIX 时的颜色强度的数值属性。
   * 值为 0.0 时呈现模型渲染颜色，值为 1.0 时呈现纯色，介于两者之间的值导致两者的混合。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   * @default 0.5
   */
  colorBlendAmount: createPropertyDescriptor("colorBlendAmount"),

  /**
   * 指定 {@link Cartesian2} 的属性，用于缩放漫反射和高光基于图像的光照对最终颜色的贡献。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  imageBasedLightingFactor: createPropertyDescriptor(
    "imageBasedLightingFactor",
  ),

  /**
   * 指定在给模型上色时的 {@link Cartesian3} 光颜色的属性。当 <code>undefined</code> 时，使用场景的光颜色。
   * @memberOf ModelGraphics.prototype
   * @type {Property|undefined}
   */
  lightColor: createPropertyDescriptor("lightColor"),

  /**
   * 获取或设置 {@link DistanceDisplayCondition} 属性，指定从相机的距离以显示该模型。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  distanceDisplayCondition: createPropertyDescriptor(
    "distanceDisplayCondition",
  ),

  /**
   * 获取或设置应用于此模型的节点变换集合。这表示为 {@link PropertyBag}，其中键是
   * 节点的名称，值是描述要应用于该节点的转换的 {@link TranslationRotationScale} 属性。
   * 转换在 glTF 中指定的节点现有转换之后应用，并不会替换节点的现有转换。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  nodeTransformations: createPropertyDescriptor(
    "nodeTransformations",
    undefined,
    createNodeTransformationPropertyBag,
  ),

  /**
   * 获取或设置应用于此模型的关节值集合。这表示为 {@link PropertyBag}，其中键由
   * 关节名称、一个空格和阶段名称组成。
   * @memberof ModelGraphics.prototype
   * @type {PropertyBag}
   */
  articulations: createPropertyDescriptor(
    "articulations",
    undefined,
    createArticulationStagePropertyBag,
  ),

  /**
   * 指定用于选择性禁用模型渲染的 {@link ClippingPlaneCollection} 的属性。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  clippingPlanes: createPropertyDescriptor("clippingPlanes"),

  /**
   * 获取或设置要应用于此模型的 {@link CustomShader} 属性。当 <code>undefined</code> 时，不使用自定义着色器代码。
   * @memberof ModelGraphics.prototype
   * @type {Property|undefined}
   */
  customShader: createPropertyDescriptor("customShader"),
});


/**
 * 复制此实例。
 *
 * @param {ModelGraphics} [result] 存储结果的对象。
 * @returns {ModelGraphics} 修改后的结果参数，如果未提供，则返回一个新实例。
 */

ModelGraphics.prototype.clone = function (result) {
  if (!defined(result)) {
    return new ModelGraphics(this);
  }
  result.show = this.show;
  result.uri = this.uri;
  result.scale = this.scale;
  result.enableVerticalExaggeration = this.enableVerticalExaggeration;
  result.minimumPixelSize = this.minimumPixelSize;
  result.maximumScale = this.maximumScale;
  result.incrementallyLoadTextures = this.incrementallyLoadTextures;
  result.runAnimations = this.runAnimations;
  result.clampAnimations = this.clampAnimations;
  result.heightReference = this._heightReference;
  result.silhouetteColor = this.silhouetteColor;
  result.silhouetteSize = this.silhouetteSize;
  result.color = this.color;
  result.colorBlendMode = this.colorBlendMode;
  result.colorBlendAmount = this.colorBlendAmount;
  result.imageBasedLightingFactor = this.imageBasedLightingFactor;
  result.lightColor = this.lightColor;
  result.distanceDisplayCondition = this.distanceDisplayCondition;
  result.nodeTransformations = this.nodeTransformations;
  result.articulations = this.articulations;
  result.clippingPlanes = this.clippingPlanes;
  result.customShader = this.customShader;
  return result;
};

/**
 * 将此对象上每个未分配的属性赋值为提供的源对象上相同属性的值。
 *
 * @param {ModelGraphics} source 要合并到此对象中的对象。
 */

ModelGraphics.prototype.merge = function (source) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(source)) {
    throw new DeveloperError("source is required.");
  }
  //>>includeEnd('debug');

  this.show = defaultValue(this.show, source.show);
  this.uri = defaultValue(this.uri, source.uri);
  this.scale = defaultValue(this.scale, source.scale);
  this.enableVerticalExaggeration = defaultValue(
    this.enableVerticalExaggeration,
    source.enableVerticalExaggeration,
  );
  this.minimumPixelSize = defaultValue(
    this.minimumPixelSize,
    source.minimumPixelSize,
  );
  this.maximumScale = defaultValue(this.maximumScale, source.maximumScale);
  this.incrementallyLoadTextures = defaultValue(
    this.incrementallyLoadTextures,
    source.incrementallyLoadTextures,
  );
  this.runAnimations = defaultValue(this.runAnimations, source.runAnimations);
  this.clampAnimations = defaultValue(
    this.clampAnimations,
    source.clampAnimations,
  );
  this.shadows = defaultValue(this.shadows, source.shadows);
  this.heightReference = defaultValue(
    this.heightReference,
    source.heightReference,
  );
  this.silhouetteColor = defaultValue(
    this.silhouetteColor,
    source.silhouetteColor,
  );
  this.silhouetteSize = defaultValue(
    this.silhouetteSize,
    source.silhouetteSize,
  );
  this.color = defaultValue(this.color, source.color);
  this.colorBlendMode = defaultValue(
    this.colorBlendMode,
    source.colorBlendMode,
  );
  this.colorBlendAmount = defaultValue(
    this.colorBlendAmount,
    source.colorBlendAmount,
  );
  this.imageBasedLightingFactor = defaultValue(
    this.imageBasedLightingFactor,
    source.imageBasedLightingFactor,
  );

  this.lightColor = defaultValue(this.lightColor, source.lightColor);
  this.distanceDisplayCondition = defaultValue(
    this.distanceDisplayCondition,
    source.distanceDisplayCondition,
  );
  this.clippingPlanes = defaultValue(
    this.clippingPlanes,
    source.clippingPlanes,
  );
  this.customShader = defaultValue(this.customShader, source.customShader);

  const sourceNodeTransformations = source.nodeTransformations;
  if (defined(sourceNodeTransformations)) {
    const targetNodeTransformations = this.nodeTransformations;
    if (defined(targetNodeTransformations)) {
      targetNodeTransformations.merge(sourceNodeTransformations);
    } else {
      this.nodeTransformations = new PropertyBag(
        sourceNodeTransformations,
        createNodeTransformationProperty,
      );
    }
  }

  const sourceArticulations = source.articulations;
  if (defined(sourceArticulations)) {
    const targetArticulations = this.articulations;
    if (defined(targetArticulations)) {
      targetArticulations.merge(sourceArticulations);
    } else {
      this.articulations = new PropertyBag(sourceArticulations);
    }
  }
};
export default ModelGraphics;
