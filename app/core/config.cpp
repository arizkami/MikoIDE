#include "config.hpp"

bool AppConfig::IsDebugMode() {
    return DEBUG_MODE;
}

std::string AppConfig::GetStartupUrl() {
    return IsDebugMode() ? DEVELOPMENT_URL : PRODUCTION_URL;
}

bool AppConfig::IsDarkThemeEnabled() {
    return DARK_THEME_ENABLED;
}

int AppConfig::GetWindowWidth() {
    return DEFAULT_WIDTH;
}

int AppConfig::GetWindowHeight() {
    return DEFAULT_HEIGHT;
}

int AppConfig::GetRemoteDebuggingPort() {
    return DEBUG_PORT;
}