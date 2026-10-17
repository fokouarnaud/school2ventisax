from modeltranslation.translator import TranslationOptions, register

from .models import Choice, Question


@register(Question)
class QuestionTranslation(TranslationOptions):
    fields = ("prompt", "explanation")


@register(Choice)
class ChoiceTranslation(TranslationOptions):
    fields = ("text",)
