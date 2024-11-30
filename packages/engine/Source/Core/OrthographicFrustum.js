import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import OrthographicOffCenterFrustum from "./OrthographicOffCenterFrustum.js";

/**
 * 视锥体由6个平面定义。
 * 每个平面由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 组件
 * 定义平面的单位法向量，w 组件是平面离原点/摄像机位置的距离。
 *
 * @alias OrthographicFrustum
 * @constructor
 *
 * @param {object} [options] 一个具有以下属性的对象：
 * @param {number} [options.width] 视锥体的宽度（以米为单位）。
 * @param {number} [options.aspectRatio] 视锥体宽度与高度的纵横比。
 * @param {number} [options.near=1.0] 近平面的距离。
 * @param {number} [options.far=500000000.0] 远平面的距离。
 *
 * @example
 * const maxRadii = ellipsoid.maximumRadius;
 *
 * const frustum = new Cesium.OrthographicFrustum();
 * frustum.near = 0.01 * maxRadii;
 * frustum.far = 50.0 * maxRadii;
 */
function OrthographicFrustum(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._offCenterFrustum = new OrthographicOffCenterFrustum();

  /**
   * 视锥体的水平宽度（以米为单位）。
   * @type {number|undefined}
   * @default undefined
   */
  this.width = options.width;
  this._width = undefined;

  /**
   * 视锥体宽度与高度的纵横比。
   * @type {number|undefined}
   * @default undefined
   */
  this.aspectRatio = options.aspectRatio;
  this._aspectRatio = undefined;

  /**
   * 近平面的距离。
   * @type {number}
   * @default 1.0
   */
  this.near = defaultValue(options.near, 1.0);
  this._near = this.near;

  /**
   * 远平面的距离。
   * @type {number}
   * @default 500000000.0
   */
  this.far = defaultValue(options.far, 500000000.0);
  this._far = this.far;
}


/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
OrthographicFrustum.packedLength = 4;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {OrthographicFrustum} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
OrthographicFrustum.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.width;
  array[startingIndex++] = value.aspectRatio;
  array[startingIndex++] = value.near;
  array[startingIndex] = value.far;

  return array;
};

/**
 * 从打包数组中检索实例。
 *
 * @param {number[]} array 压缩数组。
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引。
 * @param {OrthographicFrustum} [result] 存储结果的对象。
 * @returns {OrthographicFrustum} 修改后的结果参数，如果未提供则返回一个新的 OrthographicFrustum 实例。
 */

OrthographicFrustum.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new OrthographicFrustum();
  }

  result.width = array[startingIndex++];
  result.aspectRatio = array[startingIndex++];
  result.near = array[startingIndex++];
  result.far = array[startingIndex];

  return result;
};

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.width) ||
    !defined(frustum.aspectRatio) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError(
      "width, aspectRatio, near, or far parameters are not set.",
    );
  }
  //>>includeEnd('debug');

  const f = frustum._offCenterFrustum;

  if (
    frustum.width !== frustum._width ||
    frustum.aspectRatio !== frustum._aspectRatio ||
    frustum.near !== frustum._near ||
    frustum.far !== frustum._far
  ) {
    //>>includeStart('debug', pragmas.debug);
    if (frustum.aspectRatio < 0) {
      throw new DeveloperError("aspectRatio must be positive.");
    }
    if (frustum.near < 0 || frustum.near > frustum.far) {
      throw new DeveloperError(
        "near must be greater than zero and less than far.",
      );
    }
    //>>includeEnd('debug');

    frustum._aspectRatio = frustum.aspectRatio;
    frustum._width = frustum.width;
    frustum._near = frustum.near;
    frustum._far = frustum.far;

    const ratio = 1.0 / frustum.aspectRatio;
    f.right = frustum.width * 0.5;
    f.left = -f.right;
    f.top = ratio * f.right;
    f.bottom = -f.top;
    f.near = frustum.near;
    f.far = frustum.far;
  }
}

Object.defineProperties(OrthographicFrustum.prototype, {
  /**
   * 获取从视锥体计算的正交投影矩阵。
   * @memberof OrthographicFrustum.prototype
   * @type {Matrix4}
   * @readonly
   */
  projectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.projectionMatrix;
    },
  },
  /**
   * 获取从视锥体计算的正交投影矩阵。
   * @memberof OrthographicFrustum.prototype
   * @type {OrthographicOffCenterFrustum}
   * @readonly
   * @private
   */

  offCenterFrustum: {
    get: function () {
      update(this);
      return this._offCenterFrustum;
    },
  },
});

