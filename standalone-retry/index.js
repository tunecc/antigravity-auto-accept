#!/usr/bin/env node

/**
 * Antigravity Auto-Retry Standalone Application
 * 
 * 独立运行的自动重试应用，提供：
 * - 系统通知
 * - 彩色日志
 * - 文件日志
 * - 统计信息
 */

const http = require('http');
const WebSocket = require('ws');
const notifier = require('node-notifier');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ========== 配置 ==========
const CONFIG = {
    cdpPort: parseInt(process.env.CDP_PORT) || 9222,
    checkInterval: 2000,        // 检查间隔 (ms)
    debounceTime: 3000,         // 防抖时间 (ms)
    maxRetries: 30,             // 最大重试次数 (0 = 无限)
    enableNotifications: true,  // 系统通知
    enableSound: true,          // 通知声音
    logToFile: true,            // 记录到文件
    logDir: path.join(process.env.HOME || '', '.antigravity-retry'),
};

// ========== 状态 ==========
const STATE = {
    enabled: true,
    retryCount: 0,
    totalRetries: 0,
    sessionStart: new Date(),
    lastRetryTime: null,
    lastRetryAttempt: 0,
    connected: false,
    errors: [],
};

// ========== 日志系统 ==========
let logStream = null;

function initLogFile() {
    if (!CONFIG.logToFile) return;
    
    try {
        if (!fs.existsSync(CONFIG.logDir)) {
            fs.mkdirSync(CONFIG.logDir, { recursive: true });
        }
        
        const logFile = path.join(CONFIG.logDir, `retry-${formatDate(new Date(), 'file')}.log`);
        logStream = fs.createWriteStream(logFile, { flags: 'a' });
        log('info', `日志文件: ${logFile}`);
    } catch (e) {
        console.error('无法创建日志文件:', e.message);
    }
}

