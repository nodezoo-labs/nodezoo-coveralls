![logo-nodezoo][Logo]

# nodezoo-coveralls
- __Lead:__ [Richard Rodger][Lead]
- __Sponsor:__ [nearForm][]

A microservice that provides Coveralls data for [NodeZoo org][]. This microservice depends
on [Coveralls][] and the NPM registry but also caches retrieved data to reduce load on both
public registries.
Please see the [main repo][] for more details.

If you're using this microservice, and need help, you can:

- Post a [github issue][],
- Tweet to [@nodezoo][],
- Ask on the [Gitter][gitter-url].

## Install
- clone this repo into a root _/nodezoo_ folder
- run `npm install`

## Running

This micro-service can be ran as part of a complete system or as a single isolated
unit.

### As a complete system
A special system repository is available that runs the complete system using Docker
and Fuge.

- [Nodezoo: The complete system][System]

### Isolated mode
To make testing easier this micro-service can be ran in 'isolated' mode. This mode
allows testing over http using a well defined port. Please note isolated mode means
patterns are not exposed via mesh.

To run in isolated mode:

 - Clone this repository locally,
 - Run `npm install`,
 - Run `npm start isolated`.

A simple http service is supported and can be called using Curl or other Rest clients.
The default port is `8054`. It can be changed using the `COVERALLS_PORT` environment
variable.

## Using with Curl

Any of the messages above can be run using curl in the following format in the command line
```
curl -d '{"role":"coveralls","cmd":"get","name":"YOUR_TEXT_HERE"}' http://localhost:52472/act
```
## Configuration

### Environment Variables
Various settings can be changed using environment variables, see the list below for
all available variable names.

#### COVERALLS_HOST
  - The host to listen on in isolated mode.
  - Defaults to `localhost`.

#### COVERALLS_PORT
  - The port to listen on in isolated mode.
  - Defaults to `8054`.

#### COVERALLS_REDIS_HOST
  - The host redis listens on.
  - Defaults to `localhost`.

#### COVERALLS_REDIS_PORT
  - The port redis listens on.
  - Defaults to `6379`.

#### COVERALLS_ISOLATED
  - Starts isolated mode.
  - Defaults to `false`.

#### COVERALLS_REGISTRY
  - Changes the Coveralls URL used to retrieve the module info.
  - Defaults to `https://coveralls.io/`.

#### NPM_REGISTRY
  - Changes the npm registry used to retrieve the module info.
  - Defaults to `http://registry.npmjs.org/`.

## Messages Handled

### `role:coveralls,cmd:get`
Returns Coveralls specific data for the module name provided.

```js
seneca.act(`role:coveralls,cmd:get`, {name:'seneca'}, (err, data) => {})
```

### `role:info,req:part`
An alias for `role:coveralls,cmd:get`, allows integration into the wider nodezoo-system.

```js
seneca.act(`role:info,req:part`, {name:'seneca'}, (err, reply) => {})
```

## Messages Emitted

### `role:info,res:part,part:coveralls`

Called in response to a call to `role:info,req:part`.

```js
seneca.add(`role:info,res:part`, (msg, done) => {})
```

## Data Emitted
- name: Name of the module,
- coverageChange: coverage changed,
- coveragePercent: overall coverage percent,
- badgeUrl: Url of the Coveralls badge,
- cached: - The time the data was last cached at.

## Contributing
The [NodeZoo org][] encourages __open__ and __safe__ participation.

- [Code of Conduct][CoC]

If you feel you can help in any way, be it with documentation, examples, extra testing, or new
features please get in touch.

## License
Copyright (c) 2016, Matthew O'Connor and other contributors.
Licensed under [MIT][].

[main repo]: https://github.com/nodezoo/nodezoo-org
[MIT]: ./LICENSE
[CoC]: https://github.com/nodezoo/nodezoo-org/blob/master/CoC.md
[nearForm]: http://www.nearform.com/
[Lead]: https://github.com/rjrodger
[NodeZoo org]: https://github.com/nodezoo
[Logo]: https://github.com/nodezoo/nodezoo-org/blob/master/assets/logo-nodezoo.png
[github issue]: https://github.com/nodezoo/nodezoo-coveralls/issues
[@nodezoo]: http://twitter.com/nodezoo
[gitter-url]: https://gitter.im/nodezoo/nodezoo-org
[Coveralls]: https://coveralls.io
[System]: https://github.com/nodezoo/nodezoo-system
