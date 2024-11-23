import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import CylinderGeometryLibrary from "./CylinderGeometryLibrary.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryOffsetAttribute from "./GeometryOffsetAttribute.js";
import IndexDatatype from "./IndexDatatype.js";
import PrimitiveType from "./PrimitiveType.js";

const radiusScratch = new Cartesian2();

/**
 * 圆柱体轮廓的描述。
 *
 * @alias CylinderOutlineGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number} options.length 圆柱体的长度。
 * @param {number} options.topRadius 圆柱体顶部的半径。
 * @param {number} options.bottomRadius 圆柱体底部的半径。
 * @param {number} [options.slices=128] 圆柱体周围的边缘数量。
 * @param {number} [options.numberOfVerticalLines=16] 在圆柱体顶部和底部表面之间绘制的线条数量。
 *
 * @exception {DeveloperError} options.length 必须大于 0。
 * @exception {DeveloperError} options.topRadius 必须大于 0。
 * @exception {DeveloperError} options.bottomRadius 必须大于 0。
 * @exception {DeveloperError} bottomRadius 和 topRadius 不能同时等于 0。
 * @exception {DeveloperError} options.slices 必须大于或等于 3。
 *
 * @see CylinderOutlineGeometry.createGeometry
 *
 * @example
 * // create cylinder geometry
 * const cylinder = new Cesium.CylinderOutlineGeometry({
 *     length: 200000,
 *     topRadius: 80000,
 *     bottomRadius: 200000,
 * });
 * const geometry = Cesium.CylinderOutlineGeometry.createGeometry(cylinder);
 */
function CylinderOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const length = options.length;
  const topRadius = options.topRadius;
  const bottomRadius = options.bottomRadius;
  const slices = defaultValue(options.slices, 128);
  const numberOfVerticalLines = Math.max(
    defaultValue(options.numberOfVerticalLines, 16),
    0,
  );

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.positions", length);
  Check.typeOf.number("options.topRadius", topRadius);
  Check.typeOf.number("options.bottomRadius", bottomRadius);
  Check.typeOf.number.greaterThanOrEquals("options.slices", slices, 3);
  if (
    defined(options.offsetAttribute) &&
    options.offsetAttribute === GeometryOffsetAttribute.TOP
  ) {
    throw new DeveloperError(
      "GeometryOffsetAttribute.TOP is not a supported options.offsetAttribute for this geometry.",
    );
  }
  //>>includeEnd('debug');

  this._length = length;
  this._topRadius = topRadius;
  this._bottomRadius = bottomRadius;
  this._slices = slices;
  this._numberOfVerticalLines = numberOfVerticalLines;
  this._offsetAttribute = options.offsetAttribute;
  this._workerName = "createCylinderOutlineGeometry";
}

/**
 * 将对象打包为数组所用的元素数量。
 * @type {number}
 */

CylinderOutlineGeometry.packedLength = 6;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {CylinderOutlineGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
CylinderOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value._length;
  array[startingIndex++] = value._topRadius;
  array[startingIndex++] = value._bottomRadius;
  array[startingIndex++] = value._slices;
  array[startingIndex++] = value._numberOfVerticalLines;
  array[startingIndex] = defaultValue(value._offsetAttribute, -1);

  return array;
};

const scratchOptions = {
  length: undefined,
  topRadius: undefined,
  bottomRadius: undefined,
  slices: undefined,
  numberOfVerticalLines: undefined,
  offsetAttribute: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {CylinderOutlineGeometry} [result] 存储结果的对象。
 * @returns {CylinderOutlineGeometry} 修改后的结果参数或如果未提供则返回一个新的 CylinderOutlineGeometry 实例。
 */

CylinderOutlineGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const length = array[startingIndex++];
  const topRadius = array[startingIndex++];
  const bottomRadius = array[startingIndex++];
  const slices = array[startingIndex++];
  const numberOfVerticalLines = array[startingIndex++];
  const offsetAttribute = array[startingIndex];

  if (!defined(result)) {
    scratchOptions.length = length;
    scratchOptions.topRadius = topRadius;
    scratchOptions.bottomRadius = bottomRadius;
    scratchOptions.slices = slices;
    scratchOptions.numberOfVerticalLines = numberOfVerticalLines;
    scratchOptions.offsetAttribute =
      offsetAttribute === -1 ? undefined : offsetAttribute;
    return new CylinderOutlineGeometry(scratchOptions);
  }

  result._length = length;
  result._topRadius = topRadius;
  result._bottomRadius = bottomRadius;
  result._slices = slices;
  result._numberOfVerticalLines = numberOfVerticalLines;
  result._offsetAttribute =
    offsetAttribute === -1 ? undefined : offsetAttribute;

  return result;
};

/**
 * 计算圆柱体轮廓的几何表示，包括其顶点、索引和边界球。
 *
 * @param {CylinderOutlineGeometry} cylinderGeometry 圆柱体轮廓的描述。
 * @returns {Geometry|undefined} 计算出的顶点和索引。
 */

CylinderOutlineGeometry.createGeometry = function (cylinderGeometry) {
  let length = cylinderGeometry._length;
  const topRadius = cylinderGeometry._topRadius;
  const bottomRadius = cylinderGeometry._bottomRadius;
  const slices = cylinderGeometry._slices;
  const numberOfVerticalLines = cylinderGeometry._numberOfVerticalLines;

  if (
    length <= 0 ||
    topRadius < 0 ||
    bottomRadius < 0 ||
    (topRadius === 0 && bottomRadius === 0)
  ) {
    return;
  }

  const numVertices = slices * 2;

  const positions = CylinderGeometryLibrary.computePositions(
    length,
    topRadius,
    bottomRadius,
    slices,
    false,
  );
  let numIndices = slices * 2;
  let numSide;
  if (numberOfVerticalLines > 0) {
    const numSideLines = Math.min(numberOfVerticalLines, slices);
    numSide = Math.round(slices / numSideLines);
    numIndices += numSideLines;
  }

  const indices = IndexDatatype.createTypedArray(numVertices, numIndices * 2);
  let index = 0;
  let i;
  for (i = 0; i < slices - 1; i++) {
    indices[index++] = i;
    indices[index++] = i + 1;
    indices[index++] = i + slices;
    indices[index++] = i + 1 + slices;
  }

  indices[index++] = slices - 1;
  indices[index++] = 0;
  indices[index++] = slices + slices - 1;
  indices[index++] = slices;

  if (numberOfVerticalLines > 0) {
    for (i = 0; i < slices; i += numSide) {
      indices[index++] = i;
      indices[index++] = i + slices;
    }
  }

  const attributes = new GeometryAttributes();
  attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions,
  });

  radiusScratch.x = length * 0.5;
  radiusScratch.y = Math.max(bottomRadius, topRadius);

  const boundingSphere = new BoundingSphere(
    Cartesian3.ZERO,
    Cartesian2.magnitude(radiusScratch),
  );

  if (defined(cylinderGeometry._offsetAttribute)) {
    length = positions.length;
    const offsetValue =
      cylinderGeometry._offsetAttribute === GeometryOffsetAttribute.NONE
        ? 0
        : 1;
    const applyOffset = new Uint8Array(length / 3).fill(offsetValue);
    attributes.applyOffset = new GeometryAttribute({
      componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
      componentsPerAttribute: 1,
      values: applyOffset,
    });
  }

  return new Geometry({
    attributes: attributes,
    indices: indices,
    primitiveType: PrimitiveType.LINES,
    boundingSphere: boundingSphere,
    offsetAttribute: cylinderGeometry._offsetAttribute,
  });
};
export default CylinderOutlineGeometry;
