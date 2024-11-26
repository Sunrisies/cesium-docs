/**
 * 由 {@link GeocoderService} 执行的地理编码类型。
 * @enum {number}
 * @see Geocoder
 */
const GeocodeType = {
  /**
   * 执行一个搜索，输入被视为完整的。
   *
   * @type {number}
   * @constant
   */
  SEARCH: 0,

  /**
   * 使用部分输入执行自动补全，通常
   * 保留用于提供用户输入时的可能结果。
   *
   * @type {number}
   * @constant
   */
  AUTOCOMPLETE: 1,
};
export default Object.freeze(GeocodeType);
