import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './models/user';
import { shareReplay, tap, switchMap, startWith } from 'rxjs/operators';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  /**
   * Users update automatically on an interval
   */
  public users = interval(12000).pipe(
    startWith(0),
    switchMap(() => this.http.get<User[]>(`/api/users`).pipe(
      tap(() => console.log('get users')),
    )),
    shareReplay(1)
  )

  constructor(private http: HttpClient) { }
}
