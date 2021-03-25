import React, { useState } from 'react'
import './Kalender.css'

import FullCalendar, {
    EventClickArg,
    EventSourceInput,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, {
    DateClickArg,
    DropArg,
} from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'

import localeDe from '@fullcalendar/core/locales/de'
import { useSelector } from 'react-redux'
import {
    AvatarDropArg,
    FuncWrapper,
    FuncWrapperTwoArgs,
    Termin,
} from '../model/model'
import { selectTermineEnriched } from '../state/selectors'

import store from '../index'
import { addError } from '../state/actions'
import UserChooser from './UserChooser'
import { createNewTermin, deleteTermin, markTermin } from '../state/effects'
import ConfirmationDialog from './ConfirmationDialog'
import {
    calculateBackgroundColor,
    terminDefaultColor,
} from '../utils/date-utils'
import { isPseudoRegex } from '../utils/id-utils'

const Kalender: React.FC = () => {
    const [pendingDate, setDate] = useState<Date | null>(null)
    const termineOverlapCheck: Termin[] | undefined = useSelector(
        selectTermineEnriched
    )

    const [terminToDelete, setTerminToDelete] = useState<string | null>(null)

    const termine: EventSourceInput | undefined = useSelector(
        selectTermineEnriched
    )?.map((termin: Termin) => {
        const color: string | undefined = calculateBackgroundColor(
            termin.marked,
            termin.id
        )
        const titleExtension = termin.marked
            ? '\nlöschen'
            : isPseudoRegex(termin.id)
            ? '\nprovisorisch\nerfasst'
            : ''
        const title: string = termin.mieterName + titleExtension
        return {
            title,
            start: termin.terminBeginn,
            end: termin.terminEnde,
            extendedProps: { id: termin.id, marked: termin.marked },
            backgroundColor: color,
            borderColor: color,
        }
    })

    const handleDateClick = (dateClickArg: DateClickArg) => {
        const newTerminStart = new Date(dateClickArg.date)
        const isBooked = checkIfDayIsBooked(newTerminStart)

        if (isBooked) {
            store.dispatch(addError('Dieser Waschtag ist bereits gebucht'))
        } else {
            setDate(() => dateClickArg.date)
        }
    }

    const createTermin = (parteiId: string | null) => {
        if (pendingDate && parteiId) {
            store.dispatch(createNewTermin(parteiId, pendingDate))
        }
        setDate(() => null)
    }

    const handleClick = (arg: EventClickArg) => {
        const terminId: string = arg.event._def.extendedProps.id
        const marked: boolean = arg.event._def.extendedProps.marked
        if (marked) {
            setTerminToDelete(terminId)
        } else {
            store.dispatch(markTermin(terminId))
        }
    }
    const confirmDeletion: FuncWrapperTwoArgs<boolean, string, void> = (
        agree: boolean,
        terminId: string
    ) => {
        if (agree) {
            store.dispatch(deleteTermin(terminId))
        } else {
            store.dispatch(markTermin(terminId))
        }
        setTerminToDelete(null)
    }

    const handleDrop = (dropArg: AvatarDropArg) => {
        dropArg.jsEvent.preventDefault()

        const newTerminStart = new Date(dropArg.date)
        const isBooked = checkIfDayIsBooked(newTerminStart)

        if (isBooked) {
            store.dispatch(
                addError(
                    'Der neue Termin wurde nicht gespeichert da er sich mit einem bestehenden Waschtermin überschneidet'
                )
            )
        } else {
            const mieterId = dropArg.draggedEl.attributes.itemprop.value
            store.dispatch(createNewTermin(mieterId, dropArg.date))
        }
    }

    const checkIfDayIsBooked: FuncWrapper<Date, boolean> = (
        newTerminStart: Date
    ) => {
        let overlaps = false
        termineOverlapCheck?.forEach((termin: Termin) => {
            const currentTerminStart = new Date(termin.terminBeginn)
            const currentTerminEnde = new Date(termin.terminEnde)
            if (
                newTerminStart >= currentTerminStart &&
                newTerminStart <= currentTerminEnde
            ) {
                overlaps = true
            }
        })
        return overlaps
    }

    return (
        <div className={'calendarWrapper'}>
            <FullCalendar
                eventBackgroundColor={terminDefaultColor}
                eventBorderColor={terminDefaultColor}
                plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
                initialView="timeGridWeek"
                hiddenDays={[0]}
                allDaySlot={false}
                displayEventTime={false}
                locale={localeDe}
                themeSystem={'standart'}
                droppable={true}
                weekends={true}
                slotMinTime={'07:00:00'}
                slotMaxTime={'22:00:00'}
                events={termine}
                eventOverlap={false}
                editable={false}
                dateClick={handleDateClick}
                eventClick={handleClick}
                drop={(dropArg: DropArg) =>
                    handleDrop(dropArg as AvatarDropArg)
                }
            >
                loading...
            </FullCalendar>
            <UserChooser
                open={pendingDate !== null}
                userChanged={createTermin}
            />
            <ConfirmationDialog
                terminId={terminToDelete}
                confirm={confirmDeletion}
            />
        </div>
    )
}

export default Kalender
