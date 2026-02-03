

# 此项目停止维护，推荐使用下面这个作者的

https://github.com/michaelbarrera21/auto-accept-agent



# Antigravity Auto Accept

**终于实现了 Antigravity Agent 的真正免提自动化。**

此扩展程序会自动接受 Antigravity Agent 的**所有**待处理步骤，并在出错时自动重试：

* ✅ **运行命令 (Run Command)** 请求 (终端)
* ✅ **保存文件 (Save File)** 请求
* ✅ **代码编辑 (Code Edits)**
* ✅ 代理出错时**自动重试 (Auto-Retry)** (通过 CDP)

它绕过了外部脚本的限制，直接在 IDE 进程内部运行，即使窗口最小化或失去焦点，也能确保 100% 的可靠性。

---
# macOS启动([来自作者在论坛的回答](https://linux.do/t/topic/1500512/11))

要配置下快捷启动（类似windows）

使用Mac自带的 “自动操作” 增加一个应用程序 (application) ，使用shell的方式

1. 使用“自动操作”制作启动器
打开 Automator (自动操作)
点击左下角的 “新建文稿”，选择 “应用程序 (Application)”，然后点击“选取”。
在左侧库的搜索框中输入 shell，找到 “运行 Shell 脚本 (Run Shell Script)” 动作，并将其拖入右侧工作区。
在脚本框中输入以下命令（也可以在terminal里面直接使用下面的命令）：
```nohup /Applications/Antigravity.app/Contents/MacOS/Electron --remote-debugging-port=9222 > /dev/null 2>&1 &``` 

懒得弄得我也放在了我的release里面
![](https://raw.githubusercontent.com/tunecc/antigravity-auto-accept/refs/heads/master/photo.png)
# 修改最大 Retry 次数

通过命令面板 (Cmd+Shift+P):

运行命令 Set Retry Max Count
输入新的数值（0 = 无限次）

本项目的是30次

## 🚀 安装 (Installation)

### 选项 1：从 VSIX 安装（推荐）

1. 从 [Releases](https://github.com/EvanDbg/antigravity-auto-accept/releases) 下载最新的 `.vsix` 文件。
2. 打开 Antigravity IDE。
3. 进入 **Extensions (扩展)** → 点击 `...` 菜单 → **Install from VSIX... (从 VSIX 安装)**。
4. 选择下载的 `.vsix` 文件。
5. 重启 IDE。

### 选项 2：从源码构建 (Build from Source)

```bash
git clone https://github.com/pesoszpesosz/antigravity-auto-accept.git
cd antigravity-auto-accept
npm install -g @vscode/vsce
vsce package

```

然后按照上述说明安装生成的 `.vsix` 文件。

---

## ✨ 功能特性 (Features)

| 功能 | 描述 |
| --- | --- |
| **零干扰 (Zero-Interference)** | 在后台静默运行 |
| **开关控制 (Toggle Control)** | 点击状态栏或使用键盘快捷键控制 |
| **视觉状态 (Visual Status)** | 绿色 (开启) / 红色 (关闭) 指示器 |
| **深度集成 (Deep Integration)** | 直接调用内部 Antigravity 命令 |
| **自动重试 (Auto-Retry)** | 出错时自动点击重试按钮 (基于 CDP) |
| **可配置端口 (Configurable Port)** | 自定义 CDP 端口以避免冲突 |

---

## 🔄 通过 CDP 自动重试 (v1.1.0+)

当 Antigravity Agent 遇到错误时，它会显示一个带有“Retry (重试)”按钮的对话框。此扩展可以使用 Chrome DevTools Protocol (CDP) 自动点击该按钮。

### 设置 (Setup)

1. **启动 Antigravity 并开启远程调试：**
```bash
antigravity.exe --remote-debugging-port=9222

```


2. **验证状态栏显示：**
* `✅ Auto-Retry: ON (9222)` - 自动重试已启用



### 配置 (Configuration)

| 设置项 | 默认值 | 描述 |
| --- | --- | --- |
| `antigravity-auto-accept.cdpPort` | `9222` | CDP 远程调试端口 |
| `antigravity-auto-accept.autoRetryEnabled` | `true` | 启用/禁用自动重试 |

> **注意：** 如果您同时也在运行带有远程调试功能的 Chrome，请使用不同的端口以避免冲突。

---

## ⌨️ 键盘快捷键 (Keyboard Shortcuts)

| 快捷键 | 动作 |
| --- | --- |
| `Ctrl+Alt+Shift+U` | 切换 自动接受 (Auto-Accept) 开/关 |
| `Cmd+Alt+Shift+U` (Mac) | 切换 自动接受 (Auto-Accept) 开/关 |
| `Ctrl+Alt+Shift+R` | 切换 自动重试 (Auto-Retry) 开/关 |
| `Cmd+Alt+Shift+R` (Mac) | 切换 自动重试 (Auto-Retry) 开/关 |

---

## 📖 使用方法 (Usage)

1. 安装扩展。
2. 重启 Antigravity IDE。
3. (可选) 使用 `--remote-debugging-port=9222` 启动 Antigravity 以启用自动重试。
4. 扩展会自动激活 (`✅ Auto-Accept: ON`)。
5. 启动 Agent 任务，然后坐享其成！

### 状态栏指示器 (Status Bar Indicators)

| 指示器 | 含义 |
| --- | --- |
| `✅ Auto-Accept: ON` | 正在自动接受所有 Agent 步骤 |
| `🛑 Auto-Accept: OFF` | 需要手动批准 |
| `✅ Retry: ON (9222)` | 已在端口 9222 上启用自动重试 |
| `🛑 Retry: OFF` | 自动重试已禁用 |

---

## 🛠️ 命令 (Commands)

| 命令 | 描述 |
| --- | --- |
| `Toggle Unlimited Auto-Accept` | 开启/关闭自动接受 |
| `Toggle Unlimited Auto-Retry (CDP)` | 开启/关闭自动重试 |
| `Set CDP Port for Auto-Retry` | 更改自动重试的 CDP 端口 |
| `List Antigravity Commands (Debug)` | 显示所有 Antigravity 相关的命令 |

---

## 🔧 系统要求 (Requirements)

* Antigravity IDE (基于 VS Code)
* 用于自动重试：使用 `--remote-debugging-port` 标志启动

---

## ❓ 常见问题 (FAQ)

**Q: 这安全吗？**
A: 该扩展仅接受 Antigravity Agent 提议的步骤。请定期审查 Agent 的行为。

**Q: 我可以暂时暂停它吗？**
A: 可以！点击状态栏项目或按 `Ctrl+Alt+Shift+U`。

**Q: 窗口最小化时它能工作吗？**
A: 可以，这也是相比外部自动化脚本的主要优势。

**Q: 自动重试不工作？**
A: 确保您使用了 `--remote-debugging-port=9222` 标志启动 Antigravity。检查输出面板 (Antigravity Auto-Accept) 中的日志。

**Q: CDP 端口与 Chrome 冲突？**
A: 使用不同的端口，例如 `--remote-debugging-port=9333`，并相应地更新扩展设置。

---

## 🤝 贡献 (Contributing)

欢迎贡献代码！请参阅 [CONTRIBUTING.md](https://www.google.com/search?q=CONTRIBUTING.md) 了解准则。

---

## 📜 许可证 (License)

MIT - 详情请参阅 [LICENSE](https://www.google.com/search?q=LICENSE)。

---

## ⭐ 支持 (Support)

如果您觉得这个工具有用，请考虑在 GitHub 上给它一颗星！

---