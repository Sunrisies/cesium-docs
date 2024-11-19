import AttributeCompression from "../Core/AttributeCompression.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Intersect from "../Core/Intersect.js";
import Matrix4 from "../Core/Matrix4.js";
import PixelFormat from "../Core/PixelFormat.js";
import Plane from "../Core/Plane.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import Sampler from "../Renderer/Sampler.js";
import Texture from "../Renderer/Texture.js";
import ClippingPlane from "./ClippingPlane.js";

/**
 * 指定一组裁剪平面。裁剪平面选择性地禁用对单个gltf模型、3D Tileset或地球的外部区域的渲染。
 * <p>
 * 通常情况下，裁剪平面的坐标是相对于它们所附加的对象的，因此距离设置为0的平面将裁剪穿过对象的中心。
 * </p>
 * <p>
 * 对于3D Tiles，使用根瓦片的变换来定位裁剪平面。如果未定义变换，则使用根瓦片的{@link Cesium3DTile#boundingSphere}。
 * </p>
 *
 * @alias ClippingPlaneCollection
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {ClippingPlane[]} [options.planes=[]] 用于选择性地禁用每个平面外部区域渲染的{@link ClippingPlane}对象数组。
 * @param {boolean} [options.enabled=true] 确定裁剪平面是否处于活动状态。
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 指定相对于裁剪平面原始坐标系统的附加变换的4x4变换矩阵。
 * @param {boolean} [options.unionClippingRegions=false] 如果为true，则如果区域位于集合中任何平面的外部，则该区域将被裁剪。否则，只有当区域位于所有平面的外部时，才会被裁剪。
 * @param {Color} [options.edgeColor=Color.WHITE] 应用于突出显示对象被裁剪的边缘的颜色。
 * @param {number} [options.edgeWidth=0.0] 应用于突出显示对象被裁剪的边缘的宽度，以像素为单位。
 *
 * @demo {@link https://sandcastle.cesium.com/?src=3D%20Tiles%20Clipping%20Planes.html|裁剪3D Tiles和glTF模型。}
 * @demo {@link https://sandcastle.cesium.com/?src=Terrain%20Clipping%20Planes.html|裁剪地球。}
 * 
 * @example
 * // This clipping plane's distance is positive, which means its normal
 * // is facing the origin. This will clip everything that is behind
 * // the plane, which is anything with y coordinate < -5.
 * const clippingPlanes = new Cesium.ClippingPlaneCollection({
 *     planes : [
 *         new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), 5.0)
 *     ],
 * });
 * // Create an entity and attach the ClippingPlaneCollection to the model.
 * const entity = viewer.entities.add({
 *     position : Cesium.Cartesian3.fromDegrees(-123.0744619, 44.0503706, 10000),
 *     model : {
 *         uri : 'model.gltf',
 *         minimumPixelSize : 128,
 *         maximumScale : 20000,
 *         clippingPlanes : clippingPlanes
 *     }
 * });
 * viewer.zoomTo(entity);
 */
function ClippingPlaneCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._planes = [];

  // Do partial texture updates if just one plane is dirty.
  // If many planes are dirty, refresh the entire texture.
  this._dirtyIndex = -1;
  this._multipleDirtyPlanes = false;

  this._enabled = defaultValue(options.enabled, true);

  /**
   * 指定相对于裁剪平面原始坐标系统的附加变换的4x4变换矩阵。
   *
   * @type {Matrix4}
   * @default Matrix4.IDENTITY
   */

  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );

  /**
   * 应用于突出显示对象被裁剪的边缘的颜色。
   *
   * @type {Color}
   * @default Color.WHITE
   */

  this.edgeColor = Color.clone(defaultValue(options.edgeColor, Color.WHITE));

  /**
   * 应用于突出显示对象被裁剪的边缘的宽度，以像素为单位。
   *
   * @type {number}
   * @default 0.0
   */

  this.edgeWidth = defaultValue(options.edgeWidth, 0.0);

  /**
   * 当新裁剪平面被添加到集合中时触发的事件。事件处理程序会传递新平面及其被添加的索引。
   * @type {Event}
   * @default Event()
   */

  this.planeAdded = new Event();

  /**
   * 当新裁剪平面从集合中移除时触发的事件。事件处理程序会传递被移除的平面及其被移除的索引。
   * @type {Event}
   * @default Event()
   */

  this.planeRemoved = new Event();

  // If this ClippingPlaneCollection has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference the tileset's ClippingPlaneCollection.
  this._owner = undefined;

  const unionClippingRegions = defaultValue(
    options.unionClippingRegions,
    false,
  );
  this._unionClippingRegions = unionClippingRegions;
  this._testIntersection = unionClippingRegions
    ? unionIntersectFunction
    : defaultIntersectFunction;

  this._uint8View = undefined;
  this._float32View = undefined;

  this._clippingPlanesTexture = undefined;

  // Add each ClippingPlane object.
  const planes = options.planes;
  if (defined(planes)) {
    const planesLength = planes.length;
    for (let i = 0; i < planesLength; ++i) {
      this.add(planes[i]);
    }
  }
}

