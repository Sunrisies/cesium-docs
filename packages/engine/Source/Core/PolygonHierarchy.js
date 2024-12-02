import defined from "./defined.js";

/**
 * 由线性环的层次结构定义多边形及其孔。
 * 孔本身也可以具有嵌套的内多边形。
 * @alias PolygonHierarchy
 * @constructor
 *
 * @param {Cartesian3[]} [positions] 定义多边形或孔的外边界的线性环。
 * @param {PolygonHierarchy[]} [holes] 定义多边形中孔的多边形层次结构的数组。
 */
function PolygonHierarchy(positions, holes) {
  /**
   * 定义多边形或孔的外边界的线性环。
   * @type {Cartesian3[]}
   */
  this.positions = defined(positions) ? positions : [];

  /**
   * 定义多边形中孔的多边形层次结构的数组。
   * @type {PolygonHierarchy[]}
   */
  this.holes = defined(holes) ? holes : [];
}
export default PolygonHierarchy;
