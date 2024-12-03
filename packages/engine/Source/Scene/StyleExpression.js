import DeveloperError from "../Core/DeveloperError.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式表达式。
 * <p>
 * 此接口的派生类在 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 中评估表达式。
 * </p>
 * <p>
 * 此类型描述一个接口，并不打算直接实例化。
 * </p>
 *
 * @alias StyleExpression
 * @constructor
 *
 * @see Expression
 * @see ConditionsExpression
 */

function StyleExpression() {}

/**
 * 评估表达式的结果， optionally 使用提供的特征属性。如果表达式的结果在
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
 * 中的类型为 <code>Boolean</code>、<code>Number</code> 或 <code>String</code>，则返回相应的 JavaScript
 * 原始类型。如果结果是 <code>RegExp</code>，则将返回一个 JavaScript <code>RegExp</code>
 * 对象。如果结果是 <code>Cartesian2</code>、<code>Cartesian3</code> 或 <code>Cartesian4</code>，
 * 将返回 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 对象。如果 <code>result</code> 参数是
 * {@link Color}，则 {@link Cartesian4} 值会被转换为 {@link Color} 然后返回。
 *
 * @param {Cesium3DTileFeature} feature 可用于在表达式中作为变量使用的特征属性。
 * @param {object} [result] 存储结果的对象。
 * @returns {boolean|number|string|RegExp|Cartesian2|Cartesian3|Cartesian4|Color} 评估表达式的结果。
 */
StyleExpression.prototype.evaluate = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 评估颜色表达式的结果， optionally 使用提供的特征属性。
 * <p>
 * 这相当于 {@link StyleExpression#evaluate}，但始终返回一个 {@link Color} 对象。
 * </p>
 *
 * @param {Cesium3DTileFeature} feature 可用于在表达式中作为变量使用的特征属性。
 * @param {Color} [result] 用于存储结果的对象。
 * @returns {Color} 修改后的结果参数或者如果未提供则返回一个新的 Color 实例。
 */

StyleExpression.prototype.evaluateColor = function (feature, result) {
  DeveloperError.throwInstantiationError();
};

/**
 * 获取此表达式的着色器函数。
 * 如果无法从此表达式生成着色器函数，则返回未定义。
 *
 * @param {string} functionSignature 生成函数的签名。
 * @param {object} variableSubstitutionMap 变量名称映射到着色器变量名称的映射。
 * @param {object} shaderState 存储有关生成的着色器函数的信息，包括它是否是半透明的。
 * @param {string} returnType 生成函数的返回类型。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */

StyleExpression.prototype.getShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
  returnType,
) {
  DeveloperError.throwInstantiationError();
};

/**
 * 获取表达式中使用的变量。
 *
 * @returns {string[]} 表达式中使用的变量。
 *
 * @private
 */

StyleExpression.prototype.getVariables = function () {
  DeveloperError.throwInstantiationError();
};

export default StyleExpression;
