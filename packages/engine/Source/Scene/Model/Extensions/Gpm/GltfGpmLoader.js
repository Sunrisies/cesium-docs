import Cartesian3 from "../../../../Core/Cartesian3.js";
import Check from "../../../../Core/Check.js";
import Matrix3 from "../../../../Core/Matrix3.js";
import RuntimeError from "../../../../Core/RuntimeError.js";
import AnchorPointDirect from "./AnchorPointDirect.js";
import AnchorPointIndirect from "./AnchorPointIndirect.js";
import CorrelationGroup from "./CorrelationGroup.js";
import GltfGpmLocal from "./GltfGpmLocal.js";
import Spdcf from "./Spdcf.js";
import StorageType from "./StorageType.js";

/**
 * 从 glTF 对象的根部加载 glTF NGA_gpm_local
 *
 * @alias GltfGpmLoader
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {object} options.gltf glTF JSON。
 * @param {string} [options.extension] <code>NGA_gpm_local</code> 扩展对象。
 *
 * @private
 */

function GltfGpmLoader() {}

/**
 * 创建一个 Matrix3，用于描述协方差矩阵（对称），
 * 这个矩阵由包含上三角部分的数组按列优先顺序构成。
 *
 * @param {number[]} array 输入数组
 * @returns {Matrix3} 返回的 Matrix3
 */

function createCovarianceMatrixFromUpperTriangle(array) {
  const covarianceMatrix = new Matrix3(
    array[0],
    array[1],
    array[3],
    array[1],
    array[2],
    array[4],
    array[3],
    array[4],
    array[5],
  );
  return covarianceMatrix;
}

/**
 * 从给定的 JSON 表示创建一个 `AnchorPointDirect`
 *
 * @param {object} anchorPointDirectJson 输入的 JSON
 * @returns {AnchorPointDirect} 直接锚点
 */

function createAnchorPointDirect(anchorPointDirectJson) {
  const position = Cartesian3.fromArray(
    anchorPointDirectJson.position,
    0,
    new Cartesian3(),
  );
  const adjustmentParams = Cartesian3.fromArray(
    anchorPointDirectJson.adjustmentParams,
    0,
    new Cartesian3(),
  );
  const anchorPointDirect = new AnchorPointDirect({
    position: position,
    adjustmentParams: adjustmentParams,
  });
  return anchorPointDirect;
}

/**
 * 从给定的 JSON 表示创建一个 `AnchorPointIndirect`
 *
 * @param {object} anchorPointIndirectJson 输入的 JSON
 * @returns {AnchorPointIndirect} 间接锚点
 */

function createAnchorPointIndirect(anchorPointIndirectJson) {
  const position = Cartesian3.fromArray(
    anchorPointIndirectJson.position,
    0,
    new Cartesian3(),
  );
  const adjustmentParams = Cartesian3.fromArray(
    anchorPointIndirectJson.adjustmentParams,
    0,
    new Cartesian3(),
  );
  const covarianceMatrix = createCovarianceMatrixFromUpperTriangle(
    anchorPointIndirectJson.covarianceMatrix,
  );
  const anchorPointIndirect = new AnchorPointIndirect({
    position: position,
    adjustmentParams: adjustmentParams,
    covarianceMatrix: covarianceMatrix,
  });
  return anchorPointIndirect;
}

/**
 * 从给定的 JSON 表示创建一个 `CorrelationGroup`
 *
 * @param {object} correlationGroupJson 输入的 JSON
 * @returns {CorrelationGroup} 相关组
 */

function createCorrelationGroup(correlationGroupJson) {
  const groupFlags = correlationGroupJson.groupFlags;
  const rotationThetas = Cartesian3.fromArray(
    correlationGroupJson.rotationThetas,
    0,
    new Cartesian3(),
  );
  const params = [];
  for (const paramJson of correlationGroupJson.params) {
    const param = new Spdcf({
      A: paramJson.A,
      alpha: paramJson.alpha,
      beta: paramJson.beta,
      T: paramJson.T,
    });
    params.push(param);
  }
  const correlationGroup = new CorrelationGroup({
    groupFlags: groupFlags,
    rotationThetas: rotationThetas,
    params: params,
  });
  return correlationGroup;
}

/**
 * 从给定的 JSON 加载 GPM 数据，该 JSON 在 glTF 的根部作为
 * `NGA_gpm_local` 扩展对象找到。
 *
 * @param {object} gltfGpmLocalJson 扩展对象
 * @returns {GltfGpmLocal} 解析后的对象
 * @throws RuntimeError 当给定对象包含无效的存储类型时抛出。
 * @private
 */

