import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Cartographic from "../Core/Cartographic.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import EasingFunction from "../Core/EasingFunction.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidGeodesic from "../Core/EllipsoidGeodesic.js";
import Event from "../Core/Event.js";
import getTimestamp from "../Core/getTimestamp.js";
import HeadingPitchRange from "../Core/HeadingPitchRange.js";
import HeadingPitchRoll from "../Core/HeadingPitchRoll.js";
import Intersect from "../Core/Intersect.js";
import IntersectionTests from "../Core/IntersectionTests.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import OrthographicFrustum from "../Core/OrthographicFrustum.js";
import OrthographicOffCenterFrustum from "../Core/OrthographicOffCenterFrustum.js";
import PerspectiveFrustum from "../Core/PerspectiveFrustum.js";
import Quaternion from "../Core/Quaternion.js";
import Ray from "../Core/Ray.js";
import Rectangle from "../Core/Rectangle.js";
import Transforms from "../Core/Transforms.js";
import CameraFlightPath from "./CameraFlightPath.js";
import MapMode2D from "./MapMode2D.js";
import SceneMode from "./SceneMode.js";

/**
 * @typedef {object} DirectionUp
 *
 * 由一对单位向量给定的方向
 *
 * @property {Cartesian3} direction 单位“方向”向量
 * @property {Cartesian3} up 单位“上”向量
 **/

/**
 * @typedef {object} HeadingPitchRollValues
 *
 * 由数值方位角、俯仰角和翻滚角给定的方向
 *
 * @property {number} [heading=0.0] 以弧度表示的方位角
 * @property {number} [pitch=-CesiumMath.PI_OVER_TWO] 以弧度表示的俯仰角
 * @property {number} [roll=0.0] 以弧度表示的翻滚角
 **/


/**
 * 相机由位置、方向和视锥体定义。
 * <br /><br />
 * 方向形成一个正交归一基，包含视向、上向和右向 = 视向与上向的单位向量叉乘。
 * <br /><br />
 * 视锥体由 6 个平面定义。
 * 每个平面由一个 {@link Cartesian4} 对象表示，其中 x、y 和 z 组成
 * 定义平面的单位法向量，w 组成是平面距离原点/相机位置的距离。
 *
 * @alias Camera
 *
 * @constructor
 *
 * @param {Scene} scene 场景。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Camera.html|Cesium Sandcastle Camera Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Camera%20Tutorial.html|Cesium Sandcastle Camera Tutorial Example}
 * @demo {@link https://cesium.com/learn/cesiumjs-learn/cesiumjs-camera|Camera Tutorial}
 *
 * @example
 * // Create a camera looking down the negative z-axis, positioned at the origin,
 * // with a field of view of 60 degrees, and 1:1 aspect ratio.
 * const camera = new Cesium.Camera(scene);
 * camera.position = new Cesium.Cartesian3();
 * camera.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
 * camera.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
 * camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
 * camera.frustum.near = 1.0;
 * camera.frustum.far = 2.0;
 */
function Camera(scene) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');
  this._scene = scene;

  this._transform = Matrix4.clone(Matrix4.IDENTITY);
  this._invTransform = Matrix4.clone(Matrix4.IDENTITY);
  this._actualTransform = Matrix4.clone(Matrix4.IDENTITY);
  this._actualInvTransform = Matrix4.clone(Matrix4.IDENTITY);
  this._transformChanged = false;

  /**
   * 相机的位置。
   *
   * @type {Cartesian3}
   */

  this.position = new Cartesian3();
  this._position = new Cartesian3();
  this._positionWC = new Cartesian3();
  this._positionCartographic = new Cartographic();
  this._oldPositionWC = undefined;

  /**
     * 位置增量大小。
     *
     * @private
     */

  this.positionWCDeltaMagnitude = 0.0;

  /**
    * 上一帧的位置增量大小。
    *
    * @private
    */

  this.positionWCDeltaMagnitudeLastFrame = 0.0;

  /**
   * 自相机停止移动以来经过的时间（以秒为单位）。
   *
   * @private
   */

  this.timeSinceMoved = 0.0;
  this._lastMovedTimestamp = 0.0;

  /**
   * 相机的视向。
   *
   * @type {Cartesian3}
   */

  this.direction = new Cartesian3();
  this._direction = new Cartesian3();
  this._directionWC = new Cartesian3();

  /**
    * 相机的上向。
    *
    * @type {Cartesian3}
    */

  this.up = new Cartesian3();
  this._up = new Cartesian3();
  this._upWC = new Cartesian3();

  /**
   * 相机的右向。
   *
   * @type {Cartesian3}
   */

  this.right = new Cartesian3();
  this._right = new Cartesian3();
  this._rightWC = new Cartesian3();

  /**
   * 当前视野中的空间区域。
   *
   * @type {PerspectiveFrustum|PerspectiveOffCenterFrustum|OrthographicFrustum}
   * @default PerspectiveFrustum()
   *
   * @see PerspectiveFrustum
   * @see PerspectiveOffCenterFrustum
   * @see OrthographicFrustum
   */

  this.frustum = new PerspectiveFrustum();
  this.frustum.aspectRatio =
    scene.drawingBufferWidth / scene.drawingBufferHeight;
  this.frustum.fov = CesiumMath.toRadians(60.0);

  /**
   * 当未提供参数给移动方法时，相机的默认移动量。
   * @type {number}
   * @default 100000.0;
   */
  this.defaultMoveAmount = 100000.0;

  /**
   * 当未提供参数给查看方法时，相机的默认旋转量。
   * @type {number}
   * @default Math.PI / 60.0
   */
  this.defaultLookAmount = Math.PI / 60.0;

  /**
   * 当未提供参数给旋转方法时，相机的默认旋转量。
   * @type {number}
   * @default Math.PI / 3600.0
   */
  this.defaultRotateAmount = Math.PI / 3600.0;

  /**
   * 当未提供参数给缩放方法时，相机的默认移动量。
   * @type {number}
   * @default 100000.0;
   */
  this.defaultZoomAmount = 100000.0;

  /**
   * 如果设置，相机将无法朝任一方向超过此轴进行旋转。
   * @type {Cartesian3 | undefined}
   * @default undefined
   */

  this.constrainedAxis = undefined;
  /**
   * 乘以地图大小的因子，用于确定在从地表缩小时相机位置的限制。
   * 默认值为 1.5。仅在 2D 模式下有效且地图可旋转。
   * @type {number}
   * @default 1.5
   */

  this.maximumZoomFactor = 1.5;

  this._moveStart = new Event();
  this._moveEnd = new Event();

  this._changed = new Event();
  this._changedPosition = undefined;
  this._changedDirection = undefined;
  this._changedFrustum = undefined;
  this._changedHeading = undefined;
  this._changedRoll = undefined;

  /**
   * 相机在触发 <code>changed</code> 事件前必须改变的量。该值是 [0, 1] 范围内的百分比。
   * @type {number}
   * @default 0.5
   */

  this.percentageChanged = 0.5;

  this._viewMatrix = new Matrix4();
  this._invViewMatrix = new Matrix4();
  updateViewMatrix(this);

  this._mode = SceneMode.SCENE3D;
  this._modeChanged = true;
  const projection = scene.mapProjection;
  this._projection = projection;
  this._maxCoord = projection.project(
    new Cartographic(Math.PI, CesiumMath.PI_OVER_TWO),
  );
  this._max2Dfrustum = undefined;

  // set default view
  rectangleCameraPosition3D(
    this,
    Camera.DEFAULT_VIEW_RECTANGLE,
    this.position,
    true,
  );

  let mag = Cartesian3.magnitude(this.position);
  mag += mag * Camera.DEFAULT_VIEW_FACTOR;
  Cartesian3.normalize(this.position, this.position);
  Cartesian3.multiplyByScalar(this.position, mag, this.position);
}

/**
 * @private
 */
Camera.TRANSFORM_2D = new Matrix4(
  0.0,
  0.0,
  1.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
);

/**
 * @private
 */
Camera.TRANSFORM_2D_INVERSE = Matrix4.inverseTransformation(
  Camera.TRANSFORM_2D,
  new Matrix4(),
);

/**
 * 相机创建时将查看的默认矩形。
 * @type Rectangle
 */

Camera.DEFAULT_VIEW_RECTANGLE = Rectangle.fromDegrees(
  -95.0,
  -20.0,
  -70.0,
  90.0,
);

/**
 * 一个乘以相机位置的标量，并在设置相机查看矩形后将其加回。
 * 值为零表示相机会查看整个 {@link Camera#DEFAULT_VIEW_RECTANGLE}，大于零的值将使相机离范围更远，
 * 小于零的值将使相机靠近范围。
 * @type {number}
 */
Camera.DEFAULT_VIEW_FACTOR = 0.5;

/**
 * 相机飞往包含边界球体的位置时使用的默认方位角/俯仰角/范围。
 * @type HeadingPitchRange
 */

Camera.DEFAULT_OFFSET = new HeadingPitchRange(
  0.0,
  -CesiumMath.PI_OVER_FOUR,
  0.0,
);

function updateViewMatrix(camera) {
  Matrix4.computeView(
    camera._position,
    camera._direction,
    camera._up,
    camera._right,
    camera._viewMatrix,
  );
  Matrix4.multiply(
    camera._viewMatrix,
    camera._actualInvTransform,
    camera._viewMatrix,
  );
  Matrix4.inverseTransformation(camera._viewMatrix, camera._invViewMatrix);
}

function updateCameraDeltas(camera) {
  if (!defined(camera._oldPositionWC)) {
    camera._oldPositionWC = Cartesian3.clone(
      camera.positionWC,
      camera._oldPositionWC,
    );
  } else {
    camera.positionWCDeltaMagnitudeLastFrame = camera.positionWCDeltaMagnitude;
    const delta = Cartesian3.subtract(
      camera.positionWC,
      camera._oldPositionWC,
      camera._oldPositionWC,
    );
    camera.positionWCDeltaMagnitude = Cartesian3.magnitude(delta);
    camera._oldPositionWC = Cartesian3.clone(
      camera.positionWC,
      camera._oldPositionWC,
    );

    // Update move timers
    if (camera.positionWCDeltaMagnitude > 0.0) {
      camera.timeSinceMoved = 0.0;
      camera._lastMovedTimestamp = getTimestamp();
    } else {
      camera.timeSinceMoved =
        Math.max(getTimestamp() - camera._lastMovedTimestamp, 0.0) / 1000.0;
    }
  }
}

/**
 * 检查该相机是否存在预加载的飞行。
 *
 * @returns {boolean} 此相机是否在场景中有当前有效的 preloadFlightCamera 的飞行状态。
 *
 * @private
 *
 */

Camera.prototype.canPreloadFlight = function() {
  return defined(this._currentFlight) && this._mode !== SceneMode.SCENE2D;
};

Camera.prototype._updateCameraChanged = function() {
  const camera = this;

  updateCameraDeltas(camera);

  if (camera._changed.numberOfListeners === 0) {
    return;
  }

  const percentageChanged = camera.percentageChanged;

  // check heading
  const currentHeading = camera.heading;

  if (!defined(camera._changedHeading)) {
    camera._changedHeading = currentHeading;
  }

  let headingDelta =
    Math.abs(camera._changedHeading - currentHeading) % CesiumMath.TWO_PI;
  headingDelta =
    headingDelta > CesiumMath.PI
      ? CesiumMath.TWO_PI - headingDelta
      : headingDelta;

  // Since delta is computed as the shortest distance between two angles
  // the percentage is relative to the half circle.
  const headingChangedPercentage = headingDelta / Math.PI;

  if (headingChangedPercentage > percentageChanged) {
    camera._changedHeading = currentHeading;
  }

  // check roll
  const currentRoll = camera.roll;

  if (!defined(camera._changedRoll)) {
    camera._changedRoll = currentRoll;
  }

  let rollDelta =
    Math.abs(camera._changedRoll - currentRoll) % CesiumMath.TWO_PI;
  rollDelta =
    rollDelta > CesiumMath.PI ? CesiumMath.TWO_PI - rollDelta : rollDelta;

  // Since delta is computed as the shortest distance between two angles
  // the percentage is relative to the half circle.
  const rollChangedPercentage = rollDelta / Math.PI;

  if (rollChangedPercentage > percentageChanged) {
    camera._changedRoll = currentRoll;
  }
  if (
    rollChangedPercentage > percentageChanged ||
    headingChangedPercentage > percentageChanged
  ) {
    camera._changed.raiseEvent(
      Math.max(rollChangedPercentage, headingChangedPercentage),
    );
  }
  if (camera._mode === SceneMode.SCENE2D) {
    if (!defined(camera._changedFrustum)) {
      camera._changedPosition = Cartesian3.clone(
        camera.position,
        camera._changedPosition,
      );
      camera._changedFrustum = camera.frustum.clone();
      return;
    }

    const position = camera.position;
    const lastPosition = camera._changedPosition;

    const frustum = camera.frustum;
    const lastFrustum = camera._changedFrustum;

    const x0 = position.x + frustum.left;
    const x1 = position.x + frustum.right;
    const x2 = lastPosition.x + lastFrustum.left;
    const x3 = lastPosition.x + lastFrustum.right;

    const y0 = position.y + frustum.bottom;
    const y1 = position.y + frustum.top;
    const y2 = lastPosition.y + lastFrustum.bottom;
    const y3 = lastPosition.y + lastFrustum.top;

    const leftX = Math.max(x0, x2);
    const rightX = Math.min(x1, x3);
    const bottomY = Math.max(y0, y2);
    const topY = Math.min(y1, y3);

    let areaPercentage;
    if (leftX >= rightX || bottomY >= y1) {
      areaPercentage = 1.0;
    } else {
      let areaRef = lastFrustum;
      if (x0 < x2 && x1 > x3 && y0 < y2 && y1 > y3) {
        areaRef = frustum;
      }
      areaPercentage =
        1.0 -
        ((rightX - leftX) * (topY - bottomY)) /
        ((areaRef.right - areaRef.left) * (areaRef.top - areaRef.bottom));
    }

    if (areaPercentage > percentageChanged) {
      camera._changed.raiseEvent(areaPercentage);
      camera._changedPosition = Cartesian3.clone(
        camera.position,
        camera._changedPosition,
      );
      camera._changedFrustum = camera.frustum.clone(camera._changedFrustum);
    }
    return;
  }

  if (!defined(camera._changedDirection)) {
    camera._changedPosition = Cartesian3.clone(
      camera.positionWC,
      camera._changedPosition,
    );
    camera._changedDirection = Cartesian3.clone(
      camera.directionWC,
      camera._changedDirection,
    );
    return;
  }

  const dirAngle = CesiumMath.acosClamped(
    Cartesian3.dot(camera.directionWC, camera._changedDirection),
  );

  let dirPercentage;
  if (defined(camera.frustum.fovy)) {
    dirPercentage = dirAngle / (camera.frustum.fovy * 0.5);
  } else {
    dirPercentage = dirAngle;
  }

  const distance = Cartesian3.distance(
    camera.positionWC,
    camera._changedPosition,
  );
  const heightPercentage = distance / camera.positionCartographic.height;

  if (
    dirPercentage > percentageChanged ||
    heightPercentage > percentageChanged
  ) {
    camera._changed.raiseEvent(Math.max(dirPercentage, heightPercentage));
    camera._changedPosition = Cartesian3.clone(
      camera.positionWC,
      camera._changedPosition,
    );
    camera._changedDirection = Cartesian3.clone(
      camera.directionWC,
      camera._changedDirection,
    );
  }
};

