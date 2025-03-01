import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

const getNewsData = () => {
  const dataDir = path.join(process.cwd(), "app/components/news-pane/data");
  const files = readdirSync(dataDir).filter((file) => file.endsWith(".md"));

  return files.map((filename) => {
    const content = readFileSync(path.join(dataDir, filename), "utf-8");
    // Parse date from filename (format: DD-MM-YY.md)
    const [day, month, year] = filename.slice(0, -3).split("-");
    const date = new Date(`20${year}-${month}-${day}`);

    return {
      date,
      content,
    };
  });
};

const newsData = getNewsData();

export const NewsPane = () => {
  const sortedNews = [...newsData].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Останні оновлення</h1>
      {sortedNews.map((update) => (
        <div
          key={update.date.toISOString()}
          className="mb-8 p-6 bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="text-gray-600 font-semibold mb-4">
            {update.date.toLocaleDateString("uk-UA", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="prose prose-slate max-w-none">
            <Markdown className="markdown" rehypePlugins={[rehypeRaw]}>
              {update.content}
            </Markdown>
          </div>
        </div>
      ))}
    </div>
  );
};
