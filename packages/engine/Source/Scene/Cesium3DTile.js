import BoundingSphere from "../Core/BoundingSphere.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import ColorGeometryInstanceAttribute from "../Core/ColorGeometryInstanceAttribute.js";
import CullingVolume from "../Core/CullingVolume.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import deprecationWarning from "../Core/deprecationWarning.js";
import destroyObject from "../Core/destroyObject.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Intersect from "../Core/Intersect.js";
import JulianDate from "../Core/JulianDate.js";
import CesiumMath from "../Core/Math.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import OrientedBoundingBox from "../Core/OrientedBoundingBox.js";
import OrthographicFrustum from "../Core/OrthographicFrustum.js";
import Rectangle from "../Core/Rectangle.js";
import Request from "../Core/Request.js";
import RequestScheduler from "../Core/RequestScheduler.js";
import RequestState from "../Core/RequestState.js";
import RequestType from "../Core/RequestType.js";
import Resource from "../Core/Resource.js";
import RuntimeError from "../Core/RuntimeError.js";
import Cesium3DContentGroup from "./Cesium3DContentGroup.js";
import Cesium3DTileContentFactory from "./Cesium3DTileContentFactory.js";
import Cesium3DTileContentState from "./Cesium3DTileContentState.js";
import Cesium3DTileContentType from "./Cesium3DTileContentType.js";
import Cesium3DTileOptimizationHint from "./Cesium3DTileOptimizationHint.js";
import Cesium3DTilePass from "./Cesium3DTilePass.js";
import Cesium3DTileRefine from "./Cesium3DTileRefine.js";
import Empty3DTileContent from "./Empty3DTileContent.js";
import findContentMetadata from "./findContentMetadata.js";
import findGroupMetadata from "./findGroupMetadata.js";
import findTileMetadata from "./findTileMetadata.js";
import hasExtension from "./hasExtension.js";
import Multiple3DTileContent from "./Multiple3DTileContent.js";
import BoundingVolumeSemantics from "./BoundingVolumeSemantics.js";
import preprocess3DTileContent from "./preprocess3DTileContent.js";
import SceneMode from "./SceneMode.js";
import TileBoundingRegion from "./TileBoundingRegion.js";
import TileBoundingS2Cell from "./TileBoundingS2Cell.js";
import TileBoundingSphere from "./TileBoundingSphere.js";
import TileOrientedBoundingBox from "./TileOrientedBoundingBox.js";
import Pass from "../Renderer/Pass.js";
import VerticalExaggeration from "../Core/VerticalExaggeration.js";

/**
 * {@link Cesium3DTileset} 中的一个瓦片。当一个瓦片首次创建时，其内容不会被加载；
 * 内容在视图需要时按需加载。
 * <p>
 * 不要直接构造此对象，而是通过 {@link Cesium3DTileset#tileVisible} 访问瓦片。
 * </p>
 *
 * @alias Cesium3DTile
 * @constructor
 * @param {Cesium3DTileset} tileset 瓦片集
 * @param {Resource} baseResource 瓦片集的基础资源
 * @param {object} header 瓦片的 JSON 头
 * @param {Cesium3DTile} parent 新瓦片的父级瓦片
 */

