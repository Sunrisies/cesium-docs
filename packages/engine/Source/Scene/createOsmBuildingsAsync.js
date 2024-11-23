import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Cesium3DTileset from "./Cesium3DTileset.js";
import Cesium3DTileStyle from "./Cesium3DTileStyle.js";

/**
 * 创建一个 {@link Cesium3DTileset} 实例，用于
 * {@link https://cesium.com/content/cesium-osm-buildings/|Cesium OSM Buildings}
 * 瓦片集。
 *
 * @function
 *
 * @param {object} [options] 构造选项。可以在此处指定 {@link Cesium3DTileset} 构造函数允许的任何选项。
 *        除此之外，支持以下属性：
 * @param {Color} [options.defaultColor=Color.WHITE] 用于没有颜色的建筑物的默认颜色。
 *        如果指定了 <code>options.style</code>，则该参数将被忽略。
 * @param {Cesium3DTileStyle} [options.style] 用于瓦片集的样式。如果未指定，将使用默认样式，该样式为每个建筑物或建筑部分分配一个
 *        从其 OpenStreetMap <code>tags</code> 中推断的颜色。如果无法推断颜色，
 *        则使用 <code>options.defaultColor</code>。
 * @param {boolean} [options.enableShowOutline=true] 如果为 true，则启用渲染轮廓。可以将其设置为 false，以避免在加载时对几何体进行额外处理。
 * @param {boolean} [options.showOutline=true] 是否在建筑物周围显示轮廓。当为 true 时，
 *        将显示轮廓；当为 false 时，轮廓不显示。
 *
 * @returns {Promise<Cesium3DTileset>}
 *
 * @see Ion
 *
 * @example
 * // Create Cesium OSM Buildings with default styling
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * try {
 *   const tileset = await Cesium.createOsmBuildingsAsync();
 *   viewer.scene.primitives.add(tileset));
 * } catch (error) {
 *   console.log(`Error creating tileset: ${error}`);
 * }
 *
 * @example
 * // Create Cesium OSM Buildings with a custom style highlighting
 * // schools and hospitals.
 * const viewer = new Cesium.Viewer("cesiumContainer");
 * try {
 *   const tileset = await Cesium.createOsmBuildingsAsync({
 *     style: new Cesium.Cesium3DTileStyle({
 *       color: {
 *         conditions: [
 *           ["${feature['building']} === 'hospital'", "color('#0000FF')"],
 *           ["${feature['building']} === 'school'", "color('#00FF00')"],
 *           [true, "color('#ffffff')"]
 *         ]
 *       }
 *     })
 *   });
 *   viewer.scene.primitives.add(tileset));
 * } catch (error) {
 *   console.log(`Error creating tileset: ${error}`);
 * }
 */
async function createOsmBuildingsAsync(options) {
  const tileset = await Cesium3DTileset.fromIonAssetId(96188, options);

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  let style = options.style;

  if (!defined(style)) {
    const color = defaultValue(
      options.defaultColor,
      Color.WHITE,
    ).toCssColorString();
    style = new Cesium3DTileStyle({
      color: `Boolean(\${feature['cesium#color']}) ? color(\${feature['cesium#color']}) : ${color}`,
    });
  }

  tileset.style = style;

  return tileset;
}

export default createOsmBuildingsAsync;
