import Cartesian2 from "./Cartesian2.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import Intersect from "./Intersect.js";
import Rectangle from "./Rectangle.js";

/**
 * 由一个角、宽度和高度定义的包围矩形。
 * @alias BoundingRectangle
 * @constructor
 *
 * @param {number} [x=0.0] 矩形的 x 坐标。
 * @param {number} [y=0.0] 矩形的 y 坐标。
 * @param {number} [width=0.0] 矩形的宽度。
 * @param {number} [height=0.0] 矩形的高度。
 *
 * @see BoundingSphere
 * @see Packable
 */

function BoundingRectangle(x, y, width, height) {
  /**
   * 矩形的 x 坐标。
   * @type {number}
   * @default 0.0
   */
  this.x = defaultValue(x, 0.0);

  /**
   * 矩形的 y 坐标。
   * @type {number}
   * @default 0.0
   */
  this.y = defaultValue(y, 0.0);

  /**
   * 矩形的宽度。
   * @type {number}
   * @default 0.0
   */
  this.width = defaultValue(width, 0.0);

  /**
   * 矩形的高度。
   * @type {number}
   * @default 0.0
   */
  this.height = defaultValue(height, 0.0);
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */

BoundingRectangle.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {BoundingRectangle} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
BoundingRectangle.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.x;
  array[startingIndex++] = value.y;
  array[startingIndex++] = value.width;
  array[startingIndex] = value.height;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new BoundingRectangle();
  }
  result.x = array[startingIndex++];
  result.y = array[startingIndex++];
  result.width = array[startingIndex++];
  result.height = array[startingIndex];
  return result;
};

/**
 * 计算一个包围给定二维点列表的矩形。
 * 矩形的角位于左下角。
 *
 * @param {Cartesian2[]} positions 包围矩形将要包含的点列表。每个点必须具有 <code>x</code> 和 <code>y</code> 属性。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.fromPoints = function (positions, result) {
  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  if (!defined(positions) || positions.length === 0) {
    result.x = 0;
    result.y = 0;
    result.width = 0;
    result.height = 0;
    return result;
  }

  const length = positions.length;

  let minimumX = positions[0].x;
  let minimumY = positions[0].y;

  let maximumX = positions[0].x;
  let maximumY = positions[0].y;

  for (let i = 1; i < length; i++) {
    const p = positions[i];
    const x = p.x;
    const y = p.y;

    minimumX = Math.min(x, minimumX);
    maximumX = Math.max(x, maximumX);
    minimumY = Math.min(y, minimumY);
    maximumY = Math.max(y, maximumY);
  }

  result.x = minimumX;
  result.y = minimumY;
  result.width = maximumX - minimumX;
  result.height = maximumY - minimumY;
  return result;
};

const defaultProjection = new GeographicProjection();
const fromRectangleLowerLeft = new Cartographic();
const fromRectangleUpperRight = new Cartographic();
/**
 * 从一个矩形计算出包围矩形。
 *
 * @param {Rectangle} rectangle 用于创建包围矩形的有效矩形。
 * @param {object} [projection=GeographicProjection] 用于将矩形投影到二维的投影。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.fromRectangle = function (rectangle, projection, result) {
  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  if (!defined(rectangle)) {
    result.x = 0;
    result.y = 0;
    result.width = 0;
    result.height = 0;
    return result;
  }

  defaultProjection._ellipsoid = Ellipsoid.default;
  projection = defaultValue(projection, defaultProjection);

  const lowerLeft = projection.project(
    Rectangle.southwest(rectangle, fromRectangleLowerLeft),
  );
  const upperRight = projection.project(
    Rectangle.northeast(rectangle, fromRectangleUpperRight),
  );

  Cartesian2.subtract(upperRight, lowerLeft, upperRight);

  result.x = lowerLeft.x;
  result.y = lowerLeft.y;
  result.width = upperRight.x;
  result.height = upperRight.y;
  return result;
};
/**
 * 复制一个 BoundingRectangle 实例。
 *
 * @param {BoundingRectangle} rectangle 要复制的包围矩形。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。（如果 rectangle 为 undefined，则返回 undefined）
 */