function Cesium3DTile(tileset, baseResource, header, parent) {
  this._tileset = tileset;
  this._header = header;

  const hasContentsArray = defined(header.contents);
  const hasMultipleContents =
    (hasContentsArray && header.contents.length > 1) ||
    hasExtension(header, "3DTILES_multiple_contents");

  // In the 1.0 schema, content is stored in tile.content instead of tile.contents
  const contentHeader =
    hasContentsArray && !hasMultipleContents
      ? header.contents[0]
      : header.content;

  this._contentHeader = contentHeader;

  /**
   * 该瓦片的局部变换。
   * @type {Matrix4}
   */

  this.transform = defined(header.transform)
    ? Matrix4.unpack(header.transform)
    : Matrix4.clone(Matrix4.IDENTITY);

  const parentTransform = defined(parent)
    ? parent.computedTransform
    : tileset.modelMatrix;
  const computedTransform = Matrix4.multiply(
    parentTransform,
    this.transform,
    new Matrix4(),
  );

  const parentInitialTransform = defined(parent)
    ? parent._initialTransform
    : Matrix4.IDENTITY;
  this._initialTransform = Matrix4.multiply(
    parentInitialTransform,
    this.transform,
    new Matrix4(),
  );

 /**
   * 该瓦片的最终计算变换。
   * @type {Matrix4}
   * @readonly
   */

  this.computedTransform = computedTransform;

  /**
   * 当瓦片元数据存在（3D Tiles 1.1）或使用 <code>3DTILES_metadata</code> 扩展时，
   * 它存储一个 {@link TileMetadata} 对象以访问瓦片元数据。
   *
   * @type {TileMetadata}
   * @readonly
   * @private
   * @experimental 此功能使用的是 3D Tiles 规范的部分内容，该内容尚未最终确定，可能会在没有 Cesium 标准弃用政策的情况下发生更改。
   */

  this.metadata = findTileMetadata(tileset, header);

  this._verticalExaggeration = 1.0;
  this._verticalExaggerationRelativeHeight = 0.0;

  // Important: tile metadata must be parsed before this line so that the
  // metadata semantics TILE_BOUNDING_BOX, TILE_BOUNDING_REGION, or TILE_BOUNDING_SPHERE
  // can override header.boundingVolume (if necessary)
  this._boundingVolume = this.createBoundingVolume(
    header.boundingVolume,
    computedTransform,
  );
  this._boundingVolume2D = undefined;

  let contentBoundingVolume;

  if (defined(contentHeader) && defined(contentHeader.boundingVolume)) {
    // Non-leaf tiles may have a content bounding-volume, which is a tight-fit bounding volume
    // around only the features in the tile.  This box is useful for culling for rendering,
    // but not for culling for traversing the tree since it does not guarantee spatial coherence, i.e.,
    // since it only bounds features in the tile, not the entire tile, children may be
    // outside of this box.
    contentBoundingVolume = this.createBoundingVolume(
      contentHeader.boundingVolume,
      computedTransform,
    );
  }
  this._contentBoundingVolume = contentBoundingVolume;
  this._contentBoundingVolume2D = undefined;

  let viewerRequestVolume;
  if (defined(header.viewerRequestVolume)) {
    viewerRequestVolume = this.createBoundingVolume(
      header.viewerRequestVolume,
      computedTransform,
    );
  }
  this._viewerRequestVolume = viewerRequestVolume;

  /**
   * 如果渲染该瓦片而其子瓦片未被渲染时引入的误差（以米为单位）。
   * 这用于计算屏幕空间误差，即以像素为单位测量的误差。
   *
   * @type {number}
   * @readonly
   */

  this.geometricError = header.geometricError;
  this._geometricError = header.geometricError;

  if (!defined(this._geometricError)) {
    this._geometricError = defined(parent)
      ? parent._geometricError
      : tileset._geometricError;
    Cesium3DTile._deprecationWarning(
      "geometricErrorUndefined",
      "Required property geometricError is undefined for this tile. Using parent's geometric error instead.",
    );
  }

  this.updateGeometricErrorScale();

  let refine;
  if (defined(header.refine)) {
    if (header.refine === "replace" || header.refine === "add") {
      Cesium3DTile._deprecationWarning(
        "lowercase-refine",
        `This tile uses a lowercase refine "${
          header.refine
        }". Instead use "${header.refine.toUpperCase()}".`,
      );
    }
    refine =
      header.refine.toUpperCase() === "REPLACE"
        ? Cesium3DTileRefine.REPLACE
        : Cesium3DTileRefine.ADD;
  } else if (defined(parent)) {
    // Inherit from parent tile if omitted.
    refine = parent.refine;
  } else {
    refine = Cesium3DTileRefine.REPLACE;
  }

  /**
   * 指定在遍历此瓦片以进行渲染时使用的细化类型。
   *
   * @type {Cesium3DTileRefine}
   * @readonly
   * @private
   */

  this.refine = refine;

  /**
   * 获取瓦片的子瓦片。
   *
   * @type {Cesium3DTile[]}
   * @readonly
   */

  this.children = [];

  /**
   * 该瓦片的父级，如果该瓦片是根瓦片则为 <code>undefined</code>。
   * <p>
   * 当瓦片的内容指向外部瓦片集 JSON 文件时，外部瓦片集的
   * 根瓦片的父级不是 <code>undefined</code>；相反，父级引用
   * 该瓦片（其内容指向一个外部瓦片集 JSON 文件），就像这两个瓦片集被合并一样。
   * </p>
   *
   * @type {Cesium3DTile}
   * @readonly
   */

  this.parent = parent;

  let content;
  let hasEmptyContent = false;
  let contentState;
  let contentResource;
  let serverKey;

  baseResource = Resource.createIfNeeded(baseResource);

  if (hasMultipleContents) {
    contentState = Cesium3DTileContentState.UNLOADED;
    // Each content may have its own URI, but they all need to be resolved
    // relative to the tileset, so the base resource is used.
    contentResource = baseResource.clone();
  } else if (defined(contentHeader)) {
    let contentHeaderUri = contentHeader.uri;
    if (defined(contentHeader.url)) {
      Cesium3DTile._deprecationWarning(
        "contentUrl",
        'This tileset JSON uses the "content.url" property which has been deprecated. Use "content.uri" instead.',
      );
      contentHeaderUri = contentHeader.url;
    }
    if (contentHeaderUri === "") {
      Cesium3DTile._deprecationWarning(
        "contentUriEmpty",
        "content.uri property is an empty string, which creates a circular dependency, making this tileset invalid. Omit the content property instead",
      );
      content = new Empty3DTileContent(tileset, this);
      hasEmptyContent = true;
      contentState = Cesium3DTileContentState.READY;
    } else {
      contentState = Cesium3DTileContentState.UNLOADED;
      contentResource = baseResource.getDerivedResource({
        url: contentHeaderUri,
      });
      serverKey = RequestScheduler.getServerKey(
        contentResource.getUrlComponent(),
      );
    }
  } else {
    content = new Empty3DTileContent(tileset, this);
    hasEmptyContent = true;
    contentState = Cesium3DTileContentState.READY;
  }

  this._content = content;
  this._contentResource = contentResource;
  this._contentState = contentState;
  this._expiredContent = undefined;

  this._serverKey = serverKey;

  /**
   * 当 <code>true</code> 时，表示该瓦片没有内容。
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  this.hasEmptyContent = hasEmptyContent;

  /**
   * 当 <code>true</code> 时，表示该瓦片的内容指向一个外部瓦片集。
   * <p>
   * 在瓦片的内容加载之前，此值为 <code>false</code>。
   * </p>
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  this.hasTilesetContent = false;

  /**
   * 当 <code>true</code> 时，表示该瓦片的内容是隐式瓦片集。
   * <p>
   * 在该瓦片的隐式内容加载之前，此值为 <code>false</code>。
   * </p>
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   * @experimental 此功能使用的是 3D Tiles 规范的部分内容，该内容尚未最终确定，可能会在没有 Cesium 标准弃用政策的情况下发生更改。
   */

  this.hasImplicitContent = false;

  /**
   * 当 <code>true</code> 时，表示该瓦片包含来自隐式切割的内容元数据。此标志用于通过 <code>Implicit3DTileContent</code> 转码的瓦片。
   * <p>
   * 在瓦片的内容加载之前，此值为 <code>false</code>。
   * </p>
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   * @experimental 此功能使用的是 3D Tiles 规范的部分内容，该内容尚未最终确定，可能会在没有 Cesium 标准弃用政策的情况下发生更改。
   */

  this.hasImplicitContentMetadata = false;

  /**
   * 当 <code>true</code> 时，表示该瓦片包含多个内容，可以在瓦片 JSON（3D Tiles 1.1）中找到，
   * 或通过 <code>3DTILES_multiple_contents</code> 扩展。
   *
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_multiple_contents|3DTILES_multiple_contents extension}
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */
  this.hasMultipleContents = hasMultipleContents;

  /**
   * 瓦片集 LRU 缓存中的节点，用于确定何时卸载瓦片的内容。
   *
   * 参见 {@link Cesium3DTilesetCache}
   *
   * @type {DoublyLinkedListNode}
   * @readonly
   *
   * @private
   */

  this.cacheNode = undefined;

  const expire = header.expire;
  let expireDuration;
  let expireDate;
  if (defined(expire)) {
    expireDuration = expire.duration;
    if (defined(expire.date)) {
      expireDate = JulianDate.fromIso8601(expire.date);
    }
  }

  /**
   * 瓦片内容准备就绪后经过的时间（以秒为单位），当内容过期并请求新内容时。
   *
   * @type {number}
   */
  this.expireDuration = expireDuration;

  /**
   * 内容过期并请求新内容的日期。
   *
   * @type {JulianDate}
   */
  this.expireDate = expireDate;

  /**
   * 最后一次应用样式到该瓦片的时间。
   *
   * @type {number}
   *
   * @private
   */

  this.lastStyleTime = 0.0;

  /**
   * 标记瓷砖的子边界是否完全包含在瓷砖的边界内
   *
   * @type {Cesium3DTileOptimizationHint}
   *
   * @private
   */


  this._optimChildrenWithinParent = Cesium3DTileOptimizationHint.NOT_COMPUTED;

  /**
   * 跟踪瓷砖与剪裁平面集合之间的关系是否因剪裁平面集合的状态而发生变化。
   *
   * @type {boolean}
   *
   * @private
   */
  this.clippingPlanesDirty = false;

  /**
   * 跟踪瓷砖与剪裁多边形集合之间的关系是否因剪裁多边形集合的状态而发生变化。
   *
   * @type {boolean}
   *
   * @private
   */

  this.clippingPolygonsDirty = false;

  /**
   * 跟踪瓷砖的请求是否应该推迟，直到所有非推迟的瓷砖加载完成。
   *
   * @type {boolean}
   *
   * @private
   */
  this.priorityDeferred = false;

  /**
   * 对于隐式瓦片，隐式瓦片集对象将附加到占位符瓷砖上，该瓷砖要么在 JSON 中使用隐式瓦片（3D Tiles 1.1），
   * 要么使用 <code>3DTILES_implicit_tiling</code> 扩展。
   * 这样，一旦内容被获取，{@link Implicit3DTileContent} 就可以访问该瓦片。
   *
   * @type {ImplicitTileset|undefined}
   *
   * @private
   * @experimental 此功能使用的 3D Tiles 规范的部分内容尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
   */

  this.implicitTileset = undefined;

  /**
   * 对于隐式瓦片，隐式瓦片集中 (level, x, y, [z]) 坐标存储在瓦片中。
   *
   * @type {ImplicitTileCoordinates|undefined}
   *
   * @private
   * @experimental 此功能使用的 3D Tiles 规范的部分内容尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
   */

  this.implicitCoordinates = undefined;

  /**
   * 对于隐式瓦片，每个转码的瓦片将持有对 {@link ImplicitSubtree} 的弱引用。
   *
   * @type {ImplicitSubtree|undefined}
   *
   * @private
   * @experimental 此功能使用的 3D Tiles 规范的部分内容尚未最终确定，可能会在不遵循 Cesium 标准弃用政策的情况下发生更改。
   */

  this.implicitSubtree = undefined;

  // Members that are updated every frame for tree traversal and rendering optimizations:
  this._distanceToCamera = 0.0;
  this._centerZDepth = 0.0;
  this._screenSpaceError = 0.0;
  this._screenSpaceErrorProgressiveResolution = 0.0; // The screen space error at a given screen height of tileset.progressiveResolutionHeightFraction * screenHeight
  this._visibilityPlaneMask = 0;
  this._visible = false;
  this._inRequestVolume = false;

  this._finalResolution = true;
  this._depth = 0;
  this._stackLength = 0;
  this._selectionDepth = 0;

  this._updatedVisibilityFrame = 0;
  this._touchedFrame = 0;
  this._visitedFrame = 0;
  this._selectedFrame = 0;
  this._wasSelectedLastFrame = false;
  this._requestedFrame = 0;
  this._ancestorWithContent = undefined;
  this._ancestorWithContentAvailable = undefined;
  this._refines = false;
  this._shouldSelect = false;
  this._isClipped = true;
  this._isClippedByPolygon = false;
  this._clippingPlanesState = 0; // encapsulates (_isClipped, clippingPlanes.enabled) and number/function
  this._clippingPolygonsState = 0; // encapsulates (_isClipped, clippingPolygons.enabled) and number/function
  this._debugBoundingVolume = undefined;
  this._debugContentBoundingVolume = undefined;
  this._debugViewerRequestVolume = undefined;
  this._debugColor = Color.fromRandom({ alpha: 1.0 });
  this._debugColorizeTiles = false;

  this._priority = 0.0; // The priority used for request sorting
  this._priorityHolder = this; // Reference to the ancestor up the tree that holds the _foveatedFactor and _distanceToCamera for all tiles in the refinement chain.
  this._priorityProgressiveResolution = false;
  this._priorityProgressiveResolutionScreenSpaceErrorLeaf = false;
  this._priorityReverseScreenSpaceError = 0.0;
  this._foveatedFactor = 0.0;
  this._wasMinPriorityChild = false; // Needed for knowing when to continue a refinement chain. Gets reset in updateTile in traversal and gets set in updateAndPushChildren in traversal.

  this._loadTimestamp = new JulianDate();

  this._commandsLength = 0;

  this._color = undefined;
  this._colorDirty = false;

  this._request = undefined;
}

// This can be overridden for testing purposes
Cesium3DTile._deprecationWarning = deprecationWarning;

