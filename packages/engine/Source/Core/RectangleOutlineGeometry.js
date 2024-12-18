import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import GeometryOffsetAttribute from "./GeometryOffsetAttribute.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import PolygonPipeline from "./PolygonPipeline.js";
import PrimitiveType from "./PrimitiveType.js";
import Rectangle from "./Rectangle.js";
import RectangleGeometryLibrary from "./RectangleGeometryLibrary.js";

const bottomBoundingSphere = new BoundingSphere();
const topBoundingSphere = new BoundingSphere();
const positionScratch = new Cartesian3();
const rectangleScratch = new Rectangle();

function constructRectangle(geometry, computedOptions) {
  const ellipsoid = geometry._ellipsoid;
  const height = computedOptions.height;
  const width = computedOptions.width;
  const northCap = computedOptions.northCap;
  const southCap = computedOptions.southCap;

  let rowHeight = height;
  let widthMultiplier = 2;
  let size = 0;
  let corners = 4;
  if (northCap) {
    widthMultiplier -= 1;
    rowHeight -= 1;
    size += 1;
    corners -= 2;
  }
  if (southCap) {
    widthMultiplier -= 1;
    rowHeight -= 1;
    size += 1;
    corners -= 2;
  }
  size += widthMultiplier * width + 2 * rowHeight - corners;

  const positions = new Float64Array(size * 3);

  let posIndex = 0;
  let row = 0;
  let col;
  const position = positionScratch;
  if (northCap) {
    RectangleGeometryLibrary.computePosition(
      computedOptions,
      ellipsoid,
      false,
      row,
      0,
      position,
    );
    positions[posIndex++] = position.x;
    positions[posIndex++] = position.y;
    positions[posIndex++] = position.z;
  } else {
    for (col = 0; col < width; col++) {
      RectangleGeometryLibrary.computePosition(
        computedOptions,
        ellipsoid,
        false,
        row,
        col,
        position,
      );
      positions[posIndex++] = position.x;
      positions[posIndex++] = position.y;
      positions[posIndex++] = position.z;
    }
  }

  col = width - 1;
  for (row = 1; row < height; row++) {
    RectangleGeometryLibrary.computePosition(
      computedOptions,
      ellipsoid,
      false,
      row,
      col,
      position,
    );
    positions[posIndex++] = position.x;
    positions[posIndex++] = position.y;
    positions[posIndex++] = position.z;
  }

  row = height - 1;
  if (!southCap) {
    // if southCap is true, we dont need to add any more points because the south pole point was added by the iteration above
    for (col = width - 2; col >= 0; col--) {
      RectangleGeometryLibrary.computePosition(
        computedOptions,
        ellipsoid,
        false,
        row,
        col,
        position,
      );
      positions[posIndex++] = position.x;
      positions[posIndex++] = position.y;
      positions[posIndex++] = position.z;
    }
  }

  col = 0;
  for (row = height - 2; row > 0; row--) {
    RectangleGeometryLibrary.computePosition(
      computedOptions,
      ellipsoid,
      false,
      row,
      col,
      position,
    );
    positions[posIndex++] = position.x;
    positions[posIndex++] = position.y;
    positions[posIndex++] = position.z;
  }

  const indicesSize = (positions.length / 3) * 2;
  const indices = IndexDatatype.createTypedArray(
    positions.length / 3,
    indicesSize,
  );

  let index = 0;
  for (let i = 0; i < positions.length / 3 - 1; i++) {
    indices[index++] = i;
    indices[index++] = i + 1;
  }
  indices[index++] = positions.length / 3 - 1;
  indices[index++] = 0;

  const geo = new Geometry({
    attributes: new GeometryAttributes(),
    primitiveType: PrimitiveType.LINES,
  });

  geo.attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positions,
  });
  geo.indices = indices;

  return geo;
}

