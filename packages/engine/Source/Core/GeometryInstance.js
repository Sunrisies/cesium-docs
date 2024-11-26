import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Matrix4 from "./Matrix4.js";

/**
 * 几何体实例化允许一个 {@link Geometry} 对象在多个
 * 不同位置上实例化并具有独特颜色。例如，一个 {@link BoxGeometry} 可以
 * 被实例化多次，每次使用不同的 <code>modelMatrix</code> 来改变
 * 其位置、旋转和缩放。
 *
 * @alias GeometryInstance
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Geometry|GeometryFactory} options.geometry 要实例化的几何体。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 用于将几何体从模型坐标转换到世界坐标的模型矩阵。
 * @param {object} [options.id] 用户定义的对象，在使用 {@link Scene#pick} 进行选择时返回，或用于获取/设置每个实例的属性与 {@link Primitive#getGeometryInstanceAttributes}。
 * @param {object} [options.attributes] 每个实例的属性，例如下面示例中显示的显示或颜色属性。
 *
 * @example
 * // Create geometry for a box, and two instances that refer to it.
 * // One instance positions the box on the bottom and colored aqua.
 * // The other instance positions the box on the top and color white.
 * const geometry = Cesium.BoxGeometry.fromDimensions({
 *   vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL,
 *   dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
 * });
 * const instanceBottom = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   attributes : {
 *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
 *   },
 *   id : 'bottom'
 * });
 * const instanceTop = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 3000000.0), new Cesium.Matrix4()),
 *   attributes : {
 *     color : Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.AQUA)
 *   },
 *   id : 'top'
 * });
 *
 * @see Geometry
 */
function GeometryInstance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.geometry)) {
    throw new DeveloperError("options.geometry is required.");
  }
  //>>includeEnd('debug');

  /**
   * 正在实例化的几何体。
   *
   * @type Geometry
   *
   */
  this.geometry = options.geometry;

  /**
   * 将几何体从模型坐标转换到世界坐标的 4x4 变换矩阵。
   * 当这是单位矩阵时，几何体在世界坐标中绘制，即地球的 WGS84 坐标。
   * 通过提供不同的变换矩阵，例如 {@link Transforms.eastNorthUpToFixedFrame} 返回的矩阵，可以使用局部参考坐标系。
   *
   * @type Matrix4
   *
   * @default Matrix4.IDENTITY
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );

  /**
   * 用户定义的对象，在实例被选择时返回或用于获取/设置每个实例的属性。
   *
   * @type {object|undefined}
   *
   * @default undefined
   *
   * @see Scene#pick
   * @see Primitive#getGeometryInstanceAttributes
   */

  this.id = options.id;

  /**
   * 用于选择包装几何体实例的图元。
   *
   * @private
   */
  this.pickPrimitive = options.pickPrimitive;

  /**
   * 每个实例的属性，例如 {@link ColorGeometryInstanceAttribute} 或 {@link ShowGeometryInstanceAttribute}。
   * {@link Geometry} 总是每个顶点变化的属性；这些属性对整个实例是常量。
   *
   * @type {object}
   *
   * @default {}
   */

  this.attributes = defaultValue(options.attributes, {});

  /**
   * @private
   */
  this.westHemisphereGeometry = undefined;
  /**
   * @private
   */
  this.eastHemisphereGeometry = undefined;
}
export default GeometryInstance;