GltfGpmLoader.load = function (gltfGpmLocalJson) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("gltfGpmLocalJson", gltfGpmLocalJson);
  //>>includeEnd('debug');

  const storageType = gltfGpmLocalJson.storageType;
  if (storageType === StorageType.Direct) {
    return GltfGpmLoader.loadDirect(gltfGpmLocalJson);
  }
  if (storageType === StorageType.Indirect) {
    return GltfGpmLoader.loadIndirect(gltfGpmLocalJson);
  }
  throw new RuntimeError(
    `Invalid storage type in NGA_gpm_local - expected 'Direct' or 'Indirect', but found ${storageType}`,
  );
};

/**
 * 从给定的 JSON 加载 GPM 数据，该 JSON 在 glTF 的根部作为
 * `NGA_gpm_local` 扩展对象找到，假设给定对象的 `storageType` 为
 * `StorageType.Direct`。
 *
 * @param {object} gltfGpmLocalJson 扩展对象
 * @returns {GltfGpmLocal} 解析后的对象
 * @private
 */

GltfGpmLoader.loadDirect = function (gltfGpmLocalJson) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("gltfGpmLocalJson", gltfGpmLocalJson);
  Check.typeOf.object(
    "gltfGpmLocalJson.anchorPointsDirect",
    gltfGpmLocalJson.anchorPointsDirect,
  );
  Check.typeOf.object(
    "gltfGpmLocalJson.covarianceDirectUpperTriangle",
    gltfGpmLocalJson.covarianceDirectUpperTriangle,
  );
  //>>includeEnd('debug');

  const anchorPointsDirect = [];
  const anchorPointsDirectJson = gltfGpmLocalJson.anchorPointsDirect;
  for (const anchorPointDirectJson of anchorPointsDirectJson) {
    const anchorPointDirect = createAnchorPointDirect(anchorPointDirectJson);
    anchorPointsDirect.push(anchorPointDirect);
  }
  const covarianceDirect = createCovarianceMatrixFromUpperTriangle(
    gltfGpmLocalJson.covarianceDirectUpperTriangle,
  );

  const gltfGpmLocal = new GltfGpmLocal({
    storageType: StorageType.Direct,
    anchorPointsDirect: anchorPointsDirect,
    covarianceDirect: covarianceDirect,
  });
  return gltfGpmLocal;
};

/**
 * 从给定的 JSON 加载 GPM 数据，该 JSON 在 glTF 的根部作为
 * `NGA_gpm_local` 扩展对象找到，假设给定对象的 `storageType` 为
 * `StorageType.Indirect`。
 *
 * @param {object} gltfGpmLocalJson 扩展对象
 * @returns {GltfGpmLocal} 解析后的对象
 * @private
 */

GltfGpmLoader.loadIndirect = function (gltfGpmLocalJson) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("gltfGpmLocalJson", gltfGpmLocalJson);
  Check.typeOf.object(
    "gltfGpmLocalJson.anchorPointsIndirect",
    gltfGpmLocalJson.anchorPointsIndirect,
  );
  Check.typeOf.object(
    "gltfGpmLocalJson.intraTileCorrelationGroups",
    gltfGpmLocalJson.intraTileCorrelationGroups,
  );
  //>>includeEnd('debug');

  const anchorPointsIndirect = [];
  const anchorPointsIndirectJson = gltfGpmLocalJson.anchorPointsIndirect;
  for (const anchorPointIndirectJson of anchorPointsIndirectJson) {
    const anchorPointIndirect = createAnchorPointIndirect(
      anchorPointIndirectJson,
    );
    anchorPointsIndirect.push(anchorPointIndirect);
  }

  const intraTileCorrelationGroupsJson =
    gltfGpmLocalJson.intraTileCorrelationGroups;
  const intraTileCorrelationGroups = [];

  for (const correlationGroupJson of intraTileCorrelationGroupsJson) {
    const correlationGroup = createCorrelationGroup(correlationGroupJson);
    intraTileCorrelationGroups.push(correlationGroup);
  }

  const gltfGpmLocal = new GltfGpmLocal({
    storageType: StorageType.Indirect,
    anchorPointsIndirect: anchorPointsIndirect,
    intraTileCorrelationGroups: intraTileCorrelationGroups,
  });
  return gltfGpmLocal;
};

export default GltfGpmLoader;
