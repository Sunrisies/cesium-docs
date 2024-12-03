import DeveloperError from "../Core/DeveloperError.js";
import VoxelBoxShape from "./VoxelBoxShape.js";
import VoxelCylinderShape from "./VoxelCylinderShape.js";
import VoxelEllipsoidShape from "./VoxelEllipsoidShape.js";

/**
 * 体素形状的枚举。形状控制体素网格如何映射到 3D 空间。
 *
 * @enum {string}
 *
 * @experimental 该功能尚未最终确定，可能会根据 Cesium 的标准弃用政策而发生变化
 */

const VoxelShapeType = {
  /**
   * 一个立方体形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  BOX: "BOX",
  /**
   * 一个椭球形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  ELLIPSOID: "ELLIPSOID",
  /**
   * 一个圆柱形状。
   *
   * @type {string}
   * @constant
   * @private
   */
  CYLINDER: "CYLINDER",
};

/**
 * 获取最小边界。
 * @param {VoxelShapeType} shapeType 体素形状类型。
 * @returns {Cartesian3} 最小边界。
 */

VoxelShapeType.getMinBounds = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape.DefaultMinBounds;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape.DefaultMinBounds;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape.DefaultMinBounds;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

/**
 * 获取最大边界。
 * @param {VoxelShapeType} shapeType 体素形状类型。
 * @returns {Cartesian3} 最大边界。
 */

VoxelShapeType.getMaxBounds = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape.DefaultMaxBounds;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape.DefaultMaxBounds;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape.DefaultMaxBounds;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

/**
 * 将形状类型转换为可以用来创建形状对象的构造函数
 * 或获取每种形状的属性，例如 DefaultMinBounds 和
 * DefaultMaxBounds。
 *
 * @param {VoxelShapeType} shapeType 形状类型。
 * @returns {Function} 该形状的构造函数。
 *
 * @private
 */

VoxelShapeType.getShapeConstructor = function (shapeType) {
  switch (shapeType) {
    case VoxelShapeType.BOX:
      return VoxelBoxShape;
    case VoxelShapeType.ELLIPSOID:
      return VoxelEllipsoidShape;
    case VoxelShapeType.CYLINDER:
      return VoxelCylinderShape;
    //>>includeStart('debug', pragmas.debug);
    default:
      throw new DeveloperError(`Invalid shape type ${shapeType}`);
    //>>includeEnd('debug');
  }
};

export default Object.freeze(VoxelShapeType);
