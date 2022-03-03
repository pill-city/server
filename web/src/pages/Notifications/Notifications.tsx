import React from 'react';
import NotificationList from "../../components/NotificationDropdown/NotificationList";
import {useAppDispatch} from "../../store/hooks";
import {markAllNotificationsAsRead} from "../../store/notificationsSlice";
import "./Notifications.css"

interface Props {}

const Notifications = (_: Props) => {
  const dispatch = useAppDispatch()

  return (
    <div>
      <svg
        className="mobile-all-read-button"
        onClick={async (e) => {
          e.preventDefault()
          await dispatch(markAllNotificationsAsRead())
        }}
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
      </svg>

      <NotificationList />
    </div>
  )
}

export default Notifications
