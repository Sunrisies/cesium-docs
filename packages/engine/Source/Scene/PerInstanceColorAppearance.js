import defaultValue from "../Core/defaultValue.js";
import VertexFormat from "../Core/VertexFormat.js";
import PerInstanceColorAppearanceFS from "../Shaders/Appearances/PerInstanceColorAppearanceFS.js";
import PerInstanceColorAppearanceVS from "../Shaders/Appearances/PerInstanceColorAppearanceVS.js";
import PerInstanceFlatColorAppearanceFS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceFS.js";
import PerInstanceFlatColorAppearanceVS from "../Shaders/Appearances/PerInstanceFlatColorAppearanceVS.js";
import Appearance from "./Appearance.js";

/**
 * 为具有颜色属性的 {@link GeometryInstance} 实例提供外观。
 * 这允许多个几何实例，每个实例具有不同的颜色，可以
 * 使用相同的 {@link Primitive} 进行绘制，如下例中的第二个例子所示。
 *
 * @alias PerInstanceColorAppearance
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.flat=false] 当 <code>true</code> 时，使用平面着色器，这意味着光照不会被考虑在内。
 * @param {boolean} [options.faceForward=!options.closed] 当 <code>true</code> 时，片段着色器根据需要翻转表面法线，以确保法线面向观察者，以避免黑暗点。 这在几何体的两个面都应进行着色时很有用，例如 {@link WallGeometry}。
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预计将呈现为半透明，因此 {@link PerInstanceColorAppearance#renderState} 启用了 alpha 混合。
 * @param {boolean} [options.closed=false] 当 <code>true</code> 时，几何体应闭合，因此 {@link PerInstanceColorAppearance#renderState} 启用了背面剔除。
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认的顶点着色器。
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认的片段着色器。
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认的渲染状态。
 *
 * @example
 * // A solid white line segment
 * const primitive = new Cesium.Primitive({
 *   geometryInstances : new Cesium.GeometryInstance({
 *     geometry : new Cesium.SimplePolylineGeometry({
 *       positions : Cesium.Cartesian3.fromDegreesArray([
 *         0.0, 0.0,
 *         5.0, 0.0
 *       ])
 *     }),
 *     attributes : {
 *       color : Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(1.0, 1.0, 1.0, 1.0))
 *     }
 *   }),
 *   appearance : new Cesium.PerInstanceColorAppearance({
 *     flat : true,
 *     translucent : false
 *   })
 * });
 *
 * // Two rectangles in a primitive, each with a different color
 * const instance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(0.0, 20.0, 10.0, 30.0)
 *   }),
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 0.5)
 *   }
 * });
 *
 * const anotherInstance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.RectangleGeometry({
 *     rectangle : Cesium.Rectangle.fromDegrees(0.0, 40.0, 10.0, 50.0)
 *   }),
 *   attributes : {
 *     color : new Cesium.ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 0.5)
 *   }
 * });
 *
 * const rectanglePrimitive = new Cesium.Primitive({
 *   geometryInstances : [instance, anotherInstance],
 *   appearance : new Cesium.PerInstanceColorAppearance()
 * });
 */
function PerInstanceColorAppearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const translucent = defaultValue(options.translucent, true);
  const closed = defaultValue(options.closed, false);
  const flat = defaultValue(options.flat, false);
  const vs = flat
    ? PerInstanceFlatColorAppearanceVS
    : PerInstanceColorAppearanceVS;
  const fs = flat
    ? PerInstanceFlatColorAppearanceFS
    : PerInstanceColorAppearanceFS;
  const vertexFormat = flat
    ? PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
    : PerInstanceColorAppearance.VERTEX_FORMAT;

  /**
   * 该属性是 {@link Appearance} 接口的一部分，但 {@link PerInstanceColorAppearance} 不使用它，因为使用了完全自定义的片段着色器。
   *
   * @type Material
   *
   * @default undefined
   */
  this.material = undefined;

  /**
   * 当 <code>true</code> 时，几何体预计将呈现为半透明，因此
   * {@link PerInstanceColorAppearance#renderState} 启用了 alpha 混合。
   *
   * @type {boolean}
   *
   * @default true
   */

  this.translucent = translucent;

  this._vertexShaderSource = defaultValue(options.vertexShaderSource, vs);
  this._fragmentShaderSource = defaultValue(options.fragmentShaderSource, fs);
  this._renderState = Appearance.getDefaultRenderState(
    translucent,
    closed,
    options.renderState,
  );
  this._closed = closed;

  // Non-derived members

  this._vertexFormat = vertexFormat;
  this._flat = flat;
  this._faceForward = defaultValue(options.faceForward, !closed);
}

