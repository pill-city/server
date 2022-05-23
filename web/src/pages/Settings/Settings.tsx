import React, {useEffect, useState} from 'react'
import {removeAccessToken} from "../../api/AuthStorage";
import About from "../../components/About/About";
import UpdateAvatar from "../../components/UpdateAvatar/UpdateAvatar";
import User from "../../models/User";
import api from "../../api/Api";
import {useAppDispatch, useAppSelector} from "../../store/hooks";
import UpdateBanner from "../../components/UpdateBanner/UpdateBanner";
import {loadMe} from "../../store/meSlice";
import {validateEmail} from "../../utils/validators";
import PillModal from "../../components/PillModal/PillModal";
import {useToast} from "../../components/Toast/ToastProvider";
import './Settings.css'
import {getUseMultiColumn, setUseMultiColumn} from "../../utils/SettingsStorage";
import PillForm from "../../components/PillForm/PillForm";
import PillInput from "../../components/PillInput/PillInput";
import PillButtons from "../../components/PillButtons/PillButtons";
import PillButton, {PillButtonVariant} from "../../components/PillButtons/PillButton";

type NotifyingActionToRssCode = {[action: string]: string}

interface RssToken {
  rss_token: string,
  rss_notifications_url: string,
  notifying_action_to_rss_code: NotifyingActionToRssCode
}

