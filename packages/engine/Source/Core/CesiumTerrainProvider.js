import AttributeCompression from "./AttributeCompression.js";
import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import WebMercatorTilingScheme from "./WebMercatorTilingScheme.js";
import getJsonFromTypedArray from "./getJsonFromTypedArray.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import IndexDatatype from "./IndexDatatype.js";
import IonResource from "./IonResource.js";
import OrientedBoundingBox from "./OrientedBoundingBox.js";
import QuantizedMeshTerrainData from "./QuantizedMeshTerrainData.js";
import Request from "./Request.js";
import RequestType from "./RequestType.js";
import Resource from "./Resource.js";
import RuntimeError from "./RuntimeError.js";
import TerrainProvider from "./TerrainProvider.js";
import TileAvailability from "./TileAvailability.js";
import TileProviderError from "./TileProviderError.js";

function LayerInformation(layer) {
  this.resource = layer.resource;
  this.version = layer.version;
  this.isHeightmap = layer.isHeightmap;
  this.tileUrlTemplates = layer.tileUrlTemplates;
  this.availability = layer.availability;
  this.hasVertexNormals = layer.hasVertexNormals;
  this.hasWaterMask = layer.hasWaterMask;
  this.hasMetadata = layer.hasMetadata;
  this.availabilityLevels = layer.availabilityLevels;
  this.availabilityTilesLoaded = layer.availabilityTilesLoaded;
  this.littleEndianExtensionSize = layer.littleEndianExtensionSize;
  this.availabilityPromiseCache = {};
}

/**
 * @typedef {Object} CesiumTerrainProvider.ConstructorOptions
 *
 * CesiumTerrainProvider 构造函数的初始化选项
 *
 * @property {boolean} [requestVertexNormals=false] 标志，指示客户端是否应向服务器请求额外的光照信息，以每个顶点法线的形式（如果可用）。
 * @property {boolean} [requestWaterMask=false] 标志，指示客户端是否应向服务器请求每个瓦片的水掩模（如果可用）。
 * @property {boolean} [requestMetadata=true] 标志，指示客户端是否应向服务器请求每个瓦片的元数据（如果可用）。
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 椭球体。如果未指定，则使用默认椭球体。
 * @property {Credit|string} [credit] 数据源的信用信息，将显示在画布上。
 */


/**
 * 用于跟踪在获取初始元数据时的创建细节
 *
 * @constructor
 * @private
 *
 * @param {CesiumTerrainProvider.ConstructorOptions} options 描述初始化选项的对象
 */

function TerrainProviderBuilder(options) {
  this.requestVertexNormals = defaultValue(options.requestVertexNormals, false);
  this.requestWaterMask = defaultValue(options.requestWaterMask, false);
  this.requestMetadata = defaultValue(options.requestMetadata, true);
  this.ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);

  this.heightmapWidth = 65;
  this.heightmapStructure = undefined;
  this.hasWaterMask = false;
  this.hasMetadata = false;
  this.hasVertexNormals = false;
  this.scheme = undefined;

  this.lastResource = undefined;
  this.layerJsonResource = undefined;
  this.previousError = undefined;
  this.availability = undefined;
  this.tilingScheme = undefined;
  this.levelZeroMaximumGeometricError = undefined;
  this.heightmapStructure = undefined;
  this.layers = [];
  this.attribution = "";
  this.overallAvailability = [];
  this.overallMaxZoom = 0;
  this.tileCredits = [];
}

/**
 * 根据构建器的值完成 CesiumTerrainProvider 的创建。
 *
 * @private
 *
 * @param {CesiumTerrainProvider} provider
 */

TerrainProviderBuilder.prototype.build = function (provider) {
  provider._heightmapWidth = this.heightmapWidth;
  provider._scheme = this.scheme;

  // ion resources have a credits property we can use for additional attribution.
  const credits = defined(this.lastResource.credits)
    ? this.lastResource.credits
    : [];
  provider._tileCredits = credits.concat(this.tileCredits);
  provider._availability = this.availability;
  provider._tilingScheme = this.tilingScheme;
  provider._requestWaterMask = this.requestWaterMask;
  provider._levelZeroMaximumGeometricError =
    this.levelZeroMaximumGeometricError;
  provider._heightmapStructure = this.heightmapStructure;
  provider._layers = this.layers;

  provider._hasWaterMask = this.hasWaterMask;
  provider._hasVertexNormals = this.hasVertexNormals;
  provider._hasMetadata = this.hasMetadata;
};

