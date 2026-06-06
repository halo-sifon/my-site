---
name: design-audit
description: Check uncommitted changes against DESIGN.md specifications. Use when asked to audit code changes for design compliance, check styling standards, or validate CSS/Tailwind usage before commit.
---

# Design Audit Skill

检查未提交的代码更改是否符合 DESIGN.md 定义的设计规范，识别违规项并生成修复计划。

## When to Use

- 用户要求检查未提交更改的设计合规性
- 用户想验证样式是否符合 Apple 设计规范
- 提交代码前的设计规范审查
- 检查亮/暗模式下的可读性

## Workflow

### 1. 收集变更文件

```bash
git diff --name-only
git diff --name-only --cached
```

筛选出包含样式的文件：
- `*.tsx`, `*.jsx` - 组件文件
- `app/globals.css` - Tailwind 配置

### 2. 读取设计规范

读取 `DESIGN.md` 作为规范依据，重点关注：

**颜色系统**
- 品牌色：`#0066cc` (primary), `#0071e3` (focus), `#2997ff` (on-dark)
- 表面色：canvas, parchment, tile-1/2/3, black
- 文本色：ink, body, body-on-dark, muted
- 边框色：divider-soft, hairline

**排版规范**
- 字体族：SF Pro Display (标题), SF Pro Text (正文)
- 字号：10/12/14/17/18/21/24/28/34/40/56px
- 字重：300/400/600/700 (无 500)
- 行高：根据 token 定义
- 字间距：display 尺寸需负值 tracking

**圆角规范**
- none: 0px (全幅 tiles)
- xs: 5px, sm: 8px, md: 11px, lg: 18px
- pill: 9999px (CTA 按钮)

**禁止项**
- ❌ 给卡片、按钮、文字添加 shadow（shadow 仅用于产品图片）
- ❌ 使用第二个强调色（只有 primary blue）
- ❌ 装饰性渐变
- ❌ 字重 500
- ❌ body 字号非 17px
- ❌ 在亮色表面使用 `primary-on-dark`

### 3. 分析变更内容

对每个变更文件：

1. 提取 Tailwind 类名和 CSS 属性
2. 检查硬编码值（颜色、尺寸等）
3. 验证是否使用设计 token
4. 检查亮/暗模式对比度是否足够

**检查规则**

| 检查项 | 合规标准 | 违规示例 |
|--------|----------|----------|
| 颜色 | 使用 Tailwind token + `dark:` 前缀 | `style={{ color: 'var(--...)' }}` |
| 字号 | 使用 token 尺寸 | `text-[18px]`, `text-3xl` |
| 字重 | 300/400/600/700 | `font-medium` (500) |
| 圆角 | token 值或 Tailwind class | `rounded-[13px]` |
| 阴影 | 仅产品图片可用 | `shadow-lg` 在按钮上 |
| 渐变 | 无装饰性渐变 | `bg-gradient-to-r` |
| 间距 | 使用 token 值 | `mb-4`, `p-6` (应为 `mb-md`, `p-lg`) |

**最佳实践**
- 使用 Tailwind utility classes + `dark:` 前缀处理暗模式，而非 `style={{ ... }}` 内联 CSS 变量
- 示例：`text-ink-muted-48 dark:text-body-muted` 而非 `style={{ color: 'var(--foreground-muted)' }}`
- 全局背景色在 `globals.css` 的 `:root` 中定义，组件无需重复设置
- 检查背景色时，区分「删除冗余背景」和「缺少必要背景」

### 4. 生成修复计划

如果发现违规项，在 `docs/` 目录下创建修复计划文档：

**文件命名**：`docs/design-audit-{YYYY-MM-DD}.md`

**文档结构**：

```markdown
# 设计规范审计报告

**日期**: {date}
**检查范围**: {changed files}

## 违规项汇总

| 文件 | 违规数 | 严重程度 |
|------|--------|----------|
| ... | ... | ... |

## 详细问题

### {filename}

#### 问题 1: {问题标题}
- **位置**: 行 {line}, `{code snippet}`
- **违规**: {违规描述}
- **规范**: {正确做法}
- **修复建议**:
  ```diff
  - {current code}
  + {suggested fix}
  ```

（重复每个问题）

## 修复优先级

1. **高**: 影响可读性/可访问性的问题
2. **中**: 偏离设计规范
3. **低**: 建议优化项

## 下一步行动

- [ ] {action item 1}
- [ ] {action item 2}
```

### 5. 输出结果

完成检查后，向用户报告：

1. 检查了多少文件
2. 发现多少违规项
3. 修复计划保存位置
4. 是否可以提交（无违规 / 需修复后提交）

## Token Reference

从 `globals.css` 和 `DESIGN.md` 提取的可用 token：

**Tailwind 颜色类**:
- `bg-primary`, `text-primary`, `border-primary`
- `bg-canvas`, `bg-canvas-parchment`, `bg-surface-pearl`
- `bg-surface-tile-1/2/3`, `bg-surface-black`
- `text-ink`, `text-body`, `text-body-on-dark`, `text-body-muted`

**Tailwind 排版类**:
- `text-hero-display`, `text-display-lg/md`
- `text-lead`, `text-lead-airy`, `text-tagline`
- `text-body`, `text-body-strong`, `text-dense-link`
- `text-caption`, `text-caption-strong`
- `text-button-large`, `text-button-utility`
- `text-fine-print`, `text-micro-legal`, `text-nav-link`

**Tailwind 圆角类**:
- `rounded-none`, `rounded-xs`, `rounded-sm`
- `rounded-md`, `rounded-lg`, `rounded-pill`, `rounded-full`

**组件工具类**:
- `btn-primary`, `btn-secondary-pill`, `btn-dark-utility`
- `btn-pearl-capsule`, `btn-store-hero`, `btn-icon-circular`
- `text-link`, `text-link-on-dark`
- `global-nav`, `sub-nav-frosted`
- `product-tile-light/dark/parchment`
- `store-utility-card`, `configurator-chip`
- `search-input`, `floating-sticky-bar`, `footer-apple`
- `shadow-product`

## Example Output

```
✓ 检查完成

检查文件: 3 个
发现违规: 5 项

违规分布:
- 颜色硬编码: 2 处
- 非法字重: 1 处
- 阴影滥用: 1 处
- 对比度不足: 1 处

修复计划已保存至: docs/design-audit-2026-06-06.md

⚠️ 建议修复后提交
```

## Notes

- 只检查未提交的更改，不检查整个代码库
- 如果 `DESIGN.md` 不存在，提示用户并退出
- 对于不确定的情况，标注为"建议人工确认"
- 修复建议应尽量提供可复制的代码
