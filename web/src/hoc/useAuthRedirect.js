import React from 'react'
import {accessTokenExists, getAccessToken} from "../api/AuthStorage";

export default () => {
  if (accessTokenExists()) {
    return getAccessToken()
  } else {
    window.location.href = '/signin'
  }
}
