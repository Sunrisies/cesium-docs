import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import GeographicProjection from "./GeographicProjection.js";
import HeightmapEncoding from "./HeightmapEncoding.js";
import HeightmapTessellator from "./HeightmapTessellator.js";
import CesiumMath from "./Math.js";
import OrientedBoundingBox from "./OrientedBoundingBox.js";
import Rectangle from "./Rectangle.js";
import TaskProcessor from "./TaskProcessor.js";
import TerrainData from "./TerrainData.js";
import TerrainEncoding from "./TerrainEncoding.js";
import TerrainMesh from "./TerrainMesh.js";
import TerrainProvider from "./TerrainProvider.js";
/**
 * 单个瓦片的地形数据，其中地形数据表示为高度图。高度图
 * 是一个矩形的高度数组，按行主序从北到南和从西到东排列。
 *
 * @alias HeightmapTerrainData
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} options.buffer 包含高度数据的缓冲区。
 * @param {number} options.width 高度图的宽度（经度方向），以样本为单位。
 * @param {number} options.height 高度图的高度（纬度方向），以样本为单位。
 * @param {number} [options.childTileMask=15] 表示此瓦片的四个子瓦片是否存在的位掩码。
 *                 如果子瓦片的位被设置，则在需要时也会请求该瓦片的几何图形。
 *                 如果位被清除，则不请求子瓦片，而是从父瓦片上采样几何图形。位值如下：
 *                 <table>
 *                  <tr><th>位位置</th><th>位值</th><th>子瓦片</th></tr>
 *                  <tr><td>0</td><td>1</td><td>西南</td></tr>
 *                  <tr><td>1</td><td>2</td><td>东南</td></tr>
 *                  <tr><td>2</td><td>4</td><td>西北</td></tr>
 *                  <tr><td>3</td><td>8</td><td>东北</td></tr>
 *                 </table>
 * @param {Uint8Array} [options.waterMask] 此地形数据中包含的水域掩码（如果有的话）。水域掩码是一个方形
 *                     的 Uint8Array 或图像，其中值为 255 表示水，值为 0 表示陆地。
 *                     允许0到255之间的值，以平滑地过渡于陆地和水域之间。
 * @param {object} [options.structure] 描述高度数据结构的对象。
 * @param {number} [options.structure.heightScale=1.0] 用于获得
 *                 高度（以米为单位）上方的高度样本的因子。高度偏移会在乘以缩放值后添加到结果
 *                 高度中。
 * @param {number} [options.structure.heightOffset=0.0] 要添加到缩放高度以获得最终
 *                 高度（以米为单位）的偏移量。偏移量在高度样本乘以
 *                 heightScale 之后添加。
 * @param {number} [options.structure.elementsPerHeight=1] 组成单个高度样本的缓冲区中的元素数量。
 *                 这通常为 1，表示每个元素都是一个单独的高度样本。如果
 *                 大于 1，则该数字的元素共同组成高度样本，该样本根据
 *                 structure.elementMultiplier 和 structure.isBigEndian 属性计算。
 * @param {number} [options.structure.stride=1] 获取从一个高度的第一个元素
 *                 到下一个高度的第一个元素需要跳过的元素数量。
 * @param {number} [options.structure.elementMultiplier=256.0] 当
 *                 stride 属性大于 1 时，用于计算高度值的乘数。
 *                 例如，如果模数为 4，模数乘数为 256，则高度计算为：
 *                 `height = buffer[index] + buffer[index + 1] * 256 + buffer[index + 2] * 256 * 256 + buffer[index + 3] * 256 * 256 * 256`
 *                 假设 isBigEndian 属性为 false。如果为 true，则元素的顺序会被反转。
 * @param {boolean} [options.structure.isBigEndian=false] 当
 *                  stride 属性大于 1 时，指示缓冲区中元素的字节序。如果此属性为 false，
 *                  则第一个元素为低位元素。如果为 true，则第一个元素为高位元素。
 * @param {number} [options.structure.lowestEncodedHeight] 可以存储在高度缓冲区中的最低值。任何在使用
 *                 `heightScale` 和 `heightOffset` 编码后低于此值的高度将被限制为此值。
 *                 例如，如果高度缓冲区为 `Uint16Array`，则此值应为 0，因为 `Uint16Array` 无法存储负数。如果未指定此参数，则不强制最低值。
 * @param {number} [options.structure.highestEncodedHeight] 可以存储在高度缓冲区中的最高值。任何在使用
 *                 `heightScale` 和 `heightOffset` 编码后高于此值的高度将被限制为此值。
 *                 例如，如果高度缓冲区为 `Uint16Array`，则此值应为 `256 * 256 - 1` 或 65535，因为 `Uint16Array` 无法存储大于 65535 的数字。如果未指定此参数，则不强制最高值。
 * @param {HeightmapEncoding} [options.encoding=HeightmapEncoding.NONE] 用于缓冲区的编码。
 * @param {boolean} [options.createdByUpsampling=false] 如果此实例是通过上采样另一个实例创建的，则为 true；
 *                  否则为 false。
 *
 *
 * @example
 * const buffer = ...
 * const heightBuffer = new Uint16Array(buffer, 0, that._heightmapWidth * that._heightmapWidth);
 * const childTileMask = new Uint8Array(buffer, heightBuffer.byteLength, 1)[0];
 * const waterMask = new Uint8Array(buffer, heightBuffer.byteLength + 1, buffer.byteLength - heightBuffer.byteLength - 1);
 * const terrainData = new Cesium.HeightmapTerrainData({
 *   buffer : heightBuffer,
 *   width : 65,
 *   height : 65,
 *   childTileMask : childTileMask,
 *   waterMask : waterMask
 * });
 *
 * @see TerrainData
 * @see QuantizedMeshTerrainData
 * @see GoogleEarthEnterpriseTerrainData
 */
