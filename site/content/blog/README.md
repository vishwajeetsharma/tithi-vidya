# Writing a blog post

Every post is a Markdown file in this folder. Add one on GitHub, and the site publishes it on the next deploy. You don't need to install anything.

## Add a post on GitHub

1. Open this folder on GitHub: `site/content/blog`.
2. Click **Add file**, then **Create new file**.
3. Name it `your-post-name/index.md`. Typing the `/` makes the folder for you.
   - The name becomes the web address: `/blog/your-post-name`.
   - Use lowercase letters, numbers and hyphens only.
4. Paste the template below, write your post, and click **Commit changes**.
5. To add images, open your post's new folder, click **Add file**, then **Upload files**, and drop the images in.

Vercel builds the site a minute or two later, and the post is live.

## Template

```markdown
---
title: Your post title
description: One or two sentences. Google and social media show this under the title.
date: 2026-11-03
tags: [tithi, birthday]
cover: cover.jpg
coverAlt: A few words describing the cover image
---

Your first paragraph.

## A section heading

More text. **Bold**, *italic* and [links](/find) all work.

![A few words describing the image](photo.jpg "An optional caption")
```

| Field | Needed? | What it is |
| --- | --- | --- |
| `title` | Yes | The post's title. |
| `description` | Yes | A short summary for Google, social media and the blog page. Aim for under 160 characters. |
| `date` | Yes | The publish date, as `YYYY-MM-DD`. Posts are listed newest first. |
| `updated` | No | Add this when you change an old post, as `YYYY-MM-DD`. |
| `tags` | No | A list of topics. |
| `cover` | No | An image file in the post's folder. It appears at the top, on the blog page and when the post is shared. |
| `coverAlt` | With a cover | A few words describing the cover, for people who can't see it. |
| `author` | No | Defaults to Vishwajeet Sharma. |
| `draft` | No | `draft: true` hides the post on the live site, but still shows it when running the site on your computer. |

## Images

Upload images into the post's folder, next to `index.md`, then add them with `![description](file-name.jpg)`.

- **Any size is fine:** a photo straight from a phone works. Each image is shrunk to three sizes and saved as WebP, so phones download only what they need. The page reserves space for it, so nothing jumps while it loads.
- **Formats:** JPG, PNG, WebP, AVIF, GIF or SVG.
- **Description:** every image needs one inside the `[ ]`. Screen readers read it out, and Google uses it.
- **Caption:** add one in quotes after the file name: `![description](photo.jpg "Caption")`.

## Writing tips

- Start sections with `##`. The post title is the page's only main heading, so a `#` heading is turned into `##` automatically.
- A post with three or more `##` sections gets an "On this page" list at the top.
- Tables, numbered and bulleted lists, quotes with `>`, and code blocks all work.
- For the plain English used on the rest of the site: short sentences and everyday words.

## If something is wrong

The build stops, and the live site keeps the last good version. Vercel's build log names the post and the problem in plain words, for example "add a description" or "image photo.jpg was not found next to the post". Fix it on GitHub, and Vercel builds again.

## What you get for each post

- A page at `/blog/your-post-name`, built once into plain HTML.
- An entry in `/sitemap.xml`, the RSS feed at `/blog/feed.xml`, and `/llms.txt` for AI tools.
- A plain Markdown copy at `/blog/your-post-name.md`, and the full text in `/llms-full.txt`.
- Article details for Google (structured data), and a 1200 x 630 share image made from the cover.
