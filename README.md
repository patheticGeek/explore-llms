## explore-llms

Just exploring LLMs and stuff

The goal here is to make an assistant that does not cost me anything and can find websites for people's described use case from my bookmarks.

<details>
<summary>See sample query output</summary>

```
➜ pnpm query

> explore-llms@0.0.1 query /home/geek/personal-projects/explore-llms
> tsx src/query.ts

✔ What resource are you looking for? … ui/ux practice websites
Getting it for ya...
function calls [
  {
    name: 'query_vector_db',
    args: { query: 'ui/ux practice websites' }
  }
]
text response: Here are some of the best UI/UX practice websites I found:

*   **uiw.tf**: <https://uiw.tf/>. A collection of user interface components and patterns. Good for getting inspiration or references.

*   **UX Design Challenges**: <https://uxtools.co/challenges/>. Offers a variety of UX design challenges to help you practice your skills. This is great for hands-on learning and problem-solving.

*   **UI Design Daily**: <https://www.uidesigndaily.com/>. Provides free UI resources and daily design inspiration. This is a great way to stay updated with current trends.

*   **UI Playbook**: <https://uiplaybook.dev/>. A resource with common UI patterns and best practices. This can be helpful for understanding the fundamentals of UI design.

*   **Refactoring UI**: <https://www.refactoringui.com/>. Offers design tips and tricks, particularly focusing on improving existing UIs. Good for learning how to refine and enhance designs.

*   **UX Tools**: <https://uxtools.co/>. A website with a wide range of UX tools, resources and insights.

*   **GUI Challenges - YouTube**: <https://www.youtube.com/playlist?list=PLNYkxOF6rcIAaV1wwI9540OC_3XoIzMjQ>. This YouTube playlist presents GUI challenges to help improve your design skills. Great for visual learners and those who prefer video tutorials.

*   **Collect UI**: <https://collectui.com/>. A large collection of UI design examples and resources. Useful for inspiration and finding design patterns.

result generated in 7s
Done...
```

</details>

### Uses

- [Gemini](https://aistudio.google.com/): The "AI model" we use. We use 8B param one to summarize and then smaller flash for queries with vector DB. We give the model a query function so it can query db (multiple times if needed, eg. in case of spelling mistake or trials with multiple words).

- [Upstash](https://upstash.com/): We use this for our vector db and it already provides models for embedding so yay! one less step (& payment if needed) for me.

### Setup

- Get gemini api key

- Create a upstash vector db with an embedding model (`mxbai-embed-large-v1` or whatever latest they say is the best in [the docs](https://upstash.com/docs/vector/features/embeddingmodels#models))

- Add api keys in `.env` file

- Install the deps

  ```
  pnpm install
  ```

### Generating a dataset & running

- Get your bookmarks or use my bookmarks json [./sample/bookmarks.html](sample/bookmarks.html)

Save the bookmarks at top level (next to package.json) with filename `./bookmarks.html`

- Now you generate the dataset

  ```
  pnpm generateDataset
  ```

This will parse bookmarks file & run puppeteer and grab content for all bookmarks

This data will be put in `./dataset` folder

- Now we summarize using gemini and index these pages into vector db

  ```
  pnpm summarizeAndIndex
  ```

- And now you can run a query to find what you want!

  ```
  pnpm query
  ```
