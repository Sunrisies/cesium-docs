import Cartesian2 from "./Cartesian2.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import Ellipsoid from "./Ellipsoid.js";
import GeographicProjection from "./GeographicProjection.js";
import CesiumMath from "./Math.js";
import Rectangle from "./Rectangle.js";

/**
 * 一种几何瓦片方案，参考简单 {@link GeographicProjection}，在该方案中
 * 经度和纬度直接映射到 X 和 Y。该投影通常被称为地理投影、等矩形投影、等距圆柱投影或平面投影。
 *
 * @alias GeographicTilingScheme
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.default] 正在瓦片处理的椭球体。默认为
 * 默认椭球体。
 * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] 瓷砖方案覆盖的矩形（以弧度为单位）。
 * @param {number} [options.numberOfLevelZeroTilesX=2] 瓦片树零级中的 X 方向瓦片数量。
 * @param {number} [options.numberOfLevelZeroTilesY=1] 瓦片树零级中的 Y 方向瓦片数量。
 */

function GeographicTilingScheme(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.default);
  this._rectangle = defaultValue(options.rectangle, Rectangle.MAX_VALUE);
  this._projection = new GeographicProjection(this._ellipsoid);
  this._numberOfLevelZeroTilesX = defaultValue(
    options.numberOfLevelZeroTilesX,
    2,
  );
  this._numberOfLevelZeroTilesY = defaultValue(
    options.numberOfLevelZeroTilesY,
    1,
  );
}

Object.defineProperties(GeographicTilingScheme.prototype, {
  /**
   * 获取被该瓦片方案瓦片处理的椭球体。
   * @memberof GeographicTilingScheme.prototype
   * @type {Ellipsoid}
   */

  ellipsoid: {
    get: function() {
      return this._ellipsoid;
    },
  },

  /**
   * 获取该瓦片方案覆盖的矩形（以弧度为单位）。
   * @memberof GeographicTilingScheme.prototype
   * @type {Rectangle}
   */

  rectangle: {
    get: function() {
      return this._rectangle;
    },
  },

  /**
   * 获取该瓦片方案使用的地图投影。
   * @memberof GeographicTilingScheme.prototype
   * @type {MapProjection}
   */

  projection: {
    get: function() {
      return this._projection;
    },
  },
});

/**
 * 获取指定细节层级下 X 方向的总瓦片数。
 *
 * @param {number} level 细节层级。
 * @returns {number} 给定层级下 X 方向的瓦片数量。
 */

GeographicTilingScheme.prototype.getNumberOfXTilesAtLevel = function(level) {
  return this._numberOfLevelZeroTilesX << level;
};

/**
 * 获取指定细节层级下 Y 方向的总瓦片数。
 *
 * @param {number} level 细节层级。
 * @returns {number} 给定层级下 Y 方向的瓦片数量。
 */

GeographicTilingScheme.prototype.getNumberOfYTilesAtLevel = function(level) {
  return this._numberOfLevelZeroTilesY << level;
};

/**
 * 将指定为大地弧度的矩形转换为该瓦片方案的本地坐标系统。
 *
 * @param {Rectangle} rectangle 要转换的矩形。
 * @param {Rectangle} [result] 要复制结果的实例，如果应创建新实例，则为 undefined。
 * @returns {Rectangle} 指定的 'result'，或者如果 'result' 为 undefined，则包含本地矩形的新对象。
 */

