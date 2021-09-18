import React, {useState} from 'react'
import {Redirect} from 'react-router-dom'
import "./withNavBar.css"
import NavBar from "../../components/NavBar/NavBar";

export default (WrappedComponent, path) => {
  const [redirectTo, updateRedirectTo] = useState(undefined)

  if (redirectTo !== undefined && redirectTo !== path) {
    return <Redirect to={redirectTo}/>
  }

  return (<NavBar wrappedComponent={<WrappedComponent />} path={path}
                  updateRedirectTo={updateRedirectTo}/>)

}
