import ArcType from "./ArcType.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Color from "./Color.js";
import ComponentDatatype from "./ComponentDatatype.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import Geometry from "./Geometry.js";
import GeometryAttribute from "./GeometryAttribute.js";
import GeometryAttributes from "./GeometryAttributes.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";
import PolylinePipeline from "./PolylinePipeline.js";
import PrimitiveType from "./PrimitiveType.js";

function interpolateColors(p0, p1, color0, color1, minDistance, array, offset) {
  const numPoints = PolylinePipeline.numberOfPoints(p0, p1, minDistance);
  let i;

  const r0 = color0.red;
  const g0 = color0.green;
  const b0 = color0.blue;
  const a0 = color0.alpha;

  const r1 = color1.red;
  const g1 = color1.green;
  const b1 = color1.blue;
  const a1 = color1.alpha;

  if (Color.equals(color0, color1)) {
    for (i = 0; i < numPoints; i++) {
      array[offset++] = Color.floatToByte(r0);
      array[offset++] = Color.floatToByte(g0);
      array[offset++] = Color.floatToByte(b0);
      array[offset++] = Color.floatToByte(a0);
    }
    return offset;
  }

  const redPerVertex = (r1 - r0) / numPoints;
  const greenPerVertex = (g1 - g0) / numPoints;
  const bluePerVertex = (b1 - b0) / numPoints;
  const alphaPerVertex = (a1 - a0) / numPoints;

  let index = offset;
  for (i = 0; i < numPoints; i++) {
    array[index++] = Color.floatToByte(r0 + i * redPerVertex);
    array[index++] = Color.floatToByte(g0 + i * greenPerVertex);
    array[index++] = Color.floatToByte(b0 + i * bluePerVertex);
    array[index++] = Color.floatToByte(a0 + i * alphaPerVertex);
  }

  return index;
}

/**
 * 描述为线条带的多段线；前两个位置定义一个线段，每个额外的位置定义从前一个位置到下一个位置的线段。
 *
 * @alias SimplePolylineGeometry
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3[]} options.positions 一个 {@link Cartesian3} 数组，定义多段线作为线条带中的位置。
 * @param {Color[]} [options.colors] 一个 {@link Color} 数组，定义每个顶点或每个线段的颜色。
 * @param {boolean} [options.colorsPerVertex=false] 一个布尔值，确定颜色是在线段上均匀分布还是在顶点之间插值。
 * @param {ArcType} [options.arcType=ArcType.GEODESIC] 多段线段必须遵循的线的类型。
 * @param {number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] 如果 options.arcType 不是 ArcType.NONE，则每个纬度和经度之间的距离（以弧度为单位）。确定缓冲区中的位置数量。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 用作参考的椭球体。
 *
 * @exception {DeveloperError} 至少需要两个位置。
 * @exception {DeveloperError} colors 的长度无效。
 *
 * @see SimplePolylineGeometry#createGeometry
 *
 * @example
 * // A polyline with two connected line segments
 * const polyline = new Cesium.SimplePolylineGeometry({
 *   positions : Cesium.Cartesian3.fromDegreesArray([
 *     0.0, 0.0,
 *     5.0, 0.0,
 *     5.0, 5.0
 *   ])
 * });
 * const geometry = Cesium.SimplePolylineGeometry.createGeometry(polyline);
 */
function SimplePolylineGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const positions = options.positions;
  const colors = options.colors;
  const colorsPerVertex = defaultValue(options.colorsPerVertex, false);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(positions) || positions.length < 2) {
    throw new DeveloperError("At least two positions are required.");
  }
  if (
    defined(colors) &&
    ((colorsPerVertex && colors.length < positions.length) ||
      (!colorsPerVertex && colors.length < positions.length - 1))
  ) {
    throw new DeveloperError("colors has an invalid length.");
  }
  //>>includeEnd('debug');

  this._positions = positions;
  this._colors = colors;
  this._colorsPerVertex = colorsPerVertex;

  this._arcType = defaultValue(options.arcType, ArcType.GEODESIC);
  this._granularity = defaultValue(
    options.granularity,
    CesiumMath.RADIANS_PER_DEGREE,
  );
  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._workerName = "createSimplePolylineGeometry";

  let numComponents = 1 + positions.length * Cartesian3.packedLength;
  numComponents += defined(colors) ? 1 + colors.length * Color.packedLength : 1;

  /**
   * 用于将对象打包到数组中的元素数量。
   * @type {number}
   */
  this.packedLength = numComponents + Ellipsoid.packedLength + 3;
}

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {SimplePolylineGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
SimplePolylineGeometry.pack = function (value, array, startingIndex) {
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

  const colors = value._colors;
  length = defined(colors) ? colors.length : 0.0;
  array[startingIndex++] = length;

  for (i = 0; i < length; ++i, startingIndex += Color.packedLength) {
    Color.pack(colors[i], array, startingIndex);
  }

  Ellipsoid.pack(value._ellipsoid, array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  array[startingIndex++] = value._colorsPerVertex ? 1.0 : 0.0;
  array[startingIndex++] = value._arcType;
  array[startingIndex] = value._granularity;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {SimplePolylineGeometry} [result] 存储结果的对象。
 * @returns {SimplePolylineGeometry} 修改后的结果参数或如果未提供则返回一个新的 SimplePolylineGeometry 实例。
 */

SimplePolylineGeometry.unpack = function (array, startingIndex, result) {
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
  const colors = length > 0 ? new Array(length) : undefined;

  for (i = 0; i < length; ++i, startingIndex += Color.packedLength) {
    colors[i] = Color.unpack(array, startingIndex);
  }

  const ellipsoid = Ellipsoid.unpack(array, startingIndex);
  startingIndex += Ellipsoid.packedLength;

  const colorsPerVertex = array[startingIndex++] === 1.0;
  const arcType = array[startingIndex++];
  const granularity = array[startingIndex];

  if (!defined(result)) {
    return new SimplePolylineGeometry({
      positions: positions,
      colors: colors,
      ellipsoid: ellipsoid,
      colorsPerVertex: colorsPerVertex,
      arcType: arcType,
      granularity: granularity,
    });
  }

  result._positions = positions;
  result._colors = colors;
  result._ellipsoid = ellipsoid;
  result._colorsPerVertex = colorsPerVertex;
  result._arcType = arcType;
  result._granularity = granularity;

  return result;
};

const scratchArray1 = new Array(2);
const scratchArray2 = new Array(2);
const generateArcOptionsScratch = {
  positions: scratchArray1,
  height: scratchArray2,
  ellipsoid: undefined,
  minDistance: undefined,
  granularity: undefined,
};

/**
 * 计算简单多段线的几何表示，包括其顶点、索引和包围球。
 *
 * @param {SimplePolylineGeometry} simplePolylineGeometry 多段线的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */

SimplePolylineGeometry.createGeometry = function (simplePolylineGeometry) {
  const positions = simplePolylineGeometry._positions;
  const colors = simplePolylineGeometry._colors;
  const colorsPerVertex = simplePolylineGeometry._colorsPerVertex;
  const arcType = simplePolylineGeometry._arcType;
  const granularity = simplePolylineGeometry._granularity;
  const ellipsoid = simplePolylineGeometry._ellipsoid;

  const minDistance = CesiumMath.chordLength(
    granularity,
    ellipsoid.maximumRadius,
  );
  const perSegmentColors = defined(colors) && !colorsPerVertex;

  let i;
  const length = positions.length;

  let positionValues;
  let numberOfPositions;
  let colorValues;
  let color;
  let offset = 0;

  if (arcType === ArcType.GEODESIC || arcType === ArcType.RHUMB) {
    let subdivisionSize;
    let numberOfPointsFunction;
    let generateArcFunction;
    if (arcType === ArcType.GEODESIC) {
      subdivisionSize = CesiumMath.chordLength(
        granularity,
        ellipsoid.maximumRadius,
      );
      numberOfPointsFunction = PolylinePipeline.numberOfPoints;
      generateArcFunction = PolylinePipeline.generateArc;
    } else {
      subdivisionSize = granularity;
      numberOfPointsFunction = PolylinePipeline.numberOfPointsRhumbLine;
      generateArcFunction = PolylinePipeline.generateRhumbArc;
    }

    const heights = PolylinePipeline.extractHeights(positions, ellipsoid);

    const generateArcOptions = generateArcOptionsScratch;
    if (arcType === ArcType.GEODESIC) {
      generateArcOptions.minDistance = minDistance;
    } else {
      generateArcOptions.granularity = granularity;
    }
    generateArcOptions.ellipsoid = ellipsoid;

    if (perSegmentColors) {
      let positionCount = 0;
      for (i = 0; i < length - 1; i++) {
        positionCount +=
          numberOfPointsFunction(
            positions[i],
            positions[i + 1],
            subdivisionSize,
          ) + 1;
      }

      positionValues = new Float64Array(positionCount * 3);
      colorValues = new Uint8Array(positionCount * 4);

      generateArcOptions.positions = scratchArray1;
      generateArcOptions.height = scratchArray2;

      let ci = 0;
      for (i = 0; i < length - 1; ++i) {
        scratchArray1[0] = positions[i];
        scratchArray1[1] = positions[i + 1];

        scratchArray2[0] = heights[i];
        scratchArray2[1] = heights[i + 1];

        const pos = generateArcFunction(generateArcOptions);

        if (defined(colors)) {
          const segLen = pos.length / 3;
          color = colors[i];
          for (let k = 0; k < segLen; ++k) {
            colorValues[ci++] = Color.floatToByte(color.red);
            colorValues[ci++] = Color.floatToByte(color.green);
            colorValues[ci++] = Color.floatToByte(color.blue);
            colorValues[ci++] = Color.floatToByte(color.alpha);
          }
        }

        positionValues.set(pos, offset);
        offset += pos.length;
      }
    } else {
      generateArcOptions.positions = positions;
      generateArcOptions.height = heights;
      positionValues = new Float64Array(
        generateArcFunction(generateArcOptions),
      );

      if (defined(colors)) {
        colorValues = new Uint8Array((positionValues.length / 3) * 4);

        for (i = 0; i < length - 1; ++i) {
          const p0 = positions[i];
          const p1 = positions[i + 1];
          const c0 = colors[i];
          const c1 = colors[i + 1];
          offset = interpolateColors(
            p0,
            p1,
            c0,
            c1,
            minDistance,
            colorValues,
            offset,
          );
        }

        const lastColor = colors[length - 1];
        colorValues[offset++] = Color.floatToByte(lastColor.red);
        colorValues[offset++] = Color.floatToByte(lastColor.green);
        colorValues[offset++] = Color.floatToByte(lastColor.blue);
        colorValues[offset++] = Color.floatToByte(lastColor.alpha);
      }
    }
  } else {
    numberOfPositions = perSegmentColors ? length * 2 - 2 : length;
    positionValues = new Float64Array(numberOfPositions * 3);
    colorValues = defined(colors)
      ? new Uint8Array(numberOfPositions * 4)
      : undefined;

    let positionIndex = 0;
    let colorIndex = 0;

    for (i = 0; i < length; ++i) {
      const p = positions[i];

      if (perSegmentColors && i > 0) {
        Cartesian3.pack(p, positionValues, positionIndex);
        positionIndex += 3;

        color = colors[i - 1];
        colorValues[colorIndex++] = Color.floatToByte(color.red);
        colorValues[colorIndex++] = Color.floatToByte(color.green);
        colorValues[colorIndex++] = Color.floatToByte(color.blue);
        colorValues[colorIndex++] = Color.floatToByte(color.alpha);
      }

      if (perSegmentColors && i === length - 1) {
        break;
      }

      Cartesian3.pack(p, positionValues, positionIndex);
      positionIndex += 3;

      if (defined(colors)) {
        color = colors[i];
        colorValues[colorIndex++] = Color.floatToByte(color.red);
        colorValues[colorIndex++] = Color.floatToByte(color.green);
        colorValues[colorIndex++] = Color.floatToByte(color.blue);
        colorValues[colorIndex++] = Color.floatToByte(color.alpha);
      }
    }
  }

  const attributes = new GeometryAttributes();
  attributes.position = new GeometryAttribute({
    componentDatatype: ComponentDatatype.DOUBLE,
    componentsPerAttribute: 3,
    values: positionValues,
  });

  if (defined(colors)) {
    attributes.color = new GeometryAttribute({
      componentDatatype: ComponentDatatype.UNSIGNED_BYTE,
      componentsPerAttribute: 4,
      values: colorValues,
      normalize: true,
    });
  }

  numberOfPositions = positionValues.length / 3;
  const numberOfIndices = (numberOfPositions - 1) * 2;
  const indices = IndexDatatype.createTypedArray(
    numberOfPositions,
    numberOfIndices,
  );

  let index = 0;
  for (i = 0; i < numberOfPositions - 1; ++i) {
    indices[index++] = i;
    indices[index++] = i + 1;
  }

  return new Geometry({
    attributes: attributes,
    indices: indices,
    primitiveType: PrimitiveType.LINES,
    boundingSphere: BoundingSphere.fromPoints(positions),
  });
};
export default SimplePolylineGeometry;
