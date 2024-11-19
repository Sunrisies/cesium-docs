import Cartesian2 from "../Core/Cartesian2.js";
import CesiumMath from "../Core/Math.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Intersect from "../Core/Intersect.js";
import PixelFormat from "../Core/PixelFormat.js";
import Rectangle from "../Core/Rectangle.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import PixelDatatype from "../Renderer/PixelDatatype.js";
import RuntimeError from "../Core/RuntimeError.js";
import Sampler from "../Renderer/Sampler.js";
import Texture from "../Renderer/Texture.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import TextureWrap from "../Renderer/TextureWrap.js";
import ClippingPolygon from "./ClippingPolygon.js";
import ComputeCommand from "../Renderer/ComputeCommand.js";
import PolygonSignedDistanceFS from "../Shaders/PolygonSignedDistanceFS.js";

/**
 * 指定一组裁剪多边形。裁剪多边形选择性地禁用对单个glTF模型、3D Tileset或地球的内部或外部区域的渲染。
 *
 * 裁剪多边形仅在WebGL 2上下文中受支持。
 *
 * @alias ClippingPolygonCollection
 * @constructor
 *
 * @param {object} [options] 包含以下属性的对象：
 * @param {ClippingPolygon[]} [options.polygons=[]] 用于选择性地禁用每个多边形内部区域渲染的{@link ClippingPolygon}对象数组。
 * @param {boolean} [options.enabled=true] 确定裁剪多边形是否处于活动状态。
 * @param {boolean} [options.inverse=false] 如果为true，则如果区域位于集合中所有多边形的外部，则该区域将被裁剪。否则，只有当区域位于任何多边形的内部时，才会被裁剪。
 *
 * @example
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * const polygon = new Cesium.ClippingPolygon({
 *     positions: positions
 * });
 *
 * const polygons = new Cesium.ClippingPolygonCollection({
 *    polygons: [ polygon ]
 * });
 */
function ClippingPolygonCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._polygons = [];
  this._totalPositions = 0;

    /**
   * 如果为true，裁剪将被启用。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {boolean}
   * @default true
   */
  this.enabled = defaultValue(options.enabled, true);

  /**
   * 如果为true，则如果区域位于集合中所有多边形的外部，则该区域将被裁剪。否则，只有当区域位于任何多边形的内部时，才会被裁剪。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {boolean}
   * @default false
   */
  this.inverse = defaultValue(options.inverse, false);

  /**
   * 当新裁剪多边形被添加到集合中时触发的事件。事件处理程序会传递新多边形及其被添加的索引。
   * @type {Event}
   * @default Event()
   */

  this.polygonAdded = new Event();

  /**
   * 当新裁剪多边形从集合中移除时触发的事件。事件处理程序会传递被移除的多边形及其被移除的索引。
   * @type {Event}
   * @default Event()
   */

  this.polygonRemoved = new Event();

  // If this ClippingPolygonCollection has an owner, only its owner should update or destroy it.
  // This is because in a Cesium3DTileset multiple models may reference the tileset's ClippingPolygonCollection.
  this._owner = undefined;

  this._float32View = undefined;
  this._extentsFloat32View = undefined;
  this._extentsCount = 0;

  this._polygonsTexture = undefined;
  this._extentsTexture = undefined;
  this._signedDistanceTexture = undefined;

  this._signedDistanceComputeCommand = undefined;

  // Add each ClippingPolygon object.
  const polygons = options.polygons;
  if (defined(polygons)) {
    const polygonsLength = polygons.length;
    for (let i = 0; i < polygonsLength; ++i) {
      this._polygons.push(polygons[i]);
    }
  }
}

