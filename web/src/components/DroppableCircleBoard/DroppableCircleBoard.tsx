import React, {useState} from 'react'
import api from '../../api/Api'
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import getAvatarUrl from "../../utils/getAvatarUrl";
import {useMediaQuery} from 'react-responsive'
import {useHotkeys} from "react-hotkeys-hook";
import {PencilAltIcon} from "@heroicons/react/solid";
import Circle from "../../models/Circle";
import User from "../../models/User";
import ApiError from "../../api/ApiError";
import {useToast} from "../Toast/ToastProvider";
import "./DroppableCircleBoard.css"
import PillModal from "../PillModal/PillModal";

interface Props {
  circle: Circle
}

export default (props: Props) => {
  const {circle} = props

  const isTabletOrMobile = useMediaQuery({query: '(max-width: 750px)'})
  const circleMargin = 2 // Margin between the edge of the card circle and inner/outer circles
  const outerDiameter = isTabletOrMobile ? 150 : 250; // Need to be equal to width and height in .droppable-board-wrapper
  const innerCirclePercentage = 0.7; // Update all numbers in Animation section
  const outerRadius = outerDiameter / 2;
  const innerRadius = outerDiameter * innerCirclePercentage / 2;
  const cardRadius = (outerRadius - innerRadius) / 2;
  const anglePerCardAsDegree = Math.asin((cardRadius / 2) / (cardRadius + innerRadius)) * 4 * (180 / 3.14)
  const cardNumber = Math.floor(360 / anglePerCardAsDegree);
  const finalAnglePerCardAsDegree = 360 / cardNumber

  const [circleName, updateCircleName] = useState(circle.name)
  const [renamingCircle, updateRenamingCircle] = useState(false)
  const [renameCircleLoading, updateRenameCircleLoading] = useState(false)
  const [members, updateMembers] = useState<User[]>(circle.members)
  const [modalOpened, updateModalOpened] = useState(false)
  const [deleteCircleClicked, updateDeleteCircleClicked] = useState(false)

  const {addToast} = useToast()

  let animationIntervalId: any = null;
  const circleAnimation = (circleId: string, user: User) => {
    const avatar: any = document.getElementById(`${circleId}-temp-card-avatar`)
    avatar.src = user.avatar_url

    let elem: any = document.getElementById(`${circleId}-temp-card`);
    let degree = 1;
    let stepCount = 0;
    let finalDegree = 360 - finalAnglePerCardAsDegree * (members.length + 1)
    clearInterval(animationIntervalId);
    animationIntervalId = setInterval(frame, 10);

    function frame() {
      if (degree >= finalDegree || members.length >= cardNumber) {
        elem.style.visibility = "hidden"
        updateMembers([...members, user])
        clearInterval(animationIntervalId);
      } else {
        elem.style.visibility = "visible"
        degree = finalDegree * easeInOutCubic(stepCount)
        stepCount += 0.02;
        const top = Math.abs((innerRadius + cardRadius) * Math.cos(degree * 3.14 / 180) - outerRadius + cardRadius)
        const left = Math.abs((innerRadius + cardRadius) * Math.sin(degree * 3.14 / 180) - outerRadius + cardRadius)
        elem.style.top = top + 'px';
        elem.style.left = left + 'px';
      }
    }

    function easeInOutCubic(x: number) {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }
  }
  const innerCircleScale = (scaleUp: boolean, delay: number) => {
    const options = {
      fill: 'both',
      easing: "cubic-bezier(0.42, 0, 0.58, 1)",
      duration: 400,
      delay: delay
    }

    if (scaleUp) {
      (document.getElementById(`${circle.id}-inner-circle`) as any).animate(
        [
          {transform: `scale(${innerCirclePercentage})`},
          {transform: 'scale(1)'},
        ], options);
    } else {
      (document.getElementById(`${circle.id}-inner-circle`) as any).animate(
        [
          {transform: 'scale(1)'},
          {transform: `scale(${innerCirclePercentage})`},
        ], options);
    }
  }
  const tempCard = (circleId: string) => {
    const currentCardAngleAsDegree = 0
    const top = Math.abs((innerRadius + cardRadius) * Math.cos(currentCardAngleAsDegree * 3.14 / 180) - outerRadius + cardRadius)
    const left = Math.abs((innerRadius + cardRadius) * Math.sin(currentCardAngleAsDegree * 3.14 / 180) - outerRadius + cardRadius)
    return (
      <div
        key="temp-card"
        id={`${circleId}-temp-card`}
        className="droppable-board-member-card-wrapper temp-card"
        style={{
          top: `${top + circleMargin}px`,
          left: `${left + circleMargin}px`,
          width: `${cardRadius * 2 - circleMargin * 2}px`,
          height: `${cardRadius * 2 - circleMargin * 2}px`,
          visibility: "hidden",
        }}>
        <img
          id={`${circleId}-temp-card-avatar`}
          className="droppable-board-member-card-avatar-img"
          alt=""
        />
      </div>
    )
  }
  const circleColor = (circleId: string) => {
    const colorMap = [
      "rgb(133, 173, 255)", "rgb(255,133,133)", "rgb(190,133,255)", "rgb(255,186,133)",
      "rgb(255,227,97)", "rgb(133,201,188)", "rgb(158,238,158)", "rgb(77,170,255)",
    ] // Color for all inner circles
    const colorCount = colorMap.length
    let hashValue = 0
    for (let i = 0; i < circleId.length; i++) hashValue += circleId.charCodeAt(i);

    return colorMap[hashValue % colorCount]
  }
  const onDrop = async (e: any) => {
    e.preventDefault();
    const user = JSON.parse(e.dataTransfer.getData("user")) as User
    try {
      await api.addToCircle(circle.id, user.id)
      innerCircleScale(false, 0)
      circleAnimation(circle.id, user)
      innerCircleScale(true, 900)
    } catch (e: any) {
      if (e instanceof ApiError) {
        addToast(e.message)
      } else {
        addToast('Unknown error')
      }
    }
  }

  // can't be controlled by using css property :hover
  const onMouseEnter = (e: any) => {
    e.preventDefault();
    innerCircleScale(false, 0)
  }

  const onMouseLeave = (e: any) => {
    e.preventDefault();
    innerCircleScale(true, 0)
  }

  const onDragOver = (e: any) => {
    e.preventDefault();
  }

  const onDragLeave = (e: any) => {
    e.preventDefault();
  }

  const onClick = async () => {
    updateModalOpened(true)
  }

  const memberCards = () => {
    let memberCardElements = []
    for (let i = 0; i < members.length && i < cardNumber; i++) {
      const member = members[i]
      const currentCardAngleAsDegree = -(i + 1) * finalAnglePerCardAsDegree
      const top = Math.abs((innerRadius + cardRadius) * Math.cos(currentCardAngleAsDegree * 3.14 / 180) - outerRadius + cardRadius)
      const left = Math.abs((innerRadius + cardRadius) * Math.sin(currentCardAngleAsDegree * 3.14 / 180) - outerRadius + cardRadius)
      memberCardElements.push(
        <div
          key={i}
          className="droppable-board-member-card-wrapper"
          style={{
            top: `${top + circleMargin}px`,
            left: `${left + circleMargin}px`,
            width: `${cardRadius * 2 - circleMargin * 2}px`,
            height: `${cardRadius * 2 - circleMargin * 2}px`,
          }}>
          <img
            className="droppable-board-member-card-avatar-img"
            src={getAvatarUrl(member)}
            alt=""
          />
        </div>)
    }
    return memberCardElements
  }
  const memberModalCards = () => {
    let memberModalCardElements = []
    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      memberModalCardElements.push(
        <UserProfileCard
          key={i}
          user={member}
          circleId={circle.id}
        />)
    }
    return memberModalCardElements
  }

  // Close the modal when user clicks outside it
  window.onclick = function (event) {
    let modal = document.getElementById("droppable-board-modal-wrapper");
    if (event.target === modal) {
      // reload the page in case user removed people from their circle
      window.location.reload()
    }
  }

  const deleteCircleButtonOnClick = async () => {
    if (!deleteCircleClicked) {
      // ask user to confirm
      updateDeleteCircleClicked(true)
    } else {
      // actually delete the circle
      await api.deleteCircle(circle.id)
      window.location.reload()
    }
  }

  const renameCircle = async () => {
    updateRenamingCircle(false)
    updateRenameCircleLoading(true)
    await api.renameCircle(circle.id, circleName)
    updateCircleName(circleName)
    updateRenameCircleLoading(false)
  }

  useHotkeys('enter', () => {
    (async () => {
      if (renamingCircle) {
        await renameCircle()
      }
    })()
  }, {
    enableOnTags: ['INPUT']
  })

  const onCircleEditingDone = async () => {
    if (renamingCircle) {
      await renameCircle()
    }
    window.location.reload()
  }

  const onCircleRenameClick = () => {
    if (renameCircleLoading) {
      return
    }
    updateRenamingCircle(true)
  }

  return (
    <div className="droppable-board-wrapper">
      <PillModal
        isOpen={modalOpened}
        onClose={() => {updateModalOpened(false)}}
      >
        <div className="droppable-board-modal-content">
          {!renamingCircle ?
            <div className="droppable-board-modal-circle" onClick={onCircleRenameClick}>
              <div className="droppable-board-modal-circle-name">{circleName}</div>
              <div className="droppable-board-modal-circle-rename-icon">
                <PencilAltIcon/>
              </div>
            </div>
            :
            <input
              className="droppable-board-modal-circle-name droppable-board-modal-circle-rename"
              type="text"
              value={circleName}
              onChange={e => updateCircleName(e.target.value)}
            />
          }
          <div className="droppable-board-modal-circle-members">
            {memberModalCards()}
          </div>
          <div className="droppable-board-modal-buttons">
            <div className="droppable-board-modal-button-delete" onClick={deleteCircleButtonOnClick}>
              {deleteCircleClicked ? "Confirm Delete Circle" : "Delete Circle"}
            </div>
            <div className="droppable-board-modal-button-done" onClick={onCircleEditingDone}>
              Done
            </div>
          </div>
        </div>
      </PillModal>
      <div
        className="droppable-board"
        id={circle.id}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        <div className="droppable-board-member-cards-wrapper">
          {tempCard(circle.id)}
          {memberCards()}
        </div>
        <div className="droppable-board-inner-circle"
             id={`${circle.id}-inner-circle`}
             style={{backgroundColor: circleColor(circle.id)}}>
          <div className="droppable-board-inner-circle-name">
            {circleName}
          </div>
          <div className="droppable-board-inner-circle-follow-number">
            {members.length}
          </div>
        </div>
      </div>
    </div>
  )
}
