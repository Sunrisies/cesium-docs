import Cartesian2 from "../Core/Cartesian2.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import KeyboardEventModifier from "../Core/KeyboardEventModifier.js";
import CesiumMath from "../Core/Math.js";
import ScreenSpaceEventHandler from "../Core/ScreenSpaceEventHandler.js";
import ScreenSpaceEventType from "../Core/ScreenSpaceEventType.js";
import CameraEventType from "./CameraEventType.js";

function getKey(type, modifier) {
  let key = `${type}`;
  if (defined(modifier)) {
    key += `+${modifier}`;
  }
  return key;
}

function clonePinchMovement(pinchMovement, result) {
  Cartesian2.clone(
    pinchMovement.distance.startPosition,
    result.distance.startPosition,
  );
  Cartesian2.clone(
    pinchMovement.distance.endPosition,
    result.distance.endPosition,
  );

  Cartesian2.clone(
    pinchMovement.angleAndHeight.startPosition,
    result.angleAndHeight.startPosition,
  );
  Cartesian2.clone(
    pinchMovement.angleAndHeight.endPosition,
    result.angleAndHeight.endPosition,
  );
}

function listenToPinch(aggregator, modifier, canvas) {
  const key = getKey(CameraEventType.PINCH, modifier);

  const update = aggregator._update;
  const isDown = aggregator._isDown;
  const eventStartPosition = aggregator._eventStartPosition;
  const pressTime = aggregator._pressTime;
  const releaseTime = aggregator._releaseTime;

  update[key] = true;
  isDown[key] = false;
  eventStartPosition[key] = new Cartesian2();

  let movement = aggregator._movement[key];
  if (!defined(movement)) {
    movement = aggregator._movement[key] = {};
  }

  movement.distance = {
    startPosition: new Cartesian2(),
    endPosition: new Cartesian2(),
  };
  movement.angleAndHeight = {
    startPosition: new Cartesian2(),
    endPosition: new Cartesian2(),
  };
  movement.prevAngle = 0.0;

  aggregator._eventHandler.setInputAction(
    function (event) {
      aggregator._buttonsDown++;
      isDown[key] = true;
      pressTime[key] = new Date();
      // Compute center position and store as start point.
      Cartesian2.lerp(
        event.position1,
        event.position2,
        0.5,
        eventStartPosition[key],
      );
    },
    ScreenSpaceEventType.PINCH_START,
    modifier,
  );

  aggregator._eventHandler.setInputAction(
    function () {
      aggregator._buttonsDown = Math.max(aggregator._buttonsDown - 1, 0);
      isDown[key] = false;
      releaseTime[key] = new Date();
    },
    ScreenSpaceEventType.PINCH_END,
    modifier,
  );

  aggregator._eventHandler.setInputAction(
    function (mouseMovement) {
      if (isDown[key]) {
        // Aggregate several input events into a single animation frame.
        if (!update[key]) {
          Cartesian2.clone(
            mouseMovement.distance.endPosition,
            movement.distance.endPosition,
          );
          Cartesian2.clone(
            mouseMovement.angleAndHeight.endPosition,
            movement.angleAndHeight.endPosition,
          );
        } else {
          clonePinchMovement(mouseMovement, movement);
          update[key] = false;
          movement.prevAngle = movement.angleAndHeight.startPosition.x;
        }
        // Make sure our aggregation of angles does not "flip" over 360 degrees.
        let angle = movement.angleAndHeight.endPosition.x;
        const prevAngle = movement.prevAngle;
        const TwoPI = Math.PI * 2;
        while (angle >= prevAngle + Math.PI) {
          angle -= TwoPI;
        }
        while (angle < prevAngle - Math.PI) {
          angle += TwoPI;
        }
        movement.angleAndHeight.endPosition.x =
          (-angle * canvas.clientWidth) / 12;
        movement.angleAndHeight.startPosition.x =
          (-prevAngle * canvas.clientWidth) / 12;
      }
    },
    ScreenSpaceEventType.PINCH_MOVE,
    modifier,
  );
}

