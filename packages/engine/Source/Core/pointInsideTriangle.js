import barycentricCoordinates from "./barycentricCoordinates.js";
import Cartesian3 from "./Cartesian3.js";
import defined from "./defined.js";

const scratchBarycentricCoords = new Cartesian3();

/**
 * 确定一个点是否在三角形内部。
 *
 * @function pointInsideTriangle
 *
 * @param {Cartesian2|Cartesian3} point 要测试的点。
 * @param {Cartesian2|Cartesian3} p0 三角形的第一个点。
 * @param {Cartesian2|Cartesian3} p1 三角形的第二个点。
 * @param {Cartesian2|Cartesian3} p2 三角形的第三个点。
 * @returns {boolean} <code>true</code> 如果点在三角形内部；否则返回 <code>false</code>。
 *
 * @example
 * // Returns true
 * const p = new Cesium.Cartesian2(0.25, 0.25);
 * const b = Cesium.pointInsideTriangle(p,
 *   new Cesium.Cartesian2(0.0, 0.0),
 *   new Cesium.Cartesian2(1.0, 0.0),
 *   new Cesium.Cartesian2(0.0, 1.0));
 */
function pointInsideTriangle(point, p0, p1, p2) {
  const coords = barycentricCoordinates(
    point,
    p0,
    p1,
    p2,
    scratchBarycentricCoords,
  );
  if (!defined(coords)) {
    return false;
  }
  return coords.x > 0.0 && coords.y > 0.0 && coords.z > 0;
}
export default pointInsideTriangle;
