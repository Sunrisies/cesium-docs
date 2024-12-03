import DeveloperError from "../Core/DeveloperError.js";

/**
 * 定义可视化器的接口。可视化器是{@link DataSourceDisplay}的插件，用于渲染与
 * {@link DataSource} 实例相关的数据。
 * 此对象仅用于文档目的，不打算直接实例化。
 * @alias Visualizer
 * @constructor
 *
 * @see BillboardVisualizer
 * @see LabelVisualizer
 * @see ModelVisualizer
 * @see PathVisualizer
 * @see PointVisualizer
 * @see GeometryVisualizer
 */
function Visualizer() {
  DeveloperError.throwInstantiationError();
}

/**
 * 更新可视化到提供的时间。
 * @function
 *
 * @param {JulianDate} time 时间。
 *
 * @returns {boolean} 如果显示已更新到提供的时间，则为true；
 * 否则如果可视化器正在等待异步操作完成才能更新数据，则为false。
 */
Visualizer.prototype.update = DeveloperError.throwInstantiationError;

/**
 * 计算一个包围球，它包含为指定实体生成的可视化内容。
 * 包围球在场景的固定框架中。
 *
 * @param {Entity} entity 要计算其包围球的实体。
 * @param {BoundingSphere} result 用于存储结果的包围球。
 * @returns {BoundingSphereState} 如果结果包含包围球，则返回 BoundingSphereState.DONE，
 *                       如果结果仍在计算中，则返回 BoundingSphereState.PENDING，或者
 *                       如果该实体在当前场景中没有可视化，则返回 BoundingSphereState.FAILED。
 * @private
 */
Visualizer.prototype.getBoundingSphere = DeveloperError.throwInstantiationError;

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 * @function
 *
 * @returns {boolean} 如果此对象已被销毁，则为true；否则为false。
 */
Visualizer.prototype.isDestroyed = DeveloperError.throwInstantiationError;

/**
 * 移除所有可视化并清理与此实例关联的任何资源。
 * @function
 */
Visualizer.prototype.destroy = DeveloperError.throwInstantiationError;
export default Visualizer;
