import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import JulianDate from "../Core/JulianDate.js";
import Request from "../Core/Request.js";
import RequestType from "../Core/RequestType.js";

/**
 * 提供具有时间动态影像的影像提供者的功能。
 *
 * @alias TimeDynamicImagery
 * @constructor
 *
 * @param {object} options 具有以下属性的对象：
 * @param {Clock} options.clock 用于确定时间维度值的Clock实例。当指定<code>options.times</code>时是必需的。
 * @param {TimeIntervalCollection} options.times 具有其<code>data</code>属性为包含时间动态维度及其值的对象的TimeIntervalCollection。
 * @param {Function} options.requestImageFunction 请求影像瓦片的函数。
 * @param {Function} options.reloadFunction 当需要重新加载所有影像瓦片时将被调用的函数。
 */

function TimeDynamicImagery(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options.clock", options.clock);
  Check.typeOf.object("options.times", options.times);
  Check.typeOf.func(
    "options.requestImageFunction",
    options.requestImageFunction,
  );
  Check.typeOf.func("options.reloadFunction", options.reloadFunction);
  //>>includeEnd('debug');

  this._tileCache = {};
  this._tilesRequestedForInterval = [];

  const clock = (this._clock = options.clock);
  this._times = options.times;
  this._requestImageFunction = options.requestImageFunction;
  this._reloadFunction = options.reloadFunction;
  this._currentIntervalIndex = -1;

  clock.onTick.addEventListener(this._clockOnTick, this);
  this._clockOnTick(clock);
}

Object.defineProperties(TimeDynamicImagery.prototype, {
  /**
   * 获取或设置一个时钟，用于保持时间动态参数所使用的时间。
   * @memberof TimeDynamicImagery.prototype
   * @type {Clock}
   */

  clock: {
    get: function () {
      return this._clock;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._clock !== value) {
        this._clock = value;
        this._clockOnTick(value);
        this._reloadFunction();
      }
    },
  },
  /**
   * 获取或设置时间区间集合。
   * @memberof TimeDynamicImagery.prototype
   * @type {TimeIntervalCollection}
   */

  times: {
    get: function () {
      return this._times;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._times !== value) {
        this._times = value;
        this._clockOnTick(this._clock);
        this._reloadFunction();
      }
    },
  },
  /**
   * 获取当前时间区间。
   * @memberof TimeDynamicImagery.prototype
   * @type {TimeInterval}
   */

  currentInterval: {
    get: function () {
      return this._times.get(this._currentIntervalIndex);
    },
  },
});

/**
 * 从缓存中获取瓦片（如果可用）。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅用于内部使用。
 *
 * @returns {Promise<HTMLImageElement>|undefined} 一个图像的承诺，当图像可用时将解析；如果瓦片不在缓存中，则为undefined。
 */

TimeDynamicImagery.prototype.getFromCache = function (x, y, level, request) {
  const key = getKey(x, y, level);
  let result;
  const cache = this._tileCache[this._currentIntervalIndex];
  if (defined(cache) && defined(cache[key])) {
    const item = cache[key];
    result = item.promise.catch(function (e) {
      // Set the correct state in case it was cancelled
      request.state = item.request.state;
      throw e;
    });
    delete cache[key];
  }

  return result;
};

/**
 * 检查下一个时间区间是否临近，并在必要时开始预加载瓦片。否则，它将
 * 仅将瓦片添加到一个列表中，以便在临近下一个时间区间时进行预加载。
 *
 * @param {number} x 瓦片的X坐标。
 * @param {number} y 瓦片的Y坐标。
 * @param {number} level 瓦片的级别。
 * @param {Request} [request] 请求对象。仅用于内部使用。
 */

