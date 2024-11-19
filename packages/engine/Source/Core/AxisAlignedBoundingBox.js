import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Intersect from "./Intersect.js";

/**
 * 从 x、y 和 z 轴上的最小点和最大点创建一个 AxisAlignedBoundingBox 实例。
 * @alias AxisAlignedBoundingBox
 * @constructor
 *
 * @param {Cartesian3} [minimum=Cartesian3.ZERO] x、y 和 z 轴上的最小点。
 * @param {Cartesian3} [maximum=Cartesian3.ZERO] x、y 和 z 轴上的最大点。
 * @param {Cartesian3} [center] 盒子的中心；如果不提供则自动计算。
 *
 * @see BoundingSphere
 * @see BoundingRectangle
 */

function AxisAlignedBoundingBox(minimum, maximum, center) {
  /**
   * 定义包围盒的最小点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */

  this.minimum = Cartesian3.clone(defaultValue(minimum, Cartesian3.ZERO));

  /**
   * 定义包围盒的最大点。
   * @type {Cartesian3}
   * @default {@link Cartesian3.ZERO}
   */

  this.maximum = Cartesian3.clone(defaultValue(maximum, Cartesian3.ZERO));

  // If center was not defined, compute it.
  if (!defined(center)) {
    center = Cartesian3.midpoint(this.minimum, this.maximum, new Cartesian3());
  } else {
    center = Cartesian3.clone(center);
  }

  /**
   * 包围盒的中心点。
   * @type {Cartesian3}
   */

  this.center = center;
}

/**
 * 从其 corners 创建一个 AxisAlignedBoundingBox 的实例。
 *
 * @param {Cartesian3} minimum x、y 和 z 轴上的最小点。
 * @param {Cartesian3} maximum x、y 和 z 轴上的最大点。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的 result 参数，或如果未提供，则返回一个新的 AxisAlignedBoundingBox 实例。
 *
 * @example
 * // Compute an axis aligned bounding box from the two corners.
 * const box = Cesium.AxisAlignedBoundingBox.fromCorners(new Cesium.Cartesian3(-1, -1, -1), new Cesium.Cartesian3(1, 1, 1));
 */
AxisAlignedBoundingBox.fromCorners = function(minimum, maximum, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("minimum", minimum);
  Check.defined("maximum", maximum);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new AxisAlignedBoundingBox();
  }

  result.minimum = Cartesian3.clone(minimum, result.minimum);
  result.maximum = Cartesian3.clone(maximum, result.maximum);
  result.center = Cartesian3.midpoint(minimum, maximum, result.center);

  return result;
};

/**
 * 计算 AxisAlignedBoundingBox 的实例。盒子通过
 * 找到在 x、y 和 z 轴上最远的点来确定。
 *
 * @param {Cartesian3[]} positions 要被包围的点列表。每个点必须具有 <code>x</code>、<code>y</code> 和 <code>z</code> 属性。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的 result 参数，或如果未提供，则返回一个新的 AxisAlignedBoundingBox 实例。
 *
 * @example
 * // Compute an axis aligned bounding box enclosing two points.
 * const box = Cesium.AxisAlignedBoundingBox.fromPoints([new Cesium.Cartesian3(2, 0, 0), new Cesium.Cartesian3(-2, 0, 0)]);
 */
AxisAlignedBoundingBox.fromPoints = function(positions, result) {
  if (!defined(result)) {
    result = new AxisAlignedBoundingBox();
  }

  if (!defined(positions) || positions.length === 0) {
    result.minimum = Cartesian3.clone(Cartesian3.ZERO, result.minimum);
    result.maximum = Cartesian3.clone(Cartesian3.ZERO, result.maximum);
    result.center = Cartesian3.clone(Cartesian3.ZERO, result.center);
    return result;
  }

  let minimumX = positions[0].x;
  let minimumY = positions[0].y;
  let minimumZ = positions[0].z;

  let maximumX = positions[0].x;
  let maximumY = positions[0].y;
  let maximumZ = positions[0].z;

  const length = positions.length;
  for (let i = 1; i < length; i++) {
    const p = positions[i];
    const x = p.x;
    const y = p.y;
    const z = p.z;

    minimumX = Math.min(x, minimumX);
    maximumX = Math.max(x, maximumX);
    minimumY = Math.min(y, minimumY);
    maximumY = Math.max(y, maximumY);
    minimumZ = Math.min(z, minimumZ);
    maximumZ = Math.max(z, maximumZ);
  }

  const minimum = result.minimum;
  minimum.x = minimumX;
  minimum.y = minimumY;
  minimum.z = minimumZ;

  const maximum = result.maximum;
  maximum.x = maximumX;
  maximum.y = maximumY;
  maximum.z = maximumZ;

  result.center = Cartesian3.midpoint(minimum, maximum, result.center);

  return result;
};

