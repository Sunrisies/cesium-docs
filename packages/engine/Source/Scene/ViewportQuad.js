import BoundingRectangle from "../Core/BoundingRectangle.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import ViewportQuadFS from "../Shaders/ViewportQuadFS.js";
import BlendingState from "./BlendingState.js";
import Material from "./Material.js";

/**
 * 一个与视口对齐的四边形。
 *
 * @alias ViewportQuad
 * @constructor
 *
 * @param {BoundingRectangle} [rectangle] 定义四边形在视口内位置的 {@link BoundingRectangle}。
 * @param {Material} [material] 定义视口四边形表面外观的 {@link Material}。
 *
 * @example
 * const viewportQuad = new Cesium.ViewportQuad(new Cesium.BoundingRectangle(0, 0, 80, 40));
 * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 0.0, 0.0, 1.0);
 */
function ViewportQuad(rectangle, material) {
  /**
   * 确定视口四边形原语是否会被显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  if (!defined(rectangle)) {
    rectangle = new BoundingRectangle();
  }

  /**
   * 定义四边形在视口内位置的BoundingRectangle。
   *
   * @type {BoundingRectangle}
   *
   * @example
   * viewportQuad.rectangle = new Cesium.BoundingRectangle(0, 0, 80, 40);
   */

  this.rectangle = BoundingRectangle.clone(rectangle);

  if (!defined(material)) {
    material = Material.fromType(Material.ColorType, {
      color: new Color(1.0, 1.0, 1.0, 1.0),
    });
  }

  /**
   * 视口四边形的表面外观。可以是几种内置 {@link Material} 对象之一或自定义材料，通过
   * {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric} 脚本化。
   * <p>
   * 默认材料是 <code>Material.ColorType</code>。
   * </p>
   *
   * @type Material
   *
   * @example
   * // 1. Change the color of the default material to yellow
   * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
   *
   * // 2. Change material to horizontal stripes
   * viewportQuad.material = Cesium.Material.fromType(Cesium.Material.StripeType);
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = material;
  this._material = undefined;

  this._overlayCommand = undefined;
  this._rs = undefined;
}

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，以
 * 获取渲染此原语所需的绘制命令。
 * <p>
 * 请不要直接调用此函数。此文档仅用于列出在渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} this.material 必须定义。
 * @exception {DeveloperError} this.rectangle 必须定义。
 */

ViewportQuad.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(this.material)) {
    throw new DeveloperError("this.material must be defined.");
  }
  if (!defined(this.rectangle)) {
    throw new DeveloperError("this.rectangle must be defined.");
  }
  //>>includeEnd('debug');

  const rs = this._rs;
  if (!defined(rs) || !BoundingRectangle.equals(rs.viewport, this.rectangle)) {
    this._rs = RenderState.fromCache({
      blending: BlendingState.ALPHA_BLEND,
      viewport: this.rectangle,
    });
  }

  const pass = frameState.passes;
  if (pass.render) {
    const context = frameState.context;

    if (this._material !== this.material || !defined(this._overlayCommand)) {
      // Recompile shader when material changes
      this._material = this.material;

      if (defined(this._overlayCommand)) {
        this._overlayCommand.shaderProgram.destroy();
      }

      const fs = new ShaderSource({
        sources: [this._material.shaderSource, ViewportQuadFS],
      });
      this._overlayCommand = context.createViewportQuadCommand(fs, {
        renderState: this._rs,
        uniformMap: this._material._uniforms,
        owner: this,
      });
      this._overlayCommand.pass = Pass.OVERLAY;
    }

    this._material.update(context);

    this._overlayCommand.renderState = this._rs;
    this._overlayCommand.uniformMap = this._material._uniforms;
    frameState.commandList.push(this._overlayCommand);
  }
};

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则为true；否则为false。
 *
 * @see ViewportQuad#destroy
 */

ViewportQuad.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的WebGL资源。销毁对象允许以确定性的方式释放
 * WebGL资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值（<code>undefined</code>）赋值给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * quad = quad && quad.destroy();
 *
 * @see ViewportQuad#isDestroyed
 */
ViewportQuad.prototype.destroy = function () {
  if (defined(this._overlayCommand)) {
    this._overlayCommand.shaderProgram =
      this._overlayCommand.shaderProgram &&
      this._overlayCommand.shaderProgram.destroy();
  }
  return destroyObject(this);
};
export default ViewportQuad;
