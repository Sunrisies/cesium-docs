import defined from "../Core/defined.js";

/**
 * 描述图像层中的光栅化特征，例如点、多边形、折线等。
 *
 * @alias ImageryLayerFeatureInfo
 * @constructor
 */
function ImageryLayerFeatureInfo() {
  /**
   * 获取或设置特征的名称。
   * @type {string|undefined}
   */
  this.name = undefined;

  /**
   * 获取或设置特征的 HTML 描述。该 HTML 不是受信任的，在显示给用户之前应进行消毒。
   * @type {string|undefined}
   */
  this.description = undefined;

  /**
   * 获取或设置特征的位置，如果位置未知则为 undefined。
   *
   * @type {Cartographic|undefined}
   */
  this.position = undefined;

  /**
   * 获取或设置描述特征的原始数据。原始数据可以采用任何
   * 多种格式，例如 GeoJSON、KML 等。
   * @type {object|undefined}
   */
  this.data = undefined;

  /**
   * 获取或设置特征的图像层。
   * @type {object|undefined}
   */
  this.imageryLayer = undefined;
}

/**
 * 通过选择适当的属性来配置此特征的名称。名称将按照以下顺序从
 * 以下来源之一获得：1）名称为 'name' 的属性，2）名称为 'title' 的属性，
 * 3）第一个包含 'name' 一词的属性，4）第一个包含 'title' 一词的属性。如果
 * 无法从这些来源中获取名称，则现有名称将保持不变。
 *
 * @param {object} properties 包含特征属性的对象字面量。
 */

ImageryLayerFeatureInfo.prototype.configureNameFromProperties = function (
  properties,
) {
  let namePropertyPrecedence = 10;
  let nameProperty;

  for (const key in properties) {
    if (properties.hasOwnProperty(key) && properties[key]) {
      const lowerKey = key.toLowerCase();

      if (namePropertyPrecedence > 1 && lowerKey === "name") {
        namePropertyPrecedence = 1;
        nameProperty = key;
      } else if (namePropertyPrecedence > 2 && lowerKey === "title") {
        namePropertyPrecedence = 2;
        nameProperty = key;
      } else if (namePropertyPrecedence > 3 && /name/i.test(key)) {
        namePropertyPrecedence = 3;
        nameProperty = key;
      } else if (namePropertyPrecedence > 4 && /title/i.test(key)) {
        namePropertyPrecedence = 4;
        nameProperty = key;
      }
    }
  }

  if (defined(nameProperty)) {
    this.name = properties[nameProperty];
  }
};

/**
 * 通过创建一个属性及其值的 HTML 表格配置此特征的描述。
 *
 * @param {object} properties 包含特征属性的对象字面量。
 */

ImageryLayerFeatureInfo.prototype.configureDescriptionFromProperties =
  function (properties) {
    function describe(properties) {
      let html = '<table class="cesium-infoBox-defaultTable">';
      for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
          const value = properties[key];
          if (defined(value)) {
            if (typeof value === "object") {
              html += `<tr><td>${key}</td><td>${describe(value)}</td></tr>`;
            } else {
              html += `<tr><td>${key}</td><td>${value}</td></tr>`;
            }
          }
        }
      }
      html += "</table>";

      return html;
    }

    this.description = describe(properties);
  };
export default ImageryLayerFeatureInfo;
