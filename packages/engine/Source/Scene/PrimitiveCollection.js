import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";

/**
 * 原始对象的集合。通常与 {@link Scene#primitives} 一起使用，
 * 但 <code>PrimitiveCollection</code> 本身也是一个原始对象，因此可以将集合
 * 添加到集合中，形成层次结构。
 *
 * @alias PrimitiveCollection
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {boolean} [options.show=true] 确定集合中的原始对象是否会被显示。
 * @param {boolean} [options.destroyPrimitives=true] 确定从集合中移除时是否销毁原始对象。
 *
 * @example
 * const billboards = new Cesium.BillboardCollection();
 * const labels = new Cesium.LabelCollection();
 *
 * const collection = new Cesium.PrimitiveCollection();
 * collection.add(billboards);
 *
 * scene.primitives.add(collection);  // Add collection
 * scene.primitives.add(labels);      // Add regular primitive
 */
function PrimitiveCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._primitives = [];
  this._guid = createGuid();
  this._primitiveAdded = new Event();
  this._primitiveRemoved = new Event();

  // Used by the OrderedGroundPrimitiveCollection
  this._zIndex = undefined;

  /**
   * 确定此集合中的原始对象是否会被显示。
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 确定集合中的原始对象在通过 {@link PrimitiveCollection#destroy}、{@link PrimitiveCollection#remove}
   * 或通过 {@link PrimitiveCollection#removeAll} 隐式移除时是否会被销毁。
   *
   * @type {boolean}
   * @default true
   *
   * @example
   * // Example 1. Primitives are destroyed by default.
   * const primitives = new Cesium.PrimitiveCollection();
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // true
   *
   * @example
   * // Example 2. Do not destroy primitives in a collection.
   * const primitives = new Cesium.PrimitiveCollection();
   * primitives.destroyPrimitives = false;
   * const labels = primitives.add(new Cesium.LabelCollection());
   * primitives = primitives.destroy();
   * const b = labels.isDestroyed(); // false
   * labels = labels.destroy();    // explicitly destroy
   */
  this.destroyPrimitives = defaultValue(options.destroyPrimitives, true);
}

Object.defineProperties(PrimitiveCollection.prototype, {
  /**
   * 获取集合中原始对象的数量。
   *
   * @memberof PrimitiveCollection.prototype
   *
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._primitives.length;
    },
  },

  /**
   * 当原始对象被添加到集合时引发的事件。
   * 事件处理程序会接收到被添加的原始对象。
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveAdded: {
    get: function () {
      return this._primitiveAdded;
    },
  },

  /**
   * 当原始对象从集合中移除时引发的事件。
   * 事件处理程序会接收到被移除的原始对象。
   * <p>
   * 注意：根据 destroyPrimitives 构造函数选项，该原始对象可能已经被销毁。
   * </p>
   * @memberof PrimitiveCollection.prototype
   * @type {Event}
   * @readonly
   */
  primitiveRemoved: {
    get: function () {
      return this._primitiveRemoved;
    },
  },
});


/**
 * 将一个原始对象添加到集合中。
 *
 * @param {object} primitive 要添加的原始对象。
 * @param {number} [index] 要添加层的索引。如果省略，则原始对象将添加到所有现有原始对象的底部。
 * @returns {object} 添加到集合中的原始对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 */
PrimitiveCollection.prototype.add = function (primitive, index) {
  const hasIndex = defined(index);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(primitive)) {
    throw new DeveloperError("primitive is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._primitives.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of primitives.",
      );
    }
  }
  //>>includeEnd('debug');

  const external = (primitive._external = primitive._external || {});
  const composites = (external._composites = external._composites || {});
  composites[this._guid] = {
    collection: this,
  };

  if (!hasIndex) {
    this._primitives.push(primitive);
  } else {
    this._primitives.splice(index, 0, primitive);
  }

  this._primitiveAdded.raiseEvent(primitive);

  return primitive;
};

/**
 * 从集合中移除一个原始对象。
 *
 * @param {object} [primitive] 要移除的原始对象。
 * @returns {boolean} 如果原始对象被移除，则返回 <code>true</code>；如果原始对象是 <code>undefined</code> 或未在集合中找到，则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 * scene.primitives.remove(billboards);  // Returns true
 *
 * @see PrimitiveCollection#destroyPrimitives
 */
PrimitiveCollection.prototype.remove = function (primitive) {
  // PERFORMANCE_IDEA:  We can obviously make this a lot faster.
  if (this.contains(primitive)) {
    const index = this._primitives.indexOf(primitive);
    if (index !== -1) {
      this._primitives.splice(index, 1);

      delete primitive._external._composites[this._guid];

      if (this.destroyPrimitives) {
        primitive.destroy();
      }

      this._primitiveRemoved.raiseEvent(primitive);

      return true;
    }
    // else ... this is not possible, I swear.
  }

  return false;
};

/**
 * 移除并销毁一个原始对象，不论 destroyPrimitives 设置如何。
 * @private
 */
PrimitiveCollection.prototype.removeAndDestroy = function (primitive) {
  const removed = this.remove(primitive);
  if (removed && !this.destroyPrimitives) {
    primitive.destroy();
  }
  return removed;
};

/**
 * 移除集合中的所有原始对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#destroyPrimitives
 */

PrimitiveCollection.prototype.removeAll = function () {
  const primitives = this._primitives;
  const length = primitives.length;
  for (let i = 0; i < length; ++i) {
    delete primitives[i]._external._composites[this._guid];

    if (this.destroyPrimitives) {
      primitives[i].destroy();
    }

    this._primitiveRemoved.raiseEvent(primitives[i]);
  }
  this._primitives = [];
};

