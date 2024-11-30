import defaultValue from "../../Core/defaultValue.js";
import defined from "../../Core/defined.js";
import DeveloperError from "../../Core/DeveloperError.js";
import Event from "../../Core/Event.js";
import JulianDate from "../../Core/JulianDate.js";
import CesiumMath from "../../Core/Math.js";
import ModelAnimation from "./ModelAnimation.js";
import ModelAnimationLoop from ".././ModelAnimationLoop.js";
import ModelAnimationState from ".././ModelAnimationState.js";

/**
 * <div class="notice">
 * 访问模型的动画 {@link Model#activeAnimations}。请勿直接调用构造函数。
 * </div>
 *
 * 活跃模型动画的集合。
 *
 * @alias ModelAnimationCollection
 * @internalConstructor
 * @class
 *
 * @see Model#activeAnimations
 */

function ModelAnimationCollection(model) {
  /**
   * 当动画被添加到集合时触发的事件。这可以用于，例如，保持用户界面同步。
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * model.activeAnimations.animationAdded.addEventListener(function(model, animation) {
   *   console.log(`动画添加：${animation.name}`);
   * });
   */
  this.animationAdded = new Event();

  /**
   * 当动画从集合中移除时触发的事件。这可以用于，例如，保持用户界面同步。
   *
   * @type {Event}
   * @default new Event()
   *
   * @example
   * model.activeAnimations.animationRemoved.addEventListener(function(model, animation) {
   *   console.log(`动画移除：${animation.name}`);
   * });
   */
  this.animationRemoved = new Event();

  /**
   * 如果为真，即使在场景时间暂停时，动画也会播放。但是，动画是否发生将取决于分配给模型动画的 animationTime 函数。默认情况下，这基于场景时间，因此使用默认设置的模型将不会动画化，不管这个设置如何。
   *
   * @type {boolean}
   * @default false
   */
  this.animateWhilePaused = false;

  this._model = model;
  this._runtimeAnimations = [];
  this._previousTime = undefined;
}


Object.defineProperties(ModelAnimationCollection.prototype, {
  /**
   * 集合中的动画数量。
   *
   * @memberof ModelAnimationCollection.prototype
   *
   * @type {number}
   * @readonly
   */

  length: {
    get: function () {
      return this._runtimeAnimations.length;
    },
  },

  /**
   * 拥有此动画集合的模型。
   *
   * @memberof ModelAnimationCollection.prototype
   *
   * @type {Model}
   * @readonly
   */

  model: {
    get: function () {
      return this._model;
    },
  },
});

function addAnimation(collection, animation, options) {
  const model = collection._model;
  const runtimeAnimation = new ModelAnimation(model, animation, options);
  collection._runtimeAnimations.push(runtimeAnimation);
  collection.animationAdded.raiseEvent(model, runtimeAnimation);
  return runtimeAnimation;
}