/**
 * 为此视锥体创建一个剔除体积。
 *
 * @param {Cartesian3} position 眼睛位置。
 * @param {Cartesian3} direction 视线方向。
 * @param {Cartesian3} up 上方向。
 * @returns {CullingVolume} 在给定位置和方向的剔除体积。
 *
 * @example
 * // Check if a bounding volume intersects the frustum.
 * const cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
 * const intersect = cullingVolume.computeVisibility(boundingVolume);
 */
OrthographicFrustum.prototype.computeCullingVolume = function (
  position,
  direction,
  up,
) {
  update(this);
  return this._offCenterFrustum.computeCullingVolume(position, direction, up);
};

/**
 * 返回像素的宽度和高度（以米为单位）。
 *
 * @param {number} drawingBufferWidth 绘图缓冲区的宽度。
 * @param {number} drawingBufferHeight 绘图缓冲区的高度。
 * @param {number} distance 到近平面的距离（以米为单位）。
 * @param {number} pixelRatio 从像素空间到坐标空间的缩放因子。
 * @param {Cartesian2} result 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数，或一个新的 {@link Cartesian2} 实例，其 x 和 y 属性分别为像素的宽度和高度。
 *
 * @exception {DeveloperError} drawingBufferWidth 必须大于零。
 * @exception {DeveloperError} drawingBufferHeight 必须大于零。
 * @exception {DeveloperError} pixelRatio 必须大于零。
 *
 * @example
 * // Example 1
 * // Get the width and height of a pixel.
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 0.0, scene.pixelRatio, new Cesium.Cartesian2());
 */
OrthographicFrustum.prototype.getPixelDimensions = function (
  drawingBufferWidth,
  drawingBufferHeight,
  distance,
  pixelRatio,
  result,
) {
  update(this);
  return this._offCenterFrustum.getPixelDimensions(
    drawingBufferWidth,
    drawingBufferHeight,
    distance,
    pixelRatio,
    result,
  );
};

/**
 * 返回一个定向包围盒实例的副本。
 *
 * @param {OrthographicFrustum} [result] 存储结果的对象。
 * @returns {OrthographicFrustum} 修改后的结果参数，如果未提供则返回一个新的 OrthographicFrustum 实例。
 */

OrthographicFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new OrthographicFrustum();
  }

  result.aspectRatio = this.aspectRatio;
  result.width = this.width;
  result.near = this.near;
  result.far = this.far;

  // force update of clone to compute matrices
  result._aspectRatio = undefined;
  result._width = undefined;
  result._near = undefined;
  result._far = undefined;

  this._offCenterFrustum.clone(result._offCenterFrustum);

  return result;
};

/**
 * 分别比较提供的定向包围盒，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {OrthographicFrustum} [other] 右侧的定向包围盒。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */

OrthographicFrustum.prototype.equals = function (other) {
  if (!defined(other) || !(other instanceof OrthographicFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    this.width === other.width &&
    this.aspectRatio === other.aspectRatio &&
    this._offCenterFrustum.equals(other._offCenterFrustum)
  );
};

/**
 * 分别比较提供的定向包围盒，并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {OrthographicFrustum} other 右侧的定向包围盒。
 * @param {number} relativeEpsilon 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差。
 * @returns {boolean} 如果 this 和 other 在提供的 epsilon 范围内，则为 <code>true</code>，否则为 <code>false</code>。
 */

OrthographicFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon,
) {
  if (!defined(other) || !(other instanceof OrthographicFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    CesiumMath.equalsEpsilon(
      this.width,
      other.width,
      relativeEpsilon,
      absoluteEpsilon,
    ) &&
    CesiumMath.equalsEpsilon(
      this.aspectRatio,
      other.aspectRatio,
      relativeEpsilon,
      absoluteEpsilon,
    ) &&
    this._offCenterFrustum.equalsEpsilon(
      other._offCenterFrustum,
      relativeEpsilon,
      absoluteEpsilon,
    )
  );
};
export default OrthographicFrustum;
