import defaultValue from "../Core/defaultValue.js";

/**
 * 表示在粒子系统生命周期的给定时刻从 {@link ParticleSystem} 发出的 {@link Particle} 弹幕。
 *
 * @alias ParticleBurst
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {number} [options.time=0.0] 粒子系统生命周期开始后，弹幕发生的时间（以秒为单位）。
 * @param {number} [options.minimum=0.0] 弹幕中发射的最少粒子数量。
 * @param {number} [options.maximum=50.0] 弹幕中发射的最多粒子数量。
 */

function ParticleBurst(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 粒子系统生命周期开始后，弹幕发生的时间（以秒为单位）。
   * @type {number}
   * @default 0.0
   */
  this.time = defaultValue(options.time, 0.0);
  /**
   * 发射的最少粒子数量。
   * @type {number}
   * @default 0.0
   */
  this.minimum = defaultValue(options.minimum, 0.0);
  /**
   * 发射的最多粒子数量。
   * @type {number}
   * @default 50.0
   */
  this.maximum = defaultValue(options.maximum, 50.0);

  this._complete = false;
}


Object.defineProperties(ParticleBurst.prototype, {
  /**
   * <code>true</code> 如果弹幕已完成；<code>false</code> 否则。
   * @memberof ParticleBurst.prototype
   * @type {boolean}
   */

  complete: {
    get: function () {
      return this._complete;
    },
  },
});
export default ParticleBurst;
