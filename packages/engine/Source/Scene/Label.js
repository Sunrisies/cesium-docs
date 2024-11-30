import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Billboard from "./Billboard.js";
import HeightReference from "./HeightReference.js";
import HorizontalOrigin from "./HorizontalOrigin.js";
import LabelStyle from "./LabelStyle.js";
import SDFSettings from "./SDFSettings.js";
import VerticalOrigin from "./VerticalOrigin.js";

const fontInfoCache = {};
let fontInfoCacheLength = 0;
const fontInfoCacheMaxSize = 256;
const defaultBackgroundColor = new Color(0.165, 0.165, 0.165, 0.8);
const defaultBackgroundPadding = new Cartesian2(7, 5);

const textTypes = Object.freeze({
  LTR: 0,
  RTL: 1,
  WEAK: 2,
  BRACKETS: 3,
});

function rebindAllGlyphs(label) {
  if (!label._rebindAllGlyphs && !label._repositionAllGlyphs) {
    // only push label if it's not already been marked dirty
    label._labelCollection._labelsToUpdate.push(label);
  }
  label._rebindAllGlyphs = true;
}

function repositionAllGlyphs(label) {
  if (!label._rebindAllGlyphs && !label._repositionAllGlyphs) {
    // only push label if it's not already been marked dirty
    label._labelCollection._labelsToUpdate.push(label);
  }
  label._repositionAllGlyphs = true;
}

function getCSSValue(element, property) {
  return document.defaultView
    .getComputedStyle(element, null)
    .getPropertyValue(property);
}

function parseFont(label) {
  let fontInfo = fontInfoCache[label._font];
  if (!defined(fontInfo)) {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.opacity = 0;
    div.style.font = label._font;
    document.body.appendChild(div);

    let lineHeight = parseFloat(getCSSValue(div, "line-height"));
    if (isNaN(lineHeight)) {
      // line-height isn't a number, i.e. 'normal'; apply default line-spacing
      lineHeight = undefined;
    }

    fontInfo = {
      family: getCSSValue(div, "font-family"),
      size: getCSSValue(div, "font-size").replace("px", ""),
      style: getCSSValue(div, "font-style"),
      weight: getCSSValue(div, "font-weight"),
      lineHeight: lineHeight,
    };

    document.body.removeChild(div);
    if (fontInfoCacheLength < fontInfoCacheMaxSize) {
      fontInfoCache[label._font] = fontInfo;
      fontInfoCacheLength++;
    }
  }
  label._fontFamily = fontInfo.family;
  label._fontSize = fontInfo.size;
  label._fontStyle = fontInfo.style;
  label._fontWeight = fontInfo.weight;
  label._lineHeight = fontInfo.lineHeight;
}

/**
 * @typedef {object} Label.ConstructorOptions
 *
 * Label 构造函数的初始化选项
 *
 * @property {Cartesian3} position 标签的笛卡尔位置。
 * @property {*} [id] 用户自定义的对象，当使用 {@link Scene#pick} 选择标签时返回。
 * @property {boolean} [show=true] 决定该标签是否显示。
 * @property {string} [text] 指定标签文本的字符串。
 * @property {string} [font='30px sans-serif'] 指定用于绘制该标签的字体的字符串。字体使用与 CSS 'font' 属性相同的语法指定。
 * @property {LabelStyle} [style=LabelStyle.FILL] 指定标签样式的 {@link LabelStyle}。
 * @property {number} [scale=1.0] 指定与标签大小相乘的均匀缩放数字。
 * @property {boolean} [showBackground=false] 决定是否显示该标签后面的背景。
 * @property {Color} [backgroundColor=new Color(0.165, 0.165, 0.165, 0.8)] 指定标签背景颜色的 {@link Color}。
 * @property {Cartesian2} [backgroundPadding=new Cartesian2(7, 5)] 指定背景的水平和垂直填充（以像素为单位）的 {@link Cartesian2}。
 * @property {Cartesian2} [pixelOffset=Cartesian2.ZERO] 指定该标签在屏幕空间中从原点的像素偏移的 {@link Cartesian2}。
 * @property {Cartesian3} [eyeOffset=Cartesian3.ZERO] 指定在眼坐标系中应用于该标签的 3D 笛卡尔偏移的 {@link Cartesian3}。
 * @property {HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.LEFT] 指定该标签的水平原点的 {@link HorizontalOrigin}。
 * @property {VerticalOrigin} [verticalOrigin=VerticalOrigin.BASELINE] 指定该标签的垂直原点的 {@link VerticalOrigin}。
 * @property {HeightReference} [heightReference=HeightReference.NONE] 指定该标签的高度参考的 {@link HeightReference}。
 * @property {Color} [fillColor=Color.WHITE] 指定标签填充颜色的 {@link Color}。
 * @property {Color} [outlineColor=Color.BLACK] 指定标签轮廓颜色的 {@link Color}。
 * @property {number} [outlineWidth=1.0] 指定标签轮廓宽度的数字。
 * @property {NearFarScalar} [translucencyByDistance] 指定基于标签与相机距离的标签的近远半透明属性的 {@link NearFarScalar}。
 * @property {NearFarScalar} [pixelOffsetScaleByDistance] 指定基于标签与相机距离的标签的近远像素偏移缩放属性的 {@link NearFarScalar}。
 * @property {NearFarScalar} [scaleByDistance] 指定基于标签与相机距离的标签的近远缩放属性的 {@link NearFarScalar}。
 * @property {DistanceDisplayCondition} [distanceDisplayCondition] 指定在距离相机的某个距离内显示该标签的 {@link DistanceDisplayCondition}。
 * @property {number} [disableDepthTestDistance] 指定距离相机的距离，在此处禁用深度测试，以防止与地形剪裁。
 */


