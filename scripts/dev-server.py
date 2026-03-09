#!/usr/bin/env python3
"""
暗影尖塔 - 本地开发服务器
启动后访问 http://localhost:8000
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).parent.parent / "src"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    
    def end_headers(self):
        # 禁用缓存，方便开发
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == "__main__":
    os.chdir(ROOT)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🎮 暗影尖塔开发服务器已启动!")
        print(f"📂 根目录: {ROOT}")
        print(f"🌐 访问地址: http://localhost:{PORT}")
        print(f"⏹️  按 Ctrl+C 停止服务器\n")
        
        # 自动打开浏览器
        webbrowser.open(f"http://localhost:{PORT}")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 服务器已停止")
