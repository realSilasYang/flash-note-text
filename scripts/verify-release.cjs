const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

// 发布校验只读取构建产物和项目元数据，不修改任何文件。
const projectRoot = path.resolve(__dirname, '..')
const distRoot = path.resolve(projectRoot, 'dist')
const packageManifest = readJson(path.join(projectRoot, 'package.json'), 'package.json')

// webpack 生成的分包位于 chunks，其余目录是运行时明确需要的静态资源或 preload 依赖。
const allowedRootFiles = new Set([
  'index.html',
  'index.js',
  'index.js.LICENSE.txt',
  'logo.png',
  'plugin.json',
  'preload.js',
  'xhs-browser.html'
])
const allowedRootDirectories = new Set([
  'chunks',
  'code-image',
  'cursors',
  'donate',
  'fonts',
  'node_modules',
  'share'
])

// 发布目录中不允许出现备份、日志、密钥、调试和临时文件。
const forbiddenFile = /(?:^|[\\/])(?:\.env(?:\..*)?|.*\.(?:bak|backup|csv|db|dump|key|log|map|pem|sqlite\d?|temp|tmp|zip))(?:$|[\\/])/i
const forbiddenName = /(?:^|[._-])(?:backup|debug|diagnostic|recovery|secret|temporary|test)(?:[._-]|$)/i
const secretPatterns = [
  ['私钥', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  // Shiki 语言词表里有 sk-user-about-* 等标识符，密钥扫描只接受随机字母数字段，避免误报。
  ['OpenAI 格式密钥', /\bsk-(?:(?:proj|ant)-)?[A-Za-z0-9]{24,}\b/],
  ['AWS 访问密钥', /\bAKIA[0-9A-Z]{16}\b/],
  ['Google API 密钥', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['GitHub 令牌', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/],
  ['Slack 令牌', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/]
]

function fail (message) {
  // 任何一项失败都立即终止，避免校验失败后仍被误认为可发布。
  throw new Error(`[发布校验] ${message}`)
}

function readJson (filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    fail(`${label} 不是有效 JSON：${error.message}`)
  }
}

function requiredFile (relativePath) {
  // 清单引用不得跳出 dist，且必须指向实际文件。
  const absolutePath = path.resolve(distRoot, relativePath)
  const relativeToDist = path.relative(distRoot, absolutePath)
  if (relativeToDist.startsWith('..') || path.isAbsolute(relativeToDist)) {
    fail(`清单路径越界：${relativePath}`)
  }
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    fail(`清单引用文件不存在：${relativePath}`)
  }
  return absolutePath
}

function collectFiles (directory, relativeRoot = directory, result = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) collectFiles(absolutePath, relativeRoot, result)
    else result.push(path.relative(relativeRoot, absolutePath))
  }
  return result
}

function sha256 (filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

if (!fs.existsSync(distRoot)) fail('dist 不存在，请先运行 npm run build')

const manifestPath = requiredFile('plugin.json')
const manifest = readJson(manifestPath, 'dist/plugin.json')

// package.json 和插件清单必须标记同一个正式版本。
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageManifest.version || '')) {
  fail(`package.json.version 不是有效版本号：${packageManifest.version || '缺失'}`)
}
if (manifest.version !== packageManifest.version) {
  fail(`版本号不一致：package.json=${packageManifest.version}，plugin.json=${manifest.version || '缺失'}`)
}

if (typeof manifest.main !== 'string' || !manifest.main.endsWith('.html')) fail('plugin.json.main 必须是相对 HTML 路径')
if (typeof manifest.logo !== 'string') fail('plugin.json.logo 必须是相对路径')
if (manifest.preload != null && (typeof manifest.preload !== 'string' || !manifest.preload.endsWith('.js'))) {
  fail('plugin.json.preload 必须是相对 JS 路径')
}
requiredFile(manifest.main)
const logoPath = requiredFile(manifest.logo)
if (manifest.preload) requiredFile(manifest.preload)

