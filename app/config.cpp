#include "config.h"
#include "logger.h"
#include <fstream>
#include <iostream>

Config::Config() 
    : debug_mode_(true)
    , window_width_(1200)
    , window_height_(800)
    , window_title_("MikoIDE")
    , dev_server_url_("http://localhost:5173")
    , pak_file_path_("resources.pak")
    , log_level_("INFO") {
}

bool Config::load() {
    try {
        // Check if we're in debug or release mode
        #ifdef _DEBUG
            debug_mode_ = true;
            Logger::getInstance().info("Running in DEBUG mode - using dev server");
        #else
            debug_mode_ = false;
            Logger::getInstance().info("Running in RELEASE mode - using pak files");
        #endif
        
        // Load additional config from file if exists
        std::ifstream config_file("config.json");
        if (config_file.is_open()) {
            // TODO: Parse JSON config file
            Logger::getInstance().info("Config file loaded successfully");
        } else {
            Logger::getInstance().warn("No config file found, using defaults");
        }
        
        return true;
    } catch (const std::exception& e) {
        Logger::getInstance().error("Failed to load config: " + std::string(e.what()));
        return false;
    }
}

bool Config::isDebugMode() const {
    return debug_mode_;
}

int Config::getWindowWidth() const {
    return window_width_;
}

int Config::getWindowHeight() const {
    return window_height_;
}

const std::string& Config::getWindowTitle() const {
    return window_title_;
}

const std::string& Config::getDevServerUrl() const {
    return dev_server_url_;
}

const std::string& Config::getPakFilePath() const {
    return pak_file_path_;
}

const std::string& Config::getLogLevel() const {
    return log_level_;
}