# 卜卦小程序方案

## 一、产品概述
- **名称**：待定（建议：天机、问卦、卦象）
- **定位**：个人自用的卜卦工具，支持分享给朋友体验
- **平台**：微信小程序（先做小程序，后续可 uni-app 跨平台）

## 二、功能列表

### 核心功能
| 功能 | 说明 |
|------|------|
| 六爻起卦 | 模拟摇铜钱，动画效果，生成六爻卦象 |
| AI 解卦 | 调用小狗解读卦象，结合用户提问给出分析 |
| 每日运势 | 基于日期自动起卦，简短运势提示 |
| 历史记录 | 本地存储过往卦象和解读 |

### 权限控制
| 配置项 | 说明 |
|------|------|
| ignoreFilter | true=所有人可用AI解卦，false=仅白名单 |
| enableList | 白名单用户列表 |

初期 `ignoreFilter=true`，后续可收紧。

## 三、页面设计

### 1. 首页（index）
- 每日运势卡片（自动生成，基于当天日期）
- "开始起卦"按钮
- 底部：历史记录入口

### 2. 起卦页（divine）
- **仪式引导**：进入页面先显示引导语，提醒用户静心
  - "请放空心绪，专注于你想问的事情..."
  - 配合缓慢呼吸动画（圆圈缩放）或烟雾/香炉效果
  - 3-5秒沉浸后出现输入框
- 用户输入问题（可选）
- **摇卦动画**：
  - 三枚铜钱在画面中央，用户点击/摇手机触发
  - 铜钱翻转旋转动画（1-2秒），落定后显示正反面
  - 每次摇完下方逐步绘制一爻（从下到上）
  - 配合音效（铜钱碰撞声，可选）
- 6次完成后，卦象渐显，过渡到解卦页

### 3. 解卦页（result）
- 卦象图示（六爻线条）
- 卦名、卦辞、爻辞
- AI 解读区域（流式输出，小狗风格）
- 保存/分享按钮

### 4. 历史页（history）
- 按时间倒序展示历史卦象
- 点击查看详细解读

## 四、技术方案

### 前端
- 微信小程序原生开发（自用，不需要跨平台）
- 六十四卦数据：前端 JSON 文件（卦名、卦辞、爻辞、象辞）
- 起卦算法：前端 JS 实现（模拟铜钱法）
- 历史记录：wx.setStorage 本地存储
- 摇卦动画：CSS 动画 + canvas

### 后端（复用孤独患者服务器）
- 新增 `/api/divination/interpret` 接口
- 接收：卦象数据 + 用户问题
- 调用小狗 Gateway API 获取解读
- 返回：AI 解读文本（支持流式 SSE）

### 数据库（PostgreSQL，复用现有）
新增两张表：
```sql
-- AI解卦权限配置
CREATE TABLE divination_config (
    id SERIAL PRIMARY KEY,
    ignore_filter BOOLEAN DEFAULT true,
    daily_limit INT DEFAULT 10,        -- 每人每日次数限制（预留）
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI解卦白名单
CREATE TABLE divination_enabled_users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO divination_config (ignore_filter) VALUES (true);
```

### AI 解卦接口流程
```
小程序 → /api/divination/interpret
  → 检查权限（ignoreFilter / enableList）
  → 构造 prompt（卦象 + 问题 + 解卦指引）
  → 调用小狗 Gateway API
  → 流式返回解读
```

## 五、六爻起卦算法

### 铜钱法
- 三枚铜钱，每次抛出记录正反面
- 正面=3，反面=2
- 三枚之和：6=老阴(变爻)，7=少阳，8=少阴，9=老阳(变爻)
- 重复6次得到六爻（从初爻到上爻）
- 有变爻时产生变卦

### 卦象数据结构
```json
{
  "question": "今天适合出门吗",
  "lines": [7, 8, 9, 7, 6, 8],
  "originalHexagram": "天火同人",
  "changedHexagram": "天水讼",
  "changingLines": [3, 5],
  "timestamp": "2026-03-04T14:00:00"
}
```

## 六、AI 解卦 Prompt 设计

```
你是一位精通周易的卜卦大师，同时也是一只可爱的小狗🐕。
请根据以下卦象为求卦者解读：

【卦象信息】
本卦：{originalHexagram}（{originalGuaName}）
变卦：{changedHexagram}（{changedGuaName}，如有）
变爻：{changingLines}
求问：{question}

【解读要求】
1. 先简述卦象含义（2-3句）
2. 结合求问给出具体建议
3. 指出需要注意的事项
4. 语气亲切有趣，可以加一点小狗的可爱语气
5. 总长度控制在 200-300 字
```

## 七、分工

| 角色 | 任务 |
|------|------|
| 管家 | 方案设计、Prompt 调优、代码 Review |
| 小狗 | 前端开发、后端接口、部署 |

## 八、工期估算

| 阶段 | 时间 |
|------|------|
| 前端页面 + 起卦算法 | 1天 |
| 后端接口 + 权限控制 | 半天 |
| AI Prompt 调优 | 半天 |
| 联调测试 | 半天 |
| **合计** | **2-3天** |

## 九、Phase 2 功能（排入计划）
- 梅花易数（以数起卦，简单快速）
- 塔罗牌（78张牌，大小阿卡那，牌阵展示）
- 卦象分享海报
- 每日推送运势
- 付费解卦（收紧 ignoreFilter）
