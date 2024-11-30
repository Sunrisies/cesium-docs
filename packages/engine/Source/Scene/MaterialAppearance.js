import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import AllMaterialAppearanceFS from "../Shaders/Appearances/AllMaterialAppearanceFS.js";
import AllMaterialAppearanceVS from "../Shaders/Appearances/AllMaterialAppearanceVS.js";
import BasicMaterialAppearanceFS from "../Shaders/Appearances/BasicMaterialAppearanceFS.js";
import BasicMaterialAppearanceVS from "../Shaders/Appearances/BasicMaterialAppearanceVS.js";
import TexturedMaterialAppearanceFS from "../Shaders/Appearances/TexturedMaterialAppearanceFS.js";
import TexturedMaterialAppearanceVS from "../Shaders/Appearances/TexturedMaterialAppearanceVS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

/**
 * 一个用于任意几何体的外观（例如，与 {@link EllipsoidSurfaceAppearance} 相对） 
 * ，支持使用材料进行着色。
 *
 * @alias MaterialAppearance
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.flat=false] 当 <code>true</code> 时，采用平面着色，这意味着光照不会被考虑。
 * @param {boolean} [options.faceForward=!options.closed] 当 <code>true</code> 时，片段着色器会根据需要翻转表面法线，以确保法线面向观察者，从而避免暗斑。 
 *                当几何体的两面都应着色时，例如 {@link WallGeometry}，这很有用。
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期呈现半透明效果，因此 {@link MaterialAppearance#renderState} 启用 alpha 混合。
 * @param {boolean} [options.closed=false] 当 <code>true</code> 时，几何形状应闭合，因此 {@link MaterialAppearance#renderState} 启用背面剔除。
 * @param {MaterialAppearance.MaterialSupportType} [options.materialSupport=MaterialAppearance.MaterialSupport.TEXTURED] 将支持的材料类型。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材料。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，以覆盖默认顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，以覆盖默认片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
 *
 * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Materials.html|Cesium Sandcastle Material Appearance Demo}
 *
 * @example
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.WallGeometry({
       materialSupport :  Cesium.MaterialAppearance.MaterialSupport.BASIC.vertexFormat,
 *       // ...
 *     })
 *   }),
 *   appearance : new Cesium.MaterialAppearance({
 *     material : Cesium.Material.fromType('Color'),
 *     faceForward : true
 *   })
 *
 * });
 **/
function MaterialAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = defaultValue(options.closed, false);
  const materialSupport = defaultValue(
    options.materialSupport,
    MaterialAppearance.MaterialSupport.TEXTURED,
  );

  /**
   * 用于确定片段颜色的材料。与其他 {@link MaterialAppearance}
   * 属性不同，该属性不是只读的，因此外观的材料可以动态更改。
   *
   * @type Material
   *
   * @default {@link Material.ColorType}
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = defined(options.material)
    ? options.material
    : Material.fromType(Material.ColorType);

  /**
   * 当 <code>true</code> 时，几何体预期呈现出半透明效果。
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = translucent;

  this._vertexShaderSource = defaultValue(
    options.vertexShaderSource,
    materialSupport.vertexShaderSource,
  );
  this._fragmentShaderSource = defaultValue(
    options.fragmentShaderSource,
    materialSupport.fragmentShaderSource,
  );
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._materialSupport = materialSupport;
  this._vertexFormat = materialSupport.vertexFormat;
  this._flat = defaultValue(options.flat, false);
  this._faceForward = defaultValue(options.faceForward, !closed);
}

Object.defineProperties(MaterialAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  vertexShaderSource: {
    get: function () {
      return this._vertexShaderSource;
    },
  },

  /**
   * 片段着色器的 GLSL 源代码。完整的片段着色器
   * 源代码是根据 {@link MaterialAppearance#material}、 
   * {@link MaterialAppearance#flat} 和 {@link MaterialAppearance#faceForward}
   * 构建的。使用 {@link MaterialAppearance#getFragmentShaderSource} 获取完整源代码。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {string}
   * @readonly
   */
  fragmentShaderSource: {
    get: function () {
      return this._fragmentShaderSource;
    },
  },

  /**
   * 渲染几何体时使用的 WebGL 固定函数状态。
   * <p>
   * 渲染状态可以在构造 {@link MaterialAppearance}
   * 实例时显式定义，或者通过 {@link MaterialAppearance#translucent}
   * 和 {@link MaterialAppearance#closed} 隐式设置。
   * </p>
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {object}
   * @readonly
   */
  renderState: {
    get: function () {
      return this._renderState;
    },
  },

  /**
   * 当 <code>true</code> 时，几何图形应闭合， 
   * {@link MaterialAppearance#renderState} 启用背面剔除。
   * 如果观察者进入几何体，它将不可见。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  closed: {
    get: function () {
      return this._closed;
    },
  },

  /**
   * 此实例支持的材料类型。这会影响所需的
   * {@link VertexFormat} 以及顶点和片段着色器的复杂性。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @readonly
   *
   * @default {@link MaterialAppearance.MaterialSupport.TEXTURED}
   */
  materialSupport: {
    get: function () {
      return this._materialSupport;
    },
  },

  /**
   * 此外观实例与之兼容的 {@link VertexFormat}。
   * 几何体可以具有更多的顶点属性，并仍然兼容 - 可能
   * 会影响性能 - 但不能更少。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat}
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器采用平面着色，
   * 这意味着不考虑光照。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  flat: {
    get: function () {
      return this._flat;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器会根据需要翻转表面法线，
   * 以确保法线面向观察者，避免暗斑。 
   * 当几何体的两面都应按 {@link WallGeometry} 着色时，这非常有用。
   *
   * @memberof MaterialAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default true
   */
  faceForward: {
    get: function () {
      return this._faceForward;
    },
  },
});


