import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import WebMercatorTilingScheme from "../Core/WebMercatorTilingScheme.js";
import UrlTemplateImageryProvider from "./UrlTemplateImageryProvider.js";

const defaultCredit = new Credit(
  "MapQuest, Open Street Map and contributors, CC-BY-SA",
);

/**
 * @typedef {object} OpenStreetMapImageryProvider.ConstructorOptions
 *
 * OpenStreetMapImageryProvider 构造函数的初始化选项
 *
 * @property {string} [url='https://tile.openstreetmap.org'] OpenStreetMap 服务器的 URL。
 * @property {string} [fileExtension='png'] 服务器上图像的文件扩展名。
 * @property {boolean} [retinaTiles=false] 当为 true 时，请求 2x 分辨率的图块以适应视网膜显示。
 * @property {Rectangle} [rectangle=Rectangle.MAX_VALUE] 图层的矩形区域。
 * @property {number} [minimumLevel=0] 此影像提供程序支持的最小细节级别。
 * @property {number} [maximumLevel] 此影像提供程序支持的最大细节级别，如果没有限制则为未定义。
 * @property {Ellipsoid} [ellipsoid] 椭球体。如果未指定，则使用 WGS84 椭球体。
 * @property {Credit|string} [credit='MapQuest, Open Street Map and contributors, CC-BY-SA'] 数据源的信用信息，将显示在画布上。
 */

/**
 * 提供由 OpenStreetMap 或其他 Slippy 瓦片提供者托管的分块影像的影像提供者。
 * 默认 URL 连接到 OpenStreetMap 的志愿者运行服务器，因此您必须遵循他们的
 * {@link http://wiki.openstreetmap.org/wiki/Tile_usage_policy|瓦片使用政策}。
 *
 * @alias OpenStreetMapImageryProvider
 * @constructor
 * @extends UrlTemplateImageryProvider
 *
 * @param {OpenStreetMapImageryProvider.ConstructorOptions} options 描述初始化选项的对象
 * @exception {DeveloperError} 矩形和最小级别指示在最小级别处有超过四个瓦片。 不支持在最小级别上有超过四个瓦片的影像提供者。
 *
 * @see ArcGisMapServerImageryProvider
 * @see BingMapsImageryProvider
 * @see GoogleEarthEnterpriseMapsProvider
 * @see SingleTileImageryProvider
 * @see TileMapServiceImageryProvider
 * @see WebMapServiceImageryProvider
 * @see WebMapTileServiceImageryProvider
 * @see UrlTemplateImageryProvider
 *
 * @example
 * const osm = new Cesium.OpenStreetMapImageryProvider({
 *     url : 'https://tile.openstreetmap.org/'
 * });
 *
 * @see {@link http://wiki.openstreetmap.org/wiki/Main_Page|OpenStreetMap Wiki}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
function OpenStreetMapImageryProvider(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const resource = Resource.createIfNeeded(
    defaultValue(options.url, "https://tile.openstreetmap.org/"),
  );
  resource.appendForwardSlash();
  resource.url += `{z}/{x}/{y}${
    options.retinaTiles ? "@2x" : ""
  }.${defaultValue(options.fileExtension, "png")}`;

  const tilingScheme = new WebMercatorTilingScheme({
    ellipsoid: options.ellipsoid,
  });

  const tileWidth = 256;
  const tileHeight = 256;

  const minimumLevel = defaultValue(options.minimumLevel, 0);
  const maximumLevel = options.maximumLevel;

  const rectangle = defaultValue(options.rectangle, tilingScheme.rectangle);

  // Check the number of tiles at the minimum level.  If it's more than four,
  // throw an exception, because starting at the higher minimum
  // level will cause too many tiles to be downloaded and rendered.
  const swTile = tilingScheme.positionToTileXY(
    Rectangle.southwest(rectangle),
    minimumLevel,
  );
  const neTile = tilingScheme.positionToTileXY(
    Rectangle.northeast(rectangle),
    minimumLevel,
  );
  const tileCount =
    (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
  //>>includeStart('debug', pragmas.debug);
  if (tileCount > 4) {
    throw new DeveloperError(
      `The rectangle and minimumLevel indicate that there are ${tileCount} tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.`,
    );
  }
  //>>includeEnd('debug');

  let credit = defaultValue(options.credit, defaultCredit);
  if (typeof credit === "string") {
    credit = new Credit(credit);
  }

  UrlTemplateImageryProvider.call(this, {
    url: resource,
    credit: credit,
    tilingScheme: tilingScheme,
    tileWidth: tileWidth,
    tileHeight: tileHeight,
    minimumLevel: minimumLevel,
    maximumLevel: maximumLevel,
    rectangle: rectangle,
  });
}

if (defined(Object.create)) {
  OpenStreetMapImageryProvider.prototype = Object.create(
    UrlTemplateImageryProvider.prototype,
  );
  OpenStreetMapImageryProvider.prototype.constructor =
    OpenStreetMapImageryProvider;
}

export default OpenStreetMapImageryProvider;
