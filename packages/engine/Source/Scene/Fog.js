import Cartesian3 from "../Core/Cartesian3.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import CesiumMath from "../Core/Math.js";
import SceneMode from "./SceneMode.js";

/**
 * 将大气层与远离相机的几何体混合，以便进行地平线视图。通过渲染更少的几何体和减少地形请求的调度， 
 * 允许额外的性能提升。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Fog.html|Cesium Sandcastle Fog Demo}
 *
 * @alias Fog
 * @constructor
 */
function Fog() {
  /**
   * <code>true</code> 如果雾效果已启用，<code>false</code> 否则。
   * @type {boolean}
   * @default true
   * @example
   * // Disable fog in the scene
   * viewer.scene.fog.enabled = false;
   */
  this.enabled = true;
 /**
   * <code>true</code> 如果雾效果可以在着色器中渲染，<code>false</code> 否则。
   * 这使得可以受益于基于雾密度的优化瓦片加载策略，而无需实际的视觉渲染。
   * @type {boolean}
   * @default true
   * @example
   * // Use fog culling but don't render it
   * viewer.scene.fog.enabled = true;
   * viewer.scene.fog.renderable = false;
   */
  this.renderable = true;
  /**
   * 一个标量，确定雾的密度。在完全被雾覆盖的地形将被剔除。
   * 当这个数值接近 1.0 时，雾的密度会增加，而接近 0 时则变得更稀薄。
   * 雾越密，地形剔除的越积极。例如，如果相机位于椭球体上方 1000.0m 的高度，
   * 将该值增加到 3.0e-3 会导致许多离观察者较近的瓦片被剔除。
   * 减小该值将把雾推远于观察者，但会降低性能，因为更多的地形被渲染。
   * @type {number}
   * @default 0.0006
   * @example
   * // Double the default fog density
   * viewer.scene.fog.density = 0.0012;
   */
  this.density = 0.0006;
  /**
   * 用于根据相机在地形上方的高度调整密度的标量。
   * @type {number}
   * @default 0.001
   */
  this.heightScalar = 0.001;
  this._heightFalloff = 0.59;

  /**
   * 应用雾的最大高度。如果相机位于此高度之上，则将禁用雾效。
   * @type {number}
   * @default 800000.0
   */
  this.maxHeight = 800000.0;

  /**
   * 影响雾的视觉密度的标量。该值不会影响地形的剔除。
   * 与 {@link Fog.density} 结合使用，可以使雾看起来更浓或更淡。
   * @type {number}
   * @default 0.15
   * @experimental 此标量的值可能不是最终值，可能会更改。
   * @example
   * // Increase fog appearance effect
   * viewer.scene.fog.visualDensityScalar = 0.6;
   */
  this.visualDensityScalar = 0.15;
  /**
   * 当地形瓦片部分处于雾中时，用于增加屏幕空间误差的因子。其效果是减少
   * 请求渲染的地形瓦片数量。如果设置为零，则该功能将被禁用。如果在山区增加该值，
   * 将减少请求的瓦片数量，但地平线附近的地形网格可能会显著降低分辨率。如果在相对平坦的区域增加该值，
   * 则地平线上的变化几乎不可察觉。
   * @type {number}
   * @default 2.0
   */
  this.screenSpaceErrorFactor = 2.0;

  /**
   * 雾颜色的最小亮度，受光照影响。值为 0.0 可能会导致雾完全变黑。值为 1.0 则不会影响
   * 亮度。
   * @type {number}
   * @default 0.03
   */

  this.minimumBrightness = 0.03;
}

Object.defineProperties(Fog.prototype, {
  /**
   * 在函数中使用的指数因子，用于调整基于相机在椭球体上方高度的密度变化。较小的值会随着相机高度的增加而产生更平缓的过渡。
   * 值必须大于 0。
   * @memberof Fog.prototype
   * @type {number}
   * @default 0.59
   */

  heightFalloff: {
    get: function () {
      return this._heightFalloff;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value < 0) {
        throw new DeveloperError("value must be positive.");
      }
      //>>includeEnd('debug');

      this._heightFalloff = value;
    },
  },
});

const scratchPositionNormal = new Cartesian3();

/**
 * @param {FrameState} frameState
 * @private
 */
Fog.prototype.update = function (frameState) {
  const enabled = (frameState.fog.enabled = this.enabled);
  if (!enabled) {
    return;
  }

  frameState.fog.renderable = this.renderable;

  const camera = frameState.camera;
  const positionCartographic = camera.positionCartographic;

  // Turn off fog in space.
  if (
    !defined(positionCartographic) ||
    positionCartographic.height > this.maxHeight ||
    frameState.mode !== SceneMode.SCENE3D
  ) {
    frameState.fog.enabled = false;
    frameState.fog.density = 0;
    return;
  }

  const height = positionCartographic.height;
  let density =
    this.density *
    this.heightScalar *
    Math.pow(
      Math.max(height / this.maxHeight, CesiumMath.EPSILON4),
      -Math.max(this._heightFalloff, 0.0),
    );

  // Fade fog in as the camera tilts toward the horizon.
  const positionNormal = Cartesian3.normalize(
    camera.positionWC,
    scratchPositionNormal,
  );
  const dot = Math.abs(Cartesian3.dot(camera.directionWC, positionNormal));
  density *= 1.0 - dot;

  frameState.fog.density = density;
  frameState.fog.visualDensityScalar = this.visualDensityScalar;
  frameState.fog.sse = this.screenSpaceErrorFactor;
  frameState.fog.minimumBrightness = this.minimumBrightness;
};
export default Fog;
