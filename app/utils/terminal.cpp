#include "terminal.hpp"
#include "../core/logger.hpp"
#include <sstream>
#include <random>
#include <iomanip>
#include <chrono>

#ifdef _WIN32
#include <processthreadsapi.h>
#include <handleapi.h>
#else
#include <signal.h>
#include <sys/select.h>
#include <errno.h>
#endif

namespace MikoIDE {
    namespace Utils {
        
        // TerminalProcess Implementation
        TerminalProcess::TerminalProcess() 
            : running_(false), should_stop_(false)
#ifdef _WIN32
            , process_handle_(INVALID_HANDLE_VALUE)
            , thread_handle_(INVALID_HANDLE_VALUE)
            , stdin_write_(INVALID_HANDLE_VALUE)
            , stdout_read_(INVALID_HANDLE_VALUE)
            , stderr_read_(INVALID_HANDLE_VALUE)
            , process_id_(0)
#else
            , process_id_(-1)
            , master_fd_(-1)
            , slave_fd_(-1)
#endif
        {
        }
        
        TerminalProcess::~TerminalProcess() {
            if (running_) {
                Kill();
            }
            Cleanup();
        }
        
        bool TerminalProcess::Start(const std::string& command, const std::string& workingDir) {
            if (running_) {
                Logger::LogMessage("Terminal process already running");
                return false;
            }
            
#ifdef _WIN32
            return StartWindows(command.empty() ? "cmd.exe" : command, workingDir);
#else
            return StartUnix(command.empty() ? "/bin/bash" : command, workingDir);
#endif
        }
        
        bool TerminalProcess::SendInput(const std::string& input) {
            if (!running_) {
                return false;
            }
            
            std::lock_guard<std::mutex> lock(input_mutex_);
            input_queue_.push(input);
            input_cv_.notify_one();
            return true;
        }
        
        bool TerminalProcess::SendCommand(const std::string& command) {
            return SendInput(command + "\n");
        }
        
        bool TerminalProcess::Kill() {
            if (!running_) {
                return true;
            }
            
            should_stop_ = true;
            
#ifdef _WIN32
            if (process_handle_ != INVALID_HANDLE_VALUE) {
                TerminateProcess(process_handle_, 1);
                WaitForSingleObject(process_handle_, 5000);
            }
#else
            if (process_id_ > 0) {
                kill(process_id_, SIGTERM);
                int status;
                waitpid(process_id_, &status, WNOHANG);
            }
#endif
            
            if (output_thread_.joinable()) {
                output_thread_.join();
            }
            if (error_thread_.joinable()) {
                error_thread_.join();
            }
            
            running_ = false;
            Cleanup();
            
            if (output_callback_) {
                output_callback_(TerminalMessage(TerminalMessage::EXIT, "Process terminated", 1));
            }
            
            return true;
        }
        
        bool TerminalProcess::IsRunning() const {
            return running_;
        }
        
        int TerminalProcess::GetProcessId() const {
#ifdef _WIN32
            return static_cast<int>(process_id_);
#else
            return static_cast<int>(process_id_);
#endif
        }
        
        void TerminalProcess::SetOutputCallback(std::function<void(const TerminalMessage&)> callback) {
            output_callback_ = callback;
        }
        
