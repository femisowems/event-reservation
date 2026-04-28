import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type SyncState = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'ERROR';
export type ConfirmationState = 'CONFIRMED' | 'PENDING' | 'FAILED';

export interface Event {
    id: string;
    name: string;
    venue: string;
}

export interface ReservationViewModel {
    id: string;
    user_id: string;
    event_id: string;
    start_time: string;
    end_time: string;
    status: string;
    confirmationState: ConfirmationState;
    confirmedAt?: Date;
    confirmationRef?: string;
    hasConflict?: boolean;
    conflictingIds?: string[];
    version?: number;
    created_at?: string;
    updated_at?: string;
}

interface PendingAction {
    type: 'CANCEL' | 'RESCHEDULE' | 'CHECKIN';
    reservationId: string;
    data?: any;
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class ScheduleService {
    private reservations$ = new BehaviorSubject<ReservationViewModel[]>([]);
    private events$ = new BehaviorSubject<Event[]>([]);
    private syncState$ = new BehaviorSubject<SyncState>('SYNCED');
    private lastSyncTime$ = new BehaviorSubject<Date | null>(null);
    private pendingActions: PendingAction[] = [];
    private apiBaseUrl = environment.apiUrl;

    constructor() {
        this.checkOnlineStatus();
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    getReservations(): Observable<ReservationViewModel[]> {
        return this.reservations$.asObservable();
    }

    getEvents(): Observable<Event[]> {
        return this.events$.asObservable();
    }

    async refreshEvents(): Promise<void> {
        try {
            const response = await fetch(`${this.apiBaseUrl}/events`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            this.events$.next(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            // Fallback for demo if API fails
            this.events$.next([
                { id: 'event-1', name: 'Late Night Comedy (Offline)', venue: 'The Basement Club' },
                { id: 'event-2', name: 'Jazz Quartet (Offline)', venue: 'Blue Note Lounge' },
                { id: 'event-3', name: 'Indie Film Festival (Offline)', venue: 'Cinema 4' },
                { id: 'event-4', name: 'Tech Conference 2026 (Offline)', venue: 'Convention Center' },
                { id: 'event-5', name: 'Live Podcast Recording (Offline)', venue: 'Studio A' },
                { id: 'event-6', name: 'Charity Gala (Offline)', venue: 'Grand Ballroom' }
            ]);
        }
    }

    getSyncState(): Observable<SyncState> {
        return this.syncState$.asObservable();
    }

    getLastSyncTime(): Observable<Date | null> {
        return this.lastSyncTime$.asObservable();
    }

    async refresh(eventId: string, startDate: Date, endDate: Date): Promise<void> {
        this.syncState$.next('SYNCING');

        try {
            const params = new URLSearchParams({
                event_id: eventId,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString()
            });

            const response = await fetch(`${this.apiBaseUrl}/reservations?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const reservations = (data || []).map((res: any) => this.mapToViewModel(res));

            this.reservations$.next(reservations);
            this.lastSyncTime$.next(new Date());
            this.syncState$.next('SYNCED');
        } catch (error) {
            console.error('Failed to refresh reservations:', error);
            this.syncState$.next('ERROR');
            throw error;
        }
    }

    async cancelReservation(id: string): Promise<void> {
        const traceId = crypto.randomUUID();

        // Optimistic update
        const current = this.reservations$.value;
        const targetIndex = current.findIndex(a => a.id === id);

        if (targetIndex === -1) return;

        const original = { ...current[targetIndex] };
        const updated = [...current];
        updated[targetIndex] = { ...original, status: 'CANCELLING' };
        this.reservations$.next(updated);

        try {
            const response = await fetch(`${this.apiBaseUrl}/reservations/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': traceId
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to cancel: ${response.status}`);
            }

            // Remove the reservation on success
            this.reservations$.next(current.filter(a => a.id !== id));
        } catch (error) {
            console.error(`[TRACE: ${traceId}] Cancel failed:`, error);

            // Rollback on failure
            this.reservations$.next(current);

            // Queue for retry if offline
            if (!navigator.onLine) {
                this.queueAction({ type: 'CANCEL', reservationId: id, timestamp: new Date() });
            }

            throw error;
        }
    }

    async rescheduleReservation(id: string, newStartTime: Date, newEndTime: Date): Promise<void> {
        const current = this.reservations$.value;
        const targetIndex = current.findIndex(a => a.id === id);

        if (targetIndex === -1) return;

        const original = { ...current[targetIndex] };

        // Optimistic update
        const updated = [...current];
        updated[targetIndex] = {
            ...original,
            start_time: newStartTime.toISOString(),
            end_time: newEndTime.toISOString(),
            status: 'RESCHEDULING'
        };
        this.reservations$.next(updated);

        try {
            const response = await fetch(`${this.apiBaseUrl}/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_time: newStartTime.toISOString(),
                    end_time: newEndTime.toISOString(),
                    version: original.version
                })
            });

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('CONFLICT');
                }
                throw new Error(`Failed to reschedule: ${response.status}`);
            }

            const result = await response.json();

            // Update with backend response
            updated[targetIndex] = this.mapToViewModel(result);
            this.reservations$.next(updated);
        } catch (error) {
            console.error('Reschedule failed:', error);

            // Rollback
            this.reservations$.next(current);

            throw error;
        }
    }

    async checkIn(id: string): Promise<void> {
        const current = this.reservations$.value;
        const targetIndex = current.findIndex(a => a.id === id);

        if (targetIndex === -1) return;

        // Optimistic update
        const updated = [...current];
        updated[targetIndex] = { ...updated[targetIndex], status: 'CHECKED_IN' };
        this.reservations$.next(updated);

        try {
            const response = await fetch(`${this.apiBaseUrl}/reservations/${id}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`Check-in failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Check-in failed:', error);
            this.reservations$.next(current);
            throw error;
        }
    }

    private mapToViewModel(res: any): ReservationViewModel {
        return {
            id: res.id,
            user_id: res.user_id,
            event_id: res.event_id,
            start_time: res.start_time,
            end_time: res.end_time,
            status: res.status,
            confirmationState: res.created_at ? 'CONFIRMED' : 'PENDING',
            confirmedAt: res.created_at ? new Date(res.created_at) : undefined,
            confirmationRef: res.id ? `R-${res.id.substring(0, 4).toUpperCase()}` : undefined,
            hasConflict: res.has_conflict || false,
            conflictingIds: res.conflicting_ids || [],
            version: res.version,
            created_at: res.created_at,
            updated_at: res.updated_at
        };
    }

    private checkOnlineStatus(): void {
        if (!navigator.onLine) {
            this.syncState$.next('OFFLINE');
        }
    }

    private handleOnline(): void {
        console.log('Network reconnected, flushing pending actions...');
        this.syncState$.next('SYNCING');
        this.flushPendingActions();
    }

    private handleOffline(): void {
        console.log('Network offline');
        this.syncState$.next('OFFLINE');
    }

    private queueAction(action: PendingAction): void {
        this.pendingActions.push(action);
        // TODO: Persist to IndexedDB for true offline support
    }

    private async flushPendingActions(): Promise<void> {
        const actions = [...this.pendingActions];
        this.pendingActions = [];

        for (const action of actions) {
            try {
                switch (action.type) {
                    case 'CANCEL':
                        await this.cancelReservation(action.reservationId);
                        break;
                    case 'RESCHEDULE':
                        await this.rescheduleReservation(
                            action.reservationId,
                            new Date(action.data.start_time),
                            new Date(action.data.end_time)
                        );
                        break;
                    case 'CHECKIN':
                        await this.checkIn(action.reservationId);
                        break;
                }
            } catch (error) {
                console.error('Failed to flush action:', action, error);
                this.pendingActions.push(action); // Re-queue on failure
            }
        }

        if (this.pendingActions.length === 0) {
            this.syncState$.next('SYNCED');
        }
    }
}
