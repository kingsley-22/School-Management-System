from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve

FRONTEND_DIR = settings.BASE_DIR.parent / 'frontend'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/instructor/', include('instructors.api_urls')),
    path('api/students/', include('students.urls')),
    path('api/', include('accounts.urls')),
    path('instructor/', include('instructors.urls')),

    # Serve frontend assets in development
    re_path(r'^css/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'css'}),
    re_path(r'^js/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'js'}),
    re_path(r'^image/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'image'}),
    re_path(r'^images/(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR / 'images'}),
]
