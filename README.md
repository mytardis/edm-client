# edm-client

[![Build Status](https://semaphoreci.com/api/v1/mytardis/edm-client/branches/master/badge.svg)](https://semaphoreci.com/mytardis/edm-client)
[![Build status](https://ci.appveyor.com/api/projects/status/ex84g0e8gyi61p6u/branch/master?svg=true)](https://ci.appveyor.com/project/grischa/edm-client/branch/master)

## Building

```
npm install
npm build
npm test
```

## Running
```
# npm start run
cd build
node app run -c ../edm-settings.json
```

## Packaging standalone executable
```
npm run-script pkg
```

## Auth setup

Run edm-mock-auth server:
```
npm install
npm start
```

Go to http://127.0.0.1:4000/auth - create an account.
You can now stop the edm-mock-auth server.

Grab the token for your client from the `edm_backend_dev` (or equivalent) database
->`guardian_tokens` table, `jwt` field.

Edit your edm-client config (eg `edm-settings.json`) and add the token to:
 `{ "serverSettings": { "token": "blabla" }}`


## TODO

A list of small things to work on:

* TODO: proxy settings parsing in edmKit/networking.ts, integrate with connection.ts
* TODO: Prompt for token if none given, with web address where to get one
* TODO: Command to write default config file template
* TODO: Package app as "edm" instead of "node app", possible pack it into one file if possible
