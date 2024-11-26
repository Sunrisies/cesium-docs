import destroyObject from "../Core/destroyObject.js";
import Event from "../Core/Event.js";
import EventHelper from "../Core/EventHelper.js";
import BoxGeometryUpdater from "./BoxGeometryUpdater.js";
import CorridorGeometryUpdater from "./CorridorGeometryUpdater.js";
import CylinderGeometryUpdater from "./CylinderGeometryUpdater.js";
import EllipseGeometryUpdater from "./EllipseGeometryUpdater.js";
import EllipsoidGeometryUpdater from "./EllipsoidGeometryUpdater.js";
import PlaneGeometryUpdater from "./PlaneGeometryUpdater.js";
import PolygonGeometryUpdater from "./PolygonGeometryUpdater.js";
import PolylineVolumeGeometryUpdater from "./PolylineVolumeGeometryUpdater.js";
import RectangleGeometryUpdater from "./RectangleGeometryUpdater.js";
import WallGeometryUpdater from "./WallGeometryUpdater.js";

/** @type {GeometryUpdater[]} */
const geometryUpdaters = [
  BoxGeometryUpdater,
  CylinderGeometryUpdater,
  CorridorGeometryUpdater,
  EllipseGeometryUpdater,
  EllipsoidGeometryUpdater,
  PlaneGeometryUpdater,
  PolygonGeometryUpdater,
  PolylineVolumeGeometryUpdater,
  RectangleGeometryUpdater,
  WallGeometryUpdater,
];

/**
 * 管理每个实体的 {@link GeometryVisualizer} 的一组 "更新器" 类。
 *
 * @private
 * @param {Entity} entity 实体。
 * @param {Scene} scene 场景。
 */

function GeometryUpdaterSet(entity, scene) {
  this.entity = entity;
  this.scene = scene;
  const updaters = new Array(geometryUpdaters.length);
  const geometryChanged = new Event();
  const eventHelper = new EventHelper();
  for (let i = 0; i < updaters.length; i++) {
    const updater = new geometryUpdaters[i](entity, scene);
    eventHelper.add(updater.geometryChanged, (geometry) => {
      geometryChanged.raiseEvent(geometry);
    });
    updaters[i] = updater;
  }
  this.updaters = updaters;
  this.geometryChanged = geometryChanged;
  this.eventHelper = eventHelper;

  this._removeEntitySubscription = entity.definitionChanged.addEventListener(
    GeometryUpdaterSet.prototype._onEntityPropertyChanged,
    this,
  );
}

GeometryUpdaterSet.prototype._onEntityPropertyChanged = function (
  entity,
  propertyName,
  newValue,
  oldValue,
) {
  const updaters = this.updaters;
  for (let i = 0; i < updaters.length; i++) {
    updaters[i]._onEntityPropertyChanged(
      entity,
      propertyName,
      newValue,
      oldValue,
    );
  }
};

GeometryUpdaterSet.prototype.forEach = function (callback) {
  const updaters = this.updaters;
  for (let i = 0; i < updaters.length; i++) {
    callback(updaters[i]);
  }
};

GeometryUpdaterSet.prototype.destroy = function () {
  this.eventHelper.removeAll();
  const updaters = this.updaters;
  for (let i = 0; i < updaters.length; i++) {
    updaters[i].destroy();
  }
  this._removeEntitySubscription();
  destroyObject(this);
};

/**
 * 如果提供的更新器尚未包含，则将其添加到默认的更新器列表中。
 * @param {GeometryUpdater} updater 更新器。
 */
GeometryUpdaterSet.registerUpdater = function (updater) {
  if (!geometryUpdaters.includes(updater)) {
    geometryUpdaters.push(updater);
  }
};

/**
 * 从默认的更新器列表中移除提供的更新器（如果已包含）。
 * @param {GeometryUpdater} updater 更新器。
 */
GeometryUpdaterSet.unregisterUpdater = function (updater) {
  if (geometryUpdaters.includes(updater)) {
    const index = geometryUpdaters.indexOf(updater);
    geometryUpdaters.splice(index, 1);
  }
};

export default GeometryUpdaterSet;
