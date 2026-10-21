from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            "email",
            'password',
            'confirm_password',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'password': 'Passwords do not match. '
            })
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role='STUDENT',
        )
        return user

class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'role',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