Object.defineProperties(ClippingPolygonCollection.prototype, {
  /**
   * 返回此集合中的多边形数量。通常与{@link ClippingPolygonCollection#get}一起使用，以遍历集合中的所有多边形。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   */
  length: {
    get: function () {
      return this._polygons.length;
    },
  },

  /**
   * 返回集合中所有多边形中位置的总数。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  totalPositions: {
    get: function () {
      return this._totalPositions;
    },
  },

  /**
   * 返回包含每个多边形的打包计算球面范围的纹理。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  extentsTexture: {
    get: function () {
      return this._extentsTexture;
    },
  },

  /**
   * 返回打包范围的数量，可能少于多边形的数量。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  extentsCount: {
    get: function () {
      return this._extentsCount;
    },
  },

  /**
   * 返回包含每个多边形的打包计算球面范围所需的像素数量。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  pixelsNeededForExtents: {
    get: function () {
      return this.length; // 在RGBA纹理中，每个像素包含最小/最大纬度和经度。
    },
  },

  /**
   * 返回包含打包多边形位置所需的像素数量。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {number}
   * @readonly
   * @private
   */
  pixelsNeededForPolygonPositions: {
    get: function () {
      // 在RG FLOAT纹理中，每个多边形位置是2个浮点数打包到RG。
      // 每个多边形是该多边形的位置数量，后跟位置列表
      return this.totalPositions + this.length;
    },
  },

  /**
   * 返回包含每个多边形的计算有符号距离的纹理。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @type {Texture}
   * @readonly
   * @private
   */
  clippingTexture: {
    get: function () {
      return this._signedDistanceTexture;
    },
  },

  /**
   * 对ClippingPolygonCollection所有者的引用（如果有）。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @readonly
   * @private
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },

  /**
   * 返回一个封装此ClippingPolygonCollection状态的数字。
   *
   * 裁剪模式编码在数字的符号中，该符号仅是总位置计数。
   * 如果此值发生变化，则需要重新生成着色器。
   *
   * @memberof ClippingPolygonCollection.prototype
   * @returns {number} 描述ClippingPolygonCollection状态的数字。
   * @readonly
   * @private
   */
  clippingPolygonsState: {
    get: function () {
      return this.inverse ? -this.extentsCount : this.extentsCount;
    },
  },
});


/**
 * 将指定的{@link ClippingPolygon}添加到集合中，以选择性地禁用每个多边形内部区域的渲染。使用{@link ClippingPolygonCollection#unionClippingRegions}修改多个多边形的裁剪行为。
 *
 * @param {ClippingPolygon} polygon 要添加到集合中的ClippingPolygon。
 * @returns {ClippingPolygon} 被添加的ClippingPolygon。
 *
 * @example
 * const polygons = new Cesium.ClippingPolygonCollection();
 *
 * const positions = Cesium.Cartesian3.fromRadiansArray([
 *     -1.3194369277314022,
 *     0.6988062530900625,
 *     -1.31941,
 *     0.69879,
 *     -1.3193955980204217,
 *     0.6988091578771254,
 *     -1.3193931220959367,
 *     0.698743632490865,
 *     -1.3194358224045408,
 *     0.6987471965556998,
 * ]);
 *
 * polygons.add(new Cesium.ClippingPolygon({
 *     positions: positions
 * }));
 *
 *
 *
 * @see ClippingPolygonCollection#remove
 * @see ClippingPolygonCollection#removeAll
 */
ClippingPolygonCollection.prototype.add = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  const newPlaneIndex = this._polygons.length;
  this._polygons.push(polygon);
  this.polygonAdded.raiseEvent(polygon, newPlaneIndex);
  return polygon;
};

/**
 * 返回集合中指定索引处的裁剪多边形。索引从零开始，随着多边形的添加而增加。移除多边形会将该多边形之后的所有多边形向左移动，改变它们的索引。此函数通常与{@link ClippingPolygonCollection#length}一起使用，以遍历集合中的所有多边形。
 *
 * @param {number} index 多边形的零基索引。
 * @returns {ClippingPolygon} 指定索引处的ClippingPolygon。
 *
 * @see ClippingPolygonCollection#length
 */

ClippingPolygonCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  return this._polygons[index];
};

/**
 * 检查此集合是否包含与给定ClippingPolygon相等的ClippingPolygon。
 *
 * @param {ClippingPolygon} polygon 要检查的ClippingPolygon。
 * @returns {boolean} 如果此集合包含该ClippingPolygon，则返回true，否则返回false。
 *
 * @see ClippingPolygonCollection#get
 */

