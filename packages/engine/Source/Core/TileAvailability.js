import binarySearch from "./binarySearch.js";
import Cartographic from "./Cartographic.js";
import defined from "./defined.js";
import Rectangle from "./Rectangle.js";

/**
 * 报告{@link TilingScheme}中瓦片的可用性。
 *
 * @alias TileAvailability
 * @constructor
 *
 * @param {TilingScheme} tilingScheme 报告可用性的瓦片方案。
 * @param {number} maximumLevel 潜在可用的最大瓦片级别。
 */

function TileAvailability(tilingScheme, maximumLevel) {
  this._tilingScheme = tilingScheme;
  this._maximumLevel = maximumLevel;

  this._rootNodes = [];
}

const rectangleScratch = new Rectangle();

function findNode(level, x, y, nodes) {
  const count = nodes.length;
  for (let i = 0; i < count; ++i) {
    const node = nodes[i];
    if (node.x === x && node.y === y && node.level === level) {
      return true;
    }
  }

  return false;
}

/**
 * 标记特定级别中一系列矩形瓦片为可用。为了获得最佳性能,
 * 请按级别递增的顺序添加您的范围。
 *
 * @param {number} level 级别。
 * @param {number} startX 该级别中第一个可用瓦片的X坐标。
 * @param {number} startY 该级别中第一个可用瓦片的Y坐标。
 * @param {number} endX 该级别中最后一个可用瓦片的X坐标。
 * @param {number} endY 该级别中最后一个可用瓦片的Y坐标。
 */

TileAvailability.prototype.addAvailableTileRange = function (
  level,
  startX,
  startY,
  endX,
  endY,
) {
  const tilingScheme = this._tilingScheme;

  const rootNodes = this._rootNodes;
  if (level === 0) {
    for (let y = startY; y <= endY; ++y) {
      for (let x = startX; x <= endX; ++x) {
        if (!findNode(level, x, y, rootNodes)) {
          rootNodes.push(new QuadtreeNode(tilingScheme, undefined, 0, x, y));
        }
      }
    }
  }

  tilingScheme.tileXYToRectangle(startX, startY, level, rectangleScratch);
  const west = rectangleScratch.west;
  const north = rectangleScratch.north;

  tilingScheme.tileXYToRectangle(endX, endY, level, rectangleScratch);
  const east = rectangleScratch.east;
  const south = rectangleScratch.south;

  const rectangleWithLevel = new RectangleWithLevel(
    level,
    west,
    south,
    east,
    north,
  );

  for (let i = 0; i < rootNodes.length; ++i) {
    const rootNode = rootNodes[i];
    if (rectanglesOverlap(rootNode.extent, rectangleWithLevel)) {
      putRectangleInQuadtree(this._maximumLevel, rootNode, rectangleWithLevel);
    }
  }
};

/**
 * 确定覆盖该位置的最高详细级别瓦片的级别。此函数
 * 通常在添加的矩形数目上以对数时间完成，使用 {@link TileAvailability#addAvailableTileRange}。
 *
 * @param {Cartographic} position 要确定最大可用级别的位置。高度分量被忽略。
 * @return {number} 覆盖该位置的最高详细级别瓦片的级别。
 * @throws {DeveloperError} 如果位置超出了任何根据瓦片方案的瓦片范围。
 */

TileAvailability.prototype.computeMaximumLevelAtPosition = function (position) {
  // Find the root node that contains this position.
  let node;
  for (let nodeIndex = 0; nodeIndex < this._rootNodes.length; ++nodeIndex) {
    const rootNode = this._rootNodes[nodeIndex];
    if (rectangleContainsPosition(rootNode.extent, position)) {
      node = rootNode;
      break;
    }
  }

  if (!defined(node)) {
    return -1;
  }

  return findMaxLevelFromNode(undefined, node, position);
};

const rectanglesScratch = [];
const remainingToCoverByLevelScratch = [];
const westScratch = new Rectangle();
const eastScratch = new Rectangle();

/**
 * 寻找在给定矩形内 _处处_ 可用的最高详细级别。可能在矩形的部分区域中有更详细的
 * 瓦片，但在整个区域内并不一定可用。该函数的返回值可以安全地传递给
 * {@link sampleTerrain} 用于矩形内的任何位置。此函数
 * 通常在添加的矩形数量上以对数时间完成，使用 {@link TileAvailability#addAvailableTileRange}。
 *
 * @param {Rectangle} rectangle 矩形。
 * @return {number} 整个矩形的最佳可用级别。
 */