/**
 * 创建并将具有指定初始属性的动画添加到集合中。
 * <p>
 * 这会触发 {@link ModelAnimationCollection#animationAdded} 事件，因此，例如，用户界面可以保持同步。
 * </p>
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} [options.name] 标识动画的 glTF 动画名称。如果 <code>options.index</code> 为 <code>undefined</code>，必须定义此项。
 * @param {number} [options.index] 标识动画的 glTF 动画索引。如果 <code>options.name</code> 为 <code>undefined</code>，必须定义此项。
 * @param {JulianDate} [options.startTime] 开始播放动画的场景时间。当此项为 <code>undefined</code> 时，动画将在下一个帧开始播放。
 * @param {number} [options.delay=0.0] 从 <code>startTime</code> 开始播放的延迟（以秒为单位）。仅当 <code>options.loop</code> 为 ModelAnimationLoop.NONE 时，此项会影响动画。
 * @param {JulianDate} [options.stopTime] 停止播放动画的场景时间。当此项为 <code>undefined</code> 时，动画将播放其完整的持续时间。
 * @param {boolean} [options.removeOnStop=false] 如果为 <code>true</code>，则动画在停止播放后将被移除。仅当 <code>options.loop</code> 为 ModelAnimationLoop.NONE 时，此项会影响动画。
 * @param {number} [options.multiplier=1.0] 大于 <code>1.0</code> 的值会相对于场景时钟速度加快动画播放速度；小于 <code>1.0</code> 的值会减慢速度。
 * @param {boolean} [options.reverse=false] 如果为 <code>true</code>，则动画以反向播放。
 * @param {ModelAnimationLoop} [options.loop=ModelAnimationLoop.NONE] 决定动画是否以及如何循环播放。
 * @param {ModelAnimation.AnimationTimeCallback} [options.animationTime=undefined] 如果定义了此项，则计算此动画的本地动画时间。
 * @returns {ModelAnimation} 添加到集合中的动画。
 *
 * @exception {DeveloperError} 动画未加载。请等待 {@link Model#ready} 返回 true。
 * @exception {DeveloperError} options.name 必须是有效的动画名称。
 * @exception {DeveloperError} options.index 必须是有效的动画索引。
 * @exception {DeveloperError} 必须定义 options.name 或 options.index。
 * @exception {DeveloperError} options.multiplier 必须大于零。
 *
 * @example
 * // Example 1. Add an animation by name
 * model.activeAnimations.add({
 *   name : 'animation name'
 * });
 *
 * @example
 * // Example 2. Add an animation by index
 * model.activeAnimations.add({
 *   index : 0
 * });
 *
 * @example
 * // Example 3. Add an animation and provide all properties and events
 * const startTime = Cesium.JulianDate.now();
 *
 * const animation = model.activeAnimations.add({
 *   name : 'another animation name',
 *   startTime : startTime,
 *   delay : 0.0,                                 // Play at startTime (default)
 *   stopTime : Cesium.JulianDate.addSeconds(startTime, 4.0, new Cesium.JulianDate()),
 *   removeOnStop : false,                        // Do not remove when animation stops (default)
 *   multiplier : 2.0,                            // Play at double speed
 *   reverse : true,                              // Play in reverse
 *   loop : Cesium.ModelAnimationLoop.REPEAT      // Loop the animation
 * });
 *
 * animation.start.addEventListener(function(model, animation) {
 *   console.log(`Animation started: ${animation.name}`);
 * });
 * animation.update.addEventListener(function(model, animation, time) {
 *   console.log(`Animation updated: ${animation.name}. glTF animation time: ${time}`);
 * });
 * animation.stop.addEventListener(function(model, animation) {
 *   console.log(`Animation stopped: ${animation.name}`);
 * });
 */
ModelAnimationCollection.prototype.add = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const model = this._model;

  //>>includeStart('debug', pragmas.debug);
  if (!model.ready) {
    throw new DeveloperError(
      "Animations are not loaded.  Wait for Model.ready to be true.",
    );
  }
  //>>includeEnd('debug');

  const animations = model.sceneGraph.components.animations;

  //>>includeStart('debug', pragmas.debug);
  if (!defined(options.name) && !defined(options.index)) {
    throw new DeveloperError(
      "Either options.name or options.index must be defined.",
    );
  }

  if (defined(options.multiplier) && options.multiplier <= 0.0) {
    throw new DeveloperError("options.multiplier must be greater than zero.");
  }

  if (
    defined(options.index) &&
    (options.index >= animations.length || options.index < 0)
  ) {
    throw new DeveloperError("options.index must be a valid animation index.");
  }
  //>>includeEnd('debug');

  let index = options.index;
  if (defined(index)) {
    return addAnimation(this, animations[index], options);
  }

  // Find the index of the animation with the given name
  const length = animations.length;
  for (let i = 0; i < length; ++i) {
    if (animations[i].name === options.name) {
      index = i;
      break;
    }
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("options.name must be a valid animation name.");
  }
  //>>includeEnd('debug');

  return addAnimation(this, animations[index], options);
};

