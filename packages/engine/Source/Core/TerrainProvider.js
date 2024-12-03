import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import IndexDatatype from "./IndexDatatype.js";
import CesiumMath from "./Math.js";

/**
 * 提供椭球体表面的地形或其他几何形状。表面几何形状
 * 根据 {@link TilingScheme} 组织成一个金字塔状的瓦片。这种类型描述了
 * 一个接口，并不打算直接实例化。
 *
 * @alias TerrainProvider
 * @constructor
 *
 * @see EllipsoidTerrainProvider
 * @see CesiumTerrainProvider
 * @see VRTheWorldTerrainProvider
 * @see GoogleEarthEnterpriseTerrainProvider
 */

function TerrainProvider() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(TerrainProvider.prototype, {
  /**
   * 获取一个事件，当地形提供者遇到异步错误时会引发该事件。通过订阅
   * 此事件，您将被通知错误并可能能够从中恢复。事件监听器
   * 会接收一个 {@link TileProviderError} 的实例。
   * @memberof TerrainProvider.prototype
   * @type {Event<TerrainProvider.ErrorEvent>}
   * @readonly
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取在此地形提供者激活时显示的信用信息。通常用于标明
   * 地形的来源。
   * @memberof TerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */

  credit: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取提供者使用的瓦片方案。
   * @memberof TerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示提供者是否包含水面掩码。水面掩码
   * 表明地球上哪些区域是水而不是陆地，以便可以将其渲染
   * 为带有动画波浪的反射表面。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * @memberof TerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取一个对象，可以用来确定该提供者的地形可用性，例如
   * 在点和矩形中。如果没有可用性
   * 信息，可能会返回undefined。
   * @memberof TerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */

  availability: {
    get: DeveloperError.throwInstantiationError,
  },
});

const regularGridIndicesCache = [];

/**
 * 获取表示规则网格的三角形网格的索引列表。多次调用
 * 此函数时，如果网格的宽度和高度相同，将返回
 * 相同的索引列表。顶点的总数必须小于或等于
 * 65536。
 *
 * @param {number} width 规则网格在水平方向上的顶点数量。
 * @param {number} height 规则网格在垂直方向上的顶点数量。
 * @returns {Uint16Array|Uint32Array} 索引列表。对于64KB或更小的情况返回Uint16Array，对于4GB或更小的情况返回Uint32Array。
 */

TerrainProvider.getRegularGridIndices = function (width, height) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridIndicesCache[width] = byWidth = [];
  }

  let indices = byWidth[height];
  if (!defined(indices)) {
    if (width * height < CesiumMath.SIXTY_FOUR_KILOBYTES) {
      indices = byWidth[height] = new Uint16Array(
        (width - 1) * (height - 1) * 6,
      );
    } else {
      indices = byWidth[height] = new Uint32Array(
        (width - 1) * (height - 1) * 6,
      );
    }
    addRegularGridIndices(width, height, indices, 0);
  }

  return indices;
};

const regularGridAndEdgeIndicesCache = [];

/**
 * @private
 */
TerrainProvider.getRegularGridIndicesAndEdgeIndices = function (width, height) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridAndEdgeIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridAndEdgeIndicesCache[width] = byWidth = [];
  }

  let indicesAndEdges = byWidth[height];
  if (!defined(indicesAndEdges)) {
    const indices = TerrainProvider.getRegularGridIndices(width, height);

    const edgeIndices = getEdgeIndices(width, height);
    const westIndicesSouthToNorth = edgeIndices.westIndicesSouthToNorth;
    const southIndicesEastToWest = edgeIndices.southIndicesEastToWest;
    const eastIndicesNorthToSouth = edgeIndices.eastIndicesNorthToSouth;
    const northIndicesWestToEast = edgeIndices.northIndicesWestToEast;

    indicesAndEdges = byWidth[height] = {
      indices: indices,
      westIndicesSouthToNorth: westIndicesSouthToNorth,
      southIndicesEastToWest: southIndicesEastToWest,
      eastIndicesNorthToSouth: eastIndicesNorthToSouth,
      northIndicesWestToEast: northIndicesWestToEast,
    };
  }

  return indicesAndEdges;
};

const regularGridAndSkirtAndEdgeIndicesCache = [];

/**
 * @private
 */
TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices = function (
  width,
  height,
) {
  //>>includeStart('debug', pragmas.debug);
  if (width * height >= CesiumMath.FOUR_GIGABYTES) {
    throw new DeveloperError(
      "The total number of vertices (width * height) must be less than 4,294,967,296.",
    );
  }
  //>>includeEnd('debug');

  let byWidth = regularGridAndSkirtAndEdgeIndicesCache[width];
  if (!defined(byWidth)) {
    regularGridAndSkirtAndEdgeIndicesCache[width] = byWidth = [];
  }

  let indicesAndEdges = byWidth[height];
  if (!defined(indicesAndEdges)) {
    const gridVertexCount = width * height;
    const gridIndexCount = (width - 1) * (height - 1) * 6;
    const edgeVertexCount = width * 2 + height * 2;
    const edgeIndexCount = Math.max(0, edgeVertexCount - 4) * 6;
    const vertexCount = gridVertexCount + edgeVertexCount;
    const indexCount = gridIndexCount + edgeIndexCount;

    const edgeIndices = getEdgeIndices(width, height);
    const westIndicesSouthToNorth = edgeIndices.westIndicesSouthToNorth;
    const southIndicesEastToWest = edgeIndices.southIndicesEastToWest;
    const eastIndicesNorthToSouth = edgeIndices.eastIndicesNorthToSouth;
    const northIndicesWestToEast = edgeIndices.northIndicesWestToEast;

    const indices = IndexDatatype.createTypedArray(vertexCount, indexCount);
    addRegularGridIndices(width, height, indices, 0);
    TerrainProvider.addSkirtIndices(
      westIndicesSouthToNorth,
      southIndicesEastToWest,
      eastIndicesNorthToSouth,
      northIndicesWestToEast,
      gridVertexCount,
      indices,
      gridIndexCount,
    );

    indicesAndEdges = byWidth[height] = {
      indices: indices,
      westIndicesSouthToNorth: westIndicesSouthToNorth,
      southIndicesEastToWest: southIndicesEastToWest,
      eastIndicesNorthToSouth: eastIndicesNorthToSouth,
      northIndicesWestToEast: northIndicesWestToEast,
      indexCountWithoutSkirts: gridIndexCount,
    };
  }

  return indicesAndEdges;
};

/**
 * @private
 */
