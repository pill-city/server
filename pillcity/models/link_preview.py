from enum import Enum
from mongoengine import Document, StringField, EnumField, URLField, ListField, IntField


class LinkPreviewState(Enum):
    Fetching = "fetching"
    Fetched = "fetched"
    Errored = "errored"


class LinkPreview(Document):
    url = URLField(required=True, unique=True)
    title = StringField(required=False, default='')
    subtitle = StringField(required=False, default='')
    image_urls = ListField(URLField(), required=False, default=list)
    state = EnumField(LinkPreviewState, required=True)
    errored_retries = IntField(required=False, default=0)
    errored_next_refetch_seconds = IntField(required=False, default=0)
