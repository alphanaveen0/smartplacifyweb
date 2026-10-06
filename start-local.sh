#!/bin/zsh

set -e

export PATH="/private/tmp/node-smartplacify/bin:$PATH"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js was not found."
  echo "Install Node.js or ask Codex to recreate the portable Node runtime."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  npm install --cache /private/tmp/smartplacify-npm-cache --no-audit --no-fund
fi

npm run dev -- --host 127.0.0.1
