# UniWorld project page

论文 **UniWorld: A Unified World Model for Real-Time Visual World Simulation** 的独立静态项目网页。

## 预览与部署

线上网页：[zephipage.github.io/UniWorld](https://zephipage.github.io/UniWorld/)；发布仓库：[Zephipage/UniWorld](https://github.com/Zephipage/UniWorld)。本地发布副本在 `../publish/UniWorld/`，仅包含运行文件和公开 README。

```bash
cd /data/zx/MiniMax/ICLR/iclr2027/project-page
python scripts/serve.py --port 8787
```

打开 `http://localhost:8787/`。预览服务器支持 HTTP Range，长视频可拖动进度。远程机器可转发该端口；局域网访问可加 `--host 0.0.0.0`。

部署时上传 `index.html`、`style.css`、`app.js`、`media.js`、`.nojekyll` 和整个 `assets/`。支持 GitHub Pages、Nginx 等静态托管，无需 Node 或构建。所有视频、字体、图片和 PDF 使用本地相对路径；可直接打开 `index.html`。`scripts/` 和 `verification/` 不参与页面运行。

## 当前内容

- 主论文入口指向 [arXiv:2610.32381](https://arxiv.org/abs/2610.32381)，BibTeX 包含 arXiv 编号；本地 `assets/papers/paper.pdf` 用于论文图导出与方法、补充材料页码跳转。
- 论文 Figure 1–5 直接从 PDF 渲染，保留原图内容；每张图均有 PNG 展示和矢量 PDF 下载。图像裁剪位置和文件哈希保存在本地维护目录 `verification/paper-figures.json`。
- 10 段精选画廊视频，按城市场景、风景与室内、幻想世界、日常生活筛选；支持悬停预览、弹窗、前后切换、下载。
- 画廊包含 `/data/zx/MiniMax/outputs` 的八段 DMD250 样例，以及 `/data/zx/MiniMax/thirdparty/SMD/outputs/h3_union_three_examples_14s_20261022` 的两段场景视频。
- 画廊展示单路视频；页面不展示模型、检查点、实验目录或来源标注。原始路径及导出记录仅保存在本地维护文件中。
- 论文展示视频放在封面之后，使用原始 1920×1080 版本并保留音轨。
- 保留深度/RGB 同步对比、三路引擎控制演示和 60/120 秒完整长视频。
- 表格数据与指定 PDF 对齐；DiT throughput 标明统计范围。长视频研究组别说明与论文一致。

## 更新素材

```bash
python scripts/prepare_assets.py
```

需要 Python 3、`ffmpeg`、`ffprobe`、PyMuPDF，以及 `scripts/media-selection.json` 指定的本机实验文件。该 JSON 保存样例选择；脚本生成网页视频副本、海报、封面短循环、论文展示视频、论文图和 `media.js`。脚本不会运行模型，也不会替换 `paper.pdf`。

画廊和论文展示视频使用源视频原始码流重封装，保留尺寸、音轨、帧数、时长和播放速度；封面为单独的 8 秒短循环。修改样例或源视频后，脚本会通过文件哈希决定是否重建。

页面文字与结果表在 `index.html`，样式在 `style.css`，交互在 `app.js`。完整来源、源文件与网页副本的 SHA-256、帧数、时长和处理方式在 `verification/media-manifest.json`。

## 验证

`verification/` 保存媒体完整解码、浏览器交互、页面布局、直接打开本地文件、PDF 图一致性和交付记录。检查覆盖精选画廊、分类筛选、弹窗、同步播放、长视频跳转、移动导航、减少动态效果和论文链接。

这些记录验证网页和媒体完整性；画质筛选采用抽帧人工查看，不等同于逐帧研究验收。

Mulish 字体按 SIL Open Font License 1.1 分发，见 `assets/fonts/OFL.txt`。
