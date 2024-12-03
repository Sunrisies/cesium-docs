import buildModuleUrl from "../Core/buildModuleUrl.js";
import BoxGeometry from "../Core/BoxGeometry.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryPipeline from "../Core/GeometryPipeline.js";
import Matrix4 from "../Core/Matrix4.js";
import VertexFormat from "../Core/VertexFormat.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import CubeMap from "../Renderer/CubeMap.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import loadCubeMap from "../Renderer/loadCubeMap.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArray from "../Renderer/VertexArray.js";
import SkyBoxFS from "../Shaders/SkyBoxFS.js";
import SkyBoxVS from "../Shaders/SkyBoxVS.js";
import BlendingState from "./BlendingState.js";
import SceneMode from "./SceneMode.js";

/**
 * 场景周围的天空盒，用于绘制星星。天空盒使用真赤道平均春分点（TEME）轴定义。
 * <p>
 * 此功能仅在 3D 中支持。当变形为 2D 或哥伦布视图时，天空盒会逐渐消失。天空盒的大小不得超过 {@link Scene#maximumCubeMapSize}。
 * </p>
 *
 * @alias SkyBox
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {object} [options.sources] 每个六个立方体面源 URL 或 <code>Image</code> 对象。请参见下面的示例。
 * @param {boolean} [options.show=true] 确定此基本图元是否将被显示。
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBox({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function SkyBox(options) {
  /**
   * 用于创建立方体贴图面的源：一个具有 <code>positiveX</code>、<code>negativeX</code>、<code>positiveY</code>、
   * <code>negativeY</code>、<code>positiveZ</code> 和 <code>negativeZ</code> 属性的对象。
   * 这些可以是 URL 或 <code>Image</code> 对象。
   *
   * @type {object}
   * @default undefined
   */
  this.sources = options.sources;
  this._sources = undefined;

  /**
   * 确定天空盒是否将被显示。
   *
   * @type {boolean}
   * @default true
   */

  this.show = defaultValue(options.show, true);

  this._command = new DrawCommand({
    modelMatrix: Matrix4.clone(Matrix4.IDENTITY),
    owner: this,
  });
  this._cubeMap = undefined;

  this._attributeLocations = undefined;
  this._useHdr = undefined;
  this._hasError = false;
  this._error = undefined;
}

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用
 * 以获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此功能。此文档仅用于列出在渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} this.sources 是必需的，必须具有 positiveX、negativeX、positiveY、negativeY、positiveZ 和 negativeZ 属性。
 * @exception {DeveloperError} this.sources 属性必须全部为相同类型。
 */

