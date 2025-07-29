#pragma once
#include <string>
#include <vector>
#include <memory>
#include <functional>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <atomic>
#include <map>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
#include <fcntl.h>
#else
#include <unistd.h>
#include <sys/wait.h>
#include <pty.h>
#include <termios.h>
#endif

namespace MikoIDE {
    namespace Utils {
        
        struct TerminalMessage {
            enum Type {
                OUTPUT,
                TERMINAL_ERROR,
                EXIT,
                INPUT
            };
            
            Type type;
            std::string data;
            int exitCode;
            
            TerminalMessage(Type t, const std::string& d, int code = 0) 
                : type(t), data(d), exitCode(code) {}
        };
        
        class TerminalProcess {
        public:
            TerminalProcess();
            ~TerminalProcess();
            
            // Start a new terminal process
            bool Start(const std::string& command = "", const std::string& workingDir = "");
            
            // Send input to the terminal
            bool SendInput(const std::string& input);
            
            // Send command to terminal
            bool SendCommand(const std::string& command);
            
            // Kill the terminal process
            bool Kill();
            
            // Check if process is running
            bool IsRunning() const;
            
            // Get process ID
            int GetProcessId() const;
            
            // Set output callback for frontend communication
            void SetOutputCallback(std::function<void(const TerminalMessage&)> callback);
            
            // Resize terminal (for PTY)
            bool Resize(int cols, int rows);
            
        private:
            std::atomic<bool> running_;
            std::atomic<bool> should_stop_;
            
#ifdef _WIN32
            HANDLE process_handle_;
            HANDLE thread_handle_;
            HANDLE stdin_write_;
            HANDLE stdout_read_;
            HANDLE stderr_read_;
            DWORD process_id_;
#else
            pid_t process_id_;
            int master_fd_;
            int slave_fd_;
#endif
            
            std::thread output_thread_;
            std::thread error_thread_;
            std::function<void(const TerminalMessage&)> output_callback_;
            
            std::mutex input_mutex_;
            std::queue<std::string> input_queue_;
            std::condition_variable input_cv_;
            
            // Platform-specific implementations
            bool StartWindows(const std::string& command, const std::string& workingDir);
            bool StartUnix(const std::string& command, const std::string& workingDir);
            
            void OutputReaderThread();
            void ErrorReaderThread();
            void InputWriterThread();
            
            void Cleanup();
        };
        
        class TerminalManager {
        public:
            TerminalManager();
            ~TerminalManager();
            
            // Create a new terminal session
            std::string CreateTerminal(const std::string& command = "", const std::string& workingDir = "");
            
            // Get terminal by ID
            std::shared_ptr<TerminalProcess> GetTerminal(const std::string& terminalId);
            
            // Close terminal session
            bool CloseTerminal(const std::string& terminalId);
            
            // Send input to specific terminal
            bool SendInput(const std::string& terminalId, const std::string& input);
            
            // Send command to specific terminal
            bool SendCommand(const std::string& terminalId, const std::string& command);
            
            // List all active terminals
            std::vector<std::string> GetActiveTerminals() const;
            
            // Set global output callback for all terminals
            void SetGlobalOutputCallback(std::function<void(const std::string&, const TerminalMessage&)> callback);
            
            // Resize terminal
            bool ResizeTerminal(const std::string& terminalId, int cols, int rows);
            
        private:
            std::map<std::string, std::shared_ptr<TerminalProcess>> terminals_;
            std::mutex terminals_mutex_;
            std::function<void(const std::string&, const TerminalMessage&)> global_callback_;
            
            std::string GenerateTerminalId();
        };
        
        // Singleton instance for global access
        class Terminal {
        public:
            static TerminalManager& GetInstance();
            
        private:
            static std::unique_ptr<TerminalManager> instance_;
            static std::mutex instance_mutex_;
        };
        
    }
}