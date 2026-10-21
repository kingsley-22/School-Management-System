from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from .models import Announcement, Notification


@require_http_methods(["GET"])
def active_announcements(request):
    data = [
        {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "is_active": announcement.is_active,
            "created_at": announcement.created_at.isoformat(),
        }
        for announcement in Announcement.objects.filter(is_active=True)
    ]
    return JsonResponse({"results": data})


@require_http_methods(["GET"])
def user_notifications(request):
    user = request.user
    if not user.is_authenticated:
        return JsonResponse({"results": []})

    data = [
        {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat(),
        }
        for notification in Notification.objects.filter(user=user)
    ]
    return JsonResponse({"results": data})
