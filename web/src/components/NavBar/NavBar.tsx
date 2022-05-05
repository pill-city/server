import React from 'react'
import {useMediaQuery} from "react-responsive";
import {useAppSelector} from "../../store/hooks";
import {useHistory, useLocation} from "react-router-dom";
import "./NavBar.css"
import {BellIcon, HomeIcon, PlusCircleIcon, UserCircleIcon, UserGroupIcon} from "@heroicons/react/solid";

const handleNavItemActiveClass = (currentPath: string, expectedPath: string) => {
  return currentPath === expectedPath ? "nav-bar-button-active" : ''
}

const DesktopNavBar = () => {
  const history = useHistory()
  const path = useLocation().pathname

  return (
    <div className="nav-bar-container nav-bar-top">
      <div
        className={`nav-bar-button-container nav-bar-button-container-aligned ${handleNavItemActiveClass(path, "/")}`}
        onClick={() => {history.push('/')}}
      >
        <HomeIcon />
        <span className='nav-bar-button-text'>Home</span>
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-aligned ${handleNavItemActiveClass(path, "/circles")}`}
        onClick={() => {history.push('/circles')}}
      >
        <PlusCircleIcon />
        <span className='nav-bar-button-text'>Circles</span>
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-aligned ${handleNavItemActiveClass(path, "/users")}`}
        onClick={() => {history.push('/users')}}
      >
        <UserGroupIcon />
        <span className='nav-bar-button-text'>Users</span>
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-aligned ${handleNavItemActiveClass(path, "/profile")}`}
        onClick={() => {history.push('/profile')}}
      >
        <UserCircleIcon />
        <span className='nav-bar-button-text'>Profile</span>
      </div>
    </div>
  )
}

const MobileNavBar = () => {
  const history = useHistory()
  const path =  useLocation().pathname
  const hasNewNotifications = useAppSelector(state => state.notifications.notifications.filter(n => n.unread).length > 0)

  return (
    <div className="nav-bar-container nav-bar-bottom">
      <div
        className={`nav-bar-button-container nav-bar-button-container-spaced ${handleNavItemActiveClass(path, "/users")}`}
        onClick={() => {history.push('/users')}}
      >
        <UserGroupIcon />
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-spaced ${handleNavItemActiveClass(path, "/circles")}`}
        onClick={() => {history.push('/circles')}}
      >
        <PlusCircleIcon />
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-spaced ${handleNavItemActiveClass(path, "/")}`}
        onClick={() => {history.push('/')}}
      >
        <HomeIcon />
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-spaced ${handleNavItemActiveClass(path, "/notifications")}`}
        onClick={() => {history.push('/notifications')}}
      >
        {hasNewNotifications && <div className='nav-bar-notification-indicator-wrapper'><div className='nav-bar-notification-indicator' /></div>}
        <BellIcon />
      </div>
      <div
        className={`nav-bar-button-container nav-bar-button-container-spaced ${handleNavItemActiveClass(path, "/profile")}`}
        onClick={() => {history.push('/profile')}}
      >
        <UserCircleIcon />
      </div>
    </div>
  )
}

export default () => {
  const isTabletOrMobile = useMediaQuery({query: '(max-width: 750px)'})

  return (
    isTabletOrMobile ? <MobileNavBar /> : <DesktopNavBar />
  )
}
