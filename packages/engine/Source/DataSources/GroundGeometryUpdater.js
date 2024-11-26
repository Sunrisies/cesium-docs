import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import GeometryOffsetAttribute from "../Core/GeometryOffsetAttribute.js";
import oneTimeWarning from "../Core/oneTimeWarning.js";
import GroundPrimitive from "../Scene/GroundPrimitive.js";
import HeightReference, {
  isHeightReferenceClamp,
} from "../Scene/HeightReference.js";
import CallbackProperty from "./CallbackProperty.js";
import ConstantProperty from "./ConstantProperty.js";
import GeometryUpdater from "./GeometryUpdater.js";
import TerrainOffsetProperty from "./TerrainOffsetProperty.js";

const defaultZIndex = new ConstantProperty(0);

/**
 * 用于更新地面几何体实体的抽象类。
 * @constructor
 * @alias GroundGeometryUpdater
 * @param {object} options 包含以下属性的对象：
 * @param {Entity} options.entity 包含要可视化几何体的实体。
 * @param {Scene} options.scene 可视化发生的场景。
 * @param {object} options.geometryOptions 几何体的选项。
 * @param {string} options.geometryPropertyName 几何体属性名称。
 * @param {string[]} options.observedPropertyNames 此几何体关心的实体属性。
 */

function GroundGeometryUpdater(options) {
  GeometryUpdater.call(this, options);

  this._zIndex = 0;
  this._terrainOffsetProperty = undefined;
}

if (defined(Object.create)) {
  GroundGeometryUpdater.prototype = Object.create(GeometryUpdater.prototype);
  GroundGeometryUpdater.prototype.constructor = GroundGeometryUpdater;
}

Object.defineProperties(GroundGeometryUpdater.prototype, {
  /**
   * 获取 zIndex。
   * @type {number}
   * @memberof GroundGeometryUpdater.prototype
   * @readonly
   */
  zIndex: {
    get: function () {
      return this._zIndex;
    },
  },

  /**
   * 获取地形偏移属性。
   * @type {TerrainOffsetProperty}
   * @memberof GroundGeometryUpdater.prototype
   * @readonly
   * @private
   */
  terrainOffsetProperty: {
    get: function () {
      return this._terrainOffsetProperty;
    },
  },
});


GroundGeometryUpdater.prototype._isOnTerrain = function (entity, geometry) {
  return (
    this._fillEnabled &&
    !defined(geometry.height) &&
    !defined(geometry.extrudedHeight) &&
    GroundPrimitive.isSupported(this._scene)
  );
};

GroundGeometryUpdater.prototype._getIsClosed = function (options) {
  const height = options.height;
  const extrudedHeight = options.extrudedHeight;
  return height === 0 || (defined(extrudedHeight) && extrudedHeight !== height);
};

GroundGeometryUpdater.prototype._computeCenter =
  DeveloperError.throwInstantiationError;

GroundGeometryUpdater.prototype._onEntityPropertyChanged = function (
  entity,
  propertyName,
  newValue,
  oldValue,
) {
  GeometryUpdater.prototype._onEntityPropertyChanged.call(
    this,
    entity,
    propertyName,
    newValue,
    oldValue,
  );
  if (this._observedPropertyNames.indexOf(propertyName) === -1) {
    return;
  }

  const geometry = this._entity[this._geometryPropertyName];
  if (!defined(geometry)) {
    return;
  }
  if (
    defined(geometry.zIndex) &&
    (defined(geometry.height) || defined(geometry.extrudedHeight))
  ) {
    oneTimeWarning(oneTimeWarning.geometryZIndex);
  }

  this._zIndex = defaultValue(geometry.zIndex, defaultZIndex);

  if (defined(this._terrainOffsetProperty)) {
    this._terrainOffsetProperty.destroy();
    this._terrainOffsetProperty = undefined;
  }

  const heightReferenceProperty = geometry.heightReference;
  const extrudedHeightReferenceProperty = geometry.extrudedHeightReference;

  if (
    defined(heightReferenceProperty) ||
    defined(extrudedHeightReferenceProperty)
  ) {
    const centerPosition = new CallbackProperty(
      this._computeCenter.bind(this),
      !this._dynamic,
    );
    this._terrainOffsetProperty = new TerrainOffsetProperty(
      this._scene,
      centerPosition,
      heightReferenceProperty,
      extrudedHeightReferenceProperty,
    );
  }
};

/**
 * 销毁对象使用的资源。一旦对象被销毁，则不应再使用。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

GroundGeometryUpdater.prototype.destroy = function () {
  if (defined(this._terrainOffsetProperty)) {
    this._terrainOffsetProperty.destroy();
    this._terrainOffsetProperty = undefined;
  }

  GeometryUpdater.prototype.destroy.call(this);
};

/**
 * @private
 */
GroundGeometryUpdater.getGeometryHeight = function (height, heightReference) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("heightReference", heightReference);
  //>>includeEnd('debug');
  if (!defined(height)) {
    if (heightReference !== HeightReference.NONE) {
      oneTimeWarning(oneTimeWarning.geometryHeightReference);
    }
    return;
  }

  if (!isHeightReferenceClamp(heightReference)) {
    return height;
  }

  return 0.0;
};

/**
 * @private
 */
GroundGeometryUpdater.getGeometryExtrudedHeight = function (
  extrudedHeight,
  extrudedHeightReference,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("extrudedHeightReference", extrudedHeightReference);
  //>>includeEnd('debug');
  if (!defined(extrudedHeight)) {
    if (extrudedHeightReference !== HeightReference.NONE) {
      oneTimeWarning(oneTimeWarning.geometryExtrudedHeightReference);
    }
    return;
  }
  if (!isHeightReferenceClamp(extrudedHeightReference)) {
    return extrudedHeight;
  }

  return GroundGeometryUpdater.CLAMP_TO_GROUND;
};

/**
 * @private
 */
GroundGeometryUpdater.CLAMP_TO_GROUND = "clamp";

/**
 * @private
 */
GroundGeometryUpdater.computeGeometryOffsetAttribute = function (
  height,
  heightReference,
  extrudedHeight,
  extrudedHeightReference,
) {
  if (!defined(height) || !defined(heightReference)) {
    heightReference = HeightReference.NONE;
  }
  if (!defined(extrudedHeight) || !defined(extrudedHeightReference)) {
    extrudedHeightReference = HeightReference.NONE;
  }
  let n = 0;
  if (heightReference !== HeightReference.NONE) {
    n++;
  }
  if (extrudedHeightReference === HeightReference.RELATIVE_TO_GROUND) {
    n++;
  }
  if (n === 2) {
    return GeometryOffsetAttribute.ALL;
  }
  if (n === 1) {
    return GeometryOffsetAttribute.TOP;
  }

  return undefined;
};
export default GroundGeometryUpdater;
