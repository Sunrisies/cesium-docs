import AssociativeArray from "../Core/AssociativeArray.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import HeightReference from "../Scene/HeightReference.js";
import HorizontalOrigin from "../Scene/HorizontalOrigin.js";
import LabelStyle from "../Scene/LabelStyle.js";
import VerticalOrigin from "../Scene/VerticalOrigin.js";
import BoundingSphereState from "./BoundingSphereState.js";
import Property from "./Property.js";

const defaultScale = 1.0;
const defaultFont = "30px sans-serif";
const defaultStyle = LabelStyle.FILL;
const defaultFillColor = Color.WHITE;
const defaultOutlineColor = Color.BLACK;
const defaultOutlineWidth = 1.0;
const defaultShowBackground = false;
const defaultBackgroundColor = new Color(0.165, 0.165, 0.165, 0.8);
const defaultBackgroundPadding = new Cartesian2(7, 5);
const defaultPixelOffset = Cartesian2.ZERO;
const defaultEyeOffset = Cartesian3.ZERO;
const defaultHeightReference = HeightReference.NONE;
const defaultHorizontalOrigin = HorizontalOrigin.CENTER;
const defaultVerticalOrigin = VerticalOrigin.CENTER;

const positionScratch = new Cartesian3();
const fillColorScratch = new Color();
const outlineColorScratch = new Color();
const backgroundColorScratch = new Color();
const backgroundPaddingScratch = new Cartesian2();
const eyeOffsetScratch = new Cartesian3();
const pixelOffsetScratch = new Cartesian2();
const translucencyByDistanceScratch = new NearFarScalar();
const pixelOffsetScaleByDistanceScratch = new NearFarScalar();
const scaleByDistanceScratch = new NearFarScalar();
const distanceDisplayConditionScratch = new DistanceDisplayCondition();

function EntityData(entity) {
  this.entity = entity;
  this.label = undefined;
  this.index = undefined;
}

/**
 * 一个 {@link Visualizer}，将 {@link Entity#label} 中的 {@link LabelGraphics} 实例映射到 {@link Label}。
 * @alias LabelVisualizer
 * @constructor
 *
 * @param {EntityCluster} entityCluster 管理公告牌集合的实体聚类，并可选择与其他实体聚类。
 * @param {EntityCollection} entityCollection 要可视化的实体集合。
 */

function LabelVisualizer(entityCluster, entityCollection) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entityCluster)) {
    throw new DeveloperError("entityCluster is required.");
  }
  if (!defined(entityCollection)) {
    throw new DeveloperError("entityCollection is required.");
  }
  //>>includeEnd('debug');

  entityCollection.collectionChanged.addEventListener(
    LabelVisualizer.prototype._onCollectionChanged,
    this,
  );

  this._cluster = entityCluster;
  this._entityCollection = entityCollection;
  this._items = new AssociativeArray();

  this._onCollectionChanged(entityCollection, entityCollection.values, [], []);
}

/**
 * 更新此可视化器创建的基元，以匹配在给定时间的实体对应对象。
 *
 * @param {JulianDate} time 要更新的时间。
 * @returns {boolean} 此函数始终返回 true。
 */