TileAvailability.prototype.computeBestAvailableLevelOverRectangle = function (
  rectangle,
) {
  const rectangles = rectanglesScratch;
  rectangles.length = 0;

  if (rectangle.east < rectangle.west) {
    // Rectangle crosses the IDL, make it two rectangles.
    rectangles.push(
      Rectangle.fromRadians(
        -Math.PI,
        rectangle.south,
        rectangle.east,
        rectangle.north,
        westScratch,
      ),
    );
    rectangles.push(
      Rectangle.fromRadians(
        rectangle.west,
        rectangle.south,
        Math.PI,
        rectangle.north,
        eastScratch,
      ),
    );
  } else {
    rectangles.push(rectangle);
  }

  const remainingToCoverByLevel = remainingToCoverByLevelScratch;
  remainingToCoverByLevel.length = 0;

  let i;
  for (i = 0; i < this._rootNodes.length; ++i) {
    updateCoverageWithNode(
      remainingToCoverByLevel,
      this._rootNodes[i],
      rectangles,
    );
  }

  for (i = remainingToCoverByLevel.length - 1; i >= 0; --i) {
    if (
      defined(remainingToCoverByLevel[i]) &&
      remainingToCoverByLevel[i].length === 0
    ) {
      return i;
    }
  }

  return 0;
};

const cartographicScratch = new Cartographic();

/**
 * 确定特定瓦片是否可用。
 * @param {number} level 要检查的瓦片级别。
 * @param {number} x 要检查的瓦片的X坐标。
 * @param {number} y 要检查的瓦片的Y坐标。
 * @return {boolean} 如果瓦片可用，则返回true；否则返回false。
 */

TileAvailability.prototype.isTileAvailable = function (level, x, y) {
  // Get the center of the tile and find the maximum level at that position.
  // Because availability is by tile, if the level is available at that point, it
  // is sure to be available for the whole tile.  We assume that if a tile at level n exists,
  // then all its parent tiles back to level 0 exist too.  This isn't really enforced
  // anywhere, but Cesium would never load a tile for which this is not true.
  const rectangle = this._tilingScheme.tileXYToRectangle(
    x,
    y,
    level,
    rectangleScratch,
  );
  Rectangle.center(rectangle, cartographicScratch);
  return this.computeMaximumLevelAtPosition(cartographicScratch) >= level;
};

/**
 * 计算一个位掩码，用于指示瓦片的四个子瓦片中哪些存在。
 * 如果子瓦片的位被设置，则表示该子瓦片可用。如果被清除，
 * 则表示该子瓦片不可用。位值如下：
 * <table>
 *     <tr><th>位位置</th><th>位值</th><th>子瓦片</th></tr>
 *     <tr><td>0</td><td>1</td><td>西南</td></tr>
 *     <tr><td>1</td><td>2</td><td>东南</td></tr>
 *     <tr><td>2</td><td>4</td><td>西北</td></tr>
 *     <tr><td>3</td><td>8</td><td>东北</td></tr>
 * </table>
 *
 * @param {number} level 父瓦片的级别。
 * @param {number} x 父瓦片的X坐标。
 * @param {number} y 父瓦片的Y坐标。
 * @return {number} 指示子瓦片可用性的位掩码。
 */

TileAvailability.prototype.computeChildMaskForTile = function (level, x, y) {
  const childLevel = level + 1;
  if (childLevel >= this._maximumLevel) {
    return 0;
  }

  let mask = 0;

  mask |= this.isTileAvailable(childLevel, 2 * x, 2 * y + 1) ? 1 : 0;
  mask |= this.isTileAvailable(childLevel, 2 * x + 1, 2 * y + 1) ? 2 : 0;
  mask |= this.isTileAvailable(childLevel, 2 * x, 2 * y) ? 4 : 0;
  mask |= this.isTileAvailable(childLevel, 2 * x + 1, 2 * y) ? 8 : 0;

  return mask;
};

function QuadtreeNode(tilingScheme, parent, level, x, y) {
  this.tilingScheme = tilingScheme;
  this.parent = parent;
  this.level = level;
  this.x = x;
  this.y = y;
  this.extent = tilingScheme.tileXYToRectangle(x, y, level);

  this.rectangles = [];
  this._sw = undefined;
  this._se = undefined;
  this._nw = undefined;
  this._ne = undefined;
}