ClippingPolygonCollection.prototype.contains = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  return this._polygons.some((p) => ClippingPolygon.equals(p, polygon));
};

/**
 * 从集合中移除给定ClippingPolygon的首次出现。
 *
 * @param {ClippingPolygon} polygon
 * @returns {boolean} 如果多边形被移除，则返回<code>true</code>；如果多边形未在集合中找到，则返回<code>false</code>。
 *
 * @see ClippingPolygonCollection#add
 * @see ClippingPolygonCollection#contains
 * @see ClippingPolygonCollection#removeAll
 */

ClippingPolygonCollection.prototype.remove = function (polygon) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("polygon", polygon);
  //>>includeEnd('debug');

  const polygons = this._polygons;
  const index = polygons.findIndex((p) => ClippingPolygon.equals(p, polygon));

  if (index === -1) {
    return false;
  }

  polygons.splice(index, 1);

  this.polygonRemoved.raiseEvent(polygon, index);
  return true;
};

const scratchRectangle = new Rectangle();

// Map the polygons to a list of extents-- Overlapping extents will be merged
// into a single encompassing extent
function getExtents(polygons) {
  const extentsList = [];
  const polygonIndicesList = [];

  const length = polygons.length;
  for (let polygonIndex = 0; polygonIndex < length; ++polygonIndex) {
    const polygon = polygons[polygonIndex];
    const extents = polygon.computeSphericalExtents();

    let height = Math.max(extents.height * 2.5, 0.001);
    let width = Math.max(extents.width * 2.5, 0.001);

    // Pad extents to avoid floating point error when fragment culling at edges.
    let paddedExtents = Rectangle.clone(extents);
    paddedExtents.south -= height;
    paddedExtents.west -= width;
    paddedExtents.north += height;
    paddedExtents.east += width;

    paddedExtents.south = Math.max(paddedExtents.south, -Math.PI);
    paddedExtents.west = Math.max(paddedExtents.west, -Math.PI);
    paddedExtents.north = Math.min(paddedExtents.north, Math.PI);
    paddedExtents.east = Math.min(paddedExtents.east, Math.PI);

    const polygonIndices = [polygonIndex];
    for (let i = 0; i < extentsList.length; ++i) {
      const e = extentsList[i];
      if (
        defined(e) &&
        defined(Rectangle.simpleIntersection(e, paddedExtents)) &&
        !Rectangle.equals(e, paddedExtents)
      ) {
        const intersectingPolygons = polygonIndicesList[i];
        polygonIndices.push(...intersectingPolygons);
        intersectingPolygons.reduce(
          (extents, p) =>
            Rectangle.union(
              polygons[p].computeSphericalExtents(scratchRectangle),
              extents,
              extents,
            ),
          extents,
        );

        extentsList[i] = undefined;
        polygonIndicesList[i] = undefined;

        height = Math.max(extents.height * 2.5, 0.001);
        width = Math.max(extents.width * 2.5, 0.001);

        paddedExtents = Rectangle.clone(extents, paddedExtents);
        paddedExtents.south -= height;
        paddedExtents.west -= width;
        paddedExtents.north += height;
        paddedExtents.east += width;

        paddedExtents.south = Math.max(paddedExtents.south, -Math.PI);
        paddedExtents.west = Math.max(paddedExtents.west, -Math.PI);
        paddedExtents.north = Math.min(paddedExtents.north, Math.PI);
        paddedExtents.east = Math.min(paddedExtents.east, Math.PI);

        // Reiterate through the extents list until there are no more intersections
        i = -1;
      }
    }

    extentsList.push(paddedExtents);
    polygonIndicesList.push(polygonIndices);
  }

  const extentsIndexByPolygon = new Map();
  polygonIndicesList
    .filter(defined)
    .forEach((polygonIndices, e) =>
      polygonIndices.forEach((p) => extentsIndexByPolygon.set(p, e)),
    );

  return {
    extentsList: extentsList.filter(defined),
    extentsIndexByPolygon: extentsIndexByPolygon,
  };
}

/**
 * 从集合中移除所有多边形。
 *
 * @see ClippingPolygonCollection#add
 * @see ClippingPolygonCollection#remove
 */