function listenToWheel(aggregator, modifier) {
  const key = getKey(CameraEventType.WHEEL, modifier);

  const pressTime = aggregator._pressTime;
  const releaseTime = aggregator._releaseTime;

  const update = aggregator._update;
  update[key] = true;

  let movement = aggregator._movement[key];
  if (!defined(movement)) {
    movement = aggregator._movement[key] = {};
  }

  let lastMovement = aggregator._lastMovement[key];
  if (!defined(lastMovement)) {
    lastMovement = aggregator._lastMovement[key] = {
      startPosition: new Cartesian2(),
      endPosition: new Cartesian2(),
      valid: false,
    };
  }

  movement.startPosition = new Cartesian2();
  Cartesian2.clone(Cartesian2.ZERO, movement.startPosition);
  movement.endPosition = new Cartesian2();

  aggregator._eventHandler.setInputAction(
    function (delta) {
      const arcLength = 7.5 * CesiumMath.toRadians(delta);
      pressTime[key] = releaseTime[key] = new Date();
      movement.endPosition.x = 0.0;
      movement.endPosition.y = arcLength;
      Cartesian2.clone(movement.endPosition, lastMovement.endPosition);
      lastMovement.valid = true;
      update[key] = false;
    },
    ScreenSpaceEventType.WHEEL,
    modifier,
  );
}

function listenMouseButtonDownUp(aggregator, modifier, type) {
  const key = getKey(type, modifier);

  const isDown = aggregator._isDown;
  const eventStartPosition = aggregator._eventStartPosition;
  const pressTime = aggregator._pressTime;

  isDown[key] = false;
  eventStartPosition[key] = new Cartesian2();

  let lastMovement = aggregator._lastMovement[key];
  if (!defined(lastMovement)) {
    lastMovement = aggregator._lastMovement[key] = {
      startPosition: new Cartesian2(),
      endPosition: new Cartesian2(),
      valid: false,
    };
  }

  let down;
  let up;
  if (type === CameraEventType.LEFT_DRAG) {
    down = ScreenSpaceEventType.LEFT_DOWN;
    up = ScreenSpaceEventType.LEFT_UP;
  } else if (type === CameraEventType.RIGHT_DRAG) {
    down = ScreenSpaceEventType.RIGHT_DOWN;
    up = ScreenSpaceEventType.RIGHT_UP;
  } else if (type === CameraEventType.MIDDLE_DRAG) {
    down = ScreenSpaceEventType.MIDDLE_DOWN;
    up = ScreenSpaceEventType.MIDDLE_UP;
  }

  aggregator._eventHandler.setInputAction(
    function (event) {
      aggregator._buttonsDown++;
      lastMovement.valid = false;
      isDown[key] = true;
      pressTime[key] = new Date();
      Cartesian2.clone(event.position, eventStartPosition[key]);
    },
    down,
    modifier,
  );

  aggregator._eventHandler.setInputAction(
    function () {
      cancelMouseDownAction(getKey(type, undefined), aggregator);
      for (const modifier of Object.values(KeyboardEventModifier)) {
        const cancelKey = getKey(type, modifier);
        cancelMouseDownAction(cancelKey, aggregator);
      }
    },
    up,
    modifier,
  );
}

function cancelMouseDownAction(cancelKey, aggregator) {
  const releaseTime = aggregator._releaseTime;
  const isDown = aggregator._isDown;
  if (isDown[cancelKey]) {
    aggregator._buttonsDown = Math.max(aggregator._buttonsDown - 1, 0);
  }
  isDown[cancelKey] = false;
  releaseTime[cancelKey] = new Date();
}

function cloneMouseMovement(mouseMovement, result) {
  Cartesian2.clone(mouseMovement.startPosition, result.startPosition);
  Cartesian2.clone(mouseMovement.endPosition, result.endPosition);
}

function refreshMouseDownStatus(type, modifier, aggregator) {
  // first: Judge if the mouse is pressed
  const isDown = aggregator._isDown;
  let anyButtonIsDown = false;
  const currentKey = getKey(type, modifier);
  for (const [downKey, downValue] of Object.entries(isDown)) {
    if (downKey.startsWith(type) && downValue && downKey !== currentKey) {
      anyButtonIsDown = true;
      cancelMouseDownAction(downKey, aggregator);
    }
  }

  if (!anyButtonIsDown) {
    return;
  }

  // second: If it is pressed, it will be transferred to the current modifier.
  const pressTime = aggregator._pressTime;
  let lastMovement = aggregator._lastMovement[currentKey];
  if (!defined(lastMovement)) {
    lastMovement = aggregator._lastMovement[currentKey] = {
      startPosition: new Cartesian2(),
      endPosition: new Cartesian2(),
      valid: false,
    };
  }
  aggregator._buttonsDown++;
  lastMovement.valid = false;
  isDown[currentKey] = true;
  pressTime[currentKey] = new Date();
}

