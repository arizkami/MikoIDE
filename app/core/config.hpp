#pragma once
#include <string>

class AppConfig {
public:
    // Returns true if the application is running in debug mode
    static bool IsDebugMode();
    
    // Returns the startup URL for the CEF browser
    static std::string GetStartupUrl();
    
    // Returns true if dark theme should be enabled
    static bool IsDarkThemeEnabled();
    
    // Additional configuration methods can be added here
    static int GetWindowWidth();
    static int GetWindowHeight();
    static int GetRemoteDebuggingPort();
    
private:
    // Configuration constants
    static constexpr bool DEBUG_MODE = 
#ifdef _DEBUG
        true;
#else
        false;
#endif
    
    // Enable dark theme by default
    static constexpr bool DARK_THEME_ENABLED = true;
    
    static constexpr int DEFAULT_WIDTH = 1200;
    static constexpr int DEFAULT_HEIGHT = 800;
    static constexpr int DEBUG_PORT = 9222;
    
    // URLs
    static constexpr const char* DEVELOPMENT_URL = "http://localhost:5173";
    static constexpr const char* PRODUCTION_URL = "file:///resources/app.pak/index.html";
};