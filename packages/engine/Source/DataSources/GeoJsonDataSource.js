import ArcType from "../Core/ArcType.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import createGuid from "../Core/createGuid.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import getFilenameFromUri from "../Core/getFilenameFromUri.js";
import PinBuilder from "../Core/PinBuilder.js";
import PolygonHierarchy from "../Core/PolygonHierarchy.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import HeightReference from "../Scene/HeightReference.js";
import VerticalOrigin from "../Scene/VerticalOrigin.js";
import * as topojson from "topojson-client";
import BillboardGraphics from "./BillboardGraphics.js";
import CallbackProperty from "./CallbackProperty.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import ConstantPositionProperty from "./ConstantPositionProperty.js";
import ConstantProperty from "./ConstantProperty.js";
import DataSource from "./DataSource.js";
import EntityCluster from "./EntityCluster.js";
import EntityCollection from "./EntityCollection.js";
import PolygonGraphics from "./PolygonGraphics.js";
import PolylineGraphics from "./PolylineGraphics.js";

function defaultCrsFunction(coordinates) {
  return Cartesian3.fromDegrees(coordinates[0], coordinates[1], coordinates[2]);
}

const crsNames = {
  "urn:ogc:def:crs:OGC:1.3:CRS84": defaultCrsFunction,
  "EPSG:4326": defaultCrsFunction,
  "urn:ogc:def:crs:EPSG::4326": defaultCrsFunction,
};

const crsLinkHrefs = {};
const crsLinkTypes = {};
let defaultMarkerSize = 48;
let defaultMarkerSymbol;
let defaultMarkerColor = Color.ROYALBLUE;
let defaultStroke = Color.YELLOW;
let defaultStrokeWidth = 2;
let defaultFill = Color.fromBytes(255, 255, 0, 100);
let defaultClampToGround = false;

const sizes = {
  small: 24,
  medium: 48,
  large: 64,
};

const simpleStyleIdentifiers = [
  "title",
  "description", //
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke", //
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity",
];

function defaultDescribe(properties, nameProperty) {
  let html = "";
  for (const key in properties) {
    if (properties.hasOwnProperty(key)) {
      if (key === nameProperty || simpleStyleIdentifiers.indexOf(key) !== -1) {
        continue;
      }
      const value = properties[key];
      if (defined(value)) {
        if (typeof value === "object") {
          html += `<tr><th>${key}</th><td>${defaultDescribe(value)}</td></tr>`;
        } else {
          html += `<tr><th>${key}</th><td>${value}</td></tr>`;
        }
      }
    }
  }

  if (html.length > 0) {
    html = `<table class="cesium-infoBox-defaultTable"><tbody>${html}</tbody></table>`;
  }

  return html;
}

function createDescriptionCallback(describe, properties, nameProperty) {
  let description;
  return function (time, result) {
    if (!defined(description)) {
      description = describe(properties, nameProperty);
    }
    return description;
  };
}

function defaultDescribeProperty(properties, nameProperty) {
  return new CallbackProperty(
    createDescriptionCallback(defaultDescribe, properties, nameProperty),
    true,
  );
}

