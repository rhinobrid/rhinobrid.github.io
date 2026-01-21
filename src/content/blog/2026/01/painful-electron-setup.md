---
title: "Electron 設定真麻煩"
publishDate: 2026-01-21
description: '紀錄如何設定Electron'
tags:
  - vibe coding
  - guide
  - boilerplate
language: '中文'
draft: false
---


雖然有 Vibe Coding，但是完全靠 AI 去設定環境，通常會要花很多 tokens。

如果用上比較蠢的免費 LLM，更有可能無限 loop，失敗告終。

所以這次開始自行設定環境，然後才開始交給 LLM 展開 Vibe Coding。

近期比較多建立 Desktop Application，主要用 Electron。

## Step 1: 設定 Electron

使用 `npm init electron-app` 進行標準的快速啟動。

`npm init electron-app`

1. 選擇 Vite
2. 選擇 Typescript

## Step 2: 更新 Typescript

自帶的 Typescript 通常是舊版本，更新成 latest，再一口氣設定 `tsconfig.json`

#### 取得 tsconfig.json 的 Template

`npm install --save-dev @total-typescript/tsconfig`
按照這個 README 選擇 tsconfig 的 template: https://github.com/total-typescript/tsconfig

上文選擇了 Vite，所以選 Bundler+DOM+App: `"extends": "@total-typescript/tsconfig/bundler/dom/app", `

#### 對 tsconfig.json 作出小修改

將 `"module": "CommonJS",` 改成 `"module": "ESNext",`

#### 最後更換新版 Typescript，再安裝一堆相關的東西

`npm install typescript@latest @types/node @types/react @types/react-dom eslint typescript-eslint --save-dev`

## Step 3: 安裝一定會用到的 packages

`npm install react react-dom zustand tailwindcss @tailwindcss/vite  lucide-react`

- Main: react, zustand (state management)
- Frontend: tailwindcss, lucide-react

## Step 4: 安裝個別 App 需要的 packages

- DB: better-sqlite3, Drizzle ORM

`npm insall better-sqlite3 drizzle-orm`

`npm install --save-dev drizzle-kit`

## Step5: 設定 Tailwindcss 和安裝 DaisyUI

上方已安裝 tailwindcss，這裏先取得 DaisyUI
`npm install --save-dev daisyui@latest`

TailwindCSS 要設定。非常麻煩。我在這裏卡了很久。

1. 按照官方文件的步驟：https://tailwindcss.com/docs/installation/using-vite

2. 我們已來第 3 步，修改 `vite.config.ts`

3. 2026 年在步驟 1 使用 `npm init electron-app` 的話，會出現 3 個 vite.config.ts

   - vite.main.config.ts
   - vite.preload.config.ts
   - vite.renderer.config.ts

4. 第三步只需要改動 vite.renderer.config.ts

5. 照做第 4 步，在 `index.css` 加入 `@import "tailwindcss";` 
6. 同樣在 `index.css`，在下一行再加入 `@plugin "daisyui";`

7. 本來跑 `npm run start` 或 `npm run dev` 應該會成功的，可是這裏會出錯。

8. 解決方法: 將上方 3 個 vite.xxx.config.ts 改成 `.mts`，即:
   - vite.main.config.mts
   - vite.preload.config.mts
   - vite.renderer.config.mts

9. 打開 `forge.config.ts`
   將相關的 mention 都更新為 `.mts`

完成設定。
可以執行 `npm run start` 或 `npm run dev`，叫出 Electron。

10. terminal console會見到daisyui 的message log，便完成。


## Step 6: 試試better-sqlite3
better-sqlite3 常有compile版本問題，相當麻煩。
先用以下.ts 試一試。
```
// test-sqlite.ts
import Database from 'better-sqlite3';

// Create in-memory database
const db = new Database(':memory:');

// Create a simple table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL
  )
`);

// Insert data
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
insert.run('Alice', 'alice@example.com');
insert.run('Bob', 'bob@example.com');

// Query data
const getAll = db.prepare('SELECT * FROM users');
const users = getAll.all();

console.log('All users:', users);

// Query single row
const getOne = db.prepare('SELECT * FROM users WHERE name = ?');
const alice = getOne.get('Alice');

console.log('Found user:', alice);

// Close database
db.close();

console.log('✅ Test complete!');

```

保存後執行: `npx tsx test-sqlite.ts`

如果出現問題，便rebuild它。
`npx @electron/rebuild -f -w better-sqlite3`