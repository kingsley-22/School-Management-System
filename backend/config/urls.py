"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.conf import settings
import os

# Paths to your frontend assets
FRONTEND_DIR = settings.BASE_DIR.parent / 'frontend'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('instructor/', include('instructors.urls')),

    # Serve frontend assets in development
    re_path(r'^css/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'css'}),
    re_path(r'^js/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'js'}),
    re_path(r'^image/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'image'}),
    re_path(r'^images/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'images'}),
]
