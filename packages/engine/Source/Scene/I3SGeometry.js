import Cartesian3 from "../Core/Cartesian3.js";
import clone from "../Core/clone.js";
import defined from "../Core/defined.js";
import Matrix3 from "../Core/Matrix3.js";
import srgbToLinear from "../Core/srgbToLinear.js";
/**
 * 该类实现了 I3S 几何体。每个 I3SGeometry
 * 生成一个内存中的 glTF，以用作 Cesium3DTile 的内容
 * <p>
 * 不要直接构造此类，而是通过 {@link I3SNode} 访问图块。
 * </p>
 * @alias I3SGeometry
 * @internalConstructor
 * @privateParam {I3SNode} parent 该几何体的父节点
 * @privateParam {string} uri 用于加载数据的 URI
 */

function I3SGeometry(parent, uri) {
  const dataProvider = parent._dataProvider;
  const layer = parent._layer;

  let resource;

  if (defined(parent._nodeIndex)) {
    resource = layer.resource.getDerivedResource({
      url: `nodes/${parent._data.mesh.geometry.resource}/${uri}`,
    });
  } else {
    resource = parent.resource.getDerivedResource({ url: uri });
  }

  this._parent = parent;
  this._dataProvider = dataProvider;
  this._layer = layer;
  this._resource = resource;

  this._customAttributes = undefined;
}

Object.defineProperties(I3SGeometry.prototype, {
  /**
   * 获取几何体的资源
   * @memberof I3SGeometry.prototype
   * @type {Resource}
   * @readonly
   */
  resource: {
    get: function () {
      return this._resource;
    },
  },

  /**
   * 获取此对象的 I3S 数据。
   * @memberof I3SGeometry.prototype
   * @type {object}
   * @readonly
   */
  data: {
    get: function () {
      return this._data;
    },
  },
  /**
   * 获取几何体的自定义属性。
   * @memberof I3SGeometry.prototype
   * @type {object}
   * @readonly
   */
  customAttributes: {
    get: function () {
      return this._customAttributes;
    },
  },
});

/**
 * 加载内容。
 * @returns {Promise<object>} 当几何体数据加载完成时解析的 Promise
 * @private
 */

I3SGeometry.prototype.load = function () {
  const that = this;
  return this._dataProvider._loadBinary(this._resource).then(function (data) {
    that._data = data;
    return data;
  });
};

const scratchAb = new Cartesian3();
const scratchAp1 = new Cartesian3();
const scratchAp2 = new Cartesian3();
const scratchCp1 = new Cartesian3();
const scratchCp2 = new Cartesian3();

function sameSide(p1, p2, a, b) {
  const ab = Cartesian3.subtract(b, a, scratchAb);
  const cp1 = Cartesian3.cross(
    ab,
    Cartesian3.subtract(p1, a, scratchAp1),
    scratchCp1,
  );
  const cp2 = Cartesian3.cross(
    ab,
    Cartesian3.subtract(p2, a, scratchAp2),
    scratchCp2,
  );
  return Cartesian3.dot(cp1, cp2) >= 0;
}

const scratchV0 = new Cartesian3();
const scratchV1 = new Cartesian3();
const scratchV2 = new Cartesian3();

const scratchV0V1 = new Cartesian3();
const scratchV0V2 = new Cartesian3();
const scratchCrossProd = new Cartesian3();
const scratchNormal = new Cartesian3();

const scratchV0p = new Cartesian3();
const scratchV1p = new Cartesian3();
const scratchV2p = new Cartesian3();

/**
 * 找到与点 [px, py, pz] 相接触的三角形，然后返回离查询点最近的顶点
 * @param {number} px 要查询的点的 x 组件
 * @param {number} py 要查询的点的 y 组件
 * @param {number} pz 要查询的点的 z 组件
 * @returns {object} 一个结构，包含最近点的索引，
 * 查询点与找到的点之间的平方距离，
 * 查询点与找到的点之间的距离，
 * 本地空间中的查询位置，
 * 本地空间中的最近位置
 */

