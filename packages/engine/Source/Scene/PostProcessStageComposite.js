import Check from "../Core/Check.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";

/**
 * 一组 {@link PostProcessStage} 或其他后处理复合阶段，逻辑上一起执行。
 * <p>
 * 所有阶段按照数组的顺序执行。输入纹理基于 <code>inputPreviousStageTexture</code> 的值而变化。
 * 如果 <code>inputPreviousStageTexture</code> 为 <code>true</code>，则每个阶段的输入是由场景渲染的纹理或之前执行的阶段的输出纹理。
 * 如果 <code>inputPreviousStageTexture</code> 为 <code>false</code>，则复合中每个阶段的输入纹理都是相同的。输入纹理是由场景渲染的纹理
 * 或前一个阶段的输出纹理。
 * </p>
 *
 * @alias PostProcessStageComposite
 * @constructor
 *
 * @param {object} options 包含以下属性的对象：
 * @param {Array} options.stages 一个 {@link PostProcessStage} 或复合阶段的数组，按顺序执行。
 * @param {boolean} [options.inputPreviousStageTexture=true] 是否执行每个后处理阶段，其中一个阶段的输入是前一个阶段的输出。否则，每个包含阶段的输入是复合之前执行的阶段的输出。
 * @param {string} [options.name=createGuid()] 此后处理阶段的唯一名称，以便其他复合阶段引用。如果未提供名称，将生成一个 GUID。
 * @param {object} [options.uniforms] 后处理阶段 uniforms 的别名。
 *
 * @exception {DeveloperError} options.stages.length 必须大于 0.0。
 *
 * @see PostProcessStage
 *
 * @example
 * // Example 1: separable blur filter
 * // The input to blurXDirection is the texture rendered to by the scene or the output of the previous stage.
 * // The input to blurYDirection is the texture rendered to by blurXDirection.
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     stages : [blurXDirection, blurYDirection]
 * }));
 *
 * @example
 * // Example 2: referencing the output of another post-process stage
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     inputPreviousStageTexture : false,
 *     stages : [
 *         // The same as Example 1.
 *         new Cesium.PostProcessStageComposite({
 *             inputPreviousStageTexture : true
 *             stages : [blurXDirection, blurYDirection],
 *             name : 'blur'
 *         }),
 *         // The input texture for this stage is the same input texture to blurXDirection since inputPreviousStageTexture is false
 *         new Cesium.PostProcessStage({
 *             fragmentShader : compositeShader,
 *             uniforms : {
 *                 blurTexture : 'blur' // The output of the composite with name 'blur' (the texture that blurYDirection rendered to).
 *             }
 *         })
 *     ]
 * });
 *
 * @example
 * // Example 3: create a uniform alias
 * const uniforms = {};
 * Cesium.defineProperties(uniforms, {
 *     filterSize : {
 *         get : function() {
 *             return blurXDirection.uniforms.filterSize;
 *         },
 *         set : function(value) {
 *             blurXDirection.uniforms.filterSize = blurYDirection.uniforms.filterSize = value;
 *         }
 *     }
 * });
 * scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
 *     stages : [blurXDirection, blurYDirection],
 *     uniforms : uniforms
 * }));
 */
function PostProcessStageComposite(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.defined("options.stages", options.stages);
  Check.typeOf.number.greaterThan(
    "options.stages.length",
    options.stages.length,
    0,
  );
  //>>includeEnd('debug');

  this._stages = options.stages;
  this._inputPreviousStageTexture = defaultValue(
    options.inputPreviousStageTexture,
    true,
  );

  let name = options.name;
  if (!defined(name)) {
    name = createGuid();
  }
  this._name = name;

  this._uniforms = options.uniforms;

  // used by PostProcessStageCollection
  this._textureCache = undefined;
  this._index = undefined;

  this._selected = undefined;
  this._selectedShadow = undefined;
  this._parentSelected = undefined;
  this._parentSelectedShadow = undefined;
  this._combinedSelected = undefined;
  this._combinedSelectedShadow = undefined;
  this._selectedLength = 0;
  this._parentSelectedLength = 0;
  this._selectedDirty = true;
}