Object.defineProperties(Cesium3DTile.prototype, {
  /**
   * 包含此瓦片的瓦片集。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {Cesium3DTileset}
   * @readonly
   */

  tileset: {
    get: function () {
      return this._tileset;
    },
  },

  /**
   * 瓷砖的内容。这表示实际瓷砖的有效负载，
   * 而不是瓦片集 JSON 文件中内容的元数据。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {Cesium3DTileContent}
   * @readonly
   */

  content: {
    get: function () {
      return this._content;
    },
  },

  /**
   * 获取瓷砖的边界体积。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {TileBoundingVolume}
   * @readonly
   * @private
   */

  boundingVolume: {
    get: function () {
      return this._boundingVolume;
    },
  },

  /**
   * 获取瓷砖内容的边界体积。当内容的边界体积为
   * <code>undefined</code> 时，默认使用瓷砖的边界体积。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {TileBoundingVolume}
   * @readonly
   * @private
   */

  contentBoundingVolume: {
    get: function () {
      return defaultValue(this._contentBoundingVolume, this._boundingVolume);
    },
  },

  /**
   * 获取从瓷砖的边界体积派生的边界球。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {BoundingSphere}
   * @readonly
   */

  boundingSphere: {
    get: function () {
      return this._boundingVolume.boundingSphere;
    },
  },

  /**
   * 确定瓷砖在当前视野范围内是否可见
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  isVisible: {
    get: function () {
      return this._visible && this._inRequestVolume;
    },
  },

  /**
   * 返回该瓷砖在瓦片集 JSON 中的 <code>extras</code> 属性，该属性包含特定于应用程序的元数据。
   * 如果 <code>extras</code> 不存在，则返回 <code>undefined</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {object}
   * @readonly
   * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
   */
  extras: {
    get: function () {
      return this._header.extras;
    },
  },

  /**
   * 获取或设置瓷砖的高亮颜色。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {Color}
   *
   * @default {@link Color.WHITE}
   *
   * @private
   */

  color: {
    get: function () {
      if (!defined(this._color)) {
        this._color = new Color();
      }
      return Color.clone(this._color);
    },
    set: function (value) {
      this._color = Color.clone(value, this._color);
      this._colorDirty = true;
    },
  },

  /**
   * 确定瓷砖的内容是否可渲染。若瓷砖内容为空，
   * 或指向外部瓦片集或隐式内容，则返回 <code>false</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  hasRenderableContent: {
    get: function () {
      return (
        !this.hasEmptyContent &&
        !this.hasTilesetContent &&
        !this.hasImplicitContent
      );
    },
  },

  /**
   * 确定瓷砖是否有可用的内容进行渲染。若瓷砖内容已准备好，
   * 或如果它有过期的内容在新内容加载时进行渲染，则返回 <code>true</code>；
   * 否则返回 <code>false</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  contentAvailable: {
    get: function () {
      return (
        (this.contentReady && this.hasRenderableContent) ||
        (defined(this._expiredContent) && !this.contentFailed)
      );
    },
  },

  /**
   * 确定瓷砖的内容是否准备就绪。对于内容为空的瓷砖，
   * 这自动返回 <code>true</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  contentReady: {
    get: function () {
      return this._contentState === Cesium3DTileContentState.READY;
    },
  },

  /**
   * 确定瓷砖的内容是否未被请求。如果瓷砖的内容未被请求，则返回 <code>true</code>；
   * 否则返回 <code>false</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  contentUnloaded: {
    get: function () {
      return this._contentState === Cesium3DTileContentState.UNLOADED;
    },
  },

  /**
   * 确定瓷砖是否有未加载的可渲染内容
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  hasUnloadedRenderableContent: {
    get: function () {
      return this.hasRenderableContent && this.contentUnloaded;
    },
  },

  /**
   * 确定瓷砖的内容是否过期。如果瓷砖的内容已过期，则返回 <code>true</code>；
   * 否则返回 <code>false</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  contentExpired: {
    get: function () {
      return this._contentState === Cesium3DTileContentState.EXPIRED;
    },
  },

  /**
   * 确定瓷砖的内容是否加载失败。如果瓷砖的内容加载失败，则返回 <code>true</code>；
   * 否则返回 <code>false</code>。
   *
   * @memberof Cesium3DTile.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @private
   */

  contentFailed: {
    get: function () {
      return this._contentState === Cesium3DTileContentState.FAILED;
    },
  },

  /**
   * 返回该瓷砖使用的绘制命令数量。
   *
   * @readonly
   *
   * @private
   */

  commandsLength: {
    get: function () {
      return this._commandsLength;
    },
  },
});

const scratchCartesian = new Cartesian3();

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {FrameState} frameState
 * @returns {Boolean}
 */
function isPriorityDeferred(tile, frameState) {
  const { tileset, boundingSphere } = tile;
  const { radius, center } = boundingSphere;
  const { camera } = frameState;

  // If closest point on line is inside the sphere then set foveatedFactor to 0.
  // Otherwise, the dot product is with the line from camera to the point on the sphere that is closest to the line.
  const scaledCameraDirection = Cartesian3.multiplyByScalar(
    camera.directionWC,
    tile._centerZDepth,
    scratchCartesian,
  );
  const closestPointOnLine = Cartesian3.add(
    camera.positionWC,
    scaledCameraDirection,
    scratchCartesian,
  );
  // The distance from the camera's view direction to the tile.
  const toLine = Cartesian3.subtract(
    closestPointOnLine,
    center,
    scratchCartesian,
  );
  const distanceToCenterLine = Cartesian3.magnitude(toLine);
  const notTouchingSphere = distanceToCenterLine > radius;

  // If camera's direction vector is inside the bounding sphere then consider
  // this tile right along the line of sight and set _foveatedFactor to 0.
  // Otherwise,_foveatedFactor is one minus the dot product of the camera's direction
  // and the vector between the camera and the point on the bounding sphere closest to the view line.
  if (notTouchingSphere) {
    const toLineNormalized = Cartesian3.normalize(toLine, scratchCartesian);
    const scaledToLine = Cartesian3.multiplyByScalar(
      toLineNormalized,
      radius,
      scratchCartesian,
    );
    const closestOnSphere = Cartesian3.add(
      center,
      scaledToLine,
      scratchCartesian,
    );
    const toClosestOnSphere = Cartesian3.subtract(
      closestOnSphere,
      camera.positionWC,
      scratchCartesian,
    );
    const toClosestOnSphereNormalize = Cartesian3.normalize(
      toClosestOnSphere,
      scratchCartesian,
    );
    tile._foveatedFactor =
      1.0 -
      Math.abs(Cartesian3.dot(camera.directionWC, toClosestOnSphereNormalize));
  } else {
    tile._foveatedFactor = 0.0;
  }

  // Skip this feature if: non-skipLevelOfDetail and replace refine, if the foveated settings are turned off, if tile is progressive resolution and replace refine and skipLevelOfDetail (will help get rid of ancestor artifacts faster)
  // Or if the tile is a preload of any kind
  const replace = tile.refine === Cesium3DTileRefine.REPLACE;
  const skipLevelOfDetail = tileset.isSkippingLevelOfDetail;
  if (
    (replace && !skipLevelOfDetail) ||
    !tileset.foveatedScreenSpaceError ||
    tileset.foveatedConeSize === 1.0 ||
    (tile._priorityProgressiveResolution && replace && skipLevelOfDetail) ||
    tileset._pass === Cesium3DTilePass.PRELOAD_FLIGHT ||
    tileset._pass === Cesium3DTilePass.PRELOAD
  ) {
    return false;
  }

  const maximumFovatedFactor = 1.0 - Math.cos(camera.frustum.fov * 0.5); // 0.14 for fov = 60. NOTE very hard to defer vertically foveated tiles since max is based on fovy (which is fov). Lowering the 0.5 to a smaller fraction of the screen height will start to defer vertically foveated tiles.
  const foveatedConeFactor = tileset.foveatedConeSize * maximumFovatedFactor;

  // If it's inside the user-defined view cone, then it should not be deferred.
  if (tile._foveatedFactor <= foveatedConeFactor) {
    return false;
  }

  // Relax SSE based on how big the angle is between the tile and the edge of the foveated cone.
  const range = maximumFovatedFactor - foveatedConeFactor;
  const normalizedFoveatedFactor = CesiumMath.clamp(
    (tile._foveatedFactor - foveatedConeFactor) / range,
    0.0,
    1.0,
  );
  const sseRelaxation = tileset.foveatedInterpolationCallback(
    tileset.foveatedMinimumScreenSpaceErrorRelaxation,
    tileset.memoryAdjustedScreenSpaceError,
    normalizedFoveatedFactor,
  );
  const sse =
    tile._screenSpaceError === 0.0 && defined(tile.parent)
      ? tile.parent._screenSpaceError * 0.5
      : tile._screenSpaceError;

  return tileset.memoryAdjustedScreenSpaceError - sseRelaxation <= sse;
}

const scratchJulianDate = new JulianDate();

/**
 * 获取瓷砖的屏幕空间误差。
 *
 * @private
 * @param {FrameState} frameState
 * @param {Boolean} useParentGeometricError
 * @param {number} progressiveResolutionHeightFraction
 */

Cesium3DTile.prototype.getScreenSpaceError = function (
  frameState,
  useParentGeometricError,
  progressiveResolutionHeightFraction,
) {
  const tileset = this._tileset;
  const heightFraction = defaultValue(progressiveResolutionHeightFraction, 1.0);
  const parentGeometricError = defined(this.parent)
    ? this.parent.geometricError
    : tileset._scaledGeometricError;
  const geometricError = useParentGeometricError
    ? parentGeometricError
    : this.geometricError;
  if (geometricError === 0.0) {
    // Leaf tiles do not have any error so save the computation
    return 0.0;
  }
  const { camera, context } = frameState;
  let frustum = camera.frustum;
  const width = context.drawingBufferWidth;
  const height = context.drawingBufferHeight * heightFraction;
  let error;
  if (
    frameState.mode === SceneMode.SCENE2D ||
    frustum instanceof OrthographicFrustum
  ) {
    const offCenterFrustum = frustum.offCenterFrustum;
    if (defined(offCenterFrustum)) {
      frustum = offCenterFrustum;
    }
    const pixelSize =
      Math.max(frustum.top - frustum.bottom, frustum.right - frustum.left) /
      Math.max(width, height);
    error = geometricError / pixelSize;
  } else {
    // Avoid divide by zero when viewer is inside the tile
    const distance = Math.max(this._distanceToCamera, CesiumMath.EPSILON7);
    const sseDenominator = frustum.sseDenominator;
    error = (geometricError * height) / (distance * sseDenominator);
    if (tileset.dynamicScreenSpaceError) {
      const density = tileset._dynamicScreenSpaceErrorComputedDensity;
      const factor = tileset.dynamicScreenSpaceErrorFactor;
      const dynamicError = CesiumMath.fog(distance, density) * factor;
      error -= dynamicError;
    }
  }

  error /= frameState.pixelRatio;

  return error;
};

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 * @returns {Boolean}
 */
