import BoundingSphere from "./BoundingSphere.js";
import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";
import Visibility from "./Visibility.js";

/**
 * 创建一个基于对象的位置、半径以及相机位置的遮挡器。
 * 遮挡器可用于确定其他对象是否可见或被
 * 遮挡器和相机位置定义的可见地平线遮挡。
 *
 * @alias Occluder
 *
 * @param {BoundingSphere} occluderBoundingSphere 包围遮挡器的包围球。
 * @param {Cartesian3} cameraPosition 观察者/相机的坐标。
 *
 * @constructor
 *
 * @example
 * // Construct an occluder one unit away from the origin with a radius of one.
 * const cameraPosition = Cesium.Cartesian3.ZERO;
 * const occluderBoundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -1), 1);
 * const occluder = new Cesium.Occluder(occluderBoundingSphere, cameraPosition);
 */
function Occluder(occluderBoundingSphere, cameraPosition) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(occluderBoundingSphere)) {
    throw new DeveloperError("occluderBoundingSphere is required.");
  }
  if (!defined(cameraPosition)) {
    throw new DeveloperError("camera position is required.");
  }
  //>>includeEnd('debug');

  this._occluderPosition = Cartesian3.clone(occluderBoundingSphere.center);
  this._occluderRadius = occluderBoundingSphere.radius;

  this._horizonDistance = 0.0;
  this._horizonPlaneNormal = undefined;
  this._horizonPlanePosition = undefined;
  this._cameraPosition = undefined;

  // cameraPosition fills in the above values
  this.cameraPosition = cameraPosition;
}

const scratchCartesian3 = new Cartesian3();

Object.defineProperties(Occluder.prototype, {
  /**
   * 遮挡器的位置。
   * @memberof Occluder.prototype
   * @type {Cartesian3}
   */
  position: {
    get: function () {
      return this._occluderPosition;
    },
  },

  /**
   * 遮挡器的半径。
   * @memberof Occluder.prototype
   * @type {number}
   */
  radius: {
    get: function () {
      return this._occluderRadius;
    },
  },

  /**
   * 相机的位置。
   * @memberof Occluder.prototype
   * @type {Cartesian3}
   */
  cameraPosition: {
    set: function (cameraPosition) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(cameraPosition)) {
        throw new DeveloperError("cameraPosition 是必需的。");
      }
      //>>includeEnd('debug');

      cameraPosition = Cartesian3.clone(cameraPosition, this._cameraPosition);

      const cameraToOccluderVec = Cartesian3.subtract(
        this._occluderPosition,
        cameraPosition,
        scratchCartesian3,
      );
      let invCameraToOccluderDistance =
        Cartesian3.magnitudeSquared(cameraToOccluderVec);
      const occluderRadiusSqrd = this._occluderRadius * this._occluderRadius;

      let horizonDistance;
      let horizonPlaneNormal;
      let horizonPlanePosition;
      if (invCameraToOccluderDistance > occluderRadiusSqrd) {
        horizonDistance = Math.sqrt(
          invCameraToOccluderDistance - occluderRadiusSqrd,
        );
        invCameraToOccluderDistance =
          1.0 / Math.sqrt(invCameraToOccluderDistance);
        horizonPlaneNormal = Cartesian3.multiplyByScalar(
          cameraToOccluderVec,
          invCameraToOccluderDistance,
          scratchCartesian3,
        );
        const nearPlaneDistance =
          horizonDistance * horizonDistance * invCameraToOccluderDistance;
        horizonPlanePosition = Cartesian3.add(
          cameraPosition,
          Cartesian3.multiplyByScalar(
            horizonPlaneNormal,
            nearPlaneDistance,
            scratchCartesian3,
          ),
          scratchCartesian3,
        );
      } else {
        horizonDistance = Number.MAX_VALUE;
      }

      this._horizonDistance = horizonDistance;
      this._horizonPlaneNormal = horizonPlaneNormal;
      this._horizonPlanePosition = horizonPlanePosition;
      this._cameraPosition = cameraPosition;
    },
  },
});


/**
 * 从包围球和相机位置创建一个遮挡器。
 *
 * @param {BoundingSphere} occluderBoundingSphere 包围遮挡器的包围球。
 * @param {Cartesian3} cameraPosition 观察者/相机的坐标。
 * @param {Occluder} [result] 存储结果的对象。
 * @returns {Occluder} 由对象的位置、半径以及相机位置衍生的遮挡器。
 */