/**
 * 创建并将具有指定初始属性的动画添加到模型中的所有动画的集合中。
 * <p>
 * 这会触发每个模型的 {@link ModelAnimationCollection#animationAdded} 事件，因此，例如，用户界面可以保持同步。
 * </p>
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {JulianDate} [options.startTime] 开始播放动画的场景时间。当此项为 <code>undefined</code> 时，动画将在下一个帧开始播放。
 * @param {number} [options.delay=0.0] 从 <code>startTime</code> 开始播放的延迟（以秒为单位）。仅当 <code>options.loop</code> 为 ModelAnimationLoop.NONE 时，此项会影响动画。
 * @param {JulianDate} [options.stopTime] 停止播放动画的场景时间。当此项为 <code>undefined</code> 时，动画将播放其完整的持续时间。
 * @param {boolean} [options.removeOnStop=false] 如果为 <code>true</code>，则动画在停止播放后将被移除。仅当 <code>options.loop</code> 为 ModelAnimationLoop.NONE 时，此项会影响动画。
 * @param {number} [options.multiplier=1.0] 大于 <code>1.0</code> 的值会相对于场景时钟速度加快动画播放速度；小于 <code>1.0</code> 的值会减慢速度。
 * @param {boolean} [options.reverse=false] 如果为 <code>true</code>，则动画以反向播放。
 * @param {ModelAnimationLoop} [options.loop=ModelAnimationLoop.NONE] 决定动画是否以及如何循环播放。
 * @param {ModelAnimation.AnimationTimeCallback} [options.animationTime=undefined] 如果定义了此项，则计算所有动画的本地动画时间。
 * @returns {ModelAnimation[]} 一个 {@link ModelAnimation} 对象的数组，针对每个添加到集合中的动画。如果没有 glTF 动画，数组为空。
 *
 * @exception {DeveloperError} 动画未加载。请等待 {@link Model#ready} 返回 true。
 * @exception {DeveloperError} options.multiplier 必须大于零。
 *
 * @example
 * model.activeAnimations.addAll({
 *   multiplier : 0.5,                            // Play at half-speed
 *   loop : Cesium.ModelAnimationLoop.REPEAT      // Loop the animations
 * });
 */
ModelAnimationCollection.prototype.addAll = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  const model = this._model;

  //>>includeStart('debug', pragmas.debug);
  if (!model.ready) {
    throw new DeveloperError(
      "Animations are not loaded.  Wait for Model.ready to be true.",
    );
  }

  if (defined(options.multiplier) && options.multiplier <= 0.0) {
    throw new DeveloperError("options.multiplier must be greater than zero.");
  }
  //>>includeEnd('debug');

  const animations = model.sceneGraph.components.animations;

  const addedAnimations = [];
  const length = animations.length;
  for (let i = 0; i < length; ++i) {
    const animation = addAnimation(this, animations[i], options);
    addedAnimations.push(animation);
  }
  return addedAnimations;
};

/**
 * 从集合中移除动画。
 * <p>
 * 这会触发 {@link ModelAnimationCollection#animationRemoved} 事件，因此，例如，用户界面可以保持同步。
 * </p>
 * <p>
 * 通过将 {@link ModelAnimationCollection#removeOnStop} 设置为 <code>true</code>，动画也可以被隐式移除出集合。当动画被移除时，仍然会触发 {@link ModelAnimationCollection#animationRemoved} 事件。
 * </p>
 *
 * @param {ModelAnimation} runtimeAnimation 要移除的运行时动画。
 * @returns {boolean} 如果动画被移除，则返回 <code>true</code>；如果动画未在集合中找到，则返回 <code>false</code>。
 *
 * @example
 * const a = model.activeAnimations.add({
 *   name : 'animation name'
 * });
 * model.activeAnimations.remove(a); // Returns true
 */
ModelAnimationCollection.prototype.remove = function (runtimeAnimation) {
  if (!defined(runtimeAnimation)) {
    return false;
  }

  const animations = this._runtimeAnimations;
  const i = animations.indexOf(runtimeAnimation);
  if (i !== -1) {
    animations.splice(i, 1);
    this.animationRemoved.raiseEvent(this._model, runtimeAnimation);
    return true;
  }

  return false;
};

