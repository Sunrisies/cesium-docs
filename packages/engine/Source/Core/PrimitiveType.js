import WebGLConstants from "./WebGLConstants.js";

/**
 * 几何原始对象的类型，例如点、线和三角形。
 *
 * @enum {number}
 */

const PrimitiveType = {
  /**
   * 点原始对象，每个顶点（或索引）是一个独立的点。
   *
   * @type {number}
   * @constant
   */
  POINTS: WebGLConstants.POINTS,

  /**
   * 线原始对象，每两个顶点（或索引）形成一条线段。线段不一定相连。
   *
   * @type {number}
   * @constant
   */
  LINES: WebGLConstants.LINES,

  /**
   * 线环原始对象，每个顶点（或索引）在第一个之后连接到前一个顶点，
   * 最后一个顶点隐式连接到第一个。
   *
   * @type {number}
   * @constant
   */
  LINE_LOOP: WebGLConstants.LINE_LOOP,

  /**
   * 线条带原始对象，每个顶点（或索引）在第一个之后连接到前一个顶点。
   *
   * @type {number}
   * @constant
   */
  LINE_STRIP: WebGLConstants.LINE_STRIP,

  /**
   * 三角形原始对象，每三个顶点（或索引）形成一个三角形。三角形不一定共享边。
   *
   * @type {number}
   * @constant
   */
  TRIANGLES: WebGLConstants.TRIANGLES,

  /**
   * 三角形带原始对象，每个在前两个之后的顶点（或索引）连接到
   * 前两个顶点形成一个三角形。例如，这可以用于建模一面墙。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_STRIP: WebGLConstants.TRIANGLE_STRIP,

  /**
   * 三角形扇原始对象，每个在前两个之后的顶点（或索引）连接到
   * 前一个顶点和第一个顶点形成一个三角形。例如，这可以用于建模一个圆锥或圆圈。
   *
   * @type {number}
   * @constant
   */
  TRIANGLE_FAN: WebGLConstants.TRIANGLE_FAN,
};


/**
 * @private
 */
PrimitiveType.isLines = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.LINES ||
    primitiveType === PrimitiveType.LINE_LOOP ||
    primitiveType === PrimitiveType.LINE_STRIP
  );
};

/**
 * @private
 */
PrimitiveType.isTriangles = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLE_FAN
  );
};

/**
 * @private
 */
PrimitiveType.validate = function (primitiveType) {
  return (
    primitiveType === PrimitiveType.POINTS ||
    primitiveType === PrimitiveType.LINES ||
    primitiveType === PrimitiveType.LINE_LOOP ||
    primitiveType === PrimitiveType.LINE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP ||
    primitiveType === PrimitiveType.TRIANGLE_FAN
  );
};

export default Object.freeze(PrimitiveType);
