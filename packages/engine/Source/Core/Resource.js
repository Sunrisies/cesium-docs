import Uri from "urijs";
import appendForwardSlash from "./appendForwardSlash.js";
import Check from "./Check.js";
import clone from "./clone.js";
import combine from "./combine.js";
import defaultValue from "./defaultValue.js";
import defer from "./defer.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import getAbsoluteUri from "./getAbsoluteUri.js";
import getBaseUri from "./getBaseUri.js";
import getExtensionFromUri from "./getExtensionFromUri.js";
import getImagePixels from "./getImagePixels.js";
import isBlobUri from "./isBlobUri.js";
import isCrossOriginUrl from "./isCrossOriginUrl.js";
import isDataUri from "./isDataUri.js";
import loadAndExecuteScript from "./loadAndExecuteScript.js";
import CesiumMath from "./Math.js";
import objectToQuery from "./objectToQuery.js";
import queryToObject from "./queryToObject.js";
import Request from "./Request.js";
import RequestErrorEvent from "./RequestErrorEvent.js";
import RequestScheduler from "./RequestScheduler.js";
import RequestState from "./RequestState.js";
import RuntimeError from "./RuntimeError.js";
import TrustedServers from "./TrustedServers.js";

const xhrBlobSupported = (function () {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "#", true);
    xhr.responseType = "blob";
    return xhr.responseType === "blob";
  } catch (e) {
    return false;
  }
})();

/**
 * @typedef {object} Resource.ConstructorOptions
 *
 * Resource 构造函数的初始化选项
 *
 * @property {string} url 资源的 URL。
 * @property {object} [queryParameters] 一个包含查询参数的对象，这些参数将在检索资源时发送。
 * @property {object} [templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @property {object} [headers={}] 将被发送的额外 HTTP 头。
 * @property {Proxy} [proxy] 加载资源时使用的代理。
 * @property {Resource.RetryCallback} [retryCallback] 请求该资源失败时要调用的函数。如果它返回 true，则会重试请求。
 * @property {number} [retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @property {Request} [request] 将被使用的 Request 对象。仅供内部使用。
 * @property {boolean} [parseUrl=true] 如果为 true，则解析 URL 以获取查询参数；否则存储未更改的 URL。
 */


/**
 * 一个资源，包括位置和我们需要获取它或创建派生资源的其他参数。它还提供重试请求的能力。
 *
 * @alias Resource
 * @constructor
 *
 * @param {string|Resource.ConstructorOptions} options URL 或描述初始化选项的对象
 *
 * @example
 * function refreshTokenRetryCallback(resource, error) {
 *   if (error.statusCode === 403) {
 *     // 403 status code means a new token should be generated
 *     return getNewAccessToken()
 *       .then(function(token) {
 *         resource.queryParameters.access_token = token;
 *         return true;
 *       })
 *       .catch(function() {
 *         return false;
 *       });
 *   }
 *
 *   return false;
 * }
 *
 * const resource = new Resource({
 *    url: 'http://server.com/path/to/resource.json',
 *    proxy: new DefaultProxy('/proxy/'),
 *    headers: {
 *      'X-My-Header': 'valueOfHeader'
 *    },
 *    queryParameters: {
 *      'access_token': '123-435-456-000'
 *    },
 *    retryCallback: refreshTokenRetryCallback,
 *    retryAttempts: 1
 * });
 */
function Resource(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  if (typeof options === "string") {
    options = {
      url: options,
    };
  }

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.string("options.url", options.url);
  //>>includeEnd('debug');

  this._url = undefined;
  this._templateValues = defaultClone(options.templateValues, {});
  this._queryParameters = defaultClone(options.queryParameters, {});

  /**
   * 将随请求发送的额外 HTTP 头。
   *
   * @type {object}
   */
  this.headers = defaultClone(options.headers, {});

  /**
   * 将被使用的 Request 对象。仅供内部使用。
   *
   * @type {Request}
   */
  this.request = defaultValue(options.request, new Request());

  /**
   * 加载资源时使用的代理。
   *
   * @type {Proxy}
   */
  this.proxy = options.proxy;

  /**
   * 请求该资源失败时要调用的函数。如果返回 true 或返回一个解析为 true 的 Promise，则请求将被重试。
   *
   * @type {Function}
   */
  this.retryCallback = options.retryCallback;

  /**
   * 在放弃之前应调用 retryCallback 的次数。
   *
   * @type {number}
   */

  this.retryAttempts = defaultValue(options.retryAttempts, 0);
  this._retryCount = 0;

  const parseUrl = defaultValue(options.parseUrl, true);
  if (parseUrl) {
    this.parseUrl(options.url, true, true);
  } else {
    this._url = options.url;
  }

  this._credits = options.credits;
}

/**
 * 如果值已定义，则克隆该值；否则返回默认值。
 *
 * @param {object} [value] 要克隆的值。
 * @param {object} [defaultValue] 默认值。
 *
 * @returns {object} 值的克隆或默认值。
 *
 * @private
 */

function defaultClone(value, defaultValue) {
  return defined(value) ? clone(value) : defaultValue;
}

/**
 * 一个辅助函数，根据提供的是字符串还是资源来创建资源。
 *
 * @param {Resource|string} resource 用于创建新资源的 Resource 或字符串。
 *
 * @returns {Resource} 如果 resource 是字符串，则返回构造的 Resource，包含 URL 和选项。否则返回 resource 参数。
 *
 * @private
 */

Resource.createIfNeeded = function (resource) {
  if (resource instanceof Resource) {
    // Keep existing request object. This function is used internally to duplicate a Resource, so that it can't
    //  be modified outside of a class that holds it (eg. an imagery or terrain provider). Since the Request objects
    //  are managed outside of the providers, by the tile loading code, we want to keep the request property the same so if it is changed
    //  in the underlying tiling code the requests for this resource will use it.
    return resource.getDerivedResource({
      request: resource.request,
    });
  }

  if (typeof resource !== "string") {
    return resource;
  }

  return new Resource({
    url: resource,
  });
};

let supportsImageBitmapOptionsPromise;
/**
 * 一个辅助函数，用于检查 createImageBitmap 是否支持传递 ImageBitmapOptions。
 *
 * @returns {Promise<boolean>} 一个承诺，如果此浏览器支持使用选项创建 ImageBitmap，则解析为 true。
 *
 * @private
 */

