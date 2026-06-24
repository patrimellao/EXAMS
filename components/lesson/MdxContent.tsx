/**
 * Server-side MDX renderer for lesson bodies.
 *
 * Lesson content is a markdown string (lessons.contentText) that may include the
 * custom <Objectives>/<KeyIdea>/<Video> MDX tags. This compiles it to a React
 * node on the server (RSC) with heading anchors (rehype-slug + autolink) and GFM.
 *
 * Falls back to plain preformatted text if MDX compilation fails (e.g. legacy
 * content with stray `<`/`{`), so a lesson never renders blank.
 */
import * as React from 'react';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { lessonMdxComponents } from './blocks';
import { collectFromMarkdown, orderCitations } from './citations';
import { CitationsProvider, ReferenceList } from './citations-view';

export async function renderLessonMdx(source: string): Promise<React.ReactElement> {
  try {
    const { content } = await compileMDX({
      source,
      components: lessonMdxComponents,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          // rehype-slug adds heading ids so the lesson's section deep-links / TOC work.
          rehypePlugins: [rehypeSlug],
        },
      },
    });
    // Citations are numbered by document order (pre-scanned from the source); the
    // markers read their number from context, and the list renders after the body.
    const { references, numbers } = orderCitations(collectFromMarkdown(source));
    return (
      <CitationsProvider numbers={numbers}>
        {content}
        <ReferenceList references={references} />
      </CitationsProvider>
    );
  } catch (err) {
    // Graceful degradation — never blank-screen a lesson on bad MDX.
    return (
      <pre className="whitespace-pre-wrap font-reader text-[15px] leading-relaxed">
        {source}
      </pre>
    );
  }
}