function convertTransformForColumbusView(camera) {
  Transforms.basisTo2D(
    camera._projection,
    camera._transform,
    camera._actualTransform,
  );
}

const scratchCartographic = new Cartographic();
const scratchCartesian3Projection = new Cartesian3();
const scratchCartesian3 = new Cartesian3();
const scratchCartesian4Origin = new Cartesian4();
const scratchCartesian4NewOrigin = new Cartesian4();
const scratchCartesian4NewXAxis = new Cartesian4();
const scratchCartesian4NewYAxis = new Cartesian4();
const scratchCartesian4NewZAxis = new Cartesian4();

function convertTransformFor2D(camera) {
  const projection = camera._projection;
  const ellipsoid = projection.ellipsoid;

  const origin = Matrix4.getColumn(
    camera._transform,
    3,
    scratchCartesian4Origin,
  );
  const cartographic = ellipsoid.cartesianToCartographic(
    origin,
    scratchCartographic,
  );

  const projectedPosition = projection.project(
    cartographic,
    scratchCartesian3Projection,
  );
  const newOrigin = scratchCartesian4NewOrigin;
  newOrigin.x = projectedPosition.z;
  newOrigin.y = projectedPosition.x;
  newOrigin.z = projectedPosition.y;
  newOrigin.w = 1.0;

  const newZAxis = Cartesian4.clone(
    Cartesian4.UNIT_X,
    scratchCartesian4NewZAxis,
  );

  const xAxis = Cartesian4.add(
    Matrix4.getColumn(camera._transform, 0, scratchCartesian3),
    origin,
    scratchCartesian3,
  );
  ellipsoid.cartesianToCartographic(xAxis, cartographic);

  projection.project(cartographic, projectedPosition);
  const newXAxis = scratchCartesian4NewXAxis;
  newXAxis.x = projectedPosition.z;
  newXAxis.y = projectedPosition.x;
  newXAxis.z = projectedPosition.y;
  newXAxis.w = 0.0;

  Cartesian3.subtract(newXAxis, newOrigin, newXAxis);
  newXAxis.x = 0.0;

  const newYAxis = scratchCartesian4NewYAxis;
  if (Cartesian3.magnitudeSquared(newXAxis) > CesiumMath.EPSILON10) {
    Cartesian3.cross(newZAxis, newXAxis, newYAxis);
  } else {
    const yAxis = Cartesian4.add(
      Matrix4.getColumn(camera._transform, 1, scratchCartesian3),
      origin,
      scratchCartesian3,
    );
    ellipsoid.cartesianToCartographic(yAxis, cartographic);

    projection.project(cartographic, projectedPosition);
    newYAxis.x = projectedPosition.z;
    newYAxis.y = projectedPosition.x;
    newYAxis.z = projectedPosition.y;
    newYAxis.w = 0.0;

    Cartesian3.subtract(newYAxis, newOrigin, newYAxis);
    newYAxis.x = 0.0;

    if (Cartesian3.magnitudeSquared(newYAxis) < CesiumMath.EPSILON10) {
      Cartesian4.clone(Cartesian4.UNIT_Y, newXAxis);
      Cartesian4.clone(Cartesian4.UNIT_Z, newYAxis);
    }
  }

  Cartesian3.cross(newYAxis, newZAxis, newXAxis);
  Cartesian3.normalize(newXAxis, newXAxis);
  Cartesian3.cross(newZAxis, newXAxis, newYAxis);
  Cartesian3.normalize(newYAxis, newYAxis);

  Matrix4.setColumn(
    camera._actualTransform,
    0,
    newXAxis,
    camera._actualTransform,
  );
  Matrix4.setColumn(
    camera._actualTransform,
    1,
    newYAxis,
    camera._actualTransform,
  );
  Matrix4.setColumn(
    camera._actualTransform,
    2,
    newZAxis,
    camera._actualTransform,
  );
  Matrix4.setColumn(
    camera._actualTransform,
    3,
    newOrigin,
    camera._actualTransform,
  );
}

const scratchCartesian = new Cartesian3();

function updateMembers(camera) {
  const mode = camera._mode;

  let heightChanged = false;
  let height = 0.0;
  if (mode === SceneMode.SCENE2D) {
    height = camera.frustum.right - camera.frustum.left;
    heightChanged = height !== camera._positionCartographic.height;
  }

  let position = camera._position;
  const positionChanged =
    !Cartesian3.equals(position, camera.position) || heightChanged;
  if (positionChanged) {
    position = Cartesian3.clone(camera.position, camera._position);
  }

  let direction = camera._direction;
  const directionChanged = !Cartesian3.equals(direction, camera.direction);
  if (directionChanged) {
    Cartesian3.normalize(camera.direction, camera.direction);
    direction = Cartesian3.clone(camera.direction, camera._direction);
  }

  let up = camera._up;
  const upChanged = !Cartesian3.equals(up, camera.up);
  if (upChanged) {
    Cartesian3.normalize(camera.up, camera.up);
    up = Cartesian3.clone(camera.up, camera._up);
  }

  let right = camera._right;
  const rightChanged = !Cartesian3.equals(right, camera.right);
  if (rightChanged) {
    Cartesian3.normalize(camera.right, camera.right);
    right = Cartesian3.clone(camera.right, camera._right);
  }

  const transformChanged = camera._transformChanged || camera._modeChanged;
  camera._transformChanged = false;

  if (transformChanged) {
    Matrix4.inverseTransformation(camera._transform, camera._invTransform);

    if (
      camera._mode === SceneMode.COLUMBUS_VIEW ||
      camera._mode === SceneMode.SCENE2D
    ) {
      if (Matrix4.equals(Matrix4.IDENTITY, camera._transform)) {
        Matrix4.clone(Camera.TRANSFORM_2D, camera._actualTransform);
      } else if (camera._mode === SceneMode.COLUMBUS_VIEW) {
        convertTransformForColumbusView(camera);
      } else {
        convertTransformFor2D(camera);
      }
    } else {
      Matrix4.clone(camera._transform, camera._actualTransform);
    }

    Matrix4.inverseTransformation(
      camera._actualTransform,
      camera._actualInvTransform,
    );

    camera._modeChanged = false;
  }

  const transform = camera._actualTransform;

  if (positionChanged || transformChanged) {
    camera._positionWC = Matrix4.multiplyByPoint(
      transform,
      position,
      camera._positionWC,
    );

    // Compute the Cartographic position of the camera.
    if (mode === SceneMode.SCENE3D || mode === SceneMode.MORPHING) {
      camera._positionCartographic =
        camera._projection.ellipsoid.cartesianToCartographic(
          camera._positionWC,
          camera._positionCartographic,
        );
    } else {
      // The camera position is expressed in the 2D coordinate system where the Y axis is to the East,
      // the Z axis is to the North, and the X axis is out of the map.  Express them instead in the ENU axes where
      // X is to the East, Y is to the North, and Z is out of the local horizontal plane.
      const positionENU = scratchCartesian;
      positionENU.x = camera._positionWC.y;
      positionENU.y = camera._positionWC.z;
      positionENU.z = camera._positionWC.x;

      // In 2D, the camera height is always 12.7 million meters.
      // The apparent height is equal to half the frustum width.
      if (mode === SceneMode.SCENE2D) {
        positionENU.z = height;
      }

      camera._projection.unproject(positionENU, camera._positionCartographic);
    }
  }

  if (directionChanged || upChanged || rightChanged) {
    const det = Cartesian3.dot(
      direction,
      Cartesian3.cross(up, right, scratchCartesian),
    );
    if (Math.abs(1.0 - det) > CesiumMath.EPSILON2) {
      //orthonormalize axes
      const invUpMag = 1.0 / Cartesian3.magnitudeSquared(up);
      const scalar = Cartesian3.dot(up, direction) * invUpMag;
      const w0 = Cartesian3.multiplyByScalar(
        direction,
        scalar,
        scratchCartesian,
      );
      up = Cartesian3.normalize(
        Cartesian3.subtract(up, w0, camera._up),
        camera._up,
      );
      Cartesian3.clone(up, camera.up);

      right = Cartesian3.cross(direction, up, camera._right);
      Cartesian3.clone(right, camera.right);
    }
  }

  if (directionChanged || transformChanged) {
    camera._directionWC = Matrix4.multiplyByPointAsVector(
      transform,
      direction,
      camera._directionWC,
    );
    Cartesian3.normalize(camera._directionWC, camera._directionWC);
  }

  if (upChanged || transformChanged) {
    camera._upWC = Matrix4.multiplyByPointAsVector(transform, up, camera._upWC);
    Cartesian3.normalize(camera._upWC, camera._upWC);
  }

  if (rightChanged || transformChanged) {
    camera._rightWC = Matrix4.multiplyByPointAsVector(
      transform,
      right,
      camera._rightWC,
    );
    Cartesian3.normalize(camera._rightWC, camera._rightWC);
  }

  if (
    positionChanged ||
    directionChanged ||
    upChanged ||
    rightChanged ||
    transformChanged
  ) {
    updateViewMatrix(camera);
  }
}

function getHeading(direction, up) {
  let heading;
  if (
    !CesiumMath.equalsEpsilon(Math.abs(direction.z), 1.0, CesiumMath.EPSILON3)
  ) {
    heading = Math.atan2(direction.y, direction.x) - CesiumMath.PI_OVER_TWO;
  } else {
    heading = Math.atan2(up.y, up.x) - CesiumMath.PI_OVER_TWO;
  }

  return CesiumMath.TWO_PI - CesiumMath.zeroToTwoPi(heading);
}

function getPitch(direction) {
  return CesiumMath.PI_OVER_TWO - CesiumMath.acosClamped(direction.z);
}

function getRoll(direction, up, right) {
  let roll = 0.0;
  if (
    !CesiumMath.equalsEpsilon(Math.abs(direction.z), 1.0, CesiumMath.EPSILON3)
  ) {
    roll = Math.atan2(-right.z, up.z);
    roll = CesiumMath.zeroToTwoPi(roll + CesiumMath.TWO_PI);
  }

  return roll;
}

const scratchHPRMatrix1 = new Matrix4();
const scratchHPRMatrix2 = new Matrix4();

Object.defineProperties(Camera.prototype, {
  /**
 * 获取相机的参考框架。该变换的逆矩阵附加到视图矩阵中。
 * @memberof Camera.prototype
 *
 * @type {Matrix4}
 * @readonly
 *
 * @default {@link Matrix4.IDENTITY}
 */
  transform: {
    get: function() {
      return this._transform;
    },
  },

  /**
   * 获取相机的逆变换。
   * @memberof Camera.prototype
   *
   * @type {Matrix4}
   * @readonly
   *
   * @default {@link Matrix4.IDENTITY}
   */
  inverseTransform: {
    get: function() {
      updateMembers(this);
      return this._invTransform;
    },
  },

  /**
   * 获取视图矩阵。
   * @memberof Camera.prototype
   *
   * @type {Matrix4}
   * @readonly
   *
   * @see Camera#inverseViewMatrix
   */

  viewMatrix: {
    get: function() {
      updateMembers(this);
      return this._viewMatrix;
    },
  },

  /**
   * 获取逆视图矩阵。
   * @memberof Camera.prototype
   *
   * @type {Matrix4}
   * @readonly
   *
   * @see Camera#viewMatrix
   */
  inverseViewMatrix: {
    get: function() {
      updateMembers(this);
      return this._invViewMatrix;
    },
  },

  /**
   * 获取相机的 {@link Cartographic} 位置，经度和纬度以弧度表示，高度以米为单位。
   * 在 2D 和哥伦布视图中，当相机超出地图范围时，返回的经度和纬度可能会超出有效范围。
   * @memberof Camera.prototype
   *
   * @type {Cartographic}
   * @readonly
   */

  positionCartographic: {
    get: function() {
      updateMembers(this);
      return this._positionCartographic;
    },
  },

  /**
   * 获取相机在世界坐标中的位置。
   * @memberof Camera.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */
  positionWC: {
    get: function() {
      updateMembers(this);
      return this._positionWC;
    },
  },

  /**
   * 获取相机在世界坐标中的视向。
   * @memberof Camera.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */

  directionWC: {
    get: function() {
      updateMembers(this);
      return this._directionWC;
    },
  },

  /**
   * 获取相机在世界坐标中的上向。
   * @memberof Camera.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */

  upWC: {
    get: function() {
      updateMembers(this);
      return this._upWC;
    },
  },

  /**
   * 获取相机在世界坐标中的右向。
   * @memberof Camera.prototype
   *
   * @type {Cartesian3}
   * @readonly
   */
  rightWC: {
    get: function() {
      updateMembers(this);
      return this._rightWC;
    },
  },

  /**
   * 获取相机的方位角（以弧度表示）。
   * @memberof Camera.prototype
   *
   * @type {number}
   * @readonly
   */

  heading: {
    get: function() {
      if (this._mode !== SceneMode.MORPHING) {
        const ellipsoid = this._projection.ellipsoid;

        const oldTransform = Matrix4.clone(this._transform, scratchHPRMatrix1);
        const transform = Transforms.eastNorthUpToFixedFrame(
          this.positionWC,
          ellipsoid,
          scratchHPRMatrix2,
        );
        this._setTransform(transform);

        const heading = getHeading(this.direction, this.up);

        this._setTransform(oldTransform);

        return heading;
      }

      return undefined;
    },
  },

  /**
    * 获取相机的俯仰角（以弧度表示）。
    * @memberof Camera.prototype
    *
    * @type {number}
    * @readonly
    */

  pitch: {
    get: function() {
      if (this._mode !== SceneMode.MORPHING) {
        const ellipsoid = this._projection.ellipsoid;

        const oldTransform = Matrix4.clone(this._transform, scratchHPRMatrix1);
        const transform = Transforms.eastNorthUpToFixedFrame(
          this.positionWC,
          ellipsoid,
          scratchHPRMatrix2,
        );
        this._setTransform(transform);

        const pitch = getPitch(this.direction);

        this._setTransform(oldTransform);

        return pitch;
      }

      return undefined;
    },
  },

  /**
   * 获取相机的翻滚角（以弧度表示）。
   * @memberof Camera.prototype
   *
   * @type {number}
   * @readonly
   */

  roll: {
    get: function() {
      if (this._mode !== SceneMode.MORPHING) {
        const ellipsoid = this._projection.ellipsoid;

        const oldTransform = Matrix4.clone(this._transform, scratchHPRMatrix1);
        const transform = Transforms.eastNorthUpToFixedFrame(
          this.positionWC,
          ellipsoid,
          scratchHPRMatrix2,
        );
        this._setTransform(transform);

        const roll = getRoll(this.direction, this.up, this.right);

        this._setTransform(oldTransform);

        return roll;
      }

      return undefined;
    },
  },

  /**
    * 获取相机开始移动时将被触发的事件。
    * @memberof Camera.prototype
    * @type {Event}
    * @readonly
    */

  moveStart: {
    get: function() {
      return this._moveStart;
    },
  },

 /**
   * 获取相机停止移动时将被触发的事件。
   * @memberof Camera.prototype
   * @type {Event}
   * @readonly
   */

  moveEnd: {
    get: function() {
      return this._moveEnd;
    },
  },

  /**
   * 获取相机发生变化时将被触发的事件，变化量由 <code>percentageChanged</code> 决定。
   * @memberof Camera.prototype
   * @type {Event}
   * @readonly
   */

  changed: {
    get: function() {
      return this._changed;
    },
  },
});

/**
 * @private
 */
