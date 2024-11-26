import arrayRemoveDuplicates from "./arrayRemoveDuplicates.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import CoplanarPolygonGeometryLibrary from "./CoplanarPolygonGeometryLibrary.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryInstance from "./GeometryInstance.js";
import GeometryPipeline from "./GeometryPipeline.js";
import IndexDatatype from "./IndexDatatype.js";
import PolygonGeometryLibrary from "./PolygonGeometryLibrary.js";
import PrimitiveType from "./PrimitiveType.js";

function createGeometryFromPositions(positions) {
  const length = positions.length;
  const flatPositions = new Float64Array(length * 3);
  const indices = IndexDatatype.createTypedArray(length, length * 2);

  let positionIndex = 0;
  let index = 0;

  for (let i = 0; i < length; i++) {
    const position = positions[i];
    flatPositions[positionIndex++] = position.x;
    flatPositions[positionIndex++] = position.y;
    flatPositions[positionIndex++] = position.z;

    indices[index++] = i;
    indices[index++] = (i + 1) % length;
  }

  const attributes = new GeometryAttributes({
    position: new GeometryAttribute({
      componentDatatype: ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: flatPositions,
    }),
  });

  return new Geometry({
    attributes: attributes,
    indices: indices,
    primitiveType: PrimitiveType.LINES,
  });
}

/**
 * 描述由任意共面位置组成的多边形轮廓。
 *
 * @alias CoplanarPolygonOutlineGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {PolygonHierarchy} options.polygonHierarchy 一个可以包含孔的多边形层次结构。
 *
 * @see CoplanarPolygonOutlineGeometry.createGeometry
 *
 * @example
 * const polygonOutline = new Cesium.CoplanarPolygonOutlineGeometry({
 *   positions : Cesium.Cartesian3.fromDegreesArrayHeights([
 *      -90.0, 30.0, 0.0,
 *      -90.0, 30.0, 1000.0,
 *      -80.0, 30.0, 1000.0,
 *      -80.0, 30.0, 0.0
 *   ])
 * });
 * const geometry = Cesium.CoplanarPolygonOutlineGeometry.createGeometry(polygonOutline);
 */
function CoplanarPolygonOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const polygonHierarchy = options.polygonHierarchy;
  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.polygonHierarchy", polygonHierarchy);
  //>>includeEnd('debug');

  this._polygonHierarchy = polygonHierarchy;
  this._workerName = "createCoplanarPolygonOutlineGeometry";

  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  this.packedLength =
    PolygonGeometryLibrary.computeHierarchyPackedLength(
      polygonHierarchy,
      Cartesian3,
    ) + 1;
}

/**
 * 从一组位置描述一个共面多边形的轮廓。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3[]} options.positions 定义多边形角点的坐标数组。
 * @returns {CoplanarPolygonOutlineGeometry}
 */

CoplanarPolygonOutlineGeometry.fromPositions = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.positions", options.positions);
  //>>includeEnd('debug');

  const newOptions = {
    polygonHierarchy: {
      positions: options.positions,
    },
  };
  return new CoplanarPolygonOutlineGeometry(newOptions);
};

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {CoplanarPolygonOutlineGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
CoplanarPolygonOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  startingIndex = PolygonGeometryLibrary.packPolygonHierarchy(
    value._polygonHierarchy,
    array,
    startingIndex,
    Cartesian3,
  );

  array[startingIndex] = value.packedLength;

  return array;
};

const scratchOptions = {
  polygonHierarchy: {},
};
/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {CoplanarPolygonOutlineGeometry} [result] 存储结果的对象。
 * @returns {CoplanarPolygonOutlineGeometry} 修改后的结果参数，若未提供则返回一个新的 CoplanarPolygonOutlineGeometry 实例。
 */

CoplanarPolygonOutlineGeometry.unpack = function (
  array,
  startingIndex,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const polygonHierarchy = PolygonGeometryLibrary.unpackPolygonHierarchy(
    array,
    startingIndex,
    Cartesian3,
  );
  startingIndex = polygonHierarchy.startingIndex;
  delete polygonHierarchy.startingIndex;
  const packedLength = array[startingIndex];

  if (!defined(result)) {
    result = new CoplanarPolygonOutlineGeometry(scratchOptions);
  }

  result._polygonHierarchy = polygonHierarchy;
  result.packedLength = packedLength;

  return result;
};

/**
 * 计算任意共面多边形的几何表示，包括其顶点、索引和包围球。
 *
 * @param {CoplanarPolygonOutlineGeometry} polygonGeometry 多边形的描述。
 * @returns {Geometry|undefined} 计算出的顶点和索引。
 */

CoplanarPolygonOutlineGeometry.createGeometry = function (polygonGeometry) {
  const polygonHierarchy = polygonGeometry._polygonHierarchy;

  let outerPositions = polygonHierarchy.positions;
  outerPositions = arrayRemoveDuplicates(
    outerPositions,
    Cartesian3.equalsEpsilon,
    true,
  );
  if (outerPositions.length < 3) {
    return;
  }
  const isValid = CoplanarPolygonGeometryLibrary.validOutline(outerPositions);
  if (!isValid) {
    return undefined;
  }

  const polygons = PolygonGeometryLibrary.polygonOutlinesFromHierarchy(
    polygonHierarchy,
    false,
  );

  if (polygons.length === 0) {
    return undefined;
  }

  const geometries = [];

  for (let i = 0; i < polygons.length; i++) {
    const geometryInstance = new GeometryInstance({
      geometry: createGeometryFromPositions(polygons[i]),
    });
    geometries.push(geometryInstance);
  }

  const geometry = GeometryPipeline.combineInstances(geometries)[0];
  const boundingSphere = BoundingSphere.fromPoints(polygonHierarchy.positions);

  return new Geometry({
    attributes: geometry.attributes,
    indices: geometry.indices,
    primitiveType: geometry.primitiveType,
    boundingSphere: boundingSphere,
  });
};
export default CoplanarPolygonOutlineGeometry;