Object.defineProperties(QuadtreeNode.prototype, {
  nw: {
    get: function () {
      if (!this._nw) {
        this._nw = new QuadtreeNode(
          this.tilingScheme,
          this,
          this.level + 1,
          this.x * 2,
          this.y * 2,
        );
      }
      return this._nw;
    },
  },

  ne: {
    get: function () {
      if (!this._ne) {
        this._ne = new QuadtreeNode(
          this.tilingScheme,
          this,
          this.level + 1,
          this.x * 2 + 1,
          this.y * 2,
        );
      }
      return this._ne;
    },
  },

  sw: {
    get: function () {
      if (!this._sw) {
        this._sw = new QuadtreeNode(
          this.tilingScheme,
          this,
          this.level + 1,
          this.x * 2,
          this.y * 2 + 1,
        );
      }
      return this._sw;
    },
  },

  se: {
    get: function () {
      if (!this._se) {
        this._se = new QuadtreeNode(
          this.tilingScheme,
          this,
          this.level + 1,
          this.x * 2 + 1,
          this.y * 2 + 1,
        );
      }
      return this._se;
    },
  },
});

function RectangleWithLevel(level, west, south, east, north) {
  this.level = level;
  this.west = west;
  this.south = south;
  this.east = east;
  this.north = north;
}

function rectanglesOverlap(rectangle1, rectangle2) {
  const west = Math.max(rectangle1.west, rectangle2.west);
  const south = Math.max(rectangle1.south, rectangle2.south);
  const east = Math.min(rectangle1.east, rectangle2.east);
  const north = Math.min(rectangle1.north, rectangle2.north);
  return south < north && west < east;
}

function putRectangleInQuadtree(maxDepth, node, rectangle) {
  while (node.level < maxDepth) {
    if (rectangleFullyContainsRectangle(node.nw.extent, rectangle)) {
      node = node.nw;
    } else if (rectangleFullyContainsRectangle(node.ne.extent, rectangle)) {
      node = node.ne;
    } else if (rectangleFullyContainsRectangle(node.sw.extent, rectangle)) {
      node = node.sw;
    } else if (rectangleFullyContainsRectangle(node.se.extent, rectangle)) {
      node = node.se;
    } else {
      break;
    }
  }

  if (
    node.rectangles.length === 0 ||
    node.rectangles[node.rectangles.length - 1].level <= rectangle.level
  ) {
    node.rectangles.push(rectangle);
  } else {
    // Maintain ordering by level when inserting.
    let index = binarySearch(
      node.rectangles,
      rectangle.level,
      rectangleLevelComparator,
    );
    if (index < 0) {
      index = ~index;
    }
    node.rectangles.splice(index, 0, rectangle);
  }
}

function rectangleLevelComparator(a, b) {
  return a.level - b;
}

function rectangleFullyContainsRectangle(potentialContainer, rectangleToTest) {
  return (
    rectangleToTest.west >= potentialContainer.west &&
    rectangleToTest.east <= potentialContainer.east &&
    rectangleToTest.south >= potentialContainer.south &&
    rectangleToTest.north <= potentialContainer.north
  );
}

function rectangleContainsPosition(potentialContainer, positionToTest) {
  return (
    positionToTest.longitude >= potentialContainer.west &&
    positionToTest.longitude <= potentialContainer.east &&
    positionToTest.latitude >= potentialContainer.south &&
    positionToTest.latitude <= potentialContainer.north
  );
}

