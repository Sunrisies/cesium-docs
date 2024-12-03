import Cartesian2 from "./Cartesian2.js";
import Cartesian3 from "./Cartesian3.js";
import Cartesian4 from "./Cartesian4.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import EarthOrientationParameters from "./EarthOrientationParameters.js";
import EarthOrientationParametersSample from "./EarthOrientationParametersSample.js";
import Ellipsoid from "./Ellipsoid.js";
import HeadingPitchRoll from "./HeadingPitchRoll.js";
import Iau2006XysData from "./Iau2006XysData.js";
import Iau2006XysSample from "./Iau2006XysSample.js";
import JulianDate from "./JulianDate.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import Matrix4 from "./Matrix4.js";
import Quaternion from "./Quaternion.js";
import TimeConstants from "./TimeConstants.js";

/**
 * 包含将位置转换到各种参考框架的函数。
 *
 * @namespace Transforms
 */

const Transforms = {};

const vectorProductLocalFrame = {
  up: {
    south: "east",
    north: "west",
    west: "south",
    east: "north",
  },
  down: {
    south: "west",
    north: "east",
    west: "north",
    east: "south",
  },
  south: {
    up: "west",
    down: "east",
    west: "down",
    east: "up",
  },
  north: {
    up: "east",
    down: "west",
    west: "up",
    east: "down",
  },
  west: {
    up: "north",
    down: "south",
    north: "down",
    south: "up",
  },
  east: {
    up: "south",
    down: "north",
    north: "up",
    south: "down",
  },
};

const degeneratePositionLocalFrame = {
  north: [-1, 0, 0],
  east: [0, 1, 0],
  up: [0, 0, 1],
  south: [1, 0, 0],
  west: [0, -1, 0],
  down: [0, 0, -1],
};

const localFrameToFixedFrameCache = {};

const scratchCalculateCartesian = {
  east: new Cartesian3(),
  north: new Cartesian3(),
  up: new Cartesian3(),
  west: new Cartesian3(),
  south: new Cartesian3(),
  down: new Cartesian3(),
};
let scratchFirstCartesian = new Cartesian3();
let scratchSecondCartesian = new Cartesian3();
let scratchThirdCartesian = new Cartesian3();
/**
 * 生成一个函数，该函数计算一个4x4变换矩阵，从以提供的原点为中心的参考框架
 * 到提供的椭球体固定参考框架。
 * @param  {string} firstAxis  本地参考框架的第一个轴的名称。必须为
 *  'east'、'north'、'up'、'west'、'south' 或 'down'。
 * @param  {string} secondAxis  本地参考框架的第二个轴的名称。必须为
 *  'east'、'north'、'up'、'west'、'south' 或 'down'。
 * @return {Transforms.LocalFrameToFixedFrame} 计算参考框架的函数，
 * 其第一个轴和第二个轴符合参数要求的4x4变换矩阵。
 */