function isPriorityProgressiveResolution(tileset, tile) {
  if (
    tileset.progressiveResolutionHeightFraction <= 0.0 ||
    tileset.progressiveResolutionHeightFraction > 0.5
  ) {
    return false;
  }

  const maximumScreenSpaceError = tileset.memoryAdjustedScreenSpaceError;
  let isProgressiveResolutionTile =
    tile._screenSpaceErrorProgressiveResolution > maximumScreenSpaceError; // Mark non-SSE leaves
  tile._priorityProgressiveResolutionScreenSpaceErrorLeaf = false; // Needed for skipLOD
  const parent = tile.parent;
  const tilePasses =
    tile._screenSpaceErrorProgressiveResolution <= maximumScreenSpaceError;
  const parentFails =
    defined(parent) &&
    parent._screenSpaceErrorProgressiveResolution > maximumScreenSpaceError;
  if (tilePasses && parentFails) {
    // A progressive resolution SSE leaf, promote its priority as well
    tile._priorityProgressiveResolutionScreenSpaceErrorLeaf = true;
    isProgressiveResolutionTile = true;
  }
  return isProgressiveResolutionTile;
}

/**
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {Cesium3DTile} tile
 * @returns {number}
 */
function getPriorityReverseScreenSpaceError(tileset, tile) {
  const parent = tile.parent;
  const useParentScreenSpaceError =
    defined(parent) &&
    (!tileset.isSkippingLevelOfDetail ||
      tile._screenSpaceError === 0.0 ||
      parent.hasTilesetContent ||
      parent.hasImplicitContent);
  const screenSpaceError = useParentScreenSpaceError
    ? parent._screenSpaceError
    : tile._screenSpaceError;
  return tileset.root._screenSpaceError - screenSpaceError;
}

/**
 * 更新瓷砖的可见性。
 *
 * @private
 * @param {FrameState} frameState
 */

Cesium3DTile.prototype.updateVisibility = function (frameState) {
  const { parent, tileset } = this;
  if (this._updatedVisibilityFrame === tileset._updatedVisibilityFrame) {
    // The tile has already been updated for this frame
    return;
  }

  const parentTransform = defined(parent)
    ? parent.computedTransform
    : tileset.modelMatrix;
  const parentVisibilityPlaneMask = defined(parent)
    ? parent._visibilityPlaneMask
    : CullingVolume.MASK_INDETERMINATE;
  this.updateTransform(parentTransform, frameState);
  this._distanceToCamera = this.distanceToTile(frameState);
  this._centerZDepth = this.distanceToTileCenter(frameState);
  this._screenSpaceError = this.getScreenSpaceError(frameState, false);
  this._screenSpaceErrorProgressiveResolution = this.getScreenSpaceError(
    frameState,
    false,
    tileset.progressiveResolutionHeightFraction,
  );
  this._visibilityPlaneMask = this.visibility(
    frameState,
    parentVisibilityPlaneMask,
  ); // Use parent's plane mask to speed up visibility test
  this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
  this._inRequestVolume = this.insideViewerRequestVolume(frameState);
  this._priorityReverseScreenSpaceError = getPriorityReverseScreenSpaceError(
    tileset,
    this,
  );
  this._priorityProgressiveResolution = isPriorityProgressiveResolution(
    tileset,
    this,
  );
  this.priorityDeferred = isPriorityDeferred(this, frameState);

  this._updatedVisibilityFrame = tileset._updatedVisibilityFrame;
};

/**
 * 更新瓷砖是否已过期。
 *
 * @private
 */

Cesium3DTile.prototype.updateExpiration = function () {
  if (
    defined(this.expireDate) &&
    this.contentReady &&
    !this.hasEmptyContent &&
    !this.hasMultipleContents
  ) {
    const now = JulianDate.now(scratchJulianDate);
    if (JulianDate.lessThan(this.expireDate, now)) {
      this._contentState = Cesium3DTileContentState.EXPIRED;
      this._expiredContent = this._content;
    }
  }
};

/**
 * @private
 * @param {Cesium3DTile} tile
 */
