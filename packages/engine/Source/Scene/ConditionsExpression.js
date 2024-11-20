import clone from "../Core/clone.js";
import defined from "../Core/defined.js";
import Expression from "./Expression.js";

/**
 * 应用于 {@link Cesium3DTileset} 的样式表达式。
 * <p>
 * 评估使用 {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language} 定义的条件表达式。
 * </p>
 * <p>
 * 实现 {@link StyleExpression} 接口。
 * </p>
 *
 * @alias ConditionsExpression
 * @constructor
 *
 * @param {object} [conditionsExpression] 使用 3D Tiles Styling language 定义的条件表达式。
 * @param {object} [defines] 样式中的定义。
 *
 * @example
 * const expression = new Cesium.ConditionsExpression({
 *     conditions : [
 *         ['${Area} > 10, 'color("#FF0000")'],
 *         ['${id} !== "1"', 'color("#00FF00")'],
 *         ['true', 'color("#FFFFFF")']
 *     ]
 * });
 * expression.evaluateColor(feature, result); // returns a Cesium.Color object
 */
function ConditionsExpression(conditionsExpression, defines) {
  this._conditionsExpression = clone(conditionsExpression, true);
  this._conditions = conditionsExpression.conditions;
  this._runtimeConditions = undefined;

  setRuntime(this, defines);
}

Object.defineProperties(ConditionsExpression.prototype, {
  /**
   * 获取使用 3D Tiles Styling language 定义的条件表达式。
   *
   * @memberof ConditionsExpression.prototype
   *
   * @type {object}
   * @readonly
   *
   * @default undefined
   */

  conditionsExpression: {
    get: function () {
      return this._conditionsExpression;
    },
  },
});

function Statement(condition, expression) {
  this.condition = condition;
  this.expression = expression;
}

function setRuntime(expression, defines) {
  const runtimeConditions = [];
  const conditions = expression._conditions;
  if (!defined(conditions)) {
    return;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    const cond = String(statement[0]);
    const condExpression = String(statement[1]);
    runtimeConditions.push(
      new Statement(
        new Expression(cond, defines),
        new Expression(condExpression, defines),
      ),
    );
  }
  expression._runtimeConditions = runtimeConditions;
}

/**
 * 评估表达式的结果，可以选择使用提供的特征属性。如果表达式的结果在
 * {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification/Styling|3D Tiles Styling language}
 * 中的类型为 <code>Boolean</code>、<code>Number</code> 或 <code>String</code>，将返回相应的 JavaScript
 * 原始类型。如果结果是 <code>RegExp</code>，将返回一个 JavaScript <code>RegExp</code>
 * 对象。如果结果是 <code>Cartesian2</code>、<code>Cartesian3</code> 或 <code>Cartesian4</code>，
 * 将返回一个 {@link Cartesian2}、{@link Cartesian3} 或 {@link Cartesian4} 对象。如果 <code>result</code> 参数是
 * {@link Color}，则 {@link Cartesian4} 值会被转换为 {@link Color} 并返回。
 *
 * @param {Cesium3DTileFeature} feature 可以作为表达式中变量使用的特征属性。
 * @param {object} [result] 存储结果的对象。
 * @returns {boolean|number|string|RegExp|Cartesian2|Cartesian3|Cartesian4|Color} 评估表达式的结果。
 */

ConditionsExpression.prototype.evaluate = function (feature, result) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions)) {
    return undefined;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    if (statement.condition.evaluate(feature)) {
      return statement.expression.evaluate(feature, result);
    }
  }
};

/**
 * 评估颜色表达式的结果，使用特征定义的值。
 * <p>
 * 这等价于 {@link ConditionsExpression#evaluate}，但始终返回一个 {@link Color} 对象。
 * </p>
 * @param {Cesium3DTileFeature} feature 可以作为表达式中变量使用的特征属性。
 * @param {Color} [result] 存储结果的对象。
 * @returns {Color} 修改后的结果参数，如果未提供则返回一个新的 Color 实例。
 */

ConditionsExpression.prototype.evaluateColor = function (feature, result) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions)) {
    return undefined;
  }
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    if (statement.condition.evaluate(feature)) {
      return statement.expression.evaluateColor(feature, result);
    }
  }
};

/**
 * 获取此表达式的着色器函数。
 * 如果无法从此表达式生成着色器函数，则返回 undefined。
 *
 * @param {string} functionSignature 生成函数的签名。
 * @param {object} variableSubstitutionMap 变量名称到着色器变量名称的映射。
 * @param {object} shaderState 存储关于生成的着色器函数的信息，包括它是否是半透明的。
 * @param {string} returnType 生成函数的返回类型。
 *
 * @returns {string} 着色器函数。
 *
 * @private
 */

ConditionsExpression.prototype.getShaderFunction = function (
  functionSignature,
  variableSubstitutionMap,
  shaderState,
  returnType,
) {
  const conditions = this._runtimeConditions;
  if (!defined(conditions) || conditions.length === 0) {
    return undefined;
  }

  let shaderFunction = "";
  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];

    const condition = statement.condition.getShaderExpression(
      variableSubstitutionMap,
      shaderState,
    );
    const expression = statement.expression.getShaderExpression(
      variableSubstitutionMap,
      shaderState,
    );

    // Build the if/else chain from the list of conditions
    shaderFunction +=
      `    ${i === 0 ? "if" : "else if"} (${condition})\n` +
      `    {\n` +
      `        return ${expression};\n` +
      `    }\n`;
  }

  shaderFunction =
    `${returnType} ${functionSignature}\n` +
    `{\n${shaderFunction}    return ${returnType}(1.0);\n` + // Return a default value if no conditions are met
    `}\n`;

  return shaderFunction;
};

/**
 * 获取表达式使用的变量。
 *
 * @returns {string[]} 表达式使用的变量。
 *
 * @private
 */

ConditionsExpression.prototype.getVariables = function () {
  let variables = [];

  const conditions = this._runtimeConditions;
  if (!defined(conditions) || conditions.length === 0) {
    return variables;
  }

  const length = conditions.length;
  for (let i = 0; i < length; ++i) {
    const statement = conditions[i];
    variables.push.apply(variables, statement.condition.getVariables());
    variables.push.apply(variables, statement.expression.getVariables());
  }

  // Remove duplicates
  variables = variables.filter(function (variable, index, variables) {
    return variables.indexOf(variable) === index;
  });

  return variables;
};

export default ConditionsExpression;
