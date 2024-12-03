import Uri from "urijs";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 一个单例，包含所有被信任的服务器。凭证将与
 * 对这些服务器的任何请求一起发送。
 *
 * @namespace TrustedServers
 *
 * @see {@link http://www.w3.org/TR/cors/|Cross-Origin Resource Sharing}
 */
const TrustedServers = {};
let _servers = {};

/**
 * 将一个受信任的服务器添加到注册表中。
 *
 * @param {string} host 要添加的主机。
 * @param {number} port 用于访问主机的端口。
 *
 * @example
 * // 添加一个受信任的服务器
 * TrustedServers.add('my.server.com', 80);
 */

TrustedServers.add = function (host, port) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(host)) {
    throw new DeveloperError("host is required.");
  }
  if (!defined(port) || port <= 0) {
    throw new DeveloperError("port is required to be greater than 0.");
  }
  //>>includeEnd('debug');

  const authority = `${host.toLowerCase()}:${port}`;
  if (!defined(_servers[authority])) {
    _servers[authority] = true;
  }
};

/**
 * 从注册表中移除一个受信任的服务器。
 *
 * @param {string} host 要移除的主机。
 * @param {number} port 用于访问主机的端口。
 *
 * @example
 * // 移除一个受信任的服务器
 * TrustedServers.remove('my.server.com', 80);
 */

TrustedServers.remove = function (host, port) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(host)) {
    throw new DeveloperError("host is required.");
  }
  if (!defined(port) || port <= 0) {
    throw new DeveloperError("port is required to be greater than 0.");
  }
  //>>includeEnd('debug');

  const authority = `${host.toLowerCase()}:${port}`;
  if (defined(_servers[authority])) {
    delete _servers[authority];
  }
};

function getAuthority(url) {
  const uri = new Uri(url);
  uri.normalize();

  // Removes username:password@ so we just have host[:port]
  let authority = uri.authority();
  if (authority.length === 0) {
    return undefined; // Relative URL
  }
  uri.authority(authority);

  if (authority.indexOf("@") !== -1) {
    const parts = authority.split("@");
    authority = parts[1];
  }

  // If the port is missing add one based on the scheme
  if (authority.indexOf(":") === -1) {
    let scheme = uri.scheme();
    if (scheme.length === 0) {
      scheme = window.location.protocol;
      scheme = scheme.substring(0, scheme.length - 1);
    }
    if (scheme === "http") {
      authority += ":80";
    } else if (scheme === "https") {
      authority += ":443";
    } else {
      return undefined;
    }
  }

  return authority;
}

/**
 * 测试一个服务器是否被信任。服务器必须在包含端口的情况下被添加到信任列表中。
 *
 * @param {string} url 要与受信任列表进行测试的url。
 *
 * @returns {boolean} 如果url被信任，则返回true；否则返回false。
 *
 * @example
 * // Add server
 * TrustedServers.add('my.server.com', 81);
 *
 * // Check if server is trusted
 * if (TrustedServers.contains('https://my.server.com:81/path/to/file.png')) {
 *     // my.server.com:81 is trusted
 * }
 * if (TrustedServers.contains('https://my.server.com/path/to/file.png')) {
 *     // my.server.com isn't trusted
 * }
 */
TrustedServers.contains = function (url) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(url)) {
    throw new DeveloperError("url is required.");
  }
  //>>includeEnd('debug');
  const authority = getAuthority(url);
  if (defined(authority) && defined(_servers[authority])) {
    return true;
  }

  return false;
};

/**
 * 清空注册表
 *
 * @example
 * // Remove a trusted server
 * TrustedServers.clear();
 */
TrustedServers.clear = function () {
  _servers = {};
};
export default TrustedServers;