LabelVisualizer.prototype.update = function (time) {
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
    const labelGraphics = entity._label;
    let text;
    let label = item.label;
    let show =
      entity.isShowing &&
      entity.isAvailable(time) &&
      Property.getValueOrDefault(labelGraphics._show, time, true);
    let position;
    if (show) {
      position = Property.getValueOrUndefined(
        entity._position,
        time,
        positionScratch,
      );
      text = Property.getValueOrUndefined(labelGraphics._text, time);
      show = defined(position) && defined(text);
    }

    if (!show) {
      //don't bother creating or updating anything else
      returnPrimitive(item, entity, cluster);
      continue;
    }

    if (!Property.isConstant(entity._position)) {
      cluster._clusterDirty = true;
    }

    let updateClamping = false;
    const heightReference = Property.getValueOrDefault(
      labelGraphics._heightReference,
      time,
      defaultHeightReference,
    );

    if (!defined(label)) {
      label = cluster.getLabel(entity);
      label.id = entity;
      item.label = label;

      // If this new label happens to have a position and height reference that match our new values,
      // label._updateClamping will not be called automatically. That's a problem because the clamped
      // height may be based on different terrain than is now loaded. So we'll manually call
      // _updateClamping below.
      updateClamping =
        Cartesian3.equals(label.position, position) &&
        label.heightReference === heightReference;
    }

    label.show = true;
    label.position = position;
    label.text = text;
    label.scale = Property.getValueOrDefault(
      labelGraphics._scale,
      time,
      defaultScale,
    );
    label.font = Property.getValueOrDefault(
      labelGraphics._font,
      time,
      defaultFont,
    );
    label.style = Property.getValueOrDefault(
      labelGraphics._style,
      time,
      defaultStyle,
    );
    label.fillColor = Property.getValueOrDefault(
      labelGraphics._fillColor,
      time,
      defaultFillColor,
      fillColorScratch,
    );
    label.outlineColor = Property.getValueOrDefault(
      labelGraphics._outlineColor,
      time,
      defaultOutlineColor,
      outlineColorScratch,
    );
    label.outlineWidth = Property.getValueOrDefault(
      labelGraphics._outlineWidth,
      time,
      defaultOutlineWidth,
    );
    label.showBackground = Property.getValueOrDefault(
      labelGraphics._showBackground,
      time,
      defaultShowBackground,
    );
    label.backgroundColor = Property.getValueOrDefault(
      labelGraphics._backgroundColor,
      time,
      defaultBackgroundColor,
      backgroundColorScratch,
    );
    label.backgroundPadding = Property.getValueOrDefault(
      labelGraphics._backgroundPadding,
      time,
      defaultBackgroundPadding,
      backgroundPaddingScratch,
    );
    label.pixelOffset = Property.getValueOrDefault(
      labelGraphics._pixelOffset,
      time,
      defaultPixelOffset,
      pixelOffsetScratch,
    );
    label.eyeOffset = Property.getValueOrDefault(
      labelGraphics._eyeOffset,
      time,
      defaultEyeOffset,
      eyeOffsetScratch,
    );
    label.heightReference = heightReference;
    label.horizontalOrigin = Property.getValueOrDefault(
      labelGraphics._horizontalOrigin,
      time,
      defaultHorizontalOrigin,
    );
    label.verticalOrigin = Property.getValueOrDefault(
      labelGraphics._verticalOrigin,
      time,
      defaultVerticalOrigin,
    );
    label.translucencyByDistance = Property.getValueOrUndefined(
      labelGraphics._translucencyByDistance,
      time,
      translucencyByDistanceScratch,
    );
    label.pixelOffsetScaleByDistance = Property.getValueOrUndefined(
      labelGraphics._pixelOffsetScaleByDistance,
      time,
      pixelOffsetScaleByDistanceScratch,
    );
    label.scaleByDistance = Property.getValueOrUndefined(
      labelGraphics._scaleByDistance,
      time,
      scaleByDistanceScratch,
    );
    label.distanceDisplayCondition = Property.getValueOrUndefined(
      labelGraphics._distanceDisplayCondition,
      time,
      distanceDisplayConditionScratch,
    );
    label.disableDepthTestDistance = Property.getValueOrUndefined(
      labelGraphics._disableDepthTestDistance,
      time,
    );

    if (updateClamping) {
      label._updateClamping();
    }
  }
  return true;
};

/**
 * 计算一个包围指定实体所生成可视化效果的边界球体。
 * 边界球体位于场景地球的固定坐标系中。
 *
 * @param {Entity} entity 要计算其边界球体的实体。
 * @param {BoundingSphere} result 用于存储结果的边界球体。
 * @returns {BoundingSphereState} 如果结果包含边界球体，则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中，则返回 BoundingSphereState.PENDING，或者
 *                       如果实体在当前场景中没有可视化，则返回 BoundingSphereState.FAILED。
 * @private
 */

LabelVisualizer.prototype.getBoundingSphere = function (entity, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required.");
  }
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');

  const item = this._items.get(entity.id);
  if (!defined(item) || !defined(item.label)) {
    return BoundingSphereState.FAILED;
  }

  const label = item.label;
  result.center = Cartesian3.clone(
    defaultValue(label._clampedPosition, label.position),
    result.center,
  );
  result.radius = 0;
  return BoundingSphereState.DONE;
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 *
 * @returns {boolean} 如果该对象已被销毁，返回 true；否则返回 false。
 */
LabelVisualizer.prototype.isDestroyed = function () {
  return false;
};

/**
 * 移除并销毁此实例创建的所有基元。
 */

LabelVisualizer.prototype.destroy = function () {
  this._entityCollection.collectionChanged.removeEventListener(
    LabelVisualizer.prototype._onCollectionChanged,
    this,
  );
  const entities = this._entityCollection.values;
  for (let i = 0; i < entities.length; i++) {
    this._cluster.removeLabel(entities[i]);
  }
  return destroyObject(this);
};

LabelVisualizer.prototype._onCollectionChanged = function (
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
    if (defined(entity._label) && defined(entity._position)) {
      items.set(entity.id, new EntityData(entity));
    }
  }

  for (i = changed.length - 1; i > -1; i--) {
    entity = changed[i];
    if (defined(entity._label) && defined(entity._position)) {
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
    item.label = undefined;
    cluster.removeLabel(entity);
  }
}
export default LabelVisualizer;