/**
 * 从集合中移除所有动画。
 * <p>
 * 这会为每个动画触发 {@link ModelAnimationCollection#animationRemoved} 事件，因此，例如，用户界面可以保持同步。
 * </p>
 */

ModelAnimationCollection.prototype.removeAll = function () {
  const model = this._model;
  const animations = this._runtimeAnimations;
  const length = animations.length;

  this._runtimeAnimations.length = 0;

  for (let i = 0; i < length; ++i) {
    this.animationRemoved.raiseEvent(model, animations[i]);
  }
};

/**
 * 确定此集合是否包含给定的动画。
 *
 * @param {ModelAnimation} runtimeAnimation 要检查的运行时动画。
 * @returns {boolean} 如果此集合包含该动画则返回 <code>true</code>，否则返回 <code>false</code>。
 */

ModelAnimationCollection.prototype.contains = function (runtimeAnimation) {
  if (defined(runtimeAnimation)) {
    return this._runtimeAnimations.indexOf(runtimeAnimation) !== -1;
  }

  return false;
};

/**
 * 返回集合中指定索引的动画。索引是零基的，并且随着动画的添加而增加。移除一个动画会将其之后的所有动画向左移动，改变它们的索引。此函数通常用于遍历集合中的所有动画。
 *
 * @param {number} index 动画的零基索引。
 * @returns {ModelAnimation} 指定索引处的运行时动画。
 *
 * @example
 * // Output the names of all the animations in the collection.
 * const animations = model.activeAnimations;
 * const length = animations.length;
 * for (let i = 0; i < length; ++i) {
 *   console.log(animations.get(i).name);
 * }
 */
ModelAnimationCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }

  if (index >= this._runtimeAnimations.length || index < 0) {
    throw new DeveloperError(
      "index must be valid within the range of the collection",
    );
  }
  //>>includeEnd('debug');

  return this._runtimeAnimations[index];
};

const animationsToRemove = [];

function createAnimationRemovedFunction(
  modelAnimationCollection,
  model,
  animation,
) {
  return function () {
    modelAnimationCollection.animationRemoved.raiseEvent(model, animation);
  };
}

/**
 * 更新此集合中的运行时动画，移除任何已经停止的动画。
 *
 * @param {FrameState} frameState 当前帧状态。
 * @returns {boolean} 如果在此次更新中播放了动画，则返回 <code>true</code>，否则返回 <code>false</code>。
 *
 * @private
 */

