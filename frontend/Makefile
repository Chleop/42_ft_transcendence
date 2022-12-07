TSC      := tsc
TSCFLAGS := --module es6 --target es6 --lib ES2015,dom

SRC_DIR  := src

.PHONY: all
all:
	$(TSC) $(TSCFLAGS) $(SRC_DIR)/main.ts
	/bin/sh fix_imports.sh

.PHONY: clean
clean:
	rm -f $(shell find $(SRC_DIR) -type f -name '*.js')
