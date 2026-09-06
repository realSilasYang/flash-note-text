const fs = require('node:fs')
const path = require('node:path')

// 只清理 webpack 生成的 dist 目录，源码、依赖和用户数据不在操作范围内。
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.resolve(projectRoot, 'dist')

// 删除前确认目标确实是当前项目根目录下的 dist，避免路径配置错误造成误删。
if (path.dirname(distRoot) !== projectRoot || path.basename(distRoot) !== 'dist') {
  throw new Error(`拒绝清理项目输出目录之外的路径：${distRoot}`)
}

if (fs.existsSync(distRoot)) {
  // dist 可由 npm run build 完整重建，因此发布前可以安全清空该目录。
  fs.rmSync(distRoot, { recursive: true, force: true })
  console.log('已清理 dist')
} else {
  console.log('dist 已经是干净状态')
}