ModelAnimationCollection.prototype.update = function (frameState) {
  const runtimeAnimations = this._runtimeAnimations;
  let length = runtimeAnimations.length;

  if (length === 0) {
    this._previousTime = undefined;
    return false;
  }

  if (
    !this.animateWhilePaused &&
    JulianDate.equals(frameState.time, this._previousTime)
  ) {
    return false;
  }
  this._previousTime = JulianDate.clone(frameState.time, this._previousTime);

  let animationOccurred = false;
  const sceneTime = frameState.time;
  const model = this._model;

  for (let i = 0; i < length; ++i) {
    const runtimeAnimation = runtimeAnimations[i];

    if (!defined(runtimeAnimation._computedStartTime)) {
      runtimeAnimation._computedStartTime = JulianDate.addSeconds(
        defaultValue(runtimeAnimation.startTime, sceneTime),
        runtimeAnimation.delay,
        new JulianDate(),
      );
    }

    if (!defined(runtimeAnimation._duration)) {
      runtimeAnimation._duration =
        runtimeAnimation.localStopTime * (1.0 / runtimeAnimation.multiplier);
    }

    const startTime = runtimeAnimation._computedStartTime;
    const duration = runtimeAnimation._duration;
    const stopTime = runtimeAnimation.stopTime;

    const pastStartTime = JulianDate.lessThanOrEquals(startTime, sceneTime);
    const reachedStopTime =
      defined(stopTime) && JulianDate.greaterThan(sceneTime, stopTime);

    // [0.0, 1.0] normalized local animation time
    let delta = 0.0;
    if (duration !== 0.0) {
      const seconds = JulianDate.secondsDifference(
        reachedStopTime ? stopTime : sceneTime,
        startTime,
      );
      delta = defined(runtimeAnimation._animationTime)
        ? runtimeAnimation._animationTime(duration, seconds)
        : seconds / duration;
    }

    // Play animation if
    // * we are after the start time or the animation is being repeated, and
    // * before the end of the animation's duration or the animation is being repeated, and
    // * we did not reach a user-provided stop time.

    const repeat =
      runtimeAnimation.loop === ModelAnimationLoop.REPEAT ||
      runtimeAnimation.loop === ModelAnimationLoop.MIRRORED_REPEAT;

    const play =
      (pastStartTime || (repeat && !defined(runtimeAnimation.startTime))) &&
      (delta <= 1.0 || repeat) &&
      !reachedStopTime;

    if (delta === runtimeAnimation._prevAnimationDelta) {
      const animationStopped =
        runtimeAnimation._state === ModelAnimationState.STOPPED;
      // no change to delta, and no change to the animation state means we can
      // skip the update this time around.
      if (play !== animationStopped) {
        continue;
      }
    }
    runtimeAnimation._prevAnimationDelta = delta;

    // If it IS, or WAS, animating...
    if (play || runtimeAnimation._state === ModelAnimationState.ANIMATING) {
      // ...transition from STOPPED to ANIMATING
      if (play && runtimeAnimation._state === ModelAnimationState.STOPPED) {
        runtimeAnimation._state = ModelAnimationState.ANIMATING;
        if (runtimeAnimation.start.numberOfListeners > 0) {
          frameState.afterRender.push(runtimeAnimation._raiseStartEvent);
        }
      }

      // Truncate to [0.0, 1.0] for repeating animations
      if (runtimeAnimation.loop === ModelAnimationLoop.REPEAT) {
        delta = delta - Math.floor(delta);
      } else if (runtimeAnimation.loop === ModelAnimationLoop.MIRRORED_REPEAT) {
        const floor = Math.floor(delta);
        const fract = delta - floor;
        // When odd use (1.0 - fract) to mirror repeat
        delta = floor % 2 === 1.0 ? 1.0 - fract : fract;
      }

      if (runtimeAnimation.reverse) {
        delta = 1.0 - delta;
      }

      let localAnimationTime = delta * duration * runtimeAnimation.multiplier;
      // Clamp in case floating-point roundoff goes outside the animation's first or last keyframe
      localAnimationTime = CesiumMath.clamp(
        localAnimationTime,
        runtimeAnimation.localStartTime,
        runtimeAnimation.localStopTime,
      );

      runtimeAnimation.animate(localAnimationTime);

      if (runtimeAnimation.update.numberOfListeners > 0) {
        runtimeAnimation._updateEventTime = localAnimationTime;
        frameState.afterRender.push(runtimeAnimation._raiseUpdateEvent);
      }
      animationOccurred = true;

      if (!play) {
        // transition from ANIMATING to STOPPED
        runtimeAnimation._state = ModelAnimationState.STOPPED;
        if (runtimeAnimation.stop.numberOfListeners > 0) {
          frameState.afterRender.push(runtimeAnimation._raiseStopEvent);
        }

        if (runtimeAnimation.removeOnStop) {
          animationsToRemove.push(runtimeAnimation);
        }
      }
    }
  }

  // Remove animations that stopped
  length = animationsToRemove.length;
  for (let j = 0; j < length; ++j) {
    const animationToRemove = animationsToRemove[j];
    runtimeAnimations.splice(runtimeAnimations.indexOf(animationToRemove), 1);
    frameState.afterRender.push(
      createAnimationRemovedFunction(this, model, animationToRemove),
    );
  }
  animationsToRemove.length = 0;

  return animationOccurred;
};

export default ModelAnimationCollection;
