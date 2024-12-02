import defaultValue from "../Core/defaultValue.js";
import PointCloudEyeDomeLighting from "./PointCloudEyeDomeLighting.js";

/**
 * 在使用 3D Tiles 渲染点云时，根据几何错误执行点衰减的选项。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {boolean} [options.attenuation=false] 基于几何错误执行点衰减。
 * @param {number} [options.geometricErrorScale=1.0] 应用于每个瓦片几何错误的缩放因子。
 * @param {number} [options.maximumAttenuation] 最大衰减像素。默认为 Cesium3DTileset 的 maximumScreenSpaceError。
 * @param {number} [options.baseResolution] 数据集中平均基准分辨率，单位为米。在没有几何错误时的替代值。
 * @param {boolean} [options.eyeDomeLighting=true] 当为 true 时，在执行点衰减时使用眼穹灯光。
 * @param {number} [options.eyeDomeLightingStrength=1.0] 增加此值将增加斜坡和边缘的对比度。
 * @param {number} [options.eyeDomeLightingRadius=1.0] 增加眼穹灯光的轮廓厚度。
 * @param {boolean} [options.backFaceCulling=false] 确定是否隐藏背面朝向的点。此选项仅在数据包含法线时有效。
 * @param {boolean} [options.normalShading=true] 确定包含法线的点云是否被场景的光源照亮。
 *
 * @alias PointCloudShading
 * @constructor
 */

function PointCloudShading(options) {
  const pointCloudShading = defaultValue(options, {});

  /**
   * 基于几何错误执行点衰减。
   * @type {boolean}
   * @default false
   */
  this.attenuation = defaultValue(pointCloudShading.attenuation, false);

  /**
   * 在计算衰减之前应用于几何错误的缩放因子。
   * @type {number}
   * @default 1.0
   */
  this.geometricErrorScale = defaultValue(
    pointCloudShading.geometricErrorScale,
    1.0,
  );

  /**
   * 最大点衰减像素。如果未定义，将使用 Cesium3DTileset 的 maximumScreenSpaceError。
   * @type {number}
   */
  this.maximumAttenuation = pointCloudShading.maximumAttenuation;

  /**
   * 数据集的平均基准分辨率（单位：米）。
   * 当几何错误为 0 时，用于替代几何错误。
   * 如果未定义，将为每个几何错误为 0 的瓦片计算一个近似值。
   * @type {number}
   */
  this.baseResolution = pointCloudShading.baseResolution;

  /**
   * 在执行点衰减时使用眼穹灯光。
   * 需要 WebGL 1.0 中对 EXT_frag_depth、OES_texture_float 和 WEBGL_draw_buffers 扩展的支持，
   * 否则将忽略眼穹灯光。
   *
   * @type {boolean}
   * @default true
   */
  this.eyeDomeLighting = defaultValue(pointCloudShading.eyeDomeLighting, true);

  /**
   * 眼穹灯光强度（显著对比）。
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingStrength = defaultValue(
    pointCloudShading.eyeDomeLightingStrength,
    1.0,
  );

  /**
   * 眼穹灯光的轮廓厚度。
   * @type {number}
   * @default 1.0
   */
  this.eyeDomeLightingRadius = defaultValue(
    pointCloudShading.eyeDomeLightingRadius,
    1.0,
  );

  /**
   * 确定是否隐藏背面朝向的点。
   * 此选项仅在数据包含法线时有效。
   *
   * @type {boolean}
   * @default false
   */
  this.backFaceCulling = defaultValue(pointCloudShading.backFaceCulling, false);

  /**
   * 确定包含法线的点云是否受到场景光源的照射。
   *
   * @type {boolean}
   * @default true
   */
  this.normalShading = defaultValue(pointCloudShading.normalShading, true);
}


/**
 * 确定是否支持点云阴影。
 *
 * @param {Scene} scene 场景。
 * @returns {boolean} 如果支持点云阴影则返回 <code>true</code>，否则返回 <code>false</code>。
 */

PointCloudShading.isSupported = function (scene) {
  return PointCloudEyeDomeLighting.isSupported(scene.context);
};
export default PointCloudShading;
