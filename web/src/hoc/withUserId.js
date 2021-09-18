import React from 'react'

export default (WrappedComponent) => {

  let id = this.props.match.params.id
  return (<WrappedComponent userId={id} {...this.props}/>)
}