Occluder.fromBoundingSphere = function (
  occluderBoundingSphere,
  cameraPosition,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(occluderBoundingSphere)) {
    throw new DeveloperError("occluderBoundingSphere is required.");
  }

  if (!defined(cameraPosition)) {
    throw new DeveloperError("camera position is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    return new Occluder(occluderBoundingSphere, cameraPosition);
  }

  Cartesian3.clone(occluderBoundingSphere.center, result._occluderPosition);
  result._occluderRadius = occluderBoundingSphere.radius;
  result.cameraPosition = cameraPosition;

  return result;
};

const tempVecScratch = new Cartesian3();
/**
 * 确定一个点（即 <code>occludee</code>）是否被遮挡器隐藏在视野之外。
 *
 * @param {Cartesian3} occludee 包围被遮挡对象的点。
 * @returns {boolean} 如果被遮挡对象可见，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 *
 * @example
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 0);
 * const littleSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -1), 0.25);
 * const occluder = new Cesium.Occluder(littleSphere, cameraPosition);
 * const point = new Cesium.Cartesian3(0, 0, -3);
 * occluder.isPointVisible(point); //returns true
 *
 * @see Occluder#computeVisibility
 */
Occluder.prototype.isPointVisible = function (occludee) {
  if (this._horizonDistance !== Number.MAX_VALUE) {
    let tempVec = Cartesian3.subtract(
      occludee,
      this._occluderPosition,
      tempVecScratch,
    );
    let temp = this._occluderRadius;
    temp = Cartesian3.magnitudeSquared(tempVec) - temp * temp;
    if (temp > 0.0) {
      temp = Math.sqrt(temp) + this._horizonDistance;
      tempVec = Cartesian3.subtract(occludee, this._cameraPosition, tempVec);
      return temp * temp > Cartesian3.magnitudeSquared(tempVec);
    }
  }
  return false;
};

const occludeePositionScratch = new Cartesian3();

/**
 * 确定一个球体（即 <code>occludee</code>）是否被遮挡器隐藏在视野之外。
 *
 * @param {BoundingSphere} occludee 包围被遮挡对象的包围球。
 * @returns {boolean} 如果被遮挡对象可见，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 *
 * @example
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 0);
 * const littleSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -1), 0.25);
 * const occluder = new Cesium.Occluder(littleSphere, cameraPosition);
 * const bigSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -3), 1);
 * occluder.isBoundingSphereVisible(bigSphere); //returns true
 *
 * @see Occluder#computeVisibility
 */
Occluder.prototype.isBoundingSphereVisible = function (occludee) {
  const occludeePosition = Cartesian3.clone(
    occludee.center,
    occludeePositionScratch,
  );
  const occludeeRadius = occludee.radius;

  if (this._horizonDistance !== Number.MAX_VALUE) {
    let tempVec = Cartesian3.subtract(
      occludeePosition,
      this._occluderPosition,
      tempVecScratch,
    );
    let temp = this._occluderRadius - occludeeRadius;
    temp = Cartesian3.magnitudeSquared(tempVec) - temp * temp;
    if (occludeeRadius < this._occluderRadius) {
      if (temp > 0.0) {
        temp = Math.sqrt(temp) + this._horizonDistance;
        tempVec = Cartesian3.subtract(
          occludeePosition,
          this._cameraPosition,
          tempVec,
        );
        return (
          temp * temp + occludeeRadius * occludeeRadius >
          Cartesian3.magnitudeSquared(tempVec)
        );
      }
      return false;
    }

    // Prevent against the case where the occludee radius is larger than the occluder's; since this is
    // an uncommon case, the following code should rarely execute.
    if (temp > 0.0) {
      tempVec = Cartesian3.subtract(
        occludeePosition,
        this._cameraPosition,
        tempVec,
      );
      const tempVecMagnitudeSquared = Cartesian3.magnitudeSquared(tempVec);
      const occluderRadiusSquared = this._occluderRadius * this._occluderRadius;
      const occludeeRadiusSquared = occludeeRadius * occludeeRadius;
      if (
        (this._horizonDistance * this._horizonDistance +
          occluderRadiusSquared) *
          occludeeRadiusSquared >
        tempVecMagnitudeSquared * occluderRadiusSquared
      ) {
        // The occludee is close enough that the occluder cannot possible occlude the occludee
        return true;
      }
      temp = Math.sqrt(temp) + this._horizonDistance;
      return temp * temp + occludeeRadiusSquared > tempVecMagnitudeSquared;
    }

    // The occludee completely encompasses the occluder
    return true;
  }

  return false;
};

