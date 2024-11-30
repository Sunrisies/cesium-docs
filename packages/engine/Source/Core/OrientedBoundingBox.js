import BoundingSphere from "./BoundingSphere.js";
import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import EllipsoidTangentPlane from "./EllipsoidTangentPlane.js";
import Intersect from "./Intersect.js";
import Interval from "./Interval.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import Plane from "./Plane.js";
import Rectangle from "./Rectangle.js";

/**
 * 创建一个定向包围盒的实例。
 * 某个对象的定向包围盒是一个封闭的凸矩形长方体。在许多情况下，它比 {@link BoundingSphere} 或 {@link AxisAlignedBoundingBox} 提供更紧密的包围体积。
 * @alias OrientedBoundingBox
 * @constructor
 *
 * @param {Cartesian3} [center=Cartesian3.ZERO] 盒子的中心。
 * @param {Matrix3} [halfAxes=Matrix3.ZERO] 包围盒的三个正交半轴。
 *                                          等效于变换矩阵，用于旋转和缩放一个以原点为中心的 2x2x2
 *                                          立方体。
 *
 * @example
 * // Create an OrientedBoundingBox using a transformation matrix, a position where the box will be translated, and a scale.
 * const center = new Cesium.Cartesian3(1.0, 0.0, 0.0);
 * const halfAxes = Cesium.Matrix3.fromScale(new Cesium.Cartesian3(1.0, 3.0, 2.0), new Cesium.Matrix3());
 *
 * const obb = new Cesium.OrientedBoundingBox(center, halfAxes);
 *
 * @see BoundingSphere
 * @see BoundingRectangle
 */
function OrientedBoundingBox(center, halfAxes) {
  /**
   * 盒子的中心。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */
  this.center = Cartesian3.clone(defaultValue(center, Cartesian3.ZERO));
  /**
   * 包围盒的三个正交半轴。等效于变换矩阵，用于旋转和缩放一个以原点为中心的
   * 2x2x2 立方体。
   * @type {Matrix3}
   * @default {@link Matrix3.ZERO}
   */
  this.halfAxes = Matrix3.clone(defaultValue(halfAxes, Matrix3.ZERO));
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
OrientedBoundingBox.packedLength =
  Cartesian3.packedLength + Matrix3.packedLength;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {OrientedBoundingBox} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
OrientedBoundingBox.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  Cartesian3.pack(value.center, array, startingIndex);
  Matrix3.pack(value.halfAxes, array, startingIndex + Cartesian3.packedLength);

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的 OrientedBoundingBox 实例。
 */

OrientedBoundingBox.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  Cartesian3.unpack(array, startingIndex, result.center);
  Matrix3.unpack(
    array,
    startingIndex + Cartesian3.packedLength,
    result.halfAxes,
  );
  return result;
};

const scratchCartesian1 = new Cartesian3();
const scratchCartesian2 = new Cartesian3();
const scratchCartesian3 = new Cartesian3();
const scratchCartesian4 = new Cartesian3();
const scratchCartesian5 = new Cartesian3();
const scratchCartesian6 = new Cartesian3();
const scratchCovarianceResult = new Matrix3();
const scratchEigenResult = {
  unitary: new Matrix3(),
  diagonal: new Matrix3(),
};

/**
 * 计算给定位置的定向包围盒实例。
 * 这是 Stefan Gottschalk 使用定向包围盒解决方案实现的碰撞查询（PHD 论文）。
 * 参考文献: http://gamma.cs.unc.edu/users/gottschalk/main.pdf
 *
 * @param {Cartesian3[]} [positions] 要包围的 {@link Cartesian3} 点的列表。
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的 OrientedBoundingBox 实例。
 *
 * @example
 * // Compute an object oriented bounding box enclosing two points.
 * const box = Cesium.OrientedBoundingBox.fromPoints([new Cesium.Cartesian3(2, 0, 0), new Cesium.Cartesian3(-2, 0, 0)]);
 */
