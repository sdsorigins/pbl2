import os
import time
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple
import json
import threading
from collections import deque
import psutil

class DiskAnalyzer:
    """
    Performance-optimized disk analyzer with incremental scanning and hot directory prioritization.
    
    Key optimizations:
    - Incremental scanning: Only scans changed directories
    - Hot directory queue: Prioritizes recently active directories
    - Asynchronous scanning: Non-blocking background scans
    - Efficient caching: In-memory snapshots with persistent storage
    - Throttling: Adaptive scan frequency based on system load
    """
    
    def __init__(self, 
                 scan_depth=2, 
                 min_size_mb=10,
                 recent_hours=24,
                 cache_file='.disk_snapshot_cache.json',
                 max_hot_dirs=50,
                 throttle_threshold=0.8):
        self.scan_depth = scan_depth
        self.min_size_threshold = min_size_mb * 1024 * 1024
        self.recent_hours = recent_hours
        self.cache_file = cache_file
        self.max_hot_dirs = max_hot_dirs
        self.throttle_threshold = throttle_threshold
        
        self.previous_snapshot = self._load_snapshot()
        self.current_snapshot = {}
        
        self.hot_directories = deque(maxlen=max_hot_dirs)
        self._initialize_hot_directories()
        
        self.scan_thread = None
        self.scan_in_progress = False
        self.scan_lock = threading.Lock()
        
        self.last_scan_duration = 0
        self.directories_scanned = 0
        self.directories_cached = 0
    
    def _load_snapshot(self) -> Dict:
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Failed to load snapshot cache: {e}")
        return {}
    
    def _save_snapshot(self):
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.current_snapshot, f)
        except Exception as e:
            print(f"Failed to save snapshot cache: {e}")
    
    def _initialize_hot_directories(self):
        if not self.previous_snapshot:
            return
        
        priorities = []
        for dir_path, metrics in self.previous_snapshot.items():
            priority = (
                metrics.get('recent_modifications_count', 0) * 10 +
                metrics.get('new_files_count', 0) * 5 +
                (metrics.get('total_size', 0) / (1024 * 1024 * 1024))
            )
            if priority > 0:
                priorities.append((priority, dir_path))
        
        priorities.sort(reverse=True)
        for priority, dir_path in priorities[:self.max_hot_dirs]:
            self.hot_directories.append((priority, dir_path))
    
    def _is_directory_changed(self, dir_path: str) -> bool:
        try:
            current_mtime = os.path.getmtime(dir_path)
            prev_metrics = self.previous_snapshot.get(dir_path, {})
            prev_scan_time = prev_metrics.get('last_scan_time', 0)
            return current_mtime > prev_scan_time
        except (OSError, PermissionError):
            return True
    
    def _get_cached_metrics(self, dir_path: str) -> Optional[Dict]:
        if dir_path not in self.previous_snapshot:
            return None
        if not self._is_directory_changed(dir_path):
            self.directories_cached += 1
            return self.previous_snapshot[dir_path].copy()
        return None
    
    def _get_dir_size_incremental(self, path: str) -> Tuple[int, int, int, int]:
        total_size = 0
        file_count = 0
        new_files = 0
        recent_mods = 0
        cutoff_time = time.time() - (self.recent_hours * 3600)
        
        prev_metrics = self.previous_snapshot.get(path, {})
        prev_scan_time = prev_metrics.get('last_scan_time', 0)
        
        try:
            for entry in os.scandir(path):
                if entry.is_file(follow_symlinks=False):
                    try:
                        stat = entry.stat()
                        total_size += stat.st_size
                        file_count += 1
                        if stat.st_ctime > prev_scan_time:
                            new_files += 1
                        if stat.st_mtime > cutoff_time:
                            recent_mods += 1
                    except (PermissionError, FileNotFoundError):
                        continue
                elif entry.is_dir(follow_symlinks=False):
                    try:
                        sub_size, sub_files, sub_new, sub_mods = self._get_dir_size_incremental(entry.path)
                        total_size += sub_size
                        file_count += sub_files
                        new_files += sub_new
                        recent_mods += sub_mods
                    except (PermissionError, FileNotFoundError):
                        continue
        except (PermissionError, FileNotFoundError):
            pass
        
        return total_size, file_count, new_files, recent_mods

    def _scan_directory(self, path: str, current_depth: int = 0, hot_dirs: Set[str] = None) -> Dict:
        if current_depth > self.scan_depth:
            return {}
        
        if hot_dirs is None:
            hot_dirs = {dir_path for _, dir_path in self.hot_directories}
        
        results = {}
        
        try:
            subdirs = []
            for entry in os.scandir(path):
                if entry.is_dir(follow_symlinks=False):
                    subdirs.append(entry.path)
            
            hot_subdirs = [d for d in subdirs if d in hot_dirs]
            cold_subdirs = [d for d in subdirs if d not in hot_dirs]
            prioritized_subdirs = hot_subdirs + cold_subdirs
            
            for dir_path in prioritized_subdirs:
                cached_metrics = self._get_cached_metrics(dir_path)
                
                if cached_metrics is not None:
                    results[dir_path] = cached_metrics
                    continue
                
                self.directories_scanned += 1
                
                try:
                    total_size, file_count, new_files, recent_mods = self._get_dir_size_incremental(dir_path)
                    
                    if total_size >= self.min_size_threshold:
                        results[dir_path] = {
                            'total_size': total_size,
                            'file_count': file_count,
                            'new_files_count': new_files,
                            'recent_modifications_count': recent_mods,
                            'last_scan_time': time.time()
                        }
                        
                        if recent_mods > 0 or new_files > 0:
                            priority = recent_mods * 10 + new_files * 5
                            self._update_hot_directory(priority, dir_path)
                
                except (PermissionError, FileNotFoundError):
                    continue
                
                if current_depth < self.scan_depth:
                    sub_results = self._scan_directory(dir_path, current_depth + 1, hot_dirs)
                    results.update(sub_results)
        
        except (PermissionError, FileNotFoundError):
            pass
        
        return results
    
    def _update_hot_directory(self, priority: float, dir_path: str):
        self.hot_directories = deque(
            [(p, d) for p, d in self.hot_directories if d != dir_path],
            maxlen=self.max_hot_dirs
        )
        self.hot_directories.append((priority, dir_path))

    def scan_filesystem(self, root_path: str = None) -> Dict:
        if root_path is None:
            root_path = os.getcwd()
        
        self.directories_scanned = 0
        self.directories_cached = 0
        scan_start = time.time()
        
        print(f"Scanning filesystem from {root_path}...")
        print(f"Using incremental scan with {len(self.hot_directories)} hot directories prioritized")
        
        self.current_snapshot = self._scan_directory(root_path, 0)
        self._save_snapshot()
        
        self.last_scan_duration = time.time() - scan_start
        
        print(f"Scan complete in {self.last_scan_duration:.2f}s")
        print(f"  Directories scanned: {self.directories_scanned}")
        print(f"  Directories cached: {self.directories_cached}")
        print(f"  Total tracked: {len(self.current_snapshot)}")
        print(f"  Cache hit rate: {(self.directories_cached / max(1, self.directories_scanned + self.directories_cached) * 100):.1f}%")
        
        return self.current_snapshot
    
    def scan_filesystem_async(self, root_path: str = None, callback=None):
        if self.scan_in_progress:
            print("Scan already in progress, skipping...")
            return False
        
        def scan_worker():
            with self.scan_lock:
                self.scan_in_progress = True
                try:
                    result = self.scan_filesystem(root_path)
                    if callback:
                        callback(result)
                finally:
                    self.scan_in_progress = False
        
        self.scan_thread = threading.Thread(target=scan_worker, daemon=True)
        self.scan_thread.start()
        return True
    
    def calculate_impact_scores(self) -> List[Dict]:
        if not self.current_snapshot:
            return []
        
        size_deltas = []
        recent_mods = []
        total_sizes = []
        
        for dir_path, metrics in self.current_snapshot.items():
            prev_metrics = self.previous_snapshot.get(dir_path, {})
            prev_size = prev_metrics.get('total_size', 0)
            size_delta = metrics['total_size'] - prev_size
            
            size_deltas.append(abs(size_delta))
            recent_mods.append(metrics['recent_modifications_count'])
            total_sizes.append(metrics['total_size'])
        
        max_delta = max(size_deltas) if size_deltas else 1
        max_mods = max(recent_mods) if recent_mods else 1
        max_size = max(total_sizes) if total_sizes else 1
        
        results = []
        for dir_path, metrics in self.current_snapshot.items():
            prev_metrics = self.previous_snapshot.get(dir_path, {})
            prev_size = prev_metrics.get('total_size', 0)
            size_delta = metrics['total_size'] - prev_size
            
            norm_delta = abs(size_delta) / max_delta if max_delta > 0 else 0
            norm_mods = metrics['recent_modifications_count'] / max_mods if max_mods > 0 else 0
            norm_size = metrics['total_size'] / max_size if max_size > 0 else 0
            
            impact_score = (
                0.5 * norm_delta +
                0.3 * norm_mods +
                0.2 * norm_size
            )
            
            results.append({
                'path': dir_path,
                'impact_score': round(impact_score, 3),
                'total_size': metrics['total_size'],
                'size_delta': size_delta,
                'file_count': metrics['file_count'],
                'new_files_count': metrics['new_files_count'],
                'recent_modifications_count': metrics['recent_modifications_count']
            })
        
        results.sort(key=lambda x: x['impact_score'], reverse=True)
        return results

    def get_top_directories(self, n: int = 5) -> List[Dict]:
        results = self.calculate_impact_scores()
        return results[:n]
    
    def get_fastest_growing(self, n: int = 5) -> List[Dict]:
        if not self.previous_snapshot:
            return []
        
        results = []
        for dir_path, metrics in self.current_snapshot.items():
            prev_metrics = self.previous_snapshot.get(dir_path, {})
            prev_size = prev_metrics.get('total_size', 0)
            size_delta = metrics['total_size'] - prev_size
            
            if size_delta > 0:
                results.append({
                    'path': dir_path,
                    'size_delta': size_delta,
                    'total_size': metrics['total_size'],
                    'growth_rate': round((size_delta / prev_size * 100) if prev_size > 0 else 0, 2)
                })
        
        results.sort(key=lambda x: x['size_delta'], reverse=True)
        return results[:n]
    
    def get_most_active(self, n: int = 5) -> List[Dict]:
        if not self.current_snapshot:
            return []
        
        results = [
            {
                'path': dir_path,
                'recent_modifications_count': metrics['recent_modifications_count'],
                'new_files_count': metrics['new_files_count'],
                'total_size': metrics['total_size']
            }
            for dir_path, metrics in self.current_snapshot.items()
            if metrics['recent_modifications_count'] > 0
        ]
        
        results.sort(key=lambda x: x['recent_modifications_count'], reverse=True)
        return results[:n]
    
    def get_performance_stats(self) -> Dict:
        total_dirs = self.directories_scanned + self.directories_cached
        cache_hit_rate = (self.directories_cached / max(1, total_dirs)) * 100
        
        return {
            'last_scan_duration': round(self.last_scan_duration, 2),
            'directories_scanned': self.directories_scanned,
            'directories_cached': self.directories_cached,
            'total_directories': len(self.current_snapshot),
            'cache_hit_rate': round(cache_hit_rate, 1),
            'hot_directories_count': len(self.hot_directories),
            'scan_in_progress': self.scan_in_progress
        }
    
    def get_disk_overview(self, path: str = None) -> Dict:
        if path is None:
            path = os.getcwd()
        
        try:
            disk_usage = psutil.disk_usage(path)
            return {
                'total_bytes': disk_usage.total,
                'used_bytes': disk_usage.used,
                'free_bytes': disk_usage.free,
                'usage_percent': round(disk_usage.percent, 2)
            }
        except Exception as e:
            print(f"Failed to get disk overview: {e}")
            return {
                'total_bytes': 0,
                'used_bytes': 0,
                'free_bytes': 0,
                'usage_percent': 0
            }
    
    def format_size(self, bytes_size: int) -> str:
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_size < 1024.0:
                return f"{bytes_size:.2f} {unit}"
            bytes_size /= 1024.0
        return f"{bytes_size:.2f} PB"