Resource.supportsImageBitmapOptions = function () {
  // Until the HTML folks figure out what to do about this, we need to actually try loading an image to
  // know if this browser supports passing options to the createImageBitmap function.
  // https://github.com/whatwg/html/pull/4248
  //
  // We also need to check whether the colorSpaceConversion option is supported.
  // We do this by loading a PNG with an embedded color profile, first with
  // colorSpaceConversion: "none" and then with colorSpaceConversion: "default".
  // If the pixel color is different then we know the option is working.
  // As of Webkit 17612.3.6.1.6 the createImageBitmap promise resolves but the
  // option is not actually supported.
  if (defined(supportsImageBitmapOptionsPromise)) {
    return supportsImageBitmapOptionsPromise;
  }

  if (typeof createImageBitmap !== "function") {
    supportsImageBitmapOptionsPromise = Promise.resolve(false);
    return supportsImageBitmapOptionsPromise;
  }

  const imageDataUri =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAABGdBTUEAAE4g3rEiDgAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAADElEQVQI12Ng6GAAAAEUAIngE3ZiAAAAAElFTkSuQmCC";

  supportsImageBitmapOptionsPromise = Resource.fetchBlob({
    url: imageDataUri,
  })
    .then(function (blob) {
      const imageBitmapOptions = {
        imageOrientation: "flipY", // default is "none"
        premultiplyAlpha: "none", // default is "default"
        colorSpaceConversion: "none", // default is "default"
      };
      return Promise.all([
        createImageBitmap(blob, imageBitmapOptions),
        createImageBitmap(blob),
      ]);
    })
    .then(function (imageBitmaps) {
      // Check whether the colorSpaceConversion option had any effect on the green channel
      const colorWithOptions = getImagePixels(imageBitmaps[0]);
      const colorWithDefaults = getImagePixels(imageBitmaps[1]);
      return colorWithOptions[1] !== colorWithDefaults[1];
    })
    .catch(function () {
      return false;
    });

  return supportsImageBitmapOptionsPromise;
};

Object.defineProperties(Resource, {
/**
   * 如果支持 blobs，则返回 true。
   *
   * @memberof Resource
   * @type {boolean}
   *
   * @readonly
   */

  isBlobSupported: {
    get: function () {
      return xhrBlobSupported;
    },
  },
});

Object.defineProperties(Resource.prototype, {
  /**
   * 附加到 URL 的查询参数。
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  queryParameters: {
    get: function () {
      return this._queryParameters;
    },
  },

  /**
   * 用于替换 URL 中模板参数的键/值对。
   *
   * @memberof Resource.prototype
   * @type {object}
   *
   * @readonly
   */
  templateValues: {
    get: function () {
      return this._templateValues;
    },
  },

  /**
   * URL，替换了模板值，附加了查询字符串，并在设置代理时进行了编码。
   *
   * @memberof Resource.prototype
   * @type {string}
   */
  url: {
    get: function () {
      return this.getUrlComponent(true, true);
    },
    set: function (value) {
      this.parseUrl(value, false, false);
    },
  },

  /**
   * 资源的文件扩展名。
   *
   * @memberof Resource.prototype
   * @type {string}
   *
   * @readonly
   */
  extension: {
    get: function () {
      return getExtensionFromUri(this._url);
    },
  },

  /**
   * 如果资源引用的是数据 URI，则为真。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isDataUri: {
    get: function () {
      return isDataUri(this._url);
    },
  },

  /**
   * 如果资源引用的是 blob URI，则为真。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isBlobUri: {
    get: function () {
      return isBlobUri(this._url);
    },
  },

  /**
   * 如果资源引用的是跨域 URL，则为真。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  isCrossOriginUrl: {
    get: function () {
      return isCrossOriginUrl(this._url);
    },
  },

  /**
   * 如果资源具有请求头，则返回真。等效于检查 headers 属性是否有任何键。
   *
   * @memberof Resource.prototype
   * @type {boolean}
   */
  hasHeaders: {
    get: function () {
      return Object.keys(this.headers).length > 0;
    },
  },

  /**
   * 获取资产所需的归属信用。
   * @private
   */
  credits: {
    get: function () {
      return this._credits;
    },
  },
});


/**
 * 重写 Object#toString，以便隐式字符串转换返回
 * 此资源所表示的完整 URL。
 *
 * @returns {string} 此资源所表示的 URL
 */

Resource.prototype.toString = function () {
  return this.getUrlComponent(true, true);
};

/**
 * 解析 URL 字符串，并存储其信息
 *
 * @param {string} url 输入的 URL 字符串。
 * @param {boolean} merge 如果为真，则会与资源现有的查询参数合并。否则，将被替换。
 * @param {boolean} preserveQuery 如果为真，重复参数将被连接到一个数组中。如果为假，URL 中的键将优先。
 * @param {string} [baseUrl] 如果提供，并且输入的 URL 是相对 URL，则其将相对于 baseUrl 变为绝对 URL。
 *
 * @private
 */

Resource.prototype.parseUrl = function (url, merge, preserveQuery, baseUrl) {
  let uri = new Uri(url);
  const query = parseQueryString(uri.query());

  this._queryParameters = merge
    ? combineQueryParameters(query, this.queryParameters, preserveQuery)
    : query;

  // Remove unneeded info from the Uri
  uri.search("");
  uri.fragment("");

  if (defined(baseUrl) && uri.scheme() === "") {
    uri = uri.absoluteTo(getAbsoluteUri(baseUrl));
  }

  this._url = uri.toString();
};

/**
 * 解析查询字符串并返回等效的对象。
 *
 * @param {string} queryString 查询字符串
 * @returns {object}
 *
 * @private
 */

function parseQueryString(queryString) {
  if (queryString.length === 0) {
    return {};
  }

  // Special case where the querystring is just a string, not key/value pairs
  if (queryString.indexOf("=") === -1) {
    return { [queryString]: undefined };
  }

  return queryToObject(queryString);
}

/**
 * 合并查询参数的映射。
 *
 * @param {object} q1 第一个查询参数的映射。如果 preserveQueryParameters 为假，则此映射中的值将优先。
 * @param {object} q2 第二个查询参数的映射。
 * @param {boolean} preserveQueryParameters 如果为真，重复参数将连接成一个数组。如果为假，q1 中的键将优先。
 *
 * @returns {object} 合并后的查询参数映射。
 *
 * @example
 * const q1 = {
 *   a: 1,
 *   b: 2
 * };
 * const q2 = {
 *   a: 3,
 *   c: 4
 * };
 * const q3 = {
 *   b: [5, 6],
 *   d: 7
 * }
 *
 * // Returns
 * // {
 * //   a: [1, 3],
 * //   b: 2,
 * //   c: 4
 * // };
 * combineQueryParameters(q1, q2, true);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: 2,
 * //   c: 4
 * // };
 * combineQueryParameters(q1, q2, false);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: [2, 5, 6],
 * //   d: 7
 * // };
 * combineQueryParameters(q1, q3, true);
 *
 * // Returns
 * // {
 * //   a: 1,
 * //   b: 2,
 * //   d: 7
 * // };
 * combineQueryParameters(q1, q3, false);
 *
 * @private
 */
