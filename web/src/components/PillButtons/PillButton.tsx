import React from "react";
import './PillButton.css'

export enum PillButtonVariant {
  Neutral = 0,
  Positive,
  Negative
}

const variantToBackgroundColor = (variant: PillButtonVariant) => {
  if (variant === PillButtonVariant.Positive) {
    return '#E05140'
  } else if (variant === PillButtonVariant.Negative) {
    return '#0d71bb'
  } else {
    return '#727272'
  }
}

interface Props {
  text: string
  variant: PillButtonVariant
  onClick: () => void
  disabled?: boolean
}

export default (props: Props) => {
  return (
    <div
      className='pill-button'
      style={{
        cursor: props.disabled ? 'auto' : 'pointer',
        backgroundColor: props.disabled ? '#727272' : variantToBackgroundColor(props.variant)
      }}
      onClick={e => {
        e.preventDefault()
        props.onClick()
      }}
    >{props.text}</div>
  )
}