function unionIntersectFunction(value) {
  return value === Intersect.OUTSIDE;
}

function defaultIntersectFunction(value) {
  return value === Intersect.INSIDE;
}

Object.defineProperties(ClippingPlaneCollection.prototype, {
  /**
   * 返回此集合中的平面数量。通常与{@link ClippingPlaneCollection#get}一起使用，以遍历集合中的所有平面。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {number}
   * @readonly
   */

  length: {
    get: function () {
      return this._planes.length;
    },
  },

  /**
   * 如果为true，则如果区域位于集合中任何平面的外部，则该区域将被裁剪。否则，只有当区域位于所有平面的外部时，才会被裁剪。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {boolean}
   * @default false
   */

  unionClippingRegions: {
    get: function () {
      return this._unionClippingRegions;
    },
    set: function (value) {
      if (this._unionClippingRegions === value) {
        return;
      }
      this._unionClippingRegions = value;
      this._testIntersection = value
        ? unionIntersectFunction
        : defaultIntersectFunction;
    },
  },

  /**
   * 如果为true，裁剪将被启用。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {boolean}
   * @default true
   */

  enabled: {
    get: function () {
      return this._enabled;
    },
    set: function (value) {
      if (this._enabled === value) {
        return;
      }
      this._enabled = value;
    },
  },

  /**
   * 返回包含打包的、未变换的裁剪平面的纹理。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */

  texture: {
    get: function () {
      return this._clippingPlanesTexture;
    },
  },

  /**
   * 对ClippingPlaneCollection所有者的引用（如果有）。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @readonly
   * @private
   */

  owner: {
    get: function () {
      return this._owner;
    },
  },

  /**
   * 返回一个封装此ClippingPlaneCollection状态的数字。
   *
   * 裁剪模式编码在数字的符号中，该符号仅是平面计数。
   * 如果此值发生变化，则需要重新生成着色器。
   *
   * @memberof ClippingPlaneCollection.prototype
   * @returns {number} 描述ClippingPlaneCollection状态的数字。
   * @readonly
   * @private
   */

  clippingPlanesState: {
    get: function () {
      return this._unionClippingRegions
        ? this._planes.length
        : -this._planes.length;
    },
  },
});

function setIndexDirty(collection, index) {
  // If there's already a different _dirtyIndex set, more than one plane has changed since update.
  // Entire texture must be reloaded
  collection._multipleDirtyPlanes =
    collection._multipleDirtyPlanes ||
    (collection._dirtyIndex !== -1 && collection._dirtyIndex !== index);
  collection._dirtyIndex = index;
}

/**
 * 将指定的{@link ClippingPlane}添加到集合中，以选择性地禁用每个平面外部区域的渲染。使用{@link ClippingPlaneCollection#unionClippingRegions}修改多个平面的裁剪行为。
 *
 * @param {ClippingPlane} plane 要添加到集合中的ClippingPlane。
 *
 * @see ClippingPlaneCollection#unionClippingRegions
 * @see ClippingPlaneCollection#remove
 * @see ClippingPlaneCollection#removeAll
 */

