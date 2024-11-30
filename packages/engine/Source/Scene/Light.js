import DeveloperError from "../Core/DeveloperError.js";

/**
 * 光源。此类型描述一个接口，且不打算直接实例化。<code>color</code> 和 <code>intensity</code> 共同产生高动态范围的光色。<code>intensity</code> 也可以单独用于调节光的亮度，而不改变色调。
 *
 * @alias Light
 * @constructor
 *
 * @see DirectionalLight
 * @see SunLight
 */
function Light() {}

Object.defineProperties(Light.prototype, {
  /**
   * 光的颜色。
   * @memberof Light.prototype
   * @type {Color}
   */
  color: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 强度控制光的强度。<code>intensity</code> 的最小值为 0.0，没有最大值。
   * @memberof Light.prototype
   * @type {number}
   */
  intensity: {
    get: DeveloperError.throwInstantiationError,
  },
});

export default Light;
