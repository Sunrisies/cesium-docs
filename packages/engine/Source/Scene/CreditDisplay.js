import AssociativeArray from "../Core/AssociativeArray.js";
import buildModuleUrl from "../Core/buildModuleUrl.js";
import Check from "../Core/Check.js";
import Credit from "../Core/Credit.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import Uri from "urijs";

const mobileWidth = 576;
const lightboxHeight = 100;
const textColor = "#ffffff";
const highlightColor = "#48b";

/**
 * 用于根据出现频率对信用进行排序
 * 当它们随后被显示时。
 *
 * @alias CreditDisplay.CreditDisplayElement
 * @constructor
 *
 * @private
 */

function CreditDisplayElement(credit, count) {
  this.credit = credit;
  this.count = defaultValue(count, 1);
}

function contains(credits, credit) {
  const len = credits.length;
  for (let i = 0; i < len; i++) {
    const existingCredit = credits[i];
    if (Credit.equals(existingCredit, credit)) {
      return true;
    }
  }
  return false;
}

function swapCesiumCredit(creditDisplay) {
  // We don't want to clutter the screen with the Cesium logo and the Cesium ion
  // logo at the same time. Since the ion logo is required, we just replace the
  // Cesium logo or add the logo if the Cesium one was removed.
  const previousCredit = creditDisplay._previousCesiumCredit;
  const currentCredit = creditDisplay._currentCesiumCredit;
  if (Credit.equals(currentCredit, previousCredit)) {
    return;
  }

  if (defined(previousCredit)) {
    creditDisplay._cesiumCreditContainer.removeChild(previousCredit.element);
  }
  if (defined(currentCredit)) {
    creditDisplay._cesiumCreditContainer.appendChild(currentCredit.element);
  }

  creditDisplay._previousCesiumCredit = currentCredit;
}

const delimiterClassName = "cesium-credit-delimiter";

function createDelimiterElement(delimiter) {
  const delimiterElement = document.createElement("span");
  delimiterElement.textContent = delimiter;
  delimiterElement.className = delimiterClassName;
  return delimiterElement;
}

function createCreditElement(element, elementWrapperTagName) {
  // may need to wrap the credit in another element
  if (defined(elementWrapperTagName)) {
    const wrapper = document.createElement(elementWrapperTagName);
    wrapper._creditId = element._creditId;
    wrapper.appendChild(element);
    element = wrapper;
  }
  return element;
}

function displayCredits(container, credits, delimiter, elementWrapperTagName) {
  const childNodes = container.childNodes;
  let domIndex = -1;

  // Sort the credits such that more frequent credits appear first
  credits.sort(function (credit1, credit2) {
    return credit2.count - credit1.count;
  });

  for (let creditIndex = 0; creditIndex < credits.length; ++creditIndex) {
    const credit = credits[creditIndex].credit;
    if (defined(credit)) {
      domIndex = creditIndex;
      if (defined(delimiter)) {
        // credits may be separated by delimiters
        domIndex *= 2;
        if (creditIndex > 0) {
          const delimiterDomIndex = domIndex - 1;
          if (childNodes.length <= delimiterDomIndex) {
            container.appendChild(createDelimiterElement(delimiter));
          } else {
            const existingDelimiter = childNodes[delimiterDomIndex];
            if (existingDelimiter.className !== delimiterClassName) {
              container.replaceChild(
                createDelimiterElement(delimiter),
                existingDelimiter,
              );
            }
          }
        }
      }

      const element = credit.element;

      // check to see if the correct credit is in the right place
      if (childNodes.length <= domIndex) {
        container.appendChild(
          createCreditElement(element, elementWrapperTagName),
        );
      } else {
        const existingElement = childNodes[domIndex];
        if (existingElement._creditId !== credit._id) {
          // not the right credit, swap it in
          container.replaceChild(
            createCreditElement(element, elementWrapperTagName),
            existingElement,
          );
        }
      }
    }
  }

  // any remaining nodes in the container are unnecessary
  ++domIndex;
  while (domIndex < childNodes.length) {
    container.removeChild(childNodes[domIndex]);
  }
}

