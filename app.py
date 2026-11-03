import os
import sys
import socket
import threading
import http.server
import socketserver
import webview

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def run_app():
    # Detect executable or script directory
    if getattr(sys, 'frozen', False):
        project_dir = os.path.dirname(sys.executable)
    else:
        project_dir = os.path.dirname(os.path.abspath(__file__))
        
    os.chdir(project_dir)

    port = get_free_port()

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Suppress HTTP access logging

    def start_server():
        # Allow reuse address
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(('127.0.0.1', port), QuietHandler) as httpd:
            httpd.serve_forever()

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Create native Windows WebView2 desktop window
    window = webview.create_window(
        title='Pizza Tower',
        url=f'http://127.0.0.1:{port}/index.html',
        width=980,
        height=580,
        resizable=True,
        min_size=(960, 540)
    )

    webview.start(debug=False)

if __name__ == '__main__':
    run_app()
