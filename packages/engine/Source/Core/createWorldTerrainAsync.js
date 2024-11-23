import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import defaultValue from "./defaultValue.js";
import Ellipsoid from "./Ellipsoid.js";

/**
 * 创建一个 {@link CesiumTerrainProvider} 实例，用于 {@link https://cesium.com/content/#cesium-world-terrain|Cesium World Terrain}。
 *
 * @function
 *
 * @param {Object} [options] 包含以下属性的对象：
 * @param {Boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应从服务器请求附加的光照信息（如果可用）。
 * @param {Boolean} [options.requestWaterMask=false] 标志，指示客户端是否应从服务器请求每个瓦片的水面掩码（如果可用）。
 * @returns {Promise<CesiumTerrainProvider>} 一个承诺，解析为创建的 CesiumTerrainProvider
 *
 * @see Ion
 *
 * @example
 * // Create Cesium World Terrain with default settings
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldTerrainAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // Create Cesium World Terrain with water and normals.
 * try {
 *   const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldTerrainAsync({
 *       requestWaterMask: true,
 *       requestVertexNormals: true
 *     });
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 */
function createWorldTerrainAsync(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  return CesiumTerrainProvider.fromIonAssetId(1, {
    requestVertexNormals: defaultValue(options.requestVertexNormals, false),
    requestWaterMask: defaultValue(options.requestWaterMask, false),
    ellipsoid: Ellipsoid.WGS84,
  });
}
export default createWorldTerrainAsync;
