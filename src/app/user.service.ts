import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from './models/user';
import { shareReplay, tap, switchMap, startWith } from 'rxjs/operators';
import { interval } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://fake-base-url/api'

  public users = this.http.get<User[]>(`${this.baseUrl}/users`)

  constructor(private http: HttpClient) { }
}