function formatDate(date, format = 'display') {
    const pad = n => n.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    const s = pad(date.getSeconds());
    
    if (format === 'file') {
        return `${y}-${m}-${d}`;
    }
    return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function log(level, message) {
    const timestamp = formatDate(new Date());
    const icons = {
        info: 'ℹ️ ',
        success: '✅',
        warning: '⚠️ ',
        error: '❌',
        retry: '🔄',
        connect: '🔗',
        disconnect: '🔌',
    };
    
    const colors = {
        info: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        retry: chalk.cyan,
        connect: chalk.green,
        disconnect: chalk.gray,
    };
    
    const icon = icons[level] || 'ℹ️ ';
    const colorFn = colors[level] || chalk.white;
    
    // 控制台输出
    console.log(`${chalk.gray(timestamp)} ${icon} ${colorFn(message)}`);
    
    // 文件日志
    if (logStream) {
        logStream.write(`[${timestamp}] [${level.toUpperCase()}] ${message}\n`);
    }
}

// ========== 系统通知 ==========
function notify(title, message, isError = false) {
    if (!CONFIG.enableNotifications) return;
    
    notifier.notify({
        title: title,
        message: message,
        sound: CONFIG.enableSound ? (isError ? 'Basso' : 'Pop') : false,
        icon: path.join(__dirname, 'icon.png'),
        contentImage: undefined,
        wait: false,
    });
}

// ========== CDP 通信 ==========
function getCDPTargets() {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${CONFIG.cdpPort}/json`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error('连接超时'));
        });
    });
}

function executeScriptInTarget(wsUrl, script) {
    return new Promise((resolve, reject) => {
        try {
            const ws = new WebSocket(wsUrl);
            let resolved = false;

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    id: 1,
                    method: 'Runtime.evaluate',
                    params: {
                        expression: script,
                        returnByValue: true
                    }
                }));
            });

            ws.on('message', (data) => {
                if (!resolved) {
                    resolved = true;
                    try {
                        const response = JSON.parse(data.toString());
                        resolve(response);
                    } catch (e) {
                        resolve(null);
                    }
                    ws.close();
                }
            });

            ws.on('error', (err) => {
                if (!resolved) {
                    resolved = true;
                    reject(err);
                }
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    ws.close();
                    reject(new Error('WebSocket 超时'));
                }
            }, 5000);
        } catch (e) {
            reject(e);
        }
    });
}

// ========== 核心重试逻辑 ==========
const RETRY_SCRIPT = `
(function() {
    function findAndClickRetry(doc, location) {
        try {
            const buttons = doc.querySelectorAll('button');
            for (const btn of buttons) {
                const text = btn.textContent ? btn.textContent.trim() : '';
                if (text === 'Retry' && !btn.disabled && btn.offsetParent !== null) {
                    btn.click();
                    return { clicked: true, location: location };
                }
            }
        } catch (e) {
            return { clicked: false, error: e.message };
        }
        return { clicked: false };
    }
    
    // 主文档
    let result = findAndClickRetry(document, 'main');
    if (result.clicked) return result;
    
    // iframe
    const iframes = document.querySelectorAll('iframe');
    for (let i = 0; i < iframes.length; i++) {
        try {
            const iframe = iframes[i];
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            if (iframeDoc) {
                result = findAndClickRetry(iframeDoc, 'iframe_' + i);
                if (result.clicked) return result;
            }
        } catch (e) {
            // 跨域 iframe
        }
    }
    
    return { clicked: false };
})();
`;

async function checkAndRetry() {
    if (!STATE.enabled) return;
    
    // 检查重试次数限制
    if (CONFIG.maxRetries > 0 && STATE.retryCount >= CONFIG.maxRetries) {
        if (STATE.enabled) {
            log('warning', `已达到最大重试次数 (${CONFIG.maxRetries})，暂停自动重试`);
            notify('⚠️ 重试次数已达上限', `已重试 ${CONFIG.maxRetries} 次，请检查问题`, true);
            STATE.enabled = false;
            printStatus();
        }
        return;
    }
    
    // 防抖
    const now = Date.now();
    if (now - STATE.lastRetryAttempt < CONFIG.debounceTime) {
        return;
    }
    STATE.lastRetryAttempt = now;
    
    try {
        const targets = await getCDPTargets();
        
        if (!STATE.connected) {
            STATE.connected = true;
            log('connect', `已连接到 Antigravity (端口 ${CONFIG.cdpPort})`);
        }
        
        // 筛选目标
        const potentialTargets = targets.filter(t =>
            t.type === 'page' || t.type === 'webview' ||
            (t.title && (
                t.title.includes('Antigravity') ||
                t.title.includes('Agent') ||
                t.title.includes('Chat')
            )) ||
            (t.url && (
                t.url.includes('workbench') ||
                t.url.includes('webview')
            ))
        );
        
        for (const target of potentialTargets) {
            if (target.webSocketDebuggerUrl) {
                try {
                    const result = await executeScriptInTarget(target.webSocketDebuggerUrl, RETRY_SCRIPT);
                    const value = result?.result?.result?.value || result?.result?.value;
                    
                    if (value && value.clicked) {
                        STATE.retryCount++;
                        STATE.totalRetries++;
                        STATE.lastRetryTime = new Date();
                        
                        const countInfo = CONFIG.maxRetries === 0 
                            ? `#${STATE.retryCount}` 
                            : `${STATE.retryCount}/${CONFIG.maxRetries}`;
                        
                        log('retry', `重试 ${countInfo} - 位置: ${value.location} | 目标: ${target.title || 'unknown'}`);
                        
                        // 每 5 次重试发送通知
                        if (STATE.retryCount % 5 === 0) {
                            notify('🔄 Auto-Retry 运行中', `已自动重试 ${STATE.retryCount} 次`);
                        }
                        
                        return;
                    }
                } catch (e) {
                    // 目标不可访问
                }
            }
        }
    } catch (e) {
        if (STATE.connected) {
            STATE.connected = false;
            log('disconnect', `无法连接到 Antigravity: ${e.message}`);
            log('info', `请确保 Antigravity 使用 --remote-debugging-port=${CONFIG.cdpPort} 启动`);
        }
    }
}

