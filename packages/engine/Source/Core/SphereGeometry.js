import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipsoidGeometry from "./EllipsoidGeometry.js";
import VertexFormat from "./VertexFormat.js";

/**
 * 描述一个以原点为中心的球体。
 *
 * @alias SphereGeometry
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {number} [options.radius=1.0] 球体的半径。
 * @param {number} [options.stackPartitions=64] 将椭球体划分为堆的次数。
 * @param {number} [options.slicePartitions=64] 将椭球体划分为径向切片的次数。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 *
 * @exception {DeveloperError} options.slicePartitions 不能少于三个。
 * @exception {DeveloperError} options.stackPartitions 不能少于三个。
 *
 * @see SphereGeometry#createGeometry
 *
 * @example
 * const sphere = new Cesium.SphereGeometry({
 *   radius : 100.0,
 *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY
 * });
 * const geometry = Cesium.SphereGeometry.createGeometry(sphere);
 */
function SphereGeometry(options) {
  const radius = defaultValue(options.radius, 1.0);
  const radii = new Cartesian3(radius, radius, radius);
  const ellipsoidOptions = {
    radii: radii,
    stackPartitions: options.stackPartitions,
    slicePartitions: options.slicePartitions,
    vertexFormat: options.vertexFormat,
  };

  this._ellipsoidGeometry = new EllipsoidGeometry(ellipsoidOptions);
  this._workerName = "createSphereGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
SphereGeometry.packedLength = EllipsoidGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {SphereGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
SphereGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');

  return EllipsoidGeometry.pack(value._ellipsoidGeometry, array, startingIndex);
};

const scratchEllipsoidGeometry = new EllipsoidGeometry();
const scratchOptions = {
  radius: undefined,
  radii: new Cartesian3(),
  vertexFormat: new VertexFormat(),
  stackPartitions: undefined,
  slicePartitions: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {SphereGeometry} [result] 存储结果的对象。
 * @returns {SphereGeometry} 修改后的结果参数或如果未提供则返回一个新的 SphereGeometry 实例。
 */

SphereGeometry.unpack = function (array, startingIndex, result) {
  const ellipsoidGeometry = EllipsoidGeometry.unpack(
    array,
    startingIndex,
    scratchEllipsoidGeometry,
  );
  scratchOptions.vertexFormat = VertexFormat.clone(
    ellipsoidGeometry._vertexFormat,
    scratchOptions.vertexFormat,
  );
  scratchOptions.stackPartitions = ellipsoidGeometry._stackPartitions;
  scratchOptions.slicePartitions = ellipsoidGeometry._slicePartitions;

  if (!defined(result)) {
    scratchOptions.radius = ellipsoidGeometry._radii.x;
    return new SphereGeometry(scratchOptions);
  }

  Cartesian3.clone(ellipsoidGeometry._radii, scratchOptions.radii);
  result._ellipsoidGeometry = new EllipsoidGeometry(scratchOptions);
  return result;
};

/**
 * 计算球体的几何表示，包括其顶点、索引和包围球。
 *
 * @param {SphereGeometry} sphereGeometry 球体的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */

SphereGeometry.createGeometry = function (sphereGeometry) {
  return EllipsoidGeometry.createGeometry(sphereGeometry._ellipsoidGeometry);
};
export default SphereGeometry;