Transforms.localFrameToFixedFrameGenerator = function (firstAxis, secondAxis) {
  if (
    !vectorProductLocalFrame.hasOwnProperty(firstAxis) ||
    !vectorProductLocalFrame[firstAxis].hasOwnProperty(secondAxis)
  ) {
    throw new DeveloperError(
      "firstAxis and secondAxis must be east, north, up, west, south or down.",
    );
  }
  const thirdAxis = vectorProductLocalFrame[firstAxis][secondAxis];

  /**
   * 计算从以提供的原点为中心的参考框架到提供的椭球体的固定参考框架的4x4变换矩阵。
   * @callback Transforms.LocalFrameToFixedFrame
   * @param {Cartesian3} origin 本地参考框架的中心点。
   * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
   * @param {Matrix4} [result] 存储结果的对象。
   * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
   */

  let resultat;
  const hashAxis = firstAxis + secondAxis;
  if (defined(localFrameToFixedFrameCache[hashAxis])) {
    resultat = localFrameToFixedFrameCache[hashAxis];
  } else {
    resultat = function (origin, ellipsoid, result) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(origin)) {
        throw new DeveloperError("origin is required.");
      }
      if (isNaN(origin.x) || isNaN(origin.y) || isNaN(origin.z)) {
        throw new DeveloperError("origin has a NaN component");
      }
      //>>includeEnd('debug');
      if (!defined(result)) {
        result = new Matrix4();
      }
      if (
        Cartesian3.equalsEpsilon(origin, Cartesian3.ZERO, CesiumMath.EPSILON14)
      ) {
        // If x, y, and z are zero, use the degenerate local frame, which is a special case
        Cartesian3.unpack(
          degeneratePositionLocalFrame[firstAxis],
          0,
          scratchFirstCartesian,
        );
        Cartesian3.unpack(
          degeneratePositionLocalFrame[secondAxis],
          0,
          scratchSecondCartesian,
        );
        Cartesian3.unpack(
          degeneratePositionLocalFrame[thirdAxis],
          0,
          scratchThirdCartesian,
        );
      } else if (
        CesiumMath.equalsEpsilon(origin.x, 0.0, CesiumMath.EPSILON14) &&
        CesiumMath.equalsEpsilon(origin.y, 0.0, CesiumMath.EPSILON14)
      ) {
        // If x and y are zero, assume origin is at a pole, which is a special case.
        const sign = CesiumMath.sign(origin.z);

        Cartesian3.unpack(
          degeneratePositionLocalFrame[firstAxis],
          0,
          scratchFirstCartesian,
        );
        if (firstAxis !== "east" && firstAxis !== "west") {
          Cartesian3.multiplyByScalar(
            scratchFirstCartesian,
            sign,
            scratchFirstCartesian,
          );
        }

        Cartesian3.unpack(
          degeneratePositionLocalFrame[secondAxis],
          0,
          scratchSecondCartesian,
        );
        if (secondAxis !== "east" && secondAxis !== "west") {
          Cartesian3.multiplyByScalar(
            scratchSecondCartesian,
            sign,
            scratchSecondCartesian,
          );
        }

        Cartesian3.unpack(
          degeneratePositionLocalFrame[thirdAxis],
          0,
          scratchThirdCartesian,
        );
        if (thirdAxis !== "east" && thirdAxis !== "west") {
          Cartesian3.multiplyByScalar(
            scratchThirdCartesian,
            sign,
            scratchThirdCartesian,
          );
        }
      } else {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
        ellipsoid.geodeticSurfaceNormal(origin, scratchCalculateCartesian.up);

        const up = scratchCalculateCartesian.up;
        const east = scratchCalculateCartesian.east;
        east.x = -origin.y;
        east.y = origin.x;
        east.z = 0.0;
        Cartesian3.normalize(east, scratchCalculateCartesian.east);
        Cartesian3.cross(up, east, scratchCalculateCartesian.north);

        Cartesian3.multiplyByScalar(
          scratchCalculateCartesian.up,
          -1,
          scratchCalculateCartesian.down,
        );
        Cartesian3.multiplyByScalar(
          scratchCalculateCartesian.east,
          -1,
          scratchCalculateCartesian.west,
        );
        Cartesian3.multiplyByScalar(
          scratchCalculateCartesian.north,
          -1,
          scratchCalculateCartesian.south,
        );

        scratchFirstCartesian = scratchCalculateCartesian[firstAxis];
        scratchSecondCartesian = scratchCalculateCartesian[secondAxis];
        scratchThirdCartesian = scratchCalculateCartesian[thirdAxis];
      }
      result[0] = scratchFirstCartesian.x;
      result[1] = scratchFirstCartesian.y;
      result[2] = scratchFirstCartesian.z;
      result[3] = 0.0;
      result[4] = scratchSecondCartesian.x;
      result[5] = scratchSecondCartesian.y;
      result[6] = scratchSecondCartesian.z;
      result[7] = 0.0;
      result[8] = scratchThirdCartesian.x;
      result[9] = scratchThirdCartesian.y;
      result[10] = scratchThirdCartesian.z;
      result[11] = 0.0;
      result[12] = origin.x;
      result[13] = origin.y;
      result[14] = origin.z;
      result[15] = 1.0;
      return result;
    };
    localFrameToFixedFrameCache[hashAxis] = resultat;
  }
  return resultat;
};

/**
 * 计算从以提供的原点为中心的参考框架（使用东-北-上轴）到提供的椭球体固定参考框架的4x4变换矩阵。
 * 本地轴定义如下：
 * <ul>
 * <li><code>x</code> 轴指向本地东方向。</li>
 * <li><code>y</code> 轴指向本地北方向。</li>
 * <li><code>z</code> 轴指向通过该位置的椭球体表面法线的方向。</li>
 * </ul>
 *
 * @function
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Matrix4} [result] 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
 *
 * @example
 * // Get the transform from local east-north-up at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
 */
Transforms.eastNorthUpToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "east",
  "north",
);

/**
 * 计算从以提供的原点为中心的参考框架（使用北-东-下轴）到提供的椭球体固定参考框架的4x4变换矩阵。
 * 本地轴定义如下：
 * <ul>
 * <li><code>x</code> 轴指向本地北方向。</li>
 * <li><code>y</code> 轴指向本地东方向。</li>
 * <li><code>z</code> 轴指向通过该位置的椭球体表面法线的反方向。</li>
 * </ul>
 *
 * @function
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Matrix4} [result] 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
 *
 * @example
 * // Get the transform from local north-east-down at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const transform = Cesium.Transforms.northEastDownToFixedFrame(center);
 */
Transforms.northEastDownToFixedFrame =
  Transforms.localFrameToFixedFrameGenerator("north", "east");

/**
 * 计算从以提供的原点为中心的参考框架（使用北-上-东轴）到提供的椭球体固定参考框架的4x4变换矩阵。
 * 本地轴定义如下：
 * <ul>
 * <li><code>x</code> 轴指向本地北方向。</li>
 * <li><code>y</code> 轴指向通过该位置的椭球体表面法线的方向。</li>
 * <li><code>z</code> 轴指向本地东方向。</li>
 * </ul>
 *
 * @function
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Matrix4} [result] 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
 *
 * @example
 * // Get the transform from local north-up-east at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const transform = Cesium.Transforms.northUpEastToFixedFrame(center);
 */
Transforms.northUpEastToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "north",
  "up",
);

/**
 * 计算从以提供的原点为中心的参考框架（使用北-西-上轴）到提供的椭球体固定参考框架的4x4变换矩阵。
 * 本地轴定义如下：
 * <ul>
 * <li><code>x</code> 轴指向本地北方向。</li>
 * <li><code>y</code> 轴指向本地西方向。</li>
 * <li><code>z</code> 轴指向通过该位置的椭球体表面法线的方向。</li>
 * </ul>
 *
 * @function
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Matrix4} [result] 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
 *
 * @example
 * // Get the transform from local north-West-Up at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const transform = Cesium.Transforms.northWestUpToFixedFrame(center);
 */
