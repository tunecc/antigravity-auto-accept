#!/usr/bin/env swift

import Foundation
import Cocoa

// ========== 配置 ==========
let appPath = "/Applications/Antigravity.app/Contents/MacOS/Electron"
let cdpPort = "9222"

// ========== 检测是否已运行 ==========
func isAntigravityRunning() -> Bool {
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/pgrep")
    task.arguments = ["-f", "Antigravity.app.*Electron"]
    
    let pipe = Pipe()
    task.standardOutput = pipe
    task.standardError = pipe
    
    do {
        try task.run()
        task.waitUntilExit()
        return task.terminationStatus == 0
    } catch {
        return false
    }
}

// ========== 显示通知 ==========
func showNotification(title: String, message: String) {
    let script = """
    display notification "\(message)" with title "\(title)"
    """
    
    let task = Process()
    task.executableURL = URL(fileURLWithPath: "/usr/bin/osascript")
    task.arguments = ["-e", script]
    try? task.run()
}

// ========== 启动 Antigravity ==========
func launchAntigravity() {
    // 检查是否已运行
    if isAntigravityRunning() {
        showNotification(title: "Antigravity", message: "已在运行中")
        return
    }
    
    // 检查应用是否存在
    guard FileManager.default.fileExists(atPath: appPath) else {
        showNotification(title: "错误", message: "找不到 Antigravity.app")
        return
    }
    
    // 启动
    let process = Process()
    process.executableURL = URL(fileURLWithPath: appPath)
    process.arguments = ["--remote-debugging-port=\(cdpPort)"]
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    
    do {
        try process.run()
        showNotification(title: "Antigravity", message: "已启动 (CDP: \(cdpPort))")
    } catch {
        showNotification(title: "启动失败", message: error.localizedDescription)
    }
}

// ========== 主程序 ==========
launchAntigravity()

// 等待通知显示
Thread.sleep(forTimeInterval: 0.5)
