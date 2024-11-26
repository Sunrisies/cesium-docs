import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import GeometryType from "./GeometryType.js";
import Matrix2 from "./Matrix2.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import PrimitiveType from "./PrimitiveType.js";
import Quaternion from "./Quaternion.js";
import Rectangle from "./Rectangle.js";
import Transforms from "./Transforms.js";

/**
 * 具有属性的几何表示，这些属性形成顶点，并可选的索引数据
 * 定义图元。几何体和描述着色的 {@link Appearance} 可以分配给 {@link Primitive} 进行可视化。
 * 一个 <code>Primitive</code> 可以从许多异构（在许多情况下）几何体中创建，以提高性能。
 * <p>
 * 几何体可以使用 {@link GeometryPipeline} 中的函数进行变换和优化。
 * </p>
 *
 * @alias Geometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {GeometryAttributes} options.attributes 组成几何体顶点的属性。
 * @param {PrimitiveType} [options.primitiveType=PrimitiveType.TRIANGLES] 几何体中图元的类型。
 * @param {Uint16Array|Uint32Array} [options.indices] 可选的索引数据，确定几何体中的图元。
 * @param {BoundingSphere} [options.boundingSphere] 一个可选的包围球，完全包围几何体。
 *
 * @see PolygonGeometry
 * @see RectangleGeometry
 * @see EllipseGeometry
 * @see CircleGeometry
 * @see WallGeometry
 * @see SimplePolylineGeometry
 * @see BoxGeometry
 * @see EllipsoidGeometry
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Geometry%20and%20Appearances.html|Geometry and Appearances Demo}
 *
 * @example
 * // Create geometry with a position attribute and indexed lines.
 * const positions = new Float64Array([
 *   0.0, 0.0, 0.0,
 *   7500000.0, 0.0, 0.0,
 *   0.0, 7500000.0, 0.0
 * ]);
 *
 * const geometry = new Cesium.Geometry({
 *   attributes : {
 *     position : new Cesium.GeometryAttribute({
 *       componentDatatype : Cesium.ComponentDatatype.DOUBLE,
 *       componentsPerAttribute : 3,
 *       values : positions
 *     })
 *   },
 *   indices : new Uint16Array([0, 1, 1, 2, 2, 0]),
 *   primitiveType : Cesium.PrimitiveType.LINES,
 *   boundingSphere : Cesium.BoundingSphere.fromVertices(positions)
 * });
 */
function Geometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.attributes", options.attributes);
  //>>includeEnd('debug');

  /**
   * 属性，构成几何体的顶点。此对象中的每个属性对应于一个
   * {@link GeometryAttribute}，包含属性的数据。
   * <p>
   * 属性始终以非交错的方式存储在几何体中。
   * </p>
   * <p>
   * 有一些保留的属性名称具有众所周知的语义。以下属性
   * 是由几何体创建的（具体取决于提供的 {@link VertexFormat}）。
   * <ul>
   *    <li><code>position</code> - 3D 顶点位置。64位浮点数（为了精确）。每个属性3个分量。参见 {@link VertexFormat#position}。</li>
   *    <li><code>normal</code> - 法线（归一化），通常用于光照。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#normal}。</li>
   *    <li><code>st</code> - 2D 纹理坐标。32位浮点数。每个属性2个分量。参见 {@link VertexFormat#st}。</li>
   *    <li><code>bitangent</code> - 切向（归一化），用于切线空间效果，如凹凸映射。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#bitangent}。</li>
   *    <li><code>tangent</code> - 切线（归一化），用于切线空间效果，如凹凸映射。32位浮点数。每个属性3个分量。参见 {@link VertexFormat#tangent}。</li>
   * </ul>
   * </p>
   * <p>
   * 以下属性名称通常不是由几何体创建的，而是由
   * {@link Primitive} 或 {@link GeometryPipeline} 函数添加到几何体中，以准备
   * 准备渲染。
   * <ul>
   *    <li><code>position3DHigh</code> - 由 {@link GeometryPipeline.encodeAttribute} 计算的编码64位位置的高32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position3DLow</code> - 由 {@link GeometryPipeline.encodeAttribute} 计算的编码64位位置的低32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position2DHigh</code> - 由 {@link GeometryPipeline.encodeAttribute} 计算的编码64位2D（哥伦布视图）位置的高32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>position2DLow</code> - 由 {@link GeometryPipeline.encodeAttribute} 计算的编码64位2D（哥伦布视图）位置的低32位。32位浮点数。每个属性4个分量。</li>
   *    <li><code>color</code> - RGBA 颜色（归一化），通常来自 {@link GeometryInstance#color}。32位浮点数。每个属性4个分量。</li>
   *    <li><code>pickColor</code> - 用于拾取的 RGBA 颜色。32位浮点数。每个属性4个分量。</li>
   * </ul>
   * </p>
   *
   * @type GeometryAttributes
   *
   *
   * @example
   * geometry.attributes.position = new Cesium.GeometryAttribute({
   *   componentDatatype : Cesium.ComponentDatatype.FLOAT,
   *   componentsPerAttribute : 3,
   *   values : new Float32Array(0)
   * });
   *
   * @see GeometryAttribute
   * @see VertexFormat
   */
  this.attributes = options.attributes;

  /**
   * 可选的索引数据 - 以及 {@link Geometry#primitiveType} -
   * 决定几何体中的图元。
   *
   * @type {Array|undefined}
   *
   * @default undefined
   */

  this.indices = options.indices;

  /**
   * 几何体中图元的类型。通常是 {@link PrimitiveType.TRIANGLES}，
   * 但根据特定几何体可能会有所不同。
   *
   * @type {PrimitiveType|undefined}
   *
   * @default PrimitiveType.TRIANGLES
   */
  this.primitiveType = defaultValue(
    options.primitiveType,
    PrimitiveType.TRIANGLES,
  );

  /**
   * 一个可选的包围球，完全包围几何体。通常用于剔除。
   *
   * @type {BoundingSphere|undefined}
   *
   * @default undefined
   */

  this.boundingSphere = options.boundingSphere;

  /**
   * @private
   */
  this.geometryType = defaultValue(options.geometryType, GeometryType.NONE);

  /**
   * @private
   */
  this.boundingSphereCV = options.boundingSphereCV;

  /**
   * 用于使用 applyOffset 顶点属性计算几何体的包围球
   * @private
   */

  this.offsetAttribute = options.offsetAttribute;
}

