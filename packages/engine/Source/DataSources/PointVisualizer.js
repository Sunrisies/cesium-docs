import AssociativeArray from "../Core/AssociativeArray.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import createBillboardPointCallback from "../Scene/createBillboardPointCallback.js";
import HeightReference from "../Scene/HeightReference.js";
import BoundingSphereState from "./BoundingSphereState.js";
import Property from "./Property.js";
import SplitDirection from "../Scene/SplitDirection.js";

const defaultColor = Color.WHITE;
const defaultOutlineColor = Color.BLACK;
const defaultOutlineWidth = 0.0;
const defaultPixelSize = 1.0;
const defaultDisableDepthTestDistance = 0.0;
const defaultSplitDirection = SplitDirection.NONE;

const colorScratch = new Color();
const positionScratch = new Cartesian3();
const outlineColorScratch = new Color();
const scaleByDistanceScratch = new NearFarScalar();
const translucencyByDistanceScratch = new NearFarScalar();
const distanceDisplayConditionScratch = new DistanceDisplayCondition();

function EntityData(entity) {
  this.entity = entity;
  this.pointPrimitive = undefined;
  this.billboard = undefined;
  this.color = undefined;
  this.outlineColor = undefined;
  this.pixelSize = undefined;
  this.outlineWidth = undefined;
}

/**
 * 一个 {@link Visualizer}，将 {@link Entity#point} 映射到 {@link PointPrimitive}。
 * @alias PointVisualizer
 * @constructor
 *
 * @param {EntityCluster} entityCluster 用于管理广告牌集合的实体聚类，并可选择与其他实体聚类。
 * @param {EntityCollection} entityCollection 要可视化的实体集合。
 */

function PointVisualizer(entityCluster, entityCollection) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entityCluster)) {
    throw new DeveloperError("entityCluster is required.");
  }
  if (!defined(entityCollection)) {
    throw new DeveloperError("entityCollection is required.");
  }
  //>>includeEnd('debug');

  entityCollection.collectionChanged.addEventListener(
    PointVisualizer.prototype._onCollectionChanged,
    this,
  );

  this._cluster = entityCluster;
  this._entityCollection = entityCollection;
  this._items = new AssociativeArray();
  this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
}

/**
 * 更新此可视化器创建的原语，以匹配给定时间的实体对应物。
 *
 * @param {JulianDate} time 要更新到的时间。
 * @returns {boolean} 此函数始终返回 true。
 */