SkyBox.prototype.update = function (frameState, useHdr) {
  const that = this;
  const { mode, passes, context } = frameState;

  if (!this.show) {
    return undefined;
  }

  if (mode !== SceneMode.SCENE3D && mode !== SceneMode.MORPHING) {
    return undefined;
  }

  // The sky box is only rendered during the render pass; it is not pickable, it doesn't cast shadows, etc.
  if (!passes.render) {
    return undefined;
  }

  // Throw any errors that had previously occurred asynchronously so they aren't
  // ignored when running.  See https://github.com/CesiumGS/cesium/pull/12307
  if (this._hasError) {
    const error = this._error;
    this._hasError = false;
    this._error = undefined;
    throw error;
  }

  if (this._sources !== this.sources) {
    this._sources = this.sources;
    const sources = this.sources;

    //>>includeStart('debug', pragmas.debug);
    Check.defined("this.sources", sources);
    if (
      Object.values(CubeMap.FaceName).some(
        (faceName) => !defined(sources[faceName]),
      )
    ) {
      throw new DeveloperError(
        "this.sources must have positiveX, negativeX, positiveY, negativeY, positiveZ, and negativeZ properties.",
      );
    }

    const sourceType = typeof sources.positiveX;
    if (
      Object.values(CubeMap.FaceName).some(
        (faceName) => typeof sources[faceName] !== sourceType,
      )
    ) {
      throw new DeveloperError(
        "this.sources properties must all be the same type.",
      );
    }
    //>>includeEnd('debug');

    if (typeof sources.positiveX === "string") {
      // Given urls for cube-map images.  Load them.
      loadCubeMap(context, this._sources)
        .then(function (cubeMap) {
          that._cubeMap = that._cubeMap && that._cubeMap.destroy();
          that._cubeMap = cubeMap;
        })
        .catch((error) => {
          // Defer throwing the error until the next call to update to prevent
          // test from failing in `afterAll` if this is rejected after the test
          // using the Skybox ends.  See https://github.com/CesiumGS/cesium/pull/12307
          this._hasError = true;
          this._error = error;
        });
    } else {
      this._cubeMap = this._cubeMap && this._cubeMap.destroy();
      this._cubeMap = new CubeMap({
        context: context,
        source: sources,
      });
    }
  }

  const command = this._command;

  if (!defined(command.vertexArray)) {
    command.uniformMap = {
      u_cubeMap: function () {
        return that._cubeMap;
      },
    };

    const geometry = BoxGeometry.createGeometry(
      BoxGeometry.fromDimensions({
        dimensions: new Cartesian3(2.0, 2.0, 2.0),
        vertexFormat: VertexFormat.POSITION_ONLY,
      }),
    );
    const attributeLocations = (this._attributeLocations =
      GeometryPipeline.createAttributeLocations(geometry));

    command.vertexArray = VertexArray.fromGeometry({
      context: context,
      geometry: geometry,
      attributeLocations: attributeLocations,
      bufferUsage: BufferUsage.STATIC_DRAW,
    });

    command.renderState = RenderState.fromCache({
      blending: BlendingState.ALPHA_BLEND,
    });
  }

  if (!defined(command.shaderProgram) || this._useHdr !== useHdr) {
    const fs = new ShaderSource({
      defines: [useHdr ? "HDR" : ""],
      sources: [SkyBoxFS],
    });
    command.shaderProgram = ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: SkyBoxVS,
      fragmentShaderSource: fs,
      attributeLocations: this._attributeLocations,
    });
    this._useHdr = useHdr;
  }

  if (!defined(this._cubeMap)) {
    return undefined;
  }

  return command;
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see SkyBox#destroy
 */

SkyBox.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地释放 WebGL 资源，而不是依赖垃圾回收器销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 应将返回值（<code>undefined</code>）分配给该对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即，已调用 destroy()。
 *
 *
 * @example
 * skyBox = skyBox && skyBox.destroy();
 *
 * @see SkyBox#isDestroyed
 */

SkyBox.prototype.destroy = function () {
  const command = this._command;
  command.vertexArray = command.vertexArray && command.vertexArray.destroy();
  command.shaderProgram =
    command.shaderProgram && command.shaderProgram.destroy();
  this._cubeMap = this._cubeMap && this._cubeMap.destroy();
  return destroyObject(this);
};

function getDefaultSkyBoxUrl(suffix) {
  return buildModuleUrl(`Assets/Textures/SkyBox/tycho2t3_80_${suffix}.jpg`);
}

/**
 * 创建一个带有地球默认星图的天空盒实例。
 * @return {SkyBox} 地球的默认天空盒
 *
 * @example
 * viewer.scene.skyBox = Cesium.SkyBox.createEarthSkyBox();
 */

SkyBox.createEarthSkyBox = function () {
  return new SkyBox({
    sources: {
      positiveX: getDefaultSkyBoxUrl("px"),
      negativeX: getDefaultSkyBoxUrl("mx"),
      positiveY: getDefaultSkyBoxUrl("py"),
      negativeY: getDefaultSkyBoxUrl("my"),
      positiveZ: getDefaultSkyBoxUrl("pz"),
      negativeZ: getDefaultSkyBoxUrl("mz"),
    },
  });
};

export default SkyBox;