function listenMouseMove(aggregator, modifier) {
  const update = aggregator._update;
  const movement = aggregator._movement;
  const lastMovement = aggregator._lastMovement;
  const isDown = aggregator._isDown;

  for (const typeName in CameraEventType) {
    if (CameraEventType.hasOwnProperty(typeName)) {
      const type = CameraEventType[typeName];
      if (defined(type)) {
        const key = getKey(type, modifier);
        update[key] = true;

        if (!defined(aggregator._lastMovement[key])) {
          aggregator._lastMovement[key] = {
            startPosition: new Cartesian2(),
            endPosition: new Cartesian2(),
            valid: false,
          };
        }

        if (!defined(aggregator._movement[key])) {
          aggregator._movement[key] = {
            startPosition: new Cartesian2(),
            endPosition: new Cartesian2(),
          };
        }
      }
    }
  }

  aggregator._eventHandler.setInputAction(
    function (mouseMovement) {
      for (const typeName in CameraEventType) {
        if (CameraEventType.hasOwnProperty(typeName)) {
          const type = CameraEventType[typeName];
          if (defined(type)) {
            const key = getKey(type, modifier);
            refreshMouseDownStatus(type, modifier, aggregator);
            if (isDown[key]) {
              if (!update[key]) {
                Cartesian2.clone(
                  mouseMovement.endPosition,
                  movement[key].endPosition,
                );
              } else {
                cloneMouseMovement(movement[key], lastMovement[key]);
                lastMovement[key].valid = true;
                cloneMouseMovement(mouseMovement, movement[key]);
                update[key] = false;
              }
            }
          }
        }
      }

      Cartesian2.clone(
        mouseMovement.endPosition,
        aggregator._currentMousePosition,
      );
    },
    ScreenSpaceEventType.MOUSE_MOVE,
    modifier,
  );
}

/**
 * 聚合输入事件。例如，假设在帧之间接收到以下输入：
 * 左键按下、鼠标移动、鼠标移动、左键抬起。这些事件将被聚合成
 * 一个事件，包含鼠标的起始和结束位置。
 *
 * @alias CameraEventAggregator
 * @constructor
 *
 * @param {HTMLCanvasElement} [canvas=document] 处理事件的元素。
 *
 * @see ScreenSpaceEventHandler
 */

function CameraEventAggregator(canvas) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(canvas)) {
    throw new DeveloperError("canvas is required.");
  }
  //>>includeEnd('debug');

  this._eventHandler = new ScreenSpaceEventHandler(canvas);

  this._update = {};
  this._movement = {};
  this._lastMovement = {};
  this._isDown = {};
  this._eventStartPosition = {};
  this._pressTime = {};
  this._releaseTime = {};

  this._buttonsDown = 0;

  this._currentMousePosition = new Cartesian2();

  listenToWheel(this, undefined);
  listenToPinch(this, undefined, canvas);
  listenMouseButtonDownUp(this, undefined, CameraEventType.LEFT_DRAG);
  listenMouseButtonDownUp(this, undefined, CameraEventType.RIGHT_DRAG);
  listenMouseButtonDownUp(this, undefined, CameraEventType.MIDDLE_DRAG);
  listenMouseMove(this, undefined);

  for (const modifierName in KeyboardEventModifier) {
    if (KeyboardEventModifier.hasOwnProperty(modifierName)) {
      const modifier = KeyboardEventModifier[modifierName];
      if (defined(modifier)) {
        listenToWheel(this, modifier);
        listenToPinch(this, modifier, canvas);
        listenMouseButtonDownUp(this, modifier, CameraEventType.LEFT_DRAG);
        listenMouseButtonDownUp(this, modifier, CameraEventType.RIGHT_DRAG);
        listenMouseButtonDownUp(this, modifier, CameraEventType.MIDDLE_DRAG);
        listenMouseMove(this, modifier);
      }
    }
  }
}

