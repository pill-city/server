import enum
import bleach
from typing import List, Optional
from pillcity.daos.media import delete_media_list
from pillcity.models import Comment, NotifyingAction, User, Post, Media
from pillcity.utils.make_uuid import make_uuid
from pillcity.utils.now import now_seconds
from .exceptions import UnauthorizedAccess, BadRequest
from .post import sees_post
from .post_cache import set_in_post_cache, exists_in_post_cache
from .notification import create_notification, nullify_notifications
from .mention import mention
from .user import find_ghost_user_or_raise
from .media import use_media_list


def create_comment(self: User, content: str, parent_post: Post, parent_comment: Optional[Comment],
                   mentioned_users: List[User], media_list: List[Media],
                   reply_to_comment_id: Optional[str]) -> Comment:
    """
    Create a comment for the user

    :param self: The acting user
    :param content: The content
    :param parent_post: The post that this comment is attached to
    :param parent_comment: The comment that this (maybe) nested comment is attached to
    :param mentioned_users: List of mentioned users
    :param media_list: List of media attachment
    :param reply_to_comment_id: Replying to a nested comment (only for nested comment)
    :return The new comment object
    """
    # context_home_or_profile=False because context_home_or_profile only affects public posts
    # and it is fine for someone who does not see a public post on his home
    # to be able to interact (comment, nested-comment, etc) with this post
    # e.g. context_home_or_profile is reduced to the most permissive because context_home_or_profile only affects
    # public posts
    if not sees_post(self, parent_post, context_home_or_profile=False):
        raise UnauthorizedAccess()
    if parent_comment and parent_comment.deleted:
        raise UnauthorizedAccess()
    if parent_post.deleted:
        raise UnauthorizedAccess()

    # a comment has to have either content or media
    if not content and not media_list:
        raise BadRequest()

    use_media_list(media_list)

    new_comment = Comment()
    new_comment.eid = make_uuid()
    new_comment.author = self.id
    if content:
        new_comment.content = bleach.clean(content)
    new_comment.created_at = now_seconds()
    new_comment.media_list = media_list
    if reply_to_comment_id:
        new_comment.reply_to_comment_id = reply_to_comment_id

    if not parent_comment:
        parent_post.comments2.append(new_comment)
    else:
        parent_comment.comments.append(new_comment)
    parent_post.save()

    create_comment_notifications(self, new_comment, parent_comment, parent_post)

    mention(
        self,
        notified_href=new_comment.make_href(parent_post),
        notified_summary=new_comment.content,
        mentioned_users=mentioned_users
    )

    return new_comment


def create_comment_notifications(
        self: User, new_comment: Comment, parent_comment: Optional[Comment], parent_post: Post
):
    if not parent_comment:
        # comment to a post, just notify the post owner
        create_notification(
            self,
            notifying_href=new_comment.make_href(parent_post),
            notifying_summary=new_comment.content,
            notifying_action=NotifyingAction.Comment,
            notified_href=parent_post.make_href(),
            notified_summary=parent_post.content,
            owner=parent_post.author
        )
        return

    if not new_comment.reply_to_comment_id:
        # nested comment but only to its parent comment, just notify the parent comment owner
        create_notification(
            self,
            notifying_href=new_comment.make_href(parent_post),
            notifying_summary=new_comment.content,
            notifying_action=NotifyingAction.Comment,
            notified_href=parent_comment.make_href(parent_post),
            notified_summary=parent_comment.content,
            owner=parent_comment.author
        )
        return

    # nested comment replying to a previous nested comment
    replied_comment = dangerously_get_comment(new_comment.reply_to_comment_id, parent_post)

    if not replied_comment:
        return

    # notify the replied comment owner
    create_notification(
        self,
        notifying_href=new_comment.make_href(parent_post),
        notifying_summary=new_comment.content,
        notifying_action=NotifyingAction.Comment,
        notified_href=replied_comment.make_href(parent_post),
        notified_summary=replied_comment.content,
        owner=replied_comment.author
    )

    if replied_comment.author != parent_comment.author:
        # notify the parent comment owner if it's different from the replied nested comment owner
        create_notification(
            self,
            notifying_href=new_comment.make_href(parent_post),
            notifying_summary=new_comment.content,
            notifying_action=NotifyingAction.Comment,
            notified_href=parent_comment.make_href(parent_post),
            notified_summary=parent_comment.content,
            owner=parent_comment.author
        )


def dangerously_get_comment(comment_id: str, parent_post: Post) -> Optional[Comment]:
    """
    Get a Comment by its ID without checking permission
    We don't need to check permission here because this method is only used internally
        e.g. Not exposed to an API

    :param comment_id: Comment ID
    :param parent_post: Parent post object
    :return: Comment object
    """
    for comment2 in parent_post.comments2:
        if comment2.eid == comment_id:
            return comment2
        for nested_comment in comment2.comments:
            if nested_comment.eid == comment_id:
                return nested_comment
    return None


def delete_comment(self: User, comment_id: str, parent_post: Post) -> Optional[Comment]:
    """
    Delete a comment by its ID

    :param self: The acting user
    :param comment_id: The comment ID
    :param parent_post: The parent post
    :return:
    """
    comment = dangerously_get_comment(comment_id, parent_post)
    if self != comment.author:
        raise UnauthorizedAccess()

    ghost_user = find_ghost_user_or_raise()
    nullify_notifications(comment.make_href(parent_post), ghost_user)

    comment.author = ghost_user
    comment.content = ''
    comment.deleted = True
    delete_media_list(comment.media_list)
    comment.media_list = []
    parent_post.save()

    if exists_in_post_cache(parent_post.id):
        # only set in post cache if it already exists
        # post cache should only have reshared posts so it should not cache any deleted post
        set_in_post_cache(parent_post)

    return comment