/**
 * 以程序方式创建完整的 GLSL 片段着色器源代码。对于 {@link MaterialAppearance}，
 * 这是从 {@link MaterialAppearance#fragmentShaderSource}、 {@link MaterialAppearance#material}、
 * {@link MaterialAppearance#flat} 和 {@link MaterialAppearance#faceForward} 派生的。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源代码。
 */
MaterialAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link MaterialAppearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code> 如果外观是半透明的。
 */

MaterialAppearance.prototype.isTranslucent = Appearance.prototype.isTranslucent;

/**
 * 创建一个渲染状态。这不是最终的渲染状态实例；相反，
 * 它可以包含与在上下文中创建的渲染状态相同的渲染状态属性的子集。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */

MaterialAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;

/**
 * @typedef MaterialAppearance.MaterialSupportType
 * @type {object}
 * @property {VertexFormat} vertexFormat
 * @property {string} vertexShaderSource
 * @property {string} fragmentShaderSource
 */

/**
 * 确定 {@link MaterialAppearance} 实例支持的 {@link Material} 类型。这是在
 * 灵活性（多种材料）与内存/性能（所需的顶点格式和 GLSL 着色器复杂性）之间的权衡。
 * @namespace
 */

MaterialAppearance.MaterialSupport = {
  /**
   * 仅支持基本材料，这些材料只需要 <code>position</code> 和
   * <code>normal</code> 顶点属性。
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */

  BASIC: Object.freeze({
    vertexFormat: VertexFormat.POSITION_AND_NORMAL,
    vertexShaderSource: BasicMaterialAppearanceVS,
    fragmentShaderSource: BasicMaterialAppearanceFS,
  }),
  /**
   * 支持带纹理的材料，这些材料需要 <code>position</code>、
   * <code>normal</code> 和 <code>st</code> 顶点属性。
   * 绝大多数材料都属于此类别。
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */

  TEXTURED: Object.freeze({
    vertexFormat: VertexFormat.POSITION_NORMAL_AND_ST,
    vertexShaderSource: TexturedMaterialAppearanceVS,
    fragmentShaderSource: TexturedMaterialAppearanceFS,
  }),
  /**
   * 支持所有材料，包括那些在切向空间中工作的材料。
   * 这需要 <code>position</code>、<code>normal</code>、<code>st</code>、
   * <code>tangent</code> 和 <code>bitangent</code> 顶点属性。
   *
   * @type {MaterialAppearance.MaterialSupportType}
   * @constant
   */

  ALL: Object.freeze({
    vertexFormat: VertexFormat.ALL,
    vertexShaderSource: AllMaterialAppearanceVS,
    fragmentShaderSource: AllMaterialAppearanceFS,
  }),
};
export default MaterialAppearance;
