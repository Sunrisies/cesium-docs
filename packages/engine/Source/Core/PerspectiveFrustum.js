import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import CesiumMath from "./Math.js";
import PerspectiveOffCenterFrustum from "./PerspectiveOffCenterFrustum.js";

/**
 * 视锥体由 6 个平面定义。
 * 每个平面由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 分量
 * 定义了法向量的单位向量，w 分量是平面离原点/相机位置的距离。
 *
 * @alias PerspectiveFrustum
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.fov] 视场角（FOV），以弧度表示。
 * @param {number} [options.aspectRatio] 视锥体宽度与高度的纵横比。
 * @param {number} [options.near=1.0] 近平面的距离。
 * @param {number} [options.far=500000000.0] 远平面的距离。
 * @param {number} [options.xOffset=0.0] x 方向上的偏移量。
 * @param {number} [options.yOffset=0.0] y 方向上的偏移量。
 *
 * @example
 * const frustum = new Cesium.PerspectiveFrustum({
 *     fov : Cesium.Math.PI_OVER_THREE,
 *     aspectRatio : canvas.clientWidth / canvas.clientHeight
 *     near : 1.0,
 *     far : 1000.0
 * });
 *
 * @see PerspectiveOffCenterFrustum
 */
function PerspectiveFrustum(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._offCenterFrustum = new PerspectiveOffCenterFrustum();

  /**
   * 视场角（FOV），以弧度表示。该角度将用于
   * 作为水平 FOV，如果宽度大于高度，则使用，
   * 否则将为垂直 FOV。
   * @type {number|undefined}
   * @default undefined
   */
  this.fov = options.fov;
  this._fov = undefined;
  this._fovy = undefined;

  this._sseDenominator = undefined;

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

  /**
   * x 方向上的视锥体偏移量。
   * @type {number}
   * @default 0.0
   */
  this.xOffset = defaultValue(options.xOffset, 0.0);
  this._xOffset = this.xOffset;

  /**
   * y 方向上的视锥体偏移量。
   * @type {number}
   * @default 0.0
   */
  this.yOffset = defaultValue(options.yOffset, 0.0);
  this._yOffset = this.yOffset;
}


/**
 * 用于将对象打包到数组中的元素数量。
 * @type {number}
 */
PerspectiveFrustum.packedLength = 6;

/**
 * 将提供的实例存储到提供的数组中.
 *
 * @param {PerspectiveFrustum} value 要打包的值.
 * @param {number[]} array 要打包到的数组.
 * @param {number} [startingIndex=0] 开始打包元素的数组索引.
 *
 * @returns {number[]} 被打包成的数组
 */
PerspectiveFrustum.pack = function (value, array, startingIndex) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("value", value);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  array[startingIndex++] = value.fov;
  array[startingIndex++] = value.aspectRatio;
  array[startingIndex++] = value.near;
  array[startingIndex++] = value.far;
  array[startingIndex++] = value.xOffset;
  array[startingIndex] = value.yOffset;

  return array;
};

/**
 * 从打包数组中检索实例.
 *
 * @param {number[]} array 压缩数组.
 * @param {number} [startingIndex=0] 需要解包的元素的起始索引.
 * @param {PerspectiveFrustum} [result] 存储结果的对象.
 * @returns {PerspectiveFrustum} 修改后的结果参数或如果未提供，则返回一个新的 PerspectiveFrustum 实例.
 */

PerspectiveFrustum.unpack = function (array, startingIndex, result) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("array", array);
  //>>includeEnd('debug');

  startingIndex = defaultValue(startingIndex, 0);

  if (!defined(result)) {
    result = new PerspectiveFrustum();
  }

  result.fov = array[startingIndex++];
  result.aspectRatio = array[startingIndex++];
  result.near = array[startingIndex++];
  result.far = array[startingIndex++];
  result.xOffset = array[startingIndex++];
  result.yOffset = array[startingIndex];

  return result;
};

