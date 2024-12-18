import ArcType from "./ArcType.js";
import BoundingRectangle from "./BoundingRectangle.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import EllipsoidTangentPlane from "./EllipsoidTangentPlane.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryInstance from "./GeometryInstance.js";
import GeometryOffsetAttribute from "./GeometryOffsetAttribute.js";
import GeometryPipeline from "./GeometryPipeline.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import PolygonGeometryLibrary from "./PolygonGeometryLibrary.js";
import PolygonPipeline from "./PolygonPipeline.js";
import Quaternion from "./Quaternion.js";
import Rectangle from "./Rectangle.js";
import Stereographic from "./Stereographic.js";
import VertexFormat from "./VertexFormat.js";
import WindingOrder from "./WindingOrder.js";

const scratchCarto1 = new Cartographic();
const scratchCarto2 = new Cartographic();
function adjustPosHeightsForNormal(position, p1, p2, ellipsoid) {
  const carto1 = ellipsoid.cartesianToCartographic(position, scratchCarto1);
  const height = carto1.height;
  const p1Carto = ellipsoid.cartesianToCartographic(p1, scratchCarto2);
  p1Carto.height = height;
  ellipsoid.cartographicToCartesian(p1Carto, p1);

  const p2Carto = ellipsoid.cartesianToCartographic(p2, scratchCarto2);
  p2Carto.height = height - 100;
  ellipsoid.cartographicToCartesian(p2Carto, p2);
}

const scratchBoundingRectangle = new BoundingRectangle();
const scratchPosition = new Cartesian3();
const scratchNormal = new Cartesian3();
const scratchTangent = new Cartesian3();
const scratchBitangent = new Cartesian3();
const p1Scratch = new Cartesian3();
const p2Scratch = new Cartesian3();
let scratchPerPosNormal = new Cartesian3();
let scratchPerPosTangent = new Cartesian3();
let scratchPerPosBitangent = new Cartesian3();

const appendTextureCoordinatesOrigin = new Cartesian2();
const appendTextureCoordinatesCartesian2 = new Cartesian2();
const appendTextureCoordinatesCartesian3 = new Cartesian3();
const appendTextureCoordinatesQuaternion = new Quaternion();
const appendTextureCoordinatesMatrix3 = new Matrix3();
const tangentMatrixScratch = new Matrix3();

