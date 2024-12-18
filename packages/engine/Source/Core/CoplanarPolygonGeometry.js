import arrayRemoveDuplicates from "./arrayRemoveDuplicates.js";
import BoundingRectangle from "./BoundingRectangle.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import CoplanarPolygonGeometryLibrary from "./CoplanarPolygonGeometryLibrary.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryInstance from "./GeometryInstance.js";
import GeometryPipeline from "./GeometryPipeline.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import PolygonGeometryLibrary from "./PolygonGeometryLibrary.js";
import PolygonPipeline from "./PolygonPipeline.js";
import PrimitiveType from "./PrimitiveType.js";
import Quaternion from "./Quaternion.js";
import VertexFormat from "./VertexFormat.js";

const scratchPosition = new Cartesian3();
const scratchBR = new BoundingRectangle();
const stScratch = new Cartesian2();
const textureCoordinatesOrigin = new Cartesian2();
const scratchNormal = new Cartesian3();
const scratchTangent = new Cartesian3();
const scratchBitangent = new Cartesian3();
const centerScratch = new Cartesian3();
const axis1Scratch = new Cartesian3();
const axis2Scratch = new Cartesian3();
const quaternionScratch = new Quaternion();
const textureMatrixScratch = new Matrix3();
const tangentRotationScratch = new Matrix3();
const surfaceNormalScratch = new Cartesian3();

function createGeometryFromPolygon(
  polygon,
  vertexFormat,
  boundingRectangle,
  stRotation,
  hardcodedTextureCoordinates,
  projectPointTo2D,
  normal,
  tangent,
  bitangent,
) {
  const positions = polygon.positions;
  let indices = PolygonPipeline.triangulate(polygon.positions2D, polygon.holes);

  /* If polygon is completely unrenderable, just use the first three vertices */
  if (indices.length < 3) {
    indices = [0, 1, 2];
  }

  const newIndices = IndexDatatype.createTypedArray(
    positions.length,
    indices.length,
  );
  newIndices.set(indices);

  let textureMatrix = textureMatrixScratch;
  if (stRotation !== 0.0) {
    let rotation = Quaternion.fromAxisAngle(
      normal,
      stRotation,
      quaternionScratch,
    );
    textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrix);

    if (vertexFormat.tangent || vertexFormat.bitangent) {
      rotation = Quaternion.fromAxisAngle(
        normal,
        -stRotation,
        quaternionScratch,
      );
      const tangentRotation = Matrix3.fromQuaternion(
        rotation,
        tangentRotationScratch,
      );

      tangent = Cartesian3.normalize(
        Matrix3.multiplyByVector(tangentRotation, tangent, tangent),
        tangent,
      );
      if (vertexFormat.bitangent) {
        bitangent = Cartesian3.normalize(
          Cartesian3.cross(normal, tangent, bitangent),
          bitangent,
        );
      }
    }
  } else {
    textureMatrix = Matrix3.clone(Matrix3.IDENTITY, textureMatrix);
  }

  const stOrigin = textureCoordinatesOrigin;
  if (vertexFormat.st) {
    stOrigin.x = boundingRectangle.x;
    stOrigin.y = boundingRectangle.y;
  }

  const length = positions.length;
  const size = length * 3;
  const flatPositions = new Float64Array(size);
  const normals = vertexFormat.normal ? new Float32Array(size) : undefined;
  const tangents = vertexFormat.tangent ? new Float32Array(size) : undefined;
  const bitangents = vertexFormat.bitangent
    ? new Float32Array(size)
    : undefined;
  const textureCoordinates = vertexFormat.st
    ? new Float32Array(length * 2)
    : undefined;

  let positionIndex = 0;
  let normalIndex = 0;
  let bitangentIndex = 0;
  let tangentIndex = 0;
  let stIndex = 0;

  for (let i = 0; i < length; i++) {
    const position = positions[i];
    flatPositions[positionIndex++] = position.x;
    flatPositions[positionIndex++] = position.y;
    flatPositions[positionIndex++] = position.z;

    if (vertexFormat.st) {
      if (
        defined(hardcodedTextureCoordinates) &&
        hardcodedTextureCoordinates.positions.length === length
      ) {
        textureCoordinates[stIndex++] =
          hardcodedTextureCoordinates.positions[i].x;
        textureCoordinates[stIndex++] =
          hardcodedTextureCoordinates.positions[i].y;
      } else {
        const p = Matrix3.multiplyByVector(
          textureMatrix,
          position,
          scratchPosition,
        );
        const st = projectPointTo2D(p, stScratch);
        Cartesian2.subtract(st, stOrigin, st);

        const stx = CesiumMath.clamp(st.x / boundingRectangle.width, 0, 1);
        const sty = CesiumMath.clamp(st.y / boundingRectangle.height, 0, 1);
        textureCoordinates[stIndex++] = stx;
        textureCoordinates[stIndex++] = sty;
      }
    }

    if (vertexFormat.normal) {
      normals[normalIndex++] = normal.x;
      normals[normalIndex++] = normal.y;
      normals[normalIndex++] = normal.z;
    }

    if (vertexFormat.tangent) {
      tangents[tangentIndex++] = tangent.x;
      tangents[tangentIndex++] = tangent.y;
      tangents[tangentIndex++] = tangent.z;
    }

    if (vertexFormat.bitangent) {
      bitangents[bitangentIndex++] = bitangent.x;
      bitangents[bitangentIndex++] = bitangent.y;
      bitangents[bitangentIndex++] = bitangent.z;
    }
  }

  const attributes = new GeometryAttributes();

  if (vertexFormat.position) {
    attributes.position = new GeometryAttribute({
      componentDatatype: ComponentDatatype.DOUBLE,
      componentsPerAttribute: 3,
      values: flatPositions,
    });
  }

  if (vertexFormat.normal) {
    attributes.normal = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: normals,
    });
  }

  if (vertexFormat.tangent) {
    attributes.tangent = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: tangents,
    });
  }

  if (vertexFormat.bitangent) {
    attributes.bitangent = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 3,
      values: bitangents,
    });
  }

  if (vertexFormat.st) {
    attributes.st = new GeometryAttribute({
      componentDatatype: ComponentDatatype.FLOAT,
      componentsPerAttribute: 2,
      values: textureCoordinates,
    });
  }

  return new Geometry({
    attributes: attributes,
    indices: newIndices,
    primitiveType: PrimitiveType.TRIANGLES,
  });
}