function findMaxLevelFromNode(stopNode, node, position) {
  let maxLevel = 0;

  // Find the deepest quadtree node containing this point.
  let found = false;
  while (!found) {
    const nw = node._nw && rectangleContainsPosition(node._nw.extent, position);
    const ne = node._ne && rectangleContainsPosition(node._ne.extent, position);
    const sw = node._sw && rectangleContainsPosition(node._sw.extent, position);
    const se = node._se && rectangleContainsPosition(node._se.extent, position);

    // The common scenario is that the point is in only one quadrant and we can simply
    // iterate down the tree.  But if the point is on a boundary between tiles, it is
    // in multiple tiles and we need to check all of them, so use recursion.
    if (nw + ne + sw + se > 1) {
      if (nw) {
        maxLevel = Math.max(
          maxLevel,
          findMaxLevelFromNode(node, node._nw, position),
        );
      }
      if (ne) {
        maxLevel = Math.max(
          maxLevel,
          findMaxLevelFromNode(node, node._ne, position),
        );
      }
      if (sw) {
        maxLevel = Math.max(
          maxLevel,
          findMaxLevelFromNode(node, node._sw, position),
        );
      }
      if (se) {
        maxLevel = Math.max(
          maxLevel,
          findMaxLevelFromNode(node, node._se, position),
        );
      }
      break;
    } else if (nw) {
      node = node._nw;
    } else if (ne) {
      node = node._ne;
    } else if (sw) {
      node = node._sw;
    } else if (se) {
      node = node._se;
    } else {
      found = true;
    }
  }

  // Work up the tree until we find a rectangle that contains this point.
  while (node !== stopNode) {
    const rectangles = node.rectangles;

    // Rectangles are sorted by level, lowest first.
    for (
      let i = rectangles.length - 1;
      i >= 0 && rectangles[i].level > maxLevel;
      --i
    ) {
      const rectangle = rectangles[i];
      if (rectangleContainsPosition(rectangle, position)) {
        maxLevel = rectangle.level;
      }
    }

    node = node.parent;
  }

  return maxLevel;
}

function updateCoverageWithNode(
  remainingToCoverByLevel,
  node,
  rectanglesToCover,
) {
  if (!node) {
    return;
  }

  let i;
  let anyOverlap = false;
  for (i = 0; i < rectanglesToCover.length; ++i) {
    anyOverlap =
      anyOverlap || rectanglesOverlap(node.extent, rectanglesToCover[i]);
  }

  if (!anyOverlap) {
    // This node is not applicable to the rectangle(s).
    return;
  }

  const rectangles = node.rectangles;
  for (i = 0; i < rectangles.length; ++i) {
    const rectangle = rectangles[i];

    if (!remainingToCoverByLevel[rectangle.level]) {
      remainingToCoverByLevel[rectangle.level] = rectanglesToCover;
    }

    remainingToCoverByLevel[rectangle.level] = subtractRectangle(
      remainingToCoverByLevel[rectangle.level],
      rectangle,
    );
  }

  // Update with child nodes.
  updateCoverageWithNode(remainingToCoverByLevel, node._nw, rectanglesToCover);
  updateCoverageWithNode(remainingToCoverByLevel, node._ne, rectanglesToCover);
  updateCoverageWithNode(remainingToCoverByLevel, node._sw, rectanglesToCover);
  updateCoverageWithNode(remainingToCoverByLevel, node._se, rectanglesToCover);
}

function subtractRectangle(rectangleList, rectangleToSubtract) {
  const result = [];
  for (let i = 0; i < rectangleList.length; ++i) {
    const rectangle = rectangleList[i];
    if (!rectanglesOverlap(rectangle, rectangleToSubtract)) {
      // Disjoint rectangles.  Original rectangle is unmodified.
      result.push(rectangle);
    } else {
      // rectangleToSubtract partially or completely overlaps rectangle.
      if (rectangle.west < rectangleToSubtract.west) {
        result.push(
          new Rectangle(
            rectangle.west,
            rectangle.south,
            rectangleToSubtract.west,
            rectangle.north,
          ),
        );
      }
      if (rectangle.east > rectangleToSubtract.east) {
        result.push(
          new Rectangle(
            rectangleToSubtract.east,
            rectangle.south,
            rectangle.east,
            rectangle.north,
          ),
        );
      }
      if (rectangle.south < rectangleToSubtract.south) {
        result.push(
          new Rectangle(
            Math.max(rectangleToSubtract.west, rectangle.west),
            rectangle.south,
            Math.min(rectangleToSubtract.east, rectangle.east),
            rectangleToSubtract.south,
          ),
        );
      }
      if (rectangle.north > rectangleToSubtract.north) {
        result.push(
          new Rectangle(
            Math.max(rectangleToSubtract.west, rectangle.west),
            rectangleToSubtract.north,
            Math.min(rectangleToSubtract.east, rectangle.east),
            rectangle.north,
          ),
        );
      }
    }
  }

  return result;
}
export default TileAvailability;