function updateExpireDate(tile) {
  if (!defined(tile.expireDuration)) {
    return;
  }
  const expireDurationDate = JulianDate.now(scratchJulianDate);
  JulianDate.addSeconds(
    expireDurationDate,
    tile.expireDuration,
    expireDurationDate,
  );

  if (defined(tile.expireDate)) {
    if (JulianDate.lessThan(tile.expireDate, expireDurationDate)) {
      JulianDate.clone(expireDurationDate, tile.expireDate);
    }
  } else {
    tile.expireDate = JulianDate.clone(expireDurationDate);
  }
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @returns {Function}
 */
function createPriorityFunction(tile) {
  return function () {
    return tile._priority;
  };
}

/**
 * 请求瓷砖的内容。
 * <p>
 * 如果 Cesium 请求调度程序无法优先处理该请求，则可能不会发出请求。
 * </p>
 *
 * @return {Promise<Cesium3DTileContent>|undefined} 当请求完成时解析的承诺，如果不需要请求或请求无法调度，则返回 undefined。
 * @private
 */

Cesium3DTile.prototype.requestContent = function () {
  // empty contents don't require any HTTP requests
  if (this.hasEmptyContent) {
    return;
  }

  if (this.hasMultipleContents) {
    return requestMultipleContents(this);
  }

  return requestSingleContent(this);
};

/**
 * 在单个瓷砖中允许多个 {@link Cesium3DTileContent}，可以通过
 * 瓷砖 JSON（3D Tiles 1.1）或 <code>3DTILES_multiple_contents</code> 扩展实现。
 * 由于请求调度的差异，这会单独处理。
 * <p>
 * 这种多个内容的实现不支持瓷砖过期，像 requestSingleContent 一样。如果有变化，
 * 请注意 resource.setQueryParameters() 的细节必须放入 {@link Multiple3DTileContent} 中，
 * 因为这是每个请求的。
 * </p>
 *
 * @private
 * @param {Cesium3DTile} tile
 * @returns {Promise<Cesium3DTileContent>|Promise<undefined>|undefined} 一个承诺，当加载完成时解析为瓷砖内容，
 *         或一个承诺，当请求在进行中被取消时解析为 undefined，或者如果请求无法在此帧调度，返回 undefined。
 */

function requestMultipleContents(tile) {
  let multipleContents = tile._content;
  const tileset = tile._tileset;

  if (!defined(multipleContents)) {
    // Create the content object immediately, it will handle scheduling
    // requests for inner contents.
    const contentsJson = hasExtension(tile._header, "3DTILES_multiple_contents")
      ? tile._header.extensions["3DTILES_multiple_contents"]
      : tile._header;

    multipleContents = new Multiple3DTileContent(
      tileset,
      tile,
      tile._contentResource.clone(),
      contentsJson,
    );
    tile._content = multipleContents;
  }

  const promise = multipleContents.requestInnerContents();

  if (!defined(promise)) {
    // Request could not all be scheduled this frame
    return;
  }

  tile._contentState = Cesium3DTileContentState.LOADING;
  return promise
    .then((content) => {
      if (tile.isDestroyed()) {
        // Tile is unloaded before the content can process
        return;
      }

      // Tile was canceled, try again later
      if (!defined(content)) {
        return;
      }

      tile._contentState = Cesium3DTileContentState.PROCESSING;
      return multipleContents;
    })
    .catch((error) => {
      if (tile.isDestroyed()) {
        // Tile is unloaded before the content can process
        return;
      }

      tile._contentState = Cesium3DTileContentState.FAILED;
      throw error;
    });
}

async function processArrayBuffer(
  tile,
  tileset,
  request,
  expired,
  requestPromise,
) {
  const previousState = tile._contentState;
  tile._contentState = Cesium3DTileContentState.LOADING;
  ++tileset.statistics.numberOfPendingRequests;

  let arrayBuffer;
  try {
    arrayBuffer = await requestPromise;
  } catch (error) {
    --tileset.statistics.numberOfPendingRequests;
    if (tile.isDestroyed()) {
      // Tile is unloaded before the content can process
      return;
    }

    if (request.cancelled || request.state === RequestState.CANCELLED) {
      // Cancelled due to low priority - try again later.
      tile._contentState = previousState;
      ++tileset.statistics.numberOfAttemptedRequests;
      return;
    }

    tile._contentState = Cesium3DTileContentState.FAILED;
    throw error;
  }

  if (tile.isDestroyed()) {
    --tileset.statistics.numberOfPendingRequests;
    // Tile is unloaded before the content can process
    return;
  }

  if (request.cancelled || request.state === RequestState.CANCELLED) {
    // Cancelled due to low priority - try again later.
    tile._contentState = previousState;
    --tileset.statistics.numberOfPendingRequests;
    ++tileset.statistics.numberOfAttemptedRequests;
    return;
  }

  try {
    const content = await makeContent(tile, arrayBuffer);
    --tileset.statistics.numberOfPendingRequests;

    if (tile.isDestroyed()) {
      // Tile is unloaded before the content can process
      return;
    }

    if (expired) {
      tile.expireDate = undefined;
    }

    tile._content = content;
    tile._contentState = Cesium3DTileContentState.PROCESSING;

    return content;
  } catch (error) {
    --tileset.statistics.numberOfPendingRequests;
    if (tile.isDestroyed()) {
      // Tile is unloaded before the content can process
      return;
    }

    tile._contentState = Cesium3DTileContentState.FAILED;
    throw error;
  }
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @returns {Promise<Cesium3DTileContent>|Promise<undefined>|undefined} 一个承诺，当加载完成时解析为瓷砖内容；如果在处理发生之前瓷砖被销毁或请求在进行中被取消，则返回一个解析为 undefined 的承诺；如果请求无法在此帧调度，则返回 undefined。
 */

function requestSingleContent(tile) {
  // it is important to clone here. The fetchArrayBuffer() below uses
  // throttling, but other uses of the resources do not.
  const resource = tile._contentResource.clone();
  const expired = tile.contentExpired;
  if (expired) {
    // Append a query parameter of the tile expiration date to prevent caching
    resource.setQueryParameters({
      expired: tile.expireDate.toString(),
    });
  }

  const request = new Request({
    throttle: true,
    throttleByServer: true,
    type: RequestType.TILES3D,
    priorityFunction: createPriorityFunction(tile),
    serverKey: tile._serverKey,
  });

  tile._request = request;
  resource.request = request;
  const tileset = tile._tileset;
  const promise = resource.fetchArrayBuffer();
  if (!defined(promise)) {
    ++tileset.statistics.numberOfAttemptedRequests;
    return;
  }

  return processArrayBuffer(tile, tileset, request, expired, promise);
}

/**
 * 给定下载的内容有效负载，构造一个 {@link Cesium3DTileContent}。
 * <p>
 * 这仅用于单个内容。
 * </p>
 *
 * @param {Cesium3DTile} tile 瓷砖
 * @param {ArrayBuffer} arrayBuffer 包含内容数据的下载有效负载
 * @return {Promise<Cesium3DTileContent>} 一个内容对象
 * @private
 */

async function makeContent(tile, arrayBuffer) {
  const preprocessed = preprocess3DTileContent(arrayBuffer);

  // Vector and Geometry tile rendering do not support the skip LOD optimization.
  const tileset = tile._tileset;
  tileset._disableSkipLevelOfDetail =
    tileset._disableSkipLevelOfDetail ||
    preprocessed.contentType === Cesium3DTileContentType.GEOMETRY ||
    preprocessed.contentType === Cesium3DTileContentType.VECTOR;

  if (
    preprocessed.contentType === Cesium3DTileContentType.IMPLICIT_SUBTREE ||
    preprocessed.contentType === Cesium3DTileContentType.IMPLICIT_SUBTREE_JSON
  ) {
    tile.hasImplicitContent = true;
  }

  if (preprocessed.contentType === Cesium3DTileContentType.EXTERNAL_TILESET) {
    tile.hasTilesetContent = true;
  }

  let content;
  const contentFactory = Cesium3DTileContentFactory[preprocessed.contentType];
  if (tile.isDestroyed()) {
    return;
  }

  if (defined(preprocessed.binaryPayload)) {
    content = await Promise.resolve(
      contentFactory(
        tileset,
        tile,
        tile._contentResource,
        preprocessed.binaryPayload.buffer,
        0,
      ),
    );
  } else {
    // JSON formats
    content = await Promise.resolve(
      contentFactory(
        tileset,
        tile,
        tile._contentResource,
        preprocessed.jsonPayload,
      ),
    );
  }

  const contentHeader = tile._contentHeader;

  if (tile.hasImplicitContentMetadata) {
    const subtree = tile.implicitSubtree;
    const coordinates = tile.implicitCoordinates;
    content.metadata = subtree.getContentMetadataView(coordinates, 0);
  } else if (!tile.hasImplicitContent) {
    content.metadata = findContentMetadata(tileset, contentHeader);
  }

  const groupMetadata = findGroupMetadata(tileset, contentHeader);
  if (defined(groupMetadata)) {
    content.group = new Cesium3DContentGroup({
      metadata: groupMetadata,
    });
  }

  return content;
}

/**
 * 取消对瓷砖内容的请求。当瓷砖超出视野时会调用此函数。
 *
 * @private
 */

Cesium3DTile.prototype.cancelRequests = function () {
  if (this.hasMultipleContents) {
    this._content.cancelRequests();
  } else {
    this._request.cancel();
  }
};

/**
 * 卸载瓷砖的内容。
 *
 * @private
 */

Cesium3DTile.prototype.unloadContent = function () {
  if (!this.hasRenderableContent) {
    return;
  }

  this._content = this._content && this._content.destroy();
  this._contentState = Cesium3DTileContentState.UNLOADED;

  this.lastStyleTime = 0.0;
  this.clippingPlanesDirty = this._clippingPlanesState === 0;
  this._clippingPlanesState = 0;
  this.clippingPolygonsDirty = this._clippingPolygonsState === 0;
  this._clippingPolygonsState = 0;

  this._debugColorizeTiles = false;

  this._debugBoundingVolume =
    this._debugBoundingVolume && this._debugBoundingVolume.destroy();
  this._debugContentBoundingVolume =
    this._debugContentBoundingVolume &&
    this._debugContentBoundingVolume.destroy();
  this._debugViewerRequestVolume =
    this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
};

const scratchProjectedBoundingSphere = new BoundingSphere();

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {FrameState} frameState
 * @returns {TileBoundingVolume}
 */
function getBoundingVolume(tile, frameState) {
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    !defined(tile._boundingVolume2D)
  ) {
    const boundingSphere = tile._boundingVolume.boundingSphere;
    const sphere = BoundingSphere.projectTo2D(
      boundingSphere,
      frameState.mapProjection,
      scratchProjectedBoundingSphere,
    );
    tile._boundingVolume2D = new TileBoundingSphere(
      sphere.center,
      sphere.radius,
    );
  }

  return frameState.mode !== SceneMode.SCENE3D
    ? tile._boundingVolume2D
    : tile._boundingVolume;
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {FrameState} frameState
 * @returns {TileBoundingVolume}
 */
function getContentBoundingVolume(tile, frameState) {
  if (
    frameState.mode !== SceneMode.SCENE3D &&
    !defined(tile._contentBoundingVolume2D)
  ) {
    const boundingSphere = tile._contentBoundingVolume.boundingSphere;
    const sphere = BoundingSphere.projectTo2D(
      boundingSphere,
      frameState.mapProjection,
      scratchProjectedBoundingSphere,
    );
    tile._contentBoundingVolume2D = new TileBoundingSphere(
      sphere.center,
      sphere.radius,
    );
  }
  return frameState.mode !== SceneMode.SCENE3D
    ? tile._contentBoundingVolume2D
    : tile._contentBoundingVolume;
}

/**
 * 确定瓦片的边界体积是否与剔除体积相交。
 *
 * @param {FrameState} frameState 帧状态。
 * @param {number} parentVisibilityPlaneMask 用于加速可见性检查的父级平面掩码。
 * @returns {number} 平面掩码，如 {@link CullingVolume#computeVisibilityWithPlaneMask} 中所述。
 *
 * @private
 */
Cesium3DTile.prototype.visibility = function (
  frameState,
  parentVisibilityPlaneMask,
) {
  const cullingVolume = frameState.cullingVolume;
  const boundingVolume = getBoundingVolume(this, frameState);

  const tileset = this._tileset;
  const clippingPlanes = tileset.clippingPlanes;
  if (defined(clippingPlanes) && clippingPlanes.enabled) {
    const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
      boundingVolume,
      tileset.clippingPlanesOriginMatrix,
    );
    this._isClipped = intersection !== Intersect.INSIDE;
    if (intersection === Intersect.OUTSIDE) {
      return CullingVolume.MASK_OUTSIDE;
    }
  }

  const clippingPolygons = tileset.clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    const intersection =
      clippingPolygons.computeIntersectionWithBoundingVolume(boundingVolume);

    this._isClippedByPolygon = intersection !== Intersect.OUTSIDE;
    // Polygon clipping intersections are determined by outer rectangles, therefore we cannot
    // preemptively determine if a tile is completely clipped or not here.
  }

  return cullingVolume.computeVisibilityWithPlaneMask(
    boundingVolume,
    parentVisibilityPlaneMask,
  );
};

/**
 * 假设瓦片的边界体积与剔除体积相交，确定
 * 瓦片内容的边界体积是否与剔除体积相交。
 *
 * @param {FrameState} frameState 帧状态。
 * @returns {Intersect} 相交的结果：瓦片内容完全在外部、完全在内部或与剔除体积相交。
 *
 * @private
 */
Cesium3DTile.prototype.contentVisibility = function (frameState) {
  // Assumes the tile's bounding volume intersects the culling volume already, so
  // just return Intersect.INSIDE if there is no content bounding volume.
  if (!defined(this._contentBoundingVolume)) {
    return Intersect.INSIDE;
  }

  if (this._visibilityPlaneMask === CullingVolume.MASK_INSIDE) {
    // The tile's bounding volume is completely inside the culling volume so
    // the content bounding volume must also be inside.
    return Intersect.INSIDE;
  }

  // PERFORMANCE_IDEA: is it possible to burn less CPU on this test since we know the
  // tile's (not the content's) bounding volume intersects the culling volume?
  const cullingVolume = frameState.cullingVolume;
  const boundingVolume = getContentBoundingVolume(this, frameState);

  const tileset = this._tileset;
  const clippingPlanes = tileset.clippingPlanes;
  if (defined(clippingPlanes) && clippingPlanes.enabled) {
    const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
      boundingVolume,
      tileset.clippingPlanesOriginMatrix,
    );
    this._isClipped = intersection !== Intersect.INSIDE;
    if (intersection === Intersect.OUTSIDE) {
      return Intersect.OUTSIDE;
    }
  }

  const clippingPolygons = tileset.clippingPolygons;
  if (defined(clippingPolygons) && clippingPolygons.enabled) {
    const intersection =
      clippingPolygons.computeIntersectionWithBoundingVolume(boundingVolume);
    this._isClippedByPolygon = intersection !== Intersect.OUTSIDE;
    if (intersection === Intersect.INSIDE) {
      return Intersect.OUTSIDE;
    }
  }

  return cullingVolume.computeVisibility(boundingVolume);
};