/**
 * 计算几何体中的顶点数量。运行时间与每个顶点中的属性数量成线性关系，而不是顶点的数量。
 *
 * @param {Geometry} geometry 几何体。
 * @returns {number} 几何体中的顶点数量。
 *
 * @example
 * const numVertices = Cesium.Geometry.computeNumberOfVertices(geometry);
 */
Geometry.computeNumberOfVertices = function (geometry) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("geometry", geometry);
  //>>includeEnd('debug');

  let numberOfVertices = -1;
  for (const property in geometry.attributes) {
    if (
      geometry.attributes.hasOwnProperty(property) &&
      defined(geometry.attributes[property]) &&
      defined(geometry.attributes[property].values)
    ) {
      const attribute = geometry.attributes[property];
      const num = attribute.values.length / attribute.componentsPerAttribute;
      //>>includeStart('debug', pragmas.debug);
      if (numberOfVertices !== num && numberOfVertices !== -1) {
        throw new DeveloperError(
          "All attribute lists must have the same number of attributes.",
        );
      }
      //>>includeEnd('debug');
      numberOfVertices = num;
    }
  }

  return numberOfVertices;
};

const rectangleCenterScratch = new Cartographic();
const enuCenterScratch = new Cartesian3();
const fixedFrameToEnuScratch = new Matrix4();
const boundingRectanglePointsCartographicScratch = [
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
];
const boundingRectanglePointsEnuScratch = [
  new Cartesian2(),
  new Cartesian2(),
  new Cartesian2(),
];
const points2DScratch = [new Cartesian2(), new Cartesian2(), new Cartesian2()];
const pointEnuScratch = new Cartesian3();
const enuRotationScratch = new Quaternion();
const enuRotationMatrixScratch = new Matrix4();
const rotation2DScratch = new Matrix2();

/**
 * 在使用材质渲染 GroundPrimitives 时重新映射纹理坐标。
 * GroundPrimitive 的纹理坐标经过计算，与地球上的大地坐标系统对齐。
 * 然而，EllipseGeometry、RectangleGeometry 和 PolygonGeometry 都通过不同的策略对每个顶点的纹理坐标进行烘焙旋转。
 *
 * 此方法被 EllipseGeometry 和 PolygonGeometry 用于近似相同的视觉效果。
 * 我们通过计算一个 "变换" 纹理坐标系统并从中计算一组参考点，将旋转和缩放封装起来，
 * 从而可以使用与 2D 中线段的距离将 "大地" 纹理坐标重新映射到 "变换" 系统。
 *
 * 随着覆盖区域的增大，这种近似变得不太准确，特别是在靠近极地的 GroundPrimitives，但对于
 * 大小相当于美国州的多边形和椭圆形通常是合理的。
 *
 * RectangleGeometry 具有该方法的自己版本，使用大地空间作为中介来计算重新映射坐标，
 * 而不是本地 ENU，对于大面积矩形更为准确。
 *
 * @param {Cartesian3[]} positions 描述几何体的位置信息数组
 * @param {number} stRotation 纹理坐标旋转。
 * @param {Ellipsoid} ellipsoid 用于投影和生成局部向量的椭球体。
 * @param {Rectangle} boundingRectangle 包围位置信息的矩形。
 * @returns {number[]} 一个包含 6 个数字的数组，指定 [最小点, u 范围, v 范围] 作为 "大地" 系统中的点。
 * @private
 */

