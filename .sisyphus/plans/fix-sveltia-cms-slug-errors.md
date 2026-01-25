# Fix SveltiaCMS Slug Template Errors

## Context

SveltiaCMS is successfully loading at `http://localhost:4321/iamhyk/index.html` but has validation errors because the slug templates contain slashes, which is not allowed. The solution is to use the `path` option for folder organization instead of including slashes in the `slug` template.

## Work Objectives

### Core Objective

Fix SveltiaCMS collection configuration to use proper folder organization without slashes in slug templates.

### Concrete Deliverables

- Updated `public/iamhyk/config.yml` with corrected slug and path options
- Blog posts organized in year/month folders
- Tweets organized in year folders

### Definition of Done

- [ ] SveltiaCMS loads without slug template errors
- [ ] Blog posts save to `src/content/blog/YYYY/MM/` folder structure
- [ ] Tweets save to `src/content/tweets/YYYY/` folder structure
- [ ] Collections can create new entries successfully

## Task Flow

```
Task 1 → Task 2 → Task 3
```

## TODOs

- [ ] 1. Fix Blog Posts Collection Configuration
     **What to do**:
  - Update the blog collection in `public/iamhyk/config.yml`
  - Replace slug template with path option for folder organization
  - Current: `slug: '{{year}}/{{month}}/{{slug}}'`
  - Fixed: `path: '{{year}}/{{month}}'` and `slug: '{{slug}}'`

  **Must NOT do**:
  - Don't change other collection settings
  - Don't modify the folder path itself

  **Parallelizable**: NO

  **References**:
  - Current config: `public/iamhyk/config.yml:19` - Blog collection with slug template
  - Existing content structure: `src/content/blog/2026/01/` - Current year/month organization
  - SveltiaCMS docs: Path vs slug usage for folder organization

  **Acceptance Criteria**:
  - [ ] Blog collection uses `path: '{{year}}/{{month}}'` for folder organization
  - [ ] Blog collection uses `slug: '{{slug}}'` for filename
  - [ ] Config validates without slug template errors

- [ ] 2. Fix Tweets Collection Configuration
     **What to do**:
  - Update the tweets collection in `public/iamhyk/config.yml`
  - Replace slug template with path option
  - Current: `slug: '{{year}}/{{slug}}'`
  - Fixed: `path: '{{year}}'` and `slug: '{{slug}}'`

  **Must NOT do**:
  - Don't change other collection settings

  **Parallelizable**: NO

  **References**:
  - Current config: `public/iamhyk/config.yml:66` - Tweets collection with slug template
  - Existing content structure: `src/content/tweets/2026/` - Current year organization
  - Blog fix pattern from Task 1

  **Acceptance Criteria**:
  - [ ] Tweets collection uses `path: '{{year}}'` for folder organization
  - [ ] Tweets collection uses `slug: '{{slug}}'` for filename
  - [ ] Config validates without slug template errors

- [ ] 3. Verify SveltiaCMS Configuration
     **What to do**:
  - Refresh the SveltiaCMS interface at `http://localhost:4321/iamhyk/index.html`
  - Check that no slug template errors are displayed
  - Test creating a new blog post and tweet entry

  **Must NOT do**:
  - Don't make changes to existing content files

  **Parallelizable**: NO

  **References**:
  - SveltiaCMS interface: `http://localhost:4321/iamhyk/index.html`
  - Error messages previously seen about slug templates

  **Acceptance Criteria**:
  - [ ] CMS loads without slug template validation errors
  - [ ] Can create new blog post entry
  - [ ] Can create new tweet entry
  - [ ] New entries save to correct folder structure

## Success Criteria

### Verification Commands

```bash
# Refresh CMS page and check for errors
curl -s http://localhost:4321/iamhyk/index.html | grep -i "slug template" || echo "No slug errors found"
```

### Final Checklist

- [ ] All slug template errors resolved
- [ ] Collections maintain expected folder organization
- [ ] CMS interface loads cleanly
- [ ] Content creation works correctly

## Commit Strategy

| After Task | Message                                             | Files                    | Verification          |
| ---------- | --------------------------------------------------- | ------------------------ | --------------------- |
| 1          | `fix(cms): correct blog collection slug template`   | public/iamhyk/config.yml | Refresh CMS page      |
| 2          | `fix(cms): correct tweets collection slug template` | public/iamhyk/config.yml | Refresh CMS page      |
| 3          | `test(cms): verify slug template fixes`             | N/A                      | Test content creation |