OrientedBoundingBox.fromPoints = function (positions, result) {
  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  if (!defined(positions) || positions.length === 0) {
    result.halfAxes = Matrix3.ZERO;
    result.center = Cartesian3.ZERO;
    return result;
  }

  let i;
  const length = positions.length;

  const meanPoint = Cartesian3.clone(positions[0], scratchCartesian1);
  for (i = 1; i < length; i++) {
    Cartesian3.add(meanPoint, positions[i], meanPoint);
  }
  const invLength = 1.0 / length;
  Cartesian3.multiplyByScalar(meanPoint, invLength, meanPoint);

  let exx = 0.0;
  let exy = 0.0;
  let exz = 0.0;
  let eyy = 0.0;
  let eyz = 0.0;
  let ezz = 0.0;
  let p;

  for (i = 0; i < length; i++) {
    p = Cartesian3.subtract(positions[i], meanPoint, scratchCartesian2);
    exx += p.x * p.x;
    exy += p.x * p.y;
    exz += p.x * p.z;
    eyy += p.y * p.y;
    eyz += p.y * p.z;
    ezz += p.z * p.z;
  }

  exx *= invLength;
  exy *= invLength;
  exz *= invLength;
  eyy *= invLength;
  eyz *= invLength;
  ezz *= invLength;

  const covarianceMatrix = scratchCovarianceResult;
  covarianceMatrix[0] = exx;
  covarianceMatrix[1] = exy;
  covarianceMatrix[2] = exz;
  covarianceMatrix[3] = exy;
  covarianceMatrix[4] = eyy;
  covarianceMatrix[5] = eyz;
  covarianceMatrix[6] = exz;
  covarianceMatrix[7] = eyz;
  covarianceMatrix[8] = ezz;

  const eigenDecomposition = Matrix3.computeEigenDecomposition(
    covarianceMatrix,
    scratchEigenResult,
  );
  const rotation = Matrix3.clone(eigenDecomposition.unitary, result.halfAxes);

  let v1 = Matrix3.getColumn(rotation, 0, scratchCartesian4);
  let v2 = Matrix3.getColumn(rotation, 1, scratchCartesian5);
  let v3 = Matrix3.getColumn(rotation, 2, scratchCartesian6);

  let u1 = -Number.MAX_VALUE;
  let u2 = -Number.MAX_VALUE;
  let u3 = -Number.MAX_VALUE;
  let l1 = Number.MAX_VALUE;
  let l2 = Number.MAX_VALUE;
  let l3 = Number.MAX_VALUE;

  for (i = 0; i < length; i++) {
    p = positions[i];
    u1 = Math.max(Cartesian3.dot(v1, p), u1);
    u2 = Math.max(Cartesian3.dot(v2, p), u2);
    u3 = Math.max(Cartesian3.dot(v3, p), u3);

    l1 = Math.min(Cartesian3.dot(v1, p), l1);
    l2 = Math.min(Cartesian3.dot(v2, p), l2);
    l3 = Math.min(Cartesian3.dot(v3, p), l3);
  }

  v1 = Cartesian3.multiplyByScalar(v1, 0.5 * (l1 + u1), v1);
  v2 = Cartesian3.multiplyByScalar(v2, 0.5 * (l2 + u2), v2);
  v3 = Cartesian3.multiplyByScalar(v3, 0.5 * (l3 + u3), v3);

  const center = Cartesian3.add(v1, v2, result.center);
  Cartesian3.add(center, v3, center);

  const scale = scratchCartesian3;
  scale.x = u1 - l1;
  scale.y = u2 - l2;
  scale.z = u3 - l3;
  Cartesian3.multiplyByScalar(scale, 0.5, scale);
  Matrix3.multiplyByScale(result.halfAxes, scale, result.halfAxes);

  return result;
};

const scratchOffset = new Cartesian3();
const scratchScale = new Cartesian3();
function fromPlaneExtents(
  planeOrigin,
  planeXAxis,
  planeYAxis,
  planeZAxis,
  minimumX,
  maximumX,
  minimumY,
  maximumY,
  minimumZ,
  maximumZ,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(minimumX) ||
    !defined(maximumX) ||
    !defined(minimumY) ||
    !defined(maximumY) ||
    !defined(minimumZ) ||
    !defined(maximumZ)
  ) {
    throw new DeveloperError(
      "all extents (minimum/maximum X/Y/Z) are required.",
    );
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  const halfAxes = result.halfAxes;
  Matrix3.setColumn(halfAxes, 0, planeXAxis, halfAxes);
  Matrix3.setColumn(halfAxes, 1, planeYAxis, halfAxes);
  Matrix3.setColumn(halfAxes, 2, planeZAxis, halfAxes);

  let centerOffset = scratchOffset;
  centerOffset.x = (minimumX + maximumX) / 2.0;
  centerOffset.y = (minimumY + maximumY) / 2.0;
  centerOffset.z = (minimumZ + maximumZ) / 2.0;

  const scale = scratchScale;
  scale.x = (maximumX - minimumX) / 2.0;
  scale.y = (maximumY - minimumY) / 2.0;
  scale.z = (maximumZ - minimumZ) / 2.0;

  const center = result.center;
  centerOffset = Matrix3.multiplyByVector(halfAxes, centerOffset, centerOffset);
  Cartesian3.add(planeOrigin, centerOffset, center);
  Matrix3.multiplyByScale(halfAxes, scale, halfAxes);

  return result;
}

const scratchRectangleCenterCartographic = new Cartographic();
const scratchRectangleCenter = new Cartesian3();
const scratchPerimeterCartographicNC = new Cartographic();
const scratchPerimeterCartographicNW = new Cartographic();
const scratchPerimeterCartographicCW = new Cartographic();
const scratchPerimeterCartographicSW = new Cartographic();
const scratchPerimeterCartographicSC = new Cartographic();
const scratchPerimeterCartesianNC = new Cartesian3();
const scratchPerimeterCartesianNW = new Cartesian3();
const scratchPerimeterCartesianCW = new Cartesian3();
const scratchPerimeterCartesianSW = new Cartesian3();
const scratchPerimeterCartesianSC = new Cartesian3();
const scratchPerimeterProjectedNC = new Cartesian2();
const scratchPerimeterProjectedNW = new Cartesian2();
const scratchPerimeterProjectedCW = new Cartesian2();
const scratchPerimeterProjectedSW = new Cartesian2();
const scratchPerimeterProjectedSC = new Cartesian2();

