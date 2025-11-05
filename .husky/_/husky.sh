#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1

  if [ -f "$HOME/.huskyrc" ]; then
    . "$HOME/.huskyrc"
  fi

  command_exists () {
    command -v "$1" >/dev/null 2>&1
  }

  if command_exists pnpm; then
    pnpm exec "$@"
  elif command_exists yarn; then
    yarn exec "$@"
  elif command_exists npx; then
    npx --no-install "$@"
  else
    "$@"
  fi
fi