PointVisualizer.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(time)) {
    throw new DeveloperError("time is required.");
  }
  //>>includeEnd('debug');

  const items = this._items.values;
  const cluster = this._cluster;
  for (let i = 0, len = items.length; i < len; i++) {
    const item = items[i];
    const entity = item.entity;
    const pointGraphics = entity._point;
    let pointPrimitive = item.pointPrimitive;
    let billboard = item.billboard;
    const heightReference = Property.getValueOrDefault(
      pointGraphics._heightReference,
      time,
      HeightReference.NONE,
    );
    let show =
      entity.isShowing &&
      entity.isAvailable(time) &&
      Property.getValueOrDefault(pointGraphics._show, time, true);
    let position;
    if (show) {
      position = Property.getValueOrUndefined(
        entity._position,
        time,
        positionScratch,
      );
      show = defined(position);
    }
    if (!show) {
      returnPrimitive(item, entity, cluster);
      continue;
    }

    if (!Property.isConstant(entity._position)) {
      cluster._clusterDirty = true;
    }

    let needsRedraw = false;
    let updateClamping = false;
    if (heightReference !== HeightReference.NONE && !defined(billboard)) {
      if (defined(pointPrimitive)) {
        returnPrimitive(item, entity, cluster);
        pointPrimitive = undefined;
      }

      billboard = cluster.getBillboard(entity);
      billboard.id = entity;
      billboard.image = undefined;
      item.billboard = billboard;
      needsRedraw = true;

      // If this new billboard happens to have a position and height reference that match our new values,
      // billboard._updateClamping will not be called automatically. That's a problem because the clamped
      // height may be based on different terrain than is now loaded. So we'll manually call
      // _updateClamping below.
      updateClamping =
        Cartesian3.equals(billboard.position, position) &&
        billboard.heightReference === heightReference;
    } else if (
      heightReference === HeightReference.NONE &&
      !defined(pointPrimitive)
    ) {
      if (defined(billboard)) {
        returnPrimitive(item, entity, cluster);
        billboard = undefined;
      }

      pointPrimitive = cluster.getPoint(entity);
      pointPrimitive.id = entity;
      item.pointPrimitive = pointPrimitive;
    }

    if (defined(pointPrimitive)) {
      pointPrimitive.show = true;
      pointPrimitive.position = position;
      pointPrimitive.scaleByDistance = Property.getValueOrUndefined(
        pointGraphics._scaleByDistance,
        time,
        scaleByDistanceScratch,
      );
      pointPrimitive.translucencyByDistance = Property.getValueOrUndefined(
        pointGraphics._translucencyByDistance,
        time,
        translucencyByDistanceScratch,
      );
      pointPrimitive.color = Property.getValueOrDefault(
        pointGraphics._color,
        time,
        defaultColor,
        colorScratch,
      );
      pointPrimitive.outlineColor = Property.getValueOrDefault(
        pointGraphics._outlineColor,
        time,
        defaultOutlineColor,
        outlineColorScratch,
      );
      pointPrimitive.outlineWidth = Property.getValueOrDefault(
        pointGraphics._outlineWidth,
        time,
        defaultOutlineWidth,
      );
      pointPrimitive.pixelSize = Property.getValueOrDefault(
        pointGraphics._pixelSize,
        time,
        defaultPixelSize,
      );
      pointPrimitive.distanceDisplayCondition = Property.getValueOrUndefined(
        pointGraphics._distanceDisplayCondition,
        time,
        distanceDisplayConditionScratch,
      );
      pointPrimitive.disableDepthTestDistance = Property.getValueOrDefault(
        pointGraphics._disableDepthTestDistance,
        time,
        defaultDisableDepthTestDistance,
      );
      pointPrimitive.splitDirection = Property.getValueOrDefault(
        pointGraphics._splitDirection,
        time,
        defaultSplitDirection,
      );
    } else if (defined(billboard)) {
      billboard.show = true;
      billboard.position = position;
      billboard.scaleByDistance = Property.getValueOrUndefined(
        pointGraphics._scaleByDistance,
        time,
        scaleByDistanceScratch,
      );
      billboard.translucencyByDistance = Property.getValueOrUndefined(
        pointGraphics._translucencyByDistance,
        time,
        translucencyByDistanceScratch,
      );
      billboard.distanceDisplayCondition = Property.getValueOrUndefined(
        pointGraphics._distanceDisplayCondition,
        time,
        distanceDisplayConditionScratch,
      );
      billboard.disableDepthTestDistance = Property.getValueOrDefault(
        pointGraphics._disableDepthTestDistance,
        time,
        defaultDisableDepthTestDistance,
      );
      billboard.splitDirection = Property.getValueOrDefault(
        pointGraphics._splitDirection,
        time,
        defaultSplitDirection,
      );
      billboard.heightReference = heightReference;

      const newColor = Property.getValueOrDefault(
        pointGraphics._color,
        time,
        defaultColor,
        colorScratch,
      );
      const newOutlineColor = Property.getValueOrDefault(
        pointGraphics._outlineColor,
        time,
        defaultOutlineColor,
        outlineColorScratch,
      );
      const newOutlineWidth = Math.round(
        Property.getValueOrDefault(
          pointGraphics._outlineWidth,
          time,
          defaultOutlineWidth,
        ),
      );
      let newPixelSize = Math.max(
        1,
        Math.round(
          Property.getValueOrDefault(
            pointGraphics._pixelSize,
            time,
            defaultPixelSize,
          ),
        ),
      );

      if (newOutlineWidth > 0) {
        billboard.scale = 1.0;
        needsRedraw =
          needsRedraw || //
          newOutlineWidth !== item.outlineWidth || //
          newPixelSize !== item.pixelSize || //
          !Color.equals(newColor, item.color) || //
          !Color.equals(newOutlineColor, item.outlineColor);
      } else {
        billboard.scale = newPixelSize / 50.0;
        newPixelSize = 50.0;
        needsRedraw =
          needsRedraw || //
          newOutlineWidth !== item.outlineWidth || //
          !Color.equals(newColor, item.color) || //
          !Color.equals(newOutlineColor, item.outlineColor);
      }

      if (needsRedraw) {
        item.color = Color.clone(newColor, item.color);
        item.outlineColor = Color.clone(newOutlineColor, item.outlineColor);
        item.pixelSize = newPixelSize;
        item.outlineWidth = newOutlineWidth;

        const centerAlpha = newColor.alpha;
        const cssColor = newColor.toCssColorString();
        const cssOutlineColor = newOutlineColor.toCssColorString();
        const textureId = JSON.stringify([
          cssColor,
          newPixelSize,
          cssOutlineColor,
          newOutlineWidth,
        ]);

        billboard.setImage(
          textureId,
          createBillboardPointCallback(
            centerAlpha,
            cssColor,
            cssOutlineColor,
            newOutlineWidth,
            newPixelSize,
          ),
        );
      }

      if (updateClamping) {
        billboard._updateClamping();
      }
    }
  }
  return true;
};

