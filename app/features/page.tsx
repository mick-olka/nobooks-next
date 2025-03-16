import { getAuthorizedUser } from "@/app/auth";
import { PageTransitionWrapper, WikiGrid } from "@/app/components";
import { WikiPageType } from "@/app/types";
import { createClient } from "@/app/utils/supabase/server";

import { getWikiPages } from "@/app/utils/services";

export default async function FeaturesListPage() {
  const supabase = await createClient();
  const { data } = await getWikiPages(supabase, WikiPageType.FEATURE);
  const user = await getAuthorizedUser();

  return (
    <PageTransitionWrapper className="p-8">
      <h1 className="text-2xl font-bold m-6">Особливості серверу</h1>
      <WikiGrid data={data} user={user} type={WikiPageType.FEATURE} />
    </PageTransitionWrapper>
  );
}
// import { CreateWikiPageBtn, PageTransitionWrapper } from "@/app/components";

// import { FeaturesPane } from "./features-pane";
// import { WikiPageType } from "../types";
// import { getAuthorizedUser } from "../auth";
// import { getWikiPages } from "../utils/services";
// import { createClient } from "../utils/supabase/server";

// const getFeaturesData = () => {
//   const dataDir = path.join(process.cwd(), "app/features/data");
//   const files = readdirSync(dataDir).filter((file) => file.endsWith(".md"));

//   const otherFile = files.find((file) => file === "other.md");
//   const regularFiles = files.filter((file) => file !== "other.md");

//   const result = regularFiles.map((filename) => {
//     const content = readFileSync(path.join(dataDir, filename), "utf-8");
//     return content;
//   });

//   if (otherFile) {
//     const otherContent = readFileSync(path.join(dataDir, otherFile), "utf-8");
//     result.push(otherContent);
//   }

//   return result;
// };

// const featuresData = getFeaturesData();

// export default async function FeaturesPage() {
//   const user = await getAuthorizedUser();
//   const isAdmin = user?.user_role === "admin";
//   const supabase = await createClient();
//   const { data: featuresPages } = await getWikiPages(
//     supabase,
//     WikiPageType.FEATURE
//   );
//   return (
//     <PageTransitionWrapper className="container mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold mb-12">
//         no boobs Зимовий - Особливості серверу
//       </h1>
//       {isAdmin && (
//         <CreateWikiPageBtn type={WikiPageType.FEATURE} userId={user.id} />
//       )}
//       <FeaturesPane featuresData={featuresPages} isAdmin={isAdmin} />
//     </PageTransitionWrapper>
//   );
// }