Camera.prototype.update = function(mode) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(mode)) {
    throw new DeveloperError("mode is required.");
  }
  if (
    mode === SceneMode.SCENE2D &&
    !(this.frustum instanceof OrthographicOffCenterFrustum)
  ) {
    throw new DeveloperError(
      "An OrthographicOffCenterFrustum is required in 2D.",
    );
  }
  if (
    (mode === SceneMode.SCENE3D || mode === SceneMode.COLUMBUS_VIEW) &&
    !(this.frustum instanceof PerspectiveFrustum) &&
    !(this.frustum instanceof OrthographicFrustum)
  ) {
    throw new DeveloperError(
      "A PerspectiveFrustum or OrthographicFrustum is required in 3D and Columbus view",
    );
  }
  //>>includeEnd('debug');

  let updateFrustum = false;
  if (mode !== this._mode) {
    this._mode = mode;
    this._modeChanged = mode !== SceneMode.MORPHING;
    updateFrustum = this._mode === SceneMode.SCENE2D;
  }

  if (updateFrustum) {
    const frustum = (this._max2Dfrustum = this.frustum.clone());

    //>>includeStart('debug', pragmas.debug);
    if (!(frustum instanceof OrthographicOffCenterFrustum)) {
      throw new DeveloperError(
        "The camera frustum is expected to be orthographic for 2D camera control.",
      );
    }
    //>>includeEnd('debug');

    const maxZoomOut = 2.0;
    const ratio = frustum.top / frustum.right;
    frustum.right = this._maxCoord.x * maxZoomOut;
    frustum.left = -frustum.right;
    frustum.top = ratio * frustum.right;
    frustum.bottom = -frustum.top;
  }

  if (this._mode === SceneMode.SCENE2D) {
    clampMove2D(this, this.position);
  }
};

const setTransformPosition = new Cartesian3();
const setTransformUp = new Cartesian3();
const setTransformDirection = new Cartesian3();

Camera.prototype._setTransform = function(transform) {
  const position = Cartesian3.clone(this.positionWC, setTransformPosition);
  const up = Cartesian3.clone(this.upWC, setTransformUp);
  const direction = Cartesian3.clone(this.directionWC, setTransformDirection);

  Matrix4.clone(transform, this._transform);
  this._transformChanged = true;
  updateMembers(this);
  const inverse = this._actualInvTransform;

  Matrix4.multiplyByPoint(inverse, position, this.position);
  Matrix4.multiplyByPointAsVector(inverse, direction, this.direction);
  Matrix4.multiplyByPointAsVector(inverse, up, this.up);
  Cartesian3.cross(this.direction, this.up, this.right);

  updateMembers(this);
};

const scratchAdjustOrthographicFrustumMousePosition = new Cartesian2();
const scratchPickRay = new Ray();
const scratchRayIntersection = new Cartesian3();
const scratchDepthIntersection = new Cartesian3();

function calculateOrthographicFrustumWidth(camera) {
  // Camera is fixed to an object, so keep frustum width constant.
  if (!Matrix4.equals(Matrix4.IDENTITY, camera.transform)) {
    return Cartesian3.magnitude(camera.position);
  }

  const scene = camera._scene;
  const globe = scene.globe;

  const mousePosition = scratchAdjustOrthographicFrustumMousePosition;
  mousePosition.x = scene.drawingBufferWidth / 2.0;
  mousePosition.y = scene.drawingBufferHeight / 2.0;

  let rayIntersection;
  if (defined(globe)) {
    const ray = camera.getPickRay(mousePosition, scratchPickRay);
    rayIntersection = globe.pickWorldCoordinates(
      ray,
      scene,
      true,
      scratchRayIntersection,
    );
  }

  let depthIntersection;
  if (scene.pickPositionSupported) {
    depthIntersection = scene.pickPositionWorldCoordinates(
      mousePosition,
      scratchDepthIntersection,
    );
  }

  let distance;
  if (defined(rayIntersection) || defined(depthIntersection)) {
    const depthDistance = defined(depthIntersection)
      ? Cartesian3.distance(depthIntersection, camera.positionWC)
      : Number.POSITIVE_INFINITY;
    const rayDistance = defined(rayIntersection)
      ? Cartesian3.distance(rayIntersection, camera.positionWC)
      : Number.POSITIVE_INFINITY;
    distance = Math.min(depthDistance, rayDistance);
  } else {
    distance = Math.max(camera.positionCartographic.height, 0.0);
  }
  return distance;
}

Camera.prototype._adjustOrthographicFrustum = function(zooming) {
  if (!(this.frustum instanceof OrthographicFrustum)) {
    return;
  }

  if (!zooming && this._positionCartographic.height < 150000.0) {
    return;
  }

  this.frustum.width = calculateOrthographicFrustumWidth(this);
};

const scratchSetViewCartesian = new Cartesian3();
const scratchSetViewTransform1 = new Matrix4();
const scratchSetViewTransform2 = new Matrix4();
const scratchSetViewQuaternion = new Quaternion();
const scratchSetViewMatrix3 = new Matrix3();
const scratchSetViewCartographic = new Cartographic();

function setView3D(camera, position, hpr) {
  //>>includeStart('debug', pragmas.debug);
  if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
    throw new DeveloperError("position has a NaN component");
  }
  //>>includeEnd('debug');
  const currentTransform = Matrix4.clone(
    camera.transform,
    scratchSetViewTransform1,
  );
  const localTransform = Transforms.eastNorthUpToFixedFrame(
    position,
    camera._projection.ellipsoid,
    scratchSetViewTransform2,
  );
  camera._setTransform(localTransform);

  Cartesian3.clone(Cartesian3.ZERO, camera.position);
  hpr.heading = hpr.heading - CesiumMath.PI_OVER_TWO;

  const rotQuat = Quaternion.fromHeadingPitchRoll(
    hpr,
    scratchSetViewQuaternion,
  );
  const rotMat = Matrix3.fromQuaternion(rotQuat, scratchSetViewMatrix3);

  Matrix3.getColumn(rotMat, 0, camera.direction);
  Matrix3.getColumn(rotMat, 2, camera.up);
  Cartesian3.cross(camera.direction, camera.up, camera.right);

  camera._setTransform(currentTransform);

  camera._adjustOrthographicFrustum(true);
}

function setViewCV(camera, position, hpr, convert) {
  const currentTransform = Matrix4.clone(
    camera.transform,
    scratchSetViewTransform1,
  );
  camera._setTransform(Matrix4.IDENTITY);

  if (!Cartesian3.equals(position, camera.positionWC)) {
    if (convert) {
      const projection = camera._projection;
      const cartographic = projection.ellipsoid.cartesianToCartographic(
        position,
        scratchSetViewCartographic,
      );
      position = projection.project(cartographic, scratchSetViewCartesian);
    }
    Cartesian3.clone(position, camera.position);
  }
  hpr.heading = hpr.heading - CesiumMath.PI_OVER_TWO;

  const rotQuat = Quaternion.fromHeadingPitchRoll(
    hpr,
    scratchSetViewQuaternion,
  );
  const rotMat = Matrix3.fromQuaternion(rotQuat, scratchSetViewMatrix3);

  Matrix3.getColumn(rotMat, 0, camera.direction);
  Matrix3.getColumn(rotMat, 2, camera.up);
  Cartesian3.cross(camera.direction, camera.up, camera.right);

  camera._setTransform(currentTransform);

  camera._adjustOrthographicFrustum(true);
}

function setView2D(camera, position, hpr, convert) {
  const currentTransform = Matrix4.clone(
    camera.transform,
    scratchSetViewTransform1,
  );
  camera._setTransform(Matrix4.IDENTITY);

  if (!Cartesian3.equals(position, camera.positionWC)) {
    if (convert) {
      const projection = camera._projection;
      const cartographic = projection.ellipsoid.cartesianToCartographic(
        position,
        scratchSetViewCartographic,
      );
      position = projection.project(cartographic, scratchSetViewCartesian);
    }

    Cartesian2.clone(position, camera.position);

    const newLeft = -position.z * 0.5;
    const newRight = -newLeft;

    const frustum = camera.frustum;
    if (newRight > newLeft) {
      const ratio = frustum.top / frustum.right;
      frustum.right = newRight;
      frustum.left = newLeft;
      frustum.top = frustum.right * ratio;
      frustum.bottom = -frustum.top;
    }
  }

  if (camera._scene.mapMode2D === MapMode2D.ROTATE) {
    hpr.heading = hpr.heading - CesiumMath.PI_OVER_TWO;
    hpr.pitch = -CesiumMath.PI_OVER_TWO;
    hpr.roll = 0.0;
    const rotQuat = Quaternion.fromHeadingPitchRoll(
      hpr,
      scratchSetViewQuaternion,
    );
    const rotMat = Matrix3.fromQuaternion(rotQuat, scratchSetViewMatrix3);

    Matrix3.getColumn(rotMat, 2, camera.up);
    Cartesian3.cross(camera.direction, camera.up, camera.right);
  }

  camera._setTransform(currentTransform);
}

const scratchToHPRDirection = new Cartesian3();
const scratchToHPRUp = new Cartesian3();
const scratchToHPRRight = new Cartesian3();

function directionUpToHeadingPitchRoll(camera, position, orientation, result) {
  const direction = Cartesian3.clone(
    orientation.direction,
    scratchToHPRDirection,
  );
  const up = Cartesian3.clone(orientation.up, scratchToHPRUp);

  if (camera._scene.mode === SceneMode.SCENE3D) {
    const ellipsoid = camera._projection.ellipsoid;
    const transform = Transforms.eastNorthUpToFixedFrame(
      position,
      ellipsoid,
      scratchHPRMatrix1,
    );
    const invTransform = Matrix4.inverseTransformation(
      transform,
      scratchHPRMatrix2,
    );

    Matrix4.multiplyByPointAsVector(invTransform, direction, direction);
    Matrix4.multiplyByPointAsVector(invTransform, up, up);
  }

  const right = Cartesian3.cross(direction, up, scratchToHPRRight);

  result.heading = getHeading(direction, up);
  result.pitch = getPitch(direction);
  result.roll = getRoll(direction, up, right);

  return result;
}

const scratchSetViewOptions = {
  destination: undefined,
  orientation: {
    direction: undefined,
    up: undefined,
    heading: undefined,
    pitch: undefined,
    roll: undefined,
  },
  convert: undefined,
  endTransform: undefined,
};

const scratchHpr = new HeadingPitchRoll();
/**
 * 设置相机的位置、方向和变换。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3|Rectangle} [options.destination] 相机在世界坐标中的最终位置，或从俯视图中可见的矩形。
 * @param {HeadingPitchRollValues|DirectionUp} [options.orientation] 一个对象，包含方向和上向属性或方位角、俯仰角和翻滚角属性。默认情况下，方向将指向 3D 中框架的中心，在哥伦布视图中指向负 z 方向。上向将在 3D 中指向当地的北方，在哥伦布视图中指向正 y 方向。在无限滚动模式下，2D 时不使用方向。
 * @param {Matrix4} [options.endTransform] 表示相机参考框架的变换矩阵。
 * @param {boolean} [options.convert] 是否将目标从世界坐标转换为场景坐标（仅在不使用 3D 时相关）。默认值为 <code>true</code>.
 *
 * @example
 * // 1. Set position with a top-down view
 * viewer.camera.setView({
 *     destination : Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0)
 * });
 *
 * // 2 Set view with heading, pitch and roll
 * viewer.camera.setView({
 *     destination : cartesianPosition,
 *     orientation: {
 *         heading : Cesium.Math.toRadians(90.0), // east, default value is 0.0 (north)
 *         pitch : Cesium.Math.toRadians(-90),    // default value (looking down)
 *         roll : 0.0                             // default value
 *     }
 * });
 *
 * // 3. Change heading, pitch and roll with the camera position remaining the same.
 * viewer.camera.setView({
 *     orientation: {
 *         heading : Cesium.Math.toRadians(90.0), // east, default value is 0.0 (north)
 *         pitch : Cesium.Math.toRadians(-90),    // default value (looking down)
 *         roll : 0.0                             // default value
 *     }
 * });
 *
 *
 * // 4. View rectangle with a top-down view
 * viewer.camera.setView({
 *     destination : Cesium.Rectangle.fromDegrees(west, south, east, north)
 * });
 *
 * // 5. Set position with an orientation using unit vectors.
 * viewer.camera.setView({
 *     destination : Cesium.Cartesian3.fromDegrees(-122.19, 46.25, 5000.0),
 *     orientation : {
 *         direction : new Cesium.Cartesian3(-0.04231243104240401, -0.20123236049443421, -0.97862924300734),
 *         up : new Cesium.Cartesian3(-0.47934589305293746, -0.8553216253114552, 0.1966022179118339)
 *     }
 * });
 */
Camera.prototype.setView = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  let orientation = defaultValue(
    options.orientation,
    defaultValue.EMPTY_OBJECT,
  );

  const mode = this._mode;
  if (mode === SceneMode.MORPHING) {
    return;
  }

  if (defined(options.endTransform)) {
    this._setTransform(options.endTransform);
  }

  let convert = defaultValue(options.convert, true);
  let destination = defaultValue(
    options.destination,
    Cartesian3.clone(this.positionWC, scratchSetViewCartesian),
  );
  if (defined(destination) && defined(destination.west)) {
    destination = this.getRectangleCameraCoordinates(
      destination,
      scratchSetViewCartesian,
    );
    //>>includeStart('debug', pragmas.debug);
    // destination.z may be null in 2D, but .x and .y should be numeric
    if (isNaN(destination.x) || isNaN(destination.y)) {
      throw new DeveloperError(`destination has a NaN component`);
    }
    //>>includeEnd('debug');
    convert = false;
  }

  if (defined(orientation.direction)) {
    orientation = directionUpToHeadingPitchRoll(
      this,
      destination,
      orientation,
      scratchSetViewOptions.orientation,
    );
  }

  scratchHpr.heading = defaultValue(orientation.heading, 0.0);
  scratchHpr.pitch = defaultValue(orientation.pitch, -CesiumMath.PI_OVER_TWO);
  scratchHpr.roll = defaultValue(orientation.roll, 0.0);

  if (mode === SceneMode.SCENE3D) {
    setView3D(this, destination, scratchHpr);
  } else if (mode === SceneMode.SCENE2D) {
    setView2D(this, destination, scratchHpr, convert);
  } else {
    setViewCV(this, destination, scratchHpr, convert);
  }
};

const pitchScratch = new Cartesian3();
/**
 * 将相机飞至家园视图。使用 {@link Camera#.DEFAULT_VIEW_RECTANGLE} 设置
 * 3D 场景的默认视图。2D 和哥伦布视图的家园视图显示整个地图。
 *
 * @param {number} [duration] 飞行的持续时间（以秒为单位）。如果省略，Cesium 会尝试根据飞行的距离计算理想的持续时间。参见 {@link Camera#flyTo}
 */

