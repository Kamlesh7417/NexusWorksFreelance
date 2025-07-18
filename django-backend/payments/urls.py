from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'payments', views.PaymentViewSet)
router.register(r'gateways', views.PaymentGatewayViewSet)
router.register(r'payment-methods', views.PaymentMethodViewSet)
router.register(r'disputes', views.PaymentDisputeViewSet)
router.register(r'transaction-logs', views.TransactionLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Payment processing endpoints
    path('reconciliation/report/', views.payment_reconciliation_report, name='payment-reconciliation-report'),
    path('reconciliation/gateway/', views.reconcile_gateway_transactions, name='reconcile-gateway-transactions'),
    path('overdue/check/', views.check_overdue_payments, name='check-overdue-payments'),
    path('dashboard/', views.payment_dashboard, name='payment-dashboard'),
    
    # Enhanced payment processing endpoints
    path('batch/process/', views.process_batch_payments, name='process-batch-payments'),
    path('schedule/automatic/', views.schedule_automatic_payments, name='schedule-automatic-payments'),
    path('resume/project/', views.resume_project_after_payment, name='resume-project-after-payment'),
    path('analytics/', views.payment_analytics, name='payment-analytics'),
    path('status/check/', views.payment_status_check, name='payment-status-check'),
    path('retry/', views.retry_failed_payment, name='retry-failed-payment'),
    path('gateway/metrics/', views.gateway_performance_metrics, name='gateway-performance-metrics'),
    
    # Webhook endpoints
    path('webhooks/stripe/', views.stripe_webhook, name='stripe-webhook'),
    path('webhooks/paypal/', views.paypal_webhook, name='paypal-webhook'),
]