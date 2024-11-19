import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import EllipseGeometry from "./EllipseGeometry.js";
import Ellipsoid from "./Ellipsoid.js";
import VertexFormat from "./VertexFormat.js";

/**
 * 描述椭球体上的圆。圆形几何体可以通过 {@link Primitive} 和 {@link GroundPrimitive} 进行渲染。
 *
 * @alias CircleGeometry
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3} options.center 圆的中心点在固定坐标系中的位置。
 * @param {number} options.radius 半径（以米为单位）。
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 圆所在的椭球体。
 * @param {number} [options.height=0.0] 圆与椭球面之间的距离（以米为单位）。
 * @param {number} [options.granularity=0.02] 圆上点之间的角距（以弧度为单位）。
 * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] 要计算的顶点属性。
 * @param {number} [options.extrudedHeight=0.0] 圆的挤出面与椭球面之间的距离（以米为单位）。
 * @param {number} [options.stRotation=0.0] 纹理坐标的旋转角度（以弧度为单位）。正的旋转为逆时针。
 *
 * @exception {DeveloperError} radius 必须大于零。
 * @exception {DeveloperError} granularity 必须大于零。
 *
 * @see CircleGeometry.createGeometry
 * @see Packable
 *
 * @example
 * // Create a circle.
 * const circle = new Cesium.CircleGeometry({
 *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
 *   radius : 100000.0
 * });
 * const geometry = Cesium.CircleGeometry.createGeometry(circle);
 */
function CircleGeometry(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const radius = options.radius;

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("radius", radius);
  //>>includeEnd('debug');

  const ellipseGeometryOptions = {
    center: options.center,
    semiMajorAxis: radius,
    semiMinorAxis: radius,
    ellipsoid: options.ellipsoid,
    height: options.height,
    extrudedHeight: options.extrudedHeight,
    granularity: options.granularity,
    vertexFormat: options.vertexFormat,
    stRotation: options.stRotation,
    shadowVolume: options.shadowVolume,
  };
  this._ellipseGeometry = new EllipseGeometry(ellipseGeometryOptions);
  this._workerName = "createCircleGeometry";
}

/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */

CircleGeometry.packedLength = EllipseGeometry.packedLength;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {CircleGeometry} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
CircleGeometry.pack = function(value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  //>>includeEnd('debug');
  return EllipseGeometry.pack(value._ellipseGeometry, array, startingIndex);
};

const scratchEllipseGeometry = new EllipseGeometry({
  center: new Cartesian3(),
  semiMajorAxis: 1.0,
  semiMinorAxis: 1.0,
});
const scratchOptions = {
  center: new Cartesian3(),
  radius: undefined,
  ellipsoid: Ellipsoid.clone(Ellipsoid.default),
  height: undefined,
  extrudedHeight: undefined,
  granularity: undefined,
  vertexFormat: new VertexFormat(),
  stRotation: undefined,
  semiMajorAxis: undefined,
  semiMinorAxis: undefined,
  shadowVolume: undefined,
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {CircleGeometry} [result] 存储结果的对象。
 * @returns {CircleGeometry} 修改后的结果参数，如果未提供则返回一个新的 CircleGeometry 实例。
 */

CircleGeometry.unpack = function(array, startingIndex, result) {
  const ellipseGeometry = EllipseGeometry.unpack(
    array,
    startingIndex,
    scratchEllipseGeometry,
  );
  scratchOptions.center = Cartesian3.clone(
    ellipseGeometry._center,
    scratchOptions.center,
  );
  scratchOptions.ellipsoid = Ellipsoid.clone(
    ellipseGeometry._ellipsoid,
    scratchOptions.ellipsoid,
  );
  scratchOptions.ellipsoid = Ellipsoid.clone(
    ellipseGeometry._ellipsoid,
    scratchEllipseGeometry._ellipsoid,
  );
  scratchOptions.height = ellipseGeometry._height;
  scratchOptions.extrudedHeight = ellipseGeometry._extrudedHeight;
  scratchOptions.granularity = ellipseGeometry._granularity;
  scratchOptions.vertexFormat = VertexFormat.clone(
    ellipseGeometry._vertexFormat,
    scratchOptions.vertexFormat,
  );
  scratchOptions.stRotation = ellipseGeometry._stRotation;
  scratchOptions.shadowVolume = ellipseGeometry._shadowVolume;

  if (!defined(result)) {
    scratchOptions.radius = ellipseGeometry._semiMajorAxis;
    return new CircleGeometry(scratchOptions);
  }

  scratchOptions.semiMajorAxis = ellipseGeometry._semiMajorAxis;
  scratchOptions.semiMinorAxis = ellipseGeometry._semiMinorAxis;
  result._ellipseGeometry = new EllipseGeometry(scratchOptions);
  return result;
};

/**
 * 计算椭球体上圆的几何表示，包括其顶点、索引和包围球。
 *
 * @param {CircleGeometry} circleGeometry 圆的描述。
 * @returns {Geometry|undefined} 计算得出的顶点和索引。
 */

CircleGeometry.createGeometry = function(circleGeometry) {
  return EllipseGeometry.createGeometry(circleGeometry._ellipseGeometry);
};

/**
 * @private
 */
CircleGeometry.createShadowVolume = function(
  circleGeometry,
  minHeightFunc,
  maxHeightFunc,
) {
  const granularity = circleGeometry._ellipseGeometry._granularity;
  const ellipsoid = circleGeometry._ellipseGeometry._ellipsoid;

  const minHeight = minHeightFunc(granularity, ellipsoid);
  const maxHeight = maxHeightFunc(granularity, ellipsoid);

  return new CircleGeometry({
    center: circleGeometry._ellipseGeometry._center,
    radius: circleGeometry._ellipseGeometry._semiMajorAxis,
    ellipsoid: ellipsoid,
    stRotation: circleGeometry._ellipseGeometry._stRotation,
    granularity: granularity,
    extrudedHeight: minHeight,
    height: maxHeight,
    vertexFormat: VertexFormat.POSITION_ONLY,
    shadowVolume: true,
  });
};

Object.defineProperties(CircleGeometry.prototype, {
  /**
   * @private
   */
  rectangle: {
    get: function() {
      return this._ellipseGeometry.rectangle;
    },
  },
  /**
   * 在将 CircleGeometries 渲染为 GroundPrimitives 时用于重新映射纹理坐标。
   * @private
   */

  textureCoordinateRotationPoints: {
    get: function() {
      return this._ellipseGeometry.textureCoordinateRotationPoints;
    },
  },
});
export default CircleGeometry;
