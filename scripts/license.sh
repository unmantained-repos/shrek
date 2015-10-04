#!/bin/sh
json -I -f package.json -e 'this.license="mit"'
licejs mit | head -n 3  | sed 's/$/\n/' >> readme.md &&
licejs mit > license