        bool TerminalProcess::Resize(int cols, int rows) {
#ifdef _WIN32
            // Windows console resizing
            if (process_handle_ != INVALID_HANDLE_VALUE) {
                // Implementation for Windows console resizing
                return true;
            }
#else
            if (master_fd_ != -1) {
                struct winsize ws;
                ws.ws_col = cols;
                ws.ws_row = rows;
                ws.ws_xpixel = 0;
                ws.ws_ypixel = 0;
                return ioctl(master_fd_, TIOCSWINSZ, &ws) == 0;
            }
#endif
            return false;
        }
        
#ifdef _WIN32
        bool TerminalProcess::StartWindows(const std::string& command, const std::string& workingDir) {
            SECURITY_ATTRIBUTES sa;
            sa.nLength = sizeof(SECURITY_ATTRIBUTES);
            sa.bInheritHandle = TRUE;
            sa.lpSecurityDescriptor = NULL;
            
            HANDLE stdin_read, stdout_write, stderr_write;
            
            // Create pipes for stdin, stdout, stderr
            if (!CreatePipe(&stdin_read, &stdin_write_, &sa, 0) ||
                !CreatePipe(&stdout_read_, &stdout_write, &sa, 0) ||
                !CreatePipe(&stderr_read_, &stderr_write, &sa, 0)) {
                Logger::LogMessage("Failed to create pipes");
                return false;
            }
            
            // Ensure the read handles are not inherited
            SetHandleInformation(stdin_write_, HANDLE_FLAG_INHERIT, 0);
            SetHandleInformation(stdout_read_, HANDLE_FLAG_INHERIT, 0);
            SetHandleInformation(stderr_read_, HANDLE_FLAG_INHERIT, 0);
            
            STARTUPINFOA si;
            PROCESS_INFORMATION pi;
            ZeroMemory(&si, sizeof(si));
            si.cb = sizeof(si);
            si.hStdError = stderr_write;
            si.hStdOutput = stdout_write;
            si.hStdInput = stdin_read;
            si.dwFlags |= STARTF_USESTDHANDLES;
            
            ZeroMemory(&pi, sizeof(pi));
            
            std::string cmdLine = command;
            const char* workDir = workingDir.empty() ? nullptr : workingDir.c_str();
            
            if (!CreateProcessA(NULL, const_cast<char*>(cmdLine.c_str()), NULL, NULL, TRUE, 0, NULL, workDir, &si, &pi)) {
                Logger::LogMessage("Failed to create process: " + std::to_string(GetLastError()));
                CloseHandle(stdin_read);
                CloseHandle(stdout_write);
                CloseHandle(stderr_write);
                return false;
            }
            
            process_handle_ = pi.hProcess;
            thread_handle_ = pi.hThread;
            process_id_ = pi.dwProcessId;
            
            CloseHandle(stdin_read);
            CloseHandle(stdout_write);
            CloseHandle(stderr_write);
            
            running_ = true;
            
            // Start reader threads
            output_thread_ = std::thread(&TerminalProcess::OutputReaderThread, this);
            error_thread_ = std::thread(&TerminalProcess::ErrorReaderThread, this);
            
            Logger::LogMessage("Terminal process started with PID: " + std::to_string(process_id_));
            return true;
        }
#else
        bool TerminalProcess::StartUnix(const std::string& command, const std::string& workingDir) {
            // Create pseudo-terminal
            if (openpty(&master_fd_, &slave_fd_, nullptr, nullptr, nullptr) == -1) {
                Logger::LogMessage("Failed to create pseudo-terminal");
                return false;
            }
            
            process_id_ = fork();
            
            if (process_id_ == -1) {
                Logger::LogMessage("Failed to fork process");
                close(master_fd_);
                close(slave_fd_);
                return false;
            }
            
            if (process_id_ == 0) {
                // Child process
                close(master_fd_);
                
                // Set up terminal
                setsid();
                ioctl(slave_fd_, TIOCSCTTY, 0);
                
                // Redirect stdin, stdout, stderr
                dup2(slave_fd_, STDIN_FILENO);
                dup2(slave_fd_, STDOUT_FILENO);
                dup2(slave_fd_, STDERR_FILENO);
                close(slave_fd_);
                
                // Change working directory
                if (!workingDir.empty()) {
                    chdir(workingDir.c_str());
                }
                
                // Execute command
                execl("/bin/sh", "sh", "-c", command.c_str(), nullptr);
                _exit(1);
            } else {
                // Parent process
                close(slave_fd_);
                slave_fd_ = -1;
                
                running_ = true;
                
                // Start reader thread
                output_thread_ = std::thread(&TerminalProcess::OutputReaderThread, this);
                
                Logger::LogMessage("Terminal process started with PID: " + std::to_string(process_id_));
                return true;
            }
        }
#endif
        
