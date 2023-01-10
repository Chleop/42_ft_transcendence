TSC      := tsc
TSCFLAGS := --target ES6 --module ES6 --lib dom,es6

SRC_DIR  := ./src
OUT_DIR  := ./out
WWW_DIR  := ./www

MAIN     := $(SRC_DIR)/main.ts
BUNDLE   := $(WWW_DIR)/script.js

TS_FILES := $(shell find $(SRC_DIR) -name '*.ts' -type f)
JS_FILES := $(patsubst $(SRC_DIR)/%.ts,$(OUT_DIR)/%.js,$(TS_FILES))

.PHONY: all
all: $(BUNDLE)

$(BUNDLE): $(TS_FILES)
	tsc $(TSCFLAGS) --outDir $(OUT_DIR) $(MAIN)
	rollup $(patsubst $(SRC_DIR)/%.ts,$(OUT_DIR)/%.js,$(MAIN)) --file $(BUNDLE) --format iife

.PHONY: clean
clean:
	rm -f $(JS_FILES)
	rm -f $(BUNDLE)