/**
 * 计算瓦片边界体积的最近点到相机的（可能是近似的）距离。
 *
 * @param {FrameState} frameState 帧状态。
 * @returns {number} 距离，单位为米；如果相机在边界体积内，则返回零。
 *
 * @private
 */
Cesium3DTile.prototype.distanceToTile = function (frameState) {
  const boundingVolume = getBoundingVolume(this, frameState);
  return boundingVolume.distanceToCamera(frameState);
};

const scratchToTileCenter = new Cartesian3();

/**
 * 计算瓦片边界体积中心到相机由其位置和视向定义的平面的距离。
 *
 * @param {FrameState} frameState 帧状态。
 * @returns {number} 距离，单位为米。
 *
 * @private
 */
Cesium3DTile.prototype.distanceToTileCenter = function (frameState) {
  const tileBoundingVolume = getBoundingVolume(this, frameState);
  const boundingVolume = tileBoundingVolume.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
  const toCenter = Cartesian3.subtract(
    boundingVolume.center,
    frameState.camera.positionWC,
    scratchToTileCenter,
  );
  return Cartesian3.dot(frameState.camera.directionWC, toCenter);
};

/**
 * 检查相机是否在视图请求体积内。
 *
 * @param {FrameState} frameState 帧状态。
 * @returns {boolean} 相机是否在体积内。
 *
 * @private
 */
Cesium3DTile.prototype.insideViewerRequestVolume = function (frameState) {
  const viewerRequestVolume = this._viewerRequestVolume;
  return (
    !defined(viewerRequestVolume) ||
    viewerRequestVolume.distanceToCamera(frameState) === 0.0
  );
};

const scratchMatrix = new Matrix3();
const scratchScale = new Cartesian3();
const scratchHalfAxes = new Matrix3();
const scratchCenter = new Cartesian3();
const scratchRectangle = new Rectangle();
const scratchOrientedBoundingBox = new OrientedBoundingBox();
const scratchTransform = new Matrix4();

/**
 * @private
 * @param {Array} box 一个包含 12 个数字的数组，用于定义一个定向边界框
 * @param {Matrix4} transform
 * @param {TileBoundingVolume} [result]
 * @returns {TileOrientedBoundingBox}
 */
function createBox(box, transform, result) {
  let center = Cartesian3.fromElements(box[0], box[1], box[2], scratchCenter);
  let halfAxes = Matrix3.fromArray(box, 3, scratchHalfAxes);

  // Find the transformed center and halfAxes
  center = Matrix4.multiplyByPoint(transform, center, center);
  const rotationScale = Matrix4.getMatrix3(transform, scratchMatrix);
  halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

  if (defined(result)) {
    result.update(center, halfAxes);
    return result;
  }
  return new TileOrientedBoundingBox(center, halfAxes);
}

/**
 * @private
 * @param {Array} region 一个包含六个数字的数组，定义了EPSG:4979坐标系中的边界地理区域，顺序为 [西, 南, 东, 北, 最低高度, 最高高度]
 * @param {Matrix4} transform
 * @param {Matrix4} initialTransform
 * @param {TileOrientedBoundingBox} [result]
 * @returns {TileOrientedBoundingBox}
 */

function createBoxFromTransformedRegion(
  region,
  transform,
  initialTransform,
  result,
) {
  const rectangle = Rectangle.unpack(region, 0, scratchRectangle);
  const minimumHeight = region[4];
  const maximumHeight = region[5];

  const orientedBoundingBox = OrientedBoundingBox.fromRectangle(
    rectangle,
    minimumHeight,
    maximumHeight,
    Ellipsoid.WGS84,
    scratchOrientedBoundingBox,
  );
  let center = orientedBoundingBox.center;
  let halfAxes = orientedBoundingBox.halfAxes;

  // A region bounding volume is not transformed by the transform in the tileset JSON,
  // but may be transformed by additional transforms applied in Cesium.
  // This is why the transform is calculated as the difference between the initial transform and the current transform.
  transform = Matrix4.multiplyTransformation(
    transform,
    Matrix4.inverseTransformation(initialTransform, scratchTransform),
    scratchTransform,
  );
  center = Matrix4.multiplyByPoint(transform, center, center);
  const rotationScale = Matrix4.getMatrix3(transform, scratchMatrix);
  halfAxes = Matrix3.multiply(rotationScale, halfAxes, halfAxes);

  if (defined(result) && result instanceof TileOrientedBoundingBox) {
    result.update(center, halfAxes);
    return result;
  }

  return new TileOrientedBoundingBox(center, halfAxes);
}

/**
 * @private
 * @param {Array} region 一个包含六个数字的数组，定义了EPSG:4979坐标系中的边界地理区域，顺序为 [西, 南, 东, 北, 最低高度, 最高高度]
 * @param {Matrix4} transform
 * @param {Matrix4} initialTransform
 * @param {TileBoundingVolume} [result]
 * @returns {TileBoundingVolume}
 */

function createRegion(region, transform, initialTransform, result) {
  if (
    !Matrix4.equalsEpsilon(transform, initialTransform, CesiumMath.EPSILON8)
  ) {
    return createBoxFromTransformedRegion(
      region,
      transform,
      initialTransform,
      result,
    );
  }

  const rectangleRegion = Rectangle.unpack(region, 0, scratchRectangle);

  if (defined(result)) {
    result.rectangle = Rectangle.clone(rectangleRegion, result.rectangle);
    result.minimumHeight = region[4];
    result.maximumHeight = region[5];
    // The TileBoundingRegion was already constructed with the default
    // WGS84 ellipsoid, so keep it consistent when updating.
    result.computeBoundingVolumes(Ellipsoid.WGS84);
    return result;
  }

  return new TileBoundingRegion({
    rectangle: rectangleRegion,
    minimumHeight: region[4],
    maximumHeight: region[5],
  });
}

/**
 * @private
 * @param {Array} sphere 一个包含四个数字的数组，定义了一个边界球
 * @param {Matrix4} transform
 * @param {TileBoundingVolume} [result]
 * @returns {TileBoundingSphere}
 */

function createSphere(sphere, transform, result) {
  let center = Cartesian3.fromElements(
    sphere[0],
    sphere[1],
    sphere[2],
    scratchCenter,
  );
  let radius = sphere[3];

  // Find the transformed center and radius
  center = Matrix4.multiplyByPoint(transform, center, center);
  const scale = Matrix4.getScale(transform, scratchScale);
  const uniformScale = Cartesian3.maximumComponent(scale);
  radius *= uniformScale;

  if (defined(result)) {
    result.update(center, radius);
    return result;
  }
  return new TileBoundingSphere(center, radius);
}

/**
 * 从瓦片的边界体积头创建一个边界体积。
 *
 * @param {object} boundingVolumeHeader 瓦片的边界体积头。
 * @param {Matrix4} transform 要应用于边界体积的变换。
 * @param {TileBoundingVolume} [result] 存储结果的对象。
 *
 * @returns {TileBoundingVolume} 修改后的结果参数，如果没有提供则返回一个新的 TileBoundingVolume 实例。
 *
 * @private
 */

Cesium3DTile.prototype.createBoundingVolume = function (
  boundingVolumeHeader,
  transform,
  result,
) {
  // if explicit tile metadata includes TILE_BOUNDING_BOX, TILE_BOUNDING_REGION,
  // or TILE_BOUNDING_SPHERE, override tile.boundingVolume.
  const tileMetadata = this.metadata;
  let metadataBoundingVolumeHeader;
  if (defined(tileMetadata)) {
    metadataBoundingVolumeHeader =
      BoundingVolumeSemantics.parseBoundingVolumeSemantic("TILE", tileMetadata);
  }
  if (defined(metadataBoundingVolumeHeader)) {
    boundingVolumeHeader = metadataBoundingVolumeHeader;
  }

  if (!defined(boundingVolumeHeader)) {
    throw new RuntimeError("boundingVolume must be defined");
  }

  if (hasExtension(boundingVolumeHeader, "3DTILES_bounding_volume_S2")) {
    return new TileBoundingS2Cell(
      boundingVolumeHeader.extensions["3DTILES_bounding_volume_S2"],
    );
  }

  const { box, region, sphere } = boundingVolumeHeader;
  if (defined(box)) {
    const tileOrientedBoundingBox = createBox(box, transform, result);
    if (this._verticalExaggeration !== 1.0) {
      exaggerateBoundingBox(
        tileOrientedBoundingBox,
        this._verticalExaggeration,
        this._verticalExaggerationRelativeHeight,
      );
    }
    return tileOrientedBoundingBox;
  }
  if (defined(region)) {
    const tileBoundingVolume = createRegion(
      region,
      transform,
      this._initialTransform,
      result,
    );
    if (this._verticalExaggeration === 1.0) {
      return tileBoundingVolume;
    }
    if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
      exaggerateBoundingBox(
        tileBoundingVolume,
        this._verticalExaggeration,
        this._verticalExaggerationRelativeHeight,
      );
    } else {
      tileBoundingVolume.minimumHeight = VerticalExaggeration.getHeight(
        tileBoundingVolume.minimumHeight,
        this._verticalExaggeration,
        this._verticalExaggerationRelativeHeight,
      );
      tileBoundingVolume.maximumHeight = VerticalExaggeration.getHeight(
        tileBoundingVolume.maximumHeight,
        this._verticalExaggeration,
        this._verticalExaggerationRelativeHeight,
      );
      tileBoundingVolume.computeBoundingVolumes(Ellipsoid.WGS84);
    }
    return tileBoundingVolume;
  }
  if (defined(sphere)) {
    const tileBoundingSphere = createSphere(sphere, transform, result);
    if (this._verticalExaggeration !== 1.0) {
      const exaggeratedCenter = VerticalExaggeration.getPosition(
        tileBoundingSphere.center,
        Ellipsoid.WGS84,
        this._verticalExaggeration,
        this._verticalExaggerationRelativeHeight,
        scratchCenter,
      );
      const exaggeratedRadius =
        tileBoundingSphere.radius * this._verticalExaggeration;
      tileBoundingSphere.update(exaggeratedCenter, exaggeratedRadius);
    }
    return tileBoundingSphere;
  }
  throw new RuntimeError(
    "boundingVolume must contain a sphere, region, or box",
  );
};

