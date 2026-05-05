import os
import threading
import time
import urllib.error
import urllib.request
from urllib.parse import urljoin


_worker_started = False
_worker_lock = threading.Lock()


def start_keepalive_worker(app):
    """Start a background worker that periodically pings the service heartbeat URL."""
    global _worker_started

    if not app.config.get('KEEPALIVE_ENABLED', False):
        app.logger.info('Keepalive worker is disabled (KEEPALIVE_ENABLED=false).')
        return False

    with _worker_lock:
        if _worker_started:
            app.logger.info('Keepalive worker is already running.')
            return False

        target_base_url = (
            app.config.get('KEEPALIVE_TARGET_URL')
            or os.getenv('RENDER_EXTERNAL_URL', '')
            or ''
        ).strip()

        if not target_base_url:
            app.logger.warning(
                'Keepalive is enabled but KEEPALIVE_TARGET_URL/RENDER_EXTERNAL_URL is missing. '
                'Worker not started.'
            )
            return False

        endpoint_path = app.config.get('KEEPALIVE_ENDPOINT_PATH', '/heartbeat').strip() or '/heartbeat'
        if not endpoint_path.startswith('/'):
            endpoint_path = f'/{endpoint_path}'

        heartbeat_url = urljoin(f"{target_base_url.rstrip('/')}/", endpoint_path.lstrip('/'))
        interval = max(30, int(app.config.get('KEEPALIVE_INTERVAL_SECONDS', 600)))

        def worker_loop():
            app.logger.info(
                f'Keepalive worker started. Pinging {heartbeat_url} every {interval} seconds.'
            )
            while True:
                try:
                    request = urllib.request.Request(
                        heartbeat_url,
                        headers={'User-Agent': 'dyslearn-keepalive/1.0'}
                    )
                    with urllib.request.urlopen(request, timeout=15) as response:
                        status_code = response.getcode()
                        if status_code >= 400:
                            app.logger.warning(f'Keepalive ping returned status {status_code}')
                except Exception as exc:
                    app.logger.warning(f'Keepalive ping failed: {exc}')

                time.sleep(interval)

        keepalive_thread = threading.Thread(
            target=worker_loop,
            name='keepalive-worker',
            daemon=True
        )
        keepalive_thread.start()
        _worker_started = True

        return True