//GeoJSON specifies only the Feature object has a usable id property
//But since "multi" geometries create multiple entity,
//we can't use it for them either.
function createObject(geoJson, entityCollection, describe) {
  let id = geoJson.id;
  if (!defined(id) || geoJson.type !== "Feature") {
    id = createGuid();
  } else {
    let i = 2;
    let finalId = id;
    while (defined(entityCollection.getById(finalId))) {
      finalId = `${id}_${i}`;
      i++;
    }
    id = finalId;
  }

  const entity = entityCollection.getOrCreateEntity(id);
  const properties = geoJson.properties;
  if (defined(properties)) {
    entity.properties = properties;

    let nameProperty;

    //Check for the simplestyle specified name first.
    const name = properties.title;
    if (defined(name)) {
      entity.name = name;
      nameProperty = "title";
    } else {
      //Else, find the name by selecting an appropriate property.
      //The name will be obtained based on this order:
      //1) The first case-insensitive property with the name 'title',
      //2) The first case-insensitive property with the name 'name',
      //3) The first property containing the word 'title'.
      //4) The first property containing the word 'name',
      let namePropertyPrecedence = Number.MAX_VALUE;
      for (const key in properties) {
        if (properties.hasOwnProperty(key) && properties[key]) {
          const lowerKey = key.toLowerCase();

          if (namePropertyPrecedence > 1 && lowerKey === "title") {
            namePropertyPrecedence = 1;
            nameProperty = key;
            break;
          } else if (namePropertyPrecedence > 2 && lowerKey === "name") {
            namePropertyPrecedence = 2;
            nameProperty = key;
          } else if (namePropertyPrecedence > 3 && /title/i.test(key)) {
            namePropertyPrecedence = 3;
            nameProperty = key;
          } else if (namePropertyPrecedence > 4 && /name/i.test(key)) {
            namePropertyPrecedence = 4;
            nameProperty = key;
          }
        }
      }
      if (defined(nameProperty)) {
        entity.name = properties[nameProperty];
      }
    }

    const description = properties.description;
    if (description !== null) {
      entity.description = !defined(description)
        ? describe(properties, nameProperty)
        : new ConstantProperty(description);
    }
  }
  return entity;
}

function coordinatesArrayToCartesianArray(coordinates, crsFunction) {
  const positions = new Array(coordinates.length);
  for (let i = 0; i < coordinates.length; i++) {
    positions[i] = crsFunction(coordinates[i]);
  }
  return positions;
}

const geoJsonObjectTypes = {
  Feature: processFeature,
  FeatureCollection: processFeatureCollection,
  GeometryCollection: processGeometryCollection,
  LineString: processLineString,
  MultiLineString: processMultiLineString,
  MultiPoint: processMultiPoint,
  MultiPolygon: processMultiPolygon,
  Point: processPoint,
  Polygon: processPolygon,
  Topology: processTopology,
};

const geometryTypes = {
  GeometryCollection: processGeometryCollection,
  LineString: processLineString,
  MultiLineString: processMultiLineString,
  MultiPoint: processMultiPoint,
  MultiPolygon: processMultiPolygon,
  Point: processPoint,
  Polygon: processPolygon,
  Topology: processTopology,
};

// GeoJSON processing functions
function processFeature(dataSource, feature, notUsed, crsFunction, options) {
  if (feature.geometry === null) {
    //Null geometry is allowed, so just create an empty entity instance for it.
    createObject(feature, dataSource._entityCollection, options.describe);
    return;
  }

  if (!defined(feature.geometry)) {
    throw new RuntimeError("feature.geometry is required.");
  }

  const geometryType = feature.geometry.type;
  const geometryHandler = geometryTypes[geometryType];
  if (!defined(geometryHandler)) {
    throw new RuntimeError(`Unknown geometry type: ${geometryType}`);
  }
  geometryHandler(dataSource, feature, feature.geometry, crsFunction, options);
}

function processFeatureCollection(
  dataSource,
  featureCollection,
  notUsed,
  crsFunction,
  options,
) {
  const features = featureCollection.features;
  for (let i = 0, len = features.length; i < len; i++) {
    processFeature(dataSource, features[i], undefined, crsFunction, options);
  }
}

function processGeometryCollection(
  dataSource,
  geoJson,
  geometryCollection,
  crsFunction,
  options,
) {
  const geometries = geometryCollection.geometries;
  for (let i = 0, len = geometries.length; i < len; i++) {
    const geometry = geometries[i];
    const geometryType = geometry.type;
    const geometryHandler = geometryTypes[geometryType];
    if (!defined(geometryHandler)) {
      throw new RuntimeError(`Unknown geometry type: ${geometryType}`);
    }
    geometryHandler(dataSource, geoJson, geometry, crsFunction, options);
  }
}

