import { PageTransitionWrapper } from "@/app/components";

import { rulesData } from "./data";

export default function RulesPage() {
  return (
    <PageTransitionWrapper className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Правила та положення</h1>
      {rulesData.map((section) => (
        <div key={section.title} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
          <ul className="list-inside space-y-2">
            {section.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      ))}
    </PageTransitionWrapper>
  );
}