async function parseMetadataSuccess(terrainProviderBuilder, data, provider) {
  if (!data.format) {
    const message = "The tile format is not specified in the layer.json file.";
    terrainProviderBuilder.previousError = TileProviderError.reportError(
      terrainProviderBuilder.previousError,
      provider,
      defined(provider) ? provider._errorEvent : undefined,
      message,
    );

    throw new RuntimeError(message);
  }

  if (!data.tiles || data.tiles.length === 0) {
    const message =
      "The layer.json file does not specify any tile URL templates.";
    terrainProviderBuilder.previousError = TileProviderError.reportError(
      terrainProviderBuilder.previousError,
      provider,
      defined(provider) ? provider._errorEvent : undefined,
      message,
    );

    throw new RuntimeError(message);
  }

  let hasVertexNormals = false;
  let hasWaterMask = false;
  let hasMetadata = false;
  let littleEndianExtensionSize = true;
  let isHeightmap = false;
  if (data.format === "heightmap-1.0") {
    isHeightmap = true;
    if (!defined(terrainProviderBuilder.heightmapStructure)) {
      terrainProviderBuilder.heightmapStructure = {
        heightScale: 1.0 / 5.0,
        heightOffset: -1000.0,
        elementsPerHeight: 1,
        stride: 1,
        elementMultiplier: 256.0,
        isBigEndian: false,
        lowestEncodedHeight: 0,
        highestEncodedHeight: 256 * 256 - 1,
      };
    }
    hasWaterMask = true;
    terrainProviderBuilder.requestWaterMask = true;
  } else if (data.format.indexOf("quantized-mesh-1.") !== 0) {
    const message = `The tile format "${data.format}" is invalid or not supported.`;
    terrainProviderBuilder.previousError = TileProviderError.reportError(
      terrainProviderBuilder.previousError,
      provider,
      defined(provider) ? provider._errorEvent : undefined,
      message,
    );

    throw new RuntimeError(message);
  }

  const tileUrlTemplates = data.tiles;

  const maxZoom = data.maxzoom;
  terrainProviderBuilder.overallMaxZoom = Math.max(
    terrainProviderBuilder.overallMaxZoom,
    maxZoom,
  );

  // Keeps track of which of the availability containing tiles have been loaded
  if (!data.projection || data.projection === "EPSG:4326") {
    terrainProviderBuilder.tilingScheme = new GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1,
      ellipsoid: terrainProviderBuilder.ellipsoid,
    });
  } else if (data.projection === "EPSG:3857") {
    terrainProviderBuilder.tilingScheme = new WebMercatorTilingScheme({
      numberOfLevelZeroTilesX: 1,
      numberOfLevelZeroTilesY: 1,
      ellipsoid: terrainProviderBuilder.ellipsoid,
    });
  } else {
    const message = `The projection "${data.projection}" is invalid or not supported.`;
    terrainProviderBuilder.previousError = TileProviderError.reportError(
      terrainProviderBuilder.previousError,
      provider,
      defined(provider) ? provider._errorEvent : undefined,
      message,
    );

    throw new RuntimeError(message);
  }

  terrainProviderBuilder.levelZeroMaximumGeometricError =
    TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      terrainProviderBuilder.tilingScheme.ellipsoid,
      terrainProviderBuilder.heightmapWidth,
      terrainProviderBuilder.tilingScheme.getNumberOfXTilesAtLevel(0),
    );
  if (!data.scheme || data.scheme === "tms" || data.scheme === "slippyMap") {
    terrainProviderBuilder.scheme = data.scheme;
  } else {
    const message = `The scheme "${data.scheme}" is invalid or not supported.`;
    terrainProviderBuilder.previousError = TileProviderError.reportError(
      terrainProviderBuilder.previousError,
      provider,
      defined(provider) ? provider._errorEvent : undefined,
      message,
    );

    throw new RuntimeError(message);
  }

  let availabilityTilesLoaded;

  // The vertex normals defined in the 'octvertexnormals' extension is identical to the original
  // contents of the original 'vertexnormals' extension.  'vertexnormals' extension is now
  // deprecated, as the extensionLength for this extension was incorrectly using big endian.
  // We maintain backwards compatibility with the legacy 'vertexnormal' implementation
  // by setting the _littleEndianExtensionSize to false. Always prefer 'octvertexnormals'
  // over 'vertexnormals' if both extensions are supported by the server.
  if (
    defined(data.extensions) &&
    data.extensions.indexOf("octvertexnormals") !== -1
  ) {
    hasVertexNormals = true;
  } else if (
    defined(data.extensions) &&
    data.extensions.indexOf("vertexnormals") !== -1
  ) {
    hasVertexNormals = true;
    littleEndianExtensionSize = false;
  }
  if (defined(data.extensions) && data.extensions.indexOf("watermask") !== -1) {
    hasWaterMask = true;
  }
  if (defined(data.extensions) && data.extensions.indexOf("metadata") !== -1) {
    hasMetadata = true;
  }

  const availabilityLevels = data.metadataAvailability;
  const availableTiles = data.available;
  let availability;
  if (defined(availableTiles) && !defined(availabilityLevels)) {
    availability = new TileAvailability(
      terrainProviderBuilder.tilingScheme,
      availableTiles.length,
    );
    for (let level = 0; level < availableTiles.length; ++level) {
      const rangesAtLevel = availableTiles[level];
      const yTiles =
        terrainProviderBuilder.tilingScheme.getNumberOfYTilesAtLevel(level);
      if (!defined(terrainProviderBuilder.overallAvailability[level])) {
        terrainProviderBuilder.overallAvailability[level] = [];
      }

      for (
        let rangeIndex = 0;
        rangeIndex < rangesAtLevel.length;
        ++rangeIndex
      ) {
        const range = rangesAtLevel[rangeIndex];
        const yStart = yTiles - range.endY - 1;
        const yEnd = yTiles - range.startY - 1;
        terrainProviderBuilder.overallAvailability[level].push([
          range.startX,
          yStart,
          range.endX,
          yEnd,
        ]);
        availability.addAvailableTileRange(
          level,
          range.startX,
          yStart,
          range.endX,
          yEnd,
        );
      }
    }
  } else if (defined(availabilityLevels)) {
    availabilityTilesLoaded = new TileAvailability(
      terrainProviderBuilder.tilingScheme,
      maxZoom,
    );
    availability = new TileAvailability(
      terrainProviderBuilder.tilingScheme,
      maxZoom,
    );
    terrainProviderBuilder.overallAvailability[0] = [[0, 0, 1, 0]];
    availability.addAvailableTileRange(0, 0, 0, 1, 0);
  }

  terrainProviderBuilder.hasWaterMask =
    terrainProviderBuilder.hasWaterMask || hasWaterMask;
  terrainProviderBuilder.hasVertexNormals =
    terrainProviderBuilder.hasVertexNormals || hasVertexNormals;
  terrainProviderBuilder.hasMetadata =
    terrainProviderBuilder.hasMetadata || hasMetadata;

  if (defined(data.attribution)) {
    if (terrainProviderBuilder.attribution.length > 0) {
      terrainProviderBuilder.attribution += " ";
    }
    terrainProviderBuilder.attribution += data.attribution;
  }

  terrainProviderBuilder.layers.push(
    new LayerInformation({
      resource: terrainProviderBuilder.lastResource,
      version: data.version,
      isHeightmap: isHeightmap,
      tileUrlTemplates: tileUrlTemplates,
      availability: availability,
      hasVertexNormals: hasVertexNormals,
      hasWaterMask: hasWaterMask,
      hasMetadata: hasMetadata,
      availabilityLevels: availabilityLevels,
      availabilityTilesLoaded: availabilityTilesLoaded,
      littleEndianExtensionSize: littleEndianExtensionSize,
    }),
  );

  const parentUrl = data.parentUrl;
  if (defined(parentUrl)) {
    if (!defined(availability)) {
      console.log(
        "A layer.json can't have a parentUrl if it does't have an available array.",
      );
      return true;
    }

    terrainProviderBuilder.lastResource =
      terrainProviderBuilder.lastResource.getDerivedResource({
        url: parentUrl,
      });
    terrainProviderBuilder.lastResource.appendForwardSlash(); // Terrain always expects a directory
    terrainProviderBuilder.layerJsonResource =
      terrainProviderBuilder.lastResource.getDerivedResource({
        url: "layer.json",
      });
    await requestLayerJson(terrainProviderBuilder);
    return true;
  }

  return true;
}