Transforms.northWestUpToFixedFrame = Transforms.localFrameToFixedFrameGenerator(
  "north",
  "west",
);

const scratchHPRQuaternion = new Quaternion();
const scratchScale = new Cartesian3(1.0, 1.0, 1.0);
const scratchHPRMatrix4 = new Matrix4();

/**
 * 计算从以提供的原点为中心的参考框架（使用从航向-俯仰-横滚角计算的轴）到提供的椭球体固定参考框架的4x4变换矩阵。
 * 航向是从本地东向的旋转，其中正角度向东增加。俯仰是从本地东-北平面的旋转。正的俯仰角度
 * 位于平面上方。负的俯仰角度位于平面下方。横滚是绕本地东轴应用的第一个旋转。
 *
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {HeadingPitchRoll} headingPitchRoll 航向、俯仰和横滚。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Transforms.LocalFrameToFixedFrame} [fixedFrameTransform=Transforms.eastNorthUpToFixedFrame] 从参考框架到提供的椭球体固定参考框架的4x4变换矩阵。
 * @param {Matrix4} [result] 存储结果的对象。
 * @returns {Matrix4} 修改后的结果参数，如果未提供则返回一个新的Matrix4实例。
 *
 * @example
 * // Get the transform from local heading-pitch-roll at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const heading = -Cesium.Math.PI_OVER_TWO;
 * const pitch = Cesium.Math.PI_OVER_FOUR;
 * const roll = 0.0;
 * const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
 * const transform = Cesium.Transforms.headingPitchRollToFixedFrame(center, hpr);
 */
Transforms.headingPitchRollToFixedFrame = function (
  origin,
  headingPitchRoll,
  ellipsoid,
  fixedFrameTransform,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("HeadingPitchRoll", headingPitchRoll);
  //>>includeEnd('debug');

  fixedFrameTransform = defaultValue(
    fixedFrameTransform,
    Transforms.eastNorthUpToFixedFrame,
  );
  const hprQuaternion = Quaternion.fromHeadingPitchRoll(
    headingPitchRoll,
    scratchHPRQuaternion,
  );
  const hprMatrix = Matrix4.fromTranslationQuaternionRotationScale(
    Cartesian3.ZERO,
    hprQuaternion,
    scratchScale,
    scratchHPRMatrix4,
  );
  result = fixedFrameTransform(origin, ellipsoid, result);
  return Matrix4.multiply(result, hprMatrix, result);
};

const scratchENUMatrix4 = new Matrix4();
const scratchHPRMatrix3 = new Matrix3();

/**
 * 从以提供的原点为中心的参考框架（使用从航向-俯仰-横滚角计算的轴）计算一个四元数。
 * 航向是从本地东向的旋转，其中正角度向东增加。俯仰是从本地东-北平面的旋转。正的俯仰角度
 * 位于平面上方。负的俯仰角度位于平面下方。横滚是绕本地东轴应用的第一个旋转。
 *
 * @param {Cartesian3} origin 本地参考框架的中心点。
 * @param {HeadingPitchRoll} headingPitchRoll 航向、俯仰和横滚。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Transforms.LocalFrameToFixedFrame} [fixedFrameTransform=Transforms.eastNorthUpToFixedFrame] 从参考框架到提供的椭球体固定参考框架的4x4变换矩阵。
 * @param {Quaternion} [result] 存储结果的对象。
 * @returns {Quaternion} 修改后的结果参数，如果未提供则返回一个新的Quaternion实例。
 *
 * @example
 * // Get the quaternion from local heading-pitch-roll at cartographic (0.0, 0.0) to Earth's fixed frame.
 * const center = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const heading = -Cesium.Math.PI_OVER_TWO;
 * const pitch = Cesium.Math.PI_OVER_FOUR;
 * const roll = 0.0;
 * const hpr = new HeadingPitchRoll(heading, pitch, roll);
 * const quaternion = Cesium.Transforms.headingPitchRollQuaternion(center, hpr);
 */
Transforms.headingPitchRollQuaternion = function (
  origin,
  headingPitchRoll,
  ellipsoid,
  fixedFrameTransform,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("HeadingPitchRoll", headingPitchRoll);
  //>>includeEnd('debug');

  const transform = Transforms.headingPitchRollToFixedFrame(
    origin,
    headingPitchRoll,
    ellipsoid,
    fixedFrameTransform,
    scratchENUMatrix4,
  );
  const rotation = Matrix4.getMatrix3(transform, scratchHPRMatrix3);
  return Quaternion.fromRotationMatrix(rotation, result);
};

const noScale = new Cartesian3(1.0, 1.0, 1.0);
const hprCenterScratch = new Cartesian3();
const ffScratch = new Matrix4();
const hprTransformScratch = new Matrix4();
const hprRotationScratch = new Matrix3();
const hprQuaternionScratch = new Quaternion();
/**
 * 从特定参考框架中的变换计算航向-俯仰-横滚角度。航向是从本地东向的旋转，
 * 其中正角度向东增加。俯仰是从本地东-北平面的旋转。正的俯仰角度
 * 位于平面上方。负的俯仰角度位于平面下方。横滚是绕本地东轴应用的第一个旋转。
 *
 * @param {Matrix4} transform 变换矩阵。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Transforms.LocalFrameToFixedFrame} [fixedFrameTransform=Transforms.eastNorthUpToFixedFrame] 从参考框架到提供的椭球体固定参考框架的4x4变换矩阵。
 * @param {HeadingPitchRoll} [result] 存储结果的对象。
 * @returns {HeadingPitchRoll} 修改后的结果参数，如果未提供则返回一个新的HeadingPitchRoll实例。
 */

