import Check from "./Check.js";
import defined from "./defined.js";

/**
 * 通过请求地形提供者的瓦片、采样和插值，启动对一组 {@link Cartographic} 位置的地形高度查询。插值
 * 匹配用于在指定级别渲染地形的三角形。查询
 * 是异步进行的，因此此函数返回一个承诺，当
 * 查询完成时解析。每个点高度都会在原位修改。如果因为在该位置的指定级别没有可用的地形数据
 * 或发生其他错误而无法确定高度，则高度被设置为未定义。与
 * {@link Cartographic} 类型的典型情况一样，提供的高度是相对于参考椭球体的高度
 * （例如 {@link Ellipsoid.WGS84}），而不是相对于平均海平面的高度。
 * 换句话说，如果在海洋中取样，它不一定为 0.0。此函数需要地形细节级别作为输入，
 * 如果您需要尽可能精确地获取地形的高度（即以最大细节级别），请使用 {@link sampleTerrainMostDetailed}。
 *
 * @function sampleTerrain
 *
 * @param {TerrainProvider} terrainProvider 查询高度的地形提供者。
 * @param {number} level 查询地形高度的地形细节级别。
 * @param {Cartographic[]} positions 需要更新地形高度的位置。
 * @param {boolean} [rejectOnTileFail=false] 如果为 true，则对于任何失败的地形瓦片请求，承诺将被拒绝。如果为 false，则返回的高度将为未定义。
 * @returns {Promise<Cartographic[]>} 当地形查询完成时，解析为提供的位置列表的承诺。
 *
 * @see sampleTerrainMostDetailed
 *
 * @example
 * // Query the terrain height of two Cartographic positions
 * const terrainProvider = await Cesium.createWorldTerrainAsync();
 * const positions = [
 *     Cesium.Cartographic.fromDegrees(86.925145, 27.988257),
 *     Cesium.Cartographic.fromDegrees(87.0, 28.0)
 * ];
 * const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions);
 * // positions[0].height and positions[1].height have been updated.
 * // updatedPositions is just a reference to positions.
 *
 * // To handle tile errors, pass true for the rejectOnTileFail parameter.
 * try {
 *    const updatedPositions = await Cesium.sampleTerrain(terrainProvider, 11, positions, true);
 * } catch (error) {
 *   // A tile request error occurred.
 * }
 */
async function sampleTerrain(
  terrainProvider,
  level,
  positions,
  rejectOnTileFail,
) {
  if (!defined(rejectOnTileFail)) {
    rejectOnTileFail = false;
  }
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("terrainProvider", terrainProvider);
  Check.typeOf.number("level", level);
  Check.typeOf.bool("rejectOnTileFail", rejectOnTileFail);
  Check.defined("positions", positions);
  //>>includeEnd('debug');

  return doSampling(terrainProvider, level, positions, rejectOnTileFail);
}

/**
 * @param {object[]} tileRequests 被修改的请求列表，第一个请求将被尝试。
 * @param {Array<Promise<void>>} results 需要放置结果承诺的列表。
 * @param {boolean} rejectOnTileFail 如果为 true，则承诺将被拒绝。如果为 false，则返回的高度将为未定义。
 * @returns {boolean} 如果请求已发出，且可以立即尝试下一个项目，则返回 true；如果被节流，需要等待一段时间再重试，则返回 false。
 *
 * @private
 */

function attemptConsumeNextQueueItem(tileRequests, results, rejectOnTileFail) {
  const tileRequest = tileRequests[0];
  const requestPromise = tileRequest.terrainProvider.requestTileGeometry(
    tileRequest.x,
    tileRequest.y,
    tileRequest.level,
  );

  if (!requestPromise) {
    // getting back undefined instead of a promise indicates we should retry a bit later
    return false;
  }

  let promise;

  if (rejectOnTileFail) {
    promise = requestPromise.then(createInterpolateFunction(tileRequest));
  } else {
    promise = requestPromise
      .then(createInterpolateFunction(tileRequest))
      .catch(createMarkFailedFunction(tileRequest));
  }

  // remove the request we've just done from the queue
  //  and add its promise result to the result list
  tileRequests.shift();
  results.push(promise);

  // indicate we should synchronously attempt the next request as well
  return true;
}

/**
 * 将 window.setTimeout 封装在 Promise 中
 * @param {number} ms 延迟的毫秒数
 * @private
 */
function delay(ms) {
  return new Promise(function (res) {
    setTimeout(res, ms);
  });
}

/**
 * 递归处理所有的 tileRequests，直到列表被清空
 * 并将每个结果的 Promise 放入结果列表中
 * @param {object[]} tileRequests 希望发出的请求列表
 * @param {Array<Promise<void>>} results 所有结果承诺的列表
 * @param {boolean} rejectOnTileFail 如果为 true，则承诺将被拒绝。如果为 false，则返回的高度将为未定义。
 * @returns {Promise<void>} 一个承诺，所有请求启动后解决
 *
 * @private
 */