function computeAttributes(options) {
  const vertexFormat = options.vertexFormat;
  const geometry = options.geometry;
  const shadowVolume = options.shadowVolume;
  const flatPositions = geometry.attributes.position.values;
  const flatTexcoords = defined(geometry.attributes.st)
    ? geometry.attributes.st.values
    : undefined;

  let length = flatPositions.length;
  const wall = options.wall;
  const top = options.top || wall;
  const bottom = options.bottom || wall;
  if (
    vertexFormat.st ||
    vertexFormat.normal ||
    vertexFormat.tangent ||
    vertexFormat.bitangent ||
    shadowVolume
  ) {
    // PERFORMANCE_IDEA: Compute before subdivision, then just interpolate during subdivision.
    // PERFORMANCE_IDEA: Compute with createGeometryFromPositions() for fast path when there's no holes.
    const boundingRectangle = options.boundingRectangle;
    const rotationAxis = options.rotationAxis;
    const projectTo2d = options.projectTo2d;
    const ellipsoid = options.ellipsoid;
    const stRotation = options.stRotation;
    const perPositionHeight = options.perPositionHeight;

    const origin = appendTextureCoordinatesOrigin;
    origin.x = boundingRectangle.x;
    origin.y = boundingRectangle.y;

    const textureCoordinates = vertexFormat.st
      ? new Float32Array(2 * (length / 3))
      : undefined;
    let normals;
    if (vertexFormat.normal) {
      if (perPositionHeight && top && !wall) {
        normals = geometry.attributes.normal.values;
      } else {
        normals = new Float32Array(length);
      }
    }
    const tangents = vertexFormat.tangent
      ? new Float32Array(length)
      : undefined;
    const bitangents = vertexFormat.bitangent
      ? new Float32Array(length)
      : undefined;
    const extrudeNormals = shadowVolume ? new Float32Array(length) : undefined;

    let textureCoordIndex = 0;
    let attrIndex = 0;

    let normal = scratchNormal;
    let tangent = scratchTangent;
    let bitangent = scratchBitangent;
    let recomputeNormal = true;

    let textureMatrix = appendTextureCoordinatesMatrix3;
    let tangentRotationMatrix = tangentMatrixScratch;
    if (stRotation !== 0.0) {
      let rotation = Quaternion.fromAxisAngle(
        rotationAxis,
        stRotation,
        appendTextureCoordinatesQuaternion,
      );
      textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrix);

      rotation = Quaternion.fromAxisAngle(
        rotationAxis,
        -stRotation,
        appendTextureCoordinatesQuaternion,
      );
      tangentRotationMatrix = Matrix3.fromQuaternion(
        rotation,
        tangentRotationMatrix,
      );
    } else {
      textureMatrix = Matrix3.clone(Matrix3.IDENTITY, textureMatrix);
      tangentRotationMatrix = Matrix3.clone(
        Matrix3.IDENTITY,
        tangentRotationMatrix,
      );
    }

    let bottomOffset = 0;
    let bottomOffset2 = 0;

    if (top && bottom) {
      bottomOffset = length / 2;
      bottomOffset2 = length / 3;

      length /= 2;
    }

    for (let i = 0; i < length; i += 3) {
      const position = Cartesian3.fromArray(
        flatPositions,
        i,
        appendTextureCoordinatesCartesian3,
      );

      if (vertexFormat.st) {
        if (!defined(flatTexcoords)) {
          let p = Matrix3.multiplyByVector(
            textureMatrix,
            position,
            scratchPosition,
          );
          p = ellipsoid.scaleToGeodeticSurface(p, p);
          const st = projectTo2d([p], appendTextureCoordinatesCartesian2)[0];
          Cartesian2.subtract(st, origin, st);

          const stx = CesiumMath.clamp(st.x / boundingRectangle.width, 0, 1);
          const sty = CesiumMath.clamp(st.y / boundingRectangle.height, 0, 1);
          if (bottom) {
            textureCoordinates[textureCoordIndex + bottomOffset2] = stx;
            textureCoordinates[textureCoordIndex + 1 + bottomOffset2] = sty;
          }
          if (top) {
            textureCoordinates[textureCoordIndex] = stx;
            textureCoordinates[textureCoordIndex + 1] = sty;
          }

          textureCoordIndex += 2;
        }
      }

      if (
        vertexFormat.normal ||
        vertexFormat.tangent ||
        vertexFormat.bitangent ||
        shadowVolume
      ) {
        const attrIndex1 = attrIndex + 1;
        const attrIndex2 = attrIndex + 2;

        if (wall) {
          if (i + 3 < length) {
            const p1 = Cartesian3.fromArray(flatPositions, i + 3, p1Scratch);

            if (recomputeNormal) {
              const p2 = Cartesian3.fromArray(
                flatPositions,
                i + length,
                p2Scratch,
              );
              if (perPositionHeight) {
                adjustPosHeightsForNormal(position, p1, p2, ellipsoid);
              }
              Cartesian3.subtract(p1, position, p1);
              Cartesian3.subtract(p2, position, p2);
              normal = Cartesian3.normalize(
                Cartesian3.cross(p2, p1, normal),
                normal,
              );
              recomputeNormal = false;
            }

            if (Cartesian3.equalsEpsilon(p1, position, CesiumMath.EPSILON10)) {
              // if we've reached a corner
              recomputeNormal = true;
            }
          }

          if (vertexFormat.tangent || vertexFormat.bitangent) {
            bitangent = ellipsoid.geodeticSurfaceNormal(position, bitangent);
            if (vertexFormat.tangent) {
              tangent = Cartesian3.normalize(
                Cartesian3.cross(bitangent, normal, tangent),
                tangent,
              );
            }
          }
        } else {
          normal = ellipsoid.geodeticSurfaceNormal(position, normal);
          if (vertexFormat.tangent || vertexFormat.bitangent) {
            if (perPositionHeight) {
              scratchPerPosNormal = Cartesian3.fromArray(
                normals,
                attrIndex,
                scratchPerPosNormal,
              );
              scratchPerPosTangent = Cartesian3.cross(
                Cartesian3.UNIT_Z,
                scratchPerPosNormal,
                scratchPerPosTangent,
              );
              scratchPerPosTangent = Cartesian3.normalize(
                Matrix3.multiplyByVector(
                  tangentRotationMatrix,
                  scratchPerPosTangent,
                  scratchPerPosTangent,
                ),
                scratchPerPosTangent,
              );
              if (vertexFormat.bitangent) {
                scratchPerPosBitangent = Cartesian3.normalize(
                  Cartesian3.cross(
                    scratchPerPosNormal,
                    scratchPerPosTangent,
                    scratchPerPosBitangent,
                  ),
                  scratchPerPosBitangent,
                );
              }
            }

            tangent = Cartesian3.cross(Cartesian3.UNIT_Z, normal, tangent);
            tangent = Cartesian3.normalize(
              Matrix3.multiplyByVector(tangentRotationMatrix, tangent, tangent),
              tangent,
            );
            if (vertexFormat.bitangent) {
              bitangent = Cartesian3.normalize(
                Cartesian3.cross(normal, tangent, bitangent),
                bitangent,
              );
            }
          }
        }

        if (vertexFormat.normal) {
          if (options.wall) {
            normals[attrIndex + bottomOffset] = normal.x;
            normals[attrIndex1 + bottomOffset] = normal.y;
            normals[attrIndex2 + bottomOffset] = normal.z;
          } else if (bottom) {
            normals[attrIndex + bottomOffset] = -normal.x;
            normals[attrIndex1 + bottomOffset] = -normal.y;
            normals[attrIndex2 + bottomOffset] = -normal.z;
          }

          if ((top && !perPositionHeight) || wall) {
            normals[attrIndex] = normal.x;
            normals[attrIndex1] = normal.y;
            normals[attrIndex2] = normal.z;
          }
        }

        if (shadowVolume) {
          if (wall) {
            normal = ellipsoid.geodeticSurfaceNormal(position, normal);
          }
          extrudeNormals[attrIndex + bottomOffset] = -normal.x;
          extrudeNormals[attrIndex1 + bottomOffset] = -normal.y;
          extrudeNormals[attrIndex2 + bottomOffset] = -normal.z;
        }

        if (vertexFormat.tangent) {
          if (options.wall) {
            tangents[attrIndex + bottomOffset] = tangent.x;
            tangents[attrIndex1 + bottomOffset] = tangent.y;
            tangents[attrIndex2 + bottomOffset] = tangent.z;
          } else if (bottom) {
            tangents[attrIndex + bottomOffset] = -tangent.x;
            tangents[attrIndex1 + bottomOffset] = -tangent.y;
            tangents[attrIndex2 + bottomOffset] = -tangent.z;
          }

          if (top) {
            if (perPositionHeight) {
              tangents[attrIndex] = scratchPerPosTangent.x;
              tangents[attrIndex1] = scratchPerPosTangent.y;
              tangents[attrIndex2] = scratchPerPosTangent.z;
            } else {
              tangents[attrIndex] = tangent.x;
              tangents[attrIndex1] = tangent.y;
              tangents[attrIndex2] = tangent.z;
            }
          }
        }

        if (vertexFormat.bitangent) {
          if (bottom) {
            bitangents[attrIndex + bottomOffset] = bitangent.x;
            bitangents[attrIndex1 + bottomOffset] = bitangent.y;
            bitangents[attrIndex2 + bottomOffset] = bitangent.z;
          }
          if (top) {
            if (perPositionHeight) {
              bitangents[attrIndex] = scratchPerPosBitangent.x;
              bitangents[attrIndex1] = scratchPerPosBitangent.y;
              bitangents[attrIndex2] = scratchPerPosBitangent.z;
            } else {
              bitangents[attrIndex] = bitangent.x;
              bitangents[attrIndex1] = bitangent.y;
              bitangents[attrIndex2] = bitangent.z;
            }
          }
        }
        attrIndex += 3;
      }
    }

    if (vertexFormat.st && !defined(flatTexcoords)) {
      geometry.attributes.st = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: textureCoordinates,
      });
    }

    if (vertexFormat.normal) {
      geometry.attributes.normal = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: normals,
      });
    }

    if (vertexFormat.tangent) {
      geometry.attributes.tangent = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: tangents,
      });
    }

    if (vertexFormat.bitangent) {
      geometry.attributes.bitangent = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: bitangents,
      });
    }

    if (shadowVolume) {
      geometry.attributes.extrudeDirection = new GeometryAttribute({
        componentDatatype: ComponentDatatype.FLOAT,
        componentsPerAttribute: 3,
        values: extrudeNormals,
      });
    }
  }

  if (options.extrude && defined(options.offsetAttribute)) {
    const size = flatPositions.length / 3;
    let offsetAttribute = new Uint8Array(size);

    if (options.offsetAttribute === GeometryOffsetAttribute.TOP) {
      if ((top && bottom) || wall) {
        offsetAttribute = offsetAttribute.fill(1, 0, size / 2);
      } else if (top) {
        offsetAttribute = offsetAttribute.fill(1);
      }
    } else {
      const offsetValue =
        options.offsetAttribute === GeometryOffsetAttribute.NONE ? 0 : 1;
      offsetAttribute = offsetAttribute.fill(offsetValue);
    }

    geometry.attributes.applyOffset = new GeometryAttribute({
      componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
      componentsPerAttribute: 1,
      values: offsetAttribute,
    });
  }

  return geometry;
}

