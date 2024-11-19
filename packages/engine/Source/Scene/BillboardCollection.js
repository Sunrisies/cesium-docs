import AttributeCompression from "../Core/AttributeCompression.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import EncodedCartesian3 from "../Core/EncodedCartesian3.js";
import IndexDatatype from "../Core/IndexDatatype.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import WebGLConstants from "../Core/WebGLConstants.js";
import Buffer from "../Renderer/Buffer.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArrayFacade from "../Renderer/VertexArrayFacade.js";
import BillboardCollectionFS from "../Shaders/BillboardCollectionFS.js";
import BillboardCollectionVS from "../Shaders/BillboardCollectionVS.js";
import Billboard from "./Billboard.js";
import BlendingState from "./BlendingState.js";
import BlendOption from "./BlendOption.js";
import HeightReference, { isHeightReferenceClamp } from "./HeightReference.js";
import HorizontalOrigin from "./HorizontalOrigin.js";
import SceneMode from "./SceneMode.js";
import SDFSettings from "./SDFSettings.js";
import TextureAtlas from "./TextureAtlas.js";
import VerticalOrigin from "./VerticalOrigin.js";

const SHOW_INDEX = Billboard.SHOW_INDEX;
const POSITION_INDEX = Billboard.POSITION_INDEX;
const PIXEL_OFFSET_INDEX = Billboard.PIXEL_OFFSET_INDEX;
const EYE_OFFSET_INDEX = Billboard.EYE_OFFSET_INDEX;
const HORIZONTAL_ORIGIN_INDEX = Billboard.HORIZONTAL_ORIGIN_INDEX;
const VERTICAL_ORIGIN_INDEX = Billboard.VERTICAL_ORIGIN_INDEX;
const SCALE_INDEX = Billboard.SCALE_INDEX;
const IMAGE_INDEX_INDEX = Billboard.IMAGE_INDEX_INDEX;
const COLOR_INDEX = Billboard.COLOR_INDEX;
const ROTATION_INDEX = Billboard.ROTATION_INDEX;
const ALIGNED_AXIS_INDEX = Billboard.ALIGNED_AXIS_INDEX;
const SCALE_BY_DISTANCE_INDEX = Billboard.SCALE_BY_DISTANCE_INDEX;
const TRANSLUCENCY_BY_DISTANCE_INDEX = Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX;
const PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX =
  Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX;
const DISTANCE_DISPLAY_CONDITION_INDEX = Billboard.DISTANCE_DISPLAY_CONDITION;
const DISABLE_DEPTH_DISTANCE = Billboard.DISABLE_DEPTH_DISTANCE;
const TEXTURE_COORDINATE_BOUNDS = Billboard.TEXTURE_COORDINATE_BOUNDS;
const SDF_INDEX = Billboard.SDF_INDEX;
const SPLIT_DIRECTION_INDEX = Billboard.SPLIT_DIRECTION_INDEX;
const NUMBER_OF_PROPERTIES = Billboard.NUMBER_OF_PROPERTIES;

let attributeLocations;

const attributeLocationsBatched = {
  positionHighAndScale: 0,
  positionLowAndRotation: 1,
  compressedAttribute0: 2, // pixel offset, translate, horizontal origin, vertical origin, show, direction, texture coordinates
  compressedAttribute1: 3, // aligned axis, translucency by distance, image width
  compressedAttribute2: 4, // image height, color, pick color, size in meters, valid aligned axis, 13 bits free
  eyeOffset: 5, // 4 bytes free
  scaleByDistance: 6,
  pixelOffsetScaleByDistance: 7,
  compressedAttribute3: 8,
  textureCoordinateBoundsOrLabelTranslate: 9,
  a_batchId: 10,
  sdf: 11,
  splitDirection: 12,
};

const attributeLocationsInstanced = {
  direction: 0,
  positionHighAndScale: 1,
  positionLowAndRotation: 2, // texture offset in w
  compressedAttribute0: 3,
  compressedAttribute1: 4,
  compressedAttribute2: 5,
  eyeOffset: 6, // texture range in w
  scaleByDistance: 7,
  pixelOffsetScaleByDistance: 8,
  compressedAttribute3: 9,
  textureCoordinateBoundsOrLabelTranslate: 10,
  a_batchId: 11,
  sdf: 12,
  splitDirection: 13,
};

/**
 * 可渲染的广告牌集合。广告牌是视口对齐的
 * 图像，定位于 3D 场景中。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 示例广告牌
 * </div>
 * <br /><br />
 * 广告牌通过 {@link BillboardCollection#add}
 * 和 {@link BillboardCollection#remove} 从集合中添加和移除。集合中的广告牌自动共享
 * 具有相同标识符的图像纹理。
 *
 * @alias BillboardCollection
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将每个广告牌从模型坐标转换为世界坐标的 4x4 变换矩阵。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示此基元的命令的包围球。
 * @param {Scene} [options.scene] 对于使用高度参考属性或将与地球进行深度测试的广告牌，必须传入。
 * @param {BlendOption} [options.blendOption=BlendOption.OPAQUE_AND_TRANSLUCENT] 广告牌混合选项。默认情况下用于渲染不透明和半透明的广告牌。然而，如果所有广告牌都是完全不透明或完全半透明，将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以将性能提高多达 2 倍。
 * @param {boolean} [options.show=true] 确定集合中的广告牌是否可见。
 *
 * @performance 为了获得最佳性能，建议使用少量集合，每个集合中包含多个广告牌，而不是许多集合中仅包含少量广告牌。组织集合，以便具有相同更新频率的广告牌位于同一集合中，即不变化的广告牌应在一个集合中；每帧变化的广告牌应在另一个集合中；依此类推。
 *
 * @see BillboardCollection#add
 * @see BillboardCollection#remove
 * @see Billboard
 * @see LabelCollection
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Billboards.html|Cesium Sandcastle Billboard Demo}
 *
 * @example
 * // Create a billboard collection with two billboards
 * const billboards = scene.primitives.add(new Cesium.BillboardCollection());
 * billboards.add({
 *   position : new Cesium.Cartesian3(1.0, 2.0, 3.0),
 *   image : 'url/to/image'
 * });
 * billboards.add({
 *   position : new Cesium.Cartesian3(4.0, 5.0, 6.0),
 *   image : 'url/to/another/image'
 * });
 */
function BillboardCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._scene = options.scene;
  this._batchTable = options.batchTable;

  this._textureAtlas = undefined;
  this._textureAtlasGUID = undefined;
  this._destroyTextureAtlas = true;
  this._sp = undefined;
  this._spTranslucent = undefined;
  this._rsOpaque = undefined;
  this._rsTranslucent = undefined;
  this._vaf = undefined;

  this._billboards = [];
  this._billboardsToUpdate = [];
  this._billboardsToUpdateIndex = 0;
  this._billboardsRemoved = false;
  this._createVertexArray = false;

  this._shaderRotation = false;
  this._compiledShaderRotation = false;

  this._shaderAlignedAxis = false;
  this._compiledShaderAlignedAxis = false;

  this._shaderScaleByDistance = false;
  this._compiledShaderScaleByDistance = false;

  this._shaderTranslucencyByDistance = false;
  this._compiledShaderTranslucencyByDistance = false;

  this._shaderPixelOffsetScaleByDistance = false;
  this._compiledShaderPixelOffsetScaleByDistance = false;

  this._shaderDistanceDisplayCondition = false;
  this._compiledShaderDistanceDisplayCondition = false;

  this._shaderDisableDepthDistance = false;
  this._compiledShaderDisableDepthDistance = false;

  this._shaderClampToGround = false;
  this._compiledShaderClampToGround = false;

  this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);

  this._maxSize = 0.0;
  this._maxEyeOffset = 0.0;
  this._maxScale = 1.0;
  this._maxPixelOffset = 0.0;
  this._allHorizontalCenter = true;
  this._allVerticalCenter = true;
  this._allSizedInMeters = true;

  this._baseVolume = new BoundingSphere();
  this._baseVolumeWC = new BoundingSphere();
  this._baseVolume2D = new BoundingSphere();
  this._boundingVolume = new BoundingSphere();
  this._boundingVolumeDirty = false;

  this._colorCommands = [];

  /**
   * 确定此集合中的广告牌是否会被显示。
   *
   * @type {boolean}
   * @default true
   */

  this.show = defaultValue(options.show, true);

  /**
   * 将此集合中每个广告牌从模型坐标转换为世界坐标的 4x4 变换矩阵。
   * 当这是单位矩阵时，广告牌在世界坐标中绘制，即地球的 WGS84 坐标。
   * 通过提供不同的变换矩阵（如 {@link Transforms.eastNorthUpToFixedFrame} 返回的矩阵）可以使用局部参考框架。
   *
   * @type {Matrix4}
   * @default {@link Matrix4.IDENTITY}
   *
   *
   * @example
   * const center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
   * billboards.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
   * billboards.add({
   *   image : 'url/to/image',
   *   position : new Cesium.Cartesian3(0.0, 0.0, 0.0) // center
   * });
   * billboards.add({
   *   image : 'url/to/image',
   *   position : new Cesium.Cartesian3(1000000.0, 0.0, 0.0) // east
   * });
   * billboards.add({
   *   image : 'url/to/image',
   *   position : new Cesium.Cartesian3(0.0, 1000000.0, 0.0) // north
   * });
   * billboards.add({
   *   image : 'url/to/image',
   *   position : new Cesium.Cartesian3(0.0, 0.0, 1000000.0) // up
   * });
   *
   * @see Transforms.eastNorthUpToFixedFrame
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY),
  );
  this._modelMatrix = Matrix4.clone(Matrix4.IDENTITY);

  /**
   * 此属性仅用于调试；不适用于生产环境，也未进行优化。
   * <p>
   * 绘制基元中每个绘制命令的包围球。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */

  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false,
  );

  /**
   * 此属性仅用于调试；不适用于生产环境，也未进行优化。
   * <p>
   * 将此 BillboardCollection 的纹理图集绘制为全屏四边形。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */

  this.debugShowTextureAtlas = defaultValue(
    options.debugShowTextureAtlas,
    false,
  );

  /**
   * 广告牌混合选项。默认情况下用于渲染不透明和半透明的广告牌。
   * 然而，如果所有广告牌都是完全不透明或完全半透明，
   * 将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以提高
   * 性能最多 2 倍。
   * @type {BlendOption}
   * @default BlendOption.OPAQUE_AND_TRANSLUCENT
   */

  this.blendOption = defaultValue(
    options.blendOption,
    BlendOption.OPAQUE_AND_TRANSLUCENT,
  );
  this._blendOption = undefined;

  this._mode = SceneMode.SCENE3D;

  // The buffer usage for each attribute is determined based on the usage of the attribute over time.
  this._buffersUsage = [
    BufferUsage.STATIC_DRAW, // SHOW_INDEX
    BufferUsage.STATIC_DRAW, // POSITION_INDEX
    BufferUsage.STATIC_DRAW, // PIXEL_OFFSET_INDEX
    BufferUsage.STATIC_DRAW, // EYE_OFFSET_INDEX
    BufferUsage.STATIC_DRAW, // HORIZONTAL_ORIGIN_INDEX
    BufferUsage.STATIC_DRAW, // VERTICAL_ORIGIN_INDEX
    BufferUsage.STATIC_DRAW, // SCALE_INDEX
    BufferUsage.STATIC_DRAW, // IMAGE_INDEX_INDEX
    BufferUsage.STATIC_DRAW, // COLOR_INDEX
    BufferUsage.STATIC_DRAW, // ROTATION_INDEX
    BufferUsage.STATIC_DRAW, // ALIGNED_AXIS_INDEX
    BufferUsage.STATIC_DRAW, // SCALE_BY_DISTANCE_INDEX
    BufferUsage.STATIC_DRAW, // TRANSLUCENCY_BY_DISTANCE_INDEX
    BufferUsage.STATIC_DRAW, // PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX
    BufferUsage.STATIC_DRAW, // DISTANCE_DISPLAY_CONDITION_INDEX
    BufferUsage.STATIC_DRAW, // TEXTURE_COORDINATE_BOUNDS
    BufferUsage.STATIC_DRAW, // SPLIT_DIRECTION_INDEX
  ];

  this._highlightColor = Color.clone(Color.WHITE); // Only used by Vector3DTilePoints

  const that = this;
  this._uniforms = {
    u_atlas: function () {
      return that._textureAtlas.texture;
    },
    u_highlightColor: function () {
      return that._highlightColor;
    },
  };

  const scene = this._scene;
  if (defined(scene) && defined(scene.terrainProviderChanged)) {
    this._removeCallbackFunc = scene.terrainProviderChanged.addEventListener(
      function () {
        const billboards = this._billboards;
        const length = billboards.length;
        for (let i = 0; i < length; ++i) {
          if (defined(billboards[i])) {
            billboards[i]._updateClamping();
          }
        }
      },
      this,
    );
  }
}

Object.defineProperties(BillboardCollection.prototype, {
  /**
   * 返回此集合中广告牌的数量。这通常与
   * {@link BillboardCollection#get} 一起使用，以遍历集合中的所有广告牌。
   * @memberof BillboardCollection.prototype
   * @type {number}
   */

  length: {
    get: function () {
      removeBillboards(this);
      return this._billboards.length;
    },
  },

  /**
   * 获取或设置纹理图集（textureAtlas）。
   * @memberof BillboardCollection.prototype
   * @type {TextureAtlas}
   * @private
   */

  textureAtlas: {
    get: function () {
      return this._textureAtlas;
    },
    set: function (value) {
      if (this._textureAtlas !== value) {
        this._textureAtlas =
          this._destroyTextureAtlas &&
          this._textureAtlas &&
          this._textureAtlas.destroy();
        this._textureAtlas = value;
        this._createVertexArray = true; // New per-billboard texture coordinates
      }
    },
  },

  /**
   * 获取或设置一个值，该值确定纹理图集在集合被销毁时是否被销毁。
   *
   * 如果纹理图集被多个集合使用，请将此值设置为 <code>false</code>，
   * 并显式销毁图集，以避免多次尝试销毁它。
   * 
   * @memberof BillboardCollection.prototype
   * @type {boolean}
   * @private
   *
   * @example
   * // Set destroyTextureAtlas
   * // Destroy a billboard collection but not its texture atlas.
   *
   * const atlas = new TextureAtlas({
   *   scene : scene,
   *   images : images
   * });
   * billboards.textureAtlas = atlas;
   * billboards.destroyTextureAtlas = false;
   * billboards = billboards.destroy();
   * console.log(atlas.isDestroyed()); // False
   */
  destroyTextureAtlas: {
    get: function () {
      return this._destroyTextureAtlas;
    },
    set: function (value) {
      this._destroyTextureAtlas = value;
    },
  },
});

function destroyBillboards(billboards) {
  const length = billboards.length;
  for (let i = 0; i < length; ++i) {
    if (billboards[i]) {
      billboards[i]._destroy();
    }
  }
}

/**
 * 创建并将具有指定初始属性的广告牌添加到集合中。
 * 添加的广告牌将被返回，以便可以在稍后修改或从集合中移除。
 *
 * @param {Billboard.ConstructorOptions} [options] 描述广告牌属性的模板，如示例 1 所示。
 * @returns {Billboard} 添加到集合中的广告牌。
 *
 * @performance 调用 <code>add</code> 预期为常数时间。然而，集合的顶点缓冲区
 * 需要重写 - 这是一个 <code>O(n)</code> 操作，同时会产生 CPU 到 GPU 的开销。
 * 为了获得最佳性能，请在调用 <code>update</code> 之前尽可能添加多个广告牌。
 *
 * @exception {DeveloperError} 此对象已销毁，即调用了 destroy()。
 *
 *
 * @example
 * // Example 1:  Add a billboard, specifying all the default values.
 * const b = billboards.add({
 *   show : true,
 *   position : Cesium.Cartesian3.ZERO,
 *   pixelOffset : Cesium.Cartesian2.ZERO,
 *   eyeOffset : Cesium.Cartesian3.ZERO,
 *   heightReference : Cesium.HeightReference.NONE,
 *   horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
 *   verticalOrigin : Cesium.VerticalOrigin.CENTER,
 *   scale : 1.0,
 *   image : 'url/to/image',
 *   imageSubRegion : undefined,
 *   color : Cesium.Color.WHITE,
 *   id : undefined,
 *   rotation : 0.0,
 *   alignedAxis : Cesium.Cartesian3.ZERO,
 *   width : undefined,
 *   height : undefined,
 *   scaleByDistance : undefined,
 *   translucencyByDistance : undefined,
 *   pixelOffsetScaleByDistance : undefined,
 *   sizeInMeters : false,
 *   distanceDisplayCondition : undefined
 * });
 *
 * @example
 * // Example 2:  Specify only the billboard's cartographic position.
 * const b = billboards.add({
 *   position : Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
 * });
 *
 * @see BillboardCollection#remove
 * @see BillboardCollection#removeAll
 */
BillboardCollection.prototype.add = function (options) {
  const billboard = new Billboard(options, this);
  billboard._index = this._billboards.length;

  this._billboards.push(billboard);
  this._createVertexArray = true;

  return billboard;
};

/**
 * 从集合中移除一个广告牌。
 *
 * @param {Billboard} billboard 要移除的广告牌。
 * @returns {boolean} 如果广告牌被移除则返回 <code>true</code>；如果在集合中未找到广告牌，则返回 <code>false</code>。
 *
 * @performance 调用 <code>remove</code> 预期为常数时间。然而，集合的顶点缓冲区
 * 需要重写 - 这是一个 <code>O(n)</code> 操作，同时会产生 CPU 到 GPU 的开销。
 * 为了获得最佳性能，请在调用 <code>update</code> 之前尽可能移除多个广告牌。
 * 如果您打算暂时隐藏广告牌，通常更有效的方法是调用
 * {@link Billboard#show}，而不是移除并重新添加广告牌。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * const b = billboards.add(...);
 * billboards.remove(b);  // Returns true
 *
 * @see BillboardCollection#add
 * @see BillboardCollection#removeAll
 * @see Billboard#show
 */