const tempScratch = new Cartesian3();
/**
 * 确定被遮挡对象的可见程度（不可见、部分可见或完全可见）。
 *
 * @param {BoundingSphere} occludeeBS 被遮挡对象的包围球。
 * @returns {Visibility} 如果被遮挡对象不可见，则返回 Visibility.NONE，
 *                       如果被遮挡对象部分可见，则返回 Visibility.PARTIAL，
 *                       如果被遮挡对象完全可见，则返回 Visibility.FULL。
 *
 * @example
 * const sphere1 = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -1.5), 0.5);
 * const sphere2 = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -2.5), 0.5);
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 0);
 * const occluder = new Cesium.Occluder(sphere1, cameraPosition);
 * occluder.computeVisibility(sphere2); //returns Visibility.NONE
 */
Occluder.prototype.computeVisibility = function (occludeeBS) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(occludeeBS)) {
    throw new DeveloperError("occludeeBS is required.");
  }
  //>>includeEnd('debug');

  // If the occludee radius is larger than the occluders, this will return that
  // the entire ocludee is visible, even though that may not be the case, though this should
  // not occur too often.
  const occludeePosition = Cartesian3.clone(occludeeBS.center);
  const occludeeRadius = occludeeBS.radius;

  if (occludeeRadius > this._occluderRadius) {
    return Visibility.FULL;
  }

  if (this._horizonDistance !== Number.MAX_VALUE) {
    // The camera is outside the occluder
    let tempVec = Cartesian3.subtract(
      occludeePosition,
      this._occluderPosition,
      tempScratch,
    );
    let temp = this._occluderRadius - occludeeRadius;
    const occluderToOccludeeDistSqrd = Cartesian3.magnitudeSquared(tempVec);
    temp = occluderToOccludeeDistSqrd - temp * temp;
    if (temp > 0.0) {
      // The occludee is not completely inside the occluder
      // Check to see if the occluder completely hides the occludee
      temp = Math.sqrt(temp) + this._horizonDistance;
      tempVec = Cartesian3.subtract(
        occludeePosition,
        this._cameraPosition,
        tempVec,
      );
      const cameraToOccludeeDistSqrd = Cartesian3.magnitudeSquared(tempVec);
      if (
        temp * temp + occludeeRadius * occludeeRadius <
        cameraToOccludeeDistSqrd
      ) {
        return Visibility.NONE;
      }

      // Check to see whether the occluder is fully or partially visible
      // when the occludee does not intersect the occluder
      temp = this._occluderRadius + occludeeRadius;
      temp = occluderToOccludeeDistSqrd - temp * temp;
      if (temp > 0.0) {
        // The occludee does not intersect the occluder.
        temp = Math.sqrt(temp) + this._horizonDistance;
        return cameraToOccludeeDistSqrd <
          temp * temp + occludeeRadius * occludeeRadius
          ? Visibility.FULL
          : Visibility.PARTIAL;
      }

      //Check to see if the occluder is fully or partially visible when the occludee DOES
      //intersect the occluder
      tempVec = Cartesian3.subtract(
        occludeePosition,
        this._horizonPlanePosition,
        tempVec,
      );
      return Cartesian3.dot(tempVec, this._horizonPlaneNormal) > -occludeeRadius
        ? Visibility.PARTIAL
        : Visibility.FULL;
    }
  }
  return Visibility.NONE;
};

