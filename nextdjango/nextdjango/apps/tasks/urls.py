from django.urls import path
from .import views
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (MFATokenObtainPairView, RegisterView, ListTasksView, AddTaskView, UpdateTaskView, DeleteTaskView,
                    TaskViewSet, UserProfileView, LoginWithEmailOTPView)

router = DefaultRouter()
router.register(r'all-tasks', TaskViewSet, basename='all-tasks')

urlpatterns = [
    path('', views.home, name='home'),
    path('token/', MFATokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('mfa/', include('mfa.urls')),
    path('register/', RegisterView.as_view(), name='register'),
    path('tasks/', ListTasksView.as_view(), name='task-list'),
    path('tasks/add/', AddTaskView.as_view(), name='task-add'),
    path('tasks/<int:pk>/update/', UpdateTaskView.as_view(), name='task-update'),
    path('tasks/<int:pk>/delete/', DeleteTaskView.as_view(), name='task-delete'),
    path('', include(router.urls)),
    path('api/user/', UserProfileView.as_view(), name='user-profile'),
    path('api/login/otp/', LoginWithEmailOTPView.as_view(), name='login_otp'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
