import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";

// const news130125 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/13-01-25.md"),
//   "utf-8"
// );
// const news150125 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/15-01-25.md"),
//   "utf-8"
// );
// const news250125 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/25-01-25.md"),
//   "utf-8"
// );
// const news040225 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/04-02-25.md"),
//   "utf-8"
// );
// const news110225 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/11-02-25.md"),
//   "utf-8"
// );
// const news180225 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/18-02-25.md"),
//   "utf-8"
// );
// const news190225 = readFileSync(
//   path.join(process.cwd(), "app/components/news-pane/data/19-02-25.md"),
//   "utf-8"
// );

// const newsData = [
//   {
//     date: new Date("02/04/2025"),
//     content: news040225,
//   },
//   {
//     date: new Date("01/15/2025"),
//     content: news150125,
//   },
//   {
//     date: new Date("01/13/2025"),
//     content: news130125,
//   },
//   {
//     date: new Date("01/25/2025"),
//     content: news250125,
//   },
//   {
//     date: new Date("02/11/2025"),
//     content: news110225,
//   },
//   {
//     date: new Date("02/18/2025"),
//     content: news180225,
//   },
//   {
//     date: new Date("02/19/2025"),
//     content: news190225,
//   },
// ];

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
