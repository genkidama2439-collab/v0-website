// node --test 用のモジュール解決フック。
//
// アプリ側は tsconfig の paths で "@/lib/..." を使っているが、Node は tsconfig を読まない。
// テストからアプリのモジュールをそのまま import できるよう、"@/" をリポジトリルート起点の
// 実ファイルへ解決し、拡張子なし指定には .ts / .tsx / index を補う。
//
// 使い方: node --import ./scripts/test-alias-hooks.mjs --test "lib/**/*.test.mjs"
// （package.json の "npm test" がこの形で呼び出す）

import { registerHooks } from "node:module"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const EXTENSIONS = [".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.tsx"]

function resolveSourceFile(absolutePath) {
  if (existsSync(absolutePath) && path.extname(absolutePath)) return absolutePath

  for (const extension of EXTENSIONS) {
    const candidate = `${absolutePath}${extension}`
    if (existsSync(candidate)) return candidate
  }

  return absolutePath
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context)

    const target = resolveSourceFile(path.join(ROOT, specifier.slice(2)))
    return nextResolve(pathToFileURL(target).href, context)
  },
})
