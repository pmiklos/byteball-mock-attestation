# Mock real name attestion bot for Obyte

## Installation

```
npm install
npm dedupe # optional, if npm complains about duplicate ocore package
```

## Running the bot

```
node attest.js
```

On startup, the bot prints the pairing code and the real name attestor addres eg:

```
====== my pairing code: AujeQiLvKOy9ogaflO9loFrkIZD0oQm6OS1aCMxQLEmA@obyte.org/bb-test#0000
...
== real name attestation address: NIN3JPV2BE32KIOENWOTTYTPGZUEDFPT
```

You will have to transfer some test bytes to the attestor address so it can post attestation units to the dag.
Next, you have to pair your GUI testnet wallet with the mock attestor bot using he pairing code.
Then simply go to the chat screen and insert your wallet address in the chat, the mock attestor will immediately create a new profile for you.

By default the attestor creates private profiles. If you want it to post public profiles change the last flag in this line to `true`:

```javascript
[attestation, src_profile] = getAttestationPayloadAndSrcProfile(user_address.trim(), mockRealName, false);
```

There is a couple hard-coded mock profiles, you can use a different one by changing this line:

```javascript
const mockRealName = mockJumioResponse(documents['iggy']);
```
to let's say:
```javascript
const mockRealName = mockJumioResponse(documents['jimi']);
```

