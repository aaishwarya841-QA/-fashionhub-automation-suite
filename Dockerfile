# Official Playwright image: Node + all 3 browsers + OS deps preinstalled,
# so no extra "playwright install" step or missing-library issues in CI.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Sanity check that TypeScript compiles as part of the image build.
RUN npm run build

ENV CI=true

ENTRYPOINT ["npx", "playwright", "test"]