/**
 * 确定此集合是否包含一个原始对象。
 *
 * @param {object} [primitive] 要检查的原始对象。
 * @returns {boolean} 如果原始对象在集合中，则返回 <code>true</code>；如果原始对象是 <code>undefined</code> 或未在集合中找到，则返回 <code>false</code>。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#get
 */

PrimitiveCollection.prototype.contains = function (primitive) {
  return !!(
    defined(primitive) &&
    primitive._external &&
    primitive._external._composites &&
    primitive._external._composites[this._guid]
  );
};

function getPrimitiveIndex(compositePrimitive, primitive) {
  //>>includeStart('debug', pragmas.debug);
  if (!compositePrimitive.contains(primitive)) {
    throw new DeveloperError("primitive is not in this collection.");
  }
  //>>includeEnd('debug');

  return compositePrimitive._primitives.indexOf(primitive);
}

/**
 * 将原始对象在集合中“向上移动一位”。如果集合中的所有原始对象都绘制在地球表面上，
 * 这将视觉上将原始对象向上移动一位。
 *
 * @param {object} [primitive] 要提升的原始对象。
 *
 * @exception {DeveloperError} 原始对象不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#raiseToTop
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */

PrimitiveCollection.prototype.raise = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      const p = primitives[index];
      primitives[index] = primitives[index + 1];
      primitives[index + 1] = p;
    }
  }
};

/**
 * 将原始对象提升到集合的“顶部”。如果集合中的所有原始对象都绘制在地球表面上，
 * 这将视觉上将原始对象移动到顶部。
 *
 * @param {object} [primitive] 要提升到顶部的原始对象。
 *
 * @exception {DeveloperError} 原始对象不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#lowerToBottom
 */

PrimitiveCollection.prototype.raiseToTop = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== primitives.length - 1) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.push(primitive);
    }
  }
};

/**
 * 将原始对象在集合中“向下移动一位”。如果集合中的所有原始对象都绘制在地球表面上，
 * 这将视觉上将原始对象向下移动一位。
 *
 * @param {object} [primitive] 要降低的原始对象。
 *
 * @exception {DeveloperError} 原始对象不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#lowerToBottom
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */

PrimitiveCollection.prototype.lower = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      const p = primitives[index];
      primitives[index] = primitives[index - 1];
      primitives[index - 1] = p;
    }
  }
};

/**
 * 将原始对象降低到集合的“底部”。如果集合中的所有原始对象都绘制在地球表面上，
 * 这将视觉上将原始对象移动到底部。
 *
 * @param {object} [primitive] 要降低到底部的原始对象。
 *
 * @exception {DeveloperError} 原始对象不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @see PrimitiveCollection#lower
 * @see PrimitiveCollection#raise
 * @see PrimitiveCollection#raiseToTop
 */

PrimitiveCollection.prototype.lowerToBottom = function (primitive) {
  if (defined(primitive)) {
    const index = getPrimitiveIndex(this, primitive);
    const primitives = this._primitives;

    if (index !== 0) {
      // PERFORMANCE_IDEA:  Could be faster
      primitives.splice(index, 1);
      primitives.unshift(primitive);
    }
  }
};

/**
 * 返回集合中指定索引处的原始对象。
 *
 * @param {number} index 要返回的原始对象的零基索引。
 * @returns {object} 位于 <code>index</code> 处的原始对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * // Toggle the show property of every primitive in the collection.
 * const primitives = scene.primitives;
 * const length = primitives.length;
 * for (let i = 0; i < length; ++i) {
 *   const p = primitives.get(i);
 *   p.show = !p.show;
 * }
 *
 * @see PrimitiveCollection#length
 */
PrimitiveCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._primitives[index];
};

/**
 * @private
 */
PrimitiveCollection.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    primitives[i].update(frameState);
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.prePassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.prePassesUpdate)) {
      primitive.prePassesUpdate(frameState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.updateForPass = function (frameState, passState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.updateForPass)) {
      primitive.updateForPass(frameState, passState);
    }
  }
};

/**
 * @private
 */
PrimitiveCollection.prototype.postPassesUpdate = function (frameState) {
  const primitives = this._primitives;
  // Using primitives.length in the loop is a temporary workaround
  // to allow quadtree updates to add and remove primitives in
  // update().  This will be changed to manage added and removed lists.
  for (let i = 0; i < primitives.length; ++i) {
    const primitive = primitives[i];
    if (defined(primitive.postPassesUpdate)) {
      primitive.postPassesUpdate(frameState);
    }
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 true；否则返回 false。
 *
 * @see PrimitiveCollection#destroy
 */

PrimitiveCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中每个原始对象持有的 WebGL 资源。显式销毁此
 * 集合允许确定性地释放 WebGL 资源，而不是依赖于垃圾收集器销毁此集合。
 * <br /><br />
 * 由于销毁集合会销毁所有包含的原始对象，因此仅在确定没有其他代码仍在使用
 * 任何包含的原始对象时才销毁集合。
 * <br /><br />
 * 一旦销毁此集合，就不应使用；调用除 <code>isDestroyed</code> 之外的任何功能将导致
 * {@link DeveloperError} 异常。因此，将返回值 (<code>undefined</code>) 赋给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * primitives = primitives && primitives.destroy();
 *
 * @see PrimitiveCollection#isDestroyed
 */
PrimitiveCollection.prototype.destroy = function () {
  this.removeAll();
  return destroyObject(this);
};
export default PrimitiveCollection;
