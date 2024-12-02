import BoundingSphere from "../Core/BoundingSphere.js";
import Color from "../Core/Color.js";
import ComponentDatatype from "../Core/ComponentDatatype.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import EncodedCartesian3 from "../Core/EncodedCartesian3.js";
import CesiumMath from "../Core/Math.js";
import Matrix4 from "../Core/Matrix4.js";
import PrimitiveType from "../Core/PrimitiveType.js";
import WebGLConstants from "../Core/WebGLConstants.js";
import BufferUsage from "../Renderer/BufferUsage.js";
import ContextLimits from "../Renderer/ContextLimits.js";
import DrawCommand from "../Renderer/DrawCommand.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderProgram from "../Renderer/ShaderProgram.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import VertexArrayFacade from "../Renderer/VertexArrayFacade.js";
import PointPrimitiveCollectionFS from "../Shaders/PointPrimitiveCollectionFS.js";
import PointPrimitiveCollectionVS from "../Shaders/PointPrimitiveCollectionVS.js";
import BlendingState from "./BlendingState.js";
import BlendOption from "./BlendOption.js";
import PointPrimitive from "./PointPrimitive.js";
import SceneMode from "./SceneMode.js";

const SHOW_INDEX = PointPrimitive.SHOW_INDEX;
const POSITION_INDEX = PointPrimitive.POSITION_INDEX;
const COLOR_INDEX = PointPrimitive.COLOR_INDEX;
const OUTLINE_COLOR_INDEX = PointPrimitive.OUTLINE_COLOR_INDEX;
const OUTLINE_WIDTH_INDEX = PointPrimitive.OUTLINE_WIDTH_INDEX;
const PIXEL_SIZE_INDEX = PointPrimitive.PIXEL_SIZE_INDEX;
const SCALE_BY_DISTANCE_INDEX = PointPrimitive.SCALE_BY_DISTANCE_INDEX;
const TRANSLUCENCY_BY_DISTANCE_INDEX =
  PointPrimitive.TRANSLUCENCY_BY_DISTANCE_INDEX;
const DISTANCE_DISPLAY_CONDITION_INDEX =
  PointPrimitive.DISTANCE_DISPLAY_CONDITION_INDEX;
const DISABLE_DEPTH_DISTANCE_INDEX =
  PointPrimitive.DISABLE_DEPTH_DISTANCE_INDEX;
const SPLIT_DIRECTION_INDEX = PointPrimitive.SPLIT_DIRECTION_INDEX;
const NUMBER_OF_PROPERTIES = PointPrimitive.NUMBER_OF_PROPERTIES;

const attributeLocations = {
  positionHighAndSize: 0,
  positionLowAndOutline: 1,
  compressedAttribute0: 2, // color, outlineColor, pick color
  compressedAttribute1: 3, // show, translucency by distance, some free space
  scaleByDistance: 4,
  distanceDisplayConditionAndDisableDepthAndSplitDirection: 5,
};

/**
 * 可渲染的点集合。
 * <br /><br />
 * 通过 {@link PointPrimitiveCollection#add} 和 {@link PointPrimitiveCollection#remove} 
 * 添加和移除点。
 *
 * @alias PointPrimitiveCollection
 * @constructor
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将每个点从模型坐标转换到世界坐标的 4x4 变换矩阵。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。决定是否显示此原语的命令的包围球。
 * @param {BlendOption} [options.blendOption=BlendOption.OPAQUE_AND_TRANSLUCENT] 点混合选项。默认
 * 是用于渲染不透明和半透明点。然而，如果所有点都是完全不透明或所有点都是完全半透明，
 * 将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以提高性能多达 2 倍。
 * @param {boolean} [options.show=true] 决定集合中的原语是否会显示。
 *
 * @performance 为了获得最佳性能，尽量使用几个集合，每个集合包含多个点，而不是许多集合，
 * 每个集合仅包含几个点。组织集合，使得更新频率相同的点在同一集合中，即，不
 * 变化的点应在一个集合中；每帧变化的点应在另一个集合中；以此类推。
 *
 * @example
 * // Create a pointPrimitive collection with two points
 * const points = scene.primitives.add(new Cesium.PointPrimitiveCollection());
 * points.add({
 *   position : new Cesium.Cartesian3(1.0, 2.0, 3.0),
 *   color : Cesium.Color.YELLOW
 * });
 * points.add({
 *   position : new Cesium.Cartesian3(4.0, 5.0, 6.0),
 *   color : Cesium.Color.CYAN
 * });
 *
 * @see PointPrimitiveCollection#add
 * @see PointPrimitiveCollection#remove
 * @see PointPrimitive
 */
function PointPrimitiveCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._sp = undefined;
  this._spTranslucent = undefined;
  this._rsOpaque = undefined;
  this._rsTranslucent = undefined;
  this._vaf = undefined;

  this._pointPrimitives = [];
  this._pointPrimitivesToUpdate = [];
  this._pointPrimitivesToUpdateIndex = 0;
  this._pointPrimitivesRemoved = false;
  this._createVertexArray = false;

  this._shaderScaleByDistance = false;
  this._compiledShaderScaleByDistance = false;

  this._shaderTranslucencyByDistance = false;
  this._compiledShaderTranslucencyByDistance = false;

  this._shaderDistanceDisplayCondition = false;
  this._compiledShaderDistanceDisplayCondition = false;

  this._shaderDisableDepthDistance = false;
  this._compiledShaderDisableDepthDistance = false;

  this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);

  this._maxPixelSize = 1.0;

  this._baseVolume = new BoundingSphere();
  this._baseVolumeWC = new BoundingSphere();
  this._baseVolume2D = new BoundingSphere();
  this._boundingVolume = new BoundingSphere();
  this._boundingVolumeDirty = false;

  this._colorCommands = [];

  /**
   * 决定该集合中的原语是否会被显示。
   *
   * @type {boolean}
   * @default true
   */

  this.show = defaultValue(options.show, true);

  /**
   * 4x4 变换矩阵，将此集合中的每个点从模型坐标转换到世界坐标。
   * 当这是单位矩阵时，点原语在世界坐标中绘制，即地球的 WGS84 坐标。
   * 通过提供不同的变换矩阵（如通过 {@link Transforms.eastNorthUpToFixedFrame} 返回的矩阵），
   * 可以使用局部参考框架。
   *
   * @type {Matrix4}
   * @default {@link Matrix4.IDENTITY}
   *
   *

   * @example
   * const center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
   * pointPrimitives.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
   * pointPrimitives.add({
   *   color : Cesium.Color.ORANGE,
   *   position : new Cesium.Cartesian3(0.0, 0.0, 0.0) // center
   * });
   * pointPrimitives.add({
   *   color : Cesium.Color.YELLOW,
   *   position : new Cesium.Cartesian3(1000000.0, 0.0, 0.0) // east
   * });
   * pointPrimitives.add({
   *   color : Cesium.Color.GREEN,
   *   position : new Cesium.Cartesian3(0.0, 1000000.0, 0.0) // north
   * });
   * pointPrimitives.add({
   *   color : Cesium.Color.CYAN,
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
   * 此属性仅用于调试；不用于生产环境，且未进行优化。
   * <p>
   * 绘制原语中每个绘制命令的包围球。
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
   * 点的混合选项。默认设置用于渲染不透明和半透明的点。
   * 然而，如果所有点都是完全不透明或者所有点都是完全半透明，
   * 将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以提高
   * 性能高达 2 倍。
   * @type {BlendOption}
   * @default BlendOption.OPAQUE_AND_TRANSLUCENT
   */

  this.blendOption = defaultValue(
    options.blendOption,
    BlendOption.OPAQUE_AND_TRANSLUCENT,
  );
  this._blendOption = undefined;

  this._mode = SceneMode.SCENE3D;
  this._maxTotalPointSize = 1;

  // The buffer usage for each attribute is determined based on the usage of the attribute over time.
  this._buffersUsage = [
    BufferUsage.STATIC_DRAW, // SHOW_INDEX
    BufferUsage.STATIC_DRAW, // POSITION_INDEX
    BufferUsage.STATIC_DRAW, // COLOR_INDEX
    BufferUsage.STATIC_DRAW, // OUTLINE_COLOR_INDEX
    BufferUsage.STATIC_DRAW, // OUTLINE_WIDTH_INDEX
    BufferUsage.STATIC_DRAW, // PIXEL_SIZE_INDEX
    BufferUsage.STATIC_DRAW, // SCALE_BY_DISTANCE_INDEX
    BufferUsage.STATIC_DRAW, // TRANSLUCENCY_BY_DISTANCE_INDEX
    BufferUsage.STATIC_DRAW, // DISTANCE_DISPLAY_CONDITION_INDEX
  ];

  const that = this;
  this._uniforms = {
    u_maxTotalPointSize: function () {
      return that._maxTotalPointSize;
    },
  };
}

Object.defineProperties(PointPrimitiveCollection.prototype, {
  /**
   * 返回此集合中的点的数量。通常与
   * {@link PointPrimitiveCollection#get} 一起使用，以遍历集合中的所有点。
   * @memberof PointPrimitiveCollection.prototype
   * @type {number}
   */

  length: {
    get: function () {
      removePointPrimitives(this);
      return this._pointPrimitives.length;
    },
  },
});

