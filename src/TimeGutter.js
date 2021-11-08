import clsx from 'clsx'
import PropTypes from 'prop-types'
import React, { Component } from 'react'

import * as TimeSlotUtils from './utils/TimeSlots'
import TimeSlotGroup from './TimeSlotGroup'

export default class TimeGutter extends Component {
  constructor(...args) {
    super(...args)

    const { min, max, timeslots, step, localizer } = this.props
    this.slotMetrics = TimeSlotUtils.getSlotMetrics({
      min,
      max,
      timeslots,
      step,
      localizer,
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.slotMetrics = this.slotMetrics.update(nextProps)
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
