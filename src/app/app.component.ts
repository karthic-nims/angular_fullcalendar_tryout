import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventApi, EventContentArg, EventDropArg, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg, Draggable, EventDragStartArg, EventDragStopArg, EventReceiveArg } from '@fullcalendar/interaction';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { Modal } from 'bootstrap';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown'

interface WorkOrder {
  name: string;
  code: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    FullCalendarModule,
    CalendarModule,
    FormsModule,
    DropdownModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('calendar') calendarComponent: any
  @ViewChild('primeCalendar') primeCalendar: any;
  @ViewChild('calendarToolbarButtonContainer') calendarToolbarButtonContainer: any;
  
  title = 'ng-call-tryout'

  selectedDate = new Date()

  selectedWorkOrderType: string = 'A'

  workOrderTypes: WorkOrder[] = []

  workOrders: string[] = []

  assignedWO: string[] = [
    'Assigned-1',
    'Assigned-2'
  ]

  unassignedWO: string[] = [
    'Unassigned-1',
    'Unassigned-2'
  ]

  modalRef: any

  disabledTimeslots = [
    { start: '2024-07-31T09:00:00', end: '2024-07-31T12:00:00' },
    { start: '2024-09-10T14:00:00', end: '2024-09-10T16:00:00' }
  ]
  
  calendarOptions: CalendarOptions = {
    plugins: [
      dayGridPlugin,
      interactionPlugin,
      resourceTimelinePlugin
    ],
    views: {
      sevenDaysTimeline: {
        type: 'resourceTimeline',
        duration: { days: 7 },
        buttonText: '7 Days'
      }
    },
    customButtons: {
      datePickerButton: {
        click: this.openDatePicker.bind(this)
      },
      dayShiftButton: {
        text: 'Day Shift'
      },
      fullShiftButton: {
        text: 'Full Shift'
      },
      toggleButton: {
        text: 'Toggle'
      }
    },
    buttonIcons: {
      datePickerButton: 'bi bi-calendar-date'
    },
    headerToolbar: {
      start: 'dayShiftButton fullShiftButton toggleButton', // will normally be on the left. if RTL, will be on the right
      center: 'today prev title next datePickerButton',
      end: 'resourceTimelineDay resourceTimelineWeek sevenDaysTimeline' // will normally be on the right. if RTL, will be on the left
    },
    slotMinTime: '09:00:00',
    slotMaxTime: '17:00:00',
    dateClick: this.handleDateClick,
    initialView: 'resourceTimelineDay',
    events: this.getDisabledTimeslotEvents(),
    schedulerLicenseKey: '0892857890-fcs-1513684869',
    resourceGroupField: 'resourceType',
    resources: [
      { id: 'a', title: 'Resource A', resourceType: 'Technicians', extendedProps: { isAvailable: true} },
        { id: 'b', title: 'Resource B', resourceType: 'Technicians', extendedProps: { isAvailable: false} },
        { id: 'c', title: 'Resource CD', resourceType: 'Plumbers', extendedProps: { isAvailable: true} }
    ],
    nowIndicator: true,
    editable: true,
    droppable: true,
    eventDrop: this.handleEventDrop.bind(this),
    eventReceive: this.handleEventReceive.bind(this),
    resourceAreaHeaderContent: this.renderResourceHeaderContent.bind(this),
    eventContent: this.renderEventContent.bind(this),
    eventDidMount: this.styleDisabledTimeslotEvent.bind(this),
    resourceLabelContent: this.customContentResourceLabel.bind(this),
    eventDragStart: this.handleEventDragStart.bind(this),
    eventDragStop: this.handleEventDragStop.bind(this)
  }

  ngOnInit() {
    this.workOrderTypes = [{
      name: 'Assigned',
      code: 'A'
    }, {
      name: 'Unassigned',
      code: 'U'
    }]
    this.workOrders = this.assignedWO
  }