        void TerminalProcess::OutputReaderThread() {
#ifdef _WIN32
            char buffer[4096];
            DWORD bytesRead;
            
            while (running_ && !should_stop_) {
                if (ReadFile(stdout_read_, buffer, sizeof(buffer) - 1, &bytesRead, NULL) && bytesRead > 0) {
                    buffer[bytesRead] = '\0';
                    if (output_callback_) {
                        output_callback_(TerminalMessage(TerminalMessage::OUTPUT, std::string(buffer)));
                    }
                } else {
                    break;
                }
            }
#else
            char buffer[4096];
            fd_set readfds;
            struct timeval timeout;
            
            while (running_ && !should_stop_) {
                FD_ZERO(&readfds);
                FD_SET(master_fd_, &readfds);
                
                timeout.tv_sec = 0;
                timeout.tv_usec = 100000; // 100ms timeout
                
                int result = select(master_fd_ + 1, &readfds, nullptr, nullptr, &timeout);
                
                if (result > 0 && FD_ISSET(master_fd_, &readfds)) {
                    ssize_t bytesRead = read(master_fd_, buffer, sizeof(buffer) - 1);
                    if (bytesRead > 0) {
                        buffer[bytesRead] = '\0';
                        if (output_callback_) {
                            output_callback_(TerminalMessage(TerminalMessage::OUTPUT, std::string(buffer)));
                        }
                    } else if (bytesRead == 0) {
                        break; // EOF
                    }
                } else if (result == -1 && errno != EINTR) {
                    break; // Error
                }
                
                // Handle input queue
                std::unique_lock<std::mutex> lock(input_mutex_);
                if (input_cv_.wait_for(lock, std::chrono::milliseconds(10), [this] { return !input_queue_.empty() || should_stop_; })) {
                    while (!input_queue_.empty() && !should_stop_) {
                        std::string input = input_queue_.front();
                        input_queue_.pop();
                        lock.unlock();
                        
                        write(master_fd_, input.c_str(), input.length());
                        
                        lock.lock();
                    }
                }
            }
#endif
        }
        
        void TerminalProcess::ErrorReaderThread() {
#ifdef _WIN32
            char buffer[4096];
            DWORD bytesRead;
            
            while (running_ && !should_stop_) {
                if (ReadFile(stderr_read_, buffer, sizeof(buffer) - 1, &bytesRead, NULL) && bytesRead > 0) {
                    buffer[bytesRead] = '\0';
                    if (output_callback_) {
                        output_callback_(TerminalMessage{TerminalMessage::ERROR, std::string(buffer)});
                    }
                } else {
                    break;
                }
            }
#endif
        }
        
        void TerminalProcess::Cleanup() {
#ifdef _WIN32
            if (stdin_write_ != INVALID_HANDLE_VALUE) {
                CloseHandle(stdin_write_);
                stdin_write_ = INVALID_HANDLE_VALUE;
            }
            if (stdout_read_ != INVALID_HANDLE_VALUE) {
                CloseHandle(stdout_read_);
                stdout_read_ = INVALID_HANDLE_VALUE;
            }
            if (stderr_read_ != INVALID_HANDLE_VALUE) {
                CloseHandle(stderr_read_);
                stderr_read_ = INVALID_HANDLE_VALUE;
            }
            if (process_handle_ != INVALID_HANDLE_VALUE) {
                CloseHandle(process_handle_);
                process_handle_ = INVALID_HANDLE_VALUE;
            }
            if (thread_handle_ != INVALID_HANDLE_VALUE) {
                CloseHandle(thread_handle_);
                thread_handle_ = INVALID_HANDLE_VALUE;
            }
#else
            if (master_fd_ != -1) {
                close(master_fd_);
                master_fd_ = -1;
            }
            if (slave_fd_ != -1) {
                close(slave_fd_);
                slave_fd_ = -1;
            }
#endif
        }
        
