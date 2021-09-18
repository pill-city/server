import React, {useEffect, useState} from 'react';
import Post from "../../components/Post/Post";
import "./Home.css"
import NewPost from "../../components/NewPost/NewPost";
import NotificationDropdown from "../../components/NotificationDropdown/NotificationDropdown";
import {useMediaQuery} from "react-responsive";
import MobileNewPost from "../../components/MobileNewPost/MobileNewPost";
import About from "../../components/About/About";
import NavBar from "../../components/NavBar/NavBar";
import useApi from "../../hoc/useApi";
import useAuthRedirect from "../../hoc/useAuthRedirect";

export default (props) => {
  const [loading, updateLoading] = useState(true)
  const [posts, updatePosts] = useState([])
  const [circles, updateCircles] = useState([])
  const [me, updateMe] = useState(null)
  const [resharePostData, updateResharePostData] = useState(null)
  const [mobileNewPostOpened, updateMobileNewPostOpened] = useState(false)
  const isTabletOrMobile = useMediaQuery({query: '(max-width: 750px)'})
  const authentication = useAuthRedirect()
  const api = useApi()

  useEffect(async () => {
    updateMe(await api.getMe())
    updatePosts(await api.getHome())
    updateCircles(await api.getCircles())
    updateLoading(false)
  }, [])

  const loadMorePosts = async () => {
    const lastPost = posts[posts.length - 1]
    const newPosts = await api.getHome(lastPost['id'])
    if (newPosts.length !== 0) {
      updatePosts(posts.concat(newPosts))
    } else {
      alert('You have reached the end.')
    }
  }

  let homePostElement = () => {
    if (loading) {
      return (<div className="home-status">Loading...</div>)
    } else if (posts.length === 0) {
      return (<div className="home-status">No posts here</div>)
    } else {
      let postElements = []
      for (let i = 0; i < posts.length; i++) {
        postElements.push(<Post key={i} data={posts[i]} me={me} api={api}
                                hasNewPostModal={isTabletOrMobile}
                                updateResharePostData={updateResharePostData}
                                newPostOpened={mobileNewPostOpened}
                                updateNewPostOpened={updateMobileNewPostOpened}/>)
      }
      postElements.push(
        <div
          key={posts.length}
          className='home-load-more'
          onClick={loadMorePosts}
        >Load more</div>
      )
      return postElements
    }
  }

  const Home = () => {
    return (
      <div className="home-wrapper">
        <div className="home-posts-wrapper">
          {homePostElement()}
        </div>
        {isTabletOrMobile && <MobileNewPost circles={circles}
                                            me={me}
                                            api={api}
                                            resharePostData={resharePostData}
                                            updateResharePostData={updateResharePostData}
                                            newPostOpened={mobileNewPostOpened}
                                            updateNewPostOpened={updateMobileNewPostOpened}
        />}
        {!isTabletOrMobile && <div className="home-right-column-container">
          <NewPost circles={circles}
                   me={me}
                   api={api}
                   resharePostData={resharePostData}
                   updateResharePostData={updateResharePostData}/>
          <NotificationDropdown api={api}/>
          <About api={api}/>
        </div>}
      </div>)
  }

  return (
    <NavBar path='/' wrappedComponent={<Home/>}/>
  )
}