Object.defineProperties(PostProcessStageComposite.prototype, {
  /**
   * 确定此后处理阶段是否准备好执行。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      const stages = this._stages;
      const length = stages.length;
      for (let i = 0; i < length; ++i) {
        if (!stages[i].ready) {
          return false;
        }
      }
      return true;
    },
  },
  /**
   * 此后处理阶段的唯一名称，以便其他阶段在 PostProcessStageComposite 中引用。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._name;
    },
  },
  /**
   * 是否在准备好时执行此后处理阶段。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   */
  enabled: {
    get: function () {
      return this._stages[0].enabled;
    },
    set: function (value) {
      const stages = this._stages;
      const length = stages.length;
      for (let i = 0; i < length; ++i) {
        stages[i].enabled = value;
      }
    },
  },
  /**
   * 后处理阶段 uniform 值的别名。可以是 <code>undefined</code>；在这种情况下，获取每个阶段以设置 uniform 值。
   * @memberof PostProcessStageComposite.prototype
   * @type {object}
   */
  uniforms: {
    get: function () {
      return this._uniforms;
    },
  },
  /**
   * 所有后处理阶段按照数组的顺序执行。输入纹理基于 <code>inputPreviousStageTexture</code> 的值而变化。
   * 如果 <code>inputPreviousStageTexture</code> 为 <code>true</code>，则每个阶段的输入是由场景渲染的纹理或之前执行的阶段的输出纹理。
   * 如果 <code>inputPreviousStageTexture</code> 为 <code>false</code>，则复合中每个阶段的输入纹理都是相同的。输入纹理是由场景渲染的纹理
   * 或前一个阶段的输出纹理。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {boolean}
   * @readonly
   */
  inputPreviousStageTexture: {
    get: function () {
      return this._inputPreviousStageTexture;
    },
  },
  /**
   * 该复合中后处理阶段的数量。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._stages.length;
    },
  },
  /**
   * 应用后处理的特征选择。
   *
   * @memberof PostProcessStageComposite.prototype
   * @type {Array}
   */
  selected: {
    get: function () {
      return this._selected;
    },
    set: function (value) {
      this._selected = value;
    },
  },
  /**
   * @private
   */
  parentSelected: {
    get: function () {
      return this._parentSelected;
    },
    set: function (value) {
      this._parentSelected = value;
    },
  },
});


/**
 * @private
 */
PostProcessStageComposite.prototype._isSupported = function (context) {
  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    if (!stages[i]._isSupported(context)) {
      return false;
    }
  }
  return true;
};

/**
 * 获取在 <code>index</code> 的后处理阶段。
 *
 * @param {number} index 后处理阶段或复合的索引。
 * @return {PostProcessStage|PostProcessStageComposite} 指定索引的后处理阶段或复合。
 *
 * @exception {DeveloperError} index 必须大于或等于 0。
 * @exception {DeveloperError} index 必须小于 {@link PostProcessStageComposite#length}。
 */

PostProcessStageComposite.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals("index", index, 0);
  Check.typeOf.number.lessThan("index", index, this.length);
  //>>includeEnd('debug');
  return this._stages[index];
};

function isSelectedTextureDirty(stage) {
  let length = defined(stage._selected) ? stage._selected.length : 0;
  const parentLength = defined(stage._parentSelected)
    ? stage._parentSelected
    : 0;
  let dirty =
    stage._selected !== stage._selectedShadow ||
    length !== stage._selectedLength;
  dirty =
    dirty ||
    stage._parentSelected !== stage._parentSelectedShadow ||
    parentLength !== stage._parentSelectedLength;

  if (defined(stage._selected) && defined(stage._parentSelected)) {
    stage._combinedSelected = stage._selected.concat(stage._parentSelected);
  } else if (defined(stage._parentSelected)) {
    stage._combinedSelected = stage._parentSelected;
  } else {
    stage._combinedSelected = stage._selected;
  }

  if (!dirty && defined(stage._combinedSelected)) {
    if (!defined(stage._combinedSelectedShadow)) {
      return true;
    }

    length = stage._combinedSelected.length;
    for (let i = 0; i < length; ++i) {
      if (stage._combinedSelected[i] !== stage._combinedSelectedShadow[i]) {
        return true;
      }
    }
  }
  return dirty;
}

/**
 * 在执行之前调用的函数。更新复合中的每个后处理阶段。
 * @param {Context} context 上下文。
 * @param {boolean} useLogDepth 场景是否使用对数深度缓冲区。
 * @private
 */

PostProcessStageComposite.prototype.update = function (context, useLogDepth) {
  this._selectedDirty = isSelectedTextureDirty(this);

  this._selectedShadow = this._selected;
  this._parentSelectedShadow = this._parentSelected;
  this._combinedSelectedShadow = this._combinedSelected;
  this._selectedLength = defined(this._selected) ? this._selected.length : 0;
  this._parentSelectedLength = defined(this._parentSelected)
    ? this._parentSelected.length
    : 0;

  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    const stage = stages[i];
    if (this._selectedDirty) {
      stage.parentSelected = this._combinedSelected;
    }
    stage.update(context, useLogDepth);
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <p>
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。
 * </p>
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see PostProcessStageComposite#destroy
 */
PostProcessStageComposite.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地释放
 * WebGL 资源，而不是依赖于垃圾收集器销毁此对象。
 * <p>
 * 一旦对象被销毁，就不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。因此，
 * 将返回值 (<code>undefined</code>) 赋给对象，如示例中所示。
 * </p>
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PostProcessStageComposite#isDestroyed
 */

PostProcessStageComposite.prototype.destroy = function () {
  const stages = this._stages;
  const length = stages.length;
  for (let i = 0; i < length; ++i) {
    stages[i].destroy();
  }
  return destroyObject(this);
};
export default PostProcessStageComposite;