function combineQueryParameters(q1, q2, preserveQueryParameters) {
  if (!preserveQueryParameters) {
    return combine(q1, q2);
  }

  const result = clone(q1, true);
  for (const param in q2) {
    if (q2.hasOwnProperty(param)) {
      let value = result[param];
      const q2Value = q2[param];
      if (defined(value)) {
        if (!Array.isArray(value)) {
          value = result[param] = [value];
        }

        result[param] = value.concat(q2Value);
      } else {
        result[param] = Array.isArray(q2Value) ? q2Value.slice() : q2Value;
      }
    }
  }

  return result;
}

/**
 * 返回 URL，可选包含查询字符串，并由代理处理。
 *
 * @param {boolean} [query=false] 如果为真，查询字符串将被包含。
 * @param {boolean} [proxy=false] 如果为真，则 URL 将由代理对象处理（如果已定义）。
 *
 * @returns {string} 包含所有请求组件的 URL。
 */

Resource.prototype.getUrlComponent = function (query, proxy) {
  if (this.isDataUri) {
    return this._url;
  }

  let url = this._url;
  if (query) {
    url = `${url}${stringifyQuery(this.queryParameters)}`;
  }

  // Restore the placeholders, which may have been escaped in objectToQuery or elsewhere
  url = url.replace(/%7B/g, "{").replace(/%7D/g, "}");

  const templateValues = this._templateValues;
  if (Object.keys(templateValues).length > 0) {
    url = url.replace(/{(.*?)}/g, function (match, key) {
      const replacement = templateValues[key];
      if (defined(replacement)) {
        // use the replacement value from templateValues if there is one...
        return encodeURIComponent(replacement);
      }
      // otherwise leave it unchanged
      return match;
    });
  }

  if (proxy && defined(this.proxy)) {
    url = this.proxy.getURL(url);
  }

  return url;
};

/**
 * 将查询对象转换为字符串。
 *
 * @param {object} queryObject 包含查询参数的对象
 * @returns {string}
 *
 * @private
 */

function stringifyQuery(queryObject) {
  const keys = Object.keys(queryObject);

  if (keys.length === 0) {
    return "";
  }
  if (keys.length === 1 && !defined(queryObject[keys[0]])) {
    // We have 1 key with an undefined value, so this is just a string, not key/value pairs
    return `?${keys[0]}`;
  }

  return `?${objectToQuery(queryObject)}`;
}

/**
 * 结合指定对象和现有查询参数。这允许一次添加多个参数，
 * 反之则需要逐个添加到 queryParameters 属性。如果一个值已经设置，则会被新值替换。
 *
 * @param {object} params 查询参数
 * @param {boolean} [useAsDefault=false] 如果为真，params 将作为默认值使用，因此只有在未定义时才会设置它们。
 */

Resource.prototype.setQueryParameters = function (params, useAsDefault) {
  if (useAsDefault) {
    this._queryParameters = combineQueryParameters(
      this._queryParameters,
      params,
      false,
    );
  } else {
    this._queryParameters = combineQueryParameters(
      params,
      this._queryParameters,
      false,
    );
  }
};

/**
 * 结合指定对象和现有查询参数。这允许一次添加多个参数，
 * 反之则需要逐个添加到 queryParameters 属性。
 *
 * @param {object} params 查询参数
 */

Resource.prototype.appendQueryParameters = function (params) {
  this._queryParameters = combineQueryParameters(
    params,
    this._queryParameters,
    true,
  );
};

/**
 * 结合指定对象和现有模板值。这允许一次添加多个值，
 * 反之则需要逐个添加到 templateValues 属性。如果一个值已经设置，它将变为一个数组，并将新值附加到其中。
 *
 * @param {object} template 模板值
 * @param {boolean} [useAsDefault=false] 如果为真，这些值将作为默认值使用，因此只有在未定义时才会设置它们。
 */

Resource.prototype.setTemplateValues = function (template, useAsDefault) {
  if (useAsDefault) {
    this._templateValues = combine(this._templateValues, template);
  } else {
    this._templateValues = combine(template, this._templateValues);
  }
};

/**
 * 返回相对于当前实例的资源。除非在选项中被覆盖，否则所有属性将与当前实例保持相同。
 *
 * @param {object} options 具有以下属性的对象：
 * @param {string} [options.url] 将相对于当前实例的 URL 进行解析的 URL。
 * @param {object} [options.queryParameters] 一个对象，包含将与当前实例的查询参数合并的查询参数。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。这些将与当前实例的值合并。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当加载资源失败时调用的函数。
 * @param {number} [options.retryAttempts] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {boolean} [options.preserveQueryParameters=false] 如果为真，则保留当前资源和派生资源的所有查询参数。如果为假，派生参数将替换当前资源的参数。
 *
 * @returns {Resource} 从当前资源派生的资源。
 */

Resource.prototype.getDerivedResource = function (options) {
  const resource = this.clone();
  resource._retryCount = 0;

  if (defined(options.url)) {
    const preserveQuery = defaultValue(options.preserveQueryParameters, false);
    resource.parseUrl(options.url, true, preserveQuery, this._url);
  }

  if (defined(options.queryParameters)) {
    resource._queryParameters = combine(
      options.queryParameters,
      resource.queryParameters,
    );
  }
  if (defined(options.templateValues)) {
    resource._templateValues = combine(
      options.templateValues,
      resource.templateValues,
    );
  }
  if (defined(options.headers)) {
    resource.headers = combine(options.headers, resource.headers);
  }
  if (defined(options.proxy)) {
    resource.proxy = options.proxy;
  }
  if (defined(options.request)) {
    resource.request = options.request;
  }
  if (defined(options.retryCallback)) {
    resource.retryCallback = options.retryCallback;
  }
  if (defined(options.retryAttempts)) {
    resource.retryAttempts = options.retryAttempts;
  }

  return resource;
};