BillboardCollection.prototype.remove = function (billboard) {
  if (this.contains(billboard)) {
    this._billboards[billboard._index] = undefined; // Removed later
    this._billboardsRemoved = true;
    this._createVertexArray = true;
    billboard._destroy();
    return true;
  }

  return false;
};

/**
 * 从集合中移除所有广告牌。
 *
 * @performance <code>O(n)</code>。从集合中移除所有广告牌
 * 然后再添加新的广告牌，比完全创建一个新集合更有效。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * billboards.add(...);
 * billboards.add(...);
 * billboards.removeAll();
 *
 * @see BillboardCollection#add
 * @see BillboardCollection#remove
 */
BillboardCollection.prototype.removeAll = function () {
  destroyBillboards(this._billboards);
  this._billboards = [];
  this._billboardsToUpdate = [];
  this._billboardsToUpdateIndex = 0;
  this._billboardsRemoved = false;

  this._createVertexArray = true;
};

function removeBillboards(billboardCollection) {
  if (billboardCollection._billboardsRemoved) {
    billboardCollection._billboardsRemoved = false;

    const newBillboards = [];
    const billboards = billboardCollection._billboards;
    const length = billboards.length;
    for (let i = 0, j = 0; i < length; ++i) {
      const billboard = billboards[i];
      if (defined(billboard)) {
        billboard._index = j++;
        newBillboards.push(billboard);
      }
    }

    billboardCollection._billboards = newBillboards;
  }
}

BillboardCollection.prototype._updateBillboard = function (
  billboard,
  propertyChanged,
) {
  if (!billboard._dirty) {
    this._billboardsToUpdate[this._billboardsToUpdateIndex++] = billboard;
  }

  ++this._propertiesChanged[propertyChanged];
};

/**
 * 检查此集合是否包含给定的广告牌。
 *
 * @param {Billboard} [billboard] 要检查的广告牌。
 * @returns {boolean} 如果此集合包含广告牌则返回 true，否则返回 false。
 *
 * @see BillboardCollection#get
 */

BillboardCollection.prototype.contains = function (billboard) {
  return defined(billboard) && billboard._billboardCollection === this;
};

/**
 * 返回集合中指定索引的广告牌。索引是零基础的
 * 随着广告牌的添加而增加。移除一个广告牌将把其后的所有广告牌向左移动，从而改变它们的索引。
 * 此函数通常与 {@link BillboardCollection#length} 一起使用，以遍历集合中的所有广告牌。
 *
 * @param {number} index 广告牌的零基础索引。
 * @returns {Billboard} 指定索引处的广告牌。
 *
 * @performance 预期为常数时间。如果从集合中移除广告牌而没有调用
 * {@link BillboardCollection#update}，则执行隐式的 <code>O(n)</code>
 * 操作。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 * @example
 * // Toggle the show property of every billboard in the collection
 * const len = billboards.length;
 * for (let i = 0; i < len; ++i) {
 *   const b = billboards.get(i);
 *   b.show = !b.show;
 * }
 *
 * @see BillboardCollection#length
 */
BillboardCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("index", index);
  //>>includeEnd('debug');

  removeBillboards(this);
  return this._billboards[index];
};

let getIndexBuffer;

function getIndexBufferBatched(context) {
  const sixteenK = 16 * 1024;

  let indexBuffer = context.cache.billboardCollection_indexBufferBatched;
  if (defined(indexBuffer)) {
    return indexBuffer;
  }

  // Subtract 6 because the last index is reserverd for primitive restart.
  // https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.18
  const length = sixteenK * 6 - 6;
  const indices = new Uint16Array(length);
  for (let i = 0, j = 0; i < length; i += 6, j += 4) {
    indices[i] = j;
    indices[i + 1] = j + 1;
    indices[i + 2] = j + 2;

    indices[i + 3] = j + 0;
    indices[i + 4] = j + 2;
    indices[i + 5] = j + 3;
  }

  // PERFORMANCE_IDEA:  Should we reference count billboard collections, and eventually delete this?
  // Is this too much memory to allocate up front?  Should we dynamically grow it?
  indexBuffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: indices,
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT,
  });
  indexBuffer.vertexArrayDestroyable = false;
  context.cache.billboardCollection_indexBufferBatched = indexBuffer;
  return indexBuffer;
}

function getIndexBufferInstanced(context) {
  let indexBuffer = context.cache.billboardCollection_indexBufferInstanced;
  if (defined(indexBuffer)) {
    return indexBuffer;
  }

  indexBuffer = Buffer.createIndexBuffer({
    context: context,
    typedArray: new Uint16Array([0, 1, 2, 0, 2, 3]),
    usage: BufferUsage.STATIC_DRAW,
    indexDatatype: IndexDatatype.UNSIGNED_SHORT,
  });

  indexBuffer.vertexArrayDestroyable = false;
  context.cache.billboardCollection_indexBufferInstanced = indexBuffer;
  return indexBuffer;
}

function getVertexBufferInstanced(context) {
  let vertexBuffer = context.cache.billboardCollection_vertexBufferInstanced;
  if (defined(vertexBuffer)) {
    return vertexBuffer;
  }

  vertexBuffer = Buffer.createVertexBuffer({
    context: context,
    typedArray: new Float32Array([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0]),
    usage: BufferUsage.STATIC_DRAW,
  });

  vertexBuffer.vertexArrayDestroyable = false;
  context.cache.billboardCollection_vertexBufferInstanced = vertexBuffer;
  return vertexBuffer;
}

BillboardCollection.prototype.computeNewBuffersUsage = function () {
  const buffersUsage = this._buffersUsage;
  let usageChanged = false;

  const properties = this._propertiesChanged;
  for (let k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
    const newUsage =
      properties[k] === 0 ? BufferUsage.STATIC_DRAW : BufferUsage.STREAM_DRAW;
    usageChanged = usageChanged || buffersUsage[k] !== newUsage;
    buffersUsage[k] = newUsage;
  }

  return usageChanged;
};

function createVAF(
  context,
  numberOfBillboards,
  buffersUsage,
  instanced,
  batchTable,
  sdf,
) {
  const attributes = [
    {
      index: attributeLocations.positionHighAndScale,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[POSITION_INDEX],
    },
    {
      index: attributeLocations.positionLowAndRotation,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[POSITION_INDEX],
    },
    {
      index: attributeLocations.compressedAttribute0,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[PIXEL_OFFSET_INDEX],
    },
    {
      index: attributeLocations.compressedAttribute1,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[TRANSLUCENCY_BY_DISTANCE_INDEX],
    },
    {
      index: attributeLocations.compressedAttribute2,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[COLOR_INDEX],
    },
    {
      index: attributeLocations.eyeOffset,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[EYE_OFFSET_INDEX],
    },
    {
      index: attributeLocations.scaleByDistance,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[SCALE_BY_DISTANCE_INDEX],
    },
    {
      index: attributeLocations.pixelOffsetScaleByDistance,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX],
    },
    {
      index: attributeLocations.compressedAttribute3,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[DISTANCE_DISPLAY_CONDITION_INDEX],
    },
    {
      index: attributeLocations.textureCoordinateBoundsOrLabelTranslate,
      componentsPerAttribute: 4,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[TEXTURE_COORDINATE_BOUNDS],
    },
    {
      index: attributeLocations.splitDirection,
      componentsPerAttribute: 1,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[SPLIT_DIRECTION_INDEX],
    },
  ];

  // Instancing requires one non-instanced attribute.
  if (instanced) {
    attributes.push({
      index: attributeLocations.direction,
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
      vertexBuffer: getVertexBufferInstanced(context),
    });
  }

  if (defined(batchTable)) {
    attributes.push({
      index: attributeLocations.a_batchId,
      componentsPerAttribute: 1,
      componentDatatype: ComponentDatatype.FLOAT,
      bufferUsage: BufferUsage.STATIC_DRAW,
    });
  }

  if (sdf) {
    attributes.push({
      index: attributeLocations.sdf,
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
      usage: buffersUsage[SDF_INDEX],
    });
  }

  // When instancing is enabled, only one vertex is needed for each billboard.
  const sizeInVertices = instanced
    ? numberOfBillboards
    : 4 * numberOfBillboards;
  return new VertexArrayFacade(context, attributes, sizeInVertices, instanced);
}

///////////////////////////////////////////////////////////////////////////

// Four vertices per billboard.  Each has the same position, etc., but a different screen-space direction vector.

// PERFORMANCE_IDEA:  Save memory if a property is the same for all billboards, use a latched attribute state,
// instead of storing it in a vertex buffer.

const writePositionScratch = new EncodedCartesian3();