Camera.prototype.flyHome = function(duration) {
  const mode = this._mode;

  if (mode === SceneMode.MORPHING) {
    this._scene.completeMorph();
  }

  if (mode === SceneMode.SCENE2D) {
    this.flyTo({
      destination: Camera.DEFAULT_VIEW_RECTANGLE,
      duration: duration,
      endTransform: Matrix4.IDENTITY,
    });
  } else if (mode === SceneMode.SCENE3D) {
    const destination = this.getRectangleCameraCoordinates(
      Camera.DEFAULT_VIEW_RECTANGLE,
    );

    let mag = Cartesian3.magnitude(destination);
    mag += mag * Camera.DEFAULT_VIEW_FACTOR;
    Cartesian3.normalize(destination, destination);
    Cartesian3.multiplyByScalar(destination, mag, destination);

    this.flyTo({
      destination: destination,
      duration: duration,
      endTransform: Matrix4.IDENTITY,
    });
  } else if (mode === SceneMode.COLUMBUS_VIEW) {
    const maxRadii = this._projection.ellipsoid.maximumRadius;
    let position = new Cartesian3(0.0, -1.0, 1.0);
    position = Cartesian3.multiplyByScalar(
      Cartesian3.normalize(position, position),
      5.0 * maxRadii,
      position,
    );
    this.flyTo({
      destination: position,
      duration: duration,
      orientation: {
        heading: 0.0,
        pitch: -Math.acos(Cartesian3.normalize(position, pitchScratch).z),
        roll: 0.0,
      },
      endTransform: Matrix4.IDENTITY,
      convert: false,
    });
  }
};

/**
 * 将向量或点从世界坐标转换到相机的参考框架。
 *
 * @param {Cartesian4} cartesian 要转换的向量或点。
 * @param {Cartesian4} [result] 存储结果的对象。
 * @returns {Cartesian4} 转换后的向量或点。
 */

Camera.prototype.worldToCameraCoordinates = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian4();
  }
  updateMembers(this);
  return Matrix4.multiplyByVector(this._actualInvTransform, cartesian, result);
};

/**
 * 将点从世界坐标转换到相机的参考框架。
 *
 * @param {Cartesian3} cartesian 要转换的点。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 转换后的点。
 */

Camera.prototype.worldToCameraCoordinatesPoint = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }
  updateMembers(this);
  return Matrix4.multiplyByPoint(this._actualInvTransform, cartesian, result);
};

/**
 * 将向量从世界坐标转换到相机的参考框架。
 *
 * @param {Cartesian3} cartesian 要转换的向量。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 转换后的向量。
 */

Camera.prototype.worldToCameraCoordinatesVector = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }
  updateMembers(this);
  return Matrix4.multiplyByPointAsVector(
    this._actualInvTransform,
    cartesian,
    result,
  );
};

/**
 * 将向量或点从相机的参考框架转换到世界坐标。
 *
 * @param {Cartesian4} cartesian 要转换的向量或点。
 * @param {Cartesian4} [result] 存储结果的对象。
 * @returns {Cartesian4} 转换后的向量或点。
 */

Camera.prototype.cameraToWorldCoordinates = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian4();
  }
  updateMembers(this);
  return Matrix4.multiplyByVector(this._actualTransform, cartesian, result);
};

/**
 * 将点从相机的参考框架转换到世界坐标。
 *
 * @param {Cartesian3} cartesian 要转换的点。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 转换后的点。
 */

Camera.prototype.cameraToWorldCoordinatesPoint = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }
  updateMembers(this);
  return Matrix4.multiplyByPoint(this._actualTransform, cartesian, result);
};

/**
 * 将向量从相机的参考框架转换到世界坐标。
 *
 * @param {Cartesian3} cartesian 要转换的向量。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3} 转换后的向量。
 */

Camera.prototype.cameraToWorldCoordinatesVector = function(cartesian, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartesian)) {
    throw new DeveloperError("cartesian is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian3();
  }
  updateMembers(this);
  return Matrix4.multiplyByPointAsVector(
    this._actualTransform,
    cartesian,
    result,
  );
};

function clampMove2D(camera, position) {
  const rotatable2D = camera._scene.mapMode2D === MapMode2D.ROTATE;
  const maxProjectedX = camera._maxCoord.x;
  const maxProjectedY = camera._maxCoord.y;

  let minX;
  let maxX;
  if (rotatable2D) {
    maxX = maxProjectedX;
    minX = -maxX;
  } else {
    maxX = position.x - maxProjectedX * 2.0;
    minX = position.x + maxProjectedX * 2.0;
  }

  if (position.x > maxProjectedX) {
    position.x = maxX;
  }
  if (position.x < -maxProjectedX) {
    position.x = minX;
  }

  if (position.y > maxProjectedY) {
    position.y = maxProjectedY;
  }
  if (position.y < -maxProjectedY) {
    position.y = -maxProjectedY;
  }
}

const moveScratch = new Cartesian3();
/**
 * 沿着 <code>方向</code> 按 <code>量</code> 移动相机的位置。
 *
 * @param {Cartesian3} direction 移动的方向。
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveBackward
 * @see Camera#moveForward
 * @see Camera#moveLeft
 * @see Camera#moveRight
 * @see Camera#moveUp
 * @see Camera#moveDown
 */

Camera.prototype.move = function(direction, amount) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(direction)) {
    throw new DeveloperError("direction is required.");
  }
  //>>includeEnd('debug');

  const cameraPosition = this.position;
  Cartesian3.multiplyByScalar(direction, amount, moveScratch);
  Cartesian3.add(cameraPosition, moveScratch, cameraPosition);

  if (this._mode === SceneMode.SCENE2D) {
    clampMove2D(this, cameraPosition);
  }
  this._adjustOrthographicFrustum(true);
};
/**
 * 沿着相机的视向按 <code>量</code> 移动相机的位置。
 * 在 2D 模式下，这将缩放相机而不是移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveBackward
 */

Camera.prototype.moveForward = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);

  if (this._mode === SceneMode.SCENE2D) {
    // 2D mode
    zoom2D(this, amount);
  } else {
    // 3D or Columbus view mode
    this.move(this.direction, amount);
  }
};

/**
 * 沿着相机视向的相反方向按 <code>量</code> 移动相机的位置。
 * 在 2D 模式下，这将缩小相机而不是移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveForward
 */

Camera.prototype.moveBackward = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);

  if (this._mode === SceneMode.SCENE2D) {
    // 2D mode
    zoom2D(this, -amount);
  } else {
    // 3D or Columbus view mode
    this.move(this.direction, -amount);
  }
};

/**
 * 沿着相机的上向按 <code>量</code> 移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveDown
 */

Camera.prototype.moveUp = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);
  this.move(this.up, amount);
};

/**
 * 沿着相机上向的相反方向按 <code>量</code> 移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveUp
 */

Camera.prototype.moveDown = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);
  this.move(this.up, -amount);
};

/**
 * 沿着相机的右向按 <code>量</code> 移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveLeft
 */

Camera.prototype.moveRight = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);
  this.move(this.right, amount);
};

/**
 * 沿着相机右向的相反方向按 <code>量</code> 移动相机的位置。
 *
 * @param {number} [amount] 移动的量，单位为米。默认值为 <code>defaultMoveAmount</code>。
 *
 * @see Camera#moveRight
 */

Camera.prototype.moveLeft = function(amount) {
  amount = defaultValue(amount, this.defaultMoveAmount);
  this.move(this.right, -amount);
};

/**
 * 绕相机的上向按 <code>量</code>（以弧度为单位）旋转，如果不在 2D 模式下，则旋转方向为其右向的相反方向。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#lookRight
 */

Camera.prototype.lookLeft = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);

  // only want view of map to change in 3D mode, 2D visual is incorrect when look changes
  if (this._mode !== SceneMode.SCENE2D) {
    this.look(this.up, -amount);
  }
};

/**
 * 绕相机的上向按 <code>量</code>（以弧度为单位）旋转，如果不在 2D 模式下，则旋转方向为其右向的方向。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#lookLeft
 */

Camera.prototype.lookRight = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);

  // only want view of map to change in 3D mode, 2D visual is incorrect when look changes
  if (this._mode !== SceneMode.SCENE2D) {
    this.look(this.up, amount);
  }
};

/**
 * 绕相机的右向按 <code>量</code>（以弧度为单位）旋转，如果不在 2D 模式下，则旋转方向为其上向的方向。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#lookDown
 */

Camera.prototype.lookUp = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);

  // only want view of map to change in 3D mode, 2D visual is incorrect when look changes
  if (this._mode !== SceneMode.SCENE2D) {
    this.look(this.right, -amount);
  }
};

/**
 * 绕相机的右向按 <code>量</code>（以弧度为单位）旋转，如果不在 2D 模式下，则旋转方向为其上向的相反方向。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#lookUp
 */

Camera.prototype.lookDown = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);

  // only want view of map to change in 3D mode, 2D visual is incorrect when look changes
  if (this._mode !== SceneMode.SCENE2D) {
    this.look(this.right, amount);
  }
};

const lookScratchQuaternion = new Quaternion();
const lookScratchMatrix = new Matrix3();
/**
 * 绕 <code>轴</code> 按 <code>角度</code> 旋转相机的每个方向向量。
 *
 * @param {Cartesian3} axis 要绕其旋转的轴。
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#lookUp
 * @see Camera#lookDown
 * @see Camera#lookLeft
 * @see Camera#lookRight
 */

Camera.prototype.look = function(axis, angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(axis)) {
    throw new DeveloperError("axis is required.");
  }
  //>>includeEnd('debug');

  const turnAngle = defaultValue(angle, this.defaultLookAmount);
  const quaternion = Quaternion.fromAxisAngle(
    axis,
    -turnAngle,
    lookScratchQuaternion,
  );
  const rotation = Matrix3.fromQuaternion(quaternion, lookScratchMatrix);

  const direction = this.direction;
  const up = this.up;
  const right = this.right;

  Matrix3.multiplyByVector(rotation, direction, direction);
  Matrix3.multiplyByVector(rotation, up, up);
  Matrix3.multiplyByVector(rotation, right, right);
};

/**
 * 沿着相机的方向向量逆时针旋转相机，旋转量以弧度为单位。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#twistRight
 */

Camera.prototype.twistLeft = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);
  this.look(this.direction, amount);
};

/**
 * 沿着相机的方向向量顺时针旋转相机，旋转量以弧度为单位。
 *
 * @param {number} [amount] 旋转的量，以弧度为单位。默认值为 <code>defaultLookAmount</code>。
 *
 * @see Camera#twistLeft
 */

Camera.prototype.twistRight = function(amount) {
  amount = defaultValue(amount, this.defaultLookAmount);
  this.look(this.direction, -amount);
};

const rotateScratchQuaternion = new Quaternion();
const rotateScratchMatrix = new Matrix3();
/**
 * 绕 <code>轴</code> 旋转相机 <code>角度</code>。相机位置到相机参考框架中心的距离保持不变。
 *
 * @param {Cartesian3} axis 要绕其旋转的轴，使用世界坐标表示。
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultRotateAmount</code>。
 *
 * @see Camera#rotateUp
 * @see Camera#rotateDown
 * @see Camera#rotateLeft
 * @see Camera#rotateRight
 */

Camera.prototype.rotate = function(axis, angle) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(axis)) {
    throw new DeveloperError("axis is required.");
  }
  //>>includeEnd('debug');

  const turnAngle = defaultValue(angle, this.defaultRotateAmount);
  const quaternion = Quaternion.fromAxisAngle(
    axis,
    -turnAngle,
    rotateScratchQuaternion,
  );
  const rotation = Matrix3.fromQuaternion(quaternion, rotateScratchMatrix);
  Matrix3.multiplyByVector(rotation, this.position, this.position);
  Matrix3.multiplyByVector(rotation, this.direction, this.direction);
  Matrix3.multiplyByVector(rotation, this.up, this.up);
  Cartesian3.cross(this.direction, this.up, this.right);
  Cartesian3.cross(this.right, this.direction, this.up);

  this._adjustOrthographicFrustum(false);
};

/**
 * 绕相机参考框架中心向下旋转相机 <code>角度</code>。
 *
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultRotateAmount</code>。
 *
 * @see Camera#rotateUp
 * @see Camera#rotate
 */

Camera.prototype.rotateDown = function(angle) {
  angle = defaultValue(angle, this.defaultRotateAmount);
  rotateVertical(this, angle);
};

/**
 * 绕相机参考框架中心向上旋转相机 <code>角度</code>。
 *
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultRotateAmount</code>。
 *
 * @see Camera#rotateDown
 * @see Camera#rotate
 */

Camera.prototype.rotateUp = function(angle) {
  angle = defaultValue(angle, this.defaultRotateAmount);
  rotateVertical(this, -angle);
};

const rotateVertScratchP = new Cartesian3();
const rotateVertScratchA = new Cartesian3();
const rotateVertScratchTan = new Cartesian3();
const rotateVertScratchNegate = new Cartesian3();
function rotateVertical(camera, angle) {
  const position = camera.position;
  if (
    defined(camera.constrainedAxis) &&
    !Cartesian3.equalsEpsilon(
      camera.position,
      Cartesian3.ZERO,
      CesiumMath.EPSILON2,
    )
  ) {
    const p = Cartesian3.normalize(position, rotateVertScratchP);
    const northParallel = Cartesian3.equalsEpsilon(
      p,
      camera.constrainedAxis,
      CesiumMath.EPSILON2,
    );
    const southParallel = Cartesian3.equalsEpsilon(
      p,
      Cartesian3.negate(camera.constrainedAxis, rotateVertScratchNegate),
      CesiumMath.EPSILON2,
    );
    if (!northParallel && !southParallel) {
      const constrainedAxis = Cartesian3.normalize(
        camera.constrainedAxis,
        rotateVertScratchA,
      );

      let dot = Cartesian3.dot(p, constrainedAxis);
      let angleToAxis = CesiumMath.acosClamped(dot);
      if (angle > 0 && angle > angleToAxis) {
        angle = angleToAxis - CesiumMath.EPSILON4;
      }

      dot = Cartesian3.dot(
        p,
        Cartesian3.negate(constrainedAxis, rotateVertScratchNegate),
      );
      angleToAxis = CesiumMath.acosClamped(dot);
      if (angle < 0 && -angle > angleToAxis) {
        angle = -angleToAxis + CesiumMath.EPSILON4;
      }

      const tangent = Cartesian3.cross(
        constrainedAxis,
        p,
        rotateVertScratchTan,
      );
      camera.rotate(tangent, angle);
    } else if ((northParallel && angle < 0) || (southParallel && angle > 0)) {
      camera.rotate(camera.right, angle);
    }
  } else {
    camera.rotate(camera.right, angle);
  }
}

/**
 * 绕相机参考框架中心向右旋转相机 <code>角度</code>。
 *
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultRotateAmount</code>。
 *
 * @see Camera#rotateLeft
 * @see Camera#rotate
 */
Camera.prototype.rotateRight = function(angle) {
  angle = defaultValue(angle, this.defaultRotateAmount);
  rotateHorizontal(this, -angle);
};

/**
 * 绕相机参考框架中心向左旋转相机 <code>角度</code>。
 *
 * @param {number} [angle] 旋转的角度，以弧度为单位。默认值为 <code>defaultRotateAmount</code>。
 *
 * @see Camera#rotateRight
 * @see Camera#rotate
 */

Camera.prototype.rotateLeft = function(angle) {
  angle = defaultValue(angle, this.defaultRotateAmount);
  rotateHorizontal(this, angle);
};

function rotateHorizontal(camera, angle) {
  if (defined(camera.constrainedAxis)) {
    camera.rotate(camera.constrainedAxis, angle);
  } else {
    camera.rotate(camera.up, angle);
  }
}

