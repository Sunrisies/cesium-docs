/**
 * 关于应该被拾取的元数据信息。
 *
 * 这在 `Scene.pickMetadata` 函数中初始化，并传递给
 * `FrameState`。它用于配置绘制命令，将元数据值渲染
 * 到拾取帧缓冲区中。原始值从该缓冲区读取，然后使用
 * 存储在这里的元数据 `classProperty` 的结构信息，转换回
 * 正确的元数据值，使用 `Picking.pickMetadata`。
 *
 * @private
 */

function PickedMetadataInfo(schemaId, className, propertyName, classProperty) {
  /**
   * 可选的元数据架构 ID
   *
   * @type {string|undefined}
   */
  this.schemaId = schemaId;
  /**
   * 元数据类的名称
   *
   * @type {string}
   */
  this.className = className;
  /**
   * 元数据属性的名称
   *
   * @type {string}
   */
  this.propertyName = propertyName;
  /**
   * 可选的元数据架构 ID
   *
   * @type {MetadataClassProperty}
   */

  this.classProperty = classProperty;
}
export default PickedMetadataInfo;
