import Check from "./Check.js";
import Credit from "./Credit.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Event from "./Event.js";
import GeographicTilingScheme from "./GeographicTilingScheme.js";
import GoogleEarthEnterpriseMetadata from "./GoogleEarthEnterpriseMetadata.js";
import GoogleEarthEnterpriseTerrainData from "./GoogleEarthEnterpriseTerrainData.js";
import HeightmapTerrainData from "./HeightmapTerrainData.js";
import JulianDate from "./JulianDate.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";
import Request from "./Request.js";
import RequestState from "./RequestState.js";
import RequestType from "./RequestType.js";
import RuntimeError from "./RuntimeError.js";
import TaskProcessor from "./TaskProcessor.js";

const TerrainState = {
  UNKNOWN: 0,
  NONE: 1,
  SELF: 2,
  PARENT: 3,
};

const julianDateScratch = new JulianDate();

function TerrainCache() {
  this._terrainCache = {};
  this._lastTidy = JulianDate.now();
}

TerrainCache.prototype.add = function (quadKey, buffer) {
  this._terrainCache[quadKey] = {
    buffer: buffer,
    timestamp: JulianDate.now(),
  };
};

TerrainCache.prototype.get = function (quadKey) {
  const terrainCache = this._terrainCache;
  const result = terrainCache[quadKey];
  if (defined(result)) {
    delete this._terrainCache[quadKey];
    return result.buffer;
  }
};

TerrainCache.prototype.tidy = function () {
  JulianDate.now(julianDateScratch);
  if (JulianDate.secondsDifference(julianDateScratch, this._lastTidy) > 10) {
    const terrainCache = this._terrainCache;
    const keys = Object.keys(terrainCache);
    const count = keys.length;
    for (let i = 0; i < count; ++i) {
      const k = keys[i];
      const e = terrainCache[k];
      if (JulianDate.secondsDifference(julianDateScratch, e.timestamp) > 10) {
        delete terrainCache[k];
      }
    }

    JulianDate.clone(julianDateScratch, this._lastTidy);
  }
};

/**
 * @typedef {Object} GoogleEarthEnterpriseTerrainProvider.ConstructorOptions
 *
 * 初始化 GoogleEarthEnterpriseTerrainProvider 构造函数的选项
 *
 * @property {Ellipsoid} [ellipsoid=Ellipsoid.default] 地球椭球体。如果不指定，则使用默认地球椭球体。
 * @property {Credit|string} [credit] 数据源的版权声明，显示在画布上。
 */