Object.defineProperties(PerInstanceColorAppearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * @memberof PerInstanceColorAppearance.prototype
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
   * 渲染状态可以在构造 {@link PerInstanceColorAppearance} 实例时显式定义，
   * 或者通过 {@link PerInstanceColorAppearance#translucent} 和
   * {@link PerInstanceColorAppearance#closed} 隐式设置。
   * </p>
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * {@link PerInstanceColorAppearance#renderState} 启用了背面剔除。
   * 如果观察者进入该几何体，它将不可见。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * 几何体可以具有更多的顶点属性并仍然兼容——但这可能会导致性能损失——
   * 但它不能少于。
   *
   * @memberof PerInstanceColorAppearance.prototype
   *
   * @type VertexFormat
   * @readonly
   */
  vertexFormat: {
    get: function () {
      return this._vertexFormat;
    },
  },

  /**
   * 当 <code>true</code> 时，在片段着色器中使用平面着色，
   * 这意味着不考虑光照。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
   * 以确保法线面向观察者以避免黑暗点。 
   * 这在几何体的两个面都应进行着色时很有用，比如 {@link WallGeometry}。
   *
   * @memberof PerInstanceColorAppearance.prototype
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
 * 所有 {@link PerInstanceColorAppearance} 实例兼容的 {@link VertexFormat}。
 * 这仅要求有 <code>position</code> 和 <code>normal</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */
PerInstanceColorAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_NORMAL;

/**
 * 所有 {@link PerInstanceColorAppearance} 实例兼容的 {@link VertexFormat}，
 * 当 {@link PerInstanceColorAppearance#flat} 为 <code>true</code> 时。
 * 这仅要求有一个 <code>position</code> 属性。
 *
 * @type VertexFormat
 *
 * @constant
 */

PerInstanceColorAppearance.FLAT_VERTEX_FORMAT = VertexFormat.POSITION_ONLY;

/**
 * 以程序方式创建完整的 GLSL 片段着色器源。对于 {@link PerInstanceColorAppearance}，
 * 这源自 {@link PerInstanceColorAppearance#fragmentShaderSource}、{@link PerInstanceColorAppearance#flat}、
 * 和 {@link PerInstanceColorAppearance#faceForward}。
 *
 * @function
 *
 * @returns {string} 完整的 GLSL 片段着色器源。
 */
PerInstanceColorAppearance.prototype.getFragmentShaderSource =
  Appearance.prototype.getFragmentShaderSource;

/**
 * 根据 {@link PerInstanceColorAppearance#translucent} 确定几何体是否为半透明。
 *
 * @function
 *
 * @returns {boolean} <code>true</code> 如果外观是半透明的。
 */
PerInstanceColorAppearance.prototype.isTranslucent =
  Appearance.prototype.isTranslucent;

/**
 * 创建渲染状态。这不是最终的渲染状态实例；相反，
 * 它可以包含一组与上下文中创建的渲染状态相同的渲染状态属性的子集。
 *
 * @function
 *
 * @returns {object} 渲染状态。
 */

PerInstanceColorAppearance.prototype.getRenderState =
  Appearance.prototype.getRenderState;
export default PerInstanceColorAppearance;
