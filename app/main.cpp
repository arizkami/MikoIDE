#include "application.h"
#include "config.h"
#include "logger.h"
#include "main.h"
#include <iostream>

int main(int argc, char* argv[]) {
    try {
        // Initialize logger
        Logger::getInstance().initialize();
        Logger::getInstance().info("Starting MikoIDE Application");
        
        // Load configuration
        Config config;
        if (!config.load()) {
            Logger::getInstance().error("Failed to load configuration");
            return -1;
        }
        
        // Create and run application
        Application app(config);
        int result = app.run(argc, argv);
        
        Logger::getInstance().info("Application exited with code: " + std::to_string(result));
        return result;
        
    } catch (const std::exception& e) {
        std::cerr << "Fatal error: " << e.what() << std::endl;
        return -1;
    }
}