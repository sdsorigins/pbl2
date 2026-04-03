import psutil
import time
import json
from datetime import datetime
from collections import deque

class ResourceMonitor:
    
    def __init__(self):
        self.net_io_start = psutil.net_io_counters()
        self.disk_io_start = psutil.disk_io_counters()
        self.last_check = time.time()
    
    def collect_metrics(self):
        current_time = time.time()
        time_delta = current_time - self.last_check
        
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        net_io_current = psutil.net_io_counters()
        net_sent_rate = (net_io_current.bytes_sent - self.net_io_start.bytes_sent) / time_delta
        net_recv_rate = (net_io_current.bytes_recv - self.net_io_start.bytes_recv) / time_delta
        
        disk_io_current = psutil.disk_io_counters()
        disk_read_rate = (disk_io_current.read_bytes - self.disk_io_start.read_bytes) / time_delta
        disk_write_rate = (disk_io_current.write_bytes - self.disk_io_start.write_bytes) / time_delta
        self.net_io_start = net_io_current
        self.disk_io_start = disk_io_current
        self.last_check = current_time
        
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': cpu_percent,
            'cpu_count': psutil.cpu_count(),
            'cpu_freq': psutil.cpu_freq().current if psutil.cpu_freq() else 0,
            'memory_percent': memory.percent,
            'memory_used_mb': memory.used / (1024 * 1024),
            'memory_total_mb': memory.total / (1024 * 1024),
            'memory_available_mb': memory.available / (1024 * 1024),
            'net_sent_mbps': net_sent_rate / (1024 * 1024),
            'net_recv_mbps': net_recv_rate / (1024 * 1024),
            'disk_read_mbps': disk_read_rate / (1024 * 1024),
            'disk_write_mbps': disk_write_rate / (1024 * 1024),
        }
    
    def get_top_processes(self, n=5):
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = proc.info
                if info['cpu_percent'] is not None or info['memory_percent'] is not None:
                    processes.append(info)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        
        processes.sort(key=lambda x: (x['cpu_percent'] or 0), reverse=True)
        return processes[:n]
