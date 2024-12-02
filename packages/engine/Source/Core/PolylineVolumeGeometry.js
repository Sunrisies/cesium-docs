import arrayRemoveDuplicates from "./arrayRemoveDuplicates.js";
import BoundingRectangle from "./BoundingRectangle.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import ComponentDatatype from "./ComponentDatatype.js";
import CornerType from "./CornerType.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryPipeline from "./GeometryPipeline.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import oneTimeWarning from "./oneTimeWarning.js";
import PolygonPipeline from "./PolygonPipeline.js";
import PolylineVolumeGeometryLibrary from "./PolylineVolumeGeometryLibrary.js";
import PrimitiveType from "./PrimitiveType.js";
import VertexFormat from "./VertexFormat.js";
import WindingOrder from "./WindingOrder.js";

function computeAttributes(
  combinedPositions,
  shape,
  boundingRectangle,
  vertexFormat,
) {
  const attributes = new GeometryAttributes();
  if (vertexFormat.position) {
    attributes.position = new GeometryAttribute({
      componentDatatype: ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: combinedPositions,
    });
  }
  const shapeLength = shape.length;
  const vertexCount = combinedPositions.length / 3;
  const length = (vertexCount - shapeLength * 2) / (shapeLength * 2);
  const firstEndIndices = PolygonPipeline.triangulate(shape);

  const indicesCount =
    (length - 1) * shapeLength * 6 + firstEndIndices.length * 2;
  const indices = IndexDatatype.createTypedArray(vertexCount, indicesCount);
  let i, j;
  let ll, ul, ur, lr;
  const offset = shapeLength * 2;
  let index = 0;
  for (i = 0; i < length - 1; i++) {
    for (j = 0; j < shapeLength - 1; j++) {
      ll = j * 2 + i * shapeLength * 2;
      lr = ll + offset;
      ul = ll + 1;
      ur = ul + offset;

      indices[index++] = ul;
      indices[index++] = ll;
      indices[index++] = ur;
      indices[index++] = ur;
      indices[index++] = ll;
      indices[index++] = lr;
    }
    ll = shapeLength * 2 - 2 + i * shapeLength * 2;
    ul = ll + 1;
    ur = ul + offset;
    lr = ll + offset;

    indices[index++] = ul;
    indices[index++] = ll;
    indices[index++] = ur;
    indices[index++] = ur;
    indices[index++] = ll;
    indices[index++] = lr;
  }

  if (vertexFormat.st || vertexFormat.tangent || vertexFormat.bitangent) {
    // st required for tangent/bitangent calculation
    const st = new Float32Array(vertexCount * 2);
    const lengthSt = 1 / (length - 1);
    const heightSt = 1 / boundingRectangle.height;
    const heightOffset = boundingRectangle.height / 2;
    let s, t;
    let stindex = 0;
    for (i = 0; i < length; i++) {
      s = i * lengthSt;
      t = heightSt * (shape[0].y + heightOffset);
      st[stindex++] = s;
      st[stindex++] = t;
      for (j = 1; j < shapeLength; j++) {
        t = heightSt * (shape[j].y + heightOffset);
        st[stindex++] = s;
        st[stindex++] = t;
        st[stindex++] = s;
        st[stindex++] = t;
      }
      t = heightSt * (shape[0].y + heightOffset);
      st[stindex++] = s;
      st[stindex++] = t;
    }
    for (j = 0; j < shapeLength; j++) {
      s = 0;
      t = heightSt * (shape[j].y + heightOffset);
      st[stindex++] = s;
      st[stindex++] = t;
    }
    for (j = 0; j < shapeLength; j++) {
      s = (length - 1) * lengthSt;
      t = heightSt * (shape[j].y + heightOffset);
      st[stindex++] = s;
      st[stindex++] = t;
    }

    attributes.st = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: new Float32Array(st),
    });
  }

  const endOffset = vertexCount - shapeLength * 2;
  for (i = 0; i < firstEndIndices.length; i += 3) {
    const v0 = firstEndIndices[i] + endOffset;
    const v1 = firstEndIndices[i + 1] + endOffset;
    const v2 = firstEndIndices[i + 2] + endOffset;

    indices[index++] = v0;
    indices[index++] = v1;
    indices[index++] = v2;
    indices[index++] = v2 + shapeLength;
    indices[index++] = v1 + shapeLength;
    indices[index++] = v0 + shapeLength;
  }

  let geometry = new Geometry({
    attributes: attributes,
    indices: indices,
    boundingSphere: BoundingSphere.fromVertices(combinedPositions),
    primitiveType: PrimitiveType.TRIANGLES,
  });

  if (vertexFormat.normal) {
    geometry = GeometryPipeline.computeNormal(geometry);
  }

  if (vertexFormat.tangent || vertexFormat.bitangent) {
    try {
      geometry = GeometryPipeline.computeTangentAndBitangent(geometry);
    } catch (e) {
      oneTimeWarning(
        "polyline-volume-tangent-bitangent",
        "Unable to compute tangents and bitangents for polyline volume geometry",
      );
      //TODO https://github.com/CesiumGS/cesium/issues/3609
    }

    if (!vertexFormat.tangent) {
      geometry.attributes.tangent = undefined;
    }
    if (!vertexFormat.bitangent) {
      geometry.attributes.bitangent = undefined;
    }
    if (!vertexFormat.st) {
      geometry.attributes.st = undefined;
    }
  }

  return geometry;
}

