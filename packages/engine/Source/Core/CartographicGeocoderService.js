import Cartesian3 from "./Cartesian3.js";
import Check from "./Check.js";

/**
 * 对包含经度和纬度坐标及可选高度的查询进行地理编码。
 * 查询格式：`经度 纬度 (高度)`，经度/纬度以度为单位，高度以米为单位。
 *
 * @alias CartographicGeocoderService
 * @constructor
 */

function CartographicGeocoderService() {}

Object.defineProperties(CartographicGeocoderService.prototype, {
  /**
   * 获取在执行地理编码后显示的信用信息。通常用于信用
   * 地理编码服务。
   * @memberof CartographicGeocoderService.prototype
   * @type {Credit|undefined}
   * @readonly
   */

  credit: {
    get: function () {
      return undefined;
    },
  },
});

/**
 * @function
 *
 * @param {string} query 将发送到地理编码服务的查询
 * @returns {Promise<GeocoderService.Result[]>} 返回地理编码服务结果的 Promise 数组
 */

CartographicGeocoderService.prototype.geocode = function (query) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("query", query);
  //>>includeEnd('debug');

  const splitQuery = query.match(/[^\s,\n]+/g);
  if (splitQuery.length === 2 || splitQuery.length === 3) {
    let longitude = +splitQuery[0];
    let latitude = +splitQuery[1];
    const height = splitQuery.length === 3 ? +splitQuery[2] : 300.0;

    if (isNaN(longitude) && isNaN(latitude)) {
      const coordTest = /^(\d+.?\d*)([nsew])/i;
      for (let i = 0; i < splitQuery.length; ++i) {
        const splitCoord = splitQuery[i].match(coordTest);
        if (coordTest.test(splitQuery[i]) && splitCoord.length === 3) {
          if (/^[ns]/i.test(splitCoord[2])) {
            latitude = /^[n]/i.test(splitCoord[2])
              ? +splitCoord[1]
              : -splitCoord[1];
          } else if (/^[ew]/i.test(splitCoord[2])) {
            longitude = /^[e]/i.test(splitCoord[2])
              ? +splitCoord[1]
              : -splitCoord[1];
          }
        }
      }
    }

    if (!isNaN(longitude) && !isNaN(latitude) && !isNaN(height)) {
      const result = {
        displayName: query,
        destination: Cartesian3.fromDegrees(longitude, latitude, height),
      };
      return Promise.resolve([result]);
    }
  }
  return Promise.resolve([]);
};
export default CartographicGeocoderService;
