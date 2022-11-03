import moment from 'moment'
import momentLocalizer from '../../src/localizers/moment'
//import { DateTime } from 'luxon'
//import luxonLocalizer from '../../src/localizers/luxon'
import { getSlotMetrics } from '../../src/utils/TimeSlots'
import * as dates from '../../src/utils/dates'

const localizer = momentLocalizer(moment)
//const localizer = luxonLocalizer(DateTime)

describe('closestSlotToPosition', () => {
  const min = dates.startOf(new Date(2018, 0, 29, 0, 0, 0), 'day')
  const max = dates.endOf(new Date(2018, 0, 29, 59, 59, 59), 'day')
  const slotMetrics = getSlotMetrics({
    min,
    max,
    step: 60,
    timeslots: 1,
    localizer,
  })
  test('always returns timeslot if valid percentage is given', () => {
    expect(slotMetrics.closestSlotToPosition(0)).toBeDefined()
    expect(slotMetrics.closestSlotToPosition(1)).toBeDefined()
    expect(slotMetrics.closestSlotToPosition(100)).toBeDefined()
    expect(slotMetrics.closestSlotToPosition(-100)).toBeDefined()
    expect(slotMetrics.closestSlotToPosition()).toBeUndefined()
    expect(slotMetrics.closestSlotToPosition('asd')).toBeUndefined()
  })

  test('returns last timeslot with correct time', () => {
    const secondLastSlot = slotMetrics.groups[slotMetrics.groups.length - 1][0]
    const shouldBeLast = slotMetrics.closestSlotToPosition(1)
    const diff = dates.diff(secondLastSlot, shouldBeLast, 'minutes')

    expect(diff).toBe(60)
  })
})

describe('getRange', () => {
  const min = dates.startOf(new Date(2018, 0, 29, 0, 0, 0), 'day')
  const max = dates.endOf(new Date(2018, 0, 29, 59, 59, 59), 'day')
  const slotMetrics = getSlotMetrics({
    min,
    max,
    step: 60,
    timeslots: 1,
    localizer,
  })

  test('getRange: 15 minute start of day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 0, 0, 0),
      new Date(2018, 0, 29, 0, 15, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: 1 hour start of day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 0, 0, 0),
      new Date(2018, 0, 29, 1, 0, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: 1 hour mid range appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 14, 0, 0),
      new Date(2018, 0, 29, 15, 0, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: 3 hour mid range appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 14, 0, 0),
      new Date(2018, 0, 29, 17, 0, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: full day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 0, 0, 0),
      new Date(2018, 0, 29, 23, 59, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: 1 hour end of day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 23, 0, 0),
      new Date(2018, 0, 29, 23, 59, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: 15 minute end of day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 23, 45, 0),
      new Date(2018, 0, 29, 23, 59, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })

  test('getRange: multi day appointment stays within calendar', () => {
    let range = slotMetrics.getRange(
      new Date(2018, 0, 29, 0, 0, 0),
      new Date(2018, 0, 30, 4, 0, 0)
    )
    expect(range.top + range.height).toBeLessThan(100)
    expect(range.height).toBeGreaterThan(0)
  })
})

describe('calculating groups and slots count', () => {
  describe('returns total groups and slots between 6:00 and 20:00', () => {
    const min = new Date(2021, 10, 5, 6, 0, 0)
    const max = new Date(2021, 10, 5, 20, 0, 0)

    test.each([
      [12, 5, 14, 168],
      [6, 10, 14, 84],
      [4, 15, 14, 56],
      [3, 20, 14, 42],
      [2, 30, 14, 28],
      [4, 20, 11, 44], // unusual non 1-hour long groups (80 minutes long)
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })

  describe('returns total groups and slots between 7:30 and 20:00', () => {
    const min = new Date(2021, 10, 5, 7, 30, 0)
    const max = new Date(2021, 10, 5, 20, 0, 0)

    test.each([
      [12, 5, 13, 156],
      [6, 10, 13, 78],
      [4, 15, 13, 52],
      [3, 20, 13, 39],
      [2, 30, 13, 26],
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })

  describe('returns total groups and slots between 7:40 and 20:00', () => {
    const min = new Date(2021, 10, 5, 7, 40, 0)
    const max = new Date(2021, 10, 5, 20, 0, 0)

    test.each([
      [12, 5, 13, 156],
      [6, 10, 13, 78],
      [4, 15, 13, 52],
      [3, 20, 13, 39],
      [2, 30, 13, 26],
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })

  describe('returns total groups and slots between 7:50 and 20:00', () => {
    const min = new Date(2021, 10, 5, 7, 50, 0)
    const max = new Date(2021, 10, 5, 20, 0, 0)

    test.each([
      [12, 5, 13, 156],
      [6, 10, 13, 78],
      [4, 15, 13, 52],
      [3, 20, 13, 39],
      [2, 30, 13, 26],
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })

  describe('returns total groups and slots between 7:00 and 20:30', () => {
    const min = new Date(2021, 10, 5, 7, 0, 0)
    const max = new Date(2021, 10, 5, 20, 30, 0)

    test.each([
      [12, 5, 14, 168],
      [6, 10, 14, 84],
      [4, 15, 14, 56],
      [3, 20, 14, 42],
      [2, 30, 14, 28],
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })

  describe('returns total groups and slots between 8:30 and 17:30', () => {
    const min = new Date(2021, 10, 5, 8, 30, 0)
    const max = new Date(2021, 10, 5, 17, 30, 0)

    test.each([
      [12, 5, 10, 120],
      [6, 10, 10, 60],
      [4, 15, 10, 40],
      [3, 20, 10, 30],
      [2, 30, 10, 20],
    ])(
      'with %i slots by %i minutes',
      (timeslots, step, expectedGroups, expectedSlots) => {
        const slotMetrics = getSlotMetrics({
          min,
          max,
          step,
          timeslots,
          localizer,
        })

        const groups = slotMetrics.groups
        expect(groups.length).toEqual(expectedGroups)

        const slots = groups.reduce((acc, slots) => {
          return acc.concat(slots)
        }, [])
        expect(slots.length).toEqual(expectedSlots)
      }
    )
  })
})
