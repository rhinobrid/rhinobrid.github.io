import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, resolve } from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const CONTENT_DIR = resolve(ROOT, 'src/content')
const PUBLIC_DIR = resolve(ROOT, 'public')
const SHOULD_FIX = process.argv.includes('--fix')

function listMarkdownFiles(directory) {
  const entries = readdirSync(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolutePath))
      continue
    }

    if (!entry.isFile()) continue
    if (!entry.name.endsWith('.md') && !entry.name.endsWith('.mdx')) continue
    files.push(absolutePath)
  }

  return files
}

const MARKDOWN_FILES = listMarkdownFiles(CONTENT_DIR)

const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*]\(([^)]+)\)/g

function getFencedCodeRanges(text) {
  const ranges = []
  const lines = text.split('\n')

  let inFence = false
  let fenceMarker = ''
  let cursor = 0
  let rangeStart = -1

  for (const line of lines) {
    const trimmed = line.trimStart()
    const startsBacktickFence = trimmed.startsWith('```')
    const startsTildeFence = trimmed.startsWith('~~~')

    if (!inFence && (startsBacktickFence || startsTildeFence)) {
      inFence = true
      fenceMarker = startsBacktickFence ? '```' : '~~~'
      rangeStart = cursor
    } else if (inFence && trimmed.startsWith(fenceMarker)) {
      const lineEnd = cursor + line.length + 1
      ranges.push({ start: rangeStart, end: lineEnd })
      inFence = false
      fenceMarker = ''
      rangeStart = -1
    }

    cursor += line.length + 1
  }

  if (inFence && rangeStart >= 0) {
    ranges.push({ start: rangeStart, end: text.length })
  }

  return ranges
}

function isInRanges(index, ranges) {
  for (const range of ranges) {
    if (index >= range.start && index < range.end) return true
  }
  return false
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

  return false
}

function getEntrySidecarReplacement(sourceFile, target) {
  const normalizedTarget = normalizeUrlPath(target)
  if (
    normalizedTarget.startsWith('/') ||
    normalizedTarget.startsWith('./') ||
    normalizedTarget.startsWith('../') ||
    normalizedTarget.includes('/')
  ) {
    return null
  }

  const sourceDir = dirname(sourceFile)
  const sourceBasename = basename(sourceFile, extname(sourceFile))
  const sidecarPath = resolve(sourceDir, sourceBasename, normalizedTarget)
  if (!existsSync(sidecarPath)) return null

  return `./${sourceBasename}/${normalizedTarget}`
}

function replaceRawTarget(rawTarget, newTarget) {
  const trimmed = rawTarget.trim()
  const titleMatch = trimmed.match(/^(\S+)(\s+["'][\s\S]*["'])$/)

  if (titleMatch) {
    return `${newTarget}${titleMatch[2]}`
  }

  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return `<${newTarget}>`
  }

  return newTarget
}

const errors = []
const fixedFiles = []

for (const file of MARKDOWN_FILES) {
  const rawText = readFileSync(file, 'utf8')
  const fencedRanges = getFencedCodeRanges(rawText)
  const replacements = []
  const matches = rawText.matchAll(MARKDOWN_IMAGE_PATTERN)

  for (const match of matches) {
    const matchStart = match.index ?? -1
    if (matchStart >= 0 && isInRanges(matchStart, fencedRanges)) continue

    const fullMatch = match[0]
    const rawTarget = match[1]
    const target = parseImageTarget(rawTarget)
    if (shouldSkipTarget(target)) continue

    const exists = checkTargetExists(file, target)
    if (exists) continue

    const sidecarReplacement = getEntrySidecarReplacement(file, target)
    const hint = sidecarReplacement ? ` try "${sidecarReplacement}"` : ''

    if (SHOULD_FIX && sidecarReplacement && matchStart >= 0) {
      const targetStartInMatch = fullMatch.indexOf('(') + 1
      const replaceStart = matchStart + targetStartInMatch
      const replaceEnd = matchStart + fullMatch.length - 1
      const replacedRawTarget = replaceRawTarget(rawTarget, sidecarReplacement)
      replacements.push({ start: replaceStart, end: replaceEnd, value: replacedRawTarget })
      continue
    }

    errors.push({ file, target, hint })
  }

  if (replacements.length > 0) {
    let updatedText = rawText
    replacements
      .sort((a, b) => b.start - a.start)
      .forEach((replacement) => {
        updatedText =
          updatedText.slice(0, replacement.start) +
          replacement.value +
          updatedText.slice(replacement.end)
      })

    if (updatedText !== rawText) {
      writeFileSync(file, updatedText, 'utf8')
      fixedFiles.push(file.replace(`${ROOT}/`, ''))
    }
  }
}

if (SHOULD_FIX && fixedFiles.length > 0) {
  console.log('Auto-fixed content image links:')
  fixedFiles.forEach((file) => console.log(`- ${file}`))
}

if (errors.length === 0) {
  console.log(SHOULD_FIX ? 'Content image link check/fix passed.' : 'Content image link check passed.')
  process.exit(0)
}

console.error('Content image link check failed:')
for (const { file, target, hint } of errors) {
  const relativeFile = file.replace(`${ROOT}/`, '')
  console.error(`- ${relativeFile}: missing image target "${target}"${hint}`)
}

console.error('\nFix broken image paths before deploy.')
process.exit(1)
