import React, {useEffect, useState} from 'react';
import Post from "../../components/Post/Post";
import "./Home.css"
import NewPost from "../../components/NewPost/NewPost";
import NotificationDropdown from "../../components/NotificationDropdown/NotificationDropdown";
import {useMediaQuery} from "react-responsive";
import MobileNewPost from "../../components/MobileNewPost/MobileNewPost";
import About from "../../components/About/About";
import PostModel from "../../models/Post"
import User from "../../models/User";
import {useInterval} from "react-interval-hook";

interface Props {
  api: any
}

export default (props: Props) => {
  const [loading, updateLoading] = useState(true)
  const [posts, updatePosts] = useState<PostModel[]>([])
  const [me, updateMe] = useState<User | null>(null)
  const [resharePostData, updateResharePostData] = useState<PostModel | null>(null)
  const [mobileNewPostOpened, updateMobileNewPostOpened] = useState(false)
  const [loadingMorePosts, updateLoadingMorePosts] = useState(false)
  const [pollingNewPosts, updatePollingNewPosts] = useState(false)

  const isTabletOrMobile = useMediaQuery({query: '(max-width: 750px)'})

  useEffect(() => {
    (async () => {
      updateMe(await props.api.getMe())
      updatePosts(await props.api.getHome())
      updateLoading(false)
    })()
  }, [])

  const pollNewPosts = async () => {
    if (posts.length === 0 || loading || pollingNewPosts) {
      return
    }
    updatePollingNewPosts(true)
    const newPosts = await props.api.pollHome(posts[0].id)
    updatePosts([...newPosts, ...posts])
    updatePollingNewPosts(false)
  }

  useInterval(pollNewPosts, 5000)

  const loadMorePosts = async () => {
    if (loadingMorePosts) {
      return
    }
    updateLoadingMorePosts(true)
    const lastPost = posts[posts.length - 1]
    const newPosts = await props.api.getHome(lastPost['id'])
    if (newPosts.length !== 0) {
      updatePosts(posts.concat(newPosts))
    } else {
      alert('You have reached the end.')
    }
    updateLoadingMorePosts(false)
  }

  let homePostElement = () => {
    if (loading) {
      return (<div className="home-status">Loading...</div>)
    } else if (posts.length === 0) {
      return (<div className="home-status">No posts here</div>)
    } else {
      let postElements = []
      for (let i = 0; i < posts.length; i++) {
        const post = posts[i]
        postElements.push(
          <Post
            // need to use post ID instead of index as key
            // otherwise comments and reactions will be shifted after a new post is prepended
            key={post.id}
            data={post}
            me={me}
            api={props.api}
            detail={false}
            hasNewPostModal={isTabletOrMobile}
            updateResharePostData={updateResharePostData}
            newPostOpened={mobileNewPostOpened}
            updateNewPostOpened={updateMobileNewPostOpened}
          />
        )
      }
      if (!loadingMorePosts) {
        postElements.push(
          <div
            key={posts.length}
            className='home-load-more'
            onClick={loadMorePosts}
          >Load more</div>
        )
      } else {
        postElements.push(
          <div
            key={posts.length}
            className='home-load-more home-load-more-disabled'
          >Loading...</div>
        )
      }
      return postElements
    }
  }

  return (
    <div className="home-wrapper">
      <div className="home-posts-wrapper">
        {homePostElement()}
      </div>
      {isTabletOrMobile &&
        <MobileNewPost
          api={props.api}
          resharePostData={resharePostData}
          updateResharePostData={updateResharePostData}
          newPostOpened={mobileNewPostOpened}
          updateNewPostOpened={updateMobileNewPostOpened}
          beforePosting={() => {
            updateMobileNewPostOpened(false)
          }}
          afterPosting={pollNewPosts}
        />
      }
      {!isTabletOrMobile &&
        <div className="home-right-column-container">
          <NewPost
            api={props.api}
            resharePostData={resharePostData}
            updateResharePostData={updateResharePostData}
            beforePosting={() => {}}
            afterPosting={pollNewPosts}
          />
          <NotificationDropdown api={props.api}/>
          <About api={props.api}/>
        </div>
      }
    </div>
  )
}
