import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 每个实例几何属性的值和类型信息。
 *
 * @alias GeometryInstanceAttribute
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {ComponentDatatype} options.componentDatatype 属性中每个组件的数据类型，例如 values 中的单个元素。
 * @param {number} options.componentsPerAttribute 定义属性中组件数量的一个介于 1 和 4 之间的数字。
 * @param {boolean} [options.normalize=false] 当 <code>true</code> 并且 <code>componentDatatype</code> 是整数格式时，指示在以浮点格式访问组件进行渲染时，组件应映射到范围 [0, 1]（无符号）或 [-1, 1]（有符号）。
 * @param {number[]} options.value 属性的值。
 *
 * @exception {DeveloperError} options.componentsPerAttribute 必须介于 1 和 4 之间。
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : Cesium.BoxGeometry.fromDimensions({
 *     dimensions : new Cesium.Cartesian3(1000000.0, 1000000.0, 500000.0)
 *   }),
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(0.0, 0.0)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   id : 'box',
 *   attributes : {
 *     color : new Cesium.GeometryInstanceAttribute({
 *       componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
 *       componentsPerAttribute : 4,
 *       normalize : true,
 *       value : [255, 255, 0, 255]
 *     })
 *   }
 * });
 *
 * @see ColorGeometryInstanceAttribute
 * @see ShowGeometryInstanceAttribute
 * @see DistanceDisplayConditionGeometryInstanceAttribute
 */
function GeometryInstanceAttribute(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.componentDatatype)) {
    throw new DeveloperError("options.componentDatatype is required.");
  }
  if (!defined(options.componentsPerAttribute)) {
    throw new DeveloperError("options.componentsPerAttribute is required.");
  }
  if (
    options.componentsPerAttribute < 1 ||
    options.componentsPerAttribute > 4
  ) {
    throw new DeveloperError(
      "options.componentsPerAttribute must be between 1 and 4.",
    );
  }
  if (!defined(options.value)) {
    throw new DeveloperError("options.value is required.");
  }
  //>>includeEnd('debug');

 /**
   * 属性中每个组件的数据类型，例如，
   * {@link GeometryInstanceAttribute#value} 中的单个元素。
   *
   * @type ComponentDatatype
   *
   */
  this.componentDatatype = options.componentDatatype;

  /**
   * 一个介于 1 和 4 之间的数字，定义属性中组件的数量。
   * 例如，具有 x、y 和 z 组件的位置属性将有 3，如
   * 代码示例所示。
   *
   * @type {number}
   *
   * @example
   * show : new Cesium.GeometryInstanceAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
   *   componentsPerAttribute : 1,
   *   normalize : true,
   *   value : [1.0]
   * })
   */
  this.componentsPerAttribute = options.componentsPerAttribute;

  /**
   * 当 <code>true</code> 并且 <code>componentDatatype</code> 是整数格式时，
   * 表示在以浮点格式访问组件以进行渲染时，
   * 组件应映射到范围 [0, 1]（无符号）或 [-1, 1]（有符号）。
   * <p>
   * 这通常在使用 {@link ComponentDatatype.UNSIGNED_BYTE} 存储颜色时使用。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   *
   * @example
   * attribute.componentDatatype = Cesium.ComponentDatatype.UNSIGNED_BYTE;
   * attribute.componentsPerAttribute = 4;
   * attribute.normalize = true;
   * attribute.value = [
   *   Cesium.Color.floatToByte(color.red),
   *   Cesium.Color.floatToByte(color.green),
   *   Cesium.Color.floatToByte(color.blue),
   *   Cesium.Color.floatToByte(color.alpha)
   * ];
   */
  this.normalize = defaultValue(options.normalize, false);

  /**
   * 存储在类型化数组中的属性值。在代码示例中，
   * <code>values</code> 中的每三个元素定义一个属性，因为
   * <code>componentsPerAttribute</code> 是 3。
   *
   * @type {number[]}
   *
   * @example
   * show : new Cesium.GeometryInstanceAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.UNSIGNED_BYTE,
   *   componentsPerAttribute : 1,
   *   normalize : true,
   *   value : [1.0]
   * })
   */
  this.value = options.value;
}
export default GeometryInstanceAttribute;