Transforms.fixedFrameToHeadingPitchRoll = function (
  transform,
  ellipsoid,
  fixedFrameTransform,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("transform", transform);
  //>>includeEnd('debug');

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  fixedFrameTransform = defaultValue(
    fixedFrameTransform,
    Transforms.eastNorthUpToFixedFrame,
  );
  if (!defined(result)) {
    result = new HeadingPitchRoll();
  }

  const center = Matrix4.getTranslation(transform, hprCenterScratch);
  if (Cartesian3.equals(center, Cartesian3.ZERO)) {
    result.heading = 0;
    result.pitch = 0;
    result.roll = 0;
    return result;
  }
  let toFixedFrame = Matrix4.inverseTransformation(
    fixedFrameTransform(center, ellipsoid, ffScratch),
    ffScratch,
  );
  let transformCopy = Matrix4.setScale(transform, noScale, hprTransformScratch);
  transformCopy = Matrix4.setTranslation(
    transformCopy,
    Cartesian3.ZERO,
    transformCopy,
  );

  toFixedFrame = Matrix4.multiply(toFixedFrame, transformCopy, toFixedFrame);
  let quaternionRotation = Quaternion.fromRotationMatrix(
    Matrix4.getMatrix3(toFixedFrame, hprRotationScratch),
    hprQuaternionScratch,
  );
  quaternionRotation = Quaternion.normalize(
    quaternionRotation,
    quaternionRotation,
  );

  return HeadingPitchRoll.fromQuaternion(quaternionRotation, result);
};

const gmstConstant0 = 6 * 3600 + 41 * 60 + 50.54841;
const gmstConstant1 = 8640184.812866;
const gmstConstant2 = 0.093104;
const gmstConstant3 = -6.2e-6;
const rateCoef = 1.1772758384668e-19;
const wgs84WRPrecessing = 7.2921158553e-5;
const twoPiOverSecondsInDay = CesiumMath.TWO_PI / 86400.0;
let dateInUtc = new JulianDate();

/**
 * 默认函数，用于计算一个旋转矩阵，以将点或向量从国际天文学参考框架
 * （GCRF/ICRF）惯性框架轴转换到中央天体（通常是地球）固定框架轴在给定
 * 时间的变换，通常用于照明和从惯性参考框架的变换。如果进行变换所需的数据尚未加载，
 * 此函数可能返回undefined。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。如果未指定此参数，则创建并返回一个新实例。
 * @returns {Matrix3|undefined} 旋转矩阵，如果进行变换所需的数据尚未加载，则返回 undefined。
 *
 * @example
 * // Set the default ICRF to fixed transformation to that of the Moon.
 * Cesium.Transforms.computeIcrfToCentralBodyFixedMatrix = Cesium.Transforms.computeIcrfToMoonFixedMatrix;
 *
 * @see Transforms.computeIcrfToFixedMatrix
 * @see Transforms.computeTemeToPseudoFixedMatrix
 * @see Transforms.computeIcrfToMoonFixedMatrix
 */
Transforms.computeIcrfToCentralBodyFixedMatrix = function (date, result) {
  let transformMatrix = Transforms.computeIcrfToFixedMatrix(date, result);
  if (!defined(transformMatrix)) {
    transformMatrix = Transforms.computeTemeToPseudoFixedMatrix(date, result);
  }

  return transformMatrix;
};

/**
 * 计算一个旋转矩阵，将点或向量从真赤道平均春分点（TEME）轴转换为
 * 在给定时间的伪固定轴。该方法将UT1时间标准视为与UTC相等。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数，如果未提供则返回一个新的Matrix3实例。
 *
 * @example
 * //Set the view to the inertial frame.
 * scene.postUpdate.addEventListener(function(scene, time) {
 *    const now = Cesium.JulianDate.now();
 *    const offset = Cesium.Matrix4.multiplyByPoint(camera.transform, camera.position, new Cesium.Cartesian3());
 *    const transform = Cesium.Matrix4.fromRotationTranslation(Cesium.Transforms.computeTemeToPseudoFixedMatrix(now));
 *    const inverseTransform = Cesium.Matrix4.inverseTransformation(transform, new Cesium.Matrix4());
 *    Cesium.Matrix4.multiplyByPoint(inverseTransform, offset, offset);
 *    camera.lookAtTransform(transform, offset);
 * });
 */
Transforms.computeTemeToPseudoFixedMatrix = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required.");
  }
  //>>includeEnd('debug');

  // GMST is actually computed using UT1.  We're using UTC as an approximation of UT1.
  // We do not want to use the function like convertTaiToUtc in JulianDate because
  // we explicitly do not want to fail when inside the leap second.

  dateInUtc = JulianDate.addSeconds(
    date,
    -JulianDate.computeTaiMinusUtc(date),
    dateInUtc,
  );
  const utcDayNumber = dateInUtc.dayNumber;
  const utcSecondsIntoDay = dateInUtc.secondsOfDay;

  let t;
  const diffDays = utcDayNumber - 2451545;
  if (utcSecondsIntoDay >= 43200.0) {
    t = (diffDays + 0.5) / TimeConstants.DAYS_PER_JULIAN_CENTURY;
  } else {
    t = (diffDays - 0.5) / TimeConstants.DAYS_PER_JULIAN_CENTURY;
  }

  const gmst0 =
    gmstConstant0 +
    t * (gmstConstant1 + t * (gmstConstant2 + t * gmstConstant3));
  const angle = (gmst0 * twoPiOverSecondsInDay) % CesiumMath.TWO_PI;
  const ratio = wgs84WRPrecessing + rateCoef * (utcDayNumber - 2451545.5);
  const secondsSinceMidnight =
    (utcSecondsIntoDay + TimeConstants.SECONDS_PER_DAY * 0.5) %
    TimeConstants.SECONDS_PER_DAY;
  const gha = angle + ratio * secondsSinceMidnight;
  const cosGha = Math.cos(gha);
  const sinGha = Math.sin(gha);

  if (!defined(result)) {
    return new Matrix3(
      cosGha,
      sinGha,
      0.0,
      -sinGha,
      cosGha,
      0.0,
      0.0,
      0.0,
      1.0,
    );
  }
  result[0] = cosGha;
  result[1] = -sinGha;
  result[2] = 0.0;
  result[3] = sinGha;
  result[4] = cosGha;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = 1.0;
  return result;
};

