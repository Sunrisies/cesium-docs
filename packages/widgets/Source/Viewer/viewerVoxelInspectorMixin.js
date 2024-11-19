import { Check } from "@cesium/engine";
import VoxelInspector from "../VoxelInspector/VoxelInspector.js";

/**
 * 将 {@link VoxelInspector} 小部件添加到 {@link Viewer} 小部件的混合函数。
 * 此函数通常不直接调用，而是作为参数传递给 {@link Viewer#extend}，如下例所示.
 * 
 * @function
 *
 * @param {Viewer} viewer 查看器实例.
 *
 * @example
 * var viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerVoxelInspectorMixin);
 */
function viewerVoxelInspectorMixin(viewer) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("viewer", viewer);
  //>>includeEnd('debug');

  const container = document.createElement("div");
  container.className = "cesium-viewer-voxelInspectorContainer";
  viewer.container.appendChild(container);
  const voxelInspector = new VoxelInspector(container, viewer.scene);

  Object.defineProperties(viewer, {
    voxelInspector: {
      get: function () {
        return voxelInspector;
      },
    },
  });
}
export default viewerVoxelInspectorMixin;
