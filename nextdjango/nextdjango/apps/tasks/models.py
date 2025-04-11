from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLES = (
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('member', 'Member'),
    )
    role = models.CharField(max_length=10, choices=ROLES, default='member')

class Task(models.Model):
    class Meta:
        verbose_name_plural = 'Task'
        ordering = ['id']

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username}: {self.code}"