import { expect, test } from "vitest";
import { toEmailHtml } from "@/lib/brevo";

test("campaign body is escaped, split into paragraphs, and gets an unsubscribe link", () => {
  const html = toEmailHtml("Hi <b>all</b> & co\nline two\n\nSecond para");
  expect(html).toContain("<p>Hi &lt;b&gt;all&lt;/b&gt; &amp; co<br>line two</p><p>Second para</p>");
  expect(html).toContain('href="{{ unsubscribe }}"');
});