ClippingPlaneCollection.prototype.add = function (plane) {
  const newPlaneIndex = this._planes.length;

  const that = this;
  plane.onChangeCallback = function (index) {
    setIndexDirty(that, index);
  };
  plane.index = newPlaneIndex;

  setIndexDirty(this, newPlaneIndex);
  this._planes.push(plane);
  this.planeAdded.raiseEvent(plane, newPlaneIndex);
};

/**
 * 返回集合中指定索引处的平面。索引从零开始，随着平面的添加而增加。移除平面会将该平面之后的所有平面向左移动，改变它们的索引。此函数通常与{@link ClippingPlaneCollection#length}一起使用，以遍历集合中的所有平面。
 *
 * @param {number} index 平面的零基索引。
 * @returns {ClippingPlane} 指定索引处的ClippingPlane。
 *
 * @see ClippingPlaneCollection#length
 */

ClippingPlaneCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  return this._planes[index];
};

function indexOf(planes, plane) {
  const length = planes.length;
  for (let i = 0; i < length; ++i) {
    if (Plane.equals(planes[i], plane)) {
      return i;
    }
  }

  return -1;
}

/**
 * 检查此集合是否包含与给定ClippingPlane相等的ClippingPlane。
 *
 * @param {ClippingPlane} [clippingPlane] 要检查的ClippingPlane。
 * @returns {boolean} 如果此集合包含该ClippingPlane，则返回true，否则返回false。
 *
 * @see ClippingPlaneCollection#get
 */

ClippingPlaneCollection.prototype.contains = function (clippingPlane) {
  return indexOf(this._planes, clippingPlane) !== -1;
};

/**
 * 从集合中移除给定ClippingPlane的首次出现。
 *
 * @param {ClippingPlane} clippingPlane
 * @returns {boolean} 如果平面被移除，则返回<code>true</code>；如果平面未在集合中找到，则返回<code>false</code>。
 *
 * @see ClippingPlaneCollection#add
 * @see ClippingPlaneCollection#contains
 * @see ClippingPlaneCollection#removeAll
 */

ClippingPlaneCollection.prototype.remove = function (clippingPlane) {
  const planes = this._planes;
  const index = indexOf(planes, clippingPlane);

  if (index === -1) {
    return false;
  }

  // Unlink this ClippingPlaneCollection from the ClippingPlane
  if (clippingPlane instanceof ClippingPlane) {
    clippingPlane.onChangeCallback = undefined;
    clippingPlane.index = -1;
  }

  // Shift and update indices
  const length = planes.length - 1;
  for (let i = index; i < length; ++i) {
    const planeToKeep = planes[i + 1];
    planes[i] = planeToKeep;
    if (planeToKeep instanceof ClippingPlane) {
      planeToKeep.index = i;
    }
  }

  // Indicate planes texture is dirty
  this._multipleDirtyPlanes = true;
  planes.length = length;

  this.planeRemoved.raiseEvent(clippingPlane, index);

  return true;
};

/**
 * 从集合中移除所有平面。
 *
 * @see ClippingPlaneCollection#add
 * @see ClippingPlaneCollection#remove
 */

ClippingPlaneCollection.prototype.removeAll = function () {
  // Dereference this ClippingPlaneCollection from all ClippingPlanes
  const planes = this._planes;
  const planesCount = planes.length;
  for (let i = 0; i < planesCount; ++i) {
    const plane = planes[i];
    if (plane instanceof ClippingPlane) {
      plane.onChangeCallback = undefined;
      plane.index = -1;
    }
    this.planeRemoved.raiseEvent(plane, i);
  }
  this._multipleDirtyPlanes = true;
  this._planes = [];
};