/**
 * 由任意共面位置组成的多边形的描述。
 *
 * @alias CoplanarPolygonGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {PolygonHierarchy} options.polygonHierarchy 一个可以包含孔的多边形层次结构。
 * @param {number} [options.stRotation=0.0] 纹理坐标的旋转，以弧度为单位。正旋转为逆时针方向。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {PolygonHierarchy} [options.textureCoordinates] 作为 {@link PolygonHierarchy} 的纹理坐标，包含 {@link Cartesian2} 点。
 *
 * @example
 * const polygonGeometry = new Cesium.CoplanarPolygonGeometry({
 *  polygonHierarchy: new Cesium.PolygonHierarchy(
 *     Cesium.Cartesian3.fromDegreesArrayHeights([
 *      -90.0, 30.0, 0.0,
 *      -90.0, 30.0, 300000.0,
 *      -80.0, 30.0, 300000.0,
 *      -80.0, 30.0, 0.0
 *   ]))
 * });
 *
 */
function CoplanarPolygonGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const polygonHierarchy = options.polygonHierarchy;
  const textureCoordinates = options.textureCoordinates;
  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.polygonHierarchy", polygonHierarchy);
  //>>includeEnd('debug');

  const vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);
  this._vertexFormat = VertexFormat.clone(vertexFormat);
  this._polygonHierarchy = polygonHierarchy;
  this._stRotation = defaultValue(options.stRotation, 0.0);
  this._ellipsoid = Ellipsoid.clone(
    defaultValue(options.ellipsoid, Ellipsoid.default),
  );
  this._workerName = "createCoplanarPolygonGeometry";
  this._textureCoordinates = textureCoordinates;

  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */

  this.packedLength =
    PolygonGeometryLibrary.computeHierarchyPackedLength(
      polygonHierarchy,
      Cartesian3,
    ) +
    VertexFormat.packedLength +
    Ellipsoid.packedLength +
    (defined(textureCoordinates)
      ? PolygonGeometryLibrary.computeHierarchyPackedLength(
          textureCoordinates,
          Cartesian2,
        )
      : 1) +
    2;
}

