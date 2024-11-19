import clone from "../Core/clone.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Resource from "../Core/Resource.js";
import ConditionsExpression from "./ConditionsExpression.js";
import Expression from "./Expression.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式。
 * <p>
 * 评估使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 定义的表达式。
 * </p>
 *
 * @alias Cesium3DTileStyle
 * @constructor
 *
 * @param {object} [style] 定义样式的对象。
 *
 * @example
 * tileset.style = new Cesium.Cesium3DTileStyle({
 *     color : {
 *         conditions : [
 *             ['${Height} >= 100', 'color("purple", 0.5)'],
 *             ['${Height} >= 50', 'color("red")'],
 *             ['true', 'color("blue")']
 *         ]
 *     },
 *     show : '${Height} > 0',
 *     meta : {
 *         description : '"Building id ${id} has height ${Height}."'
 *     }
 * });
 *
 * @example
 * tileset.style = new Cesium.Cesium3DTileStyle({
 *     color : 'vec4(${Temperature})',
 *     pointSize : '${Temperature} * 2.0'
 * });
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
 */
function Cesium3DTileStyle(style) {
  this._style = {};
  this._ready = false;

  this._show = undefined;
  this._color = undefined;
  this._pointSize = undefined;
  this._pointOutlineColor = undefined;
  this._pointOutlineWidth = undefined;
  this._labelColor = undefined;
  this._labelOutlineColor = undefined;
  this._labelOutlineWidth = undefined;
  this._font = undefined;
  this._labelStyle = undefined;
  this._labelText = undefined;
  this._backgroundColor = undefined;
  this._backgroundPadding = undefined;
  this._backgroundEnabled = undefined;
  this._scaleByDistance = undefined;
  this._translucencyByDistance = undefined;
  this._distanceDisplayCondition = undefined;
  this._heightOffset = undefined;
  this._anchorLineEnabled = undefined;
  this._anchorLineColor = undefined;
  this._image = undefined;
  this._disableDepthTestDistance = undefined;
  this._horizontalOrigin = undefined;
  this._verticalOrigin = undefined;
  this._labelHorizontalOrigin = undefined;
  this._labelVerticalOrigin = undefined;
  this._meta = undefined;

  this._colorShaderFunction = undefined;
  this._showShaderFunction = undefined;
  this._pointSizeShaderFunction = undefined;
  this._colorShaderFunctionReady = false;
  this._showShaderFunctionReady = false;
  this._pointSizeShaderFunctionReady = false;

  this._colorShaderTranslucent = false;

  setup(this, style);
}

function setup(that, styleJson) {
  styleJson = defaultValue(clone(styleJson, true), that._style);
  that._style = styleJson;

  that.show = styleJson.show;
  that.color = styleJson.color;
  that.pointSize = styleJson.pointSize;
  that.pointOutlineColor = styleJson.pointOutlineColor;
  that.pointOutlineWidth = styleJson.pointOutlineWidth;
  that.labelColor = styleJson.labelColor;
  that.labelOutlineColor = styleJson.labelOutlineColor;
  that.labelOutlineWidth = styleJson.labelOutlineWidth;
  that.labelStyle = styleJson.labelStyle;
  that.font = styleJson.font;
  that.labelText = styleJson.labelText;
  that.backgroundColor = styleJson.backgroundColor;
  that.backgroundPadding = styleJson.backgroundPadding;
  that.backgroundEnabled = styleJson.backgroundEnabled;
  that.scaleByDistance = styleJson.scaleByDistance;
  that.translucencyByDistance = styleJson.translucencyByDistance;
  that.distanceDisplayCondition = styleJson.distanceDisplayCondition;
  that.heightOffset = styleJson.heightOffset;
  that.anchorLineEnabled = styleJson.anchorLineEnabled;
  that.anchorLineColor = styleJson.anchorLineColor;
  that.image = styleJson.image;
  that.disableDepthTestDistance = styleJson.disableDepthTestDistance;
  that.horizontalOrigin = styleJson.horizontalOrigin;
  that.verticalOrigin = styleJson.verticalOrigin;
  that.labelHorizontalOrigin = styleJson.labelHorizontalOrigin;
  that.labelVerticalOrigin = styleJson.labelVerticalOrigin;

  const meta = {};
  if (defined(styleJson.meta)) {
    const defines = styleJson.defines;
    const metaJson = defaultValue(styleJson.meta, defaultValue.EMPTY_OBJECT);
    for (const property in metaJson) {
      if (metaJson.hasOwnProperty(property)) {
        meta[property] = new Expression(metaJson[property], defines);
      }
    }
  }

  that._meta = meta;

  that._ready = true;
}

