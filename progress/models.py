from django.db import models


class SectionView(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="section_views")
    section = models.ForeignKey("courses.Section", on_delete=models.CASCADE, related_name="views")
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "section"], name="unique_section_view")]
