#!/bin/sh

# This script is a dirty fix required because the TypeScript compiler does not seem to convert
# import paths properly.
#
# It converts (from TypeScript):
#
#     import /* ... */ from "./foo"
#
# Into JavaScript:
#
#     import /* ... */ from "./foo"
#
# When it should be:
#
#     import /* ... */ from "./foo.js"
#
# This script walks through every compiler javascript file and replaces manually import
# directives.

for file in $(find . -name '*.js' -type f)
do
    # I <3 sed ;)
    sed -i 's/import\(.*\)from "\(.\/\|..\/\)\(.*\)";$/import\1from "\2\3.js";/g' $file
done
