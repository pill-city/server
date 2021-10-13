import React, {useState} from 'react'
import {useInterval} from "react-interval-hook";
import LinkPreview from "../../models/LinkPreview";
import MediaPreview from "../MediaPreview/MediaPreview";
import {useMediaQuery} from "react-responsive";
import './FetchedPreview.css'

interface Props {
  api: any,
  url: string
}

export default (props: Props) => {
  const [preview, updatePreview] = useState<LinkPreview | null>(null)
  const isTabletOrMobile = useMediaQuery({query: '(max-width: 750px)'})

  useInterval(async () => {
    if (preview === null || preview.state === 'fetching') {
      updatePreview(await props.api.getLinkPreview(props.url))
    }
  }, 5000, { immediate: true })

  if (preview === null || preview.state === 'fetching') {
    return null
  } else if (preview.state === 'errored') {
    return (
      <div className="fetched-preview">
        Failed to fetch preview for {' '}
        <a
          href={props.url}
          className='fetched-preview-link'
          target="_blank"
          rel="noreferrer noopener"
        >{props.url}</a>
      </div>
    )
  } else {
    return (
      <>
        {
          preview.image_urls.length !== 0 &&
            <MediaPreview
              mediaUrls={preview.image_urls}
              threeRowHeight={isTabletOrMobile ? "30px" : "80px"}
              twoRowHeight={isTabletOrMobile ? "50px" : "100px"}
              oneRowHeight={isTabletOrMobile ? "80px" : "140px"}
              forLinkPreview={true}
            />
        }
        {
          (preview.title || preview.subtitle) &&
            <div
              onClick={() => {
                window.open(props.url, '_blank')
              }}
              className={preview.image_urls.length === 0 ? "fetched-preview" : "fetched-preview fetched-preview-with-image"}
            >
              <div className='fetched-preview-title'>{preview.title}</div>
              <div className='fetched-preview-subtitle'>{preview.subtitle}</div>
            </div>
        }
      </>
    )
  }
}