function HeightmapTerrainData(options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(options) || !defined(options.buffer)) {
    throw new DeveloperError("options.buffer is required.");
  }
  if (!defined(options.width)) {
    throw new DeveloperError("options.width is required.");
  }
  if (!defined(options.height)) {
    throw new DeveloperError("options.height is required.");
  }
  //>>includeEnd('debug');

  this._buffer = options.buffer;
  this._width = options.width;
  this._height = options.height;
  this._childTileMask = defaultValue(options.childTileMask, 15);
  this._encoding = defaultValue(options.encoding, HeightmapEncoding.NONE);

  const defaultStructure = HeightmapTessellator.DEFAULT_STRUCTURE;
  let structure = options.structure;
  if (!defined(structure)) {
    structure = defaultStructure;
  } else if (structure !== defaultStructure) {
    structure.heightScale = defaultValue(
      structure.heightScale,
      defaultStructure.heightScale,
    );
    structure.heightOffset = defaultValue(
      structure.heightOffset,
      defaultStructure.heightOffset,
    );
    structure.elementsPerHeight = defaultValue(
      structure.elementsPerHeight,
      defaultStructure.elementsPerHeight,
    );
    structure.stride = defaultValue(structure.stride, defaultStructure.stride);
    structure.elementMultiplier = defaultValue(
      structure.elementMultiplier,
      defaultStructure.elementMultiplier,
    );
    structure.isBigEndian = defaultValue(
      structure.isBigEndian,
      defaultStructure.isBigEndian,
    );
  }

  this._structure = structure;
  this._createdByUpsampling = defaultValue(options.createdByUpsampling, false);
  this._waterMask = options.waterMask;

  this._skirtHeight = undefined;
  this._bufferType =
    this._encoding === HeightmapEncoding.LERC
      ? Float32Array
      : this._buffer.constructor;
  this._mesh = undefined;
}