// ========== 交互式命令 ==========
function printStatus() {
    console.log('\n' + chalk.cyan('═'.repeat(50)));
    console.log(chalk.cyan.bold('  📊 Antigravity Auto-Retry 状态'));
    console.log(chalk.cyan('═'.repeat(50)));
    
    const statusIcon = STATE.enabled ? chalk.green('● 运行中') : chalk.red('● 已暂停');
    const connIcon = STATE.connected ? chalk.green('● 已连接') : chalk.yellow('● 未连接');
    
    console.log(`  状态:     ${statusIcon}`);
    console.log(`  连接:     ${connIcon}`);
    console.log(`  CDP端口:  ${chalk.white(CONFIG.cdpPort)}`);
    console.log(`  当前重试: ${chalk.yellow(STATE.retryCount)} / ${CONFIG.maxRetries === 0 ? '∞' : CONFIG.maxRetries}`);
    console.log(`  总计重试: ${chalk.yellow(STATE.totalRetries)}`);
    console.log(`  运行时间: ${chalk.white(getUptime())}`);
    
    if (STATE.lastRetryTime) {
        console.log(`  上次重试: ${chalk.gray(formatDate(STATE.lastRetryTime))}`);
    }
    
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.gray('  命令: [p]暂停/恢复  [r]重置计数  [s]状态  [q]退出'));
    console.log(chalk.cyan('═'.repeat(50)) + '\n');
}

function getUptime() {
    const diff = Date.now() - STATE.sessionStart.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (hours > 0) {
        return `${hours}小时 ${minutes}分 ${seconds}秒`;
    } else if (minutes > 0) {
        return `${minutes}分 ${seconds}秒`;
    }
    return `${seconds}秒`;
}

function printBanner() {
    console.clear();
    console.log(chalk.cyan(`
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║   🚀 Antigravity Auto-Retry Standalone App            ║
    ║                                                       ║
    ║   独立自动重试应用 - 提供更好的体验                      ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
    `));
}

function setupKeyboardInput() {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            shutdown();
            return;
        }
        
        switch (key.name) {
            case 'p':
                STATE.enabled = !STATE.enabled;
                if (STATE.enabled) {
                    log('success', '自动重试已恢复');
                    notify('✅ Auto-Retry', '自动重试已恢复');
                } else {
                    log('warning', '自动重试已暂停');
                    notify('⏸️ Auto-Retry', '自动重试已暂停');
                }
                printStatus();
                break;
                
            case 'r':
                STATE.retryCount = 0;
                STATE.enabled = true;
                log('success', '重试计数器已重置');
                notify('🔄 计数器已重置', '重新开始计数');
                printStatus();
                break;
                
            case 's':
                printStatus();
                break;
                
            case 'q':
                shutdown();
                break;
        }
    });
}

function shutdown() {
    console.log('\n');
    log('info', '正在关闭...');
    log('info', `本次会话统计: 运行 ${getUptime()}, 总计重试 ${STATE.totalRetries} 次`);
    
    if (logStream) {
        logStream.end();
    }
    
    process.exit(0);
}

// ========== 主程序 ==========
async function main() {
    printBanner();
    initLogFile();
    
    log('info', `启动自动重试服务 (CDP 端口: ${CONFIG.cdpPort})`);
    log('info', `最大重试次数: ${CONFIG.maxRetries === 0 ? '无限' : CONFIG.maxRetries}`);
    log('info', `检查间隔: ${CONFIG.checkInterval}ms`);
    
    // 启动通知
    notify('🚀 Auto-Retry 已启动', `监听端口 ${CONFIG.cdpPort}`);
    
    // 设置键盘输入
    setupKeyboardInput();
    
    // 打印初始状态
    printStatus();
    
    // 开始循环检查
    setInterval(checkAndRetry, CONFIG.checkInterval);
    
    // 立即检查一次
    checkAndRetry();
}

// 处理异常
process.on('uncaughtException', (err) => {
    log('error', `未捕获的异常: ${err.message}`);
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 启动
main();