function parseMetadataFailure(terrainProviderBuilder, error, provider) {
  let message = `An error occurred while accessing ${terrainProviderBuilder.layerJsonResource.url}.`;
  if (defined(error)) {
    message += `\n${error.message}`;
  }

  terrainProviderBuilder.previousError = TileProviderError.reportError(
    terrainProviderBuilder.previousError,
    provider,
    defined(provider) ? provider._errorEvent : undefined,
    message,
  );

  // If we can retry, do so. Otherwise throw the error.
  if (terrainProviderBuilder.previousError.retry) {
    return requestLayerJson(terrainProviderBuilder, provider);
  }

  throw new RuntimeError(message);
}

async function metadataSuccess(terrainProviderBuilder, data, provider) {
  await parseMetadataSuccess(terrainProviderBuilder, data, provider);

  const length = terrainProviderBuilder.overallAvailability.length;
  if (length > 0) {
    const availability = (terrainProviderBuilder.availability =
      new TileAvailability(
        terrainProviderBuilder.tilingScheme,
        terrainProviderBuilder.overallMaxZoom,
      ));
    for (let level = 0; level < length; ++level) {
      const levelRanges = terrainProviderBuilder.overallAvailability[level];
      for (let i = 0; i < levelRanges.length; ++i) {
        const range = levelRanges[i];
        availability.addAvailableTileRange(
          level,
          range[0],
          range[1],
          range[2],
          range[3],
        );
      }
    }
  }

  if (terrainProviderBuilder.attribution.length > 0) {
    const layerJsonCredit = new Credit(terrainProviderBuilder.attribution);
    terrainProviderBuilder.tileCredits.push(layerJsonCredit);
  }

  return true;
}

async function requestLayerJson(terrainProviderBuilder, provider) {
  try {
    const data = await terrainProviderBuilder.layerJsonResource.fetchJson();
    return metadataSuccess(terrainProviderBuilder, data, provider);
  } catch (error) {
    // If the metadata is not found, assume this is a pre-metadata heightmap tileset.
    if (defined(error) && error.statusCode === 404) {
      await parseMetadataSuccess(
        terrainProviderBuilder,
        {
          tilejson: "2.1.0",
          format: "heightmap-1.0",
          version: "1.0.0",
          scheme: "tms",
          tiles: ["{z}/{x}/{y}.terrain?v={version}"],
        },
        provider,
      );

      return true;
    }

    return parseMetadataFailure(terrainProviderBuilder, error, provider);
  }
}

/**
 * <div class="notice">
 * 要构造一个 CesiumTerrainProvider，请调用 {@link CesiumTerrainProvider.fromIonAssetId} 或 {@link CesiumTerrainProvider.fromUrl}。请勿直接调用构造函数。
 * </div>
 *
 * 一个 {@link TerrainProvider}，用于访问 Cesium 地形格式的地形数据。
 * 地形格式可以是以下之一：
 * <ul>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/quantized-mesh Quantized Mesh} </li>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/heightmap-1.0 Height Map} </li>
 * </ul>
 *
 * @alias CesiumTerrainProvider
 * @constructor
 *
 * @param {CesiumTerrainProvider.ConstructorOptions} [options] 描述初始化选项的对象
 *
 * @example
 * // Create Arctic DEM terrain with normals.
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(3956, {
 *       requestVertexNormals: true
 *     })
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @see createWorldTerrain
 * @see CesiumTerrainProvider.fromUrl
 * @see CesiumTerrainProvider.fromIonAssetId
 * @see TerrainProvider
 */
function CesiumTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._heightmapWidth = undefined;
  this._heightmapStructure = undefined;
  this._hasWaterMask = false;
  this._hasVertexNormals = false;
  this._hasMetadata = false;
  this._scheme = undefined;
  this._ellipsoid = options.ellipsoid;

  /**
   * 布尔标志，指示客户端是否应向服务器请求顶点法线。
   * @type {boolean}
   * @default false
   * @private
   */
  this._requestVertexNormals = defaultValue(
    options.requestVertexNormals,
    false,
  );

  /**
   * 布尔标志，指示客户端是否应向服务器请求瓦片水掩模。
   * @type {boolean}
   * @default false
   * @private
   */
  this._requestWaterMask = defaultValue(options.requestWaterMask, false);

  /**
   * 布尔标志，指示客户端是否应向服务器请求瓦片元数据。
   * @type {boolean}
   * @default true
   * @private
   */
  this._requestMetadata = defaultValue(options.requestMetadata, true);

  this._errorEvent = new Event();

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  this._availability = undefined;
  this._tilingScheme = undefined;
  this._levelZeroMaximumGeometricError = undefined;
  this._layers = undefined;
  this._tileCredits = undefined;
}

/**
 * 使用量化网格格式时，可能会返回包含附加扩展的瓦片，例如每个顶点法线、水掩模等。
 * 该枚举定义了附加到标准网格数据的每种类型扩展数据的唯一标识符。
 *
 * @namespace QuantizedMeshExtensionIds
 * @see CesiumTerrainProvider
 * @private
 */

const QuantizedMeshExtensionIds = {
  /**
   * 八进制编码的每个顶点法线作为瓦片网格的扩展包含
   *
   * @type {number}
   * @constant
   * @default 1
   */
  OCT_VERTEX_NORMALS: 1,
  /**
   * 水掩模作为瓦片网格的扩展包含
   *
   * @type {number}
   * @constant
   * @default 2
   */
  WATER_MASK: 2,
  /**
   * 一个包含有关瓦片的元数据的 JSON 对象
   *
   * @type {number}
   * @constant
   * @default 4
   */

  METADATA: 4,
};

function getRequestHeader(extensionsList) {
  if (!defined(extensionsList) || extensionsList.length === 0) {
    return {
      Accept:
        "application/vnd.quantized-mesh,application/octet-stream;q=0.9,*/*;q=0.01",
    };
  }
  const extensions = extensionsList.join("-");
  return {
    Accept: `application/vnd.quantized-mesh;extensions=${extensions},application/octet-stream;q=0.9,*/*;q=0.01`,
  };
}

function createHeightmapTerrainData(provider, buffer, level, x, y) {
  const heightBuffer = new Uint16Array(
    buffer,
    0,
    provider._heightmapWidth * provider._heightmapWidth,
  );
  return new HeightmapTerrainData({
    buffer: heightBuffer,
    childTileMask: new Uint8Array(buffer, heightBuffer.byteLength, 1)[0],
    waterMask: new Uint8Array(
      buffer,
      heightBuffer.byteLength + 1,
      buffer.byteLength - heightBuffer.byteLength - 1,
    ),
    width: provider._heightmapWidth,
    height: provider._heightmapWidth,
    structure: provider._heightmapStructure,
    credits: provider._tileCredits,
  });
}

