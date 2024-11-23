import CesiumTerrainProvider from "./CesiumTerrainProvider.js";
import defaultValue from "./defaultValue.js";

/**
 * 创建一个 {@link CesiumTerrainProvider} 实例，用于 {@link https://cesium.com/content/#cesium-world-bathymetry|Cesium World Bathymetry}。
 *
 * @function
 *
 * @param {Object} [options] 包含以下属性的对象：
 * @param {Boolean} [options.requestVertexNormals=false] 标志，指示客户端是否应从服务器请求附加的光照信息（如果可用）。
 * @returns {Promise<CesiumTerrainProvider>} 一个承诺，解析为创建的 CesiumTerrainProvider
 *
 * @see Ion
 *
 * @example
 * // Create Cesium World Bathymetry with default settings
 * try {
 *   const viewer = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldBathymetryAsync();
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 * @example
 * // Create Cesium World Bathymetry with normals.
 * try {
 *   const viewer1 = new Cesium.Viewer("cesiumContainer", {
 *     terrainProvider: await Cesium.createWorldBathymetryAsync({
 *       requestVertexNormals: true
 *     });
 *   });
 * } catch (error) {
 *   console.log(error);
 * }
 *
 */
function createWorldBathymetryAsync(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  return CesiumTerrainProvider.fromIonAssetId(2426648, {
    requestVertexNormals: defaultValue(options.requestVertexNormals, false),
  });
}
export default createWorldBathymetryAsync;