function createPoint(dataSource, geoJson, crsFunction, coordinates, options) {
  let symbol = options.markerSymbol;
  let color = options.markerColor;
  let size = options.markerSize;

  const properties = geoJson.properties;
  if (defined(properties)) {
    const cssColor = properties["marker-color"];
    if (defined(cssColor)) {
      color = Color.fromCssColorString(cssColor);
    }

    size = defaultValue(sizes[properties["marker-size"]], size);
    const markerSymbol = properties["marker-symbol"];
    if (defined(markerSymbol)) {
      symbol = markerSymbol;
    }
  }

  let canvasOrPromise;
  if (defined(symbol)) {
    if (symbol.length === 1) {
      canvasOrPromise = dataSource._pinBuilder.fromText(
        symbol.toUpperCase(),
        color,
        size,
      );
    } else {
      canvasOrPromise = dataSource._pinBuilder.fromMakiIconId(
        symbol,
        color,
        size,
      );
    }
  } else {
    canvasOrPromise = dataSource._pinBuilder.fromColor(color, size);
  }

  const billboard = new BillboardGraphics();
  billboard.verticalOrigin = new ConstantProperty(VerticalOrigin.BOTTOM);

  // Clamp to ground if there isn't a height specified
  if (coordinates.length === 2 && options.clampToGround) {
    billboard.heightReference = HeightReference.CLAMP_TO_GROUND;
  }

  const entity = createObject(
    geoJson,
    dataSource._entityCollection,
    options.describe,
  );
  entity.billboard = billboard;
  entity.position = new ConstantPositionProperty(crsFunction(coordinates));

  const promise = Promise.resolve(canvasOrPromise)
    .then(function (image) {
      billboard.image = new ConstantProperty(image);
    })
    .catch(function () {
      billboard.image = new ConstantProperty(
        dataSource._pinBuilder.fromColor(color, size),
      );
    });

  dataSource._promises.push(promise);
}

function processPoint(dataSource, geoJson, geometry, crsFunction, options) {
  createPoint(dataSource, geoJson, crsFunction, geometry.coordinates, options);
}

function processMultiPoint(
  dataSource,
  geoJson,
  geometry,
  crsFunction,
  options,
) {
  const coordinates = geometry.coordinates;
  for (let i = 0; i < coordinates.length; i++) {
    createPoint(dataSource, geoJson, crsFunction, coordinates[i], options);
  }
}

function createLineString(
  dataSource,
  geoJson,
  crsFunction,
  coordinates,
  options,
) {
  let material = options.strokeMaterialProperty;
  let widthProperty = options.strokeWidthProperty;

  const properties = geoJson.properties;
  if (defined(properties)) {
    const width = properties["stroke-width"];
    if (defined(width)) {
      widthProperty = new ConstantProperty(width);
    }

    let color;
    const stroke = properties.stroke;
    if (defined(stroke)) {
      color = Color.fromCssColorString(stroke);
    }
    const opacity = properties["stroke-opacity"];
    if (defined(opacity) && opacity !== 1.0) {
      if (!defined(color)) {
        color = material.color.getValue().clone();
      }
      color.alpha = opacity;
    }
    if (defined(color)) {
      material = new ColorMaterialProperty(color);
    }
  }

  const entity = createObject(
    geoJson,
    dataSource._entityCollection,
    options.describe,
  );
  const polylineGraphics = new PolylineGraphics();
  entity.polyline = polylineGraphics;

  polylineGraphics.clampToGround = options.clampToGround;
  polylineGraphics.material = material;
  polylineGraphics.width = widthProperty;
  polylineGraphics.positions = new ConstantProperty(
    coordinatesArrayToCartesianArray(coordinates, crsFunction),
  );
  polylineGraphics.arcType = ArcType.RHUMB;
}

function processLineString(
  dataSource,
  geoJson,
  geometry,
  crsFunction,
  options,
) {
  createLineString(
    dataSource,
    geoJson,
    crsFunction,
    geometry.coordinates,
    options,
  );
}