function createQuantizedMeshTerrainData(provider, buffer, level, x, y, layer) {
  const littleEndianExtensionSize = layer.littleEndianExtensionSize;
  let pos = 0;
  const cartesian3Elements = 3;
  const boundingSphereElements = cartesian3Elements + 1;
  const cartesian3Length = Float64Array.BYTES_PER_ELEMENT * cartesian3Elements;
  const boundingSphereLength =
    Float64Array.BYTES_PER_ELEMENT * boundingSphereElements;
  const encodedVertexElements = 3;
  const encodedVertexLength =
    Uint16Array.BYTES_PER_ELEMENT * encodedVertexElements;
  const triangleElements = 3;
  let bytesPerIndex = Uint16Array.BYTES_PER_ELEMENT;
  let triangleLength = bytesPerIndex * triangleElements;

  const view = new DataView(buffer);
  const center = new Cartesian3(
    view.getFloat64(pos, true),
    view.getFloat64(pos + 8, true),
    view.getFloat64(pos + 16, true),
  );
  pos += cartesian3Length;

  const minimumHeight = view.getFloat32(pos, true);
  pos += Float32Array.BYTES_PER_ELEMENT;
  const maximumHeight = view.getFloat32(pos, true);
  pos += Float32Array.BYTES_PER_ELEMENT;

  const boundingSphere = new BoundingSphere(
    new Cartesian3(
      view.getFloat64(pos, true),
      view.getFloat64(pos + 8, true),
      view.getFloat64(pos + 16, true),
    ),
    view.getFloat64(pos + cartesian3Length, true),
  );
  pos += boundingSphereLength;

  const horizonOcclusionPoint = new Cartesian3(
    view.getFloat64(pos, true),
    view.getFloat64(pos + 8, true),
    view.getFloat64(pos + 16, true),
  );
  pos += cartesian3Length;

  const vertexCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const encodedVertexBuffer = new Uint16Array(buffer, pos, vertexCount * 3);
  pos += vertexCount * encodedVertexLength;

  if (vertexCount > 64 * 1024) {
    // More than 64k vertices, so indices are 32-bit.
    bytesPerIndex = Uint32Array.BYTES_PER_ELEMENT;
    triangleLength = bytesPerIndex * triangleElements;
  }

  // Decode the vertex buffer.
  const uBuffer = encodedVertexBuffer.subarray(0, vertexCount);
  const vBuffer = encodedVertexBuffer.subarray(vertexCount, 2 * vertexCount);
  const heightBuffer = encodedVertexBuffer.subarray(
    vertexCount * 2,
    3 * vertexCount,
  );

  AttributeCompression.zigZagDeltaDecode(uBuffer, vBuffer, heightBuffer);

  // skip over any additional padding that was added for 2/4 byte alignment
  if (pos % bytesPerIndex !== 0) {
    pos += bytesPerIndex - (pos % bytesPerIndex);
  }

  const triangleCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const indices = IndexDatatype.createTypedArrayFromArrayBuffer(
    vertexCount,
    buffer,
    pos,
    triangleCount * triangleElements,
  );
  pos += triangleCount * triangleLength;

  // High water mark decoding based on decompressIndices_ in webgl-loader's loader.js.
  // https://code.google.com/p/webgl-loader/source/browse/trunk/samples/loader.js?r=99#55
  // Copyright 2012 Google Inc., Apache 2.0 license.
  let highest = 0;
  const length = indices.length;
  for (let i = 0; i < length; ++i) {
    const code = indices[i];
    indices[i] = highest - code;
    if (code === 0) {
      ++highest;
    }
  }

  const westVertexCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const westIndices = IndexDatatype.createTypedArrayFromArrayBuffer(
    vertexCount,
    buffer,
    pos,
    westVertexCount,
  );
  pos += westVertexCount * bytesPerIndex;

  const southVertexCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const southIndices = IndexDatatype.createTypedArrayFromArrayBuffer(
    vertexCount,
    buffer,
    pos,
    southVertexCount,
  );
  pos += southVertexCount * bytesPerIndex;

  const eastVertexCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const eastIndices = IndexDatatype.createTypedArrayFromArrayBuffer(
    vertexCount,
    buffer,
    pos,
    eastVertexCount,
  );
  pos += eastVertexCount * bytesPerIndex;

  const northVertexCount = view.getUint32(pos, true);
  pos += Uint32Array.BYTES_PER_ELEMENT;
  const northIndices = IndexDatatype.createTypedArrayFromArrayBuffer(
    vertexCount,
    buffer,
    pos,
    northVertexCount,
  );
  pos += northVertexCount * bytesPerIndex;

  let encodedNormalBuffer;
  let waterMaskBuffer;
  while (pos < view.byteLength) {
    const extensionId = view.getUint8(pos, true);
    pos += Uint8Array.BYTES_PER_ELEMENT;
    const extensionLength = view.getUint32(pos, littleEndianExtensionSize);
    pos += Uint32Array.BYTES_PER_ELEMENT;

    if (
      extensionId === QuantizedMeshExtensionIds.OCT_VERTEX_NORMALS &&
      provider._requestVertexNormals
    ) {
      encodedNormalBuffer = new Uint8Array(buffer, pos, vertexCount * 2);
    } else if (
      extensionId === QuantizedMeshExtensionIds.WATER_MASK &&
      provider._requestWaterMask
    ) {
      waterMaskBuffer = new Uint8Array(buffer, pos, extensionLength);
    } else if (
      extensionId === QuantizedMeshExtensionIds.METADATA &&
      provider._requestMetadata
    ) {
      const stringLength = view.getUint32(pos, true);
      if (stringLength > 0) {
        const metadata = getJsonFromTypedArray(
          new Uint8Array(buffer),
          pos + Uint32Array.BYTES_PER_ELEMENT,
          stringLength,
        );
        const availableTiles = metadata.available;
        if (defined(availableTiles)) {
          for (let offset = 0; offset < availableTiles.length; ++offset) {
            const availableLevel = level + offset + 1;
            const rangesAtLevel = availableTiles[offset];
            const yTiles =
              provider._tilingScheme.getNumberOfYTilesAtLevel(availableLevel);

            for (
              let rangeIndex = 0;
              rangeIndex < rangesAtLevel.length;
              ++rangeIndex
            ) {
              const range = rangesAtLevel[rangeIndex];
              const yStart = yTiles - range.endY - 1;
              const yEnd = yTiles - range.startY - 1;
              provider.availability.addAvailableTileRange(
                availableLevel,
                range.startX,
                yStart,
                range.endX,
                yEnd,
              );
              layer.availability.addAvailableTileRange(
                availableLevel,
                range.startX,
                yStart,
                range.endX,
                yEnd,
              );
            }
          }
        }
      }
      layer.availabilityTilesLoaded.addAvailableTileRange(level, x, y, x, y);
    }
    pos += extensionLength;
  }

  const skirtHeight = provider.getLevelMaximumGeometricError(level) * 5.0;

  // The skirt is not included in the OBB computation. If this ever
  // causes any rendering artifacts (cracks), they are expected to be
  // minor and in the corners of the screen. It's possible that this
  // might need to be changed - just change to `minimumHeight - skirtHeight`
  // A similar change might also be needed in `upsampleQuantizedTerrainMesh.js`.
  const rectangle = provider._tilingScheme.tileXYToRectangle(x, y, level);
  const orientedBoundingBox = OrientedBoundingBox.fromRectangle(
    rectangle,
    minimumHeight,
    maximumHeight,
    provider._tilingScheme.ellipsoid,
  );

  return new QuantizedMeshTerrainData({
    center: center,
    minimumHeight: minimumHeight,
    maximumHeight: maximumHeight,
    boundingSphere: boundingSphere,
    orientedBoundingBox: orientedBoundingBox,
    horizonOcclusionPoint: horizonOcclusionPoint,
    quantizedVertices: encodedVertexBuffer,
    encodedNormals: encodedNormalBuffer,
    indices: indices,
    westIndices: westIndices,
    southIndices: southIndices,
    eastIndices: eastIndices,
    northIndices: northIndices,
    westSkirtHeight: skirtHeight,
    southSkirtHeight: skirtHeight,
    eastSkirtHeight: skirtHeight,
    northSkirtHeight: skirtHeight,
    childTileMask: provider.availability.computeChildMaskForTile(level, x, y),
    waterMask: waterMaskBuffer,
    credits: provider._tileCredits,
  });
}