function constructExtrudedRectangle(rectangleGeometry, computedOptions) {
  const maxHeight = rectangleGeometry._surfaceHeight;
  const minHeight = rectangleGeometry._extrudedHeight;
  const ellipsoid = rectangleGeometry._ellipsoid;
  const geo = constructRectangle(rectangleGeometry, computedOptions);

  const height = computedOptions.height;
  const width = computedOptions.width;

  const topPositions = PolygonPipeline.scaleToGeodeticHeight(
    geo.attributes.position.values,
    maxHeight,
    ellipsoid,
    false,
  );
  let length = topPositions.length;
  const positions = new Float64Array(length * 2);
  positions.set(topPositions);
  const bottomPositions = PolygonPipeline.scaleToGeodeticHeight(
    geo.attributes.position.values,
    minHeight,
    ellipsoid,
  );
  positions.set(bottomPositions, length);
  geo.attributes.position.values = positions;

  const northCap = computedOptions.northCap;
  const southCap = computedOptions.southCap;
  let corners = 4;
  if (northCap) {
    corners -= 1;
  }
  if (southCap) {
    corners -= 1;
  }

  const indicesSize = (positions.length / 3 + corners) * 2;
  const indices = IndexDatatype.createTypedArray(
    positions.length / 3,
    indicesSize,
  );
  length = positions.length / 6;
  let index = 0;
  for (let i = 0; i < length - 1; i++) {
    indices[index++] = i;
    indices[index++] = i + 1;
    indices[index++] = i + length;
    indices[index++] = i + length + 1;
  }
  indices[index++] = length - 1;
  indices[index++] = 0;
  indices[index++] = length + length - 1;
  indices[index++] = length;

  indices[index++] = 0;
  indices[index++] = length;

  let bottomCorner;
  if (northCap) {
    bottomCorner = height - 1;
  } else {
    const topRightCorner = width - 1;
    indices[index++] = topRightCorner;
    indices[index++] = topRightCorner + length;
    bottomCorner = width + height - 2;
  }

  indices[index++] = bottomCorner;
  indices[index++] = bottomCorner + length;

  if (!southCap) {
    const bottomLeftCorner = width + bottomCorner - 1;
    indices[index++] = bottomLeftCorner;
    indices[index] = bottomLeftCorner + length;
  }

  geo.indices = indices;

  return geo;
}

/**
 * 描述位于原点的椭球体上一个制图矩形的轮廓。
 *
 * @alias RectangleOutlineGeometry
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Rectangle} options.rectangle 具有北、南、东和西属性（以弧度为单位）的制图矩形。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 矩形所在的椭球体。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 每个纬度和经度之间的距离（以弧度为单位）。决定缓冲区中的位置数量。
 * @param {number} [options.height=0.0] 矩形与椭球体表面之间的距离（以米为单位）。
 * @param {number} [options.rotation=0.0] 矩形的旋转角度（以弧度为单位）。正旋转为逆时针方向。
 * @param {number} [options.extrudedHeight] 矩形拉伸面与椭球体表面之间的距离（以米为单位）。
 *
 * @exception {DeveloperError} <code>options.rectangle.north</code> 必须在区间 [<code>-Pi/2</code>, <code>Pi/2</code>] 内。
 * @exception {DeveloperError} <code>options.rectangle.south</code> 必须在区间 [<code>-Pi/2</code>, <code>Pi/2</code>] 内。
 * @exception {DeveloperError} <code>options.rectangle.east</code> 必须在区间 [<code>-Pi</code>, <code>Pi</code>] 内。
 * @exception {DeveloperError} <code>options.rectangle.west</code> 必须在区间 [<code>-Pi</code>, <code>Pi</code>] 内。
 * @exception {DeveloperError} <code>options.rectangle.north</code> 必须大于 <code>rectangle.south</code>。
 *
 * @see RectangleOutlineGeometry#createGeometry
 *
 * @example
 * const rectangle = new Cesium.RectangleOutlineGeometry({
 *   ellipsoid : Cesium.Ellipsoid.WGS84,
 *   rectangle : Cesium.Rectangle.fromDegrees(-80.0, 39.0, -74.0, 42.0),
 *   height : 10000.0
 * });
 * const geometry = Cesium.RectangleOutlineGeometry.createGeometry(rectangle);
 */
function RectangleOutlineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const rectangle = options.rectangle;
  const granularity = defaultValue(
    options.granularity,
    CesiumMath.RADIANS_PER_DEGREE,
  );
  const ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  const rotation = defaultValue(options.rotation, 0.0);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(rectangle)) {
    throw new DeveloperError("rectangle is required.");
  }
  Rectangle._validate(rectangle);
  if (rectangle.north < rectangle.south) {
    throw new DeveloperError(
      "options.rectangle.north must be greater than options.rectangle.south",
    );
  }
  //>>includeEnd('debug');

  const height = defaultValue(options.height, 0.0);
  const extrudedHeight = defaultValue(options.extrudedHeight, height);

  this._rectangle = Rectangle.clone(rectangle);
  this._granularity = granularity;
  this._ellipsoid = ellipsoid;
  this._surfaceHeight = Math.max(height, extrudedHeight);
  this._rotation = rotation;
  this._extrudedHeight = Math.min(height, extrudedHeight);
  this._offsetAttribute = options.offsetAttribute;
  this._workerName = "createRectangleOutlineGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
RectangleOutlineGeometry.packedLength =
  Rectangle.packedLength + Ellipsoid.packedLength + 5;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {RectangleOutlineGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
RectangleOutlineGeometry.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required");
  }

  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  Rectangle.pack(value._rectangle, array, startingIndex);
  startingIndex += Rectangle.packedLength;

  Ellipsoid.pack(value._ellipsoid, array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  array[startingIndex++] = value._granularity;
  array[startingIndex++] = value._surfaceHeight;
  array[startingIndex++] = value._rotation;
  array[startingIndex++] = value._extrudedHeight;
  array[startingIndex] = defaultValue(value._offsetAttribute, -1);

  return array;
};

const scratchRectangle = new Rectangle();
const scratchEllipsoid = Ellipsoid.clone(Ellipsoid.UNIT_SPHERE);
const scratchOptions = {
  rectangle: scratchRectangle,
  ellipsoid: scratchEllipsoid,
  granularity: undefined,
  height: undefined,
  rotation: undefined,
  extrudedHeight: undefined,
  offsetAttribute: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {RectangleOutlineGeometry} [result] 存储结果的对象。
 * @returns {RectangleOutlineGeometry} 修改后的结果参数，如果未提供，则返回一个新实例。
 */

RectangleOutlineGeometry.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(array)) {
    throw new DeveloperError("array is required");
  }
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  const rectangle = Rectangle.unpack(array, startingIndex, scratchRectangle);
  startingIndex += Rectangle.packedLength;

  const ellipsoid = Ellipsoid.unpack(array, startingIndex, scratchEllipsoid);
  startingIndex += Ellipsoid.packedLength;

  const granularity = array[startingIndex++];
  const height = array[startingIndex++];
  const rotation = array[startingIndex++];
  const extrudedHeight = array[startingIndex++];
  const offsetAttribute = array[startingIndex];

  if (!defined(result)) {
    scratchOptions.granularity = granularity;
    scratchOptions.height = height;
    scratchOptions.rotation = rotation;
    scratchOptions.extrudedHeight = extrudedHeight;
    scratchOptions.offsetAttribute =
      offsetAttribute === -1 ? undefined : offsetAttribute;

    return new RectangleOutlineGeometry(scratchOptions);
  }

  result._rectangle = Rectangle.clone(rectangle, result._rectangle);
  result._ellipsoid = Ellipsoid.clone(ellipsoid, result._ellipsoid);
  result._surfaceHeight = height;
  result._rotation = rotation;
  result._extrudedHeight = extrudedHeight;
  result._offsetAttribute =
    offsetAttribute === -1 ? undefined : offsetAttribute;

  return result;
};

