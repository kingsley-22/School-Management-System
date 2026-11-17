from django.db import migrations


def clear_hardcoded_course_instructors(apps, schema_editor):
    Course = apps.get_model('students', 'Course')
    Course.objects.filter(instructor__isnull=True).update(instructor_name='')


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('students', '0003_seed_tech_courses'),
    ]

    operations = [
        migrations.RunPython(clear_hardcoded_course_instructors, reverse_noop),
    ]