const scratchPlaneOrigin = new Cartesian3();
const scratchPlaneNormal = new Cartesian3();
const scratchPlaneXAxis = new Cartesian3();
const scratchHorizonCartesian = new Cartesian3();
const scratchHorizonProjected = new Cartesian2();
const scratchMaxY = new Cartesian3();
const scratchMinY = new Cartesian3();
const scratchZ = new Cartesian3();
const scratchPlane = new Plane(Cartesian3.UNIT_X, 0.0);

/**
 * 计算一个定向包围盒，该盒子包围 {@link Ellipsoid} 表面上的 {@link Rectangle}。
 * 对于包围盒的方向没有任何保证。
 *
 * @param {Rectangle} rectangle 椭球表面上的地图矩形。
 * @param {number} [minimumHeight=0.0] 瓦片内的最低高度（海拔）。
 * @param {number} [maximumHeight=0.0] 瓦片内的最高高度（海拔）。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 定义矩形的椭球体。
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的 OrientedBoundingBox 实例。
 *
 * @exception {DeveloperError} rectangle.width 必须在 0 和 2 * pi 之间。
 * @exception {DeveloperError} rectangle.height 必须在 0 和 pi 之间。
 * @exception {DeveloperError} ellipsoid 必须是旋转椭球体（<code>radii.x == radii.y</code>）。
 */

