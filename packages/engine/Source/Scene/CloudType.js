/**
 * 指定添加到{@link CloudCollection}中的云的类型，使用{@link CloudCollection#add}。
 *
 * @enum {number}
 */

const CloudType = {
  /**
   * 积云。
   *
   * @type {number}
   * @constant
   */
  CUMULUS: 0,
};

/**
 * 验证提供的云类型是否为有效的{@link CloudType}
 *
 * @param {CloudType} cloudType 要验证的云类型。
 * @returns {boolean} 如果提供的云类型是有效值，则返回<code>true</code>；否则返回<code>false</code>。
 *
 * @example
 * if (!Cesium.CloudType.validate(cloudType)) {
 *   throw new Cesium.DeveloperError('cloudType必须是有效值。');
 * }
 */

CloudType.validate = function (cloudType) {
  return cloudType === CloudType.CUMULUS;
};

export default Object.freeze(CloudType);