function writePositionScaleAndRotation(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const positionHighWriter =
    vafWriters[attributeLocations.positionHighAndScale];
  const positionLowWriter =
    vafWriters[attributeLocations.positionLowAndRotation];
  const position = billboard._getActualPosition();

  if (billboardCollection._mode === SceneMode.SCENE3D) {
    BoundingSphere.expand(
      billboardCollection._baseVolume,
      position,
      billboardCollection._baseVolume,
    );
    billboardCollection._boundingVolumeDirty = true;
  }

  EncodedCartesian3.fromCartesian(position, writePositionScratch);
  const scale = billboard.scale;
  const rotation = billboard.rotation;

  if (rotation !== 0.0) {
    billboardCollection._shaderRotation = true;
  }

  billboardCollection._maxScale = Math.max(
    billboardCollection._maxScale,
    scale,
  );

  const high = writePositionScratch.high;
  const low = writePositionScratch.low;

  if (billboardCollection._instanced) {
    i = billboard._index;
    positionHighWriter(i, high.x, high.y, high.z, scale);
    positionLowWriter(i, low.x, low.y, low.z, rotation);
  } else {
    i = billboard._index * 4;
    positionHighWriter(i + 0, high.x, high.y, high.z, scale);
    positionHighWriter(i + 1, high.x, high.y, high.z, scale);
    positionHighWriter(i + 2, high.x, high.y, high.z, scale);
    positionHighWriter(i + 3, high.x, high.y, high.z, scale);

    positionLowWriter(i + 0, low.x, low.y, low.z, rotation);
    positionLowWriter(i + 1, low.x, low.y, low.z, rotation);
    positionLowWriter(i + 2, low.x, low.y, low.z, rotation);
    positionLowWriter(i + 3, low.x, low.y, low.z, rotation);
  }
}

const scratchCartesian2 = new Cartesian2();

const UPPER_BOUND = 32768.0; // 2^15

const LEFT_SHIFT16 = 65536.0; // 2^16
const LEFT_SHIFT12 = 4096.0; // 2^12
const LEFT_SHIFT8 = 256.0; // 2^8
const LEFT_SHIFT7 = 128.0;
const LEFT_SHIFT5 = 32.0;
const LEFT_SHIFT3 = 8.0;
const LEFT_SHIFT2 = 4.0;

const RIGHT_SHIFT8 = 1.0 / 256.0;

const LOWER_LEFT = 0.0;
const LOWER_RIGHT = 2.0;
const UPPER_RIGHT = 3.0;
const UPPER_LEFT = 1.0;

function writeCompressedAttrib0(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.compressedAttribute0];
  const pixelOffset = billboard.pixelOffset;
  const pixelOffsetX = pixelOffset.x;
  const pixelOffsetY = pixelOffset.y;

  const translate = billboard._translate;
  const translateX = translate.x;
  const translateY = translate.y;

  billboardCollection._maxPixelOffset = Math.max(
    billboardCollection._maxPixelOffset,
    Math.abs(pixelOffsetX + translateX),
    Math.abs(-pixelOffsetY + translateY),
  );

  const horizontalOrigin = billboard.horizontalOrigin;
  let verticalOrigin = billboard._verticalOrigin;
  let show = billboard.show && billboard.clusterShow;

  // If the color alpha is zero, do not show this billboard.  This lets us avoid providing
  // color during the pick pass and also eliminates a discard in the fragment shader.
  if (billboard.color.alpha === 0.0) {
    show = false;
  }

  // Raw billboards don't distinguish between BASELINE and BOTTOM, only LabelCollection does that.
  if (verticalOrigin === VerticalOrigin.BASELINE) {
    verticalOrigin = VerticalOrigin.BOTTOM;
  }

  billboardCollection._allHorizontalCenter =
    billboardCollection._allHorizontalCenter &&
    horizontalOrigin === HorizontalOrigin.CENTER;
  billboardCollection._allVerticalCenter =
    billboardCollection._allVerticalCenter &&
    verticalOrigin === VerticalOrigin.CENTER;

  let bottomLeftX = 0;
  let bottomLeftY = 0;
  let width = 0;
  let height = 0;
  const index = billboard._imageIndex;
  if (index !== -1) {
    const imageRectangle = textureAtlasCoordinates[index];

    //>>includeStart('debug', pragmas.debug);
    if (!defined(imageRectangle)) {
      throw new DeveloperError(`Invalid billboard image index: ${index}`);
    }
    //>>includeEnd('debug');

    bottomLeftX = imageRectangle.x;
    bottomLeftY = imageRectangle.y;
    width = imageRectangle.width;
    height = imageRectangle.height;
  }
  const topRightX = bottomLeftX + width;
  const topRightY = bottomLeftY + height;

  let compressed0 =
    Math.floor(
      CesiumMath.clamp(pixelOffsetX, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND,
    ) * LEFT_SHIFT7;
  compressed0 += (horizontalOrigin + 1.0) * LEFT_SHIFT5;
  compressed0 += (verticalOrigin + 1.0) * LEFT_SHIFT3;
  compressed0 += (show ? 1.0 : 0.0) * LEFT_SHIFT2;

  let compressed1 =
    Math.floor(
      CesiumMath.clamp(pixelOffsetY, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND,
    ) * LEFT_SHIFT8;
  let compressed2 =
    Math.floor(
      CesiumMath.clamp(translateX, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND,
    ) * LEFT_SHIFT8;

  const tempTanslateY =
    (CesiumMath.clamp(translateY, -UPPER_BOUND, UPPER_BOUND) + UPPER_BOUND) *
    RIGHT_SHIFT8;
  const upperTranslateY = Math.floor(tempTanslateY);
  const lowerTranslateY = Math.floor(
    (tempTanslateY - upperTranslateY) * LEFT_SHIFT8,
  );

  compressed1 += upperTranslateY;
  compressed2 += lowerTranslateY;

  scratchCartesian2.x = bottomLeftX;
  scratchCartesian2.y = bottomLeftY;
  const compressedTexCoordsLL =
    AttributeCompression.compressTextureCoordinates(scratchCartesian2);
  scratchCartesian2.x = topRightX;
  const compressedTexCoordsLR =
    AttributeCompression.compressTextureCoordinates(scratchCartesian2);
  scratchCartesian2.y = topRightY;
  const compressedTexCoordsUR =
    AttributeCompression.compressTextureCoordinates(scratchCartesian2);
  scratchCartesian2.x = bottomLeftX;
  const compressedTexCoordsUL =
    AttributeCompression.compressTextureCoordinates(scratchCartesian2);

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, compressed0, compressed1, compressed2, compressedTexCoordsLL);
  } else {
    i = billboard._index * 4;
    writer(
      i + 0,
      compressed0 + LOWER_LEFT,
      compressed1,
      compressed2,
      compressedTexCoordsLL,
    );
    writer(
      i + 1,
      compressed0 + LOWER_RIGHT,
      compressed1,
      compressed2,
      compressedTexCoordsLR,
    );
    writer(
      i + 2,
      compressed0 + UPPER_RIGHT,
      compressed1,
      compressed2,
      compressedTexCoordsUR,
    );
    writer(
      i + 3,
      compressed0 + UPPER_LEFT,
      compressed1,
      compressed2,
      compressedTexCoordsUL,
    );
  }
}

function writeCompressedAttrib1(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.compressedAttribute1];
  const alignedAxis = billboard.alignedAxis;
  if (!Cartesian3.equals(alignedAxis, Cartesian3.ZERO)) {
    billboardCollection._shaderAlignedAxis = true;
  }

  let near = 0.0;
  let nearValue = 1.0;
  let far = 1.0;
  let farValue = 1.0;

  const translucency = billboard.translucencyByDistance;
  if (defined(translucency)) {
    near = translucency.near;
    nearValue = translucency.nearValue;
    far = translucency.far;
    farValue = translucency.farValue;

    if (nearValue !== 1.0 || farValue !== 1.0) {
      // translucency by distance calculation in shader need not be enabled
      // until a billboard with near and far !== 1.0 is found
      billboardCollection._shaderTranslucencyByDistance = true;
    }
  }

  let width = 0;
  const index = billboard._imageIndex;
  if (index !== -1) {
    const imageRectangle = textureAtlasCoordinates[index];

    //>>includeStart('debug', pragmas.debug);
    if (!defined(imageRectangle)) {
      throw new DeveloperError(`Invalid billboard image index: ${index}`);
    }
    //>>includeEnd('debug');

    width = imageRectangle.width;
  }

  const textureWidth = billboardCollection._textureAtlas.texture.width;
  const imageWidth = Math.round(
    defaultValue(billboard.width, textureWidth * width),
  );
  billboardCollection._maxSize = Math.max(
    billboardCollection._maxSize,
    imageWidth,
  );

  let compressed0 = CesiumMath.clamp(imageWidth, 0.0, LEFT_SHIFT16);
  let compressed1 = 0.0;

  if (
    Math.abs(Cartesian3.magnitudeSquared(alignedAxis) - 1.0) <
    CesiumMath.EPSILON6
  ) {
    compressed1 = AttributeCompression.octEncodeFloat(alignedAxis);
  }

  nearValue = CesiumMath.clamp(nearValue, 0.0, 1.0);
  nearValue = nearValue === 1.0 ? 255.0 : (nearValue * 255.0) | 0;
  compressed0 = compressed0 * LEFT_SHIFT8 + nearValue;

  farValue = CesiumMath.clamp(farValue, 0.0, 1.0);
  farValue = farValue === 1.0 ? 255.0 : (farValue * 255.0) | 0;
  compressed1 = compressed1 * LEFT_SHIFT8 + farValue;

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, compressed0, compressed1, near, far);
  } else {
    i = billboard._index * 4;
    writer(i + 0, compressed0, compressed1, near, far);
    writer(i + 1, compressed0, compressed1, near, far);
    writer(i + 2, compressed0, compressed1, near, far);
    writer(i + 3, compressed0, compressed1, near, far);
  }
}