OrientedBoundingBox.fromRectangle = function (
  rectangle,
  minimumHeight,
  maximumHeight,
  ellipsoid,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(rectangle)) {
    throw new DeveloperError("rectangle is required");
  }
  if (rectangle.width < 0.0 || rectangle.width > CesiumMath.TWO_PI) {
    throw new DeveloperError("Rectangle width must be between 0 and 2 * pi");
  }
  if (rectangle.height < 0.0 || rectangle.height > CesiumMath.PI) {
    throw new DeveloperError("Rectangle height must be between 0 and pi");
  }
  if (
    defined(ellipsoid) &&
    !CesiumMath.equalsEpsilon(
      ellipsoid.radii.x,
      ellipsoid.radii.y,
      CesiumMath.EPSILON15,
    )
  ) {
    throw new DeveloperError(
      "Ellipsoid must be an ellipsoid of revolution (radii.x == radii.y)",
    );
  }
  //>>includeEnd('debug');

  minimumHeight = defaultValue(minimumHeight, 0.0);
  maximumHeight = defaultValue(maximumHeight, 0.0);
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

  let minX, maxX, minY, maxY, minZ, maxZ, plane;

  if (rectangle.width <= CesiumMath.PI) {
    // The bounding box will be aligned with the tangent plane at the center of the rectangle.
    const tangentPointCartographic = Rectangle.center(
      rectangle,
      scratchRectangleCenterCartographic,
    );
    const tangentPoint = ellipsoid.cartographicToCartesian(
      tangentPointCartographic,
      scratchRectangleCenter,
    );
    const tangentPlane = new EllipsoidTangentPlane(tangentPoint, ellipsoid);
    plane = tangentPlane.plane;

    // If the rectangle spans the equator, CW is instead aligned with the equator (because it sticks out the farthest at the equator).
    const lonCenter = tangentPointCartographic.longitude;
    const latCenter =
      rectangle.south < 0.0 && rectangle.north > 0.0
        ? 0.0
        : tangentPointCartographic.latitude;

    // Compute XY extents using the rectangle at maximum height
    const perimeterCartographicNC = Cartographic.fromRadians(
      lonCenter,
      rectangle.north,
      maximumHeight,
      scratchPerimeterCartographicNC,
    );
    const perimeterCartographicNW = Cartographic.fromRadians(
      rectangle.west,
      rectangle.north,
      maximumHeight,
      scratchPerimeterCartographicNW,
    );
    const perimeterCartographicCW = Cartographic.fromRadians(
      rectangle.west,
      latCenter,
      maximumHeight,
      scratchPerimeterCartographicCW,
    );
    const perimeterCartographicSW = Cartographic.fromRadians(
      rectangle.west,
      rectangle.south,
      maximumHeight,
      scratchPerimeterCartographicSW,
    );
    const perimeterCartographicSC = Cartographic.fromRadians(
      lonCenter,
      rectangle.south,
      maximumHeight,
      scratchPerimeterCartographicSC,
    );

    const perimeterCartesianNC = ellipsoid.cartographicToCartesian(
      perimeterCartographicNC,
      scratchPerimeterCartesianNC,
    );
    let perimeterCartesianNW = ellipsoid.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW,
    );
    const perimeterCartesianCW = ellipsoid.cartographicToCartesian(
      perimeterCartographicCW,
      scratchPerimeterCartesianCW,
    );
    let perimeterCartesianSW = ellipsoid.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW,
    );
    const perimeterCartesianSC = ellipsoid.cartographicToCartesian(
      perimeterCartographicSC,
      scratchPerimeterCartesianSC,
    );

    const perimeterProjectedNC = tangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianNC,
      scratchPerimeterProjectedNC,
    );
    const perimeterProjectedNW = tangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianNW,
      scratchPerimeterProjectedNW,
    );
    const perimeterProjectedCW = tangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianCW,
      scratchPerimeterProjectedCW,
    );
    const perimeterProjectedSW = tangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianSW,
      scratchPerimeterProjectedSW,
    );
    const perimeterProjectedSC = tangentPlane.projectPointToNearestOnPlane(
      perimeterCartesianSC,
      scratchPerimeterProjectedSC,
    );

    minX = Math.min(
      perimeterProjectedNW.x,
      perimeterProjectedCW.x,
      perimeterProjectedSW.x,
    );
    maxX = -minX; // symmetrical

    maxY = Math.max(perimeterProjectedNW.y, perimeterProjectedNC.y);
    minY = Math.min(perimeterProjectedSW.y, perimeterProjectedSC.y);

    // Compute minimum Z using the rectangle at minimum height, since it will be deeper than the maximum height
    perimeterCartographicNW.height = perimeterCartographicSW.height =
      minimumHeight;
    perimeterCartesianNW = ellipsoid.cartographicToCartesian(
      perimeterCartographicNW,
      scratchPerimeterCartesianNW,
    );
    perimeterCartesianSW = ellipsoid.cartographicToCartesian(
      perimeterCartographicSW,
      scratchPerimeterCartesianSW,
    );

    minZ = Math.min(
      Plane.getPointDistance(plane, perimeterCartesianNW),
      Plane.getPointDistance(plane, perimeterCartesianSW),
    );
    maxZ = maximumHeight; // Since the tangent plane touches the surface at height = 0, this is okay

    return fromPlaneExtents(
      tangentPlane.origin,
      tangentPlane.xAxis,
      tangentPlane.yAxis,
      tangentPlane.zAxis,
      minX,
      maxX,
      minY,
      maxY,
      minZ,
      maxZ,
      result,
    );
  }

  // Handle the case where rectangle width is greater than PI (wraps around more than half the ellipsoid).
  const fullyAboveEquator = rectangle.south > 0.0;
  const fullyBelowEquator = rectangle.north < 0.0;
  const latitudeNearestToEquator = fullyAboveEquator
    ? rectangle.south
    : fullyBelowEquator
      ? rectangle.north
      : 0.0;
  const centerLongitude = Rectangle.center(
    rectangle,
    scratchRectangleCenterCartographic,
  ).longitude;

  // Plane is located at the rectangle's center longitude and the rectangle's latitude that is closest to the equator. It rotates around the Z axis.
  // This results in a better fit than the obb approach for smaller rectangles, which orients with the rectangle's center normal.
  const planeOrigin = Cartesian3.fromRadians(
    centerLongitude,
    latitudeNearestToEquator,
    maximumHeight,
    ellipsoid,
    scratchPlaneOrigin,
  );
  planeOrigin.z = 0.0; // center the plane on the equator to simpify plane normal calculation
  const isPole =
    Math.abs(planeOrigin.x) < CesiumMath.EPSILON10 &&
    Math.abs(planeOrigin.y) < CesiumMath.EPSILON10;
  const planeNormal = !isPole
    ? Cartesian3.normalize(planeOrigin, scratchPlaneNormal)
    : Cartesian3.UNIT_X;
  const planeYAxis = Cartesian3.UNIT_Z;
  const planeXAxis = Cartesian3.cross(
    planeNormal,
    planeYAxis,
    scratchPlaneXAxis,
  );
  plane = Plane.fromPointNormal(planeOrigin, planeNormal, scratchPlane);

  // Get the horizon point relative to the center. This will be the farthest extent in the plane's X dimension.
  const horizonCartesian = Cartesian3.fromRadians(
    centerLongitude + CesiumMath.PI_OVER_TWO,
    latitudeNearestToEquator,
    maximumHeight,
    ellipsoid,
    scratchHorizonCartesian,
  );
  maxX = Cartesian3.dot(
    Plane.projectPointOntoPlane(
      plane,
      horizonCartesian,
      scratchHorizonProjected,
    ),
    planeXAxis,
  );
  minX = -maxX; // symmetrical

  // Get the min and max Y, using the height that will give the largest extent
  maxY = Cartesian3.fromRadians(
    0.0,
    rectangle.north,
    fullyBelowEquator ? minimumHeight : maximumHeight,
    ellipsoid,
    scratchMaxY,
  ).z;
  minY = Cartesian3.fromRadians(
    0.0,
    rectangle.south,
    fullyAboveEquator ? minimumHeight : maximumHeight,
    ellipsoid,
    scratchMinY,
  ).z;

  const farZ = Cartesian3.fromRadians(
    rectangle.east,
    latitudeNearestToEquator,
    maximumHeight,
    ellipsoid,
    scratchZ,
  );
  minZ = Plane.getPointDistance(plane, farZ);
  maxZ = 0.0; // plane origin starts at maxZ already

  // min and max are local to the plane axes
  return fromPlaneExtents(
    planeOrigin,
    planeXAxis,
    planeYAxis,
    planeNormal,
    minX,
    maxX,
    minY,
    maxY,
    minZ,
    maxZ,
    result,
  );
};
/**
 * 计算一个定向包围盒，该盒子包围一个仿射变换。
 *
 * @param {Matrix4} transformation 仿射变换。
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的 OrientedBoundingBox 实例。
 */