/**
 * 从一组位置描述一个共面的多边形。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3[]} options.positions 定义多边形角点的坐标数组。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {number} [options.stRotation=0.0] 纹理坐标的旋转，以弧度为单位。正旋转为逆时针方向。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {PolygonHierarchy} [options.textureCoordinates] 作为 {@link PolygonHierarchy} 的纹理坐标，包含 {@link Cartesian2} 点。
 * @returns {CoplanarPolygonGeometry}
 *
 * @example
 * // create a polygon from points
 * const polygon = Cesium.CoplanarPolygonGeometry.fromPositions({
 *   positions : Cesium.Cartesian3.fromDegreesArray([
 *     -72.0, 40.0,
 *     -70.0, 35.0,
 *     -75.0, 30.0,
 *     -70.0, 30.0,
 *     -68.0, 40.0
 *   ])
 * });
 * const geometry = Cesium.PolygonGeometry.createGeometry(polygon);
 *
 * @see PolygonGeometry#createGeometry
 */
CoplanarPolygonGeometry.fromPositions = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.positions", options.positions);
  //>>includeEnd('debug');

  const newOptions = {
    polygonHierarchy: {
      positions: options.positions,
    },
    vertexFormat: options.vertexFormat,
    stRotation: options.stRotation,
    ellipsoid: options.ellipsoid,
    textureCoordinates: options.textureCoordinates,
  };
  return new CoplanarPolygonGeometry(newOptions);
};

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {CoplanarPolygonGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
CoplanarPolygonGeometry.pack = function (value, array, startingIndex) {
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

  Ellipsoid.pack(value._ellipsoid, array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  VertexFormat.pack(value._vertexFormat, array, startingIndex);
  startingIndex += VertexFormat.packedLength;

  array[startingIndex++] = value._stRotation;
  if (defined(value._textureCoordinates)) {
    startingIndex = PolygonGeometryLibrary.packPolygonHierarchy(
      value._textureCoordinates,
      array,
      startingIndex,
      Cartesian2,
    );
  } else {
    array[startingIndex++] = -1.0;
  }
  array[startingIndex++] = value.packedLength;

  return array;
};

const scratchEllipsoid = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);
const scratchVertexFormat = new VertexFormat();
const scratchOptions = {
  polygonHierarchy: {},
};
/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {CoplanarPolygonGeometry} [result] 存储结果的对象。
 * @returns {CoplanarPolygonGeometry} 修改后的结果参数，若未提供则返回一个新的 CoplanarPolygonGeometry 实例。
 */

CoplanarPolygonGeometry.unpack = function (array, startingIndex, result) {
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

  const ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
  startingIndex += Ellipsoid.packedLength;

  const vertexFormat = VertexFormat.unpack(
    array,
    startingIndex,
    scratchVertexFormat,
  );
  startingIndex += VertexFormat.packedLength;

  const stRotation = array[startingIndex++];
  const textureCoordinates =
    array[startingIndex] === -1.0
      ? undefined
      : PolygonGeometryLibrary.unpackPolygonHierarchy(
          array,
          startingIndex,
          Cartesian2,
        );
  if (defined(textureCoordinates)) {
    startingIndex = textureCoordinates.startingIndex;
    delete textureCoordinates.startingIndex;
  } else {
    startingIndex++;
  }
  const packedLength = array[startingIndex++];

  if (!defined(result)) {
    result = new CoplanarPolygonGeometry(scratchOptions);
  }

  result._polygonHierarchy = polygonHierarchy;
  result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
  result._vertexFormat = VertexFormat.clone(vertexFormat, result._vertexFormat);
  result._stRotation = stRotation;
  result._textureCoordinates = textureCoordinates;
  result.packedLength = packedLength;

  return result;
};

/**
 * 计算任意共面多边形的几何表示，包括其顶点、索引和包围球。
 *
 * @param {CoplanarPolygonGeometry} polygonGeometry 多边形的描述。
 * @returns {Geometry|undefined} 计算出的顶点和索引。
 */

CoplanarPolygonGeometry.createGeometry = function (polygonGeometry) {
  const vertexFormat = polygonGeometry._vertexFormat;
  const polygonHierarchy = polygonGeometry._polygonHierarchy;
  const stRotation = polygonGeometry._stRotation;
  const textureCoordinates = polygonGeometry._textureCoordinates;
  const hasTextureCoordinates = defined(textureCoordinates);

  let outerPositions = polygonHierarchy.positions;
  outerPositions = arrayRemoveDuplicates(
    outerPositions,
    Cartesian3.equalsEpsilon,
    true,
  );
  if (outerPositions.length < 3) {
    return;
  }

  let normal = scratchNormal;
  let tangent = scratchTangent;
  let bitangent = scratchBitangent;
  let axis1 = axis1Scratch;
  const axis2 = axis2Scratch;

  const validGeometry =
    CoplanarPolygonGeometryLibrary.computeProjectTo2DArguments(
      outerPositions,
      centerScratch,
      axis1,
      axis2,
    );
  if (!validGeometry) {
    return undefined;
  }

  normal = Cartesian3.cross(axis1, axis2, normal);
  normal = Cartesian3.normalize(normal, normal);

  if (
    !Cartesian3.equalsEpsilon(
      centerScratch,
      Cartesian3.ZERO,
      CesiumMath.EPSILON6,
    )
  ) {
    const surfaceNormal = polygonGeometry._ellipsoid.geodeticSurfaceNormal(
      centerScratch,
      surfaceNormalScratch,
    );
    if (Cartesian3.dot(normal, surfaceNormal) < 0) {
      normal = Cartesian3.negate(normal, normal);
      axis1 = Cartesian3.negate(axis1, axis1);
    }
  }

  const projectPoints =
    CoplanarPolygonGeometryLibrary.createProjectPointsTo2DFunction(
      centerScratch,
      axis1,
      axis2,
    );
  const projectPoint =
    CoplanarPolygonGeometryLibrary.createProjectPointTo2DFunction(
      centerScratch,
      axis1,
      axis2,
    );

  if (vertexFormat.tangent) {
    tangent = Cartesian3.clone(axis1, tangent);
  }
  if (vertexFormat.bitangent) {
    bitangent = Cartesian3.clone(axis2, bitangent);
  }

  const results = PolygonGeometryLibrary.polygonsFromHierarchy(
    polygonHierarchy,
    hasTextureCoordinates,
    projectPoints,
    false,
  );
  const hierarchy = results.hierarchy;
  const polygons = results.polygons;

  const dummyFunction = function (identity) {
    return identity;
  };

  const textureCoordinatePolygons = hasTextureCoordinates
    ? PolygonGeometryLibrary.polygonsFromHierarchy(
        textureCoordinates,
        true,
        dummyFunction,
        false,
      ).polygons
    : undefined;

  if (hierarchy.length === 0) {
    return;
  }
  outerPositions = hierarchy[0].outerRing;

  const boundingSphere = BoundingSphere.fromPoints(outerPositions);
  const boundingRectangle = PolygonGeometryLibrary.computeBoundingRectangle(
    normal,
    projectPoint,
    outerPositions,
    stRotation,
    scratchBR,
  );

  const geometries = [];
  for (let i = 0; i < polygons.length; i++) {
    const geometryInstance = new GeometryInstance({
      geometry: createGeometryFromPolygon(
        polygons[i],
        vertexFormat,
        boundingRectangle,
        stRotation,
        hasTextureCoordinates ? textureCoordinatePolygons[i] : undefined,
        projectPoint,
        normal,
        tangent,
        bitangent,
      ),
    });

    geometries.push(geometryInstance);
  }

  const geometry = GeometryPipeline.combineInstances(geometries)[0];
  geometry.attributes.position.values = new Float64Array(
    geometry.attributes.position.values,
  );
  geometry.indices = IndexDatatype.createTypedArray(
    geometry.attributes.position.values.length / 3,
    geometry.indices,
  );

  const attributes = geometry.attributes;
  if (!vertexFormat.position) {
    delete attributes.position;
  }
  return new Geometry({
    attributes: attributes,
    indices: geometry.indices,
    primitiveType: geometry.primitiveType,
    boundingSphere: boundingSphere,
  });
};
export default CoplanarPolygonGeometry;
