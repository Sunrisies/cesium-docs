import Cartesian3 from "./Cartesian3.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Quaternion from "./Quaternion.js";

const defaultScale = new Cartesian3(1.0, 1.0, 1.0);
const defaultTranslation = Cartesian3.ZERO;
const defaultRotation = Quaternion.IDENTITY;

/**
 * 一个由平移、旋转和缩放定义的仿射变换。
 * @alias TranslationRotationScale
 * @constructor
 *
 * @param {Cartesian3} [translation=Cartesian3.ZERO] A {@link Cartesian3} 用于指定要应用于节点的 (x, y, z) 平移。
 * @param {Quaternion} [rotation=Quaternion.IDENTITY] A {@link Quaternion} 用于指定要应用于节点的 (x, y, z, w) 旋转。
 * @param {Cartesian3} [scale=new Cartesian3(1.0, 1.0, 1.0)] A {@link Cartesian3} 用于指定要应用于节点的 (x, y, z) 缩放。
 */
function TranslationRotationScale(translation, rotation, scale) {
  /**
   * 获取或设置要应用于节点的 (x, y, z) 平移。
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   */
  this.translation = Cartesian3.clone(
    defaultValue(translation, defaultTranslation),
  );

  /**
   * 获取或设置要应用于节点的 (x, y, z, w) 旋转。
   * @type {Quaternion}
   * @default Quaternion.IDENTITY
   */
  this.rotation = Quaternion.clone(defaultValue(rotation, defaultRotation));

  /**
   * 获取或设置要应用于节点的 (x, y, z) 缩放。
   * @type {Cartesian3}
   * @default new Cartesian3(1.0, 1.0, 1.0)
   */
  this.scale = Cartesian3.clone(defaultValue(scale, defaultScale));
}

/**
 * 将此实例与提供的实例进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 *
 * @param {TranslationRotationScale} [right] 右侧的 TranslationRotationScale。
 * @returns {boolean} 如果相等则为 <code>true</code>，否则为 <code>false</code>。
 */
TranslationRotationScale.prototype.equals = function (right) {
  return (
    this === right ||
    (defined(right) &&
      Cartesian3.equals(this.translation, right.translation) &&
      Quaternion.equals(this.rotation, right.rotation) &&
      Cartesian3.equals(this.scale, right.scale))
  );
};
export default TranslationRotationScale;
