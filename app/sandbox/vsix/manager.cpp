#include "manager.hpp"
#include "../core/logger.hpp"
#include <fstream>
#include <sstream>
#include <filesystem>
#include <json/json.h> // You may need to add JSON library

namespace MikoIDE {
    namespace Sandbox {
        
        ExtensionManager::ExtensionManager() : initialized_(false) {
        }
        
        ExtensionManager::~ExtensionManager() {
        }
        
        bool ExtensionManager::Initialize(const std::string& extensionsDir) {
            if (initialized_) {
                return true;
            }
            
            // Set extensions directory relative to app directory
            extensions_dir_ = std::filesystem::current_path().string() + "\\" + extensionsDir;
            
            // Create extensions directory if it doesn't exist
            try {
                if (!std::filesystem::exists(extensions_dir_)) {
                    std::filesystem::create_directories(extensions_dir_);
                    Logger::LogMessage("Created extensions directory: " + extensions_dir_);
                }
                
                LoadExtensions();
                initialized_ = true;
                Logger::LogMessage("Extension manager initialized successfully");
                return true;
                
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to initialize extension manager: " + std::string(e.what()));
                return false;
            }
        }
        
        bool ExtensionManager::InstallExtension(const std::string& vsixPath) {
            if (!initialized_) {
                Logger::LogMessage("Extension manager not initialized");
                return false;
            }
            
            try {
                // Extract VSIX file name without extension as temp ID
                std::filesystem::path vsixFile(vsixPath);
                std::string tempId = vsixFile.stem().string();
                
                // Create temporary extraction directory
                std::string extractPath = extensions_dir_ + "\\" + tempId + "_temp";
                
                if (!ExtractVSIX(vsixPath, extractPath)) {
                    Logger::LogMessage("Failed to extract VSIX: " + vsixPath);
                    return false;
                }
                
                // Parse package.json manifest
                std::string manifestPath = extractPath + "\\package.json";
                ExtensionInfo info;
                
                if (!ParseManifest(manifestPath, info)) {
                    Logger::LogMessage("Failed to parse manifest: " + manifestPath);
                    std::filesystem::remove_all(extractPath);
                    return false;
                }
                
                // Move to final location with proper extension ID
                std::string finalPath = extensions_dir_ + "\\" + info.id;
                
                if (std::filesystem::exists(finalPath)) {
                    Logger::LogMessage("Extension already exists: " + info.id);
                    std::filesystem::remove_all(extractPath);
                    return false;
                }
                
                std::filesystem::rename(extractPath, finalPath);
                info.path = finalPath;
                info.manifestPath = finalPath + "\\package.json";
                info.isActive = true;
                
                installed_extensions_[info.id] = info;
                
                Logger::LogMessage("Extension installed successfully: " + info.name + " (" + info.id + ")");
                return true;
                
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to install extension: " + std::string(e.what()));
                return false;
            }
        }
        
        bool ExtensionManager::UninstallExtension(const std::string& extensionId) {
            auto it = installed_extensions_.find(extensionId);
            if (it == installed_extensions_.end()) {
                Logger::LogMessage("Extension not found: " + extensionId);
                return false;
            }
            
            try {
                std::filesystem::remove_all(it->second.path);
                installed_extensions_.erase(it);
                Logger::LogMessage("Extension uninstalled: " + extensionId);
                return true;
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to uninstall extension: " + std::string(e.what()));
                return false;
            }
        }
        
        bool ExtensionManager::LoadExtensions() {
            if (!std::filesystem::exists(extensions_dir_)) {
                return true; // No extensions directory yet
            }
            
            try {
                ScanExtensionsDirectory();
                Logger::LogMessage("Loaded " + std::to_string(installed_extensions_.size()) + " extensions");
                return true;
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to load extensions: " + std::string(e.what()));
                return false;
            }
        }
        
        std::vector<ExtensionInfo> ExtensionManager::GetInstalledExtensions() const {
            std::vector<ExtensionInfo> extensions;
            for (const auto& pair : installed_extensions_) {
                extensions.push_back(pair.second);
            }
            return extensions;
        }
        
        ExtensionInfo* ExtensionManager::GetExtension(const std::string& extensionId) {
            auto it = installed_extensions_.find(extensionId);
            return (it != installed_extensions_.end()) ? &it->second : nullptr;
        }
        
        bool ExtensionManager::SetExtensionActive(const std::string& extensionId, bool active) {
            auto it = installed_extensions_.find(extensionId);
            if (it != installed_extensions_.end()) {
                it->second.isActive = active;
                Logger::LogMessage("Extension " + extensionId + (active ? " enabled" : " disabled"));
                return true;
            }
            return false;
        }
        
        bool ExtensionManager::ExtractVSIX(const std::string& vsixPath, const std::string& extractPath) {
            // VSIX files are ZIP archives
            // You'll need to implement ZIP extraction here
            // For now, this is a placeholder
            Logger::LogMessage("Extracting VSIX: " + vsixPath + " to " + extractPath);
            
            // Create extraction directory
            std::filesystem::create_directories(extractPath);
            
            // TODO: Implement actual ZIP extraction
            // You can use libraries like minizip or libzip
            
            return true; // Placeholder
        }
        
        bool ExtensionManager::ParseManifest(const std::string& manifestPath, ExtensionInfo& info) {
            try {
                std::ifstream file(manifestPath);
                if (!file.is_open()) {
                    return false;
                }
                
                std::stringstream buffer;
                buffer << file.rdbuf();
                std::string content = buffer.str();
                
                // TODO: Parse JSON manifest
                // For now, extract basic info from filename
                std::filesystem::path path(manifestPath);
                std::string dirName = path.parent_path().filename().string();
                
                info.id = dirName;
                info.name = dirName;
                info.version = "1.0.0";
                
                return true;
                
            } catch (const std::exception& e) {
                Logger::LogMessage("Failed to parse manifest: " + std::string(e.what()));
                return false;
            }
        }
        
        void ExtensionManager::ScanExtensionsDirectory() {
            for (const auto& entry : std::filesystem::directory_iterator(extensions_dir_)) {
                if (entry.is_directory()) {
                    std::string manifestPath = entry.path().string() + "\\package.json";
                    
                    if (std::filesystem::exists(manifestPath)) {
                        ExtensionInfo info;
                        if (ParseManifest(manifestPath, info)) {
                            info.path = entry.path().string();
                            info.manifestPath = manifestPath;
                            info.isActive = true;
                            installed_extensions_[info.id] = info;
                        }
                    }
                }
            }
        }
        
    }
}