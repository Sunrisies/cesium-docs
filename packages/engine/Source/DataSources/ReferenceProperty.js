import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import JulianDate from "../Core/JulianDate.js";
import Property from "./Property.js";

function resolve(that) {
  let targetProperty = that._targetProperty;

  if (!defined(targetProperty)) {
    let targetEntity = that._targetEntity;

    if (!defined(targetEntity)) {
      targetEntity = that._targetCollection.getById(that._targetId);

      if (!defined(targetEntity)) {
        // target entity not found
        that._targetEntity = that._targetProperty = undefined;
        return;
      }

      // target entity was found. listen for changes to entity definition
      targetEntity.definitionChanged.addEventListener(
        ReferenceProperty.prototype._onTargetEntityDefinitionChanged,
        that,
      );
      that._targetEntity = targetEntity;
    }

    // walk the list of property names and resolve properties
    const targetPropertyNames = that._targetPropertyNames;
    targetProperty = that._targetEntity;
    for (
      let i = 0, len = targetPropertyNames.length;
      i < len && defined(targetProperty);
      ++i
    ) {
      targetProperty = targetProperty[targetPropertyNames[i]];
    }

    // target property may or may not be defined, depending on if it was found
    that._targetProperty = targetProperty;
  }

  return targetProperty;
}

/**
 * 一个 {@link Property}，用于透明地链接到提供对象上的另一个属性。
 *
 * @alias ReferenceProperty
 * @constructor
 *
 * @param {EntityCollection} targetCollection 将用于解析引用的实体集合。
 * @param {string} targetId 正被引用的实体的 ID。
 * @param {string[]} targetPropertyNames 我们将使用的目标实体上属性的名称。
 *
 * @example
 * const collection = new Cesium.EntityCollection();
 *
 * //Create a new entity and assign a billboard scale.
 * const object1 = new Cesium.Entity({id:'object1'});
 * object1.billboard = new Cesium.BillboardGraphics();
 * object1.billboard.scale = new Cesium.ConstantProperty(2.0);
 * collection.add(object1);
 *
 * //Create a second entity and reference the scale from the first one.
 * const object2 = new Cesium.Entity({id:'object2'});
 * object2.model = new Cesium.ModelGraphics();
 * object2.model.scale = new Cesium.ReferenceProperty(collection, 'object1', ['billboard', 'scale']);
 * collection.add(object2);
 *
 * //Create a third object, but use the fromString helper function.
 * const object3 = new Cesium.Entity({id:'object3'});
 * object3.billboard = new Cesium.BillboardGraphics();
 * object3.billboard.scale = Cesium.ReferenceProperty.fromString(collection, 'object1#billboard.scale');
 * collection.add(object3);
 *
 * //You can refer to an entity with a # or . in id and property names by escaping them.
 * const object4 = new Cesium.Entity({id:'#object.4'});
 * object4.billboard = new Cesium.BillboardGraphics();
 * object4.billboard.scale = new Cesium.ConstantProperty(2.0);
 * collection.add(object4);
 *
 * const object5 = new Cesium.Entity({id:'object5'});
 * object5.billboard = new Cesium.BillboardGraphics();
 * object5.billboard.scale = Cesium.ReferenceProperty.fromString(collection, '\\#object\\.4#billboard.scale');
 * collection.add(object5);
 */
function ReferenceProperty(targetCollection, targetId, targetPropertyNames) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(targetCollection)) {
    throw new DeveloperError("targetCollection is required.");
  }
  if (!defined(targetId) || targetId === "") {
    throw new DeveloperError("targetId is required.");
  }
  if (!defined(targetPropertyNames) || targetPropertyNames.length === 0) {
    throw new DeveloperError("targetPropertyNames is required.");
  }
  for (let i = 0; i < targetPropertyNames.length; i++) {
    const item = targetPropertyNames[i];
    if (!defined(item) || item === "") {
      throw new DeveloperError("reference contains invalid properties.");
    }
  }
  //>>includeEnd('debug');

  this._targetCollection = targetCollection;
  this._targetId = targetId;
  this._targetPropertyNames = targetPropertyNames;
  this._targetProperty = undefined;
  this._targetEntity = undefined;
  this._definitionChanged = new Event();

  targetCollection.collectionChanged.addEventListener(
    ReferenceProperty.prototype._onCollectionChanged,
    this,
  );
}

Object.defineProperties(ReferenceProperty.prototype, {
  /**
   * 获取一个值，指示该属性是否为常量。
   * @memberof ReferenceProperty.prototype
   * @type {boolean}
   * @readonly
   */
  isConstant: {
    get: function () {
      return Property.isConstant(resolve(this));
    },
  },
  /**
   * 获取每当该属性的定义发生变化时所触发的事件。
   * 每当被引用属性的定义发生变化时，定义就会被更改。
   * @memberof ReferenceProperty.prototype
   * @type {Event}
   * @readonly
   */
  definitionChanged: {
    get: function () {
      return this._definitionChanged;
    },
  },
  /**
   * 获取位置所定义的参考框架。
   * 该属性仅在被引用的属性是 {@link PositionProperty} 时有效。
   * @memberof ReferenceProperty.prototype
   * @type {ReferenceFrame}
   * @readonly
   */
  referenceFrame: {
    get: function () {
      const target = resolve(this);
      return defined(target) ? target.referenceFrame : undefined;
    },
  },
  /**
   * 获取被引用实体的 ID。
   * @memberof ReferenceProperty.prototype
   * @type {string}
   * @readonly
   */
  targetId: {
    get: function () {
      return this._targetId;
    },
  },
  /**
   * 获取包含被引用实体的集合。
   * @memberof ReferenceProperty.prototype
   * @type {EntityCollection}
   * @readonly
   */
  targetCollection: {
    get: function () {
      return this._targetCollection;
    },
  },
  /**
   * 获取用于检索被引用属性的属性名称数组。
   * @memberof ReferenceProperty.prototype
   * @type {}
   * @readonly
   */
  targetPropertyNames: {
    get: function () {
      return this._targetPropertyNames;
    },
  },
  /**
   * 获取底层被引用属性的已解析实例。
   * @memberof ReferenceProperty.prototype
   * @type {Property|undefined}
   * @readonly
   */
  resolvedProperty: {
    get: function () {
      return resolve(this);
    },
  },
});