const scratchExaggeratedCorners = Cartesian3.unpackArray(
  new Array(8 * 3).fill(0),
);

/**
 * 根据提供的夸张因子夸大瓦片的边界框。
 *
 * @private
 * @param {TileOrientedBoundingBox} tileOrientedBoundingBox - 瓦片的有向边界框。
 * @param {number} exaggeration - 应用于瓦片边界框的夸张因子。
 * @param {number} exaggerationRelativeHeight - 应用夸张的相对高度。
 */

function exaggerateBoundingBox(
  tileOrientedBoundingBox,
  exaggeration,
  exaggerationRelativeHeight,
) {
  const exaggeratedCorners = tileOrientedBoundingBox.boundingVolume
    .computeCorners(scratchExaggeratedCorners)
    .map((corner) =>
      VerticalExaggeration.getPosition(
        corner,
        Ellipsoid.WGS84,
        exaggeration,
        exaggerationRelativeHeight,
        corner,
      ),
    );
  const exaggeratedBox = OrientedBoundingBox.fromPoints(
    exaggeratedCorners,
    scratchOrientedBoundingBox,
  );
  tileOrientedBoundingBox.update(
    exaggeratedBox.center,
    exaggeratedBox.halfAxes,
  );
}

/**
 * 更新瓦片的变换。变换应用于瓦片的边界体积。
 *
 * @private
 * @param {Matrix4} parentTransform
 * @param {FrameState} [frameState]
 */

Cesium3DTile.prototype.updateTransform = function (
  parentTransform,
  frameState,
) {
  parentTransform = defaultValue(parentTransform, Matrix4.IDENTITY);
  const computedTransform = Matrix4.multiplyTransformation(
    parentTransform,
    this.transform,
    scratchTransform,
  );
  const transformChanged = !Matrix4.equals(
    computedTransform,
    this.computedTransform,
  );
  const exaggerationChanged =
    defined(frameState) &&
    (this._verticalExaggeration !== frameState.verticalExaggeration ||
      this._verticalExaggerationRelativeHeight !==
        frameState.verticalExaggerationRelativeHeight);

  if (!transformChanged && !exaggerationChanged) {
    return;
  }
  if (transformChanged) {
    Matrix4.clone(computedTransform, this.computedTransform);
  }
  if (exaggerationChanged) {
    this._verticalExaggeration = frameState.verticalExaggeration;
    this._verticalExaggerationRelativeHeight =
      frameState.verticalExaggerationRelativeHeight;
  }

  // Update the bounding volumes
  const header = this._header;
  const contentHeader = this._contentHeader;
  this._boundingVolume = this.createBoundingVolume(
    header.boundingVolume,
    this.computedTransform,
    this._boundingVolume,
  );
  if (defined(this._contentBoundingVolume)) {
    this._contentBoundingVolume = this.createBoundingVolume(
      contentHeader.boundingVolume,
      this.computedTransform,
      this._contentBoundingVolume,
    );
  }
  if (defined(this._viewerRequestVolume)) {
    this._viewerRequestVolume = this.createBoundingVolume(
      header.viewerRequestVolume,
      this.computedTransform,
      this._viewerRequestVolume,
    );
  }

  this.updateGeometricErrorScale();

  // Destroy the debug bounding volumes. They will be generated fresh.
  this._debugBoundingVolume =
    this._debugBoundingVolume && this._debugBoundingVolume.destroy();
  this._debugContentBoundingVolume =
    this._debugContentBoundingVolume &&
    this._debugContentBoundingVolume.destroy();
  this._debugViewerRequestVolume =
    this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
};

Cesium3DTile.prototype.updateGeometricErrorScale = function () {
  const scale = Matrix4.getScale(this.computedTransform, scratchScale);
  const uniformScale = Cartesian3.maximumComponent(scale);
  this.geometricError = this._geometricError * uniformScale;

  if (!defined(this.parent)) {
    // Update the tileset's geometric error
    const tileset = this._tileset;
    tileset._scaledGeometricError = tileset._geometricError * uniformScale;
  }
};

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {object} passOptions
 */
function applyDebugSettings(tile, tileset, frameState, passOptions) {
  if (!passOptions.isRender) {
    return;
  }

  const hasContentBoundingVolume =
    defined(tile._contentHeader) && defined(tile._contentHeader.boundingVolume);

  const showVolume =
    tileset.debugShowBoundingVolume ||
    (tileset.debugShowContentBoundingVolume && !hasContentBoundingVolume);
  if (showVolume) {
    let color;
    if (!tile._finalResolution) {
      color = Color.YELLOW;
    } else if (!tile.hasRenderableContent) {
      color = Color.DARKGRAY;
    } else {
      color = Color.WHITE;
    }
    if (!defined(tile._debugBoundingVolume)) {
      tile._debugBoundingVolume = tile._boundingVolume.createDebugVolume(color);
    }
    tile._debugBoundingVolume.update(frameState);
    const attributes =
      tile._debugBoundingVolume.getGeometryInstanceAttributes("outline");
    attributes.color = ColorGeometryInstanceAttribute.toValue(
      color,
      attributes.color,
    );
  } else if (!showVolume && defined(tile._debugBoundingVolume)) {
    tile._debugBoundingVolume = tile._debugBoundingVolume.destroy();
  }

  if (tileset.debugShowContentBoundingVolume && hasContentBoundingVolume) {
    if (!defined(tile._debugContentBoundingVolume)) {
      tile._debugContentBoundingVolume =
        tile._contentBoundingVolume.createDebugVolume(Color.BLUE);
    }
    tile._debugContentBoundingVolume.update(frameState);
  } else if (
    !tileset.debugShowContentBoundingVolume &&
    defined(tile._debugContentBoundingVolume)
  ) {
    tile._debugContentBoundingVolume =
      tile._debugContentBoundingVolume.destroy();
  }

  if (
    tileset.debugShowViewerRequestVolume &&
    defined(tile._viewerRequestVolume)
  ) {
    if (!defined(tile._debugViewerRequestVolume)) {
      tile._debugViewerRequestVolume =
        tile._viewerRequestVolume.createDebugVolume(Color.YELLOW);
    }
    tile._debugViewerRequestVolume.update(frameState);
  } else if (
    !tileset.debugShowViewerRequestVolume &&
    defined(tile._debugViewerRequestVolume)
  ) {
    tile._debugViewerRequestVolume = tile._debugViewerRequestVolume.destroy();
  }

  const debugColorizeTilesOn =
    (tileset.debugColorizeTiles && !tile._debugColorizeTiles) ||
    defined(tileset._heatmap.tilePropertyName);
  const debugColorizeTilesOff =
    !tileset.debugColorizeTiles && tile._debugColorizeTiles;

  if (debugColorizeTilesOn) {
    tileset._heatmap.colorize(tile, frameState); // Skipped if tileset._heatmap.tilePropertyName is undefined
    tile._debugColorizeTiles = true;
    tile.color = tile._debugColor;
  } else if (debugColorizeTilesOff) {
    tile._debugColorizeTiles = false;
    tile.color = Color.WHITE;
  }

  if (tile._colorDirty) {
    tile._colorDirty = false;
    tile._content.applyDebugSettings(true, tile._color);
  }

  if (debugColorizeTilesOff) {
    tileset.makeStyleDirty(); // Re-apply style now that colorize is switched off
  }
}

/**
 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 */
function updateContent(tile, tileset, frameState) {
  const expiredContent = tile._expiredContent;

  // expired content is not supported for multiple contents
  if (!tile.hasMultipleContents && defined(expiredContent)) {
    if (!tile.contentReady) {
      // Render the expired content while the content loads
      try {
        expiredContent.update(tileset, frameState);
      } catch (error) {
        // Eat error for expired content
      }
      return;
    }

    // New content is ready, destroy expired content
    tile._expiredContent.destroy();
    tile._expiredContent = undefined;
  }

  if (!defined(tile.content)) {
    // Implicit placeholder tile
    return;
  }

  try {
    tile.content.update(tileset, frameState);
  } catch (error) {
    tile._contentState = Cesium3DTileContentState.FAILED;
    throw error;
  }
}

/**
 * 计算并比较裁剪平面状态：
 *  - 启用状态 - 裁剪平面是否启用？这个瓦片被裁剪了吗？
 *  - 裁剪平面数量
 *  - 裁剪函数（并集与交集）

 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 */

function updateClippingPlanes(tile, tileset) {
  const clippingPlanes = tileset.clippingPlanes;
  let currentClippingPlanesState = 0;
  if (defined(clippingPlanes) && tile._isClipped && clippingPlanes.enabled) {
    currentClippingPlanesState = clippingPlanes.clippingPlanesState;
  }
  // If clippingPlaneState for tile changed, mark clippingPlanesDirty so content can update
  if (currentClippingPlanesState !== tile._clippingPlanesState) {
    tile._clippingPlanesState = currentClippingPlanesState;
    tile.clippingPlanesDirty = true;
  }
}