function destroyPointPrimitives(pointPrimitives) {
  const length = pointPrimitives.length;
  for (let i = 0; i < length; ++i) {
    if (pointPrimitives[i]) {
      pointPrimitives[i]._destroy();
    }
  }
}

/**
 * 创建并将具有指定初始属性的点添加到集合中。
 * 新添加的点会被返回，以便稍后可以对其进行修改或从集合中移除。
 *
 * @param {object} [options] 描述点属性的模板，见示例 1。
 * @returns {PointPrimitive} 被添加到集合中的点。
 *
 * @performance 调用 <code>add</code> 预计是常量时间。然而，集合的顶点缓冲区
 * 将被重写——这是一项 <code>O(n)</code> 操作，同时还会产生 CPU 到 GPU 的开销。
 * 为了获得最佳性能，在调用 <code>update</code> 之前尽可能添加更多的 pointPrimitives。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 *
 * @example
 * // Example 1:  Add a point, specifying all the default values.
 * const p = pointPrimitives.add({
 *   show : true,
 *   position : Cesium.Cartesian3.ZERO,
 *   pixelSize : 10.0,
 *   color : Cesium.Color.WHITE,
 *   outlineColor : Cesium.Color.TRANSPARENT,
 *   outlineWidth : 0.0,
 *   id : undefined
 * });
 *
 * @example
 * // Example 2:  Specify only the point's cartographic position.
 * const p = pointPrimitives.add({
 *   position : Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
 * });
 *
 * @see PointPrimitiveCollection#remove
 * @see PointPrimitiveCollection#removeAll
 */
PointPrimitiveCollection.prototype.add = function (options) {
  const p = new PointPrimitive(options, this);
  p._index = this._pointPrimitives.length;

  this._pointPrimitives.push(p);
  this._createVertexArray = true;

  return p;
};

/**
 * 从集合中移除一个点。
 *
 * @param {PointPrimitive} pointPrimitive 要移除的点。
 * @returns {boolean} 如果点被移除则返回 <code>true</code>；如果未在集合中找到该点则返回 <code>false</code>。
 *
 * @performance 调用 <code>remove</code> 预计是常量时间。然而，集合的顶点缓冲区
 * 将被重写——这是一项 <code>O(n)</code> 操作，同时还会产生 CPU 到 GPU 的开销。
 * 为了获得最佳性能，在调用 <code>update</code> 之前尽可能移除更多的点。
 * 如果您打算临时隐藏一个点，通常更有效的方法是调用
 * {@link PointPrimitive#show}，而不是移除和重新添加该点。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 *
 * @example
 * const p = pointPrimitives.add(...);
 * pointPrimitives.remove(p);  // Returns true
 *
 * @see PointPrimitiveCollection#add
 * @see PointPrimitiveCollection#removeAll
 * @see PointPrimitive#show
 */
PointPrimitiveCollection.prototype.remove = function (pointPrimitive) {
  if (this.contains(pointPrimitive)) {
    this._pointPrimitives[pointPrimitive._index] = null; // Removed later
    this._pointPrimitivesRemoved = true;
    this._createVertexArray = true;
    pointPrimitive._destroy();
    return true;
  }

  return false;
};

/**
 * 从集合中移除所有点。
 *
 * @performance <code>O(n)</code>。从集合中移除所有点然后再添加新点比完全创建一个新集合更有效。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 * @example
 * pointPrimitives.add(...);
 * pointPrimitives.add(...);
 * pointPrimitives.removeAll();
 *
 * @see PointPrimitiveCollection#add
 * @see PointPrimitiveCollection#remove
 */
PointPrimitiveCollection.prototype.removeAll = function () {
  destroyPointPrimitives(this._pointPrimitives);
  this._pointPrimitives = [];
  this._pointPrimitivesToUpdate = [];
  this._pointPrimitivesToUpdateIndex = 0;
  this._pointPrimitivesRemoved = false;

  this._createVertexArray = true;
};

function removePointPrimitives(pointPrimitiveCollection) {
  if (pointPrimitiveCollection._pointPrimitivesRemoved) {
    pointPrimitiveCollection._pointPrimitivesRemoved = false;

    const newPointPrimitives = [];
    const pointPrimitives = pointPrimitiveCollection._pointPrimitives;
    const length = pointPrimitives.length;
    for (let i = 0, j = 0; i < length; ++i) {
      const pointPrimitive = pointPrimitives[i];
      if (pointPrimitive) {
        pointPrimitive._index = j++;
        newPointPrimitives.push(pointPrimitive);
      }
    }

    pointPrimitiveCollection._pointPrimitives = newPointPrimitives;
  }
}

