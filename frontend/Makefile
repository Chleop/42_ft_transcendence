TSC      := tsc
TSCFLAGS := --module ES6 --target ES6 --lib ES2015,dom

SRC_DIR  := ./src
OUT_DIR  := ./out

.PHONY: all
all:
	$(TSC) $(TSCFLAGS) $(SRC_DIR)/main.ts --outDir $(OUT_DIR)
	/bin/sh fix_imports.sh

.PHONY: clean
clean:
	rm -f $(shell find $(OUT_DIR) -type f -name '*.js')
