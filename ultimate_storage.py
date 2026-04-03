import os
import psutil
import json
import hashlib
import mimetypes
import sqlite3
from pathlib import Path
from collections import defaultdict, Counter
import time
from datetime import datetime, timedelta
import threading
import concurrent.futures
from queue import Queue, Empty
import subprocess
import winreg
import tempfile
import shutil
import zipfile
import rarfile
import py7zr
import magic
import numpy as np
from sklearn.cluster import DBSCAN
import cv2
from PIL import Image, ExifTags
import mutagen
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4
import win32api
import win32file
import win32con
import wmi
import requests
import asyncio
import aiofiles
import aiohttp
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
import multiprocessing as mp
from functools import lru_cache
import pickle
import zlib
import lzma
import bz2
from memory_profiler import profile
import gc
import weakref
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Set, Any
from enum import Enum, auto
import logging
from contextlib import contextmanager
import signal
import sys
class FileType(Enum):
    VIDEO = auto()
    AUDIO = auto()
    IMAGE = auto()
    DOCUMENT = auto()
    ARCHIVE = auto()
    EXECUTABLE = auto()
    CODE = auto()
    DATABASE = auto()
    SYSTEM = auto()
    TEMP = auto()
    CACHE = auto()
    LOG = auto()
    BACKUP = auto()
    UNKNOWN = auto()

@dataclass
class FileInfo:
    path: str
    name: str
    size: int
    modified: datetime
    created: datetime
    accessed: datetime
    extension: str
    file_type: FileType
    mime_type: str
    hash_md5: Optional[str] = None
    hash_sha256: Optional[str] = None
    is_duplicate: bool = False
    duplicate_group_id: Optional[str] = None
    compression_ratio: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DirectoryInfo:
    path: str
    name: str
    size: int
    file_count: int
    folder_count: int
    depth: int
    children: List['DirectoryInfo'] = field(default_factory=list)
    files: List[FileInfo] = field(default_factory=list)
    last_modified: Optional[datetime] = None
    is_system: bool = False
    is_hidden: bool = False
    permissions: Optional[str] = None