const createGeometryFromPositionsExtrudedPositions = [];

function createGeometryFromPositionsExtruded(
  ellipsoid,
  polygon,
  textureCoordinates,
  granularity,
  hierarchy,
  perPositionHeight,
  closeTop,
  closeBottom,
  vertexFormat,
  arcType,
) {
  const geos = {
    walls: [],
  };
  let i;

  if (closeTop || closeBottom) {
    const topGeo = PolygonGeometryLibrary.createGeometryFromPositions(
      ellipsoid,
      polygon,
      textureCoordinates,
      granularity,
      perPositionHeight,
      vertexFormat,
      arcType,
    );

    const edgePoints = topGeo.attributes.position.values;
    const indices = topGeo.indices;
    let numPositions;
    let newIndices;

    if (closeTop && closeBottom) {
      const topBottomPositions = edgePoints.concat(edgePoints);

      numPositions = topBottomPositions.length / 3;

      newIndices = IndexDatatype.createTypedArray(
        numPositions,
        indices.length * 2,
      );
      newIndices.set(indices);
      const ilength = indices.length;

      const length = numPositions / 2;

      for (i = 0; i < ilength; i += 3) {
        const i0 = newIndices[i] + length;
        const i1 = newIndices[i + 1] + length;
        const i2 = newIndices[i + 2] + length;

        newIndices[i + ilength] = i2;
        newIndices[i + 1 + ilength] = i1;
        newIndices[i + 2 + ilength] = i0;
      }

      topGeo.attributes.position.values = topBottomPositions;
      if (perPositionHeight && vertexFormat.normal) {
        const normals = topGeo.attributes.normal.values;
        topGeo.attributes.normal.values = new Float32Array(
          topBottomPositions.length,
        );
        topGeo.attributes.normal.values.set(normals);
      }

      if (vertexFormat.st && defined(textureCoordinates)) {
        const texcoords = topGeo.attributes.st.values;
        topGeo.attributes.st.values = new Float32Array(numPositions * 2);
        topGeo.attributes.st.values = texcoords.concat(texcoords);
      }

      topGeo.indices = newIndices;
    } else if (closeBottom) {
      numPositions = edgePoints.length / 3;
      newIndices = IndexDatatype.createTypedArray(numPositions, indices.length);

      for (i = 0; i < indices.length; i += 3) {
        newIndices[i] = indices[i + 2];
        newIndices[i + 1] = indices[i + 1];
        newIndices[i + 2] = indices[i];
      }

      topGeo.indices = newIndices;
    }

    geos.topAndBottom = new GeometryInstance({
      geometry: topGeo,
    });
  }

  let outerRing = hierarchy.outerRing;
  const tangentPlane = EllipsoidTangentPlane.fromPoints(outerRing, ellipsoid);
  let positions2D = tangentPlane.projectPointsOntoPlane(
    outerRing,
    createGeometryFromPositionsExtrudedPositions,
  );

  let windingOrder = PolygonPipeline.computeWindingOrder2D(positions2D);
  if (windingOrder === WindingOrder.CLOCKWISE) {
    outerRing = outerRing.slice().reverse();
  }

  let wallGeo = PolygonGeometryLibrary.computeWallGeometry(
    outerRing,
    textureCoordinates,
    ellipsoid,
    granularity,
    perPositionHeight,
    arcType,
  );
  geos.walls.push(
    new GeometryInstance({
      geometry: wallGeo,
    }),
  );

  const holes = hierarchy.holes;
  for (i = 0; i < holes.length; i++) {
    let hole = holes[i];
    positions2D = tangentPlane.projectPointsOntoPlane(
      hole,
      createGeometryFromPositionsExtrudedPositions,
    );

    windingOrder = PolygonPipeline.computeWindingOrder2D(positions2D);
    if (windingOrder === WindingOrder.COUNTER_CLOCKWISE) {
      hole = hole.slice().reverse();
    }

    wallGeo = PolygonGeometryLibrary.computeWallGeometry(
      hole,
      textureCoordinates,
      ellipsoid,
      granularity,
      perPositionHeight,
      arcType,
    );
    geos.walls.push(
      new GeometryInstance({
        geometry: wallGeo,
      }),
    );
  }

  return geos;
}

