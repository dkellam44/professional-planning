import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AppendixRenderer({ source }: { source: string }) {
  return (
    <article className="prose prose-neutral md:prose-lg max-w-3xl mx-auto">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </article>
  );
}