function processMultiLineString(
  dataSource,
  geoJson,
  geometry,
  crsFunction,
  options,
) {
  const lineStrings = geometry.coordinates;
  for (let i = 0; i < lineStrings.length; i++) {
    createLineString(dataSource, geoJson, crsFunction, lineStrings[i], options);
  }
}

function createPolygon(dataSource, geoJson, crsFunction, coordinates, options) {
  if (coordinates.length === 0 || coordinates[0].length === 0) {
    return;
  }

  let outlineColorProperty = options.strokeMaterialProperty.color;
  let material = options.fillMaterialProperty;
  let widthProperty = options.strokeWidthProperty;

  const properties = geoJson.properties;
  if (defined(properties)) {
    const width = properties["stroke-width"];
    if (defined(width)) {
      widthProperty = new ConstantProperty(width);
    }

    let color;
    const stroke = properties.stroke;
    if (defined(stroke)) {
      color = Color.fromCssColorString(stroke);
    }
    let opacity = properties["stroke-opacity"];
    if (defined(opacity) && opacity !== 1.0) {
      if (!defined(color)) {
        color = outlineColorProperty.getValue().clone();
      }
      color.alpha = opacity;
    }

    if (defined(color)) {
      outlineColorProperty = new ConstantProperty(color);
    }

    let fillColor;
    const fill = properties.fill;
    const materialColor = material.color.getValue();
    if (defined(fill)) {
      fillColor = Color.fromCssColorString(fill);
      fillColor.alpha = materialColor.alpha;
    }
    opacity = properties["fill-opacity"];
    if (defined(opacity) && opacity !== materialColor.alpha) {
      if (!defined(fillColor)) {
        fillColor = materialColor.clone();
      }
      fillColor.alpha = opacity;
    }
    if (defined(fillColor)) {
      material = new ColorMaterialProperty(fillColor);
    }
  }

  const polygon = new PolygonGraphics();
  polygon.outline = new ConstantProperty(true);
  polygon.outlineColor = outlineColorProperty;
  polygon.outlineWidth = widthProperty;
  polygon.material = material;
  polygon.arcType = ArcType.RHUMB;

  const holes = [];
  for (let i = 1, len = coordinates.length; i < len; i++) {
    holes.push(
      new PolygonHierarchy(
        coordinatesArrayToCartesianArray(coordinates[i], crsFunction),
      ),
    );
  }

  const positions = coordinates[0];
  polygon.hierarchy = new ConstantProperty(
    new PolygonHierarchy(
      coordinatesArrayToCartesianArray(positions, crsFunction),
      holes,
    ),
  );
  if (positions[0].length > 2) {
    polygon.perPositionHeight = new ConstantProperty(true);
  } else if (!options.clampToGround) {
    polygon.height = 0;
  }

  const entity = createObject(
    geoJson,
    dataSource._entityCollection,
    options.describe,
  );
  entity.polygon = polygon;
}

function processPolygon(dataSource, geoJson, geometry, crsFunction, options) {
  createPolygon(
    dataSource,
    geoJson,
    crsFunction,
    geometry.coordinates,
    options,
  );
}

function processMultiPolygon(
  dataSource,
  geoJson,
  geometry,
  crsFunction,
  options,
) {
  const polygons = geometry.coordinates;
  for (let i = 0; i < polygons.length; i++) {
    createPolygon(dataSource, geoJson, crsFunction, polygons[i], options);
  }
}

function processTopology(dataSource, geoJson, geometry, crsFunction, options) {
  for (const property in geometry.objects) {
    if (geometry.objects.hasOwnProperty(property)) {
      const feature = topojson.feature(geometry, geometry.objects[property]);
      const typeHandler = geoJsonObjectTypes[feature.type];
      typeHandler(dataSource, feature, feature, crsFunction, options);
    }
  }
}