/**
 * 描述椭球体上的多边形。多边形由多边形层次结构定义。多边形几何体可以通过 {@link Primitive} 和 {@link GroundPrimitive} 进行渲染。
 *
 * @alias PolygonGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {PolygonHierarchy} options.polygonHierarchy 可以包含孔的多边形层次结构。
 * @param {number} [options.height=0.0] 多边形与椭球表面之间的距离（以米为单位）。
 * @param {number} [options.extrudedHeight] 多边形的挤出面与椭球表面之间的距离（以米为单位）。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {number} [options.stRotation=0.0] 纹理坐标的旋转，单位为弧度。正旋转为逆时针方向。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 每个纬度和经度之间的距离（以弧度为单位）。确定缓冲区中的位置数量。
 * @param {boolean} [options.perPositionHeight=false] 对于每个位置使用 options.positions 的高度，而不是使用 options.height 来确定高度。
 * @param {boolean} [options.closeTop=true] 当为 false 时，留下一个开放的挤出多边形的顶部。
 * @param {boolean} [options.closeBottom=true] 当为 false 时，留下一个开放的挤出多边形的底部。
 * @param {ArcType} [options.arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线的类型。有效选项为 {@link ArcType.GEODESIC} 和 {@link ArcType.RHUMB}。
 * @param {PolygonHierarchy} [options.textureCoordinates] 作为 {@link PolygonHierarchy} 的 {@link Cartesian2} 点的纹理坐标。对地面原语没有影响。
 *
 * @see PolygonGeometry#createGeometry
 * @see PolygonGeometry#fromPositions
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Polygon.html|Cesium Sandcastle Polygon Demo}
 *
 * @example
 * // 1. create a polygon from points
 * const polygon = new Cesium.PolygonGeometry({
 *   polygonHierarchy : new Cesium.PolygonHierarchy(
 *     Cesium.Cartesian3.fromDegreesArray([
 *       -72.0, 40.0,
 *       -70.0, 35.0,
 *       -75.0, 30.0,
 *       -70.0, 30.0,
 *       -68.0, 40.0
 *     ])
 *   )
 * });
 * const geometry = Cesium.PolygonGeometry.createGeometry(polygon);
 *
 * // 2. create a nested polygon with holes
 * const polygonWithHole = new Cesium.PolygonGeometry({
 *   polygonHierarchy : new Cesium.PolygonHierarchy(
 *     Cesium.Cartesian3.fromDegreesArray([
 *       -109.0, 30.0,
 *       -95.0, 30.0,
 *       -95.0, 40.0,
 *       -109.0, 40.0
 *     ]),
 *     [new Cesium.PolygonHierarchy(
 *       Cesium.Cartesian3.fromDegreesArray([
 *         -107.0, 31.0,
 *         -107.0, 39.0,
 *         -97.0, 39.0,
 *         -97.0, 31.0
 *       ]),
 *       [new Cesium.PolygonHierarchy(
 *         Cesium.Cartesian3.fromDegreesArray([
 *           -105.0, 33.0,
 *           -99.0, 33.0,
 *           -99.0, 37.0,
 *           -105.0, 37.0
 *         ]),
 *         [new Cesium.PolygonHierarchy(
 *           Cesium.Cartesian3.fromDegreesArray([
 *             -103.0, 34.0,
 *             -101.0, 34.0,
 *             -101.0, 36.0,
 *             -103.0, 36.0
 *           ])
 *         )]
 *       )]
 *     )]
 *   )
 * });
 * const geometry = Cesium.PolygonGeometry.createGeometry(polygonWithHole);
 *
 * // 3. create extruded polygon
 * const extrudedPolygon = new Cesium.PolygonGeometry({
 *   polygonHierarchy : new Cesium.PolygonHierarchy(
 *     Cesium.Cartesian3.fromDegreesArray([
 *       -72.0, 40.0,
 *       -70.0, 35.0,
 *       -75.0, 30.0,
 *       -70.0, 30.0,
 *       -68.0, 40.0
 *     ])
 *   ),
 *   extrudedHeight: 300000
 * });
 * const geometry = Cesium.PolygonGeometry.createGeometry(extrudedPolygon);
 */
function PolygonGeometry(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.polygonHierarchy", options.polygonHierarchy);
  if (
    defined(options.perPositionHeight) &&
    options.perPositionHeight &&
    defined(options.height)
  ) {
    throw new DeveloperError(
      "Cannot use both options.perPositionHeight and options.height",
    );
  }
  if (
    defined(options.arcType) &&
    options.arcType !== ArcType.GEODESIC &&
    options.arcType !== ArcType.RHUMB
  ) {
    throw new DeveloperError(
      "Invalid arcType. Valid options are ArcType.GEODESIC and ArcType.RHUMB.",
    );
  }
  //>>includeEnd('debug');

  const polygonHierarchy = options.polygonHierarchy;
  const vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);
  const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  const granularity = defaultValue(
    options.granularity,
    CesiumMath.RADIANS_PER_DEGREE,
  );
  const stRotation = defaultValue(options.stRotation, 0.0);
  const textureCoordinates = options.textureCoordinates;
  const perPositionHeight = defaultValue(options.perPositionHeight, false);
  const perPositionHeightExtrude =
    perPositionHeight && defined(options.extrudedHeight);
  let height = defaultValue(options.height, 0.0);
  let extrudedHeight = defaultValue(options.extrudedHeight, height);

  if (!perPositionHeightExtrude) {
    const h = Math.max(height, extrudedHeight);
    extrudedHeight = Math.min(height, extrudedHeight);
    height = h;
  }

  this._vertexFormat = VertexFormat.clone(vertexFormat);
  this._ellipsoid = Ellipsoid.clone(ellipsoid);
  this._granularity = granularity;
  this._stRotation = stRotation;
  this._height = height;
  this._extrudedHeight = extrudedHeight;
  this._closeTop = defaultValue(options.closeTop, true);
  this._closeBottom = defaultValue(options.closeBottom, true);
  this._polygonHierarchy = polygonHierarchy;
  this._perPositionHeight = perPositionHeight;
  this._perPositionHeightExtrude = perPositionHeightExtrude;
  this._shadowVolume = defaultValue(options.shadowVolume, false);
  this._workerName = "createPolygonGeometry";
  this._offsetAttribute = options.offsetAttribute;
  this._arcType = defaultValue(options.arcType, ArcType.GEODESIC);

  this._rectangle = undefined;
  this._textureCoordinateRotationPoints = undefined;
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
    Ellipsoid.packedLength +
    VertexFormat.packedLength +
    (textureCoordinates
      ? PolygonGeometryLibrary.computeHierarchyPackedLength(
          textureCoordinates,
          Cartesian2,
        )
      : 1) +
    12;
}

