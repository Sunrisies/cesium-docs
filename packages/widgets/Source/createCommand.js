import { defaultValue, defined, DeveloperError, Event } from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 从给定的函数创建一个命令，用于视图模型。
 *
 * 命令是一个具有额外 <code>canExecute</code> 可观察属性的函数，用于确定
 * 命令是否可以执行。当执行时，命令函数会检查
 * <code>canExecute</code> 的值，如果为 false，则会抛出错误。它还提供了命令
 * 被执行或即将执行时的事件。
 *
 * @function
 *
 * @param {Function} func 要执行的函数。
 * @param {boolean} [canExecute=true] 一个布尔值，指示该函数是否可以当前执行。
 */

function createCommand(func, canExecute) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(func)) {
    throw new DeveloperError("func is required.");
  }
  //>>includeEnd('debug');

  canExecute = defaultValue(canExecute, true);

  const beforeExecute = new Event();
  const afterExecute = new Event();

  function command() {
    //>>includeStart('debug', pragmas.debug);
    if (!command.canExecute) {
      throw new DeveloperError("Cannot execute command, canExecute is false.");
    }
    //>>includeEnd('debug');

    const commandInfo = {
      args: arguments,
      cancel: false,
    };

    let result;
    beforeExecute.raiseEvent(commandInfo);
    if (!commandInfo.cancel) {
      result = func.apply(null, arguments);
      afterExecute.raiseEvent(result);
    }
    return result;
  }

  command.canExecute = canExecute;
  knockout.track(command, ["canExecute"]);

  Object.defineProperties(command, {
    beforeExecute: {
      value: beforeExecute,
    },
    afterExecute: {
      value: afterExecute,
    },
  });

  return command;
}
export default createCommand;