// 每个功能至少保留一个指令，且总指令数不超过 uTools 搜索建议上限 5 个。
if (!Array.isArray(manifest.features) || manifest.features.length === 0) fail('plugin.json.features 不能为空')
const featureCodes = new Set()
for (const feature of manifest.features) {
  if (!feature || typeof feature.code !== 'string' || !feature.code.trim()) fail('每个功能都必须有非空 code')
  if (featureCodes.has(feature.code)) fail(`功能 code 重复：${feature.code}`)
  featureCodes.add(feature.code)
  if (!Array.isArray(feature.cmds) || feature.cmds.length === 0) fail(`功能 ${feature.code} 没有功能指令`)
  if (feature.cmds.length > 5) fail(`功能 ${feature.code} 有 ${feature.cmds.length} 个指令，超过 5 个建议上限`)
}

// uTools 图标必须是有效的正方形 PNG。
const logo = fs.readFileSync(logoPath)
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
if (!logo.subarray(0, 8).equals(pngSignature)) fail('logo 必须是 PNG 文件')
const logoWidth = logo.readUInt32BE(16)
const logoHeight = logo.readUInt32BE(20)
if (logoWidth === 0 || logoHeight === 0 || logoWidth !== logoHeight) fail(`logo 必须是正方形 PNG，当前为 ${logoWidth}x${logoHeight}`)

// preload 及 public 中的静态资源必须原样复制；这也保护 preload 明文和行结构不被构建器改变。
const publicFiles = collectFiles(path.resolve(projectRoot, 'public')).map(file => file.replaceAll(path.sep, '/'))
for (const relativePath of publicFiles) {
  const sourcePath = path.resolve(projectRoot, 'public', relativePath)
  const outputPath = requiredFile(relativePath)
  if (sha256(sourcePath) !== sha256(outputPath)) fail(`public/${relativePath} 未逐字节复制到 dist`)
}

// 递归收集发布文件，后续检查临时文件、敏感文件和密钥。
const releaseFiles = collectFiles(distRoot).map(file => file.replaceAll(path.sep, '/'))
const rootEntries = fs.readdirSync(distRoot, { withFileTypes: true })
const unexpectedRootEntries = rootEntries
  .filter(entry => entry.isDirectory() ? !allowedRootDirectories.has(entry.name) : !allowedRootFiles.has(entry.name))
  .map(entry => entry.name)
if (unexpectedRootEntries.length > 0) fail(`dist 根目录存在非发布文件：${unexpectedRootEntries.join(', ')}`)

const forbiddenFiles = releaseFiles.filter(file => (
  forbiddenFile.test(file) ||
  (!file.startsWith('node_modules/') && forbiddenName.test(path.basename(file)))
))
if (forbiddenFiles.length > 0) fail(`dist 存在敏感或非发布文件：${forbiddenFiles.join(', ')}`)

// 只扫描文本产物中的常见密钥格式，图片和二进制字体不参与解码。
const textExtensions = new Set(['.html', '.js', '.json', '.txt'])
for (const relativePath of releaseFiles) {
  if (!textExtensions.has(path.extname(relativePath).toLowerCase())) continue
  const content = fs.readFileSync(path.resolve(distRoot, relativePath), 'utf8')
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(content)) fail(`dist/${relativePath} 包含${label}`)
  }
}

// 主包应为生产构建，避免开发日志或源码映射进入市场包。
const mainBundle = fs.readFileSync(requiredFile('index.js'), 'utf8')
if (mainBundle.includes('webpack --mode development')) fail('index.js 包含开发构建标记')
if (releaseFiles.some(file => file.toLowerCase().endsWith('.map'))) fail('dist 不得包含 source map')

console.log(`发布校验通过：版本 ${manifest.version}，${releaseFiles.length} 个文件，${featureCodes.size} 个功能，图标 ${logoWidth}x${logoHeight}`)