/**
 * 从位置数组描述一个多边形。多边形几何体可以通过 {@link Primitive} 和 {@link GroundPrimitive} 进行渲染。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Cartesian3[]} options.positions 定义多边形角点的位置信息数组。
 * @param {number} [options.height=0.0] 多边形的高度。
 * @param {number} [options.extrudedHeight] 多边形挤出部分的高度。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {number} [options.stRotation=0.0] 纹理坐标的旋转，单位为弧度。正旋转为逆时针方向。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 每个纬度和经度之间的距离（以弧度为单位）。确定缓冲区中的位置数量。
 * @param {boolean} [options.perPositionHeight=false] 对于每个位置使用 options.positions 的高度，而不是使用 options.height 来确定高度。
 * @param {boolean} [options.closeTop=true] 当为 false 时，留下一个开放的挤出多边形的顶部。
 * @param {boolean} [options.closeBottom=true] 当为 false 时，留下一个开放的挤出多边形的底部。
 * @param {ArcType} [options.arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线的类型。有效选项为 {@link ArcType.GEODESIC} 和 {@link ArcType.RHUMB}。
 * @param {PolygonHierarchy} [options.textureCoordinates] 作为 {@link PolygonHierarchy} 的 {@link Cartesian2} 点的纹理坐标。对地面原语没有影响。
 * @returns {PolygonGeometry}
 *
 * @example
 * // create a polygon from points
 * const polygon = Cesium.PolygonGeometry.fromPositions({
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
PolygonGeometry.fromPositions = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.positions", options.positions);
  //>>includeEnd('debug');

  const newOptions = {
    polygonHierarchy: {
      positions: options.positions,
    },
    height: options.height,
    extrudedHeight: options.extrudedHeight,
    vertexFormat: options.vertexFormat,
    stRotation: options.stRotation,
    ellipsoid: options.ellipsoid,
    granularity: options.granularity,
    perPositionHeight: options.perPositionHeight,
    closeTop: options.closeTop,
    closeBottom: options.closeBottom,
    offsetAttribute: options.offsetAttribute,
    arcType: options.arcType,
    textureCoordinates: options.textureCoordinates,
  };
  return new PolygonGeometry(newOptions);
};

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {PolygonGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
PolygonGeometry.pack = function (value, array, startingIndex) {
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

  array[startingIndex++] = value._height;
  array[startingIndex++] = value._extrudedHeight;
  array[startingIndex++] = value._granularity;
  array[startingIndex++] = value._stRotation;
  array[startingIndex++] = value._perPositionHeightExtrude ? 1.0 : 0.0;
  array[startingIndex++] = value._perPositionHeight ? 1.0 : 0.0;
  array[startingIndex++] = value._closeTop ? 1.0 : 0.0;
  array[startingIndex++] = value._closeBottom ? 1.0 : 0.0;
  array[startingIndex++] = value._shadowVolume ? 1.0 : 0.0;
  array[startingIndex++] = defaultValue(value._offsetAttribute, -1);
  array[startingIndex++] = value._arcType;
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

//Only used to avoid inability to default construct.
const dummyOptions = {
  polygonHierarchy: {},
};

/**
 * 从打包数组中检索实例.
 *
 * @param {number[]} array 压缩数组.
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
 * @param {PolygonGeometry} [result] 存储结果的对象.
 */
PolygonGeometry.unpack = function (array, startingIndex, result) {
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

  const height = array[startingIndex++];
  const extrudedHeight = array[startingIndex++];
  const granularity = array[startingIndex++];
  const stRotation = array[startingIndex++];
  const perPositionHeightExtrude = array[startingIndex++] === 1.0;
  const perPositionHeight = array[startingIndex++] === 1.0;
  const closeTop = array[startingIndex++] === 1.0;
  const closeBottom = array[startingIndex++] === 1.0;
  const shadowVolume = array[startingIndex++] === 1.0;
  const offsetAttribute = array[startingIndex++];
  const arcType = array[startingIndex++];
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
    result = new PolygonGeometry(dummyOptions);
  }

  result._polygonHierarchy = polygonHierarchy;
  result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
  result._vertexFormat = VertexFormat.clone(vertexFormat, result._vertexFormat);
  result._height = height;
  result._extrudedHeight = extrudedHeight;
  result._granularity = granularity;
  result._stRotation = stRotation;
  result._perPositionHeightExtrude = perPositionHeightExtrude;
  result._perPositionHeight = perPositionHeight;
  result._closeTop = closeTop;
  result._closeBottom = closeBottom;
  result._shadowVolume = shadowVolume;
  result._offsetAttribute =
    offsetAttribute === -1 ? undefined : offsetAttribute;
  result._arcType = arcType;
  result._textureCoordinates = textureCoordinates;
  result.packedLength = packedLength;

  return result;
};