OrientedBoundingBox.fromTransformation = function (transformation, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("transformation", transformation);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new OrientedBoundingBox();
  }

  result.center = Matrix4.getTranslation(transformation, result.center);
  result.halfAxes = Matrix4.getMatrix3(transformation, result.halfAxes);
  result.halfAxes = Matrix3.multiplyByScalar(
    result.halfAxes,
    0.5,
    result.halfAxes,
  );
  return result;
};

/**
 * 复制一个定向包围盒实例。
 *
 * @param {OrientedBoundingBox} box 要复制的包围盒。
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的 OrientedBoundingBox 实例。（如果 box 为未定义，则返回 undefined）
 */

OrientedBoundingBox.clone = function (box, result) {
  if (!defined(box)) {
    return undefined;
  }

  if (!defined(result)) {
    return new OrientedBoundingBox(box.center, box.halfAxes);
  }

  Cartesian3.clone(box.center, result.center);
  Matrix3.clone(box.halfAxes, result.halfAxes);

  return result;
};
/**
 * 确定定向包围盒位于平面的哪一侧。
 *
 * @param {OrientedBoundingBox} box 要测试的定向包围盒。
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个包围盒在平面法线指向的一侧，则返回 {@link Intersect.INSIDE}；
 *                      如果整个包围盒在相反的一侧，则返回 {@link Intersect.OUTSIDE}；
 *                      如果包围盒与平面相交，则返回 {@link Intersect.INTERSECTING}。
 */

OrientedBoundingBox.intersectPlane = function (box, plane) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(box)) {
    throw new DeveloperError("box is required.");
  }

  if (!defined(plane)) {
    throw new DeveloperError("plane is required.");
  }
  //>>includeEnd('debug');

  const center = box.center;
  const normal = plane.normal;
  const halfAxes = box.halfAxes;
  const normalX = normal.x,
    normalY = normal.y,
    normalZ = normal.z;
  // plane is used as if it is its normal; the first three components are assumed to be normalized
  const radEffective =
    Math.abs(
      normalX * halfAxes[Matrix3.COLUMN0ROW0] +
        normalY * halfAxes[Matrix3.COLUMN0ROW1] +
        normalZ * halfAxes[Matrix3.COLUMN0ROW2],
    ) +
    Math.abs(
      normalX * halfAxes[Matrix3.COLUMN1ROW0] +
        normalY * halfAxes[Matrix3.COLUMN1ROW1] +
        normalZ * halfAxes[Matrix3.COLUMN1ROW2],
    ) +
    Math.abs(
      normalX * halfAxes[Matrix3.COLUMN2ROW0] +
        normalY * halfAxes[Matrix3.COLUMN2ROW1] +
        normalZ * halfAxes[Matrix3.COLUMN2ROW2],
    );
  const distanceToPlane = Cartesian3.dot(normal, center) + plane.distance;

  if (distanceToPlane <= -radEffective) {
    // The entire box is on the negative side of the plane normal
    return Intersect.OUTSIDE;
  } else if (distanceToPlane >= radEffective) {
    // The entire box is on the positive side of the plane normal
    return Intersect.INSIDE;
  }
  return Intersect.INTERSECTING;
};

const scratchCartesianU = new Cartesian3();
const scratchCartesianV = new Cartesian3();
const scratchCartesianW = new Cartesian3();
const scratchValidAxis2 = new Cartesian3();
const scratchValidAxis3 = new Cartesian3();
const scratchPPrime = new Cartesian3();

/**
 * 计算从包围盒上最近点到某一点的估计平方距离。
 *
 * @param {OrientedBoundingBox} box 包围盒。
 * @param {Cartesian3} cartesian 点。
 * @returns {number} 从定向包围盒到该点的平方距离。如果该点在包围盒内，则返回 0。
 *
 * @example
 * // Sort bounding boxes from back to front
 * boxes.sort(function(a, b) {
 *     return Cesium.OrientedBoundingBox.distanceSquaredTo(b, camera.positionWC) - Cesium.OrientedBoundingBox.distanceSquaredTo(a, camera.positionWC);
 * });
 */