function styleLightboxContainer(that) {
  const lightboxCredits = that._lightboxCredits;
  const width = that.viewport.clientWidth;
  const height = that.viewport.clientHeight;
  if (width !== that._lastViewportWidth) {
    if (width < mobileWidth) {
      lightboxCredits.className =
        "cesium-credit-lightbox cesium-credit-lightbox-mobile";
      lightboxCredits.style.marginTop = "0";
    } else {
      lightboxCredits.className =
        "cesium-credit-lightbox cesium-credit-lightbox-expanded";
      lightboxCredits.style.marginTop = `${Math.floor(
        (height - lightboxCredits.clientHeight) * 0.5,
      )}px`;
    }
    that._lastViewportWidth = width;
  }

  if (width >= mobileWidth && height !== that._lastViewportHeight) {
    lightboxCredits.style.marginTop = `${Math.floor(
      (height - lightboxCredits.clientHeight) * 0.5,
    )}px`;
    that._lastViewportHeight = height;
  }
}

function appendCss(container) {
  const style = /*css*/ `
.cesium-credit-lightbox-overlay {
  display: none;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(80, 80, 80, 0.8);
}

.cesium-credit-lightbox {
  background-color: #303336;
  color: ${textColor};
  position: relative;
  min-height: ${lightboxHeight}px;
  margin: auto;
}
.cesium-credit-lightbox > ul > li a,
.cesium-credit-lightbox > ul > li a:visited,
.cesium-credit-wrapper a,
.cesium-credit-wrapper a:visited {
  color: ${textColor};
}
.cesium-credit-lightbox > ul > li a:hover {
  color: ${highlightColor};
}
.cesium-credit-lightbox.cesium-credit-lightbox-expanded {
  border: 1px solid #444;
  border-radius: 5px;
  max-width: 370px;
}
.cesium-credit-lightbox.cesium-credit-lightbox-mobile {
  height: 100%;
  width: 100%;
}
.cesium-credit-lightbox-title {
  padding: 20px 20px 0 20px;
}
.cesium-credit-lightbox-close {
  font-size: 18pt;
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 6px;
  color: ${textColor};
}
.cesium-credit-lightbox-close:hover {
  color: ${highlightColor};
}
.cesium-credit-lightbox > ul {
  margin: 0;
  padding: 12px 20px 12px 40px;
  font-size: 13px;
}
.cesium-credit-lightbox > ul > li {
  padding-bottom: 6px;
}
.cesium-credit-lightbox > ul > li * {
  padding: 0;
  margin: 0;
}

.cesium-credit-expand-link {
  padding-left: 5px;
  cursor: pointer;
  text-decoration: underline;
  color: ${textColor};
}
.cesium-credit-expand-link:hover {
  color: ${highlightColor};
}

.cesium-credit-text {
  color: ${textColor};
}

.cesium-credit-delimiter {
  padding: 0 5px;
}

.cesium-credit-textContainer *,
.cesium-credit-logoContainer * {
  display: inline;
}

.cesium-credit-textContainer a:hover {
  color: ${highlightColor}
}

.cesium-credit-textContainer .cesium-credit-wrapper:first-of-type {
  padding-left: 5px;
}
`;

  function getShadowRoot(container) {
    if (container.shadowRoot) {
      return container.shadowRoot;
    }
    if (container.getRootNode) {
      const root = container.getRootNode();
      if (root instanceof ShadowRoot) {
        return root;
      }
    }
    return undefined;
  }

  const shadowRootOrDocumentHead = defaultValue(
    getShadowRoot(container),
    document.head,
  );
  const styleElem = document.createElement("style");
  styleElem.innerHTML = style;
  shadowRootOrDocumentHead.appendChild(styleElem);
}