function writeCompressedAttrib2(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.compressedAttribute2];
  const color = billboard.color;
  const pickColor = !defined(billboardCollection._batchTable)
    ? billboard.getPickId(frameState.context).color
    : Color.WHITE;
  const sizeInMeters = billboard.sizeInMeters ? 1.0 : 0.0;
  const validAlignedAxis =
    Math.abs(Cartesian3.magnitudeSquared(billboard.alignedAxis) - 1.0) <
    CesiumMath.EPSILON6
      ? 1.0
      : 0.0;

  billboardCollection._allSizedInMeters =
    billboardCollection._allSizedInMeters && sizeInMeters === 1.0;

  let height = 0;
  const index = billboard._imageIndex;
  if (index !== -1) {
    const imageRectangle = textureAtlasCoordinates[index];

    //>>includeStart('debug', pragmas.debug);
    if (!defined(imageRectangle)) {
      throw new DeveloperError(`Invalid billboard image index: ${index}`);
    }
    //>>includeEnd('debug');

    height = imageRectangle.height;
  }

  const dimensions = billboardCollection._textureAtlas.texture.dimensions;
  const imageHeight = Math.round(
    defaultValue(billboard.height, dimensions.y * height),
  );
  billboardCollection._maxSize = Math.max(
    billboardCollection._maxSize,
    imageHeight,
  );
  let labelHorizontalOrigin = defaultValue(
    billboard._labelHorizontalOrigin,
    -2,
  );
  labelHorizontalOrigin += 2;
  const compressed3 = imageHeight * LEFT_SHIFT2 + labelHorizontalOrigin;

  let red = Color.floatToByte(color.red);
  let green = Color.floatToByte(color.green);
  let blue = Color.floatToByte(color.blue);
  const compressed0 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  red = Color.floatToByte(pickColor.red);
  green = Color.floatToByte(pickColor.green);
  blue = Color.floatToByte(pickColor.blue);
  const compressed1 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  let compressed2 =
    Color.floatToByte(color.alpha) * LEFT_SHIFT16 +
    Color.floatToByte(pickColor.alpha) * LEFT_SHIFT8;
  compressed2 += sizeInMeters * 2.0 + validAlignedAxis;

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, compressed0, compressed1, compressed2, compressed3);
  } else {
    i = billboard._index * 4;
    writer(i + 0, compressed0, compressed1, compressed2, compressed3);
    writer(i + 1, compressed0, compressed1, compressed2, compressed3);
    writer(i + 2, compressed0, compressed1, compressed2, compressed3);
    writer(i + 3, compressed0, compressed1, compressed2, compressed3);
  }
}

function writeEyeOffset(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.eyeOffset];
  const eyeOffset = billboard.eyeOffset;

  // For billboards that are clamped to ground, move it slightly closer to the camera
  let eyeOffsetZ = eyeOffset.z;
  if (billboard._heightReference !== HeightReference.NONE) {
    eyeOffsetZ *= 1.005;
  }
  billboardCollection._maxEyeOffset = Math.max(
    billboardCollection._maxEyeOffset,
    Math.abs(eyeOffset.x),
    Math.abs(eyeOffset.y),
    Math.abs(eyeOffsetZ),
  );

  if (billboardCollection._instanced) {
    let width = 0;
    let height = 0;
    const index = billboard._imageIndex;
    if (index !== -1) {
      const imageRectangle = textureAtlasCoordinates[index];

      //>>includeStart('debug', pragmas.debug);
      if (!defined(imageRectangle)) {
        throw new DeveloperError(`Invalid billboard image index: ${index}`);
      }
      //>>includeEnd('debug');

      width = imageRectangle.width;
      height = imageRectangle.height;
    }

    scratchCartesian2.x = width;
    scratchCartesian2.y = height;
    const compressedTexCoordsRange =
      AttributeCompression.compressTextureCoordinates(scratchCartesian2);

    i = billboard._index;
    writer(i, eyeOffset.x, eyeOffset.y, eyeOffsetZ, compressedTexCoordsRange);
  } else {
    i = billboard._index * 4;
    writer(i + 0, eyeOffset.x, eyeOffset.y, eyeOffsetZ, 0.0);
    writer(i + 1, eyeOffset.x, eyeOffset.y, eyeOffsetZ, 0.0);
    writer(i + 2, eyeOffset.x, eyeOffset.y, eyeOffsetZ, 0.0);
    writer(i + 3, eyeOffset.x, eyeOffset.y, eyeOffsetZ, 0.0);
  }
}

function writeScaleByDistance(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.scaleByDistance];
  let near = 0.0;
  let nearValue = 1.0;
  let far = 1.0;
  let farValue = 1.0;

  const scale = billboard.scaleByDistance;
  if (defined(scale)) {
    near = scale.near;
    nearValue = scale.nearValue;
    far = scale.far;
    farValue = scale.farValue;

    if (nearValue !== 1.0 || farValue !== 1.0) {
      // scale by distance calculation in shader need not be enabled
      // until a billboard with near and far !== 1.0 is found
      billboardCollection._shaderScaleByDistance = true;
    }
  }

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, near, nearValue, far, farValue);
  } else {
    i = billboard._index * 4;
    writer(i + 0, near, nearValue, far, farValue);
    writer(i + 1, near, nearValue, far, farValue);
    writer(i + 2, near, nearValue, far, farValue);
    writer(i + 3, near, nearValue, far, farValue);
  }
}

function writePixelOffsetScaleByDistance(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.pixelOffsetScaleByDistance];
  let near = 0.0;
  let nearValue = 1.0;
  let far = 1.0;
  let farValue = 1.0;

  const pixelOffsetScale = billboard.pixelOffsetScaleByDistance;
  if (defined(pixelOffsetScale)) {
    near = pixelOffsetScale.near;
    nearValue = pixelOffsetScale.nearValue;
    far = pixelOffsetScale.far;
    farValue = pixelOffsetScale.farValue;

    if (nearValue !== 1.0 || farValue !== 1.0) {
      // pixelOffsetScale by distance calculation in shader need not be enabled
      // until a billboard with near and far !== 1.0 is found
      billboardCollection._shaderPixelOffsetScaleByDistance = true;
    }
  }

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, near, nearValue, far, farValue);
  } else {
    i = billboard._index * 4;
    writer(i + 0, near, nearValue, far, farValue);
    writer(i + 1, near, nearValue, far, farValue);
    writer(i + 2, near, nearValue, far, farValue);
    writer(i + 3, near, nearValue, far, farValue);
  }
}

function writeCompressedAttribute3(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  let i;
  const writer = vafWriters[attributeLocations.compressedAttribute3];
  let near = 0.0;
  let far = Number.MAX_VALUE;

  const distanceDisplayCondition = billboard.distanceDisplayCondition;
  if (defined(distanceDisplayCondition)) {
    near = distanceDisplayCondition.near;
    far = distanceDisplayCondition.far;

    near *= near;
    far *= far;

    billboardCollection._shaderDistanceDisplayCondition = true;
  }

  let disableDepthTestDistance = billboard.disableDepthTestDistance;
  const clampToGround =
    isHeightReferenceClamp(billboard.heightReference) &&
    frameState.context.depthTexture;
  if (!defined(disableDepthTestDistance)) {
    disableDepthTestDistance = clampToGround ? 5000.0 : 0.0;
  }

  disableDepthTestDistance *= disableDepthTestDistance;
  if (clampToGround || disableDepthTestDistance > 0.0) {
    billboardCollection._shaderDisableDepthDistance = true;
    if (disableDepthTestDistance === Number.POSITIVE_INFINITY) {
      disableDepthTestDistance = -1.0;
    }
  }

  let imageHeight;
  let imageWidth;

  if (!defined(billboard._labelDimensions)) {
    let height = 0;
    let width = 0;
    const index = billboard._imageIndex;
    if (index !== -1) {
      const imageRectangle = textureAtlasCoordinates[index];

      //>>includeStart('debug', pragmas.debug);
      if (!defined(imageRectangle)) {
        throw new DeveloperError(`Invalid billboard image index: ${index}`);
      }
      //>>includeEnd('debug');

      height = imageRectangle.height;
      width = imageRectangle.width;
    }

    imageHeight = Math.round(
      defaultValue(
        billboard.height,
        billboardCollection._textureAtlas.texture.dimensions.y * height,
      ),
    );

    const textureWidth = billboardCollection._textureAtlas.texture.width;
    imageWidth = Math.round(
      defaultValue(billboard.width, textureWidth * width),
    );
  } else {
    imageWidth = billboard._labelDimensions.x;
    imageHeight = billboard._labelDimensions.y;
  }

  const w = Math.floor(CesiumMath.clamp(imageWidth, 0.0, LEFT_SHIFT12));
  const h = Math.floor(CesiumMath.clamp(imageHeight, 0.0, LEFT_SHIFT12));
  const dimensions = w * LEFT_SHIFT12 + h;

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, near, far, disableDepthTestDistance, dimensions);
  } else {
    i = billboard._index * 4;
    writer(i + 0, near, far, disableDepthTestDistance, dimensions);
    writer(i + 1, near, far, disableDepthTestDistance, dimensions);
    writer(i + 2, near, far, disableDepthTestDistance, dimensions);
    writer(i + 3, near, far, disableDepthTestDistance, dimensions);
  }
}