PointPrimitiveCollection.prototype._updatePointPrimitive = function (
  pointPrimitive,
  propertyChanged,
) {
  if (!pointPrimitive._dirty) {
    this._pointPrimitivesToUpdate[this._pointPrimitivesToUpdateIndex++] =
      pointPrimitive;
  }

  ++this._propertiesChanged[propertyChanged];
};

/**
 * 检查此集合是否包含给定点。
 *
 * @param {PointPrimitive} [pointPrimitive] 要检查的点。
 * @returns {boolean} 如果此集合包含该点，则为 true；否则为 false。
 *
 * @see PointPrimitiveCollection#get
 */

PointPrimitiveCollection.prototype.contains = function (pointPrimitive) {
  return (
    defined(pointPrimitive) && pointPrimitive._pointPrimitiveCollection === this
  );
};

/**
 * 返回集合中指定索引的点。索引是零基的，随着点的添加而增加。
 * 移除一个点会将其后面的所有点向左移动，改变它们的索引。
 * 此函数通常与 {@link PointPrimitiveCollection#length} 一起使用，以遍历集合中的所有点。
 *
 * @param {number} index 点的零基索引。
 * @returns {PointPrimitive} 指定索引处的点。
 *
 * @performance 预计为常量时间。如果从集合中移除了点，而未调用 {@link PointPrimitiveCollection#update}，
 * 则会执行一个隐式 <code>O(n)</code> 操作。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 * @example
 * // Toggle the show property of every point in the collection
 * const len = pointPrimitives.length;
 * for (let i = 0; i < len; ++i) {
 *   const p = pointPrimitives.get(i);
 *   p.show = !p.show;
 * }
 *
 * @see PointPrimitiveCollection#length
 */
PointPrimitiveCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  removePointPrimitives(this);
  return this._pointPrimitives[index];
};

