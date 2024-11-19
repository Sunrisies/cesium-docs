import { defined, DeveloperError } from "@cesium/engine";
import CesiumInspector from "../CesiumInspector/CesiumInspector.js";

/**
 * 一个混入，将 CesiumInspector 小部件添加到 Viewer 小部件。
 * 这个函数通常不会直接调用，而是作为参数传递给 {@link Viewer#extend}，如下例所示。
 * @function
 *
 * @param {Viewer} viewer 查看器实例。
 *
 * @exception {DeveloperError} 必须提供 viewer。
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Cesium%20Inspector.html|Cesium Sandcastle Cesium Inspector Demo}
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerCesiumInspectorMixin);
 */
function viewerCesiumInspectorMixin(viewer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(viewer)) {
    throw new DeveloperError("viewer is required.");
  }
  //>>includeEnd('debug');

  const cesiumInspectorContainer = document.createElement("div");
  cesiumInspectorContainer.className = "cesium-viewer-cesiumInspectorContainer";
  viewer.container.appendChild(cesiumInspectorContainer);
  const cesiumInspector = new CesiumInspector(
    cesiumInspectorContainer,
    viewer.scene,
  );

  Object.defineProperties(viewer, {
    cesiumInspector: {
      get: function () {
        return cesiumInspector;
      },
    },
  });
}
export default viewerCesiumInspectorMixin;