const occludeePointScratch = new Cartesian3();
/**
 * 计算可以作为可遮挡物位置的点，以用于可见性函数。使用零半径的可遮挡物半径。
 * 通常，用户会计算一个包围对象的包围球以用于可见性；
 * 然而，也可以计算一个点，如果该点是可见的/不可见的，也会指示对象是否可见/不可见。
 * 对于相对固定且较大的对象（例如一块地形块），调用此函数较为合适。
 * 对于如卫星或地面车辆等对象，最好使用对象的包围球而不是调用此函数。
 *
 * @param {BoundingSphere} occluderBoundingSphere 包围遮挡器的包围球。
 * @param {Cartesian3} occludeePosition 可遮挡物（半径为零的包围球）所在的点。
 * @param {Cartesian3[]} positions 近地平面的高程点列表。
 * @returns {object} 包含两个属性的对象：<code>occludeePoint</code> 和 <code>valid</code>，后者是一个布尔值。
 *
 * @exception {DeveloperError} <code>positions</code> 必须包含至少一个元素。
 * @exception {DeveloperError} <code>occludeePosition</code> 的值必须不同于 <code>occluderBoundingSphere.center</code>。
 *
 * @example
 * const cameraPosition = new Cesium.Cartesian3(0, 0, 0);
 * const occluderBoundingSphere = new Cesium.BoundingSphere(new Cesium.Cartesian3(0, 0, -8), 2);
 * const occluder = new Cesium.Occluder(occluderBoundingSphere, cameraPosition);
 * const positions = [new Cesium.Cartesian3(-0.25, 0, -5.3), new Cesium.Cartesian3(0.25, 0, -5.3)];
 * const tileOccluderSphere = Cesium.BoundingSphere.fromPoints(positions);
 * const occludeePosition = tileOccluderSphere.center;
 * const occludeePt = Cesium.Occluder.computeOccludeePoint(occluderBoundingSphere, occludeePosition, positions);
 */
Occluder.computeOccludeePoint = function (
  occluderBoundingSphere,
  occludeePosition,
  positions,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(occluderBoundingSphere)) {
    throw new DeveloperError("occluderBoundingSphere is required.");
  }
  if (!defined(positions)) {
    throw new DeveloperError("positions is required.");
  }
  if (positions.length === 0) {
    throw new DeveloperError("positions must contain at least one element");
  }
  //>>includeEnd('debug');

  const occludeePos = Cartesian3.clone(occludeePosition);
  const occluderPosition = Cartesian3.clone(occluderBoundingSphere.center);
  const occluderRadius = occluderBoundingSphere.radius;
  const numPositions = positions.length;

  //>>includeStart('debug', pragmas.debug);
  if (Cartesian3.equals(occluderPosition, occludeePosition)) {
    throw new DeveloperError(
      "occludeePosition must be different than occluderBoundingSphere.center",
    );
  }
  //>>includeEnd('debug');

  // Compute a plane with a normal from the occluder to the occludee position.
  const occluderPlaneNormal = Cartesian3.normalize(
    Cartesian3.subtract(occludeePos, occluderPosition, occludeePointScratch),
    occludeePointScratch,
  );
  const occluderPlaneD = -Cartesian3.dot(occluderPlaneNormal, occluderPosition);

  //For each position, determine the horizon intersection. Choose the position and intersection
  //that results in the greatest angle with the occcluder plane.
  const aRotationVector = Occluder._anyRotationVector(
    occluderPosition,
    occluderPlaneNormal,
    occluderPlaneD,
  );
  let dot = Occluder._horizonToPlaneNormalDotProduct(
    occluderBoundingSphere,
    occluderPlaneNormal,
    occluderPlaneD,
    aRotationVector,
    positions[0],
  );
  if (!dot) {
    //The position is inside the mimimum radius, which is invalid
    return undefined;
  }
  let tempDot;
  for (let i = 1; i < numPositions; ++i) {
    tempDot = Occluder._horizonToPlaneNormalDotProduct(
      occluderBoundingSphere,
      occluderPlaneNormal,
      occluderPlaneD,
      aRotationVector,
      positions[i],
    );
    if (!tempDot) {
      //The position is inside the minimum radius, which is invalid
      return undefined;
    }
    if (tempDot < dot) {
      dot = tempDot;
    }
  }
  //Verify that the dot is not near 90 degress
  // eslint-disable-next-line no-loss-of-precision
  if (dot < 0.00174532836589830883577820272085) {
    return undefined;
  }

  const distance = occluderRadius / dot;
  return Cartesian3.add(
    occluderPosition,
    Cartesian3.multiplyByScalar(
      occluderPlaneNormal,
      distance,
      occludeePointScratch,
    ),
    occludeePointScratch,
  );
};