const scratchCartesian0 = new Cartesian2();
const scratchCartesian1 = new Cartesian2();
const scratchPolarClosest = new Stereographic();
function expandRectangle(
  polar,
  lastPolar,
  ellipsoid,
  arcType,
  polygon,
  result,
) {
  const longitude = polar.longitude;
  const lonAdjusted =
    longitude >= 0.0 ? longitude : longitude + CesiumMath.TWO_PI;
  polygon.westOverIdl = Math.min(polygon.westOverIdl, lonAdjusted);
  polygon.eastOverIdl = Math.max(polygon.eastOverIdl, lonAdjusted);

  result.west = Math.min(result.west, longitude);
  result.east = Math.max(result.east, longitude);

  const latitude = polar.getLatitude(ellipsoid);
  let segmentLatitude = latitude;

  result.south = Math.min(result.south, latitude);
  result.north = Math.max(result.north, latitude);

  if (arcType !== ArcType.RHUMB) {
    // Geodesics will need to find the closest point on line. Rhumb lines will not have a latitude greater in magnitude than either of their endpoints.
    const segment = Cartesian2.subtract(
      lastPolar.position,
      polar.position,
      scratchCartesian0,
    );
    const t =
      Cartesian2.dot(lastPolar.position, segment) /
      Cartesian2.dot(segment, segment);
    if (t > 0.0 && t < 1.0) {
      const projected = Cartesian2.add(
        lastPolar.position,
        Cartesian2.multiplyByScalar(segment, -t, segment),
        scratchCartesian1,
      );
      const closestPolar = Stereographic.clone(lastPolar, scratchPolarClosest);
      closestPolar.position = projected;
      const adjustedLatitude = closestPolar.getLatitude(ellipsoid);
      result.south = Math.min(result.south, adjustedLatitude);
      result.north = Math.max(result.north, adjustedLatitude);

      if (Math.abs(latitude) > Math.abs(adjustedLatitude)) {
        segmentLatitude = adjustedLatitude;
      }
    }
  }
  const direction = lastPolar.x * polar.y - polar.x * lastPolar.y;

  // The total internal angle in either hemisphere determines if the pole is inside or outside the polygon
  let angle = Math.sign(direction);
  if (angle !== 0.0) {
    angle *= Cartesian2.angleBetween(lastPolar.position, polar.position);
  }

  if (segmentLatitude >= 0.0) {
    polygon.northAngle += angle;
  }

  if (segmentLatitude <= 0.0) {
    polygon.southAngle += angle;
  }
}

const scratchPolar = new Stereographic();
const scratchPolarPrevious = new Stereographic();
const polygon = {
  northAngle: 0.0,
  southAngle: 0.0,
  westOverIdl: 0.0,
  eastOverIdl: 0.0,
};

/**
 * 计算一个矩形，该矩形包围由位置列表定义的多边形，包括跨越国际日期线和极点的情况。
 *
 * @param {Cartesian3[]} positions 定义多边形外边界的线性环。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 * @param {ArcType} [arcType=ArcType.GEODESIC] 多边形边缘必须遵循的线的类型。有效选项为 {@link ArcType.GEODESIC} 和 {@link ArcType.RHUMB}。
 * @param {Rectangle} [result] 用于存储结果的对象。
 *
 * @returns {Rectangle} 结果矩形
 */

PolygonGeometry.computeRectangleFromPositions = function (
  positions,
  ellipsoid,
  arcType,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("positions", positions);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Rectangle();
  }

  if (positions.length < 3) {
    return result;
  }

  result.west = Number.POSITIVE_INFINITY;
  result.east = Number.NEGATIVE_INFINITY;
  result.south = Number.POSITIVE_INFINITY;
  result.north = Number.NEGATIVE_INFINITY;

  polygon.northAngle = 0.0;
  polygon.southAngle = 0.0;
  polygon.westOverIdl = Number.POSITIVE_INFINITY;
  polygon.eastOverIdl = Number.NEGATIVE_INFINITY;

  const positionsLength = positions.length;
  let lastPolarPosition = Stereographic.fromCartesian(
    positions[0],
    scratchPolarPrevious,
  );
  for (let i = 1; i < positionsLength; i++) {
    const polarPosition = Stereographic.fromCartesian(
      positions[i],
      scratchPolar,
    );
    expandRectangle(
      polarPosition,
      lastPolarPosition,
      ellipsoid,
      arcType,
      polygon,
      result,
    );

    lastPolarPosition = Stereographic.clone(polarPosition, lastPolarPosition);
  }

  expandRectangle(
    Stereographic.fromCartesian(positions[0], scratchPolar),
    lastPolarPosition,
    ellipsoid,
    arcType,
    polygon,
    result,
  );

  if (result.east - result.west > polygon.eastOverIdl - polygon.westOverIdl) {
    result.west = polygon.westOverIdl;
    result.east = polygon.eastOverIdl;

    if (result.east > CesiumMath.PI) {
      result.east = result.east - CesiumMath.TWO_PI;
    }
    if (result.west > CesiumMath.PI) {
      result.west = result.west - CesiumMath.TWO_PI;
    }
  }

  // If either pole is inside the polygon, adjust the rectangle so the pole is included
  if (
    CesiumMath.equalsEpsilon(
      Math.abs(polygon.northAngle),
      CesiumMath.TWO_PI,
      CesiumMath.EPSILON10,
    )
  ) {
    result.north = CesiumMath.PI_OVER_TWO;
    result.east = CesiumMath.PI;
    result.west = -CesiumMath.PI;
  }

  if (
    CesiumMath.equalsEpsilon(
      Math.abs(polygon.southAngle),
      CesiumMath.TWO_PI,
      CesiumMath.EPSILON10,
    )
  ) {
    result.south = -CesiumMath.PI_OVER_TWO;
    result.east = CesiumMath.PI;
    result.west = -CesiumMath.PI;
  }

  return result;
};

const scratchPolarForPlane = new Stereographic();
function getTangentPlane(rectangle, positions, ellipsoid) {
  if (rectangle.height >= CesiumMath.PI || rectangle.width >= CesiumMath.PI) {
    const polar = Stereographic.fromCartesian(
      positions[0],
      scratchPolarForPlane,
    );
    return polar.tangentPlane;
  }

  // Use a local tangent plane for smaller extents
  return EllipsoidTangentPlane.fromPoints(positions, ellipsoid);
}

