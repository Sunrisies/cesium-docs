import Check from "../Core/Check.js";
import Event from "../Core/Event.js";
import createWorldBathymetryAsync from "../Core/createWorldBathymetryAsync.js";
import createWorldTerrainAsync from "../Core/createWorldTerrainAsync.js";

/**
 * 一个帮助管理地形提供者的异步操作的助手。
 *
 * @alias Terrain
 * @constructor
 *
 * @see Terrain.fromWorldTerrain
 * @see CesiumTerrainProvider
 * @see VRTheWorldTerrainProvider
 * @see GoogleEarthEnterpriseTerrainProvider
 *
 * @example
 * // Create
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 * });
 *
 * @example
 * // Handle loading events
 * const terrain = new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl("https://myTestTerrain.com"));
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading terrain tiles! ${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 *
 * @param {Promise<TerrainProvider>} terrainProviderPromise A promise which resolves to a terrain provider
 */
function Terrain(terrainProviderPromise) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrainProviderPromise", terrainProviderPromise);
  //>>includeEnd('debug');

  this._ready = false;
  this._provider = undefined;
  this._errorEvent = new Event();
  this._readyEvent = new Event();

  handlePromise(this, terrainProviderPromise);
}

Object.defineProperties(Terrain.prototype, {
  /**
   * 获取一个事件，当地形提供者遇到异步错误时会引发该事件。通过订阅
   * 此事件，您将收到错误通知，并可能从中恢复。事件监听器
   * 会传递引发的错误的实例。
   * @memberof Terrain.prototype
   * @type {Event<Terrain.ErrorEventCallback>}
   * @readonly
   */
  errorEvent: {
    get: function () {
      return this._errorEvent;
    },
  },

  /**
   * 获取一个事件，当地形提供者成功创建时会引发该事件。事件监听器
   * 会传递创建的 {@link TerrainProvider} 实例。
   * @memberof Terrain.prototype
   * @type {Event<Terrain.ReadyEventCallback>}
   * @readonly
   */
  readyEvent: {
    get: function () {
      return this._readyEvent;
    },
  },

  /**
   * 当地形提供者成功创建时返回 true。否则返回 false。
   * @memberof Terrain.prototype
   *
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },

  /**
   * 提供地球表面几何的地形提供者。在 {@link Terrain.readyEvent} 被引发之前请勿使用。
   * @memberof Terrain.prototype
   *
   * @type {TerrainProvider}
   * @readonly
   */
  provider: {
    get: function () {
      return this._provider;
    },
  },
});

/**
 * 为 {@link https://cesium.com/content/#cesium-world-terrain|Cesium World Terrain} 创建一个 {@link Terrain} 实例。
 *
 * @function
 *
 * @param {Object} [options] 包含以下属性的对象：
 * @param {Boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应从服务器请求额外的光照信息（如果可用）。
 * @param {Boolean} [options.requestWaterMask=false] 标志，指示客户端是否应从服务器请求每个瓦片的水面遮罩（如果可用）。
 * @returns {Terrain} 一个用于 CesiumTerrainProvider 的异步助手对象。
 *
 * @see Ion
 * @see createWorldTerrainAsync
 *
 * @example
 * // Create Cesium World Terrain with default settings
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain()
 * });
 *
 * @example
 * // Create Cesium World Terrain with water and normals.
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldTerrain({
 *      requestWaterMask: true,
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // Handle loading events
 * const terrain = Cesium.Terrain.fromWorldTerrain();
 *
 * scene.setTerrain(terrain);
 *
 * terrain.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   terrain.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading terrain tiles! ${error}`);
 *   });
 * });
 *
 * terrain.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating terrain! ${error}`);
 * });
 */
Terrain.fromWorldTerrain = function (options) {
  return new Terrain(createWorldTerrainAsync(options));
};

/**
 * 为 {@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry} 创建一个 {@link Terrain} 实例。
 *
 * @function
 *
 * @param {Object} [options] 包含以下属性的对象：
 * @param {Boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应从服务器请求额外的光照信息（如果可用）。
 * @returns {Terrain} 一个用于 CesiumTerrainProvider 的异步助手对象。
 *
 * @see Ion
 * @see createWorldBathymetryAsync
 *
 * @example
 * // Create Cesium World Bathymetry with default settings
 * const viewer = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry)
 * });
 *
 * @example
 * // Create Cesium World Terrain with normals.
 * const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *   terrain: Cesium.Terrain.fromWorldBathymetry({
 *      requestVertexNormals: true
 *    });
 * });
 *
 * @example
 * // Handle loading events
 * const bathymetry = Cesium.Terrain.fromWorldBathymetry();
 *
 * scene.setTerrain(bathymetry);
 *
 * bathymetry.readyEvent.addEventListener(provider => {
 *   scene.globe.enableLighting = true;
 *
 *   bathymetry.provider.errorEvent.addEventListener(error => {
 *     alert(`Encountered an error while loading bathymetric terrain tiles! ${error}`);
 *   });
 * });
 *
 * bathymetry.errorEvent.addEventListener(error => {
 *   alert(`Encountered an error while creating bathymetric terrain! ${error}`);
 * });
 */
Terrain.fromWorldBathymetry = function (options) {
  return new Terrain(createWorldBathymetryAsync(options));
};

function handleError(errorEvent, error) {
  if (errorEvent.numberOfListeners > 0) {
    errorEvent.raiseEvent(error);
  } else {
    // Default handler is to log to the console
    console.error(error);
  }
}

async function handlePromise(instance, promise) {
  let provider;
  try {
    provider = await Promise.resolve(promise);
    instance._provider = provider;
    instance._ready = true;
    instance._readyEvent.raiseEvent(provider);
  } catch (error) {
    handleError(instance._errorEvent, error);
  }
}

export default Terrain;

/**
 * 当发生错误时调用的函数。
 * @callback Terrain.ErrorEventCallback
 *
 * @this Terrain
 * @param {Error} err 一个包含发生错误详细信息的对象。
 */

/**
 * 当提供者被创建时调用的函数。
 * @callback Terrain.ReadyEventCallback
 *
 * @this Terrain
 * @param {TerrainProvider} provider 创建的地形提供者。
 */