/**
 * @typedef {object} GeoJsonDataSource.LoadOptions
 *
 * <code>load</code> 方法的初始化选项。
 *
 * @property {string} [sourceUri] 用于解析相对链接的 URL 的覆盖。
 * @property {GeoJsonDataSource.describe} [describe=GeoJsonDataSource.defaultDescribeProperty] 返回一个属性对象（或仅是字符串）的函数。
 * @property {number} [markerSize=GeoJsonDataSource.markerSize] 每个点创建的地图图钉的默认大小（以像素为单位）。
 * @property {string} [markerSymbol=GeoJsonDataSource.markerSymbol] 每个点创建的地图图钉的默认符号。
 * @property {Color} [markerColor=GeoJsonDataSource.markerColor] 每个点创建的地图图钉的默认颜色。
 * @property {Color} [stroke=GeoJsonDataSource.stroke] 折线和多边形轮廓的默认颜色。
 * @property {number} [strokeWidth=GeoJsonDataSource.strokeWidth] 折线和多边形轮廓的默认宽度。
 * @property {Color} [fill=GeoJsonDataSource.fill] 多边形内部的默认颜色。
 * @property {boolean} [clampToGround=GeoJsonDataSource.clampToGround] 如果希望几何特征（多边形或线串）被固定在地面上则为 true。
 * @property {Credit|string} [credit] 数据源的信用，在画布上显示。
 */


/**
 * 一个 {@link DataSource}，处理 {@link http://www.geojson.org/|GeoJSON} 和 {@link https://github.com/mbostock/topojson|TopoJSON} 数据。
 * 如果存在 {@link https://github.com/mapbox/simplestyle-spec|simplestyle-spec} 属性，也会使用它们。
 *
 * @alias GeoJsonDataSource
 * @constructor
 *
 * @param {string} [name] 此数据源的名称。如果未定义，将从 GeoJSON 文件的名称中获取名称。
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=GeoJSON%20and%20TopoJSON.html|Cesium Sandcastle GeoJSON and TopoJSON Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=GeoJSON%20simplestyle.html|Cesium Sandcastle GeoJSON simplestyle Demo}
 *
 * @example
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.dataSources.add(Cesium.GeoJsonDataSource.load('../../SampleData/ne_10m_us_states.topojson', {
 *   stroke: Cesium.Color.HOTPINK,
 *   fill: Cesium.Color.PINK,
 *   strokeWidth: 3,
 *   markerSymbol: '?'
 * }));
 */
function GeoJsonDataSource(name) {
  this._name = name;
  this._changed = new Event();
  this._error = new Event();
  this._isLoading = false;
  this._loading = new Event();
  this._entityCollection = new EntityCollection(this);
  this._promises = [];
  this._pinBuilder = new PinBuilder();
  this._entityCluster = new EntityCluster();
  this._credit = undefined;
  this._resourceCredits = [];
}

/**
 * 创建一个 Promise，用于加载提供的 GeoJSON 或 TopoJSON 数据的新实例。
 *
 * @param {Resource|string|object} data 要加载的 URL、GeoJSON 对象或 TopoJSON 对象。
 * @param {GeoJsonDataSource.LoadOptions} [options] 一个对象，用于指定配置选项。
 *
 * @returns {Promise<GeoJsonDataSource>} 一个 Promise，当数据加载完成时将被解析。
 */

GeoJsonDataSource.load = function (data, options) {
  return new GeoJsonDataSource().load(data, options);
};