/**
 * 信用显示负责在屏幕上显示信用。
 *
 * @param {HTMLElement} container 将显示信用的 HTML 元素
 * @param {string} [delimiter= '•'] 用于分隔文本信用的字符串
 * @param {HTMLElement} [viewport=document.body] 将包含信用弹出窗口的 HTML 元素
 *
 * @alias CreditDisplay
 * @constructor
 *
 * @example
 * // Add a credit with a tooltip, image and link to display onscreen
 * const credit = new Cesium.Credit(`<a href="https://cesium.com/" target="_blank"><img src="/images/cesium_logo.png" title="Cesium"/></a>`, true);
 * viewer.creditDisplay.addStaticCredit(credit);
 *
 * @example
 * // Add a credit with a plaintext link to display in the lightbox
 * const credit = new Cesium.Credit('<a href="https://cesium.com/" target="_blank">Cesium</a>');
 * viewer.creditDisplay.addStaticCredit(credit);
 */
function CreditDisplay(container, delimiter, viewport) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("container", container);
  //>>includeEnd('debug');
  const that = this;

  viewport = defaultValue(viewport, document.body);

  const lightbox = document.createElement("div");
  lightbox.className = "cesium-credit-lightbox-overlay";
  viewport.appendChild(lightbox);

  const lightboxCredits = document.createElement("div");
  lightboxCredits.className = "cesium-credit-lightbox";
  lightbox.appendChild(lightboxCredits);

  function hideLightbox(event) {
    if (lightboxCredits.contains(event.target)) {
      return;
    }
    that.hideLightbox();
  }
  lightbox.addEventListener("click", hideLightbox, false);

  const title = document.createElement("div");
  title.className = "cesium-credit-lightbox-title";
  title.textContent = "Data provided by:";
  lightboxCredits.appendChild(title);

  const closeButton = document.createElement("a");
  closeButton.onclick = this.hideLightbox.bind(this);
  closeButton.innerHTML = "&times;";
  closeButton.className = "cesium-credit-lightbox-close";
  lightboxCredits.appendChild(closeButton);

  const creditList = document.createElement("ul");
  lightboxCredits.appendChild(creditList);

  const cesiumCreditContainer = document.createElement("div");
  cesiumCreditContainer.className = "cesium-credit-logoContainer";
  cesiumCreditContainer.style.display = "inline";
  container.appendChild(cesiumCreditContainer);

  const screenContainer = document.createElement("div");
  screenContainer.className = "cesium-credit-textContainer";
  screenContainer.style.display = "inline";
  container.appendChild(screenContainer);

  const expandLink = document.createElement("a");
  expandLink.className = "cesium-credit-expand-link";
  expandLink.onclick = this.showLightbox.bind(this);
  expandLink.textContent = "Data attribution";
  container.appendChild(expandLink);

  appendCss(container);
  const cesiumCredit = Credit.clone(CreditDisplay.cesiumCredit);

  this._delimiter = defaultValue(delimiter, "•");
  this._screenContainer = screenContainer;
  this._cesiumCreditContainer = cesiumCreditContainer;
  this._lastViewportHeight = undefined;
  this._lastViewportWidth = undefined;
  this._lightboxCredits = lightboxCredits;
  this._creditList = creditList;
  this._lightbox = lightbox;
  this._hideLightbox = hideLightbox;
  this._expandLink = expandLink;
  this._expanded = false;
  this._staticCredits = [];
  this._cesiumCredit = cesiumCredit;
  this._previousCesiumCredit = undefined;
  this._currentCesiumCredit = cesiumCredit;
  this._creditDisplayElementPool = [];
  this._creditDisplayElementIndex = 0;

  this._currentFrameCredits = {
    screenCredits: new AssociativeArray(),
    lightboxCredits: new AssociativeArray(),
  };

  this._defaultCredit = undefined;

  this.viewport = viewport;

  /**
   * 显示信用的 HTML 元素。
   * @type {HTMLElement}
   */

  this.container = container;
}

function setCredit(creditDisplay, credits, credit, count) {
  count = defaultValue(count, 1);
  let creditDisplayElement = credits.get(credit.id);
  if (!defined(creditDisplayElement)) {
    const pool = creditDisplay._creditDisplayElementPool;
    const poolIndex = creditDisplay._creditDisplayElementPoolIndex;
    if (poolIndex < pool.length) {
      creditDisplayElement = pool[poolIndex];
      creditDisplayElement.credit = credit;
      creditDisplayElement.count = count;
    } else {
      creditDisplayElement = new CreditDisplayElement(credit, count);
      pool.push(creditDisplayElement);
    }
    ++creditDisplay._creditDisplayElementPoolIndex;
    credits.set(credit.id, creditDisplayElement);
  } else if (creditDisplayElement.count < Number.MAX_VALUE) {
    creditDisplayElement.count += count;
  }
}

