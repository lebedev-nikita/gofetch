install:
  pnpm install --frozen-lockfile

build: install
  pnpm run build

test: install
  pnpm test

publish: test build
  pnpm publish