/**
 * 计算一个包围球，该包围球包含为指定实体生成的可视化效果。
 * 包围球位于场景地球的固定坐标系中。
 *
 * @param {Entity} entity 要计算其包围球的实体。
 * @param {BoundingSphere} result 用于存储结果的包围球。
 * @returns {BoundingSphereState} 如果结果包含包围球则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中则返回 BoundingSphereState.PENDING，或者
 *                       如果实体在当前场景中没有可视化则返回 BoundingSphereState.FAILED。
 * @private
 */

PointVisualizer.prototype.getBoundingSphere = function (entity, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const item = this._items.get(entity.id);
  if (
    !defined(item) ||
    !(defined(item.pointPrimitive) || defined(item.billboard))
  ) {
    return BoundingSphereState.FAILED;
  }

  if (defined(item.pointPrimitive)) {
    result.center = Cartesian3.clone(
      item.pointPrimitive.position,
      result.center,
    );
  } else {
    const billboard = item.billboard;
    if (!defined(billboard._clampedPosition)) {
      return BoundingSphereState.PENDING;
    }
    result.center = Cartesian3.clone(billboard._clampedPosition, result.center);
  }

  result.radius = 0;
  return BoundingSphereState.DONE;
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 true；否则返回 false。
 */
PointVisualizer.prototype.isDestroyed = function () {
  return false;
};

/**
 * 移除并销毁此实例创建的所有原语。
 */

PointVisualizer.prototype.destroy = function () {
  this._entityCollection.collectionChanged.removeEventListener(
    PointVisualizer.prototype._onCollectionChanged,
    this,
  );
  const entities = this._entityCollection.values;
  for (let i = 0; i < entities.length; i++) {
    this._cluster.removePoint(entities[i]);
  }
  return destroyObject(this);
};

PointVisualizer.prototype._onCollectionChanged = function (
  entityCollection,
  added,
  removed,
  changed,
) {
  let i;
  let entity;
  const items = this._items;
  const cluster = this._cluster;

  for (i = added.length - 1; i > -1; i--) {
    entity = added[i];
    if (defined(entity._point) && defined(entity._position)) {
      items.set(entity.id, new EntityData(entity));
    }
  }

  for (i = changed.length - 1; i > -1; i--) {
    entity = changed[i];
    if (defined(entity._point) && defined(entity._position)) {
      if (!items.contains(entity.id)) {
        items.set(entity.id, new EntityData(entity));
      }
    } else {
      returnPrimitive(items.get(entity.id), entity, cluster);
      items.remove(entity.id);
    }
  }

  for (i = removed.length - 1; i > -1; i--) {
    entity = removed[i];
    returnPrimitive(items.get(entity.id), entity, cluster);
    items.remove(entity.id);
  }
};

function returnPrimitive(item, entity, cluster) {
  if (defined(item)) {
    const pointPrimitive = item.pointPrimitive;
    if (defined(pointPrimitive)) {
      item.pointPrimitive = undefined;
      cluster.removePoint(entity);
      return;
    }
    const billboard = item.billboard;
    if (defined(billboard)) {
      item.billboard = undefined;
      cluster.removeBillboard(entity);
    }
  }
}
export default PointVisualizer;