Object.defineProperties(HeightmapTerrainData.prototype, {
  /**
   * 此瓦片的信用数组。
   * @memberof HeightmapTerrainData.prototype
   * @type {Credit[]}
   */
  credits: {
    get: function () {
      return undefined;
    },
  },
  /**
   * 此地形数据中包含的水域掩码（如果有的话）。水域掩码是一个方形
   * Uint8Array 或图像，其中值为 255 表示水，值为 0 表示陆地。
   * 允许 0 到 255 之间的值，以平滑地过渡于陆地和水域之间。
   * @memberof HeightmapTerrainData.prototype
   * @type {Uint8Array|HTMLImageElement|HTMLCanvasElement}
   */

  waterMask: {
    get: function () {
      return this._waterMask;
    },
  },

  childTileMask: {
    get: function () {
      return this._childTileMask;
    },
  },
});

const createMeshTaskName = "createVerticesFromHeightmap";
const createMeshTaskProcessorNoThrottle = new TaskProcessor(createMeshTaskName);
const createMeshTaskProcessorThrottle = new TaskProcessor(
  createMeshTaskName,
  TerrainData.maximumAsynchronousTasks,
);

/**
 * 从此地形数据创建一个 {@link TerrainMesh}。
 *
 * @private
 *
 * @param {object} options 包含以下属性的对象：
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的瓦片方案。
 * @param {number} options.x 要创建地形数据的瓦片的 X 坐标。
 * @param {number} options.y 要创建地形数据的瓦片的 Y 坐标。
 * @param {number} options.level 要创建地形数据的瓦片的级别。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 用于夸大地形的相对高度。
 * @param {boolean} [options.throttle=true] 如果为 true，指示如果已有过多异步网格创建正在进行，此操作需要重试。
 * @returns {Promise<TerrainMesh>|undefined} 地形网格的 Promise，如果已有过多异步网格创建正在进行，则返回 undefined，操作应稍后重试。
 */

HeightmapTerrainData.prototype.createMesh = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.tilingScheme", options.tilingScheme);
  Check.typeOf.number("options.x", options.x);
  Check.typeOf.number("options.y", options.y);
  Check.typeOf.number("options.level", options.level);
  //>>includeEnd('debug');

  const tilingScheme = options.tilingScheme;
  const x = options.x;
  const y = options.y;
  const level = options.level;
  const exaggeration = defaultValue(options.exaggeration, 1.0);
  const exaggerationRelativeHeight = defaultValue(
    options.exaggerationRelativeHeight,
    0.0,
  );
  const throttle = defaultValue(options.throttle, true);

  const ellipsoid = tilingScheme.ellipsoid;
  const nativeRectangle = tilingScheme.tileXYToNativeRectangle(x, y, level);
  const rectangle = tilingScheme.tileXYToRectangle(x, y, level);

  // Compute the center of the tile for RTC rendering.
  const center = ellipsoid.cartographicToCartesian(Rectangle.center(rectangle));

  const structure = this._structure;

  const levelZeroMaxError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      ellipsoid,
      this._width,
      tilingScheme.getNumberOfXTilesAtLevel(0),
    );
  const thisLevelMaxError = levelZeroMaxError / (1 << level);
  this._skirtHeight = Math.min(thisLevelMaxError * 4.0, 1000.0);

  const createMeshTaskProcessor = throttle
    ? createMeshTaskProcessorThrottle
    : createMeshTaskProcessorNoThrottle;

  const verticesPromise = createMeshTaskProcessor.scheduleTask({
    heightmap: this._buffer,
    structure: structure,
    includeWebMercatorT: true,
    width: this._width,
    height: this._height,
    nativeRectangle: nativeRectangle,
    rectangle: rectangle,
    relativeToCenter: center,
    ellipsoid: ellipsoid,
    skirtHeight: this._skirtHeight,
    isGeographic: tilingScheme.projection instanceof GeographicProjection,
    exaggeration: exaggeration,
    exaggerationRelativeHeight: exaggerationRelativeHeight,
    encoding: this._encoding,
  });

  if (!defined(verticesPromise)) {
    // Postponed
    return undefined;
  }

  const that = this;
  return Promise.resolve(verticesPromise).then(function (result) {
    let indicesAndEdges;
    if (that._skirtHeight > 0.0) {
      indicesAndEdges =
        TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices(
          result.gridWidth,
          result.gridHeight,
        );
    } else {
      indicesAndEdges = TerrainProvider.getRegularGridIndicesAndEdgeIndices(
        result.gridWidth,
        result.gridHeight,
      );
    }

    const vertexCountWithoutSkirts = result.gridWidth * result.gridHeight;

    // Clone complex result objects because the transfer from the web worker
    // has stripped them down to JSON-style objects.
    that._mesh = new TerrainMesh(
      center,
      new Float32Array(result.vertices),
      indicesAndEdges.indices,
      indicesAndEdges.indexCountWithoutSkirts,
      vertexCountWithoutSkirts,
      result.minimumHeight,
      result.maximumHeight,
      BoundingSphere.clone(result.boundingSphere3D),
      Cartesian3.clone(result.occludeePointInScaledSpace),
      result.numberOfAttributes,
      OrientedBoundingBox.clone(result.orientedBoundingBox),
      TerrainEncoding.clone(result.encoding),
      indicesAndEdges.westIndicesSouthToNorth,
      indicesAndEdges.southIndicesEastToWest,
      indicesAndEdges.eastIndicesNorthToSouth,
      indicesAndEdges.northIndicesWestToEast,
    );

    // Free memory received from server after mesh is created.
    that._buffer = undefined;
    return that._mesh;
  });
};