function update(frustum) {
  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(frustum.fov) ||
    !defined(frustum.aspectRatio) ||
    !defined(frustum.near) ||
    !defined(frustum.far)
  ) {
    throw new DeveloperError(
      "fov, aspectRatio, near, or far parameters are not set.",
    );
  }
  //>>includeEnd('debug');

  const changed =
    frustum.fov !== frustum._fov ||
    frustum.aspectRatio !== frustum._aspectRatio ||
    frustum.near !== frustum._near ||
    frustum.far !== frustum._far ||
    frustum.xOffset !== frustum._xOffset ||
    frustum.yOffset !== frustum._yOffset;

  if (!changed) {
    return;
  }

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("fov", frustum.fov, 0.0);
  Check.typeOf.number.lessThan("fov", frustum.fov, Math.PI);

  Check.typeOf.number.greaterThanOrEquals(
    "aspectRatio",
    frustum.aspectRatio,
    0.0,
  );

  Check.typeOf.number.greaterThanOrEquals("near", frustum.near, 0.0);
  if (frustum.near > frustum.far) {
    throw new DeveloperError("near must be less than far.");
  }
  //>>includeEnd('debug');

  frustum._aspectRatio = frustum.aspectRatio;
  frustum._fov = frustum.fov;
  frustum._fovy =
    frustum.aspectRatio <= 1
      ? frustum.fov
      : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
  frustum._near = frustum.near;
  frustum._far = frustum.far;
  frustum._sseDenominator = 2.0 * Math.tan(0.5 * frustum._fovy);
  frustum._xOffset = frustum.xOffset;
  frustum._yOffset = frustum.yOffset;

  const f = frustum._offCenterFrustum;

  f.top = frustum.near * Math.tan(0.5 * frustum._fovy);
  f.bottom = -f.top;
  f.right = frustum.aspectRatio * f.top;
  f.left = -f.right;
  f.near = frustum.near;
  f.far = frustum.far;

  f.right += frustum.xOffset;
  f.left += frustum.xOffset;
  f.top += frustum.yOffset;
  f.bottom += frustum.yOffset;
}

Object.defineProperties(PerspectiveFrustum.prototype, {
  /**
   * 获取从视锥体计算出的透视投影矩阵。
   * 如果必要，投影矩阵将被重新计算。
   *
   * @memberof PerspectiveFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveOffCenterFrustum#projectionMatrix.
   * @see PerspectiveFrustum#infiniteProjectionMatrix
   */

  projectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.projectionMatrix;
    },
  },

  /**
   * 从视锥体计算出的透视投影矩阵，具有无限远平面。
   * @memberof PerspectiveFrustum.prototype
   * @type {Matrix4}
   * @readonly
   *
   * @see PerspectiveFrustum#projectionMatrix
   */
  infiniteProjectionMatrix: {
    get: function () {
      update(this);
      return this._offCenterFrustum.infiniteProjectionMatrix;
    },
  },

  /**
   * 获取垂直视场角，以弧度表示。
   * @memberof PerspectiveFrustum.prototype
   * @type {number|undefined}
   * @readonly
   * @default undefined
   */

  fovy: {
    get: function () {
      update(this);
      return this._fovy;
    },
  },

  /**
   * @readonly
   * @private
   */
  sseDenominator: {
    get: function () {
      update(this);
      return this._sseDenominator;
    },
  },

  /**
   * 获取从视锥体计算出的正交投影矩阵。
   * @memberof PerspectiveFrustum.prototype
   * @type {PerspectiveOffCenterFrustum}
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
 * 为此视锥体创建一个剔除体。
 *
 * @param {Cartesian3} position 眼睛的位置。
 * @param {Cartesian3} direction 视线方向。
 * @param {Cartesian3} up 上方向。
 * @returns {CullingVolume} 在给定位置和方向的剔除体。
 *
 * @example
 * // Check if a bounding volume intersects the frustum.
 * const cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
 * const intersect = cullingVolume.computeVisibility(boundingVolume);
 */
PerspectiveFrustum.prototype.computeCullingVolume = function (
  position,
  direction,
  up,
) {
  update(this);
  return this._offCenterFrustum.computeCullingVolume(position, direction, up);
};