const distanceEncodeScratch = new Cartesian4();
const oct32EncodeScratch = new Cartesian4();
function packPlanesAsUint8(clippingPlaneCollection, startIndex, endIndex) {
  const uint8View = clippingPlaneCollection._uint8View;
  const planes = clippingPlaneCollection._planes;
  let byteIndex = 0;
  for (let i = startIndex; i < endIndex; ++i) {
    const plane = planes[i];

    const oct32Normal = AttributeCompression.octEncodeToCartesian4(
      plane.normal,
      oct32EncodeScratch,
    );
    uint8View[byteIndex] = oct32Normal.x;
    uint8View[byteIndex + 1] = oct32Normal.y;
    uint8View[byteIndex + 2] = oct32Normal.z;
    uint8View[byteIndex + 3] = oct32Normal.w;

    const encodedDistance = Cartesian4.packFloat(
      plane.distance,
      distanceEncodeScratch,
    );
    uint8View[byteIndex + 4] = encodedDistance.x;
    uint8View[byteIndex + 5] = encodedDistance.y;
    uint8View[byteIndex + 6] = encodedDistance.z;
    uint8View[byteIndex + 7] = encodedDistance.w;

    byteIndex += 8;
  }
}

// Pack starting at the beginning of the buffer to allow partial update
function packPlanesAsFloats(clippingPlaneCollection, startIndex, endIndex) {
  const float32View = clippingPlaneCollection._float32View;
  const planes = clippingPlaneCollection._planes;

  let floatIndex = 0;
  for (let i = startIndex; i < endIndex; ++i) {
    const plane = planes[i];
    const normal = plane.normal;

    float32View[floatIndex] = normal.x;
    float32View[floatIndex + 1] = normal.y;
    float32View[floatIndex + 2] = normal.z;
    float32View[floatIndex + 3] = plane.distance;

    floatIndex += 4; // each plane is 4 floats
  }
}

function computeTextureResolution(pixelsNeeded, result) {
  const maxSize = ContextLimits.maximumTextureSize;
  result.x = Math.min(pixelsNeeded, maxSize);
  result.y = Math.ceil(pixelsNeeded / result.x);
  return result;
}

const textureResolutionScratch = new Cartesian2();
/**
 * 当{@link Viewer}或{@link CesiumWidget}渲染场景时调用，以构建裁剪平面的资源。
 * <p>
 * 不要直接调用此函数。
 * </p>
 */

