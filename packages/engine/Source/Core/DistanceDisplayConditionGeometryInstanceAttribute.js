import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 每个实例几何属性的值和类型信息，用于判断几何实例是否具有距离显示条件。
 *
 * @alias DistanceDisplayConditionGeometryInstanceAttribute
 * @constructor
 *
 * @param {number} [near=0.0] 近距离。
 * @param {number} [far=Number.MAX_VALUE] 远距离。
 *
 * @exception {DeveloperError} far 必须大于 near。
 *
 * @example
 * const instance = new Cesium.GeometryInstance({
 *   geometry : new Cesium.BoxGeometry({
 *     vertexFormat : Cesium.VertexFormat.POSITION_AND_NORMAL,
 *     minimum : new Cesium.Cartesian3(-250000.0, -250000.0, -250000.0),
 *     maximum : new Cesium.Cartesian3(250000.0, 250000.0, 250000.0)
 *   }),
 *   modelMatrix : Cesium.Matrix4.multiplyByTranslation(Cesium.Transforms.eastNorthUpToFixedFrame(
 *     Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883)), new Cesium.Cartesian3(0.0, 0.0, 1000000.0), new Cesium.Matrix4()),
 *   id : 'box',
 *   attributes : {
 *     distanceDisplayCondition : new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(100.0, 10000.0)
 *   }
 * });
 *
 * @see GeometryInstance
 * @see GeometryInstanceAttribute
 */
function DistanceDisplayConditionGeometryInstanceAttribute(near, far) {
  near = defaultValue(near, 0.0);
  far = defaultValue(far, Number.MAX_VALUE);

  //>>includeStart('debug', pragmas.debug);
  if (far <= near) {
    throw new DeveloperError(
      "far distance must be greater than near distance.",
    );
  }
  //>>includeEnd('debug');

  /**
   * 存储在类型化数组中的属性值。
   *
   * @type {Float32Array}
   *
   * @default [0.0, 0.0, Number.MAX_VALUE]
   */

  this.value = new Float32Array([near, far]);
}

Object.defineProperties(
  DistanceDisplayConditionGeometryInstanceAttribute.prototype,
  {
    /**
     * 属性中每个组件的数据类型，例如，
     * {@link DistanceDisplayConditionGeometryInstanceAttribute#value} 中的单独元素。
     *
     * @memberof DistanceDisplayConditionGeometryInstanceAttribute.prototype
     *
     * @type {ComponentDatatype}
     * @readonly
     *
     * @default {@link ComponentDatatype.FLOAT}
     */

    componentDatatype: {
      get: function () {
        return ComponentDatatype.FLOAT;
      },
    },

    /**
     * 属性中的组件数量，即 {@link DistanceDisplayConditionGeometryInstanceAttribute#value}。
     *
     * @memberof DistanceDisplayConditionGeometryInstanceAttribute.prototype
     *
     * @type {number}
     * @readonly
     *
     * @default 3
     */

    componentsPerAttribute: {
      get: function () {
        return 2;
      },
    },

   /**
     * 当 <code>true</code> 且 <code>componentDatatype</code> 是整数格式时，
     * 表示当这些组件以浮点形式用于渲染时，应映射到范围 [0, 1]（无符号）
     * 或 [-1, 1]（有符号）。
     *
     * @memberof DistanceDisplayConditionGeometryInstanceAttribute.prototype
     *
     * @type {boolean}
     * @readonly
     *
     * @default false
     */

    normalize: {
      get: function () {
        return false;
      },
    },
  },
);
/**
 * 根据提供的启用标志和 {@link DistanceDisplayCondition} 创建一个新的 {@link DistanceDisplayConditionGeometryInstanceAttribute} 实例。
 *
 * @param {DistanceDisplayCondition} distanceDisplayCondition 距离显示条件。
 * @returns {DistanceDisplayConditionGeometryInstanceAttribute} 新的 {@link DistanceDisplayConditionGeometryInstanceAttribute} 实例。
 *
 * @exception {DeveloperError} distanceDisplayCondition.far 必须大于 distanceDisplayCondition.near
 *
 * @example
 * const distanceDisplayCondition = new Cesium.DistanceDisplayCondition(100.0, 10000.0);
 * const instance = new Cesium.GeometryInstance({
 *   geometry : geometry,
 *   attributes : {
 *     distanceDisplayCondition : Cesium.DistanceDisplayConditionGeometryInstanceAttribute.fromDistanceDisplayCondition(distanceDisplayCondition)
 *   }
 * });
 */
DistanceDisplayConditionGeometryInstanceAttribute.fromDistanceDisplayCondition =
  function (distanceDisplayCondition) {
    //>>includeStart('debug', pragmas.debug);
    if (!defined(distanceDisplayCondition)) {
      throw new DeveloperError("distanceDisplayCondition is required.");
    }
    if (distanceDisplayCondition.far <= distanceDisplayCondition.near) {
      throw new DeveloperError(
        "distanceDisplayCondition.far distance must be greater than distanceDisplayCondition.near distance.",
      );
    }
    //>>includeEnd('debug');

    return new DistanceDisplayConditionGeometryInstanceAttribute(
      distanceDisplayCondition.near,
      distanceDisplayCondition.far,
    );
  };

/**
 * 将距离显示条件转换为可以用于分配距离显示条件属性的类型化数组。
 *
 * @param {DistanceDisplayCondition} distanceDisplayCondition 距离显示条件值。
 * @param {Float32Array} [result] 用于存储结果的数组，如果未定义，则将创建一个新实例。
 * @returns {Float32Array} 修改后的结果参数，如果 result 未定义，则返回一个新实例。
 *
 * @example
 * const attributes = primitive.getGeometryInstanceAttributes('an id');
 * attributes.distanceDisplayCondition = Cesium.DistanceDisplayConditionGeometryInstanceAttribute.toValue(distanceDisplayCondition, attributes.distanceDisplayCondition);
 */
DistanceDisplayConditionGeometryInstanceAttribute.toValue = function (
  distanceDisplayCondition,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(distanceDisplayCondition)) {
    throw new DeveloperError("distanceDisplayCondition is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Float32Array([
      distanceDisplayCondition.near,
      distanceDisplayCondition.far,
    ]);
  }
  result[0] = distanceDisplayCondition.near;
  result[1] = distanceDisplayCondition.far;
  return result;
};
export default DistanceDisplayConditionGeometryInstanceAttribute;
