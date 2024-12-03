import { defaultValue, defined, DeveloperError } from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 一个视图模型，用于暴露切换按钮的属性。
 * @alias ToggleButtonViewModel
 * @constructor
 *
 * @param {Command} command 在按钮切换时将执行的命令。
 * @param {object} [options] 带有以下属性的对象：
 * @param {boolean} [options.toggled=false] 一个布尔值，指示按钮是否应最初处于切换状态。
 * @param {string} [options.tooltip=''] 包含按钮工具提示的字符串。
 */

function ToggleButtonViewModel(command, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(command)) {
    throw new DeveloperError("command is required.");
  }
  //>>includeEnd('debug');

  this._command = command;

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  /**
   * 获取或设置按钮当前是否为切换状态。此属性是可观察的。
   * @type {boolean}
   * @default false
   */
  this.toggled = defaultValue(options.toggled, false);

  /**
   * 获取或设置按钮的工具提示。此属性是可观察的。
   * @type {string}
   * @default ''
   */

  this.tooltip = defaultValue(options.tooltip, "");

  knockout.track(this, ["toggled", "tooltip"]);
}

Object.defineProperties(ToggleButtonViewModel.prototype, {
  /**
   * 获取将在按钮切换时执行的命令。
   * @memberof ToggleButtonViewModel.prototype
   * @type {Command}
   */

  command: {
    get: function () {
      return this._command;
    },
  },
});
export default ToggleButtonViewModel;
