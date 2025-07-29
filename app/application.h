#pragma once

#include "config.h"
#include "client.h"
#include <SDL2/SDL.h>
#include <include/cef_base.h>

class Application {
public:
    explicit Application(const Config& config);
    ~Application();
    
    int run(int argc, char* argv[]);
    
private:
    bool initializeSDL();
    bool initializeCEF(int argc, char* argv[]);
    bool createBrowser();
    void mainLoop();
    void handleSDLEvent(const SDL_Event& event);
    void cleanup();
    
    const Config& config_;
    SDL_Window* sdl_window_;
    SDL_Renderer* sdl_renderer_;
    CefRefPtr<MikoClient> client_;
    bool running_;
};