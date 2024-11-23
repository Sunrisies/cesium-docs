import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义数据源的接口，将任意数据转换为 {@link EntityCollection} 以供通用使用。此对象仅用于文档目的，并不打算直接实例化。
 * @alias DataSource
 * @constructor
 *
 * @see Entity
 * @see DataSourceDisplay
 */
function DataSource() {
  DeveloperError.throwInstantiationError();
}

Object.defineProperties(DataSource.prototype, {
  /**
   * 获取此实例的人类可读名称。
   * @memberof DataSource.prototype
   * @type {string}
   */
  name: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取此数据源的首选时钟设置。
   * @memberof DataSource.prototype
   * @type {DataSourceClock}
   */
  clock: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取 {@link Entity} 实例的集合。
   * @memberof DataSource.prototype
   * @type {EntityCollection}
   */
  entities: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取一个值，指示数据源当前是否正在加载数据。
   * @memberof DataSource.prototype
   * @type {boolean}
   */
  isLoading: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取一个事件，当基础数据更改时，将触发该事件。
   * @memberof DataSource.prototype
   * @type {Event}
   */
  changedEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取一个事件，当处理过程中遇到错误时，将触发该事件。
   * @memberof DataSource.prototype
   * @type {Event<function(this, RequestErrorEvent)>}
   */
  errorEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取一个事件，当 isLoading 的值发生变化时，将触发该事件。
   * @memberof DataSource.prototype
   * @type {Event<function(this, boolean)>}
   */
  loadingEvent: {
    get: DeveloperError.throwInstantiationError,
  },
  
  /**
   * 获取或设置此数据源是否应显示的状态。
   * @memberof DataSource.prototype
   * @type {boolean}
   */
  show: {
    get: DeveloperError.throwInstantiationError,
  },

  /**
   * 获取或设置此数据源的聚类选项。该对象可以在多个数据源之间共享。
   *
   * @memberof DataSource.prototype
   * @type {EntityCluster}
   */
  clustering: {
    get: DeveloperError.throwInstantiationError,
  },
});

/**
 * 将数据源更新到提供的时间。此函数是可选的，并不要求实现。
 * 它提供给那些基于当前动画时间或场景状态检索数据的数据源。
 * 如果实现，update 将由 {@link DataSourceDisplay} 每帧调用一次。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果此数据源准备好在提供的时间显示，则返回 true；否则返回 false。
 */
DataSource.prototype.update = function (time) {
  DeveloperError.throwInstantiationError();
};

/**
 * @private
 */
DataSource.setLoading = function (dataSource, isLoading) {
  if (dataSource._isLoading !== isLoading) {
    if (isLoading) {
      dataSource._entityCollection.suspendEvents();
    } else {
      dataSource._entityCollection.resumeEvents();
    }
    dataSource._isLoading = isLoading;
    dataSource._loading.raiseEvent(dataSource, isLoading);
  }
};
export default DataSource;