function zoom2D(camera, amount) {
  const frustum = camera.frustum;

  //>>includeStart('debug', pragmas.debug);
  if (
    !(frustum instanceof OrthographicOffCenterFrustum) ||
    !defined(frustum.left) ||
    !defined(frustum.right) ||
    !defined(frustum.bottom) ||
    !defined(frustum.top)
  ) {
    throw new DeveloperError(
      "The camera frustum is expected to be orthographic for 2D camera control.",
    );
  }
  //>>includeEnd('debug');

  let ratio;
  amount = amount * 0.5;

  if (
    Math.abs(frustum.top) + Math.abs(frustum.bottom) >
    Math.abs(frustum.left) + Math.abs(frustum.right)
  ) {
    let newTop = frustum.top - amount;
    let newBottom = frustum.bottom + amount;

    let maxBottom = camera._maxCoord.y;
    if (camera._scene.mapMode2D === MapMode2D.ROTATE) {
      maxBottom *= camera.maximumZoomFactor;
    }

    if (newBottom > maxBottom) {
      newBottom = maxBottom;
      newTop = -maxBottom;
    }

    if (newTop <= newBottom) {
      newTop = 1.0;
      newBottom = -1.0;
    }

    ratio = frustum.right / frustum.top;
    frustum.top = newTop;
    frustum.bottom = newBottom;
    frustum.right = frustum.top * ratio;
    frustum.left = -frustum.right;
  } else {
    let newRight = frustum.right - amount;
    let newLeft = frustum.left + amount;

    let maxRight = camera._maxCoord.x;
    if (camera._scene.mapMode2D === MapMode2D.ROTATE) {
      maxRight *= camera.maximumZoomFactor;
    }

    if (newRight > maxRight) {
      newRight = maxRight;
      newLeft = -maxRight;
    }

    if (newRight <= newLeft) {
      newRight = 1.0;
      newLeft = -1.0;
    }
    ratio = frustum.top / frustum.right;
    frustum.right = newRight;
    frustum.left = newLeft;
    frustum.top = frustum.right * ratio;
    frustum.bottom = -frustum.top;
  }
}

function zoom3D(camera, amount) {
  camera.move(camera.direction, amount);
}

/**
 * 沿着相机的视向缩放 <code>量</code>。
 *
 * @param {number} [amount] 移动的量。默认值为 <code>defaultZoomAmount</code>。
 *
 * @see Camera#zoomOut
 */

Camera.prototype.zoomIn = function(amount) {
  amount = defaultValue(amount, this.defaultZoomAmount);
  if (this._mode === SceneMode.SCENE2D) {
    zoom2D(this, amount);
  } else {
    zoom3D(this, amount);
  }
};

/**
 * 沿着相机视向的相反方向缩放 <code>量</code>。
 *
 * @param {number} [amount] 移动的量。默认值为 <code>defaultZoomAmount</code>。
 *
 * @see Camera#zoomIn
 */

Camera.prototype.zoomOut = function(amount) {
  amount = defaultValue(amount, this.defaultZoomAmount);
  if (this._mode === SceneMode.SCENE2D) {
    zoom2D(this, -amount);
  } else {
    zoom3D(this, -amount);
  }
};

/**
 * 获取相机位置的大小。在 3D 中，这是向量的大小。在 2D 和
 * 哥伦布视图中，这是到地图的距离。
 *
 * @returns {number} 位置的大小。
 */

Camera.prototype.getMagnitude = function() {
  if (this._mode === SceneMode.SCENE3D) {
    return Cartesian3.magnitude(this.position);
  } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
    return Math.abs(this.position.z);
  } else if (this._mode === SceneMode.SCENE2D) {
    return Math.max(
      this.frustum.right - this.frustum.left,
      this.frustum.top - this.frustum.bottom,
    );
  }
};

const scratchLookAtMatrix4 = new Matrix4();

/**
 * 使用目标和偏移量设置相机的位置和方向。目标必须以世界坐标给出。
 * 偏移量可以是笛卡尔坐标或以目标为中心的局部东-北-上参考框架中的方位角/俯仰角/范围。
 * 如果偏移量是笛卡尔坐标，则它是由变换矩阵定义的参考框架中心的偏移量。如果偏移量
 * 是方位角/俯仰角/范围，则方位角和俯仰角是在由变换矩阵定义的参考框架中定义的。
 * 方位角是从 y 轴开始并朝 x 轴增加的角度。俯仰角是从 xy 平面旋转的角度。正俯仰角
 * 代表在平面下方。负俯仰角代表在平面上方。范围是从中心的距离。
 *
 * 在 2D 中，必须是俯视图。相机会位于目标上方并朝下看。相对于目标的高度将是偏移量的大小。
 * 方位角将根据偏移量确定。如果无法从偏移量确定方位角，则方位角将是北。
 *
 * @param {Cartesian3} target 世界坐标中的目标位置。
 * @param {Cartesian3|HeadingPitchRange} offset 在以目标为中心的局部东-北-上参考框架中
 * 从目标的偏移量。
 *
 * @exception {DeveloperError} 在变形时不支持 lookAt。
 *
 * @example
 * // 1. Using a cartesian offset
 * const center = Cesium.Cartesian3.fromDegrees(-98.0, 40.0);
 * viewer.camera.lookAt(center, new Cesium.Cartesian3(0.0, -4790000.0, 3930000.0));
 *
 * // 2. Using a HeadingPitchRange offset
 * const center = Cesium.Cartesian3.fromDegrees(-72.0, 40.0);
 * const heading = Cesium.Math.toRadians(50.0);
 * const pitch = Cesium.Math.toRadians(-20.0);
 * const range = 5000.0;
 * viewer.camera.lookAt(center, new Cesium.HeadingPitchRange(heading, pitch, range));
 */
Camera.prototype.lookAt = function(target, offset) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(target)) {
    throw new DeveloperError("target is required");
  }
  if (!defined(offset)) {
    throw new DeveloperError("offset is required");
  }
  if (this._mode === SceneMode.MORPHING) {
    throw new DeveloperError("lookAt is not supported while morphing.");
  }
  //>>includeEnd('debug');

  const scene = this._scene;
  const ellipsoid = defaultValue(scene.ellipsoid, Ellipsoid.default);

  const transform = Transforms.eastNorthUpToFixedFrame(
    target,
    ellipsoid,
    scratchLookAtMatrix4,
  );
  this.lookAtTransform(transform, offset);
};

const scratchLookAtHeadingPitchRangeOffset = new Cartesian3();
const scratchLookAtHeadingPitchRangeQuaternion1 = new Quaternion();
const scratchLookAtHeadingPitchRangeQuaternion2 = new Quaternion();
const scratchHeadingPitchRangeMatrix3 = new Matrix3();

function offsetFromHeadingPitchRange(heading, pitch, range) {
  pitch = CesiumMath.clamp(
    pitch,
    -CesiumMath.PI_OVER_TWO,
    CesiumMath.PI_OVER_TWO,
  );
  heading = CesiumMath.zeroToTwoPi(heading) - CesiumMath.PI_OVER_TWO;

  const pitchQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Y,
    -pitch,
    scratchLookAtHeadingPitchRangeQuaternion1,
  );
  const headingQuat = Quaternion.fromAxisAngle(
    Cartesian3.UNIT_Z,
    -heading,
    scratchLookAtHeadingPitchRangeQuaternion2,
  );
  const rotQuat = Quaternion.multiply(headingQuat, pitchQuat, headingQuat);
  const rotMatrix = Matrix3.fromQuaternion(
    rotQuat,
    scratchHeadingPitchRangeMatrix3,
  );

  const offset = Cartesian3.clone(
    Cartesian3.UNIT_X,
    scratchLookAtHeadingPitchRangeOffset,
  );
  Matrix3.multiplyByVector(rotMatrix, offset, offset);
  Cartesian3.negate(offset, offset);
  Cartesian3.multiplyByScalar(offset, range, offset);
  return offset;
}

/**
 * 使用目标和变换矩阵设置相机的位置和方向。偏移量可以是笛卡尔坐标或方位角/俯仰角/范围。
 * 如果偏移量是笛卡尔坐标，则它是由变换矩阵定义的参考框架中心的偏移量。如果偏移量
 * 是方位角/俯仰角/范围，则方位角和俯仰角是在由变换矩阵定义的参考框架中定义的。
 * 方位角是从 y 轴开始并朝 x 轴增加的角度。俯仰角是从 xy 平面旋转的角度。正俯仰角
 * 代表在平面下方。负俯仰角代表在平面上方。范围是从中心的距离。
 *
 * 在 2D 中，必须是俯视图。相机会位于参考框架的中心上方。相对于目标的高度将是偏移量的大小。
 * 方位角将根据偏移量确定。如果无法从偏移量确定方位角，则方位角将是北。
 *
 * @param {Matrix4} transform 定义参考框架的变换矩阵。
 * @param {Cartesian3|HeadingPitchRange} [offset] 在以目标为中心的参考框架中
 * 从目标的偏移量。
 *
 * @exception {DeveloperError} 在变形时不支持 lookAtTransform。
 *
 * @example
 * // 1. Using a cartesian offset
 * const transform = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(-98.0, 40.0));
 * viewer.camera.lookAtTransform(transform, new Cesium.Cartesian3(0.0, -4790000.0, 3930000.0));
 *
 * // 2. Using a HeadingPitchRange offset
 * const transform = Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromDegrees(-72.0, 40.0));
 * const heading = Cesium.Math.toRadians(50.0);
 * const pitch = Cesium.Math.toRadians(-20.0);
 * const range = 5000.0;
 * viewer.camera.lookAtTransform(transform, new Cesium.HeadingPitchRange(heading, pitch, range));
 */
Camera.prototype.lookAtTransform = function(transform, offset) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(transform)) {
    throw new DeveloperError("transform is required");
  }
  if (this._mode === SceneMode.MORPHING) {
    throw new DeveloperError(
      "lookAtTransform is not supported while morphing.",
    );
  }
  //>>includeEnd('debug');

  this._setTransform(transform);
  if (!defined(offset)) {
    return;
  }

  let cartesianOffset;
  if (defined(offset.heading)) {
    cartesianOffset = offsetFromHeadingPitchRange(
      offset.heading,
      offset.pitch,
      offset.range,
    );
  } else {
    cartesianOffset = offset;
  }

  if (this._mode === SceneMode.SCENE2D) {
    Cartesian2.clone(Cartesian2.ZERO, this.position);

    Cartesian3.negate(cartesianOffset, this.up);
    this.up.z = 0.0;

    if (Cartesian3.magnitudeSquared(this.up) < CesiumMath.EPSILON10) {
      Cartesian3.clone(Cartesian3.UNIT_Y, this.up);
    }

    Cartesian3.normalize(this.up, this.up);

    this._setTransform(Matrix4.IDENTITY);

    Cartesian3.negate(Cartesian3.UNIT_Z, this.direction);
    Cartesian3.cross(this.direction, this.up, this.right);
    Cartesian3.normalize(this.right, this.right);

    const frustum = this.frustum;
    const ratio = frustum.top / frustum.right;
    frustum.right = Cartesian3.magnitude(cartesianOffset) * 0.5;
    frustum.left = -frustum.right;
    frustum.top = ratio * frustum.right;
    frustum.bottom = -frustum.top;

    this._setTransform(transform);

    return;
  }

  Cartesian3.clone(cartesianOffset, this.position);
  Cartesian3.negate(this.position, this.direction);
  Cartesian3.normalize(this.direction, this.direction);
  Cartesian3.cross(this.direction, Cartesian3.UNIT_Z, this.right);

  if (Cartesian3.magnitudeSquared(this.right) < CesiumMath.EPSILON10) {
    Cartesian3.clone(Cartesian3.UNIT_X, this.right);
  }

  Cartesian3.normalize(this.right, this.right);
  Cartesian3.cross(this.right, this.direction, this.up);
  Cartesian3.normalize(this.up, this.up);

  this._adjustOrthographicFrustum(true);
};

const viewRectangle3DCartographic1 = new Cartographic();
const viewRectangle3DCartographic2 = new Cartographic();
const viewRectangle3DNorthEast = new Cartesian3();
const viewRectangle3DSouthWest = new Cartesian3();
const viewRectangle3DNorthWest = new Cartesian3();
const viewRectangle3DSouthEast = new Cartesian3();
const viewRectangle3DNorthCenter = new Cartesian3();
const viewRectangle3DSouthCenter = new Cartesian3();
const viewRectangle3DCenter = new Cartesian3();
const viewRectangle3DEquator = new Cartesian3();
const defaultRF = {
  direction: new Cartesian3(),
  right: new Cartesian3(),
  up: new Cartesian3(),
};
let viewRectangle3DEllipsoidGeodesic;

function computeD(direction, upOrRight, corner, tanThetaOrPhi) {
  const opposite = Math.abs(Cartesian3.dot(upOrRight, corner));
  return opposite / tanThetaOrPhi - Cartesian3.dot(direction, corner);
}

