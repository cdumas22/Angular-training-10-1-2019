# RXjs Railways

Reactive programming is a way of looking at that as streams. With this any updates or changes to the data should be a change to the stream. 

Subscribers will get all changes as a flow of data from the stream. This makes it easy to propegate changes out to others.

To get started `npm install && ng serve`

## Goals of training
1. GET items
    - share the items for perfomance and speed
2. POST (add) and item and merge it into the full list of items
    - discuss design patters for REST
3. PUT (update) and item and merge it into the full list of items
4. Merge a user into an items that has a userId
5. Use an interval to periodically check for changes.
    - discuss alternatives to using interval