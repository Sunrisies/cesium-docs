import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayConditionGeometryInstanceAttribute from "../Core/DistanceDisplayConditionGeometryInstanceAttribute.js";
import GeometryInstance from "../Core/GeometryInstance.js";
import Iso8601 from "../Core/Iso8601.js";
import ShowGeometryInstanceAttribute from "../Core/ShowGeometryInstanceAttribute.js";
import WallGeometry from "../Core/WallGeometry.js";
import WallOutlineGeometry from "../Core/WallOutlineGeometry.js";
import MaterialAppearance from "../Scene/MaterialAppearance.js";
import PerInstanceColorAppearance from "../Scene/PerInstanceColorAppearance.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import DynamicGeometryUpdater from "./DynamicGeometryUpdater.js";
import GeometryUpdater from "./GeometryUpdater.js";
import Property from "./Property.js";

const scratchColor = new Color();

function WallGeometryOptions(entity) {
  this.id = entity;
  this.vertexFormat = undefined;
  this.positions = undefined;
  this.minimumHeights = undefined;
  this.maximumHeights = undefined;
  this.granularity = undefined;
}

/**
 * 适用于墙的 {@link GeometryUpdater}。
 * 客户通常不会直接创建此类，而是依赖于 {@link DataSourceDisplay}。
 * @alias WallGeometryUpdater
 * @constructor
 *
 * @param {Entity} entity 包含要可视化几何体的实体。
 * @param {Scene} scene 可视化发生的场景。
 */

function WallGeometryUpdater(entity, scene) {
  GeometryUpdater.call(this, {
    entity: entity,
    scene: scene,
    geometryOptions: new WallGeometryOptions(entity),
    geometryPropertyName: "wall",
    observedPropertyNames: ["availability", "wall"],
  });

  this._onEntityPropertyChanged(entity, "wall", entity.wall, undefined);
}

if (defined(Object.create)) {
  WallGeometryUpdater.prototype = Object.create(GeometryUpdater.prototype);
  WallGeometryUpdater.prototype.constructor = WallGeometryUpdater;
}

/**
 * 创建表示几何体填充的几何实例。
 *
 * @param {JulianDate} time 用于检索初始属性值的时间。
 * @returns {GeometryInstance} 表示几何体填充部分的几何实例。
 *
 * @exception {DeveloperError} 此实例不表示填充几何体。
 */

WallGeometryUpdater.prototype.createFillGeometryInstance = function (time) {
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

  let attributes;

  let color;
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
    color = ColorGeometryInstanceAttribute.fromColor(currentColor);
    attributes = {
      show: show,
      distanceDisplayCondition: distanceDisplayConditionAttribute,
      color: color,
    };
  } else {
    attributes = {
      show: show,
      distanceDisplayCondition: distanceDisplayConditionAttribute,
    };
  }

  return new GeometryInstance({
    id: entity,
    geometry: new WallGeometry(this._options),
    attributes: attributes,
  });
};

/**
 * 创建表示几何体轮廓的几何实例。
 *
 * @param {JulianDate} time 用于检索初始属性值的时间。
 * @returns {GeometryInstance} 表示几何体轮廓部分的几何实例。
 *
 * @exception {DeveloperError} 此实例不表示轮廓几何体。
 */

WallGeometryUpdater.prototype.createOutlineGeometryInstance = function (time) {
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

  return new GeometryInstance({
    id: entity,
    geometry: new WallOutlineGeometry(this._options),
    attributes: {
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
    },
  });
};

WallGeometryUpdater.prototype._isHidden = function (entity, wall) {
  return (
    !defined(wall.positions) ||
    GeometryUpdater.prototype._isHidden.call(this, entity, wall)
  );
};

WallGeometryUpdater.prototype._getIsClosed = function (options) {
  return false;
};

WallGeometryUpdater.prototype._isDynamic = function (entity, wall) {
  return (
    !wall.positions.isConstant || //
    !Property.isConstant(wall.minimumHeights) || //
    !Property.isConstant(wall.maximumHeights) || //
    !Property.isConstant(wall.outlineWidth) || //
    !Property.isConstant(wall.granularity)
  );
};

WallGeometryUpdater.prototype._setStaticOptions = function (entity, wall) {
  const minimumHeights = wall.minimumHeights;
  const maximumHeights = wall.maximumHeights;
  const granularity = wall.granularity;
  const isColorMaterial =
    this._materialProperty instanceof ColorMaterialProperty;

  const options = this._options;
  options.vertexFormat = isColorMaterial
    ? PerInstanceColorAppearance.VERTEX_FORMAT
    : MaterialAppearance.MaterialSupport.TEXTURED.vertexFormat;
  options.positions = wall.positions.getValue(
    Iso8601.MINIMUM_VALUE,
    options.positions,
  );
  options.minimumHeights = defined(minimumHeights)
    ? minimumHeights.getValue(Iso8601.MINIMUM_VALUE, options.minimumHeights)
    : undefined;
  options.maximumHeights = defined(maximumHeights)
    ? maximumHeights.getValue(Iso8601.MINIMUM_VALUE, options.maximumHeights)
    : undefined;
  options.granularity = defined(granularity)
    ? granularity.getValue(Iso8601.MINIMUM_VALUE)
    : undefined;
};

WallGeometryUpdater.DynamicGeometryUpdater = DynamicWallGeometryUpdater;

/**
 * @private
 */
function DynamicWallGeometryUpdater(
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
  DynamicWallGeometryUpdater.prototype = Object.create(
    DynamicGeometryUpdater.prototype,
  );
  DynamicWallGeometryUpdater.prototype.constructor = DynamicWallGeometryUpdater;
}

DynamicWallGeometryUpdater.prototype._isHidden = function (entity, wall, time) {
  return (
    !defined(this._options.positions) ||
    DynamicGeometryUpdater.prototype._isHidden.call(this, entity, wall, time)
  );
};

DynamicWallGeometryUpdater.prototype._setOptions = function (
  entity,
  wall,
  time,
) {
  const options = this._options;
  options.positions = Property.getValueOrUndefined(
    wall.positions,
    time,
    options.positions,
  );
  options.minimumHeights = Property.getValueOrUndefined(
    wall.minimumHeights,
    time,
    options.minimumHeights,
  );
  options.maximumHeights = Property.getValueOrUndefined(
    wall.maximumHeights,
    time,
    options.maximumHeights,
  );
  options.granularity = Property.getValueOrUndefined(wall.granularity, time);
};
export default WallGeometryUpdater;
