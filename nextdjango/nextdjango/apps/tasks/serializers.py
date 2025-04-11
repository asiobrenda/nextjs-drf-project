from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django_otp import devices_for_user
from rest_framework import exceptions
from .models import Task, User

class MFATokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        # Check if user has MFA enabled and verified
        if not user.is_anonymous:
            devices = list(devices_for_user(user))
            if devices and not user.is_verified():
                raise exceptions.AuthenticationFailed(
                    'MFA is required. Please verify your second factor.'
                )
        return data

class TaskSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'owner', 'owner_username', 'status', 'created_at']
        read_only_fields = ['id', 'owner', 'owner_username', 'created_at']  # Prevent frontend from setting these


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {
            'password': {'write_only': True},  # Hide password in response
            'role': {'default': 'member'}      # Default role for new users
        }

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'member')
        )
        return user