const computeOccludeePointFromRectangleScratch = [];
/**
 * 计算可以作为可遮挡物位置的点，以用于从矩形获得的可见性函数。
 *
 * @param {Rectangle} rectangle 用于创建包围球的矩形。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于确定矩形位置的椭球体。
 * @returns {object} 包含两个属性的对象：<code>occludeePoint</code> 和 <code>valid</code>，后者是一个布尔值。
 */

Occluder.computeOccludeePointFromRectangle = function (rectangle, ellipsoid) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(rectangle)) {
    throw new DeveloperError("rectangle is required.");
  }
  //>>includeEnd('debug');

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  const positions = Rectangle.subsample(
    rectangle,
    ellipsoid,
    0.0,
    computeOccludeePointFromRectangleScratch,
  );
  const bs = BoundingSphere.fromPoints(positions);

  // Assumes the ellipsoid is centered at the origin
  const ellipsoidCenter = Cartesian3.ZERO;
  if (!Cartesian3.equals(ellipsoidCenter, bs.center)) {
    return Occluder.computeOccludeePoint(
      new BoundingSphere(ellipsoidCenter, ellipsoid.minimumRadius),
      bs.center,
      positions,
    );
  }

  return undefined;
};

const tempVec0Scratch = new Cartesian3();
Occluder._anyRotationVector = function (
  occluderPosition,
  occluderPlaneNormal,
  occluderPlaneD,
) {
  const tempVec0 = Cartesian3.abs(occluderPlaneNormal, tempVec0Scratch);
  let majorAxis = tempVec0.x > tempVec0.y ? 0 : 1;
  if (
    (majorAxis === 0 && tempVec0.z > tempVec0.x) ||
    (majorAxis === 1 && tempVec0.z > tempVec0.y)
  ) {
    majorAxis = 2;
  }
  const tempVec = new Cartesian3();
  let tempVec1;
  if (majorAxis === 0) {
    tempVec0.x = occluderPosition.x;
    tempVec0.y = occluderPosition.y + 1.0;
    tempVec0.z = occluderPosition.z + 1.0;
    tempVec1 = Cartesian3.UNIT_X;
  } else if (majorAxis === 1) {
    tempVec0.x = occluderPosition.x + 1.0;
    tempVec0.y = occluderPosition.y;
    tempVec0.z = occluderPosition.z + 1.0;
    tempVec1 = Cartesian3.UNIT_Y;
  } else {
    tempVec0.x = occluderPosition.x + 1.0;
    tempVec0.y = occluderPosition.y + 1.0;
    tempVec0.z = occluderPosition.z;
    tempVec1 = Cartesian3.UNIT_Z;
  }
  const u =
    (Cartesian3.dot(occluderPlaneNormal, tempVec0) + occluderPlaneD) /
    -Cartesian3.dot(occluderPlaneNormal, tempVec1);
  return Cartesian3.normalize(
    Cartesian3.subtract(
      Cartesian3.add(
        tempVec0,
        Cartesian3.multiplyByScalar(tempVec1, u, tempVec),
        tempVec0,
      ),
      occluderPosition,
      tempVec0,
    ),
    tempVec0,
  );
};

const posDirectionScratch = new Cartesian3();
Occluder._rotationVector = function (
  occluderPosition,
  occluderPlaneNormal,
  occluderPlaneD,
  position,
  anyRotationVector,
) {
  //Determine the angle between the occluder plane normal and the position direction
  let positionDirection = Cartesian3.subtract(
    position,
    occluderPosition,
    posDirectionScratch,
  );
  positionDirection = Cartesian3.normalize(
    positionDirection,
    positionDirection,
  );
  if (
    Cartesian3.dot(occluderPlaneNormal, positionDirection) <
    // eslint-disable-next-line no-loss-of-precision
    0.99999998476912904932780850903444
  ) {
    const crossProduct = Cartesian3.cross(
      occluderPlaneNormal,
      positionDirection,
      positionDirection,
    );
    const length = Cartesian3.magnitude(crossProduct);
    if (length > CesiumMath.EPSILON13) {
      return Cartesian3.normalize(crossProduct, new Cartesian3());
    }
  }
  //The occluder plane normal and the position direction are colinear. Use any
  //vector in the occluder plane as the rotation vector
  return anyRotationVector;
};