/**
 * 描述一个具有体积的多段线（沿多段线挤出的 2D 形状）。
 *
 * @alias PolylineVolumeGeometry
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3[]} options.polylinePositions 一个 {@link Cartesian3} 位置数组，定义多段线体积的中心。
 * @param {Cartesian2[]} options.shapePositions 一个 {@link Cartesian2} 位置数组，定义沿多段线挤出的形状。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 每个纬度和经度之间的距离（以弧度为单位）。决定缓冲区中的位置数量。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {CornerType} [options.cornerType=CornerType.ROUNDED] 决定角落的样式。
 *
 * @see PolylineVolumeGeometry#createGeometry
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polyline%20Volume.html|Cesium Sandcastle Polyline Volume Demo}
 *
 * @example
 * function computeCircle(radius) {
 *   const positions = [];
 *   for (let i = 0; i < 360; i++) {
 *     const radians = Cesium.Math.toRadians(i);
 *     positions.push(new Cesium.Cartesian2(radius * Math.cos(radians), radius * Math.sin(radians)));
 *   }
 *   return positions;
 * }
 *
 * const volume = new Cesium.PolylineVolumeGeometry({
 *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
 *   polylinePositions : Cesium.Cartesian3.fromDegreesArray([
 *     -72.0, 40.0,
 *     -70.0, 35.0
 *   ]),
 *   shapePositions : computeCircle(100000.0)
 * });
 */
function PolylineVolumeGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const positions = options.polylinePositions;
  const shape = options.shapePositions;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(positions)) {
    throw new DeveloperError("options.polylinePositions is required.");
  }
  if (!defined(shape)) {
    throw new DeveloperError("options.shapePositions is required.");
  }
  //>>includeEnd('debug');

  this._positions = positions;
  this._shape = shape;
  this._ellipsoid = Ellipsoid.clone(
    defaultValue(options.ellipsoid, Ellipsoid.default),
  );
  this._cornerType = defaultValue(options.cornerType, CornerType.ROUNDED);
  this._vertexFormat = VertexFormat.clone(
    defaultValue(options.vertexFormat, VertexFormat.DEFAULT),
  );
  this._granularity = defaultValue(
    options.granularity,
    CesiumMath.RADIANS_PER_DEGREE,
  );
  this._workerName = "createPolylineVolumeGeometry";

  let numComponents = 1 + positions.length * Cartesian3.packedLength;
  numComponents += 1 + shape.length * Cartesian2.packedLength;

  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  this.packedLength =
    numComponents + Ellipsoid.packedLength + VertexFormat.packedLength + 2;
}

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {PolylineVolumeGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
PolylineVolumeGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  let i;

  const positions = value._positions;
  let length = positions.length;
  array[startingIndex++] = length;

  for (i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
    Cartesian3.pack(positions[i], array, startingIndex);
  }

  const shape = value._shape;
  length = shape.length;
  array[startingIndex++] = length;

  for (i = 0; i < length; ++i, startingIndex += Cartesian2.packedLength) {
    Cartesian2.pack(shape[i], array, startingIndex);
  }

  Ellipsoid.pack(value._ellipsoid, array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  VertexFormat.pack(value._vertexFormat, array, startingIndex);
  startingIndex += VertexFormat.packedLength;

  array[startingIndex++] = value._cornerType;
  array[startingIndex] = value._granularity;

  return array;
};

const scratchEllipsoid = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);
const scratchVertexFormat = new VertexFormat();
const scratchOptions = {
  polylinePositions: undefined,
  shapePositions: undefined,
  ellipsoid: scratchEllipsoid,
  vertexFormat: scratchVertexFormat,
  cornerType: undefined,
  granularity: undefined,
};

