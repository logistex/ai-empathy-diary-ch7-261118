// 2026-11-18 11:55 KST
// Node가 확장자 없는 상대 경로(lib/ai의 import)를 .ts로 풀게 하는 확인용 훅. Next.js 빌드와 무관함.
import { register } from "node:module";

register("data:text/javascript," + encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (e) {
    if (e.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".") && !/\\.[a-z]+$/.test(specifier)) {
      return next(specifier + ".ts", context);
    }
    throw e;
  }
}`));
