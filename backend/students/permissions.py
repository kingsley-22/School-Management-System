from rest_framework.permissions import BasePermission
from accounts.permissions import IsStudent


class IsStudentOwner(BasePermission):
    """
    Allows access only to authenticated users with the STUDENT role
    who own the requested object.
    """

    message = "You do not have permission to access this student resource."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) == "STUDENT"
        )

    def has_object_permission(self, request, view, obj):
        if not self.has_permission(request, view):
            return False

        if hasattr(obj, "user_id"):
            return obj.user_id == request.user.id
        if hasattr(obj, "student_id") and hasattr(obj, "student"):
            return obj.student_id == request.user.id
        return False


__all__ = ["IsStudent", "IsStudentOwner"]

