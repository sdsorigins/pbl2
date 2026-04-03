import os
import psutil
import json
from pathlib import Path
from collections import defaultdict
import time
from datetime import datetime
import threading
import concurrent.futures
from queue import Queue
import hashlib

class AdvancedStorageAnalyzer:
    """Ultra-fast storage analysis with multi-threading and smart caching"""
    
    def __init__(self):
        self.scan_cache = {}
        self.last_scan_time = {}
        self.scan_in_progress = {}
        self.thread_pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)
        self.file_queue = Queue()
        self.results_cache = {}
        
    def get_disk_usage_summary(self):
        """Get overview of all disk drives with caching"""
        cache_key = "drives_summary"
        current_time = time.time()
        
        # Use cache if less than 30 seconds old
        if cache_key in self.results_cache:
            cached_data, cache_time = self.results_cache[cache_key]
            if current_time - cache_time < 30:
                return cached_data
        
        drives = []
        partitions = psutil.disk_partitions()
        
        # Use threading for parallel disk access
        def get_drive_info(partition):
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                return {
                    'device': partition.device,
                    'mountpoint': partition.mountpoint,
                    'fstype': partition.fstype,
                    'total_gb': round(usage.total / (1024**3), 2),
                    'used_gb': round(usage.used / (1024**3), 2),
                    'free_gb': round(usage.free / (1024**3), 2),
                    'used_percent': round((usage.used / usage.total) * 100, 1),
                    'free_percent': round((usage.free / usage.total) * 100, 1)
                }
            except (PermissionError, OSError):
                return None
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(get_drive_info, p) for p in partitions]
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result:
                    drives.append(result)
        
        # Cache the result
        self.results_cache[cache_key] = (drives, current_time)
        return drives
    
    def ultra_fast_scan(self, root_path, progress_callback=None):
        """Ultra-fast multi-threaded directory scan"""
        if root_path in self.scan_in_progress and self.scan_in_progress[root_path]:
            return None
            
        self.scan_in_progress[root_path] = True
        
        try:
            result = {
                'path': root_path,
                'name': os.path.basename(root_path) or root_path,
                'size': 0,
                'size_mb': 0,
                'size_gb': 0,
                'file_count': 0,
                'folder_count': 0,
                'children': [],
                'type': 'folder',
                'scan_time': datetime.now().isoformat(),
                'largest_files': [],
                'file_types': defaultdict(int),
                'scan_speed': 'ultra_fast'
            }
            
            if not os.path.exists(root_path):
                return result
            
            # Multi-threaded scanning
            folder_queue = Queue()
            folder_queue.put(root_path)
            
            all_folders = []
            processed_folders = 0
            
            # Phase 1: Discover all folders quickly
            while not folder_queue.empty():
                current_path = folder_queue.get()
                try:
                    entries = list(os.scandir(current_path))
                    folder_data = {
                        'path': current_path,
                        'name': os.path.basename(current_path) or current_path,
                        'entries': entries,
                        'size': 0,
                        'file_count': 0,
                        'folder_count': 0
                    }
                    all_folders.append(folder_data)
                    
                    # Add subdirectories to queue (limit depth)
                    if len(current_path.split(os.sep)) - len(root_path.split(os.sep)) < 2:
                        for entry in entries:
                            if entry.is_dir(follow_symlinks=False):
                                folder_queue.put(entry.path)
                                
                except (PermissionError, OSError):
                    continue
            
            # Phase 2: Process folders in parallel
            def process_folder(folder_data):
                folder_size = 0
                file_count = 0
                folder_count = 0
                large_files = []
                file_types = defaultdict(int)
                
                try:
                    for entry in folder_data['entries']:
                        try:
                            if entry.is_file(follow_symlinks=False):
                                file_size = entry.stat().st_size
                                folder_size += file_size
                                file_count += 1
                                
                                # Track large files (>50MB)
                                if file_size > 50 * 1024 * 1024:
                                    ext = Path(entry.name).suffix.lower()
                                    large_files.append({
                                        'name': entry.name,
                                        'path': entry.path,
                                        'size': file_size,
                                        'size_mb': round(file_size / (1024**2), 2),
                                        'extension': ext
                                    })
                                
                                # Track file types for files >1MB
                                if file_size > 1024 * 1024:
                                    ext = Path(entry.name).suffix.lower() or '[no extension]'
                                    file_types[ext] += file_size
                                    
                            elif entry.is_dir(follow_symlinks=False):
                                folder_count += 1
                                
                        except (PermissionError, OSError, FileNotFoundError):
                            continue
                            
                except (PermissionError, OSError):
                    pass
                
                return {
                    'path': folder_data['path'],
                    'name': folder_data['name'],
                    'size': folder_size,
                    'file_count': file_count,
                    'folder_count': folder_count,
                    'large_files': large_files,
                    'file_types': file_types
                }
            
            # Process all folders in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                futures = [executor.submit(process_folder, folder) for folder in all_folders]
                
                for i, future in enumerate(concurrent.futures.as_completed(futures)):
                    folder_result = future.result()
                    
                    # Aggregate results
                    result['size'] += folder_result['size']
                    result['file_count'] += folder_result['file_count']
                    result['folder_count'] += folder_result['folder_count']
                    result['largest_files'].extend(folder_result['large_files'])
                    
                    # Merge file types
                    for ext, size in folder_result['file_types'].items():
                        result['file_types'][ext] += size
                    
                    # Add as child if it's a direct subdirectory
                    if os.path.dirname(folder_result['path']) == root_path:
                        result['children'].append({
                            'name': folder_result['name'],
                            'path': folder_result['path'],
                            'size': folder_result['size'],
                            'size_mb': round(folder_result['size'] / (1024**2), 2),
                            'size_gb': round(folder_result['size'] / (1024**3), 2),
                            'type': 'folder'
                        })
                    
                    # Progress callback
                    if progress_callback:
                        progress_callback(i + 1, len(futures))
            
            # Sort and limit results
            result['children'].sort(key=lambda x: x['size'], reverse=True)
            result['children'] = result['children'][:100]  # Top 100 folders
            
            result['largest_files'].sort(key=lambda x: x['size'], reverse=True)
            result['largest_files'] = result['largest_files'][:50]  # Top 50 files
            
            result['file_types'] = dict(sorted(
                result['file_types'].items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:20])  # Top 20 file types
            
            # Calculate final sizes
            result['size_mb'] = round(result['size'] / (1024**2), 2)
            result['size_gb'] = round(result['size'] / (1024**3), 2)
            
            # Cache the result
            self.scan_cache[root_path] = result
            self.last_scan_time[root_path] = time.time()
            
            return result
            
        finally:
            self.scan_in_progress[root_path] = False
    
    def find_large_files_fast(self, root_path, min_size_mb=100, limit=100):
        """Ultra-fast large file finder using parallel processing"""
        large_files = []
        file_queue = Queue()
        
        def scan_directory(path):
            try:
                for entry in os.scandir(path):
                    try:
                        if entry.is_file(follow_symlinks=False):
                            file_size = entry.stat().st_size
                            size_mb = file_size / (1024**2)
                            
                            if size_mb >= min_size_mb:
                                file_queue.put({
                                    'name': entry.name,
                                    'path': entry.path,
                                    'size': file_size,
                                    'size_mb': round(size_mb, 2),
                                    'size_gb': round(size_mb / 1024, 2),
                                    'extension': Path(entry.name).suffix.lower(),
                                    'modified': datetime.fromtimestamp(entry.stat().st_mtime).isoformat()
                                })
                                
                        elif entry.is_dir(follow_symlinks=False):
                            scan_directory(entry.path)
                            
                    except (PermissionError, OSError, FileNotFoundError):
                        continue
            except (PermissionError, OSError):
                pass
        
        # Use thread pool for parallel directory scanning
        def worker():
            scan_directory(root_path)
        
        # Start scanning in background
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        thread.join(timeout=30)  # 30 second timeout
        
        # Collect results
        while not file_queue.empty():
            large_files.append(file_queue.get())
            if len(large_files) >= limit:
                break
        
        # Sort by size
        large_files.sort(key=lambda x: x['size'], reverse=True)
        return large_files[:limit]
    
    def smart_duplicate_finder(self, root_path, min_size_mb=1):
        """Smart duplicate finder using file size and partial hash"""
        size_groups = defaultdict(list)
        duplicates = []
        
        def quick_hash(filepath, size):
            """Quick hash of file start, middle, and end"""
            try:
                with open(filepath, 'rb') as f:
                    # Read first 8KB
                    start = f.read(8192)
                    
                    # Read middle 8KB
                    f.seek(size // 2)
                    middle = f.read(8192)
                    
                    # Read last 8KB
                    f.seek(max(0, size - 8192))
                    end = f.read(8192)
                    
                    return hashlib.md5(start + middle + end).hexdigest()
            except (IOError, OSError):
                return None
        
        def scan_for_duplicates(path):
            try:
                for entry in os.scandir(path):
                    try:
                        if entry.is_file(follow_symlinks=False):
                            file_size = entry.stat().st_size
                            size_mb = file_size / (1024**2)
                            
                            if size_mb >= min_size_mb:
                                size_groups[file_size].append({
                                    'name': entry.name,
                                    'path': entry.path,
                                    'size': file_size,
                                    'size_mb': round(size_mb, 2),
                                    'modified': datetime.fromtimestamp(entry.stat().st_mtime).isoformat()
                                })
                                
                        elif entry.is_dir(follow_symlinks=False):
                            scan_for_duplicates(entry.path)
                            
                    except (PermissionError, OSError, FileNotFoundError):
                        continue
            except (PermissionError, OSError):
                pass
        
        # Scan for files with same size
        scan_for_duplicates(root_path)
        
        # Check files with same size for actual duplicates
        for size, files in size_groups.items():
            if len(files) > 1:
                # Group by hash for files with same size
                hash_groups = defaultdict(list)
                
                for file_info in files:
                    file_hash = quick_hash(file_info['path'], size)
                    if file_hash:
                        hash_groups[file_hash].append(file_info)
                
                # Add groups with actual duplicates
                for hash_key, hash_files in hash_groups.items():
                    if len(hash_files) > 1:
                        duplicates.append({
                            'size': size,
                            'size_mb': round(size / (1024**2), 2),
                            'count': len(hash_files),
                            'total_waste_mb': round((size * (len(hash_files) - 1)) / (1024**2), 2),
                            'files': hash_files,
                            'hash': hash_key[:8]  # Short hash for display
                        })
        
        # Sort by potential space savings
        duplicates.sort(key=lambda x: x['total_waste_mb'], reverse=True)
        return duplicates[:50]  # Top 50 duplicate groups
    
    def get_cleanup_suggestions_advanced(self, root_path):
        """Advanced cleanup suggestions with AI-like analysis"""
        suggestions = []
        
        # Find large files
        large_files = self.find_large_files_fast(root_path, 500, 10)
        for file in large_files:
            suggestions.append({
                'type': 'large_file',
                'priority': 'high' if file['size_gb'] > 2 else 'medium',
                'description': f"Large file: {file['name']} ({file['size_gb']:.1f} GB)",
                'path': file['path'],
                'potential_savings_gb': file['size_gb'],
                'action': 'review_delete',
                'confidence': 0.8
            })
        
        # Find duplicates
        duplicates = self.smart_duplicate_finder(root_path, 10)
        total_duplicate_savings = 0
        
        for dup_group in duplicates[:10]:
            total_duplicate_savings += dup_group['total_waste_mb']
            suggestions.append({
                'type': 'duplicates',
                'priority': 'high' if dup_group['total_waste_mb'] > 100 else 'medium',
                'description': f"{dup_group['count']} duplicate files ({dup_group['size_mb']:.1f} MB each)",
                'potential_savings_mb': dup_group['total_waste_mb'],
                'files': dup_group['files'],
                'action': 'remove_duplicates',
                'confidence': 0.9
            })
        
        # Sort by priority and potential savings
        suggestions.sort(key=lambda x: (
            x['priority'] == 'high',
            x.get('potential_savings_gb', x.get('potential_savings_mb', 0) / 1024)
        ), reverse=True)
        
        return {
            'suggestions': suggestions,
            'total_potential_savings_gb': round(total_duplicate_savings / 1024, 2),
            'scan_method': 'advanced_ai'
        }