/**
 * <div class="notice">
 * 通过调用 {@link LabelCollection#add} 创建标签。请勿直接调用构造函数。
 * </div>
 *
 * @alias Label
 * @internalConstructor
 * @class
 *
 * @param {Label.ConstructorOptions} options 描述初始化选项的对象
 * @param {LabelCollection} labelCollection LabelCollection 的实例
 *
 * @exception {DeveloperError} translucencyByDistance.far 必须大于 translucencyByDistance.near
 * @exception {DeveloperError} pixelOffsetScaleByDistance.far 必须大于 pixelOffsetScaleByDistance.near
 * @exception {DeveloperError} distanceDisplayCondition.far 必须大于 distanceDisplayCondition.near
 *
 * @see LabelCollection
 * @see LabelCollection#add
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Labels.html|Cesium Sandcastle Labels Demo}
 */

function Label(options, labelCollection) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (
    defined(options.disableDepthTestDistance) &&
    options.disableDepthTestDistance < 0.0
  ) {
    throw new DeveloperError(
      "disableDepthTestDistance must be greater than 0.0.",
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

  this._renderedText = undefined;
  this._text = undefined;
  this._show = defaultValue(options.show, true);
  this._font = defaultValue(options.font, "30px sans-serif");
  this._fillColor = Color.clone(defaultValue(options.fillColor, Color.WHITE));
  this._outlineColor = Color.clone(
    defaultValue(options.outlineColor, Color.BLACK),
  );
  this._outlineWidth = defaultValue(options.outlineWidth, 1.0);
  this._showBackground = defaultValue(options.showBackground, false);
  this._backgroundColor = Color.clone(
    defaultValue(options.backgroundColor, defaultBackgroundColor),
  );
  this._backgroundPadding = Cartesian2.clone(
    defaultValue(options.backgroundPadding, defaultBackgroundPadding),
  );
  this._style = defaultValue(options.style, LabelStyle.FILL);
  this._verticalOrigin = defaultValue(
    options.verticalOrigin,
    VerticalOrigin.BASELINE,
  );
  this._horizontalOrigin = defaultValue(
    options.horizontalOrigin,
    HorizontalOrigin.LEFT,
  );
  this._pixelOffset = Cartesian2.clone(
    defaultValue(options.pixelOffset, Cartesian2.ZERO),
  );
  this._eyeOffset = Cartesian3.clone(
    defaultValue(options.eyeOffset, Cartesian3.ZERO),
  );
  this._position = Cartesian3.clone(
    defaultValue(options.position, Cartesian3.ZERO),
  );
  this._scale = defaultValue(options.scale, 1.0);
  this._id = options.id;
  this._translucencyByDistance = translucencyByDistance;
  this._pixelOffsetScaleByDistance = pixelOffsetScaleByDistance;
  this._scaleByDistance = scaleByDistance;
  this._heightReference = defaultValue(
    options.heightReference,
    HeightReference.NONE,
  );
  this._distanceDisplayCondition = distanceDisplayCondition;
  this._disableDepthTestDistance = options.disableDepthTestDistance;

  this._labelCollection = labelCollection;
  this._glyphs = [];
  this._backgroundBillboard = undefined;
  this._batchIndex = undefined; // Used only by Vector3DTilePoints and BillboardCollection

  this._rebindAllGlyphs = true;
  this._repositionAllGlyphs = true;

  this._actualClampedPosition = undefined;
  this._removeCallbackFunc = undefined;
  this._mode = undefined;

  this._clusterShow = true;

  this.text = defaultValue(options.text, "");

  this._relativeSize = 1.0;

  parseFont(this);

  this._updateClamping();
}

Object.defineProperties(Label.prototype, {
  /**
   * 决定该标签是否显示。使用此属性来隐藏或显示标签，而不是移除它并重新添加到集合中。
   * @memberof Label.prototype
   * @type {boolean}
   * @default true
   */

  show: {
    get: function() {
      return this._show;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._show !== value) {
        this._show = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const billboard = glyphs[i].billboard;
          if (defined(billboard)) {
            billboard.show = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.show = value;
        }
      }
    },
  },

  /**
     * 获取或设置该标签的笛卡尔位置。
     * @memberof Label.prototype
     * @type {Cartesian3}
     */

  position: {
    get: function() {
      return this._position;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const position = this._position;
      if (!Cartesian3.equals(position, value)) {
        Cartesian3.clone(value, position);

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const billboard = glyphs[i].billboard;
          if (defined(billboard)) {
            billboard.position = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.position = value;
        }

        this._updateClamping();
      }
    },
  },

  /**
   * 获取或设置该公告牌的高度参考。
   * @memberof Label.prototype
   * @type {HeightReference}
   * @default HeightReference.NONE
   */

  heightReference: {
    get: function() {
      return this._heightReference;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (value !== this._heightReference) {
        this._heightReference = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const billboard = glyphs[i].billboard;
          if (defined(billboard)) {
            billboard.heightReference = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.heightReference = value;
        }

        repositionAllGlyphs(this);

        this._updateClamping();
      }
    },
  },

  /**
   * 获取或设置该标签的文本。
   * @memberof Label.prototype
   * @type {string}
   */

  text: {
    get: function() {
      return this._text;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._text !== value) {
        this._text = value;

        // Strip soft-hyphen (auto-wrap) characters from input string
        const renderedValue = value.replace(/\u00ad/g, "");
        this._renderedText = Label.enableRightToLeftDetection
          ? reverseRtl(renderedValue)
          : renderedValue;
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置用于绘制该标签的字体。字体使用与 CSS 'font' 属性相同的语法指定。
   * @memberof Label.prototype
   * @type {string}
   * @default '30px sans-serif'
   * @see {@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles|HTML canvas 2D context text styles}
   */
  font: {
    get: function() {
      return this._font;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._font !== value) {
        this._font = value;
        rebindAllGlyphs(this);
        parseFont(this);
      }
    },
  },

  /**
   * 获取或设置该标签的填充颜色
   * @memberof Label.prototype
   * @type {Color}
   * @default Color.WHITE
   * @see {@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles|HTML canvas 2D context fill and stroke styles}
   */
  fillColor: {
    get: function() {
      return this._fillColor;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const fillColor = this._fillColor;
      if (!Color.equals(fillColor, value)) {
        Color.clone(value, fillColor);
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签的轮廓颜色。
   * @memberof Label.prototype
   * @type {Color}
   * @default Color.BLACK
   * @see {@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles|HTML canvas 2D context fill and stroke styles}
   */
  outlineColor: {
    get: function() {
      return this._outlineColor;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const outlineColor = this._outlineColor;
      if (!Color.equals(outlineColor, value)) {
        Color.clone(value, outlineColor);
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签的轮廓宽度。
   * @memberof Label.prototype
   * @type {number}
   * @default 1.0
   * @see {@link http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles|HTML canvas 2D context fill and stroke styles}
   */
  outlineWidth: {
    get: function() {
      return this._outlineWidth;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._outlineWidth !== value) {
        this._outlineWidth = value;
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 决定该标签后面是否将显示背景。
   * @memberof Label.prototype
   * @default false
   * @type {boolean}
   */
  showBackground: {
    get: function() {
      return this._showBackground;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._showBackground !== value) {
        this._showBackground = value;
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签的背景颜色。
   * @memberof Label.prototype
   * @type {Color}
   * @default new Color(0.165, 0.165, 0.165, 0.8)
   */

  backgroundColor: {
    get: function() {
      return this._backgroundColor;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const backgroundColor = this._backgroundColor;
      if (!Color.equals(backgroundColor, value)) {
        Color.clone(value, backgroundColor);

        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.color = backgroundColor;
        }
      }
    },
  },

  /**
   * 获取或设置该标签的背景填充，单位为像素。<code>x</code> 值控制水平填充，<code>y</code> 值控制垂直填充。
   * @memberof Label.prototype
   * @type {Cartesian2}
   * @default new Cartesian2(7, 5)
   */

  backgroundPadding: {
    get: function() {
      return this._backgroundPadding;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const backgroundPadding = this._backgroundPadding;
      if (!Cartesian2.equals(backgroundPadding, value)) {
        Cartesian2.clone(value, backgroundPadding);
        repositionAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签的样式。
   * @memberof Label.prototype
   * @type {LabelStyle}
   * @default LabelStyle.FILL
   */

  style: {
    get: function() {
      return this._style;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._style !== value) {
        this._style = value;
        rebindAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签在屏幕空间中从原点的像素偏移。通常用于使多个标签和公告牌在同一位置对齐，例如图像和文本。
   * 屏幕空间原点是画布的左上角；<code>x</code> 从左到右增加，<code>y</code> 从上到下增加。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Label.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>l.pixeloffset = new Cartesian2(25, 75);</code><br/><img src='Images/Label.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   * 标签的原点由黄色点表示。
   * </div>
   * @memberof Label.prototype
   * @type {Cartesian2}
   * @default Cartesian2.ZERO
   */

  pixelOffset: {
    get: function() {
      return this._pixelOffset;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const pixelOffset = this._pixelOffset;
      if (!Cartesian2.equals(pixelOffset, value)) {
        Cartesian2.clone(value, pixelOffset);

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.pixelOffset = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.pixelOffset = value;
        }
      }
    },
  },

  /**
   * 获取或设置标签基于与相机距离的近远半透明属性。
   * 标签的半透明度将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 之间插值，而相机距离处于指定的
   * {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限内。
   * 超出这些范围，标签的半透明度将保持在最近的边界。如果未定义，
   * translucencyByDistance 将被禁用。
   * @memberof Label.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a label's translucencyByDistance to 1.0 when the
   * // camera is 1500 meters from the label and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * text.translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable translucency by distance
   * text.translucencyByDistance = undefined;
   */
  translucencyByDistance: {
    get: function() {
      return this._translucencyByDistance;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');

      const translucencyByDistance = this._translucencyByDistance;
      if (!NearFarScalar.equals(translucencyByDistance, value)) {
        this._translucencyByDistance = NearFarScalar.clone(
          value,
          translucencyByDistance,
        );

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.translucencyByDistance = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.translucencyByDistance = value;
        }
      }
    },
  },

  /**
    * 获取或设置标签基于与相机距离的近远像素偏移缩放属性。
    * 标签的像素偏移将在 {@link NearFarScalar#nearValue} 和
    * {@link NearFarScalar#farValue} 之间缩放，而相机距离处于指定的
    * {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限内。
    * 超出这些范围，标签的像素偏移缩放将保持在最近的边界。如果未定义，
    * pixelOffsetScaleByDistance 将被禁用。
    * @memberof Label.prototype
    * @type {NearFarScalar}
    *
    * @example
    * // Example 1.
    * // Set a label's pixel offset scale to 0.0 when the
    * // camera is 1500 meters from the label and scale pixel offset to 10.0 pixels
    * // in the y direction the camera distance approaches 8.0e6 meters.
    * text.pixelOffset = new Cesium.Cartesian2(0.0, 1.0);
    * text.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0);
    *
    * @example
    * // Example 2.
    * // disable pixel offset by distance
    * text.pixelOffsetScaleByDistance = undefined;
    */
  pixelOffsetScaleByDistance: {
    get: function() {
      return this._pixelOffsetScaleByDistance;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');

      const pixelOffsetScaleByDistance = this._pixelOffsetScaleByDistance;
      if (!NearFarScalar.equals(pixelOffsetScaleByDistance, value)) {
        this._pixelOffsetScaleByDistance = NearFarScalar.clone(
          value,
          pixelOffsetScaleByDistance,
        );

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.pixelOffsetScaleByDistance = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.pixelOffsetScaleByDistance = value;
        }
      }
    },
  },

  /**
   * 获取或设置标签基于与相机距离的近远缩放属性。
   * 标签的缩放将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 之间插值，而相机距离处于指定的
   * {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的上下限内。
   * 超出这些范围，标签的缩放将保持在最近的边界。如果未定义，
   * scaleByDistance 将被禁用。
   * @memberof Label.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a label's scaleByDistance to scale by 1.5 when the
   * // camera is 1500 meters from the label and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * label.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable scaling by distance
   * label.scaleByDistance = undefined;
   */
  scaleByDistance: {
    get: function() {
      return this._scaleByDistance;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance.",
        );
      }
      //>>includeEnd('debug');

      const scaleByDistance = this._scaleByDistance;
      if (!NearFarScalar.equals(scaleByDistance, value)) {
        this._scaleByDistance = NearFarScalar.clone(value, scaleByDistance);

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.scaleByDistance = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.scaleByDistance = value;
        }
      }
    },
  },

  /**
   * 获取和设置应用于该标签的 3D 笛卡尔偏移（在眼坐标系中）。眼坐标系是一个左手坐标系统，其中 <code>x</code> 指向观察者的右侧，<code>y</code> 指向上方，<code>z</code> 指向屏幕内侧。眼坐标系使用与世界和模型坐标相同的尺度，通常为米。
   * <br /><br />
   * 眼偏移通常用于将多个标签或对象排列在同一位置，例如，将标签放置在其对应的 3D 模型上方。
   * <br /><br />
   * 在下面的示例中，标签位于地球的中心，但眼偏移使其始终出现在地球的顶部，不论观察者或地球的方向如何。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>l.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code><br /><br />
   * </div>
   * @memberof Label.prototype
   * @type {Cartesian3}
   * @default Cartesian3.ZERO
   */

  eyeOffset: {
    get: function() {
      return this._eyeOffset;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const eyeOffset = this._eyeOffset;
      if (!Cartesian3.equals(eyeOffset, value)) {
        Cartesian3.clone(value, eyeOffset);

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.eyeOffset = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.eyeOffset = value;
        }
      }
    },
  },

  /**
   * 获取或设置该标签的水平原点，决定标签是在其锚点位置的左侧、中心还是右侧绘制。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setHorizontalOrigin.png' width='648' height='196' /><br />
   * </div>
   * @memberof Label.prototype
   * @type {HorizontalOrigin}
   * @default HorizontalOrigin.LEFT
   * @example
   * // Use a top, right origin
   * l.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
   * l.verticalOrigin = Cesium.VerticalOrigin.TOP;
   */
  horizontalOrigin: {
    get: function() {
      return this._horizontalOrigin;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._horizontalOrigin !== value) {
        this._horizontalOrigin = value;
        repositionAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置该标签的垂直原点，决定标签是在其锚点位置的上方、下方还是中心。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setVerticalOrigin.png' width='695' height='175' /><br />
   * </div>
   * @memberof Label.prototype
   * @type {VerticalOrigin}
   * @default VerticalOrigin.BASELINE
   * @example
   * // Use a top, right origin
   * l.horizontalOrigin = Cesium.HorizontalOrigin.RIGHT;
   * l.verticalOrigin = Cesium.VerticalOrigin.TOP;
   */
  verticalOrigin: {
    get: function() {
      return this._verticalOrigin;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._verticalOrigin !== value) {
        this._verticalOrigin = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.verticalOrigin = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.verticalOrigin = value;
        }

        repositionAllGlyphs(this);
      }
    },
  },

  /**
   * 获取或设置与标签的像素大小相乘的均匀缩放因子。
   * 缩放值为 <code>1.0</code> 时不会改变标签的大小；大于 <code>1.0</code> 的缩放值会放大标签；小于 <code>1.0</code> 的正缩放值会缩小标签。
   * <br /><br />
   * 应用较大的缩放值可能会导致标签出现像素化。要使文本更大而不出现像素化，请在调用 {@link Label#font} 时使用较大的字体大小。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Label.setScale.png' width='400' height='300' /><br/>
   * 上图中从左到右的缩放值分别是 <code>0.5</code>、<code>1.0</code> 和 <code>2.0</code>。
   * </div>
   * @memberof Label.prototype
   * @type {number}
   * @default 1.0
   */

  scale: {
    get: function() {
      return this._scale;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (this._scale !== value) {
        this._scale = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.scale = value * this._relativeSize;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.scale = value * this._relativeSize;
        }

        repositionAllGlyphs(this);
      }
    },
  },

  /**
   * 获取标签的总缩放值，即标签的缩放与所需字体的计算相对大小与生成的字形大小的乘积。
   * @memberof Label.prototype
   * @type {number}
   * @default 1.0
   */
  totalScale: {
    get: function() {
      return this._scale * this._relativeSize;
    },
  },

  /**
   * 获取或设置指定在距离相机的多远时显示该标签的条件。
   * @memberof Label.prototype
   * @type {DistanceDisplayCondition}
   * @default undefined
   */

  distanceDisplayCondition: {
    get: function() {
      return this._distanceDisplayCondition;
    },
    set: function(value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far <= value.near) {
        throw new DeveloperError("far must be greater than near");
      }
      //>>includeEnd('debug');
      if (
        !DistanceDisplayCondition.equals(value, this._distanceDisplayCondition)
      ) {
        this._distanceDisplayCondition = DistanceDisplayCondition.clone(
          value,
          this._distanceDisplayCondition,
        );

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.distanceDisplayCondition = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.distanceDisplayCondition = value;
        }
      }
    },
  },

  /**
   * 获取或设置距离相机的距离，在此距离禁用深度测试，防止与地形发生剪裁。
   * 设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，深度测试将永远不应用。
   * @memberof Label.prototype
   * @type {number}
   */

  disableDepthTestDistance: {
    get: function() {
      return this._disableDepthTestDistance;
    },
    set: function(value) {
      if (this._disableDepthTestDistance !== value) {
        //>>includeStart('debug', pragmas.debug);
        if (defined(value) && value < 0.0) {
          throw new DeveloperError(
            "disableDepthTestDistance must be greater than 0.0.",
          );
        }
        //>>includeEnd('debug');
        this._disableDepthTestDistance = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.disableDepthTestDistance = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.disableDepthTestDistance = value;
        }
      }
    },
  },

  /**
   * 获取或设置当标签被选中时返回的用户定义值。
   * @memberof Label.prototype
   * @type {*}
   */

  id: {
    get: function() {
      return this._id;
    },
    set: function(value) {
      if (this._id !== value) {
        this._id = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.id = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.id = value;
        }
      }
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function() {
      if (this._glyphs.length === 0 || !defined(this._glyphs[0].billboard)) {
        return undefined;
      }
      return this._glyphs[0].billboard.pickId;
    },
  },

  /**
   * 基于高度参考跟踪标签的位置。
   * @memberof Label.prototype
   * @type {Cartesian3}
   * @private
   */

  _clampedPosition: {
    get: function() {
      return this._actualClampedPosition;
    },
    set: function(value) {
      this._actualClampedPosition = Cartesian3.clone(
        value,
        this._actualClampedPosition,
      );

      const glyphs = this._glyphs;
      for (let i = 0, len = glyphs.length; i < len; i++) {
        const glyph = glyphs[i];
        if (defined(glyph.billboard)) {
          // Set all the private values here, because we already clamped to ground
          //  so we don't want to do it again for every glyph
          glyph.billboard._clampedPosition = value;
        }
      }
      const backgroundBillboard = this._backgroundBillboard;
      if (defined(backgroundBillboard)) {
        backgroundBillboard._clampedPosition = value;
      }
    },
  },

  /**
   * 决定该标签是否因聚合而显示或隐藏。
   * @memberof Label.prototype
   * @type {boolean}
   * @default true
   * @private
   */

  clusterShow: {
    get: function() {
      return this._clusterShow;
    },
    set: function(value) {
      if (this._clusterShow !== value) {
        this._clusterShow = value;

        const glyphs = this._glyphs;
        for (let i = 0, len = glyphs.length; i < len; i++) {
          const glyph = glyphs[i];
          if (defined(glyph.billboard)) {
            glyph.billboard.clusterShow = value;
          }
        }
        const backgroundBillboard = this._backgroundBillboard;
        if (defined(backgroundBillboard)) {
          backgroundBillboard.clusterShow = value;
        }
      }
    },
  },
});

Label.prototype._updateClamping = function() {
  Billboard._updateClamping(this._labelCollection, this);
};

/**
 * 计算标签原点的屏幕空间位置，考虑眼偏移和像素偏移。
 * 屏幕空间原点是画布的左上角；<code>x</code> 从左到右增加，<code>y</code> 从上到下增加。
 *
 * @param {Scene} scene 标签所在的场景。
 * @param {Cartesian2} [result] 存储结果的对象。
 * @returns {Cartesian2} 标签的屏幕空间位置。
 *
 * @example
 * console.log(l.computeScreenSpacePosition(scene).toString());
 *
 * @see Label#eyeOffset
 * @see Label#pixelOffset
 */
Label.prototype.computeScreenSpacePosition = function(scene, result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  if (!defined(result)) {
    result = new Cartesian2();
  }

  const labelCollection = this._labelCollection;
  const modelMatrix = labelCollection.modelMatrix;
  const actualPosition = defined(this._actualClampedPosition)
    ? this._actualClampedPosition
    : this._position;

  const windowCoordinates = Billboard._computeScreenSpacePosition(
    modelMatrix,
    actualPosition,
    this._eyeOffset,
    this._pixelOffset,
    scene,
    result,
  );
  return windowCoordinates;
};

/**
 * 获取围绕 screenSpacePosition 的标签屏幕空间边界框。
 * @param {Label} label 要获取屏幕空间边界框的标签。
 * @param {Cartesian2} screenSpacePosition 标签的屏幕空间中心。
 * @param {BoundingRectangle} [result] 存储结果的对象。
 * @returns {BoundingRectangle} 屏幕空间边界框。
 *
 * @private
 */

Label.getScreenSpaceBoundingBox = function(
  label,
  screenSpacePosition,
  result,
) {
  let x = 0;
  let y = 0;
  let width = 0;
  let height = 0;
  const scale = label.totalScale;

  const backgroundBillboard = label._backgroundBillboard;
  if (defined(backgroundBillboard)) {
    x = screenSpacePosition.x + backgroundBillboard._translate.x;
    y = screenSpacePosition.y - backgroundBillboard._translate.y;
    width = backgroundBillboard.width * scale;
    height = backgroundBillboard.height * scale;

    if (
      label.verticalOrigin === VerticalOrigin.BOTTOM ||
      label.verticalOrigin === VerticalOrigin.BASELINE
    ) {
      y -= height;
    } else if (label.verticalOrigin === VerticalOrigin.CENTER) {
      y -= height * 0.5;
    }
  } else {
    x = Number.POSITIVE_INFINITY;
    y = Number.POSITIVE_INFINITY;
    let maxX = 0;
    let maxY = 0;
    const glyphs = label._glyphs;
    const length = glyphs.length;
    for (let i = 0; i < length; ++i) {
      const glyph = glyphs[i];
      const billboard = glyph.billboard;
      if (!defined(billboard)) {
        continue;
      }

      const glyphX = screenSpacePosition.x + billboard._translate.x;
      let glyphY = screenSpacePosition.y - billboard._translate.y;
      const glyphWidth = glyph.dimensions.width * scale;
      const glyphHeight = glyph.dimensions.height * scale;

      if (
        label.verticalOrigin === VerticalOrigin.BOTTOM ||
        label.verticalOrigin === VerticalOrigin.BASELINE
      ) {
        glyphY -= glyphHeight;
      } else if (label.verticalOrigin === VerticalOrigin.CENTER) {
        glyphY -= glyphHeight * 0.5;
      }

      if (label._verticalOrigin === VerticalOrigin.TOP) {
        glyphY += SDFSettings.PADDING * scale;
      } else if (
        label._verticalOrigin === VerticalOrigin.BOTTOM ||
        label._verticalOrigin === VerticalOrigin.BASELINE
      ) {
        glyphY -= SDFSettings.PADDING * scale;
      }

      x = Math.min(x, glyphX);
      y = Math.min(y, glyphY);
      maxX = Math.max(maxX, glyphX + glyphWidth);
      maxY = Math.max(maxY, glyphY + glyphHeight);
    }

    width = maxX - x;
    height = maxY - y;
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
 * 确定该标签是否等于另一个标签。如果所有属性相等，则标签相等。不同集合中的标签也可以相等。
 *
 * @param {Label} other 要比较是否相等的标签。
 * @returns {boolean} 如果标签相等则返回 <code>true</code>；否则返回 <code>false</code>。
 */

Label.prototype.equals = function(other) {
  return (
    this === other ||
    (defined(other) &&
      this._show === other._show &&
      this._scale === other._scale &&
      this._outlineWidth === other._outlineWidth &&
      this._showBackground === other._showBackground &&
      this._style === other._style &&
      this._verticalOrigin === other._verticalOrigin &&
      this._horizontalOrigin === other._horizontalOrigin &&
      this._heightReference === other._heightReference &&
      this._renderedText === other._renderedText &&
      this._font === other._font &&
      Cartesian3.equals(this._position, other._position) &&
      Color.equals(this._fillColor, other._fillColor) &&
      Color.equals(this._outlineColor, other._outlineColor) &&
      Color.equals(this._backgroundColor, other._backgroundColor) &&
      Cartesian2.equals(this._backgroundPadding, other._backgroundPadding) &&
      Cartesian2.equals(this._pixelOffset, other._pixelOffset) &&
      Cartesian3.equals(this._eyeOffset, other._eyeOffset) &&
      NearFarScalar.equals(
        this._translucencyByDistance,
        other._translucencyByDistance,
      ) &&
      NearFarScalar.equals(
        this._pixelOffsetScaleByDistance,
        other._pixelOffsetScaleByDistance,
      ) &&
      NearFarScalar.equals(this._scaleByDistance, other._scaleByDistance) &&
      DistanceDisplayCondition.equals(
        this._distanceDisplayCondition,
        other._distanceDisplayCondition,
      ) &&
      this._disableDepthTestDistance === other._disableDepthTestDistance &&
      this._id === other._id)
  );
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 * 如果该对象已被销毁，则不应使用；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 true；否则返回 false。
 */

Label.prototype.isDestroyed = function() {
  return false;
};

/**
 * 决定是否运行算法，以匹配标签的文本为从右到左的语言。
 * @memberof Label
 * @type {boolean}
 * @default false
 *
 * @example
 * // Example 1.
 * // Set a label's rightToLeft before init
 * Cesium.Label.enableRightToLeftDetection = true;
 * const myLabelEntity = viewer.entities.add({
 *   label: {
 *     id: 'my label',
 *     text: 'זה טקסט בעברית \n ועכשיו יורדים שורה',
 *   }
 * });
 *
 * @example
 * // Example 2.
 * const myLabelEntity = viewer.entities.add({
 *   label: {
 *     id: 'my label',
 *     text: 'English text'
 *   }
 * });
 * // Set a label's rightToLeft after init
 * Cesium.Label.enableRightToLeftDetection = true;
 * myLabelEntity.text = 'טקסט חדש';
 */
Label.enableRightToLeftDetection = false;

function convertTextToTypes(text, rtlChars) {
  const ltrChars = /[a-zA-Z0-9]/;
  const bracketsChars = /[()[\]{}<>]/;
  const parsedText = [];
  let word = "";
  let lastType = textTypes.LTR;
  let currentType = "";
  const textLength = text.length;
  for (let textIndex = 0; textIndex < textLength; ++textIndex) {
    const character = text.charAt(textIndex);
    if (rtlChars.test(character)) {
      currentType = textTypes.RTL;
    } else if (ltrChars.test(character)) {
      currentType = textTypes.LTR;
    } else if (bracketsChars.test(character)) {
      currentType = textTypes.BRACKETS;
    } else {
      currentType = textTypes.WEAK;
    }

    if (textIndex === 0) {
      lastType = currentType;
    }

    if (lastType === currentType && currentType !== textTypes.BRACKETS) {
      word += character;
    } else {
      if (word !== "") {
        parsedText.push({ Type: lastType, Word: word });
      }
      lastType = currentType;
      word = character;
    }
  }
  parsedText.push({ Type: currentType, Word: word });
  return parsedText;
}

function reverseWord(word) {
  return word.split("").reverse().join("");
}

function spliceWord(result, pointer, word) {
  return result.slice(0, pointer) + word + result.slice(pointer);
}

function reverseBrackets(bracket) {
  switch (bracket) {
    case "(":
      return ")";
    case ")":
      return "(";
    case "[":
      return "]";
    case "]":
      return "[";
    case "{":
      return "}";
    case "}":
      return "{";
    case "<":
      return ">";
    case ">":
      return "<";
  }
}

//To add another language, simply add its Unicode block range(s) to the below regex.
const hebrew = "\u05D0-\u05EA";
const arabic = "\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF";
const rtlChars = new RegExp(`[${hebrew}${arabic}]`);

/**
 *
 * @param {string} value 要解析和重新排序的文本
 * @returns {string} 以从右到左方向显示的文本
 * @private
 */

function reverseRtl(value) {
  const texts = value.split("\n");
  let result = "";
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    // first character of the line is a RTL character, so need to manage different cases
    const rtlDir = rtlChars.test(text.charAt(0));
    const parsedText = convertTextToTypes(text, rtlChars);

    let splicePointer = 0;
    let line = "";
    for (let wordIndex = 0; wordIndex < parsedText.length; ++wordIndex) {
      const subText = parsedText[wordIndex];
      const reverse =
        subText.Type === textTypes.BRACKETS
          ? reverseBrackets(subText.Word)
          : reverseWord(subText.Word);
      if (rtlDir) {
        if (subText.Type === textTypes.RTL) {
          line = reverse + line;
          splicePointer = 0;
        } else if (subText.Type === textTypes.LTR) {
          line = spliceWord(line, splicePointer, subText.Word);
          splicePointer += subText.Word.length;
        } else if (
          subText.Type === textTypes.WEAK ||
          subText.Type === textTypes.BRACKETS
        ) {
          // current word is weak, last one was bracket
          if (
            subText.Type === textTypes.WEAK &&
            parsedText[wordIndex - 1].Type === textTypes.BRACKETS
          ) {
            line = reverse + line;
          }
          // current word is weak or bracket, last one was rtl
          else if (parsedText[wordIndex - 1].Type === textTypes.RTL) {
            line = reverse + line;
            splicePointer = 0;
          }
          // current word is weak or bracket, there is at least one more word
          else if (parsedText.length > wordIndex + 1) {
            // next word is rtl
            if (parsedText[wordIndex + 1].Type === textTypes.RTL) {
              line = reverse + line;
              splicePointer = 0;
            } else {
              line = spliceWord(line, splicePointer, subText.Word);
              splicePointer += subText.Word.length;
            }
          }
          // current word is weak or bracket, and it the last in this line
          else {
            line = spliceWord(line, 0, reverse);
          }
        }
      }
      // ltr line, rtl word
      else if (subText.Type === textTypes.RTL) {
        line = spliceWord(line, splicePointer, reverse);
      }
      // ltr line, ltr word
      else if (subText.Type === textTypes.LTR) {
        line += subText.Word;
        splicePointer = line.length;
      }
      // ltr line, weak or bracket word
      else if (
        subText.Type === textTypes.WEAK ||
        subText.Type === textTypes.BRACKETS
      ) {
        // not first word in line
        if (wordIndex > 0) {
          // last word was rtl
          if (parsedText[wordIndex - 1].Type === textTypes.RTL) {
            // there is at least one more word
            if (parsedText.length > wordIndex + 1) {
              // next word is rtl
              if (parsedText[wordIndex + 1].Type === textTypes.RTL) {
                line = spliceWord(line, splicePointer, reverse);
              } else {
                line += subText.Word;
                splicePointer = line.length;
              }
            } else {
              line += subText.Word;
            }
          } else {
            line += subText.Word;
            splicePointer = line.length;
          }
        } else {
          line += subText.Word;
          splicePointer = line.length;
        }
      }
    }

    result += line;
    if (i < texts.length - 1) {
      result += "\n";
    }
  }
  return result;
}
export default Label;
