const fs = require('fs')
const path = require('path')

const root = process.cwd()
const scanRoots = ['src', 'DEVLOG.md', 'TODO.md', 'README.md', 'package.json']
const textFilePattern = /\.(ts|tsx|css|md|json|html)$/
const suspiciousChars = new Set(['\u00c3', '\u00c2', '\u00e0', '\ufffd'])
const findings = []

function hasSuspiciousText(line) {
  for (const char of line) {
    if (suspiciousChars.has(char)) {
      return true
    }
  }

  return false
}

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split(/\r?\n/)

  lines.forEach((line, index) => {
    if (hasSuspiciousText(line)) {
      findings.push(`${path.relative(root, file)}:${index + 1}: ${line.slice(0, 160)}`)
    }
  })
}

function walk(entry) {
  const fullPath = path.resolve(root, entry)

  if (!fs.existsSync(fullPath)) {
    return
  }

  const stat = fs.statSync(fullPath)

  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(fullPath)) {
      if (child === 'node_modules' || child === 'dist' || child === '.git') {
        continue
      }

      walk(path.join(entry, child))
    }

    return
  }

  if (textFilePattern.test(fullPath)) {
    scanFile(fullPath)
  }
}

scanRoots.forEach(walk)

if (findings.length > 0) {
  console.error('Suspicious encoding text found:')
  console.error(findings.join('\n'))
  process.exit(1)
}

console.log('Encoding check passed.')
