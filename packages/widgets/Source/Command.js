import { DeveloperError } from "@cesium/engine";

/**
 * 命令是一个具有额外 <code>canExecute</code> 可观察属性的函数，用于确定
 * 命令是否可以执行。当执行时，命令函数会检查
 * <code>canExecute</code> 的值，如果为 false，则会抛出错误。
 *
 * 该类型描述了一个接口，不能直接实例化。
 * 请参阅 {@link createCommand} 从函数创建命令。
 *
 * @alias Command
 * @constructor
 */
function Command() {
  /**
   * 获取此命令当前是否可以执行。此属性是可观察的。
   * @type {boolean}
   * @default undefined
   */
  this.canExecute = undefined;

  /**
   * 获取一个事件，当命令执行之前触发，该事件
   * 会以一个包含两个属性的对象引发：<code>cancel</code> 属性，
   * 如果监听器将其设置为 false，则会阻止命令执行，以及
   * <code>args</code> 属性，表示传递给命令的参数数组。
   * @type {Event}
   * @default undefined
   */
  this.beforeExecute = undefined;

  /**
   * 获取一个事件，当命令执行之后触发，该事件
   * 会以命令的返回值作为唯一参数引发。
   * @type {Event}
   * @default undefined
   */
  this.afterExecute = undefined;

  DeveloperError.throwInstantiationError();
}
export default Command;
