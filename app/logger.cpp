#include "logger.h"
#include <iostream>
#include <fstream>
#include <chrono>
#include <iomanip>
#include <sstream>

Logger& Logger::getInstance() {
    static Logger instance;
    return instance;
}

Logger::Logger() : log_level_(LogLevel::INFO) {}

Logger::~Logger() {
    if (log_file_.is_open()) {
        log_file_.close();
    }
}

bool Logger::initialize() {
    try {
        log_file_.open("mikoidе.log", std::ios::app);
        if (!log_file_.is_open()) {
            std::cerr << "Warning: Could not open log file" << std::endl;
            return false;
        }
        
        info("Logger initialized");
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Failed to initialize logger: " << e.what() << std::endl;
        return false;
    }
}

void Logger::setLogLevel(LogLevel level) {
    log_level_ = level;
}

void Logger::log(LogLevel level, const std::string& message) {
    if (level < log_level_) {
        return;
    }
    
    std::string timestamp = getCurrentTimestamp();
    std::string level_str = logLevelToString(level);
    std::string formatted_message = "[" + timestamp + "] [" + level_str + "] " + message;
    
    // Output to console
    std::cout << formatted_message << std::endl;
    
    // Output to file
    if (log_file_.is_open()) {
        log_file_ << formatted_message << std::endl;
        log_file_.flush();
    }
}

void Logger::debug(const std::string& message) {
    log(LogLevel::DEBUG, message);
}

void Logger::info(const std::string& message) {
    log(LogLevel::INFO, message);
}

void Logger::warn(const std::string& message) {
    log(LogLevel::WARN, message);
}

void Logger::error(const std::string& message) {
    log(LogLevel::ERROR, message);
}

std::string Logger::getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    ss << '.' << std::setfill('0') << std::setw(3) << ms.count();
    return ss.str();
}

std::string Logger::logLevelToString(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO:  return "INFO";
        case LogLevel::WARN:  return "WARN";
        case LogLevel::ERROR: return "ERROR";
        default: return "UNKNOWN";
    }
}