/**
 * IAU 2006 XYS 数据的来源，用于计算固定轴和ICRF轴之间的变换。
 * @type {Iau2006XysData}
 *
 * @see Transforms.computeIcrfToFixedMatrix
 * @see Transforms.computeFixedToIcrfMatrix
 *
 * @private
 */
Transforms.iau2006XysData = new Iau2006XysData();

/**
 * 地球定位参数（EOP）数据的来源，用于计算固定轴和ICRF轴之间的变换。
 * 默认情况下，所有EOP值都使用零值，从而产生一个合理但不完全准确的ICRF轴表示。
 * @type {EarthOrientationParameters}
 *
 * @see Transforms.computeIcrfToFixedMatrix
 * @see Transforms.computeFixedToIcrfMatrix
 *
 * @private
 */

Transforms.earthOrientationParameters = EarthOrientationParameters.NONE;

const ttMinusTai = 32.184;
const j2000ttDays = 2451545.0;

/**
 * 预加载在给定区间内，ICRF轴和固定轴之间的转换所需的数据，无论哪个方向。
 * 此函数返回一个承诺，当其解决时，表示预加载已完成。
 *
 * @param {TimeInterval} timeInterval 要预加载的区间。
 * @returns {Promise<void>} 一个承诺，当其解决时，表示预加载已完成，
 *          且在区间内，固定轴与ICRF轴之间的转换评估将不再返回undefined。
 *
 *
 * @example
 * const interval = new Cesium.TimeInterval(...);
 * await Cesium.Transforms.preloadIcrfFixed(interval));
 * // the data is now loaded
 *
 * @see Transforms.computeIcrfToFixedMatrix
 * @see Transforms.computeFixedToIcrfMatrix
 */
Transforms.preloadIcrfFixed = function (timeInterval) {
  const startDayTT = timeInterval.start.dayNumber;
  const startSecondTT = timeInterval.start.secondsOfDay + ttMinusTai;
  const stopDayTT = timeInterval.stop.dayNumber;
  const stopSecondTT = timeInterval.stop.secondsOfDay + ttMinusTai;

  return Transforms.iau2006XysData.preload(
    startDayTT,
    startSecondTT,
    stopDayTT,
    stopSecondTT,
  );
};

/**
 * 计算一个旋转矩阵，将点或向量从国际天文学参考框架
 * （GCRF/ICRF）惯性框架轴转换为地球固定框架轴（ITRF）
 * 在给定时间内。 如果进行变换所需的数据尚未加载，
 * 此函数可能返回undefined。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。如果未指定此参数，则创建并返回一个新实例。
 * @returns {Matrix3|undefined} 旋转矩阵，如果进行变换所需的数据尚未加载，则返回undefined。
 *
 *
 * @example
 * scene.postUpdate.addEventListener(function(scene, time) {
 *   // View in ICRF.
 *   const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
 *   if (Cesium.defined(icrfToFixed)) {
 *     const offset = Cesium.Cartesian3.clone(camera.position);
 *     const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
 *     camera.lookAtTransform(transform, offset);
 *   }
 * });
 *
 * @see Transforms.preloadIcrfFixed
 */
Transforms.computeIcrfToFixedMatrix = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required.");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new Matrix3();
  }

  const fixedToIcrfMtx = Transforms.computeFixedToIcrfMatrix(date, result);
  if (!defined(fixedToIcrfMtx)) {
    return undefined;
  }

  return Matrix3.transpose(fixedToIcrfMtx, result);
};

const TdtMinusTai = 32.184;
const J2000d = 2451545;
const scratchHpr = new HeadingPitchRoll();
const scratchRotationMatrix = new Matrix3();
const dateScratch = new JulianDate();

/**
 * 计算一个旋转矩阵，将点或向量从月球固定框架轴转换为
 * 国际天文学参考框架（GCRF/ICRF）惯性框架轴
 * 在给定时间内。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。如果未指定此参数，则创建并返回一个新实例。
 * @returns {Matrix3} 旋转矩阵。
 *
 * @example
 * // Transform a point from the Fixed axes to the ICRF axes.
 * const now = Cesium.JulianDate.now();
 * const pointInFixed = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const fixedToIcrf = Cesium.Transforms.computeMoonFixedToIcrfMatrix(now);
 * let pointInInertial = new Cesium.Cartesian3();
 * if (Cesium.defined(fixedToIcrf)) {
 *     pointInInertial = Cesium.Matrix3.multiplyByVector(fixedToIcrf, pointInFixed, pointInInertial);
 * }
 */
