import numpy as np
from collections import deque
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    
    def __init__(self, window_size=100, learning_period=50):
        self.window_size = window_size
        self.learning_period = learning_period
        self.history = deque(maxlen=window_size)
        self.baseline_stats = {}
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
        self.sample_count = 0
    
    def add_sample(self, metrics):
        features = [
            metrics['cpu_percent'],
            metrics['memory_percent'],
            metrics['net_sent_mbps'],
            metrics['net_recv_mbps'],
            metrics['disk_read_mbps'],
            metrics['disk_write_mbps']
        ]
        
        self.history.append(features)
        self.sample_count += 1
        
        if self.sample_count == self.learning_period:
            self._train_model()
    
    def _train_model(self):
        if len(self.history) < self.learning_period:
            return
        
        X = np.array(list(self.history))
        self.model.fit(X)
        self.is_trained = True
        
        self.baseline_stats = {
            'cpu_mean': np.mean(X[:, 0]),
            'cpu_std': np.std(X[:, 0]),
            'memory_mean': np.mean(X[:, 1]),
            'memory_std': np.std(X[:, 1]),
        }
        
        print(f"✓ Baseline learned from {self.learning_period} samples")
        print(f"  CPU: {self.baseline_stats['cpu_mean']:.1f}% ± {self.baseline_stats['cpu_std']:.1f}%")
        print(f"  Memory: {self.baseline_stats['memory_mean']:.1f}% ± {self.baseline_stats['memory_std']:.1f}%")
    
    def detect(self, metrics):
        if not self.is_trained:
            return None
        
        features = np.array([[
            metrics['cpu_percent'],
            metrics['memory_percent'],
            metrics['net_sent_mbps'],
            metrics['net_recv_mbps'],
            metrics['disk_read_mbps'],
            metrics['disk_write_mbps']
        ]])
        
        # -1 for anomaly, 1 for normal
        prediction = self.model.predict(features)[0]
        score = self.model.score_samples(features)[0]
        
        if prediction == -1:
            return self._analyze_root_cause(metrics, score)
        
        return None
    
    def _analyze_root_cause(self, metrics, anomaly_score):
        causes = []
        
        if self.baseline_stats:
            cpu_zscore = abs(metrics['cpu_percent'] - self.baseline_stats['cpu_mean']) / (self.baseline_stats['cpu_std'] + 1e-6)
            if cpu_zscore > 2.5:
                causes.append(f"CPU spike: {metrics['cpu_percent']:.1f}% (baseline: {self.baseline_stats['cpu_mean']:.1f}%)")
            
            mem_zscore = abs(metrics['memory_percent'] - self.baseline_stats['memory_mean']) / (self.baseline_stats['memory_std'] + 1e-6)
            if mem_zscore > 2.5:
                causes.append(f"Memory spike: {metrics['memory_percent']:.1f}% (baseline: {self.baseline_stats['memory_mean']:.1f}%)")
        
        if metrics['net_sent_mbps'] > 10 or metrics['net_recv_mbps'] > 10:
            causes.append(f"High network activity: ↑{metrics['net_sent_mbps']:.2f} MB/s ↓{metrics['net_recv_mbps']:.2f} MB/s")
        
        if metrics['disk_write_mbps'] > 50 or metrics['disk_read_mbps'] > 50:
            causes.append(f"High disk I/O: R{metrics['disk_read_mbps']:.2f} W{metrics['disk_write_mbps']:.2f} MB/s")
        
        return {
            'timestamp': metrics['timestamp'],
            'anomaly_score': anomaly_score,
            'causes': causes if causes else ['Unusual pattern detected'],
            'metrics': metrics
        }