function rectangleCameraPosition3D(camera, rectangle, result, updateCamera) {
  const ellipsoid = camera._projection.ellipsoid;
  const cameraRF = updateCamera ? camera : defaultRF;

  const { north, south, west } = rectangle;
  let { east } = rectangle;

  // If we go across the International Date Line
  if (west > east) {
    east += CesiumMath.TWO_PI;
  }

  // Find the midpoint latitude.
  //
  // EllipsoidGeodesic will fail if the north and south edges are very close to being on opposite sides of the ellipsoid.
  // Ideally we'd just call EllipsoidGeodesic.setEndPoints and let it throw when it detects this case, but sadly it doesn't
  // even look for this case in optimized builds, so we have to test for it here instead.
  //
  // Fortunately, this case can only happen (here) when north is very close to the north pole and south is very close to the south pole,
  // so handle it just by using 0 latitude as the center.  It's certainliy possible to use a smaller tolerance
  // than one degree here, but one degree is safe and putting the center at 0 latitude should be good enough for any
  // rectangle that spans 178+ of the 180 degrees of latitude.
  const longitude = (west + east) * 0.5;
  let latitude;
  if (
    south < -CesiumMath.PI_OVER_TWO + CesiumMath.RADIANS_PER_DEGREE &&
    north > CesiumMath.PI_OVER_TWO - CesiumMath.RADIANS_PER_DEGREE
  ) {
    latitude = 0.0;
  } else {
    const northCartographic = viewRectangle3DCartographic1;
    northCartographic.longitude = longitude;
    northCartographic.latitude = north;
    northCartographic.height = 0.0;

    const southCartographic = viewRectangle3DCartographic2;
    southCartographic.longitude = longitude;
    southCartographic.latitude = south;
    southCartographic.height = 0.0;

    let ellipsoidGeodesic = viewRectangle3DEllipsoidGeodesic;
    if (
      !defined(ellipsoidGeodesic) ||
      ellipsoidGeodesic.ellipsoid !== ellipsoid
    ) {
      viewRectangle3DEllipsoidGeodesic = ellipsoidGeodesic =
        new EllipsoidGeodesic(undefined, undefined, ellipsoid);
    }

    ellipsoidGeodesic.setEndPoints(northCartographic, southCartographic);
    latitude = ellipsoidGeodesic.interpolateUsingFraction(
      0.5,
      viewRectangle3DCartographic1,
    ).latitude;
  }

  const centerCartographic = viewRectangle3DCartographic1;
  centerCartographic.longitude = longitude;
  centerCartographic.latitude = latitude;
  centerCartographic.height = 0.0;

  const center = ellipsoid.cartographicToCartesian(
    centerCartographic,
    viewRectangle3DCenter,
  );

  const cart = viewRectangle3DCartographic1;
  cart.longitude = east;
  cart.latitude = north;
  const northEast = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DNorthEast,
  );
  cart.longitude = west;
  const northWest = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DNorthWest,
  );
  cart.longitude = longitude;
  const northCenter = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DNorthCenter,
  );
  cart.latitude = south;
  const southCenter = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DSouthCenter,
  );
  cart.longitude = east;
  const southEast = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DSouthEast,
  );
  cart.longitude = west;
  const southWest = ellipsoid.cartographicToCartesian(
    cart,
    viewRectangle3DSouthWest,
  );

  Cartesian3.subtract(northWest, center, northWest);
  Cartesian3.subtract(southEast, center, southEast);
  Cartesian3.subtract(northEast, center, northEast);
  Cartesian3.subtract(southWest, center, southWest);
  Cartesian3.subtract(northCenter, center, northCenter);
  Cartesian3.subtract(southCenter, center, southCenter);

  const direction = ellipsoid.geodeticSurfaceNormal(center, cameraRF.direction);
  Cartesian3.negate(direction, direction);
  const right = Cartesian3.cross(direction, Cartesian3.UNIT_Z, cameraRF.right);
  Cartesian3.normalize(right, right);
  const up = Cartesian3.cross(right, direction, cameraRF.up);

  let d;
  if (camera.frustum instanceof OrthographicFrustum) {
    const width = Math.max(
      Cartesian3.distance(northEast, northWest),
      Cartesian3.distance(southEast, southWest),
    );
    const height = Math.max(
      Cartesian3.distance(northEast, southEast),
      Cartesian3.distance(northWest, southWest),
    );

    let rightScalar;
    let topScalar;
    const offCenterFrustum = camera.frustum._offCenterFrustum;
    const ratio = offCenterFrustum.right / offCenterFrustum.top;
    const heightRatio = height * ratio;
    if (width > heightRatio) {
      rightScalar = width;
      topScalar = rightScalar / ratio;
    } else {
      topScalar = height;
      rightScalar = heightRatio;
    }

    d = Math.max(rightScalar, topScalar);
  } else {
    const tanPhi = Math.tan(camera.frustum.fovy * 0.5);
    const tanTheta = camera.frustum.aspectRatio * tanPhi;

    d = Math.max(
      computeD(direction, up, northWest, tanPhi),
      computeD(direction, up, southEast, tanPhi),
      computeD(direction, up, northEast, tanPhi),
      computeD(direction, up, southWest, tanPhi),
      computeD(direction, up, northCenter, tanPhi),
      computeD(direction, up, southCenter, tanPhi),
      computeD(direction, right, northWest, tanTheta),
      computeD(direction, right, southEast, tanTheta),
      computeD(direction, right, northEast, tanTheta),
      computeD(direction, right, southWest, tanTheta),
      computeD(direction, right, northCenter, tanTheta),
      computeD(direction, right, southCenter, tanTheta),
    );

    // If the rectangle crosses the equator, compute D at the equator, too, because that's the
    // widest part of the rectangle when projected onto the globe.
    if (south < 0 && north > 0) {
      const equatorCartographic = viewRectangle3DCartographic1;
      equatorCartographic.longitude = west;
      equatorCartographic.latitude = 0.0;
      equatorCartographic.height = 0.0;
      let equatorPosition = ellipsoid.cartographicToCartesian(
        equatorCartographic,
        viewRectangle3DEquator,
      );
      Cartesian3.subtract(equatorPosition, center, equatorPosition);
      d = Math.max(
        d,
        computeD(direction, up, equatorPosition, tanPhi),
        computeD(direction, right, equatorPosition, tanTheta),
      );

      equatorCartographic.longitude = east;
      equatorPosition = ellipsoid.cartographicToCartesian(
        equatorCartographic,
        viewRectangle3DEquator,
      );
      Cartesian3.subtract(equatorPosition, center, equatorPosition);
      d = Math.max(
        d,
        computeD(direction, up, equatorPosition, tanPhi),
        computeD(direction, right, equatorPosition, tanTheta),
      );
    }
  }

  return Cartesian3.add(
    center,
    Cartesian3.multiplyByScalar(direction, -d, viewRectangle3DEquator),
    result,
  );
}

const viewRectangleCVCartographic = new Cartographic();
const viewRectangleCVNorthEast = new Cartesian3();
const viewRectangleCVSouthWest = new Cartesian3();
function rectangleCameraPositionColumbusView(camera, rectangle, result) {
  const projection = camera._projection;
  if (rectangle.west > rectangle.east) {
    rectangle = Rectangle.MAX_VALUE;
  }
  const transform = camera._actualTransform;
  const invTransform = camera._actualInvTransform;

  const cart = viewRectangleCVCartographic;
  cart.longitude = rectangle.east;
  cart.latitude = rectangle.north;
  const northEast = projection.project(cart, viewRectangleCVNorthEast);
  Matrix4.multiplyByPoint(transform, northEast, northEast);
  Matrix4.multiplyByPoint(invTransform, northEast, northEast);

  cart.longitude = rectangle.west;
  cart.latitude = rectangle.south;
  const southWest = projection.project(cart, viewRectangleCVSouthWest);
  Matrix4.multiplyByPoint(transform, southWest, southWest);
  Matrix4.multiplyByPoint(invTransform, southWest, southWest);

  result.x = (northEast.x - southWest.x) * 0.5 + southWest.x;
  result.y = (northEast.y - southWest.y) * 0.5 + southWest.y;

  if (defined(camera.frustum.fovy)) {
    const tanPhi = Math.tan(camera.frustum.fovy * 0.5);
    const tanTheta = camera.frustum.aspectRatio * tanPhi;
    result.z =
      Math.max(
        (northEast.x - southWest.x) / tanTheta,
        (northEast.y - southWest.y) / tanPhi,
      ) * 0.5;
  } else {
    const width = northEast.x - southWest.x;
    const height = northEast.y - southWest.y;
    result.z = Math.max(width, height);
  }

  return result;
}

const viewRectangle2DCartographic = new Cartographic();
const viewRectangle2DNorthEast = new Cartesian3();
const viewRectangle2DSouthWest = new Cartesian3();
function rectangleCameraPosition2D(camera, rectangle, result) {
  const projection = camera._projection;

  // Account for the rectangle crossing the International Date Line in 2D mode
  let east = rectangle.east;
  if (rectangle.west > rectangle.east) {
    if (camera._scene.mapMode2D === MapMode2D.INFINITE_SCROLL) {
      east += CesiumMath.TWO_PI;
    } else {
      rectangle = Rectangle.MAX_VALUE;
      east = rectangle.east;
    }
  }

  let cart = viewRectangle2DCartographic;
  cart.longitude = east;
  cart.latitude = rectangle.north;
  const northEast = projection.project(cart, viewRectangle2DNorthEast);
  cart.longitude = rectangle.west;
  cart.latitude = rectangle.south;
  const southWest = projection.project(cart, viewRectangle2DSouthWest);

  const width = Math.abs(northEast.x - southWest.x) * 0.5;
  let height = Math.abs(northEast.y - southWest.y) * 0.5;

  let right, top;
  const ratio = camera.frustum.right / camera.frustum.top;
  const heightRatio = height * ratio;
  if (width > heightRatio) {
    right = width;
    top = right / ratio;
  } else {
    top = height;
    right = heightRatio;
  }

  height = Math.max(2.0 * right, 2.0 * top);

  result.x = (northEast.x - southWest.x) * 0.5 + southWest.x;
  result.y = (northEast.y - southWest.y) * 0.5 + southWest.y;

  cart = projection.unproject(result, cart);
  cart.height = height;
  result = projection.project(cart, result);

  return result;
}

/**
 * 获取查看椭球体或地图上矩形所需的相机位置。
 *
 * @param {Rectangle} rectangle 要查看的矩形。
 * @param {Cartesian3} [result] 查看该矩形所需的相机位置。
 * @returns {Cartesian3} 查看该矩形所需的相机位置。
 */

Camera.prototype.getRectangleCameraCoordinates = function(rectangle, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(rectangle)) {
    throw new DeveloperError("rectangle is required");
  }
  //>>includeEnd('debug');
  const mode = this._mode;

  if (!defined(result)) {
    result = new Cartesian3();
  }

  if (mode === SceneMode.SCENE3D) {
    return rectangleCameraPosition3D(this, rectangle, result);
  } else if (mode === SceneMode.COLUMBUS_VIEW) {
    return rectangleCameraPositionColumbusView(this, rectangle, result);
  } else if (mode === SceneMode.SCENE2D) {
    return rectangleCameraPosition2D(this, rectangle, result);
  }

  return undefined;
};

const pickEllipsoid3DRay = new Ray();
function pickEllipsoid3D(camera, windowPosition, ellipsoid, result) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  const ray = camera.getPickRay(windowPosition, pickEllipsoid3DRay);
  const intersection = IntersectionTests.rayEllipsoid(ray, ellipsoid);
  if (!intersection) {
    return undefined;
  }

  const t = intersection.start > 0.0 ? intersection.start : intersection.stop;
  return Ray.getPoint(ray, t, result);
}

const pickEllipsoid2DRay = new Ray();
function pickMap2D(camera, windowPosition, projection, result) {
  const ray = camera.getPickRay(windowPosition, pickEllipsoid2DRay);
  let position = ray.origin;
  position = Cartesian3.fromElements(position.y, position.z, 0.0, position);
  const cart = projection.unproject(position);

  if (
    cart.latitude < -CesiumMath.PI_OVER_TWO ||
    cart.latitude > CesiumMath.PI_OVER_TWO
  ) {
    return undefined;
  }

  return projection.ellipsoid.cartographicToCartesian(cart, result);
}

const pickEllipsoidCVRay = new Ray();
function pickMapColumbusView(camera, windowPosition, projection, result) {
  const ray = camera.getPickRay(windowPosition, pickEllipsoidCVRay);
  const scalar = -ray.origin.x / ray.direction.x;
  Ray.getPoint(ray, scalar, result);

  const cart = projection.unproject(new Cartesian3(result.y, result.z, 0.0));

  if (
    cart.latitude < -CesiumMath.PI_OVER_TWO ||
    cart.latitude > CesiumMath.PI_OVER_TWO ||
    cart.longitude < -Math.PI ||
    cart.longitude > Math.PI
  ) {
    return undefined;
  }

  return projection.ellipsoid.cartographicToCartesian(cart, result);
}

/**
 * 选择一个椭球体或地图。
 *
 * @param {Cartesian2} windowPosition 像素的 x 和 y 坐标。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 要选择的椭球体。
 * @param {Cartesian3} [result] 存储结果的对象。
 * @returns {Cartesian3 | undefined} 如果选择了椭球体或地图，
 * 返回椭球体或地图表面在世界坐标中的点。如果未选择椭球体或地图，则返回 undefined。
 *
 * @example
 * const canvas = viewer.scene.canvas;
 * const center = new Cesium.Cartesian2(canvas.clientWidth / 2.0, canvas.clientHeight / 2.0);
 * const ellipsoid = viewer.scene.ellipsoid;
 * const result = viewer.camera.pickEllipsoid(center, ellipsoid);
 */
Camera.prototype.pickEllipsoid = function(windowPosition, ellipsoid, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(windowPosition)) {
    throw new DeveloperError("windowPosition is required.");
  }
  //>>includeEnd('debug');

  const canvas = this._scene.canvas;
  if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    return undefined;
  }

  if (!defined(result)) {
    result = new Cartesian3();
  }

  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);

  if (this._mode === SceneMode.SCENE3D) {
    result = pickEllipsoid3D(this, windowPosition, ellipsoid, result);
  } else if (this._mode === SceneMode.SCENE2D) {
    result = pickMap2D(this, windowPosition, this._projection, result);
  } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
    result = pickMapColumbusView(
      this,
      windowPosition,
      this._projection,
      result,
    );
  } else {
    return undefined;
  }

  return result;
};

const pickPerspCenter = new Cartesian3();
const pickPerspXDir = new Cartesian3();
const pickPerspYDir = new Cartesian3();
function getPickRayPerspective(camera, windowPosition, result) {
  const canvas = camera._scene.canvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const tanPhi = Math.tan(camera.frustum.fovy * 0.5);
  const tanTheta = camera.frustum.aspectRatio * tanPhi;
  const near = camera.frustum.near;

  const x = (2.0 / width) * windowPosition.x - 1.0;
  const y = (2.0 / height) * (height - windowPosition.y) - 1.0;

  const position = camera.positionWC;
  Cartesian3.clone(position, result.origin);

  const nearCenter = Cartesian3.multiplyByScalar(
    camera.directionWC,
    near,
    pickPerspCenter,
  );
  Cartesian3.add(position, nearCenter, nearCenter);
  const xDir = Cartesian3.multiplyByScalar(
    camera.rightWC,
    x * near * tanTheta,
    pickPerspXDir,
  );
  const yDir = Cartesian3.multiplyByScalar(
    camera.upWC,
    y * near * tanPhi,
    pickPerspYDir,
  );
  const direction = Cartesian3.add(nearCenter, xDir, result.direction);
  Cartesian3.add(direction, yDir, direction);
  Cartesian3.subtract(direction, position, direction);
  Cartesian3.normalize(direction, direction);

  return result;
}

const scratchDirection = new Cartesian3();

function getPickRayOrthographic(camera, windowPosition, result) {
  const canvas = camera._scene.canvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  let frustum = camera.frustum;
  const offCenterFrustum = frustum.offCenterFrustum;
  if (defined(offCenterFrustum)) {
    frustum = offCenterFrustum;
  }
  let x = (2.0 / width) * windowPosition.x - 1.0;
  x *= (frustum.right - frustum.left) * 0.5;
  let y = (2.0 / height) * (height - windowPosition.y) - 1.0;
  y *= (frustum.top - frustum.bottom) * 0.5;

  const origin = result.origin;
  Cartesian3.clone(camera.position, origin);

  Cartesian3.multiplyByScalar(camera.right, x, scratchDirection);
  Cartesian3.add(scratchDirection, origin, origin);
  Cartesian3.multiplyByScalar(camera.up, y, scratchDirection);
  Cartesian3.add(scratchDirection, origin, origin);

  Cartesian3.clone(camera.directionWC, result.direction);

  if (
    camera._mode === SceneMode.COLUMBUS_VIEW ||
    camera._mode === SceneMode.SCENE2D
  ) {
    Cartesian3.fromElements(
      result.origin.z,
      result.origin.x,
      result.origin.y,
      result.origin,
    );
  }

  return result;
}

/**
 * 从相机位置通过在世界坐标中指定的像素 <code>windowPosition</code> 创建一条射线。
 *
 * @param {Cartesian2} windowPosition 像素的 x 和 y 坐标。
 * @param {Ray} [result] 存储结果的对象。
 * @returns {Ray|undefined} 返回射线的 {@link Cartesian3} 位置和方向，如果无法确定拾取射线，则返回 undefined。
 */

Camera.prototype.getPickRay = function(windowPosition, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(windowPosition)) {
    throw new DeveloperError("windowPosition is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Ray();
  }

  const canvas = this._scene.canvas;
  if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
    return undefined;
  }

  const frustum = this.frustum;
  if (
    defined(frustum.aspectRatio) &&
    defined(frustum.fov) &&
    defined(frustum.near)
  ) {
    return getPickRayPerspective(this, windowPosition, result);
  }

  return getPickRayOrthographic(this, windowPosition, result);
};

const scratchToCenter = new Cartesian3();
const scratchProj = new Cartesian3();

/**
 * 返回相机到边界球前面的距离。
 *
 * @param {BoundingSphere} boundingSphere 世界坐标中的边界球。
 * @returns {number} 到边界球的距离。
 */

