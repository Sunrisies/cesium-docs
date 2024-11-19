import clone from "../Core/clone.js";
import combine from "../Core/combine.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import BlendingState from "./BlendingState.js";
import CullFace from "./CullFace.js";

/**
 * 外观定义了完整的 GLSL 顶点和片段着色器以及用于绘制 {@link Primitive} 的渲染状态。
 * 所有外观都实现了这个基础的 <code>Appearance</code> 接口。
 * @alias Appearance 
 * @constructor
 * 
 * @param {object} [options] 包含以下属性的对象： 
 * @param {boolean} [options.translucent=true] 当 <code>true</code> 时，几何体预期为半透明，因此 {@link Appearance#renderState} 启用了 alpha 混合。 
 * @param {boolean} [options.closed=false] 当 <code>true</code> 时，几何体预期为封闭，因此 {@link Appearance#renderState} 启用了背面剔除。 
 * @param {Material} [options.material=Material.ColorType] 用于确定片段颜色的材料。 
 * @param {string} [options.vertexShaderSource] 可选的 GLSL 顶点着色器源，用于覆盖默认顶点着色器。 
 * @param {string} [options.fragmentShaderSource] 可选的 GLSL 片段着色器源，用于覆盖默认片段着色器。 
 * @param {object} [options.renderState] 可选的渲染状态，用于覆盖默认渲染状态。
 *
 * @see MaterialAppearance
 * @see EllipsoidSurfaceAppearance
 * @see PerInstanceColorAppearance
 * @see DebugAppearance
 * @see PolylineColorAppearance
 * @see PolylineMaterialAppearance
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Geometry%20and%20Appearances.html|Geometry and Appearances Demo}
 */
function Appearance(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 用于确定片段颜色的材料。与其他 {@link Appearance} 属性不同，这不是只读的，因此外观的材料可以动态更改.
   *
   * @type Material
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = options.material;

  /**
   * 当 <code>true</code> 时，几何体预期为半透明.
   *
   * @type {boolean}
   *
   * @default true
   */
  this.translucent = defaultValue(options.translucent, true);

  this._vertexShaderSource = options.vertexShaderSource;
  this._fragmentShaderSource = options.fragmentShaderSource;
  this._renderState = options.renderState;
  this._closed = defaultValue(options.closed, false);
}

Object.defineProperties(Appearance.prototype, {
  /**
   * 顶点着色器的 GLSL 源代码.
   *
   * @memberof Appearance.prototype
   *
   * @type {string}
   * @readonly
   */
  vertexShaderSource: {
    get: function () {
      return this._vertexShaderSource;
    },
  },

  /**
   * 片段着色器的 GLSL 源代码。完整的片段着色器源代码是以程序化方式构建的，
   * 考虑了 {@link Appearance#material}。
   * 使用 {@link Appearance#getFragmentShaderSource} 来获取完整的源代码
   *
   * @memberof Appearance.prototype
   *
   * @type {string}
   * @readonly
   */
  fragmentShaderSource: {
    get: function () {
      return this._fragmentShaderSource;
    },
  },

  /**
   * 渲染几何图形时使用的 WebGL 固定功能状态.
   *
   * @memberof Appearance.prototype
   *
   * @type {object}
   * @readonly
   */
  renderState: {
    get: function () {
      return this._renderState;
    },
  },

  /**
   * 当 <code>true</code> 时，几何图形应闭合.
   *
   * @memberof Appearance.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  closed: {
    get: function () {
      return this._closed;
    },
  },
});

/**
 * 程序化地创建此外观的完整 GLSL 片段着色器源，\
 * 同时考虑 {@link Appearance#fragmentShaderSource} 和 {@link Appearance#material}.
 *
 * @returns {string} 完整的 GLSL 片段着色器源代码.
 */
Appearance.prototype.getFragmentShaderSource = function () {
  const parts = [];
  if (this.flat) {
    parts.push("#define FLAT");
  }
  if (this.faceForward) {
    parts.push("#define FACE_FORWARD");
  }
  if (defined(this.material)) {
    parts.push(this.material.shaderSource);
  }
  parts.push(this.fragmentShaderSource);

  return parts.join("\n");
};

/**
 * 根据 {@link Appearance#translucent} 和 {@link Material#isTranslucent} 确定几何体是否半透明.
 *
 * @returns {boolean} 如果外观是半透明的，则为 <code>true</code>.
 */
Appearance.prototype.isTranslucent = function () {
  return (
    (defined(this.material) && this.material.isTranslucent()) ||
    (!defined(this.material) && this.translucent)
  );
};

/**
 * 创建渲染状态。这不是最终的渲染状态实例；相反，它可以包含与在上下文中创建的渲染状态相同的渲染状态属性子集.
 *
 * @returns {object} 渲染状态.
 */
Appearance.prototype.getRenderState = function () {
  const translucent = this.isTranslucent();
  const rs = clone(this.renderState, false);
  if (translucent) {
    rs.depthMask = false;
    rs.blending = BlendingState.ALPHA_BLEND;
  } else {
    rs.depthMask = true;
  }
  return rs;
};

/**
 * @private
 */
Appearance.getDefaultRenderState = function (translucent, closed, existing) {
  let rs = {
    depthTest: {
      enabled: true,
    },
  };

  if (translucent) {
    rs.depthMask = false;
    rs.blending = BlendingState.ALPHA_BLEND;
  }

  if (closed) {
    rs.cull = {
      enabled: true,
      face: CullFace.BACK,
    };
  }

  if (defined(existing)) {
    rs = combine(existing, rs, true);
  }

  return rs;
};
export default Appearance;