Transforms.computeMoonFixedToIcrfMatrix = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Matrix3();
  }

  // Converts TAI to TT
  const secondsTT = JulianDate.addSeconds(date, TdtMinusTai, dateScratch);

  // Converts TT to TDB, interval in days since the standard epoch
  const d = JulianDate.totalDays(secondsTT) - J2000d;

  // Compute the approximate rotation, using https://articles.adsabs.harvard.edu//full/1980CeMec..22..205D/0000209.000.html
  const e1 = CesiumMath.toRadians(12.112) - CesiumMath.toRadians(0.052992) * d;
  const e2 = CesiumMath.toRadians(24.224) - CesiumMath.toRadians(0.105984) * d;
  const e3 = CesiumMath.toRadians(227.645) + CesiumMath.toRadians(13.012) * d;
  const e4 =
    CesiumMath.toRadians(261.105) + CesiumMath.toRadians(13.340716) * d;
  const e5 = CesiumMath.toRadians(358.0) + CesiumMath.toRadians(0.9856) * d;

  scratchHpr.pitch =
    CesiumMath.toRadians(270.0 - 90) -
    CesiumMath.toRadians(3.878) * Math.sin(e1) -
    CesiumMath.toRadians(0.12) * Math.sin(e2) +
    CesiumMath.toRadians(0.07) * Math.sin(e3) -
    CesiumMath.toRadians(0.017) * Math.sin(e4);
  scratchHpr.roll =
    CesiumMath.toRadians(66.53 - 90) +
    CesiumMath.toRadians(1.543) * Math.cos(e1) +
    CesiumMath.toRadians(0.24) * Math.cos(e2) -
    CesiumMath.toRadians(0.028) * Math.cos(e3) +
    CesiumMath.toRadians(0.007) * Math.cos(e4);
  scratchHpr.heading =
    CesiumMath.toRadians(244.375 - 90) +
    CesiumMath.toRadians(13.17635831) * d +
    CesiumMath.toRadians(3.558) * Math.sin(e1) +
    CesiumMath.toRadians(0.121) * Math.sin(e2) -
    CesiumMath.toRadians(0.064) * Math.sin(e3) +
    CesiumMath.toRadians(0.016) * Math.sin(e4) +
    CesiumMath.toRadians(0.025) * Math.sin(e5);
  return Matrix3.fromHeadingPitchRoll(scratchHpr, scratchRotationMatrix);
};

/**
 * 计算一个旋转矩阵，将点或向量从国际天文学参考框架
 * （GCRF/ICRF）惯性框架轴转换为月球固定框架轴
 * 在给定时间内。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。如果未指定此参数，则创建并返回一个新实例。
 * @returns {Matrix3} 旋转矩阵。
 *
 * @example
 * // Set the default ICRF to fixed transformation to that of the Moon.
 * Cesium.Transforms.computeIcrfToCentralBodyFixedMatrix = Cesium.Transforms.computeIcrfToMoonFixedMatrix;
 */
Transforms.computeIcrfToMoonFixedMatrix = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required.");
  }
  //>>includeEnd('debug');
  if (!defined(result)) {
    result = new Matrix3();
  }

  const fixedToIcrfMtx = Transforms.computeMoonFixedToIcrfMatrix(date, result);
  if (!defined(fixedToIcrfMtx)) {
    return undefined;
  }

  return Matrix3.transpose(fixedToIcrfMtx, result);
};

const xysScratch = new Iau2006XysSample(0.0, 0.0, 0.0);
const eopScratch = new EarthOrientationParametersSample(
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
);
const rotation1Scratch = new Matrix3();
const rotation2Scratch = new Matrix3();

/**
 * 计算一个旋转矩阵，将点或向量从地球固定框架轴（ITRF）
 * 转换为国际天文学参考框架（GCRF/ICRF）惯性框架轴
 * 在给定时间内。如果进行变换所需的数据尚未加载，
 * 此函数可能返回undefined。
 *
 * @param {JulianDate} date 计算旋转矩阵的时间。
 * @param {Matrix3} [result] 存储结果的对象。如果未指定此参数，则创建并返回一个新实例。
 * @returns {Matrix3|undefined} 旋转矩阵，如果进行变换所需的数据尚未加载，则返回undefined。
 *
 * @example
 * // Transform a point from the Fixed axes to the ICRF axes.
 * const now = Cesium.JulianDate.now();
 * const pointInFixed = Cesium.Cartesian3.fromDegrees(0.0, 0.0);
 * const fixedToIcrf = Cesium.Transforms.computeFixedToIcrfMatrix(now);
 * let pointInInertial = new Cesium.Cartesian3();
 * if (Cesium.defined(fixedToIcrf)) {
 *     pointInInertial = Cesium.Matrix3.multiplyByVector(fixedToIcrf, pointInFixed, pointInInertial);
 * }
 *
 * @see Transforms.preloadIcrfFixed
 */