/**
 * 当资源加载失败时调用。如果定义了 retryCallback 函数，将一直调用此函数，直到达到 retryAttempts。
 *
 * @param {RequestErrorEvent} [error] 遇到的错误。
 *
 * @returns {Promise<boolean>} 返回一个布尔值的承诺，如果为 true，将导致该资源请求被重试。
 *
 * @private
 */

Resource.prototype.retryOnError = function (error) {
  const retryCallback = this.retryCallback;
  if (
    typeof retryCallback !== "function" ||
    this._retryCount >= this.retryAttempts
  ) {
    return Promise.resolve(false);
  }

  const that = this;
  return Promise.resolve(retryCallback(this, error)).then(function (result) {
    ++that._retryCount;

    return result;
  });
};

/**
 * 复制一个 Resource 实例。
 *
 * @param {Resource} [result] 存储结果的对象。
 *
 * @returns {Resource} 修改后的结果参数，或者如果未提供则返回一个新 Resource 实例。
 */

Resource.prototype.clone = function (result) {
  if (!defined(result)) {
    return new Resource({
      url: this._url,
      queryParameters: this.queryParameters,
      templateValues: this.templateValues,
      headers: this.headers,
      proxy: this.proxy,
      retryCallback: this.retryCallback,
      retryAttempts: this.retryAttempts,
      request: this.request.clone(),
      parseUrl: false,
      credits: defined(this.credits) ? this.credits.slice() : undefined,
    });
  }

  result._url = this._url;
  result._queryParameters = clone(this._queryParameters);
  result._templateValues = clone(this._templateValues);
  result.headers = clone(this.headers);
  result.proxy = this.proxy;
  result.retryCallback = this.retryCallback;
  result.retryAttempts = this.retryAttempts;
  result._retryCount = 0;
  result.request = this.request.clone();

  return result;
};

/**
 * 返回资源的基本路径。
 *
 * @param {boolean} [includeQuery = false] 是否包含查询字符串和 URI 的片段。
 *
 * @returns {string} 资源的基本 URI。
 */

Resource.prototype.getBaseUri = function (includeQuery) {
  return getBaseUri(this.getUrlComponent(includeQuery), includeQuery);
};

/**
 * 在 URL 末尾附加一个正斜杠。
 */

Resource.prototype.appendForwardSlash = function () {
  this._url = appendForwardSlash(this._url);
};

/**
 * 异步加载资源作为原始二进制数据。返回一个承诺，一旦加载完成将解析为
 * ArrayBuffer，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @returns {Promise<ArrayBuffer>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为 true 且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load a single URL asynchronously
 * resource.fetchArrayBuffer().then(function(arrayBuffer) {
 *     // use the data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchArrayBuffer = function () {
  return this.fetch({
    responseType: "arraybuffer",
  });
};

/**
 * 创建一个 Resource 并调用 fetchArrayBuffer()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @returns {Promise<ArrayBuffer>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为 true 且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchArrayBuffer = function (options) {
  const resource = new Resource(options);
  return resource.fetchArrayBuffer();
};

/**
 * 异步加载给定资源作为 blob。返回一个承诺，一旦加载完成将解析为
 * Blob，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @returns {Promise<Blob>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为 true 且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load a single URL asynchronously
 * resource.fetchBlob().then(function(blob) {
 *     // use the data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchBlob = function () {
  return this.fetch({
    responseType: "blob",
  });
};

/**
 * 创建一个 Resource 并调用 fetchBlob()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @returns {Promise<Blob>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为 true 且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchBlob = function (options) {
  const resource = new Resource(options);
  return resource.fetchBlob();
};

/**
 * 异步加载给定的图像资源。返回一个承诺，如果 <code>preferImageBitmap</code> 为真且浏览器支持 <code>createImageBitmap</code>，将解析为一个 {@link https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap|ImageBitmap}，
 * 否则将解析为一个 {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement|Image}，一旦加载完成；如果图像加载失败，则拒绝。
 *
 * @param {object} [options] 具有以下属性的对象。
 * @param {boolean} [options.preferBlob=false] 如果为真，我们将通过 blob 加载图像。
 * @param {boolean} [options.preferImageBitmap=false] 如果为真，图像将在获取期间解码并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.flipY=false] 如果为真，图像将在解码时垂直翻转。仅在浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为真，图像中的任何自定义伽马或色彩配置文件将被忽略。仅在浏览器支持 <code>createImageBitmap</code> 时适用。
 * @returns {Promise<ImageBitmap|HTMLImageElement>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * // load a single image asynchronously
 * resource.fetchImage().then(function(image) {
 *     // use the loaded image
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * // load several images in parallel
 * Promise.all([resource1.fetchImage(), resource2.fetchImage()]).then(function(images) {
 *     // images is an array containing all the loaded images
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchImage = function (options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const preferImageBitmap = defaultValue(options.preferImageBitmap, false);
  const preferBlob = defaultValue(options.preferBlob, false);
  const flipY = defaultValue(options.flipY, false);
  const skipColorSpaceConversion = defaultValue(
    options.skipColorSpaceConversion,
    false,
  );

  checkAndResetRequest(this.request);
  // We try to load the image normally if
  // 1. Blobs aren't supported
  // 2. It's a data URI
  // 3. It's a blob URI
  // 4. It doesn't have request headers and we preferBlob is false
  if (
    !xhrBlobSupported ||
    this.isDataUri ||
    this.isBlobUri ||
    (!this.hasHeaders && !preferBlob)
  ) {
    return fetchImage({
      resource: this,
      flipY: flipY,
      skipColorSpaceConversion: skipColorSpaceConversion,
      preferImageBitmap: preferImageBitmap,
    });
  }

  const blobPromise = this.fetchBlob();
  if (!defined(blobPromise)) {
    return;
  }

  let supportsImageBitmap;
  let useImageBitmap;
  let generatedBlobResource;
  let generatedBlob;
  return Resource.supportsImageBitmapOptions()
    .then(function (result) {
      supportsImageBitmap = result;
      useImageBitmap = supportsImageBitmap && preferImageBitmap;
      return blobPromise;
    })
    .then(function (blob) {
      if (!defined(blob)) {
        return;
      }
      generatedBlob = blob;
      if (useImageBitmap) {
        return Resource.createImageBitmapFromBlob(blob, {
          flipY: flipY,
          premultiplyAlpha: false,
          skipColorSpaceConversion: skipColorSpaceConversion,
        });
      }
      const blobUrl = window.URL.createObjectURL(blob);
      generatedBlobResource = new Resource({
        url: blobUrl,
      });

      return fetchImage({
        resource: generatedBlobResource,
        flipY: flipY,
        skipColorSpaceConversion: skipColorSpaceConversion,
        preferImageBitmap: false,
      });
    })
    .then(function (image) {
      if (!defined(image)) {
        return;
      }

      // The blob object may be needed for use by a TileDiscardPolicy,
      // so attach it to the image.
      image.blob = generatedBlob;

      if (useImageBitmap) {
        return image;
      }

      window.URL.revokeObjectURL(generatedBlobResource.url);
      return image;
    })
    .catch(function (error) {
      if (defined(generatedBlobResource)) {
        window.URL.revokeObjectURL(generatedBlobResource.url);
      }

      // If the blob load succeeded but the image decode failed, attach the blob
      // to the error object for use by a TileDiscardPolicy.
      // In particular, BingMapsImageryProvider uses this to detect the
      // zero-length response that is returned when a tile is not available.
      error.blob = generatedBlob;

      return Promise.reject(error);
    });
};

/**
 * 获取一张图像并返回其承诺。
 *
 * @param {object} [options] 具有以下属性的对象。
 * @param {Resource} [options.resource] 指向要获取的图像的资源对象。
 * @param {boolean} [options.preferImageBitmap] 如果为真，图像将在获取期间解码并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.flipY] 如果为真，图像将在解码时垂直翻转。仅在浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为真，图像中的任何自定义伽马或色彩配置文件将被忽略。仅在浏览器支持 <code>createImageBitmap</code> 时适用。
 * @private
 */