/**
 * 请求给定瓦片的几何数据。结果必须包含地形数据，并且可以选择性地包含水掩模和可用子瓦片的指示。
 *
 * @param {number} x 请求几何数据的瓦片的 X 坐标。
 * @param {number} y 请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 请求几何数据的瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 *
 * @returns {Promise<TerrainData>|undefined} 请求几何数据的 Promise。如果此方法返回 undefined 而不是 Promise，则表示已经有太多的请求在等待中，请求将稍后重试。
 *
 */

CesiumTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const layers = this._layers;
  let layerToUse;
  const layerCount = layers.length;
  let unknownAvailability = false;
  let availabilityPromise = Promise.resolve();

  if (layerCount === 1) {
    // Optimized path for single layers
    layerToUse = layers[0];
  } else {
    for (let i = 0; i < layerCount; ++i) {
      const layer = layers[i];
      if (
        !defined(layer.availability) ||
        layer.availability.isTileAvailable(level, x, y)
      ) {
        layerToUse = layer;
        break;
      }

      const availabilityUnloaded = checkLayer(
        this,
        x,
        y,
        level,
        layer,
        i === 0,
      );
      if (availabilityUnloaded.result) {
        // We can't know yet since the availability is not yet loaded
        unknownAvailability = true;
        availabilityPromise = availabilityPromise.then(
          () => availabilityUnloaded.promise,
        );
      }
    }
  }

  if (!defined(layerToUse) && unknownAvailability) {
    // Try again when availability data is ready– Otherwise the tile will be marked as failed and never re-requested
    return availabilityPromise.then(() => {
      // handle promise or undefined return
      return new Promise((resolve) => {
        // defer execution to the next event loop
        setTimeout(() => {
          const promise = this.requestTileGeometry(x, y, level, request);
          resolve(promise);
        }, 0); // next tick
      });
    });
  }
  // call overridden function below
  return requestTileGeometry(this, x, y, level, layerToUse, request);
};

function requestTileGeometry(provider, x, y, level, layerToUse, request) {
  if (!defined(layerToUse)) {
    return Promise.reject(new RuntimeError("Terrain tile doesn't exist"));
  }

  const urlTemplates = layerToUse.tileUrlTemplates;
  if (urlTemplates.length === 0) {
    return undefined;
  }

  // The TileMapService scheme counts from the bottom left
  let terrainY;
  if (!provider._scheme || provider._scheme === "tms") {
    const yTiles = provider._tilingScheme.getNumberOfYTilesAtLevel(level);
    terrainY = yTiles - y - 1;
  } else {
    terrainY = y;
  }

  const extensionList = [];
  if (provider._requestVertexNormals && layerToUse.hasVertexNormals) {
    extensionList.push(
      layerToUse.littleEndianExtensionSize
        ? "octvertexnormals"
        : "vertexnormals",
    );
  }
  if (provider._requestWaterMask && layerToUse.hasWaterMask) {
    extensionList.push("watermask");
  }
  if (provider._requestMetadata && layerToUse.hasMetadata) {
    extensionList.push("metadata");
  }

  let headers;
  let query;
  const url = urlTemplates[(x + terrainY + level) % urlTemplates.length];

  const resource = layerToUse.resource;
  if (
    defined(resource._ionEndpoint) &&
    !defined(resource._ionEndpoint.externalType)
  ) {
    // ion uses query parameters to request extensions
    if (extensionList.length !== 0) {
      query = { extensions: extensionList.join("-") };
    }
    headers = getRequestHeader(undefined);
  } else {
    //All other terrain servers
    headers = getRequestHeader(extensionList);
  }

  const promise = resource
    .getDerivedResource({
      url: url,
      templateValues: {
        version: layerToUse.version,
        z: level,
        x: x,
        y: terrainY,
      },
      queryParameters: query,
      headers: headers,
      request: request,
    })
    .fetchArrayBuffer();

  if (!defined(promise)) {
    return undefined;
  }

  return promise.then(function (buffer) {
    if (!defined(buffer)) {
      return Promise.reject(new RuntimeError("Mesh buffer doesn't exist."));
    }
    if (defined(provider._heightmapStructure)) {
      return createHeightmapTerrainData(provider, buffer, level, x, y);
    }
    return createQuantizedMeshTerrainData(
      provider,
      buffer,
      level,
      x,
      y,
      layerToUse,
    );
  });
}

