# 毕业留痕，以物换忆｜部署说明

这是一个纯前端版本的毕业照片星球互动大屏。

## 文件说明

```text
index.html              毕业生扫码上传页
screen.html             大屏展示页
config.js               Supabase 配置
supabase_setup.sql      Supabase 初始化 SQL
css/style.css           页面样式
js/upload.js            上传页逻辑
js/screen.js            大屏逻辑
常见问题排查.md          报错时查看
```

## 整体架构

```text
毕业生手机打开 index.html
  ↓
上传照片到 Supabase Storage
  ↓
往 Supabase photos 表插入记录
  ↓
screen.html 通过 Supabase Realtime 监听 INSERT
  ↓
大屏展示 5 秒仪式动画
  ↓
照片飞入 3D 研途星球
```

---

## 第一步：创建 Supabase 项目

1. 登录 Supabase。
2. New Project 新建项目。
3. 创建成功后进入项目后台。
4. 进入：

```text
Project Settings → API
```

复制：

```text
Project URL
anon public key
```

注意：只能使用 anon public key，不要使用 service_role key。

---

## 第二步：执行 SQL

进入：

```text
SQL Editor → New query
```

把 `supabase_setup.sql` 全部复制进去，点击 Run。

执行后会自动创建：

```text
photos 数据表
graduation-photos 存储桶
匿名上传权限
匿名读取权限
Realtime 监听
```

---

## 第三步：填写 config.js

打开 `config.js`，把这里替换成你自己的 Supabase 配置：

```js
window.GRADUATION_CONFIG = {
  supabaseUrl: "https://你的项目ID.supabase.co",
  supabaseAnonKey: "替换成你的 anon public key",
  bucketName: "graduation-photos",
  tableName: "photos"
};
```

只需要改前两项：

```text
supabaseUrl
supabaseAnonKey
```

---

## 第四步：本地测试

建议用 VS Code 的 Live Server 插件打开项目。

或者在项目目录运行：

```bash
python -m http.server 8080
```

然后访问：

```text
上传页：http://localhost:8080/
大屏页：http://localhost:8080/screen.html
```

测试方式：

```text
1. 电脑打开 screen.html
2. 另开一个浏览器窗口打开 index.html
3. 上传一张照片
4. 看大屏是否出现 5 秒仪式动画
5. 看照片是否飞入 3D 球形照片墙
```

---

## 第五步：部署到 Vercel

1. 登录 Vercel。
2. Add New Project。
3. 选择上传本项目文件夹，或从 GitHub 导入。
4. Framework Preset 选 Other。
5. Build Command 留空。
6. Output Directory 留空或填 `.`。
7. 点击 Deploy。

部署完成后会得到一个链接，例如：

```text
https://graduation-memory-wall.vercel.app
```

---

## 第六步：正式使用链接

学生扫码上传页：

```text
https://你的项目.vercel.app/
```

大屏展示页：

```text
https://你的项目.vercel.app/screen.html
```

二维码内容应该填写上传页：

```text
https://你的项目.vercel.app/
```

不要把二维码指向 `screen.html`，因为 `screen.html` 是大屏展示页。

---

## 现场使用流程

```text
1. 大屏电脑打开 https://你的项目.vercel.app/screen.html
2. 浏览器按 F11 全屏
3. 学生扫码进入 https://你的项目.vercel.app/
4. 学生上传照片
5. 手机端出现上传成功仪式
6. 大屏端自动弹出照片展示 5 秒
7. 照片飞入 3D 研途星球
8. 右侧实时记录更新
```

---

## 大屏控制按钮

```text
隐藏记录：隐藏右侧实时上传记录
隐藏二维码：隐藏大屏二维码
暂停旋转：暂停 3D 照片球
减速 / 加速：调整旋转速度
聚焦最新：让最新上传照片高亮定位
全屏：进入浏览器全屏
```

---

## 修改主题文字

打开 `config.js` 修改：

```js
themeTitle: "毕业留痕，以物换忆",
collegeName: "长沙理工大学交通学院硕士毕业纪念互动墙",
screenTitle: "毕业留痕，以物换忆",
screenSubtitle: "长沙理工大学交通学院硕士毕业纪念互动墙"
```

---

## 修改背景标志建筑

背景圆形线稿在：

```text
js/screen.js
```

搜索：

```js
createLandmarkLayer
```

里面已有：

```text
长理学校校门
年轮广场
九云方鼎
图书馆
云影湖
工科二楼
```

可以改位置：

```js
x: "6%",
y: "14%",
size: 176
```

---

## 清空测试照片

在 Supabase 后台：

```text
Table Editor → photos
```

删除测试数据。

Storage 里也可以删除：

```text
Storage → graduation-photos → uploads
```
