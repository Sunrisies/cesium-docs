import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Rectangle from "../Core/Rectangle.js";

/**
 * 控制地球透明度的属性。
 *
 * @alias GlobeTranslucency
 * @constructor
 */

function GlobeTranslucency() {
  this._enabled = false;
  this._frontFaceAlpha = 1.0;
  this._frontFaceAlphaByDistance = undefined;
  this._backFaceAlpha = 1.0;
  this._backFaceAlphaByDistance = undefined;
  this._rectangle = Rectangle.clone(Rectangle.MAX_VALUE);
}

Object.defineProperties(GlobeTranslucency.prototype, {
  /**
   * 当为 true 时，地球作为透明表面进行渲染。
   * <br /><br />
   * alpha 值通过混合 {@link Globe#material}、{@link Globe#imageryLayers} 和
   * {@link Globe#baseColor} 来计算，这些都可能包含透明度，然后乘以
   * {@link GlobeTranslucency#frontFaceAlpha} 和 {@link GlobeTranslucency#frontFaceAlphaByDistance} 处理前面，以及
   * {@link GlobeTranslucency#backFaceAlpha} 和 {@link GlobeTranslucency#backFaceAlphaByDistance} 处理后面。
   * 当相机位于地下时，背面和前面的面会交换，即背面几何体
   * 被视为正面。
   * <br /><br />
   * 默认情况下禁用透明度。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {boolean}
   * @default false
   *
   * @see GlobeTranslucency#frontFaceAlpha
   * @see GlobeTranslucency#frontFaceAlphaByDistance
   * @see GlobeTranslucency#backFaceAlpha
   * @see GlobeTranslucency#backFaceAlphaByDistance
   */
  enabled: {
    get: function () {
      return this._enabled;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("enabled", value);
      //>>includeEnd('debug');
      this._enabled = value;
    },
  },

  /**
   * 应用于地球前面面的常量透明度。
   * <br /><br />
   * {@link GlobeTranslucency#enabled} 必须设置为 true 才能使此选项生效。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {number}
   * @default 1.0
   *
   * @see GlobeTranslucency#enabled
   * @see GlobeTranslucency#frontFaceAlphaByDistance
   *
   * @example
   * // 将前面面的透明度设置为 0.5。
   * globe.translucency.frontFaceAlpha = 0.5;
   * globe.translucency.enabled = true;
   */

  frontFaceAlpha: {
    get: function () {
      return this._frontFaceAlpha;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("frontFaceAlpha", value, 0.0);
      Check.typeOf.number.lessThanOrEquals("frontFaceAlpha", value, 1.0);
      //>>includeEnd('debug');
      this._frontFaceAlpha = value;
    },
  },
  /**
   * 获取或设置地球前面面的近距离和远距离透明度属性，基于与相机的距离。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限内时，透明度将在
   * {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间进行插值。
   * 在这些范围之外，透明度保持在最近的边界。如果未定义，
   * frontFaceAlphaByDistance 将被禁用。
   * <br /><br />
   * {@link GlobeTranslucency#enabled} 必须设置为 true 才能使此选项生效。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {NearFarScalar}
   * @default undefined
   *
   * @see GlobeTranslucency#enabled
   * @see GlobeTranslucency#frontFaceAlpha
   *
   * @example
   * // Example 1.
   * // Set front face translucency to 0.5 when the
   * // camera is 1500 meters from the surface and 1.0
   * // as the camera distance approaches 8.0e6 meters.
   * globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(1.5e2, 0.5, 8.0e6, 1.0);
   * globe.translucency.enabled = true;
   *
   * @example
   * // Example 2.
   * // Disable front face translucency by distance
   * globe.translucency.frontFaceAlphaByDistance = undefined;
   */
  frontFaceAlphaByDistance: {
    get: function () {
      return this._frontFaceAlphaByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far < value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');
      this._frontFaceAlphaByDistance = NearFarScalar.clone(
        value,
        this._frontFaceAlphaByDistance,
      );
    },
  },

  /**
   * 应用于地球背面面的常量透明度。
   * <br /><br />
   * {@link GlobeTranslucency#enabled} 必须设置为 true 才能使此选项生效。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {number}
   * @default 1.0
   *
   * @see GlobeTranslucency#enabled
   * @see GlobeTranslucency#backFaceAlphaByDistance
   *
   * @example
   * // Set back face translucency to 0.5.
   * globe.translucency.backFaceAlpha = 0.5;
   * globe.translucency.enabled = true;
   */
  backFaceAlpha: {
    get: function () {
      return this._backFaceAlpha;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number.greaterThanOrEquals("backFaceAlpha", value, 0.0);
      Check.typeOf.number.lessThanOrEquals("backFaceAlpha", value, 1.0);
      //>>includeEnd('debug');
      this._backFaceAlpha = value;
    },
  },
  /**
   * 获取或设置地球背面面的近距离和远距离透明度属性，基于与相机的距离。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限内时，透明度将在
   * {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间进行插值。
   * 在这些范围之外，透明度保持在最近的边界。如果未定义，
   * backFaceAlphaByDistance 将被禁用。
   * <br /><br />
   * {@link GlobeTranslucency#enabled} 必须设置为 true 才能使此选项生效。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {NearFarScalar}
   * @default undefined
   *
   * @see GlobeTranslucency#enabled
   * @see GlobeTranslucency#backFaceAlpha
   *
   * @example
   * // Example 1.
   * // Set back face translucency to 0.5 when the
   * // camera is 1500 meters from the surface and 1.0
   * // as the camera distance approaches 8.0e6 meters.
   * globe.translucency.backFaceAlphaByDistance = new Cesium.NearFarScalar(1.5e2, 0.5, 8.0e6, 1.0);
   * globe.translucency.enabled = true;
   *
   * @example
   * // Example 2.
   * // Disable back face translucency by distance
   * globe.translucency.backFaceAlphaByDistance = undefined;
   */
  backFaceAlphaByDistance: {
    get: function () {
      return this._backFaceAlphaByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far < value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');
      this._backFaceAlphaByDistance = NearFarScalar.clone(
        value,
        this._backFaceAlphaByDistance,
      );
    },
  },

  /**
   * 指定一个 {@link Rectangle} 的属性，用于限制透明度在一个大地区域内。
   * 默认为大地坐标的最大范围。
   *
   * @memberof GlobeTranslucency.prototype
   *
   * @type {Rectangle}
   * @default {@link Rectangle.MAX_VALUE}
   */
  rectangle: {
    get: function () {
      return this._rectangle;
    },
    set: function (value) {
      if (!defined(value)) {
        value = Rectangle.clone(Rectangle.MAX_VALUE);
      }
      Rectangle.clone(value, this._rectangle);
    },
  },
});

export default GlobeTranslucency;
