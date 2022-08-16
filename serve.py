import subprocess
import http.server, ssl
from pathlib import Path

_path_here = Path(__file__).parent
_path_cert = _path_here / 'localhost.pem'
_path_pkey = _path_here / 'localhost.pk'

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def send_response_only(self, code, message=None):
        super().send_response_only(code, message)
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')


def main():
    get_cert()
    server_address = '0.0.0.0', 4443
    print('run on', server_address)
    httpd = http.server.HTTPServer(server_address, NoCacheHTTPRequestHandler)
    httpd.socket = ssl.wrap_socket(httpd.socket,
                                server_side=True,
                                certfile='localhost.pem',
                                keyfile='localhost.pk',
                                ssl_version=ssl.PROTOCOL_TLS)
    httpd.serve_forever()


def get_cert():
    ip = 'localhost'
    if not _path_cert.exists():
        cmd(f'openssl genrsa -out {_path_pkey} 2048')
        cmd(f'openssl req -new -x509 -days 3650 -key {_path_pkey} -out {_path_cert} -subj /commonName={ip}')


def cmd(t):
    assert subprocess.call(t, shell=True) == 0


main()