/**
 * 返回像素在米中的宽度和高度。
 *
 * @param {number} drawingBufferWidth 绘图缓冲区的宽度。
 * @param {number} drawingBufferHeight 绘图缓冲区的高度。
 * @param {number} distance 到近平面的距离（以米为单位）。
 * @param {number} pixelRatio 从像素空间到坐标空间的缩放因子。
 * @param {Cartesian2} result 存储结果的对象。
 * @returns {Cartesian2} 修改后的结果参数或一个新的 {@link Cartesian2} 实例，其 x 和 y 属性分别为像素的宽度和高度。
 *
 * @exception {DeveloperError} drawingBufferWidth 必须大于零。
 * @exception {DeveloperError} drawingBufferHeight 必须大于零。
 * @exception {DeveloperError} pixelRatio 必须大于零。
 *
 * @example
 * // Example 1
 * // Get the width and height of a pixel.
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, 1.0, scene.pixelRatio, new Cesium.Cartesian2());
 *
 * @example
 * // Example 2
 * // Get the width and height of a pixel if the near plane was set to 'distance'.
 * // For example, get the size of a pixel of an image on a billboard.
 * const position = camera.position;
 * const direction = camera.direction;
 * const toCenter = Cesium.Cartesian3.subtract(primitive.boundingVolume.center, position, new Cesium.Cartesian3());      // vector from camera to a primitive
 * const toCenterProj = Cesium.Cartesian3.multiplyByScalar(direction, Cesium.Cartesian3.dot(direction, toCenter), new Cesium.Cartesian3()); // project vector onto camera direction vector
 * const distance = Cesium.Cartesian3.magnitude(toCenterProj);
 * const pixelSize = camera.frustum.getPixelDimensions(scene.drawingBufferWidth, scene.drawingBufferHeight, distance, scene.pixelRatio, new Cesium.Cartesian2());
 */
PerspectiveFrustum.prototype.getPixelDimensions = function (
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
 * 返回一个 PerspectiveFrustum 实例的副本。
 *
 * @param {PerspectiveFrustum} [result] 存储结果的对象.
 * @returns {PerspectiveFrustum} 修改后的结果参数或如果未提供，则返回一个新的 PerspectiveFrustum 实例。
 */

PerspectiveFrustum.prototype.clone = function (result) {
  if (!defined(result)) {
    result = new PerspectiveFrustum();
  }

  result.aspectRatio = this.aspectRatio;
  result.fov = this.fov;
  result.near = this.near;
  result.far = this.far;

  // force update of clone to compute matrices
  result._aspectRatio = undefined;
  result._fov = undefined;
  result._near = undefined;
  result._far = undefined;

  this._offCenterFrustum.clone(result._offCenterFrustum);

  return result;
};

/**
 * 按组件比较提供的 PerspectiveFrustum，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {PerspectiveFrustum} [other] 右侧的 PerspectiveFrustum。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */

PerspectiveFrustum.prototype.equals = function (other) {
  if (!defined(other) || !(other instanceof PerspectiveFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    this.fov === other.fov &&
    this.aspectRatio === other.aspectRatio &&
    this._offCenterFrustum.equals(other._offCenterFrustum)
  );
};
/**
 * 按组件比较提供的 PerspectiveFrustum，并返回
 * 如果通过绝对或相对公差测试，则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {PerspectiveFrustum} other 右侧的 PerspectiveFrustum。
 * @param {number} relativeEpsilon 用于相等性测试的相对 epsilon 容差。
 * @param {number} [absoluteEpsilon=relativeEpsilon] 用于平等测试的绝对 epsilon 容差。
 * @returns {boolean} <code>true</code> 如果 this 和 other 在提供的 epsilon 内，<code>false</code> 否则。
 */

PerspectiveFrustum.prototype.equalsEpsilon = function (
  other,
  relativeEpsilon,
  absoluteEpsilon,
) {
  if (!defined(other) || !(other instanceof PerspectiveFrustum)) {
    return false;
  }

  update(this);
  update(other);

  return (
    CesiumMath.equalsEpsilon(
      this.fov,
      other.fov,
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
export default PerspectiveFrustum;