Camera.prototype.distanceToBoundingSphere = function(boundingSphere) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingSphere)) {
    throw new DeveloperError("boundingSphere is required.");
  }
  //>>includeEnd('debug');

  const toCenter = Cartesian3.subtract(
    this.positionWC,
    boundingSphere.center,
    scratchToCenter,
  );
  const proj = Cartesian3.multiplyByScalar(
    this.directionWC,
    Cartesian3.dot(toCenter, this.directionWC),
    scratchProj,
  );
  return Math.max(0.0, Cartesian3.magnitude(proj) - boundingSphere.radius);
};

const scratchPixelSize = new Cartesian2();

/**
 * 返回以米为单位的像素大小。
 *
 * @param {BoundingSphere} boundingSphere 世界坐标中的边界球。
 * @param {number} drawingBufferWidth 绘图缓冲区宽度。
 * @param {number} drawingBufferHeight 绘图缓冲区高度。
 * @returns {number} 以米为单位的像素大小。
 */

Camera.prototype.getPixelSize = function(
  boundingSphere,
  drawingBufferWidth,
  drawingBufferHeight,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingSphere)) {
    throw new DeveloperError("boundingSphere is required.");
  }
  if (!defined(drawingBufferWidth)) {
    throw new DeveloperError("drawingBufferWidth is required.");
  }
  if (!defined(drawingBufferHeight)) {
    throw new DeveloperError("drawingBufferHeight is required.");
  }
  //>>includeEnd('debug');

  const distance = this.distanceToBoundingSphere(boundingSphere);
  const pixelSize = this.frustum.getPixelDimensions(
    drawingBufferWidth,
    drawingBufferHeight,
    distance,
    this._scene.pixelRatio,
    scratchPixelSize,
  );
  return Math.max(pixelSize.x, pixelSize.y);
};

function createAnimationTemplateCV(
  camera,
  position,
  center,
  maxX,
  maxY,
  duration,
) {
  const newPosition = Cartesian3.clone(position);

  if (center.y > maxX) {
    newPosition.y -= center.y - maxX;
  } else if (center.y < -maxX) {
    newPosition.y += -maxX - center.y;
  }

  if (center.z > maxY) {
    newPosition.z -= center.z - maxY;
  } else if (center.z < -maxY) {
    newPosition.z += -maxY - center.z;
  }

  function updateCV(value) {
    const interp = Cartesian3.lerp(
      position,
      newPosition,
      value.time,
      new Cartesian3(),
    );
    camera.worldToCameraCoordinatesPoint(interp, camera.position);
  }
  return {
    easingFunction: EasingFunction.EXPONENTIAL_OUT,
    startObject: {
      time: 0.0,
    },
    stopObject: {
      time: 1.0,
    },
    duration: duration,
    update: updateCV,
  };
}

const normalScratch = new Cartesian3();
const centerScratch = new Cartesian3();
const posScratch = new Cartesian3();
const scratchCartesian3Subtract = new Cartesian3();

function createAnimationCV(camera, duration) {
  let position = camera.position;
  const direction = camera.direction;

  const normal = camera.worldToCameraCoordinatesVector(
    Cartesian3.UNIT_X,
    normalScratch,
  );
  const scalar =
    -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);
  const center = Cartesian3.add(
    position,
    Cartesian3.multiplyByScalar(direction, scalar, centerScratch),
    centerScratch,
  );
  camera.cameraToWorldCoordinatesPoint(center, center);

  position = camera.cameraToWorldCoordinatesPoint(camera.position, posScratch);

  const tanPhi = Math.tan(camera.frustum.fovy * 0.5);
  const tanTheta = camera.frustum.aspectRatio * tanPhi;
  const distToC = Cartesian3.magnitude(
    Cartesian3.subtract(position, center, scratchCartesian3Subtract),
  );
  const dWidth = tanTheta * distToC;
  const dHeight = tanPhi * distToC;

  const mapWidth = camera._maxCoord.x;
  const mapHeight = camera._maxCoord.y;

  const maxX = Math.max(dWidth - mapWidth, mapWidth);
  const maxY = Math.max(dHeight - mapHeight, mapHeight);

  if (
    position.z < -maxX ||
    position.z > maxX ||
    position.y < -maxY ||
    position.y > maxY
  ) {
    const translateX = center.y < -maxX || center.y > maxX;
    const translateY = center.z < -maxY || center.z > maxY;
    if (translateX || translateY) {
      return createAnimationTemplateCV(
        camera,
        position,
        center,
        maxX,
        maxY,
        duration,
      );
    }
  }

  return undefined;
}

/**
 * 创建一个动画以将地图移动到视图中。此方法仅适用于 2D 和哥伦布模式。
 *
 * @param {number} duration 动画的持续时间（以秒为单位）。
 * @returns {object} 动画对象，如果场景模式为 3D 或地图已在视图中，则返回 undefined。
 *
 * @private
 */

Camera.prototype.createCorrectPositionTween = function(duration) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(duration)) {
    throw new DeveloperError("duration is required.");
  }
  //>>includeEnd('debug');

  if (this._mode === SceneMode.COLUMBUS_VIEW) {
    return createAnimationCV(this, duration);
  }

  return undefined;
};

const scratchFlyToDestination = new Cartesian3();
const newOptions = {
  destination: undefined,
  heading: undefined,
  pitch: undefined,
  roll: undefined,
  duration: undefined,
  complete: undefined,
  cancel: undefined,
  endTransform: undefined,
  maximumHeight: undefined,
  easingFunction: undefined,
};

/**
 * 取消当前的相机飞行并将相机保持在当前位置。
 * 如果没有飞行正在进行，则此函数不执行任何操作。
 */

Camera.prototype.cancelFlight = function() {
  if (defined(this._currentFlight)) {
    this._currentFlight.cancelTween();
    this._currentFlight = undefined;
  }
};

/**
 * 完成当前的相机飞行并立即将相机移动到最终目的地。
 * 如果没有飞行正在进行，则此函数不执行任何操作。
 */

Camera.prototype.completeFlight = function() {
  if (defined(this._currentFlight)) {
    this._currentFlight.cancelTween();

    const options = {
      destination: undefined,
      orientation: {
        heading: undefined,
        pitch: undefined,
        roll: undefined,
      },
    };

    options.destination = newOptions.destination;
    options.orientation.heading = newOptions.heading;
    options.orientation.pitch = newOptions.pitch;
    options.orientation.roll = newOptions.roll;

    this.setView(options);

    if (defined(this._currentFlight.complete)) {
      this._currentFlight.complete();
    }

    this._currentFlight = undefined;
  }
};

/**
 * 将相机从当前位置飞往新位置。
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Cartesian3|Rectangle} options.destination 相机在世界坐标中的最终位置或从俯视图中可见的矩形。
 * @param {object} [options.orientation] 包含方向和上向属性或方位角、俯仰角和翻滚角属性的对象。默认情况下，方向将指向
 * 3D 中框架的中心，在哥伦布视图中指向负 z 方向。上向将在 3D 中指向当地北方，在哥伦布视图中指向正 y 方向。 在无限滚动模式下，2D 时不使用方向。
 * @param {number} [options.duration] 飞行的持续时间（以秒为单位）。如果省略，Cesium 会尝试根据飞行的距离计算理想的持续时间。
 * @param {Camera.FlightCompleteCallback} [options.complete] 飞行完成时执行的函数。
 * @param {Camera.FlightCancelledCallback} [options.cancel] 如果飞行被取消时执行的函数。
 * @param {Matrix4} [options.endTransform] 表示飞行完成时相机所处参考框架的变换矩阵。
 * @param {number} [options.maximumHeight] 飞行峰值时的最大高度。
 * @param {number} [options.pitchAdjustHeight] 如果相机飞得高于该值，飞行过程中会调整俯仰角向下看，以保持地球在视口内。
 * @param {number} [options.flyOverLongitude] 地球上两点之间总有两种方式。此选项强制相机选择飞越该经度的飞行方向。
 * @param {number} [options.flyOverLongitudeWeight] 仅在该路径不长于短路径乘以 flyOverLongitudeWeight 时，才飞越通过 flyOverLongitude 指定的经度。
 * @param {boolean} [options.convert] 是否将目标从世界坐标转换为场景坐标（仅在不使用 3D 时相关）。默认值为 <code>true</code>。
 * @param {EasingFunction.Callback} [options.easingFunction] 控制飞行持续时间内时间的插值方式。
 *
 * @exception {DeveloperError} 如果给定方向或上向，则两者都是必需的。
 *
 * @example
 * // 1. Fly to a position with a top-down view
 * viewer.camera.flyTo({
 *     destination : Cesium.Cartesian3.fromDegrees(-117.16, 32.71, 15000.0)
 * });
 *
 * // 2. Fly to a Rectangle with a top-down view
 * viewer.camera.flyTo({
 *     destination : Cesium.Rectangle.fromDegrees(west, south, east, north)
 * });
 *
 * // 3. Fly to a position with an orientation using unit vectors.
 * viewer.camera.flyTo({
 *     destination : Cesium.Cartesian3.fromDegrees(-122.19, 46.25, 5000.0),
 *     orientation : {
 *         direction : new Cesium.Cartesian3(-0.04231243104240401, -0.20123236049443421, -0.97862924300734),
 *         up : new Cesium.Cartesian3(-0.47934589305293746, -0.8553216253114552, 0.1966022179118339)
 *     }
 * });
 *
 * // 4. Fly to a position with an orientation using heading, pitch and roll.
 * viewer.camera.flyTo({
 *     destination : Cesium.Cartesian3.fromDegrees(-122.19, 46.25, 5000.0),
 *     orientation : {
 *         heading : Cesium.Math.toRadians(175.0),
 *         pitch : Cesium.Math.toRadians(-35.0),
 *         roll : 0.0
 *     }
 * });
 */
Camera.prototype.flyTo = function(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  let destination = options.destination;
  //>>includeStart('debug', pragmas.debug);
  if (!defined(destination)) {
    throw new DeveloperError("destination is required.");
  }
  //>>includeEnd('debug');

  const mode = this._mode;
  if (mode === SceneMode.MORPHING) {
    return;
  }

  this.cancelFlight();

  const isRectangle = destination instanceof Rectangle;
  if (isRectangle) {
    destination = this.getRectangleCameraCoordinates(
      destination,
      scratchFlyToDestination,
    );
  }

  let orientation = defaultValue(
    options.orientation,
    defaultValue.EMPTY_OBJECT,
  );
  if (defined(orientation.direction)) {
    orientation = directionUpToHeadingPitchRoll(
      this,
      destination,
      orientation,
      scratchSetViewOptions.orientation,
    );
  }

  if (defined(options.duration) && options.duration <= 0.0) {
    const setViewOptions = scratchSetViewOptions;
    setViewOptions.destination = options.destination;
    setViewOptions.orientation.heading = orientation.heading;
    setViewOptions.orientation.pitch = orientation.pitch;
    setViewOptions.orientation.roll = orientation.roll;
    setViewOptions.convert = options.convert;
    setViewOptions.endTransform = options.endTransform;
    this.setView(setViewOptions);
    if (typeof options.complete === "function") {
      options.complete();
    }
    return;
  }

  const that = this;
  /* eslint-disable-next-line prefer-const */
  let flightTween;

  newOptions.destination = destination;
  newOptions.heading = orientation.heading;
  newOptions.pitch = orientation.pitch;
  newOptions.roll = orientation.roll;
  newOptions.duration = options.duration;
  newOptions.complete = function() {
    if (flightTween === that._currentFlight) {
      that._currentFlight = undefined;
    }
    if (defined(options.complete)) {
      options.complete();
    }
  };
  newOptions.cancel = options.cancel;
  newOptions.endTransform = options.endTransform;
  newOptions.convert = isRectangle ? false : options.convert;
  newOptions.maximumHeight = options.maximumHeight;
  newOptions.pitchAdjustHeight = options.pitchAdjustHeight;
  newOptions.flyOverLongitude = options.flyOverLongitude;
  newOptions.flyOverLongitudeWeight = options.flyOverLongitudeWeight;
  newOptions.easingFunction = options.easingFunction;

  const scene = this._scene;
  const tweenOptions = CameraFlightPath.createTween(scene, newOptions);
  // If the camera doesn't actually need to go anywhere, duration
  // will be 0 and we can just complete the current flight.
  if (tweenOptions.duration === 0) {
    if (typeof tweenOptions.complete === "function") {
      tweenOptions.complete();
    }
    return;
  }
  flightTween = scene.tweens.add(tweenOptions);
  this._currentFlight = flightTween;

  // Save the final destination view information for the PRELOAD_FLIGHT pass.
  let preloadFlightCamera = this._scene.preloadFlightCamera;
  if (this._mode !== SceneMode.SCENE2D) {
    if (!defined(preloadFlightCamera)) {
      preloadFlightCamera = Camera.clone(this);
    }
    preloadFlightCamera.setView({
      destination: destination,
      orientation: orientation,
    });

    this._scene.preloadFlightCullingVolume =
      preloadFlightCamera.frustum.computeCullingVolume(
        preloadFlightCamera.positionWC,
        preloadFlightCamera.directionWC,
        preloadFlightCamera.upWC,
      );
  }
};

function distanceToBoundingSphere3D(camera, radius) {
  const frustum = camera.frustum;
  const tanPhi = Math.tan(frustum.fovy * 0.5);
  const tanTheta = frustum.aspectRatio * tanPhi;
  return Math.max(radius / tanTheta, radius / tanPhi);
}

function distanceToBoundingSphere2D(camera, radius) {
  let frustum = camera.frustum;
  const offCenterFrustum = frustum.offCenterFrustum;
  if (defined(offCenterFrustum)) {
    frustum = offCenterFrustum;
  }

  let right, top;
  const ratio = frustum.right / frustum.top;
  const heightRatio = radius * ratio;
  if (radius > heightRatio) {
    right = radius;
    top = right / ratio;
  } else {
    top = radius;
    right = heightRatio;
  }

  return Math.max(right, top) * 1.5;
}

const MINIMUM_ZOOM = 100.0;

function adjustBoundingSphereOffset(camera, boundingSphere, offset) {
  offset = HeadingPitchRange.clone(
    defined(offset) ? offset : Camera.DEFAULT_OFFSET,
  );

  const minimumZoom =
    camera._scene.screenSpaceCameraController.minimumZoomDistance;
  const maximumZoom =
    camera._scene.screenSpaceCameraController.maximumZoomDistance;
  const range = offset.range;
  if (!defined(range) || range === 0.0) {
    const radius = boundingSphere.radius;
    if (radius === 0.0) {
      offset.range = MINIMUM_ZOOM;
    } else if (
      camera.frustum instanceof OrthographicFrustum ||
      camera._mode === SceneMode.SCENE2D
    ) {
      offset.range = distanceToBoundingSphere2D(camera, radius);
    } else {
      offset.range = distanceToBoundingSphere3D(camera, radius);
    }
    offset.range = CesiumMath.clamp(offset.range, minimumZoom, maximumZoom);
  }

  return offset;
}