BoundingRectangle.clone = function (rectangle, result) {
  if (!defined(rectangle)) {
    return undefined;
  }

  if (!defined(result)) {
    return new BoundingRectangle(
      rectangle.x,
      rectangle.y,
      rectangle.width,
      rectangle.height,
    );
  }

  result.x = rectangle.x;
  result.y = rectangle.y;
  result.width = rectangle.width;
  result.height = rectangle.height;
  return result;
};

/**
 * 计算一个包围矩形，该矩形是左边和右边包围矩形的并集。
 *
 * @param {BoundingRectangle} left 要包围在包围矩形中的左边矩形。
 * @param {BoundingRectangle} right 要包围在包围矩形中的右边矩形。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.union = function (left, right, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  const lowerLeftX = Math.min(left.x, right.x);
  const lowerLeftY = Math.min(left.y, right.y);
  const upperRightX = Math.max(left.x + left.width, right.x + right.width);
  const upperRightY = Math.max(left.y + left.height, right.y + right.height);

  result.x = lowerLeftX;
  result.y = lowerLeftY;
  result.width = upperRightX - lowerLeftX;
  result.height = upperRightY - lowerLeftY;
  return result;
};

/**
 * 通过扩大提供的矩形直到包含指定点来计算一个包围矩形。
 *
 * @param {BoundingRectangle} rectangle 要扩展的矩形。
 * @param {Cartesian2} point 要包围在包围矩形中的点。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.expand = function (rectangle, point, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("rectangle", rectangle);
  Check.typeOf.object("point", point);
  //>>includeEnd('debug');

  result = BoundingRectangle.clone(rectangle, result);

  const width = point.x - result.x;
  const height = point.y - result.y;

  if (width > result.width) {
    result.width = width;
  } else if (width < 0) {
    result.width -= width;
    result.x = point.x;
  }

  if (height > result.height) {
    result.height = height;
  } else if (height < 0) {
    result.height -= height;
    result.y = point.y;
  }

  return result;
};

/**
 * 判断两个矩形是否相交。
 *
 * @param {BoundingRectangle} left 要检查交集的左侧矩形。
 * @param {BoundingRectangle} right 另一个要检查交集的矩形。
 * @returns {Intersect} 如果矩形相交则返回 <code>Intersect.INTERSECTING</code>，否则返回 <code>Intersect.OUTSIDE</code>。
 */

BoundingRectangle.intersect = function (left, right) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("left", left);
  Check.typeOf.object("right", right);
  //>>includeEnd('debug');

  const leftX = left.x;
  const leftY = left.y;
  const rightX = right.x;
  const rightY = right.y;
  if (
    !(
      leftX > rightX + right.width ||
      leftX + left.width < rightX ||
      leftY + left.height < rightY ||
      leftY > rightY + right.height
    )
  ) {
    return Intersect.INTERSECTING;
  }

  return Intersect.OUTSIDE;
};

/**
 * 逐个比较提供的 BoundingRectangle 并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {BoundingRectangle} [left] 第一个 BoundingRectangle。
 * @param {BoundingRectangle} [right] 第二个 BoundingRectangle。
 * @returns {boolean} 如果两个矩形相等，则返回 <code>true</code>，否则返回 <code>false</code>。
 */

BoundingRectangle.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.width === right.width &&
      left.height === right.height)
  );
};

/**
 * 复制此 BoundingRectangle 实例。
 *
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 修改后的结果参数，如果未提供则返回一个新的 BoundingRectangle 实例。
 */

BoundingRectangle.prototype.clone = function (result) {
  return BoundingRectangle.clone(this, result);
};

/**
 * 判断此矩形是否与另一个矩形相交。
 *
 * @param {BoundingRectangle} right 要检查交集的矩形。
 * @returns {Intersect} 如果矩形相交则返回 <code>Intersect.INTERSECTING</code>，否则返回 <code>Intersect.OUTSIDE</code>。
 */

BoundingRectangle.prototype.intersect = function (right) {
  return BoundingRectangle.intersect(this, right);
};

/**
 * 将此 BoundingRectangle 与提供的 BoundingRectangle 逐个比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {BoundingRectangle} [right] 右侧的 BoundingRectangle。
 * @returns {boolean} 如果相等则返回 <code>true</code>，否则返回 <code>false</code>。
 */

BoundingRectangle.prototype.equals = function (right) {
  return BoundingRectangle.equals(this, right);
};
export default BoundingRectangle;