class UltimateStorageAnalyzer:
    """THE ULTIMATE STORAGE ANALYZER - ENTERPRISE GRADE WITH ALL FEATURES"""
    
    def __init__(self, cache_dir=None, max_workers=None, enable_ai=True):
        self.cache_dir = cache_dir or os.path.join(tempfile.gettempdir(), 'ultimate_storage_cache')
        self.max_workers = max_workers or min(32, (os.cpu_count() or 1) * 4)
        self.enable_ai = enable_ai
        
        # Initialize caches and databases
        self._init_cache_system()
        self._init_database()
        self._init_ai_models()
        
        # Performance monitoring
        self.stats = {
            'files_scanned': 0,
            'bytes_processed': 0,
            'duplicates_found': 0,
            'scan_time': 0,
            'cache_hits': 0,
            'cache_misses': 0
        }
        
        # Thread pools
        self.io_executor = ThreadPoolExecutor(max_workers=self.max_workers)
        self.cpu_executor = ProcessPoolExecutor(max_workers=os.cpu_count())
        
        # File type mappings
        self.file_type_map = self._build_file_type_map()
        
        # Scanning state
        self.scan_in_progress = {}
        self.cancel_flags = {}
        
        # Real-time monitoring
        self.watchers = {}
        self.change_queue = Queue()
        
        # AI-powered features
        self.similarity_threshold = 0.85
        self.ml_models = {}
        
        # Advanced features
        self.enable_deep_scan = True
        self.enable_content_analysis = True
        self.enable_metadata_extraction = True
        self.enable_compression_analysis = True
        self.enable_security_scan = True
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize WMI for Windows-specific features
        try:
            self.wmi = wmi.WMI()
        except:
            self.wmi = None
            
        # Signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    def _init_cache_system(self):
        """Initialize advanced caching system"""
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Memory caches
        self.file_cache = {}
        self.hash_cache = {}
        self.metadata_cache = {}
        self.scan_cache = {}
        
        # Persistent cache files
        self.cache_files = {
            'file_hashes': os.path.join(self.cache_dir, 'file_hashes.db'),
            'metadata': os.path.join(self.cache_dir, 'metadata.db'),
            'duplicates': os.path.join(self.cache_dir, 'duplicates.db'),
            'scan_results': os.path.join(self.cache_dir, 'scan_results.db')
        }
        
        # Load existing caches
        self._load_caches()
    
    def _init_database(self):
        """Initialize SQLite database for persistent storage"""
        self.db_path = os.path.join(self.cache_dir, 'storage_analyzer.db')
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.execute('PRAGMA journal_mode=WAL')
        self.conn.execute('PRAGMA synchronous=NORMAL')
        self.conn.execute('PRAGMA cache_size=10000')
        
        # Create tables
        self._create_tables()
    
    def _init_ai_models(self):
        """Initialize AI models for advanced analysis"""
        if not self.enable_ai:
            return
            
        try:
            # Image similarity model
            self.image_model = self._load_image_similarity_model()
            
            # Text similarity model
            self.text_model = self._load_text_similarity_model()
            
            # File classification model
            self.classifier_model = self._load_file_classifier()
            
            # Anomaly detection model
            self.anomaly_model = self._load_anomaly_detector()
            
        except Exception as e:
            self.logger.warning(f"AI models initialization failed: {e}")
            self.enable_ai = False
    
    def _build_file_type_map(self):
        """Build comprehensive file type mapping"""
        return {
            # Video files
            FileType.VIDEO: {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.ogv'},
            
            # Audio files
            FileType.AUDIO: {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff'},
            
            # Image files
            FileType.IMAGE: {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.svg', '.webp', '.ico', '.raw'},
            
            # Document files
            FileType.DOCUMENT: {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt'},
            
            # Archive files
            FileType.ARCHIVE: {'.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.cab', '.iso', '.dmg'},
            
            # Executable files
            FileType.EXECUTABLE: {'.exe', '.msi', '.app', '.deb', '.rpm', '.dmg', '.pkg', '.run', '.bin'},
            
            # Code files
            FileType.CODE: {'.py', '.js', '.html', '.css', '.cpp', '.c', '.java', '.php', '.rb', '.go', '.rs'},
            
            # Database files
            FileType.DATABASE: {'.db', '.sqlite', '.mdb', '.accdb', '.dbf', '.sql', '.bak'},
            
            # System files
            FileType.SYSTEM: {'.sys', '.dll', '.so', '.dylib', '.ini', '.cfg', '.conf', '.reg'},
            
            # Temporary files
            FileType.TEMP: {'.tmp', '.temp', '.cache', '.bak', '.old', '.~'},
            
            # Cache files
            FileType.CACHE: {'.cache', '.tmp', '.temp', '.thumbs.db', '.ds_store'},
            
            # Log files
            FileType.LOG: {'.log', '.out', '.err', '.trace', '.debug'},
            
            # Backup files
            FileType.BACKUP: {'.bak', '.backup', '.old', '.orig', '.save'}
        }
    
    async def hyper_speed_scan(self, root_path: str, progress_callback=None, options=None):
        """HYPER-SPEED MULTI-THREADED SCAN WITH ALL FEATURES"""
        scan_id = f"scan_{int(time.time())}"
        self.scan_in_progress[scan_id] = True
        self.cancel_flags[scan_id] = False
        
        start_time = time.time()
        
        try:
            # Initialize scan options
            options = options or {}
            deep_scan = options.get('deep_scan', True)
            analyze_content = options.get('analyze_content', True)
            find_duplicates = options.get('find_duplicates', True)
            extract_metadata = options.get('extract_metadata', True)
            security_scan = options.get('security_scan', False)
            
            # Phase 1: Lightning-fast directory discovery
            self.logger.info(f"Phase 1: Directory discovery for {root_path}")
            directories = await self._discover_directories_async(root_path, progress_callback)
            
            if self.cancel_flags.get(scan_id):
                return None
            
            # Phase 2: Parallel file processing
            self.logger.info(f"Phase 2: Processing {len(directories)} directories")
            file_results = await self._process_directories_parallel(
                directories, deep_scan, analyze_content, extract_metadata, progress_callback
            )
            
            if self.cancel_flags.get(scan_id):
                return None
            
            # Phase 3: Advanced analysis
            self.logger.info("Phase 3: Advanced analysis")
            analysis_results = await self._advanced_analysis(
                file_results, find_duplicates, security_scan, progress_callback
            )
            
            # Phase 4: AI-powered insights
            if self.enable_ai:
                self.logger.info("Phase 4: AI analysis")
                ai_insights = await self._ai_analysis(file_results, analysis_results)
                analysis_results['ai_insights'] = ai_insights
            
            # Compile final results
            scan_time = time.time() - start_time
            self.stats['scan_time'] = scan_time
            
            result = {
                'scan_id': scan_id,
                'path': root_path,
                'scan_time': scan_time,
                'total_size': sum(f.size for f in file_results),
                'total_files': len(file_results),
                'total_directories': len(directories),
                'file_types': self._analyze_file_types(file_results),
                'size_distribution': self._analyze_size_distribution(file_results),
                'age_analysis': self._analyze_file_ages(file_results),
                'directory_tree': self._build_directory_tree(directories, file_results),
                'largest_files': sorted(file_results, key=lambda f: f.size, reverse=True)[:100],
                'performance_stats': self.stats.copy(),
                **analysis_results
            }
            
            # Cache results
            await self._cache_scan_results(scan_id, result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Scan failed: {e}")
            raise
        finally:
            self.scan_in_progress[scan_id] = False
    async def _discover_directories_async(self, root_path: str, progress_callback=None):
        """Ultra-fast async directory discovery"""
        directories = []
        queue = asyncio.Queue()
        await queue.put((root_path, 0))
        
        processed = 0
        
        while not queue.empty():
            try:
                current_path, depth = await asyncio.wait_for(queue.get(), timeout=1.0)
                
                try:
                    # Use async file operations
                    entries = await asyncio.get_event_loop().run_in_executor(
                        self.io_executor, os.listdir, current_path
                    )
                    
                    dir_info = DirectoryInfo(
                        path=current_path,
                        name=os.path.basename(current_path) or current_path,
                        size=0,
                        file_count=0,
                        folder_count=0,
                        depth=depth
                    )
                    
                    directories.append(dir_info)
                    
                    # Add subdirectories to queue (limit depth for performance)
                    if depth < 10:
                        for entry in entries:
                            entry_path = os.path.join(current_path, entry)
                            if os.path.isdir(entry_path) and not self._should_skip_directory(entry_path):
                                await queue.put((entry_path, depth + 1))
                    
                    processed += 1
                    if progress_callback and processed % 100 == 0:
                        await progress_callback('discovery', processed, queue.qsize())
                        
                except (PermissionError, OSError, FileNotFoundError):
                    continue
                    
            except asyncio.TimeoutError:
                break
        
        return directories
    
    async def _process_directories_parallel(self, directories, deep_scan, analyze_content, extract_metadata, progress_callback):
        """Process directories in parallel with all features"""
        all_files = []
        
        # Create semaphore to limit concurrent operations
        semaphore = asyncio.Semaphore(self.max_workers)
        
        async def process_directory(dir_info):
            async with semaphore:
                return await self._process_single_directory(
                    dir_info, deep_scan, analyze_content, extract_metadata
                )
        
        # Process all directories concurrently
        tasks = [process_directory(dir_info) for dir_info in directories]
        
        completed = 0
        for coro in asyncio.as_completed(tasks):
            try:
                files = await coro
                all_files.extend(files)
                
                completed += 1
                if progress_callback:
                    await progress_callback('processing', completed, len(tasks))
                    
            except Exception as e:
                self.logger.warning(f"Directory processing failed: {e}")
                continue
        
        return all_files
    
    async def _process_single_directory(self, dir_info, deep_scan, analyze_content, extract_metadata):
        """Process a single directory with all features"""
        files = []
        
        try:
            entries = await asyncio.get_event_loop().run_in_executor(
                self.io_executor, os.listdir, dir_info.path
            )
            
            for entry in entries:
                entry_path = os.path.join(dir_info.path, entry)
                
                if os.path.isfile(entry_path):
                    try:
                        file_info = await self._analyze_file_comprehensive(
                            entry_path, deep_scan, analyze_content, extract_metadata
                        )
                        if file_info:
                            files.append(file_info)
                            dir_info.size += file_info.size
                            dir_info.file_count += 1
                            
                    except Exception as e:
                        self.logger.debug(f"File analysis failed for {entry_path}: {e}")
                        continue
                        
                elif os.path.isdir(entry_path):
                    dir_info.folder_count += 1
            
            # Update directory metadata
            dir_info.files = files
            
        except (PermissionError, OSError):
            pass
        
        return files
    
    async def _analyze_file_comprehensive(self, file_path, deep_scan, analyze_content, extract_metadata):
        """Comprehensive file analysis with all features"""
        try:
            # Get basic file stats
            stat_info = await asyncio.get_event_loop().run_in_executor(
                self.io_executor, os.stat, file_path
            )
            
            file_info = FileInfo(
                path=file_path,
                name=os.path.basename(file_path),
                size=stat_info.st_size,
                modified=datetime.fromtimestamp(stat_info.st_mtime),
                created=datetime.fromtimestamp(stat_info.st_ctime),
                accessed=datetime.fromtimestamp(stat_info.st_atime),
                extension=Path(file_path).suffix.lower(),
                file_type=self._classify_file_type(file_path),
                mime_type=mimetypes.guess_type(file_path)[0] or 'unknown'
            )
            
            # Deep analysis if enabled
            if deep_scan:
                # Calculate file hashes for duplicate detection
                if file_info.size > 1024:  # Only hash files > 1KB
                    file_info.hash_md5 = await self._calculate_hash_async(file_path, 'md5')
                
                # Content analysis
                if analyze_content and file_info.size < 100 * 1024 * 1024:  # < 100MB
                    await self._analyze_file_content(file_info)
                
                # Metadata extraction
                if extract_metadata:
                    await self._extract_file_metadata(file_info)
                
                # Security analysis
                if self.enable_security_scan:
                    await self._security_scan_file(file_info)
            
            self.stats['files_scanned'] += 1
            self.stats['bytes_processed'] += file_info.size
            
            return file_info
            
        except Exception as e:
            self.logger.debug(f"File analysis failed for {file_path}: {e}")
            return None
    async def _advanced_analysis(self, file_results, find_duplicates, security_scan, progress_callback):
        """Advanced analysis with all features"""
        results = {}
        
        # Duplicate detection
        if find_duplicates:
            if progress_callback:
                await progress_callback('duplicates', 0, 1)
            results['duplicates'] = await self._find_duplicates_advanced(file_results)
            results['duplicate_savings'] = self._calculate_duplicate_savings(results['duplicates'])
        
        # Large file analysis
        results['large_files'] = self._find_large_files_smart(file_results)
        
        # Compression analysis
        results['compression_opportunities'] = await self._analyze_compression_opportunities(file_results)
        
        # Storage optimization suggestions
        results['optimization_suggestions'] = await self._generate_optimization_suggestions(file_results)
        
        # File system health check
        results['health_check'] = await self._file_system_health_check(file_results)
        
        # Cleanup recommendations
        results['cleanup_recommendations'] = await self._generate_cleanup_recommendations(file_results)
        
        # Performance analysis
        results['performance_analysis'] = self._analyze_performance_impact(file_results)
        
        return results
    
    async def _find_duplicates_advanced(self, file_results):
        """Advanced duplicate detection with multiple algorithms"""
        duplicates = []
        
        # Group files by size first (fast pre-filter)
        size_groups = defaultdict(list)
        for file_info in file_results:
            if file_info.size > 0:  # Skip empty files
                size_groups[file_info.size].append(file_info)
        
        # Process groups with multiple files
        for size, files in size_groups.items():
            if len(files) > 1:
                # Hash-based duplicate detection
                hash_groups = await self._group_by_hash(files)
                
                for hash_value, hash_files in hash_groups.items():
                    if len(hash_files) > 1:
                        # Content-based verification for small files
                        if size < 10 * 1024 * 1024:  # < 10MB
                            verified_duplicates = await self._verify_duplicates_content(hash_files)
                        else:
                            verified_duplicates = hash_files
                        
                        if len(verified_duplicates) > 1:
                            duplicate_group = {
                                'size': size,
                                'count': len(verified_duplicates),
                                'files': [f.path for f in verified_duplicates],
                                'total_waste': size * (len(verified_duplicates) - 1),
                                'hash': hash_value,
                                'confidence': 0.95 if size < 10 * 1024 * 1024 else 0.99
                            }
                            duplicates.append(duplicate_group)
                            
                            # Mark files as duplicates
                            group_id = f"dup_{len(duplicates)}"
                            for file_info in verified_duplicates:
                                file_info.is_duplicate = True
                                file_info.duplicate_group_id = group_id
        
        # Sort by potential savings
        duplicates.sort(key=lambda x: x['total_waste'], reverse=True)
        
        self.stats['duplicates_found'] = len(duplicates)
        return duplicates
    
    def _find_large_files_smart(self, file_results, min_size_mb=100, limit=100):
        """Smart large file detection with context analysis"""
        large_files = []
        
        # Calculate dynamic threshold based on drive size
        total_size = sum(f.size for f in file_results)
        dynamic_threshold = max(min_size_mb * 1024 * 1024, total_size * 0.001)  # 0.1% of total
        
        for file_info in file_results:
            if file_info.size >= dynamic_threshold:
                # Calculate file impact score
                impact_score = self._calculate_file_impact_score(file_info, total_size)
                
                large_file_info = {
                    'path': file_info.path,
                    'name': file_info.name,
                    'size': file_info.size,
                    'size_mb': round(file_info.size / (1024**2), 2),
                    'size_gb': round(file_info.size / (1024**3), 2),
                    'extension': file_info.extension,
                    'file_type': file_info.file_type.name,
                    'modified': file_info.modified.isoformat(),
                    'impact_score': impact_score,
                    'recommendations': self._get_file_recommendations(file_info)
                }
                large_files.append(large_file_info)
        
        # Sort by impact score
        large_files.sort(key=lambda x: x['impact_score'], reverse=True)
        return large_files[:limit]
    
    async def _analyze_compression_opportunities(self, file_results):
        """Analyze compression opportunities for different file types"""
        opportunities = []
        
        # Group files by type
        type_groups = defaultdict(list)
        for file_info in file_results:
            type_groups[file_info.file_type].append(file_info)
        
        for file_type, files in type_groups.items():
            if file_type in [FileType.DOCUMENT, FileType.CODE, FileType.LOG]:
                # These file types typically compress well
                total_size = sum(f.size for f in files)
                estimated_compressed_size = total_size * 0.3  # Estimate 70% compression
                potential_savings = total_size - estimated_compressed_size
                
                if potential_savings > 100 * 1024 * 1024:  # > 100MB savings
                    opportunities.append({
                        'file_type': file_type.name,
                        'file_count': len(files),
                        'total_size': total_size,
                        'estimated_compressed_size': estimated_compressed_size,
                        'potential_savings': potential_savings,
                        'compression_ratio': 0.7,
                        'recommendation': f'Compress {len(files)} {file_type.name.lower()} files'
                    })
        
        return opportunities
    
    async def _generate_optimization_suggestions(self, file_results):
        """Generate intelligent storage optimization suggestions"""
        suggestions = []
        
        # Analyze file age patterns
        old_files = [f for f in file_results if (datetime.now() - f.modified).days > 365]
        if old_files:
            total_old_size = sum(f.size for f in old_files)
            suggestions.append({
                'type': 'archive_old_files',
                'priority': 'medium',
                'description': f'Archive {len(old_files)} files older than 1 year',
                'potential_savings': total_old_size,
                'files_affected': len(old_files),
                'action': 'Move to archive storage or compress'
            })
        
        # Analyze temporary files
        temp_files = [f for f in file_results if f.file_type == FileType.TEMP]
        if temp_files:
            total_temp_size = sum(f.size for f in temp_files)
            suggestions.append({
                'type': 'cleanup_temp_files',
                'priority': 'high',
                'description': f'Clean up {len(temp_files)} temporary files',
                'potential_savings': total_temp_size,
                'files_affected': len(temp_files),
                'action': 'Safe to delete'
            })
        
        # Analyze cache files
        cache_files = [f for f in file_results if f.file_type == FileType.CACHE]
        if cache_files:
            total_cache_size = sum(f.size for f in cache_files)
            suggestions.append({
                'type': 'cleanup_cache_files',
                'priority': 'medium',
                'description': f'Clean up {len(cache_files)} cache files',
                'potential_savings': total_cache_size,
                'files_affected': len(cache_files),
                'action': 'Safe to delete (will regenerate)'
            })
        
        return suggestions