TimeDynamicImagery.prototype.checkApproachingInterval = function (
  x,
  y,
  level,
  request,
) {
  const key = getKey(x, y, level);
  const tilesRequestedForInterval = this._tilesRequestedForInterval;

  // If we are approaching an interval, preload this tile in the next interval
  const approachingInterval = getApproachingInterval(this);
  const tile = {
    key: key,
    // Determines priority based on camera distance to the tile.
    // Since the imagery regardless of time will be attached to the same tile we can just steal it.
    priorityFunction: request.priorityFunction,
  };
  if (
    !defined(approachingInterval) ||
    !addToCache(this, tile, approachingInterval)
  ) {
    // Add to recent request list if we aren't approaching and interval or the request was throttled
    tilesRequestedForInterval.push(tile);
  }

  // Don't let the tile list get out of hand
  if (tilesRequestedForInterval.length >= 512) {
    tilesRequestedForInterval.splice(0, 256);
  }
};

TimeDynamicImagery.prototype._clockOnTick = function (clock) {
  const time = clock.currentTime;
  const times = this._times;
  const index = times.indexOf(time);
  const currentIntervalIndex = this._currentIntervalIndex;

  if (index !== currentIntervalIndex) {
    // Cancel all outstanding requests and clear out caches not from current time interval
    const currentCache = this._tileCache[currentIntervalIndex];
    for (const t in currentCache) {
      if (currentCache.hasOwnProperty(t)) {
        currentCache[t].request.cancel();
      }
    }
    delete this._tileCache[currentIntervalIndex];
    this._tilesRequestedForInterval = [];

    this._currentIntervalIndex = index;
    this._reloadFunction();

    return;
  }

  const approachingInterval = getApproachingInterval(this);
  if (defined(approachingInterval)) {
    // Start loading recent tiles from end of this._tilesRequestedForInterval
    //  We keep preloading until we hit a throttling limit.
    const tilesRequested = this._tilesRequestedForInterval;
    let success = true;
    while (success) {
      if (tilesRequested.length === 0) {
        break;
      }

      const tile = tilesRequested.pop();
      success = addToCache(this, tile, approachingInterval);
      if (!success) {
        tilesRequested.push(tile);
      }
    }
  }
};

function getKey(x, y, level) {
  return `${x}-${y}-${level}`;
}

function getKeyElements(key) {
  const s = key.split("-");
  if (s.length !== 3) {
    return undefined;
  }

  return {
    x: Number(s[0]),
    y: Number(s[1]),
    level: Number(s[2]),
  };
}

function getApproachingInterval(that) {
  const times = that._times;
  if (!defined(times)) {
    return undefined;
  }
  const clock = that._clock;
  const time = clock.currentTime;
  const isAnimating = clock.canAnimate && clock.shouldAnimate;
  const multiplier = clock.multiplier;

  if (!isAnimating && multiplier !== 0) {
    return undefined;
  }

  let seconds;
  let index = times.indexOf(time);
  if (index < 0) {
    return undefined;
  }

  const interval = times.get(index);
  if (multiplier > 0) {
    // animating forward
    seconds = JulianDate.secondsDifference(interval.stop, time);
    ++index;
  } else {
    //backwards
    seconds = JulianDate.secondsDifference(interval.start, time); // Will be negative
    --index;
  }
  seconds /= multiplier; // Will always be positive

  // Less than 5 wall time seconds
  return index >= 0 && seconds <= 5.0 ? times.get(index) : undefined;
}

function addToCache(that, tile, interval) {
  const index = that._times.indexOf(interval.start);
  const tileCache = that._tileCache;
  let intervalTileCache = tileCache[index];
  if (!defined(intervalTileCache)) {
    intervalTileCache = tileCache[index] = {};
  }

  const key = tile.key;
  if (defined(intervalTileCache[key])) {
    return true; // Already in the cache
  }

  const keyElements = getKeyElements(key);
  const request = new Request({
    throttle: false,
    throttleByServer: true,
    type: RequestType.IMAGERY,
    priorityFunction: tile.priorityFunction,
  });
  const promise = that._requestImageFunction(
    keyElements.x,
    keyElements.y,
    keyElements.level,
    request,
    interval,
  );
  if (!defined(promise)) {
    return false;
  }

  intervalTileCache[key] = {
    promise: promise,
    request: request,
  };

  return true;
}
export default TimeDynamicImagery;
