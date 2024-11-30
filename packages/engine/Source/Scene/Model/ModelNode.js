import Check from "../../Core/Check.js";
import defined from "../../Core/defined.js";

/**
 * <div class="notice">
 * 使用 {@link Model#getNode} 从已加载的模型中获取节点。请勿直接调用构造函数。
 * </div>
 *
 * 带有可修改变换的模型节点，允许用户定义自己的动画。尽管模型的资产可以包含针对节点变换的动画，但此类允许用户在外部更改节点的变换。通过这种方式，动画可以由其他来源驱动，而不仅仅是模型的资产。
 *
 * @alias ModelNode
 * @internalConstructor
 * @class
 *
 * @example
 * const node = model.getNode("Hand");
 * node.matrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(5.0, 1.0, 1.0), node.matrix);
 *
 * @see Model#getNode
 */
function ModelNode(model, runtimeNode) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("model", model);
  Check.typeOf.object("runtimeNode", runtimeNode);
  //>>includeEnd('debug')

  this._model = model;
  this._runtimeNode = runtimeNode;
}

Object.defineProperties(ModelNode.prototype, {
  /**
   * 此节点的 <code>name</code> 属性的值。
   *
   * @memberof ModelNode.prototype
   *
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._runtimeNode._name;
    },
  },

  /**
   * 在 glTF 中节点的索引。
   *
   * @memberof ModelNode.prototype
   *
   * @type {number}
   * @readonly
   */
  id: {
    get: function () {
      return this._runtimeNode._id;
    },
  },

  /**
   * 确定此节点及其子节点是否会被显示。
   *
   * @memberof ModelNode.prototype
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._runtimeNode.show;
    },
    set: function (value) {
      this._runtimeNode.show = value;
    },
  },

  /**
   * 节点的 4x4 矩阵变换，从其局部坐标到父节点的坐标。将矩阵设置为 undefined 将恢复节点的原始变换，并允许节点再次通过模型中的任何动画进行动画化。
   * <p>
   * 要使更改生效，必须为此属性赋值；设置矩阵的单个元素将无效。
   * </p>
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  matrix: {
    get: function () {
      return this._runtimeNode.transform;
    },
    set: function (value) {
      if (defined(value)) {
        this._runtimeNode.transform = value;
        this._runtimeNode.userAnimated = true;
        this._model._userAnimationDirty = true;
      } else {
        this._runtimeNode.transform = this.originalMatrix;
        this._runtimeNode.userAnimated = false;
      }
    },
  },

  /**
   * 获取节点的原始 4x4 矩阵变换，从其局部坐标到父节点的坐标，不应用任何节点变换或关节。
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  originalMatrix: {
    get: function () {
      return this._runtimeNode.originalTransform;
    },
  },
});


export default ModelNode;