ClippingPlaneCollection.prototype.update = function (frameState) {
  let clippingPlanesTexture = this._clippingPlanesTexture;
  const context = frameState.context;
  const useFloatTexture = ClippingPlaneCollection.useFloatTexture(context);

  // Compute texture requirements for current planes
  // In RGBA FLOAT, A plane is 4 floats packed to a RGBA.
  // In RGBA UNSIGNED_BYTE, A plane is a float in [0, 1) packed to RGBA and an Oct32 quantized normal,
  // so 8 bits or 2 pixels in RGBA.
  const pixelsNeeded = useFloatTexture ? this.length : this.length * 2;

  if (defined(clippingPlanesTexture)) {
    const currentPixelCount =
      clippingPlanesTexture.width * clippingPlanesTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < pixelsNeeded ||
      pixelsNeeded < 0.25 * currentPixelCount
    ) {
      clippingPlanesTexture.destroy();
      clippingPlanesTexture = undefined;
      this._clippingPlanesTexture = undefined;
    }
  }

  // If there are no clipping planes, there's nothing to update.
  if (this.length === 0) {
    return;
  }

  if (!defined(clippingPlanesTexture)) {
    const requiredResolution = computeTextureResolution(
      pixelsNeeded,
      textureResolutionScratch,
    );
    // Allocate twice as much space as needed to avoid frequent texture reallocation.
    // Allocate in the Y direction, since texture may be as wide as context texture support.
    requiredResolution.y *= 2;

    if (useFloatTexture) {
      clippingPlanesTexture = new Texture({
        context: context,
        width: requiredResolution.x,
        height: requiredResolution.y,
        pixelFormat: PixelFormat.RGBA,
        pixelDatatype: PixelDatatype.FLOAT,
        sampler: Sampler.NEAREST,
        flipY: false,
      });
      this._float32View = new Float32Array(
        requiredResolution.x * requiredResolution.y * 4,
      );
    } else {
      clippingPlanesTexture = new Texture({
        context: context,
        width: requiredResolution.x,
        height: requiredResolution.y,
        pixelFormat: PixelFormat.RGBA,
        pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
        sampler: Sampler.NEAREST,
        flipY: false,
      });
      this._uint8View = new Uint8Array(
        requiredResolution.x * requiredResolution.y * 4,
      );
    }

    this._clippingPlanesTexture = clippingPlanesTexture;
    this._multipleDirtyPlanes = true;
  }

  const dirtyIndex = this._dirtyIndex;
  if (!this._multipleDirtyPlanes && dirtyIndex === -1) {
    return;
  }
  if (!this._multipleDirtyPlanes) {
    // partial updates possible
    let offsetX = 0;
    let offsetY = 0;
    if (useFloatTexture) {
      offsetY = Math.floor(dirtyIndex / clippingPlanesTexture.width);
      offsetX = Math.floor(dirtyIndex - offsetY * clippingPlanesTexture.width);

      packPlanesAsFloats(this, dirtyIndex, dirtyIndex + 1);
      clippingPlanesTexture.copyFrom({
        source: {
          width: 1,
          height: 1,
          arrayBufferView: this._float32View,
        },
        xOffset: offsetX,
        yOffset: offsetY,
      });
    } else {
      offsetY = Math.floor((dirtyIndex * 2) / clippingPlanesTexture.width);
      offsetX = Math.floor(
        dirtyIndex * 2 - offsetY * clippingPlanesTexture.width,
      );
      packPlanesAsUint8(this, dirtyIndex, dirtyIndex + 1);
      clippingPlanesTexture.copyFrom({
        source: {
          width: 2,
          height: 1,
          arrayBufferView: this._uint8View,
        },
        xOffset: offsetX,
        yOffset: offsetY,
      });
    }
  } else if (useFloatTexture) {
    packPlanesAsFloats(this, 0, this._planes.length);
    clippingPlanesTexture.copyFrom({
      source: {
        width: clippingPlanesTexture.width,
        height: clippingPlanesTexture.height,
        arrayBufferView: this._float32View,
      },
    });
  } else {
    packPlanesAsUint8(this, 0, this._planes.length);
    clippingPlanesTexture.copyFrom({
      source: {
        width: clippingPlanesTexture.width,
        height: clippingPlanesTexture.height,
        arrayBufferView: this._uint8View,
      },
    });
  }

  this._multipleDirtyPlanes = false;
  this._dirtyIndex = -1;
};

const scratchMatrix = new Matrix4();
const scratchPlane = new Plane(Cartesian3.UNIT_X, 0.0);
/**
 * 确定此ClippingPlaneCollection实例的平面与指定{@link TileBoundingVolume}的交集类型。
 * @private
 *
 * @param {object} tileBoundingVolume 要与平面确定交集的体积。
 * @param {Matrix4} [transform] 一个可选的附加矩阵，用于将平面变换为世界坐标。
 * @returns {Intersect} 如果整个体积位于平面法线指向的一侧且应完全渲染，则返回{@link Intersect.INSIDE}；
 *                      如果整个体积位于相反的一侧且应被裁剪，则返回{@link Intersect.OUTSIDE}；
 *                      如果体积与平面相交，则返回{@link Intersect.INTERSECTING}。
 */

ClippingPlaneCollection.prototype.computeIntersectionWithBoundingVolume =
  function (tileBoundingVolume, transform) {
    const planes = this._planes;
    const length = planes.length;

    let modelMatrix = this.modelMatrix;
    if (defined(transform)) {
      modelMatrix = Matrix4.multiply(transform, modelMatrix, scratchMatrix);
    }

    // If the collection is not set to union the clipping regions, the volume must be outside of all planes to be
    // considered completely clipped. If the collection is set to union the clipping regions, if the volume can be
    // outside any the planes, it is considered completely clipped.
    // Lastly, if not completely clipped, if any plane is intersecting, more calculations must be performed.
    let intersection = Intersect.INSIDE;
    if (!this.unionClippingRegions && length > 0) {
      intersection = Intersect.OUTSIDE;
    }

    for (let i = 0; i < length; ++i) {
      const plane = planes[i];

      Plane.transform(plane, modelMatrix, scratchPlane); // ClippingPlane can be used for Plane math

      const value = tileBoundingVolume.intersectPlane(scratchPlane);
      if (value === Intersect.INTERSECTING) {
        intersection = value;
      } else if (this._testIntersection(value)) {
        return value;
      }
    }

    return intersection;
  };

