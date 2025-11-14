# OASF 自动分类功能

## 功能概述

基于 OASF (Open Agent Service Framework) v0.8.0 规范，8004scan 现在支持自动对 AI Agent 进行 skills 和 domains 分类。

## 功能特性

### 1. 自动提取和分类

系统会按以下优先级处理 OASF 分类：

1. **从 Metadata 提取**：如果 agent 的 metadata 中包含 `endpoints[].skills` 和 `endpoints[].domains`（OASF 标准格式），直接使用
2. **AI 自动分类**：否则使用 AI 服务分析 agent 的 description 自动分类

### 2. 分类方式

#### AI 分类（推荐）
- 使用 Claude API 分析 agent 描述
- 需要配置 `ANTHROPIC_API_KEY` 环境变量
- 更准确、智能

#### 关键词分类（降级方案）
- 无需 API key
- 基于关键词匹配
- 作为备选方案自动启用

### 3. 前端展示

- **列表页**：在 agent 卡片中显示最多 3 个标签（skills + domains）
- **详情页**：完整展示所有 skills 和 domains，按分类分组显示

## 使用说明

### 配置 AI 分类（可选）

在 `backend/.env` 中添加：

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

如果不配置，系统会自动使用关键词匹配进行分类。

### API 端点

#### 1. 手动触发单个 agent 分类

```bash
POST /api/agents/{agent_id}/classify
```

示例：
```bash
curl -X POST http://localhost:8000/api/agents/{agent_id}/classify
```

#### 2. 批量分类所有未分类的 agents

```bash
POST /api/agents/classify-all?limit=100
```

参数：
- `limit`：最多处理多少个 agent（默认 100）

示例：
```bash
curl -X POST "http://localhost:8000/api/agents/classify-all?limit=50"
```

#### 3. 获取可用的 Skills 列表

```bash
GET /api/taxonomy/skills
```

返回：
```json
{
  "count": 30,
  "skills": [
    {
      "slug": "code_software/code_generation",
      "display_name": "Code Generation"
    },
    ...
  ]
}
```

#### 4. 获取可用的 Domains 列表

```bash
GET /api/taxonomy/domains
```

## 数据结构

### Agent 模型新增字段

```python
class Agent(Base):
    ...
    # OASF taxonomy fields
    skills = Column(JSON, nullable=True)  # ["skill_category/skill_name", ...]
    domains = Column(JSON, nullable=True)  # ["domain_category/domain_name", ...]
```

### OASF Metadata 格式

如果 agent 的 metadata 包含以下格式，系统会自动提取：

```json
{
  "name": "My Agent",
  "description": "...",
  "endpoints": [
    {
      "name": "OASF",
      "endpoint": "https://...",
      "version": "v0.8.0",
      "skills": [
        "code_software/code_generation",
        "natural_language_processing/text_analysis"
      ],
      "domains": [
        "technology/software_development",
        "technology/data_science"
      ]
    }
  ]
}
```

## OASF Taxonomy 完整版（v0.8.0）

### 数据来源

完整的 OASF taxonomy 直接从 agent0-py SDK 获取：
- **Skills**: 136 个技能分类
- **Domains**: 204 个领域分类
- **来源**: https://github.com/agent0lab/agent0-py

### Skills 主要类别（15个）

1. **Natural Language Processing** - 文本理解、生成和分析
2. **Images / Computer Vision** - 图像分类、目标检测、分割
3. **Audio** - 语音识别、音频分类、合成
4. **Data Engineering** - 数据清洗、转换、质量评估
5. **Agent Orchestration** - 多代理协调和任务分解
6. **Evaluation & Monitoring** - 性能跟踪和质量评估
7. **Security & Privacy** - 威胁检测、漏洞分析、隐私评估
8. **DevOps / MLOps** - 基础设施、CI/CD、模型版本管理
9. **Advanced Reasoning & Planning** - 战略思维、假设生成
10. **Analytical Skills** - 逻辑推理、问题解决、复杂数据处理
11. **Retrieval Augmented Generation** - RAG、文档检索、语义搜索
12. **Multi-modal** - 跨模态任务
13. **Tabular / Text** - 表格数据和文本分析
14. **Blockchain** - 区块链分析、智能合约
15. **Workflow Orchestration** - 工作流管理

### Domains 主要类别（25个）

1. **Technology** - 软件工程、AI、数据科学、区块链
2. **Finance and Business** - 银行、交易、投资、会计
3. **Healthcare** - 医疗服务、远程医疗
4. **Education** - 在线教育、教育技术
5. **Legal** - 合同管理、法律服务
6. **Transportation** - 物流、供应链、自动驾驶
7. **Energy** - 能源管理、可再生能源
8. **Agriculture** - 精准农业、作物管理
9. **Media and Entertainment** - 内容创作、社交媒体
10. **Real Estate** - 房产管理、市场分析
11. **Life Science** - 生物技术、基因组学
12. **Environmental Science** - 气候科学、生态学
13. **Industrial Manufacturing** - 自动化、供应链
14. **Telecommunications** - 通信网络、营销自动化
15. **Human Resources** - 招聘、员工发展
16. **Trust and Safety** - 内容审核、欺诈预防
17. **Cloud Computing** - 云基础设施、容器编排
18. **Data Science** - 机器学习、数据可视化
19. **Cybersecurity** - 网络安全、威胁情报
20. **Insurance** - 保险承保、理赔处理
21. **Marketing and Advertising** - 数字营销、广告技术
22. **Retail and E-commerce** - 在线零售、库存管理
23. **Social Services** - 社会工作、社区服务
24. **Sports and Fitness** - 运动科学、健身训练
25. **Hospitality and Tourism** - 酒店管理、旅游服务

### 文件位置

- **JSON 数据**:
  - `backend/src/taxonomies/all_skills.json`
  - `backend/src/taxonomies/all_domains.json`
- **Python 模块**: `backend/src/taxonomies/oasf_taxonomy.py`

## 自动化流程

### 新 Agent 注册时
1. 区块链同步服务监听 `Registered` 事件
2. 获取 metadata
3. 尝试从 metadata 提取 OASF 信息
4. 如果没有，调用 AI 分类服务自动分类
5. 存储到数据库

### Metadata 更新时
1. 监听 `UriUpdated` 事件
2. 重新获取 metadata
3. 重新提取或分类
4. 更新数据库

## 日志示例

```
[info] oasf_extracted_from_metadata   name=Agent1 skills_count=2 domains_count=1
[info] oasf_auto_classified           name=Agent2 skills_count=3 domains_count=2
[info] fallback_classification        name=Agent3 skills_count=1 domains_count=1
```

## 注意事项

1. **AI 分类成本**：使用 Claude API 会产生费用，建议设置合理的限流
2. **降级方案**：即使没有 API key，系统也能通过关键词匹配提供基础分类
3. **手动调整**：未来可以添加手动编辑分类的功能
4. **数据迁移**：已有的 agents 可以通过 `/api/agents/classify-all` 批量分类

## 扩展 Taxonomy

如需添加更多 skills 或 domains，修改：
`backend/src/taxonomies/oasf_taxonomy.py`

参考完整的 OASF 规范：
- https://github.com/agntcy/oasf/
- agent0_sdk/taxonomies/all_skills.json
- agent0_sdk/taxonomies/all_domains.json
