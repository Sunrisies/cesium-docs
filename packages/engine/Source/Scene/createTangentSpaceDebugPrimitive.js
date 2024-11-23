import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import Matrix4 from "../Core/Matrix4.js";
import PerInstanceColorAppearance from "./PerInstanceColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 创建一个 {@link Primitive} 来可视化众所周知的矢量顶点属性：
 * <code>normal</code>、<code>tangent</code> 和 <code>bitangent</code>。法线
 * 用红色表示；切线用绿色表示；副切线用蓝色表示。如果某个属性不存在，则不绘制该属性。
 *
 * @function
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Geometry} options.geometry 包含该属性的 <code>Geometry</code> 实例。
 * @param {number} [options.length=10000.0] 每个线段的长度（以米为单位）。这可以为负值，以使矢量指向相反方向。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将几何体从模型坐标转换为世界坐标的模型矩阵。
 * @returns {Primitive} 带有矢量几何体的新 <code>Primitive</code> 实例。
 *
 * @example
 * scene.primitives.add(Cesium.createTangentSpaceDebugPrimitive({
 *    geometry : instance.geometry,
 *    length : 100000.0,
 *    modelMatrix : instance.modelMatrix
 * }));
 */
function createTangentSpaceDebugPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const instances = [];
  let geometry = options.geometry;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(geometry)) {
    throw new DeveloperError("options.geometry is required.");
  }
  //>>includeEnd('debug');

  if (!defined(geometry.attributes) || !defined(geometry.primitiveType)) {
    // to create the debug lines, we need the computed attributes.
    // compute them if they are undefined.
    geometry = geometry.constructor.createGeometry(geometry);
  }

  const attributes = geometry.attributes;
  const modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  const length = defaultValue(options.length, 10000.0);

  if (defined(attributes.normal)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "normal",
          length,
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0),
        },
        modelMatrix: modelMatrix,
      }),
    );
  }

  if (defined(attributes.tangent)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "tangent",
          length,
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(0.0, 1.0, 0.0, 1.0),
        },
        modelMatrix: modelMatrix,
      }),
    );
  }

  if (defined(attributes.bitangent)) {
    instances.push(
      new GeometryInstance({
        geometry: GeometryPipeline.createLineSegmentsForVectors(
          geometry,
          "bitangent",
          length,
        ),
        attributes: {
          color: new ColorGeometryInstanceAttribute(0.0, 0.0, 1.0, 1.0),
        },
        modelMatrix: modelMatrix,
      }),
    );
  }

  if (instances.length > 0) {
    return new Primitive({
      asynchronous: false,
      geometryInstances: instances,
      appearance: new PerInstanceColorAppearance({
        flat: true,
        translucent: false,
      }),
    });
  }

  return undefined;
}
export default createTangentSpaceDebugPrimitive;
