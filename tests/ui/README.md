# UI自动化测试

## 目录结构

- `helpers/` - 浏览器操作封装、断言函数、报告生成器
- `scenarios/` - 测试场景（common/为共用功能测试）
- `suites/` - 测试套件入口文件
- `reports/` - 测试报告输出目录

## 运行测试

> 注意：npm测试脚本将在Task 12实现后可用。详见 tests/UI_TEST_GUIDE.md

### Mock后端模式
```bash
npm run test:ui:mock
```

### Real后端模式
```bash
npm run test:ui:real
```

## 详细文档

完整的UI测试指南请参考: [tests/UI_TEST_GUIDE.md](../UI_TEST_GUIDE.md)