const scratchCartographicCyllindrical = new Cartographic();
function createProjectTo2d(rectangle, outerPositions, ellipsoid) {
  return (positions, results) => {
    // If the polygon positions span a large enough extent, use a specialized projection
    if (rectangle.height >= CesiumMath.PI || rectangle.width >= CesiumMath.PI) {
      // polygons that cross the equator must use cyllindrical coordinates to correctly compute winding order.
      if (rectangle.south < 0 && rectangle.north > 0) {
        if (!defined(results)) {
          results = [];
        }

        for (let i = 0; i < positions.length; ++i) {
          const cartographic = ellipsoid.cartesianToCartographic(
            positions[i],
            scratchCartographicCyllindrical,
          );
          results[i] = new Cartesian2(
            cartographic.longitude / CesiumMath.PI,
            cartographic.latitude / CesiumMath.PI_OVER_TWO,
          );
        }

        results.length = positions.length;
        return results;
      }

      return Stereographic.fromCartesianArray(positions, results);
    }

    // Use a local tangent plane for smaller extents
    const tangentPlane = EllipsoidTangentPlane.fromPoints(
      outerPositions,
      ellipsoid,
    );
    return tangentPlane.projectPointsOntoPlane(positions, results);
  };
}

function createProjectPositionTo2d(rectangle, outerRing, ellipsoid) {
  // If the polygon positions span a large enough extent, use a specialized projection
  if (rectangle.height >= CesiumMath.PI || rectangle.width >= CesiumMath.PI) {
    return (position, result) => {
      // polygons that cross the equator must use cyllindrical coordinates to correctly compute winding order.
      if (rectangle.south < 0 && rectangle.north > 0) {
        const cartographic = ellipsoid.cartesianToCartographic(
          position,
          scratchCartographicCyllindrical,
        );
        if (!defined(result)) {
          result = new Cartesian2();
        }
        result.x = cartographic.longitude / CesiumMath.PI;
        result.y = cartographic.latitude / CesiumMath.PI_OVER_TWO;

        return result;
      }

      return Stereographic.fromCartesian(position, result);
    };
  }

  const tangentPlane = EllipsoidTangentPlane.fromPoints(outerRing, ellipsoid);
  return (position, result) => {
    // Use a local tangent plane for smaller extents
    return tangentPlane.projectPointsOntoPlane(position, result);
  };
}

function createSplitPolygons(rectangle, ellipsoid, arcType, perPositionHeight) {
  return (polygons, results) => {
    if (
      !perPositionHeight &&
      (rectangle.height >= CesiumMath.PI_OVER_TWO ||
        rectangle.width >= 2 * CesiumMath.PI_OVER_THREE)
    ) {
      return PolygonGeometryLibrary.splitPolygonsOnEquator(
        polygons,
        ellipsoid,
        arcType,
        results,
      );
    }

    return polygons;
  };
}

function computeBoundingRectangle(outerRing, rectangle, ellipsoid, stRotation) {
  if (rectangle.height >= CesiumMath.PI || rectangle.width >= CesiumMath.PI) {
    return BoundingRectangle.fromRectangle(
      rectangle,
      undefined,
      scratchBoundingRectangle,
    );
  }

  const outerPositions = outerRing;
  const tangentPlane = EllipsoidTangentPlane.fromPoints(
    outerPositions,
    ellipsoid,
  );
  return PolygonGeometryLibrary.computeBoundingRectangle(
    tangentPlane.plane.normal,
    tangentPlane.projectPointOntoPlane.bind(tangentPlane),
    outerPositions,
    stRotation,
    scratchBoundingRectangle,
  );
}

/**
 * 计算多边形的几何表示，包括其顶点、索引和包围球。
 *
 * @param {PolygonGeometry} polygonGeometry 对多边形的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */

PolygonGeometry.createGeometry = function (polygonGeometry) {
  const vertexFormat = polygonGeometry._vertexFormat;
  const ellipsoid = polygonGeometry._ellipsoid;
  const granularity = polygonGeometry._granularity;
  const stRotation = polygonGeometry._stRotation;
  const polygonHierarchy = polygonGeometry._polygonHierarchy;
  const perPositionHeight = polygonGeometry._perPositionHeight;
  const closeTop = polygonGeometry._closeTop;
  const closeBottom = polygonGeometry._closeBottom;
  const arcType = polygonGeometry._arcType;
  const textureCoordinates = polygonGeometry._textureCoordinates;

  const hasTextureCoordinates = defined(textureCoordinates);

  const outerPositions = polygonHierarchy.positions;
  if (outerPositions.length < 3) {
    return;
  }

  const rectangle = polygonGeometry.rectangle;
  const results = PolygonGeometryLibrary.polygonsFromHierarchy(
    polygonHierarchy,
    hasTextureCoordinates,
    createProjectTo2d(rectangle, outerPositions, ellipsoid),
    !perPositionHeight,
    ellipsoid,
    createSplitPolygons(rectangle, ellipsoid, arcType, perPositionHeight),
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
        ellipsoid,
      ).polygons
    : undefined;

  if (hierarchy.length === 0) {
    return;
  }

  const outerRing = hierarchy[0].outerRing;
  const boundingRectangle = computeBoundingRectangle(
    outerRing,
    rectangle,
    ellipsoid,
    stRotation,
  );

  const geometries = [];

  const height = polygonGeometry._height;
  const extrudedHeight = polygonGeometry._extrudedHeight;
  const extrude =
    polygonGeometry._perPositionHeightExtrude ||
    !CesiumMath.equalsEpsilon(height, extrudedHeight, 0, CesiumMath.EPSILON2);

  const options = {
    perPositionHeight: perPositionHeight,
    vertexFormat: vertexFormat,
    geometry: undefined,
    rotationAxis: getTangentPlane(rectangle, outerRing, ellipsoid).plane.normal,
    projectTo2d: createProjectPositionTo2d(rectangle, outerRing, ellipsoid),
    boundingRectangle: boundingRectangle,
    ellipsoid: ellipsoid,
    stRotation: stRotation,
    textureCoordinates: undefined,
    bottom: false,
    top: true,
    wall: false,
    extrude: false,
    arcType: arcType,
  };

  let i;

  if (extrude) {
    options.extrude = true;
    options.top = closeTop;
    options.bottom = closeBottom;
    options.shadowVolume = polygonGeometry._shadowVolume;
    options.offsetAttribute = polygonGeometry._offsetAttribute;
    for (i = 0; i < polygons.length; i++) {
      const splitGeometry = createGeometryFromPositionsExtruded(
        ellipsoid,
        polygons[i],
        hasTextureCoordinates ? textureCoordinatePolygons[i] : undefined,
        granularity,
        hierarchy[i],
        perPositionHeight,
        closeTop,
        closeBottom,
        vertexFormat,
        arcType,
      );

      let topAndBottom;
      if (closeTop && closeBottom) {
        topAndBottom = splitGeometry.topAndBottom;
        options.geometry = PolygonGeometryLibrary.scaleToGeodeticHeightExtruded(
          topAndBottom.geometry,
          height,
          extrudedHeight,
          ellipsoid,
          perPositionHeight,
        );
      } else if (closeTop) {
        topAndBottom = splitGeometry.topAndBottom;
        topAndBottom.geometry.attributes.position.values =
          PolygonPipeline.scaleToGeodeticHeight(
            topAndBottom.geometry.attributes.position.values,
            height,
            ellipsoid,
            !perPositionHeight,
          );
        options.geometry = topAndBottom.geometry;
      } else if (closeBottom) {
        topAndBottom = splitGeometry.topAndBottom;
        topAndBottom.geometry.attributes.position.values =
          PolygonPipeline.scaleToGeodeticHeight(
            topAndBottom.geometry.attributes.position.values,
            extrudedHeight,
            ellipsoid,
            true,
          );
        options.geometry = topAndBottom.geometry;
      }
      if (closeTop || closeBottom) {
        options.wall = false;
        topAndBottom.geometry = computeAttributes(options);
        geometries.push(topAndBottom);
      }

      const walls = splitGeometry.walls;
      options.wall = true;
      for (let k = 0; k < walls.length; k++) {
        const wall = walls[k];
        options.geometry = PolygonGeometryLibrary.scaleToGeodeticHeightExtruded(
          wall.geometry,
          height,
          extrudedHeight,
          ellipsoid,
          perPositionHeight,
        );
        wall.geometry = computeAttributes(options);
        geometries.push(wall);
      }
    }
  } else {
    for (i = 0; i < polygons.length; i++) {
      const geometryInstance = new GeometryInstance({
        geometry: PolygonGeometryLibrary.createGeometryFromPositions(
          ellipsoid,
          polygons[i],
          hasTextureCoordinates ? textureCoordinatePolygons[i] : undefined,
          granularity,
          perPositionHeight,
          vertexFormat,
          arcType,
        ),
      });
      geometryInstance.geometry.attributes.position.values =
        PolygonPipeline.scaleToGeodeticHeight(
          geometryInstance.geometry.attributes.position.values,
          height,
          ellipsoid,
          !perPositionHeight,
        );
      options.geometry = geometryInstance.geometry;

      geometryInstance.geometry = computeAttributes(options);

      if (defined(polygonGeometry._offsetAttribute)) {
        const length =
          geometryInstance.geometry.attributes.position.values.length;
        const offsetValue =
          polygonGeometry._offsetAttribute === GeometryOffsetAttribute.NONE
            ? 0
            : 1;
        const applyOffset = new Uint8Array(length / 3).fill(offsetValue);
        geometryInstance.geometry.attributes.applyOffset =
          new GeometryAttribute({
            componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
            componentsPerAttribute: 1,
            values: applyOffset,
          });
      }

      geometries.push(geometryInstance);
    }
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
  const boundingSphere = BoundingSphere.fromVertices(
    attributes.position.values,
  );

  if (!vertexFormat.position) {
    delete attributes.position;
  }

  return new Geometry({
    attributes: attributes,
    indices: geometry.indices,
    primitiveType: geometry.primitiveType,
    boundingSphere: boundingSphere,
    offsetAttribute: polygonGeometry._offsetAttribute,
  });
};

/**
 * @private
 */
PolygonGeometry.createShadowVolume = function (
  polygonGeometry,
  minHeightFunc,
  maxHeightFunc,
) {
  const granularity = polygonGeometry._granularity;
  const ellipsoid = polygonGeometry._ellipsoid;

  const minHeight = minHeightFunc(granularity, ellipsoid);
  const maxHeight = maxHeightFunc(granularity, ellipsoid);

  return new PolygonGeometry({
    polygonHierarchy: polygonGeometry._polygonHierarchy,
    ellipsoid: ellipsoid,
    stRotation: polygonGeometry._stRotation,
    granularity: granularity,
    perPositionHeight: false,
    extrudedHeight: minHeight,
    height: maxHeight,
    vertexFormat: VertexFormat.POSITION_ONLY,
    shadowVolume: true,
    arcType: polygonGeometry._arcType,
  });
};

function textureCoordinateRotationPoints(polygonGeometry) {
  const stRotation = -polygonGeometry._stRotation;
  if (stRotation === 0.0) {
    return [0, 0, 0, 1, 1, 0];
  }
  const ellipsoid = polygonGeometry._ellipsoid;
  const positions = polygonGeometry._polygonHierarchy.positions;
  const boundingRectangle = polygonGeometry.rectangle;
  return Geometry._textureCoordinateRotationPoints(
    positions,
    stRotation,
    ellipsoid,
    boundingRectangle,
  );
}

Object.defineProperties(PolygonGeometry.prototype, {
  /**
   * @private
   */
  rectangle: {
    get: function () {
      if (!defined(this._rectangle)) {
        const positions = this._polygonHierarchy.positions;
        this._rectangle = PolygonGeometry.computeRectangleFromPositions(
          positions,
          this._ellipsoid,
          this._arcType,
        );
      }

      return this._rectangle;
    },
  },
/**
   * 在将 PolygonGeometries 渲染为 GroundPrimitives 时，用于重新映射纹理坐标。
   * @private
   */

  textureCoordinateRotationPoints: {
    get: function () {
      if (!defined(this._textureCoordinateRotationPoints)) {
        this._textureCoordinateRotationPoints =
          textureCoordinateRotationPoints(this);
      }
      return this._textureCoordinateRotationPoints;
    },
  },
});
export default PolygonGeometry;