Object.defineProperties(CesiumTerrainProvider.prototype, {
  /**
   * 获取当地形提供者遇到异步错误时引发的事件。通过订阅该事件，您将收到错误通知，并可以可能从中恢复。事件监听器会收到一个 {@link TileProviderError} 的实例。
   * @memberof CesiumTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当该地形提供者处于活动状态时显示的信用信息。通常用于表彰地形的来源。
   * @memberof CesiumTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取该提供者使用的分块方案。
   * @memberof CesiumTerrainProvider.prototype
   * @type {GeographicTilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个值，指示提供者是否包含水掩模。水掩模指示地球上哪些区域是水而不是陆地，以便可以将其渲染为具有动画波纹的反射表面。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */

  hasWaterMask: {
    get: function () {
      return this._hasWaterMask && this._requestWaterMask;
    },
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      // 如果我们可以从服务器请求顶点法线，则返回 true
      return this._hasVertexNormals && this._requestVertexNormals;
    },
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含元数据。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasMetadata: {
    get: function () {
      // 如果我们可以从服务器请求元数据，则返回 true
      return this._hasMetadata && this._requestMetadata;
    },
  },

  /**
   * 布尔标志，指示客户端是否应从服务器请求顶点法线。
   * 仅当客户端请求顶点法线且服务器提供顶点法线时，顶点法线数据才会附加到标准瓦片网格数据中。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  requestVertexNormals: {
    get: function () {
      return this._requestVertexNormals;
    },
  },

  /**
   * 布尔标志，指示客户端是否应从服务器请求水掩模。
   * 仅当客户端请求水掩模且服务器提供水掩模时，水掩模数据才会附加到标准瓦片网格数据中。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */

  requestWaterMask: {
    get: function () {
      return this._requestWaterMask;
    },
  },

  /**
   * 布尔标志，指示客户端是否应从服务器请求元数据。
   * 仅当客户端请求元数据且服务器提供元数据时，元数据才会附加到标准瓦片网格数据中。
   * @memberof CesiumTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  requestMetadata: {
    get: function () {
      return this._requestMetadata;
    },
  },

  /**
   * 获取一个可以用来确定此提供者的地形可用性的对象，例如在点和矩形中。 
   * 如果没有可用性信息，则此属性可能是未定义的。请注意，这反映了当前已知可用的瓦片。
   * 未来可能会发现更多可用的瓦片，例如，如果可用性信息存在于树的更深层，而不是都可以在根部发现。但是，现在可用的瓦片在将来不会变为不可用。
   * @memberof CesiumTerrainProvider.prototype
   * @type {TileAvailability}
   * @readonly
   */

  availability: {
    get: function () {
      return this._availability;
    },
  },
});

/**
 * 获取给定级别的瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

CesiumTerrainProvider.prototype.getLevelMaximumGeometricError = function (
  level,
) {
  return this._levelZeroMaximumGeometricError / (1 << level);
};

/**
 * 从 Cesium ion 资产 ID 创建一个 {@link TerrainProvider}，以访问 Cesium 地形格式的地形数据。
 * 地形格式可以是以下之一：
 * <ul>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/quantized-mesh Quantized Mesh} </li>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/heightmap-1.0 Height Map} </li>
 * </ul>
 *
 * @param {number} assetId Cesium ion 资产 ID。
 * @param {CesiumTerrainProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<CesiumTerrainProvider>}
 *
 * @example
 * // Create Arctic DEM terrain with normals.
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.CesiumTerrainProvider.fromIonAssetId(3956, {
 *         requestVertexNormals: true
 *     })
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @exception {RuntimeError} layer.json 未指定格式
 * @exception {RuntimeError} layer.json 指定了未知格式
 * @exception {RuntimeError} layer.json 指定了不支持的量化网格版本
 * @exception {RuntimeError} layer.json 未指定瓦片属性，或指定了空数组
 * @exception {RuntimeError} layer.json 未指定任何瓦片 URL 模板
 */
CesiumTerrainProvider.fromIonAssetId = async function (assetId, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("assetId", assetId);
  //>>includeEnd('debug');

  const resource = await IonResource.fromAssetId(assetId);
  return CesiumTerrainProvider.fromUrl(resource, options);
};

/**
 * 创建一个 {@link TerrainProvider}，用于访问 Cesium 地形格式的地形数据。
 * 地形格式可以是以下之一：
 * <ul>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/quantized-mesh Quantized Mesh} </li>
 * <li> {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/heightmap-1.0 Height Map} </li>
 * </ul>
 *
 * @param {Resource|String|Promise<Resource>|Promise<String>} url Cesium 地形服务器的 URL。
 * @param {CesiumTerrainProvider.ConstructorOptions} [options] 描述初始化选项的对象。
 * @returns {Promise<CesiumTerrainProvider>}
 *
 * @example
 * // Create Arctic DEM terrain with normals.
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.CesiumTerrainProvider.fromUrl(
 *       Cesium.IonResource.fromAssetId(3956), {
 *         requestVertexNormals: true
 *     })
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @exception {RuntimeError} layer.json 未指定格式
 * @exception {RuntimeError} layer.json 指定了未知格式
 * @exception {RuntimeError} layer.json 指定了不支持的量化网格版本
 * @exception {RuntimeError} layer.json 未指定瓦片属性，或指定了空数组
 * @exception {RuntimeError} layer.json 未指定任何瓦片 URL 模板
 */
