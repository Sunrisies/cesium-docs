import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Matrix4 from "../Core/Matrix4.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Resource from "../Core/Resource.js";
import HeightReference, {
  isHeightReferenceRelative,
} from "./HeightReference.js";
import HorizontalOrigin from "./HorizontalOrigin.js";
import SceneMode from "./SceneMode.js";
import SceneTransforms from "./SceneTransforms.js";
import VerticalOrigin from "./VerticalOrigin.js";
import SplitDirection from "./SplitDirection.js";

/**
 * @typedef {object} Billboard.ConstructorOptions
 *
 * Billboard 构造函数第一个参数的初始化选项。
 *
 * @property {Cartesian3} position 广告牌的笛卡尔位置。
 * @property {*} [id] 用户定义的对象，当通过 {@link Scene#pick} 选中广告牌时返回。
 * @property {boolean} [show=true] 决定此广告牌是否可见。
 * @property {string | HTMLCanvasElement} [image] 用于广告牌的加载的 HTMLImageElement、ImageData 或图像 URL。
 * @property {number} [scale=1.0] 指定均匀缩放的数值，与广告牌的图像大小（以像素为单位）相乘。
 * @property {Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定此广告牌在屏幕空间中从原点的像素偏移的 {@link Cartesian2}。
 * @property {Cartesian3} [eyeOffset=Cartesian3.ZERO] 在眼睛坐标系中应用于此广告牌的三维笛卡尔偏移的 {@link Cartesian3}。
 * @property {HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] 指定此广告牌的水平原点的 {@link HorizontalOrigin}。
 * @property {VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] 指定此广告牌的垂直原点的 {@link VerticalOrigin}。
 * @property {HeightReference} [heightReference=HeightReference.NONE] 指定此广告牌的高度参考的 {@link HeightReference}。
 * @property {Color} [color=Color.WHITE] 指定与广告牌的纹理相乘的颜色的 {@link Color}。
 * @property {number} [rotation=0] 指定旋转角度（以弧度为单位）的数值。
 * @property {Cartesian3} [alignedAxis=Cartesian3.ZERO] 指定世界空间中的对齐轴的 {@link Cartesian3}。
 * @property {boolean} [sizeInMeters] 指定广告牌大小是以米还是像素为单位的布尔值。
 * @property {number} [width] 指定广告牌的宽度的数值。如果未定义，将使用图像宽度。
 * @property {number} [height] 指定广告牌的高度的数值。如果未定义，将使用图像高度。
 * @property {NearFarScalar} [scaleByDistance] 指定基于广告牌与相机距离的广告牌远近缩放属性的 {@link NearFarScalar}。
 * @property {NearFarScalar} [translucencyByDistance] 指定基于广告牌与相机距离的广告牌远近半透明属性的 {@link NearFarScalar}。
 * @property {NearFarScalar} [pixelOffsetScaleByDistance] 指定基于广告牌与相机距离的广告牌远近像素偏移缩放属性的 {@link NearFarScalar}。
 * @property {BoundingRectangle} [imageSubRegion] 指定用于广告牌的图像子区域的 {@link BoundingRectangle}，而不是整个图像。
 * @property {DistanceDisplayCondition} [distanceDisplayCondition] 指定此广告牌将在与相机的距离下显示的 {@link DistanceDisplayCondition}。
 * @property {number} [disableDepthTestDistance] 指定从相机起禁用深度测试的距离的数值，例如，防止与地形的剪切。
 * @property {SplitDirection} [splitDirection] 指定广告牌的分割属性的 {@link SplitDirection}。
 */


/**
 * <div class="notice">
 * 广告牌是通过调用 {@link BillboardCollection#add} 创建的，并且其初始
 * 属性被设置。请勿直接调用构造函数。
 * </div>
 * 在 3D 场景中定位的视口对齐图像，使用 {@link BillboardCollection} 创建和渲染。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 示例广告牌
 * </div>
 *
 * @alias Billboard
 *
 * @performance 读取属性，例如 {@link Billboard#show}，是常数时间。
 * 赋值给属性是常数时间，但在调用 {@link BillboardCollection#update} 时会导致
 * CPU 到 GPU 的流量。每个广告牌的流量与更新的属性数量无关。如果集合中的大多数广告牌
 * 需要更新，使用 {@link BillboardCollection#removeAll} 清空集合并添加新广告牌
 * 而不是修改每个广告牌可能更有效。
 *
 * @exception {DeveloperError} scaleByDistance.far 必须大于 scaleByDistance.near
 * @exception {DeveloperError} translucencyByDistance.far 必须大于 translucencyByDistance.near
 * @exception {DeveloperError} pixelOffsetScaleByDistance.far 必须大于 pixelOffsetScaleByDistance.near
 * @exception {DeveloperError} distanceDisplayCondition.far 必须大于 distanceDisplayCondition.near
 *
 * @see BillboardCollection
 * @see BillboardCollection#add
 * @see Label
 *
 * @internalConstructor
 * @class
 *
 * @param {Billboard.ConstructorOptions} options 描述初始化选项的对象
 * @param {BillboardCollection} billboardCollection BillboardCollection 的实例
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Billboards.html|Cesium Sandcastle Billboard 演示}
 */