/**
 * @param {object} options 包含以下属性的对象：
 * @param {TilingScheme} options.tilingScheme 此瓦片所属的瓦片方案。
 * @param {number} options.x 要创建地形数据的瓦片的 X 坐标。
 * @param {number} options.y 要创建地形数据的瓦片的 Y 坐标。
 * @param {number} options.level 要创建地形数据的瓦片的级别。
 * @param {number} [options.exaggeration=1.0] 用于夸大地形的比例。
 * @param {number} [options.exaggerationRelativeHeight=0.0] 用于夸大地形的相对高度。
 *
 * @private
 */

HeightmapTerrainData.prototype._createMeshSync = function (options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.tilingScheme", options.tilingScheme);
  Check.typeOf.number("options.x", options.x);
  Check.typeOf.number("options.y", options.y);
  Check.typeOf.number("options.level", options.level);
  //>>includeEnd('debug');

  const tilingScheme = options.tilingScheme;
  const x = options.x;
  const y = options.y;
  const level = options.level;
  const exaggeration = defaultValue(options.exaggeration, 1.0);
  const exaggerationRelativeHeight = defaultValue(
    options.exaggerationRelativeHeight,
    0.0,
  );

  const ellipsoid = tilingScheme.ellipsoid;
  const nativeRectangle = tilingScheme.tileXYToNativeRectangle(x, y, level);
  const rectangle = tilingScheme.tileXYToRectangle(x, y, level);

  // Compute the center of the tile for RTC rendering.
  const center = ellipsoid.cartographicToCartesian(Rectangle.center(rectangle));

  const structure = this._structure;

  const levelZeroMaxError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      ellipsoid,
      this._width,
      tilingScheme.getNumberOfXTilesAtLevel(0),
    );
  const thisLevelMaxError = levelZeroMaxError / (1 << level);
  this._skirtHeight = Math.min(thisLevelMaxError * 4.0, 1000.0);

  const result = HeightmapTessellator.computeVertices({
    heightmap: this._buffer,
    structure: structure,
    includeWebMercatorT: true,
    width: this._width,
    height: this._height,
    nativeRectangle: nativeRectangle,
    rectangle: rectangle,
    relativeToCenter: center,
    ellipsoid: ellipsoid,
    skirtHeight: this._skirtHeight,
    isGeographic: tilingScheme.projection instanceof GeographicProjection,
    exaggeration: exaggeration,
    exaggerationRelativeHeight: exaggerationRelativeHeight,
  });

  // Free memory received from server after mesh is created.
  this._buffer = undefined;

  let indicesAndEdges;
  if (this._skirtHeight > 0.0) {
    indicesAndEdges =
      TerrainProvider.getRegularGridAndSkirtIndicesAndEdgeIndices(
        this._width,
        this._height,
      );
  } else {
    indicesAndEdges = TerrainProvider.getRegularGridIndicesAndEdgeIndices(
      this._width,
      this._height,
    );
  }

  const vertexCountWithoutSkirts = result.gridWidth * result.gridHeight;

  // No need to clone here (as we do in the async version) because the result
  // is not coming from a web worker.
  this._mesh = new TerrainMesh(
    center,
    result.vertices,
    indicesAndEdges.indices,
    indicesAndEdges.indexCountWithoutSkirts,
    vertexCountWithoutSkirts,
    result.minimumHeight,
    result.maximumHeight,
    result.boundingSphere3D,
    result.occludeePointInScaledSpace,
    result.encoding.stride,
    result.orientedBoundingBox,
    result.encoding,
    indicesAndEdges.westIndicesSouthToNorth,
    indicesAndEdges.southIndicesEastToWest,
    indicesAndEdges.eastIndicesNorthToSouth,
    indicesAndEdges.northIndicesWestToEast,
  );

  return this._mesh;
};