/**
 * 复制一个 AxisAlignedBoundingBox 实例。
 *
 * @param {AxisAlignedBoundingBox} box 要复制的包围盒。
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的 result 参数，或如果未提供，则返回一个新的 AxisAlignedBoundingBox 实例。（如果 box 为 undefined，则返回 undefined）
 */

AxisAlignedBoundingBox.clone = function(box, result) {
  if (!defined(box)) {
    return undefined;
  }

  if (!defined(result)) {
    return new AxisAlignedBoundingBox(box.minimum, box.maximum, box.center);
  }

  result.minimum = Cartesian3.clone(box.minimum, result.minimum);
  result.maximum = Cartesian3.clone(box.maximum, result.maximum);
  result.center = Cartesian3.clone(box.center, result.center);
  return result;
};

/**
 * 逐组件比较提供的 AxisAlignedBoundingBox，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {AxisAlignedBoundingBox} [left] 第一个 AxisAlignedBoundingBox。
 * @param {AxisAlignedBoundingBox} [right] 第二个 AxisAlignedBoundingBox。
 * @returns {boolean} 如果左右相等，则 <code>true</code>，否则 <code>false</code>
 */

AxisAlignedBoundingBox.equals = function(left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Cartesian3.equals(left.center, right.center) &&
      Cartesian3.equals(left.minimum, right.minimum) &&
      Cartesian3.equals(left.maximum, right.maximum))
  );
};

let intersectScratch = new Cartesian3();
/**
 * 确定一个盒子位于平面的哪一侧。
 *
 * @param {AxisAlignedBoundingBox} box 要测试的包围盒。
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个盒子位于法线指向的平面一侧，则返回 {@link Intersect.INSIDE}；
 *                      如果整个盒子位于相反侧，则返回 {@link Intersect.OUTSIDE}；
 *                      如果盒子与平面相交，则返回 {@link Intersect.INTERSECTING}。
 */

AxisAlignedBoundingBox.intersectPlane = function(box, plane) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("box", box);
  Check.defined("plane", plane);
  //>>includeEnd('debug');

  intersectScratch = Cartesian3.subtract(
    box.maximum,
    box.minimum,
    intersectScratch,
  );
  const h = Cartesian3.multiplyByScalar(
    intersectScratch,
    0.5,
    intersectScratch,
  ); //The positive half diagonal
  const normal = plane.normal;
  const e =
    h.x * Math.abs(normal.x) +
    h.y * Math.abs(normal.y) +
    h.z * Math.abs(normal.z);
  const s = Cartesian3.dot(box.center, normal) + plane.distance; //signed distance from center

  if (s - e > 0) {
    return Intersect.INSIDE;
  }

  if (s + e < 0) {
    //Not in front because normals point inward
    return Intersect.OUTSIDE;
  }

  return Intersect.INTERSECTING;
};

/**
 * 复制此 AxisAlignedBoundingBox 实例。
 *
 * @param {AxisAlignedBoundingBox} [result] 存储结果的对象。
 * @returns {AxisAlignedBoundingBox} 修改后的 result 参数，或如果未提供，则返回一个新的 AxisAlignedBoundingBox 实例。
 */

AxisAlignedBoundingBox.prototype.clone = function(result) {
  return AxisAlignedBoundingBox.clone(this, result);
};

/**
 * 确定这个盒子位于平面的哪一侧。
 *
 * @param {Plane} plane 要测试的平面。
 * @returns {Intersect} 如果整个盒子位于法线指向的平面一侧，则返回 {@link Intersect.INSIDE}；
 *                      如果整个盒子位于相反侧，则返回 {@link Intersect.OUTSIDE}；
 *                      如果盒子与平面相交，则返回 {@link Intersect.INTERSECTING}。
 */

AxisAlignedBoundingBox.prototype.intersectPlane = function(plane) {
  return AxisAlignedBoundingBox.intersectPlane(this, plane);
};

/**
 * 将此 AxisAlignedBoundingBox 与提供的 AxisAlignedBoundingBox 逐组件比较并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {AxisAlignedBoundingBox} [right] 右侧的 AxisAlignedBoundingBox。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>
 */

AxisAlignedBoundingBox.prototype.equals = function(right) {
  return AxisAlignedBoundingBox.equals(this, right);
};
export default AxisAlignedBoundingBox;