ClippingPolygonCollection.prototype.removeAll = function () {
  // Dereference this ClippingPolygonCollection from all ClippingPolygons
  const polygons = this._polygons;
  const polygonsCount = polygons.length;
  for (let i = 0; i < polygonsCount; ++i) {
    const polygon = polygons[i];
    this.polygonRemoved.raiseEvent(polygon, i);
  }
  this._polygons = [];
};

function packPolygonsAsFloats(clippingPolygonCollection) {
  const polygonsFloat32View = clippingPolygonCollection._float32View;
  const extentsFloat32View = clippingPolygonCollection._extentsFloat32View;
  const polygons = clippingPolygonCollection._polygons;

  const { extentsList, extentsIndexByPolygon } = getExtents(polygons);

  let floatIndex = 0;
  for (const [polygonIndex, polygon] of polygons.entries()) {
    // Pack the length of the polygon into the polygon texture array buffer
    const length = polygon.length;
    polygonsFloat32View[floatIndex++] = length;
    polygonsFloat32View[floatIndex++] = extentsIndexByPolygon.get(polygonIndex);

    // Pack the polygon positions into the polygon texture array buffer
    for (let i = 0; i < length; ++i) {
      const spherePoint = polygon.positions[i];

      // Project into plane with vertical for latitude
      const magXY = Math.hypot(spherePoint.x, spherePoint.y);

      // Use fastApproximateAtan2 for alignment with shader
      const latitudeApproximation = CesiumMath.fastApproximateAtan2(
        magXY,
        spherePoint.z,
      );
      const longitudeApproximation = CesiumMath.fastApproximateAtan2(
        spherePoint.x,
        spherePoint.y,
      );

      polygonsFloat32View[floatIndex++] = latitudeApproximation;
      polygonsFloat32View[floatIndex++] = longitudeApproximation;
    }
  }

  // Pack extents
  let extentsFloatIndex = 0;
  for (const extents of extentsList) {
    const longitudeRangeInverse = 1.0 / (extents.east - extents.west);
    const latitudeRangeInverse = 1.0 / (extents.north - extents.south);

    extentsFloat32View[extentsFloatIndex++] = extents.south;
    extentsFloat32View[extentsFloatIndex++] = extents.west;
    extentsFloat32View[extentsFloatIndex++] = latitudeRangeInverse;
    extentsFloat32View[extentsFloatIndex++] = longitudeRangeInverse;
  }

  clippingPolygonCollection._extentsCount = extentsList.length;
}

const textureResolutionScratch = new Cartesian2();
/**
 * 当{@link Viewer}或{@link CesiumWidget}渲染场景时调用，以构建裁剪多边形的资源。
 * <p>
 * 不要直接调用此函数。
 * </p>
 * @private
 * @throws {RuntimeError} ClippingPolygonCollections仅支持WebGL 2
 */