function writeTextureCoordinateBoundsOrLabelTranslate(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  if (isHeightReferenceClamp(billboard.heightReference)) {
    const scene = billboardCollection._scene;
    const context = frameState.context;
    const globeTranslucent = frameState.globeTranslucencyState.translucent;
    const depthTestAgainstTerrain =
      defined(scene.globe) && scene.globe.depthTestAgainstTerrain;

    // Only do manual depth test if the globe is opaque and writes depth
    billboardCollection._shaderClampToGround =
      context.depthTexture && !globeTranslucent && depthTestAgainstTerrain;
  }
  let i;
  const writer =
    vafWriters[attributeLocations.textureCoordinateBoundsOrLabelTranslate];

  if (ContextLimits.maximumVertexTextureImageUnits > 0) {
    //write _labelTranslate, used by depth testing in the vertex shader
    let translateX = 0;
    let translateY = 0;
    if (defined(billboard._labelTranslate)) {
      translateX = billboard._labelTranslate.x;
      translateY = billboard._labelTranslate.y;
    }
    if (billboardCollection._instanced) {
      i = billboard._index;
      writer(i, translateX, translateY, 0.0, 0.0);
    } else {
      i = billboard._index * 4;
      writer(i + 0, translateX, translateY, 0.0, 0.0);
      writer(i + 1, translateX, translateY, 0.0, 0.0);
      writer(i + 2, translateX, translateY, 0.0, 0.0);
      writer(i + 3, translateX, translateY, 0.0, 0.0);
    }
    return;
  }

  //write texture coordinate bounds, used by depth testing in fragment shader
  let minX = 0;
  let minY = 0;
  let width = 0;
  let height = 0;
  const index = billboard._imageIndex;
  if (index !== -1) {
    const imageRectangle = textureAtlasCoordinates[index];

    //>>includeStart('debug', pragmas.debug);
    if (!defined(imageRectangle)) {
      throw new DeveloperError(`Invalid billboard image index: ${index}`);
    }
    //>>includeEnd('debug');

    minX = imageRectangle.x;
    minY = imageRectangle.y;
    width = imageRectangle.width;
    height = imageRectangle.height;
  }
  const maxX = minX + width;
  const maxY = minY + height;

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, minX, minY, maxX, maxY);
  } else {
    i = billboard._index * 4;
    writer(i + 0, minX, minY, maxX, maxY);
    writer(i + 1, minX, minY, maxX, maxY);
    writer(i + 2, minX, minY, maxX, maxY);
    writer(i + 3, minX, minY, maxX, maxY);
  }
}

function writeBatchId(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  if (!defined(billboardCollection._batchTable)) {
    return;
  }

  const writer = vafWriters[attributeLocations.a_batchId];
  const id = billboard._batchIndex;

  let i;
  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, id);
  } else {
    i = billboard._index * 4;
    writer(i + 0, id);
    writer(i + 1, id);
    writer(i + 2, id);
    writer(i + 3, id);
  }
}

function writeSDF(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  if (!billboardCollection._sdf) {
    return;
  }

  let i;
  const writer = vafWriters[attributeLocations.sdf];

  const outlineColor = billboard.outlineColor;
  const outlineWidth = billboard.outlineWidth;

  const red = Color.floatToByte(outlineColor.red);
  const green = Color.floatToByte(outlineColor.green);
  const blue = Color.floatToByte(outlineColor.blue);
  const compressed0 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  // Compute the relative outline distance
  const outlineDistance = outlineWidth / SDFSettings.RADIUS;
  const compressed1 =
    Color.floatToByte(outlineColor.alpha) * LEFT_SHIFT16 +
    Color.floatToByte(outlineDistance) * LEFT_SHIFT8;

  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, compressed0, compressed1);
  } else {
    i = billboard._index * 4;
    writer(i + 0, compressed0 + LOWER_LEFT, compressed1);
    writer(i + 1, compressed0 + LOWER_RIGHT, compressed1);
    writer(i + 2, compressed0 + UPPER_RIGHT, compressed1);
    writer(i + 3, compressed0 + UPPER_LEFT, compressed1);
  }
}

function writeSplitDirection(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  const writer = vafWriters[attributeLocations.splitDirection];
  let direction = 0.0;

  const split = billboard.splitDirection;
  if (defined(split)) {
    direction = split;
  }

  let i;
  if (billboardCollection._instanced) {
    i = billboard._index;
    writer(i, direction);
  } else {
    i = billboard._index * 4;
    writer(i + 0, direction);
    writer(i + 1, direction);
    writer(i + 2, direction);
    writer(i + 3, direction);
  }
}

