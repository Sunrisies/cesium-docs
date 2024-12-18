import Cartesian2 from "./Cartesian2.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import sampleTerrain from "./sampleTerrain.js";

const scratchCartesian2 = new Cartesian2();

/**
 * 在地形数据集中以最大可用瓦片级别发起 sampleTerrain() 请求。
 *
 * @function sampleTerrainMostDetailed
 *
 * @param {TerrainProvider} terrainProvider 要查询高度的地形提供者。
 * @param {Cartographic[]} positions 要更新地形高度的位置。
 * @param {boolean} [rejectOnTileFail=false] 如果为真，则在请求地形瓦片失败时，承诺将被拒绝。如果为假，则返回的高度将是未定义的。
 * @returns {Promise<Cartographic[]>} 当地形查询完成时，返回提供的位置列表的承诺。 如果地形提供者的 `availability` 属性未定义，则此承诺将被拒绝。
 *
 * @example
 * // Query the terrain height of two Cartographic positions
 * const terrainProvider = await Cesium.createWorldTerrainAsync();
 * const positions = [
 *     Cesium.Cartographic.fromDegrees(86.925145, 27.988257),
 *     Cesium.Cartographic.fromDegrees(87.0, 28.0)
 * ];
 * const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions);
 * // positions[0].height and positions[1].height have been updated.
 * // updatedPositions is just a reference to positions.
 *
 * // To handle tile errors, pass true for the rejectOnTileFail parameter.
 * try {
 *    const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions, true);
 * } catch (error) {
 *   // A tile request error occurred.
 * }
 */
async function sampleTerrainMostDetailed(
  terrainProvider,
  positions,
  rejectOnTileFail,
) {
  if (!defined(rejectOnTileFail)) {
    rejectOnTileFail = false;
  }
  //>>includeStart('debug', pragmas.debug);
  if (!defined(terrainProvider)) {
    throw new DeveloperError("terrainProvider is required.");
  }
  if (!defined(positions)) {
    throw new DeveloperError("positions is required.");
  }
  //>>includeEnd('debug');

  const byLevel = [];
  const maxLevels = [];

  const availability = terrainProvider.availability;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(availability)) {
    throw new DeveloperError(
      "sampleTerrainMostDetailed requires a terrain provider that has tile availability.",
    );
  }
  //>>includeEnd('debug');

  const promises = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const maxLevel = availability.computeMaximumLevelAtPosition(position);
    maxLevels[i] = maxLevel;
    if (maxLevel === 0) {
      // This is a special case where we have a parent terrain and we are requesting
      // heights from an area that isn't covered by the top level terrain at all.
      // This will essentially trigger the loading of the parent terrains root tile
      terrainProvider.tilingScheme.positionToTileXY(
        position,
        1,
        scratchCartesian2,
      );
      const promise = terrainProvider.loadTileDataAvailability(
        scratchCartesian2.x,
        scratchCartesian2.y,
        1,
      );
      if (defined(promise)) {
        promises.push(promise);
      }
    }

    let atLevel = byLevel[maxLevel];
    if (!defined(atLevel)) {
      byLevel[maxLevel] = atLevel = [];
    }
    atLevel.push(position);
  }

  await Promise.all(promises);
  await Promise.all(
    byLevel.map(function (positionsAtLevel, index) {
      if (defined(positionsAtLevel)) {
        return sampleTerrain(
          terrainProvider,
          index,
          positionsAtLevel,
          rejectOnTileFail,
        );
      }
    }),
  );
  const changedPositions = [];
  for (let i = 0; i < positions.length; ++i) {
    const position = positions[i];
    const maxLevel = availability.computeMaximumLevelAtPosition(position);

    if (maxLevel !== maxLevels[i]) {
      // Now that we loaded the max availability, a higher level has become available
      changedPositions.push(position);
    }
  }

  if (changedPositions.length > 0) {
    await sampleTerrainMostDetailed(
      terrainProvider,
      changedPositions,
      rejectOnTileFail,
    );
  }

  return positions;
}
export default sampleTerrainMostDetailed;