CesiumTerrainProvider.fromUrl = async function (url, options) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("url", url);
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  url = await Promise.resolve(url);
  const resource = Resource.createIfNeeded(url);
  resource.appendForwardSlash();

  const terrainProviderBuilder = new TerrainProviderBuilder(options);
  terrainProviderBuilder.lastResource = resource;
  terrainProviderBuilder.layerJsonResource =
    terrainProviderBuilder.lastResource.getDerivedResource({
      url: "layer.json",
    });

  await requestLayerJson(terrainProviderBuilder);

  const provider = new CesiumTerrainProvider(options);
  terrainProviderBuilder.build(provider);

  return provider;
};

/**
 * 确定瓦片的数据是否可加载。
 *
 * @param {number} x 请求几何数据的瓦片的 X 坐标。
 * @param {number} y 请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 请求几何数据的瓦片的级别。
 * @returns {boolean|undefined} 如果不支持或可用性未知则为 undefined，否则返回 true 或 false。
 */

CesiumTerrainProvider.prototype.getTileDataAvailable = function (x, y, level) {
  if (!defined(this._availability)) {
    return undefined;
  }
  if (level > this._availability._maximumLevel) {
    return false;
  }

  if (this._availability.isTileAvailable(level, x, y)) {
    // If the tile is listed as available, then we are done
    return true;
  }
  if (!this._hasMetadata) {
    // If we don't have any layers with the metadata extension then we don't have this tile
    return false;
  }

  const layers = this._layers;
  const count = layers.length;
  for (let i = 0; i < count; ++i) {
    const layerResult = checkLayer(this, x, y, level, layers[i], i === 0);
    if (layerResult.result) {
      // There is a layer that may or may not have the tile
      return undefined;
    }
  }

  return false;
};

/**
 * 确保我们加载瓦片的可用性数据
 *
 * @param {number} x 请求几何数据的瓦片的 X 坐标。
 * @param {number} y 请求几何数据的瓦片的 Y 坐标。
 * @param {number} level 请求几何数据的瓦片的级别。
 * @returns {undefined|Promise<void>} 如果没有需要加载的内容则为 undefined，或者返回一个 Promise，该 Promise 在所有必需的瓦片加载时解析。
 */

CesiumTerrainProvider.prototype.loadTileDataAvailability = function (
  x,
  y,
  level,
) {
  if (
    !defined(this._availability) ||
    level > this._availability._maximumLevel ||
    this._availability.isTileAvailable(level, x, y) ||
    !this._hasMetadata
  ) {
    // We know the tile is either available or not available so nothing to wait on
    return undefined;
  }

  const layers = this._layers;
  const count = layers.length;
  for (let i = 0; i < count; ++i) {
    const layerResult = checkLayer(this, x, y, level, layers[i], i === 0);
    if (defined(layerResult.promise)) {
      return layerResult.promise;
    }
  }
};

function getAvailabilityTile(layer, x, y, level) {
  if (level === 0) {
    return;
  }

  const availabilityLevels = layer.availabilityLevels;
  const parentLevel =
    level % availabilityLevels === 0
      ? level - availabilityLevels
      : ((level / availabilityLevels) | 0) * availabilityLevels;
  const divisor = 1 << (level - parentLevel);
  const parentX = (x / divisor) | 0;
  const parentY = (y / divisor) | 0;

  return {
    level: parentLevel,
    x: parentX,
    y: parentY,
  };
}

function checkLayer(provider, x, y, level, layer, topLayer) {
  if (!defined(layer.availabilityLevels)) {
    // It's definitely not in this layer
    return {
      result: false,
    };
  }

  let cacheKey;
  const deleteFromCache = function () {
    delete layer.availabilityPromiseCache[cacheKey];
  };
  const availabilityTilesLoaded = layer.availabilityTilesLoaded;
  const availability = layer.availability;

  let tile = getAvailabilityTile(layer, x, y, level);
  while (defined(tile)) {
    if (
      availability.isTileAvailable(tile.level, tile.x, tile.y) &&
      !availabilityTilesLoaded.isTileAvailable(tile.level, tile.x, tile.y)
    ) {
      let requestPromise;
      if (!topLayer) {
        cacheKey = `${tile.level}-${tile.x}-${tile.y}`;
        requestPromise = layer.availabilityPromiseCache[cacheKey];
        if (!defined(requestPromise)) {
          // For cutout terrain, if this isn't the top layer the availability tiles
          //  may never get loaded, so request it here.
          const request = new Request({
            throttle: false,
            throttleByServer: true,
            type: RequestType.TERRAIN,
          });
          requestPromise = requestTileGeometry(
            provider,
            tile.x,
            tile.y,
            tile.level,
            layer,
            request,
          );
          if (defined(requestPromise)) {
            layer.availabilityPromiseCache[cacheKey] = requestPromise;
            requestPromise.then(deleteFromCache);
          }
        }
      }

      // The availability tile is available, but not loaded, so there
      //  is still a chance that it may become available at some point
      return {
        result: true,
        promise: requestPromise,
      };
    }

    tile = getAvailabilityTile(layer, tile.x, tile.y, tile.level);
  }

  return {
    result: false,
  };
}

// Used for testing
CesiumTerrainProvider._getAvailabilityTile = getAvailabilityTile;
export default CesiumTerrainProvider;