/**
 * 计算并比较裁剪多边形状态：
 *  - 启用状态 - 裁剪多边形是否启用？这个瓦片被裁剪了吗？
 *  - 裁剪多边形数量和位置数量
 *  - 裁剪函数（反向）

 * @private
 * @param {Cesium3DTile} tile
 * @param {Cesium3DTileset} tileset
 */

function updateClippingPolygons(tile, tileset) {
  const clippingPolygons = tileset.clippingPolygons;
  let currentClippingPolygonsState = 0;
  if (
    defined(clippingPolygons) &&
    tile._isClippedByPolygon &&
    clippingPolygons.enabled
  ) {
    currentClippingPolygonsState = clippingPolygons.clippingPolygonsState;
  }
  // If clippingPolygonState for tile changed, mark clippingPolygonsDirty so content can update
  if (currentClippingPolygonsState !== tile._clippingPolygonsState) {
    tile._clippingPolygonsState = currentClippingPolygonsState;
    tile.clippingPolygonsDirty = true;
  }
}

/**
 * 获取渲染此瓦片所需的绘制命令。
 *
 * @private
 * @param {Cesium3DTileset} tileset
 * @param {FrameState} frameState
 * @param {object} passOptions
 */

Cesium3DTile.prototype.update = function (tileset, frameState, passOptions) {
  const { commandList } = frameState;
  const commandStart = commandList.length;

  updateClippingPlanes(this, tileset);
  updateClippingPolygons(this, tileset);
  applyDebugSettings(this, tileset, frameState, passOptions);
  updateContent(this, tileset, frameState);

  const commandEnd = commandList.length;
  this._commandsLength = commandEnd - commandStart;

  for (let i = commandStart; i < commandEnd; ++i) {
    const command = commandList[i];
    const translucent = command.pass === Pass.TRANSLUCENT;
    command.depthForTranslucentClassification = translucent;
  }

  this.clippingPlanesDirty = false; // reset after content update
  this.clippingPolygonsDirty = false;
};

const scratchCommandList = [];

/**
 * 处理瓦片的内容，例如创建WebGL资源，以便从处理状态移动到就绪状态。
 *
 * @param {Cesium3DTileset} tileset 包含此瓦片的瓦片集。
 * @param {FrameState} frameState 帧状态。
 *
 * @private
 */

Cesium3DTile.prototype.process = function (tileset, frameState) {
  if (!this.contentExpired && !this.contentReady && this._content.ready) {
    updateExpireDate(this);

    // Refresh style for expired content
    this._selectedFrame = 0;
    this.lastStyleTime = 0.0;

    JulianDate.now(this._loadTimestamp);
    this._contentState = Cesium3DTileContentState.READY;

    if (!this.hasTilesetContent && !this.hasImplicitContent) {
      // RESEARCH_IDEA: ability to unload tiles (without content) for an
      // external tileset when all the tiles are unloaded.
      tileset._statistics.incrementLoadCounts(this.content);
      ++tileset._statistics.numberOfTilesWithContentReady;
      ++tileset._statistics.numberOfLoadedTilesTotal;

      // Add to the tile cache. Previously expired tiles are already in the cache and won't get re-added.
      tileset._cache.add(this);
    }
  }

  const savedCommandList = frameState.commandList;
  frameState.commandList = scratchCommandList;

  try {
    this._content.update(tileset, frameState);
  } catch (error) {
    this._contentState = Cesium3DTileContentState.FAILED;
    throw error;
  }

  scratchCommandList.length = 0;
  frameState.commandList = savedCommandList;
};

/**
 * @private
 * @param {number} normalizedValue
 * @param {number} numberOfDigits
 * @param {number} leftShift
 * @returns {number}
 */
function isolateDigits(normalizedValue, numberOfDigits, leftShift) {
  const scaled = normalizedValue * Math.pow(10, numberOfDigits);
  const integer = parseInt(scaled);
  return integer * Math.pow(10, leftShift);
}

/**
 * @private
 * @param {number} value
 * @param {number} minimum
 * @param {number} maximum
 * @returns {number}
 */
function priorityNormalizeAndClamp(value, minimum, maximum) {
  // Subtract epsilon since we only want decimal digits present in the output.
  return Math.max(
    CesiumMath.normalize(value, minimum, maximum) - CesiumMath.EPSILON7,
    0.0,
  );
}

/**
 * 根据距离和深度设置瓦片的优先级
 * @private
 */

Cesium3DTile.prototype.updatePriority = function () {
  const tileset = this.tileset;
  const preferLeaves = tileset.preferLeaves;
  const minimumPriority = tileset._minimumPriority;
  const maximumPriority = tileset._maximumPriority;

  // Combine priority systems together by mapping them into a base 10 number where each priority controls a specific set of digits in the number.
  // For number priorities, map them to a 0.xxxxx number then left shift it up into a set number of digits before the decimal point. Chop of the fractional part then left shift again into the position it needs to go.
  // For blending number priorities, normalize them to 0-1 and interpolate to get a combined 0-1 number, then proceed as normal.
  // Booleans can just be 0 or 10^leftshift.
  // Think of digits as penalties since smaller numbers are higher priority. If a tile has some large quantity or has a flag raised it's (usually) penalized for it, expressed as a higher number for the digit.
  // Priority number format: preloadFlightDigits(1) | foveatedDeferDigits(1) | foveatedDigits(4) | preloadProgressiveResolutionDigits(1) | preferredSortingDigits(4) . depthDigits(the decimal digits)
  // Certain flags like preferLeaves will flip / turn off certain digits to get desired load order.

  // Setup leftShifts, digit counts, and scales (for booleans)
  const digitsForANumber = 4;
  const digitsForABoolean = 1;

  const preferredSortingLeftShift = 0;
  const preferredSortingDigitsCount = digitsForANumber;

  const foveatedLeftShift =
    preferredSortingLeftShift + preferredSortingDigitsCount;
  const foveatedDigitsCount = digitsForANumber;

  const preloadProgressiveResolutionLeftShift =
    foveatedLeftShift + foveatedDigitsCount;
  const preloadProgressiveResolutionDigitsCount = digitsForABoolean;
  const preloadProgressiveResolutionScale = Math.pow(
    10,
    preloadProgressiveResolutionLeftShift,
  );

  const foveatedDeferLeftShift =
    preloadProgressiveResolutionLeftShift +
    preloadProgressiveResolutionDigitsCount;
  const foveatedDeferDigitsCount = digitsForABoolean;
  const foveatedDeferScale = Math.pow(10, foveatedDeferLeftShift);

  const preloadFlightLeftShift =
    foveatedDeferLeftShift + foveatedDeferDigitsCount;
  const preloadFlightScale = Math.pow(10, preloadFlightLeftShift);

  // Compute the digits for each priority
  let depthDigits = priorityNormalizeAndClamp(
    this._depth,
    minimumPriority.depth,
    maximumPriority.depth,
  );
  depthDigits = preferLeaves ? 1.0 - depthDigits : depthDigits;

  // Map 0-1 then convert to digit. Include a distance sort when doing non-skipLOD and replacement refinement, helps things like non-skipLOD photogrammetry
  const useDistance =
    !tileset.isSkippingLevelOfDetail &&
    this.refine === Cesium3DTileRefine.REPLACE;
  const normalizedPreferredSorting = useDistance
    ? priorityNormalizeAndClamp(
        this._priorityHolder._distanceToCamera,
        minimumPriority.distance,
        maximumPriority.distance,
      )
    : priorityNormalizeAndClamp(
        this._priorityReverseScreenSpaceError,
        minimumPriority.reverseScreenSpaceError,
        maximumPriority.reverseScreenSpaceError,
      );
  const preferredSortingDigits = isolateDigits(
    normalizedPreferredSorting,
    preferredSortingDigitsCount,
    preferredSortingLeftShift,
  );

  const preloadProgressiveResolutionDigits = this._priorityProgressiveResolution
    ? 0
    : preloadProgressiveResolutionScale;

  const normalizedFoveatedFactor = priorityNormalizeAndClamp(
    this._priorityHolder._foveatedFactor,
    minimumPriority.foveatedFactor,
    maximumPriority.foveatedFactor,
  );
  const foveatedDigits = isolateDigits(
    normalizedFoveatedFactor,
    foveatedDigitsCount,
    foveatedLeftShift,
  );

  const foveatedDeferDigits = this.priorityDeferred ? foveatedDeferScale : 0;

  const preloadFlightDigits =
    tileset._pass === Cesium3DTilePass.PRELOAD_FLIGHT ? 0 : preloadFlightScale;

  // Get the final base 10 number
  this._priority =
    depthDigits +
    preferredSortingDigits +
    preloadProgressiveResolutionDigits +
    foveatedDigits +
    foveatedDeferDigits +
    preloadFlightDigits;
};

/**
 * @private
 */
Cesium3DTile.prototype.isDestroyed = function () {
  return false;
};

/**
 * @private
 */
Cesium3DTile.prototype.destroy = function () {
  // For the interval between new content being requested and downloaded, expiredContent === content, so don't destroy twice
  this._content = this._content && this._content.destroy();
  this._expiredContent =
    this._expiredContent &&
    !this._expiredContent.isDestroyed() &&
    this._expiredContent.destroy();
  this._debugBoundingVolume =
    this._debugBoundingVolume && this._debugBoundingVolume.destroy();
  this._debugContentBoundingVolume =
    this._debugContentBoundingVolume &&
    this._debugContentBoundingVolume.destroy();
  this._debugViewerRequestVolume =
    this._debugViewerRequestVolume && this._debugViewerRequestVolume.destroy();
  return destroyObject(this);
};

export default Cesium3DTile;
