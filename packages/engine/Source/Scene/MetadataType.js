import Check from "../Core/Check.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix2 from "../Core/Matrix2.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";

/**
 * 元数据类型的枚举。这些元数据类型是包含一个或多个 {@link MetadataComponentType} 类型组件的容器。
 *
 * @enum {string}
 * @experimental 该功能使用的是 3D Tiles 规范中的一部分，该部分尚未确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
 */

const MetadataType = {
  /**
   * 单个组件
   *
   * @type {string}
   * @constant
   */
  SCALAR: "SCALAR",
  /**
   * 具有两个组件的向量
   *
   * @type {string}
   * @constant
   */
  VEC2: "VEC2",
  /**
   * 具有三个组件的向量
   *
   * @type {string}
   * @constant
   */
  VEC3: "VEC3",
  /**
   * 具有四个组件的向量
   *
   * @type {string}
   * @constant
   */
  VEC4: "VEC4",
  /**
   * 2x2 矩阵，以列优先格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT2: "MAT2",
  /**
   * 3x3 矩阵，以列优先格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT3: "MAT3",
  /**
   * 4x4 矩阵，以列优先格式存储。
   *
   * @type {string}
   * @constant
   */
  MAT4: "MAT4",
  /**
   * 布尔值（真/假）
   *
   * @type {string}
   * @constant
   */
  BOOLEAN: "BOOLEAN",
  /**
   * UTF-8 编码的字符串值
   *
   * @type {string}
   * @constant
   */
  STRING: "STRING",
  /**
   * 枚举值。此类型与 {@link MetadataEnum} 一起使用，以描述有效值。
   *
   * @see MetadataEnum
   *
   * @type {string}
   * @constant
   */
  ENUM: "ENUM",
};


/**
 * 检查类型是否是 VEC2、VEC3 或 VEC4
 *
 * @param {MetadataType} type 类型
 * @return {boolean} 如果类型是向量，则返回 <code>true</code>，否则返回 <code>false</code>
 * @private
 */

MetadataType.isVectorType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.VEC2:
    case MetadataType.VEC3:
    case MetadataType.VEC4:
      return true;
    default:
      return false;
  }
};

/**
 * 检查类型是否是 MAT2、MAT3 或 MAT4
 *
 * @param {MetadataType} type 类型
 * @return {boolean} 如果类型是矩阵，则返回 <code>true</code>，否则返回 <code>false</code>
 * @private
 */

MetadataType.isMatrixType = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.MAT2:
    case MetadataType.MAT3:
    case MetadataType.MAT4:
      return true;
    default:
      return false;
  }
};

/**
 * 获取向量或矩阵类型的组件数量。例如，
 * VECN 返回 N，MATN 返回 N*N。所有其他类型返回 1。
 *
 * @param {MetadataType} type 要获取组件数量的类型
 * @return {number} 组件的数量
 * @private
 */

MetadataType.getComponentCount = function (type) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("type", type);
  //>>includeEnd('debug');

  switch (type) {
    case MetadataType.SCALAR:
    case MetadataType.STRING:
    case MetadataType.ENUM:
    case MetadataType.BOOLEAN:
      return 1;
    case MetadataType.VEC2:
      return 2;
    case MetadataType.VEC3:
      return 3;
    case MetadataType.VEC4:
      return 4;
    case MetadataType.MAT2:
      return 4;
    case MetadataType.MAT3:
      return 9;
    case MetadataType.MAT4:
      return 16;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid metadata type ${type}`);
    //>>includeEnd('debug');
  }
};

/**
 * 获取相应的向量或矩阵类。这用于简化
 * 打包和解包代码。
 * @param {MetadataType} type 元数据类型
 * @return {object} 对于向量类型返回相应的 CartesianN 类，对于矩阵类型返回 MatrixN 类，否则返回 undefined。
 * @private
 */

MetadataType.getMathType = function (type) {
  switch (type) {
    case MetadataType.VEC2:
      return Cartesian2;
    case MetadataType.VEC3:
      return Cartesian3;
    case MetadataType.VEC4:
      return Cartesian4;
    case MetadataType.MAT2:
      return Matrix2;
    case MetadataType.MAT3:
      return Matrix3;
    case MetadataType.MAT4:
      return Matrix4;
    default:
      return undefined;
  }
};

export default Object.freeze(MetadataType);
