## explore-llms

Just exploring gpt and shit

### Setup

- Get ollama & docker

- Install a ollama model

  ```
  ollama run mistral
  ```

- Start docker compose so we have postgres with pgvector running

  ```
  docker-compose up -d
  ```

- Install the deps

  ```
  pnpm i # install deps
  ```

### Generating a dataset & running

- Get your bookmarks or use my bookmarks json (./sample-bookmarks.html)

  Save the bookmarks at root with filename `./bookmarks.html`

- Now you generate the dataset

  ```
  pnpm generate
  ```

  This will parse bookmarks file & run puppeteer and grab title & meta for all bookmarks

  This data will be put in `./dataset.json` and then put in vector db when running

- And now you can run the main process and give a prompt
  ```
  pnpm dev
  ```