/**
 * 计算指定经度和纬度处的地形高度。
 *
 * @param {Rectangle} rectangle 此地形数据覆盖的矩形区域。
 * @param {number} longitude 经度（以弧度为单位）。
 * @param {number} latitude 纬度（以弧度为单位）。
 * @returns {number} 指定位置的地形高度。如果该位置在矩形外部，则此方法将外推高度，
 *          对于远离矩形的位置，高度可能会非常不准确。
 */

HeightmapTerrainData.prototype.interpolateHeight = function (
  rectangle,
  longitude,
  latitude,
) {
  const width = this._width;
  const height = this._height;

  const structure = this._structure;
  const stride = structure.stride;
  const elementsPerHeight = structure.elementsPerHeight;
  const elementMultiplier = structure.elementMultiplier;
  const isBigEndian = structure.isBigEndian;
  const heightOffset = structure.heightOffset;
  const heightScale = structure.heightScale;

  const isMeshCreated = defined(this._mesh);
  const isLERCEncoding = this._encoding === HeightmapEncoding.LERC;
  const isInterpolationImpossible = !isMeshCreated && isLERCEncoding;
  if (isInterpolationImpossible) {
    // We can't interpolate using the buffer because it's LERC encoded
    //  so please call createMesh() first and interpolate using the mesh;
    //  as mesh creation will decode the LERC buffer
    return undefined;
  }

  let heightSample;
  if (isMeshCreated) {
    const buffer = this._mesh.vertices;
    const encoding = this._mesh.encoding;
    heightSample = interpolateMeshHeight(
      buffer,
      encoding,
      heightOffset,
      heightScale,
      rectangle,
      width,
      height,
      longitude,
      latitude,
    );
  } else {
    heightSample = interpolateHeight(
      this._buffer,
      elementsPerHeight,
      elementMultiplier,
      stride,
      isBigEndian,
      rectangle,
      width,
      height,
      longitude,
      latitude,
    );
    heightSample = heightSample * heightScale + heightOffset;
  }

  return heightSample;
};