Object.defineProperties(CameraEventAggregator.prototype, {
  /**
   * 获取当前鼠标位置。
   * @memberof CameraEventAggregator.prototype
   * @type {Cartesian2}
   */
  currentMousePosition: {
    get: function () {
      return this._currentMousePosition;
    },
  },

  /**
   * 获取是否有任何鼠标按钮被按下，是否开始了触摸，或者滚轮是否被移动。
   * @memberof CameraEventAggregator.prototype
   * @type {boolean}
   */

  anyButtonDown: {
    get: function () {
      const wheelMoved =
        !this._update[getKey(CameraEventType.WHEEL)] ||
        !this._update[
          getKey(CameraEventType.WHEEL, KeyboardEventModifier.SHIFT)
        ] ||
        !this._update[
          getKey(CameraEventType.WHEEL, KeyboardEventModifier.CTRL)
        ] ||
        !this._update[getKey(CameraEventType.WHEEL, KeyboardEventModifier.ALT)];
      return this._buttonsDown > 0 || wheelMoved;
    },
  },
});

/**
 * 检查鼠标按钮是否被按下或触摸是否已开始并已移动。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {boolean} 如果鼠标按钮被按下或触摸已开始并已移动，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

CameraEventAggregator.prototype.isMoving = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  return !this._update[key];
};

/**
 * 获取当前事件的聚合起始和结束位置。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {object} 包含两个 {@link Cartesian2} 属性的对象：<code>startPosition</code> 和 <code>endPosition</code>。
 */

CameraEventAggregator.prototype.getMovement = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  const movement = this._movement[key];
  return movement;
};

/**
 * 获取最后一次移动事件的起始和结束位置（不是聚合事件）。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {object|undefined} 包含两个 {@link Cartesian2} 属性的对象：<code>startPosition</code> 和 <code>endPosition</code>，或者返回 <code>undefined</code>。
 */

CameraEventAggregator.prototype.getLastMovement = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  const lastMovement = this._lastMovement[key];
  if (lastMovement.valid) {
    return lastMovement;
  }

  return undefined;
};

/**
 * 检查鼠标按钮是否被按下或触摸是否已开始。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {boolean} 鼠标按钮是否被按下或触摸是否已开始。
 */

CameraEventAggregator.prototype.isButtonDown = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  return this._isDown[key];
};

/**
 * 获取启动聚合时的鼠标位置。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {Cartesian2} 鼠标位置。
 */

CameraEventAggregator.prototype.getStartMousePosition = function (
  type,
  modifier,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  if (type === CameraEventType.WHEEL) {
    return this._currentMousePosition;
  }

  const key = getKey(type, modifier);
  return this._eventStartPosition[key];
};

/**
 * 获取按钮被按下或触摸开始的时间。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {Date} 按钮被按下或触摸开始的时间。
 */

CameraEventAggregator.prototype.getButtonPressTime = function (type, modifier) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  return this._pressTime[key];
};

/**
 * 获取按钮释放或触摸结束的时间。
 *
 * @param {CameraEventType} type 相机事件类型。
 * @param {KeyboardEventModifier} [modifier] 键盘修饰符。
 * @returns {Date} 按钮释放或触摸结束的时间。
 */

CameraEventAggregator.prototype.getButtonReleaseTime = function (
  type,
  modifier,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  const key = getKey(type, modifier);
  return this._releaseTime[key];
};

/**
 * 标记所有事件已被处理，聚合器应重置以处理新事件。
 */

CameraEventAggregator.prototype.reset = function () {
  for (const name in this._update) {
    if (this._update.hasOwnProperty(name)) {
      this._update[name] = true;
    }
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除 <code>isDestroyed</code> 以外的任何函数都会导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see CameraEventAggregator#destroy
 */

CameraEventAggregator.prototype.isDestroyed = function () {
  return false;
};

/**
 * 移除该对象持有的鼠标监听器。
 * <br /><br />
 * 一旦对象被销毁，就不应再使用它；调用除 <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 * 因此，应将返回值（<code>undefined</code>）分配给该对象，如示例所示。
 *
 * @exception {DeveloperError} 该对象已被销毁，即调用了 destroy()。
 *
 * @example
 * handler = handler && handler.destroy();
 *
 * @see CameraEventAggregator#isDestroyed
 */
CameraEventAggregator.prototype.destroy = function () {
  this._eventHandler = this._eventHandler && this._eventHandler.destroy();
  return destroyObject(this);
};
export default CameraEventAggregator;
