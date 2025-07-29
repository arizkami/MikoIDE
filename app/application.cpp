#include "application.h"
#include "logger.h"
#include "client.h"
#include <include/cef_app.h>
#include <include/cef_browser.h>
#include <include/cef_frame.h>
#include <include/wrapper/cef_helpers.h>
#include <SDL2/SDL.h>
#include <SDL2/SDL_syswm.h>

Application::Application(const Config& config) 
    : config_(config)
    , sdl_window_(nullptr)
    , sdl_renderer_(nullptr)
    , running_(false) {
}

Application::~Application() {
    cleanup();
}

int Application::run(int argc, char* argv[]) {
    Logger::getInstance().info("Initializing application");
    
    // Initialize SDL
    if (!initializeSDL()) {
        Logger::getInstance().error("Failed to initialize SDL");
        return -1;
    }
    
    // Initialize CEF
    if (!initializeCEF(argc, argv)) {
        Logger::getInstance().error("Failed to initialize CEF");
        cleanup();
        return -1;
    }
    
    // Create browser
    if (!createBrowser()) {
        Logger::getInstance().error("Failed to create browser");
        cleanup();
        return -1;
    }
    
    // Main message loop
    running_ = true;
    mainLoop();
    
    // Cleanup
    cleanup();
    
    Logger::getInstance().info("Application shutdown complete");
    return 0;
}

bool Application::initializeSDL() {
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        Logger::getInstance().error("SDL initialization failed: " + std::string(SDL_GetError()));
        return false;
    }
    
    // Create window
    sdl_window_ = SDL_CreateWindow(
        config_.getWindowTitle().c_str(),
        SDL_WINDOWPOS_CENTERED,
        SDL_WINDOWPOS_CENTERED,
        config_.getWindowWidth(),
        config_.getWindowHeight(),
        SDL_WINDOW_SHOWN | SDL_WINDOW_RESIZABLE
    );
    
    if (!sdl_window_) {
        Logger::getInstance().error("SDL window creation failed: " + std::string(SDL_GetError()));
        return false;
    }
    
    // Create renderer
    sdl_renderer_ = SDL_CreateRenderer(sdl_window_, -1, SDL_RENDERER_ACCELERATED);
    if (!sdl_renderer_) {
        Logger::getInstance().error("SDL renderer creation failed: " + std::string(SDL_GetError()));
        return false;
    }
    
    Logger::getInstance().info("SDL initialized successfully");
    return true;
}

bool Application::initializeCEF(int argc, char* argv[]) {
    // CEF settings
    CefSettings settings;
    settings.no_sandbox = true;
    settings.log_severity = LOGSEVERITY_INFO;
    
    if (config_.isDebugMode()) {
        settings.remote_debugging_port = 9222;
        Logger::getInstance().info("CEF remote debugging enabled on port 9222");
    } else {
        // In release mode, set up resource handling for .pak files
        CefString(&settings.resources_dir_path) = "resources";
        CefString(&settings.locales_dir_path) = "locales";
        Logger::getInstance().info("CEF configured for release mode with pak files");
    }
    
    // Initialize CEF
    if (!CefInitialize(CefMainArgs(argc, argv), settings, nullptr, nullptr)) {
        Logger::getInstance().error("CEF initialization failed");
        return false;
    }
    
    Logger::getInstance().info("CEF initialized successfully");
    return true;
}

bool Application::createBrowser() {
    // Get window handle for CEF
    SDL_SysWMinfo wm_info;
    SDL_VERSION(&wm_info.version);
    if (!SDL_GetWindowWMInfo(sdl_window_, &wm_info)) {
        Logger::getInstance().error("Failed to get window info: " + std::string(SDL_GetError()));
        return false;
    }
    
    // Create CEF browser
    CefWindowInfo window_info;
    
#ifdef _WIN32
    window_info.SetAsChild(wm_info.info.win.window, 
                          {0, 0, config_.getWindowWidth(), config_.getWindowHeight()});
#elif defined(__linux__)
    window_info.SetAsChild(wm_info.info.x11.window,
                          {0, 0, config_.getWindowWidth(), config_.getWindowHeight()});
#elif defined(__APPLE__)
    window_info.SetAsChild(wm_info.info.cocoa.window,
                          {0, 0, config_.getWindowWidth(), config_.getWindowHeight()});
#endif
    
    CefBrowserSettings browser_settings;
    browser_settings.web_security = STATE_DISABLED; // Allow local file access
    
    // Create client
    client_ = new MikoClient(config_);
    
    // Determine URL to load
    std::string url;
    if (config_.isDebugMode()) {
        url = config_.getDevServerUrl();
        Logger::getInstance().info("Loading dev server: " + url);
    } else {
        url = "file://" + config_.getPakFilePath() + "/index.html";
        Logger::getInstance().info("Loading from pak file: " + url);
    }
    
    // Create browser
    CefRefPtr<CefBrowser> browser = CefBrowserHost::CreateBrowserSync(
        window_info, client_, url, browser_settings, nullptr, nullptr);
    
    if (!browser) {
        Logger::getInstance().error("Failed to create CEF browser");
        return false;
    }
    
    Logger::getInstance().info("Browser created successfully");
    return true;
}

void Application::mainLoop() {
    SDL_Event event;
    
    while (running_) {
        // Handle SDL events
        while (SDL_PollEvent(&event)) {
            handleSDLEvent(event);
        }
        
        // Process CEF message loop
        CefDoMessageLoopWork();
        
        // Check if client is closing
        if (client_ && client_->IsClosing()) {
            running_ = false;
        }
        
        // Small delay to prevent high CPU usage
        SDL_Delay(1);
    }
}

void Application::handleSDLEvent(const SDL_Event& event) {
    switch (event.type) {
        case SDL_QUIT:
            Logger::getInstance().info("Quit event received");
            running_ = false;
            if (client_) {
                client_->CloseAllBrowsers(false);
            }
            break;
            
        case SDL_WINDOWEVENT:
            if (event.window.event == SDL_WINDOWEVENT_RESIZED) {
                Logger::getInstance().debug("Window resized: " + 
                    std::to_string(event.window.data1) + "x" + 
                    std::to_string(event.window.data2));
                // TODO: Resize CEF browser
            }
            break;
            
        default:
            break;
    }
}

void Application::cleanup() {
    if (client_) {
        client_->CloseAllBrowsers(true);
        client_ = nullptr;
    }
    
    // Shutdown CEF
    CefShutdown();
    
    // Cleanup SDL
    if (sdl_renderer_) {
        SDL_DestroyRenderer(sdl_renderer_);
        sdl_renderer_ = nullptr;
    }
    
    if (sdl_window_) {
        SDL_DestroyWindow(sdl_window_);
        sdl_window_ = nullptr;
    }
    
    SDL_Quit();
    
    Logger::getInstance().info("Cleanup completed");
}