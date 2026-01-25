# Fix SveltiaCMS Content Organization and Filenaming

## Context

When testing SveltiaCMS locally, creating new tweets results in incorrect file organization:

- **Current behavior**: Creates `src/content/tweets/2026.md` (single file, wrong location)
- **Expected behavior**: Creates `src/content/tweets/2026/2026-01-25T192352.md` (folder + timestamp filename)

This indicates both the path structure and filename generation need correction in the SveltiaCMS configuration.

## Work Objectives

### Core Objective

Fix SveltiaCMS collection configuration to generate proper folder structure and timestamp-based filenames that match existing content patterns.

### Concrete Deliverables

- Updated `public/iamhyk/config.yml` with correct path and filename patterns
- Blog posts: `src/content/blog/YYYY/MM/slug.md`
- Tweets: `src/content/tweets/YYYY/YYYY-MM-DDTHHMMSS.md`
- Docs: `src/content/docs/slug.md`

### Definition of Done

- [ ] New blog posts save to correct year/month folders with proper filenames
- [ ] New tweets save to year folders with timestamp filenames matching existing pattern
- [ ] SveltiaCMS interface can create content without path/filename errors
- [ ] File organization matches existing content structure

## Task Flow

```
Task 1 → Task 2 → Task 3 → Task 4
```

## TODOs

- [ ] 1. Analyze Existing Content Structure and Filename Patterns
     **What to do**:
  - Examine existing tweet filenames to understand the timestamp format
  - Check blog post filename patterns
  - Identify the exact date/time format used in existing content

  **Must NOT do**:
  - Don't modify any existing content files
  - Don't assume filename patterns without verification

  **Parallelizable**: NO

  **References**:
  - Existing tweets: `src/content/tweets/2026/2026-01-25T175352.md`
  - Existing tweets: `src/content/tweets/2026/2026-01-24T102207.md`
  - Existing tweets: `src/content/tweets/2026/2026-01-24T081500.md`
  - Blog posts: `src/content/blog/2026/01/painful-electron-setup.md`

  **Acceptance Criteria**:
  - [ ] Identified tweet filename pattern: `YYYY-MM-DDTHHMMSS.md`
  - [ ] Identified blog post folder structure: `src/content/blog/YYYY/MM/slug.md`
  - [ ] Documented the exact date/time format for template generation

- [ ] 2. Fix Tweets Collection Path and Filename Configuration
     **What to do**:
  - Update tweets collection in `public/iamhyk/config.yml`
  - Set correct path: `path: '{{year}}'` for year folder
  - Set proper filename pattern with timestamp: `slug: '{{year}}-{{month}}-{{day}}T{{hour}}{{minute}}{{second}}'`

  **Must NOT do**:
  - Don't change the folder location (`src/content/tweets`)
  - Don't break compatibility with existing content

  **Parallelizable**: NO

  **References**:
  - Current tweets config: `public/iamhyk/config.yml:60-83`
  - Existing pattern: `2026-01-25T175352.md` from Task 1 analysis
  - SveltiaCMS date variables: year, month, day, hour, minute, second

  **Acceptance Criteria**:
  - [ ] Tweets collection uses `path: '{{year}}'`
  - [ ] Tweets collection uses timestamp-based slug matching existing pattern
  - [ ] New tweets will create files like `2026-01-25T192352.md` in year folders

- [ ] 3. Fix Blog Posts Collection Path and Filename Configuration
     **What to do**:
  - Update blog posts collection in `public/iamhyk/config.yml`
  - Set correct path: `path: '{{year}}/{{month}}'` for year/month folders
  - Set filename: `slug: '{{slug}}'` for slug-based filenames

  **Must NOT do**:
  - Don't change the folder location (`src/content/blog`)
  - Don't change the filename pattern from slug-based

  **Parallelizable**: NO

  **References**:
  - Current blog config: `public/iamhyk/config.yml:12-57`
  - Existing blog structure: `src/content/blog/2026/01/painful-electron-setup.md`
  - Task 1 analysis of blog patterns

  **Acceptance Criteria**:
  - [ ] Blog collection uses `path: '{{year}}/{{month}}'`
  - [ ] Blog collection uses `slug: '{{slug}}'` for filename
  - [ ] New blog posts will create files like `slug.md` in year/month folders

- [ ] 4. Test Content Creation and Verify File Organization
     **What to do**:
  - Refresh SveltiaCMS interface at `http://localhost:4321/iamhyk/index.html`
  - Create a test tweet entry to verify filename and folder structure
  - Create a test blog post to verify folder structure
  - Verify files are created in correct locations with proper names

  **Must NOT do**:
  - Don't commit test content unless specifically requested
  - Don't modify existing content files

  **Parallelizable**: NO

  **References**:
  - SveltiaCMS interface: `http://localhost:4321/iamhyk/index.html`
  - Expected file paths from Tasks 2-3
  - Existing content patterns from Task 1

  **Acceptance Criteria**:
  - [ ] New tweet created at `src/content/tweets/YYYY/YYYY-MM-DDTHHMMSS.md`
  - [ ] New blog post created at `src/content/blog/YYYY/MM/slug.md`
  - [ ] No SveltiaCMS errors during content creation
  - [ ] File organization matches existing content patterns

## Success Criteria

### Verification Commands

```bash
# Check test content structure
find src/content -name "*.md" -type f | head -10 | sort

# Verify new content matches expected patterns
ls -la src/content/tweets/$(date +%Y)/ | grep "$(date +%Y-%m-%d)"
ls -la src/content/blog/$(date +%Y)/$(date +%m)/ | head -5
```

### Final Checklist

- [ ] New tweets save to year folders with timestamp filenames
- [ ] New blog posts save to year/month folders with slug filenames
- [ ] File organization matches existing content structure
- [ ] SveltiaCMS interface works without errors
- [ ] No existing content is broken

## Commit Strategy

| After Task | Message                                                             | Files                    | Verification          |
| ---------- | ------------------------------------------------------------------- | ------------------------ | --------------------- |
| 2          | `fix(cms): correct tweets collection path and filename pattern`     | public/iamhyk/config.yml | Create test tweet     |
| 3          | `fix(cms): correct blog posts collection path and filename pattern` | public/iamhyk/config.yml | Create test blog post |
| 4          | `test(cms): verify content organization fixes`                      | N/A                      | Check file structure  |

## Known Issues/Risks

1. **Date Format Precision**: Need to ensure timestamp format exactly matches existing content
2. **Path Variables**: Verify SveltiaCMS supports all required date variables (`{{hour}}{{minute}}{{second}}`)
3. **Existing Content**: Ensure changes don't break access to existing content

## Rollback Plan

If configuration breaks existing functionality:

1. Revert `public/iamhyk/config.yml` to previous version
2. Restore from git: `git checkout HEAD~1 -- public/iamhyk/config.yml`
3. Test SveltiaCMS loads without errors
4. Investigate alternative approaches for filename generation