Object.defineProperties(GeoJsonDataSource, {
  /**
   * 获取或设置为每个点创建的地图图钉的默认大小，以像素为单位。
   * @memberof GeoJsonDataSource
   * @type {number}
   * @default 48
   */
  markerSize: {
    get: function () {
      return defaultMarkerSize;
    },
    set: function (value) {
      defaultMarkerSize = value;
    },
  },
  /**
   * 获取或设置为每个点创建的地图图钉的默认符号。
   * 这可以是任何有效的 {@link http://mapbox.com/maki/|Maki} 标识符、任何单个字符，
   * 或者如果不使用符号则为空。
   * @memberof GeoJsonDataSource
   * @type {string}
   */
  markerSymbol: {
    get: function () {
      return defaultMarkerSymbol;
    },
    set: function (value) {
      defaultMarkerSymbol = value;
    },
  },
  /**
   * 获取或设置为每个点创建的地图图钉的默认颜色。
   * @memberof GeoJsonDataSource
   * @type {Color}
   * @default Color.ROYALBLUE
   */
  markerColor: {
    get: function () {
      return defaultMarkerColor;
    },
    set: function (value) {
      defaultMarkerColor = value;
    },
  },
  /**
   * 获取或设置折线和多边形轮廓的默认颜色。
   * @memberof GeoJsonDataSource
   * @type {Color}
   * @default Color.BLACK
   */
  stroke: {
    get: function () {
      return defaultStroke;
    },
    set: function (value) {
      defaultStroke = value;
    },
  },
  /**
   * 获取或设置折线和多边形轮廓的默认宽度。
   * @memberof GeoJsonDataSource
   * @type {number}
   * @default 2.0
   */
  strokeWidth: {
    get: function () {
      return defaultStrokeWidth;
    },
    set: function (value) {
      defaultStrokeWidth = value;
    },
  },
  /**
   * 获取或设置多边形内部的默认颜色。
   * @memberof GeoJsonDataSource
   * @type {Color}
   * @default Color.YELLOW
   */
  fill: {
    get: function () {
      return defaultFill;
    },
    set: function (value) {
      defaultFill = value;
    },
  },
  /**
   * 获取或设置是否固定到地面的默认值。
   * @memberof GeoJsonDataSource
   * @type {boolean}
   * @default false
   */
  clampToGround: {
    get: function () {
      return defaultClampToGround;
    },
    set: function (value) {
      defaultClampToGround = value;
    },
  },

  /**
   * 获取一个对象，该对象将 CRS 的名称映射到一个回调函数，该函数接受 GeoJSON 坐标
   * 并将其转换为 WGS84 地球固定的笛卡尔坐标。支持 EPSG 类型的旧版本 GeoJSON
   * 也可以通过指定完整的 EPSG 名称（例如 'EPSG:4326'）添加到此列表中。
   * @memberof GeoJsonDataSource
   * @type {object}
   */
  crsNames: {
    get: function () {
      return crsNames;
    },
  },

  /**
   * 获取一个对象，该对象将 CRS 链接的 href 属性映射到一个回调函数，
   * 该函数接受 CRS 属性对象并返回一个 Promise，该 Promise 解析为一个
   * 可以接受 GeoJSON 坐标并将其转换为 WGS84 地球固定笛卡尔坐标的函数。
   * 此对象中的项目优先于 <code>crsLinkHrefs</code> 中定义的项目，前提是
   * 该链接指定了类型。
   * @memberof GeoJsonDataSource
   * @type {object}
   */
  crsLinkHrefs: {
    get: function () {
      return crsLinkHrefs;
    },
  },

  /**
   * 获取一个对象，该对象将 CRS 链接的类型属性映射到一个回调函数，
   * 该函数接受 CRS 属性对象并返回一个 Promise，该 Promise 解析为一个
   * 可以接受 GeoJSON 坐标并将其转换为 WGS84 地球固定笛卡尔坐标的函数。
   * <code>crsLinkHrefs</code> 中的项目优先于此对象中的项目。
   * @memberof GeoJsonDataSource
   * @type {object}
   */
  crsLinkTypes: {
    get: function () {
      return crsLinkTypes;
    },
  },
});


