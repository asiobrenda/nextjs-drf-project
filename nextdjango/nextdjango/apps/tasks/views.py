from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import viewsets, generics
from .serializers import MFATokenObtainPairSerializer, TaskSerializer , UserSerializer
from .models import Task
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.mail import send_mail
from .models import EmailOTP
import random
import string
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings

def home(request):
    return HttpResponse('Next.js X Django')

class MFATokenObtainPairView(TokenObtainPairView):
    serializer_class = MFATokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Allow anyone to register


class ListTasksView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(owner=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class AddTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)  # Set owner here
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UpdateTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, owner=request.user)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskSerializer(task, data=request.data, partial=True)  # partial=True allows partial updates
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, owner=request.user)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.all()  # Everyone sees all tasks

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        if not (task.owner == user or user.is_staff or user.is_superuser):
            return Response({"detail": "You do not have permission to update this task"},
                          status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        task = self.get_object()
        user = request.user
        if not (task.owner == user or user.is_superuser):
            return Response({"detail": "You do not have permission to delete this task"},
                          status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

class LoginWithEmailOTPView(APIView):
    permission_classes = [AllowAny]  # Override IsAuthenticated

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        otp_code = request.data.get('otp_code')

        # Authenticate user
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if not otp_code:  # Step 1: Send OTP
            code = ''.join(random.choices(string.digits, k=6))
            expires_at = timezone.now() + timezone.timedelta(minutes=10)
            EmailOTP.objects.filter(user=user).delete()  # Clear old OTPs
            EmailOTP.objects.create(user=user, code=code, expires_at=expires_at)

            try:
                send_mail(
                    'Your Login Code',
                    f'Your one-time code is: {code}. It expires in 10 minutes.',
                    settings.DEFAULT_FROM_EMAIL,  # Use configured sender
                    [user.email],
                    fail_silently=False,
                )
                return Response({'message': 'OTP sent to your email'}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': f'Failed to send email: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Step 2: Verify OTP
        try:
            otp = EmailOTP.objects.get(user=user, code=otp_code)
            if not otp.is_valid():
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
            otp.delete()  # OTP is one-time use
        except EmailOTP.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_200_OK)