/**
 * <div class="notice">
 * 要构造 GoogleEarthEnterpriseTerrainProvider，请调用 {@link GoogleEarthEnterpriseTerrainProvider.fromMetadata}。不要直接调用构造函数。
 * </div>
 *
 * 使用 Google Earth Enterprise REST API 提供瓦片地形。
 *
 * @alias GoogleEarthEnterpriseTerrainProvider
 * @constructor
 *
 * @param {GoogleEarthEnterpriseTerrainProvider.ConstructorOptions} [options] 一个描述初始化选项的对象
 *
 * @see GoogleEarthEnterpriseTerrainProvider.fromMetadata
 * @see GoogleEarthEnterpriseMetadata.fromUrl
 * @see GoogleEarthEnterpriseImageryProvider
 * @see CesiumTerrainProvider
 *
 * @example
 * const geeMetadata = await GoogleEarthEnterpriseMetadata.fromUrl("http://www.example.com");
 * const gee = Cesium.GoogleEarthEnterpriseTerrainProvider.fromMetadata(geeMetadata);
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
function GoogleEarthEnterpriseTerrainProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._tilingScheme = new GeographicTilingScheme({
    numberOfLevelZeroTilesX: 2,
    numberOfLevelZeroTilesY: 2,
    rectangle: new Rectangle(
      -CesiumMath.PI,
      -CesiumMath.PI,
      CesiumMath.PI,
      CesiumMath.PI,
    ),
    ellipsoid: options.ellipsoid,
  });

  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  this._credit = credit;

  // Pulled from Google's documentation
  this._levelZeroMaximumGeometricError = 40075.16;

  this._terrainCache = new TerrainCache();
  this._terrainPromises = {};
  this._terrainRequests = {};

  this._errorEvent = new Event();
}

Object.defineProperties(GoogleEarthEnterpriseTerrainProvider.prototype, {
  /**
   * 获取托管影像的数据的 Google Earth Enterprise 服务器 URL。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {string}
   * @readonly
   */
  url: {
    get: function () {
      return this._metadata.url;
    },
  },

  /**
   * 获取此提供程序使用的代理。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {Proxy}
   * @readonly
   */
  proxy: {
    get: function () {
      return this._metadata.proxy;
    },
  },

  /**
   * 获取此提供程序使用的瓦片方案。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {TilingScheme}
   * @readonly
   */
  tilingScheme: {
    get: function () {
      return this._tilingScheme;
    },
  },

  /**
   * 获取一个在影像提供程序遇到异步错误时触发的事件。通过订阅此事件，您可以得知错误并可能从中恢复。事件监听器会传递一个 {@link TileProviderError} 实例。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {Event}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取当此地形提供程序活动时显示的版权声明。通常用于引用地形的数据源。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {Credit}
   * @readonly
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },

  /**
   * 获取一个值，指示提供程序是否包含水掩码。水掩码用于标识地球上的哪些区域是水域而不是陆地，
   * 因此可以作为具有动画波浪的反射表面进行渲染。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasWaterMask: {
    get: function () {
      return false;
    },
  },

  /**
   * 获取一个值，指示请求的瓦片是否包含顶点法线。
   * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
   * @type {boolean}
   * @readonly
   */
  hasVertexNormals: {
    get: function () {
      return false;
    },
  },

  /**
 * 获取一个对象，可以用于确定此提供程序是否在特定点或矩形区域内可用。如果可用性信息不可用，则此属性可能未定义。
 * @memberof GoogleEarthEnterpriseTerrainProvider.prototype
 * @type {TileAvailability}
 * @readonly
 */
  availability: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * 从 GoogleEarthEnterpriseMetadata 创建一个 GoogleEarthTerrainProvider。
 *
 * @param {GoogleEarthEnterpriseMetadata} metadata 一个可以与 GoogleEarthEnterpriseImageryProvider 共享元数据请求的元数据对象。
 * @param {GoogleEarthEnterpriseTerrainProvider.ConstructorOptions} options 描述初始化选项的对象。
 * @returns {GoogleEarthEnterpriseTerrainProvider}
 *
 * @see GoogleEarthEnterpriseMetadata.fromUrl
 *
 * @exception {RuntimeError} 元数据未指定地形。
 *
 * @example
 * const geeMetadata = await GoogleEarthEnterpriseMetadata.fromUrl("http://www.example.com");
 * const gee = Cesium.GoogleEarthEnterpriseTerrainProvider.fromMetadata(geeMetadata);
 */

GoogleEarthEnterpriseTerrainProvider.fromMetadata = function (
  metadata,
  options,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("metadata", metadata);
  //>>includeEnd('debug');

  if (!metadata.terrainPresent) {
    throw new RuntimeError(`The server ${metadata.url} doesn't have terrain`);
  }

  const provider = new GoogleEarthEnterpriseTerrainProvider(options);
  provider._metadata = metadata;

  return provider;
};

const taskProcessor = new TaskProcessor("decodeGoogleEarthEnterprisePacket");

// If the tile has its own terrain, then you can just use its child bitmask. If it was requested using it's parent
//  then you need to check all of its children to see if they have terrain.
function computeChildMask(quadKey, info, metadata) {
  let childMask = info.getChildBitmask();
  if (info.terrainState === TerrainState.PARENT) {
    childMask = 0;
    for (let i = 0; i < 4; ++i) {
      const child = metadata.getTileInformationFromQuadKey(
        quadKey + i.toString(),
      );
      if (defined(child) && child.hasTerrain()) {
        childMask |= 1 << i;
      }
    }
  }

  return childMask;
}

/**
 * 请求给定瓦片的几何体。结果必须包含地形数据，并且可以选择性地包含水体掩模和可用子瓦片的指示。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @param {Request} [request] 请求对象。仅供内部使用。
 * @returns {Promise<TerrainData>|undefined} 请求几何体的 Promise。如果该方法返回 undefined 而不是一个 Promise，则表示已经有太多请求挂起，该请求将稍后重试。
 */

