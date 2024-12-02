import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defined from "./defined.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import PrimitiveType from "./PrimitiveType.js";

/**
 * 描述表示一个中心位于原点的平面轮廓的几何体，宽度和长度均为单位长度。
 *
 * @alias PlaneOutlineGeometry
 * @constructor
 *
 */

function PlaneOutlineGeometry() {
  this._workerName = "createPlaneOutlineGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
PlaneOutlineGeometry.packedLength = 0;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {PlaneOutlineGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 *
 * @returns {number[]} 被打包成的数组
 */
PlaneOutlineGeometry.pack = function (value, array) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {PlaneOutlineGeometry} [result] 存储结果的对象。
 * @returns {PlaneOutlineGeometry} 修改后的结果参数或如果未提供，则返回一个新的 PlaneOutlineGeometry 实例。
 */

PlaneOutlineGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new PlaneOutlineGeometry();
  }

  return result;
};

const min = new Cartesian3(-0.5, -0.5, 0.0);
const max = new Cartesian3(0.5, 0.5, 0.0);

/**
 * 计算平面轮廓的几何表示，包括其顶点、索引和包围球。
 *
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */

PlaneOutlineGeometry.createGeometry = function () {
  const attributes = new GeometryAttributes();
  const indices = new Uint16Array(4 * 2);
  const positions = new Float64Array(4 * 3);

  positions[0] = min.x;
  positions[1] = min.y;
  positions[2] = min.z;
  positions[3] = max.x;
  positions[4] = min.y;
  positions[5] = min.z;
  positions[6] = max.x;
  positions[7] = max.y;
  positions[8] = min.z;
  positions[9] = min.x;
  positions[10] = max.y;
  positions[11] = min.z;

  attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions,
  });

  indices[0] = 0;
  indices[1] = 1;
  indices[2] = 1;
  indices[3] = 2;
  indices[4] = 2;
  indices[5] = 3;
  indices[6] = 3;
  indices[7] = 0;

  return new Geometry({
    attributes: attributes,
    indices: indices,
    primitiveType: PrimitiveType.LINES,
    boundingSphere: new BoundingSphere(Cartesian3.ZERO, Math.sqrt(2.0)),
  });
};
export default PlaneOutlineGeometry;