PointPrimitiveCollection.prototype.computeNewBuffersUsage = function () {
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

function createVAF(context, numberOfPointPrimitives, buffersUsage) {
  return new VertexArrayFacade(
    context,
    [
      {
        index: attributeLocations.positionHighAndSize,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[POSITION_INDEX],
      },
      {
        index: attributeLocations.positionLowAndShow,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[POSITION_INDEX],
      },
      {
        index: attributeLocations.compressedAttribute0,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[COLOR_INDEX],
      },
      {
        index: attributeLocations.compressedAttribute1,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[TRANSLUCENCY_BY_DISTANCE_INDEX],
      },
      {
        index: attributeLocations.scaleByDistance,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[SCALE_BY_DISTANCE_INDEX],
      },
      {
        index:
          attributeLocations.distanceDisplayConditionAndDisableDepthAndSplitDirection,
        componentsPerAttribute: 4,
        componentDatatype: ComponentDatatype.FLOAT,
        usage: buffersUsage[DISTANCE_DISPLAY_CONDITION_INDEX],
      },
    ],
    numberOfPointPrimitives,
  ); // 1 vertex per pointPrimitive
}

///////////////////////////////////////////////////////////////////////////

// PERFORMANCE_IDEA:  Save memory if a property is the same for all pointPrimitives, use a latched attribute state,
// instead of storing it in a vertex buffer.

const writePositionScratch = new EncodedCartesian3();

function writePositionSizeAndOutline(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  const i = pointPrimitive._index;
  const position = pointPrimitive._getActualPosition();

  if (pointPrimitiveCollection._mode === SceneMode.SCENE3D) {
    BoundingSphere.expand(
      pointPrimitiveCollection._baseVolume,
      position,
      pointPrimitiveCollection._baseVolume,
    );
    pointPrimitiveCollection._boundingVolumeDirty = true;
  }

  EncodedCartesian3.fromCartesian(position, writePositionScratch);
  const pixelSize = pointPrimitive.pixelSize;
  const outlineWidth = pointPrimitive.outlineWidth;

  pointPrimitiveCollection._maxPixelSize = Math.max(
    pointPrimitiveCollection._maxPixelSize,
    pixelSize + outlineWidth,
  );

  const positionHighWriter = vafWriters[attributeLocations.positionHighAndSize];
  const high = writePositionScratch.high;
  positionHighWriter(i, high.x, high.y, high.z, pixelSize);

  const positionLowWriter =
    vafWriters[attributeLocations.positionLowAndOutline];
  const low = writePositionScratch.low;
  positionLowWriter(i, low.x, low.y, low.z, outlineWidth);
}

const LEFT_SHIFT16 = 65536.0; // 2^16
const LEFT_SHIFT8 = 256.0; // 2^8

function writeCompressedAttrib0(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  const i = pointPrimitive._index;

  const color = pointPrimitive.color;
  const pickColor = pointPrimitive.getPickId(context).color;
  const outlineColor = pointPrimitive.outlineColor;

  let red = Color.floatToByte(color.red);
  let green = Color.floatToByte(color.green);
  let blue = Color.floatToByte(color.blue);
  const compressed0 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  red = Color.floatToByte(outlineColor.red);
  green = Color.floatToByte(outlineColor.green);
  blue = Color.floatToByte(outlineColor.blue);
  const compressed1 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  red = Color.floatToByte(pickColor.red);
  green = Color.floatToByte(pickColor.green);
  blue = Color.floatToByte(pickColor.blue);
  const compressed2 = red * LEFT_SHIFT16 + green * LEFT_SHIFT8 + blue;

  const compressed3 =
    Color.floatToByte(color.alpha) * LEFT_SHIFT16 +
    Color.floatToByte(outlineColor.alpha) * LEFT_SHIFT8 +
    Color.floatToByte(pickColor.alpha);

  const writer = vafWriters[attributeLocations.compressedAttribute0];
  writer(i, compressed0, compressed1, compressed2, compressed3);
}

function writeCompressedAttrib1(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  const i = pointPrimitive._index;

  let near = 0.0;
  let nearValue = 1.0;
  let far = 1.0;
  let farValue = 1.0;

  const translucency = pointPrimitive.translucencyByDistance;
  if (defined(translucency)) {
    near = translucency.near;
    nearValue = translucency.nearValue;
    far = translucency.far;
    farValue = translucency.farValue;

    if (nearValue !== 1.0 || farValue !== 1.0) {
      // translucency by distance calculation in shader need not be enabled
      // until a pointPrimitive with near and far !== 1.0 is found
      pointPrimitiveCollection._shaderTranslucencyByDistance = true;
    }
  }

  let show = pointPrimitive.show && pointPrimitive.clusterShow;

  // If the color alphas are zero, do not show this pointPrimitive.  This lets us avoid providing
  // color during the pick pass and also eliminates a discard in the fragment shader.
  if (
    pointPrimitive.color.alpha === 0.0 &&
    pointPrimitive.outlineColor.alpha === 0.0
  ) {
    show = false;
  }

  nearValue = CesiumMath.clamp(nearValue, 0.0, 1.0);
  nearValue = nearValue === 1.0 ? 255.0 : (nearValue * 255.0) | 0;
  const compressed0 = (show ? 1.0 : 0.0) * LEFT_SHIFT8 + nearValue;

  farValue = CesiumMath.clamp(farValue, 0.0, 1.0);
  farValue = farValue === 1.0 ? 255.0 : (farValue * 255.0) | 0;
  const compressed1 = farValue;

  const writer = vafWriters[attributeLocations.compressedAttribute1];
  writer(i, compressed0, compressed1, near, far);
}

function writeScaleByDistance(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  const i = pointPrimitive._index;
  const writer = vafWriters[attributeLocations.scaleByDistance];
  let near = 0.0;
  let nearValue = 1.0;
  let far = 1.0;
  let farValue = 1.0;

  const scale = pointPrimitive.scaleByDistance;
  if (defined(scale)) {
    near = scale.near;
    nearValue = scale.nearValue;
    far = scale.far;
    farValue = scale.farValue;

    if (nearValue !== 1.0 || farValue !== 1.0) {
      // scale by distance calculation in shader need not be enabled
      // until a pointPrimitive with near and far !== 1.0 is found
      pointPrimitiveCollection._shaderScaleByDistance = true;
    }
  }

  writer(i, near, nearValue, far, farValue);
}

function writeDistanceDisplayConditionAndDepthDisableAndSplitDirection(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  const i = pointPrimitive._index;
  const writer =
    vafWriters[
      attributeLocations
        .distanceDisplayConditionAndDisableDepthAndSplitDirection
    ];
  let near = 0.0;
  let far = Number.MAX_VALUE;

  const distanceDisplayCondition = pointPrimitive.distanceDisplayCondition;
  if (defined(distanceDisplayCondition)) {
    near = distanceDisplayCondition.near;
    far = distanceDisplayCondition.far;

    near *= near;
    far *= far;

    pointPrimitiveCollection._shaderDistanceDisplayCondition = true;
  }

  let disableDepthTestDistance = pointPrimitive.disableDepthTestDistance;
  disableDepthTestDistance *= disableDepthTestDistance;
  if (disableDepthTestDistance > 0.0) {
    pointPrimitiveCollection._shaderDisableDepthDistance = true;
    if (disableDepthTestDistance === Number.POSITIVE_INFINITY) {
      disableDepthTestDistance = -1.0;
    }
  }

  let direction = 0.0;
  const split = pointPrimitive.splitDirection;
  if (defined(split)) {
    direction = split;
  }
  writer(i, near, far, disableDepthTestDistance, direction);
}

function writePointPrimitive(
  pointPrimitiveCollection,
  context,
  vafWriters,
  pointPrimitive,
) {
  writePositionSizeAndOutline(
    pointPrimitiveCollection,
    context,
    vafWriters,
    pointPrimitive,
  );
  writeCompressedAttrib0(
    pointPrimitiveCollection,
    context,
    vafWriters,
    pointPrimitive,
  );
  writeCompressedAttrib1(
    pointPrimitiveCollection,
    context,
    vafWriters,
    pointPrimitive,
  );
  writeScaleByDistance(
    pointPrimitiveCollection,
    context,
    vafWriters,
    pointPrimitive,
  );
  writeDistanceDisplayConditionAndDepthDisableAndSplitDirection(
    pointPrimitiveCollection,
    context,
    vafWriters,
    pointPrimitive,
  );
}

function recomputeActualPositions(
  pointPrimitiveCollection,
  pointPrimitives,
  length,
  frameState,
  modelMatrix,
  recomputeBoundingVolume,
) {
  let boundingVolume;
  if (frameState.mode === SceneMode.SCENE3D) {
    boundingVolume = pointPrimitiveCollection._baseVolume;
    pointPrimitiveCollection._boundingVolumeDirty = true;
  } else {
    boundingVolume = pointPrimitiveCollection._baseVolume2D;
  }

  const positions = [];
  for (let i = 0; i < length; ++i) {
    const pointPrimitive = pointPrimitives[i];
    const position = pointPrimitive.position;
    const actualPosition = PointPrimitive._computeActualPosition(
      position,
      frameState,
      modelMatrix,
    );
    if (defined(actualPosition)) {
      pointPrimitive._setActualPosition(actualPosition);

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

function updateMode(pointPrimitiveCollection, frameState) {
  const mode = frameState.mode;

  const pointPrimitives = pointPrimitiveCollection._pointPrimitives;
  const pointPrimitivesToUpdate =
    pointPrimitiveCollection._pointPrimitivesToUpdate;
  const modelMatrix = pointPrimitiveCollection._modelMatrix;

  if (
    pointPrimitiveCollection._createVertexArray ||
    pointPrimitiveCollection._mode !== mode ||
    (mode !== SceneMode.SCENE3D &&
      !Matrix4.equals(modelMatrix, pointPrimitiveCollection.modelMatrix))
  ) {
    pointPrimitiveCollection._mode = mode;
    Matrix4.clone(pointPrimitiveCollection.modelMatrix, modelMatrix);
    pointPrimitiveCollection._createVertexArray = true;

    if (
      mode === SceneMode.SCENE3D ||
      mode === SceneMode.SCENE2D ||
      mode === SceneMode.COLUMBUS_VIEW
    ) {
      recomputeActualPositions(
        pointPrimitiveCollection,
        pointPrimitives,
        pointPrimitives.length,
        frameState,
        modelMatrix,
        true,
      );
    }
  } else if (mode === SceneMode.MORPHING) {
    recomputeActualPositions(
      pointPrimitiveCollection,
      pointPrimitives,
      pointPrimitives.length,
      frameState,
      modelMatrix,
      true,
    );
  } else if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
    recomputeActualPositions(
      pointPrimitiveCollection,
      pointPrimitivesToUpdate,
      pointPrimitiveCollection._pointPrimitivesToUpdateIndex,
      frameState,
      modelMatrix,
      false,
    );
  }
}

function updateBoundingVolume(collection, frameState, boundingVolume) {
  const pixelSize = frameState.camera.getPixelSize(
    boundingVolume,
    frameState.context.drawingBufferWidth,
    frameState.context.drawingBufferHeight,
  );
  const size = pixelSize * collection._maxPixelSize;
  boundingVolume.radius += size;
}

const scratchWriterArray = [];

/**
 * @private
 */
PointPrimitiveCollection.prototype.update = function (frameState) {
  removePointPrimitives(this);

  if (!this.show) {
    return;
  }

  this._maxTotalPointSize = ContextLimits.maximumAliasedPointSize;

  updateMode(this, frameState);

  const pointPrimitives = this._pointPrimitives;
  const pointPrimitivesLength = pointPrimitives.length;
  const pointPrimitivesToUpdate = this._pointPrimitivesToUpdate;
  const pointPrimitivesToUpdateLength = this._pointPrimitivesToUpdateIndex;

  const properties = this._propertiesChanged;

  const createVertexArray = this._createVertexArray;

  let vafWriters;
  const context = frameState.context;
  const pass = frameState.passes;
  const picking = pass.pick;

  // PERFORMANCE_IDEA: Round robin multiple buffers.
  if (createVertexArray || (!picking && this.computeNewBuffersUsage())) {
    this._createVertexArray = false;

    for (let k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
      properties[k] = 0;
    }

    this._vaf = this._vaf && this._vaf.destroy();

    if (pointPrimitivesLength > 0) {
      // PERFORMANCE_IDEA:  Instead of creating a new one, resize like std::vector.
      this._vaf = createVAF(context, pointPrimitivesLength, this._buffersUsage);
      vafWriters = this._vaf.writers;

      // Rewrite entire buffer if pointPrimitives were added or removed.
      for (let i = 0; i < pointPrimitivesLength; ++i) {
        const pointPrimitive = this._pointPrimitives[i];
        pointPrimitive._dirty = false; // In case it needed an update.
        writePointPrimitive(this, context, vafWriters, pointPrimitive);
      }

      this._vaf.commit();
    }

    this._pointPrimitivesToUpdateIndex = 0;
  } else if (pointPrimitivesToUpdateLength > 0) {
    // PointPrimitives were modified, but none were added or removed.
    const writers = scratchWriterArray;
    writers.length = 0;

    if (
      properties[POSITION_INDEX] ||
      properties[OUTLINE_WIDTH_INDEX] ||
      properties[PIXEL_SIZE_INDEX]
    ) {
      writers.push(writePositionSizeAndOutline);
    }

    if (properties[COLOR_INDEX] || properties[OUTLINE_COLOR_INDEX]) {
      writers.push(writeCompressedAttrib0);
    }

    if (properties[SHOW_INDEX] || properties[TRANSLUCENCY_BY_DISTANCE_INDEX]) {
      writers.push(writeCompressedAttrib1);
    }

    if (properties[SCALE_BY_DISTANCE_INDEX]) {
      writers.push(writeScaleByDistance);
    }

    if (
      properties[DISTANCE_DISPLAY_CONDITION_INDEX] ||
      properties[DISABLE_DEPTH_DISTANCE_INDEX] ||
      properties[SPLIT_DIRECTION_INDEX]
    ) {
      writers.push(
        writeDistanceDisplayConditionAndDepthDisableAndSplitDirection,
      );
    }

    const numWriters = writers.length;

    vafWriters = this._vaf.writers;

    if (pointPrimitivesToUpdateLength / pointPrimitivesLength > 0.1) {
      // If more than 10% of pointPrimitive change, rewrite the entire buffer.

      // PERFORMANCE_IDEA:  I totally made up 10% :).

      for (let m = 0; m < pointPrimitivesToUpdateLength; ++m) {
        const b = pointPrimitivesToUpdate[m];
        b._dirty = false;

        for (let n = 0; n < numWriters; ++n) {
          writers[n](this, context, vafWriters, b);
        }
      }
      this._vaf.commit();
    } else {
      for (let h = 0; h < pointPrimitivesToUpdateLength; ++h) {
        const bb = pointPrimitivesToUpdate[h];
        bb._dirty = false;

        for (let o = 0; o < numWriters; ++o) {
          writers[o](this, context, vafWriters, bb);
        }
        this._vaf.subCommit(bb._index, 1);
      }
      this._vaf.endSubCommits();
    }

    this._pointPrimitivesToUpdateIndex = 0;
  }

  // If the number of total pointPrimitives ever shrinks considerably
  // Truncate pointPrimitivesToUpdate so that we free memory that we're
  // not going to be using.
  if (pointPrimitivesToUpdateLength > pointPrimitivesLength * 1.5) {
    pointPrimitivesToUpdate.length = pointPrimitivesLength;
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
          func: WebGLConstants.LEQUAL,
        },
        depthMask: true,
      });
    } else {
      this._rsOpaque = undefined;
    }

    if (
      this._blendOption === BlendOption.TRANSLUCENT ||
      this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT
    ) {
      this._rsTranslucent = RenderState.fromCache({
        depthTest: {
          enabled: true,
          func: WebGLConstants.LEQUAL,
        },
        depthMask: false,
        blending: BlendingState.ALPHA_BLEND,
      });
    } else {
      this._rsTranslucent = undefined;
    }
  }

  this._shaderDisableDepthDistance =
    this._shaderDisableDepthDistance ||
    frameState.minimumDisableDepthTestDistance !== 0.0;
  let vs;
  let fs;

  if (
    blendOptionChanged ||
    (this._shaderScaleByDistance && !this._compiledShaderScaleByDistance) ||
    (this._shaderTranslucencyByDistance &&
      !this._compiledShaderTranslucencyByDistance) ||
    (this._shaderDistanceDisplayCondition &&
      !this._compiledShaderDistanceDisplayCondition) ||
    this._shaderDisableDepthDistance !==
      this._compiledShaderDisableDepthDistance
  ) {
    vs = new ShaderSource({
      sources: [PointPrimitiveCollectionVS],
    });
    if (this._shaderScaleByDistance) {
      vs.defines.push("EYE_DISTANCE_SCALING");
    }
    if (this._shaderTranslucencyByDistance) {
      vs.defines.push("EYE_DISTANCE_TRANSLUCENCY");
    }
    if (this._shaderDistanceDisplayCondition) {
      vs.defines.push("DISTANCE_DISPLAY_CONDITION");
    }
    if (this._shaderDisableDepthDistance) {
      vs.defines.push("DISABLE_DEPTH_DISTANCE");
    }

    if (this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT) {
      fs = new ShaderSource({
        defines: ["OPAQUE"],
        sources: [PointPrimitiveCollectionFS],
      });
      this._sp = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._sp,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });

      fs = new ShaderSource({
        defines: ["TRANSLUCENT"],
        sources: [PointPrimitiveCollectionFS],
      });
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
        sources: [PointPrimitiveCollectionFS],
      });
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
        sources: [PointPrimitiveCollectionFS],
      });
      this._spTranslucent = ShaderProgram.replaceCache({
        context: context,
        shaderProgram: this._spTranslucent,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations,
      });
    }

    this._compiledShaderScaleByDistance = this._shaderScaleByDistance;
    this._compiledShaderTranslucencyByDistance =
      this._shaderTranslucencyByDistance;
    this._compiledShaderDistanceDisplayCondition =
      this._shaderDistanceDisplayCondition;
    this._compiledShaderDisableDepthDistance = this._shaderDisableDepthDistance;
  }

  let va;
  let vaLength;
  let command;
  let j;

  const commandList = frameState.commandList;

  if (pass.render || picking) {
    const colorList = this._colorCommands;

    const opaque = this._blendOption === BlendOption.OPAQUE;
    const opaqueAndTranslucent =
      this._blendOption === BlendOption.OPAQUE_AND_TRANSLUCENT;

    va = this._vaf.va;
    vaLength = va.length;

    colorList.length = vaLength;
    const totalLength = opaqueAndTranslucent ? vaLength * 2 : vaLength;
    for (j = 0; j < totalLength; ++j) {
      const opaqueCommand = opaque || (opaqueAndTranslucent && j % 2 === 0);

      command = colorList[j];
      if (!defined(command)) {
        command = colorList[j] = new DrawCommand();
      }

      command.primitiveType = PrimitiveType.POINTS;
      command.pass =
        opaqueCommand || !opaqueAndTranslucent ? Pass.OPAQUE : Pass.TRANSLUCENT;
      command.owner = this;

      const index = opaqueAndTranslucent ? Math.floor(j / 2.0) : j;
      command.boundingVolume = boundingVolume;
      command.modelMatrix = modelMatrix;
      command.shaderProgram = opaqueCommand ? this._sp : this._spTranslucent;
      command.uniformMap = this._uniforms;
      command.vertexArray = va[index].va;
      command.renderState = opaqueCommand
        ? this._rsOpaque
        : this._rsTranslucent;
      command.debugShowBoundingVolume = this.debugShowBoundingVolume;
      command.pickId = "v_pickColor";

      commandList.push(command);
    }
  }
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果该对象已被销毁，则不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 *
 * @see PointPrimitiveCollection#destroy
 */

PointPrimitiveCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象可以确定性地释放 WebGL 资源，
 * 而不是依赖垃圾回收器来销毁该对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除 <code>isDestroyed</code> 之外的任何函数
 * 将导致 {@link DeveloperError} 异常。因此，将返回值（<code>undefined</code>）
 * 赋给对象，如示例所示。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 * @example
 * pointPrimitives = pointPrimitives && pointPrimitives.destroy();
 *
 * @see PointPrimitiveCollection#isDestroyed
 */
PointPrimitiveCollection.prototype.destroy = function () {
  this._sp = this._sp && this._sp.destroy();
  this._spTranslucent = this._spTranslucent && this._spTranslucent.destroy();
  this._spPick = this._spPick && this._spPick.destroy();
  this._vaf = this._vaf && this._vaf.destroy();
  destroyPointPrimitives(this._pointPrimitives);

  return destroyObject(this);
};
export default PointPrimitiveCollection;