/**
 * 从打包数组中检索实例.
 *
 * @param {number[]} array 压缩数组.
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
 * @param {PolylineVolumeGeometry} [result] 存储结果的对象.
 * @returns {PolylineVolumeGeometry} 修改后的结果参数或如果未提供结果参数则返回的新 PolylineVolumeGeometry 实例.
 */

PolylineVolumeGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  let i;

  let length = array[startingIndex++];
  const positions = new Array(length);

  for (i = 0; i < length; ++i, startingIndex += Cartesian3.packedLength) {
    positions[i] = Cartesian3.unpack(array, startingIndex);
  }

  length = array[startingIndex++];
  const shape = new Array(length);

  for (i = 0; i < length; ++i, startingIndex += Cartesian2.packedLength) {
    shape[i] = Cartesian2.unpack(array, startingIndex);
  }

  const ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
  startingIndex += Ellipsoid.packedLength;

  const vertexFormat = VertexFormat.unpack(
    array,
    startingIndex,
    scratchVertexFormat,
  );
  startingIndex += VertexFormat.packedLength;

  const cornerType = array[startingIndex++];
  const granularity = array[startingIndex];

  if (!defined(result)) {
    scratchOptions.polylinePositions = positions;
    scratchOptions.shapePositions = shape;
    scratchOptions.cornerType = cornerType;
    scratchOptions.granularity = granularity;
    return new PolylineVolumeGeometry(scratchOptions);
  }

  result._positions = positions;
  result._shape = shape;
  result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
  result._vertexFormat = VertexFormat.clone(vertexFormat, result._vertexFormat);
  result._cornerType = cornerType;
  result._granularity = granularity;

  return result;
};

const brScratch = new BoundingRectangle();

/**
 * 计算具有体积的多段线的几何表示，包括其顶点、索引和包围球。
 *
 * @param {PolylineVolumeGeometry} polylineVolumeGeometry 对多段线体积的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */

PolylineVolumeGeometry.createGeometry = function (polylineVolumeGeometry) {
  const positions = polylineVolumeGeometry._positions;
  const cleanPositions = arrayRemoveDuplicates(
    positions,
    Cartesian3.equalsEpsilon,
  );
  let shape2D = polylineVolumeGeometry._shape;
  shape2D = PolylineVolumeGeometryLibrary.removeDuplicatesFromShape(shape2D);

  if (cleanPositions.length < 2 || shape2D.length < 3) {
    return undefined;
  }

  if (
    PolygonPipeline.computeWindingOrder2D(shape2D) === WindingOrder.CLOCKWISE
  ) {
    shape2D.reverse();
  }
  const boundingRectangle = BoundingRectangle.fromPoints(shape2D, brScratch);

  const computedPositions = PolylineVolumeGeometryLibrary.computePositions(
    cleanPositions,
    shape2D,
    boundingRectangle,
    polylineVolumeGeometry,
    true,
  );
  return computeAttributes(
    computedPositions,
    shape2D,
    boundingRectangle,
    polylineVolumeGeometry._vertexFormat,
  );
};
export default PolylineVolumeGeometry;