const nwScratch = new Cartographic();
/**
 * 计算矩形轮廓的几何表示，包括其顶点、索引和包围球。
 *
 * @param {RectangleOutlineGeometry} rectangleGeometry 矩形轮廓的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 *
 * @exception {DeveloperError} 旋转的矩形无效。
 */

RectangleOutlineGeometry.createGeometry = function (rectangleGeometry) {
  const rectangle = rectangleGeometry._rectangle;
  const ellipsoid = rectangleGeometry._ellipsoid;
  const computedOptions = RectangleGeometryLibrary.computeOptions(
    rectangle,
    rectangleGeometry._granularity,
    rectangleGeometry._rotation,
    0,
    rectangleScratch,
    nwScratch,
  );

  let geometry;
  let boundingSphere;

  if (
    CesiumMath.equalsEpsilon(
      rectangle.north,
      rectangle.south,
      CesiumMath.EPSILON10,
    ) ||
    CesiumMath.equalsEpsilon(
      rectangle.east,
      rectangle.west,
      CesiumMath.EPSILON10,
    )
  ) {
    return undefined;
  }

  const surfaceHeight = rectangleGeometry._surfaceHeight;
  const extrudedHeight = rectangleGeometry._extrudedHeight;
  const extrude = !CesiumMath.equalsEpsilon(
    surfaceHeight,
    extrudedHeight,
    0,
    CesiumMath.EPSILON2,
  );
  let offsetValue;
  if (extrude) {
    geometry = constructExtrudedRectangle(rectangleGeometry, computedOptions);
    if (defined(rectangleGeometry._offsetAttribute)) {
      const size = geometry.attributes.position.values.length / 3;
      let offsetAttribute = new Uint8Array(size);
      if (rectangleGeometry._offsetAttribute === GeometryOffsetAttribute.TOP) {
        offsetAttribute = offsetAttribute.fill(1, 0, size / 2);
      } else {
        offsetValue =
          rectangleGeometry._offsetAttribute === GeometryOffsetAttribute.NONE
            ? 0
            : 1;
        offsetAttribute = offsetAttribute.fill(offsetValue);
      }

      geometry.attributes.applyOffset = new GeometryAttribute({
        componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
        componentsPerAttribute: 1,
        values: offsetAttribute,
      });
    }
    const topBS = BoundingSphere.fromRectangle3D(
      rectangle,
      ellipsoid,
      surfaceHeight,
      topBoundingSphere,
    );
    const bottomBS = BoundingSphere.fromRectangle3D(
      rectangle,
      ellipsoid,
      extrudedHeight,
      bottomBoundingSphere,
    );
    boundingSphere = BoundingSphere.union(topBS, bottomBS);
  } else {
    geometry = constructRectangle(rectangleGeometry, computedOptions);
    geometry.attributes.position.values = PolygonPipeline.scaleToGeodeticHeight(
      geometry.attributes.position.values,
      surfaceHeight,
      ellipsoid,
      false,
    );

    if (defined(rectangleGeometry._offsetAttribute)) {
      const length = geometry.attributes.position.values.length;
      offsetValue =
        rectangleGeometry._offsetAttribute === GeometryOffsetAttribute.NONE
          ? 0
          : 1;
      const applyOffset = new Uint8Array(length / 3).fill(offsetValue);
      geometry.attributes.applyOffset = new GeometryAttribute({
        componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
        componentsPerAttribute: 1,
        values: applyOffset,
      });
    }

    boundingSphere = BoundingSphere.fromRectangle3D(
      rectangle,
      ellipsoid,
      surfaceHeight,
    );
  }

  return new Geometry({
    attributes: geometry.attributes,
    indices: geometry.indices,
    primitiveType: PrimitiveType.LINES,
    boundingSphere: boundingSphere,
    offsetAttribute: rectangleGeometry._offsetAttribute,
  });
};
export default RectangleOutlineGeometry;
