import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import process from 'node:process'

import { globSync } from 'node:fs'

const ROOT = process.cwd()
const CONTENT_DIR = resolve(ROOT, 'src/content')
const PUBLIC_DIR = resolve(ROOT, 'public')

const MARKDOWN_FILES = globSync('**/*.{md,mdx}', { cwd: CONTENT_DIR }).map((relativePath) =>
  resolve(CONTENT_DIR, relativePath)
)

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\(([^)]+)\)/g

function stripFencedCodeBlocks(text) {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/~~~[\s\S]*?~~~/g, '')
}

/**
 * Extracts the markdown URL target from an image token.
 * Supports simple title suffix: ![](path "title")
 */
function parseImageTarget(rawTarget) {
  const trimmed = rawTarget.trim()
  const startsWithAngle = trimmed.startsWith('<')
  const endsWithAngle = trimmed.endsWith('>')

  if (startsWithAngle && endsWithAngle) {
    return trimmed.slice(1, -1).trim()
  }

  const titleIndex = trimmed.search(/\s+"/)
  if (titleIndex === -1) return trimmed

  return trimmed.slice(0, titleIndex).trim()
}

function normalizeUrlPath(path) {
  return decodeURIComponent(path).trim()
}

function shouldSkipTarget(target) {
  return (
    !target ||
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('data:') ||
    target.startsWith('#')
  )
}

function checkTargetExists(sourceFile, target) {
  const normalizedTarget = normalizeUrlPath(target)

  if (normalizedTarget.startsWith('/')) {
    const publicFile = resolve(PUBLIC_DIR, `.${normalizedTarget}`)
    return existsSync(publicFile)
  }

  const sourceDir = dirname(sourceFile)
  const directRelativeFile = resolve(sourceDir, normalizedTarget)
  if (existsSync(directRelativeFile)) return true

  // Common CMS mistake: image lives in a folder named after markdown basename.
  // Example:
  // - post.md
  // - post/image.webp
  // - markdown points to image.webp
  const sourceBasename = basename(sourceFile, extname(sourceFile))
  const fallbackRelativeFile = resolve(sourceDir, sourceBasename, normalizedTarget)

  if (!normalizedTarget.startsWith('./') && !normalizedTarget.startsWith('../') && existsSync(fallbackRelativeFile)) {
    return true
  }

  return false
}

const errors = []

for (const file of MARKDOWN_FILES) {
  const rawText = readFileSync(file, 'utf8')
  const text = stripFencedCodeBlocks(rawText)
  const matches = text.matchAll(MARKDOWN_IMAGE_PATTERN)

  for (const match of matches) {
    const rawTarget = match[1]
    const target = parseImageTarget(rawTarget)
    if (shouldSkipTarget(target)) continue

    const exists = checkTargetExists(file, target)
    if (exists) continue

    errors.push({ file, target })
  }
}

if (errors.length === 0) {
  console.log('Content image link check passed.')
  process.exit(0)
}

console.error('Content image link check failed:')
for (const { file, target } of errors) {
  const relativeFile = file.replace(`${ROOT}/`, '')
  console.error(`- ${relativeFile}: missing image target "${target}"`)
}

console.error('\nFix broken image paths before deploy.')
process.exit(1)
