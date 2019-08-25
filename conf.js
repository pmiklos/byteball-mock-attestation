/*jslint node: true */
"use strict";
exports.port = null;
exports.bServeAsHub = false;
exports.bLight = true;
exports.bFaster=true;
exports.storage = 'sqlite';

exports.WS_PROTOCOL = 'wss://',
exports.hub = 'obyte.org/bb-test',
exports.deviceName = 'Mock attestation bot';
exports.permanent_pairing_secret = '0000';
exports.control_addresses = [''];
exports.payout_address = 'WHERE THE MONEY CAN BE SENT TO';

exports.bIgnoreUnpairRequests = true;
exports.bSingleAddress = false;
exports.bStaticChangeAddress = true;
exports.KEYS_FILENAME = 'keys.json';

//email
exports.useSmtp = false;
exports.admin_email = '';
exports.from_email = '';


exports.priceInUSD = 0.0005;
exports.rewardInUSD = 2;
exports.referralRewardInUSD = 2;

// set this in conf.json
exports.salt = "salt";

exports.webPort = 8080;