function writeBillboard(
  billboardCollection,
  frameState,
  textureAtlasCoordinates,
  vafWriters,
  billboard,
) {
  writePositionScaleAndRotation(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeCompressedAttrib0(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeCompressedAttrib1(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeCompressedAttrib2(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeEyeOffset(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeScaleByDistance(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writePixelOffsetScaleByDistance(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeCompressedAttribute3(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeTextureCoordinateBoundsOrLabelTranslate(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeBatchId(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeSDF(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
  writeSplitDirection(
    billboardCollection,
    frameState,
    textureAtlasCoordinates,
    vafWriters,
    billboard,
  );
}

function recomputeActualPositions(
  billboardCollection,
  billboards,
  length,
  frameState,
  modelMatrix,
  recomputeBoundingVolume,
) {
  let boundingVolume;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingVolume = billboardCollection._baseVolume;
    billboardCollection._boundingVolumeDirty = true;
  } else {
    boundingVolume = billboardCollection._baseVolume2D;
  }

  const positions = [];
  for (let i = 0; i < length; ++i) {
    const billboard = billboards[i];
    const position = billboard.position;
    const actualPosition = Billboard._computeActualPosition(
      billboard,
      position,
      frameState,
      modelMatrix,
    );
    if (defined(actualPosition)) {
      billboard._setActualPosition(actualPosition);

      if (recomputeBoundingVolume) {
        positions.push(actualPosition);
      } else {
        BoundingSphere.expand(boundingVolume, actualPosition, boundingVolume);
      }
    }
  }

  if (recomputeBoundingVolume) {
    BoundingSphere.fromPoints(positions, boundingVolume);
  }
}

function updateMode(billboardCollection, frameState) {
  const mode = frameState.mode;

  const billboards = billboardCollection._billboards;
  const billboardsToUpdate = billboardCollection._billboardsToUpdate;
  const modelMatrix = billboardCollection._modelMatrix;

  if (
    billboardCollection._createVertexArray ||
    billboardCollection._mode !== mode ||
    (mode !== SceneMode.SCENE3D &&
      !Matrix4.equals(modelMatrix, billboardCollection.modelMatrix))
  ) {
    billboardCollection._mode = mode;
    Matrix4.clone(billboardCollection.modelMatrix, modelMatrix);
    billboardCollection._createVertexArray = true;

    if (
      mode === SceneMode.SCENE3D ||
      mode === SceneMode.SCENE2D ||
      mode === SceneMode.COLUMBUS_VIEW
    ) {
      recomputeActualPositions(
        billboardCollection,
        billboards,
        billboards.length,
        frameState,
        modelMatrix,
        true,
      );
    }
  } else if (mode === SceneMode.MORPHING) {
    recomputeActualPositions(
      billboardCollection,
      billboards,
      billboards.length,
      frameState,
      modelMatrix,
      true,
    );
  } else if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
    recomputeActualPositions(
      billboardCollection,
      billboardsToUpdate,
      billboardCollection._billboardsToUpdateIndex,
      frameState,
      modelMatrix,
      false,
    );
  }
}

function updateBoundingVolume(collection, frameState, boundingVolume) {
  let pixelScale = 1.0;
  if (!collection._allSizedInMeters || collection._maxPixelOffset !== 0.0) {
    pixelScale = frameState.camera.getPixelSize(
      boundingVolume,
      frameState.context.drawingBufferWidth,
      frameState.context.drawingBufferHeight,
    );
  }

  let size = pixelScale * collection._maxScale * collection._maxSize * 2.0;
  if (collection._allHorizontalCenter && collection._allVerticalCenter) {
    size *= 0.5;
  }

  const offset =
    pixelScale * collection._maxPixelOffset + collection._maxEyeOffset;
  boundingVolume.radius += size + offset;
}

function createDebugCommand(billboardCollection, context) {
  const fs =
    "uniform sampler2D billboard_texture; \n" +
    "in vec2 v_textureCoordinates; \n" +
    "void main() \n" +
    "{ \n" +
    "    out_FragColor = texture(billboard_texture, v_textureCoordinates); \n" +
    "} \n";

  const drawCommand = context.createViewportQuadCommand(fs, {
    uniformMap: {
      billboard_texture: function () {
        return billboardCollection._textureAtlas.texture;
      },
    },
  });
  drawCommand.pass = Pass.OVERLAY;
  return drawCommand;
}

const scratchWriterArray = [];

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，以
 * 获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此函数。此文档仅用于
 * 列出在场景渲染时可能传播的异常：
 * </p>
 *
 * @exception {RuntimeError} 具有 id 的图像必须在图集中。
 */

BillboardCollection.prototype.update = function (frameState) {
  removeBillboards(this);

  if (!this.show) {
    return;
  }

  let billboards = this._billboards;
  let billboardsLength = billboards.length;

  const context = frameState.context;
  this._instanced = context.instancedArrays;
  attributeLocations = this._instanced
    ? attributeLocationsInstanced
    : attributeLocationsBatched;
  getIndexBuffer = this._instanced
    ? getIndexBufferInstanced
    : getIndexBufferBatched;

  let textureAtlas = this._textureAtlas;
  if (!defined(textureAtlas)) {
    textureAtlas = this._textureAtlas = new TextureAtlas({
      context: context,
    });

    for (let ii = 0; ii < billboardsLength; ++ii) {
      billboards[ii]._loadImage();
    }
  }

  const textureAtlasCoordinates = textureAtlas.textureCoordinates;
  if (textureAtlasCoordinates.length === 0) {
    // Can't write billboard vertices until we have texture coordinates
    // provided by a texture atlas
    return;
  }

  updateMode(this, frameState);

  billboards = this._billboards;
  billboardsLength = billboards.length;
  const billboardsToUpdate = this._billboardsToUpdate;
  const billboardsToUpdateLength = this._billboardsToUpdateIndex;

  const properties = this._propertiesChanged;

  const textureAtlasGUID = textureAtlas.guid;
  const createVertexArray =
    this._createVertexArray || this._textureAtlasGUID !== textureAtlasGUID;
  this._textureAtlasGUID = textureAtlasGUID;

  let vafWriters;
  const pass = frameState.passes;
  const picking = pass.pick;

  // PERFORMANCE_IDEA: Round robin multiple buffers.
  if (createVertexArray || (!picking && this.computeNewBuffersUsage())) {
    this._createVertexArray = false;

    for (let k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
      properties[k] = 0;
    }

    this._vaf = this._vaf && this._vaf.destroy();

    if (billboardsLength > 0) {
      // PERFORMANCE_IDEA:  Instead of creating a new one, resize like std::vector.
      this._vaf = createVAF(
        context,
        billboardsLength,
        this._buffersUsage,
        this._instanced,
        this._batchTable,
        this._sdf,
      );
      vafWriters = this._vaf.writers;

      // Rewrite entire buffer if billboards were added or removed.
      for (let i = 0; i < billboardsLength; ++i) {
        const billboard = this._billboards[i];
        billboard._dirty = false; // In case it needed an update.
        writeBillboard(
          this,
          frameState,
          textureAtlasCoordinates,
          vafWriters,
          billboard,
        );
      }

      // Different billboard collections share the same index buffer.
      this._vaf.commit(getIndexBuffer(context));
    }

    this._billboardsToUpdateIndex = 0;
  } else if (billboardsToUpdateLength > 0) {
    // Billboards were modified, but none were added or removed.
    const writers = scratchWriterArray;
    writers.length = 0;

    if (
      properties[POSITION_INDEX] ||
      properties[ROTATION_INDEX] ||
      properties[SCALE_INDEX]
    ) {
      writers.push(writePositionScaleAndRotation);
    }

    if (
      properties[IMAGE_INDEX_INDEX] ||
      properties[PIXEL_OFFSET_INDEX] ||
      properties[HORIZONTAL_ORIGIN_INDEX] ||
      properties[VERTICAL_ORIGIN_INDEX] ||
      properties[SHOW_INDEX]
    ) {
      writers.push(writeCompressedAttrib0);
      if (this._instanced) {
        writers.push(writeEyeOffset);
      }
    }

    if (
      properties[IMAGE_INDEX_INDEX] ||
      properties[ALIGNED_AXIS_INDEX] ||
      properties[TRANSLUCENCY_BY_DISTANCE_INDEX]
    ) {
      writers.push(writeCompressedAttrib1);
      writers.push(writeCompressedAttrib2);
    }

    if (properties[IMAGE_INDEX_INDEX] || properties[COLOR_INDEX]) {
      writers.push(writeCompressedAttrib2);
    }

    if (properties[EYE_OFFSET_INDEX]) {
      writers.push(writeEyeOffset);
    }

    if (properties[SCALE_BY_DISTANCE_INDEX]) {
      writers.push(writeScaleByDistance);
    }

    if (properties[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX]) {
      writers.push(writePixelOffsetScaleByDistance);
    }

    if (
      properties[DISTANCE_DISPLAY_CONDITION_INDEX] ||
      properties[DISABLE_DEPTH_DISTANCE] ||
      properties[IMAGE_INDEX_INDEX] ||
      properties[POSITION_INDEX]
    ) {
      writers.push(writeCompressedAttribute3);
    }

    if (properties[IMAGE_INDEX_INDEX] || properties[POSITION_INDEX]) {
      writers.push(writeTextureCoordinateBoundsOrLabelTranslate);
    }

    if (properties[SDF_INDEX]) {
      writers.push(writeSDF);
    }

    if (properties[SPLIT_DIRECTION_INDEX]) {
      writers.push(writeSplitDirection);
    }

    const numWriters = writers.length;
    vafWriters = this._vaf.writers;

    if (billboardsToUpdateLength / billboardsLength > 0.1) {
      // If more than 10% of billboard change, rewrite the entire buffer.

      // PERFORMANCE_IDEA:  I totally made up 10% :).

      for (let m = 0; m < billboardsToUpdateLength; ++m) {
        const b = billboardsToUpdate[m];
        b._dirty = false;

        for (let n = 0; n < numWriters; ++n) {
          writers[n](this, frameState, textureAtlasCoordinates, vafWriters, b);
        }
      }
      this._vaf.commit(getIndexBuffer(context));
    } else {
      for (let h = 0; h < billboardsToUpdateLength; ++h) {
        const bb = billboardsToUpdate[h];
        bb._dirty = false;

        for (let o = 0; o < numWriters; ++o) {
          writers[o](this, frameState, textureAtlasCoordinates, vafWriters, bb);
        }

        if (this._instanced) {
          this._vaf.subCommit(bb._index, 1);
        } else {
          this._vaf.subCommit(bb._index * 4, 4);
        }
      }
      this._vaf.endSubCommits();
    }

    this._billboardsToUpdateIndex = 0;
  }

  // If the number of total billboards ever shrinks considerably
  // Truncate billboardsToUpdate so that we free memory that we're
  // not going to be using.
  if (billboardsToUpdateLength > billboardsLength * 1.5) {
    billboardsToUpdate.length = billboardsLength;
  }

  if (!defined(this._vaf) || !defined(this._vaf.va)) {
    return;
  }

  if (this._boundingVolumeDirty) {
    this._boundingVolumeDirty = false;
    BoundingSphere.transform(
      this._baseVolume,
      this.modelMatrix,
      this._baseVolumeWC,
    );
  }

  let boundingVolume;
  let modelMatrix = Matrix4.IDENTITY;
  if (frameState.mode === SceneMode.SCENE3D) {
    modelMatrix = this.modelMatrix;
    boundingVolume = BoundingSphere.clone(
      this._baseVolumeWC,
      this._boundingVolume,
    );
  } else {
    boundingVolume = BoundingSphere.clone(
      this._baseVolume2D,
      this._boundingVolume,
    );
  }
  updateBoundingVolume(this, frameState, boundingVolume);

  const blendOptionChanged = this._blendOption !== this.blendOption;
  this._blendOption = this.blendOption;

  if (blendOptionChanged) {
    if (
      this._blendOption === BlendOption.OPAQUE ||
      this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT
    ) {
      this._rsOpaque = RenderState.fromCache({
        depthTest: {
          enabled: true,
          func: WebGLConstants.LESS,
        },
        depthMask: true,
      });
    } else {
      this._rsOpaque = undefined;
    }

    // If OPAQUE_AND_TRANSLUCENT is in use, only the opaque pass gets the benefit of the depth buffer,
    // not the translucent pass.  Otherwise, if the TRANSLUCENT pass is on its own, it turns on
    // a depthMask in lieu of full depth sorting (because it has opaque-ish fragments that look bad in OIT).
    // When the TRANSLUCENT depth mask is in use, label backgrounds require the depth func to be LEQUAL.
    const useTranslucentDepthMask =
      this._blendOption === BlendOption.TRANSLUCENT;

    if (
      this._blendOption === BlendOption.TRANSLUCENT ||
      this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT
    ) {
      this._rsTranslucent = RenderState.fromCache({
        depthTest: {
          enabled: true,
          func: useTranslucentDepthMask
            ? WebGLConstants.LEQUAL
            : WebGLConstants.LESS,
        },
        depthMask: useTranslucentDepthMask,
        blending: BlendingState.ALPHA_BLEND,
      });
    } else {
      this._rsTranslucent = undefined;
    }
  }

  this._shaderDisableDepthDistance =
    this._shaderDisableDepthDistance ||
    frameState.minimumDisableDepthTestDistance !== 0.0;

  let vsSource;
  let fsSource;
  let vs;
  let fs;
  let vertDefines;

  const supportVSTextureReads =
    ContextLimits.maximumVertexTextureImageUnits > 0;

  if (
    blendOptionChanged ||
    this._shaderRotation !== this._compiledShaderRotation ||
    this._shaderAlignedAxis !== this._compiledShaderAlignedAxis ||
    this._shaderScaleByDistance !== this._compiledShaderScaleByDistance ||
    this._shaderTranslucencyByDistance !==
      this._compiledShaderTranslucencyByDistance ||
    this._shaderPixelOffsetScaleByDistance !==
      this._compiledShaderPixelOffsetScaleByDistance ||
    this._shaderDistanceDisplayCondition !==
      this._compiledShaderDistanceDisplayCondition ||
    this._shaderDisableDepthDistance !==
      this._compiledShaderDisableDepthDistance ||
    this._shaderClampToGround !== this._compiledShaderClampToGround ||
    this._sdf !== this._compiledSDF
  ) {
    vsSource = BillboardCollectionVS;
    fsSource = BillboardCollectionFS;

    vertDefines = [];
    if (defined(this._batchTable)) {
      vertDefines.push("VECTOR_TILE");
      vsSource = this._batchTable.getVertexShaderCallback(
        false,
        "a_batchId",
        undefined,
      )(vsSource);
      fsSource = this._batchTable.getFragmentShaderCallback(
        false,
        undefined,
      )(fsSource);
    }

    vs = new ShaderSource({
      defines: vertDefines,
      sources: [vsSource],
    });
    if (this._instanced) {
      vs.defines.push("INSTANCED");
    }
    if (this._shaderRotation) {
      vs.defines.push("ROTATION");
    }
    if (this._shaderAlignedAxis) {
      vs.defines.push("ALIGNED_AXIS");
    }
    if (this._shaderScaleByDistance) {
      vs.defines.push("EYE_DISTANCE_SCALING");
    }
    if (this._shaderTranslucencyByDistance) {
      vs.defines.push("EYE_DISTANCE_TRANSLUCENCY");
    }
    if (this._shaderPixelOffsetScaleByDistance) {
      vs.defines.push("EYE_DISTANCE_PIXEL_OFFSET");
    }
    if (this._shaderDistanceDisplayCondition) {
      vs.defines.push("DISTANCE_DISPLAY_CONDITION");
    }
    if (this._shaderDisableDepthDistance) {
      vs.defines.push("DISABLE_DEPTH_DISTANCE");
    }
    if (this._shaderClampToGround) {
      if (supportVSTextureReads) {
        vs.defines.push("VERTEX_DEPTH_CHECK");
      } else {
        vs.defines.push("FRAGMENT_DEPTH_CHECK");
      }
    }

    const sdfEdge = 1.0 - SDFSettings.CUTOFF;

    if (this._sdf) {
      vs.defines.push("SDF");
    }

    const vectorFragDefine = defined(this._batchTable) ? "VECTOR_TILE" : "";

    if (this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT) {
      fs = new ShaderSource({
        defines: ["OPAQUE", vectorFragDefine],
        sources: [fsSource],
      });
      if (this._shaderClampToGround) {
        if (supportVSTextureReads) {
          fs.defines.push("VERTEX_DEPTH_CHECK");
        } else {
          fs.defines.push("FRAGMENT_DEPTH_CHECK");
        }
      }

      if (this._sdf) {
        fs.defines.push("SDF");
        fs.defines.push(`SDF_EDGE ${sdfEdge}`);
      }

      this._sp = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._sp,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });

      fs = new ShaderSource({
        defines: ["TRANSLUCENT", vectorFragDefine],
        sources: [fsSource],
      });
      if (this._shaderClampToGround) {
        if (supportVSTextureReads) {
          fs.defines.push("VERTEX_DEPTH_CHECK");
        } else {
          fs.defines.push("FRAGMENT_DEPTH_CHECK");
        }
      }
      if (this._sdf) {
        fs.defines.push("SDF");
        fs.defines.push(`SDF_EDGE ${sdfEdge}`);
      }
      this._spTranslucent = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._spTranslucent,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });
    }

    if (this._blendOption === BlendOption.OPAQUE) {
      fs = new ShaderSource({
        defines: [vectorFragDefine],
        sources: [fsSource],
      });
      if (this._shaderClampToGround) {
        if (supportVSTextureReads) {
          fs.defines.push("VERTEX_DEPTH_CHECK");
        } else {
          fs.defines.push("FRAGMENT_DEPTH_CHECK");
        }
      }
      if (this._sdf) {
        fs.defines.push("SDF");
        fs.defines.push(`SDF_EDGE ${sdfEdge}`);
      }
      this._sp = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._sp,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });
    }

    if (this._blendOption === BlendOption.TRANSLUCENT) {
      fs = new ShaderSource({
        defines: [vectorFragDefine],
        sources: [fsSource],
      });
      if (this._shaderClampToGround) {
        if (supportVSTextureReads) {
          fs.defines.push("VERTEX_DEPTH_CHECK");
        } else {
          fs.defines.push("FRAGMENT_DEPTH_CHECK");
        }
      }
      if (this._sdf) {
        fs.defines.push("SDF");
        fs.defines.push(`SDF_EDGE ${sdfEdge}`);
      }
      this._spTranslucent = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._spTranslucent,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });
    }

    this._compiledShaderRotation = this._shaderRotation;
    this._compiledShaderAlignedAxis = this._shaderAlignedAxis;
    this._compiledShaderScaleByDistance = this._shaderScaleByDistance;
    this._compiledShaderTranslucencyByDistance =
      this._shaderTranslucencyByDistance;
    this._compiledShaderPixelOffsetScaleByDistance =
      this._shaderPixelOffsetScaleByDistance;
    this._compiledShaderDistanceDisplayCondition =
      this._shaderDistanceDisplayCondition;
    this._compiledShaderDisableDepthDistance = this._shaderDisableDepthDistance;
    this._compiledShaderClampToGround = this._shaderClampToGround;
    this._compiledSDF = this._sdf;
  }

  const commandList = frameState.commandList;

  if (pass.render || pass.pick) {
    const colorList = this._colorCommands;

    const opaque = this._blendOption === BlendOption.OPAQUE;
    const opaqueAndTranslucent =
      this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT;

    const va = this._vaf.va;
    const vaLength = va.length;

    let uniforms = this._uniforms;
    let pickId;
    if (defined(this._batchTable)) {
      uniforms = this._batchTable.getUniformMapCallback()(uniforms);
      pickId = this._batchTable.getPickId();
    } else {
      pickId = "v_pickColor";
    }

    colorList.length = vaLength;
    const totalLength = opaqueAndTranslucent ? vaLength * 2 : vaLength;
    for (let j = 0; j < totalLength; ++j) {
      let command = colorList[j];
      if (!defined(command)) {
        command = colorList[j] = new DrawCommand();
      }

      const opaqueCommand = opaque || (opaqueAndTranslucent && j % 2 === 0);

      command.pass =
        opaqueCommand || !opaqueAndTranslucent ? Pass.OPAQUE : Pass.TRANSLUCENT;
      command.owner = this;

      const index = opaqueAndTranslucent ? Math.floor(j / 2.0) : j;
      command.boundingVolume = boundingVolume;
      command.modelMatrix = modelMatrix;
      command.count = va[index].indicesCount;
      command.shaderProgram = opaqueCommand ? this._sp : this._spTranslucent;
      command.uniformMap = uniforms;
      command.vertexArray = va[index].va;
      command.renderState = opaqueCommand
        ? this._rsOpaque
        : this._rsTranslucent;
      command.debugShowBoundingVolume = this.debugShowBoundingVolume;
      command.pickId = pickId;

      if (this._instanced) {
        command.count = 6;
        command.instanceCount = billboardsLength;
      }

      commandList.push(command);
    }

    if (this.debugShowTextureAtlas) {
      if (!defined(this.debugCommand)) {
        this.debugCommand = createDebugCommand(this, frameState.context);
      }

      commandList.push(this.debugCommand);
    }
  }
};

/**
 * 如果此对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用；调用除 
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see BillboardCollection#destroy
 */

BillboardCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性地
 * 释放 WebGL 资源，而不是依赖垃圾收集器销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，则不应使用；调用除 
 * <code>isDestroyed</code> 以外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 将返回值 (<code>undefined</code>) 赋值给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 *
 *
 * @example
 * billboards = billboards && billboards.destroy();
 *
 * @see BillboardCollection#isDestroyed
 */

BillboardCollection.prototype.destroy = function () {
  if (defined(this._removeCallbackFunc)) {
    this._removeCallbackFunc();
    this._removeCallbackFunc = undefined;
  }

  this._textureAtlas =
    this._destroyTextureAtlas &&
    this._textureAtlas &&
    this._textureAtlas.destroy();
  this._sp = this._sp && this._sp.destroy();
  this._spTranslucent = this._spTranslucent && this._spTranslucent.destroy();
  this._vaf = this._vaf && this._vaf.destroy();
  destroyBillboards(this._billboards);

  return destroyObject(this);
};
export default BillboardCollection;