const Settings = () => {
  const me = useAppSelector(state => state.me.me)
  const meLoading = useAppSelector(state => state.me.loading)

  const [displayNameModalOpened, updateDisplayNameModalOpened] = useState(false)
  const [emailModalOpened, updateEmailModalOpened] = useState(false)
  const [avatarModalOpened, updateAvatarModalOpened] = useState(false)
  const [bannerModalOpened, updateBannerModalOpened] = useState(false)
  const [rssTokenModalOpened, updateRssTokenModalOpened] = useState(false)

  const [loading, updateLoading] = useState(true)
  const [displayName, updateDisplayName] = useState<string>('')
  const [email, updateEmail] = useState<string>('')
  const [emailValidated, updateEmailValidated] = useState(false)
  const [rssToken, updateRssToken] = useState<RssToken | undefined>()
  const [rssCodesChecked, updateRssCodesChecked] = useState<{[action: string]: boolean} | undefined>(undefined)
  const [multipleColumns, updateMultipleColumns] = useState(getUseMultiColumn)

  useEffect(() => {
    if (validateEmail(email)) {
      updateEmailValidated(true)
    } else {
      updateEmailValidated(false)
    }
  }, [email])

  useEffect(() => {
    (async () => {
      if (meLoading) {
        return
      }
      const myProfile = me as User
      updateDisplayName(myProfile.display_name || '')

      updateEmail(await api.getEmail())
      const rssToken = await api.getRssToken() as RssToken
      updateRssToken(rssToken)
      updateRssCodesChecked(
        Object.fromEntries(
          Object.entries(rssToken.notifying_action_to_rss_code).map(([a, _]) => {
            return [a, true]
          })
        )
      )
      updateLoading(false)
    })()
  }, [meLoading])

  const handleSignOut = () => {
    removeAccessToken()
    // This is needed so that the App component is fully reloaded
    // so that getting the first home page and auto refresh is disabled
    window.location.href = '/signin'
  }

  if (meLoading || loading) {
    return (
      <div className="settings-wrapper">
        <div className="settings-status">Loading...</div>
      </div>
    )
  }

  const dispatch = useAppDispatch()
  const { addToast } = useToast()

  let rssUrlTypes = ''
  if (rssToken && rssCodesChecked &&
    Object.entries(rssToken.notifying_action_to_rss_code).length
    !== Object.entries(rssCodesChecked).filter(([_, checked]) => checked).length
  ) {
    rssUrlTypes = '&types='
    for (let [a, checked] of Object.entries(rssCodesChecked)) {
      if (checked) {
        rssUrlTypes += rssToken.notifying_action_to_rss_code[a]
      }
    }
  }
  let rssUrl = ''
  if (rssToken) {
    rssUrl = rssToken.rss_notifications_url + rssUrlTypes
  }

  return (
    <div className="settings-wrapper">
      <div className="settings-row" onClick={() => {updateDisplayNameModalOpened(true)}}>
        <div className="settings-row-header">Display name</div>
        <div className="settings-row-content">{displayName || 'Click to update'}</div>
      </div>
      <div className="settings-row" onClick={() => {updateEmailModalOpened(true)}}>
        <div className="settings-row-header">Email</div>
        <div className="settings-row-content">{email || 'Click to update'}</div>
      </div>
      <div className="settings-row" onClick={() => {updateAvatarModalOpened(true)}}>
        <div className="settings-row-header"> Avatar</div>
        <div className="settings-row-content">Click to update</div>
      </div>
      <div className="settings-row" onClick={() => {updateBannerModalOpened(true)}}>
        <div className="settings-row-header">Banner</div>
        <div className="settings-row-content">Click to update</div>
      </div>
      <div className="settings-row" onClick={() => {updateRssTokenModalOpened(true)}}>
        <div className="settings-row-header">RSS Notifications</div>
        <div className="settings-row-content">{rssToken && rssToken.rss_token ? 'Enabled' : 'Disabled'}</div>
      </div>
      <div className="settings-row" onClick={() => {
        setUseMultiColumn(!multipleColumns)
        updateMultipleColumns(!multipleColumns)
      }}>
        <div className="settings-row-header">Multiple columns on home</div>
        <div className="settings-row-content">{`${multipleColumns ? "Enabled" : "Disabled"}. Click to ${multipleColumns ? 'disable' : 'enable'}.`}</div>
      </div>
      <div className="settings-row" onClick={handleSignOut}>
        <div className="settings-row-header">Sign out</div>
      </div>
      <About/>
      <PillModal
        isOpen={displayNameModalOpened}
        onClose={() => {updateDisplayNameModalOpened(false)}}
        title="Update display name"
      >
        <PillForm>
          <PillInput
            placeholder='Display name'
            value={displayName}
            onChange={updateDisplayName}
          />
          <PillButtons>
            <PillButton
              text='Cancel'
              variant={PillButtonVariant.Neutral}
              onClick={() => {updateDisplayNameModalOpened(false)}}
            />
            <PillButton
              text='Confirm'
              variant={PillButtonVariant.Positive}
              onClick={async () => {
                updateLoading(true)
                await api.updateDisplayName(displayName)
                await dispatch(loadMe())
                updateLoading(false)
                updateDisplayNameModalOpened(false)
              }}
            />
          </PillButtons>
        </PillForm>
      </PillModal>
      <PillModal
        isOpen={emailModalOpened}
        onClose={() => {updateEmailModalOpened(false)}}
        title="Update email"
      >
        <PillForm>
          <PillInput
            placeholder='Email'
            value={email}
            onChange={updateEmail}
          />
          <PillButtons>
            <PillButton
              text='Cancel'
              variant={PillButtonVariant.Neutral}
              onClick={() => {updateEmailModalOpened(false)}}
            />
            <PillButton
              text='Confirm'
              variant={PillButtonVariant.Positive}
              onClick={async () => {
                if (!validateEmail(email)) {
                  return
                }
                updateLoading(true)
                try {
                  await api.updateEmail(email)
                } catch (e: any) {
                  if (e.message) {
                    alert(e.message)
                  } else {
                    console.error(e)
                  }
                } finally {
                  await dispatch(loadMe())
                  updateLoading(false)
                  updateEmailModalOpened(false)
                }
              }}
              disabled={!emailValidated}
            />
          </PillButtons>
        </PillForm>
      </PillModal>
      <PillModal
        isOpen={avatarModalOpened}
        onClose={() => {updateAvatarModalOpened(false)}}
        title="Update avatar"
      >
        <UpdateAvatar
          dismiss={() => {
            updateAvatarModalOpened(false)
          }}
          beforeUpdate={() => {
            updateLoading(true)
          }}
          afterUpdate={() => {
            updateLoading(false)
            updateAvatarModalOpened(false)
          }}
        />
      </PillModal>
      <PillModal
        isOpen={bannerModalOpened}
        onClose={() => {updateBannerModalOpened(false)}}
        title="Update banner"
      >
        <UpdateBanner
          dismiss={() => {
            updateBannerModalOpened(false)
          }}
          beforeUpdate={() => {
            updateLoading(true)
          }}
          afterUpdate={() => {
            updateLoading(false)
            updateBannerModalOpened(false)
          }}
        />
      </PillModal>
      <PillModal
        isOpen={rssTokenModalOpened}
        onClose={() => {updateRssTokenModalOpened(false)}}
        title="RSS notification"
      >
        {
          rssToken && rssToken.rss_token ?
            <div>
              <p>Your RSS Notification URL is</p>
              <div className='settings-rss-url'>{rssUrl}</div>
              <p/>
              {
                rssCodesChecked &&
                <div className="settings-rss-code-checkboxes">
                  {
                    Object.entries(rssCodesChecked).map(([a, checked]) => {
                      return (
                        <>
                          <input
                            className="settings-rss-code-checkbox"
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (Object.entries(rssCodesChecked).filter(([_, checked]) => checked).length === 1 && (Object.entries(rssCodesChecked).filter(([_, checked]) => checked)[0][0] === a)) {
                                alert('You have to choose at least one type of notifications')
                              } else {
                                updateRssCodesChecked({
                                  ...rssCodesChecked,
                                  [a]: !checked
                                })
                              }
                            }}
                          />
                          <span className="settings-rss-code-checkbox-label">{a}</span>
                        </>
                      )
                    })
                  }
                </div>
              }
              <p/>
              <a href="#" onClick={async () => {
                await navigator.clipboard.writeText(rssUrl)
                addToast('Copied to clipboard')
              }}>Copy to clipboard</a>
              <p/>
              <p>You should <b>not</b> share this URL to anyone else. If you believe this URL is compromised, <a href="#" onClick={async () => {
                if (confirm('Are you sure you want to rotate RSS token?')) {
                  updateRssToken(await api.rotateRssToken())
                }
              }}>click here to rotate RSS token</a></p>
              <p/>
              <a href="#" onClick={async () => {
                if (confirm('Are you sure you want to disable RSS Notifications?')) {
                  await api.deleteRssToken()
                  updateRssToken(undefined)
                }
              }}>Click here to disable</a>
            </div> :
            <div>
              <p>RSS Notifications is disabled</p>
              <a href="#" onClick={async () => {
                updateRssToken(await api.rotateRssToken())
              }}>Click here to enable</a>
            </div>
        }
      </PillModal>
    </div>
  )

}

export default Settings
