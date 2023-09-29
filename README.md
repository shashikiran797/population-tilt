# Readme


## Node version

v16.13.2


### Starting in local

```bash
yarn start
```

### Starting in local with auto reload

```bash
yarn dev-start
```


### Enhancements

- If the system is read heavy, we could compute the result of /states/:id/people before hand and store it in postgres. This way, we would not have to compute it every time a request is made. The downside is that it would take more space in the database and we would have to update it every time a person is added or removed from a state or state geographical area is changed.