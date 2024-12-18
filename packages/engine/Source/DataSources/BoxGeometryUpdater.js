import BoxGeometry from "../Core/BoxGeometry.js";
import BoxOutlineGeometry from "../Core/BoxOutlineGeometry.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayConditionGeometryInstanceAttribute from "../Core/DistanceDisplayConditionGeometryInstanceAttribute.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import GeometryOffsetAttribute from "../Core/GeometryOffsetAttribute.js";
import Iso8601 from "../Core/Iso8601.js";
import OffsetGeometryInstanceAttribute from "../Core/OffsetGeometryInstanceAttribute.js";
import ShowGeometryInstanceAttribute from "../Core/ShowGeometryInstanceAttribute.js";
import HeightReference from "../Scene/HeightReference.js";
import MaterialAppearance from "../Scene/MaterialAppearance.js";
import PerInstanceColorAppearance from "../Scene/PerInstanceColorAppearance.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import DynamicGeometryUpdater from "./DynamicGeometryUpdater.js";
import GeometryUpdater from "./GeometryUpdater.js";
import heightReferenceOnEntityPropertyChanged from "./heightReferenceOnEntityPropertyChanged.js";
import Property from "./Property.js";

const defaultOffset = Cartesian3.ZERO;

const offsetScratch = new Cartesian3();
const positionScratch = new Cartesian3();
const scratchColor = new Color();

function BoxGeometryOptions(entity) {
  this.id = entity;
  this.vertexFormat = undefined;
  this.dimensions = undefined;
  this.offsetAttribute = undefined;
}
/**
 * 一个用于盒子的 {@link GeometryUpdater}。
 * 客户通常不会直接创建此类，而是依赖于 {@link DataSourceDisplay}。
 * @alias BoxGeometryUpdater
 * @constructor
 *
 * @param {Entity} entity 包含要可视化几何体的实体。
 * @param {Scene} scene 进行可视化的场景。
 */

function BoxGeometryUpdater(entity, scene) {
  GeometryUpdater.call(this, {
    entity: entity,
    scene: scene,
    geometryOptions: new BoxGeometryOptions(entity),
    geometryPropertyName: "box",
    observedPropertyNames: ["availability", "position", "orientation", "box"],
  });

  this._onEntityPropertyChanged(entity, "box", entity.box, undefined);
}

if (defined(Object.create)) {
  BoxGeometryUpdater.prototype = Object.create(GeometryUpdater.prototype);
  BoxGeometryUpdater.prototype.constructor = BoxGeometryUpdater;
}

Object.defineProperties(BoxGeometryUpdater.prototype, {
  /**
  * 获取地形偏移属性
  * @type {TerrainOffsetProperty}
  * @memberof BoxGeometryUpdater.prototype
  * @readonly
  * @private
  */

  terrainOffsetProperty: {
    get: function() {
      return this._terrainOffsetProperty;
    },
  },
});

/**
 * 创建表示几何体填充部分的几何体实例。
 *
 * @param {JulianDate} time 用于检索初始属性值的时间。
 * @returns {GeometryInstance} 表示几何体填充部分的几何体实例。
 *
 * @exception {DeveloperError} 此实例不表示填充几何体。
 */

BoxGeometryUpdater.prototype.createFillGeometryInstance = function(time) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);

  if (!this._fillEnabled) {
    throw new DeveloperError(
      "This instance does not represent a filled geometry.",
    );
  }
  //>>includeEnd('debug');

  const entity = this._entity;
  const isAvailable = entity.isAvailable(time);

  const show = new ShowGeometryInstanceAttribute(
    isAvailable &&
    entity.isShowing &&
    this._showProperty.getValue(time) &&
    this._fillProperty.getValue(time),
  );
  const distanceDisplayCondition =
    this._distanceDisplayConditionProperty.getValue(time);
  const distanceDisplayConditionAttribute =
    DistanceDisplayConditionGeometryInstanceAttribute.fromDistanceDisplayCondition(
      distanceDisplayCondition,
    );

  const attributes = {
    show: show,
    distanceDisplayCondition: distanceDisplayConditionAttribute,
    color: undefined,
    offset: undefined,
  };
  if (this._materialProperty instanceof ColorMaterialProperty) {
    let currentColor;
    if (
      defined(this._materialProperty.color) &&
      (this._materialProperty.color.isConstant || isAvailable)
    ) {
      currentColor = this._materialProperty.color.getValue(time, scratchColor);
    }
    if (!defined(currentColor)) {
      currentColor = Color.WHITE;
    }
    attributes.color = ColorGeometryInstanceAttribute.fromColor(currentColor);
  }
  if (defined(this._options.offsetAttribute)) {
    attributes.offset = OffsetGeometryInstanceAttribute.fromCartesian3(
      Property.getValueOrDefault(
        this._terrainOffsetProperty,
        time,
        defaultOffset,
        offsetScratch,
      ),
    );
  }

  return new GeometryInstance({
    id: entity,
    geometry: BoxGeometry.fromDimensions(this._options),
    modelMatrix: entity.computeModelMatrixForHeightReference(
      time,
      entity.box.heightReference,
      this._options.dimensions.z * 0.5,
      this._scene.ellipsoid,
    ),
    attributes: attributes,
  });
};

