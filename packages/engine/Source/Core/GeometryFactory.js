import DeveloperError from "../Core/DeveloperError.js";

/**
 * 所有几何体创建工具类的基类，可以传递给 {@link GeometryInstance} 进行异步几何体创建。
 *
 * @constructor
 * @class
 * @abstract
 */
function GeometryFactory() {
  DeveloperError.throwInstantiationError();
}

/**
 * 返回一个几何体。
 *
 * @param {GeometryFactory} geometryFactory 圆的描述。
 * @returns {Geometry|undefined} 计算得到的顶点和索引。
 */
GeometryFactory.createGeometry = function (geometryFactory) {
  DeveloperError.throwInstantiationError();
};

export default GeometryFactory;
