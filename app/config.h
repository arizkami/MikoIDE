#pragma once

#include <string>

class Config {
public:
    Config();
    ~Config() = default;
    
    bool load();
    
    // Getters
    bool isDebugMode() const;
    int getWindowWidth() const;
    int getWindowHeight() const;
    const std::string& getWindowTitle() const;
    const std::string& getDevServerUrl() const;
    const std::string& getPakFilePath() const;
    const std::string& getLogLevel() const;
    
private:
    bool debug_mode_;
    int window_width_;
    int window_height_;
    std::string window_title_;
    std::string dev_server_url_;
    std::string pak_file_path_;
    std::string log_level_;
};