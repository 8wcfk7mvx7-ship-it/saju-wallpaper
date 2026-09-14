import { CATEGORIES, type HunnyeoCategoryKey } from "@/lib/hunnyeoData";
import CategoryView from "./CategoryView";

// 정적 내보내기(output: "export")에서는 동적 라우트에 generateStaticParams 가
// 반드시 있어야 한다. 장 목록이 코드에 고정돼 있으므로 빌드 때 전부 뽑아낸다.
export function generateStaticParams() {
  return CATEGORIES.filter(c => c.key !== "all").map(c => ({ category: c.key }));
}

// 목록에 없는 주소는 만들지 않는다 (서버가 없으므로 즉석 생성이 불가능하다)
export const dynamicParams = false;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <CategoryView category={category as HunnyeoCategoryKey} />;
}
