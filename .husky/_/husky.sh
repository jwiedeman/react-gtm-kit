#!/usr/bin/env sh
if [ "$HUSKY" = "1" ]; then
  exit 0
fi
export HUSKY=1
. "$(dirname -- "$0")/_/h"
