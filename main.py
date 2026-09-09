import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler
import socketserver
import webview

def get_base_path():
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

base_path = get_base_path()
os.chdir(base_path)

def start_server():
    # Find a free port
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    
    Handler = SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
    t = threading.Thread(target=httpd.serve_forever)
    t.daemon = True
    t.start()
    return port

port = start_server()
webview.create_window('Game', f'http://127.0.0.1:{port}/index.html', width=1024, height=768)
webview.start()