I3SGeometry.prototype.getClosestPointIndexOnTriangle = function (px, py, pz) {
  if (
    defined(this._customAttributes) &&
    defined(this._customAttributes.positions)
  ) {
    // Convert queried position to local
    const position = new Cartesian3(px, py, pz);

    position.x -= this._customAttributes.cartesianCenter.x;
    position.y -= this._customAttributes.cartesianCenter.y;
    position.z -= this._customAttributes.cartesianCenter.z;
    Matrix3.multiplyByVector(
      this._customAttributes.parentRotation,
      position,
      position,
    );

    let bestTriDist = Number.MAX_VALUE;
    let bestTri;
    let bestDistSq;
    let bestIndex;
    let bestPt;

    // Brute force lookup, @TODO: this can be improved with a spatial partitioning search system
    const positions = this._customAttributes.positions;
    const indices = this._customAttributes.indices;

    // We may have indexed or non-indexed triangles here
    let triCount;
    if (defined(indices)) {
      triCount = indices.length;
    } else {
      triCount = positions.length / 3;
    }

    for (let triIndex = 0; triIndex < triCount; triIndex++) {
      let i0, i1, i2;
      if (defined(indices)) {
        i0 = indices[triIndex];
        i1 = indices[triIndex + 1];
        i2 = indices[triIndex + 2];
      } else {
        i0 = triIndex * 3;
        i1 = triIndex * 3 + 1;
        i2 = triIndex * 3 + 2;
      }

      const v0 = Cartesian3.fromElements(
        positions[i0 * 3],
        positions[i0 * 3 + 1],
        positions[i0 * 3 + 2],
        scratchV0,
      );
      const v1 = Cartesian3.fromElements(
        positions[i1 * 3],
        positions[i1 * 3 + 1],
        positions[i1 * 3 + 2],
        scratchV1,
      );
      const v2 = new Cartesian3(
        positions[i2 * 3],
        positions[i2 * 3 + 1],
        positions[i2 * 3 + 2],
        scratchV2,
      );

      // Check how the point is positioned relative to the triangle.
      // This will tell us whether the projection of the point in the triangle's plane lands in the triangle
      if (
        !sameSide(position, v0, v1, v2) ||
        !sameSide(position, v1, v0, v2) ||
        !sameSide(position, v2, v0, v1)
      ) {
        continue;
      }
      // Because of precision issues, we can't always reliably tell if the point lands directly on the face, so the most robust way is just to find the closest one
      const v0v1 = Cartesian3.subtract(v1, v0, scratchV0V1);
      const v0v2 = Cartesian3.subtract(v2, v0, scratchV0V2);
      const crossProd = Cartesian3.cross(v0v1, v0v2, scratchCrossProd);

      // Skip "triangles" with 3 colinear points
      if (Cartesian3.magnitude(crossProd) === 0) {
        continue;
      }
      const normal = Cartesian3.normalize(crossProd, scratchNormal);

      const v0p = Cartesian3.subtract(position, v0, scratchV0p);
      const normalDist = Math.abs(Cartesian3.dot(v0p, normal));
      if (normalDist < bestTriDist) {
        bestTriDist = normalDist;
        bestTri = triIndex;

        // Found a triangle, return the index of the closest point
        const d0 = Cartesian3.magnitudeSquared(
          Cartesian3.subtract(position, v0, v0p),
        );
        const d1 = Cartesian3.magnitudeSquared(
          Cartesian3.subtract(position, v1, scratchV1p),
        );
        const d2 = Cartesian3.magnitudeSquared(
          Cartesian3.subtract(position, v2, scratchV2p),
        );
        if (d0 < d1 && d0 < d2) {
          bestIndex = i0;
          bestPt = v0;
          bestDistSq = d0;
        } else if (d1 < d2) {
          bestIndex = i1;
          bestPt = v1;
          bestDistSq = d1;
        } else {
          bestIndex = i2;
          bestPt = v2;
          bestDistSq = d2;
        }
      }
    }

    if (defined(bestTri)) {
      return {
        index: bestIndex,
        distanceSquared: bestDistSq,
        distance: Math.sqrt(bestDistSq),
        queriedPosition: position,
        closestPosition: Cartesian3.clone(bestPt),
      };
    }
  }

  // No hits found
  return {
    index: -1,
    distanceSquared: Number.Infinity,
    distance: Number.Infinity,
  };
};

function convertColorFactor(factor) {
  const convertedFactor = [];
  const length = factor.length;
  for (let i = 0; i < length; i++) {
    if (i < 3) {
      convertedFactor.push(srgbToLinear(factor[i]));
    } else {
      convertedFactor.push(factor[i]);
    }
  }
  return convertedFactor;
}

/**
 * @private
 */