function fetchImage(options) {
  const resource = options.resource;
  const flipY = options.flipY;
  const skipColorSpaceConversion = options.skipColorSpaceConversion;
  const preferImageBitmap = options.preferImageBitmap;

  const request = resource.request;
  request.url = resource.url;
  request.requestFunction = function () {
    let crossOrigin = false;

    // data URIs can't have crossorigin set.
    if (!resource.isDataUri && !resource.isBlobUri) {
      crossOrigin = resource.isCrossOriginUrl;
    }

    const deferred = defer();
    Resource._Implementations.createImage(
      request,
      crossOrigin,
      deferred,
      flipY,
      skipColorSpaceConversion,
      preferImageBitmap,
    );

    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise.catch(function (e) {
    // Don't retry cancelled or otherwise aborted requests
    if (request.state !== RequestState.FAILED) {
      return Promise.reject(e);
    }
    return resource.retryOnError(e).then(function (retry) {
      if (retry) {
        // Reset request so it can try again
        request.state = RequestState.UNISSUED;
        request.deferred = undefined;

        return fetchImage({
          resource: resource,
          flipY: flipY,
          skipColorSpaceConversion: skipColorSpaceConversion,
          preferImageBitmap: preferImageBitmap,
        });
      }
      return Promise.reject(e);
    });
  });
}

/**
 * 创建一个 Resource 并调用 fetchImage()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {boolean} [options.flipY=false] 是否在获取和解码期间垂直翻转图像。仅在请求图像且浏览器支持 <code>createImageBitmap</code> 时适用。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {boolean} [options.preferBlob=false] 如果为真，我们将通过 blob 加载图像。
 * @param {boolean} [options.preferImageBitmap=false] 如果为真，图像将在获取期间解码并返回 <code>ImageBitmap</code>。
 * @param {boolean} [options.skipColorSpaceConversion=false] 如果为真，图像中的任何自定义伽马或色彩配置文件将被忽略。仅在请求图像且浏览器支持 <code>createImageBitmap</code> 时适用。
 * @returns {Promise<ImageBitmap|HTMLImageElement>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchImage = function (options) {
  const resource = new Resource(options);
  return resource.fetchImage({
    flipY: options.flipY,
    skipColorSpaceConversion: options.skipColorSpaceConversion,
    preferBlob: options.preferBlob,
    preferImageBitmap: options.preferImageBitmap,
  });
};

/**
 * 异步加载给定资源作为文本。返回一个承诺，一旦加载完成将解析为
 * 字符串，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @returns {Promise<string>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * // load text from a URL, setting a custom header
 * const resource = new Resource({
 *   url: 'http://someUrl.com/someJson.txt',
 *   headers: {
 *     'X-Custom-Header' : 'some value'
 *   }
 * });
 * resource.fetchText().then(function(text) {
 *     // Do something with the text
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchText = function () {
  return this.fetch({
    responseType: "text",
  });
};

/**
 * 创建一个 Resource 并调用 fetchText()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @returns {Promise<string>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchText = function (options) {
  const resource = new Resource(options);
  return resource.fetchText();
};

// note: &#42;&#47;&#42; below is */* but that ends the comment block early
/**
 * 异步加载给定资源作为 JSON。返回一个承诺，一旦加载完成将解析为
 * JSON 对象，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。如果未
 * 指定，则此函数会将 'Accept: application/json,&#42;&#47;&#42;;q=0.01' 添加到请求头。
 *
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * resource.fetchJson().then(function(jsonData) {
 *     // Do something with the JSON object
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchJson = function () {
  const promise = this.fetch({
    responseType: "text",
    headers: {
      Accept: "application/json,*/*;q=0.01",
    },
  });

  if (!defined(promise)) {
    return undefined;
  }

  return promise.then(function (value) {
    if (!defined(value)) {
      return;
    }
    return JSON.parse(value);
  });
};

