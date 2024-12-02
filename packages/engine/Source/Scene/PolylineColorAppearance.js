import defaultValue from "../Core/defaultValue.js";
import FeatureDetection from "../Core/FeatureDetection.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PolylineColorAppearanceVS from "../Shaders/Appearances/PolylineColorAppearanceVS.js";
import PolylineCommon from "../Shaders/PolylineCommon.js";
import Appearance from "./Appearance.js";

let defaultVertexShaderSource = `${PolylineCommon}\n${PolylineColorAppearanceVS}`;
const defaultFragmentShaderSource = PerInstanceFlatColorAppearanceFS;

if (!FeatureDetection.isInternetExplorer()) {
  defaultVertexShaderSource = `#define CLIP_POLYLINE \n${defaultVertexShaderSource}`;
}

/**
 * 为具有颜色属性的 {@link GeometryInstance} 实例提供外观和
 * {@link PolylineGeometry} 或 {@link GroundPolylineGeometry}。
 * 这允许多个几何实例，每个实例具有不同的颜色，可以
 * 使用相同的 {@link Primitive} 进行绘制。
 *
 * @alias PolylineColorAppearance
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预计将呈现为半透明，因此 {@link PolylineColorAppearance#renderState} 启用了 alpha 混合。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认的顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认的片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认的渲染状态。
 *
 * @example
 * // A solid white line segment
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.PolylineGeometry({
 *       positions : Cesium.Cartesian3.fromDegreesArray([
 *         0.0, 0.0,
 *         5.0, 0.0
 *       ]),
 *       width : 10.0,
 *       vertexFormat : Cesium.PolylineColorAppearance.VERTEX_FORMAT
 *     }),
 *     attributes : {
 *       color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
 *     }
 *   }),
 *   appearance : new Cesium.PolylineColorAppearance({
 *     translucent : false
 *   })
 * });
 */
function PolylineColorAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = false;
  const vertexFormat = PolylineColorAppearance.VERTEX_FORMAT;

  /**
   * 该属性是 {@link Appearance} 接口的一部分，但 {@link PolylineColorAppearance} 不使用它，因为使用了完全自定义的片段着色器。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * 当 <code>true</code> 时，几何体预计将呈现为半透明，因此
   * {@link PolylineColorAppearance#renderState} 启用了 alpha 混合。
   *
   * @type {boolean}
   *
   * @default true
   */

  this.translucent = translucent;

  this._vertexShaderSource = defaultValue(
    options.vertexShaderSource,
    defaultVertexShaderSource,
  );
  this._fragmentShaderSource = defaultValue(
    options.fragmentShaderSource,
    defaultFragmentShaderSource,
  );
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._vertexFormat = vertexFormat;
}

Object.defineProperties(PolylineColorAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 片段着色器的 GLSL 源代码。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 渲染状态可以在构造 {@link PolylineColorAppearance} 实例时显式定义，
   * 或通过 {@link PolylineColorAppearance#translucent} 隐式设置。
   * </p>
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 当 <code>true</code> 时，几何图形应闭合，因此
   * {@link PolylineColorAppearance#renderState} 启用了背面剔除。
   * 对于 <code>PolylineColorAppearance</code>，这始终为 <code>false</code>。
   *
   * @memberof PolylineColorAppearance.prototype
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
   * 几何体可以具有更多的顶点属性仍然兼容——但这可能会导致性能损失——
   * 但它不能少于。
   *
   * @memberof PolylineColorAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   *
   * @default {@link PolylineColorAppearance.VERTEX_FORMAT}
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },
});


/**
 * 所有 {@link PolylineColorAppearance} 实例兼容的 {@link VertexFormat}。
 * 这仅要求有一个 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PolylineColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
PolylineColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PolylineColorAppearance#translucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} 如果外观是半透明的则返回 <code>true</code>。
 */

PolylineColorAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建一个渲染状态。 这不是最终的渲染状态实例；相反，
 * 它可以包含与上下文中创建的渲染状态相同的渲染状态属性的子集。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */

PolylineColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PolylineColorAppearance;