/**
 * 创建表示几何体轮廓的几何体实例。
 *
 * @param {JulianDate} time 用于检索初始属性值的时间。
 * @returns {GeometryInstance} 表示几何体轮廓部分的几何体实例。
 *
 * @exception {DeveloperError} 此实例不表示轮廓几何体。
 */

BoxGeometryUpdater.prototype.createOutlineGeometryInstance = function(time) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);

  if (!this._outlineEnabled) {
    throw new DeveloperError(
      "This instance does not represent an outlined geometry.",
    );
  }
  //>>includeEnd('debug');

  const entity = this._entity;
  const isAvailable = entity.isAvailable(time);
  const outlineColor = Property.getValueOrDefault(
    this._outlineColorProperty,
    time,
    Color.BLACK,
    scratchColor,
  );
  const distanceDisplayCondition =
    this._distanceDisplayConditionProperty.getValue(time);

  const attributes = {
    show: new ShowGeometryInstanceAttribute(
      isAvailable &&
      entity.isShowing &&
      this._showProperty.getValue(time) &&
      this._showOutlineProperty.getValue(time),
    ),
    color: ColorGeometryInstanceAttribute.fromColor(outlineColor),
    distanceDisplayCondition:
      DistanceDisplayConditionGeometryInstanceAttribute.fromDistanceDisplayCondition(
        distanceDisplayCondition,
      ),
    offset: undefined,
  };
  if (defined(this._options.offsetAttribute)) {
    attributes.offset = OffsetGeometryInstanceAttribute.fromCartesian3(
      Property.getValueOrDefault(
        this._terrainOffsetProperty,
        time,
        defaultOffset,
        offsetScratch,
      ),
    );
  }

  return new GeometryInstance({
    id: entity,
    geometry: BoxOutlineGeometry.fromDimensions(this._options),
    modelMatrix: entity.computeModelMatrixForHeightReference(
      time,
      entity.box.heightReference,
      this._options.dimensions.z * 0.5,
      this._scene.ellipsoid,
    ),
    attributes: attributes,
  });
};

BoxGeometryUpdater.prototype._computeCenter = function(time, result) {
  return Property.getValueOrUndefined(this._entity.position, time, result);
};

BoxGeometryUpdater.prototype._isHidden = function(entity, box) {
  return (
    !defined(box.dimensions) ||
    !defined(entity.position) ||
    GeometryUpdater.prototype._isHidden.call(this, entity, box)
  );
};

BoxGeometryUpdater.prototype._isDynamic = function(entity, box) {
  return (
    !entity.position.isConstant ||
    !Property.isConstant(entity.orientation) ||
    !box.dimensions.isConstant ||
    !Property.isConstant(box.outlineWidth)
  );
};

BoxGeometryUpdater.prototype._setStaticOptions = function(entity, box) {
  const heightReference = Property.getValueOrDefault(
    box.heightReference,
    Iso8601.MINIMUM_VALUE,
    HeightReference.NONE,
  );

  const options = this._options;
  options.vertexFormat =
    this._materialProperty instanceof ColorMaterialProperty
      ? PerInstanceColorAppearance.VERTEX_FORMAT
      : MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat;
  options.dimensions = box.dimensions.getValue(
    Iso8601.MINIMUM_VALUE,
    options.dimensions,
  );
  options.offsetAttribute =
    heightReference !== HeightReference.NONE
      ? GeometryOffsetAttribute.ALL
      : undefined;
};

BoxGeometryUpdater.prototype._onEntityPropertyChanged =
  heightReferenceOnEntityPropertyChanged;

BoxGeometryUpdater.DynamicGeometryUpdater = DynamicBoxGeometryUpdater;

/**
 * @private
 */
function DynamicBoxGeometryUpdater(
  geometryUpdater,
  primitives,
  groundPrimitives,
) {
  DynamicGeometryUpdater.call(
    this,
    geometryUpdater,
    primitives,
    groundPrimitives,
  );
}

if (defined(Object.create)) {
  DynamicBoxGeometryUpdater.prototype = Object.create(
    DynamicGeometryUpdater.prototype,
  );
  DynamicBoxGeometryUpdater.prototype.constructor = DynamicBoxGeometryUpdater;
}

DynamicBoxGeometryUpdater.prototype._isHidden = function(entity, box, time) {
  const position = Property.getValueOrUndefined(
    entity.position,
    time,
    positionScratch,
  );
  const dimensions = this._options.dimensions;
  return (
    !defined(position) ||
    !defined(dimensions) ||
    DynamicGeometryUpdater.prototype._isHidden.call(this, entity, box, time)
  );
};

DynamicBoxGeometryUpdater.prototype._setOptions = function(entity, box, time) {
  const heightReference = Property.getValueOrDefault(
    box.heightReference,
    time,
    HeightReference.NONE,
  );
  const options = this._options;
  options.dimensions = Property.getValueOrUndefined(
    box.dimensions,
    time,
    options.dimensions,
  );
  options.offsetAttribute =
    heightReference !== HeightReference.NONE
      ? GeometryOffsetAttribute.ALL
      : undefined;
};
export default BoxGeometryUpdater;