        // TerminalManager Implementation
        TerminalManager::TerminalManager() {
        }
        
        TerminalManager::~TerminalManager() {
            std::lock_guard<std::mutex> lock(terminals_mutex_);
            for (auto& pair : terminals_) {
                pair.second->Kill();
            }
            terminals_.clear();
        }
        
        std::string TerminalManager::CreateTerminal(const std::string& command, const std::string& workingDir) {
            std::string terminalId = GenerateTerminalId();
            
            auto terminal = std::make_shared<TerminalProcess>();
            
            // Set up callback to forward messages with terminal ID
            terminal->SetOutputCallback([this, terminalId](const TerminalMessage& msg) {
                if (global_callback_) {
                    global_callback_(terminalId, msg);
                }
            });
            
            if (terminal->Start(command, workingDir)) {
                std::lock_guard<std::mutex> lock(terminals_mutex_);
                terminals_[terminalId] = terminal;
                Logger::LogMessage("Created terminal: " + terminalId);
                return terminalId;
            }
            
            Logger::LogMessage("Failed to create terminal");
            return "";
        }
        
        std::shared_ptr<TerminalProcess> TerminalManager::GetTerminal(const std::string& terminalId) {
            std::lock_guard<std::mutex> lock(terminals_mutex_);
            auto it = terminals_.find(terminalId);
            return (it != terminals_.end()) ? it->second : nullptr;
        }
        
        bool TerminalManager::CloseTerminal(const std::string& terminalId) {
            std::lock_guard<std::mutex> lock(terminals_mutex_);
            auto it = terminals_.find(terminalId);
            
            if (it != terminals_.end()) {
                it->second->Kill();
                terminals_.erase(it);
                Logger::LogMessage("Closed terminal: " + terminalId);
                return true;
            }
            
            return false;
        }
        
        bool TerminalManager::SendInput(const std::string& terminalId, const std::string& input) {
            auto terminal = GetTerminal(terminalId);
            return terminal ? terminal->SendInput(input) : false;
        }
        
        bool TerminalManager::SendCommand(const std::string& terminalId, const std::string& command) {
            auto terminal = GetTerminal(terminalId);
            return terminal ? terminal->SendCommand(command) : false;
        }
        
        std::vector<std::string> TerminalManager::GetActiveTerminals() const {
            std::lock_guard<std::mutex> lock(const_cast<std::mutex&>(terminals_mutex_));
            std::vector<std::string> result;
            
            for (const auto& pair : terminals_) {
                if (pair.second->IsRunning()) {
                    result.push_back(pair.first);
                }
            }
            
            return result;
        }
        
        void TerminalManager::SetGlobalOutputCallback(std::function<void(const std::string&, const TerminalMessage&)> callback) {
            global_callback_ = callback;
        }
        
        bool TerminalManager::ResizeTerminal(const std::string& terminalId, int cols, int rows) {
            auto terminal = GetTerminal(terminalId);
            return terminal ? terminal->Resize(cols, rows) : false;
        }
        
        std::string TerminalManager::GenerateTerminalId() {
            static std::random_device rd;
            static std::mt19937 gen(rd());
            static std::uniform_int_distribution<> dis(0, 15);
            
            std::stringstream ss;
            ss << "terminal_";
            
            for (int i = 0; i < 8; ++i) {
                ss << std::hex << dis(gen);
            }
            
            return ss.str();
        }
        
        // Terminal Singleton
        std::unique_ptr<TerminalManager> Terminal::instance_ = nullptr;
        std::mutex Terminal::instance_mutex_;
        
        TerminalManager& Terminal::GetInstance() {
            std::lock_guard<std::mutex> lock(instance_mutex_);
            if (!instance_) {
                instance_ = std::make_unique<TerminalManager>();
            }
            return *instance_;
        }
        
    }
}