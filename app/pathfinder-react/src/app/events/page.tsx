"use client"

import Link from 'next/link';
import * as React from 'react';
import { useAppContext } from '@/utils/AppContext';

export default function EventsPage() {
  const { events } = useAppContext();

  // Sort events by title
  const sortedEvents = [...events].sort((a, b) => {
    return a.title.localeCompare(b.title);
  });

  // Grouping by a generic "All Events" key as date/time is not used for grouping
  // const groupEventsByDay = (eventList: Event[]) => { commented out for eslint
  //   const grouped: { [key: string]: Event[] } = { "All Events": [] };
  //   eventList.forEach(event => {
  //     grouped["All Events"].push(event);
  //   });
  //   return grouped;
  // };

  return (
    <main className="flex-grow px-4 py-8 mx-auto w-full max-w-none sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">Events</h1>
        <p className="mt-2 text-lg text-base-content/80">
          Explore scheduled events and activities.
        </p>
      </div>

      {events.length === 0 ? (
        <div className="alert">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="w-6 h-6 stroke-info shrink-0"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span>No events scheduled. Check back later!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedEvents.map(event => {
            return (
              <div key={event.id} className="shadow-lg transition-shadow card bg-base-100 hover:shadow-xl">
                <div className="card-body">
                  <div className="mb-2">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <p className="mt-1 text-sm text-base-content/80">{event.description}</p>
                  </div>
                  <div className="flex flex-col mt-2 space-y-1 text-sm">
                    <div className="flex gap-2 items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{event.locationName} (Level {event.location.level})</span>
                    </div>
                  </div>
                  <div className="justify-end mt-4 card-actions">
                    <Link 
                      href={`/?eventId=${event.id}&floor=${event.location.level}`}
                      className="btn btn-sm btn-primary"
                    >
                      View on Map
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
} 