import os
import psutil
from pathlib import Path
from datetime import datetime

class SimpleStorageAnalyzer:
    
    def get_disk_usage_summary(self):
        drives = []
        
        try:
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    
                    drive_info = {
                        'device': partition.device,
                        'mountpoint': partition.mountpoint,
                        'fstype': partition.fstype,
                        'total_gb': round(usage.total / (1024**3), 2),
                        'used_gb': round(usage.used / (1024**3), 2),
                        'free_gb': round(usage.free / (1024**3), 2),
                        'used_percent': round((usage.used / usage.total) * 100, 1),
                        'free_percent': round((usage.free / usage.total) * 100, 1)
                    }
                    drives.append(drive_info)
                    
                except (PermissionError, OSError):
                    continue
                    
        except Exception as e:
            print(f"Error getting drives: {e}")
            
        return drives
    
    def quick_scan(self, root_path):
        result = {
            'path': root_path,
            'name': os.path.basename(root_path) or root_path,
            'size': 0,
            'size_mb': 0,
            'size_gb': 0,
            'file_count': 0,
            'folder_count': 0,
            'children': [],
            'largest_files': [],
            'scan_time': datetime.now().isoformat()
        }
        
        if not os.path.exists(root_path):
            return result
        
        try:
            items = list(os.scandir(root_path))
            
            for entry in items[:100]:
                try:
                    if entry.is_file(follow_symlinks=False):
                        file_size = entry.stat().st_size
                        result['size'] += file_size
                        result['file_count'] += 1
                        
                        if file_size > 100 * 1024 * 1024:
                            result['largest_files'].append({
                                'name': entry.name,
                                'path': entry.path,
                                'size': file_size,
                                'size_mb': round(file_size / (1024**2), 2),
                                'size_gb': round(file_size / (1024**3), 2)
                            })
                        
                    elif entry.is_dir(follow_symlinks=False):
                        result['folder_count'] += 1
                        folder_size = self._estimate_folder_size(entry.path)
                        
                        result['children'].append({
                            'name': entry.name,
                            'path': entry.path,
                            'size': folder_size,
                            'size_mb': round(folder_size / (1024**2), 2),
                            'size_gb': round(folder_size / (1024**3), 2),
                            'type': 'folder'
                        })
                        
                        result['size'] += folder_size
                        
                except (PermissionError, OSError, FileNotFoundError):
                    continue
            
            result['children'].sort(key=lambda x: x['size'], reverse=True)
            result['children'] = result['children'][:20]
            
            result['largest_files'].sort(key=lambda x: x['size'], reverse=True)
            result['largest_files'] = result['largest_files'][:10]
            result['size_mb'] = round(result['size'] / (1024**2), 2)
            result['size_gb'] = round(result['size'] / (1024**3), 2)
            
        except (PermissionError, OSError) as e:
            print(f"Error scanning {root_path}: {e}")
        
        return result
    
    def _estimate_folder_size(self, folder_path):
        total_size = 0
        try:
            count = 0
            for entry in os.scandir(folder_path):
                if count > 50:
                    break
                try:
                    if entry.is_file(follow_symlinks=False):
                        total_size += entry.stat().st_size
                        count += 1
                except (PermissionError, OSError):
                    continue
        except (PermissionError, OSError):
            pass
        return total_size
    
    def find_large_files(self, root_path, min_size_mb=100):
        large_files = []
        
        try:
            for entry in os.scandir(root_path):
                try:
                    if entry.is_file(follow_symlinks=False):
                        file_size = entry.stat().st_size
                        size_mb = file_size / (1024**2)
                        
                        if size_mb >= min_size_mb:
                            large_files.append({
                                'name': entry.name,
                                'path': entry.path,
                                'size': file_size,
                                'size_mb': round(size_mb, 2),
                                'size_gb': round(size_mb / 1024, 2),
                                'extension': Path(entry.name).suffix.lower()
                            })
                            
                        if len(large_files) >= 50:
                            break
                            
                except (PermissionError, OSError):
                    continue
        except (PermissionError, OSError):
            pass
        
        large_files.sort(key=lambda x: x['size'], reverse=True)
        return large_files