/**
 * 设置相机，使当前视角包含提供的边界球。
 *
 * <p>偏移量是指在以边界球中心为中心的局部东-北-上参考框架中的方位角/俯仰角/范围。
 * 方位角和俯仰角是在局部东-北-上参考框架中定义的。
 * 方位角是从 y 轴开始并朝 x 轴增加的角度。俯仰角是从 xy 平面旋转的角度。正俯仰角
 * 代表在平面下方。负俯仰角代表在平面上方。范围是从中心的距离。如果范围为零，
 * 将计算一个范围，以便整个边界球可见。</p>
 *
 * <p>在 2D 模式下，必须是俯视图。相机会位于目标上方并朝下看。相对于目标的高度将是范围。
 * 方位角将根据偏移量确定。如果无法从偏移量确定方位角，则方位角将是北。</p>
 *
 * @param {BoundingSphere} boundingSphere 要查看的边界球，使用世界坐标表示。
 * @param {HeadingPitchRange} [offset] 在以目标为中心的局部东-北-上参考框架中的偏移量。
 *
 * @exception {DeveloperError} 在变形时不支持 viewBoundingSphere。
 */

Camera.prototype.viewBoundingSphere = function(boundingSphere, offset) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingSphere)) {
    throw new DeveloperError("boundingSphere is required.");
  }

  if (this._mode === SceneMode.MORPHING) {
    throw new DeveloperError(
      "viewBoundingSphere is not supported while morphing.",
    );
  }
  //>>includeEnd('debug');

  offset = adjustBoundingSphereOffset(this, boundingSphere, offset);
  this.lookAt(boundingSphere.center, offset);
};

const scratchflyToBoundingSphereTransform = new Matrix4();
const scratchflyToBoundingSphereDestination = new Cartesian3();
const scratchflyToBoundingSphereDirection = new Cartesian3();
const scratchflyToBoundingSphereUp = new Cartesian3();
const scratchflyToBoundingSphereRight = new Cartesian3();
const scratchFlyToBoundingSphereCart4 = new Cartesian4();
const scratchFlyToBoundingSphereQuaternion = new Quaternion();
const scratchFlyToBoundingSphereMatrix3 = new Matrix3();

/**
 * 将相机飞往一个位置，使当前视角包含提供的边界球。
 *
 * <p>偏移量是指在以边界球中心为中心的局部东-北-上参考框架中的方位角/俯仰角/范围。
 * 方位角和俯仰角是在局部东-北-上参考框架中定义的。
 * 方位角是从 y 轴开始并朝 x 轴增加的角度。俯仰角是从 xy 平面旋转的角度。正俯仰角
 * 代表在平面下方。负俯仰角代表在平面上方。范围是从中心的距离。如果范围为零，
 * 将计算一个范围，以便整个边界球可见。</p>
 *
 * <p>在 2D 和哥伦布视图下，必须是俯视图。相机会位于目标上方并朝下看。相对于目标的高度将是范围。
 * 方位角将与当地北方对齐。</p>
 *
 * @param {BoundingSphere} boundingSphere 要查看的边界球，使用世界坐标表示。
 * @param {object} [options] 包含以下属性的对象：
 * @param {number} [options.duration] 飞行的持续时间（以秒为单位）。如果省略，Cesium 会尝试根据飞行的距离计算理想的持续时间。
 * @param {HeadingPitchRange} [options.offset] 在以目标为中心的局部东-北-上参考框架中的偏移量。
 * @param {Camera.FlightCompleteCallback} [options.complete] 飞行完成时执行的函数。
 * @param {Camera.FlightCancelledCallback} [options.cancel] 如果飞行被取消时执行的函数。
 * @param {Matrix4} [options.endTransform] 表示飞行完成时相机所处参考框架的变换矩阵。
 * @param {number} [options.maximumHeight] 飞行峰值时的最大高度。
 * @param {number} [options.pitchAdjustHeight] 如果相机飞得高于该值，飞行过程中会调整俯仰角向下看，以保持地球在视口内。
 * @param {number} [options.flyOverLongitude] 地球上两点之间总有两种飞行方式。此选项强制相机选择飞越该经度的飞行方向。
 * @param {number} [options.flyOverLongitudeWeight] 仅在该路径不长于短路径乘以 flyOverLongitudeWeight 时，才飞越通过 flyOverLongitude 指定的经度。
 * @param {EasingFunction.Callback} [options.easingFunction] 控制飞行持续时间内时间的插值方式。
 */

Camera.prototype.flyToBoundingSphere = function(boundingSphere, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(boundingSphere)) {
    throw new DeveloperError("boundingSphere is required.");
  }
  //>>includeEnd('debug');

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const scene2D =
    this._mode === SceneMode.SCENE2D || this._mode === SceneMode.COLUMBUS_VIEW;
  this._setTransform(Matrix4.IDENTITY);
  const offset = adjustBoundingSphereOffset(
    this,
    boundingSphere,
    options.offset,
  );

  let position;
  if (scene2D) {
    position = Cartesian3.multiplyByScalar(
      Cartesian3.UNIT_Z,
      offset.range,
      scratchflyToBoundingSphereDestination,
    );
  } else {
    position = offsetFromHeadingPitchRange(
      offset.heading,
      offset.pitch,
      offset.range,
    );
  }

  const scene = this._scene;
  const ellipsoid = defaultValue(scene.ellipsoid, Ellipsoid.default);

  const transform = Transforms.eastNorthUpToFixedFrame(
    boundingSphere.center,
    ellipsoid,
    scratchflyToBoundingSphereTransform,
  );
  Matrix4.multiplyByPoint(transform, position, position);

  let direction;
  let up;

  if (!scene2D) {
    direction = Cartesian3.subtract(
      boundingSphere.center,
      position,
      scratchflyToBoundingSphereDirection,
    );
    Cartesian3.normalize(direction, direction);

    up = Matrix4.multiplyByPointAsVector(
      transform,
      Cartesian3.UNIT_Z,
      scratchflyToBoundingSphereUp,
    );
    if (1.0 - Math.abs(Cartesian3.dot(direction, up)) < CesiumMath.EPSILON6) {
      const rotateQuat = Quaternion.fromAxisAngle(
        direction,
        offset.heading,
        scratchFlyToBoundingSphereQuaternion,
      );
      const rotation = Matrix3.fromQuaternion(
        rotateQuat,
        scratchFlyToBoundingSphereMatrix3,
      );

      Cartesian3.fromCartesian4(
        Matrix4.getColumn(transform, 1, scratchFlyToBoundingSphereCart4),
        up,
      );
      Matrix3.multiplyByVector(rotation, up, up);
    }

    const right = Cartesian3.cross(
      direction,
      up,
      scratchflyToBoundingSphereRight,
    );
    Cartesian3.cross(right, direction, up);
    Cartesian3.normalize(up, up);
  }

  this.flyTo({
    destination: position,
    orientation: {
      direction: direction,
      up: up,
    },
    duration: options.duration,
    complete: options.complete,
    cancel: options.cancel,
    endTransform: options.endTransform,
    maximumHeight: options.maximumHeight,
    easingFunction: options.easingFunction,
    flyOverLongitude: options.flyOverLongitude,
    flyOverLongitudeWeight: options.flyOverLongitudeWeight,
    pitchAdjustHeight: options.pitchAdjustHeight,
  });
};

const scratchCartesian3_1 = new Cartesian3();
const scratchCartesian3_2 = new Cartesian3();
const scratchCartesian3_3 = new Cartesian3();
const scratchCartesian3_4 = new Cartesian3();
const horizonPoints = [
  new Cartesian3(),
  new Cartesian3(),
  new Cartesian3(),
  new Cartesian3(),
];

function computeHorizonQuad(camera, ellipsoid) {
  const radii = ellipsoid.radii;
  const p = camera.positionWC;

  // Find the corresponding position in the scaled space of the ellipsoid.
  const q = Cartesian3.multiplyComponents(
    ellipsoid.oneOverRadii,
    p,
    scratchCartesian3_1,
  );

  const qMagnitude = Cartesian3.magnitude(q);
  const qUnit = Cartesian3.normalize(q, scratchCartesian3_2);

  // Determine the east and north directions at q.
  let eUnit;
  let nUnit;
  if (
    Cartesian3.equalsEpsilon(qUnit, Cartesian3.UNIT_Z, CesiumMath.EPSILON10)
  ) {
    eUnit = new Cartesian3(0, 1, 0);
    nUnit = new Cartesian3(0, 0, 1);
  } else {
    eUnit = Cartesian3.normalize(
      Cartesian3.cross(Cartesian3.UNIT_Z, qUnit, scratchCartesian3_3),
      scratchCartesian3_3,
    );
    nUnit = Cartesian3.normalize(
      Cartesian3.cross(qUnit, eUnit, scratchCartesian3_4),
      scratchCartesian3_4,
    );
  }

  // Determine the radius of the 'limb' of the ellipsoid.
  const wMagnitude = Math.sqrt(Cartesian3.magnitudeSquared(q) - 1.0);

  // Compute the center and offsets.
  const center = Cartesian3.multiplyByScalar(
    qUnit,
    1.0 / qMagnitude,
    scratchCartesian3_1,
  );
  const scalar = wMagnitude / qMagnitude;
  const eastOffset = Cartesian3.multiplyByScalar(
    eUnit,
    scalar,
    scratchCartesian3_2,
  );
  const northOffset = Cartesian3.multiplyByScalar(
    nUnit,
    scalar,
    scratchCartesian3_3,
  );

  // A conservative measure for the longitudes would be to use the min/max longitudes of the bounding frustum.
  const upperLeft = Cartesian3.add(center, northOffset, horizonPoints[0]);
  Cartesian3.subtract(upperLeft, eastOffset, upperLeft);
  Cartesian3.multiplyComponents(radii, upperLeft, upperLeft);

  const lowerLeft = Cartesian3.subtract(center, northOffset, horizonPoints[1]);
  Cartesian3.subtract(lowerLeft, eastOffset, lowerLeft);
  Cartesian3.multiplyComponents(radii, lowerLeft, lowerLeft);

  const lowerRight = Cartesian3.subtract(center, northOffset, horizonPoints[2]);
  Cartesian3.add(lowerRight, eastOffset, lowerRight);
  Cartesian3.multiplyComponents(radii, lowerRight, lowerRight);

  const upperRight = Cartesian3.add(center, northOffset, horizonPoints[3]);
  Cartesian3.add(upperRight, eastOffset, upperRight);
  Cartesian3.multiplyComponents(radii, upperRight, upperRight);

  return horizonPoints;
}

const scratchPickCartesian2 = new Cartesian2();
const scratchRectCartesian = new Cartesian3();
const cartoArray = [
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
  new Cartographic(),
];
function addToResult(x, y, index, camera, ellipsoid, computedHorizonQuad) {
  scratchPickCartesian2.x = x;
  scratchPickCartesian2.y = y;
  const r = camera.pickEllipsoid(
    scratchPickCartesian2,
    ellipsoid,
    scratchRectCartesian,
  );
  if (defined(r)) {
    cartoArray[index] = ellipsoid.cartesianToCartographic(r, cartoArray[index]);
    return 1;
  }
  cartoArray[index] = ellipsoid.cartesianToCartographic(
    computedHorizonQuad[index],
    cartoArray[index],
  );
  return 0;
}
/**
 * 计算椭球体上可见的近似矩形。
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 你想要了解可见区域的椭球体。
 * @param {Rectangle} [result] 用于存储结果的矩形。
 *
 * @returns {Rectangle|undefined} 可见的矩形，或者如果椭球体完全不可见则返回 undefined。
 */

Camera.prototype.computeViewRectangle = function(ellipsoid, result) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  const cullingVolume = this.frustum.computeCullingVolume(
    this.positionWC,
    this.directionWC,
    this.upWC,
  );
  const boundingSphere = new BoundingSphere(
    Cartesian3.ZERO,
    ellipsoid.maximumRadius,
  );
  const visibility = cullingVolume.computeVisibility(boundingSphere);
  if (visibility === Intersect.OUTSIDE) {
    return undefined;
  }

  const canvas = this._scene.canvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  let successfulPickCount = 0;

  const computedHorizonQuad = computeHorizonQuad(this, ellipsoid);

  successfulPickCount += addToResult(
    0,
    0,
    0,
    this,
    ellipsoid,
    computedHorizonQuad,
  );
  successfulPickCount += addToResult(
    0,
    height,
    1,
    this,
    ellipsoid,
    computedHorizonQuad,
  );
  successfulPickCount += addToResult(
    width,
    height,
    2,
    this,
    ellipsoid,
    computedHorizonQuad,
  );
  successfulPickCount += addToResult(
    width,
    0,
    3,
    this,
    ellipsoid,
    computedHorizonQuad,
  );

  if (successfulPickCount < 2) {
    // If we have space non-globe in 3 or 4 corners then return the whole globe
    return Rectangle.MAX_VALUE;
  }

  result = Rectangle.fromCartographicArray(cartoArray, result);

  // Detect if we go over the poles
  let distance = 0;
  let lastLon = cartoArray[3].longitude;
  for (let i = 0; i < 4; ++i) {
    const lon = cartoArray[i].longitude;
    const diff = Math.abs(lon - lastLon);
    if (diff > CesiumMath.PI) {
      // Crossed the dateline
      distance += CesiumMath.TWO_PI - diff;
    } else {
      distance += diff;
    }

    lastLon = lon;
  }

  // We are over one of the poles so adjust the rectangle accordingly
  if (
    CesiumMath.equalsEpsilon(
      Math.abs(distance),
      CesiumMath.TWO_PI,
      CesiumMath.EPSILON9,
    )
  ) {
    result.west = -CesiumMath.PI;
    result.east = CesiumMath.PI;
    if (cartoArray[0].latitude >= 0.0) {
      result.north = CesiumMath.PI_OVER_TWO;
    } else {
      result.south = -CesiumMath.PI_OVER_TWO;
    }
  }

  return result;
};

/**
 * 将视锥/投影切换为透视模式。
 *
 * 在 2D 模式下，此函数无操作，因为 2D 模式必须始终是正交的。
 */

Camera.prototype.switchToPerspectiveFrustum = function() {
  if (
    this._mode === SceneMode.SCENE2D ||
    this.frustum instanceof PerspectiveFrustum
  ) {
    return;
  }

  const scene = this._scene;
  this.frustum = new PerspectiveFrustum();
  this.frustum.aspectRatio =
    scene.drawingBufferWidth / scene.drawingBufferHeight;
  this.frustum.fov = CesiumMath.toRadians(60.0);
};

/**
 * 将视锥/投影切换为正交模式。
 *
 * 在 2D 模式下，此函数无操作，因为 2D 模式将始终是正交的。
 */

Camera.prototype.switchToOrthographicFrustum = function() {
  if (
    this._mode === SceneMode.SCENE2D ||
    this.frustum instanceof OrthographicFrustum
  ) {
    return;
  }

  // This must be called before changing the frustum because it uses the previous
  // frustum to reconstruct the world space position from the depth buffer.
  const frustumWidth = calculateOrthographicFrustumWidth(this);

  const scene = this._scene;
  this.frustum = new OrthographicFrustum();
  this.frustum.aspectRatio =
    scene.drawingBufferWidth / scene.drawingBufferHeight;
  this.frustum.width = frustumWidth;
};

/**
 * @private
 */
Camera.clone = function(camera, result) {
  if (!defined(result)) {
    result = new Camera(camera._scene);
  }

  Cartesian3.clone(camera.position, result.position);
  Cartesian3.clone(camera.direction, result.direction);
  Cartesian3.clone(camera.up, result.up);
  Cartesian3.clone(camera.right, result.right);
  Matrix4.clone(camera._transform, result.transform);
  result._transformChanged = true;
  result.frustum = camera.frustum.clone();

  return result;
};

/**
 * 飞行完成时将执行的函数。
 * @callback Camera.FlightCompleteCallback
 */

/**
 * 飞行被取消时将执行的函数。
 * @callback Camera.FlightCancelledCallback
 */

export default Camera;