/**
 * 为后代瓦片上采样此地形数据。结果实例将包含此实例中的高度样本的子集，
 * 如有必要，则进行插值。
 *
 * @param {TilingScheme} tilingScheme 此地形数据的瓦片方案。
 * @param {number} thisX 此瓦片在瓦片方案中的 X 坐标。
 * @param {number} thisY 此瓦片在瓦片方案中的 Y 坐标。
 * @param {number} thisLevel 此瓦片在瓦片方案中的级别。
 * @param {number} descendantX 我们要为其上采样的后代瓦片在瓦片方案中的 X 坐标。
 * @param {number} descendantY 我们要为其上采样的后代瓦片在瓦片方案中的 Y 坐标。
 * @param {number} descendantLevel 我们要为其上采样的后代瓦片在瓦片方案中的级别。
 * @returns {Promise<HeightmapTerrainData>|undefined} 后代瓦片上采样的高度图地形数据的 Promise，
 *          如果网格不可用，则返回 undefined。
 */

HeightmapTerrainData.prototype.upsample = function (
  tilingScheme,
  thisX,
  thisY,
  thisLevel,
  descendantX,
  descendantY,
  descendantLevel,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(tilingScheme)) {
    throw new DeveloperError("tilingScheme is required.");
  }
  if (!defined(thisX)) {
    throw new DeveloperError("thisX is required.");
  }
  if (!defined(thisY)) {
    throw new DeveloperError("thisY is required.");
  }
  if (!defined(thisLevel)) {
    throw new DeveloperError("thisLevel is required.");
  }
  if (!defined(descendantX)) {
    throw new DeveloperError("descendantX is required.");
  }
  if (!defined(descendantY)) {
    throw new DeveloperError("descendantY is required.");
  }
  if (!defined(descendantLevel)) {
    throw new DeveloperError("descendantLevel is required.");
  }
  const levelDifference = descendantLevel - thisLevel;
  if (levelDifference > 1) {
    throw new DeveloperError(
      "Upsampling through more than one level at a time is not currently supported.",
    );
  }
  //>>includeEnd('debug');

  const meshData = this._mesh;
  if (!defined(meshData)) {
    return undefined;
  }

  const width = this._width;
  const height = this._height;
  const structure = this._structure;
  const stride = structure.stride;

  const heights = new this._bufferType(width * height * stride);

  const buffer = meshData.vertices;
  const encoding = meshData.encoding;

  // PERFORMANCE_IDEA: don't recompute these rectangles - the caller already knows them.
  const sourceRectangle = tilingScheme.tileXYToRectangle(
    thisX,
    thisY,
    thisLevel,
  );
  const destinationRectangle = tilingScheme.tileXYToRectangle(
    descendantX,
    descendantY,
    descendantLevel,
  );

  const heightOffset = structure.heightOffset;
  const heightScale = structure.heightScale;

  const elementsPerHeight = structure.elementsPerHeight;
  const elementMultiplier = structure.elementMultiplier;
  const isBigEndian = structure.isBigEndian;

  const divisor = Math.pow(elementMultiplier, elementsPerHeight - 1);

  for (let j = 0; j < height; ++j) {
    const latitude = CesiumMath.lerp(
      destinationRectangle.north,
      destinationRectangle.south,
      j / (height - 1),
    );
    for (let i = 0; i < width; ++i) {
      const longitude = CesiumMath.lerp(
        destinationRectangle.west,
        destinationRectangle.east,
        i / (width - 1),
      );
      let heightSample = interpolateMeshHeight(
        buffer,
        encoding,
        heightOffset,
        heightScale,
        sourceRectangle,
        width,
        height,
        longitude,
        latitude,
      );

      // Use conditionals here instead of Math.min and Math.max so that an undefined
      // lowestEncodedHeight or highestEncodedHeight has no effect.
      heightSample =
        heightSample < structure.lowestEncodedHeight
          ? structure.lowestEncodedHeight
          : heightSample;
      heightSample =
        heightSample > structure.highestEncodedHeight
          ? structure.highestEncodedHeight
          : heightSample;

      setHeight(
        heights,
        elementsPerHeight,
        elementMultiplier,
        divisor,
        stride,
        isBigEndian,
        j * width + i,
        heightSample,
      );
    }
  }

  return Promise.resolve(
    new HeightmapTerrainData({
      buffer: heights,
      width: width,
      height: height,
      childTileMask: 0,
      structure: this._structure,
      createdByUpsampling: true,
    }),
  );
};