ClippingPolygonCollection.prototype.update = function (frameState) {
  const context = frameState.context;

  if (!ClippingPolygonCollection.isSupported(frameState)) {
    throw new RuntimeError(
      "ClippingPolygonCollections are only supported for WebGL 2.",
    );
  }

  // It'd be expensive to validate any individual position has changed. Instead verify if the list of polygon positions has had elements added or removed, which should be good enough for most cases.
  const totalPositions = this._polygons.reduce(
    (totalPositions, polygon) => totalPositions + polygon.length,
    0,
  );

  if (totalPositions === this.totalPositions) {
    return;
  }

  this._totalPositions = totalPositions;

  // If there are no clipping polygons, there's nothing to update.
  if (this.length === 0) {
    return;
  }

  if (defined(this._signedDistanceComputeCommand)) {
    this._signedDistanceComputeCommand.canceled = true;
    this._signedDistanceComputeCommand = undefined;
  }

  let polygonsTexture = this._polygonsTexture;
  let extentsTexture = this._extentsTexture;
  let signedDistanceTexture = this._signedDistanceTexture;
  if (defined(polygonsTexture)) {
    const currentPixelCount = polygonsTexture.width * polygonsTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < this.pixelsNeededForPolygonPositions ||
      this.pixelsNeededForPolygonPositions < 0.25 * currentPixelCount
    ) {
      polygonsTexture.destroy();
      polygonsTexture = undefined;
      this._polygonsTexture = undefined;
    }
  }

  if (!defined(polygonsTexture)) {
    const requiredResolution = ClippingPolygonCollection.getTextureResolution(
      polygonsTexture,
      this.pixelsNeededForPolygonPositions,
      textureResolutionScratch,
    );

    polygonsTexture = new Texture({
      context: context,
      width: requiredResolution.x,
      height: requiredResolution.y,
      pixelFormat: PixelFormat.RG,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: Sampler.NEAREST,
      flipY: false,
    });
    this._float32View = new Float32Array(
      requiredResolution.x * requiredResolution.y * 2,
    );
    this._polygonsTexture = polygonsTexture;
  }

  if (defined(extentsTexture)) {
    const currentPixelCount = extentsTexture.width * extentsTexture.height;
    // Recreate the texture to double current requirement if it isn't big enough or is 4 times larger than it needs to be.
    // Optimization note: this isn't exactly the classic resizeable array algorithm
    // * not necessarily checking for resize after each add/remove operation
    // * random-access deletes instead of just pops
    // * alloc ops likely more expensive than demonstrable via big-O analysis
    if (
      currentPixelCount < this.pixelsNeededForExtents ||
      this.pixelsNeededForExtents < 0.25 * currentPixelCount
    ) {
      extentsTexture.destroy();
      extentsTexture = undefined;
      this._extentsTexture = undefined;
    }
  }

  if (!defined(extentsTexture)) {
    const requiredResolution = ClippingPolygonCollection.getTextureResolution(
      extentsTexture,
      this.pixelsNeededForExtents,
      textureResolutionScratch,
    );

    extentsTexture = new Texture({
      context: context,
      width: requiredResolution.x,
      height: requiredResolution.y,
      pixelFormat: PixelFormat.RGBA,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: Sampler.NEAREST,
      flipY: false,
    });
    this._extentsFloat32View = new Float32Array(
      requiredResolution.x * requiredResolution.y * 4,
    );

    this._extentsTexture = extentsTexture;
  }

  packPolygonsAsFloats(this);

  extentsTexture.copyFrom({
    source: {
      width: extentsTexture.width,
      height: extentsTexture.height,
      arrayBufferView: this._extentsFloat32View,
    },
  });

  polygonsTexture.copyFrom({
    source: {
      width: polygonsTexture.width,
      height: polygonsTexture.height,
      arrayBufferView: this._float32View,
    },
  });

  if (!defined(signedDistanceTexture)) {
    const textureDimensions =
      ClippingPolygonCollection.getClippingDistanceTextureResolution(
        this,
        textureResolutionScratch,
      );
    signedDistanceTexture = new Texture({
      context: context,
      width: textureDimensions.x,
      height: textureDimensions.y,
      pixelFormat: context.webgl2 ? PixelFormat.RED : PixelFormat.LUMINANCE,
      pixelDatatype: PixelDatatype.FLOAT,
      sampler: new Sampler({
        wrapS: TextureWrap.CLAMP_TO_EDGE,
        wrapT: TextureWrap.CLAMP_TO_EDGE,
        minificationFilter: TextureMinificationFilter.LINEAR,
        magnificationFilter: TextureMagnificationFilter.LINEAR,
      }),
      flipY: false,
    });

    this._signedDistanceTexture = signedDistanceTexture;
  }

  this._signedDistanceComputeCommand = createSignedDistanceTextureCommand(this);
};

/**
 * 当{@link Viewer}或{@link CesiumWidget}渲染场景时调用，以构建裁剪多边形的资源。
 * <p>
 * 不要直接调用此函数。
 * </p>
 * @private
 * @param {FrameState} frameState
 */

ClippingPolygonCollection.prototype.queueCommands = function (frameState) {
  if (defined(this._signedDistanceComputeCommand)) {
    frameState.commandList.push(this._signedDistanceComputeCommand);
  }
};