function Billboard(options, billboardCollection) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (
    defined(options.disableDepthTestDistance) &&
    options.disableDepthTestDistance < 0.0
  ) {
    throw new DeveloperError(
      "disableDepthTestDistance must be greater than or equal to 0.0.",
    );
  }
  //>>includeEnd('debug');

  let translucencyByDistance = options.translucencyByDistance;
  let pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;
  let scaleByDistance = options.scaleByDistance;
  let distanceDisplayCondition = options.distanceDisplayCondition;
  if (defined(translucencyByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (translucencyByDistance.far <= translucencyByDistance.near) {
      throw new DeveloperError(
        "translucencyByDistance.far must be greater than translucencyByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    translucencyByDistance = NearFarScalar.clone(translucencyByDistance);
  }
  if (defined(pixelOffsetScaleByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (pixelOffsetScaleByDistance.far <= pixelOffsetScaleByDistance.near) {
      throw new DeveloperError(
        "pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    pixelOffsetScaleByDistance = NearFarScalar.clone(
      pixelOffsetScaleByDistance,
    );
  }
  if (defined(scaleByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (scaleByDistance.far <= scaleByDistance.near) {
      throw new DeveloperError(
        "scaleByDistance.far must be greater than scaleByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    scaleByDistance = NearFarScalar.clone(scaleByDistance);
  }
  if (defined(distanceDisplayCondition)) {
    //>>includeStart('debug', pragmas.debug);
    if (distanceDisplayCondition.far <= distanceDisplayCondition.near) {
      throw new DeveloperError(
        "distanceDisplayCondition.far must be greater than distanceDisplayCondition.near.",
      );
    }
    //>>includeEnd('debug');
    distanceDisplayCondition = DistanceDisplayCondition.clone(
      distanceDisplayCondition,
    );
  }

  this._show = defaultValue(options.show, true);
  this._position = Cartesian3.clone(
    defaultValue(options.position, Cartesian3.ZERO),
  );
  this._actualPosition = Cartesian3.clone(this._position); // For columbus view and 2D
  this._pixelOffset = Cartesian2.clone(
    defaultValue(options.pixelOffset, Cartesian2.ZERO),
  );
  this._translate = new Cartesian2(0.0, 0.0); // used by labels for glyph vertex translation
  this._eyeOffset = Cartesian3.clone(
    defaultValue(options.eyeOffset, Cartesian3.ZERO),
  );
  this._heightReference = defaultValue(
    options.heightReference,
    HeightReference.NONE,
  );
  this._verticalOrigin = defaultValue(
    options.verticalOrigin,
    VerticalOrigin.CENTER,
  );
  this._horizontalOrigin = defaultValue(
    options.horizontalOrigin,
    HorizontalOrigin.CENTER,
  );
  this._scale = defaultValue(options.scale, 1.0);
  this._color = Color.clone(defaultValue(options.color, Color.WHITE));
  this._rotation = defaultValue(options.rotation, 0.0);
  this._alignedAxis = Cartesian3.clone(
    defaultValue(options.alignedAxis, Cartesian3.ZERO),
  );
  this._width = options.width;
  this._height = options.height;
  this._scaleByDistance = scaleByDistance;
  this._translucencyByDistance = translucencyByDistance;
  this._pixelOffsetScaleByDistance = pixelOffsetScaleByDistance;
  this._sizeInMeters = defaultValue(options.sizeInMeters, false);
  this._distanceDisplayCondition = distanceDisplayCondition;
  this._disableDepthTestDistance = options.disableDepthTestDistance;
  this._id = options.id;
  this._collection = defaultValue(options.collection, billboardCollection);

  this._pickId = undefined;
  this._pickPrimitive = defaultValue(options._pickPrimitive, this);
  this._billboardCollection = billboardCollection;
  this._dirty = false;
  this._index = -1; //Used only by BillboardCollection
  this._batchIndex = undefined; // Used only by Vector3DTilePoints and BillboardCollection

  this._imageIndex = -1;
  this._imageIndexPromise = undefined;
  this._imageId = undefined;
  this._image = undefined;
  this._imageSubRegion = undefined;
  this._imageWidth = undefined;
  this._imageHeight = undefined;

  this._labelDimensions = undefined;
  this._labelHorizontalOrigin = undefined;
  this._labelTranslate = undefined;

  const image = options.image;
  let imageId = options.imageId;
  if (defined(image)) {
    if (!defined(imageId)) {
      if (typeof image === "string") {
        imageId = image;
      } else if (defined(image.src)) {
        imageId = image.src;
      } else {
        imageId = createGuid();
      }
    }

    this._imageId = imageId;
    this._image = image;
  }

  if (defined(options.imageSubRegion)) {
    this._imageId = imageId;
    this._imageSubRegion = options.imageSubRegion;
  }

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }

  this._actualClampedPosition = undefined;
  this._removeCallbackFunc = undefined;
  this._mode = SceneMode.SCENE3D;

  this._clusterShow = true;
  this._outlineColor = Color.clone(
    defaultValue(options.outlineColor, Color.BLACK),
  );
  this._outlineWidth = defaultValue(options.outlineWidth, 0.0);

  this._updateClamping();

  this._splitDirection = defaultValue(
    options.splitDirection,
    SplitDirection.NONE,
  );
}

const SHOW_INDEX = (Billboard.SHOW_INDEX = 0);
const POSITION_INDEX = (Billboard.POSITION_INDEX = 1);
const PIXEL_OFFSET_INDEX = (Billboard.PIXEL_OFFSET_INDEX = 2);
const EYE_OFFSET_INDEX = (Billboard.EYE_OFFSET_INDEX = 3);
const HORIZONTAL_ORIGIN_INDEX = (Billboard.HORIZONTAL_ORIGIN_INDEX = 4);
const VERTICAL_ORIGIN_INDEX = (Billboard.VERTICAL_ORIGIN_INDEX = 5);
const SCALE_INDEX = (Billboard.SCALE_INDEX = 6);
const IMAGE_INDEX_INDEX = (Billboard.IMAGE_INDEX_INDEX = 7);
const COLOR_INDEX = (Billboard.COLOR_INDEX = 8);
const ROTATION_INDEX = (Billboard.ROTATION_INDEX = 9);
const ALIGNED_AXIS_INDEX = (Billboard.ALIGNED_AXIS_INDEX = 10);
const SCALE_BY_DISTANCE_INDEX = (Billboard.SCALE_BY_DISTANCE_INDEX = 11);
const TRANSLUCENCY_BY_DISTANCE_INDEX =
  (Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX = 12);
const PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX =
  (Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = 13);
const DISTANCE_DISPLAY_CONDITION = (Billboard.DISTANCE_DISPLAY_CONDITION = 14);
const DISABLE_DEPTH_DISTANCE = (Billboard.DISABLE_DEPTH_DISTANCE = 15);
Billboard.TEXTURE_COORDINATE_BOUNDS = 16;
const SDF_INDEX = (Billboard.SDF_INDEX = 17);
const SPLIT_DIRECTION_INDEX = (Billboard.SPLIT_DIRECTION_INDEX = 18);
Billboard.NUMBER_OF_PROPERTIES = 19;

function makeDirty(billboard, propertyChanged) {
  const billboardCollection = billboard._billboardCollection;
  if (defined(billboardCollection)) {
    billboardCollection._updateBillboard(billboard, propertyChanged);
    billboard._dirty = true;
  }
}

Object.defineProperties(Billboard.prototype, {
  /**
   * 确定此广告牌是否可见。使用此属性可以隐藏或显示广告牌，
   * 而不是将其移除并重新添加到集合中。
   * @memberof Billboard.prototype
   * @type {boolean}
   * @default true
   */

  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');

      if (this._show !== value) {
        this._show = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌的笛卡尔位置。
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   */

  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const position = this._position;
      if (!Cartesian3.equals(position, value)) {
        Cartesian3.clone(value, position);
        Cartesian3.clone(value, this._actualPosition);
        this._updateClamping();
        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌的高度参考。
   * @memberof Billboard.prototype
   * @type {HeightReference}
   * @default HeightReference.NONE
   */

  heightReference: {
    get: function () {
      return this._heightReference;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      const heightReference = this._heightReference;
      if (value !== heightReference) {
        this._heightReference = value;
        this._updateClamping();
        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌在屏幕空间中从原点的像素偏移。这通常用于
   * 将多个广告牌和标签对齐到相同位置，例如图像和文本。
   * 屏幕空间的原点是画布的左上角；<code>x</code> 从左到右增加，<code>y</code> 从上到下增加。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>b.pixeloffset = new Cartesian2(50, 25);</code><br/><img src='Images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 广告牌的原点由黄色点指示。
   * </div>
   * @memberof Billboard.prototype
   * @type {Cartesian2}
   */

  pixelOffset: {
    get: function () {
      return this._pixelOffset;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const pixelOffset = this._pixelOffset;
      if (!Cartesian2.equals(pixelOffset, value)) {
        Cartesian2.clone(value, pixelOffset);
        makeDirty(this, PIXEL_OFFSET_INDEX);
      }
    },
  },

  /**
   * 获取或设置基于广告牌与相机距离的广告牌的远近缩放属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内时，
   * 广告牌的缩放将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，广告牌的缩放保持在最近的边界。如果未定义，则禁用 scaleByDistance。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's scaleByDistance to scale by 1.5 when the
   * // camera is 1500 meters from the billboard and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * b.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable scaling by distance
   * b.scaleByDistance = undefined;
   */
  scaleByDistance: {
    get: function () {
      return this._scaleByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const scaleByDistance = this._scaleByDistance;
      if (!NearFarScalar.equals(scaleByDistance, value)) {
        this._scaleByDistance = NearFarScalar.clone(value, scaleByDistance);
        makeDirty(this, SCALE_BY_DISTANCE_INDEX);
      }
    },
  },

/**
   * 获取或设置基于广告牌与相机距离的广告牌的远近半透明属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内时，
   * 广告牌的半透明度将在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间插值。
   * 超出这些范围时，广告牌的半透明度保持在最近的边界。如果未定义，则禁用 translucencyByDistance。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's translucency to 1.0 when the
   * // camera is 1500 meters from the billboard and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * b.translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable translucency by distance
   * b.translucencyByDistance = undefined;
   */
  translucencyByDistance: {
    get: function () {
      return this._translucencyByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const translucencyByDistance = this._translucencyByDistance;
      if (!NearFarScalar.equals(translucencyByDistance, value)) {
        this._translucencyByDistance = NearFarScalar.clone(
          value,
          translucencyByDistance,
        );
        makeDirty(this, TRANSLUCENCY_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置基于广告牌与相机距离的广告牌的远近像素偏移缩放属性。
   * 当相机距离在指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下界限内时，
   * 广告牌的像素偏移将会在 {@link NearFarScalar#nearValue} 和 {@link NearFarScalar#farValue} 之间缩放。
   * 超出这些范围时，广告牌的像素偏移缩放保持在最近的边界。如果未定义，则禁用 pixelOffsetScaleByDistance。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's pixel offset scale to 0.0 when the
   * // camera is 1500 meters from the billboard and scale pixel offset to 10.0 pixels
   * // in the y direction the camera distance approaches 8.0e6 meters.
   * b.pixelOffset = new Cesium.Cartesian2(0.0, 1.0);
   * b.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0);
   *
   * @example
   * // Example 2.
   * // disable pixel offset by distance
   * b.pixelOffsetScaleByDistance = undefined;
   */
  pixelOffsetScaleByDistance: {
    get: function () {
      return this._pixelOffsetScaleByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const pixelOffsetScaleByDistance = this._pixelOffsetScaleByDistance;
      if (!NearFarScalar.equals(pixelOffsetScaleByDistance, value)) {
        this._pixelOffsetScaleByDistance = NearFarScalar.clone(
          value,
          pixelOffsetScaleByDistance,
        );
        makeDirty(this, PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置应用于此广告牌的眼睛坐标系中的三维笛卡尔偏移。眼睛坐标系是一个左手坐标
   * 系，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，<code>z</code> 指向屏幕内。
   * 眼睛坐标系使用与世界坐标和模型坐标相同的比例，通常为米。
   * <br /><br />
   * 眼睛偏移通常用于将多个广告牌或对象安排在相同的位置，例如，将一个广告牌放置在其
   * 相关三维模型的上方。
   * <br /><br />
   * 下方的广告牌被放置在地球中心，但眼睛偏移使其始终出现在地球顶部，而不管观察者或
   * 地球的方向如何。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>b.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code><br /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   */

  eyeOffset: {
    get: function () {
      return this._eyeOffset;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const eyeOffset = this._eyeOffset;
      if (!Cartesian3.equals(eyeOffset, value)) {
        Cartesian3.clone(value, eyeOffset);
        makeDirty(this, EYE_OFFSET_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌的水平原点，决定广告牌位于其锚点位置的左侧、中间还是右侧。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setHorizontalOrigin.png' width='648' height='196' /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {HorizontalOrigin}
   * @example
   * // Use a bottom, left origin
   * b.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
   * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
   */

  horizontalOrigin: {
    get: function () {
      return this._horizontalOrigin;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._horizontalOrigin !== value) {
        this._horizontalOrigin = value;
        makeDirty(this, HORIZONTAL_ORIGIN_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌的垂直原点，决定广告牌位于其锚点位置的上方、下方还是居中。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setVerticalOrigin.png' width='695' height='175' /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {VerticalOrigin}
   * @example
   * // Use a bottom, left origin
   * b.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
   * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
   */
  verticalOrigin: {
    get: function () {
      return this._verticalOrigin;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._verticalOrigin !== value) {
        this._verticalOrigin = value;
        makeDirty(this, VERTICAL_ORIGIN_INDEX);
      }
    },
  },

  /**
   * 获取或设置与广告牌的图像大小（以像素为单位）相乘的均匀缩放。
   * 缩放为 <code>1.0</code> 不会改变广告牌的大小；大于
   * <code>1.0</code> 的缩放将放大广告牌；小于 <code>1.0</code> 的正缩放将缩小
   * 广告牌。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setScale.png' width='400' height='300' /><br/>
   * 在上面的图片中，从左到右，缩放为 <code>0.5</code>、<code>1.0</code> 和
   * <code>2.0</code>。
   * </div>
   * @memberof Billboard.prototype
   * @type {number}
   */
  scale: {
    get: function () {
      return this._scale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._scale !== value) {
        this._scale = value;
        makeDirty(this, SCALE_INDEX);
      }
    },
  },

  /**
   * 获取或设置与广告牌的纹理相乘的颜色。这有两个常见的使用案例。首先，
   * 相同的白色纹理可以被许多不同的广告牌使用，每个广告牌都有不同的颜色，从而创建
   * 彩色广告牌。其次，颜色的 alpha 组件可以用于使广告牌半透明，如下所示。
   * alpha 为 <code>0.0</code> 使广告牌透明，而 <code>1.0</code> 使广告牌不透明。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setColor.Alpha255.png' width='250' height='188' /></td>
   * <td align='center'><code>alpha : 0.5</code><br/><img src='Images/Billboard.setColor.Alpha127.png' width='250' height='188' /></td>
   * </tr></table>
   * </div>
   * <br />
   * 红色、绿色、蓝色和 alpha 值由 <code>value</code> 的 <code>red</code>、<code>green</code>、
   * <code>blue</code> 和 <code>alpha</code> 属性指示，如示例 1 所示。这些组件的范围从 <code>0.0</code>
   * （无强度）到 <code>1.0</code> （完全强度）
   * @memberof Billboard.prototype
   * @type {Color}
   *
   * @example
   * // Example 1. Assign yellow.
   * b.color = Cesium.Color.YELLOW;
   *
   * @example
   * // Example 2. Make a billboard 50% translucent.
   * b.color = new Cesium.Color(1.0, 1.0, 1.0, 0.5);
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const color = this._color;
      if (!Color.equals(color, value)) {
        Color.clone(value, color);
        makeDirty(this, COLOR_INDEX);
      }
    },
  },

  /**
   * 获取或设置旋转角度（以弧度为单位）。
   * @memberof Billboard.prototype
   * @type {number}
   */
  rotation: {
    get: function () {
      return this._rotation;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._rotation !== value) {
        this._rotation = value;
        makeDirty(this, ROTATION_INDEX);
      }
    },
  },

/**
   * 获取或设置在世界空间中的对齐轴。对齐轴是广告牌向上的向量指向的单位向量。
   * 默认值是零向量，这意味着广告牌与屏幕的向上向量对齐。
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   * @example
   * // Example 1.
   * // Have the billboard up vector point north
   * billboard.alignedAxis = Cesium.Cartesian3.UNIT_Z;
   *
   * @example
   * // Example 2.
   * // Have the billboard point east.
   * billboard.alignedAxis = Cesium.Cartesian3.UNIT_Z;
   * billboard.rotation = -Cesium.Math.PI_OVER_TWO;
   *
   * @example
   * // Example 3.
   * // Reset the aligned axis
   * billboard.alignedAxis = Cesium.Cartesian3.ZERO;
   */
  alignedAxis: {
    get: function () {
      return this._alignedAxis;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const alignedAxis = this._alignedAxis;
      if (!Cartesian3.equals(alignedAxis, value)) {
        Cartesian3.clone(value, alignedAxis);
        makeDirty(this, ALIGNED_AXIS_INDEX);
      }
    },
  },

  /**
   * 获取或设置广告牌的宽度。如果未定义，将使用图像宽度。
   * @memberof Billboard.prototype
   * @type {number}
   */

  width: {
    get: function () {
      return defaultValue(this._width, this._imageWidth);
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
      }
      //>>includeEnd('debug');
      if (this._width !== value) {
        this._width = value;
        makeDirty(this, IMAGE_INDEX_INDEX);
      }
    },
  },

  /**
   * 获取或设置广告牌的高度。如果未定义，将使用图像高度。
   * @memberof Billboard.prototype
   * @type {number}
   */

  height: {
    get: function () {
      return defaultValue(this._height, this._imageHeight);
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
      }
      //>>includeEnd('debug');
      if (this._height !== value) {
        this._height = value;
        makeDirty(this, IMAGE_INDEX_INDEX);
      }
    },
  },

  /**
   * 获取或设置广告牌的大小是以米还是以像素为单位。<code>true</code> 表示广告牌的大小以米为单位；
   * 否则，大小以像素为单位。
   * @memberof Billboard.prototype
   * @type {boolean}
   * @default false
   */

  sizeInMeters: {
    get: function () {
      return this._sizeInMeters;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');
      if (this._sizeInMeters !== value) {
        this._sizeInMeters = value;
        makeDirty(this, COLOR_INDEX);
      }
    },
  },

  /**
   * 获取或设置指定从相机到此广告牌将显示的距离的条件。
   * @memberof Billboard.prototype
   * @type {DistanceDisplayCondition}
   * @default undefined
   */

  distanceDisplayCondition: {
    get: function () {
      return this._distanceDisplayCondition;
    },
    set: function (value) {
      if (
        !DistanceDisplayCondition.equals(value, this._distanceDisplayCondition)
      ) {
        //>>includeStart('debug', pragmas.debug);
        if (defined(value)) {
          Check.typeOf.object("value", value);
          if (value.far <= value.near) {
            throw new DeveloperError(
              "far distance must be greater than near distance.",
            );
          }
        }
        //>>includeEnd('debug');
        this._distanceDisplayCondition = DistanceDisplayCondition.clone(
          value,
          this._distanceDisplayCondition,
        );
        makeDirty(this, DISTANCE_DISPLAY_CONDITION);
      }
    },
  },

  /**
   * 获取或设置从相机到禁用深度测试的距离，例如，用于防止与地形剪切。
   * 设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，深度测试永远不应用。
   * @memberof Billboard.prototype
   * @type {number}
   */

  disableDepthTestDistance: {
    get: function () {
      return this._disableDepthTestDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
        if (value < 0.0) {
          throw new DeveloperError(
            "disableDepthTestDistance must be greater than or equal to 0.0.",
          );
        }
      }
      //>>includeEnd('debug');
      if (this._disableDepthTestDistance !== value) {
        this._disableDepthTestDistance = value;
        makeDirty(this, DISABLE_DEPTH_DISTANCE);
      }
    },
  },

  /**
   * 获取或设置选中此广告牌时返回的用户定义对象。
   * @memberof Billboard.prototype
   * @type {*}
   */

  id: {
    get: function () {
      return this._id;
    },
    set: function (value) {
      this._id = value;
      if (defined(this._pickId)) {
        this._pickId.object.id = value;
      }
    },
  },

  /**
   * 选中此广告牌时返回的基元。
   * @memberof Billboard.prototype
   * @private
   */

  pickPrimitive: {
    get: function () {
      return this._pickPrimitive;
    },
    set: function (value) {
      this._pickPrimitive = value;
      if (defined(this._pickId)) {
        this._pickId.object.primitive = value;
      }
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function () {
      return this._pickId;
    },
  },

  /**
   * <p>
   * 获取或设置此广告牌使用的图像。如果已经为给定图像创建了纹理，则使用现有的纹理。
   * </p>
   * <p>
   * 此属性可以设置为已加载的图像，一个将被自动加载为图像的 URL，
   * 一个画布，或另一个广告牌的图像属性（来自同一广告牌集合）。
   * </p>
   *
   * @memberof Billboard.prototype
   * @type {string}
   * @example
   * // load an image from a URL
   * b.image = 'some/image/url.png';
   *
   * // assuming b1 and b2 are billboards in the same billboard collection,
   * // use the same image for both billboards.
   * b2.image = b1.image;
   */
  image: {
    get: function () {
      return this._imageId;
    },
    set: function (value) {
      if (!defined(value)) {
        this._imageIndex = -1;
        this._imageSubRegion = undefined;
        this._imageId = undefined;
        this._image = undefined;
        this._imageIndexPromise = undefined;
        makeDirty(this, IMAGE_INDEX_INDEX);
      } else if (typeof value === "string") {
        this.setImage(value, value);
      } else if (value instanceof Resource) {
        this.setImage(value.url, value);
      } else if (defined(value.src)) {
        this.setImage(value.src, value);
      } else {
        this.setImage(createGuid(), value);
      }
    },
  },

  /**
   * 当 <code>true</code> 时，此广告牌已准备好渲染，即图像
   * 已下载且 WebGL 资源已创建。
   *
   * @memberof Billboard.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */

  ready: {
    get: function () {
      return this._imageIndex !== -1;
    },
  },

  /**
   * 根据高度参考跟踪广告牌的位置。
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   * @private
   */

  _clampedPosition: {
    get: function () {
      return this._actualClampedPosition;
    },
    set: function (value) {
      this._actualClampedPosition = Cartesian3.clone(
        value,
        this._actualClampedPosition,
      );
      makeDirty(this, POSITION_INDEX);
    },
  },

  /**
   * 确定此广告牌是因为被聚类而显示还是隐藏。
   * @memberof Billboard.prototype
   * @type {boolean}
   * @private
   */

  clusterShow: {
    get: function () {
      return this._clusterShow;
    },
    set: function (value) {
      if (this._clusterShow !== value) {
        this._clusterShow = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 此广告牌的轮廓颜色。仅对 SDF 广告牌有效，如标签字形。
   * @memberof Billboard.prototype
   * @type {Color}
   * @private
   */

  outlineColor: {
    get: function () {
      return this._outlineColor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const outlineColor = this._outlineColor;
      if (!Color.equals(outlineColor, value)) {
        Color.clone(value, outlineColor);
        makeDirty(this, SDF_INDEX);
      }
    },
  },

  /**
   * 此广告牌的轮廓宽度（以像素为单位）。仅对 SDF 广告牌有效，如标签字形。
   * @memberof Billboard.prototype
   * @type {number}
   * @private
   */

  outlineWidth: {
    get: function () {
      return this._outlineWidth;
    },
    set: function (value) {
      if (this._outlineWidth !== value) {
        this._outlineWidth = value;
        makeDirty(this, SDF_INDEX);
      }
    },
  },

  /**
   * 获取或设置此广告牌的 {@link SplitDirection}。
   * @memberof Billboard.prototype
   * @type {SplitDirection}
   * @default {@link SplitDirection.NONE}
   */

  splitDirection: {
    get: function () {
      return this._splitDirection;
    },
    set: function (value) {
      if (this._splitDirection !== value) {
        this._splitDirection = value;
        makeDirty(this, SPLIT_DIRECTION_INDEX);
      }
    },
  },
});

Billboard.prototype.getPickId = function (context) {
  if (!defined(this._pickId)) {
    this._pickId = context.createPickId({
      primitive: this._pickPrimitive,
      collection: this._collection,
      id: this._id,
    });
  }

  return this._pickId;
};

Billboard.prototype._updateClamping = function () {
  Billboard._updateClamping(this._billboardCollection, this);
};

const scratchCartographic = new Cartographic();
Billboard._updateClamping = function (collection, owner) {
  const scene = collection._scene;
  if (!defined(scene)) {
    //>>includeStart('debug', pragmas.debug);
    if (owner._heightReference !== HeightReference.NONE) {
      throw new DeveloperError(
        "Height reference is not supported without a scene.",
      );
    }
    //>>includeEnd('debug');
    return;
  }

  const ellipsoid = defaultValue(scene.ellipsoid, Ellipsoid.default);

  const mode = scene.frameState.mode;

  const modeChanged = mode !== owner._mode;
  owner._mode = mode;

  if (
    (owner._heightReference === HeightReference.NONE || modeChanged) &&
    defined(owner._removeCallbackFunc)
  ) {
    owner._removeCallbackFunc();
    owner._removeCallbackFunc = undefined;
    owner._clampedPosition = undefined;
  }

  if (
    owner._heightReference === HeightReference.NONE ||
    !defined(owner._position)
  ) {
    return;
  }

  if (defined(owner._removeCallbackFunc)) {
    owner._removeCallbackFunc();
  }

  const position = ellipsoid.cartesianToCartographic(owner._position);
  if (!defined(position)) {
    owner._actualClampedPosition = undefined;
    return;
  }

  function updateFunction(clampedPosition) {
    const updatedClampedPosition = ellipsoid.cartographicToCartesian(
      clampedPosition,
      owner._clampedPosition,
    );

    if (isHeightReferenceRelative(owner._heightReference)) {
      if (owner._mode === SceneMode.SCENE3D) {
        clampedPosition.height += position.height;
        ellipsoid.cartographicToCartesian(
          clampedPosition,
          updatedClampedPosition,
        );
      } else {
        updatedClampedPosition.x += position.height;
      }
    }

    owner._clampedPosition = updatedClampedPosition;
  }

  owner._removeCallbackFunc = scene.updateHeight(
    position,
    updateFunction,
    owner._heightReference,
  );

  Cartographic.clone(position, scratchCartographic);
  const height = scene.getHeight(position, owner._heightReference);
  if (defined(height)) {
    scratchCartographic.height = height;
  }

  updateFunction(scratchCartographic);
};

Billboard.prototype._loadImage = function () {
  const atlas = this._billboardCollection._textureAtlas;

  const imageId = this._imageId;
  const image = this._image;
  const imageSubRegion = this._imageSubRegion;
  let imageIndexPromise;

  const that = this;
  function completeImageLoad(index) {
    if (
      that._imageId !== imageId ||
      that._image !== image ||
      !BoundingRectangle.equals(that._imageSubRegion, imageSubRegion)
    ) {
      // another load occurred before this one finished, ignore the index
      return;
    }

    // fill in imageWidth and imageHeight
    const textureCoordinates = atlas.textureCoordinates[index];
    that._imageWidth = atlas.texture.width * textureCoordinates.width;
    that._imageHeight = atlas.texture.height * textureCoordinates.height;

    that._imageIndex = index;
    that._ready = true;
    that._image = undefined;
    that._imageIndexPromise = undefined;
    makeDirty(that, IMAGE_INDEX_INDEX);

    const scene = that._billboardCollection._scene;
    if (!defined(scene)) {
      return;
    }
    // Request a new render in request render mode
    scene.frameState.afterRender.push(() => true);
  }

  if (defined(image)) {
    imageIndexPromise = atlas.addImage(imageId, image);
  }
  if (defined(imageSubRegion)) {
    imageIndexPromise = atlas.addSubRegion(imageId, imageSubRegion);
  }

  this._imageIndexPromise = imageIndexPromise;

  if (!defined(imageIndexPromise)) {
    return;
  }

  // If the promise has already successfully resolved, we can return immediately without waiting a frame
  const index = atlas.getImageIndex(imageId);
  if (defined(index) && !defined(imageSubRegion)) {
    completeImageLoad(index);
    return;
  }

  imageIndexPromise.then(completeImageLoad).catch(function (error) {
    console.error(`Error loading image for billboard: ${error}`);
    that._imageIndexPromise = undefined;
  });
};

/**
 * <p>
 * 设置要用于此广告牌的图像。如果已经为给定 id 创建了纹理，则使用现有纹理。
 * </p>
 * <p>
 * 此功能对于动态创建在多个广告牌之间共享的纹理非常有用。
 * 只有第一个广告牌会实际调用该函数并创建纹理，而随后的使用相同 id 创建的广告牌将简单地重用现有纹理。
 * </p>
 * <p>
 * 从 URL 加载图像时，设置 {@link Billboard#image} 属性更方便。
 * </p>
 *
 * @param {string} id 图像的 id。可以是唯一标识图像的任何字符串。
 * @param {HTMLImageElement|HTMLCanvasElement|string|Resource|Billboard.CreateImageCallback} image 要加载的图像。此参数
 *        可以是已加载的图像或画布，一个将自动加载为图像的 URL，
 *        或一个函数，如果图像尚未加载，则调用该函数以创建图像
 * @example
 * // create a billboard image dynamically
 * function drawImage(id) {
 *   // create and draw an image using a canvas
 *   const canvas = document.createElement('canvas');
 *   const context2D = canvas.getContext('2d');
 *   // ... draw image
 *   return canvas;
 * }
 * // drawImage will be called to create the texture
 * b.setImage('myImage', drawImage);
 *
 * // subsequent billboards created in the same collection using the same id will use the existing
 * // texture, without the need to create the canvas or draw the image
 * b2.setImage('myImage', drawImage);
 */
Billboard.prototype.setImage = function (id, image) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  if (!defined(image)) {
    throw new DeveloperError("image is required.");
  }
  //>>includeEnd('debug');

  if (this._imageId === id) {
    return;
  }

  this._imageIndex = -1;
  this._imageSubRegion = undefined;
  this._imageId = id;
  this._image = image;

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }
};

/**
 * 使用具有给定 id 的图像的子区域作为此广告牌的图像，
 * 以从左下角测量的像素为准。
 *
 * @param {string} id 要使用的图像的 id。
 * @param {BoundingRectangle} subRegion 图像的子区域。
 *
 * @exception {RuntimeError} 具有 id 的图像必须在图集内
 */

Billboard.prototype.setImageSubRegion = function (id, subRegion) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  if (!defined(subRegion)) {
    throw new DeveloperError("subRegion is required.");
  }
  //>>includeEnd('debug');

  if (
    this._imageId === id &&
    BoundingRectangle.equals(this._imageSubRegion, subRegion)
  ) {
    return;
  }

  this._imageIndex = -1;
  this._imageId = id;
  this._imageSubRegion = BoundingRectangle.clone(subRegion);

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }
};

Billboard.prototype._setTranslate = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');

  const translate = this._translate;
  if (!Cartesian2.equals(translate, value)) {
    Cartesian2.clone(value, translate);
    makeDirty(this, PIXEL_OFFSET_INDEX);
  }
};

Billboard.prototype._getActualPosition = function () {
  return defined(this._clampedPosition)
    ? this._clampedPosition
    : this._actualPosition;
};

Billboard.prototype._setActualPosition = function (value) {
  if (!defined(this._clampedPosition)) {
    Cartesian3.clone(value, this._actualPosition);
  }
  makeDirty(this, POSITION_INDEX);
};

const tempCartesian3 = new Cartesian4();
Billboard._computeActualPosition = function (
  billboard,
  position,
  frameState,
  modelMatrix,
) {
  if (defined(billboard._clampedPosition)) {
    if (frameState.mode !== billboard._mode) {
      billboard._updateClamping();
    }
    return billboard._clampedPosition;
  } else if (frameState.mode === SceneMode.SCENE3D) {
    return position;
  }

  Matrix4.multiplyByPoint(modelMatrix, position, tempCartesian3);
  return SceneTransforms.computeActualEllipsoidPosition(
    frameState,
    tempCartesian3,
  );
};

const scratchCartesian3 = new Cartesian3();

// This function is basically a stripped-down JavaScript version of BillboardCollectionVS.glsl
Billboard._computeScreenSpacePosition = function (
  modelMatrix,
  position,
  eyeOffset,
  pixelOffset,
  scene,
  result,
) {
  // Model to world coordinates
  const positionWorld = Matrix4.multiplyByPoint(
    modelMatrix,
    position,
    scratchCartesian3,
  );

  // World to window coordinates
  const positionWC = SceneTransforms.worldWithEyeOffsetToWindowCoordinates(
    scene,
    positionWorld,
    eyeOffset,
    result,
  );
  if (!defined(positionWC)) {
    return undefined;
  }

  // Apply pixel offset
  Cartesian2.add(positionWC, pixelOffset, positionWC);

  return positionWC;
};

const scratchPixelOffset = new Cartesian2(0.0, 0.0);

/**
 * 计算广告牌原点的屏幕空间位置，同时考虑眼睛和像素偏移。
 * 屏幕空间的原点是画布的左上角；<code>x</code> 从左到右增加，<code>y</code> 从上到下增加。
 *
 * @param {Scene} scene 场景。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 广告牌的屏幕空间位置。
 *
 * @exception {DeveloperError} Billboard must be in a collection.
 *
 * @example
 * console.log(b.computeScreenSpacePosition(scene).toString());
 *
 * @see Billboard#eyeOffset
 * @see Billboard#pixelOffset
 */
Billboard.prototype.computeScreenSpacePosition = function (scene, result) {
  const billboardCollection = this._billboardCollection;
  if (!defined(result)) {
    result = new Cartesian2();
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(billboardCollection)) {
    throw new DeveloperError(
      "Billboard must be in a collection.  Was it removed?",
    );
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  // pixel offset for screen space computation is the pixelOffset + screen space translate
  Cartesian2.clone(this._pixelOffset, scratchPixelOffset);
  Cartesian2.add(scratchPixelOffset, this._translate, scratchPixelOffset);

  let modelMatrix = billboardCollection.modelMatrix;
  let position = this._position;
  if (defined(this._clampedPosition)) {
    position = this._clampedPosition;
    if (scene.mode !== SceneMode.SCENE3D) {
      // position needs to be in world coordinates
      const projection = scene.mapProjection;
      const ellipsoid = projection.ellipsoid;
      const cart = projection.unproject(position, scratchCartographic);
      position = ellipsoid.cartographicToCartesian(cart, scratchCartesian3);
      modelMatrix = Matrix4.IDENTITY;
    }
  }

  const windowCoordinates = Billboard._computeScreenSpacePosition(
    modelMatrix,
    position,
    this._eyeOffset,
    scratchPixelOffset,
    scene,
    result,
  );
  return windowCoordinates;
};

/**
 * 获取围绕 screenSpacePosition 中心对齐的广告牌的屏幕空间边界框。
 * @param {Billboard} billboard 要获取屏幕空间边界框的广告牌。
 * @param {Cartesian2} screenSpacePosition 标签的屏幕空间中心。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 屏幕空间边界框。
 *
 * @private
 */

Billboard.getScreenSpaceBoundingBox = function (
  billboard,
  screenSpacePosition,
  result,
) {
  let width = billboard.width;
  let height = billboard.height;

  const scale = billboard.scale;
  width *= scale;
  height *= scale;

  let x = screenSpacePosition.x;
  if (billboard.horizontalOrigin === HorizontalOrigin.RIGHT) {
    x -= width;
  } else if (billboard.horizontalOrigin === HorizontalOrigin.CENTER) {
    x -= width * 0.5;
  }

  let y = screenSpacePosition.y;
  if (
    billboard.verticalOrigin === VerticalOrigin.BOTTOM ||
    billboard.verticalOrigin === VerticalOrigin.BASELINE
  ) {
    y -= height;
  } else if (billboard.verticalOrigin === VerticalOrigin.CENTER) {
    y -= height * 0.5;
  }

  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  result.x = x;
  result.y = y;
  result.width = width;
  result.height = height;

  return result;
};

/**
 * 确定此广告牌是否等于另一个广告牌。如果所有属性
 * 相等，则广告牌相等。不同集合中的广告牌也可以相等。
 *
 * @param {Billboard} other 要比较的广告牌。
 * @returns {boolean} 如果广告牌相等则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Billboard.prototype.equals = function (other) {
  return (
    this === other ||
    (defined(other) &&
      this._id === other._id &&
      Cartesian3.equals(this._position, other._position) &&
      this._imageId === other._imageId &&
      this._show === other._show &&
      this._scale === other._scale &&
      this._verticalOrigin === other._verticalOrigin &&
      this._horizontalOrigin === other._horizontalOrigin &&
      this._heightReference === other._heightReference &&
      BoundingRectangle.equals(this._imageSubRegion, other._imageSubRegion) &&
      Color.equals(this._color, other._color) &&
      Cartesian2.equals(this._pixelOffset, other._pixelOffset) &&
      Cartesian2.equals(this._translate, other._translate) &&
      Cartesian3.equals(this._eyeOffset, other._eyeOffset) &&
      NearFarScalar.equals(this._scaleByDistance, other._scaleByDistance) &&
      NearFarScalar.equals(
        this._translucencyByDistance,
        other._translucencyByDistance,
      ) &&
      NearFarScalar.equals(
        this._pixelOffsetScaleByDistance,
        other._pixelOffsetScaleByDistance,
      ) &&
      DistanceDisplayCondition.equals(
        this._distanceDisplayCondition,
        other._distanceDisplayCondition,
      ) &&
      this._disableDepthTestDistance === other._disableDepthTestDistance &&
      this._splitDirection === other._splitDirection)
  );
};

Billboard.prototype._destroy = function () {
  if (defined(this._customData)) {
    this._billboardCollection._scene.globe._surface.removeTileCustomData(
      this._customData,
    );
    this._customData = undefined;
  }

  if (defined(this._removeCallbackFunc)) {
    this._removeCallbackFunc();
    this._removeCallbackFunc = undefined;
  }

  this.image = undefined;
  this._pickId = this._pickId && this._pickId.destroy();
  this._billboardCollection = undefined;
};

/**
 * 创建图像的函数。
 * @callback Billboard.CreateImageCallback
 * @param {string} id 要加载的图像的标识符。
 * @returns {HTMLImageElement|HTMLCanvasElement|Promise<HTMLImageElement|HTMLCanvasElement>} 图像，或一个承诺，该承诺将解析为图像。
 */

export default Billboard;