/**
 * 根据 {@link HeightmapTerrainData.childTileMask} 确定给定子瓦片是否可用。
 * 假设给定的子瓦片坐标是此瓦片的四个子瓦片之一。
 * 如果给定的是非子瓦片坐标，则返回东南子瓦片的可用性。
 *
 * @param {number} thisX 此（父）瓦片的 X 坐标。
 * @param {number} thisY 此（父）瓦片的 Y 坐标。
 * @param {number} childX 要检查可用性的子瓦片的 X 坐标。
 * @param {number} childY 要检查可用性的子瓦片的 Y 坐标。
 * @returns {boolean} 如果子瓦片可用，则返回 true；否则，返回 false。
 */

HeightmapTerrainData.prototype.isChildAvailable = function (
  thisX,
  thisY,
  childX,
  childY,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(thisX)) {
    throw new DeveloperError("thisX is required.");
  }
  if (!defined(thisY)) {
    throw new DeveloperError("thisY is required.");
  }
  if (!defined(childX)) {
    throw new DeveloperError("childX is required.");
  }
  if (!defined(childY)) {
    throw new DeveloperError("childY is required.");
  }
  //>>includeEnd('debug');

  let bitNumber = 2; // northwest child
  if (childX !== thisX * 2) {
    ++bitNumber; // east child
  }
  if (childY !== thisY * 2) {
    bitNumber -= 2; // south child
  }

  return (this._childTileMask & (1 << bitNumber)) !== 0;
};

/**
 * 获取一个值，指示此地形数据是否是通过上采样较低分辨率的
 * 地形数据创建的。如果该值为 false，则数据是从其他来源获取的，
 * 例如通过从远程服务器下载。此方法应对从 {@link HeightmapTerrainData#upsample}
 * 调用返回的实例返回 true。
 *
 * @returns {boolean} 如果此实例是通过上采样创建的，则返回 true；否则返回 false。
 */

HeightmapTerrainData.prototype.wasCreatedByUpsampling = function () {
  return this._createdByUpsampling;
};

function interpolateHeight(
  sourceHeights,
  elementsPerHeight,
  elementMultiplier,
  stride,
  isBigEndian,
  sourceRectangle,
  width,
  height,
  longitude,
  latitude,
) {
  const fromWest =
    ((longitude - sourceRectangle.west) * (width - 1)) /
    (sourceRectangle.east - sourceRectangle.west);
  const fromSouth =
    ((latitude - sourceRectangle.south) * (height - 1)) /
    (sourceRectangle.north - sourceRectangle.south);

  let westInteger = fromWest | 0;
  let eastInteger = westInteger + 1;
  if (eastInteger >= width) {
    eastInteger = width - 1;
    westInteger = width - 2;
  }

  let southInteger = fromSouth | 0;
  let northInteger = southInteger + 1;
  if (northInteger >= height) {
    northInteger = height - 1;
    southInteger = height - 2;
  }

  const dx = fromWest - westInteger;
  const dy = fromSouth - southInteger;

  southInteger = height - 1 - southInteger;
  northInteger = height - 1 - northInteger;

  const southwestHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    southInteger * width + westInteger,
  );
  const southeastHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    southInteger * width + eastInteger,
  );
  const northwestHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    northInteger * width + westInteger,
  );
  const northeastHeight = getHeight(
    sourceHeights,
    elementsPerHeight,
    elementMultiplier,
    stride,
    isBigEndian,
    northInteger * width + eastInteger,
  );

  return triangleInterpolateHeight(
    dx,
    dy,
    southwestHeight,
    southeastHeight,
    northwestHeight,
    northeastHeight,
  );
}