function createSignedDistanceTextureCommand(collection) {
  const polygonTexture = collection._polygonsTexture;
  const extentsTexture = collection._extentsTexture;

  return new ComputeCommand({
    fragmentShaderSource: PolygonSignedDistanceFS,
    outputTexture: collection._signedDistanceTexture,
    uniformMap: {
      u_polygonsLength: function () {
        return collection.length;
      },
      u_extentsLength: function () {
        return collection.extentsCount;
      },
      u_extentsTexture: function () {
        return extentsTexture;
      },
      u_polygonTexture: function () {
        return polygonTexture;
      },
    },
    persists: false,
    owner: collection,
    postExecute: () => {
      collection._signedDistanceComputeCommand = undefined;
    },
  });
}

const scratchRectangleTile = new Rectangle();
const scratchRectangleIntersection = new Rectangle();
/**
 * 确定此ClippingPolygonCollection实例的多边形与指定{@link TileBoundingVolume}的交集类型。
 * @private
 *
 * @param {object} tileBoundingVolume 要与多边形确定交集的体积。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 定义边界体积的椭球体。
 * @returns {Intersect} 交集类型：如果整个体积未被裁剪，则为{@link Intersect.OUTSIDE}；如果整个体积应被裁剪，则为{@link Intersect.INSIDE}；
 *                      如果体积与多边形相交并将部分裁剪，则为{@link Intersect.INTERSECTING}。
 */

ClippingPolygonCollection.prototype.computeIntersectionWithBoundingVolume =
  function (tileBoundingVolume, ellipsoid) {
    const polygons = this._polygons;
    const length = polygons.length;

    let intersection = Intersect.OUTSIDE;
    if (this.inverse) {
      intersection = Intersect.INSIDE;
    }

    for (let i = 0; i < length; ++i) {
      const polygon = polygons[i];

      const polygonBoundingRectangle = polygon.computeRectangle();
      let tileBoundingRectangle = tileBoundingVolume.rectangle;
      if (
        !defined(tileBoundingRectangle) &&
        defined(tileBoundingVolume.boundingVolume?.computeCorners)
      ) {
        const points = tileBoundingVolume.boundingVolume.computeCorners();
        tileBoundingRectangle = Rectangle.fromCartesianArray(
          points,
          ellipsoid,
          scratchRectangleTile,
        );
      }

      if (!defined(tileBoundingRectangle)) {
        tileBoundingRectangle = Rectangle.fromBoundingSphere(
          tileBoundingVolume.boundingSphere,
          ellipsoid,
          scratchRectangleTile,
        );
      }

      const result = Rectangle.simpleIntersection(
        tileBoundingRectangle,
        polygonBoundingRectangle,
        scratchRectangleIntersection,
      );

      if (defined(result)) {
        intersection = Intersect.INTERSECTING;
      }
    }

    return intersection;
  };

/**
 * 如果输入的ClippingPolygonCollection没有其他所有者，则为其设置所有者。如果设置成功，则销毁所有者之前的ClippingPolygonCollection。
 *
 * @param {ClippingPolygonCollection} [clippingPolygonsCollection] 要附加到对象的ClippingPolygonCollection（或undefined）
 * @param {object} owner 应接收新ClippingPolygonCollection的对象
 * @param {string} key 对象引用ClippingPolygonCollection的键
 * @private
 */

ClippingPolygonCollection.setOwner = function (
  clippingPolygonsCollection,
  owner,
  key,
) {
  // Don't destroy the ClippingPolygonCollection if it is already owned by newOwner
  if (clippingPolygonsCollection === owner[key]) {
    return;
  }
  // Destroy the existing ClippingPolygonCollection, if any
  owner[key] = owner[key] && owner[key].destroy();
  if (defined(clippingPolygonsCollection)) {
    //>>includeStart('debug', pragmas.debug);
    if (defined(clippingPolygonsCollection._owner)) {
      throw new DeveloperError(
        "ClippingPolygonCollection should only be assigned to one object",
      );
    }
    //>>includeEnd('debug');
    clippingPolygonsCollection._owner = owner;
    owner[key] = clippingPolygonsCollection;
  }
};

