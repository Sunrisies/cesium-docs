import DeveloperError from "./DeveloperError.js";

/**
 * 用于椭球体表面几何形状或影像的瓦片方案。在细节级别零时，
 * 最粗糙、最低细节的级别，瓦片的数量是可配置的。
 * 在细节级别一时，每个零级瓦片有四个子瓦片，两个方向各有两个。
 * 在细节级别二时，每个一级瓦片也有四个子瓦片，两个方向各有两个。
 * 这种情况会持续到几何形状或影像源中所包含的所有级别。
 *
 * @alias TilingScheme
 * @constructor
 *
 * @see WebMercatorTilingScheme
 * @see GeographicTilingScheme
 */

function TilingScheme(options) {
  //>>includeStart('debug', pragmas.debug);
  throw new DeveloperError(
    "This type should not be instantiated directly.  Instead, use WebMercatorTilingScheme or GeographicTilingScheme.",
  );
  //>>includeEnd('debug');
}

Object.defineProperties(TilingScheme.prototype, {
  /**
   * 获取由瓦片方案覆盖的椭球体。
   * @memberof TilingScheme.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取此瓦片方案覆盖的矩形（单位为弧度）。
   * @memberof TilingScheme.prototype
   * @type {Rectangle}
   */
  rectangle: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取瓦片方案使用的地图投影。
   * @memberof TilingScheme.prototype
   * @type {MapProjection}
   */
  projection: {
    get: DeveloperError.throwInstantiationError,
  },
});


/**
 * 获取指定细节级别下X方向瓦片的总数。
 * @function
 *
 * @param {number} level 细节级别。
 * @returns {number} 给定级别下X方向的瓦片数量。
 */
TilingScheme.prototype.getNumberOfXTilesAtLevel =
  DeveloperError.throwInstantiationError;

/**
 * 获取指定细节级别下Y方向瓦片的总数。
 * @function
 *
 * @param {number} level 细节级别。
 * @returns {number} 给定级别下Y方向的瓦片数量。
 */
TilingScheme.prototype.getNumberOfYTilesAtLevel =
  DeveloperError.throwInstantiationError;

/**
 * 将以大地坐标弧度指定的矩形转换为此瓦片方案的本地坐标系统。
 * @function
 *
 * @param {Rectangle} rectangle 要转换的矩形。
 * @param {Rectangle} [result] 用于复制结果的实例，如果需要创建一个新实例，则为undefined。
 * @returns {Rectangle} 指定的'result'，或者如果'result'
 *          为undefined，则返回一个包含本地矩形的新对象。
 */

TilingScheme.prototype.rectangleToNativeRectangle =
  DeveloperError.throwInstantiationError;

/**
 * 将瓦片x，y坐标和级别转换为以瓦片方案的本地坐标表示的矩形。
 * @function
 *
 * @param {number} x 瓦片的整数x坐标。
 * @param {number} y 瓦片的整数y坐标。
 * @param {number} level 瓦片的细节级别。零是最低细节。
 * @param {object} [result] 用于复制结果的实例，如果需要创建一个新实例，则为undefined。
 * @returns {Rectangle} 指定的'result'，或者如果'result'为undefined，则返回一个包含矩形的新对象。
 */
TilingScheme.prototype.tileXYToNativeRectangle =
  DeveloperError.throwInstantiationError;

/**
 * 将瓦片x，y坐标和级别转换为以弧度表示的地理矩形。
 * @function
 *
 * @param {number} x 瓦片的整数x坐标。
 * @param {number} y 瓦片的整数y坐标。
 * @param {number} level 瓦片的细节级别。零是最低细节。
 * @param {object} [result] 用于复制结果的实例，如果需要创建一个新实例，则为undefined。
 * @returns {Rectangle} 指定的'result'，或者如果'result'为undefined，则返回一个包含矩形的新对象。
 */

TilingScheme.prototype.tileXYToRectangle =
  DeveloperError.throwInstantiationError;

/**
 * 计算包含给定地理位置的瓦片的x，y坐标。
 * @function
 *
 * @param {Cartographic} position 位置。
 * @param {number} level 瓦片的细节级别。零是最低细节。
 * @param {Cartesian2} [result] 用于复制结果的实例，如果需要创建一个新实例，则为undefined。
 * @returns {Cartesian2} 指定的'result'，或者如果'result'为undefined，则返回一个包含瓦片x，y坐标的新对象。
 */

TilingScheme.prototype.positionToTileXY =
  DeveloperError.throwInstantiationError;
export default TilingScheme;