/**
 * 创建一个 Resource 并调用 fetchJson()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchJson = function (options) {
  const resource = new Resource(options);
  return resource.fetchJson();
};

/**
 * 异步加载给定资源作为 XML。返回一个承诺，一旦加载完成将解析为
 * XML 文档，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @returns {Promise<XMLDocument>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load XML from a URL, setting a custom header
 * Cesium.loadXML('http://someUrl.com/someXML.xml', {
 *   'X-Custom-Header' : 'some value'
 * }).then(function(document) {
 *     // Do something with the document
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest|XMLHttpRequest}
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchXML = function () {
  return this.fetch({
    responseType: "document",
    overrideMimeType: "text/xml",
  });
};

/**
 * 创建一个 Resource 并调用 fetchXML()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @returns {Promise<XMLDocument>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchXML = function (options) {
  const resource = new Resource(options);
  return resource.fetchXML();
};

/**
 * 使用 JSONP 请求资源。
 *
 * @param {string} [callbackParameterName='callback'] 服务器期望的回调参数名称。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * // load a data asynchronously
 * resource.fetchJsonp().then(function(data) {
 *     // use the loaded data
 * }).catch(function(error) {
 *     // an error occurred
 * });
 *
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetchJsonp = function (callbackParameterName) {
  callbackParameterName = defaultValue(callbackParameterName, "callback");

  checkAndResetRequest(this.request);

  //generate a unique function name
  let functionName;
  do {
    functionName = `loadJsonp${CesiumMath.nextRandomNumber()
      .toString()
      .substring(2, 8)}`;
  } while (defined(window[functionName]));

  return fetchJsonp(this, callbackParameterName, functionName);
};

function fetchJsonp(resource, callbackParameterName, functionName) {
  const callbackQuery = {};
  callbackQuery[callbackParameterName] = functionName;
  resource.setQueryParameters(callbackQuery);

  const request = resource.request;
  const url = resource.url;
  request.url = url;
  request.requestFunction = function () {
    const deferred = defer();

    //assign a function with that name in the global scope
    window[functionName] = function (data) {
      deferred.resolve(data);

      try {
        delete window[functionName];
      } catch (e) {
        window[functionName] = undefined;
      }
    };

    Resource._Implementations.loadAndExecuteScript(url, functionName, deferred);
    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise.catch(function (e) {
    if (request.state !== RequestState.FAILED) {
      return Promise.reject(e);
    }

    return resource.retryOnError(e).then(function (retry) {
      if (retry) {
        // Reset request so it can try again
        request.state = RequestState.UNISSUED;
        request.deferred = undefined;

        return fetchJsonp(resource, callbackParameterName, functionName);
      }

      return Promise.reject(e);
    });
  });
}

/**
 * 从 URL 创建一个 Resource 并调用 fetchJsonp()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.callbackParameterName='callback'] 服务器期望的回调参数名称。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetchJsonp = function (options) {
  const resource = new Resource(options);
  return resource.fetchJsonp(options.callbackParameterName);
};

/**
 * @private
 */
Resource.prototype._makeRequest = function (options) {
  const resource = this;
  checkAndResetRequest(resource.request);

  const request = resource.request;
  const url = resource.url;
  request.url = url;

  request.requestFunction = function () {
    const responseType = options.responseType;
    const headers = combine(options.headers, resource.headers);
    const overrideMimeType = options.overrideMimeType;
    const method = options.method;
    const data = options.data;
    const deferred = defer();
    const xhr = Resource._Implementations.loadWithXhr(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType,
    );
    if (defined(xhr) && defined(xhr.abort)) {
      request.cancelFunction = function () {
        xhr.abort();
      };
    }
    return deferred.promise;
  };

  const promise = RequestScheduler.request(request);
  if (!defined(promise)) {
    return;
  }

  return promise
    .then(function (data) {
      // explicitly set to undefined to ensure GC of request response data. See #8843
      request.cancelFunction = undefined;
      return data;
    })
    .catch(function (e) {
      request.cancelFunction = undefined;
      if (request.state !== RequestState.FAILED) {
        return Promise.reject(e);
      }

      return resource.retryOnError(e).then(function (retry) {
        if (retry) {
          // Reset request so it can try again
          request.state = RequestState.UNISSUED;
          request.deferred = undefined;

          return resource.fetch(options);
        }

        return Promise.reject(e);
      });
    });
};

/**
 * 检查资源是否已经在请求中。
 *
 * @param {Request} request 要检查的请求。
 *
 * @private
 */

function checkAndResetRequest(request) {
  if (
    request.state === RequestState.ISSUED ||
    request.state === RequestState.ACTIVE
  ) {
    throw new RuntimeError("The Resource is already being fetched.");
  }

  request.state = RequestState.UNISSUED;
  request.deferred = undefined;
}

const dataUriRegex = /^data:(.*?)(;base64)?,(.*)$/;

function decodeDataUriText(isBase64, data) {
  const result = decodeURIComponent(data);
  if (isBase64) {
    return atob(result);
  }
  return result;
}

function decodeDataUriArrayBuffer(isBase64, data) {
  const byteString = decodeDataUriText(isBase64, data);
  const buffer = new ArrayBuffer(byteString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) {
    view[i] = byteString.charCodeAt(i);
  }
  return buffer;
}

function decodeDataUri(dataUriRegexResult, responseType) {
  responseType = defaultValue(responseType, "");
  const mimeType = dataUriRegexResult[1];
  const isBase64 = !!dataUriRegexResult[2];
  const data = dataUriRegexResult[3];
  let buffer;
  let parser;

  switch (responseType) {
    case "":
    case "text":
      return decodeDataUriText(isBase64, data);
    case "arraybuffer":
      return decodeDataUriArrayBuffer(isBase64, data);
    case "blob":
      buffer = decodeDataUriArrayBuffer(isBase64, data);
      return new Blob([buffer], {
        type: mimeType,
      });
    case "document":
      parser = new DOMParser();
      return parser.parseFromString(
        decodeDataUriText(isBase64, data),
        mimeType,
      );
    case "json":
      return JSON.parse(decodeDataUriText(isBase64, data));
    default:
      //>>includeStart('debug', pragmas.debug);
      throw new DeveloperError(`Unhandled responseType: ${responseType}`);
    //>>includeEnd('debug');
  }
}

