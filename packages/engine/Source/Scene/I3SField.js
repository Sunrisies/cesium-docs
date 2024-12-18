import defined from "../Core/defined.js";
import RuntimeError from "../Core/RuntimeError.js";

/**
 * 该类实现了 I3S 字段，这是附加到节点的自定义数据
 * @alias I3SField
 * @internalConstructor
 * @privateParam {I3SNode} parent 几何体的父节点
 * @privateParam {object} storageInfo 包含字段存储信息的结构
 */

function I3SField(parent, storageInfo) {
  this._storageInfo = storageInfo;
  this._parent = parent;
  this._dataProvider = parent._dataProvider;
  this._loadPromise = undefined;
  const uri = `attributes/${storageInfo.key}/0`;

  if (defined(this._parent._nodeIndex)) {
    this._resource = this._parent._layer.resource.getDerivedResource({
      url: `nodes/${this._parent._data.mesh.attribute.resource}/${uri}`,
    });
  } else {
    this._resource = this._parent.resource.getDerivedResource({ url: uri });
  }
}

Object.defineProperties(I3SField.prototype, {
  /**
   * 获取字段的资源
   * @memberof I3SField.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },
  /**
   * 获取此字段的头部信息。
   * @memberof I3SField.prototype
   * @type {object}
   * @readonly
   */
  header: {
    get: function () {
      return this._header;
    },
  },
  /**
   * 获取此字段的值。
   * @memberof I3SField.prototype
   * @type {object}
   * @readonly
   */
  values: {
    get: function () {
      if (defined(this._values)) {
        // 属性数据可以存储为值或对象标识符
        if (defined(this._values.attributeValues)) {
          return this._values.attributeValues;
        }
        if (defined(this._values.objectIds)) {
          return this._values.objectIds;
        }
      }
      return [];
    },
  },
  /**
   * 获取字段的名称。
   * @memberof I3SField.prototype
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._storageInfo.name;
    },
  },
});


function getNumericTypeSize(type) {
  if (type === "UInt8" || type === "Int8") {
    return 1;
  } else if (type === "UInt16" || type === "Int16") {
    return 2;
  } else if (
    type === "UInt32" ||
    type === "Int32" ||
    type === "Oid32" ||
    type === "Float32"
  ) {
    return 4;
  } else if (type === "UInt64" || type === "Int64" || type === "Float64") {
    return 8;
  }

  // Not a numeric type
  return 0;
}

function getValueTypeSize(type) {
  if (type === "String") {
    return 1;
  }
  return getNumericTypeSize(type);
}

async function load(field) {
  const data = await field._dataProvider._loadBinary(field._resource);
  const dataView = new DataView(data);
  field._data = data;
  field._validateHeader(dataView);
  const headerSize = field._parseHeader(dataView);
  const offset = field._getBodyOffset(headerSize);
  field._validateBody(dataView, offset);
  field._parseBody(dataView, offset);
}

/**
 * 加载内容。
 * @returns {Promise<void>} 当字段数据加载完成时解析的 Promise
 */

I3SField.prototype.load = function () {
  if (defined(this._loadPromise)) {
    return this._loadPromise;
  }

  this._loadPromise = load(this).catch(function (error) {
    console.error(error);
  });
  return this._loadPromise;
};

/**
 * @private
 */
I3SField.prototype._parseValue = function (dataView, type, offset) {
  let value;
  if (type === "UInt8") {
    value = dataView.getUint8(offset);
    offset += 1;
  } else if (type === "Int8") {
    value = dataView.getInt8(offset);
    offset += 1;
  } else if (type === "UInt16") {
    value = dataView.getUint16(offset, true);
    offset += 2;
  } else if (type === "Int16") {
    value = dataView.getInt16(offset, true);
    offset += 2;
  } else if (type === "UInt32") {
    value = dataView.getUint32(offset, true);
    offset += 4;
  } else if (type === "Oid32") {
    value = dataView.getUint32(offset, true);
    offset += 4;
  } else if (type === "Int32") {
    value = dataView.getInt32(offset, true);
    offset += 4;
  } else if (type === "UInt64") {
    const left = dataView.getUint32(offset, true);
    const right = dataView.getUint32(offset + 4, true);
    value = left + Math.pow(2, 32) * right;
    offset += 8;
  } else if (type === "Int64") {
    const left = dataView.getUint32(offset, true);
    const right = dataView.getUint32(offset + 4, true);
    if (right < Math.pow(2, 31)) {
      // Positive number
      value = left + Math.pow(2, 32) * right;
    } else {
      // Negative
      value = left + Math.pow(2, 32) * (right - Math.pow(2, 32));
    }

    offset += 8;
  } else if (type === "Float32") {
    value = dataView.getFloat32(offset, true);
    offset += 4;
  } else if (type === "Float64") {
    value = dataView.getFloat64(offset, true);
    offset += 8;
  } else if (type === "String") {
    value = String.fromCharCode(dataView.getUint8(offset));
    offset += 1;
  }

  return {
    value: value,
    offset: offset,
  };
};

/**
 * @private
 */
I3SField.prototype._parseHeader = function (dataView) {
  let offset = 0;
  this._header = {};
  for (
    let itemIndex = 0;
    itemIndex < this._storageInfo.header.length;
    itemIndex++
  ) {
    const item = this._storageInfo.header[itemIndex];
    const parsedValue = this._parseValue(dataView, item.valueType, offset);
    this._header[item.property] = parsedValue.value;
    offset = parsedValue.offset;
  }
  return offset;
};

/**
 * @private
 */
I3SField.prototype._parseBody = function (dataView, offset) {
  this._values = {};
  for (
    let itemIndex = 0;
    itemIndex < this._storageInfo.ordering.length;
    itemIndex++
  ) {
    const orderingValue = this._storageInfo.ordering[itemIndex];
    // all strings in the ordering array correspond to the property name, except ObjectIds
    const item = orderingValue === "ObjectIds" ? "objectIds" : orderingValue;
    const desc = this._storageInfo[item];
    if (defined(desc)) {
      this._values[item] = [];
      for (let index = 0; index < this._header.count; ++index) {
        if (desc.valueType !== "String") {
          const parsedValue = this._parseValue(
            dataView,
            desc.valueType,
            offset,
          );
          this._values[item].push(parsedValue.value);
          offset = parsedValue.offset;
        } else {
          const stringLen = this._values.attributeByteCounts[index];
          let stringContent = "";
          for (let cIndex = 0; cIndex < stringLen; ++cIndex) {
            const curParsedValue = this._parseValue(
              dataView,
              desc.valueType,
              offset,
            );
            if (curParsedValue.value.charCodeAt(0) !== 0) {
              stringContent += curParsedValue.value;
            }
            offset = curParsedValue.offset;
          }
          // We skip the last character of the string since it's a null terminator
          this._values[item].push(stringContent);
        }
      }
    }
  }
};

/**
 * @private
 */
I3SField.prototype._getBodyOffset = function (headerSize) {
  let valueSize = 0;
  if (defined(this._storageInfo.attributeValues)) {
    valueSize = getNumericTypeSize(this._storageInfo.attributeValues.valueType);
  } else if (defined(this._storageInfo.objectIds)) {
    valueSize = getNumericTypeSize(this._storageInfo.objectIds.valueType);
  }
  if (valueSize > 0) {
    // Values will be padded to align the addresses with the data size
    return Math.ceil(headerSize / valueSize) * valueSize;
  }
  return headerSize;
};

/**
 * @private
 */
I3SField.prototype._validateHeader = function (dataView) {
  let headerSize = 0;
  for (
    let itemIndex = 0;
    itemIndex < this._storageInfo.header.length;
    itemIndex++
  ) {
    const item = this._storageInfo.header[itemIndex];
    headerSize += getValueTypeSize(item.valueType);
  }
  if (dataView.byteLength < headerSize) {
    throw new RuntimeError(
      `Invalid attribute buffer size (field: ${this.name}, header: ${headerSize}, actual: ${dataView.byteLength})`,
    );
  }
};

/**
 * @private
 */
I3SField.prototype._validateBody = function (dataView, offset) {
  if (!defined(this._header.count)) {
    throw new RuntimeError(
      `Invalid attribute buffer (field: ${this.name}, count is missing)`,
    );
  }
  let attributeByteCountsOffset;
  for (
    let itemIndex = 0;
    itemIndex < this._storageInfo.ordering.length &&
    offset < dataView.byteLength;
    itemIndex++
  ) {
    const orderingValue = this._storageInfo.ordering[itemIndex];
    // all strings in the ordering array correspond to the property name, except ObjectIds
    const item = orderingValue === "ObjectIds" ? "objectIds" : orderingValue;
    const desc = this._storageInfo[item];
    if (defined(desc)) {
      if (desc.valueType !== "String") {
        if (item === "attributeByteCounts") {
          attributeByteCountsOffset = offset;
        }
        const valueSize = getNumericTypeSize(desc.valueType);
        offset += valueSize * this._header.count;
      } else {
        if (!defined(attributeByteCountsOffset)) {
          throw new RuntimeError(
            `Invalid attribute buffer (field: ${this.name}, attributeByteCounts is missing)`,
          );
        }
        for (
          let index = 0;
          index < this._header.count && offset < dataView.byteLength;
          ++index
        ) {
          const parsedValue = this._parseValue(
            dataView,
            this._storageInfo.attributeByteCounts.valueType,
            attributeByteCountsOffset,
          );
          offset += parsedValue.value;
          attributeByteCountsOffset = parsedValue.offset;
        }
      }
    } else {
      throw new RuntimeError(
        `Invalid attribute buffer (field: ${this.name}, ${item} is missing)`,
      );
    }
  }
  if (dataView.byteLength < offset) {
    throw new RuntimeError(
      `Invalid attribute buffer size (field: ${this.name}, expected: ${offset}, actual: ${dataView.byteLength})`,
    );
  }
};

export default I3SField;
