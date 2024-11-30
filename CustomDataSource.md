# CustomDataSource

## 简介

`CustomDataSource` 是 Cesium 中一个强大的工具，它允许用户方便地管理自定义的数据源，如线条、点和广告牌等。通过使用 `CustomDataSource`，您可以轻松地添加、修改和删除这些可视化元素。

### 创建数据源

首先，您需要创建一个 `CustomDataSource` 实例：

```javascript
const dataSource = new Cesium.CustomDataSource("myData");
```

### 添加实体

- 接下来，您可以向数据源中添加实体。以下是一个添加带有图片的广告牌实体的例子：

```javascript
dataSource.entities.add({
  position: Cesium.Cartesian3.fromDegrees(1, 2, 0),
  id: "billboard",
  billboard: {
    image: "image.png",
    scale: 1.0,
  },
});
// 将数据源添加到视图中
viewer.dataSources.add(dataSource);
```

### 修改实体属性

- 如果您需要修改某个实体的属性，例如改变广告牌的缩放比例，可以这样做：

```javascript
const entity = dataSource.entities.getById("billboard");
if (entity) {
  entity.billboard.scale = 2.0;
}
```

### 删除实体

- 要删除一个实体，您可以通过以下方式：

```javascript
const entity = dataSource.entities.getById("billboard");
if (entity) {
  dataSource.entities.remove(entity);
}
```

### 清空所有实体

- 如果您需要删除数据源中的所有实体，可以使用 removeAll 方法：

```javascript
dataSource.entities.removeAll();
```

参考资料:

- [CustomDataSource](https://cesium.com/docs/cesiumjs-ref-doc/CustomDataSource.html)

- [CustomDataSource](https://blog.chaoyang1024.top:1996/CustomDataSource.html?classFilter=CustomDataSource)
