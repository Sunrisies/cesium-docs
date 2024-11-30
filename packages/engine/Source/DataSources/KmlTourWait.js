import defined from "../Core/defined.js";
/**
 * 暂停 KmlTour 指定的秒数。
 *
 * @alias KmlTourWait
 * @constructor
 *
 * @param {number} duration 条目持续时间
 *
 * @see KmlTour
 * @see KmlTourFlyTo
 */

function KmlTourWait(duration) {
  this.type = "KmlTourWait";
  this.blocking = true;
  this.duration = duration;

  this.timeout = null;
}

/**
 * 播放此播放列表条目
 *
 * @param {KmlTourWait.DoneCallback} done 播放结束时将被调用的函数
 */

KmlTourWait.prototype.play = function (done) {
  const self = this;
  this.activeCallback = done;
  this.timeout = setTimeout(function () {
    delete self.activeCallback;
    done(false);
  }, this.duration * 1000);
};

/**
 * 停止当前条目的执行，取消当前的超时
 */

KmlTourWait.prototype.stop = function () {
  clearTimeout(this.timeout);
  if (defined(this.activeCallback)) {
    this.activeCallback(true);
  }
};

/**
 * 播放结束时将被调用的函数。
 *
 * @callback KmlTourWait.DoneCallback
 * @param {boolean} terminated 如果在条目播放完成之前调用了 {@link KmlTourWait#stop}，则为 true。
 */

export default KmlTourWait;
