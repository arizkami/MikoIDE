cmake_minimum_required(VERSION 3.19)
project(MikoIDE)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include FetchContent for downloading dependencies
include(FetchContent)

# Download and build SDL2
FetchContent_Declare(
    SDL2
    GIT_REPOSITORY https://github.com/libsdl-org/SDL.git
    GIT_TAG release-2.28.5
    GIT_SHALLOW TRUE
)

# Configure SDL2 options
set(SDL_SHARED ON CACHE BOOL "Build SDL2 as shared library")
set(SDL_STATIC OFF CACHE BOOL "Build SDL2 as static library")
set(SDL_TEST OFF CACHE BOOL "Build SDL2 test programs")

FetchContent_MakeAvailable(SDL2)

# Set CEF version and platform
set(CEF_VERSION "138.0.27+g0b28f18+chromium-138.0.7204.158")
if(WIN32)
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(CEF_PLATFORM "windows64")
    else()
        set(CEF_PLATFORM "windows32")
    endif()
elseif(APPLE)
    set(CEF_PLATFORM "macosx64")
else()
    if(CMAKE_SIZEOF_VOID_P EQUAL 8)
        set(CEF_PLATFORM "linux64")
    else()
        set(CEF_PLATFORM "linux32")
    endif()
endif()

# CEF download URL and paths
set(CEF_DOWNLOAD_URL "https://cef-builds.spotifycdn.com/cef_binary_${CEF_VERSION}_${CEF_PLATFORM}.tar.bz2")
set(CEF_ROOT "${CMAKE_BINARY_DIR}/cef")
set(CEF_ARCHIVE "${CMAKE_BINARY_DIR}/cef_binary.tar.bz2")
set(CEF_EXTRACTED_DIR "${CMAKE_BINARY_DIR}/cef_binary_${CEF_VERSION}_${CEF_PLATFORM}")

# Function to download and extract CEF
function(download_cef)
    if(NOT EXISTS "${CEF_ROOT}")
        message(STATUS "Downloading CEF from ${CEF_DOWNLOAD_URL}")
        
        # Download CEF
        file(DOWNLOAD "${CEF_DOWNLOAD_URL}" "${CEF_ARCHIVE}"
             SHOW_PROGRESS
             STATUS download_status
             LOG download_log)
        
        list(GET download_status 0 status_code)
        if(NOT status_code EQUAL 0)
            message(FATAL_ERROR "Failed to download CEF: ${download_log}")
        endif()
        
        # Extract CEF
        message(STATUS "Extracting CEF...")
        execute_process(
            COMMAND ${CMAKE_COMMAND} -E tar xjf "${CEF_ARCHIVE}"
            WORKING_DIRECTORY "${CMAKE_BINARY_DIR}"
            RESULT_VARIABLE extract_result
        )
        
        if(NOT extract_result EQUAL 0)
            message(FATAL_ERROR "Failed to extract CEF archive")
        endif()
        
        # Move extracted directory to CEF_ROOT
        file(RENAME "${CEF_EXTRACTED_DIR}" "${CEF_ROOT}")
        
        # Clean up archive
        file(REMOVE "${CEF_ARCHIVE}")
        
        message(STATUS "CEF downloaded and extracted successfully")
    else()
        message(STATUS "CEF already exists at ${CEF_ROOT}")
    endif()
endfunction()

# Download CEF
download_cef()

# Set CEF_ROOT for find_package
set(CEF_ROOT "${CEF_ROOT}")

# Add CEF cmake modules to path
list(APPEND CMAKE_MODULE_PATH "${CEF_ROOT}/cmake")

# Find CEF
find_package(CEF REQUIRED)

# Determine the target output directory based on platform and generator
if(CMAKE_CONFIGURATION_TYPES)
    # Multi-config generators (Visual Studio, Xcode)
    set(CEF_TARGET_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/$<CONFIGURATION>")
else()
    # Single-config generators (Ninja, Make)
    set(CEF_TARGET_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/${CMAKE_BUILD_TYPE}")
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CEF_TARGET_OUT_DIR})
    set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CEF_TARGET_OUT_DIR})
endif()

# Create logical targets for CEF libraries
if(OS_WINDOWS)
    # Create libcef_lib target
    add_library(libcef_lib SHARED IMPORTED)
    set_target_properties(libcef_lib PROPERTIES
        IMPORTED_LOCATION "${CEF_ROOT}/Release/libcef.dll"
        IMPORTED_LOCATION_DEBUG "${CEF_ROOT}/Debug/libcef.dll"
        IMPORTED_LOCATION_RELEASE "${CEF_ROOT}/Release/libcef.dll"
        IMPORTED_IMPLIB "${CEF_ROOT}/Release/libcef.lib"
        IMPORTED_IMPLIB_DEBUG "${CEF_ROOT}/Debug/libcef.lib"
        IMPORTED_IMPLIB_RELEASE "${CEF_ROOT}/Release/libcef.lib"
    )
    
    # Create libcef_dll_wrapper target
    add_subdirectory("${CEF_ROOT}/libcef_dll" libcef_dll_wrapper)
endif()

# Add executable as Windows application (no console)
add_executable(${PROJECT_NAME} WIN32
    app/main.cpp
    app/core/config.cpp
    app/core/logger.cpp
    app/core/client.cpp
    app/core/app.cpp
    app/sandbox/extension-sandbox.cpp
    app/sandbox/native-function-handler.cpp
    app/sandbox/v8-context-manager.cpp
    app/sandbox/sandbox.cpp
    app/utils/terminal.cpp
)

# Set target properties using CEF macros
SET_EXECUTABLE_TARGET_PROPERTIES(${PROJECT_NAME})

# Link SDL2 and CEF libraries
target_link_libraries(${PROJECT_NAME}
    SDL2::SDL2
    SDL2::SDL2main
    libcef_lib
    libcef_dll_wrapper
    ${CEF_STANDARD_LIBS}
)

# Include directories
target_include_directories(${PROJECT_NAME} PRIVATE
    ${CEF_ROOT}
)

# Copy CEF binaries and resources to output directory
if(OS_WINDOWS)
    # Copy CEF binary files
    COPY_FILES("${PROJECT_NAME}" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
    
    # Copy CEF resource files
    COPY_FILES("${PROJECT_NAME}" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")
    
    # Copy SDL2 DLL to output directory
    add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_FILE:SDL2::SDL2>
        $<TARGET_FILE_DIR:${PROJECT_NAME}>
        COMMENT "Copying SDL2 DLL to output directory"
    )
    
    # Copy React build assets for release builds
    if(CMAKE_BUILD_TYPE STREQUAL "Release" OR "$<CONFIG>" STREQUAL "Release")
        add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CMAKE_SOURCE_DIR}/renderer/dist"
            "${CEF_TARGET_OUT_DIR}/assets"
            COMMENT "Copying React build assets to release directory"
        )
    endif()
endif()

# Set startup project for Visual Studio
if(WIN32)
    set_property(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT ${PROJECT_NAME})
endif()

# Print CEF configuration
PRINT_CEF_CONFIG()