/**
 * 添加一个 {@link Credit}，该信用将在屏幕上或在灯箱中显示，直到
 * 下一帧。这主要用于内部使用。使用 {@link CreditDisplay.addStaticCredit} 将持久的信用添加到屏幕上。
 *
 * @see CreditDisplay.addStaticCredit
 *
 * @param {Credit} credit 要在下一帧中显示的信用。
 */

CreditDisplay.prototype.addCreditToNextFrame = function (credit) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("credit", credit);
  //>>includeEnd('debug');

  if (credit.isIon()) {
    // If this is the an ion logo credit from the ion server
    // Just use the default credit (which is identical) to avoid blinking
    if (!defined(this._defaultCredit)) {
      this._defaultCredit = Credit.clone(getDefaultCredit());
    }
    this._currentCesiumCredit = this._defaultCredit;
    return;
  }

  let credits;
  if (!credit.showOnScreen) {
    credits = this._currentFrameCredits.lightboxCredits;
  } else {
    credits = this._currentFrameCredits.screenCredits;
  }

  setCredit(this, credits, credit);
};

/**
 * 添加一个 {@link Credit}，该信用将在屏幕上或在灯箱中显示，直到通过 {@link CreditDisplay.removeStaticCredit} 被移除。
 *
 * @param {Credit} credit 要添加的信用
 *
 * @example
 * // Add a credit with a tooltip, image and link to display onscreen
 * const credit = new Cesium.Credit(`<a href="https://cesium.com/" target="_blank"><img src="/images/cesium_logo.png" title="Cesium"/></a>`, true);
 * viewer.creditDisplay.addStaticCredit(credit);
 *
 * @example
 * // Add a credit with a plaintext link to display in the lightbox
 * const credit = new Cesium.Credit('<a href="https://cesium.com/" target="_blank">Cesium</a>');
 * viewer.creditDisplay.addStaticCredit(credit);
 */
CreditDisplay.prototype.addStaticCredit = function (credit) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("credit", credit);
  //>>includeEnd('debug');

  const staticCredits = this._staticCredits;
  if (!contains(staticCredits, credit)) {
    staticCredits.push(credit);
  }
};

/**
 * 移除在屏幕上或在灯箱中显示的静态信用。
 *
 * @param {Credit} credit 要被移除的信用。
 */

CreditDisplay.prototype.removeStaticCredit = function (credit) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("credit", credit);
  //>>includeEnd('debug');

  const staticCredits = this._staticCredits;
  const index = staticCredits.indexOf(credit);
  if (index !== -1) {
    staticCredits.splice(index, 1);
  }
};

/**
 * @private
 */
CreditDisplay.prototype.showLightbox = function () {
  this._lightbox.style.display = "block";
  this._expanded = true;
};

/**
 * @private
 */
CreditDisplay.prototype.hideLightbox = function () {
  this._lightbox.style.display = "none";
  this._expanded = false;
};

/**
 * 在渲染新帧之前更新信用显示。
 */

CreditDisplay.prototype.update = function () {
  if (this._expanded) {
    styleLightboxContainer(this);
  }
};

/**
 * 重置信用显示到帧的初始状态，清除当前的信用。
 */

