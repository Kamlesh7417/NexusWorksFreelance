"""
Alerting system for critical service monitoring
"""
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

class AlertSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"

@dataclass
class Alert:
    id: str
    title: str
    description: str
    severity: AlertSeverity
    status: AlertStatus
    service: str
    metric: str
    value: float
    threshold: float
    timestamp: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None

class AlertManager:
    """Centralized alert management system"""
    
    CACHE_PREFIX = 'alerts'
    COOLDOWN_PERIOD = 300  # 5 minutes
    
    def __init__(self):
        self.notification_channels = self._setup_notification_channels()
    
    def _setup_notification_channels(self) -> Dict[str, Any]:
        """Setup notification channels"""
        channels = {}
        
        # Slack integration
        if hasattr(settings, 'SLACK_WEBHOOK_URL'):
            channels['slack'] = {
                'webhook_url': settings.SLACK_WEBHOOK_URL,
                'channel': getattr(settings, 'SLACK_ALERT_CHANNEL', '#alerts'),
            }
        
        # Email integration
        if hasattr(settings, 'EMAIL_HOST'):
            channels['email'] = {
                'recipients': getattr(settings, 'ALERT_EMAIL_RECIPIENTS', []),
                'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'alerts@freelanceplatform.com'),
            }
        
        # PagerDuty integration
        if hasattr(settings, 'PAGERDUTY_INTEGRATION_KEY'):
            channels['pagerduty'] = {
                'integration_key': settings.PAGERDUTY_INTEGRATION_KEY,
                'api_url': 'https://events.pagerduty.com/v2/enqueue',
            }
        
        # Discord integration
        if hasattr(settings, 'DISCORD_WEBHOOK_URL'):
            channels['discord'] = {
                'webhook_url': settings.DISCORD_WEBHOOK_URL,
            }
        
        return channels
    
    def create_alert(self, 
                    title: str,
                    description: str,
                    severity: AlertSeverity,
                    service: str,
                    metric: str,
                    value: float,
                    threshold: float) -> Alert:
        """Create a new alert"""
        
        alert_id = f"{service}_{metric}_{int(timezone.now().timestamp())}"
        
        alert = Alert(
            id=alert_id,
            title=title,
            description=description,
            severity=severity,
            status=AlertStatus.ACTIVE,
            service=service,
            metric=metric,
            value=value,
            threshold=threshold,
            timestamp=timezone.now()
        )
        
        # Check if we should suppress this alert (cooldown period)
        if self._should_suppress_alert(service, metric):
            logger.info(f"Alert suppressed due to cooldown: {alert_id}")
            return alert
        
        # Store alert
        self._store_alert(alert)
        
        # Send notifications
        self._send_notifications(alert)
        
        # Set cooldown
        self._set_alert_cooldown(service, metric)
        
        logger.warning(f"Alert created: {alert_id} - {title}")
        
        return alert
    
    def resolve_alert(self, alert_id: str, resolved_by: Optional[str] = None) -> bool:
        """Resolve an active alert"""
        alert = self._get_alert(alert_id)
        if not alert:
            return False
        
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = timezone.now()
        
        self._store_alert(alert)
        
        # Send resolution notification
        self._send_resolution_notification(alert, resolved_by)
        
        logger.info(f"Alert resolved: {alert_id}")
        
        return True
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an active alert"""
        alert = self._get_alert(alert_id)
        if not alert:
            return False
        
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = acknowledged_by
        
        self._store_alert(alert)
        
        logger.info(f"Alert acknowledged: {alert_id} by {acknowledged_by}")
        
        return True
    
    def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts"""
        alert_keys = cache.keys(f"{self.CACHE_PREFIX}:alert:*")
        alerts = []
        
        for key in alert_keys:
            alert_data = cache.get(key)
            if alert_data and alert_data.get('status') == AlertStatus.ACTIVE.value:
                alerts.append(self._deserialize_alert(alert_data))
        
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def get_alert_history(self, hours: int = 24) -> List[Alert]:
        """Get alert history for the specified time period"""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        alert_keys = cache.keys(f"{self.CACHE_PREFIX}:alert:*")
        alerts = []
        
        for key in alert_keys:
            alert_data = cache.get(key)
            if alert_data:
                alert = self._deserialize_alert(alert_data)
                if alert.timestamp >= cutoff_time:
                    alerts.append(alert)
        
        return sorted(alerts, key=lambda x: x.timestamp, reverse=True)
    
    def _should_suppress_alert(self, service: str, metric: str) -> bool:
        """Check if alert should be suppressed due to cooldown"""
        cooldown_key = f"{self.CACHE_PREFIX}:cooldown:{service}:{metric}"
        return cache.get(cooldown_key) is not None
    
    def _set_alert_cooldown(self, service: str, metric: str):
        """Set alert cooldown period"""
        cooldown_key = f"{self.CACHE_PREFIX}:cooldown:{service}:{metric}"
        cache.set(cooldown_key, True, self.COOLDOWN_PERIOD)
    
    def _store_alert(self, alert: Alert):
        """Store alert in cache"""
        alert_key = f"{self.CACHE_PREFIX}:alert:{alert.id}"
        alert_data = self._serialize_alert(alert)
        cache.set(alert_key, alert_data, 86400)  # Store for 24 hours
    
    def _get_alert(self, alert_id: str) -> Optional[Alert]:
        """Get alert from cache"""
        alert_key = f"{self.CACHE_PREFIX}:alert:{alert_id}"
        alert_data = cache.get(alert_key)
        
        if alert_data:
            return self._deserialize_alert(alert_data)
        
        return None
    
    def _serialize_alert(self, alert: Alert) -> Dict[str, Any]:
        """Serialize alert to dictionary"""
        return {
            'id': alert.id,
            'title': alert.title,
            'description': alert.description,
            'severity': alert.severity.value,
            'status': alert.status.value,
            'service': alert.service,
            'metric': alert.metric,
            'value': alert.value,
            'threshold': alert.threshold,
            'timestamp': alert.timestamp.isoformat(),
            'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None,
            'acknowledged_at': alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            'acknowledged_by': alert.acknowledged_by,
        }
    
    def _deserialize_alert(self, alert_data: Dict[str, Any]) -> Alert:
        """Deserialize alert from dictionary"""
        return Alert(
            id=alert_data['id'],
            title=alert_data['title'],
            description=alert_data['description'],
            severity=AlertSeverity(alert_data['severity']),
            status=AlertStatus(alert_data['status']),
            service=alert_data['service'],
            metric=alert_data['metric'],
            value=alert_data['value'],
            threshold=alert_data['threshold'],
            timestamp=datetime.fromisoformat(alert_data['timestamp']),
            resolved_at=datetime.fromisoformat(alert_data['resolved_at']) if alert_data['resolved_at'] else None,
            acknowledged_at=datetime.fromisoformat(alert_data['acknowledged_at']) if alert_data['acknowledged_at'] else None,
            acknowledged_by=alert_data['acknowledged_by'],
        )
    
    def _send_notifications(self, alert: Alert):
        """Send alert notifications to all configured channels"""
        for channel_name, channel_config in self.notification_channels.items():
            try:
                if channel_name == 'slack':
                    self._send_slack_notification(alert, channel_config)
                elif channel_name == 'email':
                    self._send_email_notification(alert, channel_config)
                elif channel_name == 'pagerduty':
                    self._send_pagerduty_notification(alert, channel_config)
                elif channel_name == 'discord':
                    self._send_discord_notification(alert, channel_config)
            except Exception as e:
                logger.error(f"Failed to send {channel_name} notification: {e}")
    
    def _send_slack_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send Slack notification"""
        color_map = {
            AlertSeverity.LOW: "#36a64f",
            AlertSeverity.MEDIUM: "#ff9500",
            AlertSeverity.HIGH: "#ff0000",
            AlertSeverity.CRITICAL: "#8B0000",
        }
        
        payload = {
            "channel": config['channel'],
            "username": "AlertBot",
            "icon_emoji": ":warning:",
            "attachments": [{
                "color": color_map[alert.severity],
                "title": f"🚨 {alert.title}",
                "text": alert.description,
                "fields": [
                    {"title": "Service", "value": alert.service, "short": True},
                    {"title": "Severity", "value": alert.severity.value.upper(), "short": True},
                    {"title": "Metric", "value": alert.metric, "short": True},
                    {"title": "Value", "value": f"{alert.value} (threshold: {alert.threshold})", "short": True},
                    {"title": "Time", "value": alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"), "short": False},
                ],
                "footer": "Freelance Platform Monitoring",
                "ts": int(alert.timestamp.timestamp())
            }]
        }
        
        response = requests.post(config['webhook_url'], json=payload, timeout=10)
        response.raise_for_status()
    
    def _send_email_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send email notification"""
        subject = f"[{alert.severity.value.upper()}] {alert.title}"
        
        message = f"""
Alert Details:
- Service: {alert.service}
- Metric: {alert.metric}
- Current Value: {alert.value}
- Threshold: {alert.threshold}
- Severity: {alert.severity.value.upper()}
- Time: {alert.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")}

Description:
{alert.description}

Please investigate and take appropriate action.

---
Freelance Platform Monitoring System
        """.strip()
        
        send_mail(
            subject=subject,
            message=message,
            from_email=config['from_email'],
            recipient_list=config['recipients'],
            fail_silently=False,
        )
    
    def _send_pagerduty_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send PagerDuty notification"""
        severity_map = {
            AlertSeverity.LOW: "info",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "error",
            AlertSeverity.CRITICAL: "critical",
        }
        
        payload = {
            "routing_key": config['integration_key'],
            "event_action": "trigger",
            "dedup_key": f"{alert.service}_{alert.metric}",
            "payload": {
                "summary": alert.title,
                "source": alert.service,
                "severity": severity_map[alert.severity],
                "component": alert.service,
                "group": "freelance_platform",
                "class": alert.metric,
                "custom_details": {
                    "description": alert.description,
                    "current_value": alert.value,
                    "threshold": alert.threshold,
                    "timestamp": alert.timestamp.isoformat(),
                }
            }
        }
        
        response = requests.post(config['api_url'], json=payload, timeout=10)
        response.raise_for_status()
    
    def _send_discord_notification(self, alert: Alert, config: Dict[str, Any]):
        """Send Discord notification"""
        color_map = {
            AlertSeverity.LOW: 0x36a64f,
            AlertSeverity.MEDIUM: 0xff9500,
            AlertSeverity.HIGH: 0xff0000,
            AlertSeverity.CRITICAL: 0x8B0000,
        }
        
        payload = {
            "embeds": [{
                "title": f"🚨 {alert.title}",
                "description": alert.description,
                "color": color_map[alert.severity],
                "fields": [
                    {"name": "Service", "value": alert.service, "inline": True},
                    {"name": "Severity", "value": alert.severity.value.upper(), "inline": True},
                    {"name": "Metric", "value": alert.metric, "inline": True},
                    {"name": "Value", "value": f"{alert.value} (threshold: {alert.threshold})", "inline": True},
                ],
                "timestamp": alert.timestamp.isoformat(),
                "footer": {"text": "Freelance Platform Monitoring"}
            }]
        }
        
        response = requests.post(config['webhook_url'], json=payload, timeout=10)
        response.raise_for_status()
    
    def _send_resolution_notification(self, alert: Alert, resolved_by: Optional[str]):
        """Send alert resolution notification"""
        for channel_name, channel_config in self.notification_channels.items():
            try:
                if channel_name == 'slack':
                    self._send_slack_resolution(alert, channel_config, resolved_by)
                elif channel_name == 'discord':
                    self._send_discord_resolution(alert, channel_config, resolved_by)
            except Exception as e:
                logger.error(f"Failed to send {channel_name} resolution notification: {e}")
    
    def _send_slack_resolution(self, alert: Alert, config: Dict[str, Any], resolved_by: Optional[str]):
        """Send Slack resolution notification"""
        payload = {
            "channel": config['channel'],
            "username": "AlertBot",
            "icon_emoji": ":white_check_mark:",
            "attachments": [{
                "color": "#36a64f",
                "title": f"✅ RESOLVED: {alert.title}",
                "text": f"Alert has been resolved{f' by {resolved_by}' if resolved_by else ''}",
                "fields": [
                    {"title": "Service", "value": alert.service, "short": True},
                    {"title": "Metric", "value": alert.metric, "short": True},
                    {"title": "Duration", "value": str(alert.resolved_at - alert.timestamp), "short": True},
                ],
                "footer": "Freelance Platform Monitoring",
                "ts": int(alert.resolved_at.timestamp())
            }]
        }
        
        response = requests.post(config['webhook_url'], json=payload, timeout=10)
        response.raise_for_status()
    
    def _send_discord_resolution(self, alert: Alert, config: Dict[str, Any], resolved_by: Optional[str]):
        """Send Discord resolution notification"""
        payload = {
            "embeds": [{
                "title": f"✅ RESOLVED: {alert.title}",
                "description": f"Alert has been resolved{f' by {resolved_by}' if resolved_by else ''}",
                "color": 0x36a64f,
                "fields": [
                    {"name": "Service", "value": alert.service, "inline": True},
                    {"name": "Metric", "value": alert.metric, "inline": True},
                    {"name": "Duration", "value": str(alert.resolved_at - alert.timestamp), "inline": True},
                ],
                "timestamp": alert.resolved_at.isoformat(),
                "footer": {"text": "Freelance Platform Monitoring"}
            }]
        }
        
        response = requests.post(config['webhook_url'], json=payload, timeout=10)
        response.raise_for_status()

# Global alert manager instance
alert_manager = AlertManager()

# Convenience functions for creating common alerts
def create_performance_alert(service: str, metric: str, value: float, threshold: float):
    """Create a performance-related alert"""
    severity = AlertSeverity.HIGH if value > threshold * 2 else AlertSeverity.MEDIUM
    
    return alert_manager.create_alert(
        title=f"High {metric} in {service}",
        description=f"{service} {metric} is {value}, which exceeds the threshold of {threshold}",
        severity=severity,
        service=service,
        metric=metric,
        value=value,
        threshold=threshold
    )

def create_error_rate_alert(service: str, error_rate: float, threshold: float = 0.05):
    """Create an error rate alert"""
    severity = AlertSeverity.CRITICAL if error_rate > 0.1 else AlertSeverity.HIGH
    
    return alert_manager.create_alert(
        title=f"High Error Rate in {service}",
        description=f"{service} error rate is {error_rate:.2%}, which exceeds the threshold of {threshold:.2%}",
        severity=severity,
        service=service,
        metric="error_rate",
        value=error_rate,
        threshold=threshold
    )

def create_availability_alert(service: str, availability: float, threshold: float = 0.99):
    """Create an availability alert"""
    severity = AlertSeverity.CRITICAL if availability < 0.95 else AlertSeverity.HIGH
    
    return alert_manager.create_alert(
        title=f"Low Availability for {service}",
        description=f"{service} availability is {availability:.2%}, which is below the threshold of {threshold:.2%}",
        severity=severity,
        service=service,
        metric="availability",
        value=availability,
        threshold=threshold
    )