/**
 * 异步加载给定资源。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。建议使用
 * 更具体的函数，例如 fetchJson、fetchBlob 等。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * resource.fetch()
 *   .then(function(body) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.fetch = function (options) {
  options = defaultClone(options, {});
  options.method = "GET";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 fetch()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.fetch = function (options) {
  const resource = new Resource(options);
  return resource.fetch({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步删除给定资源。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.delete()
 *   .then(function(body) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.delete = function (options) {
  options = defaultClone(options, {});
  options.method = "DELETE";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 delete()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.data] 与资源一起发送的数据。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.delete = function (options) {
  const resource = new Resource(options);
  return resource.delete({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
    data: options.data,
  });
};

/**
 * 异步获取给定资源的头信息。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * resource.head()
 *   .then(function(headers) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.head = function (options) {
  options = defaultClone(options, {});
  options.method = "HEAD";

  return this._makeRequest(options);
};
/**
 * 从 URL 创建一个 Resource 并调用 head()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.head = function (options) {
  const resource = new Resource(options);
  return resource.head({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};
/**
 * 异步获取给定资源的选项。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 * @example
 * resource.options()
 *   .then(function(headers) {
 *       // use the data
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.options = function (options) {
  options = defaultClone(options, {});
  options.method = "OPTIONS";

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 options()。
 *
 * @param {string|object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.options = function (options) {
  const resource = new Resource(options);
  return resource.options({
    // Make copy of just the needed fields because headers can be passed to both the constructor and to fetch
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步向给定资源发送数据。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} data 与资源一起发送的数据。
 * @param {object} [options] 具有以下属性的对象：
 * @param {object} [options.data] 与资源一起发送的数据。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.post(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.post = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "POST";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 post()。
 *
 * @param {object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发送的数据。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.post = function (options) {
  const resource = new Resource(options);
  return resource.post(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步向给定资源发送数据。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} data 与资源一起发送的数据。
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.put(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.put = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "PUT";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 put()。
 *
 * @param {object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发送的数据。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.put = function (options) {
  const resource = new Resource(options);
  return resource.put(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};

/**
 * 异步将数据修补到给定资源。返回一个承诺，一旦加载完成将解析为
 * 结果，或者在资源加载失败时拒绝。数据是使用 XMLHttpRequest 加载的，
 * 这意味着为了向其他来源发出请求，服务器必须启用跨源资源共享 (CORS) 头。
 *
 * @param {object} data 与资源一起发送的数据。
 * @param {object} [options] 具有以下属性的对象：
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {object} [options.headers] 附加的 HTTP 头，将随请求发送（如果有）。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 *
 *
 * @example
 * resource.patch(data)
 *   .then(function(result) {
 *       // use the result
 *   }).catch(function(error) {
 *       // an error occurred
 *   });
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 * @see {@link http://wiki.commonjs.org/wiki/Promises/A|CommonJS Promises/A}
 */
Resource.prototype.patch = function (data, options) {
  Check.defined("data", data);

  options = defaultClone(options, {});
  options.method = "PATCH";
  options.data = data;

  return this._makeRequest(options);
};

/**
 * 从 URL 创建一个 Resource 并调用 patch()。
 *
 * @param {object} options URL 或具有以下属性的对象
 * @param {string} options.url 资源的 URL。
 * @param {object} options.data 与资源一起发送的数据。
 * @param {object} [options.queryParameters] 一个包含在检索资源时将发送的查询参数的对象。
 * @param {object} [options.templateValues] 用于替换模板值的键/值对（例如 {x}）。
 * @param {object} [options.headers={}] 将发送的额外 HTTP 头。
 * @param {Proxy} [options.proxy] 加载资源时使用的代理。
 * @param {Resource.RetryCallback} [options.retryCallback] 当请求该资源失败时要调用的函数。如果返回 true，则会重试请求。
 * @param {number} [options.retryAttempts=0] 在放弃之前应调用 retryCallback 的次数。
 * @param {Request} [options.request] 将被使用的 Request 对象。仅供内部使用。
 * @param {string} [options.responseType] 响应的类型。控制返回的项目类型。
 * @param {string} [options.overrideMimeType] 覆盖服务器返回的 MIME 类型。
 * @returns {Promise<any>|undefined} 一个承诺，当数据加载完成时将解析为请求的数据。如果 <code>request.throttle</code> 为真且请求的优先级不够高，则返回 undefined。
 */

Resource.patch = function (options) {
  const resource = new Resource(options);
  return resource.patch(options.data, {
    // Make copy of just the needed fields because headers can be passed to both the constructor and to post
    responseType: options.responseType,
    overrideMimeType: options.overrideMimeType,
  });
};
/**
 * 包含可以在测试中替换的函数实现
 *
 * @private
 */

Resource._Implementations = {};

Resource._Implementations.loadImageElement = function (
  url,
  crossOrigin,
  deferred,
) {
  const image = new Image();

  image.onload = function () {
    // work-around a known issue with Firefox and dimensionless SVG, see:
    //   - https://github.com/whatwg/html/issues/3510
    //   - https://bugzilla.mozilla.org/show_bug.cgi?id=700533
    if (
      image.naturalWidth === 0 &&
      image.naturalHeight === 0 &&
      image.width === 0 &&
      image.height === 0
    ) {
      // these values affect rasterization and will likely mar the content
      // until Firefox takes a stance on the issue, marred content is better than no content
      // Chromium uses a more refined heuristic about its choice given nil viewBox, and a better stance and solution is
      // proposed later in the original issue thread:
      //   - Chromium behavior: https://github.com/CesiumGS/cesium/issues/9188#issuecomment-704400825
      //   - Cesium's stance/solve: https://github.com/CesiumGS/cesium/issues/9188#issuecomment-720645777
      image.width = 300;
      image.height = 150;
    }
    deferred.resolve(image);
  };

  image.onerror = function (e) {
    deferred.reject(e);
  };

  if (crossOrigin) {
    if (TrustedServers.contains(url)) {
      image.crossOrigin = "use-credentials";
    } else {
      image.crossOrigin = "";
    }
  }

  image.src = url;
};

Resource._Implementations.createImage = function (
  request,
  crossOrigin,
  deferred,
  flipY,
  skipColorSpaceConversion,
  preferImageBitmap,
) {
  const url = request.url;
  // Passing an Image to createImageBitmap will force it to run on the main thread
  // since DOM elements don't exist on workers. We convert it to a blob so it's non-blocking.
  // See:
  //    https://bugzilla.mozilla.org/show_bug.cgi?id=1044102#c38
  //    https://bugs.chromium.org/p/chromium/issues/detail?id=580202#c10
  Resource.supportsImageBitmapOptions()
    .then(function (supportsImageBitmap) {
      // We can only use ImageBitmap if we can flip on decode.
      // See: https://github.com/CesiumGS/cesium/pull/7579#issuecomment-466146898
      if (!(supportsImageBitmap && preferImageBitmap)) {
        Resource._Implementations.loadImageElement(url, crossOrigin, deferred);
        return;
      }
      const responseType = "blob";
      const method = "GET";
      const xhrDeferred = defer();
      const xhr = Resource._Implementations.loadWithXhr(
        url,
        responseType,
        method,
        undefined,
        undefined,
        xhrDeferred,
        undefined,
        undefined,
        undefined,
      );

      if (defined(xhr) && defined(xhr.abort)) {
        request.cancelFunction = function () {
          xhr.abort();
        };
      }
      return xhrDeferred.promise
        .then(function (blob) {
          if (!defined(blob)) {
            deferred.reject(
              new RuntimeError(
                `Successfully retrieved ${url} but it contained no content.`,
              ),
            );
            return;
          }

          return Resource.createImageBitmapFromBlob(blob, {
            flipY: flipY,
            premultiplyAlpha: false,
            skipColorSpaceConversion: skipColorSpaceConversion,
          });
        })
        .then(function (image) {
          deferred.resolve(image);
        });
    })
    .catch(function (e) {
      deferred.reject(e);
    });
};

