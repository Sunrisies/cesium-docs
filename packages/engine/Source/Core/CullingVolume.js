import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Intersect from "./Intersect.js";
import Plane from "./Plane.js";

/**
 * 由平面定义的剔除体积。
 *
 * @alias CullingVolume
 * @constructor
 *
 * @param {Cartesian4[]} [planes] 一个裁剪平面数组。
 */

function CullingVolume(planes) {
  /**
   * 每个平面由一个 Cartesian4 对象表示，其中 x、y 和 z 组件
   * 定义法向量的单位向量，w 组件是平面距离原点的距离。
   * @type {Cartesian4[]}
   * @default []
   */

  this.planes = defaultValue(planes, []);
}

const faces = [new Cartesian3(), new Cartesian3(), new Cartesian3()];
Cartesian3.clone(Cartesian3.UNIT_X, faces[0]);
Cartesian3.clone(Cartesian3.UNIT_Y, faces[1]);
Cartesian3.clone(Cartesian3.UNIT_Z, faces[2]);

const scratchPlaneCenter = new Cartesian3();
const scratchPlaneNormal = new Cartesian3();
const scratchPlane = new Plane(new Cartesian3(1.0, 0.0, 0.0), 0.0);

/**
 * 从包围球构造剔除体积。创建六个平面，形成一个包含该球的盒子。
 * 这些平面在世界坐标中与 x、y 和 z 轴对齐。
 *
 * @param {BoundingSphere} boundingSphere 用于创建剔除体积的包围球。
 * @param {CullingVolume} [result] 存储结果的对象。
 * @returns {CullingVolume} 从包围球创建的剔除体积。
 */

CullingVolume.fromBoundingSphere = function (boundingSphere, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingSphere)) {
    throw new DeveloperError("boundingSphere is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new CullingVolume();
  }

  const length = faces.length;
  const planes = result.planes;
  planes.length = 2 * length;

  const center = boundingSphere.center;
  const radius = boundingSphere.radius;

  let planeIndex = 0;

  for (let i = 0; i < length; ++i) {
    const faceNormal = faces[i];

    let plane0 = planes[planeIndex];
    let plane1 = planes[planeIndex + 1];

    if (!defined(plane0)) {
      plane0 = planes[planeIndex] = new Cartesian4();
    }
    if (!defined(plane1)) {
      plane1 = planes[planeIndex + 1] = new Cartesian4();
    }

    Cartesian3.multiplyByScalar(faceNormal, -radius, scratchPlaneCenter);
    Cartesian3.add(center, scratchPlaneCenter, scratchPlaneCenter);

    plane0.x = faceNormal.x;
    plane0.y = faceNormal.y;
    plane0.z = faceNormal.z;
    plane0.w = -Cartesian3.dot(faceNormal, scratchPlaneCenter);

    Cartesian3.multiplyByScalar(faceNormal, radius, scratchPlaneCenter);
    Cartesian3.add(center, scratchPlaneCenter, scratchPlaneCenter);

    plane1.x = -faceNormal.x;
    plane1.y = -faceNormal.y;
    plane1.z = -faceNormal.z;
    plane1.w = -Cartesian3.dot(
      Cartesian3.negate(faceNormal, scratchPlaneNormal),
      scratchPlaneCenter,
    );

    planeIndex += 2;
  }

  return result;
};

/**
 * 确定一个包围体是否与剔除体积相交。
 *
 * @param {object} boundingVolume 要测试与剔除体积相交的包围体。
 * @returns {Intersect}  Intersect.OUTSIDE、Intersect.INTERSECTING 或 Intersect.INSIDE。
 */

CullingVolume.prototype.computeVisibility = function (boundingVolume) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingVolume)) {
    throw new DeveloperError("boundingVolume is required.");
  }
  //>>includeEnd('debug');

  const planes = this.planes;
  let intersecting = false;
  for (let k = 0, len = planes.length; k < len; ++k) {
    const result = boundingVolume.intersectPlane(
      Plane.fromCartesian4(planes[k], scratchPlane),
    );
    if (result === Intersect.OUTSIDE) {
      return Intersect.OUTSIDE;
    } else if (result === Intersect.INTERSECTING) {
      intersecting = true;
    }
  }

  return intersecting ? Intersect.INTERSECTING : Intersect.INSIDE;
};

/**
 * 确定一个包围体是否与剔除体积相交。
 *
 * @param {object} boundingVolume 要测试与剔除体积相交的包围体。
 * @param {number} parentPlaneMask 来自包围体父对象对同一剔除体积检查的位掩码，如果 (planeMask & (1 << planeIndex) === 0)，
 *                                   对于 k < 31，则父体（因此这个体）完全在 plane[planeIndex] 内部，
 *                                   可以跳过该平面的检查。
 * @returns {number} 如上所述的平面掩码（可以应用于该包围体的子项）。
 *
 * @private
 */

CullingVolume.prototype.computeVisibilityWithPlaneMask = function (
  boundingVolume,
  parentPlaneMask,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingVolume)) {
    throw new DeveloperError("boundingVolume is required.");
  }
  if (!defined(parentPlaneMask)) {
    throw new DeveloperError("parentPlaneMask is required.");
  }
  //>>includeEnd('debug');

  if (
    parentPlaneMask === CullingVolume.MASK_OUTSIDE ||
    parentPlaneMask === CullingVolume.MASK_INSIDE
  ) {
    // parent is completely outside or completely inside, so this child is as well.
    return parentPlaneMask;
  }

  // Start with MASK_INSIDE (all zeros) so that after the loop, the return value can be compared with MASK_INSIDE.
  // (Because if there are fewer than 31 planes, the upper bits wont be changed.)
  let mask = CullingVolume.MASK_INSIDE;

  const planes = this.planes;
  for (let k = 0, len = planes.length; k < len; ++k) {
    // For k greater than 31 (since 31 is the maximum number of INSIDE/INTERSECTING bits we can store), skip the optimization.
    const flag = k < 31 ? 1 << k : 0;
    if (k < 31 && (parentPlaneMask & flag) === 0) {
      // boundingVolume is known to be INSIDE this plane.
      continue;
    }

    const result = boundingVolume.intersectPlane(
      Plane.fromCartesian4(planes[k], scratchPlane),
    );
    if (result === Intersect.OUTSIDE) {
      return CullingVolume.MASK_OUTSIDE;
    } else if (result === Intersect.INTERSECTING) {
      mask |= flag;
    }
  }

  return mask;
};

/**
 * 对于平面掩码（如在 {@link CullingVolume#computeVisibilityWithPlaneMask} 中使用），
 * 这个特殊值表示对象包围体完全在剔除体积外的情况。
 *
 * @type {number}
 * @private
 */

CullingVolume.MASK_OUTSIDE = 0xffffffff;

/**
 * 对于平面掩码（如在 {@link CullingVolume.prototype.computeVisibilityWithPlaneMask} 中使用），
 * 这个值表示对象包围体完全在剔除体积内的情况。
 *
 * @type {number}
 * @private
 */

CullingVolume.MASK_INSIDE = 0x00000000;

/**
 * 对于平面掩码（如在 {@link CullingVolume.prototype.computeVisibilityWithPlaneMask} 中使用），
 * 这个值表示对象包围体（可能）与剔除体积的所有平面相交的情况。
 *
 * @type {number}
 * @private
 */

CullingVolume.MASK_INDETERMINATE = 0x7fffffff;
export default CullingVolume;