const posScratch1 = new Cartesian3();
const occluerPosScratch = new Cartesian3();
const posScratch2 = new Cartesian3();
const horizonPlanePosScratch = new Cartesian3();
Occluder._horizonToPlaneNormalDotProduct = function (
  occluderBS,
  occluderPlaneNormal,
  occluderPlaneD,
  anyRotationVector,
  position,
) {
  const pos = Cartesian3.clone(position, posScratch1);
  const occluderPosition = Cartesian3.clone(
    occluderBS.center,
    occluerPosScratch,
  );
  const occluderRadius = occluderBS.radius;

  //Verify that the position is outside the occluder
  let positionToOccluder = Cartesian3.subtract(
    occluderPosition,
    pos,
    posScratch2,
  );
  const occluderToPositionDistanceSquared =
    Cartesian3.magnitudeSquared(positionToOccluder);
  const occluderRadiusSquared = occluderRadius * occluderRadius;
  if (occluderToPositionDistanceSquared < occluderRadiusSquared) {
    return false;
  }

  //Horizon parameters
  const horizonDistanceSquared =
    occluderToPositionDistanceSquared - occluderRadiusSquared;
  const horizonDistance = Math.sqrt(horizonDistanceSquared);
  const occluderToPositionDistance = Math.sqrt(
    occluderToPositionDistanceSquared,
  );
  const invOccluderToPositionDistance = 1.0 / occluderToPositionDistance;
  const cosTheta = horizonDistance * invOccluderToPositionDistance;
  const horizonPlaneDistance = cosTheta * horizonDistance;
  positionToOccluder = Cartesian3.normalize(
    positionToOccluder,
    positionToOccluder,
  );
  const horizonPlanePosition = Cartesian3.add(
    pos,
    Cartesian3.multiplyByScalar(
      positionToOccluder,
      horizonPlaneDistance,
      horizonPlanePosScratch,
    ),
    horizonPlanePosScratch,
  );
  const horizonCrossDistance = Math.sqrt(
    horizonDistanceSquared - horizonPlaneDistance * horizonPlaneDistance,
  );

  //Rotate the position to occluder vector 90 degrees
  let tempVec = this._rotationVector(
    occluderPosition,
    occluderPlaneNormal,
    occluderPlaneD,
    pos,
    anyRotationVector,
  );
  let horizonCrossDirection = Cartesian3.fromElements(
    tempVec.x * tempVec.x * positionToOccluder.x +
      (tempVec.x * tempVec.y - tempVec.z) * positionToOccluder.y +
      (tempVec.x * tempVec.z + tempVec.y) * positionToOccluder.z,
    (tempVec.x * tempVec.y + tempVec.z) * positionToOccluder.x +
      tempVec.y * tempVec.y * positionToOccluder.y +
      (tempVec.y * tempVec.z - tempVec.x) * positionToOccluder.z,
    (tempVec.x * tempVec.z - tempVec.y) * positionToOccluder.x +
      (tempVec.y * tempVec.z + tempVec.x) * positionToOccluder.y +
      tempVec.z * tempVec.z * positionToOccluder.z,
    posScratch1,
  );
  horizonCrossDirection = Cartesian3.normalize(
    horizonCrossDirection,
    horizonCrossDirection,
  );

  //Horizon positions
  const offset = Cartesian3.multiplyByScalar(
    horizonCrossDirection,
    horizonCrossDistance,
    posScratch1,
  );
  tempVec = Cartesian3.normalize(
    Cartesian3.subtract(
      Cartesian3.add(horizonPlanePosition, offset, posScratch2),
      occluderPosition,
      posScratch2,
    ),
    posScratch2,
  );
  const dot0 = Cartesian3.dot(occluderPlaneNormal, tempVec);
  tempVec = Cartesian3.normalize(
    Cartesian3.subtract(
      Cartesian3.subtract(horizonPlanePosition, offset, tempVec),
      occluderPosition,
      tempVec,
    ),
    tempVec,
  );
  const dot1 = Cartesian3.dot(occluderPlaneNormal, tempVec);
  return dot0 < dot1 ? dot0 : dot1;
};
export default Occluder;
