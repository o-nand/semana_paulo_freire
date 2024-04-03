#!/usr/bin/env sh

SRC_DIR="src"
BIN_DIR="bin"
RAYLIB_DIR="raylib"

# armazena todos os arquivos que compõem o projeto
SRCS=$(find $SRC_DIR -type f -name \*.cpp)

# criará a pasta de arquivos binários, caso ela não existir
if [ ! -d "$BIN_DIR" ]; then
    echo "LOG: criando $BIN_DIR/..."
    mkdir -p "$BIN_DIR"
fi

# compilará a biblioteca, caso ela não estiver presente
if [ ! -f "$BIN_DIR/libraylib.a" ]; then
    echo "LOG: compilando biblioteca..."
    make -C "$RAYLIB_DIR/src/" PLATFORM=PLATFORM_WEB RAYLIB_RELEASE_PATH="$(pwd)/$BIN_DIR" -B
fi

# compilará o projeto
echo "LOG: compilando projeto..."
emcc -o "$BIN_DIR"/game.html "$SRCS" -Wall "$BIN_DIR"/libraylib.a -I"$RAYLIB_DIR"/src/ -L"$BIN_DIR"/libraylib.a -s USE_GLFW=3 --shell-file "$RAYLIB_DIR"/src/shell.html -DPLATFORM_WEB