Transforms.computeFixedToIcrfMatrix = function (date, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(date)) {
    throw new DeveloperError("date is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Matrix3();
  }

  // Compute pole wander
  const eop = Transforms.earthOrientationParameters.compute(date, eopScratch);
  if (!defined(eop)) {
    return undefined;
  }

  // There is no external conversion to Terrestrial Time (TT).
  // So use International Atomic Time (TAI) and convert using offsets.
  // Here we are assuming that dayTT and secondTT are positive
  const dayTT = date.dayNumber;
  // It's possible here that secondTT could roll over 86400
  // This does not seem to affect the precision (unit tests check for this)
  const secondTT = date.secondsOfDay + ttMinusTai;

  const xys = Transforms.iau2006XysData.computeXysRadians(
    dayTT,
    secondTT,
    xysScratch,
  );
  if (!defined(xys)) {
    return undefined;
  }

  const x = xys.x + eop.xPoleOffset;
  const y = xys.y + eop.yPoleOffset;

  // Compute XYS rotation
  const a = 1.0 / (1.0 + Math.sqrt(1.0 - x * x - y * y));

  const rotation1 = rotation1Scratch;
  rotation1[0] = 1.0 - a * x * x;
  rotation1[3] = -a * x * y;
  rotation1[6] = x;
  rotation1[1] = -a * x * y;
  rotation1[4] = 1 - a * y * y;
  rotation1[7] = y;
  rotation1[2] = -x;
  rotation1[5] = -y;
  rotation1[8] = 1 - a * (x * x + y * y);

  const rotation2 = Matrix3.fromRotationZ(-xys.s, rotation2Scratch);
  const matrixQ = Matrix3.multiply(rotation1, rotation2, rotation1Scratch);

  // Similar to TT conversions above
  // It's possible here that secondTT could roll over 86400
  // This does not seem to affect the precision (unit tests check for this)
  const dateUt1day = date.dayNumber;
  const dateUt1sec =
    date.secondsOfDay - JulianDate.computeTaiMinusUtc(date) + eop.ut1MinusUtc;

  // Compute Earth rotation angle
  // The IERS standard for era is
  //    era = 0.7790572732640 + 1.00273781191135448 * Tu
  // where
  //    Tu = JulianDateInUt1 - 2451545.0
  // However, you get much more precision if you make the following simplification
  //    era = a + (1 + b) * (JulianDayNumber + FractionOfDay - 2451545)
  //    era = a + (JulianDayNumber - 2451545) + FractionOfDay + b (JulianDayNumber - 2451545 + FractionOfDay)
  //    era = a + FractionOfDay + b (JulianDayNumber - 2451545 + FractionOfDay)
  // since (JulianDayNumber - 2451545) represents an integer number of revolutions which will be discarded anyway.
  const daysSinceJ2000 = dateUt1day - 2451545;
  const fractionOfDay = dateUt1sec / TimeConstants.SECONDS_PER_DAY;
  let era =
    0.779057273264 +
    fractionOfDay +
    0.00273781191135448 * (daysSinceJ2000 + fractionOfDay);
  era = (era % 1.0) * CesiumMath.TWO_PI;

  const earthRotation = Matrix3.fromRotationZ(era, rotation2Scratch);

  // pseudoFixed to ICRF
  const pfToIcrf = Matrix3.multiply(matrixQ, earthRotation, rotation1Scratch);

  // Compute pole wander matrix
  const cosxp = Math.cos(eop.xPoleWander);
  const cosyp = Math.cos(eop.yPoleWander);
  const sinxp = Math.sin(eop.xPoleWander);
  const sinyp = Math.sin(eop.yPoleWander);

  let ttt = dayTT - j2000ttDays + secondTT / TimeConstants.SECONDS_PER_DAY;
  ttt /= 36525.0;

  // approximate sp value in rad
  const sp = (-47.0e-6 * ttt * CesiumMath.RADIANS_PER_DEGREE) / 3600.0;
  const cossp = Math.cos(sp);
  const sinsp = Math.sin(sp);

  const fToPfMtx = rotation2Scratch;
  fToPfMtx[0] = cosxp * cossp;
  fToPfMtx[1] = cosxp * sinsp;
  fToPfMtx[2] = sinxp;
  fToPfMtx[3] = -cosyp * sinsp + sinyp * sinxp * cossp;
  fToPfMtx[4] = cosyp * cossp + sinyp * sinxp * sinsp;
  fToPfMtx[5] = -sinyp * cosxp;
  fToPfMtx[6] = -sinyp * sinsp - cosyp * sinxp * cossp;
  fToPfMtx[7] = sinyp * cossp - cosyp * sinxp * sinsp;
  fToPfMtx[8] = cosyp * cosxp;

  return Matrix3.multiply(pfToIcrf, fToPfMtx, result);
};

const pointToWindowCoordinatesTemp = new Cartesian4();

/**
 * 将点从模型坐标转换为窗口坐标。
 *
 * @param {Matrix4} modelViewProjectionMatrix 4x4模型-视图-投影矩阵。
 * @param {Matrix4} viewportTransformation 4x4视口变换矩阵。
 * @param {Cartesian3} point 要转换的点。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数，如果未提供则返回一个新实例的Cartesian2。
 */

Transforms.pointToWindowCoordinates = function (
  modelViewProjectionMatrix,
  viewportTransformation,
  point,
  result,
) {
  result = Transforms.pointToGLWindowCoordinates(
    modelViewProjectionMatrix,
    viewportTransformation,
    point,
    result,
  );
  result.y = 2.0 * viewportTransformation[5] - result.y;
  return result;
};

/**
 * @private
 */