Object.defineProperties(GeoJsonDataSource.prototype, {
  /**
   * 获取或设置此实例的可读名称。
   * @memberof GeoJsonDataSource.prototype
   * @type {string}
   */
  name: {
    get: function () {
      return this._name;
    },
    set: function (value) {
      if (this._name !== value) {
        this._name = value;
        this._changed.raiseEvent(this);
      }
    },
  },
  /**
   * 此数据源仅定义静态数据，因此此属性始终为 undefined。
   * @memberof GeoJsonDataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    value: undefined,
    writable: false,
  },
  /**
   * 获取 {@link Entity} 实例的集合。
   * @memberof GeoJsonDataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: function () {
      return this._entityCollection;
    },
  },
  /**
   * 获取一个值，指示数据源当前是否正在加载数据。
   * @memberof GeoJsonDataSource.prototype
   * @type {boolean}
   */
  isLoading: {
    get: function () {
      return this._isLoading;
    },
  },
  /**
   * 获取当基础数据更改时将引发的事件。
   * @memberof GeoJsonDataSource.prototype
   * @type {Event}
   */
  changedEvent: {
    get: function () {
      return this._changed;
    },
  },
  /**
   * 获取在处理过程中遇到错误时将引发的事件。
   * @memberof GeoJsonDataSource.prototype
   * @type {Event}
   */
  errorEvent: {
    get: function () {
      return this._error;
    },
  },
  /**
   * 获取当数据源开始或停止加载时将引发的事件。
   * @memberof GeoJsonDataSource.prototype
   * @type {Event}
   */
  loadingEvent: {
    get: function () {
      return this._loading;
    },
  },
  /**
   * 获取该数据源是否应显示。
   * @memberof GeoJsonDataSource.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._entityCollection.show;
    },
    set: function (value) {
      this._entityCollection.show = value;
    },
  },

  /**
   * 获取或设置此数据源的聚类选项。此对象可以在多个数据源之间共享。
   *
   * @memberof GeoJsonDataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: function () {
      return this._entityCluster;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value must be defined.");
      }
      //>>includeEnd('debug');
      this._entityCluster = value;
    },
  },
  /**
   * 获取将为数据源显示的信用信息。
   * @memberof GeoJsonDataSource.prototype
   * @type {Credit}
   */
  credit: {
    get: function () {
      return this._credit;
    },
  },
});


/**
 * 异步加载提供的 GeoJSON 或 TopoJSON 数据，替换任何现有数据。
 *
 * @param {Resource|string|object} data 要加载的 URL、GeoJSON 对象或 TopoJSON 对象。
 * @param {GeoJsonDataSource.LoadOptions} [options] 一个对象，用于指定配置选项。
 *
 * @returns {Promise<GeoJsonDataSource>} 一个 Promise，当 GeoJSON 加载完成时将被解析。
 */

GeoJsonDataSource.prototype.load = function (data, options) {
  return preload(this, data, options, true);
};

/**
 * 异步加载提供的 GeoJSON 或 TopoJSON 数据，而不替换任何现有数据。
 *
 * @param {Resource|string|object} data 要加载的 URL、GeoJSON 对象或 TopoJSON 对象。
 * @param {GeoJsonDataSource.LoadOptions} [options] 一个对象，用于指定配置选项。
 *
 * @returns {Promise<GeoJsonDataSource>} 一个 Promise，当 GeoJSON 加载完成时将被解析。
 */

GeoJsonDataSource.prototype.process = function (data, options) {
  return preload(this, data, options, false);
};

