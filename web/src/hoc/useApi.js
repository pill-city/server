import React from 'react'
import Api from "../api/Api";

export default () => {
  return new Api(process.env.REACT_APP_API_ENDPOINT)
}