CreditDisplay.prototype.beginFrame = function () {
  const currentFrameCredits = this._currentFrameCredits;
  this._creditDisplayElementPoolIndex = 0;

  const screenCredits = currentFrameCredits.screenCredits;
  const lightboxCredits = currentFrameCredits.lightboxCredits;

  screenCredits.removeAll();
  lightboxCredits.removeAll();

  const staticCredits = this._staticCredits;
  for (let i = 0; i < staticCredits.length; ++i) {
    const staticCredit = staticCredits[i];
    const creditCollection = staticCredit.showOnScreen
      ? screenCredits
      : lightboxCredits;

    if (
      staticCredit.isIon() &&
      Credit.equals(CreditDisplay.cesiumCredit, this._cesiumCredit)
    ) {
      // If this is an ion logo credit from the ion server,
      // make sure to de-duplicate with the default ion credit
      continue;
    }

    setCredit(this, creditCollection, staticCredit, Number.MAX_VALUE);
  }

  if (!Credit.equals(CreditDisplay.cesiumCredit, this._cesiumCredit)) {
    this._cesiumCredit = Credit.clone(CreditDisplay.cesiumCredit);
  }
  this._currentCesiumCredit = this._cesiumCredit;
};

/**
 * 将信用显示设置为帧的结束状态，在信用容器中显示来自上一帧的信用。
 */

CreditDisplay.prototype.endFrame = function () {
  const screenCredits = this._currentFrameCredits.screenCredits.values;
  displayCredits(
    this._screenContainer,
    screenCredits,
    this._delimiter,
    undefined,
  );

  const lightboxCredits = this._currentFrameCredits.lightboxCredits.values;
  this._expandLink.style.display =
    lightboxCredits.length > 0 ? "inline" : "none";
  displayCredits(this._creditList, lightboxCredits, undefined, "li");

  swapCesiumCredit(this);
};

/**
 * 销毁该对象持有的资源。销毁对象允许确定性地释放资源，而不是依赖垃圾收集器来销毁该对象。
 * <br /><br />
 * 一旦对象被销毁，应避免使用；调用除 <code>isDestroyed</code> 之外的任何函数将导致 {@link DeveloperError} 异常。因此，
 * 应像示例中那样将返回值 (<code>undefined</code>) 赋值给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即调用了 destroy()。
 */

CreditDisplay.prototype.destroy = function () {
  this._lightbox.removeEventListener("click", this._hideLightbox, false);

  this.container.removeChild(this._cesiumCreditContainer);
  this.container.removeChild(this._screenContainer);
  this.container.removeChild(this._expandLink);
  this.viewport.removeChild(this._lightbox);

  return destroyObject(this);
};

/**
 * 如果该对象已被销毁，则返回 true；否则返回 false。
 * <br /><br />
 *
 * @returns {boolean} 如果该对象已被销毁，则返回 <code>true</code>；否则返回 <code>false</code>。
 */

CreditDisplay.prototype.isDestroyed = function () {
  return false;
};

CreditDisplay._cesiumCredit = undefined;
CreditDisplay._cesiumCreditInitialized = false;

let defaultCredit;
function getDefaultCredit() {
  if (!defined(defaultCredit)) {
    let logo = buildModuleUrl("Assets/Images/ion-credit.png");

    // When hosting in a WebView, the base URL scheme is file:// or ms-appx-web://
    // which is stripped out from the Credit's <img> tag; use the full path instead
    if (
      logo.indexOf("http://") !== 0 &&
      logo.indexOf("https://") !== 0 &&
      logo.indexOf("data:") !== 0
    ) {
      const logoUrl = new Uri(logo);
      logo = logoUrl.path();
    }

    defaultCredit = new Credit(
      `<a href="https://cesium.com/" target="_blank"><img src="${logo}" style="vertical-align: -7px" title="Cesium ion"/></a>`,
      true,
    );
  }

  if (!CreditDisplay._cesiumCreditInitialized) {
    CreditDisplay._cesiumCredit = defaultCredit;
    CreditDisplay._cesiumCreditInitialized = true;
  }
  return defaultCredit;
}

Object.defineProperties(CreditDisplay, {
  /**
   * 获取或设置 Cesium 标志信用。
   * @memberof CreditDisplay
   * @type {Credit}
   */

  cesiumCredit: {
    get: function () {
      getDefaultCredit();
      return CreditDisplay._cesiumCredit;
    },
    set: function (value) {
      CreditDisplay._cesiumCredit = value;
      CreditDisplay._cesiumCreditInitialized = true;
    },
  },
});

CreditDisplay.CreditDisplayElement = CreditDisplayElement;
export default CreditDisplay;