OrientedBoundingBox.distanceSquaredTo = function (box, cartesian) {
  // See Geometric Tools for Computer Graphics 10.4.2

  //>>includeStart('debug', pragmas.debug);
  if (!defined(box)) {
    throw new DeveloperError("box is required.");
  }
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  const offset = Cartesian3.subtract(cartesian, box.center, scratchOffset);

  const halfAxes = box.halfAxes;
  let u = Matrix3.getColumn(halfAxes, 0, scratchCartesianU);
  let v = Matrix3.getColumn(halfAxes, 1, scratchCartesianV);
  let w = Matrix3.getColumn(halfAxes, 2, scratchCartesianW);

  const uHalf = Cartesian3.magnitude(u);
  const vHalf = Cartesian3.magnitude(v);
  const wHalf = Cartesian3.magnitude(w);

  let uValid = true;
  let vValid = true;
  let wValid = true;

  if (uHalf > 0) {
    Cartesian3.divideByScalar(u, uHalf, u);
  } else {
    uValid = false;
  }

  if (vHalf > 0) {
    Cartesian3.divideByScalar(v, vHalf, v);
  } else {
    vValid = false;
  }

  if (wHalf > 0) {
    Cartesian3.divideByScalar(w, wHalf, w);
  } else {
    wValid = false;
  }

  const numberOfDegenerateAxes = !uValid + !vValid + !wValid;
  let validAxis1;
  let validAxis2;
  let validAxis3;

  if (numberOfDegenerateAxes === 1) {
    let degenerateAxis = u;
    validAxis1 = v;
    validAxis2 = w;
    if (!vValid) {
      degenerateAxis = v;
      validAxis1 = u;
    } else if (!wValid) {
      degenerateAxis = w;
      validAxis2 = u;
    }

    validAxis3 = Cartesian3.cross(validAxis1, validAxis2, scratchValidAxis3);

    if (degenerateAxis === u) {
      u = validAxis3;
    } else if (degenerateAxis === v) {
      v = validAxis3;
    } else if (degenerateAxis === w) {
      w = validAxis3;
    }
  } else if (numberOfDegenerateAxes === 2) {
    validAxis1 = u;
    if (vValid) {
      validAxis1 = v;
    } else if (wValid) {
      validAxis1 = w;
    }

    let crossVector = Cartesian3.UNIT_Y;
    if (crossVector.equalsEpsilon(validAxis1, CesiumMath.EPSILON3)) {
      crossVector = Cartesian3.UNIT_X;
    }

    validAxis2 = Cartesian3.cross(validAxis1, crossVector, scratchValidAxis2);
    Cartesian3.normalize(validAxis2, validAxis2);
    validAxis3 = Cartesian3.cross(validAxis1, validAxis2, scratchValidAxis3);
    Cartesian3.normalize(validAxis3, validAxis3);

    if (validAxis1 === u) {
      v = validAxis2;
      w = validAxis3;
    } else if (validAxis1 === v) {
      w = validAxis2;
      u = validAxis3;
    } else if (validAxis1 === w) {
      u = validAxis2;
      v = validAxis3;
    }
  } else if (numberOfDegenerateAxes === 3) {
    u = Cartesian3.UNIT_X;
    v = Cartesian3.UNIT_Y;
    w = Cartesian3.UNIT_Z;
  }

  const pPrime = scratchPPrime;
  pPrime.x = Cartesian3.dot(offset, u);
  pPrime.y = Cartesian3.dot(offset, v);
  pPrime.z = Cartesian3.dot(offset, w);

  let distanceSquared = 0.0;
  let d;

  if (pPrime.x < -uHalf) {
    d = pPrime.x + uHalf;
    distanceSquared += d * d;
  } else if (pPrime.x > uHalf) {
    d = pPrime.x - uHalf;
    distanceSquared += d * d;
  }

  if (pPrime.y < -vHalf) {
    d = pPrime.y + vHalf;
    distanceSquared += d * d;
  } else if (pPrime.y > vHalf) {
    d = pPrime.y - vHalf;
    distanceSquared += d * d;
  }

  if (pPrime.z < -wHalf) {
    d = pPrime.z + wHalf;
    distanceSquared += d * d;
  } else if (pPrime.z > wHalf) {
    d = pPrime.z - wHalf;
    distanceSquared += d * d;
  }

  return distanceSquared;
};

const scratchCorner = new Cartesian3();
const scratchToCenter = new Cartesian3();

/**
 * 由从包围盒中心到沿方向投影到位置的向量计算的距离。
 * <br>
 * 如果想象无限多个法向方向的平面，这个计算会得到与包围盒相交的位置最近和最远的平面的最小距离。
 *
 * @param {OrientedBoundingBox} box 要计算距离的包围盒。
 * @param {Cartesian3} position 要计算距离的位置。
 * @param {Cartesian3} direction 从位置指向的方向。
 * @param {Interval} [result] 用于存储最近和最远距离的 Interval。
 * @returns {Interval} 从位置沿方向到包围盒的最近和最远距离。
 */

