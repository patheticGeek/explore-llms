## explore-llms

Just exploring gpt and shit

### How to start

- Get ollama & docker

- Install a ollama model

  ```
  ollama run mistral
  ```

- Start docker compose so we have postgres with pgvector running

  ```
  docker-compose up -d
  ```

- Start the project
  ```
  pnpm i # install deps
  pnpm dev # runs
  ```
