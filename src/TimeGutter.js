import clsx from 'clsx'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import * as TimeSlotUtils from './utils/TimeSlots'
import TimeSlotGroup from './TimeSlotGroup'

/**
 * Since the TimeGutter only displays the 'times' of slots in a day, and is separate
 * from the Day Columns themselves, we check to see if the range contains an offset difference
 * and, if so, change the beginning and end 'date' by a day to properly display the slots times
 * used.
 */
function adjustForDST({ min, max, localizer }) {
  if (localizer.getTimezoneOffset(min) !== localizer.getTimezoneOffset(max)) {
    return {
      start: localizer.add(min, -1, 'day'),
      end: localizer.add(max, -1, 'day'),
    }
  }
  return { start: min, end: max }
}

export default class TimeGutter extends Component {
  constructor(...args) {
    super(...args)

    const { min, max, timeslots, step, localizer } = this.props
    const { start, end } = adjustForDST({ min, max, localizer })
    this.slotMetrics = TimeSlotUtils.getSlotMetrics({
      min: start,
      max: end,
      timeslots,
      step,
      localizer,
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { min, max, localizer } = nextProps
    const { start, end } = adjustForDST({ min, max, localizer })
    this.slotMetrics = this.slotMetrics.update({
      ...nextProps,
      min: start,
      max: end,
    })
  }

  renderSlot = (value, idx) => {
    const { localizer, getNow, min, max } = this.props

    // Don't show first time in group if it's less than min time
    if (idx === 0 && value.getTime() < min.getTime()) return null

    const isNow = this.slotMetrics.dateIsInGroup(getNow(), idx)

    if (idx !== 0) {
      // Show either min or max times for non hour-long period
      if ([min.getTime(), max.getTime()].includes(value.getTime())) {
        return (
          <span className={clsx('rbc-label', isNow && 'rbc-now')}>
            {localizer.format(value, 'nonFullHourTimeGutterFormat')}
          </span>
        )
      } else {
        return null
      }
    }

    return (
      <span className={clsx('rbc-label', isNow && 'rbc-now')}>
        {localizer.format(value, 'timeGutterFormat')}
      </span>
    )
  }

  render() {
    const { resource, components, getters } = this.props

    return (
      <div className="rbc-time-gutter rbc-time-column">
        {this.slotMetrics.groups.map((grp, idx) => {
          return (
            <TimeSlotGroup
              key={idx}
              group={grp}
              resource={resource}
              components={components}
              renderSlot={this.renderSlot}
              getters={getters}
            />
          )
        })}
      </div>
    )
  }
}

TimeGutter.propTypes = {
  min: PropTypes.instanceOf(Date).isRequired,
  max: PropTypes.instanceOf(Date).isRequired,
  timeslots: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired,
  getNow: PropTypes.func.isRequired,
  components: PropTypes.object.isRequired,
  getters: PropTypes.object,

  localizer: PropTypes.object.isRequired,
  resource: PropTypes.string,
}