OrientedBoundingBox.computePlaneDistances = function (
  box,
  position,
  direction,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(box)) {
    throw new DeveloperError("box is required.");
  }

  if (!defined(position)) {
    throw new DeveloperError("position is required.");
  }

  if (!defined(direction)) {
    throw new DeveloperError("direction is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Interval();
  }

  let minDist = Number.POSITIVE_INFINITY;
  let maxDist = Number.NEGATIVE_INFINITY;

  const center = box.center;
  const halfAxes = box.halfAxes;

  const u = Matrix3.getColumn(halfAxes, 0, scratchCartesianU);
  const v = Matrix3.getColumn(halfAxes, 1, scratchCartesianV);
  const w = Matrix3.getColumn(halfAxes, 2, scratchCartesianW);

  // project first corner
  const corner = Cartesian3.add(u, v, scratchCorner);
  Cartesian3.add(corner, w, corner);
  Cartesian3.add(corner, center, corner);

  const toCenter = Cartesian3.subtract(corner, position, scratchToCenter);
  let mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project second corner
  Cartesian3.add(center, u, corner);
  Cartesian3.add(corner, v, corner);
  Cartesian3.subtract(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project third corner
  Cartesian3.add(center, u, corner);
  Cartesian3.subtract(corner, v, corner);
  Cartesian3.add(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project fourth corner
  Cartesian3.add(center, u, corner);
  Cartesian3.subtract(corner, v, corner);
  Cartesian3.subtract(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project fifth corner
  Cartesian3.subtract(center, u, corner);
  Cartesian3.add(corner, v, corner);
  Cartesian3.add(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project sixth corner
  Cartesian3.subtract(center, u, corner);
  Cartesian3.add(corner, v, corner);
  Cartesian3.subtract(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project seventh corner
  Cartesian3.subtract(center, u, corner);
  Cartesian3.subtract(corner, v, corner);
  Cartesian3.add(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  // project eighth corner
  Cartesian3.subtract(center, u, corner);
  Cartesian3.subtract(corner, v, corner);
  Cartesian3.subtract(corner, w, corner);

  Cartesian3.subtract(corner, position, toCenter);
  mag = Cartesian3.dot(direction, toCenter);

  minDist = Math.min(mag, minDist);
  maxDist = Math.max(mag, maxDist);

  result.start = minDist;
  result.stop = maxDist;
  return result;
};

const scratchXAxis = new Cartesian3();
const scratchYAxis = new Cartesian3();
const scratchZAxis = new Cartesian3();

/**
 * 计算定向包围盒的八个顶点。顶点的顺序为 (-X, -Y, -Z)、(-X, -Y, +Z)、(-X, +Y, -Z)、(-X, +Y, +Z)、(+X, -Y, -Z)、(+X, -Y, +Z)、(+X, +Y, -Z)、(+X, +Y, +Z)。
 *
 * @param {OrientedBoundingBox} box 定向包围盒。
 * @param {Cartesian3[]} [result] 用于存储八个 {@link Cartesian3} 实例的数组。
 * @returns {Cartesian3[]} 修改后的结果参数，如果未提供则返回一个新的数组。
 */

OrientedBoundingBox.computeCorners = function (box, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("box", box);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = [
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
      new Cartesian3(),
    ];
  }

  const center = box.center;
  const halfAxes = box.halfAxes;
  const xAxis = Matrix3.getColumn(halfAxes, 0, scratchXAxis);
  const yAxis = Matrix3.getColumn(halfAxes, 1, scratchYAxis);
  const zAxis = Matrix3.getColumn(halfAxes, 2, scratchZAxis);

  Cartesian3.clone(center, result[0]);
  Cartesian3.subtract(result[0], xAxis, result[0]);
  Cartesian3.subtract(result[0], yAxis, result[0]);
  Cartesian3.subtract(result[0], zAxis, result[0]);

  Cartesian3.clone(center, result[1]);
  Cartesian3.subtract(result[1], xAxis, result[1]);
  Cartesian3.subtract(result[1], yAxis, result[1]);
  Cartesian3.add(result[1], zAxis, result[1]);

  Cartesian3.clone(center, result[2]);
  Cartesian3.subtract(result[2], xAxis, result[2]);
  Cartesian3.add(result[2], yAxis, result[2]);
  Cartesian3.subtract(result[2], zAxis, result[2]);

  Cartesian3.clone(center, result[3]);
  Cartesian3.subtract(result[3], xAxis, result[3]);
  Cartesian3.add(result[3], yAxis, result[3]);
  Cartesian3.add(result[3], zAxis, result[3]);

  Cartesian3.clone(center, result[4]);
  Cartesian3.add(result[4], xAxis, result[4]);
  Cartesian3.subtract(result[4], yAxis, result[4]);
  Cartesian3.subtract(result[4], zAxis, result[4]);

  Cartesian3.clone(center, result[5]);
  Cartesian3.add(result[5], xAxis, result[5]);
  Cartesian3.subtract(result[5], yAxis, result[5]);
  Cartesian3.add(result[5], zAxis, result[5]);

  Cartesian3.clone(center, result[6]);
  Cartesian3.add(result[6], xAxis, result[6]);
  Cartesian3.add(result[6], yAxis, result[6]);
  Cartesian3.subtract(result[6], zAxis, result[6]);

  Cartesian3.clone(center, result[7]);
  Cartesian3.add(result[7], xAxis, result[7]);
  Cartesian3.add(result[7], yAxis, result[7]);
  Cartesian3.add(result[7], zAxis, result[7]);

  return result;
};

const scratchRotationScale = new Matrix3();

/**
 * 从定向包围盒计算变换矩阵。
 *
 * @param {OrientedBoundingBox} box 定向包围盒。
 * @param {Matrix4} result 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的 {@link Matrix4} 实例。
 */

OrientedBoundingBox.computeTransformation = function (box, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("box", box);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Matrix4();
  }

  const translation = box.center;
  const rotationScale = Matrix3.multiplyByUniformScale(
    box.halfAxes,
    2.0,
    scratchRotationScale,
  );
  return Matrix4.fromRotationTranslation(rotationScale, translation, result);
};

const scratchBoundingSphere = new BoundingSphere();

/**
 * 确定一个包围盒是否被遮挡器隐藏在视野之外。
 *
 * @param {OrientedBoundingBox} box 包围被遮挡对象的包围盒。
 * @param {Occluder} occluder 遮挡器。
 * @returns {boolean} 如果包围盒不可见，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

OrientedBoundingBox.isOccluded = function (box, occluder) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(box)) {
    throw new DeveloperError("box is required.");
  }
  if (!defined(occluder)) {
    throw new DeveloperError("occluder is required.");
  }
  //>>includeEnd('debug');

  const sphere = BoundingSphere.fromOrientedBoundingBox(
    box,
    scratchBoundingSphere,
  );

  return !occluder.isBoundingSphereVisible(sphere);
};

/**
 * 确定定向包围盒位于平面的哪一侧。
 *
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个包围盒在平面法线指向的一侧，则返回 {@link Intersect.INSIDE}；
 *                      如果整个包围盒在相反的一侧，则返回 {@link Intersect.OUTSIDE}；
 *                      如果包围盒与平面相交，则返回 {@link Intersect.INTERSECTING}。
 */

OrientedBoundingBox.prototype.intersectPlane = function (plane) {
  return OrientedBoundingBox.intersectPlane(this, plane);
};

/**
 * 计算从包围盒上最近点到某一点的估计平方距离。
 *
 * @param {Cartesian3} cartesian 点。
 * @returns {number} 从包围球到该点的估计平方距离。
 *
 * @example
 * // Sort bounding boxes from back to front
 * boxes.sort(function(a, b) {
 *     return b.distanceSquaredTo(camera.positionWC) - a.distanceSquaredTo(camera.positionWC);
 * });
 */
OrientedBoundingBox.prototype.distanceSquaredTo = function (cartesian) {
  return OrientedBoundingBox.distanceSquaredTo(this, cartesian);
};

/**
 * 从包围盒中心到沿方向投影的位置计算出的距离。
 * <br>
 * 如果你想象一个无限数量的法向方向的平面，这将计算与包围盒相交的、离位置最近和最远的平面的最小距离。
 *
 * @param {Cartesian3} position 要计算距离的位置。
 * @param {Cartesian3} direction 从位置出发的方向。
 * @param {Interval} [result] 一个用于存储最近和最远距离的Interval。
 * @returns {Interval} 从位置沿方向到包围盒的最近和最远距离。
 */

OrientedBoundingBox.prototype.computePlaneDistances = function (
  position,
  direction,
  result,
) {
  return OrientedBoundingBox.computePlaneDistances(
    this,
    position,
    direction,
    result,
  );
};

/**
 * 计算定向包围盒的八个角。角的顺序为 (-X, -Y, -Z), (-X, -Y, +Z), (-X, +Y, -Z), (-X, +Y, +Z), (+X, -Y, -Z), (+X, -Y, +Z), (+X, +Y, -Z), (+X, +Y, +Z)。
 *
 * @param {Cartesian3[]} [result] 一个包含八个 {@link Cartesian3} 实例的数组，用于存储角点。
 * @returns {Cartesian3[]} 修改后的结果参数，如果没有提供则返回一个新数组。
 */
OrientedBoundingBox.prototype.computeCorners = function (result) {
  return OrientedBoundingBox.computeCorners(this, result);
};

/**
 * 从定向包围盒计算变换矩阵。
 *
 * @param {Matrix4} result 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果没有提供则返回一个新的 {@link Matrix4} 实例。
 */

OrientedBoundingBox.prototype.computeTransformation = function (result) {
  return OrientedBoundingBox.computeTransformation(this, result);
};

/**
 * 确定一个包围盒是否被遮挡物隐藏。
 *
 * @param {Occluder} occluder 遮挡物。
 * @returns {boolean} 如果球体不可见则返回 <code>true</code>；否则返回 <code>false</code>。
 */
OrientedBoundingBox.prototype.isOccluded = function (occluder) {
  return OrientedBoundingBox.isOccluded(this, occluder);
};

/**
 * 分别比较提供的定向包围盒，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {OrientedBoundingBox} left 第一个定向包围盒。
 * @param {OrientedBoundingBox} right 第二个定向包围盒。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>。
 */

OrientedBoundingBox.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Cartesian3.equals(left.center, right.center) &&
      Matrix3.equals(left.halfAxes, right.halfAxes))
  );
};

/**
 * 复制此定向包围盒实例。
 *
 * @param {OrientedBoundingBox} [result] 存储结果的对象。
 * @returns {OrientedBoundingBox} 修改后的结果参数，如果未提供则返回一个新的定向包围盒实例。
 */
OrientedBoundingBox.prototype.clone = function (result) {
  return OrientedBoundingBox.clone(this, result);
};

/**
 * 将此定向包围盒与提供的定向包围盒逐项比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {OrientedBoundingBox} [right] 右侧的定向包围盒。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */

OrientedBoundingBox.prototype.equals = function (right) {
  return OrientedBoundingBox.equals(this, right);
};
export default OrientedBoundingBox;
