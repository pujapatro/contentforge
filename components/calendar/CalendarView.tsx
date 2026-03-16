'use client'

import { useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DateClickArg, EventContentArg } from '@fullcalendar/core'
import { toast } from 'sonner'
import { PostChip } from './PostChip'
import { getPlatformBgColor } from '@/lib/utils'
import type { Post } from '@/types'

interface CalendarViewProps {
  posts: Post[]
  onPostClick: (post: Post) => void
  onDateClick: (date: string) => void
  onPostsUpdated: (updatedPost: Post) => void
  currentMonth: string
  onMonthChange: (month: string) => void
}

export function CalendarView({
  posts,
  onPostClick,
  onDateClick,
  onPostsUpdated,
  currentMonth,
  onMonthChange,
}: CalendarViewProps) {
  const calRef = useRef<FullCalendar>(null)

  const events = posts.map((post) => ({
    id: post.id,
    title: post.caption.slice(0, 30),
    start: new Date(post.scheduledDate).toISOString().slice(0, 10),
    backgroundColor: getPlatformBgColor(post.platform),
    borderColor: getPlatformBgColor(post.platform),
    textColor: '#ffffff',
    extendedProps: { post },
  }))

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const post = info.event.extendedProps.post as Post
      onPostClick(post)
    },
    [onPostClick]
  )

  const handleDateClick = useCallback(
    (info: DateClickArg) => {
      onDateClick(info.dateStr)
    },
    [onDateClick]
  )

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const post = info.event.extendedProps.post as Post
      const newDate = info.event.startStr

      try {
        const res = await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scheduledDate: newDate }),
        })
        if (!res.ok) throw new Error()
        const json = await res.json()
        onPostsUpdated(json.post)
        toast.success('Post rescheduled!')
      } catch {
        info.revert()
        toast.error('Failed to reschedule post')
      }
    },
    [onPostsUpdated]
  )

  const renderEventContent = useCallback((info: EventContentArg) => {
    const post = info.event.extendedProps.post as Post
    return <PostChip post={post} />
  }, [])

  const handleDatesSet = useCallback(
    (dateInfo: { start: Date }) => {
      const month = dateInfo.start.toISOString().slice(0, 7)
      onMonthChange(month)
    },
    [onMonthChange]
  )

  const initialDate = currentMonth + '-01'

  return (
    <div className="fc-contentforge">
      <style>{`
        .fc-contentforge .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 600;
        }
        .fc-contentforge .fc-button {
          background-color: transparent;
          border-color: hsl(var(--border));
          color: hsl(var(--foreground));
          font-size: 0.8rem;
          padding: 4px 10px;
          border-radius: 8px;
        }
        .fc-contentforge .fc-button:hover {
          background-color: hsl(var(--accent));
        }
        .fc-contentforge .fc-button-active,
        .fc-contentforge .fc-button-primary:not(:disabled):active {
          background-color: #d97706 !important;
          border-color: #d97706 !important;
        }
        .fc-contentforge .fc-daygrid-event {
          border-radius: 4px;
          padding: 0;
          margin: 1px 2px;
          font-size: 11px;
          cursor: pointer;
        }
        .fc-contentforge .fc-daygrid-day:hover {
          background-color: hsl(var(--accent));
          cursor: pointer;
        }
        .fc-contentforge .fc-day-today {
          background-color: rgba(217, 119, 6, 0.05) !important;
        }
        .fc-contentforge .fc-col-header-cell {
          padding: 8px 0;
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .fc-contentforge .fc-daygrid-day-number {
          font-size: 0.8rem;
          color: hsl(var(--muted-foreground));
          padding: 4px 6px;
        }
        .fc-contentforge .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: #d97706;
          font-weight: 700;
        }
        .fc-contentforge .fc-event-title {
          display: none;
        }
        .fc-contentforge .fc-event-main {
          padding: 0;
        }
      `}</style>
      <FullCalendar
        ref={calRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={initialDate}
        events={events}
        eventClick={handleEventClick}
        dateClick={handleDateClick}
        eventDrop={handleEventDrop}
        datesSet={handleDatesSet}
        editable={true}
        droppable={true}
        eventContent={renderEventContent}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        height="auto"
        dayMaxEvents={4}
        moreLinkText={(n) => `+${n} more`}
      />
    </div>
  )
}