GoogleEarthEnterpriseTerrainProvider.prototype.requestTileGeometry = function (
  x,
  y,
  level,
  request,
) {
  const quadKey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);
  const terrainCache = this._terrainCache;
  const metadata = this._metadata;
  const info = metadata.getTileInformationFromQuadKey(quadKey);

  // Check if this tile is even possibly available
  if (!defined(info)) {
    return Promise.reject(new RuntimeError("Terrain tile doesn't exist"));
  }

  let terrainState = info.terrainState;
  if (!defined(terrainState)) {
    // First time we have tried to load this tile, so set terrain state to UNKNOWN
    terrainState = info.terrainState = TerrainState.UNKNOWN;
  }

  // If its in the cache, return it
  const buffer = terrainCache.get(quadKey);
  if (defined(buffer)) {
    const credit = metadata.providers[info.terrainProvider];
    return Promise.resolve(
      new GoogleEarthEnterpriseTerrainData({
        buffer: buffer,
        childTileMask: computeChildMask(quadKey, info, metadata),
        credits: defined(credit) ? [credit] : undefined,
        negativeAltitudeExponentBias: metadata.negativeAltitudeExponentBias,
        negativeElevationThreshold: metadata.negativeAltitudeThreshold,
      }),
    );
  }

  // Clean up the cache
  terrainCache.tidy();

  // We have a tile, check to see if no ancestors have terrain or that we know for sure it doesn't
  if (!info.ancestorHasTerrain) {
    // We haven't reached a level with terrain, so return the ellipsoid
    return Promise.resolve(
      new HeightmapTerrainData({
        buffer: new Uint8Array(16 * 16),
        width: 16,
        height: 16,
      }),
    );
  } else if (terrainState === TerrainState.NONE) {
    // Already have info and there isn't any terrain here
    return Promise.reject(new RuntimeError("Terrain tile doesn't exist"));
  }

  // Figure out where we are getting the terrain and what version
  let parentInfo;
  let q = quadKey;
  let terrainVersion = -1;
  switch (terrainState) {
    case TerrainState.SELF: // We have terrain and have retrieved it before
      terrainVersion = info.terrainVersion;
      break;
    case TerrainState.PARENT: // We have terrain in our parent
      q = q.substring(0, q.length - 1);
      parentInfo = metadata.getTileInformationFromQuadKey(q);
      terrainVersion = parentInfo.terrainVersion;
      break;
    case TerrainState.UNKNOWN: // We haven't tried to retrieve terrain yet
      if (info.hasTerrain()) {
        terrainVersion = info.terrainVersion; // We should have terrain
      } else {
        q = q.substring(0, q.length - 1);
        parentInfo = metadata.getTileInformationFromQuadKey(q);
        if (defined(parentInfo) && parentInfo.hasTerrain()) {
          terrainVersion = parentInfo.terrainVersion; // Try checking in the parent
        }
      }
      break;
  }

  // We can't figure out where to get the terrain
  if (terrainVersion < 0) {
    return Promise.reject(new RuntimeError("Terrain tile doesn't exist"));
  }

  // Load that terrain
  const terrainPromises = this._terrainPromises;
  const terrainRequests = this._terrainRequests;
  let sharedPromise;
  let sharedRequest;
  if (defined(terrainPromises[q])) {
    // Already being loaded possibly from another child, so return existing promise
    sharedPromise = terrainPromises[q];
    sharedRequest = terrainRequests[q];
  } else {
    // Create new request for terrain
    sharedRequest = request;
    const requestPromise = buildTerrainResource(
      this,
      q,
      terrainVersion,
      sharedRequest,
    ).fetchArrayBuffer();

    if (!defined(requestPromise)) {
      return undefined; // Throttled
    }

    sharedPromise = requestPromise.then(function (terrain) {
      if (defined(terrain)) {
        return taskProcessor
          .scheduleTask(
            {
              buffer: terrain,
              type: "Terrain",
              key: metadata.key,
            },
            [terrain],
          )
          .then(function (terrainTiles) {
            // Add requested tile and mark it as SELF
            const requestedInfo = metadata.getTileInformationFromQuadKey(q);
            requestedInfo.terrainState = TerrainState.SELF;
            terrainCache.add(q, terrainTiles[0]);
            const provider = requestedInfo.terrainProvider;

            // Add children to cache
            const count = terrainTiles.length - 1;
            for (let j = 0; j < count; ++j) {
              const childKey = q + j.toString();
              const child = metadata.getTileInformationFromQuadKey(childKey);
              if (defined(child)) {
                terrainCache.add(childKey, terrainTiles[j + 1]);
                child.terrainState = TerrainState.PARENT;
                if (child.terrainProvider === 0) {
                  child.terrainProvider = provider;
                }
              }
            }
          });
      }

      return Promise.reject(new RuntimeError("Failed to load terrain."));
    });

    terrainPromises[q] = sharedPromise; // Store promise without delete from terrainPromises
    terrainRequests[q] = sharedRequest;

    // Set promise so we remove from terrainPromises just one time
    sharedPromise = sharedPromise.finally(function () {
      delete terrainPromises[q];
      delete terrainRequests[q];
    });
  }

  return sharedPromise
    .then(function () {
      const buffer = terrainCache.get(quadKey);
      if (defined(buffer)) {
        const credit = metadata.providers[info.terrainProvider];
        return new GoogleEarthEnterpriseTerrainData({
          buffer: buffer,
          childTileMask: computeChildMask(quadKey, info, metadata),
          credits: defined(credit) ? [credit] : undefined,
          negativeAltitudeExponentBias: metadata.negativeAltitudeExponentBias,
          negativeElevationThreshold: metadata.negativeAltitudeThreshold,
        });
      }

      return Promise.reject(new RuntimeError("Failed to load terrain."));
    })
    .catch(function (error) {
      if (sharedRequest.state === RequestState.CANCELLED) {
        request.state = sharedRequest.state;
        return Promise.reject(error);
      }
      info.terrainState = TerrainState.NONE;
      return Promise.reject(error);
    });
};