I3SGeometry.prototype._generateGltf = function (
  nodesInScene,
  nodes,
  meshes,
  buffers,
  bufferViews,
  accessors,
  extensions,
  extensionsUsed,
) {
  // Get the material definition
  let gltfMaterial = {
    pbrMetallicRoughness: {
      metallicFactor: 0.0,
    },
    doubleSided: true,
    name: "Material",
  };

  let isTextured = false;
  let materialDefinition;
  let texturePath = "";
  if (
    defined(this._parent._data.mesh) &&
    defined(this._layer._data.materialDefinitions)
  ) {
    const materialInfo = this._parent._data.mesh.material;
    const materialIndex = materialInfo.definition;
    if (
      materialIndex >= 0 &&
      materialIndex < this._layer._data.materialDefinitions.length
    ) {
      materialDefinition = this._layer._data.materialDefinitions[materialIndex];
      gltfMaterial = materialDefinition;

      if (
        defined(gltfMaterial.pbrMetallicRoughness) &&
        defined(gltfMaterial.pbrMetallicRoughness.baseColorTexture)
      ) {
        isTextured = true;
        gltfMaterial.pbrMetallicRoughness.baseColorTexture.index = 0;

        // Choose the JPG for the texture
        let textureName = "0";

        if (defined(this._layer._data.textureSetDefinitions)) {
          for (
            let defIndex = 0;
            defIndex < this._layer._data.textureSetDefinitions.length;
            defIndex++
          ) {
            const textureSetDefinition =
              this._layer._data.textureSetDefinitions[defIndex];
            for (
              let formatIndex = 0;
              formatIndex < textureSetDefinition.formats.length;
              formatIndex++
            ) {
              const textureFormat = textureSetDefinition.formats[formatIndex];
              if (textureFormat.format === "jpg") {
                textureName = textureFormat.name;
                break;
              }
            }
          }
        }

        if (
          defined(this._parent._data.mesh) &&
          this._parent._data.mesh.material.resource >= 0
        ) {
          texturePath = this._layer.resource.getDerivedResource({
            url: `nodes/${this._parent._data.mesh.material.resource}/textures/${textureName}`,
          }).url;
        }
      }

      // Convert color factors from sRGB to linear color space
      if (
        defined(gltfMaterial.pbrMetallicRoughness) &&
        defined(gltfMaterial.pbrMetallicRoughness.baseColorFactor)
      ) {
        gltfMaterial.pbrMetallicRoughness.baseColorFactor = convertColorFactor(
          gltfMaterial.pbrMetallicRoughness.baseColorFactor,
        );
      }
      if (defined(gltfMaterial.emissiveFactor)) {
        gltfMaterial.emissiveFactor = convertColorFactor(
          gltfMaterial.emissiveFactor,
        );
      }
    }
  } else if (defined(this._parent._data.textureData)) {
    // No material definition, but if there's a texture reference, we can create a simple material using it (version 1.6 support)
    isTextured = true;
    texturePath = this._parent.resource.getDerivedResource({
      url: `${this._parent._data.textureData[0].href}`,
    }).url;
    gltfMaterial.pbrMetallicRoughness.baseColorTexture = { index: 0 };
  }
  if (defined(gltfMaterial.alphaMode)) {
    // I3S specifies alphaMode values in lowercase, but glTF expects values in uppercase
    gltfMaterial.alphaMode = gltfMaterial.alphaMode.toUpperCase();
  }

  let gltfTextures = [];
  let gltfImages = [];
  let gltfSamplers = [];

  if (isTextured) {
    gltfTextures = [
      {
        sampler: 0,
        source: 0,
      },
    ];

    gltfImages = [
      {
        uri: texturePath,
      },
    ];

    gltfSamplers = [
      {
        magFilter: 9729,
        minFilter: 9986,
        wrapS: 10497,
        wrapT: 10497,
      },
    ];
  }

  const gltfMaterials = [];
  const meshesLength = meshes.length;
  for (let meshIndex = 0; meshIndex < meshesLength; meshIndex++) {
    const primitives = meshes[meshIndex].primitives;
    const primitivesLength = primitives.length;
    for (
      let primitiveIndex = 0;
      primitiveIndex < primitivesLength;
      primitiveIndex++
    ) {
      const primitive = primitives[primitiveIndex];
      if (defined(primitive.material)) {
        // Create as many copies of the material as specified in the mesh primitives
        while (primitive.material >= gltfMaterials.length) {
          const material = clone(gltfMaterial, true);
          gltfMaterials.push(material);
        }
        const primitiveMaterial = gltfMaterials[primitive.material];
        if (defined(primitive.extra) && primitive.extra.isTransparent) {
          // If the alpha mode is not specified in the original material but the geometry is transparent, we need to force set BLEND alpha mode. Otherwise the geometry will be rendered opaque.
          if (!defined(primitiveMaterial.alphaMode)) {
            primitiveMaterial.alphaMode = "BLEND";
          }
        } else if (primitiveMaterial.alphaMode === "BLEND") {
          // If the geometry is not transparent, but the alpha mode is set to BLEND in the original material, we need to force set OPAQUE alpha mode. Otherwise the geometry will be rendered transparent.
          primitiveMaterial.alphaMode = "OPAQUE";
        }
      }
    }
  }
  const gltfData = {
    scene: 0,
    scenes: [
      {
        nodes: nodesInScene,
      },
    ],
    nodes: nodes,
    meshes: meshes,
    buffers: buffers,
    bufferViews: bufferViews,
    accessors: accessors,
    materials: gltfMaterials,
    textures: gltfTextures,
    images: gltfImages,
    samplers: gltfSamplers,
    asset: {
      version: "2.0",
    },
    extensions: extensions,
    extensionsUsed: extensionsUsed,
  };

  return gltfData;
};

export default I3SGeometry;