function preload(that, data, options, clear) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(data)) {
    throw new DeveloperError("data is required.");
  }
  //>>includeEnd('debug');

  DataSource.setLoading(that, true);
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  // User specified credit
  let credit = options.credit;
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }
  that._credit = credit;

  let promise = data;
  let sourceUri = options.sourceUri;
  if (typeof data === "string" || data instanceof Resource) {
    data = Resource.createIfNeeded(data);
    promise = data.fetchJson();
    sourceUri = defaultValue(sourceUri, data.getUrlComponent());

    // Add resource credits to our list of credits to display
    const resourceCredits = that._resourceCredits;
    const credits = data.credits;
    if (defined(credits)) {
      const length = credits.length;
      for (let i = 0; i < length; i++) {
        resourceCredits.push(credits[i]);
      }
    }
  }

  options = {
    describe: defaultValue(options.describe, defaultDescribeProperty),
    markerSize: defaultValue(options.markerSize, defaultMarkerSize),
    markerSymbol: defaultValue(options.markerSymbol, defaultMarkerSymbol),
    markerColor: defaultValue(options.markerColor, defaultMarkerColor),
    strokeWidthProperty: new ConstantProperty(
      defaultValue(options.strokeWidth, defaultStrokeWidth),
    ),
    strokeMaterialProperty: new ColorMaterialProperty(
      defaultValue(options.stroke, defaultStroke),
    ),
    fillMaterialProperty: new ColorMaterialProperty(
      defaultValue(options.fill, defaultFill),
    ),
    clampToGround: defaultValue(options.clampToGround, defaultClampToGround),
  };

  return Promise.resolve(promise)
    .then(function (geoJson) {
      return load(that, geoJson, options, sourceUri, clear);
    })
    .catch(function (error) {
      DataSource.setLoading(that, false);
      that._error.raiseEvent(that, error);
      throw error;
    });
}

/**
 * 将数据源更新到提供的时间。此函数是可选的，
 * 不需要实现。它是为根据当前动画时间或场景状态检索数据的数据源提供的。
 * 如果实现，update 将由 {@link DataSourceDisplay} 每帧调用一次。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果此数据源准备好在提供的时间显示则为真，否则为假。
 */

GeoJsonDataSource.prototype.update = function (time) {
  return true;
};

function load(that, geoJson, options, sourceUri, clear) {
  let name;
  if (defined(sourceUri)) {
    name = getFilenameFromUri(sourceUri);
  }

  if (defined(name) && that._name !== name) {
    that._name = name;
    that._changed.raiseEvent(that);
  }

  const typeHandler = geoJsonObjectTypes[geoJson.type];
  if (!defined(typeHandler)) {
    throw new RuntimeError(`Unsupported GeoJSON object type: ${geoJson.type}`);
  }

  //Check for a Coordinate Reference System.
  const crs = geoJson.crs;
  let crsFunction = crs !== null ? defaultCrsFunction : null;

  if (defined(crs)) {
    if (!defined(crs.properties)) {
      throw new RuntimeError("crs.properties is undefined.");
    }

    const properties = crs.properties;
    if (crs.type === "name") {
      crsFunction = crsNames[properties.name];
      if (!defined(crsFunction)) {
        throw new RuntimeError(`Unknown crs name: ${properties.name}`);
      }
    } else if (crs.type === "link") {
      let handler = crsLinkHrefs[properties.href];
      if (!defined(handler)) {
        handler = crsLinkTypes[properties.type];
      }

      if (!defined(handler)) {
        throw new RuntimeError(
          `Unable to resolve crs link: ${JSON.stringify(properties)}`,
        );
      }

      crsFunction = handler(properties);
    } else if (crs.type === "EPSG") {
      crsFunction = crsNames[`EPSG:${properties.code}`];
      if (!defined(crsFunction)) {
        throw new RuntimeError(`Unknown crs EPSG code: ${properties.code}`);
      }
    } else {
      throw new RuntimeError(`Unknown crs type: ${crs.type}`);
    }
  }

  return Promise.resolve(crsFunction).then(function (crsFunction) {
    if (clear) {
      that._entityCollection.removeAll();
    }

    // null is a valid value for the crs, but means the entire load process becomes a no-op
    // because we can't assume anything about the coordinates.
    if (crsFunction !== null) {
      typeHandler(that, geoJson, geoJson, crsFunction, options);
    }

    return Promise.all(that._promises).then(function () {
      that._promises.length = 0;
      DataSource.setLoading(that, false);
      return that;
    });
  });
}

/**
 * 此回调作为 GeoJsonDataSource 类的一部分显示。
 * @callback GeoJsonDataSource.describe
 * @param {object} properties 特征的属性。
 * @param {string} nameProperty Cesium 估计为特征名称的属性键。
 */

export default GeoJsonDataSource;