/**
 * 用于检查上下文是否允许使用裁剪多边形，这需要浮点纹理。
 *
 * @param {Scene|object} scene 将包含裁剪对象和裁剪纹理的场景。
 * @returns {boolean} 如果上下文支持裁剪多边形，则返回<code>true</code>。
 */

ClippingPolygonCollection.isSupported = function (scene) {
  return scene?.context.webgl2;
};

/**
 * 用于获取打包纹理分辨率的函数。
 * 如果ClippingPolygonCollection尚未更新，则返回将根据提供的所需像素分配的分辨率。
 *
 * @param {Texture} texture 要打包的纹理。
 * @param {number} pixelsNeeded 基于当前多边形数量所需的像素数量。
 * @param {Cartesian2} result 用于结果的Cartesian2。
 * @returns {Cartesian2} 所需的分辨率。
 * @private
 */

ClippingPolygonCollection.getTextureResolution = function (
  texture,
  pixelsNeeded,
  result,
) {
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  const maxSize = ContextLimits.maximumTextureSize;
  result.x = Math.min(pixelsNeeded, maxSize);
  result.y = Math.ceil(pixelsNeeded / result.x);

  // Allocate twice as much space as needed to avoid frequent texture reallocation.
  result.y *= 2;

  return result;
};

/**
 * 用于获取裁剪集合的有符号距离纹理分辨率的函数。
 * 如果ClippingPolygonCollection尚未更新，则返回将根据当前设置分配的分辨率。
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection 裁剪多边形集合
 * @param {Cartesian2} result 用于结果的Cartesian2。
 * @returns {Cartesian2} 所需的分辨率。
 * @private
 */

ClippingPolygonCollection.getClippingDistanceTextureResolution = function (
  clippingPolygonCollection,
  result,
) {
  const texture = clippingPolygonCollection.signedDistanceTexture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  result.x = Math.min(ContextLimits.maximumTextureSize, 4096);
  result.y = Math.min(ContextLimits.maximumTextureSize, 4096);

  return result;
};

/**
 * 用于获取裁剪集合的范围纹理分辨率的函数。
 * 如果ClippingPolygonCollection尚未更新，则返回将根据当前多边形数量分配的分辨率。
 *
 * @param {ClippingPolygonCollection} clippingPolygonCollection 裁剪多边形集合
 * @param {Cartesian2} result 用于结果的Cartesian2。
 * @returns {Cartesian2} 所需的分辨率。
 * @private
 */

ClippingPolygonCollection.getClippingExtentsTextureResolution = function (
  clippingPolygonCollection,
  result,
) {
  const texture = clippingPolygonCollection.extentsTexture;
  if (defined(texture)) {
    result.x = texture.width;
    result.y = texture.height;
    return result;
  }

  return ClippingPolygonCollection.getTextureResolution(
    texture,
    clippingPolygonCollection.pixelsNeededForExtents,
    result,
  );
};

/**
 * 如果此对象已被销毁，则返回true；否则返回false。
 * <br /><br />
 * 如果此对象已被销毁，则不应再使用它；调用<code>isDestroyed</code>以外的任何函数都将导致{@link DeveloperError}异常。
 *
 * @returns {boolean} 如果此对象已被销毁，则返回<code>true</code>；否则返回<code>false</code>。
 *
 * @see ClippingPolygonCollection#destroy
 */

ClippingPolygonCollection.prototype.isDestroyed = function () {
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
 * clippingPolygons = clippingPolygons && clippingPolygons.destroy();
 *
 * @see ClippingPolygonCollection#isDestroyed
 */
ClippingPolygonCollection.prototype.destroy = function () {
  if (defined(this._signedDistanceComputeCommand)) {
    this._signedDistanceComputeCommand.canceled = true;
  }

  this._polygonsTexture =
    this._polygonsTexture && this._polygonsTexture.destroy();
  this._extentsTexture = this._extentsTexture && this._extentsTexture.destroy();
  this._signedDistanceTexture =
    this._signedDistanceTexture && this._signedDistanceTexture.destroy();
  return destroyObject(this);
};

export default ClippingPolygonCollection;