/**
 * createImageBitmap 的包装器
 *
 * @private
 */

Resource.createImageBitmapFromBlob = function (blob, options) {
  Check.defined("options", options);
  Check.typeOf.bool("options.flipY", options.flipY);
  Check.typeOf.bool("options.premultiplyAlpha", options.premultiplyAlpha);
  Check.typeOf.bool(
    "options.skipColorSpaceConversion",
    options.skipColorSpaceConversion,
  );

  return createImageBitmap(blob, {
    imageOrientation: options.flipY ? "flipY" : "none",
    premultiplyAlpha: options.premultiplyAlpha ? "premultiply" : "none",
    colorSpaceConversion: options.skipColorSpaceConversion ? "none" : "default",
  });
};

function loadWithHttpRequest(
  url,
  responseType,
  method,
  data,
  headers,
  deferred,
  overrideMimeType,
) {
  // Note: only the 'json' and 'text' responseTypes transforms the loaded buffer
  fetch(url, {
    method,
    headers,
  })
    .then(async (response) => {
      if (!response.ok) {
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        deferred.reject(
          new RequestErrorEvent(response.status, response, responseHeaders),
        );
        return;
      }

      switch (responseType) {
        case "text":
          deferred.resolve(response.text());
          break;
        case "json":
          deferred.resolve(response.json());
          break;
        default:
          deferred.resolve(new Uint8Array(await response.arrayBuffer()).buffer);
          break;
      }
    })
    .catch(() => {
      deferred.reject(new RequestErrorEvent());
    });
}

const noXMLHttpRequest = typeof XMLHttpRequest === "undefined";
Resource._Implementations.loadWithXhr = function (
  url,
  responseType,
  method,
  data,
  headers,
  deferred,
  overrideMimeType,
) {
  const dataUriRegexResult = dataUriRegex.exec(url);
  if (dataUriRegexResult !== null) {
    deferred.resolve(decodeDataUri(dataUriRegexResult, responseType));
    return;
  }

  if (noXMLHttpRequest) {
    loadWithHttpRequest(
      url,
      responseType,
      method,
      data,
      headers,
      deferred,
      overrideMimeType,
    );
    return;
  }

  const xhr = new XMLHttpRequest();

  if (TrustedServers.contains(url)) {
    xhr.withCredentials = true;
  }

  xhr.open(method, url, true);

  if (defined(overrideMimeType) && defined(xhr.overrideMimeType)) {
    xhr.overrideMimeType(overrideMimeType);
  }

  if (defined(headers)) {
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }
  }

  if (defined(responseType)) {
    xhr.responseType = responseType;
  }

  // While non-standard, file protocol always returns a status of 0 on success
  let localFile = false;
  if (typeof url === "string") {
    localFile =
      url.indexOf("file://") === 0 ||
      (typeof window !== "undefined" && window.location.origin === "file://");
  }

  xhr.onload = function () {
    if (
      (xhr.status < 200 || xhr.status >= 300) &&
      !(localFile && xhr.status === 0)
    ) {
      deferred.reject(
        new RequestErrorEvent(
          xhr.status,
          xhr.response,
          xhr.getAllResponseHeaders(),
        ),
      );
      return;
    }

    const response = xhr.response;
    const browserResponseType = xhr.responseType;

    if (method === "HEAD" || method === "OPTIONS") {
      const responseHeaderString = xhr.getAllResponseHeaders();
      const splitHeaders = responseHeaderString.trim().split(/[\r\n]+/);

      const responseHeaders = {};
      splitHeaders.forEach(function (line) {
        const parts = line.split(": ");
        const header = parts.shift();
        responseHeaders[header] = parts.join(": ");
      });

      deferred.resolve(responseHeaders);
      return;
    }

    //All modern browsers will go into either the first or second if block or last else block.
    //Other code paths support older browsers that either do not support the supplied responseType
    //or do not support the xhr.response property.
    if (xhr.status === 204) {
      // accept no content
      deferred.resolve(undefined);
    } else if (
      defined(response) &&
      (!defined(responseType) || browserResponseType === responseType)
    ) {
      deferred.resolve(response);
    } else if (responseType === "json" && typeof response === "string") {
      try {
        deferred.resolve(JSON.parse(response));
      } catch (e) {
        deferred.reject(e);
      }
    } else if (
      (browserResponseType === "" || browserResponseType === "document") &&
      defined(xhr.responseXML) &&
      xhr.responseXML.hasChildNodes()
    ) {
      deferred.resolve(xhr.responseXML);
    } else if (
      (browserResponseType === "" || browserResponseType === "text") &&
      defined(xhr.responseText)
    ) {
      deferred.resolve(xhr.responseText);
    } else {
      deferred.reject(
        new RuntimeError("Invalid XMLHttpRequest response type."),
      );
    }
  };

  xhr.onerror = function (e) {
    deferred.reject(new RequestErrorEvent());
  };

  xhr.send(data);

  return xhr;
};

Resource._Implementations.loadAndExecuteScript = function (
  url,
  functionName,
  deferred,
) {
  return loadAndExecuteScript(url, functionName).catch(function (e) {
    deferred.reject(e);
  });
};
/**
 * 默认实现
 *
 * @private
 */

Resource._DefaultImplementations = {};
Resource._DefaultImplementations.createImage =
  Resource._Implementations.createImage;
Resource._DefaultImplementations.loadWithXhr =
  Resource._Implementations.loadWithXhr;
Resource._DefaultImplementations.loadAndExecuteScript =
  Resource._Implementations.loadAndExecuteScript;

/**
 * 初始化为当前浏览器位置的资源实例
 *
 * @type {Resource}
 * @constant
 */

Resource.DEFAULT = Object.freeze(
  new Resource({
    url:
      typeof document === "undefined"
        ? ""
        : document.location.href.split("?")[0],
  }),
);

/**
 * 返回属性值的函数。
 * @callback Resource.RetryCallback
 *
 * @param {Resource} [resource] 加载失败的资源。
 * @param {RequestErrorEvent} [error] 在加载资源过程中发生的错误。
 * @returns {boolean|Promise<boolean>} 如果为 true 或返回一个解析为 true 的承诺，则资源将被重试。否则将返回失败。
 */

export default Resource;
