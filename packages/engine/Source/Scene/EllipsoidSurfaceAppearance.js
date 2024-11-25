import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import VertexFormat from "../Core/VertexFormat.js";
import EllipsoidSurfaceAppearanceFS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceFS.js";
import EllipsoidSurfaceAppearanceVS from "../Shaders/Appearances/EllipsoidSurfaceAppearanceVS.js";
import Appearance from "./Appearance.js";
import Material from "./Material.js";

/**
 * 为椭球体表面的几何体提供一种外观，例如 {@link PolygonGeometry} 和 {@link RectangleGeometry}，支持所有材质，如 {@link MaterialAppearance}
 * 和 {@link MaterialAppearance.MaterialSupport.ALL}。然而，该外观所需的顶点属性更少，因为片段着色器可以程序性地计算 <code>normal</code>、<code>tangent</code> 和 <code>bitangent</code>。
 *
 * @alias EllipsoidSurfaceAppearance
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.flat=false] 当 <code>true</code> 时，片段着色器使用平面阴影，这意味着光照不会被考虑。
 * @param {boolean} [options.faceForward=options.aboveGround] 当 <code>true</code> 时，片段着色器根据需要翻转表面法线，以确保法线面向观察者，避免暗点。当几何体的两侧都应着色时，这在 {@link WallGeometry} 中非常有用。
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期显示为半透明，因此 {@link EllipsoidSurfaceAppearance#renderState} 启用 alpha 混合。
 * @param {boolean} [options.aboveGround=false] 当 <code>true</code> 时，几何体预期位于椭球体表面，而不是在其上方恒定高度，因此 {@link EllipsoidSurfaceAppearance#renderState} 启用背面剔除。
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材质。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，以覆盖默认的顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，以覆盖默认的片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，以覆盖默认的渲染状态。
 *
 * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
 *
 * @example
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.PolygonGeometry({
 *       vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT,
 *       // ...
 *     })
 *   }),
 *   appearance : new Cesium.EllipsoidSurfaceAppearance({
 *     material : Cesium.Material.fromType('Stripe')
 *   })
 * });
 */
function EllipsoidSurfaceAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const aboveGround = defaultValue(options.aboveGround, false);

  /**
   * 用于确定片段颜色的材质。与其他 {@link EllipsoidSurfaceAppearance}
   * 属性不同，这个属性不是只读的，因此外观的材质可以动态更改。
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
   * 当 <code>true</code> 时，几何体预期显示为半透明。
   *
   * @type {boolean}
   *
   * @default true
   */

  this.translucent = defaultValue(options.translucent, true);

  this._vertexShaderSource = defaultValue(
    options.vertexShaderSource,
    EllipsoidSurfaceAppearanceVS,
  );
  this._fragmentShaderSource = defaultValue(
    options.fragmentShaderSource,
    EllipsoidSurfaceAppearanceFS,
  );
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    !aboveGround,
    options.renderState,
  );
  this._closed = false;

  // Non-derived members

  this._flat = defaultValue(options.flat, false);
  this._faceForward = defaultValue(options.faceForward, aboveGround);
  this._aboveGround = aboveGround;
}

Object.defineProperties(EllipsoidSurfaceAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 源代码是程序性构建的，考虑了 {@link EllipsoidSurfaceAppearance#material}、
   * {@link EllipsoidSurfaceAppearance#flat} 和 {@link EllipsoidSurfaceAppearance#faceForward}。
   * 使用 {@link EllipsoidSurfaceAppearance#getFragmentShaderSource} 获取完整源代码。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 渲染几何体时使用的 WebGL 固定功能状态。
   * <p>
   * 渲染状态可以在构建 {@link EllipsoidSurfaceAppearance}
   * 实例时显式定义，或通过 {@link EllipsoidSurfaceAppearance#translucent}
   * 和 {@link EllipsoidSurfaceAppearance#aboveGround} 隐式设置。
   * </p>
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 当 <code>true</code> 时，几何图形应闭合，以便
   * {@link EllipsoidSurfaceAppearance#renderState} 启用背面剔除。
   * 如果观察者进入几何体，它将不可见。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 此外观实例兼容的 {@link VertexFormat}。
   * 几何体可以有更多的顶点属性，仍然兼容——
   * 但可能会牺牲性能——但不能更少。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link EllipsoidSurfaceAppearance.VERTEX_FORMAT}
   */
  vertexFormat: {
    get: function () {
      return EllipsoidSurfaceAppearance.VERTEX_FORMAT;
    },
  },

  /**
   * 当 <code>true</code> 时，片段着色器使用平面阴影，
   * 这意味着光照不被考虑。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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
   * 当 <code>true</code> 时，片段着色器根据需要翻转表面法线，
   * 以确保法线面向观察者，避免
   * 暗点。这在几何体的两侧都应着色时非常有用，
   * 如 {@link WallGeometry}。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
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

  /**
   * 当 <code>true</code> 时，几何体预期位于椭球体的
   * 表面——而不是在其上方的恒定高度——所以 {@link EllipsoidSurfaceAppearance#renderState}
   * 启用背面剔除。
   *
   * @memberof EllipsoidSurfaceAppearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  aboveGround: {
    get: function () {
      return this._aboveGround;
    },
  },
});

/**
 * 所有 {@link EllipsoidSurfaceAppearance} 实例兼容的 {@link VertexFormat}，仅要求 <code>position</code> 和 <code>st</code>
 * 属性。其他属性在片段着色器中程序性计算得出。
 *
 * @type VertexFormat
 *
 * @constant
 */

EllipsoidSurfaceAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

/**
 * 程序性地创建完整的 GLSL 片段着色器源代码。对于 {@link EllipsoidSurfaceAppearance}，
 * 这来源于 {@link EllipsoidSurfaceAppearance#fragmentShaderSource}、{@link EllipsoidSurfaceAppearance#flat}
 * 和 {@link EllipsoidSurfaceAppearance#faceForward}。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源代码。
 */

EllipsoidSurfaceAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;
/**
 * 根据 {@link EllipsoidSurfaceAppearance#translucent} 和 {@link Material#isTranslucent} 判断几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code> 如果外观是半透明的。
 */

EllipsoidSurfaceAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建一个渲染状态。这不是最终的渲染状态实例；相反，
 * 它可以包含与上下文中创建的渲染状态相同的部分渲染状态属性。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */

EllipsoidSurfaceAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default EllipsoidSurfaceAppearance;