/**
 * 获取给定级别瓦片允许的最大几何误差。
 *
 * @param {number} level 要获取最大几何误差的瓦片级别。
 * @returns {number} 最大几何误差。
 */

GoogleEarthEnterpriseTerrainProvider.prototype.getLevelMaximumGeometricError =
  function (level) {
    return this._levelZeroMaximumGeometricError / (1 << level);
  };

/**
 * 确定给定瓦片的数据是否可以加载。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {boolean|undefined} 如果不支持则为 undefined，否则返回 true 或 false。
 */

GoogleEarthEnterpriseTerrainProvider.prototype.getTileDataAvailable = function (
  x,
  y,
  level,
) {
  const metadata = this._metadata;
  let quadKey = GoogleEarthEnterpriseMetadata.tileXYToQuadKey(x, y, level);

  const info = metadata.getTileInformation(x, y, level);
  if (info === null) {
    return false;
  }

  if (defined(info)) {
    if (!info.ancestorHasTerrain) {
      return true; // We'll just return the ellipsoid
    }

    const terrainState = info.terrainState;
    if (terrainState === TerrainState.NONE) {
      return false; // Terrain is not available
    }

    if (!defined(terrainState) || terrainState === TerrainState.UNKNOWN) {
      info.terrainState = TerrainState.UNKNOWN;
      if (!info.hasTerrain()) {
        quadKey = quadKey.substring(0, quadKey.length - 1);
        const parentInfo = metadata.getTileInformationFromQuadKey(quadKey);
        if (!defined(parentInfo) || !parentInfo.hasTerrain()) {
          return false;
        }
      }
    }

    return true;
  }

  if (metadata.isValid(quadKey)) {
    // We will need this tile, so request metadata and return false for now
    const request = new Request({
      throttle: false,
      throttleByServer: true,
      type: RequestType.TERRAIN,
    });
    metadata.populateSubtree(x, y, level, request);
  }
  return false;
};

/**
 * 确保我们加载瓦片的可用性数据。
 *
 * @param {number} x 请求几何体的瓦片的 X 坐标。
 * @param {number} y 请求几何体的瓦片的 Y 坐标。
 * @param {number} level 请求几何体的瓦片的级别。
 * @returns {undefined}
 */

GoogleEarthEnterpriseTerrainProvider.prototype.loadTileDataAvailability =
  function (x, y, level) {
    return undefined;
  };

//
// Functions to handle imagery packets
//
function buildTerrainResource(terrainProvider, quadKey, version, request) {
  version = defined(version) && version > 0 ? version : 1;
  return terrainProvider._metadata.resource.getDerivedResource({
    url: `flatfile?f1c-0${quadKey}-t.${version.toString()}`,
    request: request,
  });
}
export default GoogleEarthEnterpriseTerrainProvider;