/**
 * 根据将用于解析的实体集合和一个指示目标实体 ID 及其属性的字符串创建一个新实例。
 * 字符串的格式为 "objectId#foo.bar"，其中 # 用于分隔 ID 和属性路径，. 用于分隔子属性。
 * 如果引用标识符或任何子属性包含 #、. 或 \，则必须进行转义。
 *
 * @param {EntityCollection} targetCollection 实体集合。
 * @param {string} referenceString 引用字符串。
 * @returns {ReferenceProperty} ReferenceProperty 的新实例。
 *
 * @exception {DeveloperError} 无效的 referenceString。
 */

ReferenceProperty.fromString = function (targetCollection, referenceString) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(targetCollection)) {
    throw new DeveloperError("targetCollection is required.");
  }
  if (!defined(referenceString)) {
    throw new DeveloperError("referenceString is required.");
  }
  //>>includeEnd('debug');

  let identifier;
  const values = [];

  let inIdentifier = true;
  let isEscaped = false;
  let token = "";
  for (let i = 0; i < referenceString.length; ++i) {
    const c = referenceString.charAt(i);

    if (isEscaped) {
      token += c;
      isEscaped = false;
    } else if (c === "\\") {
      isEscaped = true;
    } else if (inIdentifier && c === "#") {
      identifier = token;
      inIdentifier = false;
      token = "";
    } else if (!inIdentifier && c === ".") {
      values.push(token);
      token = "";
    } else {
      token += c;
    }
  }
  values.push(token);

  return new ReferenceProperty(targetCollection, identifier, values);
};

const timeScratch = new JulianDate();

/**
 * 获取在提供时间的属性值。
 *
 * @param {JulianDate} [time=JulianDate.now()] 要检索值的时间。如果省略，则使用当前系统时间。
 * @param {object} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {object} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

ReferenceProperty.prototype.getValue = function (time, result) {
  const target = resolve(this);
  if (!defined(time)) {
    time = JulianDate.now(timeScratch);
  }
  return defined(target) ? target.getValue(time, result) : undefined;
};

/**
 * 获取在提供时间和提供的参考框架下的属性值。
 * 此方法仅在被引用的属性是 {@link PositionProperty} 时有效。
 *
 * @param {JulianDate} time 要检索值的时间。
 * @param {ReferenceFrame} referenceFrame 结果所需的参考框架。
 * @param {Cartesian3} [result] 用于存储值的对象，如果省略，则创建并返回一个新实例。
 * @returns {Cartesian3} 修改后的结果参数，如果未提供结果参数，则返回一个新实例。
 */

ReferenceProperty.prototype.getValueInReferenceFrame = function (
  time,
  referenceFrame,
  result,
) {
  const target = resolve(this);
  return defined(target)
    ? target.getValueInReferenceFrame(time, referenceFrame, result)
    : undefined;
};

/**
 * 获取在提供时间的 {@link Material} 类型。
 * 此方法仅在被引用的属性是 {@link MaterialProperty} 时有效。
 *
 * @param {JulianDate} time 要检索类型的时间。
 * @returns {string} 材质的类型。
 */
ReferenceProperty.prototype.getType = function (time) {
  const target = resolve(this);
  return defined(target) ? target.getType(time) : undefined;
};

/**
 * 将此属性与提供的属性进行比较，并返回
 * 如果相等则为 <code>true</code>，否则为 <code>false</code>
 *
 * @param {Property} [other] 另一个属性。
 * @returns {boolean} 如果两个属性相等，则 <code>true</code>，否则 <code>false</code>
 */

ReferenceProperty.prototype.equals = function (other) {
  if (this === other) {
    return true;
  }

  const names = this._targetPropertyNames;
  const otherNames = other._targetPropertyNames;

  if (
    this._targetCollection !== other._targetCollection || //
    this._targetId !== other._targetId || //
    names.length !== otherNames.length
  ) {
    return false;
  }

  const length = this._targetPropertyNames.length;
  for (let i = 0; i < length; i++) {
    if (names[i] !== otherNames[i]) {
      return false;
    }
  }

  return true;
};

ReferenceProperty.prototype._onTargetEntityDefinitionChanged = function (
  targetEntity,
  name,
  value,
  oldValue,
) {
  if (defined(this._targetProperty) && this._targetPropertyNames[0] === name) {
    this._targetProperty = undefined;
    this._definitionChanged.raiseEvent(this);
  }
};

ReferenceProperty.prototype._onCollectionChanged = function (
  collection,
  added,
  removed,
) {
  let targetEntity = this._targetEntity;
  if (defined(targetEntity) && removed.indexOf(targetEntity) !== -1) {
    targetEntity.definitionChanged.removeEventListener(
      ReferenceProperty.prototype._onTargetEntityDefinitionChanged,
      this,
    );
    this._targetEntity = this._targetProperty = undefined;
  } else if (!defined(targetEntity)) {
    targetEntity = resolve(this);
    if (defined(targetEntity)) {
      this._definitionChanged.raiseEvent(this);
    }
  }
};
export default ReferenceProperty;
