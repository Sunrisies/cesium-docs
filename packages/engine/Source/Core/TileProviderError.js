import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import formatError from "./formatError.js";

/**
 * 提供有关在{@link ImageryProvider}或{@link TerrainProvider}中发生的错误的详细信息。
 *
 * @alias TileProviderError
 * @constructor
 *
 * @param {ImageryProvider|TerrainProvider} provider 发生错误的影像或地形提供者。
 * @param {string} message 描述错误的消息。
 * @param {number} [x] 发生错误的瓦片的X坐标，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {number} [y] 发生错误的瓦片的Y坐标，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {number} [level] 发生错误的瓦片的级别，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {number} [timesRetried=0] 此操作已重试的次数。
 * @param {Error} [error] 发生的错误或异常（如果有）。
 */

function TileProviderError(
  provider,
  message,
  x,
  y,
  level,
  timesRetried,
  error,
) {
  /**
   * 发生错误的 {@link ImageryProvider} 或 {@link TerrainProvider}。
   * @type {ImageryProvider|TerrainProvider}
   */
  this.provider = provider;

  /**
   * 描述错误的消息。
   * @type {string}
   */
  this.message = message;

  /**
   * 发生错误的瓦片的X坐标。如果错误
   * 不特定于某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.x = x;

  /**
   * 发生错误的瓦片的Y坐标。如果错误
   * 不特定于某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.y = y;

  /**
   * 发生错误的瓦片的细节级别。如果错误
   * 不特定于某个瓦片，则此属性将为undefined。
   * @type {number}
   */
  this.level = level;

  /**
   * 此操作已重试的次数。
   * @type {number}
   * @default 0
   */
  this.timesRetried = defaultValue(timesRetried, 0);

  /**
   * 如果失败的操作应该被重试，则为true；否则为false。影像或地形提供者
   * 会在引发事件之前设置此属性的初始值，但任何监听器
   * 都可以更改它。最后一个监听器被调用后的值将被执行。
   * @type {boolean}
   * @default false
   */
  this.retry = false;

  /**
   * 发生的错误或异常（如果有）。
   * @type {Error}
   */
  this.error = error;
}


/**
 * 通过引发事件来报告{@link ImageryProvider}或{@link TerrainProvider}中的错误，如果有任何监听器；如果事件没有监听器，则将错误记录到控制台。此方法还跟踪操作已重试的次数。
 *
 * @param {TileProviderError} previousError 上次为此错误调用此函数时返回的错误实例，如果这是第一次发生此错误，则为undefined。
 * @param {ImageryProvider|TerrainProvider} [provider] 发生错误的影像或地形提供者。
 * @param {Event} [event] 要引发的事件，以通知监听器错误。
 * @param {string} [message] 描述错误的消息。
 * @param {number} [x] 发生错误的瓦片的X坐标，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {number} [y] 发生错误的瓦片的Y坐标，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {number} [level] 发生错误的瓦片的细节级别，如果错误
 *        不特定于某个瓦片，则为undefined。
 * @param {Error} [errorDetails] 发生的错误或异常（如果有）。
 * @returns {TileProviderError} 传递给事件监听器的错误实例，并且应该在下次调用此函数时用于相同错误，以跟踪重试计数。
 */

TileProviderError.reportError = function (
  previousError,
  provider,
  event,
  message,
  x,
  y,
  level,
  errorDetails,
) {
  let error = previousError;
  if (!defined(previousError)) {
    error = new TileProviderError(
      provider,
      message,
      x,
      y,
      level,
      0,
      errorDetails,
    );
  } else {
    error.provider = provider;
    error.message = message;
    error.x = x;
    error.y = y;
    error.level = level;
    error.retry = false;
    error.error = errorDetails;
    ++error.timesRetried;
  }

  if (defined(event) && event.numberOfListeners > 0) {
    event.raiseEvent(error);
  } else if (defined(provider)) {
    console.log(
      `An error occurred in "${provider.constructor.name}": ${formatError(
        message,
      )}`,
    );
  }

  return error;
};

/**
 * 通过重置之前错误的重试计数（如果有）来报告操作的成功。这样，如果错误在未来再次发生，监听器将被通知它尚未被重试。
 *
 * @param {TileProviderError} previousError 之前的错误，如果此操作以前未导致错误，则为undefined。
 */
TileProviderError.reportSuccess = function (previousError) {
  if (defined(previousError)) {
    previousError.timesRetried = -1;
  }
};

/**
 * 将被调用以重试操作的函数。
 * @callback TileProviderError.RetryFunction
 */

export default TileProviderError;
