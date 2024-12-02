import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";

const defaultSize = new Cartesian2(1.0, 1.0);

/**
 * 由 {@link ParticleSystem} 发射的粒子。
 *
 * @alias Particle
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {number} [options.mass=1.0] 粒子的质量（以千克为单位）。
 * @param {Cartesian3} [options.position=Cartesian3.ZERO] 粒子的初始位置（以世界坐标表示）。
 * @param {Cartesian3} [options.velocity=Cartesian3.ZERO] 粒子的速度向量（以世界坐标表示）。
 * @param {number} [options.life=Number.MAX_VALUE] 粒子的生命周期（以秒为单位）。
 * @param {object} [options.image] 用于广告牌的 URI、HTMLImageElement 或 HTMLCanvasElement。
 * @param {Color} [options.startColor=Color.WHITE] 粒子出生时的颜色。
 * @param {Color} [options.endColor=Color.WHITE] 粒子死亡时的颜色。
 * @param {number} [options.startScale=1.0] 粒子出生时的缩放比例。
 * @param {number} [options.endScale=1.0] 粒子死亡时的缩放比例。
 * @param {Cartesian2} [options.imageSize=new Cartesian2(1.0, 1.0)] 粒子图像的宽度和高度（以像素为单位的尺寸）。
 */

function Particle(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 粒子的质量（以千克为单位）。
   * @type {number}
   * @default 1.0
   */
  this.mass = defaultValue(options.mass, 1.0);
  /**
   * 粒子的世界坐标位置。
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   */
  this.position = Cartesian3.clone(
    defaultValue(options.position, Cartesian3.ZERO),
  );
  /**
   * 粒子的世界坐标速度。
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   */
  this.velocity = Cartesian3.clone(
    defaultValue(options.velocity, Cartesian3.ZERO),
  );
  /**
   * 粒子的生命周期（以秒为单位）。
   * @type {number}
   * @default Number.MAX_VALUE
   */
  this.life = defaultValue(options.life, Number.MAX_VALUE);
  /**
   * 用于粒子的图像。
   * @type {object}
   * @default undefined
   */
  this.image = options.image;
  /**
   * 粒子出生时的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.startColor = Color.clone(defaultValue(options.startColor, Color.WHITE));
  /**
   * 粒子死亡时的颜色。
   * @type {Color}
   * @default Color.WHITE
   */
  this.endColor = Color.clone(defaultValue(options.endColor, Color.WHITE));
  /**
   * 粒子出生时的缩放比例。
   * @type {number}
   * @default 1.0
   */
  this.startScale = defaultValue(options.startScale, 1.0);
  /**
   * 粒子死亡时的缩放比例。
   * @type {number}
   * @default 1.0
   */
  this.endScale = defaultValue(options.endScale, 1.0);
  /**
   * 粒子图像的宽度和高度（以像素为单位的尺寸）。
   * @type {Cartesian2}
   * @default new Cartesian(1.0, 1.0)
   */
  this.imageSize = Cartesian2.clone(
    defaultValue(options.imageSize, defaultSize),
  );

  this._age = 0.0;
  this._normalizedAge = 0.0;

  // 用于 ParticleSystem
  this._billboard = undefined;
}


Object.defineProperties(Particle.prototype, {
  /**
   * 获取粒子的年龄（以秒为单位）。
   * @memberof Particle.prototype
   * @type {number}
   */
  age: {
    get: function () {
      return this._age;
    },
  },
  /**
   * 获取归一化的年龄值，范围在 [0.0, 1.0] 之间。
   * @memberof Particle.prototype
   * @type {number}
   */
  normalizedAge: {
    get: function () {
      return this._normalizedAge;
    },
  },
});


const deltaScratch = new Cartesian3();

/**
 * @private
 */
Particle.prototype.update = function (dt, particleUpdateFunction) {
  // Apply the velocity
  Cartesian3.multiplyByScalar(this.velocity, dt, deltaScratch);
  Cartesian3.add(this.position, deltaScratch, this.position);

  // Update any forces.
  if (defined(particleUpdateFunction)) {
    particleUpdateFunction(this, dt);
  }

  // Age the particle
  this._age += dt;

  // Compute the normalized age.
  if (this.life === Number.MAX_VALUE) {
    this._normalizedAge = 0.0;
  } else {
    this._normalizedAge = this._age / this.life;
  }

  // If this particle is older than it's lifespan then die.
  return this._age <= this.life;
};
export default Particle;
