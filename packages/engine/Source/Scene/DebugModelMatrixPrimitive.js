import ArcType from "../Core/ArcType.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import Matrix4 from "../Core/Matrix4.js";
import PolylineGeometry from "../Core/PolylineGeometry.js";
import PolylineColorAppearance from "./PolylineColorAppearance.js";
import Primitive from "./Primitive.js";

/**
 * 绘制由转换到世界坐标的矩阵定义的参考框架的轴，即地球的WGS84坐标。
 * <p>
 * X轴为红色；Y轴为绿色；Z轴为蓝色。
 * </p>
 * <p>
 * 这只用于调试；它没有为生产使用进行优化。
 * </p>
 *
 * @alias DebugModelMatrixPrimitive
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.length=10000000.0] 轴的长度，单位为米。
 * @param {number} [options.width=2.0] 轴的宽度，单位为像素。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 定义参考框架的4x4矩阵，即原点加轴，用于可视化。
 * @param {boolean} [options.show=true] 确定这个原语是否会被显示。
 * @param {object} [options.id] 用户定义的对象，在实例被 {@link Scene#pick} 拾取时返回。
 *
 * @example
 * primitives.add(new Cesium.DebugModelMatrixPrimitive({
 *   modelMatrix : primitive.modelMatrix,  // 要调试的原语
 *   length : 100000.0,
 *   width : 10.0
 * }));
 */
function DebugModelMatrixPrimitive(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 轴的长度，单位为米。
   *
   * @type {number}
   * @default 10000000.0
   */
  this.length = defaultValue(options.length, 10000000.0);
  this._length = undefined;

  /**
   * 轴的宽度，单位为像素。
   *
   * @type {number}
   * @default 2.0
   */
  this.width = defaultValue(options.width, 2.0);
  this._width = undefined;

  /**
   * 确定这个原语是否会被显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 定义参考框架的4x4矩阵，即原点加轴，用于可视化。
   *
   * @type {Matrix4}
   * @default {@link Matrix4.IDENTITY}
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  this._modelMatrix = new Matrix4();

  /**
   * 用户定义的对象，在实例被 {@link Scene#pick} 拾取时返回。
   *
   * @type {*}
   * @default undefined
   */
  this.id = options.id;
  this._id = undefined;

  this._primitive = undefined;
}

/**
 * @private
 */
DebugModelMatrixPrimitive.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  if (
    !defined(this._primitive) ||
    !Matrix4.equals(this._modelMatrix, this.modelMatrix) ||
    this._length !== this.length ||
    this._width !== this.width ||
    this._id !== this.id
  ) {
    this._modelMatrix = Matrix4.clone(this.modelMatrix, this._modelMatrix);
    this._length = this.length;
    this._width = this.width;
    this._id = this.id;

    if (defined(this._primitive)) {
      this._primitive.destroy();
    }

    // 避免投影 (0, 0, 0)
    if (
      this.modelMatrix[12] === 0.0 &&
      this.modelMatrix[13] === 0.0 &&
      this.modelMatrix[14] === 0.0
    ) {
      this.modelMatrix[14] = 0.01;
    }

    const x = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_X],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.RED, Color.RED],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });
    const y = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_Y],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.GREEN, Color.GREEN],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });
    const z = new GeometryInstance({
      geometry: new PolylineGeometry({
        positions: [Cartesian3.ZERO, Cartesian3.UNIT_Z],
        width: this.width,
        vertexFormat: PolylineColorAppearance.VERTEX_FORMAT,
        colors: [Color.BLUE, Color.BLUE],
        arcType: ArcType.NONE,
      }),
      modelMatrix: Matrix4.multiplyByUniformScale(
        this.modelMatrix,
        this.length,
        new Matrix4(),
      ),
      id: this.id,
      pickPrimitive: this,
    });

    this._primitive = new Primitive({
      geometryInstances: [x, y, z],
      appearance: new PolylineColorAppearance(),
      asynchronous: false,
    });
  }

  this._primitive.update(frameState);
};

/**
 * 返回此对象是否已被销毁；如果没有被销毁，则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应再使用；调用任何除 <code>isDestroyed</code> 之外的函数都会抛出 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see DebugModelMatrixPrimitive#destroy
 */
DebugModelMatrixPrimitive.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象所持有的WebGL资源。销毁一个对象允许确定性地释放WebGL资源，而不是依赖垃圾收集器来销毁此对象。
 * <p>
 * 一旦对象被销毁，就不应再使用；调用任何除 <code>isDestroyed</code> 之外的函数都会抛出 {@link DeveloperError} 异常。因此，将返回值（<code>undefined</code>）赋值给对象，如示例中所做的。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * p = p && p.destroy();
 *
 * @see DebugModelMatrixPrimitive#isDestroyed
 */
DebugModelMatrixPrimitive.prototype.destroy = function () {
  this._primitive = this._primitive && this._primitive.destroy();
  return destroyObject(this);
};

export default DebugModelMatrixPrimitive;