GeographicTilingScheme.prototype.rectangleToNativeRectangle = function(
  rectangle,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("rectangle", rectangle);
  //>>includeEnd('debug');

  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(rectangle.east);
  const north = CesiumMath.toDegrees(rectangle.north);

  if (!defined(result)) {
    return new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * 将瓦片的 x、y 坐标和层级转换为以该瓦片方案的本地坐标表示的矩形。
 *
 * @param {number} x 瓷砖的整数 x 坐标。
 * @param {number} y 瓷砖的整数 y 坐标。
 * @param {number} level 瓦片的细节层级。0 是最不详细的层级。
 * @param {object} [result] 要复制结果的实例，如果应创建新实例，则为 undefined。
 * @returns {Rectangle} 指定的 'result'，或者如果 'result' 为 undefined，则包含矩形的新对象。
 */

GeographicTilingScheme.prototype.tileXYToNativeRectangle = function(
  x,
  y,
  level,
  result,
) {
  const rectangleRadians = this.tileXYToRectangle(x, y, level, result);
  rectangleRadians.west = CesiumMath.toDegrees(rectangleRadians.west);
  rectangleRadians.south = CesiumMath.toDegrees(rectangleRadians.south);
  rectangleRadians.east = CesiumMath.toDegrees(rectangleRadians.east);
  rectangleRadians.north = CesiumMath.toDegrees(rectangleRadians.north);
  return rectangleRadians;
};

/**
 * 将瓦片的 x、y 坐标和层级转换为以弧度表示的地理矩形。
 *
 * @param {number} x 瓷砖的整数 x 坐标。
 * @param {number} y 瓷砖的整数 y 坐标。
 * @param {number} level 瓦片的细节层级。0 是最不详细的层级。
 * @param {object} [result] 要复制结果的实例，如果应创建新实例，则为 undefined。
 * @returns {Rectangle} 指定的 'result'，或者如果 'result' 为 undefined，则包含矩形的新对象。
 */

GeographicTilingScheme.prototype.tileXYToRectangle = function(
  x,
  y,
  level,
  result,
) {
  const rectangle = this._rectangle;

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth = rectangle.width / xTiles;
  const west = x * xTileWidth + rectangle.west;
  const east = (x + 1) * xTileWidth + rectangle.west;

  const yTileHeight = rectangle.height / yTiles;
  const north = rectangle.north - y * yTileHeight;
  const south = rectangle.north - (y + 1) * yTileHeight;

  if (!defined(result)) {
    result = new Rectangle(west, south, east, north);
  }

  result.west = west;
  result.south = south;
  result.east = east;
  result.north = north;
  return result;
};

/**
 * 计算包含给定地理位置的瓦片的 x、y 坐标。
 *
 * @param {Cartographic} position 位置。
 * @param {number} level 瓦片的细节层级。0 是最不详细的层级。
 * @param {Cartesian2} [result] 要复制结果的实例，如果应创建新实例，则为 undefined。
 * @returns {Cartesian2} 指定的 'result'，或者如果 'result' 为 undefined，则包含瓦片 x、y 坐标的新对象。
 */

GeographicTilingScheme.prototype.positionToTileXY = function(
  position,
  level,
  result,
) {
  const rectangle = this._rectangle;
  if (!Rectangle.contains(rectangle, position)) {
    // outside the bounds of the tiling scheme
    return undefined;
  }

  const xTiles = this.getNumberOfXTilesAtLevel(level);
  const yTiles = this.getNumberOfYTilesAtLevel(level);

  const xTileWidth = rectangle.width / xTiles;
  const yTileHeight = rectangle.height / yTiles;

  let longitude = position.longitude;
  if (rectangle.east < rectangle.west) {
    longitude += CesiumMath.TWO_PI;
  }

  let xTileCoordinate = ((longitude - rectangle.west) / xTileWidth) | 0;
  if (xTileCoordinate >= xTiles) {
    xTileCoordinate = xTiles - 1;
  }

  let yTileCoordinate =
    ((rectangle.north - position.latitude) / yTileHeight) | 0;
  if (yTileCoordinate >= yTiles) {
    yTileCoordinate = yTiles - 1;
  }

  if (!defined(result)) {
    return new Cartesian2(xTileCoordinate, yTileCoordinate);
  }

  result.x = xTileCoordinate;
  result.y = yTileCoordinate;
  return result;
};
export default GeographicTilingScheme;