Transforms.pointToGLWindowCoordinates = function (
  modelViewProjectionMatrix,
  viewportTransformation,
  point,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(modelViewProjectionMatrix)) {
    throw new DeveloperError("modelViewProjectionMatrix is required.");
  }

  if (!defined(viewportTransformation)) {
    throw new DeveloperError("viewportTransformation is required.");
  }

  if (!defined(point)) {
    throw new DeveloperError("point is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian2();
  }

  const tmp = pointToWindowCoordinatesTemp;

  Matrix4.multiplyByVector(
    modelViewProjectionMatrix,
    Cartesian4.fromElements(point.x, point.y, point.z, 1, tmp),
    tmp,
  );
  Cartesian4.multiplyByScalar(tmp, 1.0 / tmp.w, tmp);
  Matrix4.multiplyByVector(viewportTransformation, tmp, tmp);
  return Cartesian2.fromCartesian4(tmp, result);
};

const normalScratch = new Cartesian3();
const rightScratch = new Cartesian3();
const upScratch = new Cartesian3();

/**
 * 将位置和速度转换为旋转矩阵。
 *
 * @param {Cartesian3} position 要转换的位置。
 * @param {Cartesian3} velocity 要转换的速度向量。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 用于变换的椭球体，其固定框架将用于转换。
 * @param {Matrix3} [result] 存储结果的对象。
 * @returns {Matrix3} 修改后的结果参数，如果未提供则返回一个新的Matrix3实例。
 */

Transforms.rotationMatrixFromPositionVelocity = function (
  position,
  velocity,
  ellipsoid,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(position)) {
    throw new DeveloperError("position is required.");
  }

  if (!defined(velocity)) {
    throw new DeveloperError("velocity is required.");
  }
  //>>includeEnd('debug');

  const normal = defaultValue(
    ellipsoid,
    Ellipsoid.default,
  ).geodeticSurfaceNormal(position, normalScratch);
  let right = Cartesian3.cross(velocity, normal, rightScratch);

  if (Cartesian3.equalsEpsilon(right, Cartesian3.ZERO, CesiumMath.EPSILON6)) {
    right = Cartesian3.clone(Cartesian3.UNIT_X, right);
  }

  const up = Cartesian3.cross(right, velocity, upScratch);
  Cartesian3.normalize(up, up);
  Cartesian3.cross(velocity, up, right);
  Cartesian3.negate(right, right);
  Cartesian3.normalize(right, right);

  if (!defined(result)) {
    result = new Matrix3();
  }

  result[0] = velocity.x;
  result[1] = velocity.y;
  result[2] = velocity.z;
  result[3] = right.x;
  result[4] = right.y;
  result[5] = right.z;
  result[6] = up.x;
  result[7] = up.y;
  result[8] = up.z;

  return result;
};

const swizzleMatrix = new Matrix4(
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
);

const scratchCartographic = new Cartographic();
const scratchCartesian3Projection = new Cartesian3();
const scratchCenter = new Cartesian3();
const scratchRotation = new Matrix3();
const scratchFromENU = new Matrix4();
const scratchToENU = new Matrix4();

/**
 * @private
 */
Transforms.basisTo2D = function (projection, matrix, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(projection)) {
    throw new DeveloperError("projection is required.");
  }
  if (!defined(matrix)) {
    throw new DeveloperError("matrix is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const rtcCenter = Matrix4.getTranslation(matrix, scratchCenter);
  const ellipsoid = projection.ellipsoid;

  let projectedPosition;
  if (Cartesian3.equals(rtcCenter, Cartesian3.ZERO)) {
    projectedPosition = Cartesian3.clone(
      Cartesian3.ZERO,
      scratchCartesian3Projection,
    );
  } else {
    // Get the 2D Center
    const cartographic = ellipsoid.cartesianToCartographic(
      rtcCenter,
      scratchCartographic,
    );

    projectedPosition = projection.project(
      cartographic,
      scratchCartesian3Projection,
    );
    Cartesian3.fromElements(
      projectedPosition.z,
      projectedPosition.x,
      projectedPosition.y,
      projectedPosition,
    );
  }

  // Assuming the instance are positioned on the ellipsoid, invert the ellipsoidal transform to get the local transform and then convert to 2D
  const fromENU = Transforms.eastNorthUpToFixedFrame(
    rtcCenter,
    ellipsoid,
    scratchFromENU,
  );
  const toENU = Matrix4.inverseTransformation(fromENU, scratchToENU);
  const rotation = Matrix4.getMatrix3(matrix, scratchRotation);
  const local = Matrix4.multiplyByMatrix3(toENU, rotation, result);
  Matrix4.multiply(swizzleMatrix, local, result); // Swap x, y, z for 2D
  Matrix4.setTranslation(result, projectedPosition, result); // Use the projected center

  return result;
};

/**
 * @private
 */
Transforms.ellipsoidTo2DModelMatrix = function (projection, center, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(projection)) {
    throw new DeveloperError("projection is required.");
  }
  if (!defined(center)) {
    throw new DeveloperError("center is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const ellipsoid = projection.ellipsoid;

  const fromENU = Transforms.eastNorthUpToFixedFrame(
    center,
    ellipsoid,
    scratchFromENU,
  );
  const toENU = Matrix4.inverseTransformation(fromENU, scratchToENU);

  const cartographic = ellipsoid.cartesianToCartographic(
    center,
    scratchCartographic,
  );
  const projectedPosition = projection.project(
    cartographic,
    scratchCartesian3Projection,
  );
  Cartesian3.fromElements(
    projectedPosition.z,
    projectedPosition.x,
    projectedPosition.y,
    projectedPosition,
  );

  const translation = Matrix4.fromTranslation(
    projectedPosition,
    scratchFromENU,
  );
  Matrix4.multiply(swizzleMatrix, toENU, result);
  Matrix4.multiply(translation, result, result);

  return result;
};
export default Transforms;
