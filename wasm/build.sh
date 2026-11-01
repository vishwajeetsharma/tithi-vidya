#!/bin/sh
# Builds the WebAssembly engine and copies it into the website. Vercel does not
# need Rust: run this after changing cli/ or wasm/, and commit the result.
#
#   rustup target add wasm32-unknown-unknown   (once)
#   ./wasm/build.sh
set -eu
cd "$(dirname "$0")"
cargo build --release --target wasm32-unknown-unknown
mkdir -p ../site/src/engine
cp target/wasm32-unknown-unknown/release/tithi_wasm.wasm ../site/src/engine/tithi.wasm
ls -l ../site/src/engine/tithi.wasm
