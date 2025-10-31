import { MDXRemote } from "next-mdx-remote/rsc";

export default function AppendixRenderer({ source }: { source: string }) {
  return (
    <article className="prose prose-neutral md:prose-lg max-w-3xl mx-auto">
      <MDXRemote source={source} />
    </article>
  );
}