TerrainProvider.addSkirtIndices = function (
  westIndicesSouthToNorth,
  southIndicesEastToWest,
  eastIndicesNorthToSouth,
  northIndicesWestToEast,
  vertexCount,
  indices,
  offset,
) {
  let vertexIndex = vertexCount;
  offset = addSkirtIndices(
    westIndicesSouthToNorth,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += westIndicesSouthToNorth.length;
  offset = addSkirtIndices(
    southIndicesEastToWest,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += southIndicesEastToWest.length;
  offset = addSkirtIndices(
    eastIndicesNorthToSouth,
    vertexIndex,
    indices,
    offset,
  );
  vertexIndex += eastIndicesNorthToSouth.length;
  addSkirtIndices(northIndicesWestToEast, vertexIndex, indices, offset);
};

function getEdgeIndices(width, height) {
  const westIndicesSouthToNorth = new Array(height);
  const southIndicesEastToWest = new Array(width);
  const eastIndicesNorthToSouth = new Array(height);
  const northIndicesWestToEast = new Array(width);

  let i;
  for (i = 0; i < width; ++i) {
    northIndicesWestToEast[i] = i;
    southIndicesEastToWest[i] = width * height - 1 - i;
  }

  for (i = 0; i < height; ++i) {
    eastIndicesNorthToSouth[i] = (i + 1) * width - 1;
    westIndicesSouthToNorth[i] = (height - i - 1) * width;
  }

  return {
    westIndicesSouthToNorth: westIndicesSouthToNorth,
    southIndicesEastToWest: southIndicesEastToWest,
    eastIndicesNorthToSouth: eastIndicesNorthToSouth,
    northIndicesWestToEast: northIndicesWestToEast,
  };
}

function addRegularGridIndices(width, height, indices, offset) {
  let index = 0;
  for (let j = 0; j < height - 1; ++j) {
    for (let i = 0; i < width - 1; ++i) {
      const upperLeft = index;
      const lowerLeft = upperLeft + width;
      const lowerRight = lowerLeft + 1;
      const upperRight = upperLeft + 1;

      indices[offset++] = upperLeft;
      indices[offset++] = lowerLeft;
      indices[offset++] = upperRight;
      indices[offset++] = upperRight;
      indices[offset++] = lowerLeft;
      indices[offset++] = lowerRight;

      ++index;
    }
    ++index;
  }
}

function addSkirtIndices(edgeIndices, vertexIndex, indices, offset) {
  let previousIndex = edgeIndices[0];

  const length = edgeIndices.length;
  for (let i = 1; i < length; ++i) {
    const index = edgeIndices[i];

    indices[offset++] = previousIndex;
    indices[offset++] = index;
    indices[offset++] = vertexIndex;

    indices[offset++] = vertexIndex;
    indices[offset++] = index;
    indices[offset++] = vertexIndex + 1;

    previousIndex = index;
    ++vertexIndex;
  }

  return offset;
}

/**
 * 指定从高度图创建的地形质量。值为1.0将确保相邻高度图顶点
 * 的间距不超过 {@link Globe.maximumScreenSpaceError} 个屏幕像素，但可能会非常慢。
 * 值为0.5将把估计的零级几何误差减半，从而允许相邻高度图顶点之间
 * 有两倍的屏幕像素，因此渲染更快。
 * @type {number}
 */
TerrainProvider.heightmapTerrainQuality = 0.25;

/**
 * 当几何形状来自于高度图时，确定适当的几何误差估计值。
 *
 * @param {Ellipsoid} ellipsoid 地形所附属的椭球体。
 * @param {number} tileImageWidth 与单个瓦片关联的高度图的宽度（以像素为单位）。
 * @param {number} numberOfTilesAtLevelZero 在零级瓦片的水平方向上的瓦片数量。
 * @returns {number} 估计的几何误差。
 */

TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap = function (
  ellipsoid,
  tileImageWidth,
  numberOfTilesAtLevelZero,
) {
  return (
    (ellipsoid.maximumRadius *
      2 *
      Math.PI *
      TerrainProvider.heightmapTerrainQuality) /
    (tileImageWidth * numberOfTilesAtLevelZero)
  );
};

/**
 * 请求给定瓦片的几何形状。结果必须包括地形数据，并且
 * 还可以选择性地包括水面掩码和指示哪些子瓦片可用的信息。
 * @function
 *
 * @param {number} x 要请求几何形状的瓦片的X坐标。
 * @param {number} y 要请求几何形状的瓦片的Y坐标。
 * @param {number} level 要请求几何形状的瓦片级别。
 * @param {Request} [request] 请求对象。仅用于内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求的几何形状的承诺。如果此方法
 *          返回undefined而不是承诺，则表示已经有太多请求在等待，
 *          该请求将在稍后重试。
 */
TerrainProvider.prototype.requestTileGeometry =
  DeveloperError.throwInstantiationError;

/**
 * 获取给定级别瓦片中允许的最大几何误差。
 * @function
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

TerrainProvider.prototype.getLevelMaximumGeometricError =
  DeveloperError.throwInstantiationError;

/**
 * 确定某个瓦片的数据是否可以加载。
 * @function
 *
 * @param {number} x 要请求几何形状的瓦片的X坐标。
 * @param {number} y 要请求几何形状的瓦片的Y坐标。
 * @param {number} level 要请求几何形状的瓦片级别。
 * @returns {boolean|undefined} 如果地形提供者不支持，返回undefined；否则返回true或false。
 */
TerrainProvider.prototype.getTileDataAvailable =
  DeveloperError.throwInstantiationError;

/**
 * 确保我们加载瓦片的可用性数据。
 * @function
 *
 * @param {number} x 要请求几何形状的瓦片的X坐标。
 * @param {number} y 要请求几何形状的瓦片的Y坐标。
 * @param {number} level 要请求几何形状的瓦片级别。
 * @returns {undefined|Promise<void>} 如果不需要加载任何内容，则返回undefined；否则返回一个Promise，在所有所需瓦片加载完成时解析。
 */

TerrainProvider.prototype.loadTileDataAvailability =
  DeveloperError.throwInstantiationError;
export default TerrainProvider;

/**
 * 当发生错误时调用的函数。
 * @callback TerrainProvider.ErrorEvent
 *
 * @this TerrainProvider
 * @param {TileProviderError} err 一个包含发生错误的详细信息的对象。
 */