  ngAfterViewInit(): void {
    let draggableEl = <HTMLElement>document.querySelector('#external-events')
    new Draggable(draggableEl, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        return {
          title: eventEl.innerText.trim()
        }
      }
    })
    document.querySelectorAll('.fc-event').forEach((evtEl: Element) => {
      evtEl.addEventListener('dragstart', () => {
        this.updateResourceLabels(true)
      })
      evtEl.addEventListener('dragstop', () => {
        console.log('stop')
      })
    })
  }

  handleDateClick(evnt: DateClickArg) {
    console.log(evnt)
  }

  handleEventDrop(info: EventDropArg) {
    const currentTime = new Date().getTime();
    const eventStartTime = info.event.start?.getTime() || 0;
    console.log(eventStartTime, currentTime)
    if (eventStartTime < currentTime) {
      alert('Past time slots are not allowed');
      info.event.remove();
    }
  }

  handleEventReceive(info: EventReceiveArg) {
    console.log('Event received', info.event)
    const currentTime = new Date().getTime();
    const eventStartTime = info.event.start?.getTime() || 0;
    console.log(eventStartTime, currentTime)
    if (eventStartTime < currentTime) {
      alert('Past time slots are not allowed');
      info.event.remove();
    }
  }

  renderEventContent(info: EventContentArg) {
    const isDisabled = !!info.event.extendedProps['disabled']
    const containerEl = document.createElement('div')
    containerEl.setAttribute('class', 'd-flex justify-content-start gap-2')
    var eventHtml = `
        <button id="event-icon">icon</button>
        <span class="d-flex align-items-center">${info.event.title}</span>
    `
    containerEl.innerHTML = eventHtml
    if (isDisabled) {
      containerEl.innerHTML = ''
    } else {
      containerEl.querySelector('#event-icon')?.addEventListener('click', () => this.openModal(info.event))
    }
    return { domNodes: [containerEl] }
  }

  renderResourceHeaderContent() {
    return { html: '<i class="bi bi-people-fill"></i><b>Custom Resource Header</b>' }
  }

  openModal(event: EventApi) {
    const modalTitle = <HTMLElement>document.getElementById('modalEventTitle');
    const modalTime = <HTMLElement>document.getElementById('modalEventTime');
    const modalDescription = <HTMLElement>document.getElementById('modalEventDescription');

    modalTitle.innerText = 'Event: ' + event.title;
    modalTime.innerText = 'Time: ' + event.start?.toLocaleString() + ' - ' + event.end?.toLocaleString();
    modalDescription.innerHTML = 'Description: This is a custom description for ' + event.title
    const modalElem = <HTMLElement>document.querySelector('#eventModal')
    const modal = new Modal(modalElem)
    modal.show()
  }

  getDisabledTimeslotEvents() {
    return [
      {
        start: '2024-08-08T09:00:00',
        end: '2024-08-08T11:00:00',
        resourceId: 'a',
        display: 'background',
        rendering: 'background',
        color: '#ff9f89',
        extendedProps: {
          disabled: true
        }
      },
      {
        start: '2024-08-08T08:00:00',
        end: '2024-08-08T10:00:00',
        resourceId: 'b',
        display: 'background',
        rendering: 'background',
        color: '#ff9f89',
        extendedProps: {
          disabled: true
        }
      },
      {
        start: '2024-08-08T11:00:00',
        end: '2024-08-08T12:00:00',
        resourceId: 'c',
        display: 'background',
        rendering: 'background',
        color: '#ff9f89',
        extendedProps: {
          disabled: true
        }
      },
      {
        start: '2024-08-15T11:00:00',
        end: '2024-08-15T12:00:00',
        resourceId: 'c',
        display: 'background',
        rendering: 'background',
        color: '#ff9f89',
        extendedProps: {
          disabled: true
        }
      }
    ]
  }

  styleDisabledTimeslotEvent(info: EventMountArg) {
    if (info.event.display === 'background') {
      info.el.style.pointerEvents = 'none'; // Disable pointer events to prevent clicks
    }
  }

  customContentResourceLabel(arg: any) {
    return {
      html: `${arg.resource.title}`
    }
  }

  handleEventDragStart(evnt: EventDragStartArg) {
    this.updateResourceLabels(true)
  }

  handleEventDragStop(evnt: EventDragStopArg) {
    this.updateResourceLabels(false)
  }

  updateResourceLabels(isDragging: boolean) {
    const resources = this.calendarComponent.getApi().getResources()
    resources.forEach((resource: any) => {
      const resourceTitle = resource.title;
      const isAvailable = resource.extendedProps.isAvailable
      const cirlceIndicator = `
        <div class="moving-circle-container">
          <div class="moving-circle">
          </div>
        </div>
      `
      const availableIndicator = (isAvailable && isDragging) ? cirlceIndicator : ''
      const resourceHtml = `
        <div class="d-flex gap-2">
          <div class="d-flex">
            ${resourceTitle}
          </div>
          ${availableIndicator}
        </div>
      `
      resource.setProp('title', resourceHtml)
    })
  }

  openDatePicker() {
    const modalElem = <HTMLElement>document.querySelector('#datepickerModal')
    this.modalRef = new Modal(modalElem)
    this.modalRef.show()
  }

  onDateSelect(e: any) {
    console.log(e);
    this.modalRef.hide()
    this.calendarComponent.getApi().gotoDate(this.selectedDate)
  }

  handleWorkOrderTypeChange(e: any) {
    const selectedWorkOrderType = e.value.name;
    if (selectedWorkOrderType === 'Assigned') {
      this.workOrders = this.assignedWO
    } else {
      this.workOrders = this.unassignedWO
    }
  }
}
