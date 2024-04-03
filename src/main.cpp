#include <cstdint>
#include <cstdlib>
#include <cstring>

#include <emscripten/emscripten.h>
#include "raylib.h"

static void game_loop();

int32_t main(){
    SetConfigFlags(FLAG_WINDOW_RESIZABLE);
    InitWindow(400, 200, "teste");

    emscripten_set_main_loop(game_loop, 60, 1);

    CloseWindow();

    return EXIT_SUCCESS;
}

static void game_loop() {
    const auto    msg      = "Olá, mundo!";
    const int32_t msg_size = 50;
    const int32_t msg_x    = (GetScreenWidth() / 2) - (strlen(msg) * 10);
    const int32_t msg_y    = (GetScreenHeight() / 2) - msg_size;

    BeginDrawing();
        ClearBackground(RAYWHITE);
        DrawText(msg, msg_x, msg_y, msg_size, BLACK);
    EndDrawing();
}