function interpolateMeshHeight(
  buffer,
  encoding,
  heightOffset,
  heightScale,
  sourceRectangle,
  width,
  height,
  longitude,
  latitude,
) {
  // returns a height encoded according to the structure's heightScale and heightOffset.
  const fromWest =
    ((longitude - sourceRectangle.west) * (width - 1)) /
    (sourceRectangle.east - sourceRectangle.west);
  const fromSouth =
    ((latitude - sourceRectangle.south) * (height - 1)) /
    (sourceRectangle.north - sourceRectangle.south);

  let westInteger = fromWest | 0;
  let eastInteger = westInteger + 1;
  if (eastInteger >= width) {
    eastInteger = width - 1;
    westInteger = width - 2;
  }

  let southInteger = fromSouth | 0;
  let northInteger = southInteger + 1;
  if (northInteger >= height) {
    northInteger = height - 1;
    southInteger = height - 2;
  }

  const dx = fromWest - westInteger;
  const dy = fromSouth - southInteger;

  southInteger = height - 1 - southInteger;
  northInteger = height - 1 - northInteger;

  const southwestHeight =
    (encoding.decodeHeight(buffer, southInteger * width + westInteger) -
      heightOffset) /
    heightScale;
  const southeastHeight =
    (encoding.decodeHeight(buffer, southInteger * width + eastInteger) -
      heightOffset) /
    heightScale;
  const northwestHeight =
    (encoding.decodeHeight(buffer, northInteger * width + westInteger) -
      heightOffset) /
    heightScale;
  const northeastHeight =
    (encoding.decodeHeight(buffer, northInteger * width + eastInteger) -
      heightOffset) /
    heightScale;

  return triangleInterpolateHeight(
    dx,
    dy,
    southwestHeight,
    southeastHeight,
    northwestHeight,
    northeastHeight,
  );
}

function triangleInterpolateHeight(
  dX,
  dY,
  southwestHeight,
  southeastHeight,
  northwestHeight,
  northeastHeight,
) {
  // The HeightmapTessellator bisects the quad from southwest to northeast.
  if (dY < dX) {
    // Lower right triangle
    return (
      southwestHeight +
      dX * (southeastHeight - southwestHeight) +
      dY * (northeastHeight - southeastHeight)
    );
  }

  // Upper left triangle
  return (
    southwestHeight +
    dX * (northeastHeight - northwestHeight) +
    dY * (northwestHeight - southwestHeight)
  );
}

function getHeight(
  heights,
  elementsPerHeight,
  elementMultiplier,
  stride,
  isBigEndian,
  index,
) {
  index *= stride;

  let height = 0;
  let i;

  if (isBigEndian) {
    for (i = 0; i < elementsPerHeight; ++i) {
      height = height * elementMultiplier + heights[index + i];
    }
  } else {
    for (i = elementsPerHeight - 1; i >= 0; --i) {
      height = height * elementMultiplier + heights[index + i];
    }
  }

  return height;
}

function setHeight(
  heights,
  elementsPerHeight,
  elementMultiplier,
  divisor,
  stride,
  isBigEndian,
  index,
  height,
) {
  index *= stride;

  let i;
  if (isBigEndian) {
    for (i = 0; i < elementsPerHeight - 1; ++i) {
      heights[index + i] = (height / divisor) | 0;
      height -= heights[index + i] * divisor;
      divisor /= elementMultiplier;
    }
  } else {
    for (i = elementsPerHeight - 1; i > 0; --i) {
      heights[index + i] = (height / divisor) | 0;
      height -= heights[index + i] * divisor;
      divisor /= elementMultiplier;
    }
  }
  heights[index + i] = height;
}
export default HeightmapTerrainData;