Geometry._textureCoordinateRotationPoints = function (
  positions,
  stRotation,
  ellipsoid,
  boundingRectangle,
) {
  let i;

  // Create a local east-north-up coordinate system centered on the polygon's bounding rectangle.
  // Project the southwest, northwest, and southeast corners of the bounding rectangle into the plane of ENU as 2D points.
  // These are the equivalents of (0,0), (0,1), and (1,0) in the texture coordinate system computed in ShadowVolumeAppearanceFS,
  // aka "ENU texture space."
  const rectangleCenter = Rectangle.center(
    boundingRectangle,
    rectangleCenterScratch,
  );
  const enuCenter = Cartographic.toCartesian(
    rectangleCenter,
    ellipsoid,
    enuCenterScratch,
  );
  const enuToFixedFrame = Transforms.eastNorthUpToFixedFrame(
    enuCenter,
    ellipsoid,
    fixedFrameToEnuScratch,
  );
  const fixedFrameToEnu = Matrix4.inverse(
    enuToFixedFrame,
    fixedFrameToEnuScratch,
  );

  const boundingPointsEnu = boundingRectanglePointsEnuScratch;
  const boundingPointsCarto = boundingRectanglePointsCartographicScratch;

  boundingPointsCarto[0].longitude = boundingRectangle.west;
  boundingPointsCarto[0].latitude = boundingRectangle.south;

  boundingPointsCarto[1].longitude = boundingRectangle.west;
  boundingPointsCarto[1].latitude = boundingRectangle.north;

  boundingPointsCarto[2].longitude = boundingRectangle.east;
  boundingPointsCarto[2].latitude = boundingRectangle.south;

  let posEnu = pointEnuScratch;

  for (i = 0; i < 3; i++) {
    Cartographic.toCartesian(boundingPointsCarto[i], ellipsoid, posEnu);
    posEnu = Matrix4.multiplyByPointAsVector(fixedFrameToEnu, posEnu, posEnu);
    boundingPointsEnu[i].x = posEnu.x;
    boundingPointsEnu[i].y = posEnu.y;
  }

  // Rotate each point in the polygon around the up vector in the ENU by -stRotation and project into ENU as 2D.
  // Compute the bounding box of these rotated points in the 2D ENU plane.
  // Rotate the corners back by stRotation, then compute their equivalents in the ENU texture space using the corners computed earlier.
  const rotation = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -stRotation,
    enuRotationScratch,
  );
  const textureMatrix = Matrix3.fromQuaternion(
    rotation,
    enuRotationMatrixScratch,
  );

  const positionsLength = positions.length;
  let enuMinX = Number.POSITIVE_INFINITY;
  let enuMinY = Number.POSITIVE_INFINITY;
  let enuMaxX = Number.NEGATIVE_INFINITY;
  let enuMaxY = Number.NEGATIVE_INFINITY;
  for (i = 0; i < positionsLength; i++) {
    posEnu = Matrix4.multiplyByPointAsVector(
      fixedFrameToEnu,
      positions[i],
      posEnu,
    );
    posEnu = Matrix3.multiplyByVector(textureMatrix, posEnu, posEnu);

    enuMinX = Math.min(enuMinX, posEnu.x);
    enuMinY = Math.min(enuMinY, posEnu.y);
    enuMaxX = Math.max(enuMaxX, posEnu.x);
    enuMaxY = Math.max(enuMaxY, posEnu.y);
  }

  const toDesiredInComputed = Matrix2.fromRotation(
    stRotation,
    rotation2DScratch,
  );

  const points2D = points2DScratch;
  points2D[0].x = enuMinX;
  points2D[0].y = enuMinY;

  points2D[1].x = enuMinX;
  points2D[1].y = enuMaxY;

  points2D[2].x = enuMaxX;
  points2D[2].y = enuMinY;

  const boundingEnuMin = boundingPointsEnu[0];
  const boundingPointsWidth = boundingPointsEnu[2].x - boundingEnuMin.x;
  const boundingPointsHeight = boundingPointsEnu[1].y - boundingEnuMin.y;

  for (i = 0; i < 3; i++) {
    const point2D = points2D[i];
    // rotate back
    Matrix2.multiplyByVector(toDesiredInComputed, point2D, point2D);

    // Convert point into east-north texture coordinate space
    point2D.x = (point2D.x - boundingEnuMin.x) / boundingPointsWidth;
    point2D.y = (point2D.y - boundingEnuMin.y) / boundingPointsHeight;
  }

  const minXYCorner = points2D[0];
  const maxYCorner = points2D[1];
  const maxXCorner = points2D[2];
  const result = new Array(6);
  Cartesian2.pack(minXYCorner, result);
  Cartesian2.pack(maxYCorner, result, 2);
  Cartesian2.pack(maxXCorner, result, 4);

  return result;
};
export default Geometry;