function getExpression(tileStyle, value) {
  const defines = defaultValue(
    tileStyle._style,
    defaultValue.EMPTY_OBJECT,
  ).defines;

  if (!defined(value)) {
    return undefined;
  } else if (typeof value === "boolean" || typeof value === "number") {
    return new Expression(String(value));
  } else if (typeof value === "string") {
    return new Expression(value, defines);
  } else if (defined(value.conditions)) {
    return new ConditionsExpression(value, defines);
  }
  return value;
}

function getJsonFromExpression(expression) {
  if (!defined(expression)) {
    return undefined;
  } else if (defined(expression.expression)) {
    return expression.expression;
  } else if (defined(expression.conditionsExpression)) {
    return clone(expression.conditionsExpression, true);
  }
  return expression;
}

Object.defineProperties(Cesium3DTileStyle.prototype, {
  /**
   * 获取使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 定义的样式对象。
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {object}
   * @readonly
   *
   * @default {}
   */

  style: {
    get: function () {
      return this._style;
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>show</code> 属性的 {@link StyleExpression} 对象。 
   * 另外，可以使用布尔值、字符串或定义显示样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回或转换为 <code>Boolean</code>。
   * </p>
   * <p>
   * 此表达式适用于所有瓦片格式。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     show : '(regExp("^Chest").test(${County})) && (${YearBuilt} >= 1970)'
   * });
   * style.show.evaluate(feature); // returns true or false depending on the feature's properties
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override show expression with a custom function
   * style.show = {
   *     evaluate : function(feature) {
   *         return true;
   *     }
   * };
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override show expression with a boolean
   * style.show = true;
   * };
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override show expression with a string
   * style.show = '${Height} > 0';
   * };
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override show expression with a condition
   * style.show = {
   *     conditions: [
   *         ['${height} > 2', 'false'],
   *         ['true', 'true']
   *     ];
   * };
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      this._show = getExpression(this, value);
      this._style.show = getJsonFromExpression(this._show);
      this._showShaderFunctionReady = false;
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>color</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义颜色样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式适用于所有瓦片格式。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     color : '(${Temperature} > 90) ? color("red") : color("white")'
   * });
   * style.color.evaluateColor(feature, result); // returns a Cesium.Color object
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override color expression with a custom function
   * style.color = {
   *     evaluateColor : function(feature, result) {
   *         return Cesium.Color.clone(Cesium.Color.WHITE, result);
   *     }
   * };
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override color expression with a string
   * style.color = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override color expression with a condition
   * style.color = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      this._color = getExpression(this, value);
      this._style.color = getJsonFromExpression(this._color);
      this._colorShaderFunctionReady = false;
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>pointSize</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义点大小样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Number</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片或点云瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     pointSize : '(${Temperature} > 90) ? 2.0 : 1.0'
   * });
   * style.pointSize.evaluate(feature); // returns a Number
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointSize expression with a custom function
   * style.pointSize = {
   *     evaluate : function(feature) {
   *         return 1.0;
   *     }
   * };
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointSize expression with a number
   * style.pointSize = 1.0;
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointSize expression with a string
   * style.pointSize = '${height} / 10';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointSize expression with a condition
   * style.pointSize =  {
   *     conditions : [
   *         ['${height} > 2', '1.0'],
   *         ['true', '2.0']
   *     ]
   * };
   */
  pointSize: {
    get: function () {
      return this._pointSize;
    },
    set: function (value) {
      this._pointSize = getExpression(this, value);
      this._style.pointSize = getJsonFromExpression(this._pointSize);
      this._pointSizeShaderFunctionReady = false;
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>pointOutlineColor</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义颜色样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointOutlineColor expression with a string
   * style.pointOutlineColor = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointOutlineColor expression with a condition
   * style.pointOutlineColor = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  pointOutlineColor: {
    get: function () {
      return this._pointOutlineColor;
    },
    set: function (value) {
      this._pointOutlineColor = getExpression(this, value);
      this._style.pointOutlineColor = getJsonFromExpression(
        this._pointOutlineColor,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>pointOutlineWidth</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义数字样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Number</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointOutlineWidth expression with a string
   * style.pointOutlineWidth = '5';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override pointOutlineWidth expression with a condition
   * style.pointOutlineWidth = {
   *     conditions : [
   *         ['${height} > 2', '5'],
   *         ['true', '0']
   *     ]
   * };
   */
  pointOutlineWidth: {
    get: function () {
      return this._pointOutlineWidth;
    },
    set: function (value) {
      this._pointOutlineWidth = getExpression(this, value);
      this._style.pointOutlineWidth = getJsonFromExpression(
        this._pointOutlineWidth,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>labelColor</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义颜色样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelColor expression with a string
   * style.labelColor = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelColor expression with a condition
   * style.labelColor = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  labelColor: {
    get: function () {
      return this._labelColor;
    },
    set: function (value) {
      this._labelColor = getExpression(this, value);
      this._style.labelColor = getJsonFromExpression(this._labelColor);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>labelOutlineColor</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义颜色样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelOutlineColor expression with a string
   * style.labelOutlineColor = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelOutlineColor expression with a condition
   * style.labelOutlineColor = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  labelOutlineColor: {
    get: function () {
      return this._labelOutlineColor;
    },
    set: function (value) {
      this._labelOutlineColor = getExpression(this, value);
      this._style.labelOutlineColor = getJsonFromExpression(
        this._labelOutlineColor,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>labelOutlineWidth</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义数字样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Number</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelOutlineWidth expression with a string
   * style.labelOutlineWidth = '5';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelOutlineWidth expression with a condition
   * style.labelOutlineWidth = {
   *     conditions : [
   *         ['${height} > 2', '5'],
   *         ['true', '0']
   *     ]
   * };
   */
  labelOutlineWidth: {
    get: function () {
      return this._labelOutlineWidth;
    },
    set: function (value) {
      this._labelOutlineWidth = getExpression(this, value);
      this._style.labelOutlineWidth = getJsonFromExpression(
        this._labelOutlineWidth,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>font</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义字符串样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>String</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     font : '(${Temperature} > 90) ? "30px Helvetica" : "24px Helvetica"'
   * });
   * style.font.evaluate(feature); // returns a String
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override font expression with a custom function
   * style.font = {
   *     evaluate : function(feature) {
   *         return '24px Helvetica';
   *     }
   * };
   */
  font: {
    get: function () {
      return this._font;
    },
    set: function (value) {
      this._font = getExpression(this, value);
      this._style.font = getJsonFromExpression(this._font);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>label style</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义数字样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>LabelStyle</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     labelStyle : `(\${Temperature} > 90) ? ${LabelStyle.FILL_AND_OUTLINE} : ${LabelStyle.FILL}`
   * });
   * style.labelStyle.evaluate(feature); // returns a LabelStyle
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelStyle expression with a custom function
   * style.labelStyle = {
   *     evaluate : function(feature) {
   *         return LabelStyle.FILL;
   *     }
   * };
   */
  labelStyle: {
    get: function () {
      return this._labelStyle;
    },
    set: function (value) {
      this._labelStyle = getExpression(this, value);
      this._style.labelStyle = getJsonFromExpression(this._labelStyle);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>labelText</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义字符串样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>String</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     labelText : '(${Temperature} > 90) ? ">90" : "<=90"'
   * });
   * style.labelText.evaluate(feature); // returns a String
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelText expression with a custom function
   * style.labelText = {
   *     evaluate : function(feature) {
   *         return 'Example label text';
   *     }
   * };
   */
  labelText: {
    get: function () {
      return this._labelText;
    },
    set: function (value) {
      this._labelText = getExpression(this, value);
      this._style.labelText = getJsonFromExpression(this._labelText);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>backgroundColor</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义颜色样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override backgroundColor expression with a string
   * style.backgroundColor = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override backgroundColor expression with a condition
   * style.backgroundColor = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  backgroundColor: {
    get: function () {
      return this._backgroundColor;
    },
    set: function (value) {
      this._backgroundColor = getExpression(this, value);
      this._style.backgroundColor = getJsonFromExpression(
        this._backgroundColor,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>backgroundPadding</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义 vec2 样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Cartesian2</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override backgroundPadding expression with a string
   * style.backgroundPadding = 'vec2(5.0, 7.0)';
   * style.backgroundPadding.evaluate(feature); // returns a Cartesian2
   */
  backgroundPadding: {
    get: function () {
      return this._backgroundPadding;
    },
    set: function (value) {
      this._backgroundPadding = getExpression(this, value);
      this._style.backgroundPadding = getJsonFromExpression(
        this._backgroundPadding,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>backgroundEnabled</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义布尔样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Boolean</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override backgroundEnabled expression with a string
   * style.backgroundEnabled = 'true';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override backgroundEnabled expression with a condition
   * style.backgroundEnabled = {
   *     conditions : [
   *         ['${height} > 2', 'true'],
   *         ['true', 'false']
   *     ]
   * };
   */
  backgroundEnabled: {
    get: function () {
      return this._backgroundEnabled;
    },
    set: function (value) {
      this._backgroundEnabled = getExpression(this, value);
      this._style.backgroundEnabled = getJsonFromExpression(
        this._backgroundEnabled,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>scaleByDistance</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义 vec4 样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Cartesian4</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override scaleByDistance expression with a string
   * style.scaleByDistance = 'vec4(1.5e2, 2.0, 1.5e7, 0.5)';
   * style.scaleByDistance.evaluate(feature); // returns a Cartesian4
   */
  scaleByDistance: {
    get: function () {
      return this._scaleByDistance;
    },
    set: function (value) {
      this._scaleByDistance = getExpression(this, value);
      this._style.scaleByDistance = getJsonFromExpression(
        this._scaleByDistance,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>translucencyByDistance</code> 属性的 {@link StyleExpression} 对象。
   * 另外，可以使用字符串或定义 vec4 样式的对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回 <code>Cartesian4</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是不成熟的 3D Tiles 规范的一部分，可能会在没有遵循 Cesium 的标准弃用政策的情况下发生更改。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override translucencyByDistance expression with a string
   * style.translucencyByDistance = 'vec4(1.5e2, 1.0, 1.5e7, 0.2)';
   * style.translucencyByDistance.evaluate(feature); // returns a Cartesian4
   */
  translucencyByDistance: {
    get: function () {
      return this._translucencyByDistance;
    },
    set: function (value) {
      this._translucencyByDistance = getExpression(this, value);
      this._style.translucencyByDistance = getJsonFromExpression(
        this._translucencyByDistance,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>distanceDisplayCondition</code> 属性的 {@link StyleExpression} 对象。也可以使用定义 vec2 样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，这可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>Cartesian2</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override distanceDisplayCondition expression with a string
   * style.distanceDisplayCondition = 'vec2(0.0, 5.5e6)';
   * style.distanceDisplayCondition.evaluate(feature); // returns a Cartesian2
   */
  distanceDisplayCondition: {
    get: function () {
      return this._distanceDisplayCondition;
    },
    set: function (value) {
      this._distanceDisplayCondition = getExpression(this, value);
      this._style.distanceDisplayCondition = getJsonFromExpression(
        this._distanceDisplayCondition,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>heightOffset</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>Number</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override heightOffset expression with a string
   * style.heightOffset = '2.0';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override heightOffset expression with a condition
   * style.heightOffset = {
   *     conditions : [
   *         ['${height} > 2', '4.0'],
   *         ['true', '2.0']
   *     ]
   * };
   */
  heightOffset: {
    get: function () {
      return this._heightOffset;
    },
    set: function (value) {
      this._heightOffset = getExpression(this, value);
      this._style.heightOffset = getJsonFromExpression(this._heightOffset);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>anchorLineEnabled</code> 属性的 {@link StyleExpression} 对象。也可以使用定义布尔样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>Boolean</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override anchorLineEnabled expression with a string
   * style.anchorLineEnabled = 'true';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override anchorLineEnabled expression with a condition
   * style.anchorLineEnabled = {
   *     conditions : [
   *         ['${height} > 2', 'true'],
   *         ['true', 'false']
   *     ]
   * };
   */
  anchorLineEnabled: {
    get: function () {
      return this._anchorLineEnabled;
    },
    set: function (value) {
      this._anchorLineEnabled = getExpression(this, value);
      this._style.anchorLineEnabled = getJsonFromExpression(
        this._anchorLineEnabled,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>anchorLineColor</code> 属性的 {@link StyleExpression} 对象。也可以使用定义颜色样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>Color</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override anchorLineColor expression with a string
   * style.anchorLineColor = 'color("blue")';
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override anchorLineColor expression with a condition
   * style.anchorLineColor = {
   *     conditions : [
   *         ['${height} > 2', 'color("cyan")'],
   *         ['true', 'color("blue")']
   *     ]
   * };
   */
  anchorLineColor: {
    get: function () {
      return this._anchorLineColor;
    },
    set: function (value) {
      this._anchorLineColor = getExpression(this, value);
      this._style.anchorLineColor = getJsonFromExpression(
        this._anchorLineColor,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>image</code> 属性的 {@link StyleExpression} 对象。也可以使用定义字符串样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>String</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     image : '(${Temperature} > 90) ? "/url/to/image1" : "/url/to/image2"'
   * });
   * style.image.evaluate(feature); // returns a String
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override image expression with a custom function
   * style.image = {
   *     evaluate : function(feature) {
   *         return '/url/to/image';
   *     }
   * };
   */
  image: {
    get: function () {
      return this._image;
    },
    set: function (value) {
      this._image = getExpression(this, value);
      this._style.image = getJsonFromExpression(this._image);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>disableDepthTestDistance</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>Number</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override disableDepthTestDistance expression with a string
   * style.disableDepthTestDistance = '1000.0';
   * style.disableDepthTestDistance.evaluate(feature); // returns a Number
   */
  disableDepthTestDistance: {
    get: function () {
      return this._disableDepthTestDistance;
    },
    set: function (value) {
      this._disableDepthTestDistance = getExpression(this, value);
      this._style.disableDepthTestDistance = getJsonFromExpression(
        this._disableDepthTestDistance,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>horizontalOrigin</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>HorizontalOrigin</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     horizontalOrigin : HorizontalOrigin.LEFT
   * });
   * style.horizontalOrigin.evaluate(feature); // returns a HorizontalOrigin
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override horizontalOrigin expression with a custom function
   * style.horizontalOrigin = {
   *     evaluate : function(feature) {
   *         return HorizontalOrigin.CENTER;
   *     }
   * };
   */
  horizontalOrigin: {
    get: function () {
      return this._horizontalOrigin;
    },
    set: function (value) {
      this._horizontalOrigin = getExpression(this, value);
      this._style.horizontalOrigin = getJsonFromExpression(
        this._horizontalOrigin,
      );
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>verticalOrigin</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>VerticalOrigin</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     verticalOrigin : VerticalOrigin.TOP
   * });
   * style.verticalOrigin.evaluate(feature); // returns a VerticalOrigin
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override verticalOrigin expression with a custom function
   * style.verticalOrigin = {
   *     evaluate : function(feature) {
   *         return VerticalOrigin.CENTER;
   *     }
   * };
   */
  verticalOrigin: {
    get: function () {
      return this._verticalOrigin;
    },
    set: function (value) {
      this._verticalOrigin = getExpression(this, value);
      this._style.verticalOrigin = getJsonFromExpression(this._verticalOrigin);
    },
  },

  /**
   * 获取或设置用于评估样式的 <code>labelHorizontalOrigin</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>HorizontalOrigin</code>。
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
    * @example
    * const style = new Cesium3DTileStyle({
    *     labelHorizontalOrigin : HorizontalOrigin.LEFT
    * });
    * style.labelHorizontalOrigin.evaluate(feature); // returns a HorizontalOrigin
    *
    * @example
    * const style = new Cesium.Cesium3DTileStyle();
    * // Override labelHorizontalOrigin expression with a custom function
    * style.labelHorizontalOrigin = {
    *     evaluate : function(feature) {
    *         return HorizontalOrigin.CENTER;
    *     }
    * };
    */
  labelHorizontalOrigin: {
    get: function () {
      return this._labelHorizontalOrigin;
    },
    set: function (value) {
      this._labelHorizontalOrigin = getExpression(this, value);
      this._style.labelHorizontalOrigin = getJsonFromExpression(
        this._labelHorizontalOrigin,
      );
    },
  },

 /**
   * 获取或设置用于评估样式的 <code>labelVerticalOrigin</code> 属性的 {@link StyleExpression} 对象。也可以使用定义数字样式的字符串或对象。
   * 获取器将返回内部的 {@link Expression} 或 {@link ConditionsExpression}，可能与提供给设置器的值不同。
   * <p>
   * 表达式必须返回一个 <code>VerticalOrigin</code>.
   * </p>
   * <p>
   * 此表达式仅适用于矢量瓦片中的点特征。
   * </p>
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @experimental 此功能使用的是 3D Tiles 规范中尚未最终确定的部分，可能会在没有 Cesium 标准弃用政策的情况下发生变化。
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     labelVerticalOrigin : VerticalOrigin.TOP
   * });
   * style.labelVerticalOrigin.evaluate(feature); // returns a VerticalOrigin
   *
   * @example
   * const style = new Cesium.Cesium3DTileStyle();
   * // Override labelVerticalOrigin expression with a custom function
   * style.labelVerticalOrigin = {
   *     evaluate : function(feature) {
   *         return VerticalOrigin.CENTER;
   *     }
   * };
   */
  labelVerticalOrigin: {
    get: function () {
      return this._labelVerticalOrigin;
    },
    set: function (value) {
      this._labelVerticalOrigin = getExpression(this, value);
      this._style.labelVerticalOrigin = getJsonFromExpression(
        this._labelVerticalOrigin,
      );
    },
  },

  /**
   * 获取或设置包含应用特定表达式的对象，这些表达式可以显式
   * 进行评估，例如用于在用户界面中显示。
   *
   * @memberof Cesium3DTileStyle.prototype
   *
   * @type {StyleExpression}
   *
   * @example
   * const style = new Cesium3DTileStyle({
   *     meta : {
   *         description : '"Building id ${id} has height ${Height}."'
   *     }
   * });
   * style.meta.description.evaluate(feature); // returns a String with the substituted variables
   */
  meta: {
    get: function () {
      return this._meta;
    },
    set: function (value) {
      this._meta = value;
    },
  },
});
/**
 * 异步从 URL 创建一个 Cesium3DTileStyle。
 *
 * @param {Resource|string} url 要加载的样式的 URL。
 *
 * @returns {Promise<Cesium3DTileStyle>} 一个承诺，解析为创建的样式。
 *
 * @private
 */

Cesium3DTileStyle.fromUrl = function (url) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(url)) {
    throw new DeveloperError("url is required");
  }
  //>>includeEnd('debug');

  const resource = Resource.createIfNeeded(url);
  return resource.fetchJson(url).then(function (styleJson) {
    return new Cesium3DTileStyle(styleJson);
  });
};

/**
 * 获取此样式的颜色着色器函数。
 *
 * @param {string} functionSignature 生成函数的签名。
 * @param {object} variableSubstitutionMap 变量名称映射到着色器变量名称的映射。
 * @param {object} shaderState 存储有关生成的着色器函数的信息，包括它是否是半透明的。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */

Cesium3DTileStyle.prototype.getColorShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
) {
  if (this._colorShaderFunctionReady) {
    shaderState.translucent = this._colorShaderTranslucent;
    // Return the cached result, may be undefined
    return this._colorShaderFunction;
  }

  this._colorShaderFunctionReady = true;
  if (defined(this.color) && defined(this.color.getShaderFunction)) {
    this._colorShaderFunction = this.color.getShaderFunction(
      functionSignature,
      variableSubstitutionMap,
      shaderState,
      "vec4",
    );
  } else {
    this._colorShaderFunction = undefined;
  }

  this._colorShaderTranslucent = shaderState.translucent;
  return this._colorShaderFunction;
};

/**
 * 获取此样式的 show 着色器函数。
 *
 * @param {string} functionSignature 生成函数的签名。
 * @param {object} variableSubstitutionMap 变量名称映射到着色器变量名称的映射。
 * @param {object} shaderState 存储有关生成的着色器函数的信息，包括它是否是半透明的。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */

Cesium3DTileStyle.prototype.getShowShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
) {
  if (this._showShaderFunctionReady) {
    // Return the cached result, may be undefined
    return this._showShaderFunction;
  }

  this._showShaderFunctionReady = true;

  if (defined(this.show) && defined(this.show.getShaderFunction)) {
    this._showShaderFunction = this.show.getShaderFunction(
      functionSignature,
      variableSubstitutionMap,
      shaderState,
      "bool",
    );
  } else {
    this._showShaderFunction = undefined;
  }
  return this._showShaderFunction;
};

/**
 * 获取此样式的 pointSize 着色器函数。
 *
 * @param {string} functionSignature 生成函数的签名。
 * @param {object} variableSubstitutionMap 变量名称映射到着色器变量名称的映射。
 * @param {object} shaderState 存储有关生成的着色器函数的信息，包括它是否是半透明的。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */

Cesium3DTileStyle.prototype.getPointSizeShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
) {
  if (this._pointSizeShaderFunctionReady) {
    // Return the cached result, may be undefined
    return this._pointSizeShaderFunction;
  }

  this._pointSizeShaderFunctionReady = true;
  if (defined(this.pointSize) && defined(this.pointSize.getShaderFunction)) {
    this._pointSizeShaderFunction = this.pointSize.getShaderFunction(
      functionSignature,
      variableSubstitutionMap,
      shaderState,
      "float",
    );
  } else {
    this._pointSizeShaderFunction = undefined;
  }

  return this._pointSizeShaderFunction;
};

/**
 * 获取样式使用的变量。
 *
 * @returns {string[]} 样式使用的变量。
 *
 * @private
 */

Cesium3DTileStyle.prototype.getVariables = function () {
  let variables = [];

  if (defined(this.color) && defined(this.color.getVariables)) {
    variables.push.apply(variables, this.color.getVariables());
  }

  if (defined(this.show) && defined(this.show.getVariables)) {
    variables.push.apply(variables, this.show.getVariables());
  }

  if (defined(this.pointSize) && defined(this.pointSize.getVariables)) {
    variables.push.apply(variables, this.pointSize.getVariables());
  }

  // Remove duplicates
  variables = variables.filter(function (variable, index, variables) {
    return variables.indexOf(variable) === index;
  });

  return variables;
};

export default Cesium3DTileStyle;
