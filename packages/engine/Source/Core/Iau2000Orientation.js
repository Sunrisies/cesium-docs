import defined from "./defined.js";
import IauOrientationParameters from "./IauOrientationParameters.js";
import JulianDate from "./JulianDate.js";
import CesiumMath from "./Math.js";
import TimeConstants from "./TimeConstants.js";

/**
 * This is a collection of the orientation information available for central bodies.
 * The data comes from the Report of the IAU/IAG Working Group on Cartographic
 * Coordinates and Rotational Elements: 2000.
 *
 * @namespace Iau2000Orientation
 *
 * @private
 */
const Iau2000Orientation = {};

const TdtMinusTai = 32.184;
const J2000d = 2451545.0;

const c1 = -0.0529921;
const c2 = -0.1059842;
const c3 = 13.0120009;
const c4 = 13.3407154;
const c5 = 0.9856003;
const c6 = 26.4057084;
const c7 = 13.064993;
const c8 = 0.3287146;
const c9 = 1.7484877;
const c10 = -0.1589763;
const c11 = 0.0036096;
const c12 = 0.1643573;
const c13 = 12.9590088;
let dateTT = new JulianDate();

/**
 * Compute the orientation parameters for the Moon.
 *
 * @param {JulianDate} [date=JulianDate.now()] The date to evaluate the parameters.
 * @param {IauOrientationParameters} [result] 存储结果的对象.
 * @returns {IauOrientationParameters} The modified result parameter or a new instance representing the orientation of the Earth's Moon.
 * @private
 */
Iau2000Orientation.ComputeMoon = function (date, result) {
  if (!defined(date)) {
    date = JulianDate.now();
  }

  dateTT = JulianDate.addSeconds(date, TdtMinusTai, dateTT);
  const d = JulianDate.totalDays(dateTT) - J2000d;
  const T = d / TimeConstants.DAYS_PER_JULIAN_CENTURY;

  const E1 = (125.045 + c1 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E2 = (250.089 + c2 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E3 = (260.008 + c3 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E4 = (176.625 + c4 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E5 = (357.529 + c5 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E6 = (311.589 + c6 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E7 = (134.963 + c7 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E8 = (276.617 + c8 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E9 = (34.226 + c9 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E10 = (15.134 + c10 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E11 = (119.743 + c11 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E12 = (239.961 + c12 * d) * CesiumMath.RADIANS_PER_DEGREE;
  const E13 = (25.053 + c13 * d) * CesiumMath.RADIANS_PER_DEGREE;

  const sinE1 = Math.sin(E1);
  const sinE2 = Math.sin(E2);
  const sinE3 = Math.sin(E3);
  const sinE4 = Math.sin(E4);
  const sinE5 = Math.sin(E5);
  const sinE6 = Math.sin(E6);
  const sinE7 = Math.sin(E7);
  const sinE8 = Math.sin(E8);
  const sinE9 = Math.sin(E9);
  const sinE10 = Math.sin(E10);
  const sinE11 = Math.sin(E11);
  const sinE12 = Math.sin(E12);
  const sinE13 = Math.sin(E13);

  const cosE1 = Math.cos(E1);
  const cosE2 = Math.cos(E2);
  const cosE3 = Math.cos(E3);
  const cosE4 = Math.cos(E4);
  const cosE5 = Math.cos(E5);
  const cosE6 = Math.cos(E6);
  const cosE7 = Math.cos(E7);
  const cosE8 = Math.cos(E8);
  const cosE9 = Math.cos(E9);
  const cosE10 = Math.cos(E10);
  const cosE11 = Math.cos(E11);
  const cosE12 = Math.cos(E12);
  const cosE13 = Math.cos(E13);

  const rightAscension =
    (269.9949 +
      0.0031 * T -
      3.8787 * sinE1 -
      0.1204 * sinE2 +
      0.07 * sinE3 -
      0.0172 * sinE4 +
      0.0072 * sinE6 -
      0.0052 * sinE10 +
      0.0043 * sinE13) *
    CesiumMath.RADIANS_PER_DEGREE;
  const declination =
    (66.5392 +
      0.013 * T +
      1.5419 * cosE1 +
      0.0239 * cosE2 -
      0.0278 * cosE3 +
      0.0068 * cosE4 -
      0.0029 * cosE6 +
      0.0009 * cosE7 +
      0.0008 * cosE10 -
      0.0009 * cosE13) *
    CesiumMath.RADIANS_PER_DEGREE;
  const rotation =
    (38.3213 +
      13.17635815 * d -
      1.4e-12 * d * d +
      3.561 * sinE1 +
      0.1208 * sinE2 -
      0.0642 * sinE3 +
      0.0158 * sinE4 +
      0.0252 * sinE5 -
      0.0066 * sinE6 -
      0.0047 * sinE7 -
      0.0046 * sinE8 +
      0.0028 * sinE9 +
      0.0052 * sinE10 +
      0.004 * sinE11 +
      0.0019 * sinE12 -
      0.0044 * sinE13) *
    CesiumMath.RADIANS_PER_DEGREE;

  const rotationRate =
    ((13.17635815 -
      1.4e-12 * (2.0 * d) +
      3.561 * cosE1 * c1 +
      0.1208 * cosE2 * c2 -
      0.0642 * cosE3 * c3 +
      0.0158 * cosE4 * c4 +
      0.0252 * cosE5 * c5 -
      0.0066 * cosE6 * c6 -
      0.0047 * cosE7 * c7 -
      0.0046 * cosE8 * c8 +
      0.0028 * cosE9 * c9 +
      0.0052 * cosE10 * c10 +
      0.004 * cosE11 * c11 +
      0.0019 * cosE12 * c12 -
      0.0044 * cosE13 * c13) /
      86400.0) *
    CesiumMath.RADIANS_PER_DEGREE;

  if (!defined(result)) {
    result = new IauOrientationParameters();
  }

  result.rightAscension = rightAscension;
  result.declination = declination;
  result.rotation = rotation;
  result.rotationRate = rotationRate;

  return result;
};
export default Iau2000Orientation;
