from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'members', views.MemberViewSet, basename='member')
router.register(r'dependants', views.DependantViewSet, basename='dependant')
router.register(r'contributions', views.ContributionViewSet, basename='contribution')
router.register(r'providers', views.ProviderViewSet, basename='provider')
router.register(r'claims', views.ClaimViewSet, basename='claim')
router.register(r'fraud-alerts', views.FraudAlertViewSet, basename='fraud-alert')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
]