function drainTileRequestQueue(tileRequests, results, rejectOnTileFail) {
  // nothing left to do
  if (!tileRequests.length) {
    return Promise.resolve();
  }

  // consume an item from the queue, which will
  //  mutate the request and result lists, and return true if we should
  //  immediately attempt to consume the next item as well
  const success = attemptConsumeNextQueueItem(
    tileRequests,
    results,
    rejectOnTileFail,
  );
  if (success) {
    return drainTileRequestQueue(tileRequests, results, rejectOnTileFail);
  }

  // wait a small fixed amount of time first, before retrying the same request again
  return delay(100).then(() => {
    return drainTileRequestQueue(tileRequests, results, rejectOnTileFail);
  });
}

function doSampling(terrainProvider, level, positions, rejectOnTileFail) {
  const tilingScheme = terrainProvider.tilingScheme;

  let i;

  // Sort points into a set of tiles
  const tileRequests = []; // Result will be an Array as it's easier to work with
  const tileRequestSet = {}; // A unique set
  for (i = 0; i < positions.length; ++i) {
    const xy = tilingScheme.positionToTileXY(positions[i], level);
    if (!defined(xy)) {
      continue;
    }

    const key = xy.toString();

    if (!tileRequestSet.hasOwnProperty(key)) {
      // When tile is requested for the first time
      const value = {
        x: xy.x,
        y: xy.y,
        level: level,
        tilingScheme: tilingScheme,
        terrainProvider: terrainProvider,
        positions: [],
      };
      tileRequestSet[key] = value;
      tileRequests.push(value);
    }

    // Now append to array of points for the tile
    tileRequestSet[key].positions.push(positions[i]);
  }

  // create our list of result promises to be filled
  const tilePromises = [];
  return drainTileRequestQueue(
    tileRequests,
    tilePromises,
    rejectOnTileFail,
  ).then(function () {
    // now all the required requests have been started
    //  we just wait for them all to finish
    return Promise.all(tilePromises).then(function () {
      return positions;
    });
  });
}

/**
 * 对给定的 {@link Cartographic} 调用指定 {@link TerrainData} 的 {@link TerrainData#interpolateHeight}，
 * 如果返回值不为未定义，则将高度属性赋值。
 *
 * 如果返回值为 false，则建议您先调用 {@link TerrainData#createMesh}。
 * @param {Cartographic} position 要进行插值并赋值高度的位置信息
 * @param {TerrainData} terrainData 地形数据
 * @param {Rectangle} rectangle 矩形区域
 * @returns {boolean} 如果高度实际上被插值并赋值，则返回 true
 * @private
 */

function interpolateAndAssignHeight(position, terrainData, rectangle) {
  const height = terrainData.interpolateHeight(
    rectangle,
    position.longitude,
    position.latitude,
  );
  if (height === undefined) {
    // if height comes back as undefined, it may implicitly mean the terrain data
    //  requires us to call TerrainData.createMesh() first (ArcGIS requires this in particular)
    //  so we'll return false and do that next!
    return false;
  }
  position.height = height;
  return true;
}

function createInterpolateFunction(tileRequest) {
  const tilePositions = tileRequest.positions;
  const rectangle = tileRequest.tilingScheme.tileXYToRectangle(
    tileRequest.x,
    tileRequest.y,
    tileRequest.level,
  );
  return function (terrainData) {
    let isMeshRequired = false;
    for (let i = 0; i < tilePositions.length; ++i) {
      const position = tilePositions[i];
      const isHeightAssigned = interpolateAndAssignHeight(
        position,
        terrainData,
        rectangle,
      );
      // we've found a position which returned undefined - hinting to us
      //  that we probably need to create a mesh for this terrain data.
      // so break out of this loop and create the mesh - then we'll interpolate all the heights again
      if (!isHeightAssigned) {
        isMeshRequired = true;
        break;
      }
    }

    if (!isMeshRequired) {
      // all position heights were interpolated - we don't need the mesh
      return Promise.resolve();
    }

    // create the mesh - and interpolate all the positions again
    // note: terrain exaggeration is not passed in - we are only interested in the raw data
    return terrainData
      .createMesh({
        tilingScheme: tileRequest.tilingScheme,
        x: tileRequest.x,
        y: tileRequest.y,
        level: tileRequest.level,
        // don't throttle this mesh creation because we've asked to sample these points;
        //  so sample them! We don't care how many tiles that is!
        throttle: false,
      })
      .then(function () {
        // mesh has been created - so go through every position (maybe again)
        //  and re-interpolate the heights - presumably using the mesh this time
        for (let i = 0; i < tilePositions.length; ++i) {
          const position = tilePositions[i];
          // if it doesn't work this time - that's fine, we tried.
          interpolateAndAssignHeight(position, terrainData, rectangle);
        }
      });
  };
}

function createMarkFailedFunction(tileRequest) {
  const tilePositions = tileRequest.positions;
  return function () {
    for (let i = 0; i < tilePositions.length; ++i) {
      const position = tilePositions[i];
      position.height = undefined;
    }
  };
}

export default sampleTerrain;