/**
 * 如果输入的ClippingPlaneCollection没有其他所有者，则为其设置所有者。如果设置成功，则销毁所有者之前的ClippingPlaneCollection。
 *
 * @param {ClippingPlaneCollection} [clippingPlaneCollection] 要附加到对象的ClippingPlaneCollection（或undefined）
 * @param {object} owner 应接收新ClippingPlaneCollection的对象
 * @param {string} key 对象引用ClippingPlaneCollection的键
 * @private
 */

ClippingPlaneCollection.setOwner = function (
  clippingPlaneCollection,
  owner,
  key,
) {
  // Don't destroy the ClippingPlaneCollection if it is already owned by newOwner
  if (clippingPlaneCollection === owner[key]) {
    return;
  }
  // Destroy the existing ClippingPlaneCollection, if any
  owner[key] = owner[key] && owner[key].destroy();
  if (defined(clippingPlaneCollection)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(clippingPlaneCollection._owner)) {
      throw new DeveloperError(
        "ClippingPlaneCollection should only be assigned to one object",
      );
    }
    //>>includeEnd('debug');
    clippingPlaneCollection._owner = owner;
    owner[key] = clippingPlaneCollection;
  }
};

/**
 * 用于检查上下文是否允许使用浮点纹理进行裁剪平面的函数。
 *
 * @param {Context} context 将包含裁剪对象和裁剪纹理的上下文。
 * @returns {boolean} 如果可以使用浮点纹理进行裁剪平面，则返回<code>true</code>。
 * @private
 */

ClippingPlaneCollection.useFloatTexture = function (context) {
  return context.floatingPointTexture;
};

/**
 * 用于获取裁剪平面集合的纹理分辨率的函数。
 * 如果ClippingPlaneCollection尚未更新，则返回将根据当前平面数量分配的分辨率。
 *
 * @param {ClippingPlaneCollection} clippingPlaneCollection 裁剪平面集合
 * @param {Context} context 渲染上下文
 * @param {Cartesian2} result 用于结果的Cartesian2。
 * @returns {Cartesian2} 所需的分辨率。
 * @private
 */

ClippingPlaneCollection.getTextureResolution = function (
  clippingPlaneCollection,
  context,
  result,
) {
  const texture = clippingPlaneCollection.texture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  const pixelsNeeded = ClippingPlaneCollection.useFloatTexture(context)
    ? clippingPlaneCollection.length
    : clippingPlaneCollection.length * 2;
  const requiredResolution = computeTextureResolution(pixelsNeeded, result);

  // Allocate twice as much space as needed to avoid frequent texture reallocation.
  requiredResolution.y *= 2;
  return requiredResolution;
};

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 * <br /><br />
 * 如果此对象已被销毁，则不应再使用它；调用<code>isDestroyed</code>以外的任何函数都将导致{@link DeveloperError}异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回<code>true</code>；否则返回<code>false</code>。
 *
 * @see ClippingPlaneCollection#destroy
 */

ClippingPlaneCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的WebGL资源。销毁对象允许确定性地释放WebGL资源，而不是依赖垃圾收集器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，它就不应再被使用；调用<code>isDestroyed</code>以外的任何函数都将导致{@link DeveloperError}异常。因此，将返回值（<code>undefined</code>）赋给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即destroy()已被调用。
 *
 * @example
 * clippingPlanes = clippingPlanes && clippingPlanes.destroy();
 *
 * @see ClippingPlaneCollection#isDestroyed
 */
ClippingPlaneCollection.prototype.destroy = function () {
  this._clippingPlanesTexture =
    this._clippingPlanesTexture && this._clippingPlanesTexture.destroy();
  return destroyObject(this);
};
export default ClippingPlaneCollection;
